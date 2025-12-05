
// ============================================
// API PROGRAM - Struttura del programma
// ============================================
import { apiClient } from './config';

export type Program = Record<string, unknown>;
export type ProgramWeek = Record<string, unknown>;
export type ProgramDay = Record<string, unknown>;

/**
 * Ottiene il programma attivo dell'utente
 * @returns {Promise<Object>} program con id_program, description, duration_workout
 */
export const getProgramActive = async (id_user_details: number | null = null): Promise<Program | null> => {
  try {
    const endpoint = id_user_details
      ? `/api/programs/getProgramActive/${id_user_details}`
      : '/api/programs/getProgramActive';
    
    const { data } = await apiClient.get<{ program: Program | null }>(endpoint);
    return data.program;
  } catch (error) {
    console.error('❌ [API] getProgramActive error:', error);
    throw new Error('Impossibile caricare il programma attivo');
  }
};

/**
 * Ottiene le settimane del programma con progresso
 * @param {number} id_program
 * @returns {Promise<Array>} program_weeks[]
 */
export const getProgramWeeks = async (id_program: number | string): Promise<ProgramWeek[]> => {
  try {
    const { data } = await apiClient.get<{ program_weeks: ProgramWeek[] }>(`/api/programs/getProgramWeeks/${id_program}`);
    return data.program_weeks;
  } catch (error) {
    console.error('❌ [API] getProgramWeeks error:', error);
    throw new Error('Impossibile caricare le settimane');
  }
};

/**
 * Ottiene i giorni di una settimana specifica
 * @param {number} id_program_week
 * @returns {Promise<Array>} program_days[]
 */
export const getProgramDays = async (id_program_week: number | string): Promise<ProgramDay[]> => {
  try {
    const { data } = await apiClient.get<{ program_days: ProgramDay[] }>(`/api/programs/getProgramDays/${id_program_week}`);
    return data.program_days;
  } catch (error) {
    console.error('❌ [API] getProgramDays error:', error);
    throw new Error('Impossibile caricare i giorni');
  }
};

export const getProgramList = async (id_user_details: number | null): Promise<Program[]> => {
  try {
    const response = await apiClient.get<{ program: Program[] }>('/api/programs/getProgramList', { 
      params: { id_user_details } 
    });
    return response.data.program || [];
  } catch (error) {
    console.error('Get program list error:', error);
    throw error;
  }
};
