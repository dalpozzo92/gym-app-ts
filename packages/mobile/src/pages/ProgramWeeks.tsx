import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IonText,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonList,
  IonItem,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonSkeletonText,
  IonRefresher,
  IonRefresherContent,
  IonRippleEffect,
  IonAccordion,
  IonAccordionGroup,
  IonThumbnail,
  IonToast,
  IonListHeader,
  IonChip,
  IonFab,
  IonFabButton,
  IonSpinner,
  useIonViewWillEnter
} from '@ionic/react';
import {
  timeOutline,
  barbellOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  informationCircleOutline,
  calendarOutline,
  personOutline,
  arrowRedoOutline
} from 'ionicons/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useProgram } from '@/contexts/ProgramContext';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContentWithMotion from '@/components/MotionPage';
import { useHistory } from 'react-router-dom';
import CircularProgress from '@/components/CircularProgress';
import LiquidGlassModal from '@/components/LiquidGlassModal';
import { buildRoute } from '@/routes';
import { useProgramDays } from '@/hooks/useProgram';
import { useWeekWorkoutExercises, useWorkoutDayExercises } from '@/hooks/useWorkout';
import { completeWeek } from '@/api/workout';

// ============================================
// WeekChip Component
// ============================================
interface WeekChipProps {
  weekData: any;
  isSelected: boolean;
  onClick: () => void;
}

const WeekChip: React.FC<WeekChipProps> = ({ weekData, isSelected, onClick }) => {
  const progress = weekData.progress || 0;

  return (
    <motion.div
      className="ion-activatable week-chip-wrapper"
      onClick={onClick}
      animate={{
        scale: isSelected ? 1.2 : 1,
        y: isSelected ? -2 : 0
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        position: 'relative',
        width: '50px',
        height: '50px',
        margin: '8px',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        cursor: 'pointer',
        borderRadius: '50%'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        <CircularProgress
          percentage={progress}
          size={50}
          strokeWidth={3}
          color='progressColor'
          backgroundColor={isSelected ? 'rgba(var(--ion-color-primary-rgb), 0.2)' : 'rgba(var(--ion-color-medium-rgb), 0.1)'}
          showText={false}
          duration={1}
        />

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isSelected ? 'var(--ion-select-color)' : 'var(--ion-background-color)',
            color: isSelected ? 'var(--ion-text-color)' : 'var(--ion-select-color)',
            fontWeight: isSelected ? 'bold' : '500',
            fontSize: '0.75rem',
            boxShadow: isSelected ? '0 2px 8px rgba(var(--ion-color-primary-rgb), 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            zIndex: 2
          }}
        >
          W{weekData.week_number}
        </div>
      </div>

      <IonRippleEffect />
    </motion.div>
  );
};

// ============================================
// ProgramDay Component - Con Preload
// ============================================
interface ProgramDayProps {
  program_day: any;
  displayDayNumber: number;
  onClickDay: (id_program_day: number) => void;
  onClickExercise: (id_program_day: number, id_workout_day_exercise: number) => void;
  isOpen: boolean;
  preloadedExercises?: any[] | null;
  progressOverride?: number;
  exerciseProgressOverrides?: Record<number, number>;
}

