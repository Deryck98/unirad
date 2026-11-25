CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  kind TEXT NOT NULL,
  region INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (name_key, region)
);
CREATE TABLE IF NOT EXISTS place_rates (
  place_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (place_id, user_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_rates_place ON place_rates (place_id);
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS union_support (
  user_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
