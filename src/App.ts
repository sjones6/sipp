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
  CONTEXT_KEY,
  View,
} from './http';
import { Transaction } from 'objection';
import { IAppConfig, IMiddlewareFunc } from './interfaces';
import { RouteMapper } from './routing/RouteMapper';
import logger, { Logger } from './logger';
import { Download } from './http/response/download';
import { getStore } from './utils/async-store';
import { Model, TRANSACTION_KEY } from './db';
import { Resolver } from './framework/container/Resolver';
import {
  resolverFactory,
  RESOLVER_KEY,
} from './framework/container/resolver-factory';

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
  private readonly routeMapper: RouteMapper;
  private readonly connection: Connection;
  private readonly config: IAppConfig;
  private readonly logger: Logger;
  private readonly resolver: Resolver;

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
    this.resolver = resolverFactory();
  }

  static bootstrap<User extends Model>(
    config?: IAppConfig,
    controllers?: Controller[],
  ): App {
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

    this.withMiddleware(
      // expose 2 bits of context to the request store:
      // the resolver and the request context
      (req: Request, res: Response) => {
        const store = getStore();
        store.set(RESOLVER_KEY, this.resolver);
        store.set(CONTEXT_KEY, this.createRequestContext(req, res));
      },
    );

    return this;
  }

  public withResolver(cb: (resolver: Resolver) => void): App {
    cb(this.resolver);
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
    this.app.use(this.wrapMiddleware(...this.globalMiddleware));

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
            ...this.wrapMiddleware(
              ...(this.middleware || []),
              ...(controllerMiddleware || []), // controller middleware
              ...(methodMiddleware || []), // method handler middleware
              async (req: Request, res: Response) => {
                req.logger.debug('start controller handling');
                const ctx = this.createRequestContext(req, res);
                const controllerReponse = await Promise.resolve(
                  controller[method](ctx),
                )
                  .then(async (response) => {
                    if (
                      (response && response.prototype instanceof View) ||
                      response instanceof View
                    ) {
                      return (response as View).renderToHtml(ctx);
                    }
                    return response;
                  })
                  .then(async (response) => {
                    const store = getStore();
                    const trx = store.get(TRANSACTION_KEY) as Transaction;
                    if (trx && !trx.isCompleted()) {
                      req.logger.info('transaction commit');
                      await trx.commit();
                    }
                    return response;
                  })
                  .catch((err) => {
                    req.logger.debug(
                      `controller response threw an error, ${err.message}`,
                    );
                    throw err;
                  });
                req.logger.debug('end controller handling');
                if (!res.headersSent) {
                  this.handleControllerResponse(controllerReponse, ctx);
                }
                this.afterResponse(ctx);
              },
            ),
            async (err: Error, req: Request, res: Response, next) => {
              try {
                // handle transaction rollbash, if any
                const trx = getStore().get(TRANSACTION_KEY) as Transaction;
                if (trx && !trx.isCompleted()) {
                  req.logger.info('rolling back transaction');
                  await trx.rollback().catch((rollbackError) => {
                    req.logger.critical(
                      `failed to rollback transaction: ${rollbackError.message}`,
                    );
                  });
                }
                // do error handling
                const ctx = this.createRequestContext(req, res);
                this.onException(err, ctx, next, controller);
                this.afterResponse(ctx);
              } catch (err) {
                next(err);
              }
            },
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
      req[CTX_SYMBOL] = new RequestContext(
        req,
        res,
        this.routeMapper,
        this.config.static,
      );
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

  private wrapMiddleware(...middleware: IMiddlewareFunc[]): IMiddlewareFunc[] {
    return middleware
      .filter((fn) => fn)
      .map((fn) => {
        return (req: Request, res: Response, next: NextFunction) => {
          let isResolved = false;
          new Promise((resolve, reject) => {
            const expectsNext = fn.length === 3;
            const maybePromise = fn(req, res, (err) => {
              isResolved = true;
              return err ? reject(err) : resolve();
            });
            if (maybePromise && maybePromise instanceof Promise) {
              maybePromise
                .then(() => {
                  if (!isResolved) {
                    resolve();
                  }
                })
                .catch((err) => {
                  if (!isResolved) {
                    reject(err);
                  }
                });
            } else if (!expectsNext) {
              resolve();
            }
          })
            .then(() => {
              if (!res.headersSent) {
                next();
              }
            })
            .catch((err) => {
              if (!res.headersSent) {
                next(err);
              }
            });
        };
      });
  }

  private handleControllerResponse(
    controllerReponse,
    ctx: RequestContext,
  ): void {
    const reply: HTTPResponse<any> = this.resolveControllerResponse(
      controllerReponse,
    );
    reply.handle(ctx);
    ctx.req.logger.debug('response sent');
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

  private afterResponse(ctx: RequestContext) {
    const { req, res } = ctx;
    req.logger.addScope({
      status: res.statusCode,
    });
    req.logger.info(`duration ${Date.now() - req.received.getTime()}ms`);
  }
}
