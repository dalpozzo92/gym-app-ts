import { FastifyReply, FastifyRequest } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { debug } from '../utils.js';
import { User } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY must be defined');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const isProd = process.env.NODE_ENV === 'production';

export const setSessionCookies = (reply: FastifyReply, accessToken: string, refreshToken: string, expiresIn: number) => {
    // Con il proxy Netlify le richieste sono same-origin, quindi usiamo 'lax'
    // 'none' causa problemi su iOS Safari PWA standalone
    reply.setCookie('sb_access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'none',
        path: '/',
        maxAge: expiresIn
    });

    reply.setCookie('sb_refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'none',
        path: '/',
        maxAge: 60 * 24 * 60 * 60 // 60 giorni in secondi
    });
};

export const extractAccessToken = (req: FastifyRequest) => {
    const cookieToken = req.cookies?.sb_access_token;
    if (cookieToken) return { token: cookieToken, source: 'cookie' as const };

    const authHeader = req.headers.authorization;
    if (authHeader?.toLowerCase().startsWith('bearer ')) {
        return { token: authHeader.slice(7), source: 'header' as const };
    }

    return { token: undefined, source: undefined };
};

export const verifyToken = async (token: string) => {
    if (!token) {
        return { isValid: false };
    }

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return { isValid: false };
        }
        return { isValid: true, user: data.user };
    } catch (error: any) {
        debug(`[verifyToken] Errore: ${error.message}`);
        return { isValid: false };
    }
};

export const refreshToken = async (token: string) => {
    if (!token) {
        return { success: false, error: 'Token non fornito' };
    }

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });

        if (error || !data.session) {
            return { success: false, error: error?.message || 'Errore nel refresh del token' };
        }

        return {
            success: true,
            session: data.session,
            token: data.session.access_token,
            expiresIn: data.session.expires_in
        };
    } catch (error: any) {
        debug(`[refreshToken] Errore: ${error.message}`);
        return { success: false, error: error.message };
    }
};

export const authenticateUser = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { token: accessToken, source: tokenSource } = extractAccessToken(req);
    const refreshTokenCookie = req.cookies?.sb_refresh_token;

    // Se manca l'access token ma abbiamo il refresh, proviamo a rigenerarlo
    if (!accessToken && refreshTokenCookie) {
        debug('[authenticateUser] Access token non trovato, tento refresh con cookie');
        const refreshResult = await refreshToken(refreshTokenCookie);
        if (refreshResult.success && refreshResult.token && refreshResult.session) {
            setSessionCookies(reply, refreshResult.token, refreshResult.session.refresh_token, refreshResult.session.expires_in);

            req.headers.authorization = `Bearer ${refreshResult.token}`;
            return authenticateUser(req, reply); // rientra con il nuovo token
        }
        debug('[authenticateUser] Refresh fallito o token non ottenuto');
    }

    if (!accessToken) {
        debug('[authenticateUser] Access token non trovato');
        return reply.code(401).send({ message: 'Non autorizzato' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);

        if (!error && user) {
            const { data: userDetails, error: detailsError } = await supabase
                .from('user_details')
                .select('*')
                .eq('uuid_auth', user.id)
                .single();

            if (detailsError || !userDetails) {
                debug('[authenticateUser] Dettagli utente non trovati');
                return reply.code(404).send({ message: 'Dettagli utente non trovati' });
            }

            req.user = {
                userId: user.id,
                userRole: userDetails.user_details_type,
                userDetails: userDetails
            };

            // Se il token arriva da Authorization header ma manca il cookie, sincronizziamo il cookie per le prossime richieste
            if (tokenSource === 'header' && !req.cookies?.sb_access_token) {
                setSessionCookies(reply, accessToken, req.cookies.sb_refresh_token || '', 60 * 60);
            }

            debug('[authenticateUser] Utente autenticato: ' + user.id + ` (token da ${tokenSource || 'sconosciuto'})`);
            return;
        }

        debug('[authenticateUser] Access token non valido, tentativo di refresh');

        const refreshTokenStr = req.cookies.sb_refresh_token;

        if (!refreshTokenStr) {
            debug('[authenticateUser] Refresh token non trovato');
            return reply.code(401).send({ message: 'Sessione scaduta, effettua nuovamente il login' });
        }

        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: refreshTokenStr
        });

        if (refreshError || !refreshData.session || !refreshData.user) {
            debug('[authenticateUser] Refresh token non valido: ' + refreshError?.message);

            reply.clearCookie('sb_access_token');
            reply.clearCookie('sb_refresh_token');

            return reply.code(401).send({ message: 'Sessione scaduta, effettua nuovamente il login' });
        }

        // ✅ Usa setSessionCookies per evitare cookie duplicati
        setSessionCookies(reply, refreshData.session.access_token, refreshData.session.refresh_token, refreshData.session.expires_in);

        const { data: userDetailsAfterRefresh, error: detailsErrorAfterRefresh } = await supabase
            .from('user_details')
            .select('*')
            .eq('uuid_auth', refreshData.user.id)
            .single();

        if (detailsErrorAfterRefresh || !userDetailsAfterRefresh) {
            debug('[authenticateUser] Dettagli utente non trovati dopo refresh');
            return reply.code(404).send({ message: 'Dettagli utente non trovati' });
        }

        req.user = {
            userId: refreshData.user.id,
            userRole: userDetailsAfterRefresh.user_details_type,
            userDetails: userDetailsAfterRefresh
        };

        debug('[authenticateUser] Utente autenticato dopo refresh: ' + refreshData.user.id);

    } catch (error: any) {
        debug('[authenticateUser] Errore di autenticazione: ' + error.message);
        return reply.code(401).send({ message: 'Errore di autenticazione' });
    }
};

export const isAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    debug('[isAdmin] Verifica dei privilegi admin');

    if (!req.user || req.user.userRole !== 1) {
        debug('[isAdmin] Accesso negato: utente non è admin');
        return reply.code(403).send({ message: 'Accesso negato: privilegi insufficienti' });
    }

    debug('[isAdmin] Utente verificato come admin');
};

export const isPT = async (req: FastifyRequest, reply: FastifyReply) => {
    debug('[isPT] Verifica dei privilegi PT');

    if (!req.user || req.user.userRole !== 2) {
        debug('[isPT] Accesso negato: utente non è PT');
        return reply.code(403).send({ message: 'Accesso negato: privilegi insufficienti' });
    }

    debug('[isPT] Utente verificato come PT');
};

export const isPTorAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    debug('[isPTorAdmin] Verifica dei privilegi PT o admin');

    if (!req.user || (req.user.userRole !== 1 && req.user.userRole !== 2)) {
        debug('[isPTorAdmin] Accesso negato: utente non è né PT né admin');
        return reply.code(403).send({ message: 'Accesso negato: privilegi insufficienti' });
    }

    debug('[isPTorAdmin] Utente verificato come PT o admin');
};
