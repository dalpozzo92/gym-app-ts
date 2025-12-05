import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticateUser, isPTorAdmin } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import sql from '../db.js';

export default async function usersRoutes(fastify: FastifyInstance) {

    fastify.get('/me', { preHandler: authenticateUser }, async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[getUser] Recupero dei dettagli utente');
        if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });

        const user_details = await sql`SELECT * FROM user_details WHERE uuid_auth = ${req.user.userId}`;
        if (!user_details.length) {
            debug('[getUser] Utente non trovato');
            return reply.code(404).send({ message: 'Utente non trovato' });
        }
        debug('[getUser] Dettagli utente recuperati con successo');
        return reply.send({ user_details: user_details[0] });
    });

    fastify.get('/all', { preHandler: [authenticateUser, isPTorAdmin] }, async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[getAllUsers] Recupero di tutti gli utenti');
        try {
            if (!req.user) return reply.code(401).send({ message: 'Unauthorized' });
            let users;

            if (req.user.userRole === 1) {
                // Admin: vede tutti gli utenti
                users = await sql`SELECT * FROM user_details`;
            } else if (req.user.userRole === 2) {
                // PT: vede solo i suoi clienti
                const ptDetails = await sql`SELECT id_user_details FROM user_details WHERE uuid_auth = ${req.user.userId}`;
                if (!ptDetails.length) {
                    return reply.code(404).send({ message: 'Dettagli PT non trovati' });
                }
                const ptId = ptDetails[0].id_user_details;
                users = await sql`SELECT * FROM user_details WHERE id_personal_trainer = ${ptId}`;
            }

            if (!users || !users.length) {
                debug('[getAllUsers] Nessun utente trovato');
                return reply.code(404).send({ message: 'Nessun utente trovato' });
            }

            debug(`[getAllUsers] ${users.length} utenti recuperati con successo`);
            return reply.send({ users });
        } catch (error) {
            debug('[getAllUsers] Errore nel recupero degli utenti:', error);
            return reply.code(500).send({ message: 'Errore nel recupero degli utenti' });
        }
    });
}
