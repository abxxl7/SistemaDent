@echo off
title SistemaDent V2 - Iniciar Sistema

echo ============================================
echo   SistemaDent V2 - Iniciando sistema
echo ============================================
echo.

set "BASE_DIR=%~dp0"

echo [1/2] Iniciando Backend (puerto 8001)...
start "SistemaDent V2 - Backend" cmd /k "cd /d "%BASE_DIR%Backend" && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8001"

echo [2/2] Iniciando Frontend (puerto 5174)...
start "SistemaDent V2 - Frontend" cmd /k "cd /d "%BASE_DIR%Frontend" && npm run dev"

echo.
echo Backend:  http://localhost:8001
echo Frontend: http://localhost:5174
echo.
echo Ambos servicios se estan iniciando en ventanas separadas.
echo Para detenerlos usa detener_sistema.bat
echo.
pause
