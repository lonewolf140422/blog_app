

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(30)  UNIQUE NOT NULL,
  email         VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  content    TEXT         NOT NULL,
  author_id  INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visibility VARCHAR(10)  NOT NULL DEFAULT 'public'
             CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER     NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (post, user): a user can hold at most one vote on a post.
CREATE TABLE IF NOT EXISTS votes (
  post_id INTEGER  NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value   SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_created   ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author    ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_public    ON posts (visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post   ON comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_votes_user      ON votes (user_id);
