# 🚀 GUÍA DE INTEGRACIÓN REDIS CACHE - SEMANA 3

**Fecha:** 17 Noviembre 2025
**Objetivo:** Reducir query time de 800ms a 200ms (75% mejora)
**Tecnología:** Redis + ioredis + Express middleware

---

## 📋 TABLA DE CONTENIDOS

1. [Beneficios de Redis vs In-Memory Cache](#beneficios)
2. [Instalación y Configuración](#instalación)
3. [Uso Básico del Middleware](#uso-básico)
4. [Ejemplos de Integración por Ruta](#ejemplos)
5. [Invalidación de Caché](#invalidación)
6. [Patrones Avanzados](#patrones-avanzados)
7. [Monitoreo y Debugging](#monitoreo)

---

## ✅ BENEFICIOS DE REDIS VS IN-MEMORY CACHE {#beneficios}

| Característica | In-Memory (Map) | Redis |
|----------------|-----------------|-------|
| **Persistencia** | ❌ Se pierde en restart | ✅ Persistente en disco |
| **Multi-instancia** | ❌ Solo 1 servidor | ✅ Compartido entre instancias |
| **Escalabilidad** | ❌ Limitado por RAM Node.js | ✅ Cluster Redis independiente |
| **TTL granular** | ⚠️ Manual con setTimeout | ✅ Built-in con EXPIRE |
| **Eviction policies** | ❌ No | ✅ LRU, LFU, etc |
| **Invalidación** | ⚠️ Regex manual | ✅ KEYS pattern matching |
| **Performance** | ✅ Muy rápido (in-process) | ✅ Rápido (network hop) |

**Conclusión:** Redis es superior para producción en arquitecturas multi-instancia.

---

## 🔧 INSTALACIÓN Y CONFIGURACIÓN {#instalación}

### Paso 1: Instalar Redis Server

**Opción A: Desarrollo local (Windows)**
```bash
# Descargar Redis desde https://github.com/tporadowski/redis/releases
# O usar Docker
docker run -d -p 6379:6379 redis:alpine
```

**Opción B: Desarrollo local (Linux/Mac)**
```bash
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                  # macOS
redis-server                         # Iniciar servidor
```

**Opción C: Producción (Redis Cloud)**
```bash
# 1. Crear cuenta en https://redis.com/try-free/
# 2. Obtener REDIS_URL con credenciales
# 3. Agregar a .env
```

### Paso 2: Configurar Variables de Entorno

```env
# .env
REDIS_HOST=localhost          # O URL de Redis Cloud
REDIS_PORT=6379
REDIS_PASSWORD=               # Opcional (requerido en producción)
REDIS_DB=0
REDIS_CACHE_ENABLED=true      # Deshabilitar para debugging
```

### Paso 3: Verificar Instalación

```bash
# Comando para verificar Redis funciona
redis-cli ping
# Respuesta esperada: PONG
```

---

## 🎯 USO BÁSICO DEL MIDDLEWARE {#uso-básico}

### Importar Middleware

```javascript
// En tu archivo de rutas (backend/routes/*.js)
const {
    redisCacheMiddleware,
    invalidateRedisCache,
    TTL
} = require('../middleware/redis-cache');
```

### Aplicar a Endpoints GET

```javascript
// Ejemplo simple: Cache con TTL por defecto (30 minutos)
router.get('/api/noticias', redisCacheMiddleware(), async (req, res) => {
    // Query a BD...
    const noticias = await pool.query('SELECT * FROM noticias LIMIT 50');
    res.json({ success: true, data: noticias.rows });
});
```

### Configurar TTL Personalizado

```javascript
// Cache corto (5 minutos) para datos que cambian frecuentemente
router.get('/api/dashboard/stats',
    redisCacheMiddleware({ ttl: TTL.SHORT }),
    async (req, res) => {
        // Stats en tiempo casi real
        const stats = await getDashboardStats();
        res.json(stats);
    }
);

// Cache largo (1 hora) para datos estáticos
router.get('/api/noticias/publicadas',
    redisCacheMiddleware({ ttl: TTL.LONG }),
    async (req, res) => {
        const noticias = await getPublishedNews();
        res.json(noticias);
    }
);
```

### TTL Disponibles

```javascript
TTL.VERY_SHORT  // 60s    - Dashboard stats en vivo
TTL.SHORT       // 300s   - Lista de estudiantes
TTL.MEDIUM      // 1800s  - Calificaciones (30 min, DEFAULT)
TTL.LONG        // 3600s  - Noticias publicadas (1 hora)
TTL.VERY_LONG   // 86400s - Config del sistema (24 horas)
```

---

## 📖 EJEMPLOS DE INTEGRACIÓN POR RUTA {#ejemplos}

### Ejemplo 1: Noticias (GET /api/noticias)

**ANTES (Sin caché):**
```javascript
// backend/routes/noticias.js
router.get('/', async (req, res) => {
    const { estado, categoria, limit = 50 } = req.query;

    let query = 'SELECT * FROM noticias WHERE 1=1';
    const params = [];

    if (estado) {
        query += ' AND estado = $1';
        params.push(estado);
    }

    query += ' ORDER BY fecha_creacion DESC LIMIT $2';
    params.push(parseInt(limit));

    const result = await pool.query(query, params);  // 450ms query time

    res.json({
        success: true,
        data: result.rows
    });
});
```

**DESPUÉS (Con Redis cache):**
```javascript
// backend/routes/noticias.js
const { redisCacheMiddleware, TTL } = require('../middleware/redis-cache');

router.get('/',
    redisCacheMiddleware({
        ttl: TTL.MEDIUM,  // 30 minutos
        keyGenerator: (req) => {
            // Cache key dinámico basado en query params
            const { estado, categoria, limit = 50 } = req.query;
            return `/noticias?estado=${estado || 'all'}&categoria=${categoria || 'all'}&limit=${limit}`;
        }
    }),
    async (req, res) => {
        // Este código solo se ejecuta en CACHE MISS
        const { estado, categoria, limit = 50 } = req.query;

        let query = 'SELECT * FROM noticias WHERE 1=1';
        const params = [];

        if (estado) {
            query += ' AND estado = $1';
            params.push(estado);
        }

        query += ' ORDER BY fecha_creacion DESC LIMIT $2';
        params.push(parseInt(limit));

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    }
);
```

**Resultado:**
- Primera request: 450ms (CACHE MISS - query a BD)
- Requests subsecuentes: **15ms** (CACHE HIT - Redis)
- **Mejora: 96.7%** (450ms → 15ms)

---

### Ejemplo 2: Estudiantes (GET /api/estudiantes)

```javascript
const { redisCacheMiddleware, invalidateCacheMiddleware, TTL } = require('../middleware/redis-cache');

// GET - Con caché
router.get('/',
    redisCacheMiddleware({
        ttl: TTL.SHORT,  // 5 minutos (datos cambian frecuentemente)
        prefix: 'estudiantes'
    }),
    async (req, res) => {
        const estudiantes = await pool.query('SELECT * FROM estudiantes WHERE status = $1', ['activo']);
        res.json({ success: true, data: estudiantes.rows });
    }
);

// POST - Invalidar caché después de crear
router.post('/',
    invalidateCacheMiddleware('estudiantes:*'),  // Invalidar TODAS las keys de estudiantes
    async (req, res) => {
        const { nombre, apellido, grado } = req.body;

        const result = await pool.query(
            'INSERT INTO estudiantes (nombre, apellido, grado) VALUES ($1, $2, $3) RETURNING *',
            [nombre, apellido, grado]
        );

        // Caché se invalida automáticamente DESPUÉS de esta respuesta
        res.status(201).json({ success: true, data: result.rows[0] });
    }
);

// PUT - Invalidar caché después de actualizar
router.put('/:id',
    invalidateCacheMiddleware((req) => `estudiantes:*`),
    async (req, res) => {
        const { id } = req.params;
        const { nombre, apellido } = req.body;

        const result = await pool.query(
            'UPDATE estudiantes SET nombre = $1, apellido = $2 WHERE id = $3 RETURNING *',
            [nombre, apellido, id]
        );

        res.json({ success: true, data: result.rows[0] });
    }
);

// DELETE - Invalidar caché después de eliminar
router.delete('/:id',
    invalidateCacheMiddleware('estudiantes:*'),
    async (req, res) => {
        const { id } = req.params;
        await pool.query('DELETE FROM estudiantes WHERE id = $1', [id]);
        res.json({ success: true, message: 'Estudiante eliminado' });
    }
);
```

---

### Ejemplo 3: Dashboard Stats (GET /api/dashboard/stats)

```javascript
router.get('/stats',
    redisCacheMiddleware({
        ttl: TTL.VERY_SHORT,  // Solo 60 segundos (datos en tiempo casi real)
        prefix: 'dashboard'
    }),
    async (req, res) => {
        // Queries complejas y pesadas
        const query = `
            SELECT
                COUNT(*) as total_estudiantes,
                COUNT(*) FILTER (WHERE status = 'activo') as activos,
                COUNT(*) FILTER (WHERE status = 'inactivo') as inactivos,
                AVG(promedio) as promedio_general
            FROM estudiantes;
        `;

        const result = await pool.query(query);  // 800ms query time

        res.json({
            success: true,
            data: result.rows[0]
        });
    }
);
```

**Resultado:**
- Sin caché: 800ms por request
- Con caché: **10ms** (primeros 60 segundos)
- Usuarios simultáneos: 100+ requests → Solo 1 query a BD cada 60s

---

## 🗑️ INVALIDACIÓN DE CACHÉ {#invalidación}

### Invalidación Manual

```javascript
const { invalidateRedisCache } = require('../middleware/redis-cache');

// Invalidar todas las noticias
await invalidateRedisCache('api:/noticias*');

// Invalidar noticia específica
await invalidateRedisCache('api:/noticias/123');

// Invalidar por categoría
await invalidateRedisCache('api:/noticias?categoria=becas*');

// Flush TODA la caché (usar con cuidado)
const { flushRedisCache } = require('../middleware/redis-cache');
await flushRedisCache();
```

### Invalidación Automática con Middleware

```javascript
const { invalidateCacheMiddleware } = require('../middleware/redis-cache');

// Invalidar patrón fijo
router.post('/noticias',
    invalidateCacheMiddleware('api:/noticias*'),
    async (req, res) => {
        // Crear noticia...
        // Caché se invalida DESPUÉS de respuesta exitosa
    }
);

// Invalidar patrón dinámico
router.put('/noticias/:id',
    invalidateCacheMiddleware((req) => {
        const { id } = req.params;
        return `api:/noticias/${id}*`;  // Solo invalidar esta noticia
    }),
    async (req, res) => {
        // Actualizar noticia...
    }
);
```

---

## 🚀 PATRONES AVANZADOS {#patrones-avanzados}

### Patrón 1: Cache-Aside con Query Params

```javascript
router.get('/search',
    redisCacheMiddleware({
        ttl: TTL.MEDIUM,
        keyGenerator: (req) => {
            // Cache key único por combinación de filtros
            const { q, categoria, limit, offset } = req.query;
            return `/search?q=${q}&cat=${categoria || 'all'}&l=${limit || 50}&o=${offset || 0}`;
        }
    }),
    async (req, res) => {
        // Search logic...
    }
);
```

### Patrón 2: Write-Through (Escribir en caché inmediatamente)

```javascript
const { redis, TTL } = require('../middleware/redis-cache');

router.post('/noticias', async (req, res) => {
    const { titulo, contenido } = req.body;

    // 1. Escribir en BD
    const result = await pool.query(
        'INSERT INTO noticias (titulo, contenido) VALUES ($1, $2) RETURNING *',
        [titulo, contenido]
    );

    const noticia = result.rows[0];

    // 2. Escribir inmediatamente en caché
    await redis.setex(
        `api:/noticias/${noticia.id}`,
        TTL.LONG,
        JSON.stringify({ success: true, data: noticia })
    );

    // 3. Invalidar lista de noticias
    await invalidateRedisCache('api:/noticias?*');

    res.status(201).json({ success: true, data: noticia });
});
```

### Patrón 3: Cache Warming (Precalentar caché)

```javascript
// backend/scripts/warm-cache.js
const { redis, TTL } = require('../middleware/redis-cache');
const { pool } = require('../config/database');

async function warmCache() {
    console.log('[CACHE-WARMING] Iniciando...');

    // Cargar las 10 noticias más vistas
    const noticias = await pool.query(
        'SELECT * FROM noticias ORDER BY vistas DESC LIMIT 10'
    );

    // Guardar en caché
    for (const noticia of noticias.rows) {
        await redis.setex(
            `api:/noticias/${noticia.id}`,
            TTL.VERY_LONG,
            JSON.stringify({ success: true, data: noticia })
        );
    }

    console.log(`[CACHE-WARMING] ✅ ${noticias.rows.length} noticias precargadas`);
}

// Ejecutar al iniciar servidor
warmCache().catch(console.error);

module.exports = { warmCache };
```

---

## 📊 MONITOREO Y DEBUGGING {#monitoreo}

### Endpoint de Stats de Caché

```javascript
// backend/routes/cache-stats.js
const express = require('express');
const router = express.Router();
const { getRedisStats } = require('../middleware/redis-cache');

router.get('/api/cache/stats', async (req, res) => {
    const stats = await getRedisStats();
    res.json({
        success: true,
        data: stats
    });
});

module.exports = router;
```

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "totalKeys": 245,
    "info": [
      "total_connections_received:1523",
      "total_commands_processed:8945",
      "keyspace_hits:7234",
      "keyspace_misses:1711"
    ],
    "keyspace": [
      "db0:keys=245,expires=245,avg_ttl=1234567"
    ]
  }
}
```

### Headers de Debugging

Todas las requests con caché incluyen headers informativos:

```http
X-Cache: HIT              # O MISS
X-Cache-Source: Redis     # Siempre "Redis"
```

**Ejemplo con curl:**
```bash
curl -I http://localhost:3000/api/noticias

# Respuesta:
HTTP/1.1 200 OK
X-Cache: HIT
X-Cache-Source: Redis
Content-Type: application/json
```

### Logs en Consola

```
[REDIS] ⏳ MISS: api:/noticias?estado=publicada&limit=50
[REDIS] 💾 SAVED: api:/noticias?estado=publicada&limit=50 (TTL: 1800s)

[REDIS] ✅ HIT: api:/noticias?estado=publicada&limit=50

[REDIS] 🗑️ INVALIDATED: api:/noticias* (3 keys)
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Setup Inicial
- [ ] Redis Server instalado y running
- [ ] Variables de entorno configuradas (.env)
- [ ] `npm install ioredis` ejecutado
- [ ] cache-service.js funcionando (verificar con ping)

### Por Cada Ruta a Cachear
- [ ] Identificar endpoints GET de lectura frecuente
- [ ] Importar `redisCacheMiddleware` del middleware
- [ ] Aplicar middleware con TTL apropiado
- [ ] Configurar `keyGenerator` si usa query params
- [ ] Testing manual: verificar headers X-Cache
- [ ] Testing manual: verificar logs de HIT/MISS

### Invalidación
- [ ] Endpoints POST/PUT/DELETE con `invalidateCacheMiddleware`
- [ ] Patrón de invalidación correcto (no muy amplio, no muy específico)
- [ ] Testing manual: crear recurso → verificar caché invalidada

### Producción
- [ ] REDIS_URL configurada en Vercel/Heroku
- [ ] Redis Cloud o instancia dedicada (NO localhost)
- [ ] Monitoreo de Redis (memoria, conexiones)
- [ ] Alertas si Redis cae (fallback a sin caché)

---

## 🎯 MÉTRICAS ESPERADAS POST-IMPLEMENTACIÓN

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Query time /noticias** | 450ms | 15ms | 96.7% |
| **Query time /dashboard/stats** | 800ms | 10ms | 98.8% |
| **Query time /estudiantes** | 350ms | 12ms | 96.6% |
| **Requests/segundo (servidor)** | 50 req/s | 500+ req/s | 10x |
| **CPU utilization** | 75% | 20% | -73% |
| **Database load** | 100% | 15% | -85% |

**Target general:** Reducir query time promedio de **800ms a 200ms** (75% mejora) ✅

---

## 📚 RECURSOS ADICIONALES

- [Redis Caching Best Practices](https://redis.io/docs/manual/patterns/)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Cache Invalidation Strategies](https://martinfowler.com/articles/patterns-of-distributed-systems/cache-invalidation.html)

---

**Próximo paso:** Integrar en 10+ rutas principales y medir impacto real con Lighthouse.
