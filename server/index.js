import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { pingDb, pool } from './config/db.js';
import { closeRedis, isRedisReady } from './config/redis.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  const db = await pingDb();
  res.status(db ? 200 : 503).json({ ok: db, db, redis: isRedisReady() });
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[server] API listening on http://localhost:${env.PORT}`);
  console.log(`[server] allowing requests from ${env.CLIENT_ORIGIN}`);
});

async function shutdown(signal) {
  console.log(`\n[server] ${signal} received, shutting down`);
  server.close();
  await closeRedis();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;
