import { Counter } from '../providers/ViewServiceProvider';
import { h, Provide, RequestContext, Session, Url, View } from '@src/index';
import { User } from '../models/User';

export function UsersList(users: User[], ctx: RequestContext) {
  return (
    <div>
      {ctx.url.scriptTag('app')}
      {ctx.url.styleTag('app')}
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
        {ctx.csrfField()}
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
                action={ctx.url.alias(
                  'delete-user',
                  { user: user.id },
                  undefined,
                  'delete',
                )}
              >
                {ctx.csrfField()}
                <button>delete</button>
              </form>
            </li>
          );
        })}
      </ul>
      <a href={ctx.url.alias('foo')}>Download Foo</a>
    </div>
  );
}

export class UserView extends View {

  @Provide()
  async render(h, c: Counter) {
    return (
      <div>
        <h1>{c.count}</h1>
        {await this.renderBody(h)}
      </div>
    );
  }

  renderBody(h, ...rest: any[]): string {
    return ''
  }
}

export class ShowUserView extends UserView {
  constructor(private readonly user: User) {
    super();
  }

  @Provide()
  renderBody(h, url: Url) {
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
