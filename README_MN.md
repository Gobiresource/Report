# GRD Dashboard V2

Энэ хувилбар нь static monthly HTML биш. Cloudflare Pages Functions + D1 дээр ажиллах V2 MVP.

## Гол зарчим

- Кемп менежер бүх тайланг гараар нэгтгэхгүй.
- Хэлтэс бүр өөрийн form дээр дата оруулна.
- Dashboard module бүрээс автоматаар нэгтгэнэ.
- Executive Summary дээр аль KPI гарахыг дараа сонгоно.
- Пүүний мэдээлэл тусдаа module биш, `Тээвэр` module дотор орсон.
- Зураг хадгалахгүй. Ажилчид зургаа өөрсдөө хадгална. Түлш олголтын мэдээллийг form-оор оруулна.

## Файлын бүтэц

```text
/index.html                  Dashboard
/report.html                 Тайлан илгээх form
/admin.html                  Сарын өртөг / historical actual
/style.css
/app.js
/schema.sql                  D1 database schema + seed data
/wrangler.toml               Pages + D1 binding
/functions/api/[[path]].js   API routes
```

## D1 setup

1. Cloudflare дээр D1 database: `govi_dashboard`
2. Pages project дээр D1 binding нэмнэ:

```text
Variable name: DB
D1 database: govi_dashboard
```

3. `schema.sql`-ийг D1 Console дээр ажиллуулна.

4. `wrangler.toml` дотор database_id оруулсан:

```text
d73e33b3-2b29-4d7b-84a0-520438d97c6b
```

Хэрэв D1 database өөр ID-тай бол энэ ID-г солино.

## Default PIN

```text
Үйлдвэрлэл / Лаборатори: 1111
Тээвэр: 2222
Түлш: 3333
Техник: 4444
Кемп: 5555
ХАБЭА: 6666
Үйлдвэрийн асуудал: 7777
Admin: 9999
```

Эдгээрийг production-д оруулахын өмнө заавал солино.

## Module бүтэц

### 1. Үйлдвэрлэл / Лаборатори

- Өдрийн ээлж / 白班
- Шөнийн ээлж / 夜班
- Тоолуур / 电表
- Бүтээгдэхүүн / 精煤吨数
- Мидлинг / 中煤
- Түлш / 柴油
- Лаборатори: 螺精Ad, 浮煤Ad, 粘结G

Tables:

```text
production_shift_records
lab_quality_samples
```

### 2. Тээвэр

- Шлам
- Хаягдал
- Богино дотор рейс
- Бүтээгдэхүүн тээвэр
- Пүүний мэдээлэл

Tables:

```text
transport_truck_records
transport_weighbridge_records
```

Validation:

```text
gross_weight_kg > tare_weight_kg бол net тооцно.
gross байхгүй бол net тооцохгүй.
```

### 3. Түлш

- Нэгтгэл түлш
- Түлшний машин / Заправщик
- Нөөцийн сав
- Техник тус бүрийн түлш
- Түлш олголтын бүртгэл / путёвк

Tables:

```text
fuel_storage_movements
fuel_equipment_records
fuel_issue_records
```

### 4. Техник

- Үндсэн техник
- Бүтээгдэхүүн тээврийн түрээс
- Шлам тээврийн түрээс
- Ажилласан / засварт / парк
- Өдөр / шөнө ээлжтэй техник

Tables:

```text
equipment_master
equipment_daily_status
```

### 5. Кемп / хүн хүч

Кемп менежер зөвхөн өөрийн хэсгийг бөглөнө.

Table:

```text
camp_daily_records
```

### 6. ХАБЭА

Table:

```text
safety_daily_records
```

### 7. Үйлдвэрийн асуудал

Table:

```text
operation_issues
```

### 8. Сарын өртөг

Cost formula:

```text
Cost A = (machine_fuel_liter * fuel_price + rental_transport + depreciation) / clean_coal_ton
Cost B = ((machine_fuel_liter + generator_fuel_liter) * fuel_price + rental_transport + depreciation) / clean_coal_ton
```

Tables:

```text
monthly_actuals
cost_parameters
```

## API endpoints

```text
GET  /api/daily-summary?date=YYYY-MM-DD
GET  /api/monthly-summary?month=YYYY-MM
GET  /api/options
POST /api/submit
POST /api/admin/monthly-actual
```

## GitHub upload

GitHub repository root дээр дараах байдлаар upload хийнэ:

```text
index.html
report.html
admin.html
style.css
app.js
schema.sql
wrangler.toml
functions/api/[[path]].js
README_MN.md
```

ZIP-ийг шууд repo руу upload хийхгүй. ZIP-ийг задлаад доторх файлуудыг upload хийнэ.
