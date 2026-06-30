PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  department TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users(name,department,pin,role) VALUES
('Үйлдвэрлэл','production','1111','user'),
('Тээвэр','transport','2222','user'),
('Түлш','fuel','3333','user'),
('Техник','equipment','4444','user'),
('Кемп','camp','5555','user'),
('ХАБЭА','safety','6666','user'),
('Issue log','issues','7777','user'),
('Admin','admin','9999','admin');

CREATE TABLE IF NOT EXISTS report_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  department TEXT NOT NULL,
  submitted_by TEXT,
  raw_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_report_submissions_date ON report_submissions(date, department);

CREATE TABLE IF NOT EXISTS production_shift_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  meter_value REAL,
  product_ton REAL,
  middling_ton REAL,
  fuel_liter REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, shift)
);

CREATE TABLE IF NOT EXISTS lab_quality_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  shift TEXT,
  sample_time TEXT,
  luojing_ad REAL,
  fumei_ad REAL,
  caking_g REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_lab_date ON lab_quality_samples(date);

CREATE TABLE IF NOT EXISTS transport_truck_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  transport_type TEXT NOT NULL,
  truck_no TEXT NOT NULL,
  trips REAL,
  ton_weight REAL,
  avg_ton_per_trip REAL,
  roster TEXT,
  source_sheet TEXT DEFAULT 'ТЭЭВЭР',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transport_date ON transport_truck_records(date, transport_type);

CREATE TABLE IF NOT EXISTS transport_weighbridge_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  truck_no TEXT NOT NULL,
  tare_weight_kg REAL,
  gross_weight_kg REAL,
  net_weight_kg REAL,
  net_weight_ton REAL,
  is_valid INTEGER NOT NULL DEFAULT 1,
  validation_note TEXT,
  source_site TEXT DEFAULT 'Energy Resource',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_weighbridge_date ON transport_weighbridge_records(date);

CREATE TABLE IF NOT EXISTS fuel_storage_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  storage_type TEXT NOT NULL,
  income_liter REAL,
  opening_stock_liter REAL,
  issued_to_machine_liter REAL,
  issued_to_plant_liter REAL,
  issued_to_station_liter REAL,
  total_expense_liter REAL,
  closing_stock_liter REAL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, storage_type)
);

CREATE TABLE IF NOT EXISTS fuel_equipment_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_group TEXT,
  fuel_liter REAL,
  meter_value REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_eq_date ON fuel_equipment_records(date);

CREATE TABLE IF NOT EXISTS fuel_issue_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  voucher_no TEXT,
  equipment_name TEXT,
  operator_name TEXT,
  issued_liter REAL,
  meter_reading REAL,
  confirmed INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_issue_date ON fuel_issue_records(date);

CREATE TABLE IF NOT EXISTS equipment_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_name TEXT NOT NULL UNIQUE,
  equipment_group TEXT,
  ownership_type TEXT,
  has_shift_split INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO equipment_master(equipment_name,equipment_group,ownership_type,has_shift_split) VALUES
('XCMG 50 ковш','main','own',1),('LONKING 55 ковш 855','main','own',1),('LONKING 60 ковш 863','main','own',1),('SEM-655D ковш','main','own',1),
('KOMATSU-360 Экскаватор','main','own',0),('HYUNDAI-12-727 Экскаватор','main','own',0),('HYUNDAI-19-112 Экскаватор','main','own',0),('Zoomlion 25 Кран','main','own',0),
('Түлшний машин','support','own',0),('Усны машин','support','own',0),('Бохирын машин','support','own',0),('LC-76','support','own',0),('Toyota Probox','support','own',0),('Hyundai Porter','support','own',0),
('85-94 ОРН 60-н хөлт','product_transport_rental','rental',0),('45-08 ӨМЕ 60-н хөлт','product_transport_rental','rental',0),('36-57 ӨМЕ 60-н хөлт','product_transport_rental','rental',0),
('ХОВО 802','sludge_transport_rental','rental',0),('ХОВО 803','sludge_transport_rental','rental',0),('ХОВО 809','sludge_transport_rental','rental',0),('ХОВО 810','sludge_transport_rental','rental',0),
('00-96 ММА','sludge_transport_rental','rental',0),('51-38 УКМ','sludge_transport_rental','rental',0),('08-49 УНН','sludge_transport_rental','rental',0),('08-46 УНН','sludge_transport_rental','rental',0),
('18-58 ТТА (834)','sludge_transport_rental','rental',0),('98-00 ТТА (835)','sludge_transport_rental','rental',0),('82-09 ӨМҮ (836)','sludge_transport_rental','rental',0),('Дозер','sludge_transport_rental','rental',0);

