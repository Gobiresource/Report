# CLAUDE.md — GRD Dashboard төслийн контекст (Cowork-д зориулсан гардуулга)

Энэ хавтас бол Говь Ресурс Девелопмент ХХК (нүүрс угаах үйлдвэр)-ийн өдөр тутмын
үйл ажиллагааны тайлангийн web dashboard. Claude chat дээр хөгжүүлж ирсэн,
одоо дизайны давталтыг Cowork-т үргэлжлүүлж байна.

## Систем юу хийдэг вэ
- Ажилтан нэвтрээд зөвхөн өөрийн эрхтэй тайлангийн form бөглөнө (7 модуль:
  Үйлдвэрлэл/Лаб, Тээвэр, Түлш, Техник, Кемп/хүн хүч, ХАБЭА, Асуудал).
- Захирал/бүх нэвтэрсэн хэрэглэгч Хяналтын самбар (dashboard.html) дээр өдрийн
  болон сарын нэгтгэлийг харна.
- Ганц login (index.html), role-оор чиглүүлнэ: worker → report.html,
  admin/viewer → dashboard.html.

## Технологи ба deploy
- Cloudflare Pages + Pages Functions + D1 SQLite. Frontend нь vanilla JS
  (framework байхгүй), нэг app.js, нэг style.css.
- GitHub repo: Gobiresource/Report (private байх ёстой). main руу push хийхэд
  Cloudflare автоматаар deploy хийнэ. Сайт: https://report-d3e.pages.dev
- wrangler.toml-ийг repo-д БАЙЛГАХГҮЙ (deploy унагадаг байсан). D1 binding нь
  Cloudflare dashboard дээр: DB → govi_dashboard.
- schema.sql-ийг production D1 дээр ДАХИН АЖИЛЛУУЛАХГҮЙ (DROP TABLE-тай).
  Нэмэлт өөрчлөлтөд migration_*.sql маягийн тусдаа файл бичиж D1 Console-оор
  гараар оруулдаг журамтай.
- Тест хэрэглэгчид: admin/9999, teever/2222, tulsh/3333, uildverlel/1111,
  technik/4444, camp/5555, hse/6666, asuudal/7777. (PIN-үүд plain text —
  мэддэг асуудал, дараагийн шатны ажил.)

## Дизайны систем (style.css)
- Концепц: Apple glassmorphism + компанийн брэнд улаан #BC2029 (logo.png-ээс
  дээжилсэн). Амбиент өнгөт дэвсгэр дээр frosted glass самбарууд (.bezel).
- Фонт: -apple-system / SF Pro, fallback Inter. Тоонд tabular-nums.
- Модуль бүр өөрийн өнгө: production цэнхэр, transport улбар шар, fuel индиго,
  equipment teal, camp ногоон, hse ягаан, issue саарал (CSS var --c-*).
- Өмчлөлийн өнгө: own ногоон, rental_product улбар шар, rental_sludge индиго.
- График бүгд гар бичмэл SVG (сан ашигладаггүй): UI.gaugeHtml, UI.donutHtml,
  UI.waveChartHtml, UI.barListHtml (app.js-ийн UI модульд).

## Хэрэглэгчийн (захиалагчийн) дизайны шаардлага, дуртай/дургүй
- Apple style, glassmorphism таалагддаг. Хэт хар, хэт "уйтгартай" цагаан аль
  аль нь таалагдаагүй түүхтэй.
- Лавлагаа болгож өгсөн UI: том featured карт + trend chip (▲/▼ өчигдрөөс) +
  карт доторх мини графикууд + donut badge-тэй + gauge + gradient wave line.
  Гэхдээ "яг хуулж болохгүй, манай хэв маягаар" гэсэн.
- Багтахгүй таслагдсан текстэд маш дургүй (fmtShort-оор товчилдог болсон).
- Сүүлийн гомдол: графикуудыг жижиг картанд шахсан нь "царай муутай" — V13
  дээр gauge/donut картуудыг 2 багана болгож зассан ч ХАРААХАН БАТЛАГДААГҮЙ.
  Эхний ажил: сайтыг нээж хараад давчуу/тэгш бус хэсгийг олж засах.

## Cowork-ийн ажлын урсгал
1. Claude in Chrome connector-оор https://report-d3e.pages.dev нээж,
   admin/9999-өөр нэвтэрч dashboard-ыг НҮДЭЭРЭЭ хар.
2. Дизайны асуудлыг оношил, энэ хавтас доторх style.css / app.js-д засвар хий.
3. node --check app.js ажиллуулж syntax шалга.
4. Хэрэглэгчид өөрчлөлтийг тайлбарлаад, зөвшөөрснөөр git commit + push
   (эсвэл хэрэглэгч GitHub web-ээр гараар оруулна).
5. Deploy дууссаны дараа сайтыг дахин хараад үр дүнг баталгаажуул.

## Файлын бүтэц
- index.html / dashboard.html / report.html / admin.html
- app.js — CONFIG (тайлангийн төрөл, form, KPI, график data) / SESSION / API /
  UI (туслах + график) / PageLogin / PageDashboard / PageReport
- style.css — дизайны систем бүхэлдээ
- functions/api/[[path]].js — бүх backend (login, submit, daily, monthly,
  vehicles CRUD, plan get/save)
- schema.sql, migration_vehicles.sql, migration_plans.sql
- logo.png, favicon.png

## Одоогийн төлөв (V13)
Ажиллаж байгаа: нэвтрэлт, 7 form (тээвэр/түлш нь 36 машины 3 баганат
хүснэгттэй), машины бүртгэл CRUD, өдрийн summary (gauge + donut + мини bar +
trend chip), сарын нэгтгэл + төлөвлөгөө/гүйцэтгэл % + машин бүрийн л/тонн +
wave графикууд. Тест: test_backend.cjs (D1-ийг node:sqlite-ээр дуурайлгадаг).
