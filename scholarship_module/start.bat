@echo off
echo ================================
echo Scholarship Verification Module
echo ================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo Starting Backend Server...
echo.

cd backend

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -r requirements.txt --quiet

echo.
echo ================================
echo Server starting on port 8001
echo ================================
echo.
echo Open the following in your browser:
echo   - API Docs: http://localhost:8001/docs
echo   - Frontend: ..\frontend\index.html
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
python main.py
