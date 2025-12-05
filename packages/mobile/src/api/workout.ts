// ============================================
// API WORKOUT - Esecuzione allenamenti
// ============================================
import { apiClient } from './config';

export type WorkoutExerciseSet = {
  id_workout_day_exercises?: number | string | null;
  set_number?: number;
  [key: string]: unknown;
};

/**
 * ✅ NUOVO: Precarica TUTTI gli esercizi di una settimana
 * @param {number} id_program_week
 * @returns {Promise<Object>} { week_exercises: { [id_program_day]: workout_day_exercises[] } }
 */
export const getWeekWorkoutExercises = async (id_program_week: number | string): Promise<unknown> => {
  try {
    console.log('🔍 [API] getWeekWorkoutExercises chiamata con:', id_program_week);
    
    const { data } = await apiClient.get(`/api/workouts/getWeekWorkoutExercises/${id_program_week}`);
    
    console.log('✅ [API] getWeekWorkoutExercises risposta:', data);
    
    return data;
  } catch (error: any) {
    console.error('❌ [API] getWeekWorkoutExercises error:', error);
    throw new Error('Impossibile caricare gli esercizi della settimana');
  }
};

/**
 * Ottiene gli esercizi di un giorno specifico (fallback se preload non disponibile)
 * @param {number} id_program_day
 * @returns {Promise<Object>} { workout_day_exercises: [] }
 */
export const getWorkoutDayExercises = async (id_program_day: number | string): Promise<unknown> => {
  try {
    console.log('🔍 [API] getWorkoutDayExercises chiamata con:', id_program_day);
    
    const { data } = await apiClient.get(`/api/workouts/getWorkoutDayExercises/${id_program_day}`);
    
    return data;
  } catch (error) {
    console.error('❌ [API] getWorkoutDayExercises error:', error);
    throw new Error('Impossibile caricare gli esercizi del giorno');
  }
};

/**
 * Ottiene UN SINGOLO workout_day_exercise con tutti i set
 * @param {number} id_workout_day_exercise
 * @returns {Promise<Object>} workout_day_exercise con workout_exercise_sets[]
 */
export const getWorkoutDayExercise = async (id_workout_day_exercise: number | string): Promise<unknown> => {
  try {
    const { data } = await apiClient.get(`/api/workouts/getWorkoutDayExercise/${id_workout_day_exercise}`);
    return data;
  } catch (error: any) {
    console.error('❌ [API] getWorkoutDayExercise error:', error);
    throw new Error('Impossibile caricare l\'esercizio');
  }
};

export const saveWorkoutExerciseSet = async (workout_exercise_set: WorkoutExerciseSet): Promise<unknown> => {
  try {
    console.log('📤 [API] saveWorkoutExerciseSet payload:', workout_exercise_set);
    
    // ✅ Validazione payload frontend
    if (!workout_exercise_set.id_workout_day_exercises) {
      throw new Error('id_workout_day_exercises mancante');
    }
    
    if (!workout_exercise_set.set_number) {
      throw new Error('set_number mancante');
    }

    const { data } = await apiClient.post('/api/workouts/saveWorkoutExerciseSet', workout_exercise_set);
    
    console.log('📥 [API] saveWorkoutExerciseSet response:', data);
    
    return data;
  } catch (error: any) {
    console.error('❌ [API] saveWorkoutExerciseSet error:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Impossibile salvare la serie');
  }
};

/**
 * Sincronizza BATCH di workout_exercise_set (offline mode)
 * @param {Array} workout_exercise_sets
 * @returns {Promise<Object>}
 */
export const syncWorkoutExerciseSets = async (workout_exercise_sets: WorkoutExerciseSet[]): Promise<unknown> => {
  try {
    const { data } = await apiClient.post('/api/workouts/syncWorkoutExerciseSets', { 
      workout_exercise_sets 
    });
    return data;
  } catch (error) {
    console.error('❌ [API] syncWorkoutExerciseSets error:', error);
    throw new Error('Impossibile sincronizzare le serie');
  }
};

/**
 * Calcola progresso di un workout_day_exercise
 * @param {number} id_workout_day_exercise
 * @returns {Promise<Object>} { progress, completed_sets, total_sets }
 */
export const getWorkoutDayExerciseProgress = async (id_workout_day_exercise: number | string): Promise<unknown> => {
  try {
    const { data } = await apiClient.get(`/api/workouts/getWorkoutDayExerciseProgress/${id_workout_day_exercise}`);
    return data;
  } catch (error) {
    console.error('❌ [API] getWorkoutDayExerciseProgress error:', error);
    throw new Error('Impossibile calcolare il progresso');
  }
};

