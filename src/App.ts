import { config as envConfig } from 'dotenv';
import { Server } from 'http';
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
  STORAGE,
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
  DownloadResponse,
  HTMLResponse,
  HTTPResponse,
  JSONResponse,
  NoContentResponse,
  View,
  Middleware,
} from './http';
import { Transaction } from 'objection';
import { IAppConfig, IMiddlewareFunc } from './interfaces';
import { RouteMapper } from './routing/RouteMapper';
import { Logger } from './logger';
import { Download } from './http/response/download';
import { getStore } from './utils/async-store';
import { ServiceProvider } from './framework/services/ServiceProvider';
import {
  ParamResolutionProvider,
  ModelResolutionProvider,
  RouteMappingProvider,
  UrlProvider,
  LoggerProvider,
} from './services';
import { registry } from './framework/services/ServiceRegistry';

envConfig();

// initializes the module-alias processing with the root same as the process working directory
initModuleAlias(process.cwd());

const defaultConfig = {
  basePath: '',
  serviceName: 'app',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
};

const normalizeMiddlewareOptions = (
  opt: [string | RegExp, any] | false | object,
): [string | RegExp, any] => {
  return Array.isArray(opt) ? [opt[0], opt[1]] : ['', opt == null ? {} : opt || false];
};

export class App {
  private app: express.Application;
  private controllers: Controller[] = [];
  private providers: ServiceProvider[] = [];
  private globalMiddleware: Array<[string | RegExp, IMiddlewareFunc]> = [];
  private middleware: Array<[string | RegExp, IMiddlewareFunc]> = [];
  private exceptionHandler: ExceptionHandler;
  private readonly routeMapper: RouteMapper;
  private readonly connection: Connection;
  private readonly config: IAppConfig;
  private readonly logger: Logger;

  constructor(
    app: express.Application,
    config: IAppConfig,
    controllers?: Controller[],
  ) {
    this.app = app;
    this.controllers = controllers || [];
    this.logger = config.logger || Logger.new(config.mode || 'production');
    if (config.serviceName) {
      this.logger.setServiceLabel(config.serviceName);
    }
    this.config = Object.assign({}, defaultConfig, config);
    this.exceptionHandler = new ExceptionHandler(this.logger, config.mode);
    this.routeMapper = new RouteMapper();
    this.connection = new Connection(this.config.mode, this.config.knexPath);
  }

  static bootstrap(config?: IAppConfig, controllers?: Controller[]): App {
    return new App(express(), config, controllers).init();
  }

