@echo off
REM ==========================================
REM 🔄 SYNC NEON → PostgreSQL LOCAL (Simple)
REM ==========================================
REM Script batch simple para clonar BD de Neon a local
REM Más simple pero menos verbose que PowerShell
REM ==========================================

setlocal enabledelayedexpansion
set NEON_URL=postgresql://neondb_owner:npg_0jAz8lMRXYqW@ep-twilight-flower-ad06bxa9-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require^&channel_binding=require
set LOCAL_DB=bge_local
set LOCAL_USER=postgres
set LOCAL_HOST=localhost
set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set BACKUP_DIR=%cd%\..\..\backups
set BACKUP_FILE=%BACKUP_DIR%\neon_backup_%TIMESTAMP%.dump

echo.
echo ===============================================
echo    SINCRONIZACION NEON to PostgreSQL LOCAL
echo ===============================================
echo.

REM Crear directorio de backups
if not exist "%BACKUP_DIR%" (
    echo [INFO] Creando directorio de backups...
    mkdir "%BACKUP_DIR%"
)

REM Verificar que psql existe
echo [INFO] Verificando PostgreSQL instalado...
where psql >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL no encontrado en PATH
    echo Instala desde: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
echo [SUCCESS] PostgreSQL encontrado

echo.
echo [INFO] Haciendo backup de Neon a: %BACKUP_FILE%
echo [INFO] Esto puede tomar 2-5 minutos...
echo.

REM PASO 1: BACKUP DE NEON
set PGPASSWORD=npg_0jAz8lMRXYqW
pg_dump -h ep-twilight-flower-ad06bxa9-pooler.c-2.us-east-1.aws.neon.tech -U neondb_owner -d neondb --no-password -F custom -f "%BACKUP_FILE%" 2>nul

if errorlevel 1 (
    echo [ERROR] Fallo el backup de Neon
    echo Verifica tu conexion a internet y que Neon este activo
    pause
    exit /b 1
)

if not exist "%BACKUP_FILE%" (
    echo [ERROR] El archivo de backup no se creo
    pause
    exit /b 1
)

echo [SUCCESS] Backup completado

REM PASO 2: ELIMINAR BD LOCAL SI EXISTE
echo.
echo [INFO] Eliminando BD local si existe...
set PGPASSWORD=
psql -h %LOCAL_HOST% -U %LOCAL_USER% -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='%LOCAL_DB%' AND pid != pg_backend_pid();" 2>nul
dropdb -h %LOCAL_HOST% -U %LOCAL_USER% "%LOCAL_DB%" 2>nul
echo [INFO] BD anterior eliminada

REM PASO 3: CREAR BD LOCAL
echo [INFO] Creando BD local '%LOCAL_DB%'...
createdb -h %LOCAL_HOST% -U %LOCAL_USER% -e "%LOCAL_DB%" 2>nul
if errorlevel 1 (
    echo [ERROR] Fallo al crear BD local
    pause
    exit /b 1
)
echo [SUCCESS] BD local creada

REM PASO 4: RESTAURAR DATOS
echo.
echo [INFO] Restaurando datos... (esto puede tomar 2-5 minutos)
pg_restore -h %LOCAL_HOST% -U %LOCAL_USER% -d %LOCAL_DB% --exit-on-error "%BACKUP_FILE%" 2>nul

if errorlevel 1 (
    echo [ERROR] Fallo la restauracion de datos
    echo Verifica que PostgreSQL local este corriendo
    pause
    exit /b 1
)

echo [SUCCESS] Datos restaurados

REM PASO 5: VERIFICAR
echo.
echo [INFO] Verificando sincronizacion...
for /f "tokens=*" %%i in ('psql -h %LOCAL_HOST% -U %LOCAL_USER% -d %LOCAL_DB% -tc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2^>nul') do set TABLES=%%i

if "%TABLES%" equ "" (
    echo [ERROR] No se encontraron tablas en BD local
    pause
    exit /b 1
)

echo [SUCCESS] Se encontraron %TABLES% tablas en BD local

echo.
echo ===============================================
echo             RESUMEN FINAL
echo ===============================================
echo [SUCCESS] Sincronizacion completada exitosamente!
echo.
echo Archivo de backup: %BACKUP_FILE%
echo Base de datos local: %LOCAL_DB%
echo Host: %LOCAL_HOST%
echo Usuario: %LOCAL_USER%
echo Tablas: %TABLES%
echo.
echo Proximo paso:
echo 1. Actualiza .env.local con:
echo    DB_HOST=localhost
echo    DB_USER=postgres
echo    DB_NAME=bge_local
echo.
echo 2. Reinicia tu servidor backend
echo    npm start
echo.
echo ===============================================

set PGPASSWORD=
pause
