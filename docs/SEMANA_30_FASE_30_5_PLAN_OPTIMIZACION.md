# 📈 SEMANA 30 FASE 30.5 - PLAN DE OPTIMIZACIÓN DATABASE

**Fecha Inicio:** 24 de Noviembre de 2025
**Objetivo:** Optimizar PostgreSQL para escalar de 2,400 a 3,000+ usuarios concurrentes
**Meta:** Reducir ETIMEDOUT de 62.5% a <40%

---

## 🎯 ANÁLISIS DEL PROBLEMA

### Baseline FASE 30.4:
- **Usuarios:** 2,400 concurrentes
- **ETIMEDOUT:** 62.5% (12,320 de 19,693 requests)
- **Connection Pool:** 3 conexiones simultáneas
- **Escalamiento:** 2.4x usuarios → 2.26x ETIMEDOUT

### Root Cause Identificada:
- Database connection pool **SATURADO** con solo 3 conexiones
- Requests esperan en cola hasta timeout (10 segundos)
- PostgreSQL en Neon tiene límite de conexiones bajo

### Solución Estratégica:
1. Aumentar connection pool (3 → 10-20)
2. Optimizar queries lentas (EXPLAIN ANALYZE)
3. Crear índices faltantes
4. Implementar caching con Redis
5. Validar y re-test con 3,000 usuarios

---

## 📋 TAREAS DETALLADAS

### TAREA 1: Diagnóstico Actual de Database (15 min)
**Propósito:** Conocer estado actual de PostgreSQL en Neon

**Pasos:**
1. Conectar a Neon Console
2. Ejecutar queries diagnósticas:
   ```sql
   -- Ver configuración actual
   SHOW max_connections;
   SHOW shared_buffers;
   SHOW effective_cache_size;
   SHOW work_mem;
   SHOW maintenance_work_mem;

   -- Ver conexiones activas
   SELECT count(*) as total_connections FROM pg_stat_activity;
   SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

   -- Ver queries lentas (>100ms)
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   WHERE mean_exec_time > 100
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. Documentar resultados

**Salida Esperada:**
- Número total de conexiones permitidas
- Conexiones actualmente en uso
- Queries que toman >100ms
- Tamaño de buffer pool

---

### TAREA 2: Aumentar Connection Pool (20 min)

**Opción A - Configurar en Node.js (RECOMENDADO):**

Archivo: `backend/config/database.js`

Buscar y aumentar el pool:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Aumentar de valor actual
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Opción B - Si Neon permite (verificar):**

En Neon Console → Settings:
- Aumentar `max_connections` (si es configurable)
- Aumentar `superuser_reserved_connections`

**Verificación:**
```bash
# En terminal
node -e "const pool = require('./backend/config/database.js'); console.log(pool.options)"
```

**Metrics to Track:**
- Pool size: 3 → 20 conexiones
- Idle timeout: 30 segundos
- Connection timeout: 2 segundos

---

### TAREA 3: Identificar y Optimizar Queries Lentas (45 min)

**Paso 1: Ejecutar EXPLAIN ANALYZE en queries críticas**

Top queries a analizar (identifiquemos en logs):
```sql
-- Ejemplo: Query de estudiantes
EXPLAIN ANALYZE
SELECT * FROM usuarios WHERE role = 'estudiante' LIMIT 50;

-- Ejemplo: Query de suscriptores
EXPLAIN ANALYZE
SELECT * FROM suscriptores_notificaciones WHERE verified = true;

