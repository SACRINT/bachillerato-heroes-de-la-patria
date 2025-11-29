# 🔐 INSTRUCCIONES: EJECUTAR ESCANEOS DE SEGURIDAD SEMANA 31

**Archivos Creados:** 2 scripts `.bat` listos para usar
**Duración Total:** ~30 minutos (ZAP 5-10min + SonarQube 15-20min)
**Status:** ✅ LISTOS PARA EJECUTAR

---

## 📋 PREREQUISITOS

Antes de ejecutar los scripts, asegúrate que:

1. **Docker Desktop está corriendo**
   - Abre Docker Desktop desde el menú Inicio
   - Espera a que el ícono de Docker en la bandeja esté verde

2. **Servidor backend está activo**
   - Abre otra terminal PowerShell/CMD
   - Ve a: `C:\03_BachilleratoHeroesWeb`
   - Ejecuta: `npm start`
   - Verifica que aparece: `Server running on port 3000`

3. **Carpeta de seguridad existe**
   - Automáticamente se crea si no existe

---

## 🚀 OPCIÓN 1: OWASP ZAP SECURITY SCAN (5-10 minutos)

### Paso 1: Ejecutar el script

Abre PowerShell/CMD en `C:\03_BachilleratoHeroesWeb` y ejecuta:

```bash
.\run-zap-security-scan.bat
```

### Paso 2: Esperar a que complete

El script:
1. ✅ Verifica que Docker está disponible
2. ✅ Verifica que servidor está corriendo en localhost:3000
3. ✅ Descarga imagen ZAP (primera vez: ~500MB)
4. ✅ Ejecuta escaneo de seguridad (5-10 minutos)
5. ✅ Genera 2 reportes

### Paso 3: Revisar resultados

Una vez completado, encontrarás:
- **`docs/security/zap-report-baseline.html`** - Reporte visual (abre en navegador)
- **`docs/security/zap-report-baseline.json`** - Datos en JSON

**Para abrir el reporte visual:**
```
File Explorer → C:\03_BachilleratoHeroesWeb\docs\security\
Doble-click en: zap-report-baseline.html
```

### ✅ Qué debería ver

```
OWASP ZAP Security Baseline Scan
[baseline] PASS: Cross-Site Scripting (DOM based)
[baseline] PASS: Path Traversal
[baseline] PASS: Remote File Inclusion
[baseline] PASS: SQL Injection
...
Report generated: /zap/wrk/zap-report-baseline.html
```

**Criterio de Éxito:**
- ✅ 0 HIGH severity issues
- ✅ <5 MEDIUM severity issues
- ✅ Reporte HTML generado

---

## 🚀 OPCIÓN 2: SONARQUBE CODE QUALITY ANALYSIS (15-20 minutos)

### Paso 1: Ejecutar el script

Abre PowerShell/CMD en `C:\03_BachilleratoHeroesWeb` y ejecuta:

```bash
.\run-sonarqube-analysis.bat
```

### Paso 2: Esperar a que SonarQube inicie

El script:
1. ✅ Verifica que Docker está disponible
2. ✅ Inicia contenedor SonarQube (descarga ~600MB primera vez)
3. ✅ Espera a que SonarQube se inicie
4. ✅ Abre navegador automáticamente (si es posible)

### Paso 3: Crear token en SonarQube UI

**Cuando el script pida tu entrada:**

1. **Abre navegador:** http://localhost:9000

2. **Login con:**
   - Usuario: `admin`
   - Contraseña: `admin`

3. **Crear token:**
   - Haz clic en tu avatar (arriba a la derecha)
   - Selecciona: `My Account` → `Security` → `Generate Tokens`
   - Nombre: `BGE-v6`
   - Click en `Generate`
   - **COPIA el token que aparece** (no se volverá a mostrar)

4. **Vuelve al script y pega el token**
   - El script te preguntará: `Pega aquí el token:`
   - Pega el token copiado
   - Presiona ENTER

### Paso 4: Esperar análisis

El script ejecutará el análisis (5-10 minutos).

### Paso 5: Ver resultados

Una vez completado:

1. Abre: http://localhost:9000
2. Haz clic en proyecto `bge-v6`
3. Revisa métricas:
   - **Code Smells:** <100 ✅
   - **Bugs:** 0 ✅
   - **Vulnerabilities:** 0 ✅
   - **Code Coverage:** >60% ✅
   - **Technical Debt:** <5 días ✅

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ERROR: "Docker daemon is not running"

