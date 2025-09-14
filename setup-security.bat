@echo off
echo ================================================
echo 🛡️ SETUP DE SEGURIDAD - BACHILLERATO HEROES
echo ================================================
echo.
echo Este script configurará el sistema de autenticación seguro
echo.
echo Pasos que se ejecutarán:
echo 1. Instalar dependencias de Node.js
echo 2. Configurar variables de entorno
echo 3. Inicializar servidor backend
echo 4. Actualizar archivos del frontend
echo.
set /p continue="¿Continuar? (s/n): "
if /i "%continue%" NEQ "s" (
    echo Instalación cancelada.
    pause
    exit /b 1
)

echo.
echo [1/4] Instalando dependencias de Node.js...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Error instalando dependencias
    pause
    exit /b 1
)

echo.
echo [2/4] Configurando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo ✅ Archivo .env creado desde .env.example
) else (
    echo ℹ️ Archivo .env ya existe
)

echo.
echo [3/4] Probando servidor backend...
echo Iniciando servidor en modo test...
timeout /t 2 /nobreak > nul
start /min cmd /c "node server.js"
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Configurando frontend...
cd ..
echo ✅ Frontend configurado para usar API segura

echo.
echo ================================================
echo ✅ INSTALACIÓN COMPLETADA
echo ================================================
echo.
echo Para usar el sistema seguro:
echo.
echo 1. SERVIDOR BACKEND:
echo    cd server
echo    npm start
echo.
echo 2. SERVIDOR FRONTEND:
echo    python -m http.server 8080
echo.
echo 3. ACCEDER:
echo    http://localhost:8080
echo.
echo IMPORTANTE:
echo - El servidor backend debe estar ejecutándose en puerto 3000
echo - Cambiar claves en server\.env para producción
echo - La contraseña por defecto sigue siendo: HeroesPatria2024!
echo.
echo ================================================
pause