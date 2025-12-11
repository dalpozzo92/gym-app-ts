// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  IonText,
  IonLabel,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonRippleEffect,
  IonChip,
  IonFab,
  IonFabButton,
  IonInput,
  IonSpinner,
  IonToast,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonProgressBar,
  IonModal,
  IonList
} from '@ionic/react';
import '@/styles/exercise-inputs.css';
import {
  timeOutline,
  barbellOutline,
  informationCircleOutline,
  addOutline,
  removeOutline,
  fitnessOutline,
  trendingUpOutline,
  trendingDownOutline,
  removeCircleOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  timerOutline,
  cloudDoneOutline,
  cloudOfflineOutline,
  syncOutline,
  closeCircleOutline,
  playOutline,
  pauseOutline,
  stopOutline,
  saveOutline,
  chevronDownOutline,
  chevronUpOutline,
  chevronBackOutline,
  calendarOutline
} from 'ionicons/icons';
import AnimatedBackground from '@/components/AnimatedBackground';
import LiquidGlassModal from '@/components/LiquidGlassModal';
import { useHistory, useParams } from 'react-router-dom';
import CircularProgress from '@/components/CircularProgress';
import { buildRoute } from '@/routes';
import { useExerciseDetailData } from '@/hooks/useExerciseDetailData';
import { useWorkoutDayExercises } from '@/hooks/useWorkout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProgramActive } from '@/hooks/useProgram';
import { useTimer } from '@/contexts/TimerContext';

import { useAutosaveSets } from '@/hooks/useAutosaveSets';
import { useSyncWorker, flushPendingOpsNow } from '@/hooks/useSyncWorker';
import { useBeforeUnloadWarning } from '@/hooks/useBeforeUnloadWarning';
import ModaleModificheNonSalvate from '@/components/ModaleModificheNonSalvate';
import { getAllPendingOps } from '@/db/dexie';
import BilanciereLoader from '@/components/BilanciereLoader';
import { getPreviousWorkoutExerciseSet, syncWorkoutExerciseSets } from '@/api/workout';

// ============================================
// EXERCISE CHIP COMPONENT (CON ANIMAZIONI)
// ============================================
const ExerciseChip = ({ workout_day_exercise, isSelected, onClick, progress: initialProgress, exerciseNumber }) => {
  const [animateProgress, setAnimateProgress] = useState(false);
  const [prevProgress, setPrevProgress] = useState(initialProgress);

  // ✅ Trigger animazione quando cambia il progress (gestito dal padre)
  useEffect(() => {
    if (initialProgress !== prevProgress) {
      setAnimateProgress(true);
      setPrevProgress(initialProgress);
      setTimeout(() => setAnimateProgress(false), 600);
    }
  }, [initialProgress, prevProgress]);

  return (
    // <motion.div
    //   className="ion-activatable"
    //   onClick={onClick}
    //   animate={{
    //     scale: isSelected ? 1.05 : animateProgress ? [1, 1.15, 1] : 1,
    //     y: isSelected ? -2 : 0
    //   }}
    //   transition={{
    //     scale: { duration: animateProgress ? 0.4 : 0.2, ease: "easeOut" },
    //     y: { duration: 0.2, ease: "easeInOut" }
    //   }}
    //   style={{
    //     position: 'relative',
    //     width: '50px',
    //     height: '50px',
    //     margin: '8px',
    //     display: 'inline-block',
    //     flexShrink: 0,
    //     cursor: 'pointer',
    //     borderRadius: '50%'
    //   }}
    // >
    //   <CircularProgress
    //     percentage={initialProgress}
    //     size={50}
    //     strokeWidth={3}
    //     color='progressColor'
    //     backgroundColor={isSelected ? 'rgba(var(--ion-color-primary-rgb), 0.2)' : 'rgba(var(--ion-color-medium-rgb), 0.1)'}
    //     showText={false}
    //     duration={0.6}
    //   />

    //   <div
    //     style={{
    //       position: 'absolute',
    //       top: '50%',
    //       left: '50%',
    //       transform: 'translate(-50%, -50%)',
    //       width: '36px',
    //       height: '36px',
    //       borderRadius: '50%',
    //       display: 'flex',
    //       alignItems: 'center',
    //       justifyContent: 'center',
    //       background: isSelected ? 'var(--ion-select-color)' : 'var(--ion-background-color)',
    //       color: isSelected ? 'var(--ion-text-color)' : 'var(--ion-select-color)',
    //       fontWeight: isSelected ? 'bold' : '500',
    //       fontSize: '0.75rem',
    //       boxShadow: isSelected ? '0 2px 8px rgba(var(--ion-color-primary-rgb), 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    //       zIndex: 2
    //     }}
    //   >
    //     {exerciseNumber}°
    //   </div>

    //   <IonRippleEffect />
    // </motion.div>

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
          percentage={initialProgress}
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
          {exerciseNumber}
        </div>
      </div>

      <IonRippleEffect />
    </motion.div>
  );
};