/**
 * Ottiene storico completo di un workout_day_exercise
 * @param {number} id_workout_day_exercise
 * @returns {Promise<Array>} workout_exercise_sets[] con date
 */
export const getWorkoutExerciseSetHistory = async (id_workout_day_exercise: number | string): Promise<{ history: unknown[] }> => {
  try {
    const { data } = await apiClient.get(`/api/workouts/getWorkoutExerciseSetHistory/${id_workout_day_exercise}`);
    
    // ✅ FIX: Assicura sempre un oggetto con array
    return {
      history: data.history || []
    };
  } catch (error) {
    console.error('❌ [API] getWorkoutExerciseSetHistory error:', error);
    
    // ✅ FIX: Ritorna oggetto vuoto invece di throw
    return {
      history: []
    };
  }
};

/**
 * Ottiene prestazione precedente (settimana precedente, stessa serie)
 * @param {number} id_workout_day_exercises
 * @param {number} set_number
 * @param {number} week_number
 * @returns {Promise<Object|null>} workout_exercise_set precedente
 */
export const getPreviousWorkoutExerciseSet = async (
  id_workout_day_exercises: number | string,
  set_number: number,
  week_number: number
): Promise<{ previous_workout_exercise_set: unknown | null }> => {
  try {
    const { data } = await apiClient.get('/api/workouts/getPreviousWorkoutExerciseSet', {
      params: { id_workout_day_exercises, set_number, week_number }
    });
    
    // ✅ FIX: Assicura sempre un oggetto
    return {
      previous_workout_exercise_set: data.previous_workout_exercise_set || null
    };
  } catch (error) {
    console.error('❌ [API] getPreviousWorkoutExerciseSet error:', error);
    
    // ✅ FIX: Ritorna oggetto con null invece di throw
    return {
      previous_workout_exercise_set: null
    };
  }
};

/**
 * ✅ NUOVO: Ottiene tutti i progress di una settimana (esercizi, giorni, settimana)
 * @param {number} id_program_week
 * @returns {Promise<Object>} { week_progress: number, days: [{ id_program_day, progress, exercises }] }
 */
export const getWeekProgress = async (id_program_week: number | string): Promise<{
  week_progress: number;
  days: Array<{
    id_program_day: number;
    progress: number;
    exercises: Array<{
      id_workout_day_exercise: number;
      progress: number;
    }>;
  }>;
}> => {
  try {
    console.log('🔍 [API] getWeekProgress chiamata con:', id_program_week);

    const { data } = await apiClient.get(`/api/workouts/getWeekProgress/${id_program_week}`);

    console.log('✅ [API] getWeekProgress risposta:', data);

    return data;
  } catch (error: any) {
    console.error('❌ [API] getWeekProgress error:', error);
    throw new Error('Impossibile caricare i progress della settimana');
  }
};

/**
 * ✅ NUOVO: Completa una settimana creando una nuova settimana duplicata
 * @param {number} id_program_week
 * @returns {Promise<Object>} { message, new_week_id, new_week_number }
 */
export const completeWeek = async (id_program_week: number | string): Promise<{
  message: string;
  new_week_id: number;
  new_week_number: number;
}> => {
  try {
    console.log('🔍 [API] completeWeek chiamata con:', id_program_week);

    const { data } = await apiClient.post(`/api/workouts/complete-week/${id_program_week}`);

    console.log('✅ [API] completeWeek risposta:', data);

    return data;
  } catch (error: any) {
    console.error('❌ [API] completeWeek error:', error);
    throw new Error(error.response?.data?.message || 'Impossibile completare la settimana');
  }
};

/**
 * ✅ NUOVO: Ottiene statistiche dashboard homepage
 * @returns {Promise<Object>} Statistiche complete per la homepage
 */
export const getHomeDashboard = async (): Promise<{
  hasProgram: boolean;
  message?: string;
  stats?: {
    totalWorkouts: number;
    weekProgress: number;
    completedDays: number;
    totalDays: number;
    nextWorkout: string;
    lastWorkout: string;
    personalBests: number;
    activeProgram: {
      id_program: number;
      number_program: string;
      description: string;
    };
    activeWeek: {
      id_program_week: number;
      week_number: number;
    } | null;
  };
  recentActivity?: Array<{
    day_name: string;
    week_number: number;
    completed_at: string;
  }>;
}> => {
  try {
    console.log('🔍 [API] getHomeDashboard chiamata');

    const { data } = await apiClient.get('/api/workouts/dashboard/home');

    console.log('✅ [API] getHomeDashboard risposta:', data);

    return data;
  } catch (error: any) {
    console.error('❌ [API] getHomeDashboard error:', error);
    throw new Error(error.response?.data?.message || 'Impossibile caricare le statistiche homepage');
  }
};
