import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { verifyToken, getUserData, logout, verifyRefreshToken } from '@/api/auth';
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
 * 🔐 COOKIE-BASED AUTH PROVIDER
 *
 * Strategia:
 * 1. I token (access + refresh) sono gestiti tramite cookie HTTP-only
 * 2. I cookie vengono inviati automaticamente con ogni richiesta (withCredentials: true)
 * 3. Il backend gestisce automaticamente il refresh dei token quando scadono
 * 4. IndexedDB viene usato solo per pulizia cache al logout
 * 5. TODO: Supporto offline da implementare in futuro
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

    // ✅ I token sono gestiti automaticamente tramite cookie HTTP-only
    // IndexedDB non viene più usato per i token
    // Pulizia cache al logout
    if (!user) {
      await clearAuthTokens();
    }
  };

  // ============================================
  // Login (chiamata da LoginPage)
  // ============================================
  const loginUser = async (data: { user: AuthUser } | null) => {
    console.log('✅ [AuthContext] Login utente:', data?.user);

    if (data) {
      // ✅ I token sono gestiti automaticamente tramite cookie HTTP-only
      // Non salviamo più i token in IndexedDB
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

      // ✅ TODO: Supporto offline da implementare in futuro
      // Per ora gestiamo solo autenticazione online tramite cookie
      if (!navigator.onLine) {
        console.log('⚠️ [AuthContext] Offline - supporto offline non ancora implementato');
        await setUser(null);
        return false;
      }

      // ✅ Verifica token (dai cookie HTTP-only)
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

        const refreshResult = await verifyRefreshToken();

        if (refreshResult.isValid) {
          console.log('✅ [AuthContext] Refresh token valido, carico dati utente');

          // ✅ I token sono stati aggiornati automaticamente nei cookie dal backend
          const userData = await getUserData();
          console.log('✅ [AuthContext] Dati utente caricati:', userData);

          await setUser(userData);
          return true;
        }
      }

      // Token non valido
      console.log('⚠️ [AuthContext] Nessun dato valido, logout');
      await setUser(null);
      return false;
    } catch (error) {
      console.error('❌ [AuthContext] Errore verifica autenticazione:', error);

      // ✅ TODO: Gestione errori di rete con cache offline da implementare in futuro
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
