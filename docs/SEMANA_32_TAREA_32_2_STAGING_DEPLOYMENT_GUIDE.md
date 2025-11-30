# 🚀 SEMANA 32 TAREA 32.2: STAGING DEPLOYMENT - GUÍA COMPLETA

**Versión:** v6.0.0
**Fecha:** 29 Noviembre 2025
**Objetivo:** Deploy a Vercel staging environment + validación
**Tiempo Estimado:** 6 horas (incluye validación completa)

---

## 📋 PRE-REQUISITOS

### ✅ Verificar Antes de Comenzar

- [ ] Git commit `1eba2f2` pusheado a GitHub ✅
- [ ] Git tag `v6.0.0` creado y pusheado ✅
- [ ] `package.json` con version 6.0.0 ✅
- [ ] `RELEASE-NOTES.md` creado ✅
- [ ] Node.js 16+ instalado (`node --version`)
- [ ] Vercel CLI instalado (`vercel --version`)
- [ ] Acceso a Vercel (credenciales listas)
- [ ] Environment variables preparadas

### Verificar Repo Local

```bash
# 1. Verificar que estás en main branch
git branch

# 2. Verificar que el commit está en GitHub
git log --oneline | head -5

# 3. Verificar que el tag existe
git tag -l v6.0.0
```

---

## 🔐 STEP 1: PREPARAR ENVIRONMENT VARIABLES PARA STAGING

### Archivo: `.env.staging`

Crea un nuevo archivo `.env.staging` en la raíz del proyecto con las variables staging:

```bash
# Backend Configuration
NODE_ENV=staging
PORT=3000

# Database (STAGING - Neon)
DATABASE_URL=postgresql://[username]:[password]@[neon-host]/[staging-db]
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000

# JWT & Security
JWT_SECRET=[use-strong-random-secret-32-chars]
SESSION_SECRET=[use-strong-random-secret-32-chars]

# Redis (opcional, pero recomendado para staging)
REDIS_ENABLED=true
REDIS_URL=redis://[staging-redis-url]

# Email Service (staging - puedes usar SendGrid sandbox)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=[sendgrid-api-key]
SMTP_FROM=noreply-staging@bge.edu.mx

# Google OAuth (staging)
GOOGLE_CLIENT_ID=[staging-client-id]
GOOGLE_CLIENT_SECRET=[staging-client-secret]
GOOGLE_CALLBACK_URL=https://staging-bge.vercel.app/api/auth/google/callback

# Logging
LOG_LEVEL=info
SENTRY_DSN=[staging-sentry-dsn-optional]

# Feature Flags
FEATURE_OAUTH2=true
FEATURE_REDIS_CACHE=true
FEATURE_RATE_LIMITING=true

# API Configuration
API_BASE_URL=https://staging-bge.vercel.app
API_TIMEOUT=30000

# CORS (staging)
CORS_ORIGIN=https://staging-bge.vercel.app,http://localhost:3000

# CSP Headers
CSP_REPORT_URI=https://staging-bge.vercel.app/api/csp-report
```

### Generar Secrets Seguros

