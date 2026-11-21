@echo off
cd /d "%~dp0"
title Shasthyo Sheba (Production Fast Mode)
powershell -NoProfile -Command "if (-not ((Test-NetConnection 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded -or (Test-NetConnection 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue).TcpTestSucceeded)) { exit 1 }"
if errorlevel 1 (
  echo PostgreSQL is not running. Start the postgresql service in services.msc, then run this again.
  pause
  exit /b 1
)

if not exist ".next\BUILD_ID" (
  echo Production build not found. Building Shasthyo Sheba once...
  call npm.cmd run build
  if errorlevel 1 (
    echo [ERROR] npm run build failed.
    pause
    exit /b 1
  )
)

start "" /min cmd /c "ping -n 4 127.0.0.1 >nul & start http://localhost:3000"
call npm.cmd run start
