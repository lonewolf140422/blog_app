import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  PORT: Number(process.env.PORT) || 3000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

if (!env.DATABASE_URL) {
  console.error('[env] DATABASE_URL is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

if (!env.JWT_SECRET) {
  console.error('[env] JWT_SECRET is missing. Add one to .env.');
  process.exit(1);
}
