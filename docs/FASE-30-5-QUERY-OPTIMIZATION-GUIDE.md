# 📊 FASE 30.5 - GUÍA DE OPTIMIZACIÓN DE QUERIES - TAREA 2

**Fecha:** 26-27 Noviembre 2025
**Estado:** Implementación en ejecución
**Prioridad:** 🔴 CRÍTICA (Database latency 1.6s)

---

## 📌 DIAGNÓSTICO ACTUAL

### Problema Identificado:
- **Latency actual:** 1.6 segundos (CRÍTICO)
- **Saturación de memoria:** 90% (319 de 356 MB)
- **Causa raíz:** Database queries lentas + memory saturation
- **Impacto:** Sistema operativo rechaza conexiones TCP (100% ECONNREFUSED en stress tests)

---

## 🎯 OBJETIVOS

1. **Identificar queries lentas** (>100ms)
2. **Analizar planes de ejecución** con EXPLAIN ANALYZE
3. **Crear índices faltantes** para optimizar búsquedas
4. **Reducir latency de 1.6s a <500ms** (meta: <200ms óptimo)
5. **Reducir consumo de memoria** en resultsets grandes

---

## 🔍 PASO 1: IDENTIFICAR QUERIES LENTAS

### Método 1: Habilitar Query Logging en PostgreSQL

**Ubicación:** Neon Console → Settings → Database → Query Performance

**Configuración recomendada:**
```sql
-- Conectarse a base de datos en Neon Console

-- Activar logging de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries >100ms

-- Aplicar cambios
SELECT pg_reload_conf();

-- Verificar configuración
SHOW log_min_duration_statement;
-- Esperado output: 100
```

**Resultado:** Las queries que demoren >100ms se registrarán en los logs

---

### Método 2: Usar EXPLAIN ANALYZE en Neon Console

**Pasos:**

1. **Abrir Neon Console**
2. **Copiar la query sospechosa (ver lista abajo)**
3. **Anteponer EXPLAIN ANALYZE:**

```sql
-- ANTES
SELECT * FROM usuarios WHERE email = 'user@example.com';

-- DESPUÉS (con EXPLAIN ANALYZE)
EXPLAIN ANALYZE
SELECT * FROM usuarios WHERE email = 'user@example.com';
```

4. **Ejecutar y analizar resultados**

**Qué buscar en el output:**
```
Seq Scan on usuarios  (cost=0.00..35.50 rows=1 width=156)
  Filter: (email = 'user@example.com'::text)
  Planning Time: 0.125 ms
  Execution Time: 0.456 ms
```

- 🔴 **Seq Scan** = Mala (escanea toda la tabla)
- ✅ **Index Scan** = Buena (usa índice)
- **Execution Time >100ms** = Requiere optimización

---

## 📋 QUERIES SOSPECHOSAS A ANALIZAR

### Prioridad 1: CRÍTICA (Probablemente son el problema)

#### 1. `/api/admin/students` - GET sin parámetros
```sql
-- Archivo: backend/routes/admin.js
-- Analizar EXPLAIN ANALYZE:

EXPLAIN ANALYZE
SELECT u.*,
       COUNT(DISTINCT a.id) as attendance_count,
       AVG(g.calificacion) as average_grade
FROM usuarios u
LEFT JOIN asistencia a ON u.id = a.user_id
LEFT JOIN calificaciones g ON u.id = g.user_id
WHERE u.role = 'estudiante'
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 100;

-- Esperado: <200ms
-- Actual: Probablemente >500ms (JOIN sin índices)
```

**Problema potencial:**
- Falta índice en `asistencia.user_id`
- Falta índice en `calificaciones.user_id`
- Falta índice en `usuarios.role`
- GROUP BY sin índices agregados

**Solución (ver paso 3):**
```sql
-- Crear índices
CREATE INDEX idx_asistencia_user_id ON asistencia(user_id);
CREATE INDEX idx_calificaciones_user_id ON calificaciones(user_id);
CREATE INDEX idx_usuarios_role ON usuarios(role);
```

#### 2. `/api/admin/teachers` - GET
```sql
-- Archivo: backend/routes/admin.js

EXPLAIN ANALYZE
SELECT * FROM usuarios
WHERE role = 'docente'
ORDER BY nombre ASC;

-- Esperado: <50ms (si hay índice)
-- Actual: Probablemente >200ms (Seq Scan)
```

**Solución:**
```sql
CREATE INDEX idx_usuarios_role_nombre ON usuarios(role, nombre);
```

