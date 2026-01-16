// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  IonIcon,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonCard,
  IonText,
  IonChip
} from '@ionic/react';
import {
  chevronDownOutline,
  gridOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { useWorkoutDayExercises } from '@/hooks/useWorkout';
import { useExerciseDetailData } from '@/hooks/useExerciseDetailData';
import SetListItem from '@/components/workout/SetListItem';
import SetDetailBottomSheet from '@/components/workout/SetDetailBottomSheet';
import BilanciereLoader from '@/components/BilanciereLoader';
import AnimatedBackground from '@/components/AnimatedBackground';
import CircularProgress from '@/components/CircularProgress';
import { buildRoute } from '@/routes';
import { syncWorkoutExerciseSets, getPreviousWorkoutExerciseSet } from '@/api/workout';
import { groupSetsForExecution } from '@/utils/workoutHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import type { SetGroup, WorkoutDayExercise } from '@/types/workout';
import { useSyncWorker } from '@/hooks/useSyncWorker';

// Helper: Raggruppa esercizi per blocco di esecuzione
const groupExercisesIntoBlocks = (exercises: WorkoutDayExercise[]) => {
  if (!exercises || exercises.length === 0) return [];

  const blocks: Array<{
    id: string;
    type: 'single' | 'superset' | 'jumpset';
    name: string;
    exercises: WorkoutDayExercise[];
    intensityGroupId?: number | null;
  }> = [];

  let currentBlock: typeof blocks[0] | null = null;

  exercises.forEach((ex) => {
    const firstSet = ex.workout_exercise_sets?.[0];
    const groupIntensityId = firstSet?.group_intensity_id ?? null;

    if (currentBlock && groupIntensityId !== null && currentBlock.intensityGroupId === groupIntensityId) {
      currentBlock.exercises.push(ex);
      currentBlock.name += ` + ${ex.exercise_name}`;
      currentBlock.type = 'superset';
    } else {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: `block-${ex.id_workout_day_exercise}`,
        type: 'single',
        name: ex.exercise_name,
        exercises: [ex],
        intensityGroupId: groupIntensityId
      };
    }
  });

  if (currentBlock) blocks.push(currentBlock);
  return blocks;
};

// Helper: Calcola progress per un blocco
const calculateBlockProgress = (block: any) => {
  let totalSets = 0;
  let completedSets = 0;

  block.exercises.forEach((ex: any) => {
    const sets = ex.workout_exercise_sets || [];
    totalSets += sets.length;
    completedSets += sets.filter((s: any) => (s.actual_load || 0) > 0 && (s.actual_reps || 0) > 0).length;
  });

  return {
    total: totalSets,
    completed: completedSets,
    percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  };
};

