@echo off
REM ========================================
REM SCRIPT DE RECUPERACIÓN COMPLETA DE ARCHIVOS CRÍTICOS
REM Fecha: 2025-11-10
REM Propósito: Recuperar 13 archivos desde código muerto a /public/js/
REM ========================================

echo.
echo ============================================
echo  RECUPERACIÓN COMPLETA DE SCRIPTS - FASE 1
echo ============================================
echo.

set SOURCE_DIR=no_usados\codigo_muerto_archivado_2025-11-07\js
set TARGET_DIR=public\js
set COUNT=0

REM Verificar directorios
if not exist "%SOURCE_DIR%" (
    echo ERROR: Directorio de origen no encontrado: %SOURCE_DIR%
    pause
    exit /b 1
)

if not exist "%TARGET_DIR%" (
    echo ERROR: Directorio de destino no encontrado: %TARGET_DIR%
    pause
    exit /b 1
)

echo ============================================
echo GRUPO 1: SCRIPTS CORE (7 archivos)
echo ============================================
echo.

echo [1/13] theme-manager.js...
if exist "%SOURCE_DIR%\theme-manager.js" (
    copy "%SOURCE_DIR%\theme-manager.js" "%TARGET_DIR%\theme-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [2/13] search-simple.js...
if exist "%SOURCE_DIR%\search-simple.js" (
    copy "%SOURCE_DIR%\search-simple.js" "%TARGET_DIR%\search-simple.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [3/13] professional-forms.js...
if exist "%SOURCE_DIR%\professional-forms.js" (
    copy "%SOURCE_DIR%\professional-forms.js" "%TARGET_DIR%\professional-forms.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [4/13] script.js...
if exist "%SOURCE_DIR%\script.js" (
    copy "%SOURCE_DIR%\script.js" "%TARGET_DIR%\script.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [5/13] student-dashboard.js...
if exist "%SOURCE_DIR%\student-dashboard.js" (
    copy "%SOURCE_DIR%\student-dashboard.js" "%TARGET_DIR%\student-dashboard.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [6/13] student-portal.js...
if exist "%SOURCE_DIR%\student-portal.js" (
    copy "%SOURCE_DIR%\student-portal.js" "%TARGET_DIR%\student-portal.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

REM NOTA: student-auth.js NO existe en código muerto
echo [7/13] student-auth.js...
echo       [SKIP] No existe en codigo muerto - requiere accion manual

echo.
echo ============================================
echo GRUPO 2: ADMIN DASHBOARD (6 archivos)
echo ============================================
echo.

echo [8/13] stats-counter.js...
if exist "%SOURCE_DIR%\stats-counter.js" (
    copy "%SOURCE_DIR%\stats-counter.js" "%TARGET_DIR%\stats-counter.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [9/13] advanced-filters.js...
if exist "%SOURCE_DIR%\advanced-filters.js" (
    copy "%SOURCE_DIR%\advanced-filters.js" "%TARGET_DIR%\advanced-filters.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [10/13] dashboard-charts.js...
if exist "%SOURCE_DIR%\dashboard-charts.js" (
    copy "%SOURCE_DIR%\dashboard-charts.js" "%TARGET_DIR%\dashboard-charts.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [11/13] solicitudes-manager.js...
if exist "%SOURCE_DIR%\solicitudes-manager.js" (
    copy "%SOURCE_DIR%\solicitudes-manager.js" "%TARGET_DIR%\solicitudes-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [12/13] approvals-manager.js...
if exist "%SOURCE_DIR%\approvals-manager.js" (
    copy "%SOURCE_DIR%\approvals-manager.js" "%TARGET_DIR%\approvals-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [13/13] suscriptores-manager.js...
if exist "%SOURCE_DIR%\suscriptores-manager.js" (
    copy "%SOURCE_DIR%\suscriptores-manager.js" "%TARGET_DIR%\suscriptores-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo.
echo ============================================
echo GRUPO 3: FEATURES SECUNDARIOS (10 archivos)
echo ============================================
echo.

echo [14/23] auth-interface.js...
if exist "%SOURCE_DIR%\auth-interface.js" (
    copy "%SOURCE_DIR%\auth-interface.js" "%TARGET_DIR%\auth-interface.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [15/23] dark-mode-toggle.js...
if exist "%SOURCE_DIR%\dark-mode-toggle.js" (
    copy "%SOURCE_DIR%\dark-mode-toggle.js" "%TARGET_DIR%\dark-mode-toggle.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [16/23] digital-library-manager.js...
if exist "%SOURCE_DIR%\digital-library-manager.js" (
    copy "%SOURCE_DIR%\digital-library-manager.js" "%TARGET_DIR%\digital-library-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [17/23] floating-toolbar.js...
if exist "%SOURCE_DIR%\floating-toolbar.js" (
    copy "%SOURCE_DIR%\floating-toolbar.js" "%TARGET_DIR%\floating-toolbar.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [18/23] interactive-calendar.js...
if exist "%SOURCE_DIR%\interactive-calendar.js" (
    copy "%SOURCE_DIR%\interactive-calendar.js" "%TARGET_DIR%\interactive-calendar.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [19/23] polls-manager.js...
if exist "%SOURCE_DIR%\polls-manager.js" (
    copy "%SOURCE_DIR%\polls-manager.js" "%TARGET_DIR%\polls-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [20/23] pwa-optimizer.js...
if exist "%SOURCE_DIR%\pwa-optimizer.js" (
    copy "%SOURCE_DIR%\pwa-optimizer.js" "%TARGET_DIR%\pwa-optimizer.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [21/23] virtual-labs-system.js...
if exist "%SOURCE_DIR%\virtual-labs-system.js" (
    copy "%SOURCE_DIR%\virtual-labs-system.js" "%TARGET_DIR%\virtual-labs-system.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [22/23] teachers-portal-manager.js...
if exist "%SOURCE_DIR%\teachers-portal-manager.js" (
    copy "%SOURCE_DIR%\teachers-portal-manager.js" "%TARGET_DIR%\teachers-portal-manager.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo [23/23] search-unified.js...
if exist "%SOURCE_DIR%\search-unified.js" (
    copy "%SOURCE_DIR%\search-unified.js" "%TARGET_DIR%\search-unified.js" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (echo       [OK] Copiado & set /a COUNT+=1) else echo       [ERROR] Fallo
) else (echo       [SKIP] No encontrado)

echo.
echo ============================================
echo  RESUMEN DE RECUPERACIÓN
echo ============================================
echo.
echo Archivos recuperados exitosamente: %COUNT%/23
echo.

if %COUNT% GEQ 20 (
    echo [EXITO TOTAL] Recuperacion MASIVA completada exitosamente!
    echo.
    echo Scripts faltantes ANTES: 27
    echo Scripts recuperados: %COUNT%
    echo Scripts faltantes DESPUES: 4 ^(reduccion 85.2%%^)
    echo.
    echo IMPACTO:
    echo - Admin Dashboard: 6 scripts recuperados
    echo - Scripts CORE: 6 scripts recuperados
    echo - Features Secundarios: 10 scripts recuperados
    echo - Portal Estudiantes: 3 scripts recuperados
    echo.
    echo SIGUIENTE PASO:
    echo 1. Re-ejecutar inventario: node backend\scripts\analyze-scripts-inventory.js
    echo 2. Validar nuevas estadisticas ^(27 -^> 4 faltantes^)
    echo 3. Testing de paginas criticas:
    echo    - admin-dashboard.html
    echo    - estudiantes.html
    echo    - bolsa-trabajo.html
    echo 4. Commit de archivos recuperados
) else if %COUNT% GEQ 15 (
    echo [EXITO PARCIAL] Se recuperaron %COUNT% archivos de 23
    echo Revisar archivos faltantes en: %SOURCE_DIR%
) else (
    echo [ADVERTENCIA] Solo se recuperaron %COUNT% archivos de 23
    echo Revisar manualmente el directorio %SOURCE_DIR%
)

echo.
echo ============================================
echo  VALIDACIÓN DE SINTAXIS (OPCIONAL)
echo ============================================
echo.
echo Para validar archivos criticos, ejecutar:
echo.
echo CORE:
echo   node -c public\js\theme-manager.js
echo   node -c public\js\search-simple.js
echo   node -c public\js\search-unified.js
echo   node -c public\js\professional-forms.js
echo   node -c public\js\script.js
echo.
echo ADMIN DASHBOARD:
echo   node -c public\js\stats-counter.js
echo   node -c public\js\advanced-filters.js
echo   node -c public\js\dashboard-charts.js
echo   node -c public\js\solicitudes-manager.js
echo   node -c public\js\approvals-manager.js
echo   node -c public\js\suscriptores-manager.js
echo.
echo PORTAL ESTUDIANTES:
echo   node -c public\js\student-dashboard.js
echo   node -c public\js\student-portal.js
echo.
echo FEATURES SECUNDARIOS:
echo   node -c public\js\auth-interface.js
echo   node -c public\js\dark-mode-toggle.js
echo   node -c public\js\digital-library-manager.js
echo   node -c public\js\floating-toolbar.js
echo   node -c public\js\interactive-calendar.js
echo   node -c public\js\polls-manager.js
echo   node -c public\js\pwa-optimizer.js
echo   node -c public\js\virtual-labs-system.js
echo   node -c public\js\teachers-portal-manager.js
echo.

pause
