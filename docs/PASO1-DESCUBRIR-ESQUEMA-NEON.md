# 🔍 PASO 1: DESCUBRIR ESQUEMA REAL DE NEON

**Fecha:** 2 de Diciembre de 2025
**Estado:** 🔴 BLOQUEADO - Esperando Schema Discovery
**Responsable:** Arquitecto / Admin de Neon

---

## ✋ PROBLEMA ACTUAL

El script SQL anterior fallió porque **los nombres de las columnas no coinciden** con lo que el script asumía:

```
ERROR: column "apellido" does not exist
ERROR: column "apellidos" does not exist
ERROR: column "nombre_asignatura" does not exist
ERROR: relation "desafios" does not exist
```

**Causa Raíz:** El script fue escrito asumiendo ciertos nombres de columnas, pero **la estructura real de Neon es diferente**.

**Solución:** Ejecutar un **DISCOVERY SCRIPT** que revele la estructura EXACTA de las tablas.

---

## 📋 PASOS PARA EJECUTAR EL DISCOVERY SCRIPT

### PASO 1: Abrir Neon Console

1. Abre https://console.neon.tech
2. Selecciona tu proyecto (frosty-night-96901888)
3. Haz clic en **"SQL Editor"**

### PASO 2: Copiar el Script de Discovery

```
Ubicación del script:
C:\03_BachilleratoHeroesWeb\backend\scripts\discover-neon-schema.sql
```

**O simplemente copia esto y pégalo en el editor de Neon:**

```sql
-- =====================================================
-- PARTE 1: LISTA COMPLETA DE TABLAS
-- =====================================================

SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- PARTE 2: ESTRUCTURA DE TABLA USUARIOS
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 3: ESTRUCTURA DE TABLA ESTUDIANTES
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'estudiantes'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 4: ESTRUCTURA DE TABLA CALIFICACIONES
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'calificaciones'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 5: ESTRUCTURA DE TABLA CHALLENGES
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'challenges'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 6: ESTRUCTURA DE TABLA DESAFIOS
-- =====================================================

SELECT
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'desafios'
ORDER BY ordinal_position;

-- =====================================================
-- PARTE 7: BÚSQUEDA DE † EN USUARIOS
-- =====================================================

SELECT
    'usuarios' as tabla,
    'nombre' as columna,
    COUNT(*) as cantidad_corruptos
FROM usuarios
WHERE nombre LIKE '%†%'
UNION ALL
SELECT
    'usuarios' as tabla,
    'apellido_paterno' as columna,
    COUNT(*) as cantidad_corruptos
FROM usuarios
WHERE apellido_paterno LIKE '%†%'
UNION ALL
SELECT
    'usuarios' as tabla,
    'apellido_materno' as columna,
    COUNT(*) as cantidad_corruptos
FROM usuarios
WHERE apellido_materno LIKE '%†%'
UNION ALL
SELECT
    'usuarios' as tabla,
    'email' as columna,
    COUNT(*) as cantidad_corruptos
FROM usuarios
WHERE email LIKE '%†%';

-- =====================================================
-- PARTE 8: BÚSQUEDA DE † EN ESTUDIANTES
-- =====================================================

SELECT
    'estudiantes' as tabla,
    'nombre' as columna,
    COUNT(*) as cantidad_corruptos
FROM estudiantes
WHERE nombre LIKE '%†%'
UNION ALL
SELECT
    'estudiantes' as tabla,
    'apellidos' as columna,
    COUNT(*) as cantidad_corruptos
FROM estudiantes
WHERE apellidos LIKE '%†%'
UNION ALL
SELECT
    'estudiantes' as tabla,
    'nombre_padre' as columna,
    COUNT(*) as cantidad_corruptos
FROM estudiantes
WHERE nombre_padre LIKE '%†%'
UNION ALL
SELECT
    'estudiantes' as tabla,
    'nombre_madre' as columna,
    COUNT(*) as cantidad_corruptos
FROM estudiantes
WHERE nombre_madre LIKE '%†%';

-- =====================================================
-- PARTE 9: BÚSQUEDA DE † EN CHALLENGES
-- =====================================================

SELECT
    'challenges' as tabla,
    'title' as columna,
    COUNT(*) as cantidad_corruptos
FROM challenges
WHERE title LIKE '%†%'
UNION ALL
SELECT
    'challenges' as tabla,
    'description' as columna,
    COUNT(*) as cantidad_corruptos
FROM challenges
WHERE description LIKE '%†%';

-- =====================================================
-- PARTE 10: VER EJEMPLOS DE NOMBRES
-- =====================================================

SELECT id, nombre FROM usuarios WHERE nombre LIKE '%Mart%' OR nombre LIKE '%L%p%' OR nombre LIKE '%Garc%' LIMIT 3;
SELECT id, nombre FROM estudiantes WHERE nombre LIKE '%Mart%' OR nombre LIKE '%L%p%' OR nombre LIKE '%Garc%' LIMIT 3;
```

