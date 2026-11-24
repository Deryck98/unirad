CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  crtr TEXT NOT NULL,
  role TEXT NOT NULL,
  region INTEGER NOT NULL,
  anon_default INTEGER NOT NULL DEFAULT 1,
  pass_hash TEXT NOT NULL,
  pass_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (region, crtr)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  cat TEXT NOT NULL,
  scope TEXT NOT NULL,
  region INTEGER NOT NULL,
  anon INTEGER NOT NULL,
  author_name TEXT,
  text TEXT NOT NULL,
  place TEXT,
  salary TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_scope ON posts (scope, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_region ON posts (region, created_at);
CREATE TABLE IF NOT EXISTS likes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  anon INTEGER NOT NULL,
  author_name TEXT,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at);
CREATE TABLE IF NOT EXISTS reports (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE TABLE IF NOT EXISTS delays (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  region INTEGER NOT NULL,
  hospital TEXT NOT NULL,
  type TEXT NOT NULL,
  month TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_delays_region ON delays (region);
