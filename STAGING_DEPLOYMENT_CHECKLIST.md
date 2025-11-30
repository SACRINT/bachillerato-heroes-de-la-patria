# ☑️ STAGING DEPLOYMENT CHECKLIST - v6.0.0

**Versión:** v6.0.0
**Fecha:** 29 Noviembre 2025
**Objetivo:** Validar que todo está listo para deploy a Vercel staging
**Duración:** 30 minutos

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Fase 1: Git & Versioning (5 min)

- [ ] **Git Status:** `git status` muestra "nothing to commit"
- [ ] **Git Branch:** `git branch` muestra `* main`
- [ ] **Git Log:** `git log --oneline | head -1` muestra `feat(release): Version Bump to v6.0.0`
- [ ] **Git Tag:** `git tag -l v6.0.0` muestra `v6.0.0`
- [ ] **package.json:** Versión es `6.0.0` (no 1.0.1)
- [ ] **RELEASE-NOTES.md:** Archivo existe con contenido completo
- [ ] **GitHub Push:** Commit y tag pusheados a origin/main

**Status:**
- [ ] ✅ Todos los items cumplidos → Proceder a Fase 2
- [ ] ❌ Algún item falta → Revisar y corregir

---

### Fase 2: Environment Setup (5 min)

- [ ] **`.env.staging` creado:** Archivo existe en raíz del proyecto
- [ ] **DATABASE_URL:** Variable configurada con PostgreSQL staging
- [ ] **JWT_SECRET:** Generado y aleatorio (32+ caracteres)
- [ ] **SESSION_SECRET:** Generado y aleatorio (32+ caracteres)
- [ ] **NODE_ENV:** Set a `staging`
- [ ] **API_BASE_URL:** Set a `https://bge-staging.vercel.app` (o tu dominio staging)
- [ ] **CORS_ORIGIN:** Incluye dominio staging y localhost:3000
- [ ] **DB_POOL_MAX:** Set a `20` (para mejor performance)
- [ ] **REDIS_ENABLED:** Set a `true` (si tienes Redis disponible)

**Status:**
- [ ] ✅ Todas las variables configuradas → Proceder a Fase 3
- [ ] ❌ Variables faltantes → Completar en .env.staging

---

### Fase 3: Dependencies & Tools (5 min)

- [ ] **Node.js:** `node --version` muestra versión 16+ (recomendado 18+)
- [ ] **npm:** `npm --version` funciona correctamente
- [ ] **Vercel CLI:** `vercel --version` instalado y funciona
- [ ] **Git:** `git --version` funciona correctamente
- [ ] **Backend Dependencies:** `backend/package.json` tiene todas las deps necesarias
- [ ] **No warnings en npm:** `npm audit --production` sin issues críticos
- [ ] **Build Script:** `npm run build` no falla

**Verificar:**
```bash
node --version
npm --version
vercel --version
git --version
npm audit --production
npm run build
```

**Status:**
- [ ] ✅ Todas las tools están listas → Proceder a Fase 4
- [ ] ❌ Algo falta → Instalar o corregir

---

### Fase 4: Project Configuration (5 min)

- [ ] **`vercel.json` existe:** Archivo de configuración presente
- [ ] **`vercel.json` válido:** JSON sin errores de sintaxis
- [ ] **buildCommand correcto:** `"npm run build"` o similar
- [ ] **backend/server.js:** Existe y contiene `app.set('trust proxy', 1)`
- [ ] **CORS configurado:** En backend/server.js
- [ ] **CSP headers:** Configurados correctamente
- [ ] **Port binding:** Usa `process.env.PORT || 3000`
- [ ] **Error handling:** Implementado en rutas principales

**Verificar:**
```bash
# Validar vercel.json
cat vercel.json | findstr buildCommand

# Validar trust proxy
grep -n "trust proxy" backend/server.js

# Validar CORS
grep -n "cors" backend/server.js
```

**Status:**
- [ ] ✅ Configuración correcta → Proceder a Fase 5
- [ ] ❌ Issues encontrados → Corregir archivos

---

### Fase 5: Frontend Assets (5 min)

