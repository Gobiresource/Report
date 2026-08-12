-- ============================================================
-- MIGRATION: Хурлын тэмдэглэл ба даалгавар (2026-08)
-- ------------------------------------------------------------
-- D1 Console дээр НЭГ УДАА ажиллуулна. DROP байхгүй тул
-- байгаа өгөгдөлд нөлөөлөхгүй.
-- ============================================================

-- Хурал бүр нэг огноотой (ихэвчлэн Даваа гараг).
-- notes = хурлын чөлөөт тэмдэглэл (шийдвэр, оролцогчид).
CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_date TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Хурал дээр өгсөн даалгавар.
-- status: open (хийгдэж байна) / done (биелсэн) / postponed (хойшилсон)
-- worker_note = ажилтны бичсэн тайлбар (жишээ: «Сэлбэг ирээгүй»)
CREATE TABLE IF NOT EXISTS meeting_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id INTEGER NOT NULL,
  task_text TEXT NOT NULL,
  assignee_id INTEGER,
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  worker_note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_tasks_meeting ON meeting_tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_tasks_assignee ON meeting_tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(meeting_date);
