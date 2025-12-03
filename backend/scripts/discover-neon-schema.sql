/**
 * SCRIPT DE DISCOVERY - Descubrir Estructura Real de Neon
 *
 * PROPÓSITO:
 * Este script revela la estructura REAL de las tablas en Neon
 * para reescribir correctamente el script de corrección de UTF-8
 *
 * EJECUCIÓN:
 * 1. Abrir Neon Console → SQL Editor
 * 2. Copiar TODO este contenido
 * 3. Pegar en el editor
 * 4. Ejecutar (Ctrl+Enter)
 * 5. Copiar TODOS los resultados y pasarlos a Claude
 */

-- =====================================================
-- PARTE 1: LISTA COMPLETA DE TABLAS EN LA BASE DE DATOS
-- =====================================================

SELECT
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- =====================================================
-- PARTE 2: ESTRUCTURA DE TABLA USUARIOS (columnas exactas)
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
-- PARTE 3: ESTRUCTURA DE TABLA ESTUDIANTES (columnas exactas)
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
-- PARTE 4: ESTRUCTURA DE TABLA CALIFICACIONES (columnas exactas)
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
-- PARTE 5: ESTRUCTURA DE TABLA CHALLENGES (verificar si existe)
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
-- PARTE 6: ESTRUCTURA DE TABLA DESAFIOS (verificar si existe)
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
-- PARTE 7: BÚSQUEDA DE REGISTROS CON † EN USUARIOS
-- =====================================================

-- Buscar en TODAS las columnas de texto de usuarios
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
-- PARTE 8: BÚSQUEDA DE REGISTROS CON † EN ESTUDIANTES
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
-- PARTE 9: BÚSQUEDA DE REGISTROS CON † EN CHALLENGES
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
-- PARTE 10: VER PRIMEROS 3 REGISTROS CON NOMBRES COMUNES
-- =====================================================

SELECT id, nombre FROM usuarios WHERE nombre LIKE '%Mart%' OR nombre LIKE '%L%p%' OR nombre LIKE '%Garc%' LIMIT 3;
SELECT id, nombre FROM estudiantes WHERE nombre LIKE '%Mart%' OR nombre LIKE '%L%p%' OR nombre LIKE '%Garc%' LIMIT 3;

-- =====================================================
-- FIN DEL SCRIPT DE DISCOVERY
-- =====================================================

/**
 * INSTRUCCIONES PARA EL USUARIO:
 *
 * 1. Ejecuta TODO este script en Neon Console
 * 2. Copia TODOS los resultados (todas las secciones)
 * 3. Pásalos a Claude para análisis
 * 4. Claude reescribirá el script de corrección con esquema correcto
 * 5. Ejecuta el script corregido en Neon
 */
