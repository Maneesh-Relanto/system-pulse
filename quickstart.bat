@echo off
REM Quick Start Script for System Pulse on Windows

echo ======================================
echo System Pulse - Quick Start
echo ======================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X Python not found. Please install Python 3.8+
    exit /b 1
)

echo + Python found
echo.

REM Check if pip is installed
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo X pip not found. Please install pip
    exit /b 1
)

echo + pip found
echo.

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo X Failed to install dependencies
    exit /b 1
)

echo + Dependencies installed
echo.

REM Initialize logos
echo Downloading and caching app logos (this may take a minute)...
python init_logos.py

if %errorlevel% neq 0 (
    echo ! Warning: Logo initialization had issues
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Start the server with:
echo   python -m uvicorn main:app --reload
echo.
echo Then open your browser to:
echo   http://localhost:8000
echo.
echo ======================================
echo.
pause
