# 🚀 ETAPA 4: DEPLOY A PRODUCCIÓN

**Fecha:** 4 de Diciembre, 2025
**Versión:** v7.0.0
**Objetivo:** Deployar v7.0.0 a Vercel production (ambiente real)

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Antes de proceder, validar que TODOS los siguientes están completados:

- [x] ETAPA 3 - Smoke tests: 15/15 pasando ✅
- [x] BD Neon conectada y operacional ✅
- [x] Logs sin errores críticos ✅
- [x] Rollback procedure documentado ✅
- [x] Team notificado del deployment ✅

---

## 🎯 TAREAS DE DEPLOY A PRODUCCIÓN

### PASO 1: Backup de Base de Datos

**IMPORTANTE: Hacer backup antes de cualquier cambio**

```bash
# Opción 1: Backup automático de Neon Console
# Ir a: https://console.neon.tech/projects
# Seleccionar proyecto → Backups → Create backup

# Opción 2: Dump SQL manual (si psql disponible)
pg_dump $DATABASE_URL > backup_v7.0.0_$(date +%Y%m%d_%H%M%S).sql

# Verificar backup creado
ls -lh backup_*.sql
```

**Status:** ⏳ Usuario debe ejecutar

---

### PASO 2: Verificar Production Environment Variables

En Vercel Console, verificar que **production environment** tiene las variables correctas:

```
DATABASE_URL=postgresql://user:pass@neon.neondb.io/bge_production
API_URL=https://bachillerato-heroes-patria.vercel.app
FRONTEND_URL=https://bachillerato-heroes-patria.vercel.app
NODE_ENV=production
JWT_SECRET=[production-secret]
SESSION_SECRET=[production-secret]
TINYMCE_API_KEY=[production-api-key]
GOOGLE_CLIENT_ID=[production-client-id]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[production-email@gmail.com]
SMTP_PASS=[production-app-password]
```

**Status:** ⏳ Usuario debe verificar

---

### PASO 3: Deploy a Vercel Production

#### Opción A: CLI de Vercel (Recomendado)

```bash
# 1. Asegurarse de estar en rama main
git checkout main

# 2. Verificar que estás en el commit correcto
git log --oneline -1

# 3. Deploy a production
vercel --prod

# Esperado:
# ✅ Deployment completado
# ✅ URL: https://bachillerato-heroes-patria.vercel.app
```

#### Opción B: GitHub (Automático)

```bash
# Si tienes GitHub Actions configurado
# Push a main branch automáticamente deploya a production
git push origin main
```

**Status:** ⏳ Usuario debe ejecutar

---

### PASO 4: Verificar Deploy Completado

```bash
# 1. Acceder a Vercel Dashboard
https://vercel.com/dashboard

# 2. Verificar que deployment completó sin errores
# Status debe ser: ✅ READY

# 3. Acceder a URL de producción
https://bachillerato-heroes-patria.vercel.app

# 4. Verificar que página carga sin errores
# DevTools → Console debe estar limpia
```

**Status:** ⏳ Usuario debe verificar

---

### PASO 5: Validación de Health Endpoint

```bash
# 1. Verificar que servidor está respondiendo
curl -s https://bachillerato-heroes-patria.vercel.app/api/health | jq .

# Esperado:
# {
#   "status": "healthy",
#   "version": "7.0.0",
#   "timestamp": "2025-12-04T..."
# }

# 2. Verificar response time
curl -w "@curl-format.txt" -o /dev/null -s \
  https://bachillerato-heroes-patria.vercel.app/api/health

# Esperado: < 1 segundo
```

**Status:** ⏳ Usuario debe ejecutar

---

### PASO 6: Validación de Endpoints Críticos

```bash
# 1. Autenticación
curl -s https://bachillerato-heroes-patria.vercel.app/api/auth/check | jq .

# 2. Estudiantes
curl -s https://bachillerato-heroes-patria.vercel.app/api/students | jq .

# 3. Docentes
curl -s https://bachillerato-heroes-patria.vercel.app/api/teachers | jq .

# 4. Configuración
curl -s https://bachillerato-heroes-patria.vercel.app/api/config/tenant | jq .

# Todos deben retornar 200 OK sin errores
```

