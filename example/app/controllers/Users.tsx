import { h } from '../../../src';
import { User } from '../models/User';

export function UsersList(users: User[]) {
  return (
    <div>
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
        <button type="submit">Submit</button>
      </form>
      <ul>
        {users.map((user) => {
          return (
            <li>
              {user.email}
              <a href={`/users/${user.id}`}>link</a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ShowUser(user: User) {
  return (
    <div>
      <a href="/users">List Users</a>
      <h1>{user.email}</h1>
    </div>
  );
}
