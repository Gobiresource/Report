# GRD V2 — Login + Permission Flow

Энэ хувилбарт нүүр хуудас нь нэвтрэх хуудас болсон. Dashboard болон Report хэсэг тусдаа.

## Гол өөрчлөлт

- `index.html` — нэвтрэх нүүр хэсэг
- `dashboard.html` — удирдлага сараа сонгож module руу орно
- `report.html` — ажилтан нэвтэрсний дараа зөвхөн эрхтэй тайлангийн хэсэг харагдана
- `admin.html` — дараагийн шатны placeholder
- `Сарын өртөг / Historical` dashboard menu-ээс хасагдсан
- `Пүүний мэдээлэл` Тээвэр module дотор орсон
- Үйлдвэрлэл / Лаб хэсэг эхний ээлжинд Монгол label-тэй

## Default хэрэглэгчид

| Нэвтрэх нэр | PIN | Эрх |
|---|---:|---|
| admin | 9999 | Dashboard / бүх эрх |
| uildverlel | 1111 | Үйлдвэрлэл / Лаб |
| teever | 2222 | Тээвэр |
| tulsh | 3333 | Түлш |
| technik | 4444 | Техник |
| camp | 5555 | Кемп |
| hse | 6666 | ХАБЭА |
| asuudal | 7777 | Асуудал |

## GitHub root бүтэц

```
index.html
dashboard.html
report.html
admin.html
style.css
app.js
schema.sql
wrangler.toml
README_MN.md
functions/api/[[path]].js
```

## Cloudflare

1. GitHub repo дээрх файлуудыг overwrite хийж upload хийнэ.
2. Cloudflare Pages deploy success болтол хүлээнэ.
3. D1 binding: `DB` → `govi_dashboard`.
4. `schema.sql`-г D1 Console дээр ажиллуулна.
5. `/api/options` шалгана.
6. `/report.html` дээр default хэрэглэгчээр test хийнэ.

## Анхаар

Одоогийн PIN нь MVP зориулалттай энгийн хадгалалт. Бодит production-д hash/password reset хийх admin module дараагийн шатанд нэмнэ.
