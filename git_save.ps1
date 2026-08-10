# =====================================================================
# GRD Dashboard — хийсэн ажлаа GitHub руу хадгалах
# Хэрэглээ:   .\git_save.ps1 "Юу өөрчилснөө товч бичнэ"
#             .\git_save.ps1            (тайлбарыг дараа нь асууна)
#
# Энэ скрипт юу хийдэг вэ:
#   1. Commit хийж буй хүнийг git-д танилцуулна (анх удаа л хэрэгтэй)
#   2. Түр зуурын mockup файлуудыг git-ийн хяналтаас гаргана
#      (хавтаснаас УСТГАХГҮЙ, зөвхөн GitHub руу илгээхээ болино)
#   3. Бүх өөрчлөлтийг commit хийж, GitHub руу push хийнэ
# =====================================================================
param([string]$Message = "")

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = Read-Host "Ямар өөрчлөлт орсныг товч бичнэ үү"
}
if ([string]::IsNullOrWhiteSpace($Message)) {
  Write-Host "Тайлбар хоосон байна - зогслоо." -ForegroundColor Red
  exit 1
}

# --- 1. Хэн commit хийж байгаа вэ ---------------------------------------
$gitName  = (git config user.name)  2>$null
$gitEmail = (git config user.email) 2>$null
if (-not $gitName)  { git config user.name  "GRD"; Write-Host "git user.name  = GRD" -ForegroundColor DarkGray }
if (-not $gitEmail) { git config user.email "gobiresource@gmail.com"; Write-Host "git user.email = gobiresource@gmail.com" -ForegroundColor DarkGray }

# --- 2. Өмнө нь орчихсон түр файлуудыг хяналтаас гаргах ------------------
foreach ($f in @("_mockup_v1.html", "_mockup_v2.html")) {
  git rm --cached --quiet --ignore-unmatch $f
}

# --- 3. Өөрчлөлтүүдийг бүртгэх ------------------------------------------
git add -A

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host ""
  Write-Host "Шинэ өөрчлөлт алга - бүх зүйл аль хэдийн хадгалагдсан байна." -ForegroundColor Yellow
  exit 0
}

Write-Host ""
Write-Host "GitHub руу хадгалагдах файлууд:" -ForegroundColor Cyan
$staged | ForEach-Object { Write-Host "   $_" }
Write-Host ""

git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  Write-Host "Commit амжилтгүй боллоо - дээрх мессежийг шалгана уу." -ForegroundColor Red
  exit 1
}

# --- 4. GitHub руу илгээх ------------------------------------------------
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "PUSH АМЖИЛТГҮЙ - GitHub-д нэвтрэх шаардлагатай байж магадгүй." -ForegroundColor Red
  Write-Host "Commit нь компьютер дээр чинь хадгалагдсан, зөвхөн GitHub руу гараагүй." -ForegroundColor Yellow
  Write-Host "Нэвтрээд дахин  git push origin main  гэж бичвэл хангалттай." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Хадгаллаа -> https://github.com/Gobiresource/Report" -ForegroundColor Green
