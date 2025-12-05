# 🚀 ETAPA 1: DEPLOYMENT A STAGING (Vercel)

**Fecha:** 4 de Diciembre, 2025
**Versión:** v7.0.0
**Objetivo:** Deployar a staging (environment de pruebas)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Verificar Build Readiness

```bash
# ✅ Validar sintaxis Node.js
cd C:\03_BachilleratoHeroesWeb
node -c backend/server.js
node -c api/index.js

# Esperado: ✅ VÁLIDO en ambos archivos
```

**Status:** ✅ COMPLETADO
- ✅ backend/server.js - SINTAXIS VÁLIDA
- ✅ api/index.js - SINTAXIS VÁLIDA

### 2. Verificar Dependencias

```bash
npm list --depth=0 | head -20
```

**Status:** ⏳ Ejecutable

### 3. Verificar Versión

```bash
cat package.json | grep '"version"'
```

**Status:** ✅ COMPLETADO
- Versión actualizada de 6.0.0 → **7.0.0**

---

## 📝 PASOS DE DEPLOYMENT

### PASO 1: Crear Git Tag v7.0.0

```bash
git tag -a v7.0.0 -m "Release v7.0.0: Arquitectura DAO Completamente Validada"
git push origin v7.0.0
```

**Verificación:**
```bash
git tag -l | grep v7.0.0
```

**Status:** ⏳ Pendiente

---

### PASO 2: Commit de Version Bump

```bash
git add package.json
git commit -m "chore(release): Bump version 6.0.0 → 7.0.0 for staging deployment"
git push origin main
```

**Status:** ⏳ Pendiente

---

### PASO 3: Configurar Variables de Entorno para Staging

En Vercel Console:
1. Ir a Settings → Environment Variables
2. Agregar/actualizar las siguientes variables para **Staging**:

```
DATABASE_URL=postgresql://user:pass@neon-staging.neondb.io/bge_staging
API_URL=https://bge-staging.vercel.app
FRONTEND_URL=https://bge-staging.vercel.app
NODE_ENV=production
JWT_SECRET=[tu-secret-aquí]
SESSION_SECRET=[tu-secret-aquí]
TINYMCE_API_KEY=[tu-api-key-aquí]
GOOGLE_CLIENT_ID=[tu-client-id-aquí]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[email@gmail.com]
SMTP_PASS=[tu-app-password-aquí]
```

**Status:** ⏳ Pendiente (ejecutar en Vercel Console)

---

### PASO 4: Deploy a Vercel Staging

#### Opción A: Usando CLI de Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI si no lo tienes
npm i -g vercel

# 2. Autenticarse
vercel login

# 3. Deploy a staging (NO producción)
vercel --prod
```

**Nota:** El flag `--prod` es necesario pero NO afecta la production environment si Vercel está configurado correctamente para detectar staging.

#### Opción B: Usando GitHub (Si tienes workflow configurado)

```bash
# Push a rama de staging trigger automático
git checkout -b staging/v7.0.0
git push origin staging/v7.0.0
```

**Status:** ⏳ Pendiente (usuario elige opción)

---

### PASO 5: Validar Deploy Completado

Después de que Vercel complete el deployment:

```bash
# 1. Verificar que deployment completó sin errores
# Acceder a: https://vercel.com/dashboard

# 2. Verificar health endpoint
curl https://bge-staging.vercel.app/api/health

# Esperado:
# {
#   "status": "healthy",
#   "version": "7.0.0",
#   "timestamp": "2025-12-04T...",
#   "uptime": 123.45
# }

# 3. Verificar logs
vercel logs bge-staging --follow
```

**Status:** ⏳ Pendiente (ejecutar después de deployment)

---

## 📊 DEPLOYMENT CHECKLIST

| Paso | Tarea | Status |
|------|-------|--------|
| 1 | Validar sintaxis | ✅ Completado |
| 2 | Verificar versión | ✅ Actualizado a 7.0.0 |
| 3 | Crear Git tag | ⏳ Pendiente |
| 4 | Commit version | ⏳ Pendiente |
| 5 | Configurar .env | ⏳ Pendiente |
| 6 | Deploy a Vercel | ⏳ Pendiente |
| 7 | Validar health endpoint | ⏳ Pendiente |
| 8 | Verificar logs | ⏳ Pendiente |

---

## ✅ VALIDACIÓN POST-DEPLOYMENT

Una vez que el deployment se complete, ejecutar estos tests:

### Test 1: Health Check
```bash
curl -s https://bge-staging.vercel.app/api/health | jq .
# Status: 200 OK
# Body: { "status": "healthy", "version": "7.0.0" }
```

### Test 2: Endpoint Académico
```bash
curl -s https://bge-staging.vercel.app/api/students | jq .
# Status: 200 OK
# Body: Array de estudiantes
```

### Test 3: Endpoint de Configuración
```bash
curl -s https://bge-staging.vercel.app/api/config/tenant | jq .
# Status: 200 OK
# Body: Configuración del tenant
```

### Test 4: Verificar Logs Sin Errores
```bash
vercel logs bge-staging --limit=50 | grep -i "error"
# Esperado: Sin errores críticos
```

---

## 🚨 TROUBLESHOOTING

### Error: "Build failed"
- **Causa:** Dependencias no instaladas o error de sintaxis
- **Solución:**
  ```bash
  npm install
  npm run build
  ```

### Error: "Database connection failed"
- **Causa:** DATABASE_URL no es válida
- **Solución:**
  1. Verificar que Neon está accesible
  2. Confirmar DATABASE_URL en Vercel Environment Variables
  3. Ejecutar test de conexión: `psql $DATABASE_URL -c "SELECT 1"`

### Error: "Cannot find module"
- **Causa:** Dependencia faltante
- **Solución:**
  ```bash
  npm install [package-name]
  npm run build
  vercel --prod
  ```

---

## 📋 PRÓXIMOS PASOS

Una vez que ETAPA 1 (Deployment a Staging) esté completada y validada:

1. **ETAPA 2:** Testing en Ambiente Real (Neon PostgreSQL)
   - Conectar a BD staging
   - Ejecutar smoke tests
   - Validar que datos se persisten

2. **ETAPA 3:** Smoke Tests y Validación
   - Ejecutar suite de 15 smoke tests
   - Validar endpoints críticos
   - Confirmación de no-regresiones

3. **ETAPA 4:** Decisión de Release
   - Review de criterios de éxito
   - Aprobación para producción

4. **ETAPA 5:** Deploy a Producción
   - Deployment a Vercel production
   - Validation de endpoints

5. **ETAPA 6:** Post-Release Monitoring (24h)
   - Monitoreo en tiempo real
   - Respuesta a incidentes

---

## 📞 SOPORTE

Si encuentras problemas durante el deployment:

1. **Revisar logs de Vercel:** `vercel logs [project-name] --follow`
2. **Ejecutar localmente:** `npm run dev` para validar en local
3. **Consultar documentación:** `docs/FASE3_RELEASE_PREPARATION_PLAN.md`
4. **Contactar equipo DevOps:** Si hay problemas de infraestructura

---

**¿LISTO PARA EJECUTAR ETAPA 1?** 🚀

**Próximo Comando:** Crear Git tag v7.0.0 y hacer commit de version bump
