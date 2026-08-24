import { getClient } from '../config/redis.js';

export const TTL_POST = 300; // 5 min — a single blog
export const TTL_FEED = 60;  // 1 min — the public feed page

const FEED_VERSION_KEY = 'feed:ver';

export async function getJSON(key) {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error('[cache] get failed:', err.message);
    return null;
  }
}

export async function setJSON(key, value, ttlSeconds) {
  const redis = getClient();
  if (!redis) return false;
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    return true;
  } catch (err) {
    console.error('[cache] set failed:', err.message);
    return false;
  }
}

export async function del(...keys) {
  const redis = getClient();
  if (!redis || keys.length === 0) return false;
  try {
    await redis.del(keys);
    return true;
  } catch (err) {
    console.error('[cache] del failed:', err.message);
    return false;
  }
}


export const postKey = (id) => `post:${id}`;

async function feedVersion() {
  const redis = getClient();
  if (!redis) return 0;
  try {
    const v = await redis.get(FEED_VERSION_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export async function feedKey({ page, limit, scope = 'public' }) {
  const v = await feedVersion();
  return `feed:v${v}:${scope}:p${page}:l${limit}`;
}

async function bumpFeedVersion() {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.incr(FEED_VERSION_KEY);
  } catch (err) {
    console.error('[cache] feed version bump failed:', err.message);
  }
}


/** Call after any write that changes a post, its votes, or its comments. */
export async function invalidatePost(id) {
  await Promise.all([del(postKey(id)), bumpFeedVersion()]);
}

/** Call after create/delete, where no single post id needs clearing. */
export async function invalidateFeed() {
  await bumpFeedVersion();
}
