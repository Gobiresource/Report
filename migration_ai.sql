-- =====================================================================
-- AI НЭГТГЭЛИЙН КЭШ — D1 Console дээр НЭГ УДАА ажиллуулна
-- =====================================================================
-- AI дуудлага бүр төлбөртэй тул нэг хугацааны нэгтгэлийг нэг л удаа
-- үүсгэж энд хадгална. data_hash = тухайн хугацааны тайлангийн төлөв;
-- шинэ тайлан орж ирвэл hash өөрчлөгдөж, нэгтгэл хуучирсныг мэдэгдэнэ.

CREATE TABLE IF NOT EXISTS ai_summaries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_date  TEXT NOT NULL,
  to_date    TEXT NOT NULL,
  data_hash  TEXT NOT NULL,
  summary    TEXT NOT NULL,
  model      TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(from_date, to_date)
);