  public init(): App {
    this.logger.debug('App:init');

    // wire default handling of payloads, req id, logging, method override
    this.withGlobalMiddleware(reqInfoLoggingMiddleware(this.logger));

    const [jsonTest, jsonOpt] = normalizeMiddlewareOptions(
      this.config.middleware?.json,
    );
    if (jsonOpt) {
      this.withGlobalMiddleware(jsonTest, express.json(jsonOpt));
    }

    const [bodyTest, bodyOpt] = normalizeMiddlewareOptions(
      this.config.middleware?.body,
    );
    if (bodyOpt) {
      this.withGlobalMiddleware(
        bodyTest,
        express.urlencoded({
          extended: true,
          ...bodyOpt,
        }),
      );
    }

    this.withGlobalMiddleware(methodOverride('_method'));

    // wire static file serving
    const [staticTest, staticOpt] = normalizeMiddlewareOptions(
      this.config.middleware?.static,
    );
    if (staticOpt) {
      this.withGlobalMiddleware(staticTest, express.static(staticOpt.path));
    }

    // wire session
    const [sessionTest, sessionOpt] = normalizeMiddlewareOptions(
      this.config.middleware?.session,
    );
    if (sessionOpt !== false) {
      this.withGlobalMiddleware(sessionTest, session(sessionOpt), flash());
    }

    // wire csrf protection
    const [test, csrfOpt] = normalizeMiddlewareOptions(
      this.config.middleware?.csrf,
    );
    if (csrfOpt !== false) {
      if (csrfOpt.cookie) {
        const [secret, opt] = this.config.middleware?.cookieParser || [];
        this.withGlobalMiddleware(cookieParser(secret, opt));
      }

      // todo: move csrf middleware
      this.withMiddleware(test, csurf(csrfOpt), (req, res, next) => {
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
        store.set(STORAGE.REQ_KEY, req);
      },
    );

    this.withProviders(
      new ParamResolutionProvider(),
      new ModelResolutionProvider(),
      new RouteMappingProvider(this.routeMapper),
      new UrlProvider(staticOpt.path, this.routeMapper),
      new LoggerProvider(this.logger),
    );

    return this;
  }

  /**
   * Add a set of global middlewares
   *
   * If the first parameter is a string or RegExp, it is used to
   * limit/filter which routes receive that middleware.
   */
  public withMiddleware(
    route?: string | RegExp | IMiddlewareFunc | Middleware,
    ...middleware: Array<IMiddlewareFunc | Middleware>
  ): App {
    this.logger.debug('adding middleware');
    let realPath: string | RegExp = '';
    if (typeof route !== 'string' && !(route instanceof RegExp)) {
      this.middleware.push([
        '',
        route instanceof Middleware ? route.bind() : route,
      ]);
    } else {
      realPath = route;
    }
    const middlewareTuples = middleware.map((m): [
      string | RegExp,
      IMiddlewareFunc,
    ] => [realPath, m instanceof Middleware ? m.bind() : m]);
    this.middleware.push(...middlewareTuples);
    return this;
  }

  /**
   * Add a set of global middlewares
   *
   * Global middleware do not report errors to controller
   * exception handlers
   */
  public withGlobalMiddleware(
    route?: string | RegExp | IMiddlewareFunc | Middleware,
    ...middleware: Array<IMiddlewareFunc | Middleware>
  ): App {
    this.logger.debug('adding global middleware');
    let realPath: string | RegExp = '';
    if (typeof route !== 'string' && !(route instanceof RegExp)) {
      this.globalMiddleware.push([
        '',
        route instanceof Middleware ? route.bind() : route,
      ]);
    } else {
      realPath = route;
    }
    const middlewareTuples = middleware.map((m): [
      string | RegExp,
      IMiddlewareFunc,
    ] => [realPath, m instanceof Middleware ? m.bind() : m]);
    this.globalMiddleware.push(...middlewareTuples);
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
   * Add a set of providers
   */
  public withProviders(...providers: ServiceProvider[]): App {
    this.logger.debug('adding controllers');
    this.providers.push(...providers);
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

  public async wire(): Promise<App> {
    // init service providers
    await Promise.all(this.providers.map((provider) => provider.init()));

    // register providers
    registry.registerProviders(this.providers);

    // db
    this.connection.connect();

    // global middlewares
    this.globalMiddleware.forEach(([test, fn]): void => {
      if (!test) {
        this.app.use(...this.wrapMiddleware(fn));
      } else {
        this.app.use(test, ...this.wrapMiddleware(fn));
      }
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

    return this;
  }

  /**
   * Turn the lights on
   */
  public listen(): Server {
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

          // filter out middlewares
          const middlewaresToApply: IMiddlewareFunc[] = (this.middleware || [])
            .map(
              ([test, fn]): IMiddlewareFunc => {
                if (!test) {
                  return fn;
                }
                if (test instanceof RegExp) {
                  return test.test(fullPath) && fn;
                }
                return fullPath.startsWith(test) && fn;
              },
            )
            .filter((fn) => fn);

          // apply the method to the express application
          this.app[methodMetadata].apply(this.app, [
            fullPath,
            ...this.wrapMiddleware(
              ...middlewaresToApply,
              ...(controllerMiddleware || []), // controller middleware
              ...(methodMiddleware || []), // method handler middleware
              async (req: Request, res: Response) => {
                req.logger.debug('start controller handling');
                const controllerReponse = await Promise.resolve(
                  controller[method](req, res),
                )
                  .then(async (response) => {
                    if (
                      (response && response.prototype instanceof View) ||
                      response instanceof View
                    ) {
                      return (response as View).renderToHtml();
                    }
                    return response;
                  })
                  .then(async (response) => {
                    const store = getStore();
                    const trx = store.get(
                      STORAGE.TRANSACTION_KEY,
                    ) as Transaction;
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
                  this.handleControllerResponse(controllerReponse, req, res);
                }
                this.afterResponse(req, res);
              },
            ),
            async (err: Error, req: Request, res: Response, next) => {
              try {
                // handle transaction rollbash, if any
                const trx = getStore().get(
                  STORAGE.TRANSACTION_KEY,
                ) as Transaction;
                if (trx && !trx.isCompleted()) {
                  req.logger.info('rolling back transaction');
                  await trx.rollback().catch((rollbackError) => {
                    req.logger.critical(
                      `failed to rollback transaction: ${rollbackError.message}`,
                    );
                  });
                }
                // do error handling
                this.onException(err, req, res, next, controller);
                this.afterResponse(req, res);
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
   * Handle exceptions thrown throughout the lifecycle of the application,
   * including 404s, errors thrown in controllers, etc.
   */
  private onException(
    err: Error | BaseException,
    req: Request,
    res: Response,
    next: NextFunction,
    controller?: Controller,
  ) {
    const exception = BaseException.toException(err);

    let handled = false;
    if (controller) {
      try {
        const controllerReponse =
          controller && controller.onException(exception, req, res);
        if (controllerReponse !== false) {
          this.handleControllerResponse(controllerReponse, req, res);
          handled = true;
        }
      } catch (err) {
        req.logger.error(
          `${controller.constructor.name} threw handling error, ${err.message}`,
        );
      }
    }

    if (handled) {
      // the controller exception handling handled it
      try {
        this.exceptionHandler.reportHandledException(exception);
      } catch (err) {
        const logger = req.logger || this.logger;
        logger.error(
          `exception handler threw reporting handled exception, ${err.message}`,
        );
      }
    } else {
      // the application level exception handler should do it
      if (
        !this.exceptionHandler.handle(exception, req, res) ||
        !res.headersSent
      ) {
        try {
          this.exceptionHandler.reportUnhandledException(exception);
        } catch (err) {
          const logger = req.logger || this.logger;
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
              return err ? reject(err) : resolve(void 0);
            });
            if (maybePromise && maybePromise instanceof Promise) {
              maybePromise
                .then(() => {
                  if (!isResolved) {
                    resolve(void 0);
                  }
                })
                .catch((err) => {
                  if (!isResolved) {
                    reject(err);
                  }
                });
            } else if (!expectsNext) {
              resolve(void 0);
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
    req: Request,
    res: Response,
  ): void {
    const reply: HTTPResponse<any> = this.resolveControllerResponse(
      controllerReponse,
    );
    reply.handle(req, res);
    req.logger.debug('response sent');
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

  private afterResponse(req: Request, res: Response) {
    req.logger.addScope({
      status: res.statusCode,
    });
    req.logger.info(`duration ${Date.now() - req.received.getTime()}ms`);
  }
}
