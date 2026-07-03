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

-- Машины бүртгэл
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'support',      -- sludge | waste | short | product | support
  ownership TEXT NOT NULL DEFAULT 'own',        -- own | rental_product | rental_sludge
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO vehicles (name, purpose, ownership, active, sort_order) VALUES
('XCMG 50 ковш', 'support', 'own', 1, 1),
('LONKING 55 ковш 855', 'support', 'own', 1, 2),
('LONKING 60 ковш 863-И', 'support', 'own', 1, 3),
('SEM-655-D 50-Ковш /Шинэ/', 'support', 'own', 1, 4),
('KOMATSU Экскаватор 360', 'support', 'own', 1, 5),
('520 HYUNDAI-12 Экскаватор 727', 'support', 'own', 1, 6),
('HYUNDAI-19 Экскаватор 112', 'support', 'own', 1, 7),
('ZOOMLION кран 5810 УЕС', 'support', 'own', 1, 8),
('Түлшний машин', 'support', 'own', 1, 9),
('Усны машин', 'support', 'own', 1, 10),
('18-42 МТ-86 Бохирын машин', 'support', 'own', 1, 11),
('HOWO-371-802-40-42-ТТА', 'sludge', 'own', 1, 12),
('HOWO-371-803-40-43-ТТА', 'sludge', 'own', 1, 13),
('HOWO-371-809-40-44-ТТА', 'sludge', 'own', 1, 14),
('HOWO-371-810-40-41-ТТА', 'sludge', 'own', 1, 15),
('Портер 49-15ӨМӨ', 'support', 'own', 1, 16),
('Land-76', 'support', 'own', 1, 17),
('Пикап', 'support', 'own', 1, 18),
('Пуужин, генератор, гредир, Бохир', 'support', 'own', 1, 19),
('50 тн кран Түрээс', 'support', 'own', 1, 20),
('Үйлдвэрт', 'support', 'own', 1, 21),
('85-95ОРБ 60-Н ХӨЛТ', 'product', 'rental_product', 1, 22),
('38-59 ӨМЕ', 'product', 'rental_product', 1, 23),
('45-02 ӨМЕ', 'product', 'rental_product', 1, 24),
('26-87 УББ', 'product', 'rental_product', 1, 25),
('31-84 ӨМЭ', 'product', 'rental_product', 1, 26),
('45-08-ӨМЕ', 'product', 'rental_product', 1, 27),
('36-57-ӨМЕ', 'product', 'rental_product', 1, 28),
('00-96ММА МТ-86', 'sludge', 'rental_sludge', 1, 29),
('51-38-УНК ХОВО', 'sludge', 'rental_sludge', 1, 30),
('08-49-УНН Норд', 'sludge', 'rental_sludge', 1, 31),
('08-46-УНН- Норд', 'sludge', 'rental_sludge', 1, 32),
('HDU831 0885УЕУ', 'sludge', 'rental_sludge', 1, 33),
('HDU832 3499УЕХ', 'sludge', 'rental_sludge', 1, 34),
('HDU833 0100ММА', 'sludge', 'rental_sludge', 1, 35),
('01-27 гридер', 'support', 'rental_sludge', 1, 36);
