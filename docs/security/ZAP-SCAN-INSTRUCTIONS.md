# 🔒 OWASP ZAP Security Scanning - Instructions

**Fecha:** 29 Noviembre 2025
**Versión:** v2.30.1
**Objetivo:** Ejecutar escaneo de vulnerabilidades OWASP ZAP

---

## 📋 Prerequisitos

- [ ] Docker instalado (✅ Verificado: v28.5.1)
- [ ] Server backend corriendo en http://localhost:3000
- [ ] npm audit completado y limpio (✅ LIMPIO - 0 vulnerabilidades)

---

## 🚀 Opción 1: Docker ZAP (Recomendado)

### Paso 1: Verificar que servidor está corriendo

```bash
curl http://localhost:3000/api/health
```

**Esperado:**
```json
{
  "status": "ok",
  "version": "2.30.1"
}
```

---

### Paso 2: Ejecutar ZAP Baseline Scan en Docker

```bash
# Crear carpeta para reportes si no existe
mkdir -p C:\03_BachilleratoHeroesWeb\docs\security

# Ejecutar ZAP scan
docker run -t \
  -v "C:\03_BachilleratoHeroesWeb\docs\security:/zap/wrk" \
  owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report-baseline.html \
  -J zap-report-baseline.json
```

**Duración esperada:** 5-10 minutos

**Salida esperada:**
```
WARN: Could not find log4j...
[baseline] PASS: Cross-Site Scripting (DOM based)
[baseline] PASS: Path Traversal
[baseline] PASS: Remote File Inclusion
[baseline] PASS: SQL Injection
...
Report generated: /zap/wrk/zap-report-baseline.html
```

---

### Paso 3: Revisar Resultados

Después que ZAP complete:

1. **Reportes generados:**
   - `docs/security/zap-report-baseline.html` (visual)
   - `docs/security/zap-report-baseline.json` (data)

2. **Verificar issues:**
   ```bash
   # Ver resumen en JSON
   cat docs/security/zap-report-baseline.json | jq '.site[0].alerts | length'

   # Ver issues por severidad
   cat docs/security/zap-report-baseline.json | jq '.site[0].alerts[] | {name, riskcode}'
   ```

---

## 🚀 Opción 2: ZAP Desktop (Manual)

Si Docker no funciona correctamente:

1. **Descargar ZAP:** https://www.zaproxy.org/download/
2. **Instalar en:** `C:\Program Files\OWASP ZAP`
3. **Ejecutar Desktop:**
   ```bash
   "C:\Program Files\OWASP ZAP\zap.exe"
   ```
4. **Configurar:**
   - Tools → Options → Network
   - Local Proxy: 127.0.0.1:8080
5. **Scan:**
   - Tools → Options → Automated Scan
   - URL: `http://localhost:3000`
   - Start Scan

---

## 📊 Expected Results

### Para v2.30.1 (baseline):

| Issue | Tipo | Severidad | Esperado |
|-------|------|-----------|----------|
| Missing Security Headers | Config | Medium | 1-3 |
| Content-Type Missing | Config | Low | 1-2 |
| X-Frame-Options | Config | Medium | 0-1 |
| Other | Varies | Low | 0-5 |

**Criterio de Éxito:**
- ✅ 0 HIGH severity
- ✅ <5 MEDIUM severity
- ✅ <10 LOW severity

---

## 🔧 SEMANA 31 - Tarea 31.1.1 Status

**Status:** 🟡 PENDING EXECUTION
**Responsable:** Claude Code (Autonomous)
**Tiempo estimado:** 6 horas
**Tiempo real:** 1 hora (setup + documentation)

### Tareas Completadas:
- ✅ npm audit completado y limpio
- ✅ Docker verificado e instalado
- ✅ Instrucciones creadas
- ⏳ ZAP scan a ejecutar cuando servidor esté disponible

### Próximo Paso:
Ejecutar ZAP baseline scan cuando usuario arranque servidor backend:
```bash
docker run -t \
  -v "C:\03_BachilleratoHeroesWeb\docs\security:/zap/wrk" \
  owasp/zap2docker-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report-baseline.html \
  -J zap-report-baseline.json
```

---

## 📝 Notes

- ZAP es un scanner PASIVO (no ejecuta exploits)
- Duración del scan: 5-10 minutos
- Reporte HTML se abre automáticamente en navegador
- Resultados guardados para documentación
- Sin riesgo para la aplicación

