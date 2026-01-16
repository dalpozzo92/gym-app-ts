Analisi della Struttura del Database
Il cuore dell'applicazione ruota attorno alla gestione del workout, partendo dall'anagrafica fino alla singola ripetizione eseguita.

1. Nucleo Utenti e Personal Trainer
User Details: La tabella centrale degli utenti. Contiene dati personali e il collegamento opzionale a un Personal Trainer.

Personal Trainer & Theme: Tabelle che definiscono il profilo del coach e la sua personalizzazione estetica (branding/colori).

User Weight Log & Diet: Monitoraggio dei progressi fisici e calorici dell'utente.

2. Struttura del Programma (Pianificazione)
La gerarchia della scheda di allenamento è così composta:

Program: L'entità macro (es. "Massa Invernale").

Program Weeks: Suddivide il programma in settimane (permettendo di gestire i carichi di scarico o progressioni).

Program Days: I singoli giorni di allenamento della settimana (es. "Lunedì - Petto").

Workout Day Exercises: Gli esercizi specifici assegnati a quel giorno (es. "Panca Piana"), presi dalla tabella master Exercises List.

3. Gestione Esercizi e Intensità
Exercises List: Il catalogo di tutti gli esercizi (nome, video, gruppo muscolare).

Workout Exercise Group Intensity: Una tabella intermedia che permette di definire set e intensità raggruppati per un esercizio.

Reps Types: Definisce come contare le ripetizioni (es. a cedimento, con buffer, tempo, ecc.).

4. Tracking e Sessioni (Esecuzione)
Questa è la parte dove l'utente inserisce i dati reali:

Workout Session: Registra quando un utente inizia e finisce un allenamento, inclusi il suo "mood" e l'energia.

Workout Exercise Set: La tabella più importante. Qui vengono salvati i dati previsti (reps min/max) e i dati reali inseriti dall'utente (actual_load per i kg e actual_reps per le ripetizioni), oltre a RPE e feedback sull'esecuzione.

📝 Prompt per l'IA (Copia e Incolla)
Oggetto: Spiegazione struttura Database App Fitness (Gestione Allenamenti)

Ho un database PostgreSQL per un'app di palestra. La logica si basa sulla distinzione tra Pianificazione (quello che il trainer scrive) ed Esecuzione (quello che l'utente fa in sala). Ecco le tabelle principali raggruppate per funzione:

1. Anagrafica e Preferenze:

user_details: Dati utente e collegamento al trainer.

personal_trainer: Profili dei coach.

user_exercise_preferences/rating: Feedback e personalizzazioni dell'utente sugli esercizi.

2. Definizione Esercizi:

exercises_list: Master data di tutti gli esercizi (nome, video, tipo di incremento).

reps_types: Tipi di ripetizioni.

3. Architettura della Scheda (Pianificazione):

program → program_weeks → program_days: Gerarchia temporale dell'allenamento.

workout_day_exercises: Collega un esercizio a un giorno specifico, definendo l'ordine e le note.

workout_exercise_group_intensity: Specifica il volume (numero set) e l'intensità teorica.

4. Tracking del Workout (Dati Reali):

workout_session: Registra l'istanza dell'allenamento (data, durata, energia).

workout_exercise_set: Tabella dei dati puntuali. Contiene sia i target (reps_min, reps_max, rest_time) sia i dati inseriti dall'utente (actual_load per il carico, actual_reps per le ripetizioni, rpe per lo sforzo percepito e execution_rating).

Relazioni Chiave:

Il program è collegato a user_details.

