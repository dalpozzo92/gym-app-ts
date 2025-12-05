import { useEffect, useRef } from 'react';
import {
  getAllPendingOps,
  deletePendingOpsByIds,
  setExerciseCache,
  type PendingOp
} from '@/db/dexie';
import { syncWorkoutExerciseSets, getWorkoutDayExercise } from '@/api/workout';
import type { ExerciseCache } from '@/db/dexie';

/**
 * 🔄 SYNC WORKER - Sincronizza pending operations con il backend ogni 3 secondi
 */

const sendPendingOps = async (ops: PendingOp[]): Promise<boolean> => {
  if (ops.length === 0) {
    console.log('✅ [SyncWorker] Nessuna pending operation da sincronizzare');
    return true;
  }

  console.log('🔍 [SyncWorker] Pending operations da sincronizzare:', ops);

  // Raggruppa per exerciseId + setId (passa SOLO i campi modificabili dall'utente)
  const groupedBySet = ops.reduce((acc: any, op: PendingOp) => {
    const key = `${op.exerciseId}-${op.setId}`;

    if (!acc[key]) {
      acc[key] = {
        id_workout_day_exercises: op.exerciseId,
        set_number: parseInt(op.setId, 10)
      };
    }

    // ✅ Passa SOLO campi modificabili: actual_load, actual_reps, rpe, execution_rating, notes, completed, completed_at
    acc[key][op.field] = op.value;

    return acc;
  }, {});

  const payload = Object.values(groupedBySet);

  console.log('📤 [SyncWorker] Payload da inviare al server:', payload);

  try {
    const response = await syncWorkoutExerciseSets(payload as any);
    console.log('✅ [SyncWorker] Risposta dal server:', response);

    // ✅ Sync completato: cancella SOLO le pending ops che abbiamo sincronizzato
    const idsToDelete = ops.map(op => op.id);
    await deletePendingOpsByIds(idsToDelete);
    console.log('🧹 [SyncWorker] Pending operations sincronizzate cancellate:', idsToDelete.length);

    // ✅ Aggiorna cache locale con dati freschi dal server
    const uniqueExerciseIds = Array.from(new Set(ops.map(op => op.exerciseId)));

    for (const exerciseId of uniqueExerciseIds) {
      try {
        const freshData: any = await getWorkoutDayExercise(exerciseId);

        const updatedCache: ExerciseCache = {
          exerciseId,
          sets: (freshData.workout_exercise_sets || []).map((s: any, index: number) => ({
            setId: String(s.set_number || s.set_order || index + 1),
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

        await setExerciseCache(updatedCache);
        console.log(`✅ [SyncWorker] Cache aggiornata per esercizio ${exerciseId}`);
      } catch (err) {
        console.error(`❌ [SyncWorker] Errore aggiornamento cache per ${exerciseId}:`, err);
      }
    }

    // ✅ Notifica che il sync è completato (per resettare dirty flags)
    window.dispatchEvent(new CustomEvent('sync:completed', {
      detail: { exerciseIds: uniqueExerciseIds }
    }));

    return true;
  } catch (error: any) {
    console.error('❌ [SyncWorker] Errore chiamata syncWorkoutExerciseSets:', error);
    console.error('❌ [SyncWorker] Dettagli errore:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // ❌ Non rilanciare l'errore: riproveremo al prossimo tick
    return false;
  }
};

/**
 * Hook che avvia il sync worker automatico (ogni 3 secondi)
 */
export const useSyncWorker = () => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = async () => {
      // Skip se offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('⚠️ [SyncWorker] Offline - skip sync');
        return;
      }

      const pending = await getAllPendingOps();
      await sendPendingOps(pending);
    };

    // Esegui subito il primo tick
    tick();

    // Poi ogni 3 secondi
    timerRef.current = window.setInterval(tick, 3000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);
};

/**
 * Flush manuale delle pending ops (usato per uscita pagina)
 */
export const flushPendingOpsNow = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('⚠️ [SyncWorker] Offline - skip flush');
    return false;
  }

  const pending = await getAllPendingOps();

  if (pending.length === 0) {
    console.log('✅ [SyncWorker] Nessuna pending operation da flushare');
    return true;
  }

  console.log('🔄 [SyncWorker] Flush manuale in corso...', pending);

  return await sendPendingOps(pending);
};
