# 🔍 DIAGNOSTICO CRÍTICO: Errores de Esquema en Neon (FASE 30.5)

**Fecha:** 27 Noviembre 2025
**Status:** 🔴 BLOQUEADO - Esperando corrección de esquema
**Prioridad:** CRÍTICA

---

## 📋 RESUMEN DEL PROBLEMA

El usuario reporta error ejecutando el índice 5:
```sql
ERROR: column "user_id" does not exist (SQLSTATE 42703)
```

**Esto significa:** La tabla `calificaciones` NO tiene una columna llamada `user_id`. Tiene un nombre diferente.

---

## 🔴 ÍNDICES QUE FALLARON (CONFIRMADO)

### ✅ Índices Exitosos (1-4)
```sql
✅ idx_usuarios_role - OK
✅ idx_usuarios_email - OK
✅ idx_usuarios_status - OK
✅ idx_usuarios_role_nombre - OK
```

### ❌ Índices Fallidos (5+)
```sql
❌ idx_calificaciones_user_id - ERROR: column "user_id" does not exist
❌ idx_calificaciones_user_fecha - PENDIENTE (si index 5 falla)
❌ idx_calificaciones_asignatura - PENDIENTE
❌ idx_asistencia_user_id - PROBABLE QUE FALLE (mismo problema)
❌ idx_asistencia_user_fecha - PROBABLE QUE FALLE
... (más pendientes)
```

---

## 🔧 SOLUCIÓN: 3 PASOS PARA CORREGIR

### PASO 1: DIAGNOSTICAR LAS TABLAS REALES (5 minutos)

En Neon Console, ejecuta CADA comando en orden:

```sql
-- Comando 1: Ver estructura de CALIFICACIONES
\d calificaciones;

-- Esperar a ver las columnas. Luego copiar el nombre de la columna que contiene
-- el ID del usuario (ejemplos posibles):
-- - estudiante_id
-- - student_id
-- - user_pk_id
-- - usuario_id
-- - student_user_id
-- - etc
```

**Resultado esperado:** Una tabla con estructura como:
```
Column          |  Type
================|============
id              | integer
<NOMBRE_AQUI>   | integer or uuid  ← ESTO ES LO QUE NECESITAMOS
calificacion    | decimal
fecha           | date
... más columnas
```

```sql
-- Comando 2: Ver estructura de ASISTENCIA
\d asistencia;

-- Mismo proceso: identificar la columna que tiene el ID del usuario
```

```sql
-- Comando 3: Ver estructura de CITAS (appointments)
\d citas;

-- Buscar las columnas estado y fecha
```

```sql
-- Comando 4: Ver estructura de NOTIFICACIONES
\d notificaciones;

-- Buscar las columnas created_at, leido, user_id
```

```sql
-- Comando 5: Ver estructura de SUSCRIPTORES_NOTIFICACIONES
\d suscriptores_notificaciones;

-- Buscar tipo_interes, user_id
```

### PASO 2: REPORTAR LOS HALLAZGOS

Una vez que ejecutes los 5 comandos `\d`, copia TODO el output y pégalo aquí:

**Estructura real encontrada:**
```
[PEGA EL OUTPUT DE LOS COMANDOS \d AQUÍ]
```

---

## 📊 ANÁLISIS PROBABLE DE ESQUEMAS

Basándome en errores comunes, aquí hay las **posibilidades más probables**:

### Posibilidad A: Columnas con nombre diferente
```sql
-- ACTUAL EN LA BD (no "user_id"):
calificaciones.estudiante_id  -- En lugar de user_id
calificaciones.student_id      -- En lugar de user_id
calificaciones.usuario_id      -- En lugar de user_id
```

### Posibilidad B: Foreign key con alias
```sql
-- ACTUAL:
calificaciones.user_fk         -- En lugar de user_id
calificaciones.id_usuario      -- En lugar de user_id
```

### Posibilidad C: Tabla con nombre diferente
```sql
-- ACTUAL:
calificaciones_estudiante      -- En lugar de calificaciones
grades                         -- En lugar de calificaciones
```

---

## ⚙️ CORRECCIÓN DEL SCRIPT SQL

Una vez que identifiquemos los nombres reales, necesitaremos:

1. **Reemplazar `user_id` → `[NOMBRE_REAL]`** en 8 índices:
   - idx_calificaciones_user_id
   - idx_calificaciones_user_fecha
   - idx_asistencia_user_id
   - idx_asistencia_user_fecha
   - idx_citas_user_id
   - idx_notificaciones_user_fecha
   - idx_suscriptores_tipo_user

2. **Reemplazar otros nombres de columnas** si es necesario:
   - `fecha` → `[NOMBRE_REAL]` (si existe)
   - `estado` → `[NOMBRE_REAL]` (si existe)
   - `leido` → `[NOMBRE_REAL]` (si existe)

3. **Reemplazar nombres de tablas** si es necesario:
   - `calificaciones` → `[NOMBRE_REAL]`
   - `asistencia` → `[NOMBRE_REAL]`
   - etc.

---

## 📝 PRÓXIMOS PASOS

### INMEDIATO (AHORA):
1. ✅ Abre Neon Console
2. ✅ Ejecuta los 5 comandos `\d` para diagnosticar
3. ✅ Copia el output y pégalo aquí o en un nuevo archivo
4. ✅ Espera a que se corrija el script SQL

### DESPUÉS (5 minutos):
1. Se corregirá el script SQL con los nombres reales
2. Se ejecutarán los 18 índices corregidos
3. Se validará con EXPLAIN ANALYZE
4. Se ejecutará INTENTO-8 stress test

---

## 🚨 IMPORTANTE

**NO intentes ejecutar los índices 5-18 hasta que se corrija el script.**

Cada intento fallido añade:
- ❌ Frustración
- ❌ Errores no limpios en Neon
- ❌ Demora en resolver el problema

**Espera a que corrija el script.**

---

**Generado:** 27 Noviembre 2025, ~17:00 GMT
**Por:** Claude Code
**Status:** Aguardando diagnóstico de tablas en Neon Console

