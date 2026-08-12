# =====================================================================
# GRD Dashboard — ТУРШИЛТЫН deploy (production-д огт нөлөөлөхгүй)
# Хэрэглээ:   .\deploy_preview.ps1
# Үр дүн: preview.report-d3e.pages.dev маягийн тусдаа URL гарна.
# Бодит сайт (report-d3e.pages.dev) өөрчлөгдөхгүй.
# Батлагдсаны дараа л .\deploy.ps1 ажиллуулж production руу гаргана.
# =====================================================================
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Remove-Item dist -Recurse -Force -ErrorAction Ignore
New-Item dist -ItemType Directory | Out-Null
Copy-Item index.html, dashboard.html, report.html, admin.html, meeting.html, app.js, style.css, logo.png, favicon.png dist\
# Тээврийн төрлийн SVG дүрсүүд — картын legend-д хэрэглэгддэг тул заавал орно
Copy-Item transport-icons dist\ -Recurse

npx wrangler pages deploy dist --project-name report --branch preview --commit-dirty=true

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "PREVIEW DEPLOY БҮТЭЛГҮЙТЛЭЭ - wrangler алдаа буцаалаа." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Preview OK -> дээр хэвлэгдсэн URL-ээр орж шалгана" -ForegroundColor Yellow
Write-Host "(Хэрэв API алдаа гарвал: Cloudflare -> report -> Settings -> Bindings" -ForegroundColor Yellow
Write-Host " дээр DB binding-ийг Preview орчинд бас нэмэх шаардлагатай.)" -ForegroundColor Yellow
