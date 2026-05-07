@echo off
setlocal

set "LOCAL=%~dp0"
set "ROOT=%~dp0.."

echo.
echo  Anubis V2 - Local Dev
echo  ----------------------

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

REM Check master key file
if not exist "%LOCAL%.env" (
    echo  [ERROR] local\.env not found.
    echo         Fill in your keys there — run-local.bat will handle the rest.
    pause
    exit /b 1
)

REM Copy master .env to backend and frontend
echo  [INFO] Syncing keys from local\.env ...
copy /Y "%LOCAL%.env" "%ROOT%\backend\.env" >nul
copy /Y "%LOCAL%.env" "%ROOT%\frontend\.env.local" >nul
echo  [INFO] backend\.env and frontend\.env.local updated.

REM Install if node_modules missing
if not exist "%ROOT%\node_modules" (
    echo  [INFO] Installing root dependencies...
    call npm install --prefix "%ROOT%"
)
if not exist "%ROOT%\backend\node_modules" (
    echo  [INFO] Installing backend dependencies...
    call npm install --prefix "%ROOT%\backend"
)
if not exist "%ROOT%\frontend\node_modules" (
    echo  [INFO] Installing frontend dependencies...
    call npm install --prefix "%ROOT%\frontend"
)

echo.
echo  Starting backend  (http://localhost:5000)
echo  Starting frontend (http://localhost:3000)
echo  Press Ctrl+C to stop both.
echo.

cd /d "%ROOT%"
npm run dev

endlocal
