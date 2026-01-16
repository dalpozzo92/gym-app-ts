// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonChip,
  IonTextarea,
  IonBadge,
  useIonPicker,
  createAnimation,
  IonPicker,
  IonPickerColumn,
  IonPickerColumnOption,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonInput,
  IonPopover
} from '@ionic/react';
import type { PickerColumn } from '@ionic/react';
import {
  closeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  playOutline,
  timerOutline,
  stopOutline,
  cloudDoneOutline,
  cloudUploadOutline,
  barbellOutline,
  informationCircleOutline,
  chatbubbleOutline,
  statsChartOutline,
  rocketOutline,
  sadOutline,
  happyOutline,
  flashOutline,
  trendingUpOutline,
  trendingDownOutline,
  removeOutline,
  createOutline,
  documentTextOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import type { SetGroup, WorkoutExerciseSet } from '@/types/workout';
import { useTimer } from '@/contexts/TimerContext';
// import '@/styles/exercise-inputs.css';

type SetDetailBottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  setGroup: SetGroup | null;
  onUpdateSet: (exerciseId: number, setNumber: number, updates: Partial<WorkoutExerciseSet>) => void;
  onOpenExerciseInfo: (exerciseId: number) => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
  saveStatus?: string;
  previousSetsData?: any[];
  initialExerciseIndex?: number;
};

/**
 * Bottom Sheet per gestione dettagli serie
 * Layout compatto senza scroll, footer navigation fixed
 */
