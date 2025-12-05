export type PublicRoutes = {
  LOGIN: string;
  REGISTER: string;
  HOME: string;
  PROGRAM: string;
  SETTING: string;
  PROGRAM_LIST: string;
  UNAUTHORIZED: string;
  PROGRAM_WEEKS: string;
  EXERCISE_DETAIL: string;
  TEST: string;
  PROFILE: string;
  WORKOUT_LIST: string;
  WORKOUT_WEEKS: string;
};

export type AdminRoutes = {
  DASHBOARD: string;
  GESTIONE_UTENTI: string;
  STATISTICHE: string;
  CONFIGURAZIONE: string;
  GESTIONE_PROGRAMMI: string;
};

export type RouteLayoutConfig = {
  showNavBar: boolean;
  showTabs: boolean;
  useMotion: boolean;
  showBackButton?: boolean;
  showAvatar?: boolean;
  showSettingsButton?: boolean;
  title?: string;
};

// Definizione di tutte le rotte dell'applicazione
const ROUTES: { PUBLIC: PublicRoutes; ADMIN: AdminRoutes } = {
  // Rotte pubbliche
  PUBLIC: {
    LOGIN: '/login',
    REGISTER: '/register',
    HOME: '/home',
    PROGRAM: '/program',
    SETTING: '/setting',
    PROGRAM_LIST: '/program-list',
    UNAUTHORIZED: '/unauthorized',
    PROGRAM_WEEKS: '/programWeeks/:id',
    EXERCISE_DETAIL: '/exercise-detail/:id_program_day/:id_workout_day_exercise?',
    TEST: '/test',
    PROFILE: '/profile',
    // Alias per vecchie denominazioni "workout"
    WORKOUT_LIST: '/program-list',
    WORKOUT_WEEKS: '/programWeeks/:id',
  },
  
  // Rotte admin (gestionale)
  ADMIN: {
    DASHBOARD: '/dashboard',
    GESTIONE_UTENTI: '/gestione-utenti',
    STATISTICHE: '/statistiche',
    CONFIGURAZIONE: '/configurazione',
    GESTIONE_PROGRAMMI: '/gestione-programmi',
  }
};

// Array di tutte le rotte admin per verificare facilmente
export const ADMIN_ROUTES = Object.values(ROUTES.ADMIN);

// Funzione di utility per verificare se un percorso è una rotta admin
export const isAdminRoute = (pathname: string): boolean => {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
};

// ✅ HELPER per costruire rotte
export const buildRoute = {
  /**
   * Costruisce URL per exercise detail
   */
  exerciseDetail: (
    id_program_day: number | string,
    id_workout_day_exercise: number | string | null = null
  ): string => {
    if (id_workout_day_exercise) {
      return `/exercise-detail/${id_program_day}/${id_workout_day_exercise}`;
    }
    return `/exercise-detail/${id_program_day}`;
  },
  
  /**
   * Costruisce URL per program weeks
   */
  programWeeks: (id_program: number | string): string => {
    return `/programWeeks/${id_program}`;
  },
};

// Configurazione del layout per ogni rotta
export const ROUTE_CONFIG: Record<string, RouteLayoutConfig> = {
  [ROUTES.PUBLIC.LOGIN]: {
    showNavBar: false,
    showTabs: false,
    useMotion: false, // Non usiamo motion per le pagine di autenticazione
  },
  [ROUTES.PUBLIC.REGISTER]: {
    showNavBar: false,
    showTabs: false,
    useMotion: false,
    showAvatar: false,
    showSettingsButton: false,
    showBackButton: false,
  },
  [ROUTES.PUBLIC.HOME]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
  },
  [ROUTES.PUBLIC.PROGRAM]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
  },
  [ROUTES.PUBLIC.SETTING]: {
    showNavBar: false,
    showTabs: true,
    useMotion: true,
  },
  [ROUTES.PUBLIC.PROGRAM_LIST]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
    title: 'Programmi di Allenamento',
    showBackButton: true,
    showAvatar: false,
  },
  [ROUTES.PUBLIC.PROGRAM_WEEKS]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
  },
  [ROUTES.PUBLIC.WORKOUT_WEEKS]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
  },
  [ROUTES.PUBLIC.EXERCISE_DETAIL]: {
    showNavBar: true,
    showTabs: true,
    useMotion: false,
    showBackButton: false,
    title: 'Dettagli Esercizio',
    showAvatar: true,
  },
  [ROUTES.PUBLIC.UNAUTHORIZED]: {
    showNavBar: false,
    showTabs: false,
    useMotion: false,
  },
  [ROUTES.ADMIN.DASHBOARD]: {
    showNavBar: true,
    showTabs: false,
    useMotion: true,
  },
  [ROUTES.PUBLIC.PROFILE]: {
    showNavBar: true,
    showTabs: true,
    useMotion: true,
    showAvatar: true,
    showSettingsButton: false,
    showBackButton: false,
    title: "Profilo"
  },
};

// Funzione per ottenere la configurazione di una rotta
export const getRouteConfig = (pathname: string): RouteLayoutConfig => {
  const config = ROUTE_CONFIG[pathname];
  
  if (config) return config;
  
  // Configurazione predefinita
  return {
    showNavBar: true,
    showTabs: true,
    useMotion: false, // Pagine non principali usano l'animazione standard di Ionic
    showBackButton: false,
  };
};

export default ROUTES;
