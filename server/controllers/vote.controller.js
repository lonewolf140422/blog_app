import { query } from '../config/db.js';
import { HttpError } from '../middleware/error.js';
import * as cache from '../services/cache.js';
import { canView, findPostMeta } from '../services/posts.js';

/**
 * POST /api/posts/:id/vote  { value: 1 | -1 }
 * Clicking the same arrow twice removes the vote; clicking the other one flips it.
 */
export async function vote(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid post id');

  const value = Number(req.body.value);
  if (value !== 1 && value !== -1) throw new HttpError(400, 'Vote value must be 1 or -1');

  const meta = await findPostMeta(id);
  if (!meta) throw new HttpError(404, 'Post not found');
  if (!canView(meta, req.user.id)) throw new HttpError(403, 'This post is private');

  const existing = await query(
    'SELECT value FROM votes WHERE post_id = $1 AND user_id = $2',
    [id, req.user.id]
  );

  let myVote;
  if (existing.rows[0]?.value === value) {
    await query('DELETE FROM votes WHERE post_id = $1 AND user_id = $2', [id, req.user.id]);
    myVote = 0;
  } else {
    await query(
      `INSERT INTO votes (post_id, user_id, value) VALUES ($1, $2, $3)
       ON CONFLICT (post_id, user_id) DO UPDATE SET value = EXCLUDED.value`,
      [id, req.user.id, value]
    );
    myVote = value;
  }

  const { rows } = await query(
    'SELECT COALESCE(SUM(value), 0)::int AS score FROM votes WHERE post_id = $1',
    [id]
  );

  // The score is part of the cached payload, so the entry has to go.
  await cache.invalidatePost(id);

  res.json({ id, score: rows[0].score, my_vote: myVote });
}