const ExerciseDetail: React.FC = () => {
  const { id_program_day, id_workout_day_exercise } = useParams<{ id_program_day: string, id_workout_day_exercise: string }>();
  const history = useHistory();

  // 1. Data Fetching
  const {
    data: dayExercisesData,
    loading: isLoadingDayExercises,
    refresh: refreshExercises
  } = useWorkoutDayExercises(Number(id_program_day));

  const workout_day_exercises = dayExercisesData?.workout_day_exercises || [];

  useSyncWorker();

  // 2. State
  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [selectedSetGroup, setSelectedSetGroup] = useState<SetGroup | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
  const [isSetDetailOpen, setIsSetDetailOpen] = useState(false);
  const [isBlockListExpanded, setIsBlockListExpanded] = useState(false);
  const [previousSetsData, setPreviousSetsData] = useState<any[]>([]);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = 0;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeBlockIndex < exerciseBlocks.length - 1) {
      handleBlockChange(activeBlockIndex + 1);
    }

    if (isRightSwipe && activeBlockIndex > 0) {
      handleBlockChange(activeBlockIndex - 1);
    }
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  // 3. Computed Blocks
  const exerciseBlocks = useMemo(() => {
    return groupExercisesIntoBlocks(workout_day_exercises);
  }, [workout_day_exercises]);

  // 4. Sync Active Block con URL
  useEffect(() => {
    if (exerciseBlocks.length > 0 && id_workout_day_exercise) {
      const index = exerciseBlocks.findIndex(b =>
        b.exercises.some(e => Number(e.id_workout_day_exercise) === Number(id_workout_day_exercise))
      );

      if (index !== -1 && index !== activeBlockIndex) {
        setActiveBlockIndex(index);
      }
    }
  }, [exerciseBlocks, id_workout_day_exercise, activeBlockIndex]);

  // 5. Active Set Groups
  const activeSetGroups = useMemo(() => {
    const currentBlock = exerciseBlocks[activeBlockIndex];
    if (!currentBlock) return [];
    const { setGroups } = groupSetsForExecution(currentBlock.exercises);
    return setGroups;
  }, [exerciseBlocks, activeBlockIndex]);

  const handleBlockChange = (index: number) => {
    setDirection(index > activeBlockIndex ? 1 : -1);
    setActiveBlockIndex(index);
    // setIsBlockListExpanded(false); // Mantieni aperto come richiesto
    const firstExId = exerciseBlocks[index].exercises[0].id_workout_day_exercise;
    history.replace(buildRoute.exerciseDetail(id_program_day, firstExId));
  };

  const handleSetClick = (setGroup: SetGroup, exerciseIndex: number = 0) => {
    setSelectedSetGroup(setGroup);
    setSelectedExerciseIndex(exerciseIndex);
    setIsSetDetailOpen(true);
  };

  // Sync selectedSetGroup when data updates
  useEffect(() => {
    if (selectedSetGroup && activeSetGroups.length > 0) {
      const updatedGroup = activeSetGroups.find(
        sg => sg.setNumber === selectedSetGroup.setNumber
      );
      if (updatedGroup && updatedGroup !== selectedSetGroup) {
        setSelectedSetGroup(updatedGroup);
      }
    }
  }, [activeSetGroups]);

  // Fetch Previous Data for selected group
  useEffect(() => {
    const fetchPreviousData = async () => {
      if (!selectedSetGroup) {
        setPreviousSetsData([]);
        return;
      }

      const promises = selectedSetGroup.exercises.map(async (ex) => {
        const weekNumber = ex.exercise.week_number;
        if (!weekNumber) return null;

        try {
          const res = await getPreviousWorkoutExerciseSet(
            ex.exercise.id_workout_day_exercise,
            selectedSetGroup.setNumber,
            weekNumber
          );

          if (res.previous_workout_exercise_set) {
            return {
              exerciseId: ex.exercise.id_workout_day_exercise,
              load: res.previous_workout_exercise_set.load,
              reps: res.previous_workout_exercise_set.reps
            };
          }
        } catch (err) {
          console.error("Error fetching previous set", err);
        }
        return null;
      });

      const results = await Promise.all(promises);
      setPreviousSetsData(results.filter(Boolean));
    };

    fetchPreviousData();
  }, [selectedSetGroup]);

  const handleUpdateSet = async (exerciseId: number, setNumber: number, updates: any) => {
    const block = exerciseBlocks[activeBlockIndex];
    if (!block) return;
    const exercise = block.exercises.find(e => e.id_workout_day_exercise === exerciseId);
    if (!exercise) return;
    const set = exercise.workout_exercise_sets?.find(s => s.set_number === setNumber);
    if (!set) return;

    try {
      await syncWorkoutExerciseSets([{
        ...set,
        ...updates,
        id_workout_day_exercises: exerciseId,
        completed: (updates.actual_load > 0 && updates.actual_reps > 0) || (set.actual_load > 0 && set.actual_reps > 0)
      }]);
      if (refreshExercises) {
        refreshExercises();
      }
    } catch (e) {
      console.error("Update set failed", e);
    }
  };

  const handleNavigateSet = (direction: 'next' | 'prev') => {
    if (!selectedSetGroup) return;
    const currentIdx = activeSetGroups.findIndex(sg => sg.setNumber === selectedSetGroup.setNumber);
    if (currentIdx === -1) return;

    if (direction === 'next') {
      // Prova esercizio successivo nel gruppo corrente
      if (selectedExerciseIndex < selectedSetGroup.exercises.length - 1) {
        setSelectedExerciseIndex(prev => prev + 1);
      } else {
        // Prossimo gruppo
        const newIdx = currentIdx + 1;
        if (newIdx < activeSetGroups.length) {
          setSelectedSetGroup(activeSetGroups[newIdx]);
          setSelectedExerciseIndex(0);
        }
      }
    } else {
      // Prova esercizio precedente nel gruppo corrente
      if (selectedExerciseIndex > 0) {
        setSelectedExerciseIndex(prev => prev - 1);
      } else {
        // Gruppo precedente
        const newIdx = currentIdx - 1;
        if (newIdx >= 0) {
          const prevGroup = activeSetGroups[newIdx];
          setSelectedSetGroup(prevGroup);
          // Vai all'ultimo esercizio del gruppo precedente
          setSelectedExerciseIndex(prevGroup.exercises.length - 1);
        }
      }
    }
  };

  const renderLoader = () => (
    <div style={{
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '30vh'
    }}>
      <BilanciereLoader show={true} size="small" speed={1.2} message="Pronto a iniziare?" inline={false} />
    </div>
  );

  // Forza il loader solo se stiamo caricando per la prima volta (nessun dato)
  if (isLoadingDayExercises && (!workout_day_exercises || workout_day_exercises.length === 0)) {
    return renderLoader();
  }

  const currentBlock = exerciseBlocks[activeBlockIndex];

  if (!currentBlock) {
    return <div className="ion-padding" style={{ marginTop: '60px' }}>Nessun esercizio presente.</div>;
  }

  const currentBlockProgress = calculateBlockProgress(currentBlock);

  // Helper per colori progress
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success'; // Green
    if (percentage >= 50) return 'primary'; // Blue/Default
    if (percentage > 0) return 'warning'; // Orange
    return 'medium'; // Grey
  };

  return (
    <>
      {/* Background - fixed position */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <AnimatedBackground variant="linee-move" intensity="light" height="250px" position="absolute" speed={3} fadeInDuration={2000} />
      </div>

      {/* Container principale con z-index per stare sopra il background */}
      <div style={{ position: 'relative', zIndex: 1, paddingBottom: '100px' }}>

        {/* Header: Torna al programma (Stile ridotto) */}
        <div className="ion-padding-horizontal" style={{ paddingTop: '10px', marginBottom: '12px' }}>
          <IonButton
            fill="clear"
            onClick={() => history.push(buildRoute.programWeeks(id_program_day))}
            style={{
              marginLeft: '-12px',
              height: '28px',
              '--color': 'var(--ion-color-medium)', // Meno visibile
              opacity: 0.8
            }}
          >
            <IonIcon icon={chevronBackOutline} slot="icon-only" style={{ fontSize: '18px' }} />
            <IonText style={{ fontSize: '0.8rem', fontWeight: '500', marginLeft: '2px', textTransform: 'none' }}>
              Torna al programma
            </IonText>
          </IonButton>
        </div>

        {/* Block Selector Card */}
        <div className="ion-padding-horizontal" style={{ paddingBottom: '8px' }}>
          <div
            onClick={() => setIsBlockListExpanded(!isBlockListExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(var(--ion-card-background-rgb), 0.75)', // Glassy
              backdropFilter: 'blur(12px)',
              padding: '16px',
              borderRadius: '20px',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              border: '1px solid rgba(var(--ion-text-color-rgb), 0.05)'
            }}
          >
            <div style={{ overflow: 'hidden', flex: 1, paddingRight: '12px' }}>
              <IonText color="medium" style={{ fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '4px' }}>
                {currentBlock.type === 'superset' ? 'BLOCK SUPERSET' : 'ESERCIZIO SINGOLO'} • {activeBlockIndex + 1}/{exerciseBlocks.length}
              </IonText>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', lineHeight: '1.3', color: 'var(--ion-text-color)' }}>
                {currentBlock.name}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Progress corrente */}
              <CircularProgress
                percentage={currentBlockProgress.percentage}
                size={34}
                strokeWidth={3}
                showText={false}
                color={getProgressColor(currentBlockProgress.percentage)}
              />
              <div style={{
                marginLeft: '12px',
                padding: '6px',
                background: 'rgba(var(--ion-text-color-rgb), 0.05)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IonIcon icon={chevronDownOutline} style={{
                  fontSize: '16px',
                  color: 'var(--ion-text-color)',
                  transform: isBlockListExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s'
                }} />
              </div>
            </div>
          </div>

          {/* Dropdown Blocks List */}
          <AnimatePresence>
            {isBlockListExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden', marginTop: '12px' }}
              >
                <IonCard style={{ margin: 0, borderRadius: '20px', background: 'rgba(var(--ion-card-background-rgb), 0.95)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                  <IonList lines="none" style={{ background: 'transparent', padding: '8px' }}>
                    {exerciseBlocks.map((block, idx) => {
                      const progress = calculateBlockProgress(block);
                      const isActive = idx === activeBlockIndex;
                      return (
                        <IonItem
                          key={block.id}
                          button
                          detail={false}
                          onClick={() => handleBlockChange(idx)}
                          style={{
                            '--background': isActive ? 'rgba(var(--ion-color-primary-rgb), 0.08)' : 'transparent',
                            '--border-radius': '12px',
                            marginBottom: '4px'
                          }}
                        >
                          <div slot="start" style={{ marginRight: '16px' }}>
                            <CircularProgress
                              percentage={progress.percentage}
                              size={40}
                              strokeWidth={3}
                              showText={true}
                              color={getProgressColor(progress.percentage)}
                            />
                          </div>
                          <IonLabel>
                            <h3 style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--ion-text-color)' }}>{block.name}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>
                              {block.type === 'superset' ? 'Superset' : 'Singolo'} • {progress.completed}/{progress.total} set
                            </p>
                          </IonLabel>
                        </IonItem>
                      );
                    })}
                  </IonList>
                </IonCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sets List with Swipe & Animation */}
        <div
          className="ion-padding-horizontal"
          style={{ marginTop: '8px', minHeight: '200px', overflow: 'hidden' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence initial={false} custom={direction} mode='wait'>
            <motion.div
              key={activeBlockIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              style={{ width: '100%' }}
            >
              {activeSetGroups.length > 0 ? (
                activeSetGroups.map(group => {
                  const isCompleted = group.exercises.every(e => (e.set.actual_reps || 0) > 0);

                  // Se singolo esercizio, usa componente esistente
                  if (group.groupType === 'single') {
                    return (
                      <SetListItem
                        key={`${group.setNumber}-${group.groupType}`}
                        setGroup={group}
                        onClick={() => handleSetClick(group, 0)}
                        isCompleted={isCompleted}
                      />
                    );
                  }

                  // Se superset/jumpset, renderizza lista splittata
                  return (
                    <div
                      key={`${group.setNumber}-${group.groupType}`}
                      style={{
                        margin: '0 0 12px 0',
                        background: 'rgba(var(--ion-card-background-rgb), 0.5)',
                        borderRadius: '16px',
                        padding: '8px'
                      }}
                    >
                      {/* Header Gruppo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '8px' }}>
                        <IonText style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--ion-color-medium)' }}>
                          Serie {group.setNumber}
                        </IonText>
                        <IonChip
                          style={{
                            margin: 0,
                            height: '20px',
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            '--background': group.groupType === 'superset' ? 'rgba(var(--ion-color-primary-rgb), 0.15)' : 'rgba(var(--ion-color-tertiary-rgb), 0.15)',
                            '--color': group.groupType === 'superset' ? 'var(--ion-color-primary)' : 'var(--ion-color-tertiary)'
                          }}
                        >
                          {group.groupType === 'superset' ? 'SUPERSET' : 'JUMPSET'}
                        </IonChip>
                      </div>

                      {group.exercises.map((ex, exIdx) => {
                        const isLast = exIdx === group.exercises.length - 1;
                        const setCompleted = (ex.set.actual_reps || 0) > 0;
                        const prescribedLoad = ex.set.actual_load || 0;

                        return (
                          <div key={ex.exercise.id_workout_day_exercise} style={{ position: 'relative' }}>
                            {/* Connector Line */}
                            {!isLast && (
                              <div style={{
                                position: 'absolute',
                                left: '24px',
                                top: '40px',
                                bottom: '-10px',
                                width: '2px',
                                background: 'var(--ion-color-medium)',
                                opacity: 0.2,
                                zIndex: 0
                              }} />
                            )}

                            <IonCard
                              button
                              onClick={() => handleSetClick(group, exIdx)}
                              style={{
                                margin: '0 0 8px 0',
                                '--background': 'var(--ion-card-background)',
                                boxShadow: 'none',
                                border: '1px solid rgba(var(--ion-text-color-rgb), 0.05)',
                                zIndex: 1,
                                position: 'relative'
                              }}
                            >
                              <IonItem lines="none" detail={false} style={{ '--padding-start': '12px', '--padding-end': '12px' }}>
                                <div slot="start" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                                  <IonIcon
                                    icon={setCompleted ? checkmarkCircleOutline : alertCircleOutline}
                                    color={setCompleted ? 'success' : 'warning'}
                                    style={{ fontSize: '20px' }}
                                  />
                                </div>
                                <IonLabel>
                                  <h3 style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '2px' }}>{ex.exercise.exercise_name}</h3>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: setCompleted ? 'var(--ion-color-success)' : 'var(--ion-color-warning)', fontWeight: '500' }}>
                                      {setCompleted
                                        ? `${ex.set.actual_load}kg × ${ex.set.actual_reps}`
                                        : prescribedLoad > 0
                                          ? `${prescribedLoad}kg × --`
                                          : 'Da completare'
                                      }
                                    </span>
                                    {ex.set.reps_min && ex.set.reps_max && (
                                      <span style={{ color: 'var(--ion-color-primary)', fontSize: '0.75rem', fontWeight: '600' }}>
                                        Target: {ex.set.reps_min}-{ex.set.reps_max}
                                      </span>
                                    )}
                                  </div>
                                </IonLabel>
                              </IonItem>
                            </IonCard>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
                  <IonIcon icon={gridOutline} style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--ion-color-medium)' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--ion-text-color)' }}>Nessuna serie</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ion-color-medium)' }}>Non ci sono serie pianificate per questo esercizio.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SetDetailBottomSheet
        isOpen={isSetDetailOpen}
        onClose={() => setIsSetDetailOpen(false)}
        setGroup={selectedSetGroup}
        initialExerciseIndex={selectedExerciseIndex}
        onUpdateSet={handleUpdateSet}
        hasPrevious={
          selectedSetGroup
            ? (activeSetGroups.findIndex(sg => sg.setNumber === selectedSetGroup.setNumber) > 0 || selectedExerciseIndex > 0)
            : false
        }
        hasNext={
          selectedSetGroup
            ? (activeSetGroups.findIndex(sg => sg.setNumber === selectedSetGroup.setNumber) < activeSetGroups.length - 1 || selectedExerciseIndex < selectedSetGroup.exercises.length - 1)
            : false
        }
        onNavigatePrevious={() => handleNavigateSet('prev')}
        onNavigateNext={() => handleNavigateSet('next')}
        previousSetsData={previousSetsData}
      />
    </>
  );
};

export default ExerciseDetail;
