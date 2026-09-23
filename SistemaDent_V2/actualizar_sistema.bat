@echo off
title SistemaDent V2 - Actualizar Sistema

echo ============================================
echo   SistemaDent V2 - Actualizando sistema
echo ============================================
echo.
echo IMPORTANTE: cerra el Backend y el Frontend antes de continuar
echo (podes usar detener_sistema.bat) para evitar conflictos de archivos.
echo.
pause

set "BASE_DIR=%~dp0"

echo.
echo [1/4] Descargando ultimos cambios (git pull)...
pushd "%BASE_DIR%.."
git pull
if errorlevel 1 (
    echo.
    echo ERROR: fallo git pull. Revisa conflictos o cambios locales sin commitear.
    popd
    pause
    exit /b 1
)
popd

echo.
echo [2/4] Actualizando dependencias del Backend...
pushd "%BASE_DIR%Backend"
call venv\Scripts\activate
call pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: fallo la instalacion de dependencias del Backend.
    popd
    pause
    exit /b 1
)

echo.
echo [3/4] Aplicando migraciones de base de datos (alembic upgrade head)...
call alembic upgrade head
if errorlevel 1 (
    echo ERROR: fallo alembic upgrade head. Revisa la conexion a la base de datos.
    popd
    pause
    exit /b 1
)
popd

echo.
echo [4/4] Actualizando dependencias del Frontend...
pushd "%BASE_DIR%Frontend"
call npm install
if errorlevel 1 (
    echo ERROR: fallo npm install en el Frontend.
    popd
    pause
    exit /b 1
)
popd

echo.
echo ============================================
echo   Actualizacion completa.
echo   Ahora podes ejecutar iniciar_sistema.bat
echo ============================================
echo.
pause
