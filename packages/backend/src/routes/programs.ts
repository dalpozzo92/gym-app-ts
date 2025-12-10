import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

export default async function programsRoutes(fastify: FastifyInstance) {

  fastify.get<{ Params: { userId?: string } }>('/getProgramActive/:userId?', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const targetUserId = req.user.userDetails.id_user_details;
      debug('[getProgramActive] Recupero programma attivo per utente:', targetUserId);

      const program = await sql`
        SELECT 
          program.id_program,
          program.number_program,
          program.description,
          program.date_start_program,
          program.number_days_workout,
          program.duration_workout,
          program.is_active,
          user_details.name as trainer_name
        FROM program
        LEFT JOIN user_details ON program.id_personal_trainer = user_details.id_user_details
        WHERE (program.id_user_details = ${targetUserId} OR program.assigned_to = ${targetUserId})
          AND program.is_active = true
          AND program.is_deleted = 0
        ORDER BY program.created_at DESC
        LIMIT 1
      `;
      debug('[getProgramActive] Programma attivo:', program.length);

      if (program.length == 0) {
        debug('[getProgramActive] Nessun programma attivo trovato');
        return reply.code(404).send({ message: 'Nessun programma attivo trovato' });
      }

      debug('[getProgramActive] Programma attivo recuperato con successo');
      return reply.send({ program: program[0] });
    } catch (error) {
      debug('[getProgramActive] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero del programma attivo' });
    }
  });

  fastify.get<{ Params: { programId: string } }>('/getProgramWeeks/:programId', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { programId } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getProgramWeeks] Recupero settimane per programma:', programId);

      const programAccess = await sql`
        SELECT id_program 
        FROM program 
        WHERE id_program = ${programId}
        AND (id_user_details = ${userId} OR assigned_to = ${userId})
        AND is_deleted = 0
      `;

      if (programAccess.length === 0) {
        return reply.code(403).send({ message: 'Accesso al programma negato' });
      }

      const program_weeks = await sql`
        SELECT
          program_weeks.id_program_week,
          program_weeks.week_number,
          program_weeks.is_active,
          program_weeks.is_deleted,
          COALESCE(
            LEAST(100, GREATEST(0, ROUND(
              (
                -- Conta i set completati (actual_load > 0 AND actual_reps > 0)
                SELECT COUNT(*)
                FROM workout_exercise_set wes
                INNER JOIN workout_day_exercises wde ON wes.id_workout_day_exercises = wde.id_workout_day_exercise
                INNER JOIN program_days pd ON wde.id_program_day = pd.id_program_day
                WHERE pd.id_program_week = program_weeks.id_program_week
                  AND wde.is_deleted = 0
                  AND wes.actual_load > 0
                  AND wes.actual_reps > 0
              ) * 100.0 / NULLIF(
                (
                  -- Somma i set prescritti totali
                  SELECT SUM(wde2.sets)
                  FROM workout_day_exercises wde2
                  INNER JOIN program_days pd2 ON wde2.id_program_day = pd2.id_program_day
                  WHERE pd2.id_program_week = program_weeks.id_program_week
                    AND wde2.is_deleted = 0
                ), 0
              ), 0
            )::integer)), 0
          ) as progress
        FROM program_weeks
        WHERE program_weeks.id_program = ${programId}
        AND program_weeks.is_deleted = 0
        ORDER BY program_weeks.week_number ASC
      `;

      debug('[getProgramWeeks] Settimane recuperate:', program_weeks.length);
      return reply.send({ program_weeks });
    } catch (error) {
      debug('[getProgramWeeks] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero delle settimane' });
    }
  });

  fastify.get<{ Params: { programWeekId: string } }>('/getProgramDays/:programWeekId', { preHandler: authenticateUser }, async (req, reply) => {
    try {
      const { programWeekId } = req.params;
      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      debug('[getProgramDays] Recupero giorni per settimana:', programWeekId);

      const accessCheck = await sql`
        SELECT program_weeks.id_program_week 
        FROM program_weeks
        INNER JOIN program ON program_weeks.id_program = program.id_program
        WHERE program_weeks.id_program_week = ${programWeekId}
        AND (program.id_user_details = ${userId} OR program.assigned_to = ${userId})
        AND program.is_deleted = 0
      `;

      if (accessCheck.length === 0) {
        return reply.code(403).send({ message: 'Accesso alla settimana negato' });
      }

      const program_days = await sql`
        SELECT 
          program_days.id_program_day,
          program_days.day_number,
          program_days.name,
          program_days.notes,
          COALESCE(
            (SELECT COUNT(*) 
             FROM workout_day_exercises 
             WHERE workout_day_exercises.id_program_day = program_days.id_program_day), 
            0
          ) as exercise_count,
          COALESCE(
            (SELECT SUM(workout_day_exercises.sets * 2 + 3) 
             FROM workout_day_exercises 
             WHERE workout_day_exercises.id_program_day = program_days.id_program_day), 
            45
          ) as estimated_duration,
          COALESCE(
            LEAST(100, GREATEST(0, (SELECT ROUND(
              (
                (SELECT COUNT(*)::decimal
                 FROM workout_exercise_set wes
                 INNER JOIN workout_day_exercises wde ON wes.id_workout_day_exercises = wde.id_workout_day_exercise
                 WHERE wde.id_program_day = program_days.id_program_day
                   AND wde.is_deleted = 0
                   AND wes.actual_load > 0
                   AND wes.actual_reps > 0)
                * 100.0
              ) /
              NULLIF(
                (SELECT SUM(sets)
                 FROM workout_day_exercises
                 WHERE id_program_day = program_days.id_program_day
                   AND is_deleted = 0),
                0
              ), 0
            )::integer))),
            0
          ) as progress
        FROM program_days
        WHERE program_days.id_program_week = ${programWeekId}
        ORDER BY program_days.day_number ASC
      `;

      debug('[getProgramDays] Giorni recuperati:', program_days.length);
      return reply.send({ program_days });
    } catch (error) {
      debug('[getProgramDays] Errore:', error);
      return reply.code(500).send({ message: 'Errore nel recupero dei giorni' });
    }
  });

  fastify.get('/getProgramList', { preHandler: authenticateUser }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      debug('[getProgramList] Recupero dei programmi utente');

      if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
      const userId = req.user.userDetails.id_user_details;

      const program = await sql`
        SELECT program.* 
        FROM program 
        WHERE program.id_user_details = ${userId}
        ORDER BY program.created_at DESC
      `;

      debug('[getProgramList] Programmi dell\'utente recuperati con successo');
      return reply.send({ program });
    } catch (error) {
      debug('[getProgramList] Errore nel recupero dei programmi:', error);
      return reply.code(500).send({ message: 'Errore nel recupero dei programmi' });
    }
  });
}