workout_exercise_set punta a workout_day_exercises (cosa dovevo fare) e a workout_session (quando l'ho fatto).

Molte tabelle usano bigint come chiavi primarie e includono timestamp per il tracking della creazione/modifica.

Obiettivo: Usa questa struttura per aiutarmi a [inserisci qui cosa vuoi fare, es: creare una query, analizzare i progressi di un utente, ecc.].


Di seguito ti fornisco la struttura completa del database per un'app di gestione allenamenti. La struttura è divisa per aree funzionali. Ogni tabella include la spiegazione di tutte le colonne e dei collegamenti (FK).

1. Area Utenti e Profilazione
user_details: Anagrafica utente.

id_user_details (PK), name, surname, email, birthday.

uuid_auth: Identificativo unico per l'autenticazione.

id_personal_trainer (FK): Collega l'utente al suo coach in personal_trainer.

personal_trainer: Profili dei coach.

id_personal_trainer (PK), id_user_detail (FK su user_details).

personal_trainer_theme: Branding del trainer (colori e nome brand).

user_settings: Preferenze interfaccia (tema, colori) collegate all'utente.

user_weight_log: Log del peso corporeo (weight_kg, date_measure).

diet: Obiettivo calorico (kCal) assegnato all'utente.

2. Area Catalogo Esercizi
exercises_list: Master data degli esercizi.

name, description, link_video.

id_muscolar_group: Gruppo muscolare target.

measure_type: Unità di misura (default 'load' per kg).

joint_type (mono/multiarticolare), laterality (mono/bilaterale).

increment_default: Incremento standard di carico consigliato.

reps_types: Definisce la tipologia di ripetizioni (es. buffer, RPE, tempo).

user_exercise_preferences: Incrementi personalizzati scelti dall'utente per specifici esercizi.

user_exercise_rating: Valutazione (1-5) e note dell'utente su specifici esercizi.

3. Area Pianificazione (Programmazione)
program: Il contenitore macro dell'allenamento.

id_user_details (FK), id_personal_trainer (FK).

date_start_program, number_days_workout, duration_workout.

is_active: Indica se è la scheda corrente.

program_weeks: Suddivisione del programma in settimane.

week_number, is_deload (indica se è una settimana di scarico).

program_days: I giorni di allenamento all'interno di una settimana.

day_number, name (es. "Giorno A"), notes.

workout_day_exercises: Gli esercizi assegnati a un giorno.

id_program_day (FK), id_exercise_list (FK).

order_number: Posizione dell'esercizio nella sessione.

sets: Numero di serie previste.

workout_exercise_group_intensity: Raggruppamento tecnico per gestire l'intensità (collegato a workout_day_exercises).

4. Area Esecuzione e Tracking (Dati in Tempo Reale)
workout_session: Record creato quando l'utente inizia ad allenarsi.

id_program_day (FK), started_at, finished_at, duration_seconds.

mood, energy_level: Feedback qualitativi sulla sessione.

workout_exercise_set: DETTAGLIO SINGOLA SERIE. Questa tabella unisce pianificazione ed esecuzione:

FK: Collegata a workout_day_exercises, workout_session, reps_types.

Target (Pianificati): reps_min, reps_max, rest_time, intensity_type.

Actual (Eseguiti): actual_load (kg sollevati), actual_reps (ripetizioni fatte).

Feedback: rpe (sforzo 1-10), execution_rating (qualità tecnica 1-3), notes_tracking.

Stato: completed (boolean), completed_at.

5. Comunicazione
program_chat_message: Messaggi tra trainer e utente relativi a un programma o esercizio specifico.

Istruzione operativa: Usa questa struttura per rispondere alle mie prossime richieste, rispettando rigorosamente le chiavi esterne e la gerarchia Programma -> Settimana -> Giorno -> Esercizio -> Set.

il progetto mobile è scritto in ionic.
il progetto dekstop voglio farlo con material ui.
il backend è fatto con fastify.
il vari packages comunicheranno col backend tramire la cartella src/api in cui sono divisi i file in base alla macroarea di api (esempio workout, program, user).
tra la chiamata api e la chiamata fatta dalla pagina si passa per la cartella src/hooks in cui ci sono gli 'use'.
vorrei in futuro che l'app si possa avviare e inserire dati anche in assenza di internet e che possa visualizzare tutto quello salvato in locale con indexeddb usando dexie.
mi piacerebbe poter fare poche chiamate per limitare l'utilizzo eccessivo del backend e del database che altrimenti mi satura il piano free attuale.
il database che uso è supabase.

tutto il progetto mobile avrà come foglio css principale il file 'variables.css' in cui gestisco tutte le variabili globali, fai attenzione a usare colori coerenti con dark e light theme in modo da adattarsi sempre al tema corrente ed essere coerente. se non esistono le variabili corrette, inseriscile tu.

tutto il progetto mobile sarà incentrato sullo stile ios 26, liquid glass per componenti tabbat, navbar e card.



il progetto mobile usa ionic e quindi bisogna cercare di usare sempre tutti i componenti nativi di ionic (modificandoli per renderli moderni con stile ios) che ottimizzano l'uso della pwa mobile. usare i div solo se è strettamente necessario.
anche i movimenti e le animazioni su mobile bisogna farli principalmente con Ionic Animations e usare framer-motion solo in casi estremi in cui Ionic Animations non puo arrivare.
cerca di usare piu componenti nativi di ionic senza fare troppi div concatenati, falli piu semplici possibili ma coerenti con lo stile che ricerco.

il backend è all'interno del progetto monorepo.

la funzionalità dell intero progetto è quanto segue:
- io admin ho accesso a tuttte le funzionalità, utenti e programmi.
- un personal trainer puo iscriversi all'app e utilizzare la parte dekstop gestionale, per poter gestire clienti, creare i loro programmi, gestire pagamenti, appuntamenti, le chat dei clienti, vedere progressi degli esercizi di ogni cliente, poter modificare i programmi, inserire il proprio logo del brand cosi che i clienti collegati possano vedere il logo e anche i colori del brando che poi verranno utilizzati come colori primari, secondari e terziari

- un utente accede solo dalla pwa mobile, al login devo gestire bene i token e access token cosicchè un utente che ha un token non vedrà il login ma solo il caricamento e accederà direttamente alla pagina home. 
nei programmi vedrà solo i propri programmi in cui inserire i vari dati delle serie.
ci sarà una pagina profilo stile instagram ma incentrato su palestra, con playlist spotify preferite, badge di gamification eccetera.
