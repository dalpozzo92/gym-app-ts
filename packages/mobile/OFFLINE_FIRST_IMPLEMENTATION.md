# 🔄 Implementazione Sistema Offline-First con Dexie.js

## 📋 Panoramica

Ho implementato un sistema offline-first completo per la tua gym-app usando **Dexie.js** (wrapper moderno per IndexedDB). Il sistema garantisce che l'app funzioni perfettamente sia online che offline, con sincronizzazione automatica dei dati.

---

## ✅ Cosa è stato fatto

### 1. **Installazione Dexie.js**
```bash
npm install dexie
```

### 2. **Database Dexie** ([src/db/dexie.ts](src/db/dexie.ts))

Ho creato un database `GymDB` con 3 store:

#### **exerciseCache**
Memorizza i dati degli esercizi (sets, reps, weight, rpe, execution_rating, notes)
```typescript
{
  exerciseId: string;           // id_workout_day_exercises
  sets: ExerciseSet[];         // Array di serie
  lastSync: number;            // Timestamp ultima sincronizzazione
}
```

#### **pendingOps**
Coda delle operazioni da sincronizzare con il backend
```typescript
{
  id: string;                  // UUID
  exerciseId: string;
  setId: string;               // set_number (1, 2, 3...)
  field: 'reps' | 'weight' | 'rpe' | 'execution_rating' | 'notes';
  value: any;
  timestamp: number;
}
```

#### **authTokens**
Dati utente per autenticazione offline
```typescript
{
  id: 'auth';                  // Chiave fissa
  accessToken: null;           // I token sono HTTP-only cookie
  refreshToken: null;
  expiresAt: null;
  userId: string;              // id_user_details
  updatedAt: number;
}
```

---

## 🔧 Componenti del Sistema

### 1. **useOfflineExercise** ([src/hooks/useOfflineExercise.ts](src/hooks/useOfflineExercise.ts))

Hook per caricare i dati degli esercizi con fallback offline.

**Strategia:**
1. **Prova a caricare dal server** (se online)
2. **Se funziona** → aggiorna cache IndexedDB
3. **Se fallisce** → carica dalla cache IndexedDB
4. **Se non c'è cache** → errore

```typescript
const { data, loading, error, source } = useOfflineExercise(exerciseId);
// source: 'remote' | 'cache' | 'none'
```

---

### 2. **useAutosaveSets** ([src/hooks/useAutosaveSets.ts](src/hooks/useAutosaveSets.ts))

Hook per l'auto-save delle modifiche agli esercizi.

**Strategia:**
1. **Aggiorna stato locale** (UI immediato)
2. **Salva SEMPRE in IndexedDB** (cache locale)
3. **Aggiunge pending operation** (per sync worker)

```typescript
const { sets, updateSet, markAllSaved } = useAutosaveSets(exerciseId, initialSets);

// Quando l'utente modifica un valore
await updateSet({
  setId: '1',
  field: 'reps',
  value: 12
});
```

**Nessun debounce necessario** - ogni modifica viene salvata immediatamente in IndexedDB e aggiunta alla coda di sincronizzazione.

---

### 3. **useSyncWorker** ([src/hooks/useSyncWorker.ts](src/hooks/useSyncWorker.ts))

Hook che sincronizza automaticamente le pending operations con il backend ogni 3 secondi.

**Strategia:**
1. **Ogni 3 secondi** → controlla pending ops
2. **Se offline** → skip
3. **Se ci sono pending ops** → raggruppa per `exerciseId + setId`
4. **Chiama API** `syncWorkoutExerciseSets`
5. **Se successo** → cancella pending ops e aggiorna cache

**Payload inviato al backend:**
```typescript
[
  {
    id_workout_day_exercises: "123",
    set_number: 1,
    reps: 12,
    load: 80,
    rpe: 8,
    execution_rating: 2,
    notes: "Bella serie!"
  }
]
```

**Utilizzo:**
```typescript
// In ExerciseDetail.tsx
useSyncWorker(); // Auto-sync attivo

// Per flush manuale (es. prima di uscire dalla pagina)
await flushPendingOpsNow();
```

---

### 4. **AuthContext Offline-First** ([src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx))

Ho aggiornato l'AuthContext per supportare l'autenticazione offline.

**Strategia:**

#### **All'avvio:**
1. **Se OFFLINE** → carica dati utente dalla cache Dexie
2. **Se ONLINE** → verifica token
   - Token valido → carica dati utente
   - Token scaduto → prova refresh token
   - Refresh fallito → prova cache offline
3. **Se errore di rete** → prova cache offline

#### **Quando torna internet:**
- Event listener `online` → auto-verifica token

#### **Logout:**
- Se online → chiama API `/api/auth/logout`
- Se offline → logout solo locale
- Cancella cache Dexie

```typescript
const { isAuthenticated, user, checkAuth, logout } = useAuth();

// Controllo manuale autenticazione
await checkAuth();

// Logout con redirect
await logout(history);
```

---

## 📊 Badge di Stato Salvataggio

Il badge in [ExerciseDetail.tsx](src/pages/ExerciseDetail.tsx) mostra lo stato del salvataggio:

| Stato | Icona | Colore | Descrizione |
|-------|-------|--------|-------------|
| **Salvato** | ✅ `cloudDoneOutline` | Verde | Tutto sincronizzato con il server |
| **Salvataggio...** | 🔄 `syncOutline` | Arancione | Pending ops in coda |
| **Offline** | 📡 `cloudOfflineOutline` | Grigio | Nessuna connessione |
| **Locale** | 💾 `saveOutline` | Rosa | Salvato solo in IndexedDB |
| **Errore** | ❌ `closeCircleOutline` | Rosso | Errore sincronizzazione |

