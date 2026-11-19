const SESSION_KEY = "session";

export function getStoredSession(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

export function storeSession(json: string | null) {
  if (json) sessionStorage.setItem(SESSION_KEY, json);
  else sessionStorage.removeItem(SESSION_KEY);
}

function token(): string {
  const raw = getStoredSession();
  return raw ? JSON.parse(raw).token : "";
}

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: init.method ?? (init.body ? "POST" : "GET"),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  // A 401 despite a stored session means the token is stale.
  if (res.status === 401 && getStoredSession()) {
    storeSession(null);
    window.location.assign("/");
  }
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail;
    throw new Error(typeof detail === "string" ? detail : "Eingabe ungültig oder Serverfehler");
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
