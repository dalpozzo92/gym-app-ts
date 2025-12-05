import { useState, useEffect, useCallback } from 'react';
import { getWorkoutDayExercise } from '@/api/workout';
import { getExerciseCache, setExerciseCache, type ExerciseCache } from '@/db/dexie';

type State = {
    data?: ExerciseCache;
    loading: boolean;
    error?: string;
    isOfflineData: boolean;
};

export const useExerciseDetailData = (exerciseId?: string | number) => {
    const [state, setState] = useState<State>({
        loading: true,
        isOfflineData: false
    });

    const fetchData = useCallback(async () => {
        if (!exerciseId) {
            setState(prev => ({ ...prev, loading: false, data: undefined }));
            return;
        }

        setState(prev => ({ ...prev, loading: true, error: undefined }));

        // ✅ Race condition protection
        let isCancelled = false;

        try {
            // 1. Tentativo fetch API
            const remoteData: any = await getWorkoutDayExercise(exerciseId);

            if (isCancelled) return;

            // Mappatura dati per coerenza con cache e UI
            const mappedData: ExerciseCache = {
                exerciseId: String(exerciseId),
                sets: (remoteData.workout_exercise_sets || []).map((s: any, index: number) => ({
                    setId: String(s.set_number || index + 1),
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
                    completed: s.completed,
                    completed_at: s.completed_at,
                    id_reps_type: s.id_reps_type,
                    intensity_type: s.intensity_type,
                    group_intensity_id: s.group_intensity_id
                })),
                lastSync: Date.now()
            };

            // 2. Salva in cache per uso futuro (fire and forget)
            setExerciseCache(mappedData).catch(console.error);

            setState({
                data: mappedData,
                loading: false,
                isOfflineData: false
            });

        } catch (apiError) {
            if (isCancelled) return;
            console.warn('⚠️ [useExerciseDetailData] API Error, fallback to cache:', apiError);

            // 3. Fallback su Cache
            try {
                const cached = await getExerciseCache(String(exerciseId));

                if (isCancelled) return;

                if (cached) {
                    setState({
                        data: cached,
                        loading: false,
                        isOfflineData: true
                    });
                } else {
                    setState({
                        loading: false,
                        error: 'Impossibile caricare i dati (Offline e nessuna cache)',
                        isOfflineData: true
                    });
                }
            } catch (cacheError) {
                if (isCancelled) return;
                setState({
                    loading: false,
                    error: 'Errore critico caricamento dati',
                    isOfflineData: true
                });
            }
        }

        return () => {
            isCancelled = true;
        };
    }, [exerciseId]);

    useEffect(() => {
        const cancel = fetchData();
        // @ts-ignore
        return () => {
            cancel.then(c => c && c());
        };
    }, [fetchData]);

    return { ...state, refetch: fetchData };
};
