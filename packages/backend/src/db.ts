import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({
    path: path.resolve(__dirname, '..', envFile),
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(connectionString);
console.log("DATABASE_URL:", connectionString);

export default sql;