const SetDetailBottomSheet: React.FC<SetDetailBottomSheetProps> = ({
  isOpen,
  onClose,
  setGroup,
  onUpdateSet,
  onOpenExerciseInfo,
  onNavigatePrevious,
  onNavigateNext,
  hasPrevious,
  hasNext,
  saveStatus = 'Salvato',
  previousSetsData = [],
  initialExerciseIndex = 0
}) => {
  if (!setGroup) return null;

  const { groupType, setNumber, exercises, restTime } = setGroup;
  const contentRef = useRef<HTMLDivElement>(null);

  // State per gestione dati
  const [exercisesState, setExercisesState] = useState<Array<{
    exerciseId: number;
    setId: string;
    load: number;
    reps: number;
    rpe: number | null;
    execution: number | null;
    notes: string;
  }>>([]);

  // State per UI
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [popoverPersonalOpen, setPopoverPersonalOpen] = useState(false);
  const [popoverCoachOpen, setPopoverCoachOpen] = useState(false);
  const [activeFooterTab, setActiveFooterTab] = useState<'dati' | 'info' | 'chat' | 'storico'>('dati');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedSetNumber, setDisplayedSetNumber] = useState(setNumber);

  // Refs per animazioni
  const contentWrapperRef = useRef<HTMLDivElement>(null);

  // Timer Context
  const { getTimerState, startTimer, activeTimer, resetTimer } = useTimer();
  const firstExerciseId = setGroup?.exercises[0]?.exercise.id_workout_day_exercise;
  const timerId = firstExerciseId ? `set-timer-${firstExerciseId}-${setNumber}` : '';
  const timerState = timerId ? getTimerState(timerId) : null;
  const isTimerActive = activeTimer?.timerId === timerId;
  const isAnyTimerActive = activeTimer !== null;

  // CSS per segment button border-radius e popover blur
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ion-segment::part(indicator),
      ion-segment::part(indicator-background) {
        border-radius: 24px !important;
        border: 1px solid var(--ion-color-primary) !important;
        box-sizing: border-box !important;
      }
      
      .segment-button-checked {
        --indicator-box-shadow: none !important;
        border-radius: 24px !important;
        overflow: hidden !important;
      }
      
      ion-segment-button {
        --border-radius: 24px !important;
      }

      ion-popover::part(content) {
        background: rgba(var(--ion-background-color-rgb), 0.7) !important;
        backdrop-filter: blur(20px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
        border-radius: 24px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.85;
          transform: scale(0.98);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Inizializza state quando cambia setGroup
  useEffect(() => {
    if (setGroup) {
      const newData = exercises.map(({ exercise, set }) => ({
        exerciseId: exercise.id_workout_day_exercise,
        setId: set.setId,
        load: set.actual_load || 0,
        reps: set.actual_reps || 0,
        rpe: set.rpe || null,
        execution: set.execution_rating || null,
        notes: set.notes || ''
      }));

      // Se il setNumber è cambiato, gestiamo l'animazione
      if (setNumber !== displayedSetNumber && !isTransitioning) {
        setIsTransitioning(true);

        // Prepara i nuovi dati immediatamente (ma non li mostriamo ancora)
        const pendingData = newData;
        const pendingSetNumber = setNumber;

        // Animazione di uscita
        if (contentWrapperRef.current) {
          const exitAnimation = createAnimation()
            .addElement(contentWrapperRef.current)
            .duration(200)
            .easing('ease-in')
            .fromTo('transform', 'translateX(0)', slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)')
            .fromTo('opacity', '1', '0');

          exitAnimation.play().then(() => {
            // Dopo l'uscita, aggiorniamo i dati (che sono già pronti)
            setExercisesState(pendingData);
            setDisplayedSetNumber(pendingSetNumber);

            // Aspetta il prossimo frame per assicurarsi che React abbia renderizzato i nuovi dati
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // Animazione di entrata (parte solo dopo che i dati sono stati renderizzati)
                if (contentWrapperRef.current) {
                  contentWrapperRef.current.style.transform = slideDirection === 'left' ? 'translateX(100%)' : 'translateX(-100%)';
                  contentWrapperRef.current.style.opacity = '0';

                  const enterAnimation = createAnimation()
                    .addElement(contentWrapperRef.current)
                    .duration(200)
                    .easing('ease-out')
                    .fromTo('transform', slideDirection === 'left' ? 'translateX(100%)' : 'translateX(-100%)', 'translateX(0)')
                    .fromTo('opacity', '0', '1');

                  enterAnimation.play().then(() => {
                    setIsTransitioning(false);
                  });
                } else {
                  setIsTransitioning(false);
                }
              });
            });
          });
        } else {
          // Nessuna animazione, aggiorna direttamente
          setExercisesState(newData);
          setDisplayedSetNumber(setNumber);
          setIsTransitioning(false);
        }
      } else {
        // Prima apertura o stesso setNumber
        setExercisesState(newData);
        setDisplayedSetNumber(setNumber);
      }
    }
  }, [setGroup, setNumber]);

  // Timer per debounce
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedSave = useCallback((exerciseId: number, setNum: number, field: string, value: any) => {
    const key = `${exerciseId}-${setNum}-${field}`;

    if (timersRef.current[key]) {
      clearTimeout(timersRef.current[key]);
    }

    timersRef.current[key] = setTimeout(() => {
      onUpdateSet(exerciseId, setNum, { [field]: value });
      delete timersRef.current[key];
    }, 800);
  }, [onUpdateSet]);

  const updateValue = (index: number, field: 'load' | 'reps' | 'rpe' | 'execution' | 'notes', value: any) => {
    setExercisesState(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    const exerciseId = exercisesState[index].exerciseId;
    const mappedField = field === 'load' ? 'actual_load' : field === 'reps' ? 'actual_reps' : field === 'execution' ? 'execution_rating' : field;

    setHasPendingChanges(true);
    debouncedSave(exerciseId, setNumber, mappedField, value);

    setTimeout(() => {
      setHasPendingChanges(false);
    }, 1200);
  };

  // Handle swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (diff > swipeThreshold && hasNext) {
      // Swipe verso sinistra = vai avanti
      handleNavigateNext();
    } else if (diff < -swipeThreshold && hasPrevious) {
      // Swipe verso destra = vai indietro
      handleNavigatePrevious();
    }
  };

  const handleStartTimer = () => {
    // Se c'è un timer attivo per questa serie, non fare nulla
    if (isTimerActive) return;
    // Se c'è un altro timer attivo, non permettere di avviarne uno nuovo
    if (isAnyTimerActive && !isTimerActive) return;

    if (restTime && timerId) {
      startTimer(timerId, restTime);
      // Se c'è una serie successiva, passa automaticamente ad essa
      if (hasNext && onNavigateNext) {
        // Imposta la direzione dello swipe a sinistra (serie successiva)
        setSlideDirection('left');
        // Piccolo delay per permettere all'animazione del timer di iniziare
        setTimeout(() => {
          onNavigateNext();
        }, 300);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const getSaveIcon = () => {
    if (hasPendingChanges) {
      return <IonSpinner name="dots" style={{ width: '18px', height: '18px', color: '#f59e0b' }} />;
    }
    return <IonIcon icon={cloudDoneOutline} style={{ fontSize: '18px', color: '#0f9679' }} />;
  };

  // Navigation handlers con animazione
  const handleNavigatePrevious = () => {
    setSlideDirection('right');
    if (onNavigatePrevious) {
      onNavigatePrevious();
    }
  };

  const handleNavigateNext = () => {
    setSlideDirection('left');
    if (onNavigateNext) {
      onNavigateNext();
    }
  };


  // Logica Virtual Coach
  const getCoachSuggestion = (index: number) => {
    const state = exercisesState[index];
    const prevData = previousSetsData?.[setNumber - 1];

    if (!prevData) return null;

    const weightDiff = state.load - prevData.load;

    if (weightDiff > 0) {
      return {
        text: 'Hai ridotto il carico. Concentrati sulla tecnica',
        color: '#ef4444',
        icon: rocketOutline
      };
    } else if (weightDiff === 0) {
      return {
        text: 'Mantieni il peso e cerca di aumentare le ripetizioni',
        color: '#f59e0b',
        icon: rocketOutline
      };
    } else {
      return {
        text: 'Ottimo! Hai aumentato il carico!',
        color: '#0f9679',
        icon: rocketOutline
      };
    }
  };

  // Render content per il tab attivo
  const renderContent = () => {
    if (activeFooterTab !== 'dati') {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--app-spacing-lg)'
        }}>
          <IonIcon
            icon={activeFooterTab === 'info' ? informationCircleOutline : activeFooterTab === 'chat' ? chatbubbleOutline : statsChartOutline}
            style={{ fontSize: '48px', color: 'var(--ion-color-medium)', marginBottom: 'var(--app-spacing-md)' }}
          />
          <IonText color="medium" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
            {activeFooterTab === 'info' ? 'Info Esercizio' : activeFooterTab === 'chat' ? 'Chat Coach' : 'Storico'}
          </IonText>
          <IonText color="medium" style={{ fontSize: '0.75rem', marginTop: 'var(--app-spacing-sm)' }}>
            Funzionalità in arrivo
          </IonText>
        </div>
      );
    }

    const activeIndex = initialExerciseIndex || 0;
    const activeItem = exercises[activeIndex];

    if (!activeItem) return null;

    const { exercise, set } = activeItem;
    const index = activeIndex;

    const state = exercisesState[index];
    if (!state) return null;

    const prevData = previousSetsData?.find(d => d.exerciseId === exercise.id_workout_day_exercise);
    const coachSuggestion = getCoachSuggestion(index);

    return (
      <div
        ref={contentWrapperRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0
        }}
      >
        <div
          key={`${exercise.id_workout_day_exercise}-${displayedSetNumber}`}
          ref={contentRef}

          style={{
            padding: '10px 14px 0',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Nome Esercizio - Ancorato in alto */}
          <div style={{
            marginBottom: '8px',
            textAlign: 'left',
            flexShrink: 0
          }}>
            <IonText style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: '1.2',
              width: '100%',
              color: 'var(--ion-text-color)'
            }}>
              {exercise.exercise_name}
            </IonText>
          </div>

          {/* Spacer Flessibile */}
          <div style={{ flexGrow: 1 }} />

          {/* Controlli Ancorati in Basso */}
          <div style={{ flexShrink: 0 }}>

            {/* Pulsanti Note con Popover */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              {/* Note Personali */}
              <button
                id={`popover-personal-${index}`}
                onClick={() => setPopoverPersonalOpen(true)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '24px',
                  background: 'var(--ion-button-background)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <IonIcon icon={createOutline} style={{ fontSize: '16px', color: 'var(--ion-text-color)' }} />
                <IonText style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ion-text-color)' }}>Note</IonText>
                {state.notes && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--ion-color-warning)'
                  }} />
                )}
              </button>
              <IonPopover
                trigger={`popover-personal-${index}`}
                size="auto"
                isOpen={popoverPersonalOpen}
                onDidDismiss={() => setPopoverPersonalOpen(false)}
                style={{
                  '--background': 'rgba(var(--ion-background-color-rgb), 0.7)',
                  '--backdrop-filter': 'blur(20px) saturate(180%)',
                  '--box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
                  '--border-radius': '24px',
                  'padding': 'var(--app-spacing-md)'
                } as any}
              >
                <IonText className="ion-padding"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: 'var(--app-spacing-sm)',
                    color: 'var(--ion-text-color)'
                  }}>
                  Note Personali
                </IonText>
                <IonTextarea className="ion-padding"
                  value={state.notes}
                  onIonChange={(e) => updateValue(index, 'notes', e.detail.value || '')}
                  placeholder="Aggiungi nota..."
                  autoGrow={true}
                  rows={4}
                  style={{
                    borderRadius: 'var(--app-border-radius-md)',
                    fontSize: '0.75rem',
                    color: 'var(--ion-text-color)'
                  }}
                />
              </IonPopover>

              {/* Note Coach */}
              <button
                id={`popover-coach-${index}`}
                onClick={() => setPopoverCoachOpen(true)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '24px',
                  background: 'var(--ion-button-background)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <IonIcon icon={documentTextOutline} style={{ fontSize: '16px', color: 'var(--ion-text-color)' }} />
                <IonText style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--ion-text-color)' }}>Coach</IonText>
                {exercise.notes && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--ion-color-warning)'
                  }} />
                )}
              </button>
              <IonPopover
                trigger={`popover-coach-${index}`}
                size="auto"
                isOpen={popoverCoachOpen}
                onDidDismiss={() => setPopoverCoachOpen(false)}
                style={{
                  '--background': 'rgba(var(--ion-background-color-rgb), 0.7)',
                  '--backdrop-filter': 'blur(20px) saturate(180%)',
                  '--box-shadow': '0 8px 32px rgba(0, 0, 0, 0.3)',
                  '--border-radius': '24px',
                  'padding': 'var(--app-spacing-md)'
                } as any}
              >
                <IonText className="ion-padding"
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    display: 'block',
                    marginBottom: 'var(--app-spacing-sm)',
                    color: 'var(--ion-text-color)'
                  }}>
                  Note Coach
                </IonText>
                <IonTextarea className="ion-padding"
                  value={exercise.notes || ''}
                  placeholder="Nessuna nota dal coach"
                  disabled={true}
                  autoGrow={true}
                  rows={4}
                  style={{
                    borderRadius: 'var(--app-border-radius-md)',
                    fontSize: '0.75rem',
                    color: 'var(--ion-text-color)',
                    opacity: exercise.notes ? 1 : 0.6
                  }}
                />
              </IonPopover>
            </div>

            {/* Dati precedenti e progresso */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {prevData ? (
                <>
                  <div style={{
                    flex: 1,
                    padding: '6px 8px',
                    background: 'rgba(var(--ion-text-color-rgb), 0.05)',
                    borderRadius: '24px',
                    border: '1px solid rgba(var(--ion-text-color-rgb), 0.1)'
                  }}>
                    <IonText color="medium" style={{
                      fontSize: '0.55rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '2px',
                      letterSpacing: '0.3px'
                    }}>
                      Settimana Scorsa
                    </IonText>
                    <IonText style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                      {prevData.load} kg × {prevData.reps}
                    </IonText>
                  </div>

                  {state.load > 0 && state.reps > 0 && (() => {
                    const loadDiff = state.load - prevData.load;
                    const repsDiff = state.reps - prevData.reps;

                    // Calcola il progresso complessivo
                    let progressType: 'up' | 'down' | 'equal' = 'equal';
                    let progressText = '';
                    let progressIcon = removeOutline;
                    let progressColor = '#9ca3af';

                    if (loadDiff > 0 && repsDiff > 0) {
                      progressType = 'up';
                      progressText = `+${loadDiff}kg +${repsDiff}rep`;
                      progressIcon = trendingUpOutline;
                      progressColor = '#0f9679';
                    } else if (loadDiff > 0 && repsDiff === 0) {
                      progressType = 'up';
                      progressText = `+${loadDiff}kg`;
                      progressIcon = trendingUpOutline;
                      progressColor = '#0f9679';
                    } else if (loadDiff === 0 && repsDiff > 0) {
                      progressType = 'up';
                      progressText = `+${repsDiff}rep`;
                      progressIcon = trendingUpOutline;
                      progressColor = '#0f9679';
                    } else if (loadDiff < 0 && repsDiff < 0) {
                      progressType = 'down';
                      progressText = `${loadDiff}kg ${repsDiff}rep`;
                      progressIcon = trendingDownOutline;
                      progressColor = '#ef4444';
                    } else if (loadDiff < 0 && repsDiff === 0) {
                      progressType = 'down';
                      progressText = `${loadDiff}kg`;
                      progressIcon = trendingDownOutline;
                      progressColor = '#ef4444';
                    } else if (loadDiff === 0 && repsDiff < 0) {
                      progressType = 'down';
                      progressText = `${repsDiff}rep`;
                      progressIcon = trendingDownOutline;
                      progressColor = '#ef4444';
                    } else {
                      progressText = 'Mantenimento';
                    }

                    return (
                      <div style={{
                        flex: 1,
                        padding: '6px 8px',
                        background: `${progressColor}15`,
                        borderRadius: '24px',
                        border: `1px solid ${progressColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <IonIcon
                          icon={progressIcon}
                          style={{
                            fontSize: '16px',
                            color: progressColor,
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <IonText style={{
                            fontSize: '0.55rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '0',
                            color: progressColor,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            Progresso
                          </IonText>
                          <IonText style={{
                            fontSize: '0.8rem',
                            fontWeight: '700',
                            color: progressColor
                          }}>
                            {progressText}
                          </IonText>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                // Placeholder Nessun Dato
                <div style={{
                  flex: 1,
                  padding: '6px 8px',
                  background: 'rgba(var(--ion-text-color-rgb), 0.03)',
                  borderRadius: '24px',
                  border: '1px dashed rgba(var(--ion-text-color-rgb), 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '48px'
                }}>
                  <IonText color="medium" style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>
                    Nessun dato precedente
                  </IonText>
                </div>
              )}
            </div>

            {/* Virtual Coach Banner */}
            {coachSuggestion && (
              <div style={{
                padding: '6px 10px',
                // background: `${coachSuggestion.color}15`,
                borderRadius: '16px',
                // border: `1px solid ${coachSuggestion.color}40`,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <IonIcon icon={coachSuggestion.icon} style={{ fontSize: '14px', color: coachSuggestion.color, flexShrink: 0 }} />
                <IonText style={{ fontSize: '0.7rem', fontWeight: '600', flex: 1, lineHeight: '1.2' }}>
                  {coachSuggestion.text}
                </IonText>
              </div>
            )}

            {/* KG e REP - con spazio che si espande */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flex: 1 }}>
                <WeightPickerInput
                  label="KG"
                  value={state.load}
                  onChange={(val) => updateValue(index, 'load', val)}
                  min={0}
                  max={500}
                />
                <RepsPickerInput
                  label="REP"
                  value={state.reps}
                  onChange={(val) => updateValue(index, 'reps', val)}
                  min={0}
                  max={50}
                />
              </div>
            </div>

            {/* RPE e Tecnica separati ma sulla stessa riga */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '8px'
            }}>
              {/* RPE - Container separato - Stile Liquid Glass */}
              <div style={{
                flex: 1,
                backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '8px',
                border: '1px solid rgba(var(--ion-text-color-rgb), 0.05)'
              }}>
                <IonText color="medium" style={{
                  fontSize: '0.5rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '3px',
                  letterSpacing: '0.3px'
                }}>
                  RPE
                </IonText>
                <div style={{
                  display: 'flex',
                  position: 'relative'
                }}>
                  {[6, 7, 8, 9, 10].map(rpeVal => (
                    <button
                      key={rpeVal}
                      onClick={() => updateValue(index, 'rpe', rpeVal)}
                      style={{
                        flex: 1,
                        height: '26px',
                        borderRadius: '13px',
                        background: state.rpe === rpeVal ? 'var(--ion-color-primary)' : 'transparent',
                        color: state.rpe === rpeVal ? 'var(--ion-color-primary-contrast)' : 'var(--ion-text-color)',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        opacity: state.rpe === rpeVal ? 1 : 0.6
                      }}
                    >
                      {rpeVal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tecnica - Container separato - Stile Liquid Glass */}
              <div style={{
                flex: 1,
                backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '8px',
                border: '1px solid rgba(var(--ion-text-color-rgb), 0.05)'
              }}>
                <IonText color="medium" style={{
                  fontSize: '0.5rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '3px',
                  letterSpacing: '0.3px'
                }}>
                  Tecnica
                </IonText>
                <div style={{
                  display: 'flex',
                  position: 'relative'
                }}>
                  {[
                    { value: 1, icon: sadOutline, color: 'var(--ion-color-danger)' },
                    { value: 2, icon: happyOutline, color: 'var(--ion-color-warning)' },
                    { value: 3, icon: flashOutline, color: 'var(--ion-color-success)' }
                  ].map(tech => (
                    <button
                      key={tech.value}
                      onClick={() => updateValue(index, 'execution', tech.value)}
                      style={{
                        flex: 1,
                        height: '26px',
                        borderRadius: '13px',
                        background: state.execution === tech.value ? tech.color : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        opacity: state.execution === tech.value ? 1 : 0.4
                      }}
                    >
                      <IonIcon
                        icon={tech.icon}
                        style={{
                          fontSize: '18px',
                          color: state.execution === tech.value
                            ? 'var(--ion-color-white)'
                            : 'var(--ion-text-color)',
                          transition: 'color 0.2s'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Container per timer */}
            {restTime && restTime > 0 && (
              <div className="ion-display-flex ion-justify-content-center ion-align-items-center"
                style={{ paddingBottom: '20px', width: '100%' }}>

                <IonButton
                  onClick={handleStartTimer}
                  disabled={isAnyTimerActive && !isTimerActive}
                  mode="ios"
                  style={{
                    '--border-radius': '24px',
                    '--background': isTimerActive ? 'var(--ion-color-primary)' : 'rgba(var(--ion-color-primary-rgb), 0.5)',
                    '--box-shadow': 'none',
                    width: '120px',
                    height: '50px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <IonIcon
                      icon={isTimerActive ? timerOutline : playOutline}
                      style={{ fontSize: '18px', color: 'white' }}
                    />
                    <IonText style={{ color: 'white', fontSize: '0.85rem', fontWeight: '700' }}>
                      {isTimerActive ? '' : formatTime(restTime)}
                    </IonText>
                  </div>
                </IonButton>
              </div>
            )}
          </div>
        </div>


      </div>
    );
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={1}
      breakpoints={[0, 1]}
      canDismiss={true}
      style={{
        '--background': 'var(--ion-background-color)',
        '--border-radius': '32px',
        '--box-shadow': '0 -8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 9999
      }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ion-background-color)',
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'pan-y'
        } as React.CSSProperties}
      >
        {/* Header */}
        <div style={{
          padding: '10px 16px 0',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={handleNavigatePrevious}
                disabled={!hasPrevious}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  background: hasPrevious ? 'rgba(var(--ion-text-color-rgb), 0.08)' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: hasPrevious ? 'pointer' : 'not-allowed',
                  opacity: hasPrevious ? 1 : 0.3,
                  transition: 'all 0.2s'
                }}
              >
                <IonIcon icon={chevronBackOutline} style={{ fontSize: '20px', color: 'var(--ion-text-color)' }} />
              </button>

              <IonText style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                Serie {setNumber}
              </IonText>

              <button
                onClick={handleNavigateNext}
                disabled={!hasNext}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  background: hasNext ? 'rgba(var(--ion-text-color-rgb), 0.08)' : 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: hasNext ? 'pointer' : 'not-allowed',
                  opacity: hasNext ? 1 : 0.3,
                  transition: 'all 0.2s'
                }}
              >
                <IonIcon icon={chevronForwardOutline} style={{ fontSize: '20px', color: 'var(--ion-text-color)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Visualizzazione timer quando attivo */}
              {isAnyTimerActive && activeTimer && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'var(--ion-color-primary)',
                  borderRadius: '16px',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  <IonIcon icon={timerOutline} style={{ fontSize: '14px', color: 'white' }} />
                  <IonText style={{ fontSize: '0.75rem', fontWeight: '700', color: 'white' }}>
                    {formatTime(activeTimer.timeLeft)}
                  </IonText>
                  <button
                    onClick={() => resetTimer(activeTimer.timerId)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: '2px'
                    }}
                  >
                    <IonIcon icon={stopOutline} style={{ fontSize: '12px', color: 'white' }} />
                  </button>
                </div>
              )}
              {getSaveIcon()}
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '16px',
                  background: 'rgba(var(--ion-text-color-rgb), 0.08)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: '20px', color: 'var(--ion-text-color)' }} />
              </button>
            </div>
          </div>

          {/* Segment Navigation */}
          <IonSegment
            mode="ios"
            value={activeFooterTab}
            onIonChange={(e) => setActiveFooterTab(e.detail.value as any)}
            style={{
              '--background': 'rgba(var(--ion-text-color-rgb), 0.1)',
              '--indicator-color': 'rgba(var(--ion-text-color-rgb), 0.25)',
              marginBottom: '8px',
              padding: '4px',
              borderRadius: '24px'
            } as any}
          >
            <IonSegmentButton value="dati">
              <IonIcon icon={barbellOutline} style={{ fontSize: '20px' }} />
            </IonSegmentButton>
            <IonSegmentButton value="info">
              <IonIcon icon={informationCircleOutline} style={{ fontSize: '20px' }} />
            </IonSegmentButton>
            <IonSegmentButton value="chat">
              <div style={{ position: 'relative' }}>
                <IonIcon icon={chatbubbleOutline} style={{ fontSize: '20px' }} />
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--ion-color-warning)',
                  border: '2px solid var(--ion-background-color)'
                }} />
              </div>
            </IonSegmentButton>
            <IonSegmentButton value="storico">
              <IonIcon icon={statsChartOutline} style={{ fontSize: '20px' }} />
            </IonSegmentButton>
          </IonSegment>

          {/* Info Header: Target Left + Completed Status Right */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 8px 8px'
          }}>
            {/* Target (Left) */}
            <div>
              {setGroup && setGroup.exercises[0]?.set.reps_min && setGroup.exercises[0]?.set.reps_max ? (
                <IonText color="medium" style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                  Target: <span style={{ color: 'var(--ion-color-primary)', fontWeight: '700' }}>{setGroup.exercises[0].set.reps_min}-{setGroup.exercises[0].set.reps_max}</span>
                </IonText>
              ) : (
                <span></span>
              )}
            </div>

            {/* Status (Right) */}
            {setGroup && (() => {
              const isCompleted = setGroup.exercises.every(e => {
                const state = exercisesState.find(s => s.exerciseId === e.exercise.id_workout_day_exercise);
                if (!state) return false;
                return (state.load > 0 && state.reps > 0);
              });

              return isCompleted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '16px' }} />
                  <IonText color="success" style={{ fontSize: '0.8rem', fontWeight: '700' }}>COMPLETATO</IonText>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.5 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ion-color-warning)' }} />
                  <IonText color="medium" style={{ fontSize: '0.8rem', fontWeight: '600' }}>DA COMPLETARE</IonText>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Content - senza scroll */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          {renderContent()}
        </div>
      </div>
    </IonModal>
  );
};

/**
 * Input con IonPicker nativo integrato
 */
const WeightPickerInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}> = ({ label, value, onChange, min, max }) => {
  const inputRef = useRef<HTMLIonInputElement>(null);
  const [inputValue, setInputValue] = useState(String(value));

  // Separa il valore in parte intera e decimale
  const integerPart = Math.floor(value);
  const decimalPart = Math.round((value - integerPart) * 100) / 100;

  // Array dei decimali possibili (.0, .25, .5, .75)
  const decimals = [0, 0.25, 0.5, 0.75];

  // Genera array di valori per gli interi (range limitato per performance)
  const integerValues = React.useMemo(() => {
    const arr = [];
    const rangeStart = Math.max(min, 0);
    const rangeEnd = Math.min(max, 500);
    for (let i = rangeStart; i <= rangeEnd; i++) {
      arr.push(i);
    }
    return arr;
  }, [min, max]);

  // Aggiorna inputValue quando il value cambia dall'esterno (picker)
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  // Handler per il cambio del valore intero
  const handleIntegerChange = (e: CustomEvent) => {
    const newInt = parseInt(e.detail.value, 10);
    if (!isNaN(newInt)) {
      onChange(newInt + decimalPart);
    }
  };

  // Handler per il cambio del valore decimale
  const handleDecimalChange = (e: CustomEvent) => {
    const newDec = parseFloat(e.detail.value);
    if (!isNaN(newDec)) {
      onChange(integerPart + newDec);
    }
  };

  // Handler per cambio input
  const handleInputChange = (e: any) => {
    const newValue = e.detail.value || '';
    setInputValue(newValue);
  };

  // Handler per blur input (quando finisci di editare)
  const handleInputBlur = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    } else {
      // Ripristina il valore precedente se non valido
      setInputValue(String(value));
    }
  };

  // Handler per focus input (seleziona tutto il testo)
  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.getInputElement().then((input) => {
        input.select();
      });
    }, 100);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <IonText color="medium" style={{
        fontSize: '0.9rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '4px',
        letterSpacing: '0.5px',
        textAlign: 'center'
      }}>
        {label}
      </IonText>

      {/* Input editabile */}
      <IonInput className=""
        ref={inputRef}
        type="number"
        inputmode="decimal"
        value={inputValue}
        onIonInput={handleInputChange}
        onIonBlur={handleInputBlur}
        onIonFocus={handleInputFocus}
        style={{
          '--background': 'transparent',
          '--padding-start': '12px',
          fontSize: '2.2rem',
          fontWeight: '700',
          textAlign: 'center',
          height: '40px',
          '--border-width': '0',
          marginBottom: '0'
        }}
      />

      {/* IonPicker con 2 colonne ravvicinate */}

      <IonPicker
        style={{
          // height: '100%',
          '--highlight-background': 'rgba(var(--ion-color-primary-rgb), 0.15)',
          // '--highlight-height': '46px'
        } as any}
      >
        {/* Colonna Interi */}
        <IonPickerColumn
          value={String(integerPart)}
          onIonChange={handleIntegerChange}
        >
          {integerValues.map((val) => (
            <IonPickerColumnOption key={val} value={String(val)}>
              {val}
            </IonPickerColumnOption>
          ))}
        </IonPickerColumn>

        {/* Colonna Decimali */}
        <IonPickerColumn
          value={String(decimalPart)}
          onIonChange={handleDecimalChange}
        >
          {decimals.map((val) => (
            <IonPickerColumnOption key={val} value={String(val)}>
              .{(val * 100).toFixed(0).padStart(2, '0')}
            </IonPickerColumnOption>
          ))}
        </IonPickerColumn>
      </IonPicker>
    </div>
  );
};

/**
 * Picker per le ripetizioni (solo una colonna)
 */
const RepsPickerInput: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}> = ({ label, value, onChange, min, max }) => {
  const inputRef = useRef<HTMLIonInputElement>(null);
  const [inputValue, setInputValue] = useState(String(value));

  // Genera array di valori per le ripetizioni
  const repsValues = React.useMemo(() => {
    const arr = [];
    for (let i = min; i <= max; i++) {
      arr.push(i);
    }
    return arr;
  }, [min, max]);

  // Aggiorna inputValue quando il value cambia dall'esterno (picker)
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  // Handler per il cambio del valore
  const handleChange = (e: CustomEvent) => {
    const newVal = parseInt(e.detail.value, 10);
    if (!isNaN(newVal)) {
      onChange(newVal);
    }
  };

  // Handler per cambio input
  const handleInputChange = (e: any) => {
    const newValue = e.detail.value || '';
    setInputValue(newValue);
  };

  // Handler per blur input (quando finisci di editare)
  const handleInputBlur = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    } else {
      // Ripristina il valore precedente se non valido
      setInputValue(String(value));
    }
  };

  // Handler per focus input (seleziona tutto il testo)
  const handleInputFocus = () => {
    setTimeout(() => {
      inputRef.current?.getInputElement().then((input) => {
        input.select();
      });
    }, 100);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <IonText color="medium" style={{
        fontSize: '0.9rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '4px',
        letterSpacing: '0.5px',
        textAlign: 'center'
      }}>
        {label}
      </IonText>

      {/* Input editabile */}
      <IonInput
        ref={inputRef}
        type="number"
        inputmode="numeric"
        value={inputValue}
        onIonInput={handleInputChange}
        onIonBlur={handleInputBlur}
        onIonFocus={handleInputFocus}
        style={{
          '--background': 'transparent',
          '--padding-start': '12px',
          fontSize: '2.2rem',
          fontWeight: '700',
          textAlign: 'center',
          height: '40px',
          '--border-width': '0',
          marginBottom: '0'
        }}
      />

      {/* IonPicker con 1 colonna */}
      <IonPicker
        style={{
          // height: '100%',
          '--highlight-background': 'rgba(var(--ion-color-primary-rgb), 0.15)',
          // '--highlight-height': '46px'
        } as any}
      >
        <IonPickerColumn
          value={String(value)}
          onIonChange={handleChange}
        >
          {repsValues.map((val) => (
            <IonPickerColumnOption key={val} value={String(val)}>
              {val}
            </IonPickerColumnOption>
          ))}
        </IonPickerColumn>
      </IonPicker>
    </div>
  );
};

export default SetDetailBottomSheet;
