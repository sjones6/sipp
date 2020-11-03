import "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { METHOD_METADATA, PATH_METADATA, ROUTES_METADATA, MIDDLEWARE_METADATA, CONTROLLER_MIDDLEWARE_METADATA } from "./constants";
import { Controller } from "./Controller";
import { Connection } from "./db/Connection";
import { BaseException, ExceptionHandler, NotFoundException } from "./exceptions";
import { NoResponseException } from "./exceptions";
import { IAppConfig, IMiddlewareFunc, IRequestContext } from './interfaces';

const defaultConfig = {
  basePath: '',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
}

export class App {
  private app: express.Application
  private controllers: Controller[] = []
  private middleware: IMiddlewareFunc[] = []
  private exceptionHandler: ExceptionHandler
  private connection: Connection
  private config: IAppConfig

  constructor(app: express.Application, config: IAppConfig, controllers?: Controller[]) {
    this.app = app;
    this.controllers = controllers || [];
    this.config = Object.assign({}, defaultConfig, config);
    this.exceptionHandler = new ExceptionHandler();
    this.connection = new Connection(this.config);
  }

  static bootstrap(config?: IAppConfig, controllers?: Controller[]) {
    return new App(
      express(),
      config,
      controllers
    );
  }

  /**
   * Add a set of global middlewares
   */
  public withMiddleware(middleware: IMiddlewareFunc[]) {
    this.middleware.push(...middleware);
    return this;
  }

  /**
   * Add a set of controllers
   */
  public withControllers(controllers: Controller[]) {
    this.controllers.push(...controllers);
    return this;
  }

  /**
   * Override the default exception handler with one of your own
   */
  public withExceptionHandler(handler: ExceptionHandler) {
    this.exceptionHandler = handler;
  }

  /**
   * Turn the lights on
   */
  public listen() {

    // db
    this.connection.connect();

    // global middlewares
    this.middleware.forEach((middleware) => {
      this.app.use(middleware);
    });

    // controllers
    this.registerControllers();

    // 400 handler after all of the controllers
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      next(new NotFoundException(`${req.method}: ${req.path} not found`));
    });

    // error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      this.onException(err, req, res, next);
    });

    // attach the HTTP server to the specified port
    return this.app.listen(this.config.port, () => {
      console.log(`app listening on ${this.config.port}`);
    });
  }

  /**
   * Iterate through each of the registered controllers and register
   * the methods that the controllers expose with the express server
   */
  private registerControllers() {
    this.controllers.forEach((controller) => {
      const routes = Reflect.getMetadata(ROUTES_METADATA, controller);
      for (let method in routes) {
        const pathMetadata = Reflect.getMetadata(PATH_METADATA, controller[method]);
        const methodMetadata = Reflect.getMetadata(METHOD_METADATA, controller[method]);
        if (methodMetadata && pathMetadata) {

          // gather up the middleware to apply in order
          const controllerMiddleware = Reflect.getMetadata(CONTROLLER_MIDDLEWARE_METADATA, controller.constructor);
          const methodMiddleware = Reflect.getMetadata(MIDDLEWARE_METADATA, controller[method]);

          // apply the method to the express application
          this.app[methodMetadata].apply(
            this.app,
            [
              this.constructPath(pathMetadata, controller.getBasePath()),
              ...(controllerMiddleware || []), // controller middleware 
              ...(methodMiddleware || []), // method handler middleware
              async (req: Request, res: Response, next: NextFunction) => {
                try {
                  await controller[method](this.createRequestContext(req, res));
                  if (!res.headersSent) {
                    throw new NoResponseException('no content');
                  }
                } catch (err) {
                  const exception = BaseException.toException(err);
                  if (!controller.onException(exception, res) || !this.onException(exception, req, res, next)) {
                    next(err);
                  }
                }
              },
            ].filter(Boolean)
          );
        }
      }
    });
  }

  /**
   * Constructs a full path to a specific route based on 
   * global prefix, controller prefix and route path
   */
  private constructPath(path: string, controllerBase: string) {
    const replaceSlashes = (str: string): string => str.replace(/^\/?/, '').replace(/\/?$/, '');
    return '/' + [
      replaceSlashes(this.config.basePath),
      replaceSlashes(controllerBase),
      replaceSlashes(path)
    ]
      .filter(Boolean)
      .join('/');
  }

  /**
   * Create a full-request context for a state-less request
   */
  private createRequestContext(req: Request, res: Response): IRequestContext {
    return {
      path: req.path,
      method: req.method,
      req,
      res
    };
  }

  /**
   * Handle exceptions thrown throughout the lifecycle of the application,
   * including 404s, errors thrown in controllers, etc.
   */
  private onException(err: Error | BaseException, req: Request, res: Response, next: NextFunction): boolean {
    if (!this.exceptionHandler.handle(BaseException.toException(err), this.createRequestContext(req, res))) {
      next(err);
      return false
    }
    return true;
  }
}