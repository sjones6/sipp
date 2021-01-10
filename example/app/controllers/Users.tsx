import { Counter } from '../providers/ViewServiceProvider';
import { Provide, Csrf, Url, View } from '@src/index';
import { User } from '../models/User';

export function Lost() {
  return <h1>Sorry buddy, you're lost!</h1>;
}

export class UserView extends View {
  @Provide()
  async render(c: Counter) {
    return (
      <div>
        <>
          <h1>one in frag</h1>
          <h1>two in frag</h1>
        </>
        <h1>{c.count}</h1>
        {await this.renderBody()}
      </div>
    );
  }

  async renderBody(...rest: any[]): Promise<string> {
    return '';
  }
}

export class UsersList extends UserView {
  constructor(private readonly users: User[]) {
    super();
  }

  @Provide()
  async renderBody(url: Url, csrf: Csrf): Promise<string> {
    const { users } = this;
    return (
      <div>
        {url.scriptTag('app')}
        {url.styleTag('app')}

        <form method="post" action="/users">
          <div>
            <label>
              Email
              <input type="text" name="email" />
            </label>
          </div>
          <div>
            <label>
              Password
              <input type="password" name="password" />
            </label>
          </div>
          {csrf.csrfField()}
          <button type="submit">Submit</button>
        </form>
        <ul>
          {users.map((user) => {
            return (
              <li>
                {user.email}
                <a href={`/users/${user.id}`}>link</a>
                <form
                  method="post"
                  action={url.alias(
                    'delete-user',
                    { user: user.id },
                    undefined,
                    'delete',
                  )}
                >
                  {csrf.csrfField()}
                  <button>delete</button>
                </form>
              </li>
            );
          })}
        </ul>
        <a href={url.alias('foo')}>Download Foo</a>
      </div>
    );
  }
}

export class ShowUserView extends UserView {
  constructor(private readonly user: User) {
    super();
  }

  @Provide()
  async renderBody(url: Url): Promise<string> {
    const { user } = this;
    return (
      <div>
        <a href="/users">List Users</a>
        <h1>{user.email}</h1>
        <a href={url.alias('download-user', { user: user.id })}>Download</a>
      </div>
    );
  }
}
