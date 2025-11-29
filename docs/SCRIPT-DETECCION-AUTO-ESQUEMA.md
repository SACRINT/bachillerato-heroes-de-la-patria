# 🔧 SCRIPT DE AUTO-DETECCIÓN DE ESQUEMA (ALTERNATIVA)

**Fecha:** 27 Noviembre 2025
**Status:** 🟡 ALTERNATIVA SI EL USUARIO NO PUEDE EJECUTAR \d

---

## 📋 PROBLEMA

El usuario reporta errores SQL porque los nombres de columnas NO coinciden con lo documentado:
- Esperado: `calificaciones.user_id`
- Real en BD: ¿`calificaciones.estudiante_id`? ¿`calificaciones.user_fk`?

---

## ✅ SOLUCIÓN: Script de Auto-Detección

Si el usuario **no puede o no quiere** ejecutar `\d` manualmente, puede usar este script SQL que detecta automáticamente la estructura:

### Copiar y pegar EN NEON CONSOLE:

```sql
-- ============================================
-- AUTO-DETECCIÓN DE ESTRUCTURA DE TABLAS
-- ============================================
-- Este script identifica automáticamente los nombres
-- de columnas reales en tu base de datos

-- 1. DETECTAR COLUMNAS DE calificaciones
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'calificaciones'
ORDER BY ordinal_position;

-- 2. DETECTAR COLUMNAS DE asistencia
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'asistencia'
ORDER BY ordinal_position;

-- 3. DETECTAR COLUMNAS DE citas
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'citas'
ORDER BY ordinal_position;

-- 4. DETECTAR COLUMNAS DE notificaciones
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notificaciones'
ORDER BY ordinal_position;

-- 5. DETECTAR COLUMNAS DE suscriptores_notificaciones
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'suscriptores_notificaciones'
ORDER BY ordinal_position;
```

---

## 📊 CÓMO LEER LOS RESULTADOS

Cuando ejecutes cada query, verás algo como:

```
column_name          | data_type        | is_nullable
=====================|==================|============
id                   | integer          | NO
[BUSCAS ESTO]        | integer/uuid     | NO
calificacion         | numeric          | YES
fecha                | date             | YES
...más columnas
```

**Lo importante:** Identifica qué columna contiene el ID del usuario.

**Ejemplos de posibles nombres:**
- `user_id` ✅ (esperado)
- `usuario_id` (posible)
- `estudiante_id` (posible)
- `student_id` (posible)
- `user_fk` (posible)
- `id_usuario` (posible)

---

## 🔄 PROCESO COMPLETO

### PASO 1: Ejecutar Script de Auto-Detección
1. Abre Neon Console
2. Copia y pega el script completo de arriba
3. Ejecuta (botón verde "Run")
4. Espera a ver los 5 resultados

### PASO 2: Documentar Hallazgos
Copia los resultados y completa esta tabla:

**Tabla: calificaciones**
- Columna para ID usuario: `[COMPLETA]`
- Tipo de dato: `[COMPLETA]`
- Nullable: `[SÍ/NO]`

**Tabla: asistencia**
- Columna para ID usuario: `[COMPLETA]`
- Tipo de dato: `[COMPLETA]`

**Tabla: citas**
- Columna para estado: `[COMPLETA]`
- Columna para fecha: `[COMPLETA]`
- Columna para ID usuario: `[COMPLETA]`

**Tabla: notificaciones**
- Columna para usuario: `[COMPLETA]`
- Columna para fecha: `[COMPLETA]`
- Columna para leído: `[COMPLETA]`

**Tabla: suscriptores_notificaciones**
- Columna para tipo_interes: `[COMPLETA]`
- Columna para usuario: `[COMPLETA]`

### PASO 3: Reportar los Hallazgos
Pega los resultados en el documento `DIAGNOSTICO-ESQUEMA-NEON-FASE-30-5.md` o envía screenshot.

---

## 🚀 SIGUIENTE: Yo corrijo los 18 índices

Una vez que tengo los nombres reales, puedo:

1. **Auto-generar script SQL corregido** con los nombres reales
2. **Validar sintaxis** antes de ejecutarlo
3. **Proporcionar 18 índices 100% correctos**
4. **Usuario ejecuta los índices sin errores**
5. **Proceder a INTENTO-8**

---

## ⏱️ TIMELINE

- **Ahora (10 min):** Ejecutar script auto-detección
- **5 min después:** Reportar hallazgos
- **Yo (5 min):** Generar 18 índices corregidos
- **Usuario (30 min):** Ejecutar índices en Neon
- **Yo (5 min):** Validar con EXPLAIN ANALYZE
- **Usuario (15 min):** Ejecutar INTENTO-8 stress test

**Total: ~75 minutos hasta tener INTENTO-8 resultados**

---

## 📝 IMPORTANTE

**NO intentes crear los índices manualmente** si tienes duda sobre los nombres.

El script de auto-detección es **seguro** (solo lee, no modifica BD) y **rápido** (ejecuta en <2 segundos).

---

**Generado:** 27 Noviembre 2025
**Por:** Claude Code
**Status:** Listo para usar

