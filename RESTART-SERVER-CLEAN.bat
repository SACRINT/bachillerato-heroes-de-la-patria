@echo off
REM SCRIPT: Reiniciar servidor y limpiar cache
REM Propósito: Forzar recarga de datos desde Neon database

echo.
echo ========================================
echo REINICIO LIMPIO DEL SERVIDOR
echo ========================================
echo.

REM PASO 1: Matar todos los procesos Node
echo [1/6] Matando todos los procesos Node.js...
taskkill /IM node.exe /F 2>nul
if errorlevel 1 (
    echo       No hay procesos Node.js ejecutándose
) else (
    echo       ✓ Procesos Node.js terminados
)

REM PASO 2: Esperar 5 segundos
echo [2/6] Esperando 5 segundos...
timeout /t 5 /nobreak

REM PASO 3: Limpiar npm cache (opcional)
echo [3/6] Limpiando cache npm (opcional)...
call npm cache clean --force 2>nul

REM PASO 4: Ir al directorio backend
echo [4/6] Navegando al directorio backend...
cd /d "%~dp0backend"

REM PASO 5: Instalar dependencias (si faltan)
echo [5/6] Verificando dependencias...
call npm install 2>nul

REM PASO 6: Iniciar servidor
echo [6/6] Iniciando servidor...
echo.
echo ========================================
echo SERVIDOR REINICIADO CORRECTAMENTE
echo ========================================
echo.
echo Navegador: http://localhost:3000
echo.
call npm start
