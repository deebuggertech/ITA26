import { useCallback, useEffect, useRef, useState } from "react";

export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);

  const reload = useCallback(() => {
    // Ignore responses that arrive out of order.
    const id = ++latest.current;
    fetcher()
      .then((d) => { if (id === latest.current) { setData(d); setError(null); } })
      .catch((e: Error) => { if (id === latest.current) setError(e.message); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(reload, [reload]);
  return { data, error, reload };
}
