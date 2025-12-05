import { useEffect, useState, useCallback, useRef } from 'react';
import { setExerciseCache, addPendingOp, type ExerciseCache, type ExerciseSet } from '@/db/dexie';

type SetState = {
  setId: string;
  reps?: number;
  load?: number;
  actual_reps?: number; // ✅ New field
  actual_load?: number; // ✅ New field
  rpe?: number | null;
  execution_rating?: number | null;
  notes?: string | null;
  id_reps_type?: number;
  intensity_type?: string;
  group_intensity_id?: number;
  completed?: boolean;
  completed_at?: string;
  dirty?: boolean;
};

type Update = {
  setId: string;
  field: 'actual_reps' | 'actual_load' | 'rpe' | 'execution_rating' | 'notes' | 'completed' | 'completed_at';
  value: number | string | boolean | null;
};

/**
 * 🔄 AUTO-SAVE SETS HOOK
 *
 * Gestisce l'auto-save delle modifiche agli esercizi:
 * 1. Salva SEMPRE in IndexedDB (cache locale)
 * 2. Aggiunge una pending operation per il sync worker
 * 3. Il sync worker si occuperà di sincronizzare con il server ogni 3 secondi
 */
export const useAutosaveSets = (exerciseId: string, initial: SetState[]) => {
  const [sets, setSets] = useState<SetState[]>(initial);
  const prevExerciseIdRef = useRef(exerciseId);
  const initializedRef = useRef(false);

  // ✅ Reset e reload quando cambia exerciseId o initial cambia
  useEffect(() => {
    if (exerciseId !== prevExerciseIdRef.current) {
      // Cambio esercizio: resetta tutto immediatamente
      prevExerciseIdRef.current = exerciseId;
      setSets(initial); // Usa subito i nuovi initial sets (che dovrebbero essere vuoti o corretti)
      initializedRef.current = true;
    } else if (initial.length > 0 && (!initializedRef.current || sets.length === 0)) {
      // Primo caricamento o arrivo dati asincroni
      setSets(initial);
      initializedRef.current = true;
    }
  }, [exerciseId, initial, sets.length]);

  // ✅ Ascolta evento di sync completato per resettare dirty flags
  useEffect(() => {
    const handleSyncCompleted = (event: any) => {
      const { exerciseIds } = event.detail;
      if (exerciseIds.includes(exerciseId)) {
        setSets(prev => prev.map(s => ({ ...s, dirty: false })));
      }
    };

    window.addEventListener('sync:completed', handleSyncCompleted);
    return () => window.removeEventListener('sync:completed', handleSyncCompleted);
  }, [exerciseId]);

  const updateSet = useCallback(
    async (u: Update) => {

      // ✅ STEP 1: Aggiorna stato locale
      setSets(prev => {
        const newSets = prev.map(s => {
          if (s.setId !== u.setId) return s;

          // ✅ Aggiorna il campo
          const updates: any = { [u.field]: u.value, dirty: true };

          // ✅ Calcola il nuovo stato del set dopo l'aggiornamento
          const updatedSet = { ...s, ...updates };

          // ✅ Auto-set completed: true se ENTRAMBI actual_load E actual_reps > 0
          const actualLoad = updatedSet.actual_load || 0;
          const actualReps = updatedSet.actual_reps || 0;
          updates.completed = actualLoad > 0 && actualReps > 0;

          // ✅ Set completed_at se diventa completato
          if (updates.completed && !s.completed) {
            updates.completed_at = new Date().toISOString();
          }

          return { ...s, ...updates };
        });

        // ✅ STEP 2: Salva in IndexedDB (cache locale)
        const cache: ExerciseCache = {
          exerciseId,
          sets: newSets.map((s): ExerciseSet => ({
            setId: s.setId,
            actual_reps: s.actual_reps || 0,
            actual_load: s.actual_load || 0,
            rpe: s.rpe ?? null,
            execution_rating: s.execution_rating ?? null,
            notes: s.notes ?? null,
            updatedAt: Date.now(),
            // Readonly fields from backend
            reps_min: s.reps_min,
            reps_max: s.reps_max,
            rest_time: s.rest_time,
            target_load: s.target_load,
            id_reps_type: s.id_reps_type,
            intensity_type: s.intensity_type,
            group_intensity_id: s.group_intensity_id,
            completed: s.completed,
            completed_at: s.completed_at
          })),
          lastSync: Date.now()
        };

        setExerciseCache(cache).catch(() => { });

        return newSets;
      });

      // ✅ STEP 3: Aggiungi pending operation per sync worker
      try {
        await addPendingOp({
          id: crypto.randomUUID(),
          exerciseId,
          setId: u.setId,
          field: u.field,
          value: u.value,
          timestamp: Date.now()
        });
      } catch (err) {
        // Ignora errori silenziosamente
      }
    },
    [exerciseId]
  );

  const markAllSaved = useCallback(() => {
    setSets(prev => prev.map(s => ({ ...s, dirty: false })));
  }, []);

  return { sets, updateSet, markAllSaved };
};
