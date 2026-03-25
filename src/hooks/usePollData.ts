import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Poll a data-fetching function at a regular interval.
 * Pauses when app is backgrounded. Resumes + immediate fetch on foreground.
 */
export function usePollData<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 30000,
  deps: any[] = [],
): { data: T | null; loading: boolean; error: string | null; refresh: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appState = useRef(AppState.currentState);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, deps);

  // Start/stop polling based on app state
  useEffect(() => {
    doFetch();

    const startPolling = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(doFetch, intervalMs);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startPolling();

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        doFetch();
        startPolling();
      } else if (nextState.match(/inactive|background/)) {
        stopPolling();
      }
      appState.current = nextState;
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [doFetch, intervalMs]);

  return { data, loading, error, refresh: doFetch };
}
