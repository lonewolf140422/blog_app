# Inkwell

A small blog community. Anyone can read the feed; signed-in members write posts,
choose whether each one is public or private, upvote and downvote, comment, and
share a post by URL.

Built as a React single-page app over a JSON API, with **Neon Postgres** for
persistence and **Redis** as a read cache in front of it.

```
client/   React 18 + Vite + plain CSS
server/   Express 5 (ESM) + node-postgres + redis
```

## Stack and why

| Piece | Choice | Reason |
|---|---|---|
| Database | Neon Postgres | Real foreign keys between users, posts, comments and votes; `votes` uses a composite primary key so "one vote per user per post" is a database guarantee, not an application promise. |
| Cache | Redis | The feed is read far more often than it is written, so a 60-second cache absorbs most reads. Optional — the app runs without it. |
| Auth | JWT (`Authorization: Bearer …`) | Stateless, so the API needs no session store. Passwords are bcrypt-hashed. |
| Frontend | React + Vite | SPA routing, so `/post/12` is a shareable URL. |

## Getting started

```bash
npm run install:all      # root, server and client dependencies
cp .env.example .env     # then fill in DATABASE_URL and JWT_SECRET
npm run migrate          # create the tables
npm run seed             # optional: demo users, posts, comments, votes
npm run dev              # API on :3000, app on :5173
```

Open <http://localhost:5173>.

The seed script creates three accounts — `alice@example.com`, `bob@example.com`
and `charlie@example.com` — all with the password `password123`.

### Environment

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Neon connection string. |
| `JWT_SECRET` | yes | Any long random string: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. |
| `REDIS_URL` | no | Any Redis endpoint — `redis://default:…@host:port`, or `rediss://…` for TLS (Upstash, Redis Cloud). Leave blank to run without a cache. |
| `JWT_EXPIRES_IN` | no | Defaults to `7d`. |
| `PORT` | no | Defaults to `3000`. |
| `CLIENT_ORIGIN` | no | CORS origin, defaults to `http://localhost:5173`. |

## Data model

```
users ──< posts ──< comments
            └────< votes        (PRIMARY KEY (post_id, user_id))
```

`posts.visibility` is `'public'` or `'private'`. Deleting a user or a post
cascades to everything that hangs off it.

## API

All routes are under `/api`. Errors come back as `{ "error": "…" }`.

| Method | Path | Auth | |
|---|---|---|---|
| POST | `/auth/register` | — | `{username, email, password}` → `{user, token}` |
| POST | `/auth/login` | — | `{email, password}` → `{user, token}` |
| GET | `/auth/me` | required | the current user |
| GET | `/posts` | optional | public feed, `?page=&limit=` — **cached** |
| GET | `/posts/mine` | required | your posts, private included |
| GET | `/posts/:id` | optional | 403 if private and not yours — **cached** |
| POST | `/posts` | required | `{title, content, visibility}` |
| PUT | `/posts/:id` | author | |
| DELETE | `/posts/:id` | author | |
| POST | `/posts/:id/vote` | required | `{value: 1 \| -1}`; sending the same value again clears the vote |
| GET | `/posts/:id/comments` | optional | |
| POST | `/posts/:id/comments` | required | `{body}` |
| DELETE | `/comments/:id` | comment author or post author | |
| GET | `/health` | — | `{ok, db, redis}` |

Read responses carry a `cached` flag saying whether they came from Redis or
Postgres. The UI shows it as a small badge, which makes the cache easy to
demonstrate.

## How the caching works

Two kinds of entry:

- `post:{id}` — one blog, TTL 5 minutes.
- `feed:v{n}:public:p{page}:l{limit}` — one feed page, TTL 1 minute.

**Invalidating a single post** deletes its key. **Invalidating the feed** bumps
a counter, `feed:ver`, which is baked into every feed key. One `INCR` orphans
every cached page at once and the orphans expire on their own — no `KEYS` or
`SCAN`, both of which scan the whole keyspace.

Two details worth knowing:

- A cached payload never contains `my_vote`, because that value differs per
  viewer. Each request merges in the viewer's own votes with one extra query,
  so a shared cache entry stays shared.
- The feed cache holds public posts only, so a private post can never be handed
  to the wrong reader from cache. `GET /posts/:id` does cache private posts, but
  the visibility check runs on the payload after it is read, so a cached private
  post still returns 403 to everyone but its author.

Every cache call is wrapped so a failure returns `null` rather than throwing.
If Redis is down or `REDIS_URL` is unset, requests simply fall through to
Postgres and the app keeps working.

## Authorization

- `requireAuth` — rejects with 401 unless a valid `Bearer` token is present.
- `optionalAuth` — attaches the user when a token is present, but never rejects.
  Used by read routes so the same endpoint serves visitors and members.
- Ownership is checked in the controller with a `SELECT author_id` before any
  mutation, returning 403. The client hides Edit and Delete for posts you do not
  own, but that is only cosmetic — the server is the one enforcing it.

## Scripts

| Command | |
|---|---|
| `npm run dev` | API and client together |
| `npm run dev:server` / `npm run dev:client` | one at a time |
| `npm run migrate` | apply `server/db/schema.sql` |
| `npm run seed` | reset to demo data |
| `npm run build` | production build of the client |
| `npm start` | run the API alone |
