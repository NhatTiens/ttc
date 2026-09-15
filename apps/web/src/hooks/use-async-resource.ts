"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AsyncResource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

type AsyncState<T> = {
  data: T | null;
  error: string | null;
  settledKey: string | null;
};

export function useAsyncResource<T>(loader: () => Promise<T>, dependencyKey: string | number = ""): AsyncResource<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, settledKey: null });
  const [revision, setRevision] = useState(0);
  const loaderRef = useRef(loader);
  const requestKey = `${String(dependencyKey)}:${revision}`;

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const reload = useCallback(() => setRevision((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    loaderRef.current()
      .then((value) => {
        if (active) setState({ data: value, error: null, settledKey: requestKey });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setState((current) => ({
          data: current.data,
          error: reason instanceof Error ? reason.message : "Unable to load data.",
          settledKey: requestKey
        }));
      });
    return () => {
      active = false;
    };
  }, [requestKey]);

  const settled = state.settledKey === requestKey;
  return { data: state.data, loading: !settled, error: settled ? state.error : null, reload };
}