#### 3. Búsqueda global `/api/search`
```sql
-- Archivo: backend/routes/search.js (si existe)

EXPLAIN ANALYZE
SELECT * FROM usuarios
WHERE nombre ILIKE '%search_term%'
   OR email ILIKE '%search_term%'
   OR apellido_paterno ILIKE '%search_term%'
LIMIT 50;

-- Esperado: <100ms con índices full-text
-- Actual: Probablemente >1000ms (4 ILIKE = 4 Seq Scans)
```

**Solución:**
```sql
-- Crear índice full-text
CREATE INDEX idx_usuarios_fulltext ON usuarios
USING GIN(to_tsvector('spanish', nombre || ' ' || email || ' ' || apellido_paterno));

-- Query optimizada:
EXPLAIN ANALYZE
SELECT * FROM usuarios
WHERE to_tsvector('spanish', nombre || ' ' || email || ' ' || apellido_paterno)
      @@ plainto_tsquery('spanish', 'search_term')
LIMIT 50;
```

---

### Prioridad 2: ALTA (Probables cuellos de botella)

#### 4. Cálculo de calificaciones por estudiante
```sql
EXPLAIN ANALYZE
SELECT u.id, u.nombre,
       COUNT(c.id) as total_grades,
       AVG(c.calificacion) as average,
       MAX(c.calificacion) as max_grade,
       MIN(c.calificacion) as min_grade
FROM usuarios u
LEFT JOIN calificaciones c ON u.id = c.user_id
WHERE u.role = 'estudiante'
GROUP BY u.id, u.nombre
HAVING COUNT(c.id) > 0;

-- Esperado: <200ms para 1000 estudiantes
-- Actual: Probablemente >2000ms sin índices
```

**Soluciones:**
```sql
-- Índice sobre user_id (para JOIN)
CREATE INDEX idx_calificaciones_user_id ON calificaciones(user_id);

-- Índice sobre role (para filtro)
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- Índice compuesto (óptimo para esta query)
CREATE INDEX idx_calificaciones_user_fecha ON calificaciones(user_id, fecha DESC);
```

#### 5. Búsqueda de suscriptores por tipo
```sql
EXPLAIN ANALYZE
SELECT u.*, s.tipo_interes, COUNT(n.id) as notification_count
FROM usuarios u
JOIN suscriptores_notificaciones s ON u.id = s.user_id
LEFT JOIN notificaciones n ON u.id = n.user_id AND n.created_at > NOW() - INTERVAL '7 days'
WHERE s.tipo_interes = 'noticias'
GROUP BY u.id, s.tipo_interes
ORDER BY u.created_at DESC;

-- Esperado: <150ms para 10,000 suscriptores
-- Actual: Probablemente >800ms sin índices
```

**Soluciones:**
```sql
CREATE INDEX idx_suscriptores_tipo_interes ON suscriptores_notificaciones(tipo_interes, user_id);
CREATE INDEX idx_notificaciones_user_fecha ON notificaciones(user_id, created_at DESC);
```

---

### Prioridad 3: MEDIA (Impacto moderado)

#### 6. Operaciones de citas/appointments
```sql
EXPLAIN ANALYZE
SELECT * FROM citas
WHERE estado = 'pendiente'
  AND fecha_solicitada >= NOW()
ORDER BY fecha_solicitada ASC
LIMIT 20;

-- Esperado: <50ms
-- Actual: Probablemente >200ms sin índices
```

**Solución:**
```sql
CREATE INDEX idx_citas_estado_fecha ON citas(estado, fecha_solicitada);
```

---

## 📐 PASO 2: ANALIZAR PLAN DE EJECUCIÓN

### Estructura del output de EXPLAIN ANALYZE:

```
Limit  (cost=1234.56..1234.78 rows=20 width=156)
  ->  Sort  (cost=1234.56..1350.00 rows=4600 width=156)
        Sort Key: fecha_solicitada ASC
        ->  Index Scan using idx_citas_estado_fecha on citas
              Index Cond: (estado = 'pendiente'::text)
              Filter: (fecha_solicitada >= now())
```

### Interpretación:

| Componente | Significado | Bueno vs Malo |
|-----------|-----------|-------------|
| **Seq Scan** | Escanea fila por fila (sin índice) | 🔴 Malo |
| **Index Scan** | Usa índice (eficiente) | ✅ Bueno |
| **Index Only Scan** | Usa índice sin acceder tabla | ✅ Excelente |
| **Bitmap Scan** | Combina múltiples índices | ✅ Bueno |
| **Nested Loop** | Itera tabla interna N veces | 🟡 Depende |
| **Hash Join** | Carga tabla en memoria y compara | 🟡 Depende |
| **Merge Join** | Ordena y compara (óptimo si ya ordenado) | ✅ Bueno |
| **Execution Time >100ms** | Query es lenta | 🔴 Requiere fixes |

