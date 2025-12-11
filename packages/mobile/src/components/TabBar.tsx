import React, { useEffect, type CSSProperties } from 'react';
import { 
  IonTabBar, 
  IonTabButton, 
  IonIcon, 
  IonLabel,
  IonFooter
} from '@ionic/react';
import {
  homeOutline,
  barbellOutline,
  personOutline,
  home,
  barbell,
  person
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import ROUTES from '@/routes';
import { useAuth } from '@/contexts/AuthContext';
import { useProgramActive } from '@/hooks/useProgram';
import GlobalTimer from '@/components/GlobalTimer';

const TabBar: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const { activeProgramId, id_user_details } = useAuth();
  const { data: activeProgram } = useProgramActive(id_user_details ?? null);
  const resolvedProgramId = (activeProgram as any)?.id_program ?? (activeProgram as any)?.id ?? activeProgramId;

  const handleProgramTabClick = () => {
    if (resolvedProgramId) {
      const url = ROUTES.PUBLIC.PROGRAM_WEEKS.replace(':id', String(resolvedProgramId));
      history.push(url);
    } else {
      history.push(ROUTES.PUBLIC.PROGRAM_LIST);
    }
  };

  // Determina se siamo in una delle pagine del workout
  const isWorkoutTabActive = (): boolean => {
    const pathname = location.pathname;
    
    if (pathname === ROUTES.PUBLIC.PROGRAM_LIST) return true;
    if (pathname.startsWith('/programWeeks/')) return true;
    if (pathname.startsWith('/exercise-detail/')) return true;
    
    return false;
  };

  // Stili inline per effetto glass
  const styles: Record<string, any> = {
    footer: {
      '--background': 'transparent',
      // marginBottom: 'max(8px, env(safe-area-inset-bottom))',
    },
    container: {
      padding: '10px 10px',
      background: 'transparent'
    },
    tabBar: {
      '--background': 'rgba(var(--ion-background-color-rgb, 255, 255, 255), 0.5)',
      backdropFilter: 'blur(10px) saturate(2)',
      WebkitBackdropFilter: 'blur(15px) saturate(2)',
      borderRadius: '25px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(var(--ion-border-color-rgb, 255, 255, 255), 0.15)',
      overflow: 'hidden',
      height: '56px',
      '--border': 'none'
    } as CSSProperties,
    tabButton: {
      '--color': 'var(--ion-color-medium)',
      '--color-selected': 'var(--ion-color-primary)',
      position: 'relative',
      transition: 'all 0.3s ease',
      '--padding-start': '0',
      '--padding-end': '0',
      '--background': 'transparent',
      '--background-focused': 'transparent',
      '--background-activated': 'transparent',
      '--border': 'none',
      borderBottom: 'none !important',
      borderRight: 'none !important',
      borderLeft: 'none !important'
    } as CSSProperties,
    iconStyles: {
      fontSize: '22px'
    } as CSSProperties,
    labelStyles: (isSelected?: boolean): CSSProperties => ({
      fontSize: '12px',
      fontWeight: isSelected ? 500 : 400,
      marginTop: '4px'
    })
  };

  // Stile globale per rimuovere i bordi
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ion-tab-bar {
        --border: none !important;
      }
      ion-tab-button {
        --border: none !important;
        border: none !important;
        --ripple-color: transparent !important;
        --background: transparent !important;
        --background-focused: transparent !important;
        --background-activated: transparent !important;
      }
      ion-tab-button::before,
      ion-tab-button::after {
        display: none !important;
      }
      ion-tab-button[selected] {
        --background: transparent !important;
      }
      .ion-activated {
        --background: transparent !important;
      }
      ion-tab-button {
        transition: transform 0.2s;
      }
      ion-tab-button.tab-selected {
        --color-selected: var(--ion-color-primary);
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      <GlobalTimer />
      <IonFooter className="ion-no-border" style={styles.footer as any}>
        <div style={styles.container as any}>
          <IonTabBar slot="bottom" style={styles.tabBar as any}>
          
          {/* Tab Home */}
          <IonTabButton 
            tab="home" 
            onClick={() => history.push(ROUTES.PUBLIC.HOME)}
            selected={location.pathname === ROUTES.PUBLIC.HOME}
            style={styles.tabButton as any}
          >
            <IonIcon 
              icon={location.pathname === ROUTES.PUBLIC.HOME ? home : homeOutline} 
              style={styles.iconStyles as any}
            />
            <IonLabel style={(styles.labelStyles as (selected?: boolean) => CSSProperties)(location.pathname === ROUTES.PUBLIC.HOME)}>
              Home
            </IonLabel>
          </IonTabButton>
          
          {/* Tab Workout - Include WorkoutList, WorkoutWeeks, ExerciseDetail */}
          <IonTabButton
            tab="workout"
            onClick={handleProgramTabClick}
            selected={isWorkoutTabActive()}
            style={styles.tabButton as any}
          >
            <IonIcon
              icon={isWorkoutTabActive() ? barbell : barbellOutline}
              style={styles.iconStyles as any}
            />
            <IonLabel style={(styles.labelStyles as (selected?: boolean) => CSSProperties)(isWorkoutTabActive())}>
              Workout
            </IonLabel>
          </IonTabButton>

          {/* Tab Settings */}
          <IonTabButton 
            tab="profile" 
            onClick={() => history.push(ROUTES.PUBLIC.PROFILE)}
            selected={location.pathname === ROUTES.PUBLIC.PROFILE}
            style={styles.tabButton as CSSProperties}
          >
            <IonIcon 
              icon={location.pathname === ROUTES.PUBLIC.PROFILE ? person : personOutline} 
              style={styles.iconStyles as CSSProperties}
            />
            <IonLabel style={(styles.labelStyles as (selected?: boolean) => CSSProperties)(location.pathname === ROUTES.PUBLIC.PROFILE)}>
              Profilo
            </IonLabel>
          </IonTabButton>
          
        </IonTabBar>
      </div>
    </IonFooter>
    </>
  );
};

export default TabBar;