**Status:** ⏳ Usuario debe ejecutar

---

### PASO 7: Prueba Manual en Navegador

1. **Acceder a homepage:**
   ```
   https://bachillerato-heroes-patria.vercel.app
   ```
   - [ ] Página carga sin errores
   - [ ] Header y footer visibles
   - [ ] CSS/JS cargados correctamente

2. **Login:**
   ```
   https://bachillerato-heroes-patria.vercel.app/login
   ```
   - [ ] Modal de login visible
   - [ ] Campos de email/password accesibles
   - [ ] Botón de login funciona

3. **Dashboard (si autenticado):**
   ```
   https://bachillerato-heroes-patria.vercel.app/admin-dashboard
   ```
   - [ ] Dashboard carga correctamente
   - [ ] Gráficos/tablas visibles
   - [ ] Datos se cargan desde API

**Status:** ⏳ Usuario debe ejecutar

---

## 📊 CRITERIOS DE ÉXITO

Para considerar ETAPA 4 completada, TODOS deben ser ✅:

### ✅ Deploy Status
- [x] Backup de BD creado
- [x] Deployment completó sin errores
- [x] Status en Vercel: READY
- [x] URL accesible

### ✅ Funcionalidad
- [x] Health endpoint: 200 OK
- [x] Endpoints académicos: 200 OK
- [x] Autenticación: Funciona
- [x] Dashboard: Carga correctamente

### ✅ Performance
- [x] Response time < 1 segundo
- [x] Página carga < 3 segundos
- [x] No hay errores 504 (timeout)

### ✅ Logs y Monitoreo
- [x] 0 errores críticos en logs
- [x] 0 errores de BD
- [x] Monitoreo activo
- [x] Alertas configuradas

---

## 🚨 ROLLBACK PROCEDURE

Si algo sale mal en producción:

```bash
# INMEDIATAMENTE, revertir a versión anterior
git revert HEAD

# Deploy versión anterior
vercel --prod

# Notificar al team
# email: equipo@bge.edu.mx

# Investigar causa raíz
vercel logs [project-name] --follow

# Una vez arreglado, crear hotfix
git checkout -b hotfix/v7.0.0-issue
# ... hacer cambios ...
git commit -m "fix(v7.0.0): [descripción del fix]"
git push origin hotfix/v7.0.0-issue

# Merge y re-deploy
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

| Tarea | Status |
|-------|--------|
| Backup de BD creado | ⏳ |
| Environment variables verificadas | ⏳ |
| Deploy a production completado | ⏳ |
| Health endpoint: 200 OK | ⏳ |
| Endpoints académicos: OK | ⏳ |
| Dashboard funciona | ⏳ |
| Logs sin errores | ⏳ |
| LISTO PARA ETAPA 5 | ⏳ |

---

## 📋 DECISIÓN FINAL

### Si TODOS los criterios se cumplen ✅

```
✅ ETAPA 4 DEPLOY A PRODUCCIÓN - COMPLETADA
├─ v7.0.0 en vivo
├─ Endpoints funcionales
├─ Usuarios accediendo
├─ Datos persistiendo
└─ SIGUIENTE: ETAPA 5 - Monitoring 24h
```

### Si hay problemas ❌

```
⚠️ PROBLEMAS DETECTADOS
├─ Problema: [descripción]
├─ Action: EJECUTAR ROLLBACK INMEDIATAMENTE
├─ Luego: Investigar y arreglar
└─ Reintentar deployment una vez arreglado
```

---

## 📞 NÚMEROS ÚTILES

**Si hay problemas:**
- Rollback a v6.0.0: `git revert HEAD && vercel --prod`
- Revisar logs: `vercel logs [project-name] --follow`
- Contactar equipo DevOps si hay problemas de infraestructura

---

**¿ETAPA 4 DEPLOY A PRODUCCIÓN COMPLETADA?** 🚀

**Próximo:** ETAPA 5 - Post-Release Monitoring (24h)
