-- =====================================================================
-- ТЭЭВЭР/ТЕХНИКИЙН ШИНЭ БҮТЭЦ — D1 Console дээр НЭГ УДАА ажиллуулна
-- =====================================================================
-- Машин = Ангилал(компани) + Марк + Дугаар. Хуучин purpose/ownership
-- баганууд ХЭВЭЭР үлдэнэ (түүхэн тайлан ашигладаг) — шинэ UI хэрэглэхгүй.
-- Чиглэл = нэр + зай(км, 1 рейсийн урт) + ангилал (sludge/waste/product) —
-- самбарын Шлам/Хаягдал/Бүтээгдэхүүн задаргаа энэ ангиллаас гарна.

ALTER TABLE vehicles ADD COLUMN company TEXT;
ALTER TABLE vehicles ADD COLUMN brand TEXT;

CREATE TABLE IF NOT EXISTS vehicle_companies (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS vehicle_brands (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transport_routes (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  name   TEXT NOT NULL,
  km     REAL NOT NULL,
  cat    TEXT NOT NULL DEFAULT 'product',   -- sludge | waste | product
  active INTEGER NOT NULL DEFAULT 1
);

INSERT OR IGNORE INTO vehicle_companies (name) VALUES ('GRD');