---

## 🔧 PASO 3: CREAR ÍNDICES NECESARIOS

### Verificar índices existentes:

```sql
-- En Neon Console, ejecutar:

-- Ver todos los índices en la tabla
SELECT * FROM pg_indexes
WHERE tablename = 'usuarios';

-- Ver tamaño de los índices
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_indexes
WHERE tablename IN ('usuarios', 'calificaciones', 'asistencia')
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Índices recomendados (CRÍTICOS):

```sql
-- ========== TABLA: usuarios ==========

-- 1. Para filtros por role (docente, estudiante, etc)
CREATE INDEX IF NOT EXISTS idx_usuarios_role
ON usuarios(role);

-- 2. Para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email
ON usuarios(email);

-- 3. Para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_usuarios_status
ON usuarios(status);

-- 4. Para full-text search
CREATE INDEX IF NOT EXISTS idx_usuarios_fulltext
ON usuarios USING GIN(to_tsvector('spanish',
    COALESCE(nombre, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(apellido_paterno, '')
));

-- ========== TABLA: calificaciones ==========

-- 5. Para JOINs con usuarios
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_id
ON calificaciones(user_id);

-- 6. Para búsquedas de calificaciones recientes
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_fecha
ON calificaciones(user_id, fecha DESC);

-- 7. Para filtros de asignatura
CREATE INDEX IF NOT EXISTS idx_calificaciones_asignatura
ON calificaciones(asignatura_id);

-- ========== TABLA: asistencia ==========

-- 8. Para JOINs con usuarios
CREATE INDEX IF NOT EXISTS idx_asistencia_user_id
ON asistencia(user_id);

-- 9. Para búsquedas de asistencia por fecha
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha
ON asistencia(fecha DESC);

-- 10. Para reporte de asistencia
CREATE INDEX IF NOT EXISTS idx_asistencia_user_fecha
ON asistencia(user_id, fecha DESC);

-- ========== TABLA: suscriptores_notificaciones ==========

-- 11. Para búsquedas por tipo de interés
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_interes
ON suscriptores_notificaciones(tipo_interes);

-- 12. Para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_suscriptores_user_id
ON suscriptores_notificaciones(user_id);

-- 13. Índice compuesto (óptimo para queries comunes)
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_user
ON suscriptores_notificaciones(tipo_interes, user_id);

-- ========== TABLA: citas ==========

-- 14. Para búsquedas de citas pendientes
CREATE INDEX IF NOT EXISTS idx_citas_estado
ON citas(estado);

-- 15. Para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_citas_fecha
ON citas(fecha_solicitada);

-- 16. Índice compuesto (óptimo para queries comunes)
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha
ON citas(estado, fecha_solicitada);

-- ========== TABLA: notificaciones ==========

-- 17. Para búsquedas de notificaciones recientes
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_fecha
ON notificaciones(user_id, created_at DESC);

-- 18. Para limpieza de notificaciones antiguas
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at
ON notificaciones(created_at);
```

### Script para crear TODOS los índices:

```bash
# Copiar en Neon Console y ejecutar:
```

```sql
-- ✅ ÍNDICES CRÍTICOS PARA FASE 30.5
-- Ejecutar todos juntos para mejor performance

-- USUARIOS
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_fulltext ON usuarios USING GIN(to_tsvector('spanish', COALESCE(nombre, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(apellido_paterno, '')));

-- CALIFICACIONES
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_id ON calificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_fecha ON calificaciones(user_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_calificaciones_asignatura ON calificaciones(asignatura_id);

-- ASISTENCIA
CREATE INDEX IF NOT EXISTS idx_asistencia_user_id ON asistencia(user_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_fecha ON asistencia(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_asistencia_user_fecha ON asistencia(user_id, fecha DESC);

-- SUSCRIPTORES
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_interes ON suscriptores_notificaciones(tipo_interes);
CREATE INDEX IF NOT EXISTS idx_suscriptores_user_id ON suscriptores_notificaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_user ON suscriptores_notificaciones(tipo_interes, user_id);

-- CITAS
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha_solicitada);
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha ON citas(estado, fecha_solicitada);

-- NOTIFICACIONES
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_fecha ON notificaciones(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at);

-- ✅ VERIFICAR CREACIÓN
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

---

## 🚀 PASO 4: VALIDAR MEJORAS

### Antes vs Después:

```bash
# 1. Ejecutar EXPLAIN ANALYZE ANTES (sin índices)
EXPLAIN ANALYZE
SELECT u.*, COUNT(a.id) FROM usuarios u
LEFT JOIN asistencia a ON u.id = a.user_id
WHERE u.role = 'estudiante'
GROUP BY u.id
LIMIT 100;

# Resultado esperado ANTES: Execution Time: 1500-2000 ms 🔴

# 2. Crear índices (arriba)

# 3. Ejecutar EXPLAIN ANALYZE DESPUÉS (con índices)
EXPLAIN ANALYZE
SELECT u.*, COUNT(a.id) FROM usuarios u
LEFT JOIN asistencia a ON u.id = a.user_id
WHERE u.role = 'estudiante'
GROUP BY u.id
LIMIT 100;

# Resultado esperado DESPUÉS: Execution Time: 50-150 ms ✅
```

---

## 📊 PASO 5: MONITOREO Y LOGS

### Verificar queries lentas que se registraron:

```bash
# En Neon Console → Logs:
SELECT * FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;

# Resultado: Mostrar las queries más lentas
```

---

## 🎯 CHECKLIST DE IMPLEMENTACIÓN

- [ ] **Tarea 1:** Ejecutar EXPLAIN ANALYZE en Neon Console (30 minutos)
  - [ ] Analizar `/api/admin/students`
  - [ ] Analizar búsqueda global
  - [ ] Analizar calificaciones

- [ ] **Tarea 2:** Crear todos los 18 índices (15 minutos)
  - [ ] Copiar script SQL de Paso 3
  - [ ] Ejecutar en Neon Console
  - [ ] Verificar creación: SELECT * FROM pg_indexes WHERE tablename LIKE 'usuarios'

- [ ] **Tarea 3:** Validar mejoras (20 minutos)
  - [ ] Re-ejecutar EXPLAIN ANALYZE en queries críticas
  - [ ] Comparar Execution Time ANTES vs DESPUÉS
  - [ ] Meta: <200ms para queries comunes

- [ ] **Tarea 4:** Ejecutar stress test INTENTO-7 (15 minutos)
  - [ ] Reiniciar servidor backend
  - [ ] Correr stress test nuevamente
  - [ ] Comparar 100% ECONNREFUSED vs tasa de éxito >80%

---

## 💡 TIPS DE OPTIMIZACIÓN ADICIONAL

### 1. Reducir resultsets innecesarios:
```sql
-- ❌ MALO: Traer TODAS las columnas
SELECT * FROM usuarios;

-- ✅ BUENO: Traer solo columnas necesarias
SELECT id, nombre, email, role FROM usuarios;
```

### 2. Usar LIMIT en queries exploratorias:
```sql
-- ❌ MALO: Procesar 1M de filas
SELECT * FROM calificaciones WHERE year = 2025;

-- ✅ BUENO: Procesar <1000 filas
SELECT * FROM calificaciones WHERE year = 2025 LIMIT 100;
```

### 3. Batch operations en lugar de N+1:
```sql
-- ❌ MALO: 1000 queries (una por estudiante)
for each student:
  SELECT COUNT(*) FROM calificaciones WHERE user_id = student.id;

-- ✅ BUENO: 1 query (para todos)
SELECT user_id, COUNT(*) as count
FROM calificaciones
GROUP BY user_id;
```

### 4. Usar EXPLAIN (sin ANALYZE) para planning rápido:
```sql
-- Más rápido que EXPLAIN ANALYZE (no ejecuta, solo estima)
EXPLAIN SELECT * FROM usuarios WHERE role = 'estudiante';

-- Cuando necesites ejecución real:
EXPLAIN ANALYZE SELECT * FROM usuarios WHERE role = 'estudiante';
```

---

## 📖 DOCUMENTACIÓN DE REFERENCIA

- **PostgreSQL EXPLAIN:** https://www.postgresql.org/docs/current/sql-explain.html
- **Query Planning:** https://www.postgresql.org/docs/current/using-explain.html
- **Índices PostgreSQL:** https://www.postgresql.org/docs/current/indexes.html
- **Full-Text Search:** https://www.postgresql.org/docs/current/textsearch.html

---

## 🔴 RESUMEN

| Problema | Solución | Impacto Esperado |
|----------|----------|-----------------|
| Database latency 1.6s | Crear 18 índices + EXPLAIN ANALYZE | -80% (1.6s → 300ms) |
| Memory saturation 90% | Reducir resultsets + usar LIMIT | -40% (90% → 50%) |
| 100% ECONNREFUSED | Ambos arriba + Circuit Breaker | Éxito >80% |

---

**Próximo paso:** Ejecutar este análisis en Neon Console y reportar resultados.

