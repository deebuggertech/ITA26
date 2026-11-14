import { useState, type FormEvent } from "react";
import type { DemoUser } from "../api/types";

interface Props {
  users: DemoUser[];
  onLogin: (username: string, password: string) => Promise<void>;
}

export function LoginForm({ users, onLogin }: Props) {
  const [username, setUsername] = useState(users[0]?.username ?? "");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  const submit = (user: string, pass: string) =>
    onLogin(user, pass).catch((e: Error) => setError(e.message));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(username, password);
  };

  return (
    <form className="card form" onSubmit={onSubmit}>
      <label>
        Benutzername
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Passwort
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary">Anmelden</button>
      <hr />
      <p className="muted">Demo-Zugänge (Passwort: demo)</p>
      {users.map((u) => (
        <button key={u.username} type="button" onClick={() => submit(u.username, "demo")}>
          Demo-Login: {u.display_name}
        </button>
      ))}
    </form>
  );
}