**Solución:**
1. Abre Docker Desktop desde el menú Inicio
2. Espera a que esté completamente listo (ícono verde)
3. Intenta de nuevo

---

### ERROR: "Servidor no está corriendo en http://localhost:3000"

**Solución:**
1. Abre OTRA terminal/PowerShell
2. Ve a: `C:\03_BachilleratoHeroesWeb`
3. Ejecuta: `npm start`
4. Espera a ver: `Server running on port 3000`
5. LUEGO ejecuta el script ZAP

---

### ERROR: "El archivo especificado no puede encontrarse" (Docker pipes)

**Solución:**
- Docker Desktop no está corriendo correctamente
- Reinicia Docker Desktop completamente
- Espera a que esté listo (2-3 minutos)

---

### SonarQube pide token y el script falla

**Solución:**
1. Asegúrate que copiaste el token COMPLETO
2. El token debe empezar con: `sqp_...` o similar
3. NO incluyas espacios extras al pegarlo
4. Si falla, puedes ejecutar el comando manualmente:
   ```
   npx sonar-scanner -Dsonar.projectKey=bge-v6 -Dsonar.sources=. -Dsonar.host.url=http://localhost:9000 -Dsonar.login=YOUR_TOKEN_HERE
   ```

---

## 📊 ORDEN RECOMENDADO

### Opción A: Ejecutar TODO (Recomendado)
1. **Primero:** `.\run-zap-security-scan.bat` (5-10 min)
2. **Luego:** `.\run-sonarqube-analysis.bat` (15-20 min)
3. **Total:** ~30 minutos
4. **Resultado:** Validación completa de seguridad

### Opción B: Solo ZAP (Rápido)
1. `.\run-zap-security-scan.bat` (5-10 min)
2. Suficiente para validación básica

### Opción C: Solo SonarQube (Completo)
1. `.\run-sonarqube-analysis.bat` (15-20 min)
2. Validación exhaustiva de código

---

## 📋 CHECKLIST DE EJECUCIÓN

### Antes de ejecutar
- [ ] Docker Desktop está abierto y listo
- [ ] Servidor backend running (`npm start`)
- [ ] Estás en directorio: `C:\03_BachilleratoHeroesWeb`

### Ejecutando ZAP
- [ ] Script `.bat` se ejecutó sin errores
- [ ] ZAP descargó imagen (primera vez: 500MB)
- [ ] Escaneo completó (5-10 minutos)
- [ ] Reporte HTML se generó

### Ejecutando SonarQube
- [ ] SonarQube iniciado en Docker
- [ ] Abriste http://localhost:9000
- [ ] Creaste token de autenticación
- [ ] Pegaste token en el script
- [ ] Análisis completó (5-10 minutos)
- [ ] Viste resultados en http://localhost:9000

---

## ✅ DESPUÉS DE EJECUTAR

### Reportes generados

**ZAP:**
- ✅ `docs/security/zap-report-baseline.html` - Abre en navegador
- ✅ `docs/security/zap-report-baseline.json` - Datos raw

**SonarQube:**
- ✅ Resultados en http://localhost:9000
- ✅ Métricas de código disponibles

### Próximo paso

Cuando hayas ejecutado ambos (o al menos ZAP):

1. **Confirma a Claude:** "He ejecutado ZAP y SonarQube"
2. **Claude completará:**
   - Consolidación de reportes finales
   - Documentación de seguridad
   - Aprobación para avanzar a SEMANA 32

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Revisa esta guía** (sección Solución de Problemas)
2. **Verifica logs en la terminal** (información de errores)
3. **Asegúrate que Docker está corriendo** (requisito crítico)
4. **Verifica que servidor está en puerto 3000** (`curl http://localhost:3000/api/health`)

---

## 🎯 OBJETIVO FINAL

Completar SEMANA 31 con:
- ✅ npm audit: 0 vulnerabilidades (COMPLETADO)
- ✅ Manual security checklist: 45/48 items (COMPLETADO)
- ✅ OWASP ZAP scan: 0 HIGH issues (⏳ Ejecutar ahora)
- ✅ SonarQube analysis: >80/100 (⏳ Ejecutar ahora)

**Resultado:** ✅ **READY FOR SEMANA 32 - Release v6.0.0**

---

**Scripts Disponibles:**
1. `run-zap-security-scan.bat` - OWASP ZAP baseline scan
2. `run-sonarqube-analysis.bat` - SonarQube code quality

**¡Ejecuta ahora!** 🚀

