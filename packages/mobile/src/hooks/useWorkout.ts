// Hook fetch senza React Query, offline semplice (solo fetch remoto)
import { useEffect, useState, useCallback } from 'react';
import {
  getWeekWorkoutExercises,
  getWorkoutDayExercises,
  getWorkoutDayExercise,
  getWorkoutDayExerciseProgress,
  getWorkoutExerciseSetHistory,
  getPreviousWorkoutExerciseSet,
  getWeekProgress
} from '@/api/workout';

type State<T> = { data?: T; loading: boolean; error?: string };

const useFetch = <T>(fn: () => Promise<T>, deps: any[]) => {
  const [state, setState] = useState<State<T>>({ loading: true });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState(prev => ({ ...prev, loading: true }));
    fn()
      .then(data => !cancelled && setState({ loading: false, data }))
      .catch(err => !cancelled && setState({ loading: false, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, [...deps, refreshKey]);

  return { ...state, refresh };
};

export const useWeekWorkoutExercises = (id_program_week: number | string | null) =>
  useFetch(
    () => (id_program_week ? getWeekWorkoutExercises(id_program_week as any) : Promise.resolve(undefined as any)),
    [id_program_week]
  );

export const useWorkoutDayExercises = (id_program_day: number | string | null) =>
  useFetch(
    () => (id_program_day ? getWorkoutDayExercises(id_program_day as any) : Promise.resolve(undefined as any)),
    [id_program_day]
  );

export const useWorkoutDayExercise = (id_workout_day_exercise: number | string | null) =>
  useFetch(
    () => (id_workout_day_exercise ? getWorkoutDayExercise(id_workout_day_exercise as any) : Promise.resolve(undefined as any)),
    [id_workout_day_exercise]
  );

export const useWorkoutDayExerciseProgress = (id_workout_day_exercise: number | string | null) =>
  useFetch(
    () => (id_workout_day_exercise ? getWorkoutDayExerciseProgress(id_workout_day_exercise as any) : Promise.resolve(undefined as any)),
    [id_workout_day_exercise]
  );

export const useWorkoutExerciseSetHistory = (id_workout_day_exercise: number | string | null) =>
  useFetch(
    () => (id_workout_day_exercise ? getWorkoutExerciseSetHistory(id_workout_day_exercise as any) : Promise.resolve(undefined as any)),
    [id_workout_day_exercise]
  );

export const usePreviousWorkoutExerciseSet = (
  id_workout_day_exercises: number | string | null,
  set_number: number,
  week_number: number
) =>
  useFetch(
    () => getPreviousWorkoutExerciseSet(id_workout_day_exercises as any, set_number, week_number),
    [id_workout_day_exercises, set_number, week_number]
  );

/**
 * ✅ NUOVO: Hook per refresh manuale dei progress di una settimana
 * Ritorna una funzione che può essere chiamata per aggiornare i progress
 */
export const useRefreshProgress = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProgress = useCallback(async (id_program_week: number | string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [useRefreshProgress] Refresh progress per settimana:', id_program_week);

      const progressData = await getWeekProgress(id_program_week);

      console.log('✅ [useRefreshProgress] Progress aggiornati:', progressData);

      // ✅ Emetti evento custom con i dati aggiornati
      window.dispatchEvent(new CustomEvent('week:progress:update', {
        detail: {
          id_program_week,
          ...progressData
        }
      }));

      setLoading(false);
      return progressData;
    } catch (err: any) {
      console.error('❌ [useRefreshProgress] Errore:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  return { refreshProgress, loading, error };
};
