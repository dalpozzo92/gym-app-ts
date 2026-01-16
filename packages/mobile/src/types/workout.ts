// ============================================
// WORKOUT & EXERCISE TYPES
// ============================================

export type IntensityGroupType = 'superset' | 'jumpset' | 'drop_set' | 'rest_pause' | 'cluster' | null;

export type WorkoutExerciseSet = {
  id_workout_exercise_set: number;
  set_number: number;
  setId: string;

  // Programmazione (PT)
  id_reps_type?: number;
  reps_min?: number;
  reps_max?: number;
  rest_time?: number;
  intensity_type?: string;
  group_intensity_id?: number | null;
  notes?: string;

  // Tracking (Utente)
  actual_load?: number;
  actual_reps?: number;
  rpe?: number | null;
  execution_rating?: number | null;
  notes_tracking?: string;
  completed?: boolean;
  completed_at?: string;

  // Metadata
  dirty?: boolean;
  status?: 'Salvato' | 'Salvataggio' | 'Offline' | 'Local' | 'Errore';
};

export type IntensityGroup = {
  id_workout_exercise_group_intensity: number;
  type: IntensityGroupType;
  name?: string;
  notes?: string;
};

export type WorkoutDayExercise = {
  id_workout_day_exercise: number;
  id_exercise_list: number;
  exercise_name: string;
  exercise_description?: string;
  link_video?: string;
  muscolar_group_name?: string;
  order_number: number;
  sets: number;
  notes?: string;
  week_number?: number;
  rest_time?: number;
  workout_exercise_sets?: WorkoutExerciseSet[];
};

/**
 * Raggruppa le serie per superset/jumpset
 * Ogni gruppo contiene uno o più esercizi con le loro serie
 */
export type SetGroup = {
  groupType: 'single' | 'superset' | 'jumpset';
  setNumber: number; // Numero della serie (1, 2, 3...)
  intensityGroup?: IntensityGroup;
  exercises: Array<{
    exercise: WorkoutDayExercise;
    set: WorkoutExerciseSet;
  }>;
  restTime?: number; // Rest time dopo questo gruppo
};

/**
 * Raggruppa tutti i setGroup per gestire l'ordine di esecuzione
 */
export type WorkoutSetSequence = {
  setGroups: SetGroup[];
  totalSets: number;
  completedSets: number;
};
