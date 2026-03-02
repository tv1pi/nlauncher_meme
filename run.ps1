# Run memesite (install deps if needed, then start server)
$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
}
Write-Host "Starting memesite..."
npm start
