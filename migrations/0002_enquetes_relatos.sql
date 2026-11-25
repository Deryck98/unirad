ALTER TABLE posts ADD COLUMN poll TEXT;
ALTER TABLE delays ADD COLUMN batch_id TEXT;
CREATE TABLE IF NOT EXISTS poll_votes (
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  opt INTEGER NOT NULL,
  PRIMARY KEY (post_id, user_id)
);
