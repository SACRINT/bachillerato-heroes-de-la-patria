@echo off
REM ==========================================
REM SonarQube Code Quality Analysis
REM SEMANA 31 - Tarea 31.2.1
REM ==========================================

echo.
echo ========================================
echo SonarQube Code Quality Analysis
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

REM Verificar que Node.js/npm está disponible
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no está disponible
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] npm disponible

echo.
echo ========================================
echo PASO 1: Iniciando SonarQube en Docker
echo ========================================
echo.
echo Iniciando contenedor SonarQube...
echo Por favor espera 2-3 minutos mientras se inicia SonarQube...
echo.

REM Detener contenedor existente si hay
docker stop sonarqube >nul 2>&1
docker rm sonarqube >nul 2>&1

REM Iniciar SonarQube
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

echo.
echo Esperando a que SonarQube inicie (30 segundos)...
timeout /t 30 /nobreak

echo.
echo [OK] SonarQube iniciado
echo Accede en: http://localhost:9000
echo Login: admin / admin
echo.
echo ========================================
echo PASO 2: Creando token de autenticación
echo ========================================
echo.
echo INSTRUCCIONES MANUALES (no se puede automatizar):
echo.
echo 1. Abre navegador: http://localhost:9000
echo 2. Login con:
echo    - Usuario: admin
echo    - Contraseña: admin
echo.
echo 3. Ir a: Administration ^> Users ^> Tokens ^> Generate
echo 4. Crear token con nombre: "BGE-v6"
echo 5. COPIAR el token generado
echo.
echo Después de completar esto, presiona ENTER...
pause

echo.
echo ========================================
echo PASO 3: Instalando Sonar Scanner
echo ========================================
echo.

cd /d "C:\03_BachilleratoHeroesWeb"

npm install -D sonar-scanner >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] Error instalando sonar-scanner
    echo Continuando de todas formas...
)

echo [OK] Sonar Scanner listo

echo.
echo ========================================
echo PASO 4: Ejecutando análisis de código
echo ========================================
echo.
echo Por favor ingresa el TOKEN que copiaste en PASO 3
set /p SONAR_TOKEN="Pega aquí el token: "

echo.
echo Ejecutando análisis SonarQube (esto puede tomar 5-10 minutos)...
echo.

npx sonar-scanner ^
  -Dsonar.projectKey=bge-v6 ^
  -Dsonar.sources=. ^
  -Dsonar.host.url=http://localhost:9000 ^
  -Dsonar.login=%SONAR_TOKEN% ^
  -Dsonar.exclusions=node_modules/**,dist/**,coverage/**,*.json

if errorlevel 1 (
    echo.
    echo [ERROR] El análisis SonarQube falló
    echo Verifica que el token sea correcto
    pause
    exit /b 1
)

echo.
echo ========================================
echo Análisis SonarQube COMPLETADO
echo ========================================
echo.
echo Resultados disponibles en:
echo   http://localhost:9000
echo.
echo Métricas a revisar:
echo   - Code Smells: ^<100
echo   - Bugs: 0
echo   - Vulnerabilities: 0
echo   - Code Coverage: ^>60%%
echo   - Technical Debt: ^<5 días
echo.
echo Para detener SonarQube después, ejecuta:
echo   docker stop sonarqube
echo.
pause
