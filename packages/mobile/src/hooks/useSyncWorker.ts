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
 *
 * ✅ FASE 1 & 2 MIGLIORAMENTI:
 * - Mutex per evitare sync paralleli (un solo sync alla volta)
 * - Merge intelligente delle pending ops (solo l'ultimo valore per campo)
 */

// ✅ MUTEX: Garantisce che un solo sync possa essere eseguito alla volta
let syncMutex = false;
let pendingFlushScheduled = false;

/**
 * 🧠 MERGE INTELLIGENTE: Consolida pending ops mantenendo solo l'ultimo valore per campo
 * Riduce il numero di operazioni da sincronizzare eliminando valori intermedi obsoleti
 */
const consolidatePendingOps = (ops: PendingOp[]): PendingOp[] => {
  if (ops.length === 0) return [];

  // Mappa: `${exerciseId}-${setId}-${field}` → ultima PendingOp
  const consolidated = new Map<string, PendingOp>();

  for (const op of ops) {
    const key = `${op.exerciseId}-${op.setId}-${op.field}`;
    const existing = consolidated.get(key);

    // Mantieni solo l'operazione con timestamp più recente
    if (!existing || op.timestamp > existing.timestamp) {
      consolidated.set(key, op);
    }
  }

  const result = Array.from(consolidated.values());

  if (result.length < ops.length) {
    console.log(`🧹 [SyncWorker] Consolidate ${ops.length} ops → ${result.length} ops (risparmiate ${ops.length - result.length})`);
  }

  return result;
};

const sendPendingOps = async (ops: PendingOp[]): Promise<boolean> => {
  if (ops.length === 0) {
    console.log('✅ [SyncWorker] Nessuna pending operation da sincronizzare');
    return true;
  }

  console.log('🔍 [SyncWorker] Pending operations da sincronizzare:', ops);

  // ✅ FASE 2: Merge intelligente - consolida pending ops prima del sync
  const consolidatedOps = consolidatePendingOps(ops);

  // Raggruppa per exerciseId + setId (passa SOLO i campi modificabili dall'utente)
  const groupedBySet = consolidatedOps.reduce((acc: any, op: PendingOp) => {
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

    // ✅ Sync completato: cancella TUTTE le pending ops originali (anche quelle consolidate)
    // Questo è importante: se avevamo 10 ops consolidate in 3, cancelliamo tutte le 10 originali
    const idsToDelete = ops.map(op => op.id);
    await deletePendingOpsByIds(idsToDelete);
    console.log('🧹 [SyncWorker] Pending operations sincronizzate cancellate:', idsToDelete.length);

    // ✅ Aggiorna cache locale con dati freschi dal server
    const uniqueExerciseIds = Array.from(new Set(consolidatedOps.map(op => op.exerciseId)));

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
 * ✅ FASE 1: Con mutex per evitare sync paralleli
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

      // ✅ FASE 1: Controlla mutex - se un sync è già in corso, salta e segna per retry
      if (syncMutex) {
        console.log('⏭️ [SyncWorker] Sync già in corso, salto questo tick');
        pendingFlushScheduled = true; // Segna che dobbiamo riprovare
        return;
      }

      // ✅ FASE 1: Acquisisci mutex
      syncMutex = true;
      pendingFlushScheduled = false;

      try {
        const pending = await getAllPendingOps();
        await sendPendingOps(pending);
      } finally {
        // ✅ FASE 1: Rilascia mutex
        syncMutex = false;

        // Se durante il sync è arrivata un'altra richiesta, esegui subito un altro sync
        if (pendingFlushScheduled) {
          console.log('🔄 [SyncWorker] Sync pendente rilevato, eseguo subito');
          pendingFlushScheduled = false;
          setTimeout(() => tick(), 100); // Piccolo delay per evitare loop stretto
        }
      }
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
 * ✅ FASE 1: Con mutex per evitare conflitti con sync automatico
 */
export const flushPendingOpsNow = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log('⚠️ [SyncWorker] Offline - skip flush');
    return false;
  }

  // ✅ FASE 1: Se un sync è già in corso, aspetta che finisca (max 5 secondi)
  let retries = 0;
  while (syncMutex && retries < 50) {
    console.log('⏳ [SyncWorker] Flush in attesa che sync corrente finisca...');
    await new Promise(resolve => setTimeout(resolve, 100));
    retries++;
  }

  if (syncMutex) {
    console.warn('⚠️ [SyncWorker] Timeout in attesa mutex, forzo flush');
  }

  // ✅ FASE 1: Acquisisci mutex
  syncMutex = true;

  try {
    const pending = await getAllPendingOps();

    if (pending.length === 0) {
      console.log('✅ [SyncWorker] Nessuna pending operation da flushare');
      return true;
    }

    console.log('🔄 [SyncWorker] Flush manuale in corso...', pending);

    return await sendPendingOps(pending);
  } finally {
    // ✅ FASE 1: Rilascia mutex
    syncMutex = false;
  }
};
