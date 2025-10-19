@echo off
REM ================================================================
REM SCRIPT DE BACKUP DIARIO AUTOMATIZADO
REM Para ser ejecutado por el Programador de Tareas de Windows
REM Fecha: 19 de Octubre, 2025
REM ================================================================

echo ========================================
echo INICIANDO BACKUP DIARIO AUTOMATICO
echo ========================================
echo Fecha: %date% %time%
echo.

REM Cambiar al directorio del proyecto
cd /d "C:\03 BachilleratoHeroesWeb"

REM Ejecutar backup de base de datos (SQL directo)
echo [1/2] Ejecutando backup de base de datos...
node backend\scripts\backup-database-sql.js
if %errorlevel% neq 0 (
    echo ERROR: Backup de base de datos fallo
    echo ErrorLevel: %errorlevel% >> backup-errors.log
)

echo.

REM Ejecutar backup de archivos
echo [2/2] Ejecutando backup de archivos...
node backend\scripts\backup-files.js
if %errorlevel% neq 0 (
    echo ERROR: Backup de archivos fallo
    echo ErrorLevel: %errorlevel% >> backup-errors.log
)

echo.
echo ========================================
echo BACKUP DIARIO COMPLETADO
echo Fecha: %date% %time%
echo ========================================
echo.

REM Opcional: Enviar notificación o log
echo Backup completado el %date% a las %time% >> backup-history.log

exit /b 0
