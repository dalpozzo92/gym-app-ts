import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Fastify, { FastifyError } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { debug } from './utils.js';

// Import routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import workoutsRoutes from './routes/workouts.js';
import programsRoutes from './routes/programs.js';
import exercisesRoutes from './routes/exercises.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({
    // Resolve env file relative to the backend package even when run from monorepo root
    path: path.resolve(__dirname, '..', envFile),
});

const fastify = Fastify({
    // Disable default Fastify JSON logger in favor of a slimmer custom one
    logger: false
});

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Register plugins
fastify.register(cors, {
    origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176', 'https://gym-app-ts.netlify.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

fastify.register(cookie);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(usersRoutes, { prefix: '/api/users' });
fastify.register(workoutsRoutes, { prefix: '/api/workouts' });
fastify.register(programsRoutes, { prefix: '/api/programs' });
fastify.register(exercisesRoutes, { prefix: '/api/exercises' });

// Lightweight request logger to keep only useful info
fastify.addHook('onRequest', (request, _reply, done) => {
    (request as any)._startAt = process.hrtime.bigint();
    done();
});

fastify.addHook('onResponse', (request, reply, done) => {
    const startAt = (request as any)._startAt as bigint | undefined;
    const durationNs = startAt ? process.hrtime.bigint() - startAt : undefined;
    const durationMs = durationNs !== undefined ? Number(durationNs) / 1_000_000 : undefined;

    debug(
        '[http]',
        `${request.method} ${request.url}`,
        {
            statusCode: reply.statusCode,
            durationMs: durationMs !== undefined ? Number(durationMs.toFixed(2)) : undefined,
            userId: (request as any).user?.id
        }
    );
    done();
});

// Global error handler
fastify.setErrorHandler((error: FastifyError, request, reply) => {
    debug(`[ERROR] ${error.message}`);
    reply.status(error.statusCode || 500).send({ message: error.message || 'Errore interno del server' });
});

// 404 handler (Fastify handles this by default, but we can customize)
const start = async () => {
    // Registra plugin per file statici (Frontend React)
    const publicPath = path.join(__dirname, '../public');

    // Check if public folder exists to prevent crash on startup
    let publicExists = false;
    try {
        // Usa fs.promises o una semplice stat sincrona se siamo in startup
        // Importiamo fs dinamicamente se non presente o usiamo try/catch su register
        // Ma fastify-static throwa se la root non esiste.
        await import('fs').then(fs => fs.promises.access(publicPath));
        publicExists = true;
    } catch (e) {
        debug(`[server] WARNING: Public folder not found at ${publicPath}. Frontend will not be served.`);
    }

    if (publicExists) {
        // Configura fastify-static
        // IMPORTANTE: 'wildcard: true' serve per intercettare le richieste ai file statici (es. /assets/*.js)
        // Se il file non esiste, Fastify chiamerà il nostro setNotFoundHandler
        fastify.register(import('@fastify/static'), {
            root: publicPath,
            prefix: '/',
            wildcard: true // Abilita wildcard per servire i file statici automaticamente
        });
        debug(`[server] Static files serving from: ${publicPath}`);
    } else {
        debug('[server] Skipping static files serving (folder missing)');
    }

    // Fallback per SPA: Definito DOPO aver registrato routes e static
    // Questo cattura tutto ciò che non è stato gestito sopra
    fastify.setNotFoundHandler(async (request, reply) => {
        // Se è una richiesta API, restituisci 404 JSON standard
        if (request.url.startsWith('/api')) {
            debug(`[404] API non trovata: ${request.method} ${request.url}`);
            return reply.status(404).send({ message: 'Risorsa non trovata' });
        }

        // Se public esiste, servi index.html
        if (publicExists) {
            return reply.sendFile('index.html');
        } else {
            return reply.status(404).send({ message: 'Frontend build not found', warning: 'Application started in API-only mode' });
        }
    });

    const port = parseInt(process.env.PORT || '3000');
    try {
        await fastify.listen({ port, host: '0.0.0.0' });
        debug(`[server] Server in ascolto sulla porta ${port}`);
    } catch (err) {
        debug('[server]', 'Errore durante l\'avvio del server', err);
        process.exit(1);
    }
};

start();
