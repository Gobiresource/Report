# =====================================================================
# GRD Dashboard — Cloudflare Pages руу terminal-аас шууд deploy хийх
# Хэрэглээ:   .\deploy.ps1
# Нэг удаагийн бэлтгэл:
#   npm install -g wrangler
#   wrangler login          (browser нээгдэж Cloudflare-д нэвтэрнэ)
#   npx wrangler pages project list   (project-ийн яг нэрээ шалгана)
# =====================================================================
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# 1. Цэвэр dist хавтас — зөвхөн сайтад хэрэгтэй файлууд.
#    schema.sql, CLAUDE.md, test_backend.cjs, migration_*.sql зэрэг дотоод
#    файлыг ЗОРИУД ОРУУЛАХГҮЙ — эдгээр нь static asset болж нийтэд ил
#    татагддаг байсан (schema.sql дотор PIN-үүд бий!).
Remove-Item dist -Recurse -Force -ErrorAction Ignore
New-Item dist -ItemType Directory | Out-Null
Copy-Item index.html, dashboard.html, report.html, admin.html, meeting.html, app.js, style.css, logo.png, favicon.png dist\
# PWA (2026-08-17): manifest + icon-ууд — эдгээргүйгээр Add to Home Screen ажиллахгүй
Copy-Item manifest.json, icon-192.png, icon-512.png, icon-192-maskable.png, icon-512-maskable.png, apple-touch-icon.png dist\
# Тээврийн төрлийн SVG дүрсүүд — картын legend-д хэрэглэгддэг тул заавал орно
Copy-Item transport-icons dist\ -Recurse

# 2. Deploy. functions/ хавтас нь энэ хавтаснаас (ажиллуулж буй байрлалаас)
#    автоматаар хамт бондлогдож очно — dist руу хуулах шаардлагагүй.
#    --branch main = production deployment.
npx wrangler pages deploy dist --project-name report --branch main --commit-dirty=true

# 3. wrangler амжилтгүй болбол "Deploy OK" гэж ХУДЛАА бичихгүй байх хамгаалалт.
#    $ErrorActionPreference нь .exe-ийн exit code-ыг барьдаггүй тул шууд шалгана.
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "DEPLOY БҮТЭЛГҮЙТЛЭЭ - wrangler алдаа буцаалаа. Дээрх мессежийг шалгана уу." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Deploy OK -> https://report-d3e.pages.dev (1-2 min)" -ForegroundColor Green
