@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Shasthyo Sheba - Setup

echo ==================================================
echo Shasthyo Sheba - One-Time Setup
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Please install Node.js LTS from https://nodejs.org and run setup.bat again.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js found: %NODE_VER%

if not exist ".env" (
  echo.
  echo Creating .env from .env.example and generating AUTH_SECRET...
  node -e "const fs=require('fs'),crypto=require('crypto');let c=fs.readFileSync('.env.example','utf8');c=c.replace('generated-automatically-by-setup',crypto.randomBytes(32).toString('hex'));fs.writeFileSync('.env',c);"
  if errorlevel 1 (
    echo [ERROR] Failed to create .env file.
    pause
    exit /b 1
  )
  echo.
  echo Opening .env in Notepad. Please replace YOUR_PASSWORD with your PostgreSQL password,
  echo save the file, and close Notepad to continue...
  notepad .env
)

echo.
echo [1/4] Installing npm dependencies...
call npm.cmd install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/4] Generating Prisma Client...
call npm.cmd run db:generate
if errorlevel 1 (
  echo [ERROR] npm run db:generate failed.
  pause
  exit /b 1
)

echo.
echo [3/4] Applying database migrations...
call npm.cmd run db:deploy
if errorlevel 1 (
  echo [ERROR] npm run db:deploy failed. Make sure PostgreSQL is running and DATABASE_URL in .env has the right password.
  pause
  exit /b 1
)

echo.
echo [4/4] Seeding database...
call npm.cmd run db:seed
if errorlevel 1 (
  echo [ERROR] npm run db:seed failed.
  pause
  exit /b 1
)

echo.
echo ==================================================
echo Setup complete. Run start.bat.
echo ==================================================
pause
