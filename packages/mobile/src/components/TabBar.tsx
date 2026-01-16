import React, { useEffect, useRef, type CSSProperties } from 'react';
import {
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonFooter,
  createAnimation
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

  // Determina se siamo in una delle pagine del workout
  const isWorkoutTabActive = (): boolean => {
    const pathname = location.pathname;

    if (pathname === ROUTES.PUBLIC.PROGRAM_LIST) return true;
    if (pathname.startsWith('/programWeeks/')) return true;
    if (pathname.startsWith('/exercise-detail/')) return true;

    return false;
  };

  // Ref per accedere direttamente al DOM element del droplet
  const dropletRef = useRef<HTMLDivElement>(null);

  // Funzioni per salvare/recuperare l'ultimo indice dal sessionStorage
  const getLastTabIndex = (): number | null => {
    const saved = sessionStorage.getItem('lastTabIndex');
    return saved !== null ? parseInt(saved, 10) : null;
  };

  const saveTabIndex = (index: number) => {
    sessionStorage.setItem('lastTabIndex', index.toString());
  };

  const handleProgramTabClick = () => {
    if (resolvedProgramId) {
      const url = ROUTES.PUBLIC.PROGRAM_WEEKS.replace(':id', String(resolvedProgramId));
      history.push(url);
    } else {
      history.push(ROUTES.PUBLIC.PROGRAM_LIST);
    }
  };

  // Aggiorna l'indice del tab attivo basato sulla location E anima
  useEffect(() => {
    let newIndex = 0;
    if (location.pathname === ROUTES.PUBLIC.HOME) {
      newIndex = 0;
    } else if (isWorkoutTabActive()) {
      newIndex = 1;
    } else if (location.pathname === ROUTES.PUBLIC.PROFILE) {
      newIndex = 2;
    }

    const oldIndex = getLastTabIndex();

    console.log('[TabBar] Cambio pathname:', location.pathname, '→ new index:', newIndex, 'lastTabIndex da sessionStorage:', oldIndex);

    // Primo render assoluto (nessun valore salvato): imposta posizione senza animare
    if (dropletRef.current && oldIndex === null) {
      console.log('[TabBar] PRIMO RENDER ASSOLUTO - imposto posizione iniziale senza animare');
      dropletRef.current.style.transform = `translateX(${newIndex * 100}%)`;
      saveTabIndex(newIndex);
    }
    // Se l'indice è cambiato, anima
    else if (dropletRef.current && oldIndex !== null && oldIndex !== newIndex) {
      const fromX = oldIndex * 100;
      const toX = newIndex * 100;

      console.log(`[TabBar Animation] ✅ ESEGUO animazione da ${oldIndex} (${fromX}%) a ${newIndex} (${toX}%)`);

      // Usa Ionic Animations API
      const animation = createAnimation()
        .addElement(dropletRef.current)
        .duration(400)
        .easing('cubic-bezier(0.34, 1.56, 0.64, 1)')
        .fromTo('transform', `translateX(${fromX}%)`, `translateX(${toX}%)`);

      // Esegui l'animazione
      animation.play();

      // Salva il nuovo indice
      saveTabIndex(newIndex);
    } else if (oldIndex === newIndex) {
      console.log('[TabBar] Stesso indice - imposto posizione senza animare');
      // Imposta la posizione anche se è lo stesso (per remount del componente)
      if (dropletRef.current) {
        dropletRef.current.style.transform = `translateX(${newIndex * 100}%)`;
      }
    }
  }, [location.pathname]);

  // Stili inline per effetto liquid glass
  const styles: Record<string, any> = {
    footer: {
      '--background': 'transparent',
      zIndex: 1000
    },
    container: {
      padding: '12px 16px',
      background: 'transparent',
      position: 'relative',
      isolation: 'isolate'
    },
    tabBarWrapper: {
      position: 'relative',
      borderRadius: '28px'
    } as CSSProperties,
    tabBarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRadius: '50px',
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.5),
        inset 0 1px 1px rgba(255, 255, 255, 0.1),
        inset 0 -1px 1px rgba(0, 0, 0, 0.2)
      `,
      // border: '1px solid rgba(255, 255, 255, 0.08)',
      zIndex: 0
    } as CSSProperties,
    dropletContainer: {
      position: 'absolute',
      top: '0',
      left: 0,
      width: '33.333%',
      height: '68px',
      pointerEvents: 'none',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 8px',
      willChange: 'transform'
    } as CSSProperties,
    tabBar: {
      '--background': 'transparent',
      borderRadius: '28px',
      overflow: 'visible',
      height: '68px',
      '--border': 'none',
      position: 'relative',
      display: 'flex',
      background: 'transparent',
      zIndex: 2
    } as CSSProperties,
    droplet: {
      width: '100%',
      // maxWidth: '80px',
      height: '52px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '26px',
      boxShadow: 'none'
    } as CSSProperties,
    tabButton: {
      '--color': 'var(--ion-color-light)',
      '--color-selected': 'var(--ion-color-light)',
      position: 'relative',
      zIndex: 20,
      flex: 1,
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
      fontSize: '24px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'var(--ion-color-light)'
    } as CSSProperties,
    labelStyles: {
      fontSize: '11px',
      fontWeight: 500,
      marginTop: '6px',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      color: 'var(--ion-color-light)'
    } as CSSProperties
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
          <div style={styles.tabBarWrapper} key="tab-bar-wrapper">

            {/* Background glassmorphism layer */}
            <div style={styles.tabBarBackground} />

            {/* 🫧 Goccia animata che si sposta dietro al tab selezionato */}
            <div
              ref={dropletRef}
              style={styles.dropletContainer as any}
            >
              <div style={styles.droplet} />
            </div>

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
                  style={styles.iconStyles}
                />
                <IonLabel style={styles.labelStyles}>
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
                  style={styles.iconStyles}
                />
                <IonLabel style={styles.labelStyles}>
                  Workout
                </IonLabel>
              </IonTabButton>

              {/* Tab Profile */}
              <IonTabButton
                tab="profile"
                onClick={() => history.push(ROUTES.PUBLIC.PROFILE)}
                selected={location.pathname === ROUTES.PUBLIC.PROFILE}
                style={styles.tabButton as any}
              >
                <IonIcon
                  icon={location.pathname === ROUTES.PUBLIC.PROFILE ? person : personOutline}
                  style={styles.iconStyles}
                />
                <IonLabel style={styles.labelStyles}>
                  Profilo
                </IonLabel>
              </IonTabButton>

            </IonTabBar>
          </div>
        </div>
      </IonFooter>
    </>
  );
};

export default TabBar;
