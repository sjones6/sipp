import 'dotenv';
import initModuleAlias from 'module-alias';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import csurf from 'csurf';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTES_METADATA,
  MIDDLEWARE_METADATA,
  CONTROLLER_MIDDLEWARE_METADATA,
  PATH_OPTION_METADATA,
} from './constants';
import { Controller } from './Controller';
import { Connection } from './db/Connection';
import {
  BaseException,
  ExceptionHandler,
  NotFoundException,
} from './exceptions';
import {
  reqInfoLoggingMiddleware,
  RequestContext,
  DownloadResponse,
  HTMLResponse,
  HTTPResponse,
  JSONResponse,
  NoContentResponse,
} from './http';
import { IAppConfig, IMiddlewareFunc, ISippNextFunc } from './interfaces';
import { RouteMapper } from './routing/RouteMapper';
import logger, { Logger } from './logger';
import { Download } from './http/response/download';

// initializes the module-alias processing with the root same as the process working directory
initModuleAlias(process.cwd());

const defaultConfig = {
  basePath: '',
  serviceName: 'app',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
};

const CTX_SYMBOL = Symbol('ctx');

export class App {
  private app: express.Application;
  private controllers: Controller[] = [];
  private globalMiddleware: IMiddlewareFunc[] = [];
  private middleware: IMiddlewareFunc[] = [];
  private exceptionHandler: ExceptionHandler;
  private routeMapper: RouteMapper;
  private connection: Connection;
  private config: IAppConfig;
  private logger: Logger;

  constructor(
    app: express.Application,
    config: IAppConfig,
    controllers?: Controller[],
  ) {
    this.app = app;
    this.controllers = controllers || [];
    this.logger = config.logger || logger;
    if (config.serviceName) {
      this.logger.setServiceLabel(config.serviceName);
    }
    this.config = Object.assign({}, defaultConfig, config);
    this.exceptionHandler = new ExceptionHandler(this.logger);
    this.routeMapper = new RouteMapper();
    this.connection = new Connection(this.config);
  }

  static bootstrap(config?: IAppConfig, controllers?: Controller[]): App {
    return new App(express(), config, controllers).init();
  }

  public init(): App {
    this.logger.debug('App:init');

    // wire default handling of payloads, req id, logging, method override
    this.withGlobalMiddleware(
      reqInfoLoggingMiddleware,
      express.json(),
      express.urlencoded({ extended: true }),
      methodOverride('_method'),
    );

    // wire static file serving
    if (this.config.static) {
      this.withGlobalMiddleware(express.static(this.config.static));
    }

    if (this.config.session !== false) {
      this.withGlobalMiddleware(session(this.config.session), flash());
    }

    if (this.config.csrf !== false) {
      if (this.config.csrf.cookie) {
        this.withGlobalMiddleware(cookieParser());
      }

      // todo: move csrf middleware
      this.withMiddleware(csurf(this.config.csrf), (req, res, next) => {
        if (req.body && req.body._csrf) {
          req.headers['csrf-token'] = req.body._csrf;
          delete req.body._csrf;
        }
        next();
      });
    }

    return this;
  }

  /**
   * Add a set of global middlewares
   */
  public withMiddleware(...middleware: Array<IMiddlewareFunc>): App {
    this.logger.debug('adding middleware');
    this.middleware.push(...middleware);
    return this;
  }

  /**
   * Add a set of global middlewares
   *
   * Global middleware do not report errors to controller
   * exception handlers
   */
  public withGlobalMiddleware(...middleware: Array<IMiddlewareFunc>): App {
    this.logger.debug('adding global middleware');
    this.globalMiddleware.push(...middleware);
    return this;
  }

  /**
   * Add a set of controllers
   */
  public withControllers(...controllers: Controller[]): App {
    this.logger.debug('adding controllers');
    this.controllers.push(...controllers);
    return this;
  }

