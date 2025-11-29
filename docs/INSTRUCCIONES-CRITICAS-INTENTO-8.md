# 🚨 INSTRUCCIONES CRÍTICAS PARA INTENTO-8 (27 NOV 2025)

**Status:** 🔴 BLOQUEADO en Neon Console
**Prioridad:** CRÍTICA
**Tiempo Estimado:** 30-45 minutos
**Objetivo:** Crear índices SQL necesarios para que INTENTO-8 tenga éxito

---

## 📋 RESUMEN DEL PROBLEMA

INTENTO-7 fracasó con 100% ECONNREFUSED porque:
1. ❌ Los 18 índices SQL NUNCA fueron creados en Neon
2. ❌ Database latency sigue siendo 1.6+ segundos
3. ❌ Connection pool se agota bajo stress load

**Solución:** Ejecutar 18 índices SQL en Neon, LUEGO re-ejecutar INTENTO-8

---

## ✅ PASO 1: VERIFICAR ÍNDICES ACTUALES EN NEON (2 minutos)

### 1.1 Abrir Neon Console
```
Ir a: https://console.neon.tech/
```

### 1.2 Seleccionar base de datos BGE
- Hacer clic en "Database"
- Seleccionar "bgheroes_db" (o tu base de datos)

### 1.3 Abrir SQL Editor
- Hacer clic en "SQL Editor" (a la izquierda)
- Aparecerá un editor en blanco

### 1.4 Verificar índices existentes
**Copiar y pegar EXACTAMENTE esta query:**

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY indexname;
```

**Ejecutar:** Boton verde "Run"

**Resultado esperado:**
```
Si hay 0 resultados:
  ❌ Los índices NO existen (necesitan ser creados)

Si hay 18+ resultados:
  ✅ Los índices ya existen (saltar al PASO 3)
```

---

## ✅ PASO 2: CREAR 18 ÍNDICES SQL (30 minutos)

**Si el resultado anterior fue VACÍO, ejecutar esto:**

### 2.1 Abrir archivo SQL
```
Ubicación: backend/scripts/crear-indices-criticos-fase-30-5.sql
```

### 2.2 Copiar índices (UNO POR UNO)
**IMPORTANTE: No copiar todos al mismo tiempo, copiar UNO POR UNO**

```sql
-- ÍNDICE 1
CREATE INDEX IF NOT EXISTS idx_usuarios_role
  ON usuarios(role);
```

### 2.3 Pegar en Neon Console
- Limpiar SQL Editor anterior
- Pegar el índice
- Hacer clic en "Run"
- Esperar a que diga "CREATE INDEX"
- Pasar al siguiente índice

### 2.4 Repetir para todos los 18 índices

```sql
-- ÍNDICE 2
CREATE INDEX IF NOT EXISTS idx_usuarios_email
  ON usuarios(email);

-- ÍNDICE 3
CREATE INDEX IF NOT EXISTS idx_usuarios_status
  ON usuarios(status);

-- ÍNDICE 4
CREATE INDEX IF NOT EXISTS idx_usuarios_role_nombre
  ON usuarios(role, nombre);

-- ÍNDICE 5
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_id
  ON calificaciones(user_id);

-- ÍNDICE 6
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_fecha
  ON calificaciones(user_id, fecha DESC);

-- ÍNDICE 7
CREATE INDEX IF NOT EXISTS idx_calificaciones_asignatura
  ON calificaciones(asignatura_id);

-- ÍNDICE 8
CREATE INDEX IF NOT EXISTS idx_asistencia_user_id
  ON asistencia(user_id);

-- ÍNDICE 9
CREATE INDEX IF NOT EXISTS idx_asistencia_user_fecha
  ON asistencia(user_id, fecha DESC);

-- ÍNDICE 10
CREATE INDEX IF NOT EXISTS idx_citas_estado_fecha
  ON citas(estado, fecha_solicitada DESC);

-- ÍNDICE 11
CREATE INDEX IF NOT EXISTS idx_citas_user_id
  ON citas(user_id);

-- ÍNDICE 12
CREATE INDEX IF NOT EXISTS idx_notificaciones_user_fecha
  ON notificaciones(user_id, created_at DESC);

-- ÍNDICE 13
CREATE INDEX IF NOT EXISTS idx_notificaciones_leido
  ON notificaciones(leido);

-- ÍNDICE 14
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_interes
  ON suscriptores_notificaciones(tipo_interes);

-- ÍNDICE 15
CREATE INDEX IF NOT EXISTS idx_suscriptores_tipo_user
  ON suscriptores_notificaciones(tipo_interes, user_id);

-- ÍNDICE 16
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status
  ON pending_approvals(status);

-- ÍNDICE 17
CREATE INDEX IF NOT EXISTS idx_pending_approvals_form_type
  ON pending_approvals(form_type);

-- ÍNDICE 18
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status_fecha
  ON pending_approvals(status, created_at DESC);
```

---

## ✅ PASO 3: VALIDAR QUE LOS ÍNDICES SE CREARON (3 minutos)

**Ejecutar esta query en Neon Console:**

```sql
SELECT COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
```

**Resultado esperado:**
```
total_indices: 18

