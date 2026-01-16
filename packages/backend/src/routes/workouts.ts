import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

export default async function workoutsRoutes(fastify: FastifyInstance) {

  fastify.get<{ Params: { id_program_day: string } }>('/getWorkoutDayExercises/:id_program_day', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { id_program_day } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWorkoutDayExercises] Recupero esercizi per giorno:', id_program_day);

      const accessCheck = await sql`
        SELECT program_days.id_program_day 
        FROM program_days
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE program_days.id_program_day = ${id_program_day}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND program.is_deleted = 0
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso al giorno negato' });
      }

      const workout_day_exercises = await sql`
        SELECT
          workout_day_exercises.id_workout_day_exercise,
          workout_day_exercises.order_number,
          workout_day_exercises.sets,
          workout_day_exercises.notes,
          exercises_list.id_exercise_list,
          exercises_list.name as exercise_name,
          exercises_list.description as exercise_description,
          exercises_list.link_video,
          exercises_list.id_muscolar_group,
          program_weeks.week_number,
          COALESCE(
            LEAST(100, GREATEST(0, (SELECT ROUND(
              (COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END) * 100.0) /
              NULLIF(workout_day_exercises.sets, 0), 0
            )::integer
            FROM workout_exercise_set
            WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise))),
            0
          ) as progress,
          (SELECT CONCAT(workout_exercise_set.actual_load, 'kg x ', workout_exercise_set.actual_reps, ' rip')
           FROM workout_exercise_set
           WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
             AND workout_exercise_set.actual_load > 0
           ORDER BY workout_exercise_set.created_at DESC
           LIMIT 1
          ) as last_performance,
           (SELECT JSON_AGG(
             JSON_BUILD_OBJECT(
               'set_number', workout_exercise_set.set_number,
               'actual_load', workout_exercise_set.actual_load,
               'actual_reps', workout_exercise_set.actual_reps,
               'reps_min', workout_exercise_set.reps_min,
               'reps_max', workout_exercise_set.reps_max,
               'rest_time', workout_exercise_set.rest_time,
               'id_reps_type', workout_exercise_set.id_reps_type,
               'intensity_type', workout_exercise_set.intensity_type,
               'group_intensity_id', workout_exercise_set.group_intensity_id,
               'completed', workout_exercise_set.completed,
               'completed_at', workout_exercise_set.completed_at,
               'intensity', workout_exercise_set.intensity,
               'rpe', workout_exercise_set.rpe,
               'execution_rating', workout_exercise_set.execution_rating,
               'notes', workout_exercise_set.notes,
               'created_at', workout_exercise_set.created_at
             ) ORDER BY workout_exercise_set.set_number
           )
           FROM workout_exercise_set
           WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
          ) as workout_exercise_sets
        FROM workout_day_exercises
        INNER JOIN exercises_list ON workout_day_exercises.id_exercise_list = exercises_list.id_exercise_list
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        WHERE workout_day_exercises.id_program_day = ${id_program_day}
          AND workout_day_exercises.is_deleted = 0
        ORDER BY workout_day_exercises.order_number ASC
      `;

      debug('[getWorkoutDayExercises] Esercizi recuperati:', workout_day_exercises.length);
      return reply.send({ workout_day_exercises });
    } catch (error) {
      debug('[getWorkoutDayExercises] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero degli esercizi' });
    }
  });

  fastify.get<{ Params: { id_program_week: string } }>('/getWeekWorkoutExercises/:id_program_week', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { id_program_week } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWeekWorkoutExercises] Recupero esercizi per settimana:', id_program_week);

      const accessCheck = await sql`
        SELECT program_weeks.id_program_week
        FROM program_weeks
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE program_weeks.id_program_week = ${id_program_week}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND program.is_deleted = 0
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso alla settimana negato' });
      }

      const week_exercises = await sql`
        SELECT
          program_days.id_program_day,
          program_days.day_number,
          program_days.name as day_name,
          workout_day_exercises.id_workout_day_exercise,
          workout_day_exercises.order_number,
          workout_day_exercises.sets,
          workout_day_exercises.notes,
          exercises_list.id_exercise_list,
          exercises_list.name as exercise_name,
          exercises_list.description as exercise_description,
          exercises_list.link_video,
          exercises_list.id_muscolar_group,
          COALESCE(
            LEAST(100, GREATEST(0, (SELECT ROUND(
              (COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END) * 100.0) /
              NULLIF(workout_day_exercises.sets, 0), 0
            )::integer
            FROM workout_exercise_set
            WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise))),
            0
          ) as progress,
          (SELECT CONCAT(workout_exercise_set.actual_load, 'kg x ', workout_exercise_set.actual_reps, ' rip')
           FROM workout_exercise_set
           WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
             AND workout_exercise_set.actual_load > 0
           ORDER BY workout_exercise_set.created_at DESC
           LIMIT 1
          ) as last_performance
        FROM program_days
        INNER JOIN workout_day_exercises ON program_days.id_program_day = workout_day_exercises.id_program_day
        INNER JOIN exercises_list ON workout_day_exercises.id_exercise_list = exercises_list.id_exercise_list
        WHERE program_days.id_program_week = ${id_program_week}
          AND workout_day_exercises.is_deleted = 0
        ORDER BY program_days.day_number ASC, workout_day_exercises.order_number ASC
      `;

      const exercisesByDay: Record<string, any[]> = {};
      week_exercises.forEach((exercise: any) => {
        const dayId = exercise.id_program_day;
        if (!exercisesByDay[dayId]) {
          exercisesByDay[dayId] = [];
        }
        exercisesByDay[dayId].push(exercise);
      });

      debug('[getWeekWorkoutExercises] Esercizi recuperati per', Object.keys(exercisesByDay).length, 'giorni');

      return reply.send({
        week_exercises: exercisesByDay,
        total_days: Object.keys(exercisesByDay).length,
        total_exercises: week_exercises.length
      });
    } catch (error) {
      debug('[getWeekWorkoutExercises] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero degli esercizi della settimana' });
    }
  });

  fastify.get<{ Params: { workoutDayExerciseId: string } }>('/getWorkoutDayExercise/:workoutDayExerciseId', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { workoutDayExerciseId } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWorkoutDayExercise] Recupero dettagli esercizio:', workoutDayExerciseId);

      const accessCheck = await sql`
        SELECT workout_day_exercises.id_workout_day_exercise
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND program.is_deleted = 0
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso negato' });
      }

      const workout_day_exercise = await sql`
        SELECT
          workout_day_exercises.id_workout_day_exercise,
          workout_day_exercises.order_number,
          workout_day_exercises.sets,
          workout_day_exercises.notes,
          exercises_list.id_exercise_list,
          exercises_list.name as exercise_name,
          exercises_list.description as exercise_description,
          exercises_list.link_video,
          exercises_list.id_muscolar_group,
          CASE
            WHEN exercises_list.id_muscolar_group = 1 THEN 'Petto'
            WHEN exercises_list.id_muscolar_group = 2 THEN 'Schiena'
            WHEN exercises_list.id_muscolar_group = 3 THEN 'Spalle'
            WHEN exercises_list.id_muscolar_group = 4 THEN 'Braccia'
            WHEN exercises_list.id_muscolar_group = 5 THEN 'Gambe'
            WHEN exercises_list.id_muscolar_group = 6 THEN 'Core'
            ELSE 'Altro'
          END as muscle_group_name,
          program_days.name as day_name,
          program_weeks.week_number
        FROM workout_day_exercises
        INNER JOIN exercises_list ON workout_day_exercises.id_exercise_list = exercises_list.id_exercise_list
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND workout_day_exercises.is_deleted = 0
      `;

      if (workout_day_exercise.length === 0) {
        return reply.code(404).send({ message: 'Esercizio non trovato' });
      }

      const workout_exercise_sets = await sql`
        SELECT 
          workout_exercise_set.id_workout_exercise_set,
          workout_exercise_set.set_number,
          workout_exercise_set.actual_load,
          workout_exercise_set.actual_reps,
          workout_exercise_set.reps_min,
          workout_exercise_set.reps_max,
          workout_exercise_set.rest_time,
          workout_exercise_set.id_reps_type,
          workout_exercise_set.intensity_type,
          workout_exercise_set.group_intensity_id,
          workout_exercise_set.completed,
          workout_exercise_set.completed_at,
          workout_exercise_set.intensity,
          workout_exercise_set.rpe,
          workout_exercise_set.execution_rating,
          workout_exercise_set.notes,
          workout_exercise_set.synced,
          workout_exercise_set.created_at,
          workout_exercise_set.modified_at
        FROM workout_exercise_set
        WHERE workout_exercise_set.id_workout_day_exercises = ${workoutDayExerciseId}
        ORDER BY workout_exercise_set.set_number ASC
      `;

      const result = {
        workout_day_exercise: workout_day_exercise[0],
        workout_exercise_sets: workout_exercise_sets
      };

      debug('[getWorkoutDayExercise] Dettagli recuperati con successo');
      return reply.send(result);
    } catch (error) {
      debug('[getWorkoutDayExercise] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero dei dettagli esercizio' });
    }
  });

  fastify.post<{
    Body: {
      id_workout_day_exercises: number;
      set_number: number;
      // load?: number;
      // reps?: number;
      actual_load?: number;
      actual_reps?: number;
      reps_min?: number;
      reps_max?: number;
      rest_time?: number;
      id_reps_type?: number;
      intensity_type?: string;
      group_intensity_id?: number;
      completed?: boolean;
      completed_at?: string;
      intensity?: number;
      rpe?: number;
      execution_rating?: number;
      notes?: string;
    }
  }>('/saveWorkoutExerciseSet', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const {
        id_workout_day_exercises,
        set_number,
        // load,
        // reps,
        actual_load,
        actual_reps,
        reps_min,
        reps_max,
        rest_time,
        id_reps_type,
        intensity_type,
        group_intensity_id,
        completed,
        completed_at,
        intensity,
        rpe,
        execution_rating,
        notes
      } = req.body;

      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      if (!id_workout_day_exercises || !set_number) {
        return reply.code(400).send({
          message: 'Parametri mancanti: id_workout_day_exercises e set_number sono obbligatori'
        });
      }

      const accessCheck = await sql`
        SELECT wde.id_workout_day_exercise
        FROM workout_day_exercises wde
        INNER JOIN program_days pd ON wde.id_program_day = pd.id_program_day
        INNER JOIN program_weeks pw ON pd.id_program_week = pw.id_program_week
        INNER JOIN program p ON pw.id_program = p.id_program
        WHERE wde.id_workout_day_exercise = ${id_workout_day_exercises}
          AND (p.id_user_details = ${userId} OR p.assigned_to = ${userId})
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso negato' });
      }

      const existingSet = await sql`
        SELECT * FROM workout_exercise_set
        WHERE id_workout_day_exercises = ${id_workout_day_exercises}
          AND set_number = ${set_number}
      `;

      let workout_exercise_set;

      if (existingSet.length > 0) {
        // ✅ UPDATE parziale: aggiorna SOLO i campi forniti nel payload
        // load = ${load !== undefined ? load : existing.load},
        // reps = ${reps !== undefined ? reps : existing.reps},
        const existing = existingSet[0];
        workout_exercise_set = await sql`
          UPDATE workout_exercise_set
          SET
            actual_load = ${actual_load !== undefined ? actual_load : existing.actual_load},
            actual_reps = ${actual_reps !== undefined ? actual_reps : existing.actual_reps},
            reps_min = ${reps_min !== undefined ? reps_min : existing.reps_min},
            reps_max = ${reps_max !== undefined ? reps_max : existing.reps_max},
            rest_time = ${rest_time !== undefined ? rest_time : existing.rest_time},
            id_reps_type = ${id_reps_type !== undefined ? id_reps_type : existing.id_reps_type},
            intensity_type = ${intensity_type !== undefined ? intensity_type : existing.intensity_type},
            group_intensity_id = ${group_intensity_id !== undefined ? group_intensity_id : existing.group_intensity_id},
            completed = ${completed !== undefined ? completed : existing.completed},
            completed_at = ${completed_at !== undefined ? completed_at : existing.completed_at},
            intensity = ${intensity !== undefined ? intensity : existing.intensity},
            rpe = ${rpe !== undefined ? rpe : existing.rpe},
            execution_rating = ${execution_rating !== undefined ? execution_rating : existing.execution_rating},
            notes = ${notes !== undefined ? notes : existing.notes},
            synced = true,
            modified_at = NOW()
          WHERE id_workout_day_exercises = ${id_workout_day_exercises}
            AND set_number = ${set_number}
          RETURNING *
        `;
      } else {
        // ✅ INSERT: usa valori di default per campi non forniti

        // ${load !== undefined ? load : 0},
        // ${reps !== undefined ? reps : 0},
        workout_exercise_set = await sql`
          INSERT INTO workout_exercise_set (
            id_workout_day_exercises,
            set_number,
            actual_load,
            actual_reps,
            reps_min,
            reps_max,
            rest_time,
            id_reps_type,
            intensity_type,
            group_intensity_id,
            completed,
            completed_at,
            intensity,
            rpe,
            execution_rating,
            notes,
            synced,
            modified_at
          )
          VALUES (
            ${id_workout_day_exercises},
            ${set_number},
            ${actual_load !== undefined ? actual_load : 0},
            ${actual_reps !== undefined ? actual_reps : 0},
            ${reps_min !== undefined ? reps_min : null},
            ${reps_max !== undefined ? reps_max : null},
            ${rest_time !== undefined ? rest_time : null},
            ${id_reps_type !== undefined ? id_reps_type : null},
            ${intensity_type !== undefined ? intensity_type : null},
            ${group_intensity_id !== undefined ? group_intensity_id : null},
            ${completed !== undefined ? completed : false},
            ${completed_at !== undefined ? completed_at : null},
            ${intensity !== undefined ? intensity : 0},
            ${rpe !== undefined ? rpe : null},
            ${execution_rating !== undefined ? execution_rating : null},
            ${notes !== undefined ? notes : null},
            true,
            NOW()
          )
          RETURNING *
        `;
      }

      return reply.send({
        success: true,
        workout_exercise_set: workout_exercise_set[0]
      });

    } catch (error: any) {
      debug('[saveWorkoutExerciseSet] Errore:', error);
      return reply.code(500).send({
        message: 'Errore nel salvataggio del set',
        error: error.message
      });
    }
  });

  fastify.post<{ Body: { workout_exercise_sets: any[] } }>('/syncWorkoutExerciseSets', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { workout_exercise_sets } = req.body;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[syncWorkoutExerciseSets] Payload ricevuto:', JSON.stringify(workout_exercise_sets, null, 2));

      if (!Array.isArray(workout_exercise_sets) || workout_exercise_sets.length === 0) {
        return reply.code(400).send({ message: 'Nessun set da sincronizzare' });
      }

      const synced_sets: any[] = [];
      const errors: any[] = [];

      // Esecuzione sequenziale per evitare problemi di prepared statement riutilizzati
      for (const set of workout_exercise_sets) {
        try {
          // ✅ Converti id_workout_day_exercises da string a number se necessario
          const exerciseId = typeof set.id_workout_day_exercises === 'string'
            ? parseInt(set.id_workout_day_exercises, 10)
            : set.id_workout_day_exercises;

          const accessCheck = await sql`
              SELECT wde.id_workout_day_exercise
              FROM workout_day_exercises wde
              INNER JOIN program_days pd ON wde.id_program_day = pd.id_program_day
              INNER JOIN program_weeks pw ON pd.id_program_week = pw.id_program_week
              INNER JOIN program p ON pw.id_program = p.id_program
              WHERE wde.id_workout_day_exercise = ${exerciseId}
                AND (p.id_user_details = ${userId} OR p.assigned_to = ${userId})
            `;

          if (accessCheck.length === 0) {
            errors.push({ set, error: 'Accesso negato' });
            continue;
          }

          const existingSet = await sql`
              SELECT * FROM workout_exercise_set
              WHERE id_workout_day_exercises = ${exerciseId}
                AND set_number = ${set.set_number}
            `;

          let saved_set;

          if (existingSet.length > 0) {
            // ✅ UPDATE parziale: aggiorna SOLO i campi forniti nel payload
            const existing = existingSet[0];
            saved_set = await sql`
                UPDATE workout_exercise_set
                SET
                  actual_load = ${set.actual_load !== undefined ? set.actual_load : existing.actual_load},
                  actual_reps = ${set.actual_reps !== undefined ? set.actual_reps : existing.actual_reps},
                  reps_min = ${set.reps_min !== undefined ? set.reps_min : existing.reps_min},
                  reps_max = ${set.reps_max !== undefined ? set.reps_max : existing.reps_max},
                  rest_time = ${set.rest_time !== undefined ? set.rest_time : existing.rest_time},
                  id_reps_type = ${set.id_reps_type !== undefined ? set.id_reps_type : existing.id_reps_type},
                  intensity_type = ${set.intensity_type !== undefined ? set.intensity_type : existing.intensity_type},
                  group_intensity_id = ${set.group_intensity_id !== undefined ? set.group_intensity_id : existing.group_intensity_id},
                  completed = ${set.completed !== undefined ? set.completed : existing.completed},
                  completed_at = ${set.completed_at !== undefined ? set.completed_at : existing.completed_at},
                  intensity = ${set.intensity !== undefined ? set.intensity : existing.intensity},
                  rpe = ${set.rpe !== undefined ? set.rpe : existing.rpe},
                  execution_rating = ${set.execution_rating !== undefined ? set.execution_rating : existing.execution_rating},
                  notes = ${set.notes !== undefined ? set.notes : existing.notes},
                  synced = true,
                  modified_at = NOW()
                WHERE id_workout_day_exercises = ${exerciseId}
                  AND set_number = ${set.set_number}
                RETURNING *
              `;

            synced_sets.push(saved_set[0]);
          } else {
            // ✅ INSERT: Crea record solo se almeno un campo è stato inviato
            // Permette set parziali (es. load=80, reps=0 per nuova settimana)
            const hasAnyData =
              set.actual_load !== undefined ||
              set.actual_reps !== undefined ||
              set.rpe !== undefined ||
              set.execution_rating !== undefined ||
              (set.notes !== undefined && set.notes !== null && set.notes.trim() !== '');

            if (!hasAnyData) {
              // Skip: nessun campo inviato
              debug('[syncWorkoutExerciseSets] Skip set senza dati:', { exerciseId, set_number: set.set_number });
              continue;
            }

            // ✅ INSERT: Accetta anche valori 0 (set work in progress)
            saved_set = await sql`
                INSERT INTO workout_exercise_set (
                  id_workout_day_exercises,
                  set_number,
                  actual_load,
                  actual_reps,
                  reps_min,
                  reps_max,
                  rest_time,
                  id_reps_type,
                  intensity_type,
                  group_intensity_id,
                  completed,
                  completed_at,
                  intensity,
                  rpe,
                  execution_rating,
                  notes,
                  synced,
                  modified_at
                )
                VALUES (
                  ${exerciseId},
                  ${set.set_number},
                  ${set.actual_load !== undefined ? set.actual_load : null},
                  ${set.actual_reps !== undefined ? set.actual_reps : null},
                  ${set.reps_min !== undefined ? set.reps_min : null},
                  ${set.reps_max !== undefined ? set.reps_max : null},
                  ${set.rest_time !== undefined ? set.rest_time : null},
                  ${set.id_reps_type !== undefined ? set.id_reps_type : null},
                  ${set.intensity_type !== undefined ? set.intensity_type : null},
                  ${set.group_intensity_id !== undefined ? set.group_intensity_id : null},
                  ${set.completed !== undefined ? set.completed : false},
                  ${set.completed_at !== undefined ? set.completed_at : null},
                  ${set.intensity !== undefined ? set.intensity : null},
                  ${set.rpe !== undefined ? set.rpe : null},
                  ${set.execution_rating !== undefined ? set.execution_rating : null},
                  ${set.notes !== undefined ? set.notes : null},
                  true,
                  NOW()
                )
                RETURNING *
              `;

            synced_sets.push(saved_set[0]);
          }

        } catch (error: any) {
          errors.push({ set, error: error.message });
        }
      }

      if (errors.length > 0 && synced_sets.length === 0) {
        return reply.code(400).send({
          message: 'Errore nella sincronizzazione',
          errors
        });
      }

      return reply.send({
        synced: synced_sets.length,
        errors: errors.length,
        workout_exercise_sets: synced_sets,
        failed: errors
      });

    } catch (error: any) {
      debug('[syncWorkoutExerciseSets] Errore:', error);
      return reply.code(500).send({
        message: 'Errore nella sincronizzazione',
        error: error.message
      });
    }
  });

  fastify.get<{ Params: { workoutDayExerciseId: string } }>('/getWorkoutDayExerciseProgress/:workoutDayExerciseId', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { workoutDayExerciseId } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWorkoutDayExerciseProgress] Calcolo progresso:', workoutDayExerciseId);

      const workout_day_exercise = await sql`
        SELECT workout_day_exercises.id_workout_day_exercise, workout_day_exercises.sets
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

      if (workout_day_exercise.length === 0) {
        return reply.code(403).send({ message: 'Accesso negato' });
      }

      const total_sets = workout_day_exercise[0].sets;

      const completed = await sql`
        SELECT COUNT(*) as completed
        FROM workout_exercise_set
        WHERE workout_exercise_set.id_workout_day_exercises = ${workoutDayExerciseId}
          AND workout_exercise_set.actual_load > 0
          AND workout_exercise_set.actual_reps > 0
      `;

      const completed_sets = parseInt(completed[0].completed);
      const progress = total_sets > 0 ? Math.min(100, Math.max(0, Math.round((completed_sets / total_sets) * 100))) : 0;

      debug('[getWorkoutDayExerciseProgress] Progresso calcolato:', progress);
      return reply.send({ progress, completed: completed_sets, total: total_sets });
    } catch (error) {
      debug('[getWorkoutDayExerciseProgress] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel calcolo del progresso' });
    }
  });

  fastify.get<{ Querystring: { id_workout_day_exercises: string; set_number: string; week_number: string } }>('/getPreviousWorkoutExerciseSet', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { id_workout_day_exercises, set_number, week_number } = req.query;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getPreviousWorkoutExerciseSet] Ricerca prestazione precedente:', { id_workout_day_exercises, set_number, week_number });

      const current_workout_day_exercise = await sql`
        SELECT 
          workout_day_exercises.id_exercise_list,
          program.id_program
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${id_workout_day_exercises}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

      if (current_workout_day_exercise.length === 0) {
        return reply.code(403).send({ message: 'Accesso negato' });
      }

      const id_exercise_list = current_workout_day_exercise[0].id_exercise_list;
      const id_program = current_workout_day_exercise[0].id_program;
      const previous_week = parseInt(week_number) - 1;

      if (previous_week < 1) {
        return reply.send({ previous_workout_exercise_set: null });
      }

      const previous_workout_exercise_set = await sql`
        SELECT 
          workout_exercise_set.actual_load as load,
          workout_exercise_set.actual_reps as reps,
          workout_exercise_set.rpe,
          workout_exercise_set.execution_rating,
          workout_exercise_set.created_at
        FROM workout_exercise_set
        INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        WHERE program_weeks.id_program = ${id_program}
          AND program_weeks.week_number = ${previous_week}
          AND workout_day_exercises.id_exercise_list = ${id_exercise_list}
          AND workout_exercise_set.set_number = ${set_number}
          AND workout_exercise_set.actual_load > 0
          AND workout_exercise_set.actual_reps > 0
        ORDER BY workout_exercise_set.created_at DESC
        LIMIT 1
      `;

      if (previous_workout_exercise_set.length === 0) {
        return reply.send({ previous_workout_exercise_set: null });
      }

      debug('[getPreviousWorkoutExerciseSet] Prestazione precedente trovata');
      return reply.send({ previous_workout_exercise_set: previous_workout_exercise_set[0] });
    } catch (error) {
      debug('[getPreviousWorkoutExerciseSet] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero prestazione precedente' });
    }
  });

  fastify.get<{ Params: { workoutDayExerciseId: string } }>('/getWorkoutExerciseSetHistory/:workoutDayExerciseId', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { workoutDayExerciseId } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWorkoutExerciseSetHistory] Recupero storico:', workoutDayExerciseId);

      const current_workout_day_exercise = await sql`
        SELECT 
          workout_day_exercises.id_exercise_list
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

      if (current_workout_day_exercise.length === 0) {
        return reply.code(403).send({ message: 'Accesso negato' });
      }

      const id_exercise_list = current_workout_day_exercise[0].id_exercise_list;

      const workout_exercise_set_history = await sql`
        SELECT 
          workout_exercise_set.set_number,
          workout_exercise_set.actual_load as load,
          workout_exercise_set.actual_reps as reps,
          workout_exercise_set.rpe,
          workout_exercise_set.execution_rating,
          workout_exercise_set.created_at,
          program_weeks.week_number,
          program.number_program,
          COALESCE(program.description, 'Programma ' || program.number_program) as program_name
        FROM workout_exercise_set
        INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_exercise_list = ${id_exercise_list}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND workout_exercise_set.actual_load > 0
          AND workout_exercise_set.actual_reps > 0
        ORDER BY workout_exercise_set.created_at DESC
        LIMIT 50
      `;

      debug('[getWorkoutExerciseSetHistory] Storico recuperato:', workout_exercise_set_history.length, 'record');
      return reply.send({ workout_exercise_set_history });
    } catch (error) {
      debug('[getWorkoutExerciseSetHistory] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero storico' });
    }
  });

  // ✅ NUOVO ENDPOINT: Ottieni tutti i progress di una settimana (esercizi, giorni, settimana)
  fastify.get<{ Params: { id_program_week: string } }>('/getWeekProgress/:id_program_week', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { id_program_week } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getWeekProgress] Calcolo progress per settimana:', id_program_week);

      // ✅ Verifica accesso
      const accessCheck = await sql`
        SELECT program_weeks.id_program_week
        FROM program_weeks
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE program_weeks.id_program_week = ${id_program_week}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND program.is_deleted = 0
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso alla settimana negato' });
      }

      // ✅ Ottieni tutti i giorni della settimana
      const program_days = await sql`
        SELECT id_program_day
        FROM program_days
        WHERE id_program_week = ${id_program_week}
        ORDER BY day_number ASC
      `;

      const days_progress: any[] = [];
      let total_day_progress = 0;
      let days_count = 0;

      // ✅ Per ogni giorno, calcola progress degli esercizi e del giorno
      for (const day of program_days) {
        const exercises = await sql`
          SELECT
            workout_day_exercises.id_workout_day_exercise,
            workout_day_exercises.sets as prescribed_sets,
            COALESCE(
              LEAST(100, GREATEST(0, (SELECT ROUND(
                (COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END) * 100.0) /
                NULLIF(workout_day_exercises.sets, 0), 0
              )::integer
              FROM workout_exercise_set
              WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise))),
              0
            ) as progress
          FROM workout_day_exercises
          WHERE workout_day_exercises.id_program_day = ${day.id_program_day}
            AND workout_day_exercises.is_deleted = 0
        `;

        // ✅ Calcola progress medio del giorno (percentuali 0-100)
        const day_progress = exercises.length > 0
          ? Math.min(100, Math.max(0, Math.round(exercises.reduce((sum: number, ex: any) => sum + parseFloat(ex.progress), 0) / exercises.length)))
          : 0;

        days_progress.push({
          id_program_day: day.id_program_day,
          progress: day_progress,
          exercises: exercises.map((ex: any) => ({
            id_workout_day_exercise: ex.id_workout_day_exercise,
            progress: parseFloat(ex.progress)
          }))
        });

        if (exercises.length > 0) {
          total_day_progress += day_progress;
          days_count++;
        }
      }

      // ✅ Calcola progress settimana (media progress giorni, percentuale 0-100)
      const week_progress = days_count > 0
        ? Math.min(100, Math.max(0, Math.round(total_day_progress / days_count)))
        : 0;

      debug('[getWeekProgress] Progress calcolato - Week:', week_progress, 'Days:', days_progress.length);

      return reply.send({
        week_progress,
        days: days_progress
      });

    } catch (error) {
      debug('[getWeekProgress] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel calcolo del progress' });
    }
  });

  // ============================================
  // Complete Week - Crea nuova settimana duplicando quella attuale
  // ============================================
  fastify.post<{ Params: { id_program_week: string } }>('/complete-week/:id_program_week', { preHandler: authenticateUser }, async (req, reply) => {
    const { id_program_week } = req.params;
    if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
    const userId = req.user.userDetails.id_user_details;

    debug('[completeWeek] Inizio completamento settimana:', id_program_week);

    // ✅ Verifica accesso e recupera dati settimana attuale (FUORI dalla transazione)
    const currentWeek = await sql`
      SELECT
        program_weeks.id_program_week,
        program_weeks.id_program,
        program_weeks.week_number,
        program_weeks.is_deload
      FROM program_weeks
      INNER JOIN program ON program_weeks.id_program = program.id_program
      WHERE program_weeks.id_program_week = ${id_program_week}
        AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
        AND program.is_deleted = 0
        AND program_weeks.is_deleted = 0
    `;

    if (currentWeek.length === 0) {
      return reply.code(403).send({ message: 'Accesso alla settimana negato' });
    }

    const { id_program, week_number, is_deload } = currentWeek[0];

    // ✅ Verifica che non esistano già settimane successive (FUORI dalla transazione)
    const nextWeeks = await sql`
      SELECT id_program_week
      FROM program_weeks
      WHERE id_program = ${id_program}
        AND week_number > ${week_number}
        AND is_deleted = 0
    `;

    if (nextWeeks.length > 0) {
      return reply.code(400).send({ message: 'Esistono già settimane successive' });
    }

    // ✅ TRANSAZIONE: tutto o niente
    try {
      const result = await sql.begin(async (tx: any) => {
        // ✅ 3. Crea nuova settimana
        const newWeekNumber = week_number + 1;
        debug('[completeWeek] Creazione nuova settimana:', newWeekNumber);

        const newWeek = await tx`
          INSERT INTO program_weeks (id_program, week_number, is_active, is_deload, is_deleted)
          VALUES (${id_program}, ${newWeekNumber}, true, ${is_deload || false}, 0)
          RETURNING id_program_week
        `;

        const newWeekId = newWeek[0].id_program_week;

        // ✅ 4. Imposta is_active = false per tutte le settimane precedenti
        await tx`
          UPDATE program_weeks
          SET is_active = false
          WHERE id_program = ${id_program}
            AND week_number < ${newWeekNumber}
        `;

        // ✅ 5. Recupera tutti i giorni della settimana attuale
        const currentDays = await tx`
          SELECT
            id_program_day,
            day_number,
            name,
            notes,
            theoretical_duration_seconds
          FROM program_days
          WHERE id_program_week = ${id_program_week}
          ORDER BY day_number
        `;

        debug('[completeWeek] Giorni da duplicare:', currentDays.length);

        // ✅ 6. Duplica program_days
        for (const day of currentDays) {
          const newDay = await tx`
            INSERT INTO program_days (
              id_program_week,
              day_number,
              name,
              notes,
              theoretical_duration_seconds
            )
            VALUES (
              ${newWeekId},
              ${day.day_number},
              ${day.name},
              ${day.notes},
              ${day.theoretical_duration_seconds}
            )
            RETURNING id_program_day
          `;

          const newDayId = newDay[0].id_program_day;

          // ✅ 7. Recupera esercizi del giorno corrente
          const currentExercises = await tx`
            SELECT
              id_workout_day_exercise,
              id_exercise_list,
              order_number,
              sets,
              id_program_exercise_group_intensity,
              notes
            FROM workout_day_exercises
            WHERE id_program_day = ${day.id_program_day}
            ORDER BY order_number
          `;

          debug('[completeWeek] Esercizi da duplicare per giorno', day.day_number, ':', currentExercises.length);

          // ✅ 8. Duplica workout_day_exercises
          for (const exercise of currentExercises) {
            const newExercise = await tx`
              INSERT INTO workout_day_exercises (
                id_program_day,
                id_exercise_list,
                order_number,
                sets,
                id_program_exercise_group_intensity,
                notes
              )
              VALUES (
                ${newDayId},
                ${exercise.id_exercise_list},
                ${exercise.order_number},
                ${exercise.sets},
                ${exercise.id_program_exercise_group_intensity},
                ${exercise.notes}
              )
              RETURNING id_workout_day_exercise
            `;

            const newExerciseId = newExercise[0].id_workout_day_exercise;

            // ✅ 9. Recupera set dell'esercizio corrente
            const currentSets = await tx`
              SELECT
                set_number,
                id_reps_type,
                reps_min,
                reps_max,
                rest_time,
                actual_load,
                intensity_type,
                group_intensity_id,
                notes
              FROM workout_exercise_set
              WHERE id_workout_day_exercises = ${exercise.id_workout_day_exercise}
              ORDER BY set_number
            `;

            debug('[completeWeek] Set da duplicare:', currentSets.length);

            // ✅ 10. Duplica workout_exercise_set (SENZA tracking)
            for (const set of currentSets) {
              await tx`
                INSERT INTO workout_exercise_set (
                  id_workout_day_exercises,
                  set_number,
                  id_reps_type,
                  reps_min,
                  reps_max,
                  rest_time,
                  intensity_type,
                  group_intensity_id,
                  notes,
                  actual_load,
                  actual_reps,
                  rpe,
                  execution_rating,
                  completed,
                  completed_at,
                  notes_tracking,
                  id_workout_session
                )
                VALUES (
                  ${newExerciseId},
                  ${set.set_number},
                  ${set.id_reps_type},
                  ${set.reps_min},
                  ${set.reps_max},
                  ${set.rest_time},
                  ${set.intensity_type},
                  ${set.group_intensity_id},
                  ${set.notes},
                  ${set.actual_load || null},
                  null,
                  null,
                  null,
                  false,
                  null,
                  null,
                  null
                )
              `;
            }
          }
        }

        debug('[completeWeek] Settimana completata con successo. Nuova settimana ID:', newWeekId);

        // ✅ Ritorna i dati dalla transazione
        return {
          new_week_id: newWeekId,
          new_week_number: newWeekNumber
        };
      });

      // ✅ Transazione completata con successo
      return reply.send({
        message: 'Settimana completata con successo',
        new_week_id: result.new_week_id,
        new_week_number: result.new_week_number
      });

    } catch (error) {
      debug('[completeWeek] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel completamento della settimana' });
    }
  });

  // ============================================
  // Dashboard Homepage - Statistiche generali
  // ============================================
  fastify.get('/dashboard/home', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[dashboardHome] Recupero statistiche homepage per utente:', userId);

      // ✅ Ottieni programma attivo
      const activeProgram = await sql`
        SELECT id_program, number_program, description
        FROM program
        WHERE (id_user_details = ${userId} OR assigned_to = ${userId})
          AND is_deleted = 0
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (activeProgram.length === 0) {
        return reply.send({
          hasProgram: false,
          message: 'Nessun programma attivo trovato'
        });
      }

      const programId = activeProgram[0].id_program;

      // ✅ Ottieni settimana attiva
      const activeWeek = await sql`
        SELECT id_program_week, week_number
        FROM program_weeks
        WHERE id_program = ${programId}
          AND is_active = true
          AND is_deleted = 0
        LIMIT 1
      `;

      let weekProgress = 0;
      let completedDays = 0;
      let totalDays = 0;
      let nextWorkout = null;

      if (activeWeek.length > 0) {
        const weekId = activeWeek[0].id_program_week;

        // ✅ Calcola progress della settimana
        const weekProgressData = await sql`
          SELECT
            COUNT(DISTINCT program_days.id_program_day) as total_days,
            COALESCE(
              LEAST(100, GREATEST(0, ROUND(
                AVG(
                  COALESCE(
                    (SELECT ROUND(
                      COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END)::decimal /
                      NULLIF(workout_day_exercises.sets, 0), 2
                    )
                    FROM workout_exercise_set
                    WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise),
                    0
                  )
                ), 2
              ))), 0
            ) as week_progress
          FROM program_days
          LEFT JOIN workout_day_exercises ON program_days.id_program_day = workout_day_exercises.id_program_day
            AND workout_day_exercises.is_deleted = 0
          WHERE program_days.id_program_week = ${weekId}
        `;

        weekProgress = parseFloat(weekProgressData[0].week_progress) || 0;
        totalDays = parseInt(weekProgressData[0].total_days) || 0;

        // ✅ Conta giorni completati (progress >= 1)
        const completedDaysData = await sql`
          SELECT COUNT(*) as completed
          FROM (
            SELECT
              program_days.id_program_day,
              COALESCE(
                LEAST(100, GREATEST(0, ROUND(
                  AVG(
                    COALESCE(
                      (SELECT ROUND(
                        COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END)::decimal /
                        GREATEST(COUNT(workout_exercise_set.id_workout_exercise_set), 1), 2
                      )
                      FROM workout_exercise_set
                      WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise),
                      0
                    )
                  ), 2
                ))), 0
              ) as day_progress
            FROM program_days
            LEFT JOIN workout_day_exercises ON program_days.id_program_day = workout_day_exercises.id_program_day
              AND workout_day_exercises.is_deleted = 0
            WHERE program_days.id_program_week = ${weekId}
            GROUP BY program_days.id_program_day
          ) as days_with_progress
          WHERE day_progress >= 1
        `;

        completedDays = parseInt(completedDaysData[0].completed) || 0;

        // ✅ Prossimo workout (primo giorno non completato)
        const nextWorkoutData = await sql`
          SELECT
            program_days.id_program_day,
            program_days.name as day_name,
            program_days.day_number,
            COALESCE(
              LEAST(100, GREATEST(0, ROUND(
                AVG(
                  COALESCE(
                    (SELECT ROUND(
                      COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END)::decimal /
                      NULLIF(workout_day_exercises.sets, 0), 2
                    )
                    FROM workout_exercise_set
                    WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise),
                    0
                  )
                ), 2
              ))), 0
            ) as day_progress
          FROM program_days
          LEFT JOIN workout_day_exercises ON program_days.id_program_day = workout_day_exercises.id_program_day
            AND workout_day_exercises.is_deleted = 0
          WHERE program_days.id_program_week = ${weekId}
          GROUP BY program_days.id_program_day, program_days.name, program_days.day_number
          HAVING COALESCE(
            ROUND(
              AVG(
                COALESCE(
                  (SELECT ROUND(
                    COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END)::decimal /
                    GREATEST(COUNT(workout_exercise_set.id_workout_exercise_set), 1), 2
                  )
                  FROM workout_exercise_set
                  WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise),
                  0
                )
              ), 2
            ), 0
          ) < 1
          ORDER BY program_days.day_number ASC
          LIMIT 1
        `;

        if (nextWorkoutData.length > 0) {
          nextWorkout = nextWorkoutData[0].day_name || `Giorno ${nextWorkoutData[0].day_number}`;
        }
      }

      // ✅ Conta totale allenamenti completati (giorni con progress >= 1)
      const totalWorkoutsData = await sql`
        SELECT COUNT(*) as total
        FROM (
          SELECT
            program_days.id_program_day,
            COALESCE(
              LEAST(100, GREATEST(0, ROUND(
                AVG(
                  COALESCE(
                    (SELECT ROUND(
                      COUNT(CASE WHEN workout_exercise_set.actual_load > 0 AND workout_exercise_set.actual_reps > 0 THEN 1 END)::decimal /
                      NULLIF(workout_day_exercises.sets, 0), 2
                    )
                    FROM workout_exercise_set
                    WHERE workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise),
                    0
                  )
                ), 2
              ))), 0
            ) as day_progress
          FROM program_days
          INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
          INNER JOIN program ON program_weeks.id_program = program.id_program
          LEFT JOIN workout_day_exercises ON program_days.id_program_day = workout_day_exercises.id_program_day
            AND workout_day_exercises.is_deleted = 0
          WHERE (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
            AND program.is_deleted = 0
          GROUP BY program_days.id_program_day
        ) as days_with_progress
        WHERE day_progress >= 1
      `;

      const totalWorkouts = parseInt(totalWorkoutsData[0].total) || 0;

      // ✅ Ultimo workout completato
      const lastWorkoutData = await sql`
        SELECT
          MAX(workout_exercise_set.completed_at) as last_completed
        FROM workout_exercise_set
        INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND workout_exercise_set.completed = true
          AND workout_exercise_set.completed_at IS NOT NULL
      `;

      let lastWorkout = null;
      if (lastWorkoutData[0].last_completed) {
        const lastDate = new Date(lastWorkoutData[0].last_completed);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          lastWorkout = 'Oggi';
        } else if (diffDays === 1) {
          lastWorkout = 'Ieri';
        } else {
          lastWorkout = `${diffDays} giorni fa`;
        }
      }

      // ✅ Personal bests (record di carico massimo per esercizio)
      const personalBests = await sql`
        SELECT COUNT(DISTINCT id_exercise_list) as total
        FROM (
          SELECT
            workout_day_exercises.id_exercise_list,
            MAX(workout_exercise_set.actual_load) as max_load
          FROM workout_exercise_set
          INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
          INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
          INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
          INNER JOIN program ON program_weeks.id_program = program.id_program
          WHERE (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
            AND workout_exercise_set.actual_load > 0
          GROUP BY workout_day_exercises.id_exercise_list
        ) as exercise_bests
      `;

      const totalPersonalBests = parseInt(personalBests[0].total) || 0;

      // ✅ Attività recente (ultimi 3 workout completati)
      const recentActivity = await sql`
        SELECT
          program_days.name as day_name,
          program_days.day_number,
          program_weeks.week_number,
          MAX(workout_exercise_set.completed_at) as completed_at
        FROM workout_exercise_set
        INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND workout_exercise_set.completed = true
          AND workout_exercise_set.completed_at IS NOT NULL
        GROUP BY program_days.id_program_day, program_days.name, program_days.day_number, program_weeks.week_number
        ORDER BY MAX(workout_exercise_set.completed_at) DESC
        LIMIT 3
      `;

      debug('[dashboardHome] Statistiche recuperate con successo');

      return reply.send({
        hasProgram: true,
        stats: {
          totalWorkouts,
          weekProgress,
          completedDays,
          totalDays,
          nextWorkout: nextWorkout || 'Nessun allenamento programmato',
          lastWorkout: lastWorkout || 'Nessun allenamento completato',
          personalBests: totalPersonalBests,
          activeProgram: activeProgram[0],
          activeWeek: activeWeek.length > 0 ? activeWeek[0] : null
        },
        recentActivity: recentActivity.map((activity: any) => ({
          day_name: activity.day_name || `Giorno ${activity.day_number}`,
          week_number: activity.week_number,
          completed_at: activity.completed_at
        }))
      });

    } catch (error) {
      debug('[dashboardHome] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero statistiche homepage' });
    }
  });
}
