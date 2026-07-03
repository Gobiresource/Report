-- ============================================================
-- ГОВЬ РЕСУРС ДЕВЕЛОПМЕНТ ХХК — D1 Database Schema
-- ------------------------------------------------------------
-- АНХААРУУЛГА: Хэрэв D1 database чинь аль хэдийн энэ бүтцээр
-- бөглөгдсөн бол ЭНЭ ФАЙЛЫГ ДАХИН АЖИЛЛУУЛАХ ШААРДЛАГАГҮЙ.
-- Доорх DROP TABLE мөрүүд байгаа бүх тайлан, хэрэглэгчийн
-- мэдээллийг устгана. Зөвхөн шинэ, хоосон database эсвэл
-- бүрмөсөн дахин эхлүүлэх үед л ажиллуулна.
-- ============================================================

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS user_report_permissions;
DROP TABLE IF EXISTS report_types;
DROP TABLE IF EXISTS users;

-- Хэрэглэгчид: удирдлага (admin), захирал (viewer), ажилтан (worker)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  department TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Тайлангийн 7 модуль
CREATE TABLE report_types (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

-- Хэн ямар тайлан ОРУУЛАХ эрхтэйг тодорхойлно
-- (харах эрх — Dashboard-ыг нэвтэрсэн хэн ч харна, энд хамаарахгүй)
CREATE TABLE user_report_permissions (
  user_id INTEGER NOT NULL,
  report_type_key TEXT NOT NULL,
  can_submit INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, report_type_key),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (report_type_key) REFERENCES report_types(key)
);

-- Өдөр тутмын тайлан. data_json дотор тухайн модулийн бүх талбар хадгалагдана.
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  report_type TEXT NOT NULL,
  data_json TEXT NOT NULL,
  submitted_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(date, report_type, submitted_by),
  FOREIGN KEY (submitted_by) REFERENCES users(id)
);

-- Нэвтрэлт болон тайлан илгээлт бүрийн log
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target TEXT,
  old_data TEXT,
  new_data TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ------------------------------------------------------------
-- Seed data
-- ------------------------------------------------------------

INSERT INTO report_types (key, name, sort_order, active) VALUES
('production', 'Үйлдвэрлэл / Лаб', 10, 1),
('transport',  'Тээвэр',           20, 1),
('fuel',       'Түлш',             30, 1),
('equipment',  'Техник',           40, 1),
('camp',       'Кемп / хүн хүч',   50, 1),
('hse',        'ХАБЭА',            60, 1),
('issue',      'Асуудал',          70, 1);

INSERT INTO users (username, name, pin, role, department, active) VALUES
('admin',      'Админ',              '9999', 'admin',  'management', 1),
('uildverlel', 'Үйлдвэрлэл ажилтан', '1111', 'worker', 'production', 1),
('teever',     'Тээвэр ажилтан',     '2222', 'worker', 'transport',  1),
('tulsh',      'Түлш ажилтан',       '3333', 'worker', 'fuel',       1),
('technik',    'Техник ажилтан',     '4444', 'worker', 'equipment',  1),
('camp',       'Кемп менежер',       '5555', 'worker', 'camp',       1),
('hse',        'ХАБЭА ажилтан',      '6666', 'worker', 'hse',        1),
('asuudal',    'Асуудал бүртгэгч',   '7777', 'worker', 'issue',      1);

INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'production', 1 FROM users WHERE username = 'uildverlel';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'transport', 1 FROM users WHERE username = 'teever';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'fuel', 1 FROM users WHERE username = 'tulsh';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'equipment', 1 FROM users WHERE username = 'technik';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'camp', 1 FROM users WHERE username = 'camp';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'hse', 1 FROM users WHERE username = 'hse';
INSERT INTO user_report_permissions (user_id, report_type_key, can_submit)
  SELECT id, 'issue', 1 FROM users WHERE username = 'asuudal';
