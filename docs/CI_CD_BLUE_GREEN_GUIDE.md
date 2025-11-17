# 🚀 CI/CD BLUE-GREEN DEPLOYMENT GUIDE

**Versión:** 1.0.0
**Última Actualización:** 17 Noviembre 2025
**Responsable:** DevOps Team
**Estado:** ✅ PRODUCTION-READY

---

## 📋 ÍNDICE

1. [Introducción](#introducción)
2. [Arquitectura Blue-Green](#arquitectura-blue-green)
3. [Pipeline CI/CD](#pipeline-cicd)
4. [Configuración](#configuración)
5. [Flujo de Deployment](#flujo-de-deployment)
6. [Smoke Tests](#smoke-tests)
7. [Rollback Procedure](#rollback-procedure)
8. [Troubleshooting](#troubleshooting)
9. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 INTRODUCCIÓN

### Qué es Blue-Green Deployment

Blue-Green Deployment es una estrategia de deployment que **elimina downtime** durante releases al mantener dos ambientes de producción idénticos:

- **BLUE (Azul)**: Ambiente actualmente sirviendo tráfico de producción
- **GREEN (Verde)**: Nuevo ambiente con la versión actualizada, bajo test

```
┌────────────────────────────────────────────────────────────┐
│                 BLUE-GREEN DEPLOYMENT                      │
└────────────────────────────────────────────────────────────┘

ANTES DEL DEPLOYMENT:
┌─────────────┐         ┌─────────────┐
│    BLUE     │ ◀────── │   ROUTER    │ (100% tráfico)
│  (v1.2.3)   │         │             │
└─────────────┘         └─────────────┘
      ACTIVO

┌─────────────┐
│    GREEN    │
│   (idle)    │
└─────────────┘
      INACTIVO

DURANTE EL DEPLOYMENT:
┌─────────────┐         ┌─────────────┐
│    BLUE     │ ◀────── │   ROUTER    │ (100% tráfico)
│  (v1.2.3)   │         │             │
└─────────────┘         └─────────────┘
      ACTIVO

┌─────────────┐
│    GREEN    │ ◀───── Deploying v1.2.4
│  (v1.2.4)   │        Running smoke tests
└─────────────┘
      TESTING

DESPUÉS DEL DEPLOYMENT (SI TESTS PASAN):
┌─────────────┐
│    BLUE     │
│  (v1.2.3)   │
└─────────────┘
      STANDBY (24h)

┌─────────────┐         ┌─────────────┐
│    GREEN    │ ◀────── │   ROUTER    │ (100% tráfico)
│  (v1.2.4)   │         │             │
└─────────────┘         └─────────────┘
      ACTIVO ✅

SI TESTS FALLAN → ROLLBACK AUTOMÁTICO A BLUE
```

### Beneficios

✅ **Zero Downtime**: Traffic switch es instantáneo

✅ **Rollback Inmediato**: En caso de falla, volver a Blue toma segundos

✅ **Testing en Producción**: Green se prueba con datos reales antes del switch

✅ **Reducción de Riesgo**: Ambiente Blue queda como backup por 24 horas

---

## 🏗️ ARQUITECTURA BLUE-GREEN

### Componentes del Sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                      GITHUB ACTIONS PIPELINE                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STAGE 1: CODE QUALITY & TESTING       │
        ├─────────────────────────────────────────┤
        │  - ESLint                               │
        │  - Prettier                             │
        │  - Unit Tests (Jest)                    │
        │  - Integration Tests (with PostgreSQL)  │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STAGE 2: SECURITY SCANNING            │
        ├─────────────────────────────────────────┤
        │  - npm audit                            │
        │  - Gitleaks (secret detection)          │
        │  - Snyk (vulnerability scan)            │
        │  - OWASP Dependency Check               │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STAGE 3: BUILD & OPTIMIZATION         │
        ├─────────────────────────────────────────┤
        │  - npm run build                        │
        │  - Bundle size analysis                 │
        │  - Performance budget validation        │
        │  - Artifact upload                      │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STAGE 4: DEPLOYMENT (BLUE-GREEN)      │
        ├─────────────────────────────────────────┤
        │  1. Get current Blue deployment         │
        │  2. Deploy to Green environment         │
        │  3. Run smoke tests on Green            │
        │  4. IF PASS: Switch traffic to Green    │
        │     IF FAIL: Rollback to Blue           │
        └─────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   STAGE 5: POST-DEPLOYMENT VALIDATION   │
        ├─────────────────────────────────────────┤
        │  - E2E tests (Cypress)                  │
        │  - Lighthouse performance audit         │
        │  - Slack/Email notifications            │
        └─────────────────────────────────────────┘
```

### Environments

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| **Production (Blue)** | `main` | https://bge-heroes.vercel.app | Ambiente actual sirviendo tráfico |
| **Production (Green)** | `main` | https://bge-heroes-green.vercel.app | Nuevo deployment bajo test |
| **Staging** | `develop` | https://bge-heroes-staging.vercel.app | Testing pre-producción |
| **Local** | - | http://localhost:3000 | Desarrollo local |

---

## 🔧 PIPELINE CI/CD

### Workflow File

Ubicación: `.github/workflows/ci-cd-blue-green.yml`

### Triggers

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:  # Manual trigger
```

### Jobs Overview

| Job | Duración | Descripción |
|-----|----------|-------------|
| `lint-and-format` | ~2 min | ESLint + Prettier checks |
| `unit-tests` | ~3 min | Jest unit tests + coverage |
| `integration-tests` | ~5 min | Integration tests con PostgreSQL + Redis |
| `security-audit` | ~2 min | npm audit + Gitleaks + OWASP |
| `snyk-security` | ~2 min | Snyk vulnerability scan |
| `build` | ~3 min | Build production + bundle analysis |
| `deploy-staging` | ~5 min | Deploy a staging (si branch develop) |
| `deploy-production` | ~8 min | Blue-Green deployment (si branch main) |
| `post-deployment-tests` | ~5 min | E2E tests + Lighthouse audit |

**Total Pipeline Duration:** ~15-20 minutos (main branch) | ~10 minutos (develop branch)

---

## ⚙️ CONFIGURACIÓN

### GitHub Secrets Requeridos

Navega a: `Settings > Secrets and variables > Actions > New repository secret`

| Secret Name | Descripción | Ejemplo |
|-------------|-------------|---------|
| `VERCEL_TOKEN` | Token de Vercel para deployments | `xxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | Organization ID de Vercel | `team_xxxxxx` |
| `VERCEL_PROJECT_ID` | Project ID de Vercel | `prj_xxxxxx` |
| `SLACK_WEBHOOK_URL` | Webhook URL para notificaciones Slack | `https://hooks.slack.com/...` |
| `SNYK_TOKEN` | Token de Snyk (opcional) | `xxxxxxxxxxxx` |
| `DATABASE_URL` | URL de base de datos de producción | `postgres://...` |

### Cómo Obtener Vercel Tokens

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Get tokens
# - VERCEL_TOKEN: Settings > Tokens > Create Token
# - VERCEL_ORG_ID & PROJECT_ID: vercel.json (generado por vercel link)
```

### Configuración de Slack Notifications

```bash
# 1. Crear Incoming Webhook en Slack
# Slack > Apps > Incoming Webhooks > Add to Slack

# 2. Seleccionar canal (ej: #deployments)

# 3. Copiar Webhook URL y guardar en GitHub Secrets
```

### Permisos de GitHub Actions

Navega a: `Settings > Actions > General > Workflow permissions`

✅ Seleccionar: **Read and write permissions**

✅ Habilitar: **Allow GitHub Actions to create and approve pull requests**

---

## 🚀 FLUJO DE DEPLOYMENT

### Deployment a Staging (Branch: `develop`)

```bash
# 1. Create feature branch
git checkout -b feature/my-new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: Add new feature"

# 3. Push to develop
git push origin develop

# 4. GitHub Actions automáticamente:
#    - Run tests
#    - Security scan
#    - Deploy to Staging
#    - Run smoke tests

# 5. Verify staging deployment
curl https://bge-heroes-staging.vercel.app/api/health
```

### Deployment a Production (Branch: `main`)

```bash
# 1. Merge develop to main
git checkout main
git merge develop
git push origin main

# 2. GitHub Actions automáticamente ejecuta Blue-Green deployment:

# STEP 1: Get current Blue deployment
#   - Blue: https://bge-heroes.vercel.app (v1.2.3)

# STEP 2: Deploy to Green environment
#   - Build new version (v1.2.4)
#   - Deploy to Green: https://bge-heroes-green.vercel.app
#   - Wait 30s for DNS propagation

# STEP 3: Run smoke tests on Green
#   - Health check
#   - Database connectivity
#   - API endpoints
#   - Static assets
#   - Performance checks
#   - Security headers

# STEP 4A: IF TESTS PASS → Switch traffic to Green
#   - Promote Green to production
#   - Blue becomes standby
#   - Send success notification to Slack

# STEP 4B: IF TESTS FAIL → Rollback to Blue
#   - Keep Blue as production
#   - Delete Green deployment
#   - Send failure notification to Slack

# STEP 5: Post-deployment validation
#   - E2E tests
#   - Lighthouse audit
#   - Performance metrics
```

### Manual Deployment (Emergency)

```bash
# Si el pipeline automático falla, deployar manualmente:

# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy to production
vercel --prod

# 4. Run smoke tests manually
bash backend/scripts/smoke-tests.sh https://bge-heroes.vercel.app
```

---

## 🧪 SMOKE TESTS

### Qué son los Smoke Tests

Smoke tests son **pruebas rápidas (<3 min) que verifican funcionalidad crítica** después de un deployment.

**Objetivo:** Detectar fallos graves ANTES de switch traffic to Green.

### Tests Ejecutados

Archivo: `backend/scripts/smoke-tests.sh`

| Test | Descripción | Criterio de Éxito |
|------|-------------|-------------------|
| **Health Check** | `GET /api/health` | HTTP 200 + `status: "healthy"` |
| **Database** | Conexión a PostgreSQL vía API | `database.status: "healthy"` |
| **Homepage** | Carga de index.html | HTTP 200 |
| **Static Assets** | Carga de main.js, styles.css | HTTP 200 |
| **API Endpoints** | 10+ public endpoints | HTTP 200/401/403 |
| **Authentication** | Login endpoint | HTTP 400/401 (credenciales incorrectas) |
| **Performance** | Response time homepage | <3 segundos |
| **Performance** | Response time API health | <1 segundo |
| **WebSocket** | Socket.IO endpoint | HTTP 200/400 |
| **Security Headers** | X-Content-Type-Options, CSP | Headers presentes |
| **Error Handling** | 404 endpoint | HTTP 404 (no 500) |

### Ejecución Manual de Smoke Tests

```bash
# Production
bash backend/scripts/smoke-tests.sh https://bge-heroes.vercel.app

# Staging
bash backend/scripts/smoke-tests.sh https://bge-heroes-staging.vercel.app

# Local
bash backend/scripts/smoke-tests.sh http://localhost:3000

# Output esperado:
# ============================================
# 🧪 SMOKE TESTS - POST-DEPLOYMENT VERIFICATION
# ============================================
# Base URL: https://bge-heroes.vercel.app
# Timeout: 10 seconds
# ============================================
#
# [✅ PASS] Health check endpoint responds 200
# [✅ PASS] Health check returns valid JSON
# [✅ PASS] Database status is healthy
# [✅ PASS] Homepage loads (HTTP 200)
# ...
# ============================================
# 📊 SMOKE TESTS SUMMARY
# ============================================
# Total Tests: 20
# Passed: 20
# Failed: 0
# ============================================
# ✅ All smoke tests PASSED! ✅
```

### Agregar Nuevos Smoke Tests

Editar `backend/scripts/smoke-tests.sh`:

```bash
# Add new test
run_test "Custom API endpoint" \
    "curl -f -s -m $TIMEOUT ${BASE_URL}/api/custom-endpoint > /dev/null"
```

---

## 🔴 ROLLBACK PROCEDURE

### Cuándo Hacer Rollback

🚨 **Hacer rollback SI:**

- Smoke tests fallan en Green environment
- Error rate >5% en los primeros 5 minutos
- Response time >5 segundos
- Database migration falla
- Security vulnerability crítica detectada

### Rollback Automático

El pipeline ejecuta rollback automático SI smoke tests fallan.

```yaml
# .github/workflows/ci-cd-blue-green.yml

- name: 🔴 Rollback to Blue (if tests failed)
  if: failure() && steps.smoke-tests.outputs.smoke_tests_status == 'failed'
  run: |
    echo "🔴 ROLLBACK: Smoke tests failed. Reverting to Blue..."
    bash backend/scripts/blue-green-rollback.sh
```

### Rollback Manual

```bash
# OPTION 1: Run rollback script
bash backend/scripts/blue-green-rollback.sh

# OPTION 2: Vercel CLI
vercel ls  # List deployments
vercel promote <blue-deployment-id>

# OPTION 3: Vercel Dashboard
# 1. Go to vercel.com/dashboard
# 2. Select project: bge-heroes-de-la-patria
# 3. Click on previous deployment (Blue)
# 4. Click "Promote to Production"
```

### Procedimiento de Rollback Manual Detallado

```bash
# PASO 1: Identificar deployment Blue (anterior estable)
vercel ls --token $VERCEL_TOKEN

# Output:
# Age  Deployment             Status    Duration  Source
# 5m   bge-heroes-abc123.vercel.app   Ready    30s       main (v1.2.4) ← GREEN (FAILING)
# 2h   bge-heroes-xyz789.vercel.app   Ready    28s       main (v1.2.3) ← BLUE (STABLE)

# PASO 2: Copiar deployment ID de Blue
BLUE_ID=bge-heroes-xyz789

# PASO 3: Promover Blue a producción
vercel promote $BLUE_ID --token $VERCEL_TOKEN --yes

# PASO 4: Verificar que Blue está sirviendo tráfico
curl https://bge-heroes.vercel.app/api/health | jq '.version'
# Expected: "1.2.3" (Blue version)

# PASO 5: Notificar equipo
echo "🔴 ROLLBACK COMPLETED: Blue (v1.2.3) is now live" | \
    curl -X POST $SLACK_WEBHOOK_URL -H 'Content-Type: application/json' \
    -d '{"text":"'"$message"'"}'
```

### Post-Rollback Actions

Después de un rollback:

1. **Investigar causa raíz** del fallo en Green
2. **Crear GitHub Issue** con detalles del fallo
3. **Fix el problema** en feature branch
4. **Re-run tests localmente** antes de mergear
5. **Mergear fix** y esperar nuevo deployment automático

---

## 🔍 TROUBLESHOOTING

### Problema 1: Pipeline Falla en Tests

**Síntomas:**
- GitHub Actions job "unit-tests" falla
- Error: "Test suite failed to run"

**Solución:**
```bash
# Run tests localmente
npm run test:unit

# Si tests pasan localmente pero fallan en CI:
# 1. Check GitHub Actions logs
# 2. Verify environment variables
# 3. Check database connectivity (si integration tests)
```

---

### Problema 2: Security Scan Bloquea Deployment

**Síntomas:**
- Job "security-audit" falla
- Error: "Vulnerabilities detected"

**Solución:**
```bash
# Run audit localmente
npm audit

# Fix vulnerabilities
npm audit fix

# Si no se puede fix automáticamente:
npm audit fix --force

# O actualizar dependencia manualmente
npm update <package-name>
```

---

### Problema 3: Green Deployment Falla Smoke Tests

**Síntomas:**
- Smoke tests fallan en Green
- Error: "Health check endpoint returns 503"

**Solución:**
```bash
# Check Vercel deployment logs
vercel logs <green-deployment-id>

# Verify database connectivity
# Check if migrations ran successfully
# Verify environment variables in Vercel dashboard
```

---

### Problema 4: Rollback Falla

**Síntomas:**
- Rollback script falla
- Error: "Could not identify Blue deployment"

**Solución Manual:**
```bash
# OPCIÓN 1: Vercel Dashboard (más fácil)
# 1. Go to vercel.com/dashboard
# 2. Select project
# 3. Click on previous deployment
# 4. Click "Promote to Production"

# OPCIÓN 2: Vercel CLI
vercel ls
vercel promote <previous-deployment-id>
```

---

### Problema 5: Slack Notifications No Llegan

**Síntomas:**
- Pipeline completa pero no hay notificaciones en Slack

**Solución:**
```bash
# Verify SLACK_WEBHOOK_URL secret exists
# Go to GitHub repo > Settings > Secrets

# Test webhook manualmente
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"Test message"}'
```

---

## ✅ MEJORES PRÁCTICAS

### 1. Testing

✅ **SIEMPRE ejecutar tests localmente antes de push**
```bash
npm run test:unit
npm run test:integration
npm run lint
```

✅ **Mantener cobertura de tests >80%**
```bash
npm run test:coverage
```

✅ **Agregar smoke tests para nuevas features críticas**

---

### 2. Deployment

✅ **Deployar a staging PRIMERO, validar, luego a producción**

✅ **Deployar en horarios de bajo tráfico** (2-5 AM)

✅ **Nunca deployar Viernes por la tarde** (dificulta fix de issues el fin de semana)

✅ **Usar feature flags para features grandes**
```javascript
if (config.featureFlags.newDashboard) {
  // New feature
} else {
  // Old feature
}
```

---

### 3. Rollback

✅ **Tener plan de rollback ANTES de cada deployment**

✅ **Blue environment debe quedar standby por 24 horas**

✅ **Documentar CADA rollback** en post-mortem

---

### 4. Monitoring

✅ **Verificar métricas en los primeros 15 minutos post-deployment**
- Error rate
- Response time
- CPU/Memory usage
- Database connections

✅ **Configurar alertas en Prometheus/Grafana**
```yaml
# prometheus/alerts/rules.yml
- alert: HighErrorRatePostDeployment
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "Error rate >5% post-deployment. Consider rollback."
```

---

### 5. Communication

✅ **Notificar al equipo ANTES de deployment a producción**

✅ **Usar Slack channel #deployments** para updates

✅ **Post-mortem después de rollbacks**

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Target | Actual |
|---------|--------|--------|
| **Deployment Frequency** | 5+ por semana | - |
| **Lead Time** | <4 horas | - |
| **Mean Time to Recovery (MTTR)** | <15 minutos | - |
| **Change Failure Rate** | <5% | - |
| **Deployment Success Rate** | >95% | - |
| **Rollback Time** | <5 minutos | - |

---

## 📚 REFERENCIAS

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Blue-Green Deployment Pattern](https://martinfowler.com/bliki/BlueGreenDeployment.html)
- [Smoke Testing Best Practices](https://www.softwaretestinghelp.com/smoke-testing/)

---

**FIN DEL CI/CD BLUE-GREEN DEPLOYMENT GUIDE**

*Última actualización: 17 Noviembre 2025*