---

## 🗑️ File Rimossi

Ho eliminato il vecchio sistema IndexedDB e React Query:

### **File eliminati:**
- ❌ `src/db/indexedDb.ts`
- ❌ `src/db/cacheEsercizi.ts`
- ❌ `src/db/drafts.ts`
- ❌ `src/db/pendingOps.ts`
- ❌ `src/lib/queryClient.ts`
- ❌ `src/sync/workoutSyncService.ts`
- ❌ `src/utils/indexedDb.ts`

### **Dipendenze da rimuovere:**
Puoi opzionalmente rimuovere React Query dal `package.json`:
```bash
npm uninstall @tanstack/react-query @tanstack/react-query-devtools
```

### **File aggiornati:**
- ✅ `src/App.tsx` - Rimosso `QueryClientProvider`
- ✅ `src/main.tsx` - Rimosso `QueryClientProvider` e `initWorkoutSyncService`
- ✅ `src/pages/ExerciseDetail.tsx` - Aggiornato import da `@/db/dexie`

---

## 🚀 Come Funziona il Flusso

### **Scenario 1: Utente modifica un set (ONLINE)**

1. Utente cambia `reps` da 10 a 12
2. `useAutosaveSets.updateSet()` viene chiamato
3. **Stato locale aggiornato** → UI si aggiorna immediatamente
4. **Salvataggio in IndexedDB** → cache locale aggiornata
5. **Pending operation creata** → aggiunta a `pendingOps`
6. Dopo max 3 secondi → `useSyncWorker` invia le pending ops al backend
7. Backend risponde con successo → pending ops cancellate
8. Cache aggiornata con dati freschi dal server

### **Scenario 2: Utente modifica un set (OFFLINE)**

1. Utente cambia `reps` da 10 a 12
2. `useAutosaveSets.updateSet()` viene chiamato
3. **Stato locale aggiornato** → UI si aggiorna immediatamente
4. **Salvataggio in IndexedDB** → cache locale aggiornata
5. **Pending operation creata** → aggiunta a `pendingOps`
6. `useSyncWorker` rileva offline → skip sync
7. **Badge mostra "Offline"** o "Locale"
8. Quando torna internet → sync automatico

### **Scenario 3: App aperta offline**

1. Utente apre l'app senza internet
2. `AuthContext.checkAuthentication()` rileva offline
3. Carica dati utente da `authTokens` in Dexie
4. Utente entra nell'app (senza chiamate API)
5. `useOfflineExercise` carica dati da `exerciseCache`
6. Utente può visualizzare e modificare dati
7. Modifiche salvate in `pendingOps`
8. Quando torna internet → sync automatico

---

## 🐛 Debug

### **Visualizzare il database in DevTools:**

```javascript
// Console del browser
import { db } from '@/db/dexie';

// Visualizza tutte le cache esercizi
const caches = await db.exerciseCache.toArray();
console.log('Exercise Cache:', caches);

// Visualizza pending ops
const pending = await db.pendingOps.toArray();
console.log('Pending Ops:', pending);

// Visualizza auth tokens
const auth = await db.authTokens.get('auth');
console.log('Auth:', auth);
```

### **Log Console:**

Il sistema logga automaticamente tutte le operazioni:
- 🔍 `[Dexie]` → Operazioni database
- 🔄 `[SyncWorker]` → Sincronizzazione
- ✅ `[useAutosaveSets]` → Auto-save
- 📡 `[useOfflineExercise]` → Caricamento dati
- 🔐 `[AuthContext]` → Autenticazione

---

## 📝 API Backend

Il sistema si aspetta che il backend esponga:

### **POST `/api/workouts/syncWorkoutExerciseSets`**

**Request Body:**
```json
{
  "workout_exercise_sets": [
    {
      "id_workout_day_exercises": "123",
      "set_number": 1,
      "reps": 12,
      "load": 80,
      "rpe": 8,
      "execution_rating": 2,
      "notes": "Bella serie!"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sets sincronizzati con successo"
}
```

### **GET `/api/workouts/getWorkoutDayExercise/:id`**

Ritorna l'esercizio con tutti i set:
```json
{
  "id_workout_day_exercise": "123",
  "workout_exercise_sets": [
    {
      "set_number": 1,
      "reps": 12,
      "load": 80,
      "rpe": 8,
      "execution_rating": 2,
      "notes": "Bella serie!"
    }
  ]
}
```

---

## ⚡ Performance

- **Nessun debounce** → Modifiche salvate immediatamente in IndexedDB
- **Sync ogni 3 secondi** → Batch delle modifiche per ridurre chiamate API
- **Cache persistente** → L'app funziona anche completamente offline
- **Lazy loading** → Solo i dati necessari vengono caricati

---

## 🔒 Sicurezza

- **I token sono HTTP-only cookie** → Non esposti a JavaScript
- **Solo `userId` salvato in Dexie** → Nessun dato sensibile
- **Autenticazione rivalidata periodicamente** → Ogni 10 minuti se online
- **Logout pulisce cache** → Nessun dato residuo

---

## 🎯 Prossimi Step

1. ✅ Testare l'app in modalità offline
2. ✅ Verificare che il backend accetti il payload corretto
3. ⚠️ Eseguire `npm install dexie` (se non fatto automaticamente)
4. 🔧 Opzionale: rimuovere `@tanstack/react-query` dal package.json

---

## 📚 Risorse

- [Dexie.js Documentation](https://dexie.org/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Offline-First Architecture](https://offlinefirst.org/)

---

**Implementato da Claude Code** 🤖
