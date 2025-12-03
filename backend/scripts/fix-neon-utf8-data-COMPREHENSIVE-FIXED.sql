/**
 * SCRIPT COMPREHENSIVE FIXED: Arreglar TODOS los caracteres UTF-8 corruptos
 *
 * PROBLEMA AMPLIADO:
 * No solo † (U+2020), también hay otros caracteres corruptos:
 * - ◊ (U+25CA LOZENGE)
 * - ¢ (U+00A2 CENT SIGN)
 * - ? (otros caracteres mal decodificados)
 *
 * ESTOS APARECEN EN:
 * - "Rápidas" aparece como "R◊pidas"
 * - "Días" aparece como "D◊as"
 * - "Académico" aparece como "Acad◊mico"
 * - "María" aparece como "Marl◊a"
 * - "información" aparece como "informaci◊n"
 *
 * SOLUCIÓN:
 * UPDATE con REPLACE anidados en una sola expresión por columna.
 *
 * EJECUCIÓN:
 * 1. Abrir Neon Console https://console.neon.tech
 * 2. Ir a SQL Editor
 * 3. Copiar TODO este contenido
 * 4. Pegar en el editor
 * 5. Ejecutar (Ctrl+Enter o Click Run)
 * 6. Esperar resultados
 */

-- =====================================================
-- SECCIÓN 1: ARREGLAR USUARIOS - TODOS LOS CARACTERES EN UN UPDATE
-- =====================================================

