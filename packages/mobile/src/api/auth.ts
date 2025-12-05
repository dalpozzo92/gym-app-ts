import { apiClient } from './config';

export type ApiUser = {
  id_user_details?: number | null;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  user_details_type?: number | null;
  [key: string]: unknown;
};

type AuthResponse<T> = {
  data: T;
};

// Login utente tramite backend
export const loginUser = async (email: string, password: string): Promise<ApiUser> => {
  try {
    const response: AuthResponse<{ user: ApiUser }> = await apiClient.post('/api/auth/login', { email, password });
    return response.data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Registrazione utente tramite backend
export const registerUser = async (name: string, email: string, password: string): Promise<unknown> => {
  try {
    const response: AuthResponse<unknown> = await apiClient.post('/api/auth/register', { name, email, password });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Verifica token tramite backend
export const verifyToken = async (): Promise<boolean> => {
  try {
    const response: AuthResponse<{ isValid: boolean }> = await apiClient.get('/api/auth/verify-token');
    return response.data.isValid;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
};

// Verifica refresh token tramite backend
export const verifyRefreshToken = async (): Promise<boolean> => {
  try {
    const response: AuthResponse<{ isValid: boolean }> = await apiClient.post('/api/auth/verify-refresh-token');
    return response.data.isValid ?? false;
  } catch (error) {
    console.error('Refresh Token verification error:', error);
    return false;
  }
};

// Verifica ruolo admin tramite backend
export const verifyAdmin = async (): Promise<boolean> => {
  try {
    const response: AuthResponse<{ isAdmin: boolean }> = await apiClient.get('/api/auth/verify-admin');
    return response.data.isAdmin;
  } catch (error) {
    console.error('Admin verification error:', error);
    return false;
  }
};

// Verifica ruolo tramite backend
export const verifyRole = async (): Promise<unknown> => {
  try {
    const response: AuthResponse<unknown> = await apiClient.get('/api/auth/verify-role');
    return response.data;
  } catch (error) {
    console.error('Role verification error:', error);
    throw error;
  }
};

// Logout utente tramite backend
export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/api/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Ottieni dati utente tramite backend
export const getUserData = async (): Promise<ApiUser> => {
  try {
    const response: AuthResponse<{ user: ApiUser }> = await apiClient.get('/api/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Get user data error:', error);
    throw error;
  }
};

// Ottieni tutti gli utenti (solo per admin)
export const getAllUsers = async (): Promise<ApiUser[]> => {
  try {
    const response: AuthResponse<{ users: ApiUser[] }> = await apiClient.get('/api/users/all');
    return response.data.users;
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
};
