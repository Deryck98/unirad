CREATE TABLE IF NOT EXISTS council_rates (
  council TEXT NOT NULL,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (council, user_id, topic)
);
CREATE TABLE IF NOT EXISTS demands (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demands_body ON demands (body, created_at);
CREATE TABLE IF NOT EXISTS demand_support (
  demand_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (demand_id, user_id)
);