```bash
# Ejecutar en PowerShell para generar secrets aleatorios
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copiar el output de arriba como JWT_SECRET y SESSION_SECRET**

---

## 📦 STEP 2: PREPARAR PROYECTO PARA VERCEL

### Verificar `vercel.json`

El archivo `vercel.json` debe estar configurado. Si no existe, crear:

**Crear:** `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "framework": "express",
  "regions": ["sfo1"],
  "env": {
    "NODE_ENV": "staging",
    "DATABASE_URL": "@database-url-staging",
    "JWT_SECRET": "@jwt-secret-staging",
    "SESSION_SECRET": "@session-secret-staging"
  },
  "builds": [
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/server.js"
    },
    {
      "src": "/public/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Verificar `package.json`

```bash
# Asegurar que tiene estos scripts
cat package.json | grep -A 5 '"scripts"'

# Debe incluir:
# "start": "cd backend && npm start"
# "build": "echo 'Skipping webpack build for API deployment' || true"
```

### Verificar Backend Configuration

**Archivo:** `backend/server.js`

Debe incluir:
- ✅ `app.set('trust proxy', 1)` (para Vercel reverse proxy)
- ✅ CORS configurado
- ✅ CSP headers configurados
- ✅ Error handling completo

```bash
# Buscar trust proxy
grep -n "trust proxy" backend/server.js

# Debe estar presente. Si no:
# Agregar después de "const app = express()"
# app.set('trust proxy', 1);
```

---

## 🔗 STEP 3: CONECTAR REPO A VERCEL

### Option A: Usando Vercel CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login en Vercel
vercel login

# 3. Desplegar a staging (no production)
vercel --prod=false

# El CLI preguntará:
# "Set up and deploy? [Y/n]" → Y
# "Which scope do you want to deploy to?" → Seleccionar tu account/team
# "Link to existing project? [y/N]" → Depende si ya existe
#   - Si es proyecto nuevo: N
#   - Si existe: y (seleccionar nombre del proyecto)
# "What is your project name?" → "bge-staging" o similar
# "In which directory is your code?" → . (punto)
```

### Option B: Usando Vercel Web Dashboard

1. Ir a https://vercel.com/dashboard
2. Click "Import Project"
3. Seleccionar "Import Git Repository"
4. Conectar tu GitHub repo (si no está conectado)
5. Seleccionar repo: `bachillerato-heroes-de-la-patria`
6. Configurar:
   - **Project Name:** `bge-staging`
   - **Framework Preset:** Node.js
   - **Root Directory:** `.` (current)
7. **Environment Variables:** Agregar manualmente:
   - DATABASE_URL (staging)
   - JWT_SECRET
   - SESSION_SECRET
   - REDIS_URL (si aplica)
   - SMTP_HOST, SMTP_USER, SMTP_PASS
   - etc.
8. Click "Deploy"

---

## 🔒 STEP 4: CONFIGURAR ENVIRONMENT VARIABLES EN VERCEL

### Método A: Vercel CLI

```bash
# 1. Listar variables actuales
vercel env ls

# 2. Agregar variable individual
vercel env add DATABASE_URL
# → Vercel preguntará el valor

# 3. Agregar todas las variables (recomendado)
# Para cada variable en .env.staging:
vercel env add [VARIABLE_NAME]
```

### Método B: Vercel Web Dashboard

1. Ir a https://vercel.com/dashboard
2. Seleccionar proyecto `bge-staging`
3. Click "Settings" → "Environment Variables"
4. Click "Add New"
5. Completar:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://...` (desde .env.staging)
   - **Environments:** Staging (si está disponible)
6. Click "Save"
7. Repetir para cada variable

### Variables Críticas (MÍNIMO)

```
DATABASE_URL         (PostgreSQL staging)
JWT_SECRET           (random 32-char)
SESSION_SECRET       (random 32-char)
NODE_ENV             staging
PORT                 3000
DB_POOL_MAX          20
REDIS_ENABLED        true (si tienes Redis)
API_BASE_URL         https://[staging-url].vercel.app
```

---

## ✅ STEP 5: EJECUTAR DEPLOYMENT

### Opción A: Vercel CLI (En Terminal)

```bash
# En directorio raíz del proyecto
cd C:\03_BachilleratoHeroesWeb

# Deploy a staging (no production)
vercel --prod=false

# Output esperado:
# ✓ Linked to vercel account
# ✓ Built successfully
# ✓ Deployed to staging: https://bge-staging.vercel.app
```

### Opción B: Vercel Dashboard

1. Ir a https://vercel.com/dashboard/bge-staging
2. Click "Deployments" tab
3. Última deployment mostrará estado:
   - 🟡 Building...
   - 🟢 Ready (deployment completado)
   - 🔴 Failed (revisar logs)

### Monitorear Build en Vivo

```bash
# En terminal, seguir logs
vercel logs --follow

# O en dashboard:
# https://vercel.com/dashboard/[project]/deployments
```

---

## 🔍 STEP 6: VALIDACIÓN POST-DEPLOYMENT

### 1. Verificar Deployment Status

```bash
# Health check endpoint
curl -i https://bge-staging.vercel.app/api/health

# Esperado:
# HTTP/1.1 200 OK
# Content-Type: application/json
#
# {
#   "status": "ok",
#   "version": "6.0.0",
#   "timestamp": "2025-11-29T..."
# }
```

### 2. Validar Endpoints Críticos

**API Endpoints a Validar:**

```bash
# 1. Health Check
curl https://bge-staging.vercel.app/api/health

# 2. Config (público)
curl https://bge-staging.vercel.app/api/config/public-keys

# 3. Students (requiere auth - será 401 sin token)
curl https://bge-staging.vercel.app/api/students
# Esperado: 401 Unauthorized (es correcto - requiere token)

# 4. Frontend (debe cargar index.html)
curl -I https://bge-staging.vercel.app/
# Esperado: HTTP/1.1 200 OK
```

### 3. Verificar Frontend Assets

**En navegador (Chrome DevTools):**

```
1. Ir a https://bge-staging.vercel.app
2. Abrir DevTools (F12)
3. Tab "Network":
   ✅ index.html: 200 OK
   ✅ main.js: 200 OK
   ✅ bootstrap.css: 200 OK
   ✅ favicon.ico: 200 OK (o 404 si no existe)
4. Tab "Console":
   ⚠️ Revisar que no hay errores críticos (warnings OK)
   ⚠️ Revisar que [MAIN.JS] logs aparecen
5. Tab "Application":
   ✅ Service Worker: registrado (si PWA activo)
   ✅ Local Storage: vacío o con datos esperados
```

### 4. Validar CSP Headers

```bash
# Verificar headers de seguridad
curl -I https://bge-staging.vercel.app

# Debe incluir:
# content-security-policy: script-src 'self'...
# strict-transport-security: max-age=31536000...
# x-content-type-options: nosniff
# x-frame-options: SAMEORIGIN
```

### 5. Validar HTTPS/TLS

```bash
# Verificar certificado SSL
openssl s_client -connect bge-staging.vercel.app:443 -servername bge-staging.vercel.app

# O usar online tool:
# https://www.ssllabs.com/ssltest/analyze.html?d=bge-staging.vercel.app
```

---

## 🧪 STEP 7: SMOKE TESTS (BASIC)

### Test 1: Load Homepage

```bash
# Load page en navegador
https://bge-staging.vercel.app

# Verificar:
✅ Página carga sin errores 404
✅ Header y footer cargan dinámicamente
✅ CSS se aplica correctamente
✅ No hay errores críticos en console
✅ Logo BGE visible
```

### Test 2: Navigation

```
Navegar por links principales:
✅ Home → index.html carga
✅ Admin Dashboard → admin-dashboard.html carga (sin auth = redirect)
✅ Estudiantes → estudiantes.html carga
✅ Padres → padres.html carga
✅ Docentes → docentes.html carga
```

### Test 3: Authentication Flow

```bash
# 1. Ir a home page
https://bge-staging.vercel.app

# 2. Buscar botón "Login"
# 3. Click en "Login"
# 4. Modal de login debe aparecer
# 5. Intentar login (puede fallar por DB, es OK)
# 6. Error debe ser amable, no crash

Verificar:
✅ Modal aparece
✅ Campos de email/password visibles
✅ Google OAuth button visible
✅ Errores mostrados como mensajes, no crashes
```

### Test 4: API Endpoint Test

```bash
# Test endpoint /api/config/tenant
curl -X GET https://bge-staging.vercel.app/api/config/tenant \
  -H "Content-Type: application/json"

# Esperado:
# 200 OK con JSON
# O 404 si endpoint no existe
# No debe ser 500 Internal Server Error
```

---

## 📊 STEP 8: DOCUMENTAR RESULTADOS

### Template de Validación

Crear archivo: `docs/SEMANA_32_TAREA_32_2_VALIDATION_RESULTS.md`

```markdown
# STAGING DEPLOYMENT VALIDATION RESULTS

**Date:** [Today]
**Deployment URL:** https://bge-staging.vercel.app
**Version:** 6.0.0
**Status:** [PASS / FAIL]

## Health Checks

- [ ] Health endpoint: ✅ 200 OK
- [ ] Config endpoint: ✅ 200 OK
- [ ] Frontend loads: ✅ 200 OK
- [ ] No 500 errors: ✅ Verified

## Frontend Validation

- [ ] Home page loads
- [ ] Header/Footer dynamic load
- [ ] Navigation works
- [ ] No critical errors in console
- [ ] CSS applies correctly

## API Validation

- [ ] GET /api/health: 200 OK
- [ ] GET /api/config/public-keys: 200 OK
- [ ] GET /api/config/tenant: 200 OK
- [ ] API endpoints accessible

## Security Validation

- [ ] HTTPS/TLS active
- [ ] CSP headers set
- [ ] HSTS enabled
- [ ] CORS configured

## Performance Checks

- [ ] Page load time: < 3 seconds
- [ ] No 404 for critical assets
- [ ] No console errors (warnings OK)

## Issues Found

[List any issues or blockers]

## Recommendation

✅ PASS - Ready for TAREA 32.3 (UAT)
OR
❌ FAIL - Needs fixes before UAT
```

---

## 🚨 TROUBLESHOOTING

### Error: "Module not found: ./src"

**Causa:** Webpack intenta bundlear en Vercel
**Solución:**
```bash
# Verificar vercel.json tiene buildCommand correcto
cat vercel.json | grep buildCommand

# Debe ser:
# "buildCommand": "npm run build"

# Y package.json debe tener:
# "build": "echo 'Skipping webpack...' || true"
```

### Error: "Cannot connect to database"

**Causa:** DATABASE_URL incorrecta o Neon inaccesible
**Solución:**
1. Verificar DATABASE_URL en Vercel settings
2. Verificar que Neon db está activa
3. Verificar que Vercel IP está whitelisted en Neon
4. Usar `vercel env pull` para descargar variables y debuggear

### Error: "CORS blocked"

**Causa:** Frontend intenta llamar API en dominio diferente
**Solución:**
```bash
# Verificar CORS en backend/server.js
grep -n "cors" backend/server.js

# Debe incluir:
# app.use(cors({
#   origin: process.env.CORS_ORIGIN,
#   credentials: true
# }));

# Y .env.staging debe tener:
# CORS_ORIGIN=https://bge-staging.vercel.app,http://localhost:3000
```

### Error: "Cannot find main.js"

**Causa:** Script no se carga dinámicamente
**Solución:**
1. Verificar que main.js existe en `public/js/main.js`
2. Verificar que index.html carga main.js correctamente
3. En DevTools, Tab Network, buscar main.js
4. Si 404: archivo no subió a Vercel

### Deployment Stuck at "Building"

**Causa:** Build tardando más de lo normal o infinite loop
**Solución:**
```bash
# Cancelar deployment en Vercel dashboard
# Click "..." → "Cancel"

# O:
vercel cancel

# Luego reintentar:
vercel --prod=false
```

---

## 📋 CHECKLIST FINAL

### Antes de Deployment

- [ ] Version bumped to 6.0.0
- [ ] Git commit `1eba2f2` pusheado
- [ ] Git tag `v6.0.0` creado
- [ ] `.env.staging` preparado localmente
- [ ] `vercel.json` configurado
- [ ] Environment variables listas

### Durante Deployment

- [ ] `vercel --prod=false` ejecutado
- [ ] Build completó sin errores
- [ ] Deployment URL visible
- [ ] No hay errors 500 en logs

### Post-Deployment

- [ ] Health endpoint responde 200 OK
- [ ] Frontend carga sin errores
- [ ] CSS se aplica correctamente
- [ ] No hay 404 para assets críticos
- [ ] Smoke tests pasados
- [ ] Documentación de validación creada
- [ ] Listo para TAREA 32.3 (UAT)

---

## 🔗 REFERENCIAS ÚTILES

**Vercel Docs:**
- https://vercel.com/docs/concepts/deployments/overview
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/functions/serverless-functions

**Node.js + Express en Vercel:**
- https://vercel.com/guides/using-express-with-vercel
- https://vercel.com/docs/runtimes/node-js

**Security Headers:**
- https://securityheaders.com/
- https://mdn.io/security-headers

---

## ✅ PRÓXIMOS PASOS

Una vez deployment completado y validado:

1. ✅ Documentar resultados (archivo de validación)
2. ✅ Revisar logs en Vercel dashboard
3. ✅ Proceder a **TAREA 32.3: UAT & Smoke Tests** (6h)
4. ✅ Luego: **TAREA 32.4: Production Deployment** (12h)

---

**Documento creado por:** Claude Code
**Fecha:** 29 Noviembre 2025
**Versión:** v6.0.0
**Tiempo Estimado:** 6 horas (deploy + validación)

**Siguiente:** TAREA 32.3 - UAT & Smoke Tests

