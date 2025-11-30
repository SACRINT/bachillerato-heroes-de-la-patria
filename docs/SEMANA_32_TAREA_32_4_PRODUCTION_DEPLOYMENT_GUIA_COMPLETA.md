# 🚀 SEMANA 32 TAREA 32.4: PRODUCTION DEPLOYMENT GUÍA COMPLETA
## v6.0.0 - DEPLOY A PRODUCCIÓN DESDE STAGING

**Versión:** v6.0.0
**Fecha:** 30 Noviembre 2025
**Objetivo:** Desplegar v6.0.0 de staging a producción con cero downtime
**Duración:** 12-14 horas
**Pre-requisito:** TAREA 32.3 UAT PASSED

---

## 📋 ÍNDICE

1. [Pre-Production Validation](#pre-production-validation)
2. [Database Backup](#database-backup)
3. [Production Deployment](#production-deployment)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Plan](#rollback-plan)
6. [Sign-Off](#sign-off)

---

## PRE-PRODUCTION VALIDATION

### Checklist Pre-Deployment

Antes de desplegar a producción, validar:

```bash
# 1. Confirmación de UAT exitoso
[ ] TAREA 32.3 completada
[ ] Todos los tests PASSED (13/13)
[ ] No hay issues críticos documentados
[ ] QA Sign-off obtenido

# 2. Verificar staging está estable
[ ] Health endpoint responde 200 OK
[ ] No hay errores en logs
[ ] Performance metrics OK (<2s FCP, <200ms API)
[ ] Database queries óptimas

# 3. Revisar cambios de v6.0.0
[ ] Release Notes leído
[ ] Security improvements validados
[ ] Performance improvements confirmados
[ ] No breaking changes en endpoints

# 4. Preparar comunicación
[ ] Mensaje de mantenimiento listo
[ ] Schedule publicado (maintenance window)
[ ] Equipo de soporte notificado
[ ] Rollback plan revisado

# 5. Validar configuración producción
[ ] Todas las env variables en Vercel producción
[ ] Database URL correcta (producción, no staging)
[ ] API keys correctas
[ ] JWT secrets seguros (32+ caracteres aleatorios)
```

---

## DATABASE BACKUP

### Paso 1: Backup Manual en Neon

**Objetivo:** Crear backup completo antes de migration

**Opción A: Neon Console UI (Recomendado)**

```
1. Ir a: https://console.neon.tech
2. Seleccionar proyecto de producción
3. En "Branches" → branch "main"
4. Hacer clic en ⋮ (tres puntos)
5. Seleccionar "Branching" → "Create Branch"
6. Nombre: "backup-v6.0.0-2025-11-30"
7. Esperar a que branch se cree (2-3 min)
8. Verificar: Nueva branch tiene copia exacta de datos

Backup automático también:
- Neon mantiene 7 backups automáticos
- Retenidos por 7 días
- Se pueden restaurar desde Neon UI
```

**Opción B: SQL Dump (CLI)**

```bash
# 1. Obtener DATABASE_URL de Neon (con password)
# Ir a Neon Console → Connection String

# 2. Ejecutar dump
pg_dump "postgresql://user:password@host/dbname" > backup-v6.0.0-2025-11-30.sql

# 3. Comprimir y respaldar
gzip backup-v6.0.0-2025-11-30.sql
# Archivo: backup-v6.0.0-2025-11-30.sql.gz (~50-100MB)

# 4. Guardar en lugar seguro:
# - Google Drive (personal account)
# - Azure Blob Storage
# - AWS S3
# - GitHub (private repo)

# Verificación:
# [ ] Backup completado
# [ ] Tamaño > 10MB (confirma que datos existen)
# [ ] Timestamp correcto en nombre
# [ ] Accesible para restaurar si es necesario
```

**Opción C: Vercel Postgres Backups (Automático)**

```
Si usan Vercel Postgres:
1. Vercel mantiene backups automáticos
2. Retención: 7 días
3. Restauración disponible en Vercel Dashboard
4. NO requiere acción manual

Si usan Neon:
1. Neon mantiene backups automáticos
2. Retención: 7 días
3. Restauración vía Neon Console
4. Backup manual también recomendado (paso anterior)
```

**Checklist de Backup:**

```
[ ] Backup completado
[ ] Backup verificado (size > 10MB)
[ ] Backup almacenado en lugar seguro
[ ] Instrucciones de restauración documentadas
[ ] Timestamp correcto
[ ] Test de restauración completado (opcional pero recomendado)
```

---

### Paso 2: Application State Validation

```bash
# 1. Verificar últimos datos críticos
# Conectar a Neon y ejecutar:

SELECT COUNT(*) as estudiantes FROM estudiantes;
SELECT COUNT(*) as docentes FROM docentes;
SELECT COUNT(*) as solicitudes FROM solicitudes;

# Anotar estos números (para verificar post-deploy):
Estudiantes: _____
Docentes: _____
Solicitudes: _____

# 2. Verificar no hay transactions pendientes
SELECT * FROM pg_stat_activity
WHERE state != 'idle';

# Resultado: Debe estar vacío o mostrar solo queries de lectura

# 3. Verificar integridad de índices
REINDEX INDEX idx_estudiantes_tenant;
REINDEX INDEX idx_docentes_tenant;

# Output: REINDEX completado sin errores
```

---

## PRODUCTION DEPLOYMENT

### Paso 1: Verificar Configuración en Vercel

**Acciones en Vercel Dashboard:**

```
URL: https://vercel.com/dashboard

1. Seleccionar proyecto BGE (producción, no staging)
2. Ir a "Settings" → "Environment Variables"
3. Verificar variables críticas:

[ ] DATABASE_URL → Producción (Neon producción)
[ ] JWT_SECRET → Valor diferente a staging
[ ] SESSION_SECRET → Valor diferente a staging
[ ] NODE_ENV → "production"
[ ] API_BASE_URL → https://www.bge.edu.mx (o tu dominio)
[ ] CORS_ORIGIN → Dominio de producción
[ ] EMAIL_SERVICE → Configurado (Sendgrid o Gmail)

4. Ir a "Settings" → "Build & Development"
5. Verificar:
[ ] Build Command: "npm run build"
[ ] Output Directory: ".next" o "dist" (según proyecto)
[ ] Root Directory: "." (current)

6. Ir a "Settings" → "Domains"
7. Verificar dominio de producción:
[ ] ejemplo: bge.edu.mx o www.bge.edu.mx
[ ] SSL certificado activo
[ ] DNS records correctos
```

---

### Paso 2: Git Tag y Release

```bash
# 1. Verificar que estamos en main branch
git branch
# Output: * main

# 2. Verificar que tag v6.0.0 existe
git tag -l v6.0.0
# Output: v6.0.0

# 3. Si tag NO existe, crear:
git tag -a v6.0.0 -m "Release v6.0.0 - Production Deployment"
git push origin v6.0.0

# 4. Verificar que todos los cambios están committed
git status
# Output: On branch main, nothing to commit

# 5. Verificar commit history
git log --oneline | head -5
# Debe mostrar últimos commits incluyendo "feat(release): Version Bump to v6.0.0"
```

---

### Paso 3: Deploy desde Staging a Producción

**OPCIÓN A: Vercel UI (Recomendado)**

```
1. Ir a: https://vercel.com/dashboard/[proyecto-bge]
2. Ir a "Deployments"
3. Buscar última compilación exitosa en staging
4. Hacer clic en deployment exitoso
5. Buscar botón "Promote to Production"
   (Si no aparece, ver OPCIÓN B)
6. Confirmar deployment a producción
7. Esperar a que Vercel despliegue (~2-5 min)
8. Verificar: Status en Vercel Dashboard = "Ready"
```

**OPCIÓN B: Desplegar desde Main Branch (Automático)**

```
Si tienes GitHub integration con Vercel:

1. Ir a: https://github.com/[usuario]/03_BachilleratoHeroesWeb
2. Confirmar que main branch está actualizado
3. Crear un nuevo commit en main (si hay cambios pendientes)
4. GitHub webhook dispara automáticamente Vercel deployment
5. Vercel Dashboard muestra deployment en progreso
6. Esperar a que build complete (~5-10 min)
7. Verificar: Status = "Ready"

# Git push trigger deployment automático:
git push origin main
# Vercel automatically starts build
```

**OPCIÓN C: Vercel CLI**

```bash
# 1. Instalar/verificar Vercel CLI
vercel --version

# 2. Login en Vercel CLI
vercel login

# 3. Cambiar a directorio proyecto
cd C:\03_BachilleratoHeroesWeb

# 4. Deploy a producción
vercel --prod

# Responder a prompts:
# "Set up and deploy?" → Y
# "Which scope?" → Tu account
# "Link to existing project?" → Y (si ya existe)
# "Project name?" → [nombre del proyecto]
# "Root directory?" → .

# 5. Esperar a que build complete
# Output muestra: "Deployment complete!"
# URL: https://[proyecto].vercel.app
```

---

### Paso 4: Monitoreo de Deployment en Vivo

```bash
# Mientras Vercel está desplegando:

# Verificar logs en vivo
vercel logs --follow

# O en Vercel Dashboard:
1. Ir a "Deployments"
2. Seleccionar deployment en progreso
3. Ver "Build Logs" en tiempo real
4. Buscar errors/warnings en rojo

# Que buscar durante deploy:
✅ "Running build..." - iniciando
✅ "Install dependencies..." - npm install
✅ "Building..." - webpack/next build
✅ "Deployment complete!" - éxito
❌ "Build failed" - error, ver logs
❌ "Module not found" - dependencia faltante
❌ "SyntaxError" - error en código
```

---

### Paso 5: Post-Deployment URL Verification

```bash
# 1. Verificar que producción está up
curl -I https://www.bge.edu.mx
# Output: HTTP/2 200

# 2. Si usa dominio personalizado (no Vercel domain):
# Puede tardar 15-60 min para que DNS propague
# Mientras espera, usar URL temporal de Vercel:
# https://[proyecto].vercel.app

# 3. Verificar health endpoint en producción
curl https://www.bge.edu.mx/api/health

# Esperado:
# {
#   "status": "ok",
#   "version": "6.0.0",
#   "database": "connected"
# }

# Si retorna 502/503:
# → DNS no propagó aún, esperar 5-10 min
# → Database conexión falla, verificar DATABASE_URL en Vercel
```

---

## POST-DEPLOYMENT VERIFICATION

### Verificación Fase 1: Inmediata (Primeros 5 min)

```bash
# 1. Frontend carga sin errores
Ir a: https://www.bge.edu.mx
[ ] Página carga en <3s
[ ] No hay errores 404 en console
[ ] Header/footer presentes
[ ] CSS aplicado correctamente

# 2. Health endpoint responde
curl https://www.bge.edu.mx/api/health
[ ] Status 200 OK
[ ] JSON válido
[ ] version = "6.0.0"
[ ] database = "connected"

# 3. Verificar logs en Vercel
Dashboard → Deployments → Ver logs
[ ] No hay errores críticos
[ ] Server inició correctamente
[ ] Database conexión exitosa
```

---

### Verificación Fase 2: Después de 10 min

```bash
# 1. Testing de endpoints críticos
curl -X GET https://www.bge.edu.mx/api/config/tenant
[ ] Retorna configuración tenant
[ ] Status 200 OK

# 2. Testing de login
Ir a https://www.bge.edu.mx
[ ] Modal de login aparece
[ ] Google OAuth carga
[ ] Email/password funciona

# 3. Testing de datos
Conectar a Neon producción:
SELECT COUNT(*) FROM estudiantes;
[ ] Misma cantidad que antes del deploy
[ ] NO hay datos nuevos (no se replicaron datos staging)
```

---

### Verificación Fase 3: Después de 30 min

```bash
# 1. Verificar no hay errores en logs
Vercel Dashboard → Deployments → Logs
[ ] No hay 500 errors
[ ] No hay warnings de memory leak
[ ] Requests completando normalmente

# 2. Verificar performance
Chrome DevTools → Lighthouse
[ ] FCP < 1.5s
[ ] LCP < 2.5s
[ ] CLS < 0.1
[ ] Performance score > 80

# 3. Verificar notificaciones funcionan
Si usando email:
[ ] Enviar email desde admin
[ ] Verificar que llega a inbox
[ ] Template se ve correcto

# 4. Verificar multi-tenant
Cambiar dominio (si tienes otros tenants):
[ ] Cada tenant ve solo sus datos
[ ] No hay data leakage
```

---

### Verificación Fase 4: Después de 1-2 horas

```bash
# 1. Monitoreo de error rates
Vercel Dashboard → Analytics
[ ] Error rate < 0.5%
[ ] Response time median < 200ms
[ ] No hay spikes de CPU/Memory

# 2. Monitoreo de usuarios
[ ] Tráfico normal
[ ] No hay spike de errores
[ ] Performance degradation? No

# 3. Revisión de logs
Buscar patterns de errores:
[ ] No hay repeated errors
[ ] No hay database connection timeouts
[ ] No hay authentication failures

# 4. Test de funcionalidades críticas
[ ] Login funciona
[ ] Admin dashboard accesible
[ ] Formularios envían emails
[ ] Datos guardados correctamente
```

---

### Checklist de Post-Deployment

| Verificación | Status | Time | Notes |
|--------------|--------|------|-------|
| Frontend carga | [ ] OK [ ] FAIL | T+5m | |
| Health endpoint | [ ] OK [ ] FAIL | T+5m | |
| Login funciona | [ ] OK [ ] FAIL | T+10m | |
| Database conectada | [ ] OK [ ] FAIL | T+10m | |
| Emails funcionan | [ ] OK [ ] FAIL | T+30m | |
| Error rate < 0.5% | [ ] OK [ ] FAIL | T+1h | |
| Performance OK | [ ] OK [ ] FAIL | T+1h | |
| Multi-tenant OK | [ ] OK [ ] FAIL | T+1h | |

---

## ROLLBACK PLAN

### Cuándo Activar Rollback

```
ACTIVAR ROLLBACK SI:

❌ CRÍTICO:
- Health endpoint retorna 500 error
- Database no conecta (500 error persistente)
- Homepage no carga (502/503 error)
- Login completamente roto (todos usuarios bloqueados)
- Data corruption detectada

❌ ALTO:
- Error rate > 5% (continuo por 15+ min)
- P99 response time > 5s
- Email service completamente no funciona
- Performance degradation >50%

⚠️ MONITOR:
- Error rate 1-5% (puede ser normal, monitorear)
- P99 response time 2-5s
- Algunos users reportan issues (puede ser navegador)
```

---

### Rollback Procedure

**OPCIÓN A: Vercel Rollback (Recomendado)**

```
1. Ir a: https://vercel.com/dashboard/[proyecto-bge]
2. Ir a "Deployments"
3. Buscar último deployment EXITOSO (anterior a v6.0.0)
4. Hacer clic en deployment
5. Buscar botón "Rollback"
6. Confirmar rollback
7. Esperar a que Vercel ejecute rollback (~1-3 min)
8. Verificar: Status = "Ready", version anterior funcionando

Tiempo total: 2-4 minutos
Downtime: <1 minuto
```

**OPCIÓN B: Git Revert + Push**

```bash
# 1. Identificar commit de v6.0.0
git log --oneline | grep "v6.0.0"
# Output: 1eba2f2 feat(release): Version Bump to v6.0.0

# 2. Revert ese commit
git revert 1eba2f2

# 3. Push a main (trigger automatic Vercel deployment)
git push origin main

# 4. Vercel automáticamente despliega versión anterior
# Esperar ~5-10 min para que build complete

Tiempo total: 8-12 minutos
Downtime: ~2-3 minutos (durante build)
```

**OPCIÓN C: Base de Datos Rollback (Si hay data corruption)**

```bash
# 1. Ir a Neon Console: https://console.neon.tech
# 2. Seleccionar proyecto BGE
# 3. En "Branches", buscar backup branch creado antes del deploy
# 4. Hacer clic en branch "backup-v6.0.0-2025-11-30"
# 5. Obtener nueva DATABASE_URL
# 6. En Vercel Dashboard → Environment Variables
#    Actualizar DATABASE_URL con backup URL
# 7. Trigger redeploy (push a main o manualmente en Vercel)
# 8. Esperar deployment complete

Tiempo total: 10-15 minutos
Downtime: 2-5 minutos (si hay queries lentas durante failover)

NOTA: Esto restaura datos a punto de backup
Datos desde backup hasta rollback se pierden
Usar SOLO si hay data corruption
```

---

### Post-Rollback Steps

Después de rollback:

```
1. [ ] Confirmar que versión anterior está funcionando
2. [ ] Verificar logs para encontrar qué falló en v6.0.0
3. [ ] Crear incident report:
       - Qué falló?
       - Cuándo fue detectado?
       - Cuánto downtime?
       - Root cause analysis?
4. [ ] Bugs identificados → crear issues en GitHub
5. [ ] Fix bugs en feature branch
6. [ ] Re-test completamente en staging
7. [ ] Retry deployment a producción

Timeline: 2-4 horas (debugging + fix + re-test)
```

---

## SIGN-OFF

### Deployment Completion Checklist

```
[ ] TAREA 32.3 UAT Passed (13/13 tests)
[ ] Database backup completado
[ ] Producción configuración validada
[ ] Deployment a Vercel completado
[ ] Health endpoint 200 OK
[ ] Frontend carga sin 404s
[ ] Login funciona
[ ] Database conectada
[ ] Post-deployment verification Phase 1-4 completadas
[ ] Error rate < 0.5%
[ ] Performance metrics OK
[ ] No hay issues críticos en logs

Total: ____ / 13 checkpoints completados

Status: [ ] READY FOR TAREA 32.5 (Post-Release Monitoring)
        [ ] ISSUES ENCONTRADOS (ver section "Issues Found")
```

---

### Deployment Metrics

**Capturar estos datos para auditoría:**

```
Deployment Start Time: ________
Build Start: ________
Build End: ________
Total Build Time: ________ min

Deploy to Vercel Start: ________
Deploy Complete: ________
Total Deploy Time: ________ min

Total Deployment Duration: ________ horas

Pre-Deployment Status:
- Database size: ________ GB
- Student count: ________
- Teacher count: ________

Post-Deployment Validation (T+1h):
- Error rate: ________%
- Avg Response Time: ________ ms
- P99 Response Time: ________ ms
- Memory usage: ________%
- CPU usage: ________%
```

---

### Sign-Off Approval

**Deployment Manager:**
```
Name: _______________________
Title: _______________________
Date: _______________________
Signature: _______________________

Status: [ ] Approved   [ ] Rejected
Comments: ___________________________________
```

**Product Owner:**
```
Name: _______________________
Title: _______________________
Date: _______________________
Signature: _______________________

Status: [ ] Approved   [ ] Rejected
Comments: ___________________________________
```

**Incident Commander (si hubo issues):**
```
Name: _______________________
Issues Resolved: Yes / No
Timeline to Fix: ___________
Comments: ___________________________________
```

---

### Next Step

**Si deployment fue EXITOSO:**
→ Proceder a **TAREA 32.5: Post-Release Monitoring** (24h en vivo)

**Si deployment fue FALLIDO:**
→ Ejecutar rollback
→ Investigar root cause
→ Arreglar en feature branch
→ Retry deployment (2-4 horas después)

---

## APÉNDICE: SCRIPTS DE DEPLOYMENT

### Script 1: Deployment Automatizado (PowerShell)

```powershell
# File: deploy-to-production.ps1

param(
    [string]$Project = "bge",
    [switch]$DryRun = $false
)

Write-Host "🚀 PRODUCTION DEPLOYMENT - v6.0.0" -ForegroundColor Cyan
Write-Host "Project: $Project" -ForegroundColor Yellow

# Pre-flight checks
Write-Host "`n1. Running pre-flight checks..." -ForegroundColor Cyan

$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "main") {
    Write-Host "❌ ERROR: Not on main branch (on: $branch)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Branch: main" -ForegroundColor Green

$tag = git tag -l v6.0.0
if (-not $tag) {
    Write-Host "❌ ERROR: Tag v6.0.0 not found" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Tag v6.0.0 exists" -ForegroundColor Green

# Login to Vercel
Write-Host "`n2. Verifying Vercel CLI..." -ForegroundColor Cyan
$vercelVersion = vercel --version
Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green

# Deploy
Write-Host "`n3. Deploying to production..." -ForegroundColor Cyan
if (-not $DryRun) {
    vercel --prod
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
} else {
    Write-Host "⏭️  DRY RUN - skipping actual deployment" -ForegroundColor Yellow
}

Write-Host "`n4. Next steps:" -ForegroundColor Cyan
Write-Host "   - Go to: https://vercel.com/dashboard/$Project"
Write-Host "   - Monitor deployment status"
Write-Host "   - Check health endpoint: https://www.bge.edu.mx/api/health"
Write-Host "   - Verify error rate in Analytics"
```

### Script 2: Post-Deployment Validation

```bash
#!/bin/bash
# File: validate-production-deployment.sh

PROD_URL="https://www.bge.edu.mx"
STAGING_URL="https://bge-staging.vercel.app"

echo "=== PRODUCTION DEPLOYMENT VALIDATION ==="
echo ""

# Test 1: Health endpoint
echo -n "1. Health endpoint... "
if curl -s $PROD_URL/api/health | grep -q "\"status\":\"ok\""; then
    echo "✅"
else
    echo "❌"
fi

# Test 2: Frontend
echo -n "2. Frontend loads... "
if curl -s $PROD_URL | grep -q "<!DOCTYPE"; then
    echo "✅"
else
    echo "❌"
fi

# Test 3: Version
echo -n "3. Version 6.0.0... "
if curl -s $PROD_URL/api/health | grep -q "\"version\":\"6.0.0\""; then
    echo "✅"
else
    echo "❌"
fi

# Test 4: Response time
echo -n "4. Response time... "
START=$(date +%s%N | cut -b1-13)
curl -s $PROD_URL/api/health > /dev/null
END=$(date +%s%N | cut -b1-13)
TIME=$((END-START))
if [ $TIME -lt 1000 ]; then
    echo "✅ (${TIME}ms)"
else
    echo "❌ (${TIME}ms)"
fi

echo ""
echo "=== END VALIDATION ==="
```

---

**Documento creado por:** Claude Code
**Versión:** v6.0.0
**Fecha:** 30 Noviembre 2025
**Próximo Paso:** TAREA 32.5 - Post-Release Monitoring

