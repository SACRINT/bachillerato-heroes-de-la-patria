# SEMANA 30 - Análisis de Optimizaciones (Fase 30.2)

**Fecha:** 23 de Noviembre 2025
**Estado:** Análisis en Progreso
**Objetivo:** Identificar y resolver bottlenecks antes del Stress Test

---

## 📊 RESUMEN EJECUTIVO DE LOAD TEST

### Métricas Generales
- **Virtual Users Creados:** 7,800 usuarios simultáneos
- **Usuarios Completados:** 385 (4.9% completion rate) ❌
- **Requests Totales:** 8,614 intentos
- **Respuestas Exitosas:** 2,892 (33.6% success rate) ❌
- **Duración:** ~14 minutos (837 segundos)
- **Request Rate:** 2 req/sec promedio

### Análisis de Errores (Total: 8,614 - 2,892 = 5,722 errores = 66.4%)

| Tipo de Error | Cantidad | Porcentaje | Impacto |
|---------------|----------|-----------|---------|
| **ETIMEDOUT** | 5,722 | 66.4% | 🔴 CRÍTICO - Server timeout/exhaustion |
| **HTTP 429** | 2,793 | 32.4% | 🔴 CRÍTICO - Rate limiting demasiado agresivo |
| **HTTP 401** | 44 | 0.5% | 🟡 Autenticación falló |
| **HTTP 404** | 37 | 0.4% | 🟡 Rutas no encontradas |
| **HTTP 200** | 18 | 0.2% | 🟢 Éxito (mínimo) |

### Latencia de Respuestas (2,892 respuestas exitosas)
```
Min:    833 ms
p50:    1,085.9 ms   (50% de respuestas tardan <1.1s)
p75:    1,465.9 ms
p90:    2,951.9 ms
p95:    9,416.8 ms   ❌ EXCEDE SLA target <200ms por 47x
p99:    9,999.2 ms   (99% en timeout máximo)
p999:   9,999.2 ms
Max:    10,007 ms (timeout)
Mean:   1,941.9 ms
```

**Conclusión Latencia:** Solo 50% de respuestas son rápidas (<1.1s). El tail latency (p95+) es catastrófico (9.4s+).

---

## 🎯 ENDPOINTS PROBLEMÁTICOS (Por Tasa de Error)

### Endpoint 1: `/health` (Health Check)
- **Requests:** 422 intentos
- **Exitosos:** 15 (3.6% success)
- **HTTP 429:** 407 (96.4%) ❌❌❌
- **ETIMEDOUT:** 1,137 (no se cuenta en summary)
- **p95 Latency:** Indefinido (casi todos fallan)

**Problema:** El endpoint de health check está siendo rate-limitado. Esto es CRÍTICO porque:
- Los health checks son esenciales para monitoreo
- Significan que el rate limiter está disparándose en ~96% de solicitudes
- El sistema rechaza incluso las más simples requests

### Endpoint 2: `/grades` (Calificaciones)
- **Requests:** 440 intentos
- **HTTP 200:** ~0
- **HTTP 429:** 424 (96.4%)
- **ETIMEDOUT:** 1,143
- **p95 Latency:** 9,801.2 ms

**Problema:** Endpoint crítico del dashboard, completamente saturado.

### Endpoint 3: `/students` (Estudiantes)
- **Requests:** ~1,600+ intentos (Students Management scenario)
- **HTTP 401:** 17 (autenticación)
- **HTTP 429:** 415 (25.9%)
- **ETIMEDOUT:** 1,174 (73%)

**Problema:** Tasa de timeout extremadamente alta (73% de requests). Indica:
- Base de datos sobrecargada
- Queries lentas sin optimizar
- Connection pool insuficiente

### Endpoint 4: `/tutor/profile` (AI Tutor)
- **Requests:** ~1,906 intentos (AI Tutor scenario)
- **HTTP 429:** 489 (25.7%)
- **ETIMEDOUT:** 1,390 (73%) ❌
- **p95 Latency:** Desconocido (mayoría timeout)

**Problema:** Peor endpoint en términos de ETIMEDOUT. Sugiere:
- Queries de IA muy complejas
- Sin caché
- BD respondiendo lentamente

### Endpoint 5: `/notifications` (Notificaciones)
- **Requests:** ~305 intentos
- **HTTP 429:** 288 (94.4%)
- **ETIMEDOUT:** 841
- **p95 Latency:** Desconocido

**Problema:** Altamente rate-limitado, similar al health check.

### Endpoint 6: `/api/status` (Status API)
- **HTTP 429:** 388
- **ETIMEDOUT:** 30
- **p95 Latency:** Similar al health check

---