### PASO 3: Ejecutar en Neon

1. **Selecciona TODO el contenido** (Ctrl+A)
2. **Ejecuta** (Ctrl+Enter o click "Run")
3. **Espera a que termine** (~10 segundos)

### PASO 4: Copiar Resultados

Verás **10 secciones de resultados**:

```
Sección 1: Lista de tablas
Sección 2: Columnas de usuarios
Sección 3: Columnas de estudiantes
Sección 4: Columnas de calificaciones
Sección 5: Columnas de challenges (si existe)
Sección 6: Columnas de desafios (si existe)
Sección 7: Registros † en usuarios
Sección 8: Registros † en estudiantes
Sección 9: Registros † en challenges
Sección 10: Ejemplos de nombres con patrones comunes
```

**IMPORTANTE:** Copia TODOS los resultados (todas las secciones)

### PASO 5: Pasar Resultados a Claude

Pega los resultados completos en el chat para que Claude:
1. Analice la estructura REAL de Neon
2. Identifique dónde están los datos corruptos
3. Reescriba el script SQL con columnas correctas
4. Prepare el script definitivo para ejecución

---

## 🎯 QUÉ ESPERAR EN LOS RESULTADOS

### Sección 1: Tablas Esperadas

Deberías ver algo como:

```
table_name         | table_schema
-------------------|-------------
usuarios           | public
estudiantes        | public
challenges         | public
calificaciones     | public
tenants            | public
... más tablas ...
```

### Sección 2: Columnas de Usuarios

Esperamos encontrar columnas como:

```
column_name      | data_type      | is_nullable | ordinal_position
-----------------|----------------|-------------|------------------
id               | uuid           | NO          | 1
email            | character      | NO          | 2
nombre           | character      | YES         | 3
apellido_paterno | character      | YES         | 4
apellido_materno | character      | YES         | 5
... más columnas ...
```

**NOTA:** Si la columna se llama `apellido` en lugar de `apellido_paterno`, eso explica el error.

### Sección 7: Búsqueda de Corrupción

Si hay datos corruptos, verás:

```
tabla    | columna           | cantidad_corruptos
---------|-------------------|--------------------
usuarios | nombre            | 45
usuarios | apellido_paterno  | 32
usuarios | apellido_materno  | 28
```

Si NO hay corrupción, verás:

```
(no results)
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Qué pasa si algunas queries fallan?**
R: Está bien. Significa que esa tabla no existe. Claude ignorará ese error.

**P: ¿Cuánto tarda?**
R: Máximo 30 segundos. Si tarda más, hay problema de conexión.

**P: ¿Puedo ejecutar solo algunas partes?**
R: SÍ. Pero es mejor ejecutar TODO para tener visión completa.

**P: ¿Debo hacer backup primero?**
R: NO. Este script SOLO LEE datos, no modifica nada.

---

## ✅ CHECKLIST

- [ ] Abierto Neon Console
- [ ] Abierto SQL Editor
- [ ] Copiado el script completo
- [ ] Pegado en el editor
- [ ] Ejecutado (Ctrl+Enter)
- [ ] Esperado a que termine
- [ ] Copiado TODOS los resultados
- [ ] Pegado resultados en el chat para Claude
- [ ] Cerrado la ventana (sin guardar, no es necesario)

---

## 🚀 SIGUIENTE PASO

Una vez que pases los resultados a Claude:

1. Claude analizará la estructura REAL
2. Claude reescribirá `fix-neon-utf8-data.sql` con columnas correctas
3. Claude dará nuevas instrucciones para ejecutar el script definitivo
4. Ejecutarás el script corregido
5. Los acentos se arreglarán en la base de datos
6. Reiniciarás el servidor backend
7. Hard refresh en navegador
8. ✅ **PROBLEMA RESUELTO**

---

**⏱️ TIEMPO ESTIMADO:** 5-10 minutos para este paso

**📍 UBICACIÓN DEL SCRIPT:** `backend/scripts/discover-neon-schema.sql`

**❌ NO EJECUTES NADA MÁS HASTA QUE PASES LOS RESULTADOS A CLAUDE**

