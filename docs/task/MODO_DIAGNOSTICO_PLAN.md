# 🔍 MODO DIAGNÓSTICO: Plan de Investigación del Índice

**Fecha:** 10 de Noviembre de 2025
**Objetivo:** Determinar por qué el planificador de Neon ignora el índice incluso con COLLATE "C"

---

## 📋 Resumen del Problema

Hemos intentado múltiples soluciones sin éxito:
1. ❌ Índice B-Tree simple → Ignorado (Seq Scan)
2. ❌ Índice con COLLATE "C" → Ignorado (Seq Scan con Parallel)
3. ❌ Incluso con 50,000 filas → Aún Seq Scan

**Conclusión provisional:** El problema NO es el índice, sino cómo PostgreSQL evalúa su utilidad.

---

## 🔬 Plan de Diagnóstico (6 pasos)

### Paso 1: Verificar Collation de Columnas

**Script:** `backend/scripts/diagnostic-index-analysis.sql`

**Consulta:**
```sql
SELECT a.attname, c.collname
FROM pg_attribute a
JOIN pg_collation c ON a.attcollation = c.oid
JOIN pg_class cl ON a.attrelid = cl.oid
WHERE cl.relname = 'estudiantes'
AND a.attname IN ('apellido_paterno', 'apellido_materno', 'nombre');
```

**Qué buscamos:**
- ¿El collation es `default`?
- ¿El collation es `es_MX.utf8`?
- ¿El collation es `C`?

**Por qué importa:** Si la columna tiene collation diferente al índice, PostgreSQL no lo usará.

---

### Paso 2: Forzar COLLATE en la Consulta SELECT (CRÍTICO)

**Consulta:**
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id, matricula, nombre, apellido_paterno, apellido_materno,
    especialidad, semestre, promedio, status_academico
FROM estudiantes
ORDER BY
    apellido_paterno COLLATE "C" ASC,
    apellido_materno COLLATE "C" ASC,
    nombre COLLATE "C" ASC;
```

**Qué buscamos:**
- ✅ ¿Usa **Index Scan using idx_estudiantes_apellidos_nombre_collate**?
- ❌ ¿Aún **Seq Scan** + **Sort**?

**Por qué es crítico:** Si forzando COLLATE "C" en la consulta SÍ usa Index Scan, el problema está en que:
- La aplicación NO está usando COLLATE en sus queries
- Las columnas probablemente tienen collation diferente
- La solución sería alterarlas con `ALTER COLUMN ... COLLATE "C"`

---

### Paso 3: Analizar Estadísticas de Distinctividad

**Consulta:**
```sql
SELECT
    attname,
    n_distinct,
    n_distinct_inherited
