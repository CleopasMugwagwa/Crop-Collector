@echo off
setlocal

set "PYTHON_EXE=C:\Program Files\PostgreSQL\17\pgAdmin 4\python\python.exe"

if not exist "%PYTHON_EXE%" (
  echo Python was not found at:
  echo %PYTHON_EXE%
  echo.
  echo Install Python or update PYTHON_EXE inside this file.
  pause
  exit /b 1
)

echo Starting Crop Collector frontend on http://0.0.0.0:5500
"%PYTHON_EXE%" -m http.server 5500 --bind 0.0.0.0
