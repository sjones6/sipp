import { BaseException } from './BaseException';
import { h } from '../jsx';

export const exceptionView = (exception: BaseException) => {
  return (
    <div>
      <h1>Whoops! You've encountered an error.</h1>
      <div>
        <b>Message</b>: {exception.message}
      </div>
      <div>
        <b>Stack:</b>
        <ul>
          {exception.stack.split('\n').map((line) => (
            <li>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
