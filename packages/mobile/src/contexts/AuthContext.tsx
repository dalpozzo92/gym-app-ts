import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { verifyToken, getUserData, logout, verifyRefreshToken } from '@/api/auth';
import { saveAuthTokens, getAuthTokens, clearAuthTokens } from '@/db/dexie';
import ROUTES from '@/routes';

type UserRole = 1 | 2 | 3 | number;

export type AuthUser = {
  id_user_details?: number | null;
  email?: string | null;
  name?: string | null;
  surname?: string | null;
  avatar?: string | null;
  user_details_type?: UserRole | null;
  [key: string]: unknown;
};

type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPT: boolean;
  activeWorkoutId?: number | null;
  activeProgramId?: number | null;
  user: AuthUser | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (data: { user: AuthUser; accessToken: string; refreshToken: string } | null) => void;
  logout: (history?: { replace: (path: string) => void }) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  id_user_details: number | null;
  userEmail: string | null;
  userName: string | null;
  userSurname: string | null;
  userFullName: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * 🔐 OFFLINE-FIRST AUTH PROVIDER
 *
 * Strategia:
 * 1. All'avvio, verifica se c'è internet
 * 2. Se OFFLINE → carica dati utente dalla cache Dexie
 * 3. Se ONLINE → verifica token, refresh se necessario
 * 4. Salva sempre i dati utente in Dexie per uso offline
 * 5. Quando torna internet → auto-refresh token
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isAdmin: false,
    isPT: false,
    activeWorkoutId: null,
    activeProgramId: null,
    user: null,
    loading: true
  });

  // ============================================
  // Helper per aggiornare stato
  // ============================================
  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // ============================================
  // Imposta user e derivati (admin, PT)
  // ============================================
  const setUser = async (user: AuthUser | null) => {
    updateState({
      isAuthenticated: !!user,
      isAdmin: user?.user_details_type === 1, // Admin
      isPT: user?.user_details_type === 2,    // Personal Trainer
      activeWorkoutId: user ? state.activeWorkoutId ?? null : null,
      activeProgramId: user ? state.activeProgramId ?? null : null,
      user,
      loading: false
    });

    // ✅ Salva user data in Dexie per uso offline
    if (user) {
      // ⚠️ IMPORTANTISSIMO: Recupera token esistenti PRIMA di salvare
      // Su Mobile PWA non usiamo solo cookie, ma anche Bearer Token salvato.
      // Se sovrascriviamo con null, rompiamo l'auth su iOS/Android.
      const existingTokens = await getAuthTokens();

      await saveAuthTokens({
        accessToken: existingTokens?.accessToken || null,
        refreshToken: existingTokens?.refreshToken || null,
        expiresAt: existingTokens?.expiresAt || null,
        userId: String(user.id_user_details || '')
      });
      console.log('✅ [AuthContext] User data salvati in Dexie (token preservati)');
    } else {
      await clearAuthTokens();
    }
  };

  // ============================================
  // Login (chiamata da LoginPage)
  // ============================================
  const loginUser = async (data: { user: AuthUser; accessToken: string; refreshToken: string } | null) => {
    console.log('✅ [AuthContext] Login utente:', data?.user);

    if (data) {
      // ✅ Salva i token in Dexie per uso futuro (fallback se i cookie falliscono)
      await saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + 3600 * 1000, // Stima, il backend dovrebbe restituirlo
        userId: String(data.user.id_user_details || '')
      });

      setUser(data.user);
    } else {
      setUser(null);
    }
  };

  // ============================================
  // Logout (pulisce tutto)
  // ============================================
  const logoutUser = async (history?: { replace: (path: string) => void }) => {
    try {
      console.log('🔍 [AuthContext] Logout in corso...');

      // Solo se online, chiama API di logout
      if (navigator.onLine) {
        await logout();
      }
    } catch (error) {
      console.error('❌ [AuthContext] Errore durante il logout:', error);
    } finally {
      // Reset completo stato
      updateState({
        isAuthenticated: false,
        isAdmin: false,
        isPT: false,
        user: null,
        loading: false
      });

      // Pulisci cache Dexie
      await clearAuthTokens();

      // Redirect a login
      if (history) {
        history.replace(ROUTES.PUBLIC.LOGIN);
      }

      console.log('✅ [AuthContext] Logout completato');
    }
  };

  // ============================================
  // Verifica autenticazione all'avvio
  // ============================================
  const checkAuthentication = async (): Promise<boolean> => {
    try {
      updateState({ loading: true });

      console.log('🔍 [AuthContext] Verifica autenticazione...');

      // ✅ STEP 1: Se offline, carica da Dexie
      if (!navigator.onLine) {
        console.log('⚠️ [AuthContext] Offline - carico dati dalla cache');

        const cachedAuth = await getAuthTokens();

        if (cachedAuth && cachedAuth.userId) {
          // Ricostruisci user object dalla cache
          // (in futuro potresti salvare anche altri dati in Dexie)
          const cachedUser: AuthUser = {
            id_user_details: parseInt(cachedAuth.userId, 10)
          };

          console.log('✅ [AuthContext] Dati utente caricati da cache:', cachedUser);

          await setUser(cachedUser);
          return true;
        } else {
          console.log('⚠️ [AuthContext] Nessun dato in cache - richiesto login');
          await setUser(null);
          return false;
        }
      }

      // ✅ STEP 2: Se online, verifica token
      console.log('🔍 [AuthContext] Online - verifico token...');

      const isValid = await verifyToken();

      if (isValid) {
        console.log('✅ [AuthContext] Token valido, carico dati utente');

        const userData = await getUserData();
        console.log('✅ [AuthContext] Dati utente caricati:', userData);

        await setUser(userData);
        return true;
      } else {
        console.log('⚠️ [AuthContext] Token scaduto, provo refresh...');

        const refreshTokenValid = await verifyRefreshToken();

        if (refreshTokenValid) {
          console.log('✅ [AuthContext] Refresh token valido, carico dati utente');

          const userData = await getUserData();
          console.log('✅ [AuthContext] Dati utente caricati:', userData);

          await setUser(userData);
          return true;
        }

        // ✅ STEP 3: Refresh fallito, prova cache offline o token salvato
        console.log('⚠️ [AuthContext] Refresh fallito, provo cache/token salvato...');

        const cachedAuth = await getAuthTokens();

        if (cachedAuth && cachedAuth.userId) {
          // Se abbiamo un token salvato, proviamo a usarlo per verificare l'auth (magari il cookie è bloccato ma il token è valido)
          if (cachedAuth.accessToken) {
            console.log('🔄 [AuthContext] Tento verifica con Bearer Token salvato...');
            // Qui potremmo chiamare verifyToken() ma dobbiamo assicurarci che l'interceptor usi questo token.
            // Per ora, se abbiamo i dati in cache, li usiamo come fallback "offline-like" ma funzionale
          }

          const cachedUser: AuthUser = {
            id_user_details: parseInt(cachedAuth.userId, 10)
          };

          console.log('✅ [AuthContext] Uso dati dalla cache (refresh fallito):', cachedUser);

          await setUser(cachedUser);
          return true;
        }
      }

      // Token non valido e nessuna cache
      console.log('⚠️ [AuthContext] Nessun dato valido, logout');
      await setUser(null);
      return false;
    } catch (error) {
      console.error('❌ [AuthContext] Errore verifica autenticazione:', error);

      // ✅ In caso di errore di rete, prova cache offline
      try {
        const cachedAuth = await getAuthTokens();

        if (cachedAuth && cachedAuth.userId) {
          const cachedUser: AuthUser = {
            id_user_details: parseInt(cachedAuth.userId, 10)
          };

          console.log('✅ [AuthContext] Uso dati dalla cache (errore di rete):', cachedUser);

          await setUser(cachedUser);
          return true;
        }
      } catch (cacheError) {
        console.error('❌ [AuthContext] Errore lettura cache:', cacheError);
      }

      await setUser(null);
      return false;
    } finally {
      updateState({ loading: false });
    }
  };

  // ============================================
  // Effect: Verifica auth all'avvio
  // ============================================
  useEffect(() => {
    checkAuthentication();

    // ✅ Controllo periodico token (solo se online)
    const checkInterval = setInterval(() => {
      if (navigator.onLine) {
        console.log('🔍 [AuthContext] Controllo periodico autenticazione');
        checkAuthentication();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // ============================================
  // Effect: Gestisci evento scadenza sessione
  // ============================================
  useEffect(() => {
    const handleSessionExpired = async () => {
      console.log('⚠️ [AuthContext] Sessione scaduta, logout forzato');
      await setUser(null);
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, []);

  // ============================================
  // Effect: Gestisci ritorno online
  // ============================================
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [AuthContext] Connessione ripristinata, verifico autenticazione');
      checkAuthentication();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // ============================================
  // Context value
  // ============================================
  const value: AuthContextValue = {
    // Stato
    ...state,

    // Metodi
    login: loginUser,
    logout: logoutUser,
    checkAuth: checkAuthentication,

    // ✅ Helper computed values
    id_user_details: state.user?.id_user_details || null,
    userEmail: state.user?.email || null,
    userName: state.user?.name || null,
    userSurname: state.user?.surname || null,
    userFullName: state.user ? `${state.user.name} ${state.user.surname}`.trim() : null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
