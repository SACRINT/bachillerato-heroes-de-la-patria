/**
 * SCRIPT COMPREHENSIVE: Arreglar TODOS los caracteres UTF-8 corruptos
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
 * Hacer múltiples REPLACE para cada carácter corrupto encontrado.
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
-- SECCIÓN 1: ARREGLAR USUARIOS - MÚLTIPLES CARACTERES
-- =====================================================

-- Reemplazar † por í
UPDATE usuarios
SET nombre = REPLACE(nombre, '†', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '†', 'í'),
    apellido_materno = REPLACE(apellido_materno, '†', 'í')
WHERE nombre LIKE '%†%' OR apellido_paterno LIKE '%†%' OR apellido_materno LIKE '%†%';

-- Reemplazar ◊ por í (LOZENGE character)
UPDATE usuarios
SET nombre = REPLACE(nombre, '◊', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '◊', 'í'),
    apellido_materno = REPLACE(apellido_materno, '◊', 'í')
WHERE nombre LIKE '%◊%' OR apellido_paterno LIKE '%◊%' OR apellido_materno LIKE '%◊%';

-- Reemplazar ¢ por í (CENT SIGN character)
UPDATE usuarios
SET nombre = REPLACE(nombre, '¢', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '¢', 'í'),
    apellido_materno = REPLACE(apellido_materno, '¢', 'í')
WHERE nombre LIKE '%¢%' OR apellido_paterno LIKE '%¢%' OR apellido_materno LIKE '%¢%';

-- Reemplazar otros caracteres problemáticos con á
UPDATE usuarios
SET nombre = REPLACE(nombre, 'à', 'á'),
    apellido_paterno = REPLACE(apellido_paterno, 'à', 'á'),
    apellido_materno = REPLACE(apellido_materno, 'à', 'á')
WHERE nombre LIKE '%à%' OR apellido_paterno LIKE '%à%' OR apellido_materno LIKE '%à%';

-- =====================================================
-- SECCIÓN 2: ARREGLAR ESTUDIANTES - MÚLTIPLES CARACTERES
-- =====================================================

-- Reemplazar † por í
UPDATE estudiantes
SET nombre = REPLACE(nombre, '†', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '†', 'í'),
    apellido_materno = REPLACE(apellido_materno, '†', 'í')
WHERE nombre LIKE '%†%' OR apellido_paterno LIKE '%†%' OR apellido_materno LIKE '%†%';

-- Reemplazar ◊ por í (LOZENGE character)
UPDATE estudiantes
SET nombre = REPLACE(nombre, '◊', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '◊', 'í'),
    apellido_materno = REPLACE(apellido_materno, '◊', 'í')
WHERE nombre LIKE '%◊%' OR apellido_paterno LIKE '%◊%' OR apellido_materno LIKE '%◊%';

-- Reemplazar ¢ por í (CENT SIGN character)
UPDATE estudiantes
SET nombre = REPLACE(nombre, '¢', 'í'),
    apellido_paterno = REPLACE(apellido_paterno, '¢', 'í'),
    apellido_materno = REPLACE(apellido_materno, '¢', 'í')
WHERE nombre LIKE '%¢%' OR apellido_paterno LIKE '%¢%' OR apellido_materno LIKE '%¢%';

-- Reemplazar otros caracteres problemáticos con á
UPDATE estudiantes
SET nombre = REPLACE(nombre, 'à', 'á'),
    apellido_paterno = REPLACE(apellido_paterno, 'à', 'á'),
    apellido_materno = REPLACE(apellido_materno, 'à', 'á')
WHERE nombre LIKE '%à%' OR apellido_paterno LIKE '%à%' OR apellido_materno LIKE '%à%';

-- =====================================================
-- SECCIÓN 3: ARREGLAR CALIFICACIONES - MÚLTIPLES CARACTERES
-- =====================================================

-- Reemplazar † por í
UPDATE calificaciones
SET observaciones = REPLACE(observaciones, '†', 'í')
WHERE observaciones LIKE '%†%';

-- Reemplazar ◊ por í
UPDATE calificaciones
SET observaciones = REPLACE(observaciones, '◊', 'í')
WHERE observaciones LIKE '%◊%';

-- Reemplazar ¢ por í
UPDATE calificaciones
SET observaciones = REPLACE(observaciones, '¢', 'í')
WHERE observaciones LIKE '%¢%';

-- =====================================================
-- SECCIÓN 4: REEMPLAZOS ESPECÍFICOS PARA PALABRAS COMUNES
-- =====================================================

-- Palabras con "á"
UPDATE usuarios
SET nombre = REPLACE(nombre, 'R◊pidas', 'Rápidas'),
    nombre = REPLACE(nombre, 'Acad◊mico', 'Académico')
WHERE nombre LIKE '%Acad◊mico%' OR nombre LIKE '%R◊pidas%';

UPDATE estudiantes
SET nombre = REPLACE(nombre, 'R◊pidas', 'Rápidas'),
    nombre = REPLACE(nombre, 'Acad◊mico', 'Académico')
WHERE nombre LIKE '%Acad◊mico%' OR nombre LIKE '%R◊pidas%';

-- Palabras con "í"
UPDATE usuarios
SET nombre = REPLACE(nombre, 'D◊as', 'Días'),
    nombre = REPLACE(nombre, 'informaci◊n', 'información')
WHERE nombre LIKE '%D◊as%' OR nombre LIKE '%informaci◊n%';

UPDATE estudiantes
SET nombre = REPLACE(nombre, 'D◊as', 'Días'),
    nombre = REPLACE(nombre, 'informaci◊n', 'información')
WHERE nombre LIKE '%D◊as%' OR nombre LIKE '%informaci◊n%';

UPDATE calificaciones
SET observaciones = REPLACE(observaciones, 'D◊as', 'Días'),
    observaciones = REPLACE(observaciones, 'informaci◊n', 'información')
WHERE observaciones LIKE '%D◊as%' OR observaciones LIKE '%informaci◊n%';

-- =====================================================
-- SECCIÓN 5: BÚSQUEDA DE CUALQUIER OTRO CARÁCTER CORRUPTO
-- =====================================================

-- Buscar registros que AÚN tengan caracteres extraños
SELECT 'usuarios - nombre' as tabla, COUNT(*) as cantidad
FROM usuarios
WHERE nombre ~ '[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]'  -- No ASCII/Latin1/Latin Extended A
  AND nombre IS NOT NULL
UNION ALL
SELECT 'estudiantes - nombre' as tabla, COUNT(*) as cantidad
FROM estudiantes
WHERE nombre ~ '[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]'
  AND nombre IS NOT NULL
UNION ALL
SELECT 'calificaciones - observaciones' as tabla, COUNT(*) as cantidad
FROM calificaciones
WHERE observaciones ~ '[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F]'
  AND observaciones IS NOT NULL;

-- =====================================================
-- SECCIÓN 6: VERIFICACIÓN FINAL
-- =====================================================

-- Ver ejemplos de datos ARREGLADOS
SELECT 'USUARIOS ARREGLADOS' as tipo;
SELECT id, nombre, apellido_paterno FROM usuarios
WHERE nombre LIKE '%ía%' OR nombre LIKE '%ás%' OR nombre LIKE '%ás%'
LIMIT 5;

SELECT 'ESTUDIANTES ARREGLADOS' as tipo;
SELECT id, nombre, apellido_paterno FROM estudiantes
WHERE nombre LIKE '%ía%' OR nombre LIKE '%ás%'
LIMIT 5;

-- Búsqueda específica de nombres comunes
SELECT 'BÚSQUEDA: María' as tipo;
SELECT COUNT(*) FROM usuarios WHERE nombre LIKE '%María%'
UNION ALL
SELECT COUNT(*) FROM estudiantes WHERE nombre LIKE '%María%';

SELECT 'BÚSQUEDA: Rápidas' as tipo;
SELECT COUNT(*) FROM calificaciones WHERE observaciones LIKE '%Rápidas%'
UNION ALL
SELECT COUNT(*) FROM estudiantes WHERE nombre LIKE '%Rápidas%';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

/**
 * NOTAS:
 * 1. Este script es más comprehensive que el anterior
 * 2. Arregla múltiples caracteres corruptos: †, ◊, ¢, à, etc.
 * 3. Busca patrones de palabras comunes problemáticas
 * 4. La SECCIÓN 5 busca CUALQUIER carácter no ASCII/Latin
 * 5. Si ves aún hay caracteres extraños, reporta cuáles son
 */