const RestTimer = ({ seconds, timerId }) => {
  const { getTimerState, startTimer, activeTimer } = useTimer();
  const timerState = getTimerState(timerId);

  const isRunning = timerState?.isRunning ?? false;
  const isThisTimerActive = activeTimer?.timerId === timerId;
  const isAnyTimerActive = activeTimer !== null;

  const handleStart = () => {
    // ✅ Impedisci di avviare se un altro timer è già attivo
    if (isAnyTimerActive && !isThisTimerActive) return;
    startTimer(timerId, seconds);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '4px 0'
    }}>
      <motion.button
        onClick={handleStart}
        whileTap={isAnyTimerActive && !isThisTimerActive ? {} : { scale: 0.95 }}
        disabled={isAnyTimerActive && isThisTimerActive}
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: isThisTimerActive
            ? 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade))'
            : isAnyTimerActive
            ? 'rgba(var(--ion-color-medium-rgb), 0.05)'
            : 'rgba(var(--ion-color-primary-rgb), 0.1)',
          border: isThisTimerActive
            ? 'none'
            : isAnyTimerActive
            ? '2px solid rgba(var(--ion-color-medium-rgb), 0.2)'
            : '2px solid rgba(var(--ion-color-primary-rgb), 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isAnyTimerActive && !isThisTimerActive ? 'not-allowed' : 'pointer',
          boxShadow: isThisTimerActive
            ? '0 8px 24px rgba(var(--ion-color-primary-rgb), 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          opacity: isAnyTimerActive && !isThisTimerActive ? 0.3 : 1,
          pointerEvents: isAnyTimerActive && !isThisTimerActive ? 'none' : 'auto'
        }}
      >
        {isThisTimerActive ? (
          <>
            <IonIcon
              icon={timerOutline}
              style={{
                fontSize: '12px',
                color: 'white',
                marginBottom: '4px'
              }}
            />
            <span style={{
              fontSize: '0.5rem',
              color: 'white',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Attivo
            </span>
          </>
        ) : (
          <>
            <IonIcon
              icon={playOutline}
              style={{
                fontSize: '16px',
                color: isAnyTimerActive ? 'var(--ion-color-medium)' : 'var(--ion-color-primary)'
              }}
            />
            <span style={{
              fontSize: '0.5rem',
              color: isAnyTimerActive ? 'var(--ion-color-medium)' : 'var(--ion-color-primary)',
              fontWeight: '600',
              marginTop: '4px'
            }}>
              {formatTime(seconds)}
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
};


// ============================================
// PERFORMANCE COMPARISON COMPONENT
// ============================================
const PerformanceComparison = ({ previous, current }) => {
  // ✅ Mostra solo se ENTRAMBI load E reps sono > 0 (non solo uno dei due)
  if (!previous || !(current.actual_load > 0 && current.actual_reps > 0)) return null;

  const weightDiff = current.actual_load - previous.load;
  const repsDiff = current.actual_reps - previous.reps;

  const getComparison = () => {
    const formatDiff = (value) => (value > 0 ? `+${value}` : value);

    if (weightDiff > 0 && repsDiff > 0) {
      return {
        text: `${formatDiff(weightDiff)}kg, ${formatDiff(repsDiff)} rip`,
        color: 'success',
        icon: trendingUpOutline,
        label: 'Progresso'
      };
    } else if (weightDiff > 0) {
      return {
        text: `${formatDiff(weightDiff)}kg`,
        color: 'success',
        icon: trendingUpOutline,
        label: 'Più peso'
      };
    } else if (repsDiff > 0) {
      return {
        text: `${formatDiff(repsDiff)} rip`,
        color: 'success',
        icon: trendingUpOutline,
        label: 'Più ripetizioni'
      };
    } else if (weightDiff < 0 && repsDiff < 0) {
      return {
        text: `${formatDiff(weightDiff)}kg, ${formatDiff(repsDiff)} rip`,
        color: 'danger',
        icon: trendingDownOutline,
        label: 'Calo prestazione'
      };
    } else if (weightDiff < 0) {
      return {
        text: `${formatDiff(weightDiff)}kg`,
        color: 'warning',
        icon: trendingDownOutline,
        label: 'Meno peso'
      };
    } else if (repsDiff < 0) {
      return {
        text: `${formatDiff(repsDiff)} rip`,
        color: 'warning',
        icon: trendingDownOutline,
        label: 'Meno ripetizioni'
      };
    }
    return {
      text: 'Stesso carico',
      color: 'medium',
      icon: removeCircleOutline,
      label: 'Mantenimento'
    };
  };

  const comparison = getComparison();

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{
        padding: '10px 12px',
        background: `rgba(var(--ion-color-${comparison.color}-rgb), 0.1)`,
        borderRadius: '8px',
        border: `1px solid rgba(var(--ion-color-${comparison.color}-rgb), 0.3)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IonIcon
            icon={comparison.icon}
            style={{
              fontSize: '20px',
              color: `var(--ion-color-${comparison.color})`
            }}
          />
          <div>
            <IonText
              color={comparison.color}
              style={{
                fontSize: '0.7rem',
                fontWeight: '600',
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {comparison.label}
            </IonText>
            <IonText
              style={{
                fontSize: '0.9rem',
                fontWeight: '700',
                display: 'block',
                marginTop: '2px'
              }}
            >
              {comparison.text}
            </IonText>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SERIE CARD COMPONENT
// ============================================
const SerieCard = ({
  workout_exercise_set,
  setIndex,
  onUpdateSet,
  previous_workout_exercise_set,
  onViewHistory,
  showRestTime = false,
  restTime,
  repsMin,
  repsMax,
  saveStatus            // ✅ NUOVO: stato di salvataggio
}) => {
  // ✅ Stato locale - inizializzato UNA VOLTA al mount, poi indipendente
  const [load, setLoad] = useState(workout_exercise_set?.actual_load || 0);
  const [reps, setReps] = useState(workout_exercise_set?.actual_reps || 0);
  const [rpe, setRpe] = useState(workout_exercise_set?.rpe || null);
  const [execution, setExecution] = useState(workout_exercise_set?.execution_rating || null);

  // ✅ Un set è completato solo se ENTRAMBI load E reps sono > 0
  const isCompleted = useMemo(() => load > 0 && reps > 0, [load, reps]);

  const completionIcon = useMemo(() => {
    if (isCompleted) {
      return {
        icon: checkmarkCircleOutline,
        text: 'Completato',
        color: 'var(--ion-color-success)',
        label: 'Completato'
      };
    }
    return {
      icon: alertCircleOutline,
      text: 'Da completatare',
      color: 'var(--ion-color-warning)',
      label: 'Incompleto'
    };
  }, [isCompleted]);

  // ✅ Badge di stato di salvataggio con bordo colorato
  const saveStatusBadge = useMemo(() => {
    const statusConfig = {
      'Salvato': {
        icon: cloudDoneOutline,
        text: '',
        borderColor: 'var(--ion-color-success)',
        textColor: 'var(--ion-color-success)',
        showSpinner: false
      },
      'Salvataggio': {
        icon: syncOutline,
        text: '',
        borderColor: 'var(--ion-color-warning)',
        textColor: 'var(--ion-color-warning)',
        showSpinner: true
      },
      'Offline': {
        icon: cloudOfflineOutline,
        text: '',
        borderColor: 'var(--ion-color-medium)',
        textColor: 'var(--ion-color-medium)',
        showSpinner: false
      },
      'Local': {
        icon: saveOutline,
        text: '',
        borderColor: '#e91e63',
        textColor: '#e91e63',
        showSpinner: false
      },
      'Errore': {
        icon: closeCircleOutline,
        text: '',
        borderColor: 'var(--ion-color-danger)',
        textColor: 'var(--ion-color-danger)',
        showSpinner: false
      }
    };

    return statusConfig[saveStatus] || statusConfig['Errore'];
  }, [saveStatus]);

  // ✅ Timer separato per ogni campo - così non si sovrascrivono
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // ✅ Ref per tenere traccia dei valori pending (non ancora salvati)
  const pendingValuesRef = useRef<Record<string, any>>({});

  const debouncedSave = useCallback((field: string, value: any) => {
    // Salva il valore pending
    pendingValuesRef.current[field] = value;

    // Cancella solo il timer di QUESTO campo
    if (timersRef.current[field]) {
      clearTimeout(timersRef.current[field]);
    }
    timersRef.current[field] = setTimeout(() => {
      onUpdateSet(setIndex, { [field]: value });
      delete timersRef.current[field];
      delete pendingValuesRef.current[field]; // Rimuovi dal pending
    }, 500); // ✅ Ridotto da 1500ms a 500ms per salvare più velocemente
  }, [onUpdateSet, setIndex]);

  // ✅ Flush immediato dei timer pending
  const flushPendingTimers = useCallback(() => {
    // Cancella tutti i timer
    Object.values(timersRef.current).forEach(timer => clearTimeout(timer));
    timersRef.current = {};

    // Salva immediatamente tutti i valori pending
    Object.entries(pendingValuesRef.current).forEach(([field, value]) => {
      onUpdateSet(setIndex, { [field]: value });
    });
    pendingValuesRef.current = {};
  }, [onUpdateSet, setIndex]);

  // ✅ Flush quando componente unmount
  useEffect(() => {
    return () => {
      flushPendingTimers();
    };
  }, [flushPendingTimers]);

  // ✅ Flush quando l'utente cambia tab o mette in background (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        flushPendingTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [flushPendingTimers]);

  const updateLoad = (increment) => {
    const newLoad = Math.max(0, load + increment);
    setLoad(newLoad);
    debouncedSave('actual_load', newLoad);
  };

  const updateReps = (increment) => {
    const newReps = Math.max(0, reps + increment);
    setReps(newReps);
    debouncedSave('actual_reps', newReps);
  };

  const handleLoadInput = (value) => {
    const newLoad = parseFloat(value) || 0;
    setLoad(newLoad);
    debouncedSave('actual_load', newLoad);
  };

  const handleRepsInput = (value) => {
    const newReps = parseInt(value) || 0;
    setReps(newReps);
    debouncedSave('actual_reps', newReps);
  };

  // ✅ Gestione focus input: seleziona tutto se il valore è 0
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const input = event.target;
    const value = input.value;

    // Se il valore è 0, seleziona tutto (così viene sovrascritto al primo input)
    if (value === '0') {
      // ✅ Usa setTimeout per assicurarsi che il focus sia completato
      setTimeout(() => {
        input.select();
      }, 0);
    }
    // ✅ NOTA: Non possiamo usare setSelectionRange con input type="number"
    // Il browser gestisce automaticamente il cursore
  };

  const updateRPE = (value) => {
    setRpe(value);
    onUpdateSet(setIndex, { rpe: value });
  };

  const updateExecution = (value) => {
    setExecution(value);
    onUpdateSet(setIndex, { execution_rating: value });
  };

  // ✅ ID univoco per questo timer
  const timerId = `timer-${setIndex}`;

  return (
    <>
      <IonCard>
        <IonCardContent style={{ padding: '18px' }}>
          <IonGrid className="ion-no-padding">
            {/* Header */}
            <IonRow className="ion-align-items-top" style={{ marginBottom: '16px' }}>
              <IonCol size="5">
                <IonText style={{ fontSize: '1.2rem', fontWeight: '700', display: 'block' }}>
                  Serie {setIndex + 1}
                </IonText>
                <IonText color="primary" style={{ fontSize: '1rem', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                  {repsMin && repsMax ? `${repsMin}-${repsMax} ripetizioni` : 'Non definite'}
                </IonText>
              </IonCol>
              <IonCol size="2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>

                {/* ✅ Badge di stato salvataggio con bordo colorato */}
                <div
                  style={{
                    fontSize: '0.65rem',
                    padding: '6px 6px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: `1px solid ${saveStatusBadge.borderColor}`,
                    borderRadius: '12px',
                    background: 'transparent',
                    color: saveStatusBadge.textColor
                  }}
                >
                  {saveStatusBadge.showSpinner ? (
                    <IonSpinner name="crescent" style={{ width: '10px', height: '10px', color: saveStatusBadge.textColor }} />
                  ) : (
                    <IonIcon icon={saveStatusBadge.icon} style={{ fontSize: '10px', color: saveStatusBadge.textColor }} />
                  )}
                  <span>{saveStatusBadge.text}</span>
                </div>
              </IonCol>
              <IonCol size="5" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                {/* ✅ Icona di completamento invece di CircularProgress */}
                <div
                  style={{
                    fontSize: '0.65rem',
                    padding: '4px 4px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: `1px solid ${completionIcon.color}`,
                    borderRadius: '12px',
                    background: 'transparent',
                    color: completionIcon.color
                  }}
                >
                  <IonIcon
                    icon={completionIcon.icon}
                    style={{
                      fontSize: '10px',
                      color: completionIcon.color
                    }}
                  />
                  <span>{completionIcon.text}</span>

                </div>

              </IonCol>
                
            </IonRow>

            {/* Input carico e ripetizioni */}
            <IonRow className="ion-no-padding" style={{ marginBottom: '12px' }}>
              <IonCol size="6" style={{ paddingRight: '6px' }}>
                <div className="exercise-input-container">
                  <span className="exercise-input-label-top">Carico (kg)</span>
                  <div className="exercise-input-controls">
                    <IonButton
                      fill="clear"
                      color="medium"
                      className="exercise-btn-simple"
                      onClick={() => updateLoad(-2.5)}
                    >
                      <IonIcon slot="icon-only" icon={removeOutline} />
                    </IonButton>
                    <input
                      type="number"
                      value={load}
                      onChange={(e) => handleLoadInput(e.target.value)}
                      onFocus={handleInputFocus}
                      inputMode="decimal"
                    />
                    <IonButton
                      fill="clear"
                      color="medium"
                      className="exercise-btn-simple"
                      onClick={() => updateLoad(2.5)}
                    >
                      <IonIcon slot="icon-only" icon={addOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonCol>

              <IonCol size="6" style={{ paddingLeft: '6px' }}>
                <div className="exercise-input-container">
                  <span className="exercise-input-label-top">Ripetizioni</span>
                  <div className="exercise-input-controls">
                    <IonButton
                      fill="clear"
                      color="medium"
                      className="exercise-btn-simple"
                      onClick={() => updateReps(-1)}
                    >
                      <IonIcon slot="icon-only" icon={removeOutline} />
                    </IonButton>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => handleRepsInput(e.target.value)}
                      onFocus={handleInputFocus}
                      inputMode="numeric"
                    />
                    <IonButton
                      fill="clear"
                      color="medium"
                      className="exercise-btn-simple"
                      onClick={() => updateReps(1)}
                    >
                      <IonIcon slot="icon-only" icon={addOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonCol>
            </IonRow>

            {/* Prestazione precedente */}
            {previous_workout_exercise_set && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'rgba(var(--ion-color-primary-rgb), 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(var(--ion-color-primary-rgb), 0.15)'
              }}>
                <IonGrid className="ion-no-padding">
                  <IonRow className="ion-align-items-center">
                    <IonCol>
                      <IonText color="primary" style={{ fontSize: '0.7rem', display: 'block', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Settimana Precedente
                      </IonText>
                      <IonText style={{ fontWeight: '700', fontSize: '1rem', display: 'block', marginTop: '4px' }}>
                        {previous_workout_exercise_set.load}kg × {previous_workout_exercise_set.reps} rip
                      </IonText>
                    </IonCol>
                    <IonCol size="auto">
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={onViewHistory}
                        style={{
                          '--color': 'var(--ion-color-primary)',
                          fontWeight: '600',
                          fontSize: '0.75rem'
                        }}
                      >
                        Storico
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>

                {(load > 0 || reps > 0) && (
                  <PerformanceComparison
                    previous={previous_workout_exercise_set}
                    current={{ actual_load: load, actual_reps: reps }}
                  />
                )}
              </div>
            )}

            {/* RPE e Tecnica */}
            <IonRow className="ion-no-padding" style={{ marginTop: previous_workout_exercise_set ? '16px' : '0' }}>
              <IonCol size="6" style={{ paddingRight: '6px' }}>
                <IonList>
                  <IonItem>
                    <IonSelect
                      labelPlacement="floating" label="RPE"
                      value={rpe}
                      interface="action-sheet"
                      cancelText="Annulla"
                      onIonChange={(e) => updateRPE(e.detail.value)}
                    >
                      <IonSelectOption value={null}></IonSelectOption>
                      {[...Array(10)].map((_, i) => (
                        <IonSelectOption key={i + 1} value={i + 1}>{i + 1}/10</IonSelectOption>
                      ))}
                    </IonSelect>
                  </IonItem>

                </IonList>

              </IonCol>

              <IonCol size="6" style={{ paddingLeft: '6px' }}>
                <IonList>
                  <IonItem>
                    <IonSelect
                      labelPlacement="floating" label="Tecnica"
                      value={execution}
                      interface="action-sheet"
                      cancelText="Annulla"
                      onIonChange={(e) => updateExecution(e.detail.value)}
                    >
                      <IonSelectOption value={null}></IonSelectOption>
                      <IonSelectOption value={1}>Scarsa</IonSelectOption>
                      <IonSelectOption value={2}>Buona</IonSelectOption>
                      <IonSelectOption value={3}>Ottima</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonList>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>

      {/* ✅ Timer con gestione globale persistente */}
      {showRestTime && (
        <RestTimer
          seconds={restTime}
          timerId={timerId}
        />
      )}
    </>
  );
};

// ============================================
// SETS MANAGER (Gestisce UI e Autosave)
// ============================================
const SetsManager = ({
  exerciseId,
  initialSets,
  workout_day_exercise,
  previousSetsData,
  onOpenHistory
}) => {
  const { sets, updateSet } = useAutosaveSets(exerciseId, initialSets);

  // ✅ Ref per tracciare i valori più recenti di ogni set (evita problemi con closure stale)
  const pendingSetsRef = useRef<Record<string, { actual_load?: number; actual_reps?: number }>>({});

  // ✅ Sincronizza ref con sets quando cambiano
  useEffect(() => {
    sets.forEach((s) => {
      if (!pendingSetsRef.current[s.setId]) {
        pendingSetsRef.current[s.setId] = {};
      }
      if (s.actual_load !== undefined) {
        pendingSetsRef.current[s.setId].actual_load = s.actual_load;
      }
      if (s.actual_reps !== undefined) {
        pendingSetsRef.current[s.setId].actual_reps = s.actual_reps;
      }
    });
  }, [sets]);

  const handleUpdateSet = useCallback(
    (setIndex, updates) => {
      const target = sets[setIndex];
      if (!target) return;
      const entries = Object.entries(updates);
      if (entries.length === 0) return;
      let [field, value] = entries[0];

      // ✅ Map legacy UI fields to new DB fields
      if (field === 'reps') field = 'actual_reps';
      if (field === 'load') field = 'actual_load';

      // ✅ Aggiorna il ref immediatamente con il nuovo valore
      if (!pendingSetsRef.current[target.setId]) {
        pendingSetsRef.current[target.setId] = {};
      }
      pendingSetsRef.current[target.setId][field] = value;

      updateSet({ setId: target.setId, field: field as any, value });

      // ✅ Calcola progress usando i valori più recenti dal ref
      // Usa set prescritti (workout_day_exercise.sets) come denominatore, non i record nello state
      const totalSets = workout_day_exercise?.sets || sets.length;
      const completedSets = sets.filter((s) => {
        const pending = pendingSetsRef.current[s.setId] || {};
        const load = pending.actual_load !== undefined ? pending.actual_load : (s.actual_load || 0);
        const reps = pending.actual_reps !== undefined ? pending.actual_reps : (s.actual_reps || 0);
        return load > 0 && reps > 0;
      }).length;

      const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

      // ✅ Emetti immediatamente
      window.dispatchEvent(new CustomEvent('exercise:progress:update', {
        detail: {
          exerciseId,
          progress,
          completedSets,
          totalSets
        }
      }));
    },
    [sets, updateSet, exerciseId]
  );

  const setsState = sets.map(s => ({
    ...s,
    status: s.dirty ? (navigator.onLine ? 'Salvataggio' : 'Offline') : 'Salvato'
  }));

  // ✅ Calcola progress in tempo reale basato su set completati (solo per riferimento interno)
  const exerciseProgress = useMemo(() => {
    // Usa set prescritti (workout_day_exercise.sets) come denominatore, non i record nello state
    const totalSets = workout_day_exercise?.sets || setsState.length;
    if (totalSets === 0) return 0;

    const completedSets = setsState.filter(s => {
      const load = s.actual_load || s.load || 0;
      const reps = s.actual_reps || s.reps || 0;
      return load > 0 && reps > 0;
    }).length;

    return Math.round((completedSets / totalSets) * 100);
  }, [setsState, workout_day_exercise?.sets]);

  if (setsState.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <IonText color="medium"><p>Nessun set disponibile</p></IonText>
      </div>
    );
  }

  return (
    <div>
      {setsState.map((workout_exercise_set, index) => (
        <div key={`set-${workout_exercise_set.setId}`} style={{ marginBottom: 12 }}>
          <SerieCard
            workout_exercise_set={workout_exercise_set}
            setIndex={index}
            onUpdateSet={handleUpdateSet}
            previous_workout_exercise_set={previousSetsData[index]?.previous_workout_exercise_set}
            onViewHistory={() => onOpenHistory(index + 1)}
            showRestTime={index < setsState.length - 1}
            restTime={workout_day_exercise?.rest_time || 60}
            repsMin={workout_exercise_set?.reps_min}
            repsMax={workout_exercise_set?.reps_max}
            saveStatus={workout_exercise_set.status}
          />
        </div>
      ))}
    </div>
  );
};

// ============================================
// SINGLE EXERCISE CONTAINER (Data Fetching Isolation)
// ============================================
const SingleExerciseContainer = ({
  exerciseId,
  workout_day_exercise,
  onOpenHistory
}) => {
  // 1. Fetch Data for THIS specific exercise
  const { data: exerciseData, loading, error } = useExerciseDetailData(exerciseId);

  // 2. State for previous sets data
  const [previousSetsData, setPreviousSetsData] = useState([]);
  const [loadingPreviousData, setLoadingPreviousData] = useState(false);

  // 3. Fetch previous sets data when initialSets and workout_day_exercise are available
  useEffect(() => {
    const fetchPreviousSetsData = async () => {
      if (!workout_day_exercise?.week_number || !exerciseId) return;

      const prescribedSets = workout_day_exercise?.sets || 3;
      const week_number = workout_day_exercise.week_number;

      setLoadingPreviousData(true);

      try {
        // Fetch previous data for each set
        const previousDataPromises = Array.from({ length: prescribedSets }, (_, idx) => {
          const setNumber = idx + 1;
          return getPreviousWorkoutExerciseSet(exerciseId, setNumber, week_number);
        });

        const results = await Promise.all(previousDataPromises);
        setPreviousSetsData(results);
      } catch (error) {
        console.error('Error fetching previous sets data:', error);
        // Set empty array on error
        setPreviousSetsData([]);
      } finally {
        setLoadingPreviousData(false);
      }
    };

    fetchPreviousSetsData();
  }, [exerciseId, workout_day_exercise?.week_number, workout_day_exercise?.sets]);

  const initialSets = useMemo(() => {
    if (loading) return null; // Wait for loading

    // Get the number of prescribed sets from workout_day_exercise
    const prescribedSets = workout_day_exercise?.sets || 3;

    // Create an array with the prescribed number of sets
    const setsArray = Array.from({ length: prescribedSets }, (_, idx) => {
      const setNumber = idx + 1;

      // Check if we have saved data for this set from exerciseData
      const savedSet = exerciseData?.sets?.find(s =>
        String(s.setId) === String(setNumber) ||
        s.set_number === setNumber
      );

      if (savedSet) {
        // Use saved data
        return {
          set_number: setNumber,
          // load: savedSet.actual_load || savedSet.load || 0,
          // reps: savedSet.actual_reps || savedSet.reps || 0,
          actual_load: savedSet.actual_load || savedSet.load || 0,
          actual_reps: savedSet.actual_reps || savedSet.reps || 0,
          reps_min: savedSet.reps_min,
          reps_max: savedSet.reps_max,
          rest_time: savedSet.rest_time,
          rpe: savedSet.rpe ?? null,
          execution_rating: savedSet.execution_rating ?? null,
          notes: savedSet.notes ?? null,
          id_reps_type: savedSet.id_reps_type,
          intensity_type: savedSet.intensity_type,
          group_intensity_id: savedSet.group_intensity_id,
          setId: String(setNumber),
          dirty: false
        };
      }

      // No saved data - create empty set
      return {
        set_number: setNumber,
        // load: 0,
        // reps: 0,
        actual_load: 0,
        actual_reps: 0,
        rpe: null,
        execution_rating: null,
        notes: null,
        setId: String(setNumber),
        dirty: false
      };
    });

    return setsArray;
  }, [exerciseData, loading, workout_day_exercise]);

  if (loading) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <BilanciereLoader
          show={true}
          size="small"
          speed={1.5}
          message="Caricamento dati..."
          inline={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <IonText color="danger"><p>Errore caricamento dati</p></IonText>
      </div>
    );
  }

  // Render Manager only when we have sets
  return (
    <SetsManager
      exerciseId={exerciseId}
      initialSets={initialSets || []}
      workout_day_exercise={workout_day_exercise}
      previousSetsData={previousSetsData}
      onOpenHistory={onOpenHistory}
    />
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================
const ExerciseDetail = () => {
  const history = useHistory();
  const { id_program_day, id_workout_day_exercise } = useParams();
  const { activeProgramId, id_user_details } = useAuth();
  const { data: activeProgram } = useProgramActive(id_user_details ?? null);
  const resolvedProgramId = (activeProgram as any)?.id_program ?? (activeProgram as any)?.id ?? activeProgramId;

  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedSetForHistory, setSelectedSetForHistory] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasWaitedForData, setHasWaitedForData] = useState(false);
  const [isExerciseListExpanded, setIsExerciseListExpanded] = useState(false);

  // ✅ NUOVO: State per tracciare i progress di tutti gli esercizi
  const [exerciseProgressMap, setExerciseProgressMap] = useState<Record<string, { progress: number; completedSets: number; totalSets: number }>>({});

  // 1. Load Day Exercises List
  const {
    data: dayExercisesData,
    isLoading: isLoadingDayExercises
  } = useWorkoutDayExercises(id_program_day);

  const workout_day_exercises = dayExercisesData?.workout_day_exercises || [];

  // ✅ Inizializza exerciseProgressMap quando caricano i dati
  useEffect(() => {
    if (workout_day_exercises.length > 0) {
      const initialProgress: Record<string, { progress: number; completedSets: number; totalSets: number }> = {};
      workout_day_exercises.forEach((exercise: any) => {
        const sets = exercise.workout_exercise_sets || [];
        const completedSets = sets.filter((s: any) => (s.actual_load || 0) > 0 && (s.actual_reps || 0) > 0).length;
        const totalSets = exercise.sets || sets.length || 1; // Usa set prescritti, non record esistenti
        const progress = exercise.progress !== undefined ? exercise.progress : Math.round((completedSets / totalSets) * 100);

        initialProgress[exercise.id_workout_day_exercise] = {
          progress,
          completedSets,
          totalSets
        };
      });
      setExerciseProgressMap(initialProgress);
    }
  }, [workout_day_exercises]);

  // ✅ Listen per aggiornamenti progress
  useEffect(() => {
    const handleProgressUpdate = (e: any) => {
      const { exerciseId, progress, completedSets, totalSets } = e.detail;
      setExerciseProgressMap(prev => ({
        ...prev,
        [exerciseId]: {
          progress,
          completedSets,
          totalSets
        }
      }));
    };

    window.addEventListener('exercise:progress:update', handleProgressUpdate);
    return () => window.removeEventListener('exercise:progress:update', handleProgressUpdate);
  }, []);

  // Wait a bit before showing "no exercises" to avoid flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasWaitedForData(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Determine Current Exercise ID
  const currentWorkoutDayExerciseId = useMemo(() => {
    if (id_workout_day_exercise) return id_workout_day_exercise;
    if (workout_day_exercises.length > 0) return workout_day_exercises[0].id_workout_day_exercise;
    return null;
  }, [id_workout_day_exercise, workout_day_exercises]);

  // 3. Get Current Exercise Object
  const workout_day_exercise = useMemo(() => {
    if (!currentWorkoutDayExerciseId) return null;
    return workout_day_exercises.find(
      ex => ex.id_workout_day_exercise == currentWorkoutDayExerciseId
    ) || null;
  }, [currentWorkoutDayExerciseId, workout_day_exercises]);

  // 4. Sync Index
  useEffect(() => {
    if (currentWorkoutDayExerciseId && workout_day_exercises.length > 0) {
      const index = workout_day_exercises.findIndex(ex => ex.id_workout_day_exercise == currentWorkoutDayExerciseId);
      if (index !== -1 && index !== selectedExerciseIndex) {
        setSelectedExerciseIndex(index);
      }
    }
  }, [currentWorkoutDayExerciseId, workout_day_exercises]);

  // Sync Worker & Warning
  useSyncWorker();
  useBeforeUnloadWarning();
  useEffect(() => { return () => { flushPendingOpsNow(); }; }, []);

  // ✅ FASE 1: Gestione beforeunload con sendBeacon per salvataggio garantito su chiusura
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      console.log('🚪 [ExerciseDetail] beforeunload triggered');

      try {
        // 1. Ottieni tutte le pending ops
        const pendingOps = await getAllPendingOps();

        if (pendingOps.length === 0) {
          console.log('✅ [ExerciseDetail] Nessuna pending op da salvare');
          return;
        }

        console.log('📤 [ExerciseDetail] Invio', pendingOps.length, 'pending ops con sendBeacon');

        // 2. Raggruppa pending ops per set (stesso formato di useSyncWorker)
        const groupedBySet = pendingOps.reduce((acc: any, op: any) => {
          const key = `${op.exerciseId}-${op.setId}`;
          if (!acc[key]) {
            acc[key] = {
              id_workout_day_exercises: op.exerciseId,
              set_number: parseInt(op.setId, 10)
            };
          }
          acc[key][op.field] = op.value;
          return acc;
        }, {});

        const payload = { sets: Object.values(groupedBySet) };

        // 3. Usa sendBeacon per invio NON bloccante garantito
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const beaconUrl = `${window.location.origin}/api/workouts/syncWorkoutExerciseSets`;

        if ('sendBeacon' in navigator) {
          const sent = navigator.sendBeacon(beaconUrl, blob);
          if (sent) {
            console.log('✅ [ExerciseDetail] sendBeacon inviato con successo');
          } else {
            console.warn('⚠️ [ExerciseDetail] sendBeacon fallito, dati troppo grandi?');
          }
        } else {
          // Fallback per browser senza sendBeacon
          console.warn('⚠️ [ExerciseDetail] sendBeacon non supportato, uso fetch keepalive');
          fetch(beaconUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true // Garantisce che la richiesta continui dopo chiusura pagina
          }).catch(err => console.error('❌ [ExerciseDetail] Fetch keepalive fallito:', err));
        }
      } catch (error) {
        console.error('❌ [ExerciseDetail] Errore in beforeunload:', error);
      }

      // Non mostriamo il dialog di conferma - lasciamo uscire l'utente
      // e ci fidiamo di sendBeacon per salvare i dati
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ✅ FASE 1: Gestione visibilitychange per flush quando app va in background
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ [ExerciseDetail] App in background, flush immediato');
        await flushPendingOpsNow();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const selectExercise = useCallback((exerciseIndex) => {
    if (exerciseIndex === selectedExerciseIndex || !workout_day_exercises.length) return;
    const newExercise = workout_day_exercises[exerciseIndex];
    history.push(buildRoute.exerciseDetail(id_program_day, newExercise.id_workout_day_exercise));
  }, [selectedExerciseIndex, workout_day_exercises, history, id_program_day]);

  const openHistoryModal = (setNumber) => {
    setSelectedSetForHistory(setNumber);
    setIsHistoryModalOpen(true);
  };

  const handleBackToProgramWeeks = useCallback(() => {
    // ✅ Navigazione esplicita al programma per garantire il ritorno alla vista corretta
    if (resolvedProgramId) {
      history.push(buildRoute.programWeeks(resolvedProgramId));
    } else {
      history.goBack(); // Fallback se non c'è ID programma
    }
  }, [history, resolvedProgramId]);

  // Loading State for the Page (List of exercises)
  if (isLoadingDayExercises) {
    return (
      <div style={{ padding: '60px 16px' }}>
        <BilanciereLoader
          show={true}
          size="medium"
          speed={1.2}
          message="Caricamento scheda..."
          inline={true}
        />
      </div>
    );
  }

  // Only show empty state if we've waited AND truly have no exercises
  if (workout_day_exercises.length === 0 && hasWaitedForData) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center' }}>
        <IonText color="medium"><p>Nessun esercizio trovato.</p></IonText>
        <IonButton fill="outline" onClick={() => history.goBack()}>Torna indietro</IonButton>
      </div>
    );
  }

  return (
    <>
      <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message={toastMessage} duration={3000} position="top" color="danger" />

      {/* FAB Info */}
      <IonFab vertical="top" horizontal="end" slot="fixed" style={{ position: 'fixed', top: 'calc(var(--safe-area-top, 0px) + 50px)', right: '16px', zIndex: 999 }}>
        <IonFabButton size="small" onClick={() => setIsInfoModalOpen(true)}>
          <IonIcon icon={informationCircleOutline} />
        </IonFabButton>
      </IonFab>

      {/* Modals */}
      <LiquidGlassModal isOpen={isInfoModalOpen} onDidDismiss={() => setIsInfoModalOpen(false)} title="Info Esercizio" initialBreakpoint={0.9} breakpoints={[0, 0.5, 0.75, 0.9]}>
        <IonText>
          <h2 className="fw-bold">{workout_day_exercise?.exercise_name || "Esercizio"}</h2>
          <p style={{ color: 'var(--ion-color-medium)', fontSize: '0.9rem', marginTop: '8px' }}>
            {workout_day_exercise?.exercise_description || "Descrizione non disponibile"}
          </p>
        </IonText>
        {workout_day_exercise?.link_video && (
          <div style={{
            marginTop: '16px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            background: '#000',
            position: 'relative',
            width: '100%',
            // Se è uno short usa 9/16, altrimenti 16/9
            aspectRatio: workout_day_exercise.link_video.includes('shorts/') ? '9/16' : '16/9',
            maxHeight: '70vh', // Limita altezza su schermi grandi
            margin: '0 auto' // Centra
          }}>
            {workout_day_exercise.link_video.includes('youtube.com') || workout_day_exercise.link_video.includes('youtu.be') ? (
              <iframe
                width="100%"
                height="100%"
                src={`${workout_day_exercise.link_video
                  .replace('watch?v=', 'embed/')
                  .replace('youtu.be/', 'www.youtube.com/embed/')
                  .replace('shorts/', 'embed/')
                  }?autoplay=1&mute=1&controls=1&playsinline=1&rel=0`}
                title="Video Esercizio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              ></iframe>
            ) : (
              <video
                controls
                autoPlay
                muted
                playsInline
                loop
                width="100%"
                height="100%"
                style={{
                  display: 'block',
                  objectFit: 'cover'
                }}
                poster={workout_day_exercise?.image_url}
              >
                <source src={workout_day_exercise.link_video} type="video/mp4" />
                Il tuo browser non supporta il tag video.
              </video>
            )}
          </div>
        )}

        {workout_day_exercise?.muscolar_group_name && (
          <IonChip outline style={{ marginTop: '16px', background: 'rgba(var(--ion-color-primary-rgb), 0.1)', color: 'var(--ion-color-primary)' }}>
            <IonIcon icon={barbellOutline} />
            <IonLabel>{workout_day_exercise.muscolar_group_name}</IonLabel>
          </IonChip>
        )}
      </LiquidGlassModal>

      <LiquidGlassModal isOpen={isHistoryModalOpen} onDidDismiss={() => setIsHistoryModalOpen(false)} title="Storico" initialBreakpoint={0.75} breakpoints={[0, 0.5, 0.75, 1]}>
        <IonText>
          <h2 className="fw-bold">{workout_day_exercise?.exercise_name} - Serie {selectedSetForHistory}</h2>
        </IonText>
        <IonText color="medium" className="ion-text-center" style={{ display: 'block', marginTop: '32px' }}>Nessuna prestazione precedente</IonText>
      </LiquidGlassModal>

      <div>
        <AnimatedBackground variant="linee-move" intensity="light" height="250px" position="fixed" speed={3} fadeInDuration={2000} />

        {/* Header */}
        <div className="page-header ion-padding-horizontal">
          {/* Breadcrumb */}
          <motion.div
            onClick={handleBackToProgramWeeks}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <IonIcon
              icon={chevronBackOutline}
              style={{
                fontSize: '20px',
                color: 'var(--ion-text-color)'
              }}
            />
            <IonText
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}
            >
              Torna al programma
            </IonText>
          </motion.div>

          <IonText>
            <h1 className="fw-bold fs-xlarge">{workout_day_exercise?.exercise_name || "Esercizio"}</h1>
          </IonText>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {workout_day_exercise?.muscolar_group_name && (
              <IonChip outline style={{ background: 'transparent', border: '1px solid var(--ion-color-medium)', fontSize: '0.75rem' }}>
                <IonIcon icon={barbellOutline} style={{ fontSize: '14px' }} />
                <IonLabel>{workout_day_exercise.muscolar_group_name}</IonLabel>
              </IonChip>
            )}
            <IonChip outline style={{ background: 'transparent', border: '1px solid var(--ion-color-medium)', fontSize: '0.75rem' }}>
              <IonIcon icon={fitnessOutline} style={{ fontSize: '14px' }} />
              <IonLabel>{workout_day_exercise?.workout_exercise_sets?.length || 0} serie</IonLabel>
            </IonChip>
          </div>
        </div>

        {/* Chips */}
        {workout_day_exercises.length > 1 && (
          <>
            <div className="ion-padding-horizontal" style={{ display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              {workout_day_exercises.map((exercise, index) => {
                // ✅ Usa progress dallo state centralizzato
                const progressData = exerciseProgressMap[exercise.id_workout_day_exercise];
                const progress = progressData?.progress || 0;

                return (
                  <ExerciseChip
                    key={`exercise-${exercise.id_workout_day_exercise}`}
                    workout_day_exercise={exercise}
                    isSelected={selectedExerciseIndex === index}
                    onClick={() => selectExercise(index)}
                    progress={progress}
                    exerciseNumber={index + 1}
                  />
                );
              })}
            </div>

            {/* Expandable Arrow & Exercise List */}
            <div className="ion-padding-horizontal" style={{ marginBottom: '16px' }}>
              {/* Pulsing Arrow Button */}
              <motion.div
                onClick={() => setIsExerciseListExpanded(!isExerciseListExpanded)}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    y: isExerciseListExpanded ? 0 : [0, 4, 0],
                    rotate: isExerciseListExpanded ? 180 : 0
                  }}
                  transition={{
                    y: { repeat: isExerciseListExpanded ? 0 : Infinity, duration: 1.5, ease: "easeInOut" },
                    rotate: { duration: 0.3 }
                  }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(var(--ion-color-primary-rgb), 0.1)',
                    color: 'var(--ion-color-primary)'
                  }}
                >
                  <IonIcon icon={chevronDownOutline} style={{ fontSize: '20px' }} />
                </motion.div>
              </motion.div>

              {/* Expandable Exercise List using Ionic Components */}
              <AnimatePresence>
                {isExerciseListExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <IonCard
                    // style={{
                    //   margin: 0,
                    //   WebkitBackdropFilter: 'blur(20px)',
                    //   borderRadius: '24px',
                    //   boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    // }}
                    >
                      <IonList lines="none" style={{ background: 'transparent' }}>
                        {workout_day_exercises.map((ex, idx) => {
                          // ✅ Usa progress e sets dallo state centralizzato (aggiornato in tempo reale)
                          const progressData = exerciseProgressMap[ex.id_workout_day_exercise];
                          const progress = Math.round(progressData?.progress || 0);
                          const completed = progressData?.completedSets || 0;
                          const total = progressData?.totalSets || ex.sets || 1;

                          return (
                            <motion.div
                              key={ex.id_workout_day_exercise}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                            >
                              <IonItem
                                button
                                detail={false}
                                onClick={() => {
                                  selectExercise(idx);
                                }}
                                style={{
                                  '--background': selectedExerciseIndex === idx
                                    ? 'rgba(var(--ion-color-primary-rgb), 0.1)'
                                    : 'transparent',
                                  '--background-hover': 'rgba(var(--ion-color-primary-rgb), 0.05)',
                                  '--padding-start': '16px',
                                  '--padding-end': '16px',
                                  '--inner-padding-end': '0px',
                                  '--border-color': idx < workout_day_exercises.length - 1
                                    ? 'rgba(var(--ion-text-color-rgb), 0.1)'
                                    : 'transparent',
                                  cursor: 'pointer'
                                }}
                                lines={idx < workout_day_exercises.length - 1 ? "full" : "none"}
                              >
                                <div slot="start" style={{ marginRight: '12px', position: 'relative' }}>
                                  <CircularProgress
                                    percentage={progress}
                                    size={40}
                                    strokeWidth={4}
                                    color='progressColor'
                                    showText={false}
                                    duration={0.6}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    color: 'var(--ion-text-color)'
                                  }}>
                                    {idx + 1}
                                  </div>
                                </div>

                                <IonLabel>
                                  <h3 style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                                    {ex.exercise_name}
                                  </h3>
                                  <p style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--ion-color-medium)',
                                    margin: '2px 0 0 0'
                                  }}>
                                    {total} serie • {completed}/{total} completate
                                  </p>
                                </IonLabel>

                                {selectedExerciseIndex === idx && (
                                  <motion.div
                                    slot="end"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    style={{
                                      width: '8px',
                                      height: '8px',
                                      borderRadius: '50%',
                                      background: 'var(--ion-color-primary)'
                                    }}
                                  />
                                )}
                              </IonItem>
                            </motion.div>
                          );
                        })}
                      </IonList>
                    </IonCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Content - KEYED BY EXERCISE ID TO FORCE FULL REMOUNT */}
        <div style={{ paddingBottom: '80px' }}>
          {currentWorkoutDayExerciseId && (
            <SingleExerciseContainer
              key={currentWorkoutDayExerciseId}
              exerciseId={currentWorkoutDayExerciseId}
              workout_day_exercise={workout_day_exercise}
              onOpenHistory={openHistoryModal}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ExerciseDetail;
// @ts-nocheck
