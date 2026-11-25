CREATE TABLE IF NOT EXISTS reposts (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reposts_user ON reposts (user_id, created_at);
