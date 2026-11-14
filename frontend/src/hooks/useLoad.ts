import { useCallback, useEffect, useRef, useState } from "react";

/** Loads data on mount and whenever `deps` change; `reload` refetches on demand. */
export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const reload = useCallback(() => {
    // Responses can arrive out of order; only the newest request may update the state.
    const id = ++latest.current;
    fetcher()
      .then((d) => { if (id === latest.current) { setData(d); setError(null); } })
      .catch((e: Error) => { if (id === latest.current) setError(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(reload, [reload]);
  return { data, error, reload };
}