## 🔍 ROOT CAUSES IDENTIFICADAS

### 1. **Rate Limiting Demasiado Agresivo (32.4% de todos los errores)**

**Indicadores:**
- 2,793 respuestas HTTP 429 (Too Many Requests)
- `/health` recibiendo 96.4% rate limiting (lo que debería ser gratuito)
- `/students` con 25.9% rejection por rate limit
- `/tutor/profile` con 25.7% rejection

**Configuración Actual Probable:**
```javascript
// Probable en backend/middleware/rate-limiter.js o similar
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,    // 1 minuto
  max: 100,                    // 100 requests per minute
  // Con 7,800 usuarios concurrentes = ~130 req/seg
  // Solo permite ~1.67 req/seg por minuto = INSUFICIENTE
});
```

**Impacto:** Con 10 usuarios/segundo durante el test:
- 10 usuarios × ~1-2 requests cada uno = 10-20 req/seg
- Límite de 100 req/minuto = 1.67 req/seg
- **99% de requests rechazados por rate limiting**

**Solución Requerida:**
- Aumentar `max` de 100 a 10,000 o más
- O aumentar `windowMs` a 60 segundos
- O implementar rate limiting por IP/user ID en lugar de global

---

### 2. **Timeouts Masivos (66.4% de todos los errores = 5,722)**

**ETIMEDOUT se distribuye así:**
- `/students`: 1,174 (20.5% del total de timeouts)
- `/tutor/profile`: 1,390 (24.3% del total) - PEOR ENDPOINT
- `/health`: 1,137 (19.9%)
- `/grades`: 1,143 (20%)
- `/notifications`: 841 (14.7%)

**Causas Probables:**
1. **Connection Pool Insuficiente**
   - PostgreSQL max_connections: 20 por default en Neon
   - Con 7,800 usuarios, necesita >>1000 conexiones
   - Node.js pool probablemente configurado a 10 conexiones

2. **Queries Sin Optimizar**
   - `/students` lista todos los estudiantes (sin paginación?)
   - `/tutor/profile` probablemente hace 5+ queries JOIN sin índices
   - `/grades` accede a tabla grades sin índices de performance

3. **Sin Caché (Redis/Memcached)**
   - Cada request al `/health` hace query a BD
   - Cada request al `/students` hace query completa
   - Cada request al `/grades` hace query sin caché

4. **Network/Socket Exhaustion**
   - 7,800 usuarios creando conexiones simultáneas
   - ulimit del SO puede estar limitando sockets
   - Node.js default maxSockets limitado

---

### 3. **Baja Tasa de Finalización (4.9% completion rate)**

**Significa:**
- De 7,800 usuarios creados, solo 385 completaron sus scenarios
- 7,415 usuarios (94.9%) fueron rechazados o tuvieron timeout

**Correlación:**
- Si 96.4% de /health requests se rate-limit, usuario abandona
- Si 73% de /students requests timeout, usuario abandona
- Si 94.4% de /notifications requests rate-limit, usuario abandona

**Conclusión:** El sistema rechaza usuarios más rápido de lo que los procesa.

---

## 📋 PLAN DE OPTIMIZACIONES (Orden de Prioridad)

### PRIORIDAD 1: Rate Limiting (Impacto: 32.4% de errores reducidos)

**Paso 1.1:** Encontrar configuración de rate limiter
```bash
find backend -name "*rate*" -o -name "*limit*" | grep -v node_modules
grep -r "rateLimit\|rate-limit" backend --include="*.js" | grep -v node_modules | head -10
```

**Paso 1.2:** Modificar límites
- Aumentar de 100 a 5,000+ requests/minute
- O cambiar a 10,000 requests/hour
- O implementar rate limiting por IP (no global)
- Excludir `/health` de rate limiting (es un healthcheck, no debe limitarse)

**Paso 1.3:** Reiniciar y retest
```bash
npm start
node backend/load-tests/run-load-tests.js load
```

**Expected Impact:** 2,793 HTTP 429 errors → ~0 (reducción de 32.4% en total de errores)

---

### PRIORIDAD 2: Connection Pool (Impacto: 5,722 ETIMEDOUT reducidos)

**Paso 2.1:** Verificar configuración actual
- PostgreSQL `max_connections` en Neon (probablemente 20)
- Node.js `pg.Pool({ max: ? })` (probablemente 10)

```bash
grep -r "Pool\|max:" backend/data --include="*.js" | grep -E "max|Pool"
```