FROM pg_stats
WHERE tablename = 'estudiantes'
AND attname IN ('apellido_paterno', 'apellido_materno', 'nombre');
```

**Qué buscamos:**
- ¿Cuántos valores únicos hay en cada columna?
- Ejemplo: Si hay solo 100 valores únicos en 50,000 filas:
  - Ratio: 100 / 50,000 = 0.2%
  - PostgreSQL dirá: "No vale la pena usar índice, hay muchos duplicados"

**Por qué importa:** Un ratio bajo de distinctividad puede hacer que PostgreSQL prefiera Seq Scan.

---

### Paso 4: Información del Índice

**Consulta:**
```sql
SELECT
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size,
    idx_scan as times_used
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes ON ...
WHERE tablename = 'estudiantes'
AND indexname LIKE '%apellidos%';
```

**Qué buscamos:**
- ¿Existe el índice `idx_estudiantes_apellidos_nombre_collate`?
- ¿Tiene tamaño razonable (>1MB)?
- ¿Ha sido usado alguna vez (`idx_scan` > 0)?

---

### Paso 5: Configuración del Query Planner

**Consultas:**
```sql
SHOW random_page_cost;
SHOW seq_page_cost;
SHOW cpu_tuple_cost;
SHOW cpu_index_tuple_cost;
SHOW effective_cache_size;
```

**Qué buscamos:**
- `random_page_cost` = 4.0 (valor por defecto)
- `seq_page_cost` = 1.0 (valor por defecto)

**Interpretación:**
- Si `random_page_cost` es muy alto (>8), Seq Scan es más barato que Index Scan
- Neon Cloud podría tener configuración diferente a PostgreSQL estándar

---

### Paso 6: Estadísticas Generales de la Tabla

**Consulta:**
```sql
SELECT
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'estudiantes';
```

**Qué buscamos:**
- ¿Cuándo fue el último ANALYZE?
- ¿Hay muchos dead tuples (n_dead_tup)?
- ¿Fue autovacuumed recientemente?

---

## 📊 Hipótesis Principales

| # | Hipótesis | Probabilidad | Síntoma |
|---|-----------|--------------|---------|
| 1 | Collation mismatch | ⭐⭐⭐⭐⭐ | COLLATE "C" en ORDER BY funciona, en columna no |
| 2 | Distinctividad baja | ⭐⭐⭐ | n_distinct < 10% del total de filas |
| 3 | Configuración Neon | ⭐⭐ | random_page_cost muy alto |
| 4 | Índice corrupto | ⭐ | Índice existe pero idx_scan = 0 siempre |
| 5 | Tabla muy pequeña | ⭐ | Aunque tenemos 50k filas, maybe Neon calcula diferente |

---

## 🎯 Flujo de Decisión

```
¿COLLATE "C" en ORDER BY usa Index Scan?
├─ SÍ → El problema es collation de columna
│      └─ Solución: ALTER TABLE ... COLLATE "C"
│      └─ Modificar select de aplicación
│
└─ NO → El problema es más profundo
       ├─ ¿n_distinct muy bajo?
       │  └─ Solución: Actualizar estadísticas (ANALYZE FULL)
       │  └─ O reconsiderar índice compuesto
       │
       └─ ¿random_page_cost muy alto?
          └─ Solución: Ajustar configuración Neon
          └─ O usar hint (SET enable_seqscan = off)
```

---

## 📝 Instrucciones de Ejecución

### En Neon Console (SQL Editor)

1. **Copiar el script completo:**
   ```
   backend/scripts/diagnostic-index-analysis.sql
   ```

2. **Pegar en SQL Editor**

3. **Ejecutar cada consulta por separado** (no todas a la vez):
   - PASO 1: Collation check
   - PASO 2: EXPLAIN con COLLATE forzado (IMPORTANTE)
   - PASO 3: Estadísticas
   - PASO 4: Info del índice
   - PASO 5: Configuración
   - PASO 6: Tabla stats

4. **Documentar RESULTADOS en cada paso**

---

## 📋 Checklist de Diagnóstico

- [ ] PASO 1: Verificar collation actual de columnas
- [ ] PASO 2: Ejecutar EXPLAIN con COLLATE "C" en ORDER BY
  - [ ] ¿Usa Index Scan?
  - [ ] ¿Cuál es el tiempo de ejecución?
- [ ] PASO 3: Obtener n_distinct para 3 columnas
- [ ] PASO 4: Verificar que índice existe y su tamaño
- [ ] PASO 5: Capturar parámetros de configuración
- [ ] PASO 6: Obtener estadísticas de tabla

---

## 🎬 Qué Hacer con Resultados

Una vez ejecutes los 6 pasos:

1. **Proporciona un informe con:**
   - Collation actual de cada columna
   - Plan EXPLAIN con COLLATE "C" (si lo ves)
   - Valores de n_distinct
   - Cualquier anomalía encontrada

2. **Yo analizaré** los resultados y determinaré:
   - Causa raíz del problema
   - Solución específica (no generic)
   - Pasos para implementarla

3. **Evitaremos** más "intentos al azar"

---

## ⚠️ IMPORTANTE

**NO ejecutes ningún comando ALTER o DROP.**
**SOLO INVESTIGA Y REPORTA.**

La solución surgirá del diagnóstico, no de prueba y error.

---

**Tiempo estimado:** 10-15 minutos

🔍 Ready for deep investigation!
