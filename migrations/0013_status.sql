CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  bg INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  anon INTEGER NOT NULL DEFAULT 0,
  region INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_time ON stories (created_at);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories (user_id, created_at);
CREATE TABLE IF NOT EXISTS story_views (
  story_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  zap INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (story_id, user_id)
);
