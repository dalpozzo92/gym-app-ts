import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { getUserData, logout as logoutApi, verifyToken } from '@/api/auth';
import { clearAuthTokens } from '@/db/dexie';
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
  login: (data: { user: AuthUser } | null) => void;
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
 * AUTH PROVIDER (Cookie-based)
 *
 * Strategia:
 * 1. Il backend imposta cookie HTTP-only per access_token e refresh_token
 * 2. Axios invia automaticamente i cookie con withCredentials: true
 * 3. Il proxy Netlify rende le richieste same-origin (cookie first-party)
 * 4. Funziona su iOS PWA senza problemi
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

  // Ref per prevenire chiamate duplicate
  const isLoadingUserData = useRef(false);

  // Helper per aggiornare stato
  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Imposta user e derivati
  const setUser = (user: AuthUser | null) => {
    updateState({
      isAuthenticated: !!user,
      isAdmin: user?.user_details_type === 1,
      isPT: user?.user_details_type === 2,
      activeWorkoutId: user ? state.activeWorkoutId ?? null : null,
      activeProgramId: user ? state.activeProgramId ?? null : null,
      user,
      loading: false
    });

    if (!user) {
      clearAuthTokens();
    }
  };

  // Carica dati utente dal backend (con protezione da chiamate duplicate)
  const loadUserData = async (): Promise<AuthUser | null> => {
    if (isLoadingUserData.current) {
      console.log('⏳ [AuthContext] Caricamento già in corso, skip');
      return null;
    }

    isLoadingUserData.current = true;
    try {
      console.log('📡 [AuthContext] Carico dati utente dal backend...');
      const userData = await getUserData();
      console.log('✅ [AuthContext] Dati utente caricati:', userData);
      return userData;
    } catch (error) {
      console.error('❌ [AuthContext] Errore caricamento dati utente:', error);
      return null;
    } finally {
      isLoadingUserData.current = false;
    }
  };

  // Login (chiamata da LoginPage dopo login riuscito)
  const loginUser = async (data: { user: AuthUser } | null) => {
    console.log('✅ [AuthContext] Login utente:', data?.user);

    if (data) {
      setUser(data.user);
    } else {
      setUser(null);
    }
  };

  // Logout
  const logoutUser = async (history?: { replace: (path: string) => void }) => {
    try {
      console.log('🔍 [AuthContext] Logout in corso...');

      await logoutApi();
    } catch (error) {
      console.error('❌ [AuthContext] Errore durante il logout:', error);
    } finally {
      updateState({
        isAuthenticated: false,
        isAdmin: false,
        isPT: false,
        user: null,
        loading: false
      });

      await clearAuthTokens();

      if (history) {
        history.replace(ROUTES.PUBLIC.LOGIN);
      }

      console.log('✅ [AuthContext] Logout completato');
    }
  };

  // Verifica autenticazione
  const checkAuthentication = async (): Promise<boolean> => {
    return await verifyToken();
  };

  // Effect: Controlla sessione esistente all'avvio
  useEffect(() => {
    let mounted = true;

    const checkInitialSession = async () => {
      console.log('🔍 [AuthContext] Controllo sessione iniziale...');

      try {
        // Verifica se c'è un token valido
        const isValid = await verifyToken();

        if (!mounted) return;

        if (isValid) {
          console.log('✅ [AuthContext] Sessione valida, carico dati utente');
          const userData = await loadUserData();
          if (mounted) {
            setUser(userData);
          }
        } else {
          console.log('❌ [AuthContext] Nessuna sessione valida');
          updateState({ loading: false });
        }
      } catch (error) {
        console.error('❌ [AuthContext] Errore verifica sessione:', error);
        if (mounted) {
          updateState({ loading: false });
        }
      }
    };

    checkInitialSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Effect: Gestisci evento scadenza sessione
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('⚠️ [AuthContext] Sessione scaduta, logout forzato');
      setUser(null);
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpired);
    };
  }, []);

  // Context value
  const value: AuthContextValue = {
    ...state,
    login: loginUser,
    logout: logoutUser,
    checkAuth: checkAuthentication,
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