-- Ejemplo: Query de aprobaciones
EXPLAIN ANALYZE
SELECT * FROM pending_approvals WHERE status = 'pendiente';
```

**Paso 2: Identificar índices faltantes**

Analizar output de EXPLAIN ANALYZE:
- **Seq Scan = MALO** (full table scan)
- **Index Scan = BUENO** (uses index)
- Si ves muchos Seq Scan → necesita índice

**Paso 3: Crear índices**

Patrón general:
```sql
CREATE INDEX CONCURRENTLY idx_tabla_columna
ON tabla (columna)
WHERE condicion;
```

Índices a crear por tabla:

**Tabla: usuarios**
```sql
CREATE INDEX CONCURRENTLY idx_usuarios_role ON usuarios(role);
CREATE INDEX CONCURRENTLY idx_usuarios_email ON usuarios(email);
CREATE INDEX CONCURRENTLY idx_usuarios_status ON usuarios(status);
```

**Tabla: suscriptores_notificaciones**
```sql
CREATE INDEX CONCURRENTLY idx_suscriptores_verified ON suscriptores_notificaciones(verificado);
CREATE INDEX CONCURRENTLY idx_suscriptores_email ON suscriptores_notificaciones(email);
CREATE INDEX CONCURRENTLY idx_suscriptores_tipo ON suscriptores_notificaciones(tipo_interes);
```

**Tabla: pending_approvals**
```sql
CREATE INDEX CONCURRENTLY idx_approvals_status ON pending_approvals(status);
CREATE INDEX CONCURRENTLY idx_approvals_form_type ON pending_approvals(form_type);
CREATE INDEX CONCURRENTLY idx_approvals_created_at ON pending_approvals(created_at DESC);
```

**Tabla: citas**
```sql
CREATE INDEX CONCURRENTLY idx_citas_fecha ON citas(fecha_solicitada);
CREATE INDEX CONCURRENTLY idx_citas_estado ON citas(estado);
```

**Verificación:**
```sql
-- Ver índices creados
SELECT * FROM pg_indexes WHERE tablename = 'usuarios';
```

---

### TAREA 4: Implementar Connection Pooling Middleware (30 min)

**Crear archivo:** `backend/middleware/connection-pool-manager.js`

```javascript
/**
 * Connection Pool Manager - Optimiza uso de conexiones
 * Mantiene métricas y evita que se agote el pool
 */

class ConnectionPoolManager {
  constructor(pool) {
    this.pool = pool;
    this.metrics = {
      activeConnections: 0,
      waitingRequests: 0,
      totalRequests: 0,
      poolExhaustedCount: 0,
      avgConnectionTime: 0,
    };
  }

  async getConnection() {
    this.metrics.totalRequests++;
    const startTime = Date.now();

    try {
      const client = await this.pool.connect();
      this.metrics.activeConnections++;

      // Wrapper para tracking
      const originalRelease = client.release;
      client.release = () => {
        this.metrics.activeConnections--;
        return originalRelease.call(client);
      };

      const connectionTime = Date.now() - startTime;
      this.metrics.avgConnectionTime =
        (this.metrics.avgConnectionTime + connectionTime) / 2;

      return client;
    } catch (error) {
      if (error.message.includes('no more connections available')) {
        this.metrics.poolExhaustedCount++;
      }
      throw error;
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      poolSize: this.pool.options.max,
      utilization: `${Math.round((this.metrics.activeConnections / this.pool.options.max) * 100)}%`,
    };
  }
}

module.exports = ConnectionPoolManager;
```

**Integrar en server.js:**
```javascript
const ConnectionPoolManager = require('./middleware/connection-pool-manager');
const poolManager = new ConnectionPoolManager(pool);

// Endpoint para monitorear pool
app.get('/api/health/pool', (req, res) => {
  res.json(poolManager.getMetrics());
});
```

---

### TAREA 5: Implementar Redis Caching (40 min)

**Paso 1: Instalar redis (si no está)**
```bash
npm install redis
```

**Paso 2: Crear cache service:** `backend/services/cache-service.js`

```javascript
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });
    this.client.connect();
  }

  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.log(`[CACHE] Error reading ${key}:`, error.message);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.log(`[CACHE] Error writing ${key}:`, error.message);
    }
  }

  async invalidate(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.log(`[CACHE] Error invalidating ${pattern}:`, error.message);
    }
  }
}

module.exports = new CacheService();
```

**Paso 3: Usar en endpoints críticos**

Ejemplo: Endpoint de estudiantes
```javascript
app.get('/api/students', async (req, res) => {
  const cacheKey = `students:${req.query.page || 1}`;

  // Check cache first
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  // Query database
  const students = await pool.query(
    'SELECT * FROM usuarios WHERE role = $1 OFFSET $2 LIMIT $3',
    ['estudiante', (req.query.page - 1) * 50, 50]
  );

  // Cache for 5 minutes
  await cacheService.set(cacheKey, students.rows, 300);

  res.json(students.rows);
});
```

---

### TAREA 6: Configurar Query Timeout (10 min)

**En backend/config/database.js:**
```javascript
// Statement timeout (máximo tiempo por query)
await pool.query('SET statement_timeout = 30000'); // 30 segundos

