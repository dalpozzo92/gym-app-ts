import { apiClient } from './config';

export type ApiUser = {
  id_user_details?: number | null;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  user_details_type?: number | null;
  [key: string]: unknown;
};

// Login tramite backend (imposta cookie HTTP-only)
export const loginUser = async (email: string, password: string): Promise<{ user: ApiUser }> => {
  const response = await apiClient.post<{ user: ApiUser }>('/api/auth/login', {
    email,
    password
  });

  return { user: response.data.user };
};

// Registrazione tramite backend
export const registerUser = async (name: string, email: string, password: string): Promise<unknown> => {
  const response = await apiClient.post('/api/auth/register', {
    name,
    email,
    password
  });

  return response.data;
};

// Verifica se c'è una sessione valida (controlla cookie)
export const verifyToken = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get<{ isValid: boolean }>('/api/auth/verify-token', {
      skipAuthRefresh: true
    });
    return response.data.isValid;
  } catch {
    return false;
  }
};

// Refresh del token (usa cookie refresh_token)
export const verifyRefreshToken = async (): Promise<{ isValid: boolean }> => {
  try {
    const response = await apiClient.post<{ isValid: boolean }>('/api/auth/verify-refresh-token', {}, {
      skipAuthRefresh: true
    });
    return { isValid: response.data.isValid };
  } catch {
    return { isValid: false };
  }
};

// Verifica ruolo admin
export const verifyAdmin = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get<{ isAdmin: boolean }>('/api/auth/verify-admin');
    return response.data.isAdmin;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
};

// Verifica ruolo
export const verifyRole = async (): Promise<unknown> => {
  try {
    const response = await apiClient.get('/api/auth/verify-role');
    return response.data;
  } catch (error) {
    console.error('Role verification error:', error);
    throw error;
  }
};

// Logout (elimina cookie)
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Ottieni dati utente dal backend
export const getUserData = async (): Promise<ApiUser> => {
  try {
    const response = await apiClient.get<{ user: ApiUser }>('/api/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

// Ottieni tutti gli utenti (solo per admin)
export const getAllUsers = async (): Promise<ApiUser[]> => {
  try {
    const response = await apiClient.get<{ users: ApiUser[] }>('/api/users/all');
    return response.data.users;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};
