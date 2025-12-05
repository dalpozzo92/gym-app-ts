import Dexie, { type Table } from 'dexie';

// =========================================================
// 📦 TYPES
// =========================================================

export interface ExerciseSet {
  setId: string; // set_number as string
  actual_reps: number;
  actual_load: number;
  rpe: number | null;
  execution_rating: number | null;
  notes: string | null;
  updatedAt: number;
  // Additional fields
  reps_min?: number;
  reps_max?: number;
  rest_time?: number;
  target_load?: number;
  completed?: boolean;
  completed_at?: string;
  id_reps_type?: number;
  intensity_type?: string;
  group_intensity_id?: number;
}

export interface ExerciseCache {
  exerciseId: string; // id_workout_day_exercises (PK)
  sets: ExerciseSet[];
  lastSync: number;
}

export interface PendingOp {
  id: string; // UUID (PK)
  exerciseId: string;
  setId: string;
  field: 'actual_reps' | 'actual_load' | 'rpe' | 'execution_rating' | 'notes' | 'completed' | 'completed_at';
  value: any;
  timestamp: number;
}

export interface AuthTokens {
  id: string; // sempre 'auth' come chiave unica
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userId: string | null;
  updatedAt: number;
}

// =========================================================
// 🗄️ DEXIE DATABASE
// =========================================================

class GymDatabase extends Dexie {
  exerciseCache!: Table<ExerciseCache, string>;
  pendingOps!: Table<PendingOp, string>;
  authTokens!: Table<AuthTokens, string>;

  constructor() {
    super('GymDB');

    this.version(1).stores({
      exerciseCache: 'exerciseId, lastSync',
      pendingOps: 'id, exerciseId, timestamp',
      authTokens: 'id'
    });
  }
}

export const db = new GymDatabase();

// =========================================================
// 🔧 HELPER FUNCTIONS - EXERCISE CACHE
// =========================================================

export const getExerciseCache = async (exerciseId: string): Promise<ExerciseCache | undefined> => {
  return await db.exerciseCache.get(exerciseId);
};

export const setExerciseCache = async (exercise: ExerciseCache): Promise<void> => {
  await db.exerciseCache.put(exercise);
  console.log('✅ [Dexie] Exercise cache salvata:', exercise);
};

export const deleteExerciseCache = async (exerciseId: string): Promise<void> => {
  await db.exerciseCache.delete(exerciseId);
  console.log('🗑️ [Dexie] Exercise cache eliminata:', exerciseId);
};

export const getAllExerciseCache = async (): Promise<ExerciseCache[]> => {
  return await db.exerciseCache.toArray();
};

// =========================================================
// 🔧 HELPER FUNCTIONS - PENDING OPS
// =========================================================

export const addPendingOp = async (op: PendingOp): Promise<void> => {
  await db.pendingOps.add(op);
  console.log('📝 [Dexie] Pending operation aggiunta:', op);
};

export const getAllPendingOps = async (): Promise<PendingOp[]> => {
  return await db.pendingOps.toArray();
};

export const clearAllPendingOps = async (): Promise<void> => {
  await db.pendingOps.clear();
  console.log('🧹 [Dexie] Tutte le pending operations cancellate');
};

export const deletePendingOp = async (id: string): Promise<void> => {
  await db.pendingOps.delete(id);
};

export const deletePendingOpsByIds = async (ids: string[]): Promise<void> => {
  await db.pendingOps.bulkDelete(ids);
  console.log(`🧹 [Dexie] ${ids.length} pending operations cancellate`);
};

// =========================================================
// 🔧 HELPER FUNCTIONS - AUTH TOKENS
// =========================================================

const AUTH_KEY = 'auth';

export const saveAuthTokens = async (tokens: {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  userId: string | null;
}): Promise<void> => {
  await db.authTokens.put({
    id: AUTH_KEY,
    ...tokens,
    updatedAt: Date.now()
  });
  console.log('🔐 [Dexie] Auth tokens salvati');
};

export const getAuthTokens = async (): Promise<AuthTokens | undefined> => {
  return await db.authTokens.get(AUTH_KEY);
};

export const clearAuthTokens = async (): Promise<void> => {
  await db.authTokens.delete(AUTH_KEY);
  console.log('🗑️ [Dexie] Auth tokens cancellati');
};

// =========================================================
// 🧹 UTILITY - CLEAR ALL DATA
// =========================================================

export const clearAllData = async (): Promise<void> => {
  await db.exerciseCache.clear();
  await db.pendingOps.clear();
  await db.authTokens.clear();
  console.log('🧹 [Dexie] Tutti i dati cancellati');
};
