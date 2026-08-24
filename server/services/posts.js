import { query } from '../config/db.js';

const POST_SELECT = `
  SELECT p.id,
         p.title,
         p.content,
         p.visibility,
         p.created_at,
         p.updated_at,
         u.id       AS author_id,
         u.username AS author,
         COALESCE(vs.score, 0)::int   AS score,
         COALESCE(cs.total, 0)::int   AS comment_count
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN (SELECT post_id, SUM(value) AS score FROM votes    GROUP BY post_id) vs ON vs.post_id = p.id
  LEFT JOIN (SELECT post_id, COUNT(*)   AS total FROM comments GROUP BY post_id) cs ON cs.post_id = p.id
`;

/** Trim the body down to a card-sized preview for list views. */
function withExcerpt(post) {
  const text = post.content.replace(/\s+/g, ' ').trim();
  return {
    ...post,
    excerpt: text.length > 220 ? `${text.slice(0, 220)}…` : text,
  };
}

/** Public posts only, newest first — safe to cache and serve to anyone. */
export async function findPublicPosts({ limit, offset }) {
  const { rows } = await query(
    `${POST_SELECT} WHERE p.visibility = 'public'
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(withExcerpt);
}

export async function countPublicPosts() {
  const { rows } = await query(`SELECT COUNT(*)::int AS total FROM posts WHERE visibility = 'public'`);
  return rows[0].total;
}

/** Everything one user wrote, private posts included. Never cached publicly. */
export async function findPostsByAuthor(authorId, { limit, offset }) {
  const { rows } = await query(
    `${POST_SELECT} WHERE p.author_id = $1
     ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`,
    [authorId, limit, offset]
  );
  return rows.map(withExcerpt);
}

export async function findPostById(id) {
  const { rows } = await query(`${POST_SELECT} WHERE p.id = $1`, [id]);
  return rows[0] || null;
}

/** Cheap ownership/visibility lookup used before mutations. */
export async function findPostMeta(id) {
  const { rows } = await query(
    'SELECT id, author_id, visibility FROM posts WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

export async function insertPost({ title, content, visibility, authorId }) {
  const { rows } = await query(
    `INSERT INTO posts (title, content, visibility, author_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [title, content, visibility, authorId]
  );
  return rows[0].id;
}

export async function updatePost(id, { title, content, visibility }) {
  await query(
    `UPDATE posts SET title = $1, content = $2, visibility = $3, updated_at = now()
     WHERE id = $4`,
    [title, content, visibility, id]
  );
}

export async function deletePost(id) {
  await query('DELETE FROM posts WHERE id = $1', [id]);
}

export async function attachMyVotes(posts, userId) {
  const list = Array.isArray(posts) ? posts : [posts];
  if (!userId || list.length === 0) {
    return list.map((p) => ({ ...p, my_vote: 0 }));
  }
  const ids = list.map((p) => p.id);
  const { rows } = await query(
    'SELECT post_id, value FROM votes WHERE user_id = $1 AND post_id = ANY($2::int[])',
    [userId, ids]
  );
  const byPost = new Map(rows.map((r) => [r.post_id, r.value]));
  return list.map((p) => ({ ...p, my_vote: byPost.get(p.id) ?? 0 }));
}

/** Can this viewer read this post? Private posts are author-only. */
export function canView(post, userId) {
  return post.visibility === 'public' || post.author_id === userId;
}
