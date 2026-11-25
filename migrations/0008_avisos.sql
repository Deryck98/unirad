CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  ref TEXT,
  snippet TEXT,
  n INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  read INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications (user_id, created_at);
CREATE TABLE IF NOT EXISTS push_subs (
  endpoint TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subs (user_id);
CREATE TABLE IF NOT EXISTS config (
  k TEXT PRIMARY KEY,
  v TEXT NOT NULL
);
