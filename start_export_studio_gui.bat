@echo off
setlocal
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo ===========================================
echo   Bandofy Export Studio - One Click GUI
echo ===========================================

where python >nul 2>&1
if %ERRORLEVEL%==0 (
    set "PYTHON=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL%==0 (
        set "PYTHON=py -3"
    ) else (
        echo Python 3 was not found. Please install it from https://www.python.org/downloads/ and rerun this file.
        pause
        exit /b 1
    )
)

if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment (.venv)...
    %PYTHON% -m venv .venv
)

call ".venv\Scripts\activate.bat"

echo Installing requirements (this is quick; stdlib only)...
pip install -r requirements.txt

echo Launching Bandofy Export Studio GUI...
python -m bandofy_export_studio gui

echo.
echo Close this window after you exit the app.
pause
