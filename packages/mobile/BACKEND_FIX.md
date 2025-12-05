# 🔧 Fix Backend - UPDATE Parziali

## 🐛 Problema Risolto

### **Bug Originale:**
Gli endpoint `/syncWorkoutExerciseSets` e `/saveWorkoutExerciseSet` facevano UPDATE di **TUTTI** i campi, sovrascrivendo i dati esistenti con valori di default quando il frontend inviava solo i campi modificati.

**Esempio del bug:**
```typescript
// Set esistente nel DB
{ reps: 10, load: 80, rpe: 8, execution_rating: 3 }

// Frontend modifica solo reps
payload = { id_workout_day_exercises: "123", set_number: 1, reps: 12 }

// ❌ Backend faceva (SBAGLIATO):
UPDATE workout_exercise_set
SET reps = 12, load = 0, rpe = null, execution_rating = null
// Risultato: DATI PERSI! ❌
```

---

## ✅ Soluzione Implementata

### **UPDATE Parziale Intelligente:**

Ora il backend controlla se un campo è fornito nel payload usando `!== undefined`:

```typescript
// ✅ Nuovo comportamento (CORRETTO):
const existing = existingSet[0];

UPDATE workout_exercise_set
SET
  load = ${set.load !== undefined ? set.load : existing.load},  // ← Mantiene il valore esistente se non fornito
  reps = ${set.reps !== undefined ? set.reps : existing.reps},  // ← Usa il nuovo valore se fornito
  rpe = ${set.rpe !== undefined ? set.rpe : existing.rpe},
  ...
WHERE id_workout_day_exercises = ${exerciseId}
  AND set_number = ${set.set_number}
```

### **Logica:**
- Se `set.load !== undefined` → campo fornito → usa nuovo valore
- Se `set.load === undefined` → campo NON fornito → mantieni valore esistente

Questo funziona anche con valori `0` o `null`:
- `set.load = 0` → fornito → usa 0
- `set.load = null` → fornito → usa null
- `set.load = undefined` → NON fornito → mantieni valore esistente

---

## 📝 Endpoint Sistemati

### **1. POST `/api/workouts/syncWorkoutExerciseSets`**
([workouts.ts:387-507](../backend/src/routes/workouts.ts#L387-L507))

**Modifiche:**
- ✅ UPDATE parziale: solo campi forniti nel payload
- ✅ Conversione `id_workout_day_exercises` da string a number
- ✅ Log debug del payload ricevuto
- ✅ INSERT con valori di default per campi non forniti

**Payload Accettato:**
```json
{
  "workout_exercise_sets": [
    {
      "id_workout_day_exercises": "123",  // ← Può essere string o number
      "set_number": 1,
      "reps": 12,          // ← Opzionale
      "load": 80,          // ← Opzionale
      "rpe": 8,            // ← Opzionale
      "execution_rating": 3, // ← Opzionale
      "notes": "Ottima serie!" // ← Opzionale
    }
  ]
}
```

**Response:**
```json
{
  "synced": 3,
  "errors": 0,
  "workout_exercise_sets": [...],
  "failed": []
}
```

---

### **2. POST `/api/workouts/saveWorkoutExerciseSet`**
([workouts.ts:269-382](../backend/src/routes/workouts.ts#L269-L382))

**Modifiche:**
- ✅ UPDATE parziale: solo campi forniti nel payload
- ✅ INSERT con valori di default per campi non forniti

**Payload Accettato:**
```json
{
  "id_workout_day_exercises": 123,  // ← Number
  "set_number": 1,
  "reps": 12,          // ← Opzionale
  "load": 80,          // ← Opzionale
  "rpe": 8,            // ← Opzionale
  "execution_rating": 3, // ← Opzionale
  "notes": "Ottima serie!" // ← Opzionale
}
```

**Response:**
```json
{
  "success": true,
  "workout_exercise_set": {
    "id_workout_exercise_set": 456,
    "id_workout_day_exercises": 123,
    "set_number": 1,
    "load": 80,
    "reps": 12,
    "rpe": 8,
    "execution_rating": 3,
    "notes": "Ottima serie!",
    "synced": true,
    "modified_at": "2025-12-01T19:30:00Z"
  }
}
```

---

## 🧪 Test

### **Test 1: Modifica Solo Reps**

**Setup:**
```sql
INSERT INTO workout_exercise_set
VALUES (123, 1, 80, 10, 0, 8, 3, 'Prima serie', true, NOW());
```

**Frontend invia:**
```json
{
  "workout_exercise_sets": [{
    "id_workout_day_exercises": "123",
    "set_number": 1,
    "reps": 12
  }]
}
```

**Risultato atteso:**
```sql
-- ✅ Solo reps aggiornato, altri campi mantenuti
UPDATE workout_exercise_set
SET reps = 12, load = 80, rpe = 8, execution_rating = 3, notes = 'Prima serie'
WHERE id_workout_day_exercises = 123 AND set_number = 1;
```

---

### **Test 2: Modifica Multipli Campi**

**Frontend invia:**
```json
{
  "workout_exercise_sets": [{
    "id_workout_day_exercises": "123",
    "set_number": 1,
    "reps": 15,
    "load": 85,
    "rpe": 9
  }]
}
```

**Risultato atteso:**
```sql
-- ✅ Solo reps, load, rpe aggiornati
UPDATE workout_exercise_set
SET reps = 15, load = 85, rpe = 9, execution_rating = 3, notes = 'Prima serie'
WHERE id_workout_day_exercises = 123 AND set_number = 1;
```

---

### **Test 3: Insert Nuovo Set**

**Frontend invia:**
```json
{
  "workout_exercise_sets": [{
    "id_workout_day_exercises": "123",
    "set_number": 2,
    "reps": 10,
    "load": 80
  }]
}
```

**Risultato atteso:**
```sql
-- ✅ INSERT con valori di default per campi non forniti
INSERT INTO workout_exercise_set
VALUES (123, 2, 80, 10, 0, null, null, null, true, NOW());
```

---

## 🔍 Debug

### **Log Backend:**
```bash
# Console del backend
[syncWorkoutExerciseSets] Payload ricevuto: [
  {
    "id_workout_day_exercises": "123",
    "set_number": 1,
    "reps": 12
  }
]
```

### **Verifica Database:**
```sql
-- Controlla i dati prima
SELECT * FROM workout_exercise_set
WHERE id_workout_day_exercises = 123 AND set_number = 1;

-- Invia richiesta dal frontend

-- Controlla i dati dopo
SELECT * FROM workout_exercise_set
WHERE id_workout_day_exercises = 123 AND set_number = 1;
```

---

## ✅ Benefici

1. **Nessuna perdita di dati** → I campi non modificati rimangono intatti
2. **Frontend più leggero** → Invia solo i campi modificati
3. **Meno traffico di rete** → Payload più piccoli
4. **Sync più efficiente** → Aggiornamenti granulari
5. **Compatibile con offline-first** → Pending ops possono essere parziali

---

## 🎯 Compatibilità

✅ **Frontend Dexie.js** → Invia solo campi modificati
✅ **Backend Fastify** → Accetta payload parziali
✅ **Database PostgreSQL** → UPDATE selettivi
✅ **Offline-first** → Pending ops granulari

---

**Implementato da Claude Code** 🤖
