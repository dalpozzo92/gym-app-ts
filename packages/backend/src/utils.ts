import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({
    path: path.resolve(__dirname, '..', envFile),
});

const formatValue = (value: unknown) => {
    if (value instanceof Error) {
        return value.stack || value.message;
    }
    if (typeof value === 'object' && value !== null) {
        try {
            return JSON.stringify(value);
        } catch {
            return '[unserializable object]';
        }
    }
    return String(value);
};

const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(',', '');
};

/**
 * Debug logger with a stable, readable format.
 * Usage examples:
 * debug('[auth] Login fallito', { email, reason: 'invalid-credentials' });
 * debug('[http]', 'GET /api/users', { statusCode: 401, durationMs: 12 });
 */
export const debug = (...args: any[]) => {
    if (process.env.DEBUG !== 'true') return;

    const [first, ...rest] = args;
    const dateTime = formatTimestamp();

    let scope = '';
    let message = '';

    if (typeof first === 'string') {
        const match = first.match(/^\[([^\]]+)]\s*(.*)$/);
        if (match) {
            scope = match[1];
            message = match[2];
        } else {
            message = first;
        }
    } else if (first !== undefined) {
        message = formatValue(first);
    }

    const context = rest
        .filter(value => value !== undefined)
        .map(formatValue)
        .join(' | ');

    const parts = [`[DEBUG ${dateTime}]`];
    if (scope) parts.push(`[${scope}]`);
    if (message) parts.push(message);
    if (context) parts.push(`ctx: ${context}`);

    console.log(parts.join(' '));
};
