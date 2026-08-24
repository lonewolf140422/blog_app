import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { HttpError } from '../middleware/error.js';
import { signToken } from '../middleware/auth.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  created_at: row.created_at,
});

export async function register(req, res) {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!USERNAME_RE.test(username)) {
    throw new HttpError(400, 'Username must be 3–30 characters: letters, numbers or underscore');
  }
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters');

  const clash = await query(
    'SELECT username, email FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  if (clash.rows.length) {
    const taken = clash.rows[0].email === email ? 'Email' : 'Username';
    throw new HttpError(409, `${taken} is already registered`);
  }

  const password_hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username, email, password_hash]
  );

  const user = publicUser(rows[0]);
  res.status(201).json({ user, token: signToken(user) });
}

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) throw new HttpError(400, 'Email and password are required');

  const { rows } = await query(
    'SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  const row = rows[0];
  // Same message either way, so the response can't be used to probe for accounts.
  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw new HttpError(401, 'Incorrect email or password');
  }

  const user = publicUser(row);
  res.json({ user, token: signToken(user) });
}

export async function me(req, res) {
  const { rows } = await query(
    `SELECT u.id, u.username, u.email, u.created_at,
            (SELECT COUNT(*)::int FROM posts WHERE author_id = u.id) AS post_count
     FROM users u WHERE u.id = $1`,
    [req.user.id]
  );
  if (!rows[0]) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: rows[0] });
}
