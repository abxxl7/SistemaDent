@echo off
setlocal enabledelayedexpansion
title SistemaDent V2 - Detener Sistema

echo ============================================
echo   SistemaDent V2 - Deteniendo sistema
echo ============================================
echo.

set "DETUVO_ALGO=0"

echo Deteniendo Backend (puerto 8001)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
    set "DETUVO_ALGO=1"
)

echo Deteniendo Frontend (puerto 5174)...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5174" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
    set "DETUVO_ALGO=1"
)

echo.
if "!DETUVO_ALGO!"=="1" (
    echo Sistema detenido correctamente.
) else (
    echo No se encontro ningun proceso corriendo en los puertos 8001 o 5174.
)
echo.
pause
endlocal