- [ ] **`public/index.html` existe:** Archivo principal presente
- [ ] **`public/js/main.js` existe:** Script principal de carga dinámica
- [ ] **Bootstrap CSS:** Referencia correcta (CDN o local)
- [ ] **main.js en index.html:** Cargado correctamente
- [ ] **HTML válido:** Sin errores de sintaxis (verifica en navegador local)
- [ ] **CSS linkeado:** Todos los archivos CSS presentes
- [ ] **No hardcoded localhost:** Ningún archivo tiene `localhost:3000`
- [ ] **API calls usan rutas relativas:** `/api/...` no `http://localhost:3000/api/...`

**Verificar:**
```bash
# Buscar localhost hardcodeado
grep -r "localhost:3000" public/js/ backend/

# Debe retornar: (ningún resultado o pocos)
```

**Status:**
- [ ] ✅ Frontend listo → Proceder a Fase 6
- [ ] ❌ Issues encontrados → Corregir

---

### Fase 6: Database Readiness (5 min)

- [ ] **PostgreSQL (Neon):** Database staging accesible
- [ ] **Tablas existentes:** Todas las tablas necesarias creadas
- [ ] **Índices:** 28+ índices aplicados en Neon
- [ ] **Connection Pool:** Neon configurado con min 10, max 20 conexiones
- [ ] **Credenciales correctas:** DATABASE_URL funciona
- [ ] **Neon whitelist:** Vercel IPs whitelisted (si aplica)
- [ ] **Test conexión:**

```bash
# Test connection (opcional)
psql [DATABASE_URL] -c "SELECT version();"
```

**Status:**
- [ ] ✅ Database listo → Proceder a Fase 7
- [ ] ❌ Database issues → Revisar Neon dashboard

---

### Fase 7: Security Validation (5 min)

- [ ] **No secrets en código:** Grep por AWS_KEY, STRIPE_KEY, etc.
- [ ] **Env vars no hardcodeadas:** Todos los secrets en variables
- [ ] **HTTPS ready:** Vercel soporta HTTPS automáticamente
- [ ] **CSP headers:** Configurados (no unsafe-inline innecesario)
- [ ] **CORS whitelist:** Restrictivo (no wildcard * excepto desarrollo)
- [ ] **JWT validation:** Backend verifica tokens correctamente
- [ ] **Password hashing:** bcrypt o similar (no plaintext)

**Verificar:**
```bash
# Buscar secrets
grep -r "password\|secret\|key\|token" backend/ | grep -i "=\|:" | grep -v ".env"

# No debe mostrar valores reales
```

**Status:**
- [ ] ✅ Seguridad validada → Proceder a Deployment
- [ ] ❌ Issues de seguridad → Corregir antes de deploy

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment Final (antes de `vercel --prod=false`)

- [ ] **Todos los checklist arriba:** 100% completados
- [ ] **Última revisión de package.json:** version = 6.0.0
- [ ] **Git push completado:** Todos los cambios en GitHub
- [ ] **.env.staging guardado:** Con valores correctos
- [ ] **Terminal en directorio correcto:** `C:\03_BachilleratoHeroesWeb`
- [ ] **Vercel CLI logueado:** `vercel login` ya ejecutado
- [ ] **Network conectado:** Internet estable

**Final Verification:**
```bash
# Cambiar a directorio correcto
cd C:\03_BachilleratoHeroesWeb

# Verificar branch
git branch

# Verificar version
cat package.json | findstr version

# Verificar .env.staging
ls .env.staging

# Listo
echo "✅ Listo para deploy"
```

---

### Durante Deployment

- [ ] **Comando ejecutado:** `vercel --prod=false`
- [ ] **No errores de sintaxis:** Build no falla
- [ ] **Respuestas a prompts:** Contestadas correctamente
  - [ ] "Set up and deploy?" → Y
  - [ ] "Which scope?" → Seleccionado correctamente
  - [ ] "Link to existing project?" → Sí/No según corresponda
  - [ ] "Project name?" → bge-staging
  - [ ] "Root directory?" → . (punto)

- [ ] **Build completado:** Sin errores rojos en output
- [ ] **Deployment URL visible:** Se ve URL como `https://bge-staging.vercel.app`
- [ ] **Status "Ready":** En dashboard muestra ✅ Ready

---

## ✓ POST-DEPLOYMENT CHECKLIST

