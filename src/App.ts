import { config as envConfig } from 'dotenv';
import { Server } from 'http';
import initModuleAlias from 'module-alias';
import express, { Request, Response, NextFunction, Application } from 'express';
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
import { Connection } from './db/Connection';
import {
  BaseException,
  ExceptionHandler,
  NotFoundException,
} from './exceptions';
import {
  reqInfoLoggingMiddleware,
  Middleware,
  toResponse,
  HTTPResponse,
  Controller,
} from './http';
import { Transaction } from 'objection';
import { IAppConfig, IMiddlewareFunc } from './interfaces';
import { RouteMapper } from './routing/RouteMapper';
import { Logger } from './logger';
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
import { isInstanceOf } from './utils';

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
  return Array.isArray(opt)
    ? [opt[0], opt[1]]
    : ['', opt == null ? {} : opt || false];
};

export class App {
  private app: Application;
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
    app: Application,
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
      this.withMiddleware(test, csurf(csrfOpt), (req, _, next) => {
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
      (req: Request) => {
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

  public getLogger(): Logger {
    return this.logger;
  }

  public getExceptionHandler(): ExceptionHandler {
    return this.exceptionHandler;
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
    this.app.use((req: Request, _, next: NextFunction) => {
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
   * Get the express application instance that the Sipp application wraps.
   *
   * This is useful for some testing frameworks, or for dangerously
   * attaching your own middleware.
   */
  public express(): Application {
    return this.app;
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
            this.routeMapper.register(
              pathOptionMetadata.name,
              fullPath,
              methodMetadata,
            );
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
                  .then(toResponse)
                  .then(async (response: HTTPResponse<any>) => {
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
                  this.handleResponse(controllerReponse, req, res);
                }
              },
            ),

            // append one middleware fn to handler errors after controller pipeline
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
                await this.onException(err, req, res, next, controller);
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
  private async onException(
    err: Error | BaseException,
    req: Request,
    res: Response,
    next: NextFunction,
    controller?: Controller,
  ): Promise<void> {
    const exception = BaseException.toException(err);
    const logger = req.logger || this.logger;
    let handled = false;
    if (controller) {
      try {
        const controllerReponse =
          controller && (await controller.onException(exception, req, res));
        if (controllerReponse !== false) {
          this.handleResponse(await toResponse(controllerReponse), req, res);
          handled = true;
        }
      } catch (err) {
        logger.error(
          `${controller.constructor.name} threw handling error, ${err.message}`,
        );
      }
    }

    if (handled) {
      // the controller exception handling handled it
      try {
        this.exceptionHandler.reportHandledException(exception);
      } catch (err) {
        logger.error(
          `exception handler threw reporting handled exception, ${err.message}`,
        );
      }
    } else {
      // the application level exception handler should do it
      handled = await Promise.resolve(
        this.exceptionHandler.handle(exception, req, res),
      ).then((rawResponse) => {
        if (rawResponse !== false) {
          return toResponse(rawResponse).then((exceptionHandlerResponse) => {
            this.handleResponse(exceptionHandlerResponse, req, res);
            return true;
          });
        }
      });
      if (!handled) {
        Promise.resolve(
          this.exceptionHandler.reportUnhandledException(exception),
        ).catch((reportError) => {
          logger.error(
            `exception handler threw reporting unhandled exception, ${reportError.message}`,
          );
        });
      } else {
        Promise.resolve(
          this.exceptionHandler.reportHandledException(exception),
        ).catch((reportError) => {
          logger.error(
            `exception handler threw reporting handled exception, ${reportError.message}`,
          );
        });
      }
      if (!res.headersSent) {
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
            const maybePromise = fn(req, res, (err, response) => {
              isResolved = true;
              return err ? reject(err) : resolve(response);
            });
            if (maybePromise && maybePromise instanceof Promise) {
              maybePromise
                .then((resolvedValue) => {
                  if (!isResolved) {
                    resolve(resolvedValue);
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
            .then((resolvedValue) => {
              if (isInstanceOf(HTTPResponse, resolvedValue)) {
                this.handleResponse(
                  resolvedValue as HTTPResponse<any>,
                  req,
                  res,
                );
              }
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

  private handleResponse(
    response: HTTPResponse<any>,
    req: Request,
    res: Response,
  ): void {
    response.handle(req, res);
    req.logger.debug('response sent');
    this.afterResponse(req, res);
  }

  private afterResponse(req: Request, res: Response) {
    req.logger.addScope({
      status: res.statusCode,
    });
    req.logger.info(`duration ${Date.now() - req.received.getTime()}ms`);
  }
}
