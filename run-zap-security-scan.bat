@echo off
REM ==========================================
REM OWASP ZAP Security Baseline Scan
REM SEMANA 31 - Tarea 31.1.1
REM ==========================================

echo.
echo ========================================
echo OWASP ZAP Security Baseline Scan
echo ========================================
echo.
echo Verificando prerequisitos...
echo.

REM Verificar que Docker está disponible
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no está disponible
    echo Por favor instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker disponible

REM Verificar que servidor está corriendo
echo.
echo Verificando servidor en localhost:3000...
curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Servidor no está corriendo en http://localhost:3000
    echo Por favor ejecuta: npm start
    pause
    exit /b 1
)
echo [OK] Servidor disponible

REM Crear carpeta si no existe
if not exist "C:\03_BachilleratoHeroesWeb\docs\security" (
    mkdir "C:\03_BachilleratoHeroesWeb\docs\security"
    echo [OK] Carpeta de seguridad creada
)

echo.
echo ========================================
echo Iniciando escaneo OWASP ZAP...
echo ========================================
echo.
echo Esto puede tomar 5-10 minutos...
echo.

REM Ejecutar ZAP scan
docker run -t ^
  -v "C:\03_BachilleratoHeroesWeb\docs\security:/zap/wrk" ^
  owasp/zap2docker-stable zap-baseline.py ^
  -t http://host.docker.internal:3000 ^
  -r zap-report-baseline.html ^
  -J zap-report-baseline.json

REM Verificar si el scan fue exitoso
if errorlevel 1 (
    echo.
    echo [ERROR] El escaneo ZAP falló
    pause
    exit /b 1
)

echo.
echo ========================================
echo Escaneo ZAP COMPLETADO
echo ========================================
echo.
echo Reportes generados:
echo   - C:\03_BachilleratoHeroesWeb\docs\security\zap-report-baseline.html
echo   - C:\03_BachilleratoHeroesWeb\docs\security\zap-report-baseline.json
echo.
echo Para ver el reporte visual:
echo   1. Abre File Explorer
echo   2. Ve a: C:\03_BachilleratoHeroesWeb\docs\security\
echo   3. Doble-click en: zap-report-baseline.html
echo.
pause
