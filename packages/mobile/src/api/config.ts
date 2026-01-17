import axios, { type AxiosInstance } from 'axios';

// Estendi il tipo di Axios per includere flag custom
declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

// In sviluppo usa l'URL locale, in produzione usa URL relativo (proxy Netlify)
// Il proxy Netlify trasforma /api/* -> https://fit-gilli-dalpozzo-3a79c772.koyeb.app/api/*
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

console.log('🔧 [apiClient] API_BASE_URL:', API_BASE_URL || '(vuoto - usa proxy)');

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante per i cookie HTTP-only
});

// Interceptor per gestire refresh token automatico (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se 401 e non abbiamo già provato il refresh
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;

      try {
        console.log('🔄 [apiClient] Token scaduto, tento refresh...');

        // Chiama l'endpoint di refresh (usa cookie httpOnly)
        const refreshResponse = await apiClient.post('/api/auth/verify-refresh-token', {}, {
          skipAuthRefresh: true
        });

        if (refreshResponse.data?.isValid) {
          console.log('✅ [apiClient] Token refreshato, riprovo richiesta');
          return apiClient(originalRequest);
        } else {
          console.error('❌ [apiClient] Refresh fallito');
          window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('❌ [apiClient] Errore durante refresh:', refreshError);
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
