import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './error.js';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

/** Rejects with 401 unless a valid token is present. */
export function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function optionalAuth(req, res, next) {
  const token = readToken(req);
  req.user = null;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      req.user = { id: payload.id, username: payload.username };
    } catch {
      // fall through as an anonymous visitor
    }
  }
  next();
}
