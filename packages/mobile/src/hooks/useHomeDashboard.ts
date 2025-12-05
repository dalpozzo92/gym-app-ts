import { useEffect, useState } from 'react';
import { getHomeDashboard } from '@/api/workout';

type State<T> = { data?: T; loading: boolean; error?: string };

/**
 * Hook per recuperare le statistiche della dashboard homepage
 * @returns {State} { data, loading, error }
 */
export const useHomeDashboard = () => {
  const [state, setState] = useState<State<Awaited<ReturnType<typeof getHomeDashboard>>>>({ loading: true });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setState({ loading: true });
        const data = await getHomeDashboard();
        if (!cancelled) {
          setState({ loading: false, data });
        }
      } catch (err: any) {
        if (!cancelled) {
          setState({ loading: false, error: err.message });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
