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

// In sviluppo usa localhost, in produzione usa URL relativo (Unified Hosting)
// Con Unified Hosting, frontend e backend sono sullo stesso dominio.
export const API_BASE_URL: string = import.meta.env.VITE_API_URL || '';

// In modalità Unified Hosting su Koyeb, API_BASE_URL sarà vuota, 
// quindi axios userà l'URL corrente come base.
// Le chiamate partiranno come /api/... -> https://mia-app.koyeb.app/api/...
// che è Same-Origin.

console.log('🔧 [apiClient] API_BASE_URL:', API_BASE_URL || '(vuoto - usa same-origin)');

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Sempre true per i cookie
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
