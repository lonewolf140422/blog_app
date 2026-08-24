import { HttpError } from '../middleware/error.js';
import * as cache from '../services/cache.js';
import {
  attachMyVotes,
  canView,
  countPublicPosts,
  deletePost,
  findPostById,
  findPostMeta,
  findPostsByAuthor,
  findPublicPosts,
  insertPost,
  updatePost,
} from '../services/posts.js';

const MAX_LIMIT = 50;

function paging(req) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || 10));
  return { page, limit, offset: (page - 1) * limit };
}

function validateBody(req) {
  const title = String(req.body.title || '').trim();
  const content = String(req.body.content || '').trim();
  const visibility = req.body.visibility === 'private' ? 'private' : 'public';

  if (!title) throw new HttpError(400, 'Title is required');
  if (title.length > 200) throw new HttpError(400, 'Title must be 200 characters or fewer');
  if (!content) throw new HttpError(400, 'Content is required');

  return { title, content, visibility };
}


export async function listPosts(req, res) {
  const { page, limit, offset } = paging(req);
  const key = await cache.feedKey({ page, limit, scope: 'public' });

  let payload = await cache.getJSON(key);
  let cached = Boolean(payload);

  if (!payload) {
    const [posts, total] = await Promise.all([
      findPublicPosts({ limit, offset }),
      countPublicPosts(),
    ]);
    payload = { posts, total };
    await cache.setJSON(key, payload, cache.TTL_FEED);
    cached = false;
  }

  const posts = await attachMyVotes(payload.posts, req.user?.id);

  res.json({
    posts,
    page,
    limit,
    total: payload.total,
    hasMore: offset + posts.length < payload.total,
    cached,
  });
}

/** GET /api/posts/mine — everything the signed-in user wrote, private included. */
export async function listMyPosts(req, res) {
  const { page, limit, offset } = paging(req);
  const rows = await findPostsByAuthor(req.user.id, { limit, offset });
  const posts = await attachMyVotes(rows, req.user.id);
  res.json({ posts, page, limit, cached: false });
}

/** GET /api/posts/:id — one blog. Private posts are visible to their author only. */
export async function getPost(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const key = cache.postKey(id);
  let post = await cache.getJSON(key);
  let cached = Boolean(post);

  if (!post) {
    post = await findPostById(id);
    if (!post) throw new HttpError(404, 'Post not found');
    await cache.setJSON(key, post, cache.TTL_POST);
    cached = false;
  }

  if (!canView(post, req.user?.id)) {
    throw new HttpError(403, 'This post is private');
  }

  const [withVote] = await attachMyVotes(post, req.user?.id);
  res.json({ post: withVote, cached });
}

/** POST /api/posts */
export async function createPost(req, res) {
  const { title, content, visibility } = validateBody(req);
  const id = await insertPost({ title, content, visibility, authorId: req.user.id });

  await cache.invalidateFeed();

  const post = await findPostById(id);
  const [withVote] = await attachMyVotes(post, req.user.id);
  res.status(201).json({ post: withVote });
}

/** PUT /api/posts/:id — author only. */
export async function editPost(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const meta = await findPostMeta(id);
  if (!meta) throw new HttpError(404, 'Post not found');
  if (meta.author_id !== req.user.id) throw new HttpError(403, 'You can only edit your own posts');

  const { title, content, visibility } = validateBody(req);
  await updatePost(id, { title, content, visibility });
  await cache.invalidatePost(id);

  const post = await findPostById(id);
  const [withVote] = await attachMyVotes(post, req.user.id);
  res.json({ post: withVote });
}

/** DELETE /api/posts/:id — author only. Comments and votes cascade. */
export async function removePost(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const meta = await findPostMeta(id);
  if (!meta) throw new HttpError(404, 'Post not found');
  if (meta.author_id !== req.user.id) throw new HttpError(403, 'You can only delete your own posts');

  await deletePost(id);
  await cache.invalidatePost(id);

  res.json({ ok: true, id });
}
