ALTER TABLE users ADD COLUMN workplace TEXT;
CREATE TABLE IF NOT EXISTS comment_reports (
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);
