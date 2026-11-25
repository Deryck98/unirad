ALTER TABLE posts ADD COLUMN image TEXT;
ALTER TABLE users ADD COLUMN avatar TEXT;
CREATE TABLE IF NOT EXISTS uploads (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads (user_id, created_at);
