CREATE TABLE IF NOT EXISTS link_health (
  normalized_url TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  final_url TEXT,
  status TEXT NOT NULL,
  status_code INTEGER,
  checked_at TEXT NOT NULL,
  error TEXT,
  title TEXT,
  description TEXT,
  content_type TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_health_checked_at
ON link_health (checked_at);

CREATE INDEX IF NOT EXISTS idx_link_health_status
ON link_health (status);