const ProgramDay: React.FC<ProgramDayProps> = ({
  program_day,
  displayDayNumber,
  onClickDay,
  onClickExercise,
  isOpen,
  preloadedExercises = null,
  progressOverride,
  exerciseProgressOverrides = {}
}) => {
  console.log('🔍 [ProgramDay] Render:', {
    id_program_day: program_day.id_program_day,
    displayDayNumber,
    name: program_day.name,
    isOpen,
    hasPreloaded: !!preloadedExercises
  });

  const shouldFetch = isOpen && !preloadedExercises;

  const {
    data: workoutDayExercisesData,
    loading: isExercisesLoading,
    error: exercisesError
  } = useWorkoutDayExercises(shouldFetch ? program_day.id_program_day : null);

  const workout_day_exercises = useMemo(() => {
    if (preloadedExercises) {
      console.log('✅ [ProgramDay] Uso dati precaricati');
      return preloadedExercises;
    }

    return (workoutDayExercisesData as any)?.workout_day_exercises || [];
  }, [preloadedExercises, workoutDayExercisesData]);

  // ✅ Usa progress override se disponibile
  const actualProgress = progressOverride !== undefined ? progressOverride : (program_day.progress || 0);

  return (
    <IonCard>
      <IonAccordion className="bg-accordion" value={`day-${program_day.id_program_day}`}>
        <IonItem slot="header" lines="none" className="custom-accordion-header">
          <IonGrid className="ion-no-padding">
            <IonRow className="ion-align-items-center">
              <IonCol size="auto" className="ion-padding-end">
                <IonThumbnail style={{
                  '--size': '40px',
                  '--border-radius': 'var(--app-border-radius-md)',
                  background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IonIcon
                    icon={barbellOutline}
                    color="primary"
                    style={{ fontSize: '1.5rem' }}
                  />
                </IonThumbnail>
              </IonCol>

              <IonCol>
                <IonText>
                  <h2 className="fs-large fw-bold ion-no-margin">
                    Giorno {displayDayNumber}
                  </h2>
                  <p className="ion-no-margin text-medium" style={{ fontSize: '0.875rem' }}>
                    {program_day.name || ''}
                  </p>
                </IonText>
              </IonCol>

              <IonCol size="auto">
                <CircularProgress
                  percentage={actualProgress}
                  size={40}
                  strokeWidth={3}
                  color='progressColor'
                  showText={true}
                  duration={2}
                />
              </IonCol>
            </IonRow>

            <IonRow className="ion-margin-top ion-align-items-center">
              <IonCol>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <IonBadge style={{
                    '--background': 'rgba(var(--ion-color-medium-rgb), 0.15)',
                    '--color': 'var(--ion-color-medium)',
                    fontSize: '0.7rem'
                  }}>
                    <IonIcon icon={timeOutline} style={{ marginRight: '4px', fontSize: '12px' }} />
                    {program_day.duration_workout || 60} min
                  </IonBadge>

                  <IonBadge style={{
                    '--background': 'rgba(var(--ion-color-medium-rgb), 0.15)',
                    '--color': 'var(--ion-color-medium)',
                    fontSize: '0.7rem'
                  }}>
                    <IonIcon icon={barbellOutline} style={{ marginRight: '4px', fontSize: '12px' }} />
                    {program_day.exercise_count || 0} esercizi
                  </IonBadge>
                </div>
              </IonCol>

              <IonCol size="auto">
                <IonButton
                  fill="clear"
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickDay(program_day.id_program_day);
                  }}
                  style={{
                    '--padding-start': '8px',
                    '--padding-end': '8px',
                    fontSize: '0.75rem'
                  }}
                >
                  Apri
                  <IonIcon icon={arrowForwardOutline} size="small" style={{ marginLeft: '4px' }} />
                </IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonItem>

        <div slot="content">
          {(isExercisesLoading && !preloadedExercises) ? (
            <div className="ion-padding">
              <IonSkeletonText animated style={{ height: '20px', width: '60%' }} />
              <IonSkeletonText animated style={{ height: '16px', width: '40%', marginTop: '8px' }} />
            </div>
          ) : exercisesError ? (
            <div className="ion-padding ion-text-center">
              <IonText color="danger">
                <p>Errore caricamento esercizi</p>
              </IonText>
            </div>
          ) : workout_day_exercises.length > 0 ? (
            <IonList lines="full" className="exercise-list">
              {workout_day_exercises.map((workout_day_exercise: any) => {
                // ✅ Usa progress override se disponibile
                const exerciseProgress = exerciseProgressOverrides[workout_day_exercise.id_workout_day_exercise] !== undefined
                  ? exerciseProgressOverrides[workout_day_exercise.id_workout_day_exercise]
                  : (workout_day_exercise.progress || 0);

                return (
                  <IonItem
                    key={`exercise-${workout_day_exercise.id_workout_day_exercise}`}
                    button
                    detail={false}
                    onClick={() => {
                      console.log('📍 [ProgramDay] Click esercizio:', {
                        id_program_day: program_day.id_program_day,
                        id_workout_day_exercise: workout_day_exercise.id_workout_day_exercise
                      });
                      onClickExercise(
                        program_day.id_program_day,
                        workout_day_exercise.id_workout_day_exercise
                      );
                    }}
                    className="exercise-item"
                    lines="full"
                  >
                    <IonGrid className="ion-no-padding ion-padding-vertical">
                      <IonRow className="ion-align-items-center">
                        <IonCol size="auto" className="ion-padding-end">
                          <CircularProgress
                            percentage={exerciseProgress}
                            size={36}
                            strokeWidth={3}
                            color='progressColor'
                            showText={true}
                          />
                        </IonCol>

                        <IonCol>
                          <IonText>
                            <h3 className="fs-medium">
                              {workout_day_exercise.exercise_name}
                            </h3>
                          </IonText>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                            {(() => {
                              // ✅ Raggruppa le serie per reps_min e reps_max uguali
                              const sets = workout_day_exercise.workout_exercise_sets || [];
                              const groupedSets: Record<string, number> = {};

                              sets.forEach((set: any) => {
                                const repsMin = set.reps_min || 0;
                                const repsMax = set.reps_max || repsMin;
                                const key = `${repsMin}-${repsMax}`;
                                groupedSets[key] = (groupedSets[key] || 0) + 1;
                              });

                              // ✅ Crea un chip per ogni gruppo
                              return Object.entries(groupedSets).map(([key, count]) => {
                                const [repsMin, repsMax] = key.split('-').map(Number);
                                return (
                                  <IonBadge
                                    key={key}
                                    style={{
                                      '--background': 'rgba(var(--ion-color-primary-rgb), 0.15)',
                                      '--color': 'var(--ion-contrast-color)',
                                      fontSize: '0.7rem'
                                    }}
                                  >
                                    {count} × {repsMin}
                                    {repsMax && repsMax !== repsMin ? `-${repsMax}` : ''} rip
                                  </IonBadge>
                                );
                              });
                            })()}
                          </div>
                        </IonCol>

                        <IonCol size="auto">
                          {exerciseProgress === 1 ? (
                            <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '24px' }} />
                          ) : (
                            <IonIcon icon={arrowForwardOutline} color="primary" style={{ fontSize: '20px' }} />
                          )}
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </IonItem>
                );
              })}
            </IonList>
          ) : (
            <div className="ion-padding ion-text-center">
              <IonText color="medium">
                <p>Nessun esercizio disponibile</p>
              </IonText>
            </div>
          )}
        </div>
      </IonAccordion>
    </IonCard>
  );
};

