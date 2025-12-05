import { useEffect, useState } from 'react';
import { getProgramActive, getProgramWeeks, getProgramDays, type Program, type ProgramWeek, type ProgramDay } from '@/api/program';

type State<T> = { data?: T; loading: boolean; error?: string };

const useFetch = <T>(fn: () => Promise<T>, deps: any[]) => {
  const [state, setState] = useState<State<T>>({ loading: true });
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    fn()
      .then(data => !cancelled && setState({ loading: false, data }))
      .catch(err => !cancelled && setState({ loading: false, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, deps);
  return state;
};

export const useProgramActive = (id_user_details: number | null = null) =>
  useFetch<Program | null>(() => getProgramActive(id_user_details), [id_user_details]);

export const useProgramWeeks = (id_program: number | string | null): State<ProgramWeek[]> => {
  return useFetch<ProgramWeek[]>(
    () => (id_program ? getProgramWeeks(id_program as number) : Promise.resolve(undefined as any)),
    [id_program]
  );
};

export const useProgramDays = (id_program_week: number | string | null): State<ProgramDay[]> => {
  return useFetch<ProgramDay[]>(
    () => (id_program_week ? getProgramDays(id_program_week as number) : Promise.resolve(undefined as any)),
    [id_program_week]
  );
};
