import { h, RequestContext, Resolve, Session, Url, View } from '@src/index';
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

export class ShowUserView extends View {
  constructor(private readonly user: User) {
    super();
  }

  @Resolve()
  render(h, session: Session, url: Url) {
    const { user } = this;
    return (
      <div>
        {session.getFlash('success').map((msg) => (
          <h1>{msg}</h1>
        ))}
        <a href="/users">List Users</a>
        <h1>{user.email}</h1>
        <a href={url.alias('download-user', { user: user.id })}>Download</a>
      </div>
    );
  }
}
