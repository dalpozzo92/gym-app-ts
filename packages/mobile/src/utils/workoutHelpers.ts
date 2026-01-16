// @ts-nocheck
import type { WorkoutDayExercise, SetGroup, WorkoutSetSequence, IntensityGroup } from '@/types/workout';

/**
 * Raggruppa le serie per superset/jumpset
 *
 * Logica:
 * 1. Identifica serie con lo stesso group_intensity_id
 * 2. Raggruppa per numero di serie (set_number)
 * 3. Determina il tipo di gruppo (single, superset, jumpset)
 *
 * Esempio Output per Superset:
 * - SetGroup 1: Panca Serie 1 + Rematore Serie 1
 * - SetGroup 2: Panca Serie 2 + Rematore Serie 2
 * - SetGroup 3: Panca Serie 3 + Rematore Serie 3
 *
 * @param exercises Lista di workout_day_exercises per il giorno
 * @param intensityGroups Lista di intensity groups (opzionale)
 * @returns Array di SetGroup ordinati per esecuzione
 */
export function groupSetsForExecution(
  exercises: WorkoutDayExercise[],
  intensityGroups?: IntensityGroup[]
): WorkoutSetSequence {
  if (!exercises || exercises.length === 0) {
    return { setGroups: [], totalSets: 0, completedSets: 0 };
  }

  // Mappa per raggruppare serie per group_intensity_id
  const groupMap = new Map<number | null, Map<number, SetGroup>>();

  // Processa ogni esercizio e le sue serie
  exercises.forEach((exercise) => {
    const sets = exercise.workout_exercise_sets || [];

    sets.forEach((set) => {
      const groupId = set.group_intensity_id ?? null;
      const setNumber = set.set_number;

      // Inizializza mappa per questo gruppo se non esiste
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, new Map());
      }

      const setNumberMap = groupMap.get(groupId)!;

      // Inizializza SetGroup per questo numero di serie se non esiste
      if (!setNumberMap.has(setNumber)) {
        // Trova intensity group info se disponibile
        const intensityGroup = intensityGroups?.find(
          (ig) => ig.id_workout_exercise_group_intensity === groupId
        );

        setNumberMap.set(setNumber, {
          groupType: 'single', // Verrà aggiornato dopo
          setNumber,
          intensityGroup,
          exercises: [],
          restTime: set.rest_time || exercise.rest_time || 60
        });
      }

      // Aggiungi esercizio e serie al gruppo
      const setGroup = setNumberMap.get(setNumber)!;
      setGroup.exercises.push({ exercise, set });
    });
  });

  // Converti la mappa in array e determina il tipo di gruppo
  const allSetGroups: SetGroup[] = [];

  groupMap.forEach((setNumberMap, groupId) => {
    setNumberMap.forEach((setGroup) => {
      // Determina il tipo di gruppo
      if (setGroup.exercises.length === 1) {
        setGroup.groupType = 'single';
      } else if (setGroup.intensityGroup?.type === 'superset') {
        setGroup.groupType = 'superset';
      } else if (setGroup.intensityGroup?.type === 'jumpset') {
        setGroup.groupType = 'jumpset';
      } else if (groupId !== null) {
        // Se ha group_intensity_id ma non è definito il tipo, default a superset
        setGroup.groupType = 'superset';
      } else {
        setGroup.groupType = 'single';
      }

      allSetGroups.push(setGroup);
    });
  });

  // Ordina per numero di serie
  allSetGroups.sort((a, b) => a.setNumber - b.setNumber);

  // Calcola statistiche
  const totalSets = allSetGroups.length;
  const completedSets = allSetGroups.filter((sg) =>
    sg.exercises.every(({ set }) => (set.actual_load || 0) > 0 && (set.actual_reps || 0) > 0)
  ).length;

  return {
    setGroups: allSetGroups,
    totalSets,
    completedSets
  };
}

/**
 * Trova l'indice di un SetGroup dato il numero di serie
 */
export function findSetGroupIndex(setGroups: SetGroup[], setNumber: number): number {
  return setGroups.findIndex((sg) => sg.setNumber === setNumber);
}

/**
 * Verifica se un SetGroup è completato
 */
export function isSetGroupCompleted(setGroup: SetGroup): boolean {
  return setGroup.exercises.every(({ set }) => (set.actual_load || 0) > 0 && (set.actual_reps || 0) > 0);
}

/**
 * Ottiene il prossimo SetGroup non completato
 */
export function getNextIncompleteSetGroup(setGroups: SetGroup[]): SetGroup | null {
  return setGroups.find((sg) => !isSetGroupCompleted(sg)) || null;
}

/**
 * Calcola il progresso totale del workout
 */
export function calculateWorkoutProgress(setGroups: SetGroup[]): {
  completedSets: number;
  totalSets: number;
  percentage: number;
} {
  const totalSets = setGroups.length;
  const completedSets = setGroups.filter(isSetGroupCompleted).length;
  const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  return { completedSets, totalSets, percentage };
}