  /**
   * Override the default exception handler with one of your own
   */
  public withExceptionHandler(handler: ExceptionHandler): App {
    this.logger.debug(`adding exception handler ${handler.constructor.name}`);
    this.exceptionHandler = handler;
    return this;
  }

  /**
   * Turn the lights on
   */
  public listen() {
    // db
    this.connection.connect();

    // global middlewares
    this.app.use(
      this.wrapMiddlewareAndHandleErr(undefined, ...this.globalMiddleware),
    );

    // controllers
    this.registerControllers();

    // 400 handler after all of the controllers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new NotFoundException(`${req.method}: ${req.path} not found`));
    });

    // error handler
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.onException(err, this.createRequestContext(req, res), next);
      },
    );

    // attach the HTTP server to the specified port
    return this.app.listen(this.config.port, () => {
      this.logger.debug(
        `${this.config.serviceName} listening on ${this.config.port}`,
      );
    });
  }

  /**
   * Iterate through each of the registered controllers and register
   * the methods that the controllers expose with the express server
   */
  private registerControllers(): void {
    this.controllers.forEach((controller) => {
      const routes = Reflect.getMetadata(ROUTES_METADATA, controller);
      for (let method in routes) {
        const pathMetadata = Reflect.getMetadata(
          PATH_METADATA,
          controller,
          method,
        );
        const pathOptionMetadata = Reflect.getMetadata(
          PATH_OPTION_METADATA,
          controller,
          method,
        );
        const methodMetadata = Reflect.getMetadata(
          METHOD_METADATA,
          controller,
          method,
        );
        if (methodMetadata && pathMetadata) {
          const fullPath = this.constructPath(
            pathMetadata,
            controller.getBasePath(),
          );

          // register the route with the mapper
          if (pathOptionMetadata && pathOptionMetadata.name) {
            this.routeMapper.register(pathOptionMetadata.name, fullPath);
          }

          // gather up the middleware to apply in order
          const controllerMiddleware = Reflect.getMetadata(
            CONTROLLER_MIDDLEWARE_METADATA,
            controller.constructor,
          );
          const methodMiddleware = Reflect.getMetadata(
            MIDDLEWARE_METADATA,
            controller,
            method,
          );

          // apply the method to the express application
          this.app[methodMetadata].apply(this.app, [
            fullPath,
            this.wrapMiddlewareAndHandleErr(
              controller,
              ...(this.middleware || []),
              ...(controllerMiddleware || []), // controller middleware
              ...(methodMiddleware || []), // method handler middleware
              async (req: Request, res: Response) => {
                const ctx = this.createRequestContext(req, res);
                const controllerReponse = await controller[method](ctx);
                if (!res.headersSent) {
                  this.handleControllerResponse(controllerReponse, ctx);
                }
              },
            ),
          ]);
        }
      }
    });
  }

  /**
   * Constructs a full path to a specific route based on
   * global prefix, controller prefix and route path
   */
  private constructPath(path: string, controllerBase: string): string {
    const replaceSlashes = (str: string): string =>
      str.replace(/^\/?/, '').replace(/\/?$/, '');
    return (
      '/' +
      [
        replaceSlashes(this.config.basePath),
        replaceSlashes(controllerBase),
        replaceSlashes(path),
      ]
        .filter(Boolean)
        .join('/')
    );
  }

  /**
   * Create a full-request context for a state-less request
   */
  private createRequestContext(req: Request, res: Response): RequestContext {
    if (!req[CTX_SYMBOL]) {
      req[CTX_SYMBOL] = new RequestContext(req, res, this.routeMapper);
    }
    return req[CTX_SYMBOL];
  }

  /**
   * Handle exceptions thrown throughout the lifecycle of the application,
   * including 404s, errors thrown in controllers, etc.
   */
  private onException(
    err: Error | BaseException,
    ctx: RequestContext,
    next: NextFunction,
    controller?: Controller,
  ) {
    const exception = BaseException.toException(err);

    let handled = false;
    if (controller) {
      try {
        const controllerReponse =
          controller && controller.onException(exception, ctx);
        if (controllerReponse !== false) {
          this.handleControllerResponse(controllerReponse, ctx);
          handled = true;
        }
      } catch (err) {
        ctx.logger.error(
          `${controller.constructor.name} threw handling error, ${err.message}`,
        );
      }
    }

    if (handled) {
      // the controller exception handling handled it
      try {
        this.exceptionHandler.reportHandledException(exception);
      } catch (err) {
        const logger = ctx.logger || this.logger;
        logger.error(
          `exception handler threw reporting handled exception, ${err.message}`,
        );
      }
    } else {
      // the application level exception handler should do it
      if (
        !this.exceptionHandler.handle(exception, ctx) ||
        !ctx.res.headersSent
      ) {
        try {
          this.exceptionHandler.reportUnhandledException(exception);
        } catch (err) {
          const logger = ctx.logger || this.logger;
          logger.error(
            `exception handler threw reporting unhandled exception, ${err.message}`,
          );
        }
        next(exception);
      }
    }
  }

  private wrapMiddlewareAndHandleErr(
    controller: Controller | undefined,
    ...middleware: IMiddlewareFunc[]
  ): IMiddlewareFunc {
    return (req: Request, res: Response, next: NextFunction) => {
      const fn = middleware.reduceRight(
        (nextFn: ISippNextFunc, currentMiddlewareFn: IMiddlewareFunc) => {
          const expectsNext = currentMiddlewareFn.length === 3;

          // if the heads have already been sent- don't keep processing middleware
          if (res.headersSent) {
            nextFn();
          }

          // synchronous/promise-ified middleware
          if (!expectsNext) {
            return () => {
              return Promise.resolve(
                currentMiddlewareFn(req, res, nextFn),
              ).then(() => nextFn());
            };
          }

          // promise-ified express / callback styles middleware
          return () => {
            let isNextCalled = false;
            return new Promise((resolve, reject) => {
              Promise.resolve(
                currentMiddlewareFn(req, res, (err) => {
                  if (isNextCalled) {
                    return;
                  }
                  isNextCalled = true;
                  return err
                    ? reject(err)
                    : Promise.resolve(nextFn()).then(resolve);
                }),
              );
            }).then(() => {
              if (!isNextCalled) {
                return nextFn();
              }
            });
          };
        },
        async () => {
          if (!res.headersSent) {
            next(); // will pass on to error/404 handling if the controller stack didn't give a response.
          }
        },
      );

      Promise.resolve(fn()).catch((err) => {
        // do error handling
        this.onException(
          err,
          this.createRequestContext(req, res),
          next,
          controller,
        );
      });
    };
  }

  private handleControllerResponse(
    controllerReponse,
    ctx: RequestContext,
  ): void {
    const reply: HTTPResponse<any> = this.resolveControllerResponse(
      controllerReponse,
    );
    reply.handle(ctx);
  }

  private resolveControllerResponse(controllerReponse: any): HTTPResponse<any> {
    // theoretically possible to return a HTTPResponse object from the controller. No need to coerce
    if (controllerReponse instanceof HTTPResponse) {
      return controllerReponse;
    }

    switch (true) {
      case controllerReponse == null: // null or undefined
        return new NoContentResponse();
      case controllerReponse instanceof Download:
        return new DownloadResponse(controllerReponse);
      case typeof controllerReponse === 'string': // either html or plain text
      case controllerReponse instanceof String:
        return controllerReponse.startsWith('<') &&
          controllerReponse.endsWith('>')
          ? new HTMLResponse(controllerReponse)
          : new HTTPResponse(controllerReponse);
      case typeof controllerReponse == 'object': // json
      case Array.isArray(controllerReponse):
        return new JSONResponse(controllerReponse);
      default:
        return new HTTPResponse(controllerReponse);
    }
  }
}