// ============================================
// ProgramWeeks Main Component
// ============================================
const ProgramWeeks: React.FC = () => {
  const history = useHistory();

  // ✅ Usa il context globale per programma e settimane
  const {
    activeProgram,
    program_weeks,
    activeWeek: initialWeek, // Active week is the "current progress" week
    viewedWeek,             // Viewed week is the one user is looking at
    setViewedWeek,
    expandedDayIds,         // Expanded accordions state
    setExpandedDayIds,
    isLoading: isProgramLoading,
    error: programError,
    refetchProgram
  } = useProgram();

  const [direction, setDirection] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isCompleteWeekModalOpen, setIsCompleteWeekModalOpen] = useState<boolean>(false);
  const [isCompletingWeek, setIsCompletingWeek] = useState<boolean>(false);

  // Local ref for DOM elements
  const accordionGroupRef = useRef<HTMLIonAccordionGroupElement>(null);
  const weeksScrollContainerRef = useRef<HTMLDivElement>(null);

  // State locale per progress aggiornati (questo è effimero e può restare locale, o spostato in context se necessario, ma per ora il focus è la navigazione)
  const [progressOverrides, setProgressOverrides] = useState<{
    exercises: Record<number, number>;
    days: Record<number, number>;
  }>({
    exercises: {},
    days: {}
  });

  // ✅ Inizializza viewedWeek se non presente nel context (fallback)
  useEffect(() => {
    if (initialWeek && viewedWeek === null) {
      setViewedWeek(initialWeek);
    }
  }, [initialWeek, viewedWeek, setViewedWeek]);

  // ✅ Refetch quando la pagina diventa visibile (es. tornando indietro da ExerciseDetail)
  // NOTA: Rimosso refetch automatico per evitare chiamate multiple.
  // I dati vengono già aggiornati dal Context e dal pull-to-refresh.
  useIonViewWillEnter(() => {
    // Nessun refetch automatico - usa pull-to-refresh se necessario
  });

  // ✅ Auto-scroll alla settimana selezionata (viewedWeek)
  useEffect(() => {
    if (viewedWeek !== null && weeksScrollContainerRef.current && program_weeks.length > 0) {
      const timer = setTimeout(() => {
        const container = weeksScrollContainerRef.current;
        if (!container) return;

        const selectedIndex = program_weeks.findIndex((w: any) => w.week_number === viewedWeek);
        if (selectedIndex === -1) return;

        // Ogni chip: 50px width + 16px margin (8px left + 8px right)
        const chipWidth = 66;
        const chipPosition = selectedIndex * chipWidth;

        // Calcola lo scroll per centrare il chip
        const containerWidth = container.offsetWidth;
        const scrollPosition = chipPosition - (containerWidth / 2) + (chipWidth / 2);

        container.scrollTo({
          left: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [viewedWeek, program_weeks]);

  const selectedWeekData = viewedWeek ? program_weeks.find((w: any) => w.week_number === viewedWeek) : null;

  const {
    data: program_days,
    loading: isDaysLoading,
    error: daysError
  } = useProgramDays((selectedWeekData as any)?.id_program_week || null);

  const visibleProgramDays = useMemo(() => {
    if (!program_days) return [];

    return (program_days as any[])
      .filter((day: any) => (day.exercise_count || 0) > 0)
      .map((day: any, index: number) => ({
        ...day,
        displayDayNumber: index + 1
      }));
  }, [program_days]);

  // ✅ Listen for exercise progress updates
  useEffect(() => {
    const handleExerciseProgressUpdate = (e: any) => {
      const { exerciseId, progress } = e.detail;
      console.log('🔄 [ProgramWeeks] Exercise progress update:', exerciseId, progress);

      setProgressOverrides(prev => ({
        ...prev,
        exercises: {
          ...prev.exercises,
          [exerciseId]: progress
        }
      }));
    };

    window.addEventListener('exercise:progress:update', handleExerciseProgressUpdate as EventListener);
    return () => window.removeEventListener('exercise:progress:update', handleExerciseProgressUpdate as EventListener);
  }, []);

  const {
    data: weekExercisesData,
    error: weekExercisesError
  } = useWeekWorkoutExercises((selectedWeekData as any)?.id_program_week || null);

  // ✅ Fix loading check: usa viewedWeek
  const isLoading = isProgramLoading || viewedWeek === null;
  const error = programError || daysError || weekExercisesError;



  const handleRefresh = useCallback(async (event?: CustomEvent) => {
    try {
      await refetchProgram();
      setToastMessage('Dati aggiornati!');
      setShowToast(true);
    } catch (err) {
      setToastMessage('Errore durante l\'aggiornamento');
      setShowToast(true);
    } finally {
      if (event) event.detail.complete();
    }
  }, [refetchProgram]);

  const selectWeek = useCallback((weekNumber: number) => {
    // ✅ Non fare nulla se clicchi sulla settimana già selezionata
    if (weekNumber === viewedWeek) return;

    setDirection(weekNumber > (viewedWeek || 0) ? 1 : -1);
    setViewedWeek(weekNumber);
    // ✅ Resetta accordion quando cambi settimana, per pulizia UI
    setExpandedDayIds([]);

    // ✅ Reset progress override quando cambio settimana
    setProgressOverrides({
      exercises: {},
      days: {}
    });
  }, [viewedWeek, setViewedWeek, setExpandedDayIds]);

  const handleAccordionChange = useCallback((event: CustomEvent) => {
    console.log('🔍 [ProgramWeeks] Accordion event:', event.detail);

    const value = event.detail.value;
    const accordionValues = Array.isArray(value) ? value : (value ? [value] : []);

    console.log('🔍 [ProgramWeeks] Accordion values:', accordionValues);

    const openDayIds = accordionValues
      .map((id: string) => {
        const match = id.toString().match(/day-(\d+)/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(Boolean) as number[];

    console.log('🔍 [ProgramWeeks] IDs aperti salvati in context:', openDayIds);

    setExpandedDayIds(openDayIds);
  }, [setExpandedDayIds]);

  const handleClickDay = useCallback((id_program_day: number) => {
    console.log('📍 [handleClickDay] Navigazione con id_program_day:', id_program_day);
    history.push(buildRoute.exerciseDetail(id_program_day));
  }, [history]);

  const handleClickExercise = useCallback((id_program_day: number, id_workout_day_exercise: number) => {
    console.log('📍 [handleClickExercise] Navigazione con:', {
      id_program_day,
      id_workout_day_exercise
    });
    history.push(buildRoute.exerciseDetail(id_program_day, id_workout_day_exercise));
  }, [history]);

  // ✅ Determina se mostrare il pulsante "Completa settimana"
  const canCompleteWeek = useMemo(() => {
    if (!viewedWeek || !program_weeks.length) return false;

    // Trova la settimana con week_number massimo
    const maxWeekNumber = Math.max(...program_weeks.map((w: any) => w.week_number));

    // Mostra solo se la settimana selezionata è l'ultima
    return viewedWeek === maxWeekNumber;
  }, [viewedWeek, program_weeks]);

  // ✅ Completa effettivamente la settimana (chiamata API)
  const handleConfirmCompleteWeek = useCallback(async () => {
    if (!selectedWeekData?.id_program_week) return;

    setIsCompletingWeek(true);
    setIsCompleteWeekModalOpen(false);

    try {
      const result = await completeWeek(selectedWeekData.id_program_week as number);
      console.log('✅ Settimana completata:', result);

      // Ricarica i dati del programma
      await refetchProgram();

      // Seleziona la nuova settimana
      setViewedWeek(result.new_week_number);

      setToastMessage('Settimana completata! Nuova settimana creata.');
      setShowToast(true);

    } catch (err: any) {
      console.error('❌ Errore completamento settimana:', err);
      setToastMessage(err.message || 'Errore nel completamento della settimana');
      setShowToast(true);
    } finally {
      setIsCompletingWeek(false);
    }
  }, [selectedWeekData, refetchProgram, setViewedWeek]);

  // ✅ Gestisce click sul pulsante "Completa settimana"
  const handleCompleteWeekClick = useCallback(() => {
    // Usa il progress della settimana selezionata (calcolato dal backend in getProgramWeeks)
    const currentWeekData = program_weeks.find((w: any) => w.week_number === viewedWeek);
    const currentProgress = Number(currentWeekData?.progress || 0);

    if (currentProgress < 100) {
      // Settimana non completata - mostra modal di conferma
      setIsCompleteWeekModalOpen(true);
    } else {
      // Settimana completata - procedi direttamente
      handleConfirmCompleteWeek();
    }
  }, [program_weeks, viewedWeek, handleConfirmCompleteWeek]);

  useEffect(() => {
    if (error) {
      setToastMessage('Errore nel caricamento dei dati');
      setShowToast(true);
    }
  }, [error]);

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0
    })
  };

  return (
    <>
      <IonFab
        vertical="top"
        horizontal="end"
        slot="fixed"
        style={{
          position: 'fixed',
          top: 'calc(var(--safe-area-top, 0px) + 50px)',
          right: '16px',
          zIndex: 999
        }}
      >
        <IonFabButton size="small" onClick={() => setIsInfoModalOpen(true)}>
          <IonIcon icon={informationCircleOutline} />
        </IonFabButton>
      </IonFab>

      <LiquidGlassModal
        isOpen={isInfoModalOpen}
        onDidDismiss={() => setIsInfoModalOpen(false)}
        title="Dettagli Programma"
        initialBreakpoint={0.5}
        breakpoints={[0, 0.5, 0.75]}
      >
        <IonText>
          <h1 className="fw-bold fs-xlarge ion-no-margin">
            {(activeProgram as any)?.description || "Programma"}
          </h1>
        </IonText>

        <IonCard>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={calendarOutline} color="primary" slot="start" />
                <IonLabel>
                  <h3 className="fw-medium">Durata</h3>
                  <p>{(activeProgram as any)?.duration_workout || "8"} settimane totali</p>
                </IonLabel>
              </IonItem>

              <IonItem>
                <IonIcon icon={personOutline} color="primary" slot="start" />
                <IonLabel>
                  <h3 className="fw-medium">Giorni settimanali</h3>
                  <p>{(activeProgram as any)?.number_days_workout || "6"} giorni</p>
                </IonLabel>
              </IonItem>

              <IonItem>
                <IonIcon icon={barbellOutline} color="primary" slot="start" />
                <IonLabel>
                  <h3 className="fw-medium">Programma numero</h3>
                  <p>#{(activeProgram as any)?.number_program || "1"}</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardContent>
            <IonText>
              <h3 className="fw-bold fs-medium ion-margin-bottom">Statistiche</h3>
            </IonText>
            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="6">
                  <div className="ion-text-center">
                    <IonText color="primary">
                      <h2 className="fw-bold ion-no-margin">{program_weeks.length || "0"}</h2>
                    </IonText>
                    <IonText color="medium">
                      <p className="ion-no-margin fs-small">Settimane</p>
                    </IonText>
                  </div>
                </IonCol>
                <IonCol size="6">
                  <div className="ion-text-center">
                    <IonText color="primary">
                      <h2 className="fw-bold ion-no-margin">
                        {visibleProgramDays.reduce((total: number, day: any) => total + (day.exercise_count || 0), 0)}
                      </h2>
                    </IonText>
                    <IonText color="medium">
                      <p className="ion-no-margin fs-small">Esercizi</p>
                    </IonText>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonCard>
      </LiquidGlassModal>

      {/* Modal di conferma completamento settimana */}
      <LiquidGlassModal
        isOpen={isCompleteWeekModalOpen}
        onDidDismiss={() => setIsCompleteWeekModalOpen(false)}
        title="Attenzione"
        initialBreakpoint={0.4}
        breakpoints={[0, 0.4, 0.6]}
      >
        <IonText>
          <p style={{ fontSize: '0.95rem', marginTop: '12px' }}>
            La settimana attuale non è completata al 100%.
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--ion-color-medium)' }}>
            Vuoi comunque procedere con la creazione della nuova settimana?
          </p>
        </IonText>

        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <IonButton
            expand="block"
            fill="outline"
            onClick={() => setIsCompleteWeekModalOpen(false)}
            style={{ flex: 1 }}
          >
            Annulla
          </IonButton>
          <IonButton
            expand="block"
            color="primary"
            onClick={handleConfirmCompleteWeek}
            style={{ flex: 1 }}
          >
            Continua
          </IonButton>
        </div>
      </LiquidGlassModal>

      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent />
      </IonRefresher>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
        color={error ? "danger" : "success"}
      />

      <ContentWithMotion
        isLoading={isLoading}
        loadingMessage="Caricamento programma..."
        errorMessage="Errore nel caricamento."
        loaderSize="small"
        loaderSpeed={1}
      >
        <AnimatedBackground variant="linee-move" intensity="light" height="250px" position="fixed" speed={3} fadeInDuration={2000} />


        <div className="page-header ion-padding-horizontal ion-padding-top">
          <IonText>
            <h1 className="fw-bold fs-xlarge">
              {(activeProgram as any)?.description || "Programma"}
            </h1>
          </IonText>

          {viewedWeek && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginTop: '12px',
              marginBottom: '20px'
            }}>
              <IonChip color="primary" outline={true}>
                <IonIcon icon={barbellOutline} />
                <IonLabel>Settimana {viewedWeek}</IonLabel>
              </IonChip>
            </div>
          )}
        </div>

        <div
          ref={weeksScrollContainerRef}
          className="weeks-scroll-container"
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isProgramLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={`skeleton-week-${i}`} style={{ display: 'inline-block', flexShrink: 0 }}>
                <div style={{ width: '50px', height: '50px', margin: '8px' }}>
                  <IonSkeletonText animated style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%'
                  }} />
                </div>
              </div>
            ))
          ) : program_weeks.length > 0 ? (
            program_weeks.map((weekData: any) => {
              const isSelectedWeek = viewedWeek !== null && viewedWeek === weekData.week_number;

              return (
                <WeekChip
                  key={`week-${weekData.week_number}`}
                  weekData={weekData}
                  isSelected={isSelectedWeek}
                  onClick={() => selectWeek(weekData.week_number)}
                />
              );
            })
          ) : (
            <IonText color="medium" className="ion-text-center ion-padding">
              Nessuna settimana disponibile
            </IonText>
          )}
        </div>

        {viewedWeek && (
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={viewedWeek}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <IonListHeader style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingRight: '16px'
              }}>
                <IonLabel>
                  <IonText className="fw-bold text-medium">Settimana {viewedWeek}</IonText>
                </IonLabel>

                {/* Pulsante Completa Settimana */}
                {canCompleteWeek && (
                  <IonButton
                    size="small"
                    color="success"
                    fill="solid"
                    onClick={handleCompleteWeekClick}
                    disabled={isCompletingWeek}
                    style={{
                      '--border-radius': '24px',
                      '--padding-start': '12px',
                      '--padding-end': '12px',
                      fontWeight: '600',
                      height: '32px'
                    }}
                  >
                    {isCompletingWeek ? (
                      <>
                        <IonSpinner name="crescent" style={{ width: '16px', height: '16px' }} />
                      </>
                    ) : (
                      <>
                        <IonIcon icon={arrowRedoOutline} slot="start" />
                        Nuova settimana
                      </>
                    )}
                  </IonButton>
                )}
              </IonListHeader>

              {isDaysLoading && visibleProgramDays.length === 0 ? (
                // ✅ Skeleton durante il caricamento iniziale dei giorni
                <div className="ion-padding">
                  {Array(4).fill(0).map((_, i) => (
                    <IonCard key={`skeleton-day-${i}`}>
                      <IonCardContent>
                        <IonSkeletonText animated style={{ height: '24px', width: '60%', marginBottom: '8px' }} />
                        <IonSkeletonText animated style={{ height: '16px', width: '40%' }} />
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
              ) : visibleProgramDays.length > 0 ? (
                <IonAccordionGroup
                  ref={accordionGroupRef}
                  multiple={true}
                  value={expandedDayIds.map(id => `day-${id}`)}
                  onIonChange={handleAccordionChange}
                >
                  {/* ✅ Usa dati diretti dal backend - più semplice e affidabile */}
                  {visibleProgramDays && visibleProgramDays.map((program_day: any) => (
                    <ProgramDay
                      key={`day-${program_day.id_program_day}`}
                      program_day={program_day}
                      displayDayNumber={program_day.displayDayNumber || 1}
                      onClickExercise={handleClickExercise}
                      onClickDay={handleClickDay}
                      isOpen={expandedDayIds.includes(program_day.id_program_day)}
                      preloadedExercises={(weekExercisesData as any)?.week_exercises?.[program_day.id_program_day]}
                      progressOverride={progressOverrides.days[program_day.id_program_day]}
                      exerciseProgressOverrides={progressOverrides.exercises}
                    />
                  ))}
                </IonAccordionGroup>
              ) : (
                <div className="ion-padding ion-text-center">
                  <IonText color="medium">
                    <p>Nessun giorno di allenamento per questa settimana</p>
                  </IonText>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </ContentWithMotion>
    </>
  );
};

export default ProgramWeeks;
