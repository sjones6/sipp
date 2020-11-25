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
import { InvalidControllerReponse } from './exceptions/RuntimeException';
import { HTTPResponse, JSONResponse } from './http';
import { RequestContext } from './RequestContext';
import { IAppConfig, IMiddlewareFunc } from './interfaces';
import { RouteMapper } from './routing/RouteMapper';
import {
  Middleware,
  ReqIdMiddleware,
  ReqInfoLoggingMiddleware,
  ReqLoggerMiddleware,
} from './middleware';
import logger, { Logger } from './logger';

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
  private middleware: Middleware[] = [];
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
    this.exceptionHandler = new ExceptionHandler();
    this.routeMapper = new RouteMapper();
    this.connection = new Connection(this.config);
  }

  static bootstrap(config?: IAppConfig, controllers?: Controller[]): App {
    return new App(express(), config, controllers).init();
  }

  public init(): App {
    this.logger.debug('App:init');

    // wire default handling of payloads, req id, logging, method override
    this.withMiddleware([
      new ReqIdMiddleware(),
      new ReqLoggerMiddleware(),
      new ReqInfoLoggingMiddleware(),
      (req, res, next) => {
        req.logger.info('msg');
        next();
      },
      express.json(),
      express.urlencoded({ extended: true }),
      methodOverride('_method'),
    ]);

    // wire static file serving
    if (this.config.static) {
      this.withMiddleware([express.static(this.config.static)]);
    }

    if (this.config.csrf !== false) {
      if (this.config.csrf.cookie) {
        this.withMiddleware([cookieParser()]);
      }
      this.withMiddleware([
        csurf(this.config.csrf),
        (req, res, next) => {
          if (req.body && req.body._csrf) {
            req.headers['csrf-token'] = req.body._csrf;
            delete req.body._csrf;
          }
          next();
        },
      ]);
    }

    if (this.config.session !== false) {
      this.withMiddleware([session(this.config.session), flash()]);
    }

    return this;
  }

  /**
   * Add a set of global middlewares
   */
  public withMiddleware(middleware: Array<IMiddlewareFunc | Middleware>): App {
    this.logger.debug('adding middleware');
    this.middleware.push(
      ...middleware.map((middleware) => {
        return middleware instanceof Middleware
          ? middleware
          : new Middleware(middleware);
      }),
    );
    return this;
  }

  /**
   * Add a set of controllers
   */
  public withControllers(controllers: Controller[]): App {
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
    this.middleware.forEach((middleware) => {
      this.app.use(middleware.bind());
    });

    // controllers
    this.registerControllers();

    // 400 handler after all of the controllers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new NotFoundException(`${req.method}: ${req.path} not found`));
    });

    // error handler
    this.app.use(
      (err: Error, req: Request, res: Response, next: NextFunction) => {
        this.onException(err, req, res, next);
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
            controller[method],
          );

          // apply the method to the express application
          this.app[methodMetadata].apply(
            this.app,
            [
              fullPath,
              ...[
                ...(controllerMiddleware || []), // controller middleware
                ...(methodMiddleware || []), // method handler middleware
                async (req: Request, res: Response) => {
                  const ctx = this.createRequestContext(req, res);
                  const controllerReponse = await controller[method](ctx);
                  this.handleControllerResponse(controllerReponse, ctx);
                },
              ]
                .filter(Boolean)
                .map((fn) => this.wrapMiddlewareAndHandleErr(fn, controller)),
            ].filter(Boolean),
          );
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
    req: Request,
    res: Response,
    next: NextFunction,
  ): boolean {
    if (
      !this.exceptionHandler.handle(
        BaseException.toException(err),
        this.createRequestContext(req, res),
      )
    ) {
      next(err);
      return false;
    }
    return true;
  }

  private wrapMiddlewareAndHandleErr(middleware, controller: Controller) {
    return (req, res, next) => {
      Promise.resolve(
        new Promise(async (resolve, reject) => {
          const middlewareRes = middleware(req, res, (err) => {
            err ? resolve() : reject(err);
          });
          if (middlewareRes instanceof Promise) {
            middlewareRes.then(resolve).catch(reject);
          }
        }),
      )
        .then(() => {
          if (!req.headersSent) {
            next();
          }
        })
        .catch((err) => {
          const controllerReponse = controller.onException(
            BaseException.toException(err),
            req[CTX_SYMBOL],
          );
          if (typeof controllerReponse === 'boolean' && !controllerReponse) {
            // the controller didn't handle the error so throw down the error chain
            next(err);
          } else {
            try {
              // controller returned a _non_ boolean response which is expected to be a HttpResponse factory
              this.handleControllerResponse(controllerReponse, req[CTX_SYMBOL]);
            } catch (err) {
              next(err);
            }
          }
        });
    };
  }

  private handleControllerResponse(
    controllerReponse,
    ctx: RequestContext,
  ): void {
    const reply: HTTPResponse = this.resolveControllerResponse(
      ctx,
      controllerReponse,
    );
    if (reply instanceof HTTPResponse) {
      reply.handle();
    } else {
      throw new InvalidControllerReponse(
        `controller reponse ${typeof reply} invalid`,
      );
    }
  }

  private resolveControllerResponse(
    ctx: RequestContext,
    controllerReponse: any,
  ): HTTPResponse {
    if (controllerReponse instanceof HTTPResponse) {
      return controllerReponse;
    }

    // usually a factory facade that returns a HTTPResponse
    if (typeof controllerReponse === 'function') {
      const reply = controllerReponse(ctx);
      if (!(reply instanceof HTTPResponse)) {
        throw new InvalidControllerReponse(
          `controller reponse ${typeof reply}, expected an instance of ${
            HTTPResponse.name
          }`,
        );
      }
      return reply;
    }

    switch (typeof controllerReponse) {
      case 'object':
        return new JSONResponse(ctx, controllerReponse);
      default:
        return new HTTPResponse(ctx, controllerReponse);
    }
  }
}