**Paso 2.2:** Aumentar pool
```javascript
// backend/data/database-access.js o similar
const pool = new Pool({
  max: 100,           // Aumentar de 10 a 100
  min: 10,            // Mantener min en 10
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Paso 2.3:** Verificar Neon limits
- Si Neon tiene límite global de 20 conexiones, será el bottleneck
- Puede necesitar upgrade a plan superior

**Expected Impact:** 5,722 ETIMEDOUT → ~2,000 (reducción de 65%)

---

### PRIORIDAD 3: Query Optimization (Impacto: 3,000+ ETIMEDOUT restantes)

**Paso 3.1:** Identificar queries lentas
- `/students` endpoint: probablemente `SELECT * FROM usuarios WHERE role='estudiante'`
- `/grades` endpoint: probablemente `SELECT * FROM calificaciones WHERE...` sin índices
- `/tutor/profile` endpoint: probablemente 5+ JOINs para armar perfil del tutor

```bash
grep -r "SELECT \*" backend --include="*.js" | head -20
```

**Paso 3.2:** Optimizar queries
- Reemplazar `SELECT *` con columnas específicas
- Agregar `LIMIT` a resultados sin paginar
- Agregar índices en columnas de filtrado (WHERE, JOIN)
- Usar `EXPLAIN ANALYZE` para verificar plan de ejecución

**Expected Impact:** 3,000 ETIMEDOUT → ~500 (reducción de 82%)

---

### PRIORIDAD 4: Caché (Impacto: 500 ETIMEDOUT restantes)

**Paso 4.1:** Implementar Redis caché
- Caché `/health` check por 5 segundos
- Caché `/students` list por 30 segundos
- Caché `/grades` por 60 segundos
- Caché `/tutor/profile` por 60 segundos

**Paso 4.2:** Instalar ioredis
```bash
npm install ioredis
```

**Paso 4.3:** Crear cache-service.js
```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost');

async function getCached(key, fetchFn, ttl = 300) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}
```

**Expected Impact:** 500 ETIMEDOUT → ~100 (reducción de 80%)

---

## 🔧 IMPLEMENTACIÓN INMEDIATA

### PASO 1: Inspeccionar Rate Limiter Actual
```bash
grep -r "rateLimit\|rate-limit" backend --include="*.js"
grep -r "429\|Too Many" backend --include="*.js"
find backend -type f -name "*.js" -exec grep -l "limiter\|RateLimit" {} \;
```

### PASO 2: Inspeccionar Connection Pool
```bash
grep -r "new Pool\|pg.Pool" backend --include="*.js"
grep -r "max.*:" backend/data --include="*.js" | grep -i "pool\|connection"
```

### PASO 3: Inspeccionar Queries Lentas
```bash
grep -r "SELECT \*" backend/routes --include="*.js" | wc -l
grep -r "SELECT \*" backend/services --include="*.js" | wc -l
```

### PASO 4: Crear Script de Optimización Automática
```bash
# Script de aplicación de optimizaciones
# bash backend/scripts/apply-load-test-optimizations.sh
```

---

## 📈 MÉTRICAS DE ÉXITO (Post-Optimización)

| Métrica | Baseline | Target | Status |
|---------|----------|--------|--------|
| Completion Rate | 4.9% | >50% | 🔴 |
| Success Rate | 33.6% | >85% | 🔴 |
| HTTP 429 Errors | 2,793 | <100 | 🔴 |
| ETIMEDOUT Errors | 5,722 | <500 | 🔴 |
| p95 Latency | 9,416.8ms | <500ms | 🔴 |
| p50 Latency | 1,085.9ms | <200ms | 🔴 |

---

## ⏱️ TIMELINE DE OPTIMIZACIONES

| Fase | Tarea | Duración Est. | Impacto |
|------|-------|---------------|---------|
| 1 | Aumentar Rate Limiting | 15 min | -32.4% errores |
| 2 | Aumentar Connection Pool | 10 min | -65% timeouts |
| 3 | Optimizar Queries | 60 min | -82% timeouts |
| 4 | Implementar Caché | 60 min | -80% timeouts |
| 5 | Re-run Load Test | 20 min | Validar mejoras |
| **TOTAL** | | **165 min (2.75 horas)** | **95%+ mejora** |

---

## 🚀 PRÓXIMO PASO

Comenzar con PRIORIDAD 1 (Rate Limiting) para obtener mejora rápida y visible.

**Comando para iniciar optimizaciones:**
```bash
# Paso 1: Encontrar rate limiter
grep -r "rateLimit\|rate-limit" backend --include="*.js" -l

# Paso 2: Modificar configuración
# [Edit file encontrado en Paso 1]

# Paso 3: Reiniciar server y retest
npm start &
node backend/load-tests/run-load-tests.js load
```

---

*Documento generado: 23 Nov 2025 - Continúa en Fase 30.2 (Optimizaciones)*