CREATE TABLE IF NOT EXISTS equipment_daily_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  equipment_group TEXT,
  ownership_type TEXT,
  shift TEXT DEFAULT 'full_day',
  status TEXT NOT NULL,
  status_text TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_date ON equipment_daily_status(date, status);

CREATE TABLE IF NOT EXISTS camp_daily_records (
  date TEXT PRIMARY KEY,
  mongolian_count INTEGER,
  chinese_count INTEGER,
  total_people INTEGER,
  guard_count INTEGER,
  guest_count INTEGER,
  outside_meal_count INTEGER,
  contractor_count INTEGER,
  camp_staff_count INTEGER,
  cook_count INTEGER,
  cleaner_count INTEGER,
  laundry_count INTEGER,
  household_count INTEGER,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safety_daily_records (
  date TEXT PRIMARY KEY,
  medical_aid INTEGER,
  hse_violation INTEGER,
  day_temp_c REAL,
  night_temp_c REAL,
  humidity_pct REAL,
  wind_speed_ms REAL,
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operation_issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  department TEXT DEFAULT 'production',
  issue_text TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  responsible_person TEXT,
  action_taken TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_issues_date ON operation_issues(date, status);

CREATE TABLE IF NOT EXISTS monthly_actuals (
  month TEXT PRIMARY KEY,
  shlam_ton REAL,
  waste_ton REAL,
  clean_coal_ton REAL,
  machine_fuel_liter REAL,
  generator_fuel_liter REAL,
  rental_transport_mnt REAL,
  source_note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cost_parameters (
  month TEXT PRIMARY KEY,
  fuel_price_mnt_l REAL DEFAULT 4250,
  depreciation_per_vehicle_mnt REAL DEFAULT 1500000,
  own_vehicle_count INTEGER DEFAULT 4,
  usd_mnt REAL DEFAULT 3576,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR REPLACE INTO monthly_actuals(month,shlam_ton,waste_ton,clean_coal_ton,machine_fuel_liter,generator_fuel_liter,rental_transport_mnt,source_note) VALUES
('2025-03',1300,14350,9740,82305,5937,38723000,'Historical seed'),
('2025-04',41292,21234,10906,84711,5611,182855000,'Historical seed'),
('2025-05',52804,20979,14593,57619,7885,183775200,'Historical seed'),
('2025-06',25630,43904,14690,36798,6729,230151676,'Historical seed'),
('2025-07',32140,26058,12688,41906,7860,191816000,'Historical seed'),
('2025-08',52417,24983,15295,42008,5933,172326000,'Historical seed'),
('2025-09',65006,29455,15100,57936,7657,204207000,'Historical seed'),
('2025-10',33824,19092,17500,46541,7819,143744000,'Historical seed'),
('2025-11',49964,11352,16990,23316,6551,162761000,'Historical seed'),
('2026-03',29713,65403,8133,43924,3087,166087518,'Historical seed'),
('2026-04',24939,53707,9250,50173,11201,129724938,'Historical seed'),
('2026-05',12513,52460,9975,46265,11444,NULL,'2026-05 incomplete; rental transport missing');

INSERT OR IGNORE INTO cost_parameters(month,fuel_price_mnt_l,depreciation_per_vehicle_mnt,own_vehicle_count,usd_mnt)
SELECT month,4250,1500000,4,3576 FROM monthly_actuals;

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO app_config(key,value) VALUES
('system_version','V2'),
('company_name','Говь Ресурс Девелопмент ХХК'),
('summary_selection_note','Executive Summary KPI-г дараа сонгоно.');
