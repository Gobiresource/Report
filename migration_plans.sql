CREATE TABLE IF NOT EXISTS monthly_plans (
  month TEXT PRIMARY KEY,
  plan_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
