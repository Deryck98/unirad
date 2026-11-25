CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS company_rates (
  company_id TEXT NOT NULL,
  place_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  topic TEXT NOT NULL,
  value INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (company_id, place_id, user_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_crates_company ON company_rates (company_id);
CREATE INDEX IF NOT EXISTS idx_crates_place ON company_rates (place_id);
CREATE TABLE IF NOT EXISTS watch (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  ref TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, kind, ref)
);
CREATE INDEX IF NOT EXISTS idx_watch_ref ON watch (kind, ref);
