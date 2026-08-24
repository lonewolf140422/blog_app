import { createClient } from 'redis';
import { env } from './env.js';

let client = null;
let ready = false;

if (env.REDIS_URL) {
  client = createClient({
    url: env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => (retries > 3 ? false : Math.min(retries * 200, 1000)),
    },
  });

  client.on('ready', () => {
    ready = true;
    console.log('[redis] connected');
  });
  client.on('end', () => {
    ready = false;
  });
  client.on('error', (err) => {
    if (ready) console.error('[redis] error:', err.message);
    ready = false;
  });

  client.connect().catch((err) => {
    console.warn(`[redis] unavailable (${err.message}) — running without cache`);
    ready = false;
  });
} else {
  console.warn('[redis] REDIS_URL not set — running without cache');
}

export function getClient() {
  return ready ? client : null;
}

export function isRedisReady() {
  return ready;
}

export async function closeRedis() {
  if (client && ready) await client.quit().catch(() => {});
}
