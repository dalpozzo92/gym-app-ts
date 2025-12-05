import { apiClient } from './config';

export type ExerciseSetPayload = Record<string, unknown>;

/** /api/exercises/
 * Ottiene dettagli completi di un esercizio
 * @param {string} workoutDayExerciseId - ID dell'esercizio
 * @returns {Promise<Object>} Dettagli esercizio con serie
 */
export const getExerciseDetails = async (workoutDayExerciseId: string | number): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/api/exercises/getExerciseDetails/${workoutDayExerciseId}`);
    return response.data;
  } catch (error) {
    console.error(`Get exercise details error for ${workoutDayExerciseId}:`, error);
    throw error;
  }
};

/**
 * Ottiene tutti gli esercizi di un giorno
 * @param {string} workoutDayId - ID del giorno
 * @returns {Promise<Array>} Lista esercizi
 */
export const getDayExercises = async (workoutDayId: string | number): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/api/exercises/day/${workoutDayId}`);
    return response.data;
  } catch (error) {
    console.error(`Get day exercises error for ${workoutDayId}:`, error);
    throw error;
  }
};

/**
 * Salva una singola serie
 * @param {Object} setData - Dati della serie da salvare
 * @returns {Promise<Object>} Serie salvata
 */
export const saveExerciseSet = async (setData: ExerciseSetPayload): Promise<unknown> => {
  try {
    const response = await apiClient.post('/api/exercises/sets/save', setData);
    return response.data;
  } catch (error) {
    console.error('Save exercise set error:', error);
    throw error;
  }
};

/**
 * Sincronizzazione batch di più serie (offline mode)
 * @param {Array} setsData - Array di serie da sincronizzare
 * @returns {Promise<Object>} Risultato sincronizzazione
 */
export const syncExerciseSets = async (setsData: ExerciseSetPayload[]): Promise<unknown> => {
  try {
    const response = await apiClient.post('/api/exercises/sets/sync', { sets: setsData });
    return response.data;
  } catch (error) {
    console.error('Sync exercise sets error:', error);
    throw error;
  }
};

/**
 * Calcola il progresso di un esercizio
 * @param {string} workoutDayExerciseId - ID dell'esercizio
 * @returns {Promise<Object>} Progresso (progress, completed, total)
 */
export const getExerciseProgress = async (workoutDayExerciseId: string | number): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/api/exercises/${workoutDayExerciseId}/progress`);
    return response.data;
  } catch (error) {
    console.error(`Get exercise progress error for ${workoutDayExerciseId}:`, error);
    throw error;
  }
};

/**
 * Ottiene la prestazione precedente (stessa serie, settimana precedente)
 * @param {string} workoutDayExerciseId - ID dell'esercizio
 * @param {number} setNumber - Numero della serie
 * @param {number} weekNumber - Numero settimana corrente
 * @returns {Promise<Object|null>} Prestazione precedente o null
 */
export const getPreviousPerformance = async (
  workoutDayExerciseId: string | number,
  setNumber: number,
  weekNumber: number
): Promise<unknown> => {
  try {
    const response = await apiClient.get('/api/exercises/previous-performance', {
      params: { workoutDayExerciseId, setNumber, weekNumber }
    });
    return response.data;
  } catch (error) {
    console.error('Get previous performance error:', error);
    throw error;
  }
};

/**
 * Ottiene lo storico completo delle prestazioni di un esercizio
 * @param {string} workoutDayExerciseId - ID dell'esercizio
 * @returns {Promise<Array>} Storico prestazioni
 */
export const getExerciseHistory = async (workoutDayExerciseId: string | number): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/api/exercises/${workoutDayExerciseId}/history`);
    return response.data;
  } catch (error) {
    console.error(`Get exercise history error for ${workoutDayExerciseId}:`, error);
    throw error;
  }
};
