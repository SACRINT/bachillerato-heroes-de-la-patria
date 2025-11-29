# 🚨 INSTRUCCIONES URGENTES - FASE 30.5 INTENTO-8

**Fecha:** 27 Noviembre 2025
**Status:** 🔴 BLOQUEADO - Esperando acción del usuario
**Tiempo Estimado:** 45 minutos
**Prioridad:** CRÍTICA

---

## 📋 RESUMEN EJECUTIVO

INTENTO-7 falló con **100% ECONNREFUSED** porque:
1. Los 4 primeros índices SQL se crearon exitosamente en Neon
2. El índice #5 falló con: `ERROR: column "user_id" does not exist`
3. **Conclusión:** Los nombres de columnas en la BD NO coinciden con la documentación

---

## ✅ SOLUCIÓN: 3 PASOS

### PASO 1: Auto-Detectar Estructura (10 minutos)

**OPCIÓN A: Usar Script de Auto-Detección (RECOMENDADO)**

1. Abre https://console.neon.tech/
2. Selecciona tu base de datos
3. Abre SQL Editor
4. **Copia Y PEGA TODO esto:**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'calificaciones' ORDER BY ordinal_position;
```

5. Ejecuta (botón verde "Run")
6. **COPIA TODO el resultado** (ejemplo):
```
column_name   | data_type
==============|===========
id            | integer
estudiante_id | integer
calificacion  | numeric
fecha         | date
```

**Repite para estas 5 tablas:**
- calificaciones
- asistencia
- citas
- notificaciones
- suscriptores_notificaciones

---

**OPCIÓN B: Usar \d (Si sabes PostgreSQL)**

Si conoces psql, ejecuta:
```sql
\d calificaciones
\d asistencia
\d citas
\d notificaciones
\d suscriptores_notificaciones
```

---

### PASO 2: Reportar Hallazgos (2 minutos)

Copia y completa esto:

```
TABLA: calificaciones
Columna para ID usuario: [tu_respuesta]
Ejemplo: user_id / estudiante_id / user_fk / etc

TABLA: asistencia
Columna para ID usuario: [tu_respuesta]

TABLA: citas
Columna para estado: [tu_respuesta]
Columna para fecha: [tu_respuesta]
Columna para ID usuario: [tu_respuesta]

TABLA: notificaciones
Columna para usuario: [tu_respuesta]
Columna para fecha: [tu_respuesta]
Columna para leído: [tu_respuesta]

TABLA: suscriptores_notificaciones
Columna para tipo_interes: [tu_respuesta]
Columna para usuario: [tu_respuesta]
```

**Envía esto en tu próximo mensaje**

---

### PASO 3: YO CORRIJO LOS 18 ÍNDICES (5 minutos)

Una vez que me reportes los nombres reales, yo voy a:

1. ✅ Auto-generar 18 índices SQL corregidos
2. ✅ Validar sintaxis PostgreSQL
3. ✅ Proporcionar script 100% correcto
4. ✅ Instrucciones para ejecutarlos UNO POR UNO

---

## 🎯 DESPUÉS: EJECUTAR ÍNDICES (30 minutos)

Una vez que tengas los 18 índices corregidos:

1. Abre Neon Console SQL Editor
2. Copia **CADA ÍNDICE POR SEPARADO**
3. Ejecuta (botón verde)
4. Espera a ver "CREATE INDEX" sin errores
5. Pasar al siguiente

**NO copies todos juntos** - uno por uno es más seguro.

---

## 🚀 FINALMENTE: INTENTO-8 (15 minutos)

Cuando todos los 18 índices se creen exitosamente:

```bash
cd C:\03_BachilleratoHeroesWeb
npm start  # Reiniciar servidor
```

**En OTRA terminal:**
```bash
npx artillery run backend/load-tests/artillery-stress-test-3000.yml --target "http://localhost:3000"
```

**Objetivo:**
- ✅ Success rate > 80% (vs 0% en INTENTO-7)
- ✅ ECONNREFUSED < 5% (vs 100% en INTENTO-7)
- ✅ Request latency < 200ms

---

## 📌 IMPORTANTE

❌ **NO intentes crear índices manualmente sin saber los nombres reales**
- Causarás más errores
- Perderás tiempo
- Bloquearás a Neon

✅ **Primero detecta, luego reporta, luego ejecuta**

---

## 📞 AYUDA RÁPIDA

**Si tienes dudas con el SQL:**
- Lee `docs/DIAGNOSTICO-ESQUEMA-NEON-FASE-30-5.md` (guía detallada)
- Lee `docs/SCRIPT-DETECCION-AUTO-ESQUEMA.md` (alternativas)

**Si algún índice sigue fallando:**
- Verifica el nombre exacto de la columna
- Asegúrate de que la tabla existe
- Ejecuta el script de auto-detección de nuevo

---

## ⏱️ TIMELINE

| Paso | Tarea | Tiempo | Hecho? |
|------|-------|--------|--------|
| 1 | Auto-detectar estructura | 10 min | ⏳ |
| 2 | Reportar hallazgos | 2 min | ⏳ |
| 3 | Yo corrijo índices | 5 min | ⏳ |
| 4 | Ejecutar 18 índices | 30 min | ⏳ |
| 5 | INTENTO-8 stress test | 15 min | ⏳ |
| **TOTAL** | | **62 min** | |

---

## 🎬 ACCIÓN REQUERIDA AHORA

### EJECUTA ESTO EN NEON CONSOLE (COPIAR Y PEGAR):

```sql
-- TABLA 1: calificaciones
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'calificaciones' ORDER BY ordinal_position;

-- TABLA 2: asistencia
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'asistencia' ORDER BY ordinal_position;

-- TABLA 3: citas
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'citas' ORDER BY ordinal_position;

-- TABLA 4: notificaciones
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'notificaciones' ORDER BY ordinal_position;

-- TABLA 5: suscriptores_notificaciones
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'suscriptores_notificaciones' ORDER BY ordinal_position;
```

**COPIA TODO el resultado y envía en tu próximo mensaje.**

---

**Generado:** 27 Noviembre 2025, 17:30 GMT
**Por:** Claude Code
**Status:** 🔴 Aguardando input del usuario

