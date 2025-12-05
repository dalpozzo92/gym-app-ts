import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

export default async function exercisesRoutes(fastify: FastifyInstance) {

    fastify.get<{ Params: { workoutDayExerciseId: string } }>('/getExerciseDetails/:workoutDayExerciseId', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { workoutDayExerciseId } = req.params;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[getExerciseDetails] Recupero dettagli esercizio:', workoutDayExerciseId);

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

            const exerciseDetails = await sql`
        SELECT 
          workout_day_exercises.id_workout_day_exercise,
          workout_day_exercises.order as exercise_order,
          workout_day_exercises.sets,
          workout_day_exercises.reps_min,
          workout_day_exercises.reps_max,
          workout_day_exercises.rest_time,
          workout_day_exercises.target_load,
          exercises_list.id_exercise_list,
          exercises_list.name as exercise_name,
          exercises_list.description,
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
          program_weeks.week_number,
          reps_types.name as reps_type_name
        FROM workout_day_exercises
        INNER JOIN exercises_list ON workout_day_exercises.id_exercise_list = exercises_list.id_exercise_list
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        LEFT JOIN reps_types ON workout_day_exercises.id_reps_type = reps_types.id_reps_type
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND workout_day_exercises.is_deleted = 0
      `;

            if (exerciseDetails.length === 0) {
                return reply.code(404).send({ message: 'Esercizio non trovato' });
            }

            const sets = await sql`
        SELECT 
          workout_exercise_set.id_workout_exercise_set,
          workout_exercise_set.set_number,
          workout_exercise_set.load,
          workout_exercise_set.reps,
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
                ...exerciseDetails[0],
                sets: sets
            };

            debug('[getExerciseDetails] Dettagli recuperati con successo');
            return reply.send(result);
        } catch (error) {
            debug('[getExerciseDetails] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel recupero dei dettagli esercizio' });
        }
    });

    fastify.get<{ Params: { workoutDayId: string } }>('/day/:workoutDayId', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { workoutDayId } = req.params;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[getDayExercises] Recupero esercizi per giorno:', workoutDayId);

            const accessCheck = await sql`
        SELECT program_days.id_program_day 
        FROM program_days
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE program_days.id_program_day = ${workoutDayId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND program.is_deleted = 0
      `;

            if (accessCheck.length === 0) {
                return reply.code(403).send({ message: 'Accesso negato' });
            }

            const exercises = await sql`
        SELECT 
          workout_day_exercises.id_workout_day_exercise,
          workout_day_exercises.order as exercise_order,
          workout_day_exercises.sets,
          workout_day_exercises.reps_min,
          workout_day_exercises.reps_max,
          workout_day_exercises.rest_time,
          exercises_list.name as exercise_name,
          exercises_list.id_muscolar_group
        FROM workout_day_exercises
        INNER JOIN exercises_list ON workout_day_exercises.id_exercise_list = exercises_list.id_exercise_list
        WHERE workout_day_exercises.id_program_day = ${workoutDayId}
          AND workout_day_exercises.is_deleted = 0
        ORDER BY workout_day_exercises.order ASC
      `;

            debug('[getDayExercises] Esercizi recuperati:', exercises.length);
            return reply.send(exercises);
        } catch (error) {
            debug('[getDayExercises] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel recupero degli esercizi' });
        }
    });

    fastify.post<{
        Body: {
            workoutDayExerciseId: number;
            setIndex: number;
            load?: number;
            reps?: number;
            intensity?: number;
            rpe?: number;
            execution_rating?: number;
            notes?: string;
        }
    }>('/sets/save', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const {
                workoutDayExerciseId,
                setIndex,
                load,
                reps,
                intensity,
                rpe,
                execution_rating,
                notes
            } = req.body;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[saveSet] Salvataggio serie:', { workoutDayExerciseId, setIndex, load, reps });

            const accessCheck = await sql`
        SELECT workout_day_exercises.id_workout_day_exercise
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

            if (accessCheck.length === 0) {
                return reply.code(403).send({ message: 'Accesso negato' });
            }

            const setNumber = setIndex + 1;

            const savedSet = await sql`
        INSERT INTO workout_exercise_set (
          id_workout_day_exercises,
          set_number,
          load,
          reps,
          intensity,
          rpe,
          execution_rating,
          notes,
          synced,
          modified_at
        )
        VALUES (
          ${workoutDayExerciseId},
          ${setNumber},
          ${load || 0},
          ${reps || 0},
          ${intensity || 0},
          ${rpe || null},
          ${execution_rating || null},
          ${notes || null},
          true,
          NOW()
        )
        ON CONFLICT (id_workout_day_exercises, set_number)
        DO UPDATE SET
          load = EXCLUDED.load,
          reps = EXCLUDED.reps,
          intensity = EXCLUDED.intensity,
          rpe = EXCLUDED.rpe,
          execution_rating = EXCLUDED.execution_rating,
          notes = EXCLUDED.notes,
          synced = true,
          modified_at = NOW()
        RETURNING *
      `;

            debug('[saveSet] Serie salvata con successo');
            return reply.send(savedSet[0]);
        } catch (error) {
            debug('[saveSet] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel salvataggio della serie' });
        }
    });

    fastify.post<{ Body: { sets: any[] } }>('/sets/sync', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { sets } = req.body;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[syncSets] Sincronizzazione batch di', sets.length, 'serie');

            if (!Array.isArray(sets) || sets.length === 0) {
                return reply.code(400).send({ message: 'Nessuna serie da sincronizzare' });
            }

            const syncedSets = [];

            for (const set of sets) {
                const accessCheck = await sql`
          SELECT workout_day_exercises.id_workout_day_exercise
          FROM workout_day_exercises
          INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
          INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
          INNER JOIN program ON program_weeks.id_program = program.id_program
          WHERE workout_day_exercises.id_workout_day_exercise = ${set.workoutDayExerciseId}
            AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
        `;

                if (accessCheck.length === 0) {
                    debug('[syncSets] Accesso negato per serie:', set.workoutDayExerciseId);
                    continue;
                }

                const setNumber = set.setIndex + 1;

                const savedSet = await sql`
          INSERT INTO workout_exercise_set (
            id_workout_day_exercises,
            set_number,
            load,
            reps,
            intensity,
            rpe,
            execution_rating,
            notes,
            synced,
            modified_at
          )
          VALUES (
            ${set.workoutDayExerciseId},
            ${setNumber},
            ${set.load || 0},
            ${set.reps || 0},
            ${set.intensity || 0},
            ${set.rpe || null},
            ${set.execution_rating || null},
            ${set.notes || null},
            true,
            NOW()
          )
          ON CONFLICT (id_workout_day_exercises, set_number)
          DO UPDATE SET
            load = EXCLUDED.load,
            reps = EXCLUDED.reps,
            intensity = EXCLUDED.intensity,
            rpe = EXCLUDED.rpe,
            execution_rating = EXCLUDED.execution_rating,
            notes = EXCLUDED.notes,
            synced = true,
            modified_at = NOW()
          RETURNING *
        `;

                syncedSets.push(savedSet[0]);
            }

            debug('[syncSets] Sincronizzate', syncedSets.length, 'serie');
            return reply.send({ synced: syncedSets.length, sets: syncedSets });
        } catch (error) {
            debug('[syncSets] Errore:', error);
            return reply.code(500).send({ message: 'Errore nella sincronizzazione' });
        }
    });

    fastify.get<{ Params: { workoutDayExerciseId: string } }>('/:workoutDayExerciseId/progress', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { workoutDayExerciseId } = req.params;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[getProgress] Calcolo progresso per:', workoutDayExerciseId);

            const accessCheck = await sql`
        SELECT workout_day_exercises.id_workout_day_exercise, workout_day_exercises.sets
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

            if (accessCheck.length === 0) {
                return reply.code(403).send({ message: 'Accesso negato' });
            }

            const totalSets = accessCheck[0].sets;

            const completedSets = await sql`
        SELECT COUNT(*) as completed
        FROM workout_exercise_set
        WHERE workout_exercise_set.id_workout_day_exercises = ${workoutDayExerciseId}
          AND workout_exercise_set.load > 0
          AND workout_exercise_set.reps > 0
      `;

            const completed = parseInt(completedSets[0].completed);
            const progress = totalSets > 0 ? Math.round((completed / totalSets) * 100) : 0;

            debug('[getProgress] Progresso calcolato:', progress);
            return reply.send({ progress, completed, total: totalSets });
        } catch (error) {
            debug('[getProgress] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel calcolo del progresso' });
        }
    });

    fastify.get<{ Querystring: { workoutDayExerciseId: string; setNumber: string; weekNumber: string } }>('/previous-performance', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { workoutDayExerciseId, setNumber, weekNumber } = req.query;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[getPreviousPerformance] Ricerca prestazione:', { workoutDayExerciseId, setNumber, weekNumber });

            const currentExercise = await sql`
        SELECT 
          workout_day_exercises.id_exercise_list,
          program.id_program
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

            if (currentExercise.length === 0) {
                return reply.code(403).send({ message: 'Accesso negato' });
            }

            const exerciseListId = currentExercise[0].id_exercise_list;
            const programId = currentExercise[0].id_program;
            const previousWeek = parseInt(weekNumber) - 1;

            if (previousWeek < 1) {
                return reply.send(null);
            }

            const previousPerformance = await sql`
        SELECT 
          workout_exercise_set.load,
          workout_exercise_set.reps,
          workout_exercise_set.rpe,
          workout_exercise_set.execution_rating,
          workout_exercise_set.created_at
        FROM workout_exercise_set
        INNER JOIN workout_day_exercises ON workout_exercise_set.id_workout_day_exercises = workout_day_exercises.id_workout_day_exercise
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        WHERE program_weeks.id_program = ${programId}
          AND program_weeks.week_number = ${previousWeek}
          AND workout_day_exercises.id_exercise_list = ${exerciseListId}
          AND workout_exercise_set.set_number = ${setNumber}
          AND workout_exercise_set.load > 0
          AND workout_exercise_set.reps > 0
        ORDER BY workout_exercise_set.created_at DESC
        LIMIT 1
      `;

            if (previousPerformance.length === 0) {
                return reply.send(null);
            }

            debug('[getPreviousPerformance] Prestazione precedente trovata');
            return reply.send(previousPerformance[0]);
        } catch (error) {
            debug('[getPreviousPerformance] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel recupero della prestazione precedente' });
        }
    });

    fastify.get<{ Params: { workoutDayExerciseId: string } }>('/:workoutDayExerciseId/history', { preHandler: authenticateUser }, async (req, reply) => {
        try {
            const { workoutDayExerciseId } = req.params;
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            const userId = req.user.userDetails.id_user_details;

            debug('[getHistory] Recupero storico per:', workoutDayExerciseId);

            const currentExercise = await sql`
        SELECT 
          workout_day_exercises.id_exercise_list
        FROM workout_day_exercises
        INNER JOIN program_days ON workout_day_exercises.id_program_day = program_days.id_program_day
        INNER JOIN program_weeks ON program_days.id_program_week = program_weeks.id_program_week
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE workout_day_exercises.id_workout_day_exercise = ${workoutDayExerciseId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
      `;

            if (currentExercise.length === 0) {
                return reply.code(403).send({ message: 'Accesso negato' });
            }

            const exerciseListId = currentExercise[0].id_exercise_list;

            const history = await sql`
        SELECT 
          workout_exercise_set.set_number,
          workout_exercise_set.load,
          workout_exercise_set.reps,
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
        WHERE workout_day_exercises.id_exercise_list = ${exerciseListId}
          AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
          AND workout_exercise_set.load > 0
          AND workout_exercise_set.reps > 0
        ORDER BY workout_exercise_set.created_at DESC
        LIMIT 50
      `;

            debug('[getHistory] Storico recuperato:', history.length, 'record');
            return reply.send(history);
        } catch (error) {
            debug('[getHistory] Errore:', error);
            return reply.code(500).send({ message: 'Errore nel recupero dello storico' });
        }
    });
}
