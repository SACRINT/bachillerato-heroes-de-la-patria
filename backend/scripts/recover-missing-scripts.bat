@echo off
REM ========================================
REM SCRIPT DE RECUPERACIÓN DE ARCHIVOS CRÍTICOS
REM Fecha: 2025-11-10
REM Propósito: Recuperar 7 archivos desde código muerto a /public/js/
REM ========================================

echo.
echo ============================================
echo  RECUPERACIÓN DE SCRIPTS CRÍTICOS - FASE 1
echo ============================================
echo.

set SOURCE_DIR=no_usados\codigo_muerto_archivado_2025-11-07\js
set TARGET_DIR=public\js
set COUNT=0

REM Verificar que el directorio de origen existe
if not exist "%SOURCE_DIR%" (
    echo ERROR: Directorio de origen no encontrado: %SOURCE_DIR%
    pause
    exit /b 1
)

REM Verificar que el directorio de destino existe
if not exist "%TARGET_DIR%" (
    echo ERROR: Directorio de destino no encontrado: %TARGET_DIR%
    pause
    exit /b 1
)

echo [1/7] Recuperando theme-manager.js...
if exist "%SOURCE_DIR%\theme-manager.js" (
    copy "%SOURCE_DIR%\theme-manager.js" "%TARGET_DIR%\theme-manager.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] theme-manager.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar theme-manager.js
    )
) else (
    echo       [SKIP] theme-manager.js no encontrado en origen
)

echo [2/7] Recuperando search-simple.js...
if exist "%SOURCE_DIR%\search-simple.js" (
    copy "%SOURCE_DIR%\search-simple.js" "%TARGET_DIR%\search-simple.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] search-simple.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar search-simple.js
    )
) else (
    echo       [SKIP] search-simple.js no encontrado en origen
)

echo [3/7] Recuperando professional-forms.js...
if exist "%SOURCE_DIR%\professional-forms.js" (
    copy "%SOURCE_DIR%\professional-forms.js" "%TARGET_DIR%\professional-forms.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] professional-forms.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar professional-forms.js
    )
) else (
    echo       [SKIP] professional-forms.js no encontrado en origen
)

echo [4/7] Recuperando script.js...
if exist "%SOURCE_DIR%\script.js" (
    copy "%SOURCE_DIR%\script.js" "%TARGET_DIR%\script.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] script.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar script.js
    )
) else (
    echo       [SKIP] script.js no encontrado en origen
)

echo [5/7] Recuperando student-dashboard.js...
if exist "%SOURCE_DIR%\student-dashboard.js" (
    copy "%SOURCE_DIR%\student-dashboard.js" "%TARGET_DIR%\student-dashboard.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] student-dashboard.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar student-dashboard.js
    )
) else (
    echo       [SKIP] student-dashboard.js no encontrado en origen
)

echo [6/7] Recuperando student-portal.js...
if exist "%SOURCE_DIR%\student-portal.js" (
    copy "%SOURCE_DIR%\student-portal.js" "%TARGET_DIR%\student-portal.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] student-portal.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar student-portal.js
    )
) else (
    echo       [SKIP] student-portal.js no encontrado en origen
)

echo [7/7] Recuperando student-auth.js...
REM Nota: Este archivo puede tener otro nombre en código muerto
if exist "%SOURCE_DIR%\student-auth.js" (
    copy "%SOURCE_DIR%\student-auth.js" "%TARGET_DIR%\student-auth.js" >nul
    if %ERRORLEVEL% EQU 0 (
        echo       [OK] student-auth.js copiado exitosamente
        set /a COUNT+=1
    ) else (
        echo       [ERROR] Fallo al copiar student-auth.js
    )
) else (
    echo       [SKIP] student-auth.js no encontrado en origen (buscar manualmente)
)

echo.
echo ============================================
echo  RESUMEN DE RECUPERACIÓN
echo ============================================
echo.
echo Archivos recuperados exitosamente: %COUNT%/7
echo.

if %COUNT% GEQ 5 (
    echo [EXITO] Recuperacion completada con exito!
    echo.
    echo SIGUIENTE PASO:
    echo 1. Validar sintaxis: node -c public/js/theme-manager.js
    echo 2. Testing de paginas criticas
    echo 3. Re-ejecutar inventario: node backend/scripts/analyze-scripts-inventory.js
) else (
    echo [ADVERTENCIA] Solo se recuperaron %COUNT% archivos de 7
    echo Revisar manualmente el directorio %SOURCE_DIR%
)

echo.
pause
