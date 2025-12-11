// @ts-nocheck
import axios, { type AxiosInstance } from 'axios';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || "fit-gilli-dalpozzo-3a79c772.koyeb.app/gym-backend"
  ;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Importante per inviare/ricevere i cookie
});

// ✅ Interceptor per aggiungere Bearer Token (Dual Auth per PWA iOS)
apiClient.interceptors.request.use(async (config) => {
  try {
    // ✅ Non aggiungere Bearer token per le chiamate di refresh
    // (il refresh deve usare solo il cookie HTTP-only)
    if (config.url?.includes('/verify-refresh-token') || config.skipAuthRefresh) {
      return config;
    }

    // Importiamo dinamicamente per evitare cicli
    const { getAuthTokens } = await import('@/db/dexie');
    const tokens = await getAuthTokens();

    if (tokens?.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  } catch (err) {
    // Ignora errori di lettura token
  }
  return config;
});

// ✅ Interceptor per gestire refresh token automatico (MASSIMO 1 TENTATIVO)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se l'errore è 401 (Unauthorized) e non abbiamo già tentato di refreshare il token
    // IMPORTANTE: Non intercettare errori dalla chiamata di refresh stessa (skipAuthRefresh flag)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.skipAuthRefresh) {
      originalRequest._retry = true;

      try {
        console.log('🔄 [apiClient] Access token scaduto, tento refresh (1 volta sola)...');

        // Tenta di refreshare il token tramite il nostro backend
        // IMPORTANTE: skipAuthRefresh = true per evitare loop infinito
        await apiClient.post('/api/auth/verify-refresh-token', {}, {
          skipAuthRefresh: true
        });

        console.log('✅ [apiClient] Refresh completato, riprovo richiesta originale');

        // Se il refresh ha successo, riprova la richiesta originale
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('❌ [apiClient] Refresh token fallito, sessione scaduta');

        // Trigger logout event per l'applicazione
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
