import { query } from '../config/db.js';
import { HttpError } from '../middleware/error.js';
import * as cache from '../services/cache.js';
import { canView, findPostMeta } from '../services/posts.js';

const MAX_COMMENT = 1000;

/** GET /api/posts/:id/comments — mirrors the post's visibility rules. */
export async function listComments(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const meta = await findPostMeta(id);
  if (!meta) throw new HttpError(404, 'Post not found');
  if (!canView(meta, req.user?.id)) throw new HttpError(403, 'This post is private');

  const { rows } = await query(
    `SELECT c.id, c.body, c.created_at, u.id AS user_id, u.username AS author
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
    [id]
  );

  res.json({ comments: rows, post_author_id: meta.author_id });
}

/** POST /api/posts/:id/comments */
export async function addComment(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const body = String(req.body.body || '').trim();
  if (!body) throw new HttpError(400, 'Comment cannot be empty');
  if (body.length > MAX_COMMENT) {
    throw new HttpError(400, `Comment must be ${MAX_COMMENT} characters or fewer`);
  }

  const meta = await findPostMeta(id);
  if (!meta) throw new HttpError(404, 'Post not found');
  if (!canView(meta, req.user.id)) throw new HttpError(403, 'This post is private');

  const { rows } = await query(
    `INSERT INTO comments (post_id, user_id, body) VALUES ($1, $2, $3)
     RETURNING id, body, created_at, user_id`,
    [id, req.user.id, body]
  );

  // comment_count lives on the cached post payload.
  await cache.invalidatePost(id);

  res.status(201).json({ comment: { ...rows[0], author: req.user.username } });
}

/** DELETE /api/comments/:id — the comment's author, or the post's author. */
export async function removeComment(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid comment id');

  const { rows } = await query(
    `SELECT c.id, c.user_id, c.post_id, p.author_id AS post_author_id
     FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = $1`,
    [id]
  );
  const comment = rows[0];
  if (!comment) throw new HttpError(404, 'Comment not found');

  const allowed = comment.user_id === req.user.id || comment.post_author_id === req.user.id;
  if (!allowed) throw new HttpError(403, 'You cannot delete this comment');

  await query('DELETE FROM comments WHERE id = $1', [id]);
  await cache.invalidatePost(comment.post_id);

  res.json({ ok: true, id });
}
