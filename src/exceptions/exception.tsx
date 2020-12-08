import { BaseException } from './BaseException';
import { Request, Response } from 'express';
import { h } from '../jsx';

export const productionExceptionView = (reqId: string) => {
  return (
    <html>
      <head>
        <title>Error!</title>
        <style></style>
      </head>
      <body style="background-color: #f7fafc;">
        <div style="margin: 4em auto; max-width: 50vw; min-width: 300px; padding: 2em; background-color: #fff; box-shadow: 5px 5px 15px #eee; text-align: center">
          <h1>Whoops! You encountered an error.</h1>
          <div>Request ID: {reqId}</div>
        </div>
      </body>
    </html>
  );
};

export const devExceptionView = (
  exception: BaseException,
  req: Request,
  res: Response,
) => {
  return (
    <html>
      <head>
        <title>Exception: {exception.message}</title>
      </head>
      <body style="background-color: #f7fafc; padding: 2em;">
        <div style="margin: 0 auto; width: 90vw; padding: 2em; background-color: #fff; box-shadow: 5px 5px 15px #eee">
          <h1>Message: {exception.message}</h1>
          {exception.getDescription() ? (
            <p>{exception.getDescription()}</p>
          ) : null}
          <div>
            <b>Status:</b> {res.statusCode}
          </div>
          <div>
            <b>Req Id:</b> {req.id}
          </div>
          <div>
            <b>Stack:</b>
            <ul>
              {exception.stack.split('\n').map((line) => (
                <li style="display: block;">{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </body>
    </html>
  );
};
