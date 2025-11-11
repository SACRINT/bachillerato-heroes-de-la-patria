# 🚀 Guía de Optimización de Base de Datos - BGE

## 📋 Tabla de Contenidos

1. [Índices Implementados](#índices-implementados)
2. [Patrones de Consultas Optimizadas](#patrones-de-consultas-optimizadas)
3. [Mejores Prácticas](#mejores-prácticas)
4. [Ejemplos de Optimización](#ejemplos-de-optimización)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

---

## 📊 Índices Implementados

### Noticias
- `idx_noticias_activo_fecha` - Para listados activos ordenados
- `idx_noticias_categoria` - Búsqueda por categoría
- `idx_noticias_destacado` - Noticias destacadas
- `idx_noticias_fulltext` - Búsqueda de texto completo

### Eventos
- `idx_eventos_fecha_activo` - Eventos futuros
- `idx_eventos_estado` - Por estado
- `idx_eventos_categoria` - Por categoría
- `idx_eventos_modalidad` - Por modalidad (presencial/virtual/híbrido)

### Avisos
- `idx_avisos_activo_vigente` - Avisos vigentes
- `idx_avisos_prioridad` - Por prioridad
- `idx_avisos_tipo` - Por tipo

### Comunicados
- `idx_comunicados_activo_fecha` - Comunicados activos por fecha
- `idx_comunicados_destinatario` - Por destinatario
- `idx_comunicados_tipo` - Por tipo

### Egresados
- `idx_egresados_email` - Búsqueda por email (ÚNICO)
- `idx_egresados_anio_egreso` - Por año de egreso
- `idx_egresados_fulltext` - Búsqueda de texto completo

### Otros Módulos
Ver archivo `create-database-indexes.sql` para lista completa.

---

## 🎯 Patrones de Consultas Optimizadas

### ✅ BIEN: Usar índices existentes

```javascript
// ✅ Aprovechar índice compuesto (activo, fecha)
const query = `
    SELECT *
    FROM noticias
    WHERE activo = true
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2
`;
```

### ❌ MAL: Ignorar índices

```javascript
// ❌ No usa índices eficientemente
const query = `
    SELECT *
    FROM noticias
    WHERE LOWER(titulo) LIKE '%${searchTerm}%'
    ORDER BY fecha DESC
`;
```

### ✅ CORRECTO: Usar búsqueda de texto completo

```javascript
// ✅ Usa índice GIN de texto completo
const query = `
    SELECT *
    FROM noticias
    WHERE to_tsvector('spanish', titulo || ' ' || contenido) @@ plainto_tsquery('spanish', $1)
    AND activo = true
    ORDER BY fecha DESC
    LIMIT $2 OFFSET $3
`;
```

---

## 📝 Mejores Prácticas

### 1. Usar Parámetros en Lugar de Concatenación

```javascript
// ✅ BIEN - Previene SQL injection y permite reuso del plan de consulta
const result = await pool.query(
    'SELECT * FROM noticias WHERE categoria = $1 AND activo = $2',
    [categoria, true]
);

// ❌ MAL - Vulnerable y no reutiliza plan de consulta
const result = await pool.query(
    `SELECT * FROM noticias WHERE categoria = '${categoria}' AND activo = true`
);
```

### 2. Siempre Usar LIMIT y OFFSET

```javascript
// ✅ BIEN - Evita cargar miles de registros
const query = `
    SELECT *
    FROM eventos
    WHERE activo = true
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2
`;

const result = await pool.query(query, [limit, offset]);
```

### 3. Seleccionar Solo Campos Necesarios

```javascript
// ✅ BIEN - Solo carga campos necesarios
const query = `
    SELECT id, titulo, fecha, categoria
    FROM noticias
    WHERE activo = true
    ORDER BY fecha DESC
    LIMIT 20
`;

// ❌ MAL - Carga todo incluyendo contenido largo
const query = `
    SELECT *
    FROM noticias
    WHERE activo = true
    ORDER BY fecha DESC
    LIMIT 20
`;
```

### 4. Usar Transacciones para Operaciones Múltiples

```javascript
// ✅ BIEN - Asegura atomicidad
const client = await pool.connect();
try {
    await client.query('BEGIN');

    await client.query('UPDATE noticias SET activo = false WHERE id = $1', [id]);
    await client.query('INSERT INTO audit_log (action, table_name, record_id) VALUES ($1, $2, $3)',
        ['update', 'noticias', id]);

    await client.query('COMMIT');
} catch (error) {
    await client.query('ROLLBACK');
    throw error;
} finally {
    client.release();
}
```

### 5. Contar Registros Eficientemente

```javascript
// ✅ BIEN - Cuenta solo lo necesario
const countQuery = `
    SELECT COUNT(*) as total
    FROM noticias
    WHERE activo = true AND categoria = $1
`;

// Para tablas grandes, usar estimación rápida
const estimateQuery = `
    SELECT reltuples::bigint AS estimate
    FROM pg_class
    WHERE relname = 'noticias'
`;
```

---

## 💡 Ejemplos de Optimización

### Ejemplo 1: Listado de Noticias con Paginación

```javascript
// ✅ Consulta optimizada
router.get('/noticias', async (req, res) => {
    const { page = 1, limit = 20, categoria } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Consulta principal con índices
        let query = `
            SELECT
                id,
                titulo,
                resumen,
                categoria,
                autor,
                fecha,
                imagen,
                destacado
            FROM noticias
            WHERE activo = true
        `;

        const params = [];
        let paramCount = 0;

        if (categoria) {
            paramCount++;
            query += ` AND categoria = $${paramCount}`;
            params.push(categoria);
        }

        query += ` ORDER BY fecha DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        // Ejecutar consulta de datos
        const result = await pool.query(query, params);

        // Consulta de conteo (usa índices)
        let countQuery = `SELECT COUNT(*) as total FROM noticias WHERE activo = true`;
        const countParams = [];

        if (categoria) {
            countQuery += ' AND categoria = $1';
            countParams.push(categoria);
        }

        const countResult = await pool.query(countQuery, countParams);

        res.json({
            data: result.rows,
            total: parseInt(countResult.rows[0].total),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Error en listado de noticias:', error);
        res.status(500).json({ error: 'Error al obtener noticias' });
    }
});
```

### Ejemplo 2: Búsqueda con Texto Completo

```javascript
// ✅ Búsqueda optimizada con índice GIN
router.get('/noticias/search', async (req, res) => {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q) {
        return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
    }

    try {
        const query = `
            SELECT
                id,
                titulo,
                resumen,
                categoria,
                fecha,
                ts_rank(to_tsvector('spanish', titulo || ' ' || contenido),
                        plainto_tsquery('spanish', $1)) as rank
            FROM noticias
            WHERE activo = true
            AND to_tsvector('spanish', titulo || ' ' || contenido) @@ plainto_tsquery('spanish', $1)
            ORDER BY rank DESC, fecha DESC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [q, limit, offset]);

        res.json({
            data: result.rows,
            query: q,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ error: 'Error en búsqueda' });
    }
});
```

### Ejemplo 3: Consulta con JOIN Optimizada

```javascript
// ✅ JOIN optimizado con índices
router.get('/eventos/:id/inscritos', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT
                i.id,
                i.email_estudiante,
                i.nombre_estudiante,
                i.fecha_inscripcion,
                i.estado
            FROM inscripciones_actividades i
            INNER JOIN eventos e ON e.titulo = i.actividad
            WHERE e.id = $1
            AND i.estado = 'confirmada'
            ORDER BY i.fecha_inscripcion DESC
        `;

        const result = await pool.query(query, [id]);

        res.json({
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error al obtener inscritos:', error);
        res.status(500).json({ error: 'Error al obtener inscritos' });
    }
});
```

### Ejemplo 4: Agregaciones Eficientes

```javascript
// ✅ Agregaciones con índices
router.get('/stats/noticias', cache.middleware(300), async (req, res) => {
    try {
        const query = `
            SELECT
                categoria,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE destacado = true) as destacadas,
                COUNT(*) FILTER (WHERE fecha >= CURRENT_DATE - INTERVAL '30 days') as recientes
            FROM noticias
            WHERE activo = true
            GROUP BY categoria
            ORDER BY total DESC
        `;

        const result = await pool.query(query);

        // Estadísticas generales
        const totalQuery = `
            SELECT
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE destacado = true) as destacadas,
                COUNT(DISTINCT autor) as autores,
                MAX(fecha) as ultima_publicacion
            FROM noticias
            WHERE activo = true
        `;

        const totalResult = await pool.query(totalQuery);

        res.json({
            por_categoria: result.rows,
            general: totalResult.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});
```

---

## 🔍 Monitoreo y Mantenimiento

### Verificar Uso de Índices

```sql
-- Ver índices más utilizados
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
```

### Identificar Índices No Utilizados

```sql
-- Índices que nunca se han usado
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_toast%'
AND schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;
```

### Consultas Lentas

```sql
-- Habilitar logging de consultas lentas (en postgresql.conf)
-- log_min_duration_statement = 1000  # Loggea consultas > 1 segundo

-- Ver consultas más lentas (requiere pg_stat_statements)
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

### Mantenimiento Regular

```sql
-- Ejecutar mensualmente
VACUUM ANALYZE;

-- Para tabla específica
VACUUM ANALYZE noticias;

-- Ver necesidad de vacuum
SELECT
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_ratio DESC;
```

---

## ⚡ Mejoras de Rendimiento Esperadas

Con los índices implementados:

| Tipo de Consulta | Mejora Esperada |
|------------------|----------------|
| Listados activos ordenados | 70-90% más rápido |
| Búsquedas por fecha | 80-95% más rápido |
| Búsquedas de texto completo | 60-85% más rápido |
| Búsquedas por email | 95%+ más rápido |
| Consultas con filtros múltiples | 50-80% más rápido |
| Agregaciones | 40-70% más rápido |

---

## 🛠️ Herramientas de Análisis

### EXPLAIN ANALYZE

```sql
-- Analizar plan de ejecución
EXPLAIN ANALYZE
SELECT * FROM noticias
WHERE activo = true
AND categoria = 'académico'
ORDER BY fecha DESC
LIMIT 20;
```

### pgAdmin Query Tool

- Usar el botón "EXPLAIN" en pgAdmin
- Revisar gráficamente el plan de ejecución
- Identificar "Seq Scan" que deberían ser "Index Scan"

### pg_stat_statements

```sql
-- Instalar extensión (una vez)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configurar en postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'
```

---

## 📚 Referencias

- [PostgreSQL Performance Tips](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Index Types in PostgreSQL](https://www.postgresql.org/docs/current/indexes-types.html)
- [Understanding EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)

---

**Fecha de Creación**: 19 de Octubre, 2025
**Versión**: 1.0
**Autor**: Claude Code - Arquitecto BGE
