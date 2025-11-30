# ⚡ QUICK START - STAGING DEPLOYMENT v6.0.0

**Tiempo:** ~30 minutos (sin contar build time de Vercel)
**Versión:** v6.0.0
**Target:** https://bge-staging.vercel.app

---

## 🚀 PASO 1: PREPARAR ENVIRONMENT (5 min)

### Crear `.env.staging`

```bash
# En PowerShell, abrir archivo:
notepad .env.staging
```

**Contenido mínimo:**
```
NODE_ENV=staging
DATABASE_URL=postgresql://[user]:[pass]@[host]/[db]
JWT_SECRET=generate-random-secret-here
SESSION_SECRET=generate-random-secret-here
API_BASE_URL=https://bge-staging.vercel.app
CORS_ORIGIN=https://bge-staging.vercel.app,http://localhost:3000
```

### Generar Secrets Aleatorios

```bash
# En PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiar output → pegar en JWT_SECRET y SESSION_SECRET

---

## ✅ PASO 2: VERIFICAR PRE-REQUISITOS (5 min)

```bash
# Git status
git status
# Debe mostrar "On branch main" y "nothing to commit"

# Git tag
git tag -l v6.0.0
# Debe mostrar: v6.0.0

# Vercel CLI
vercel --version
# Debe mostrar versión (si no: npm install -g vercel)

# package.json
cat package.json | findstr "version"
# Debe mostrar: "version": "6.0.0"
```

---

## 🚀 PASO 3: DEPLOY A STAGING (10 min)

### Opción A: Vercel CLI (Recomendado)

```bash
# Instalar/actualizar Vercel CLI
npm install -g vercel

# Login en Vercel
vercel login

# Deploy a staging (NO production)
vercel --prod=false

# Responder a prompts:
# "Set up and deploy?" → Y
# "Which scope?" → Tu account
# "Link to existing project?" → Sí/No (si ya existe proyecto)
# "Project name?" → bge-staging
# "Root directory?" → . (punto)
```

### Opción B: PowerShell Script (Más Fácil)

```bash
# Ejecutar script
.\deploy-to-vercel-staging.ps1

# Script hará todo automáticamente y te pedirá confirmar
```

### Opción C: Vercel Dashboard (Manual)

1. Ir a https://vercel.com/dashboard
2. Click "New Project" o "Import"
3. Seleccionar repo GitHub
4. Nombre: `bge-staging`
5. Agregar environment variables (desde .env.staging)
6. Click Deploy

---

## ✓ PASO 4: VALIDACIÓN RÁPIDA (10 min)

### Una vez Deploy esté "Ready":

**En navegador:**
```
Ir a: https://bge-staging.vercel.app
```

**Verificar:**
- [ ] Página carga sin errores
- [ ] Header y footer visibles
- [ ] CSS se aplica correctamente
- [ ] No hay errores 404 en console (F12)

**Health Check:**
```bash
# En PowerShell
curl https://bge-staging.vercel.app/api/health

# Debe responder:
# HTTP 200 OK con JSON
```

**Console Check:**
```bash
# F12 → Console tab
# Verificar:
✅ [MAIN.JS] logs aparecen
✅ Sin errores rojos (warnings amarillos OK)
✅ Network tab: archivos críticos son 200 OK
```

---

## 📊 PASO 5: DOCUMENTAR (5 min)

Crear archivo: `docs/SEMANA_32_TAREA_32_2_VALIDATION_RESULTS.md`

```markdown
# STAGING DEPLOYMENT VALIDATION - v6.0.0

Date: [Today]
URL: https://bge-staging.vercel.app
Status: ✅ PASS

## Validations

- [x] Page loads without errors
- [x] API health endpoint: 200 OK
- [x] Frontend assets: all 200 OK
- [x] No critical console errors
- [x] CSS applied correctly
- [x] Header/Footer dynamic load

## Ready for TAREA 32.3
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find module"

**Fix:**
```bash
# Verificar que backend/server.js existe
ls backend/server.js

# Si no, build falló. Revisar logs en Vercel dashboard
# https://vercel.com/dashboard/bge-staging/deployments
```

### Issue: "Database connection refused"

**Fix:**
```bash
# Verificar DATABASE_URL en Vercel settings
# Debe ser correcto y Neon debe estar activo
# Verificar que Vercel IP está whitelisted en Neon
```

### Issue: "CORS blocked"

**Fix:**
```bash
# En Vercel environment variables, verificar:
CORS_ORIGIN=https://bge-staging.vercel.app,http://localhost:3000
API_BASE_URL=https://bge-staging.vercel.app
```

### Issue: "Cannot GET /api/..."

**Fix:**
```bash
# Backend routes no se registraron
# Revisar backend/server.js y api/app.js
# Verificar que `app.use()` registra todas las rutas
```

---

## 📋 CHECKLIST FINAL

- [ ] `.env.staging` creado con variables correctas
- [ ] Git branch = main
- [ ] Git tag v6.0.0 existe
- [ ] Vercel CLI instalado
- [ ] Deploy ejecutado (`vercel --prod=false`)
- [ ] Vercel dashboard muestra "Ready"
- [ ] Health endpoint responde 200 OK
- [ ] Frontend carga sin errores
- [ ] Documentación validación creada
- [ ] Listo para TAREA 32.3 (UAT)

---

## 🔗 RECURSOS

**Documentación Detallada:**
- `docs/SEMANA_32_TAREA_32_2_STAGING_DEPLOYMENT_GUIDE.md` (completa)

**Scripts:**
- `deploy-to-vercel-staging.ps1` (automatizado)

**Vercel Docs:**
- https://vercel.com/docs

---

## ✅ PRÓXIMO PASO

Una vez staging esté validado:

**TAREA 32.3: UAT & Smoke Tests** (6 horas)
- Testing manual completo
- Validar todos los endpoints
- Verificar seguridad
- Sign-off para production

---

**Tiempo total TAREA 32.2:** ~30 minutos
**Tiempo esperado buildtime Vercel:** 5-10 minutos
**Total incluyendo build:** ~40 minutos