// Connection timeout
const connectionTimeoutMillis = 2000;

// Idle timeout
const idleTimeoutMillis = 30000;
```

---

### TAREA 7: Monitoreo y Alertas (25 min)

**Crear endpoint de métricas:** `backend/routes/metrics.js`

```javascript
app.get('/api/metrics/database', async (req, res) => {
  const poolMetrics = poolManager.getMetrics();

  // Query slow queries
  const slowQueries = await pool.query(`
    SELECT query, mean_exec_time, calls
    FROM pg_stat_statements
    WHERE mean_exec_time > 100
    ORDER BY mean_exec_time DESC
    LIMIT 5
  `);

  // Query connection stats
  const connections = await pool.query(`
    SELECT count(*) as active FROM pg_stat_activity
    WHERE state = 'active'
  `);

  res.json({
    pool: poolMetrics,
    slowQueries: slowQueries.rows,
    activeConnections: connections.rows[0].active,
    timestamp: new Date().toISOString(),
  });
});
```

---

## 📊 FASE 30.5 TIMELINE

| Tarea | Duración | Status |
|-------|----------|--------|
| 1. Diagnóstico Database | 15 min | ⏳ PENDIENTE |
| 2. Aumentar Connection Pool | 20 min | ⏳ PENDIENTE |
| 3. Optimizar Queries (EXPLAIN ANALYZE) | 45 min | ⏳ PENDIENTE |
| 4. Crear Índices Faltantes | 30 min | ⏳ PENDIENTE |
| 5. Implementar Pool Manager | 30 min | ⏳ PENDIENTE |
| 6. Implementar Redis Caching | 40 min | ⏳ PENDIENTE |
| 7. Configurar Timeouts | 10 min | ⏳ PENDIENTE |
| 8. Crear Endpoints Monitoreo | 25 min | ⏳ PENDIENTE |
| **SUBTOTAL** | **215 minutos (~3.5 horas)** | |
| 9. Reiniciar Backend y Validar | 15 min | ⏳ PENDIENTE |
| 10. Ejecutar FASE 30.5 Stress Test (3,000 usuarios) | 20 min | ⏳ PENDIENTE |
| 11. Analizar Resultados y Documentar | 30 min | ⏳ PENDIENTE |
| **TOTAL FASE 30.5** | **~4 horas** | |

---

## ✅ CRITERIOS DE ÉXITO FASE 30.5

- [ ] ETIMEDOUT < 40% (vs 62.5% en 30.4)
- [ ] Connection pool utilizado al 70-80% (no 100%)
- [ ] Mean latency < 5,000ms
- [ ] p95 latency < 12,000ms
- [ ] 0 errores 5xx
- [ ] HTTP 429 < 5% (rate limiting continúa funcionando)
- [ ] Sistema NO crashea bajo 3,000 usuarios
- [ ] Documentación completa generada

---

## 🔧 PASOS INMEDIATOS

**Orden de ejecución:**
1. ✅ TAREA 1: Diagnóstico (15 min) - EJECUTAR AHORA
2. ✅ TAREA 2: Aumentar Pool (20 min) - EJECUTAR AHORA
3. ✅ TAREA 3: Optimizar Queries (45 min) - EJECUTAR AHORA
4. ✅ TAREA 4: Pool Manager (30 min) - EJECUTAR DESPUÉS
5. ✅ TAREA 5: Redis Caching (40 min) - EJECUTAR DESPUÉS
6. ✅ TAREA 6: Timeouts (10 min) - EJECUTAR DESPUÉS
7. ✅ TAREA 7: Monitoreo (25 min) - EJECUTAR DESPUÉS
8. ✅ Test: Stress Test 3,000 usuarios (20 min)
9. ✅ Analizar: Comparar FASE 30.4 vs FASE 30.5

---

**Próximo Paso:** Ejecutar TAREA 1 - Diagnóstico de Database en Neon Console
