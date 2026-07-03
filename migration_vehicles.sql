-- ============================================================
-- MIGRATION: Машины бүртгэл (vehicles) нэмэх
-- Байгаа database дээр аюулгүй — юу ч устгахгүй, зөвхөн нэмнэ.
-- D1 Console дээр бүхэлд нь хуулж Execute хийнэ.
-- ============================================================

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
