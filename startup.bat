@echo off
REM Vera ML System Startup Script for Windows

color 0A
echo.
echo ==================================================
echo    Vera - Plant Health Analysis with YOLOv8
echo ==================================================
echo.

setlocal enabledelayedexpansion

REM Check Python
echo [*] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [!] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
echo [OK] Python found

REM Check Node
echo [*] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [!] Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Start ML Service
echo.
echo ==================================================
echo    Step 1: Starting ML Service (Python)
echo ==================================================
cd /d "%~dp0ml_service"

if not exist "venv" (
    echo [*] Creating Python virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat
echo [*] Installing ML dependencies...
pip install -q -r requirements.txt

echo [*] Starting FastAPI server on http://localhost:8000
start "Vera ML Service" cmd /k "python main.py"
timeout /t 3 /nobreak

REM Verify ML Service
echo [*] Verifying ML Service...
for /l %%i in (1,1,5) do (
    curl -s http://localhost:8000/health >nul 2>&1
    if not errorlevel 1 (
        echo [OK] ML Service is running!
        goto ml_ok
    )
    timeout /t 1 /nobreak
)
echo [!] Warning: ML Service may not be responding
:ml_ok

REM Start Backend
echo.
echo ==================================================
echo    Step 2: Starting Backend (Node.js)
echo ==================================================
cd /d "%~dp0backend"

if not exist ".env" (
    echo [!] .env file not found!
    echo [*] Creating sample .env...
    (
        echo MONGODB_URI=mongodb://localhost:27017/vera
        echo DB_NAME=vera
        echo JWT_SECRET=your_secret_key_here
        echo JWT_EXPIRE=7d
        echo PORT=5000
        echo NODE_ENV=development
        echo ML_SERVICE_URL=http://localhost:8000
        echo CORS_ORIGIN=http://localhost:5173
    ) > .env.sample
    echo [*] Please update .env with your settings
    pause
)

if not exist "node_modules" (
    echo [*] Installing backend dependencies...
    call npm install -q
)

echo [*] Starting Backend server on http://localhost:5000
start "Vera Backend" cmd /k "npm start"
timeout /t 3 /nobreak

REM Start Frontend
echo.
echo ==================================================
echo    Step 3: Starting Frontend (React + Vite)
echo ==================================================
cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [*] Installing frontend dependencies...
    call npm install -q
)

echo [*] Starting Frontend dev server on http://localhost:5173
start "Vera Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak

REM Summary
echo.
echo ==================================================
echo    All Services Started!
echo ==================================================
echo.
echo [INFO] Service URLs:
echo   - ML Service:  http://localhost:8000
echo   - Backend:     http://localhost:5000
echo   - Frontend:    http://localhost:5173
echo.
echo [*] Check the opened windows for any errors
echo [*] Press any key to open the frontend...
pause

start http://localhost:5173

echo.
echo [*] All services are running!
echo [*] Close any window to stop that service
echo.

pause
