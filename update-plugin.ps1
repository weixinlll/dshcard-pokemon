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
#   -DryRun        只检查版本，不下载不覆盖
#   -Force         版本相同时也强制覆盖
#   -Proxy <url>   走指定代理（例如 http://127.0.0.1:7897）；默认直连
#   -BackupDir     备份目录（默认 data/_plugin-backups）

param(
    [switch]$DryRun,
    [switch]$Force,
    [string]$Proxy = "",
    [string]$BackupDir = ""
)

$ErrorActionPreference = 'Stop'
$Repo = 'weixinlll/dshcard-pokemon'
$PluginPrefix = 'card-dsh-card-pokemon-frlg-stage-'
$Curl = Join-Path $env:SystemRoot 'System32\curl.exe'

function Write-Step($text) { Write-Host "  $text" }
function Write-Ok($text) { Write-Host "  [OK] $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "  [!] $text" -ForegroundColor Yellow }
function Write-Fail($text) { Write-Host "  [X] $text" -ForegroundColor Red }

Write-Host ""
Write-Host "关都旅程 · 插件更新器" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor DarkGray

if (-not (Test-Path $Curl)) {
    Write-Fail "找不到 curl.exe（Windows 10 1803 以上自带）。"
    Write-Step "请改为手动下载 Release 里的 pokemon-kanto-*.zip 覆盖插件目录。"
    exit 1
}

# curl 参数：默认直连，避免系统代理失效时误伤
$curlBase = @('-s', '-L', '--max-time', '600', '-H', 'User-Agent: kanto-plugin-updater')
if ($Proxy) {
    $curlBase += @('--proxy', $Proxy)
    Write-Step "使用代理：$Proxy"
}
else {
    $curlBase += @('--noproxy', '*')
}

# 1. 找插件目录
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
    Write-Warn "发现 $($dirs.Count) 个插件目录，将更新全部。"
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

# 3. 查最新版本：读 releases/latest 的 302 重定向，不用 API（免速率限制）
Write-Step "查询 GitHub 最新版本…"
$headers = & $Curl @curlBase '-I' "https://github.com/$Repo/releases/latest"
$location = ($headers -split "`n" | Where-Object { $_ -match '^location:' } | Select-Object -First 1)
if (-not $location) {
    Write-Fail "无法获取最新版本（网络不通，或 GitHub 不可达）。"
    Write-Step "如果网络需要代理，加参数 -Proxy http://127.0.0.1:7897 再试。"
    Write-Step "也可以手动下载 Release 里的 pokemon-kanto-*.zip 覆盖插件目录。"
    exit 1
}
$remoteVersion = ($location -replace '.*?/tag/v?', '').Trim()
if (-not $remoteVersion) {
    Write-Fail "无法解析版本号：$($location.Trim())"
    exit 1
}
Write-Step "最新版本：$remoteVersion"

if ($remoteVersion -eq $localVersion -and -not $Force) {
    Write-Ok "已经是最新版本，无需更新。"
    exit 0
}

$assetName = "pokemon-kanto-$remoteVersion.zip"
$assetUrl = "https://github.com/$Repo/releases/download/v$remoteVersion/$assetName"
$head = & $Curl @curlBase '-I' $assetUrl
if ($LASTEXITCODE -ne 0 -or -not ($head -match 'HTTP/[0-9.]+ 200|HTTP/[0-9.]+ 302')) {
    Write-Fail "这个版本没有发布插件更新包（$assetName）。"
    Write-Step "请改为下载完整卡片：https://github.com/$Repo/releases/tag/v$remoteVersion"
    exit 1
}
Write-Step "更新包：$assetName"
if ($DryRun) {
    Write-Host ""
    Write-Ok "检查完成（-DryRun，未下载）。"
    exit 0
}

# 4. DSH 在运行时文件可能被锁
$running = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {
        $_.ProcessName -match 'DeepSeek|dsh-desktop' -or
        ($_.Path -and $_.Path -match 'DeepSeek Harness')
    })
if ($running.Count -gt 0) {
    Write-Warn "检测到 DSH 正在运行（$($running[0].ProcessName)）。"
    Write-Step "覆盖文件前建议先完全退出 DSH，否则可能因占用失败。"
    $answer = Read-Host "  仍然继续？(y/N)"
    if ($answer -ne 'y') { Write-Step "已取消。"; exit 0 }
}

# 5. 下载
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('kanto-update-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $temp -Force | Out-Null
$zip = Join-Path $temp $assetName
$BackupMade = $null
try {
    Write-Step "下载中…"
    & $Curl @curlBase '-o' $zip $assetUrl
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $zip)) { throw '下载失败' }
    $size = (Get-Item $zip).Length
    if ($size -lt 200000) { throw "下载内容异常：只有 $size 字节" }
    Write-Ok "下载完成（$([math]::Round($size / 1MB, 1)) MB）"

    # 6. 解压
    $extract = Join-Path $temp 'extract'
    Expand-Archive -Path $zip -DestinationPath $extract -Force
    $src = Join-Path $extract 'plugins\pokemon-kanto'
    if (-not (Test-Path $src)) { throw '更新包结构异常：找不到 plugins\pokemon-kanto' }
    $newVersion = (Get-Content (Join-Path $src 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
    Write-Step "更新包版本：$newVersion"

    # 7. 备份
    if (-not $BackupDir) { $BackupDir = Join-Path $dataRoot '_plugin-backups' }
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $BackupMade = Join-Path $BackupDir ("card-pokemon-$localVersion-$stamp")
    Copy-Item $pluginDir $BackupMade -Recurse -Force
    Write-Ok "已备份到：$BackupMade"

    # 8. 覆盖：只写更新包里的文件；.dsh-card.json 与 .tavern-status.json 不在其中，保持原样
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
    Write-Host "（刷新页面不够——插件是启动时 import 的。）"
    Write-Host ""
    Write-Host "出问题要回滚，把这个目录复制回原位即可："
    Write-Host "  $BackupMade"
    Write-Host "  -> $pluginDir"
    Write-Host ""
}
catch {
    Write-Fail "更新失败：$($_.Exception.Message)"
    if ($BackupMade) { Write-Step "插件已备份在：$BackupMade" }
    exit 1
}
finally {
    if (Test-Path $temp) { Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue }
}
