@echo off
setlocal enabledelayedexpansion
title Phantom City Atlas

echo.
echo  =========================================
echo   Phantom City Atlas  -  Starting...
echo  =========================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo  [Setup] Installing dependencies...
    call npm install
    echo.
)

set PORT=5173
netstat -ano | findstr ":5173 " > nul 2>&1
if !errorlevel! == 0 (
    set PORT=5174
    netstat -ano | findstr ":5174 " > nul 2>&1
    if !errorlevel! == 0 (
        set PORT=5175
    )
)

echo  [Launch] http://localhost:!PORT!
echo  [Note]   Close this window to stop the server.
echo.

start "" cmd /c "timeout /t 3 /nobreak > nul && start http://localhost:!PORT!"

npx vite --port !PORT!

pause
