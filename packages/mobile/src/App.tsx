import React, { lazy, type ComponentType } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, Switch } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProgramProvider } from '@/contexts/ProgramContext';
import PageLayout from '@/components/PageLayout';
import ROUTES, { getRouteConfig } from '@/routes';

setupIonicReact({
  swipeBackEnabled: true
});

// Lazy loading pagine - NOMENCLATURA AGGIORNATA
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const HomePage = lazy(() => import('@/pages/HomePage'));
// const ProgramPage = lazy(() => import('@/pages/ProgramPage'));           // Era WorkoutPage
const SettingPage = lazy(() => import('@/pages/SettingPage'));
const ProgramListPage = lazy(() => import('@/pages/ProgramListPage'));   // Era WorkoutListPage
const UnauthorizedPage = lazy(() => import('@/pages/UnauthorizedPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ProgramWeeks = lazy(() => import('@/pages/ProgramWeeks'));         // Era WorkoutWeeks
const TestPage = lazy(() => import('@/pages/TestPage'));
const ExerciseDetail = lazy(() => import('@/pages/ExerciseDetail'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

const App: React.FC = () => (
  <AuthProvider>
    <ThemeProvider>
      <ProgramProvider>
        <IonApp>
          <IonReactRouter>
            <AppRoutes />
          </IonReactRouter>
        </IonApp>
      </ProgramProvider>
    </ThemeProvider>
  </AuthProvider>
);

type RouteComponent = ComponentType;

const AppRoutes: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Funzione helper per creare rotte protette
  const createProtectedRoute = (path: string, Component: RouteComponent, exact = true) => (
    <Route path={path} exact={exact}>
      {isAuthenticated ? (
        <PageLayout customConfig={getRouteConfig(path)}>
          <Component />
        </PageLayout>
      ) : (
        <Redirect to={ROUTES.PUBLIC.LOGIN} />
      )}
    </Route>
  );

  // Funzione helper per creare rotte admin
  const createAdminRoute = (path: string, Component: RouteComponent, exact = true) => (
    <Route path={path} exact={exact}>
      {!isAuthenticated ? (
        <Redirect to={ROUTES.PUBLIC.LOGIN} />
      ) : !isAdmin ? (
        <Redirect to={ROUTES.PUBLIC.UNAUTHORIZED} />
      ) : (
        <PageLayout customConfig={getRouteConfig(path)}>
          <Component />
        </PageLayout>
      )}
    </Route>
  );

  // Funzione helper per creare rotte pubbliche (senza layout)
  const createPublicRoute = (path: string, Component: RouteComponent, exact = true) => (
    <Route path={path} exact={exact}>
      <Component />
    </Route>
  );

  // ✅ Funzione per generare una key stabile per le pagine
  const getPageKey = (location: any) => {
    // Per la pagina di dettaglio esercizio, usiamo una key che dipende solo dal giorno del programma
    // In questo modo, cambiare esercizio (che cambia l'URL) non smonta il componente
    if (location.pathname.startsWith('/exercise-detail/')) {
      const parts = location.pathname.split('/');
      // parts[0] = "", parts[1] = "exercise-detail", parts[2] = id_program_day
      // Ritorniamo una key che cambia solo se cambia il giorno
      return `exercise-detail-${parts[2]}`;
    }
    // Per tutte le altre pagine, comportamento standard
    return location.pathname;
  };

  return (
    <Route
      render={({ location }: { location: any }) => (
        <IonRouterOutlet>
          <AnimatePresence mode="wait">
            <Switch location={location} key={getPageKey(location)}>

              {/* Pagine pubbliche (senza layout) */}
              {createPublicRoute(ROUTES.PUBLIC.LOGIN, LoginPage)}
              {createPublicRoute(ROUTES.PUBLIC.REGISTER, RegisterPage)}
              {createPublicRoute(ROUTES.PUBLIC.UNAUTHORIZED, UnauthorizedPage)}
              {createPublicRoute(ROUTES.PUBLIC.TEST, TestPage)}

              {/* Pagine protette (con layout automatico) - NOMI AGGIORNATI */}
              {createProtectedRoute(ROUTES.PUBLIC.HOME, HomePage)}
              {/* {createProtectedRoute(ROUTES.PUBLIC.PROGRAM, ProgramPage)}                    // Era WORKOUT */}
              {createProtectedRoute(ROUTES.PUBLIC.SETTING, SettingPage)}
              {createProtectedRoute(ROUTES.PUBLIC.PROGRAM_LIST, ProgramListPage)}          // Era WORKOUT_LIST
              {createProtectedRoute(ROUTES.PUBLIC.PROGRAM_WEEKS, ProgramWeeks)}            // Era WORKOUT_WEEKS
              {createProtectedRoute(ROUTES.PUBLIC.EXERCISE_DETAIL, ExerciseDetail)}
              {createProtectedRoute(ROUTES.PUBLIC.PROFILE, ProfilePage)}

              {/* Rotte admin */}
              {createAdminRoute(ROUTES.ADMIN.DASHBOARD, DashboardPage)}

              {/* Redirect iniziale */}
              <Route path="/" exact>
                <Redirect to={isAuthenticated ? ROUTES.PUBLIC.HOME : ROUTES.PUBLIC.LOGIN} />
              </Route>

              {/* Catch-all */}
              <Route>
                <Redirect to="/" />
              </Route>
            </Switch>
          </AnimatePresence>
        </IonRouterOutlet>
      )}
    />
  );
};

export default App;
