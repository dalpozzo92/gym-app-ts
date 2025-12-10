import { apiClient } from './config';

export type TrainerTheme = {
    color_primary: string;
    color_secondary: string;
    color_tertiary: string;
} | null;

type ThemeResponse = {
    theme: TrainerTheme;
};

// Ottieni il tema del personal trainer associato all'utente
export const getTrainerTheme = async (): Promise<TrainerTheme> => {
    try {
        const response: { data: ThemeResponse } = await apiClient.get('/api/users/trainer-theme');
        return response.data.theme;
    } catch (error) {
        console.error('Get trainer theme error:', error);
        return null;
    }
};