-- Reemplazar TODOS los caracteres problemáticos en nombre
UPDATE usuarios
SET nombre = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(nombre, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE nombre LIKE '%†%'
   OR nombre LIKE '%◊%'
   OR nombre LIKE '%¢%'
   OR nombre LIKE '%à%';

-- Reemplazar TODOS los caracteres problemáticos en apellido_paterno
UPDATE usuarios
SET apellido_paterno = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(apellido_paterno, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE apellido_paterno LIKE '%†%'
   OR apellido_paterno LIKE '%◊%'
   OR apellido_paterno LIKE '%¢%'
   OR apellido_paterno LIKE '%à%';

-- Reemplazar TODOS los caracteres problemáticos en apellido_materno
UPDATE usuarios
SET apellido_materno = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(apellido_materno, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE apellido_materno LIKE '%†%'
   OR apellido_materno LIKE '%◊%'
   OR apellido_materno LIKE '%¢%'
   OR apellido_materno LIKE '%à%';

-- =====================================================
-- SECCIÓN 2: ARREGLAR ESTUDIANTES - TODOS LOS CARACTERES EN UN UPDATE
-- =====================================================

-- Reemplazar TODOS los caracteres problemáticos en nombre
UPDATE estudiantes
SET nombre = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(nombre, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE nombre LIKE '%†%'
   OR nombre LIKE '%◊%'
   OR nombre LIKE '%¢%'
   OR nombre LIKE '%à%';

-- Reemplazar TODOS los caracteres problemáticos en apellido_paterno
UPDATE estudiantes
SET apellido_paterno = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(apellido_paterno, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE apellido_paterno LIKE '%†%'
   OR apellido_paterno LIKE '%◊%'
   OR apellido_paterno LIKE '%¢%'
   OR apellido_paterno LIKE '%à%';

-- Reemplazar TODOS los caracteres problemáticos en apellido_materno
UPDATE estudiantes
SET apellido_materno = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(apellido_materno, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE apellido_materno LIKE '%†%'
   OR apellido_materno LIKE '%◊%'
   OR apellido_materno LIKE '%¢%'
   OR apellido_materno LIKE '%à%';

-- =====================================================
-- SECCIÓN 3: ARREGLAR CALIFICACIONES
-- =====================================================

-- Reemplazar TODOS los caracteres problemáticos en observaciones
UPDATE calificaciones
SET observaciones = REPLACE(
    REPLACE(
        REPLACE(
            REPLACE(observaciones, '†', 'í'),
            '◊', 'í'),
        '¢', 'í'),
    'à', 'á')
WHERE observaciones LIKE '%†%'
   OR observaciones LIKE '%◊%'
   OR observaciones LIKE '%¢%'
   OR observaciones LIKE '%à%';

-- =====================================================
-- SECCIÓN 4: VERIFICACIÓN FINAL
-- =====================================================

-- Ver cuántos registros AÚN tienen caracteres corruptos
SELECT 'usuarios - nombre - aún corruptos' as tabla, COUNT(*) as cantidad
FROM usuarios
WHERE nombre LIKE '%†%' OR nombre LIKE '%◊%' OR nombre LIKE '%¢%' OR nombre LIKE '%à%'
UNION ALL
SELECT 'usuarios - apellido_paterno - aún corruptos' as tabla, COUNT(*) as cantidad
FROM usuarios
WHERE apellido_paterno LIKE '%†%' OR apellido_paterno LIKE '%◊%' OR apellido_paterno LIKE '%¢%' OR apellido_paterno LIKE '%à%'
UNION ALL
SELECT 'usuarios - apellido_materno - aún corruptos' as tabla, COUNT(*) as cantidad
FROM usuarios
WHERE apellido_materno LIKE '%†%' OR apellido_materno LIKE '%◊%' OR apellido_materno LIKE '%¢%' OR apellido_materno LIKE '%à%'
UNION ALL
SELECT 'estudiantes - nombre - aún corruptos' as tabla, COUNT(*) as cantidad
FROM estudiantes
WHERE nombre LIKE '%†%' OR nombre LIKE '%◊%' OR nombre LIKE '%¢%' OR nombre LIKE '%à%'
UNION ALL
SELECT 'estudiantes - apellido_paterno - aún corruptos' as tabla, COUNT(*) as cantidad
FROM estudiantes
WHERE apellido_paterno LIKE '%†%' OR apellido_paterno LIKE '%◊%' OR apellido_paterno LIKE '%¢%' OR apellido_paterno LIKE '%à%'
UNION ALL
SELECT 'estudiantes - apellido_materno - aún corruptos' as tabla, COUNT(*) as cantidad
FROM estudiantes
WHERE apellido_materno LIKE '%†%' OR apellido_materno LIKE '%◊%' OR apellido_materno LIKE '%¢%' OR apellido_materno LIKE '%à%'
UNION ALL
SELECT 'calificaciones - observaciones - aún corruptos' as tabla, COUNT(*) as cantidad
FROM calificaciones
WHERE observaciones LIKE '%†%' OR observaciones LIKE '%◊%' OR observaciones LIKE '%¢%' OR observaciones LIKE '%à%'
UNION ALL
-- Ver ejemplos de datos ARREGLADOS
SELECT 'usuarios - María' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%María%'
UNION ALL
SELECT 'estudiantes - María' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%María%'
UNION ALL
SELECT 'usuarios - Rápidas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%Rápidas%'
UNION ALL
SELECT 'estudiantes - Rápidas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%Rápidas%'
UNION ALL
SELECT 'usuarios - Académico' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%Académico%' OR apellido_paterno LIKE '%Académico%'
UNION ALL
SELECT 'estudiantes - Académico' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%Académico%' OR apellido_paterno LIKE '%Académico%';

-- =====================================================
-- SECCIÓN 5: EJEMPLOS DE DATOS ARREGLADOS
-- =====================================================

SELECT 'USUARIOS ARREGLADOS' as tipo;
SELECT id, nombre, apellido_paterno FROM usuarios
WHERE nombre LIKE '%ía%' OR nombre LIKE '%ás%' OR apellido_paterno LIKE '%ía%'
LIMIT 5;

SELECT 'ESTUDIANTES ARREGLADOS' as tipo;
SELECT id, nombre, apellido_paterno FROM estudiantes
WHERE nombre LIKE '%ía%' OR nombre LIKE '%ás%' OR apellido_paterno LIKE '%ía%'
LIMIT 5;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

/**
 * NOTAS:
 * 1. Este script usa REPLACE anidados para evitar "multiple assignments" error
 * 2. Arregla: †, ◊, ¢, à
 * 3. SECCIÓN 4 verifica que NO haya más caracteres corruptos
 * 4. SECCIÓN 5 muestra ejemplos de datos arreglados
 * 5. Si ves aún hay caracteres extraños, reporta cuáles son
 */
