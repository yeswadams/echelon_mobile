import { Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

interface UseFetchOptions<T, P extends Record<string, unknown>> {
  fn: (params: P) => Promise<T>;
  params?: P;
  skip?: boolean;
}

interface UseFetchReturn<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: (newParams: P) => Promise<void>;
}

export function useFetch<T, P extends Record<string, unknown>>({
  fn,
  params = {} as P,
  skip = false,
}: UseFetchOptions<T, P>): UseFetchReturn<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (fetchParams: P) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(fetchParams);
        setData(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(message);
        Alert.alert('Error', message);
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  useEffect(() => {
    if (!skip) {
      fetchData(params);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refetch = (newParams: P) => fetchData(newParams);

  return { data, loading, error, refetch };
}
