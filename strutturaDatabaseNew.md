

### ⚖️ `user_weight_log`

Storico del peso utente.

* **id_user_weight_log** (PK)
* id_user_details (FK)
* date_measure (DATE)
* created_at
* weight_kg (DOUBLE PRECISION)
* notes

---

### 🧱 `exercises_list`

Catalogo globale degli esercizi.

* **id_exercise_list** (PK)
* created_at
* is_deleted
* name
* description
* link_video
* id_muscolar_group
* measure_type TEXT DEFAULT `'load'`

  * es. `'load' | 'reps' | 'time' | 'distance' | 'isometric'`
* increment_default DOUBLE PRECISION
* joint_type TEXT DEFAULT `'multi'`   → `'multi' | 'mono'`
* laterality TEXT DEFAULT `'bilateral'` → `'bilateral' | 'unilateral'`

---

### 🎛️ `reps_types`

Definisce il **tipo di schema ripetizioni** per una serie.

* **id_reps_type** (PK)
* created_at
* is_deleted (SMALLINT o BOOLEAN)
* name (es. `'Range reps'`, `'Fisso'`, `'MAX'`, `'A tempo'`)
* key (es. `'RANGE'`, `'FIXED'`, `'MAX'`, `'TIME'`)
* description (testo libero)

Esempi di record:

* key = `RANGE` → usare `reps_min` / `reps_max` come range (es. 8–12)
* key = `FIXED` → usare `reps_min` come numero fisso (es. 10)
* key = `MAX` → fare tutte le reps possibili, `reps_min`/`reps_max` opzionali
* key = `TIME` → usare `reps_min` come secondi (es. 60) oppure in futuro una colonna dedicata

---

### ⭐ `user_exercise_preferences`

Preferenze utente per incremento di carico.

* **id_user_exercise_preferences** (PK)
* created_at
* id_user_details (FK)
* id_exercise_list (FK)
* increment_custom DOUBLE PRECISION

Logica:
se esiste `increment_custom` → usa quello,
altrimenti usa `exercises_list.increment_default`.

---

### ⭐ `user_exercise_rating`

Rating globale dell’esercizio per utente (non per singolo programma).

* **id_user_exercise_rating** (PK)
* id_user_details (FK)
* id_exercise_list (FK)
* rating_value SMALLINT (1–5)
* created_at
* updated_at
* notes

---

### 📘 `program`

Programma di allenamento.

* **id_program** (PK)
* created_at
* is_deleted
* id_user_details (utente che esegue il programma)
* id_personal_trainer (FK, NULL se programma “self-made”)
* created_by (FK → user_details o PT, a seconda dell’implementazione)
* assigned_to (FK → user_details)
* is_active
* description
* max_weeks SMALLINT (opzionale, numero massimo di settimane previste)
* is_deleted

Regola:

* se `created_by = assigned_to` → programma creato dall’utente
* se `created_by ≠ assigned_to` → creato dal PT

---

### 📆 `program_weeks`

Settimane del programma, generate dinamicamente (non tutte pre-create).

* **id_program_week** (PK)
* created_at
* id_program (FK)
* week_number
* is_active
* is_deleted
* is_deload BOOLEAN (opzionale)

---

### 📅 `program_days`

Giorni della settimana.

* **id_program_day** (PK)
* created_at
* id_program_week (FK)
* day_number
* name
* notes
* theoretical_duration_seconds INTEGER
  → durata teorica stimata del giorno (riscaldamento + esercizi + passaggi)
* id_workout_session (FK → workout_session.id_workout_session)

---

### 🏋️ `workout_day_exercises`

Istanza dell’esercizio nel giorno / settimana.

* **id_workout_day_exercises** (PK)
* created_at
* id_program_day (FK → program_days.id_program_day)
* id_exercise_list (FK → exercises_list.id_exercise_list)
* order_number
* sets
* is_deleted
* notes

> Tutta la logica di serie (reps, rest, carico) è a livello di `workout_exercise_set`.

---

### 🔥 `workout_exercise_group_intensity`

Gruppi intensità per serie speciali (drop, rest-pause, superset, cluster, ecc.).

* **id_workout_exercise_group_intensity** (PK)
* created_at
* id_program_week (FK → program_weeks.id_program_week)
* type (es. `'drop_set'`, `'rest_pause'`, `'superset'`, `'cluster'`)
* name
* notes

---

### 🧱 `workout_exercise_set`

**Una riga = UNA SERIE** con programmazione + tracking.

* **id_workout_exercise_set** (PK)
* created_at
* id_workout_day_exercises (FK → workout_day_exercises.id_workout_day_exercises)
* set_order (1,2,3,...)

**Prescrizione (PT):**

* id_reps_type (FK → reps_types.id_reps_type)
* reps_min
* reps_max
* rest_time           -- in secondi
* intensity_type      -- stringa o chiave (es. 'normal', 'top_set', 'backoff')
* group_intensity_id (FK → workout_exercise_group_intensity.id_workout_exercise_group_intensity)
* notes               -- note di programmazione per quella serie

**Tracking (utente):**

* actual_load
* actual_reps
* rpe
* execution_rating
* completed BOOLEAN (true se actual_load e actual_reps > 0)
* completed_at TIMESTAMPTZ
* notes_tracking

**Sessione:**


> In base a `id_reps_type` il frontend/backoffice interpreta `reps_min / reps_max`
> come range, fisso, tempo, max reps, ecc.

---

### ⏱️ `workout_session`

Sessione reale di allenamento.

* **id_workout_session** (PK)
* created_at
* id_user_details (FK)
* id_program_week (FK)
* started_at
* finished_at
* duration_seconds
* mood
* energy_level
* notes

> Il tempo residuo viene calcolato runtime, non è salvato nel DB.

---

### 💬 `program_chat_message`

Chat legata al programma (non generale, ma per quel programma specifico),
con possibilità di indicare a quale esercizio si riferisce il messaggio.

* **id_program_chat_message** (PK)
* created_at
* id_program (FK → program.id_program)
* id_user_details (FK → user_details.id_user_details)
* message_text
* attachment_url
* is_from_trainer BOOLEAN
* id_exercise_list (FK → exercises_list.id_exercise_list, NULL se messaggio generale)

---

## 🔗 RELAZIONI PRINCIPALI (RIASSUNTO)

* **Programma → Settimane → Giorni → Esercizi → Set**

  * `program`
    → `program_weeks`
    → `program_days`
    → `workout_day_exercises`
    → `workout_exercise_set`

* **Tipo di reps per serie**

  * `workout_exercise_set.id_reps_type` → `reps_types.id_reps_type`

* **Preferenze di carico**

  * `user_exercise_preferences` + `exercises_list.increment_default`

* **Rating esercizi**

  * `user_exercise_rating` → `exercises_list`

* **Peso utente**

  * `user_weight_log` → `user_details`

* **Sessioni**

  * `workout_session` ↔ `program_days`

* **Chat per programma**

  * `program_chat_message` → `program` (+ opzionale `exercises_list`)
