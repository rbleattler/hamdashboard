<#
.SYNOPSIS
    Starts the HAM Radio Dashboard.

.DESCRIPTION
    This script checks for Node.js, installs project dependencies if needed,
    starts the Vite development server, and opens the dashboard in your browser.

.PARAMETER Port
    Port number for the dev server. Default: 5173

.PARAMETER NoBrowser
    If specified, the browser will not be opened automatically.

.PARAMETER ExposeHost
    If specified, allows access from other devices on your network.

.EXAMPLE
    .\start.ps1
    # Starts the dashboard with default settings

.EXAMPLE
    .\start.ps1 -Port 8080
    # Starts the dashboard on port 8080

.EXAMPLE
    .\start.ps1 -NoBrowser -ExposeHost
    # Starts without opening browser, accessible from network
#>

param(
    [int]$Port = 5173,
    [switch]$NoBrowser,
    [switch]$ExposeHost
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  HAM Radio Dashboard Launcher" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------
# 1. Check for Node.js
# ------------------------------------------------------------------
Write-Host "Checking for Node.js..." -ForegroundColor Yellow

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host ""
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download and install Node.js from:" -ForegroundColor White
    Write-Host "  https://nodejs.org/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Choose the LTS (Long Term Support) version." -ForegroundColor White
    Write-Host "After installing, close this window and try again." -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = & node --version 2>&1
Write-Host "  Found Node.js $nodeVersion" -ForegroundColor Green

# Check minimum version (v18+)
$versionNumber = $nodeVersion -replace '^v', ''
$majorVersion = 0
$parsedOk = [int]::TryParse($versionNumber.Split('.')[0], [ref]$majorVersion)
if ($parsedOk -and $majorVersion -lt 18) {
    Write-Host ""
    Write-Host "WARNING: Node.js version 18 or newer is recommended." -ForegroundColor Yellow
    Write-Host "  You have $nodeVersion. Some features may not work." -ForegroundColor Yellow
    Write-Host "  Download the latest from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
}

# Check npm
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Host ""
    Write-Host "ERROR: npm is not available!" -ForegroundColor Red
    Write-Host "npm should be included with Node.js. Try reinstalling Node.js from:" -ForegroundColor White
    Write-Host "  https://nodejs.org/" -ForegroundColor Green
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$npmVersion = & npm --version 2>&1
Write-Host "  Found npm v$npmVersion" -ForegroundColor Green

# ------------------------------------------------------------------
# 2. Navigate to project directory
# ------------------------------------------------------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# ------------------------------------------------------------------
# 3. Install dependencies if needed
# ------------------------------------------------------------------
if (-not (Test-Path "node_modules")) {
    Write-Host ""
    Write-Host "Installing dependencies (first run)..." -ForegroundColor Yellow
    Write-Host "  This may take a minute or two." -ForegroundColor Gray
    Write-Host ""
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to install dependencies." -ForegroundColor Red
        Write-Host "Check your internet connection and try again." -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host ""
    Write-Host "  Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "  Dependencies already installed." -ForegroundColor Green
}

# ------------------------------------------------------------------
# 4. Build the Vite dev server command
# ------------------------------------------------------------------
$viteArgs = @("run", "dev", "--", "--port", $Port.ToString())

if ($ExposeHost) {
    $viteArgs += "--host"
}

# ------------------------------------------------------------------
# 5. Open the browser (unless -NoBrowser is set)
# ------------------------------------------------------------------
if (-not $NoBrowser) {
    $url = "http://localhost:$Port"

    # Start a background job to open the browser after a short delay
    # so the server has time to start up
    Start-Job -ScriptBlock {
        param($url)
        Start-Sleep -Seconds 3
        Start-Process $url
    } -ArgumentList $url | Out-Null

    Write-Host ""
    Write-Host "  Opening browser to $url ..." -ForegroundColor Cyan
}

# ------------------------------------------------------------------
# 6. Start the dev server
# ------------------------------------------------------------------
Write-Host ""
Write-Host "Starting HAM Radio Dashboard..." -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

& npm @viteArgs