✅ Si es 18 o más: ÉXITO - Los índices están creados
❌ Si es menos: Algunos no se crearon, revisar errores
```

---

## ✅ PASO 4: VALIDAR PERFORMANCE CON EXPLAIN ANALYZE (5 minutos)

**Ejecutar la query CRÍTICA más lenta:**

```sql
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
```

**Analizar el resultado:**

```
ANTES (sin índices):
  Seq Scan on usuarios  (cost=0.00..35.50 rows=100)
  Execution Time: 1200.456 ms  ❌ MUY LENTO

DESPUÉS (con índices):
  Index Scan using idx_usuarios_role on usuarios
  Execution Time: 45.123 ms  ✅ RÁPIDO
```

**Criterio de éxito:**
- Execution Time < 200ms → ✅ ÉXITO

---

## ✅ PASO 5: EJECUTAR INTENTO-8 STRESS TEST (15 minutos)

### 5.1 Reiniciar servidor backend
**En terminal, en directorio del proyecto:**

```bash
cd C:\03_BachilleratoHeroesWeb
npm start
```

**Esperar a ver:**
```
[LOG] 🚀 Servidor backend iniciado en http://localhost:3000
[LOG] ✅ Conexión a PostgreSQL (Neon) establecida correctamente
```

### 5.2 Ejecutar stress test INTENTO-8

**En OTRA terminal:**

```bash
cd C:\03_BachilleratoHeroesWeb
npx artillery run backend/load-tests/artillery-stress-test-3000.yml --target "http://localhost:3000"
```

**Esto tardará ~15 minutos**

### 5.3 Monitorear resultados

**En OTRA terminal (opcional):**

```bash
# Ver progreso cada 30 segundos
for i in {1..30}; do
  sleep 30
  echo "Minuto $((i/2)):"
  tail -5 backend/load-tests/stress-test-INTENTO-8.log | head -1
done
```

---

## 🎯 CRITERIOS DE ÉXITO PARA INTENTO-8

| Métrica | INTENTO-7 | Meta para INTENTO-8 | ✅ Éxito? |
|---------|-----------|--------------------|---------|
| Success Rate | 0% | >80% | ✅ |
| ECONNREFUSED | 100% | <5% | ✅ |
| Request Rate | 8/seg | >8/seg | - |
| Database Latency | 1.6s | <200ms | ✅ |

**Si todos están en ✅, INTENTO-8 será exitoso**

---

## ⚠️ TROUBLESHOOTING

### Si algún índice da error
```
Error: relation "tabla_x" does not exist
```

**Solución:**
- Tabla no existe o nombre está mal
- Verificar nombre exacto en Neon
- Algunos scripts SQL asumen nombres de tablas que pueden variar

### Si Execution Time sigue siendo lenta (>200ms)
```
Execution Time: 1200.456 ms  ❌ Los índices no se crearon correctamente
```

**Solución:**
1. Verificar que los índices existen (PASO 3)
2. Ejecutar VACUUM ANALYZE:
   ```sql
   VACUUM ANALYZE;
   ```
3. Re-ejecutar EXPLAIN ANALYZE

### Si INTENTO-8 sigue fallando
1. Verificar que el servidor está corriendo (PASO 5.1)
2. Verificar que Neon está conectada (ver logs de servidor)
3. Revisar `docs/FASE-30-5-ANALISIS-CRITICO-INTENTO-7-FAILURE.md` para diagnóstico profundo

---

## 📊 TIMELINE ESPERADO

| Paso | Tarea | Tiempo | Acumulado |
|------|-------|--------|-----------|
| 1 | Verificar índices | 2 min | 2 min |
| 2 | Crear 18 índices | 30 min | 32 min |
| 3 | Validar índices | 3 min | 35 min |
| 4 | EXPLAIN ANALYZE | 5 min | 40 min |
| 5 | INTENTO-8 stress test | 15 min | 55 min |

**Total estimado: ~1 hora**

---

## 🔄 SIGUIENTE PASOS DESPUÉS DE INTENTO-8

### Si INTENTO-8 es EXITOSO (Success Rate >80%)
1. ✅ Las 3 soluciones finalmente funcionan correctamente
2. ✅ Documentar resultados
3. ✅ Hacer commit
4. ✅ Proceder a siguiente fase (FASE 31)

### Si INTENTO-8 FALLA (Success Rate <80%)
1. Ejecutar Heap Dump Analyzer durante stress test:
   ```bash
   node backend/scripts/heap-dump-analyzer.js --monitor
   ```
2. Generar heap dumps para análisis profundo
3. Investigar qué queries siguen siendo lentas
4. Revisar `docs/FASE-30-5-ANALISIS-CRITICO-INTENTO-7-FAILURE.md` para investigación adicional

---

## 📞 REFERENCIAS RÁPIDAS

- Análisis del problema: `docs/FASE-30-5-ANALISIS-CRITICO-INTENTO-7-FAILURE.md`
- Scripts SQL: `backend/scripts/crear-indices-criticos-fase-30-5.sql`
- Guía de optimización: `docs/FASE-30-5-QUERY-OPTIMIZATION-GUIDE.md`
- Resultados INTENTO-7: `backend/load-tests/stress-test-INTENTO-7-FINAL.log`

---

**Generado:** 27 Noviembre 2025
**Por:** Claude Code
**Status:** Aguardando ejecución manual en Neon Console
