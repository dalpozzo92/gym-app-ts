import { apiClient } from './config';

type ProgressPeriod = 'week' | 'month' | 'year' | string;
type SessionData = Record<string, unknown>;
type MeasurementData = Record<string, unknown>;

// Ottieni i progressi dell'utente
export const getUserProgress = async (userId: number | string, period: ProgressPeriod = 'month'): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/progress/${userId}`, {
      params: { period }
    });
    return response.data.progress;
  } catch (error) {
    console.error('Get user progress error:', error);
    throw error;
  }
};

// Registra una sessione di allenamento completata
export const logWorkoutSession = async (sessionData: SessionData): Promise<unknown> => {
  try {
    const response = await apiClient.post('/progress/log-session', sessionData);
    return response.data.session;
  } catch (error) {
    console.error('Log workout session error:', error);
    throw error;
  }
};

// Ottieni statistiche di allenamento
export const getWorkoutStats = async (
  userId: number | string,
  startDate: string,
  endDate: string
): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/progress/${userId}/stats`, {
      params: { startDate, endDate }
    });
    return response.data.stats;
  } catch (error) {
    console.error('Get workout stats error:', error);
    throw error;
  }
};

// Registra una misurazione corporea (peso, grasso corporeo, ecc.)
export const logBodyMeasurement = async (measurementData: MeasurementData): Promise<unknown> => {
  try {
    const response = await apiClient.post('/progress/measurements', measurementData);
    return response.data.measurement;
  } catch (error) {
    console.error('Log body measurement error:', error);
    throw error;
  }
};

// Ottieni la cronologia delle misurazioni
export const getMeasurementHistory = async (
  userId: number | string,
  measurementType: string,
  period: ProgressPeriod = 'year'
): Promise<unknown> => {
  try {
    const response = await apiClient.get(`/progress/${userId}/measurements`, {
      params: { type: measurementType, period }
    });
    return response.data.history;
  } catch (error) {
    console.error('Get measurement history error:', error);
    throw error;
  }
};