### Immediate Validations (después de deployment)

- [ ] **Vercel Dashboard:** Deployment status es "Ready" ✅
- [ ] **URL accesible:** `https://bge-staging.vercel.app` abre en navegador
- [ ] **Health endpoint:** `curl https://bge-staging.vercel.app/api/health` responde 200 OK
- [ ] **Frontend carga:** Home page visible sin errores
- [ ] **Console limpia:** F12 → Console sin errores críticos
- [ ] **Network requests:** Todos los assets son 200 OK (no 404)
- [ ] **CSS aplicado:** Página se ve correctamente formateada
- [ ] **No 500 errors:** Backend no crashea en logs

---

### Validations (10 minutos después)

- [ ] **Header/Footer:** Se cargan dinámicamente correctamente
- [ ] **Navigation:** Links funcionan (no siempre cargan, pero no 404)
- [ ] **Form rendering:** Formularios se ven correctamente
- [ ] **API endpoints:** GET /api/config responde
- [ ] **CORS:** Sin errores de CORS en console
- [ ] **Logs:** [MAIN.JS] logs aparecen en console

---

### Documentation (Actualizar)

- [ ] **Documento creado:** `docs/SEMANA_32_TAREA_32_2_VALIDATION_RESULTS.md`
- [ ] **URL documentada:** https://bge-staging.vercel.app
- [ ] **Issues documentados:** Cualquier problema encontrado
- [ ] **Status actual:** PASS o FAIL
- [ ] **Próximos pasos:** Claro

**Template:**
```markdown
# STAGING VALIDATION RESULTS

Date: [Today]
URL: https://bge-staging.vercel.app
Status: ✅ PASS

## Results
- [x] Health endpoint: 200 OK
- [x] Frontend loads: OK
- [x] No critical errors: OK
- [x] Ready for TAREA 32.3

## Issues
None found.

## Next Steps
Proceder a TAREA 32.3 - UAT & Smoke Tests
```

---

## 🎯 CRITERIOS DE ÉXITO

### ✅ Deployment Exitoso Si:

1. ✅ `vercel --prod=false` completó sin errores
2. ✅ Vercel dashboard muestra "Ready"
3. ✅ URL staging accesible en navegador
4. ✅ Health endpoint: 200 OK
5. ✅ Frontend carga sin errores críticos
6. ✅ No hay 500 errors en logs
7. ✅ Documentación actualizada

### ❌ Deployment Falló Si:

1. ❌ Build error en Vercel (revisar logs)
2. ❌ 502/503 errors al acceder URL
3. ❌ Health endpoint: timeout o error
4. ❌ Frontend muestra 404 o blank page
5. ❌ Console tiene errores críticos rojos
6. ❌ Database connection refused

---

## 📞 TROUBLESHOOTING

### Si Build Falla:

```bash
# 1. Revisar logs en Vercel dashboard
# https://vercel.com/dashboard/bge-staging/deployments

# 2. Verificar vercel.json syntax
cat vercel.json

# 3. Verificar package.json scripts
cat package.json | findstr "scripts" -A 10

# 4. Reintentar deploy
vercel --prod=false
```

### Si API No Responde:

```bash
# 1. Verificar DATABASE_URL en Vercel settings
# https://vercel.com/dashboard/bge-staging/settings/environment-variables

# 2. Verificar logs en vivo
vercel logs --follow

# 3. Verificar backend/server.js existe
ls backend/server.js
```

### Si Frontend Se Ve Roto:

```bash
# 1. Abrir DevTools (F12)
# 2. Network tab → buscar CSS/JS arquivos
# 3. Verificar que todos son 200 OK (no 404)
# 4. Si 404: asset no subió a Vercel
```

---

## 📋 SIGN-OFF

**Checklist Completado por:** [Your Name]
**Date:** [Today]
**Time:** [HH:MM]

**Status:**
- [ ] ✅ Todos los items arriba cumplidos → Deployment exitoso
- [ ] ❌ Algunos items no cumplidos → Revisar y corregir

**Siguiente Tarea:** TAREA 32.3 - UAT & Smoke Tests

---

**Documento creado por:** Claude Code
**Versión:** v6.0.0
**Fecha:** 29 Noviembre 2025

