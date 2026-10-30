# 关都旅程 · 插件更新器
#
# 只更新插件代码，不碰媒体、存档和剧情记忆。
# 完整卡片（含 530MB 媒体）只在第一次安装或媒体有更新时才需要。
#
# 用法：
#   双击本文件，或在 PowerShell 里执行：
#     powershell -ExecutionPolicy Bypass -File .\update-plugin.ps1
#
# 可选参数：
#   -DryRun     只检查版本，不下载不覆盖
#   -Force      版本相同时也强制覆盖
#   -BackupDir  备份目录（默认放在插件目录旁边的 _backups）

param(
    [switch]$DryRun,
    [switch]$Force,
    [string]$BackupDir = ""
)

$ErrorActionPreference = 'Stop'
$Repo = 'weixinlll/dshcard-pokemon'
$PluginPrefix = 'card-dsh-card-pokemon-frlg-stage-'

function Write-Step($text) { Write-Host "  $text" }
function Write-Ok($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  [!] $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "  [X] $text" -ForegroundColor Red }

Write-Host ""
Write-Host "关都旅程 · 插件更新器" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor DarkGray

# 1. 找插件目录：DSH 把卡内插件装在 data/plugins/<插件名>-<卡哈希>/
$dataRoot = Join-Path $env:USERPROFILE '.dsh\profile-data\tavern\data'
$pluginRoot = Join-Path $dataRoot 'plugins'
if (-not (Test-Path $pluginRoot)) {
    Write-Fail "找不到 DSH Tavern 数据目录：$pluginRoot"
    Write-Step "请确认 DSH Tavern 已安装并至少启动过一次。"
    exit 1
}

$dirs = @(Get-ChildItem $pluginRoot -Directory | Where-Object { $_.Name.StartsWith($PluginPrefix) })
if ($dirs.Count -eq 0) {
    Write-Fail "没有找到已安装的关都旅程插件。"
    Write-Step "这是第一次安装，请下载完整的 pokemon-frlg-<版本>.dshcard 并导入 DSH Tavern。"
    exit 1
}
if ($dirs.Count -gt 1) {
    Write-Warn "发现 $($dirs.Count) 个插件目录，将更新全部："
    $dirs | ForEach-Object { Write-Step "  $($_.Name)" }
}
$pluginDir = $dirs[0].FullName
Write-Step "插件目录：$pluginDir"

# 2. 本地版本
$localPkg = Join-Path $pluginDir 'package.json'
if (-not (Test-Path $localPkg)) {
    Write-Fail "插件目录里没有 package.json，可能不是关都旅程插件。"
    exit 1
}
$localVersion = (Get-Content $localPkg -Raw -Encoding UTF8 | ConvertFrom-Json).version
Write-Step "本地版本：$localVersion"

# 3. 查最新 Release
Write-Step "查询 GitHub 最新版本…"
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing -Headers @{ 'User-Agent' = 'kanto-plugin-updater' }
} catch {
    Write-Fail "连接 GitHub 失败：$($_.Exception.Message)"
    Write-Step "如果你开了代理，请确认代理可用；也可以手动下载附件更新。"
    exit 1
}
$remoteVersion = $release.tag_name -replace '^v', ''
Write-Step "最新版本：$remoteVersion  ($($release.name))"

if ($remoteVersion -eq $localVersion -and -not $Force) {
    Write-Ok "已经是最新版本，无需更新。"
    exit 0
}

$asset = $release.assets | Where-Object { $_.name -like 'pokemon-kanto-*.zip' } | Select-Object -First 1
if (-not $asset) {
    Write-Fail "这个版本的 Release 没有提供插件更新包（pokemon-kanto-*.zip）。"
    Write-Step "请改为下载完整卡片：$($release.html_url)"
    exit 1
}
Write-Step "更新包：$($asset.name)  ($([math]::Round($asset.size/1MB,1)) MB)"

if ($DryRun) {
    Write-Host ""
    Write-Ok "检查完成（-DryRun 模式，未下载）。"
    exit 0
}

# 4. 检查 DSH 是否在运行：运行中的文件会被锁住
$running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessName -match 'DeepSeek|dsh-desktop' -or
    ($_.Path -and $_.Path -match 'DeepSeek Harness')
})
if ($running.Count -gt 0) {
    Write-Warn "检测到 DSH 正在运行（$($running[0].ProcessName)）。"
    Write-Step "覆盖插件文件前建议先关闭 DSH，否则可能因文件占用失败。"
    $answer = Read-Host "  仍然继续？(y/N)"
    if ($answer -ne 'y') { Write-Step "已取消。"; exit 0 }
}

# 5. 下载
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("kanto-update-" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Path $temp -Force | Out-Null
$zip = Join-Path $temp $asset.name
try {
    Write-Step "下载中…"
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing
    $size = (Get-Item $zip).Length
    if ($size -ne $asset.size) { throw "下载大小不符：$size / $($asset.size)" }
    Write-Ok "下载完成（$([math]::Round($size/1MB,1)) MB）"

    # 6. 解压
    $extract = Join-Path $temp 'extract'
    Expand-Archive -Path $zip -DestinationPath $extract -Force
    $src = Join-Path $extract 'plugins\pokemon-kanto'
    if (-not (Test-Path $src)) { throw "更新包结构异常：找不到 plugins\pokemon-kanto" }
    $newVersion = (Get-Content (Join-Path $src 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
    Write-Step "更新包版本：$newVersion"

    # 7. 备份（保留 .dsh-card.json 与 .tavern-status.json 原样不备份也无妨）
    if (-not $BackupDir) { $BackupDir = Join-Path (Split-Path $pluginRoot -Parent) '_plugin-backups' }
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backup = Join-Path $BackupDir ("card-pokemon-$localVersion-$stamp")
    Copy-Item $pluginDir $backup -Recurse -Force
    Write-Ok "已备份到：$backup"

    # 8. 覆盖：只复制更新包里的文件，不动 .dsh-card.json / .tavern-status.json
    Write-Step "覆盖插件文件…"
    $copied = 0
    Get-ChildItem $src -Recurse -File | ForEach-Object {
        $rel = $_.FullName.Substring($src.Length).TrimStart('\')
        $dest = Join-Path $pluginDir $rel
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Copy-Item $_.FullName $dest -Force
        $copied++
    }
    Write-Ok "已覆盖 $copied 个文件"

    Write-Host ""
    Write-Host "更新完成：$localVersion → $newVersion" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：完全退出并重新启动 DSH，插件才会加载新代码。" -ForegroundColor Yellow
    Write-Host "（刷新页面不够，插件是启动时 import 的。）"
    Write-Host ""
    Write-Host "如果更新后有问题，把备份目录里的文件夹复制回原位即可回滚："
    Write-Host "  $backup"
    Write-Host "  -> $pluginDir"
}
catch {
    Write-Fail "更新失败：$($_.Exception.Message)"
    Write-Step "插件文件未被改动（覆盖前的备份在：$BackupDir）"
    exit 1
}
finally {
    if (Test-Path $temp) { Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue }
}
