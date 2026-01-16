import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser, verifyToken, refreshToken, extractAccessToken } from '../middlewares/auth.js';
import { setSessionCookies } from '../middlewares/auth.js';
import { debug } from '../utils.js';
import { UserDetails } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function authRoutes(fastify: FastifyInstance) {

    fastify.post<{ Body: { email: string; password: string } }>('/login', async (req, reply) => {
        const { email, password } = req.body;

        try {
            debug('[login] Tentativo di login per: ' + email);

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error || !data.user || !data.session) {
                debug('[login] Credenziali non valide: ' + error?.message + ' ' + email + ' ' + password);
                return reply.code(401).send({ message: 'Credenziali non valide' });
            }

            const { data: userDetails, error: detailsError } = await supabase
                .from('user_details')
                .select('*')
                .eq('uuid_auth', data.user.id)
                .single();

            if (detailsError || !userDetails) {
                debug('[login] Dettagli utente non trovati');
                return reply.code(404).send({ message: 'Dettagli utente non trovati' });
            }

            setSessionCookies(reply, data.session.access_token, data.session.refresh_token, data.session.expires_in);

            debug('[login] Login effettuato con successo per: ' + email);
            // ✅ I token sono gestiti tramite cookie HTTP-only per sicurezza
            // Non vengono inviati al client - solo i dati utente
            return reply.send({
                message: 'Login effettuato con successo',
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    ...userDetails
                }
            });
        } catch (error: any) {
            debug('[login] Errore di login: ' + error.message);
            return reply.code(500).send({ message: 'Errore durante il login' });
        }
    });

    fastify.post<{ Body: { email: string; password: string; name: string } }>('/register', async (req, reply) => {
        const { email, password, name } = req.body;

        try {
            debug('[register] Tentativo di registrazione per: ' + email);

            const { data: existingUsers } = await supabase
                .from('user_details')
                .select('email')
                .eq('email', email);

            if (existingUsers && existingUsers.length > 0) {
                debug('[register] Email già registrata');
                return reply.code(400).send({ message: 'Email già registrata' });
            }

            const { data, error } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true
            });

            if (error || !data.user) {
                debug('[register] Errore di registrazione: ' + error?.message);
                return reply.code(400).send({ message: error?.message || 'Errore sconosciuto' });
            }

            const { error: insertError } = await supabase
                .from('user_details')
                .insert([{
                    uuid_auth: data.user.id,
                    name,
                    email,
                    user_details_type: 3
                }]);

            if (insertError) {
                debug('[register] Errore nell\'inserimento dei dettagli: ' + insertError.message);
                return reply.code(500).send({ message: 'Errore nella creazione del profilo utente' });
            }

            debug('[register] Registrazione completata per: ' + email);
            return reply.send({ message: 'Registrazione completata con successo' });
        } catch (error: any) {
            debug('[register] Errore di registrazione: ' + error.message);
            return reply.code(500).send({ message: 'Errore durante la registrazione' });
        }
    });

    fastify.post('/logout', async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[logout] Logout utente');

        const accessToken = req.cookies.sb_access_token;

        if (accessToken) {
            try {
                await supabase.auth.admin.signOut(accessToken);
            } catch (error: any) {
                debug('[logout] Errore nel logout da Supabase: ' + error.message);
            }
        }

        reply.clearCookie('sb_access_token');
        reply.clearCookie('sb_refresh_token');

        return reply.send({ message: 'Logout effettuato con successo' });
    });

    fastify.post('/verify-refresh-token', async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[verify-refresh-token] Refresh del token');

        const refreshTokenStr = req.cookies.sb_refresh_token;

        // Note: refreshToken function from middleware might need adjustment if it expects just token string
        // In middleware/auth.ts I defined it as taking string.
        // But req.cookies.sb_access_token might be undefined.
        if (!refreshTokenStr) {
            return reply.code(401).send({ message: 'Token non fornito' });
        }

        const result = await refreshToken(refreshTokenStr);

        if (!result.success || !result.token) {
            debug(`[verify-refresh-token] Errore: ${result.error}`);
            return reply.code(401).send({ isValid: false, message: result.error });
        }

        // ✅ Aggiorna entrambi i cookie (access + refresh)
        setSessionCookies(reply, result.token, result.session?.refresh_token || refreshTokenStr, result.expiresIn || 3600);

        debug('[refresh-token] Token refreshato con successo');
        // ✅ I token sono gestiti tramite cookie HTTP-only
        // Non vengono inviati al client - solo conferma del refresh
        return reply.send({
            isValid: true,
            message: 'Token refreshato con successo'
        });
    });

    fastify.get('/verify-token', async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[verify-token] Verifica token');

        const { token, source } = extractAccessToken(req);
        if (!token) {
            return reply.send({ isValid: false });
        }

        const result = await verifyToken(token);

        debug(`[verify-token] Token ${result.isValid ? 'valido' : 'non valido'} (da ${source || 'sconosciuto'})`);
        return reply.send({ isValid: result.isValid });
    });

    fastify.get('/me', { preHandler: authenticateUser }, async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[me] Recupero profilo utente');

        if (!req.user) {
            return reply.code(401).send({ message: 'Utente non autenticato' });
        }

        return reply.send({
            user: {
                role: req.user.userRole,
                ...req.user.userDetails
            }
        });
    });

    fastify.get('/verify-role', { preHandler: authenticateUser }, async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[verify-role] Verifica ruolo utente');
        if (!req.user) {
            return reply.code(401).send({ message: 'Utente non autenticato' });
        }
        return reply.send({
            isAuthenticated: true,
            userRole: req.user.userRole
        });
    });

    fastify.get('/verify-admin', { preHandler: authenticateUser }, async (req: FastifyRequest, reply: FastifyReply) => {
        debug('[verify-admin] Verifica status admin');
        if (!req.user) {
            return reply.code(401).send({ message: 'Utente non autenticato' });
        }
        return reply.send({ isAdmin: req.user.userRole === 1 });
    });
}
