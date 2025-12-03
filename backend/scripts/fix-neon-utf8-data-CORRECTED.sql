/**
 * SCRIPT CORREGIDO: Arreglar caracteres UTF-8 corruptos en base de datos Neon
 *
 * BASADO EN SCHEMA REAL DESCOBERTO:
 * - estudiantes: tiene apellido_paterno, apellido_materno (NO apellidos)
 * - usuarios: verificar estructura
 * - challenges: tabla existe
 * - desafios: verificar si existe
 *
 * PROBLEMA DIAGNOSTICADO:
 * Los datos en las tablas de Neon tienen caracteres corruptos:
 * - "Posición" almacenado como "posici†n" († = U+2020 DAGGER)
 * - "Martínez" almacenado como "Mart†nez"
 * - "López" almacenado como "L†pez"
 * - "García" almacenado como "Garc†a"
 * - "Académico" almacenado como "Acad†mico"
 * - "Información" almacenado como "informaci†n"
 * - etc.
 *
 * CAUSA:
 * Los datos fueron insertados desde una fuente con mala codificación UTF-8.
 * El carácter † (U+2020) aparece cuando 'ó' se decodifica incorrectamente.
 *
 * SOLUCIÓN:
 * Usar REPLACE() de PostgreSQL para reemplazar los caracteres corruptos.
 *
 * EJECUCIÓN:
 * 1. Abrir Neon Console
 * 2. Ir a SQL Editor
 * 3. Copiar este script
 * 4. Ejecutar (Ctrl+Enter o Click Run)
 * 5. Verificar los cambios
 */

-- =====================================================
-- SECCIÓN 1: VERIFICACIÓN INICIAL
-- =====================================================

-- Contar registros corruptos en USUARIOS
SELECT COUNT(*) as usuarios_corruptos FROM usuarios WHERE nombre LIKE '%†%';

-- Contar registros corruptos en ESTUDIANTES
SELECT COUNT(*) as estudiantes_corruptos FROM estudiantes WHERE nombre LIKE '%†%';

-- Contar registros corruptos en CHALLENGES
SELECT COUNT(*) as challenges_corruptos FROM challenges WHERE title LIKE '%†%' OR description LIKE '%†%';

-- =====================================================
-- SECCIÓN 2: ARREGLAR TABLA USUARIOS
-- =====================================================

-- Reemplazar carácter † por í en tabla usuarios
UPDATE usuarios
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

UPDATE usuarios
SET email = REPLACE(email, '†', 'í')
WHERE email LIKE '%†%';

-- Arreglar nombres específicos con patrones en usuarios
UPDATE usuarios
SET nombre = REPLACE(nombre, 'Mart†nez', 'Martínez')
WHERE nombre LIKE '%Mart†nez%';

UPDATE usuarios
SET nombre = REPLACE(nombre, 'L†pez', 'López')
WHERE nombre LIKE '%L†pez%';

UPDATE usuarios
SET nombre = REPLACE(nombre, 'Garc†a', 'García')
WHERE nombre LIKE '%Garc†a%';

-- =====================================================
-- SECCIÓN 3: ARREGLAR TABLA ESTUDIANTES
-- =====================================================

-- Reemplazar en nombre
UPDATE estudiantes
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

-- Reemplazar en apellido_paterno
UPDATE estudiantes
SET apellido_paterno = REPLACE(apellido_paterno, '†', 'í')
WHERE apellido_paterno LIKE '%†%';

-- Reemplazar en apellido_materno
UPDATE estudiantes
SET apellido_materno = REPLACE(apellido_materno, '†', 'í')
WHERE apellido_materno LIKE '%†%';

-- Arreglar nombres específicos
UPDATE estudiantes
SET nombre = REPLACE(nombre, 'Mart†nez', 'Martínez')
WHERE nombre LIKE '%Mart†nez%';

UPDATE estudiantes
SET nombre = REPLACE(nombre, 'L†pez', 'López')
WHERE nombre LIKE '%L†pez%';

UPDATE estudiantes
SET nombre = REPLACE(nombre, 'Garc†a', 'García')
WHERE nombre LIKE '%Garc†a%';

-- =====================================================
-- SECCIÓN 4: ARREGLAR TABLA CHALLENGES
-- =====================================================

UPDATE challenges
SET title = REPLACE(title, '†', 'í')
WHERE title LIKE '%†%';

UPDATE challenges
SET description = REPLACE(description, '†', 'í')
WHERE description LIKE '%†%';

-- Arreglar patrones específicos en challenges
UPDATE challenges
SET title = REPLACE(title, 'Gamificaci†n', 'Gamificación')
WHERE title LIKE '%Gamificaci†n%';

UPDATE challenges
SET description = REPLACE(description, 'posici†n', 'posición')
WHERE description LIKE '%posici†n%';

UPDATE challenges
SET description = REPLACE(description, 'Acciones R†pidas', 'Acciones Rápidas')
WHERE description LIKE '%Acciones R†pidas%';

UPDATE challenges
SET description = REPLACE(description, 'Obt†n', 'Obtén')
WHERE description LIKE '%Obt†n%';

UPDATE challenges
SET description = REPLACE(description, 'informaci†n', 'información')
WHERE description LIKE '%informaci†n%';

-- =====================================================
-- SECCIÓN 5: ARREGLAR TABLA DESAFIOS (SI EXISTE)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'desafios') THEN
        UPDATE desafios
        SET titulo = REPLACE(titulo, '†', 'í')
        WHERE titulo LIKE '%†%';

        UPDATE desafios
        SET descripcion = REPLACE(descripcion, '†', 'í')
        WHERE descripcion LIKE '%†%';
    END IF;
END $$;

-- =====================================================
-- SECCIÓN 6: ARREGLAR TABLA TENANTS CONFIG JSON
-- =====================================================

-- Arreglar nombres en config_json si contienen caracteres corruptos
UPDATE tenants
SET config_json = JSONB_SET(
    config_json,
    '{school, name}',
    TO_JSONB(REPLACE(config_json->'school'->>'name', '†', 'í'))
)
WHERE config_json->>'school.name' LIKE '%†%';

-- =====================================================
-- SECCIÓN 7: ARREGLAR OTRAS TABLAS (SI EXISTEN)
-- =====================================================

-- Tabla CALIFICACIONES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calificaciones') THEN
        UPDATE calificaciones
        SET asignatura = REPLACE(asignatura, '†', 'í')
        WHERE asignatura LIKE '%†%';
    END IF;
END $$;

-- Tabla NOTICIAS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'noticias') THEN
        UPDATE noticias
        SET titulo = REPLACE(titulo, '†', 'í')
        WHERE titulo LIKE '%†%';

        UPDATE noticias
        SET contenido = REPLACE(contenido, '†', 'í')
        WHERE contenido LIKE '%†%';
    END IF;
END $$;

-- =====================================================
-- SECCIÓN 8: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que NO quedan caracteres corruptos en USUARIOS
SELECT 'usuarios - aún corruptas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%†%'
UNION ALL
-- Verificar que NO quedan caracteres corruptos en ESTUDIANTES
SELECT 'estudiantes - aún corruptas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%†%'
UNION ALL
-- Ver ejemplos de datos ARREGLADOS en USUARIOS
SELECT 'usuarios - Martínez' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%Martínez%'
UNION ALL
-- Ver ejemplos de datos ARREGLADOS en ESTUDIANTES
SELECT 'estudiantes - García' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%García%'
UNION ALL
-- Ver ejemplos de datos ARREGLADOS en CHALLENGES
SELECT 'challenges - Gamificación' as tabla, COUNT(*) as cantidad
FROM challenges WHERE title LIKE '%Gamificación%' OR description LIKE '%Gamificación%';

-- =====================================================
-- SECCIÓN 9: EJEMPLOS DE DATOS ARREGLADOS
-- =====================================================

-- Ver primeros 5 usuarios con Martínez (arreglados)
SELECT id, nombre FROM usuarios WHERE nombre LIKE '%Martínez%' LIMIT 5;

-- Ver primeros 5 estudiantes con García (arreglados)
SELECT id, nombre FROM estudiantes WHERE nombre LIKE '%García%' LIMIT 5;

-- Ver primeros 5 challenges con Gamificación (arreglados)
SELECT id, title FROM challenges WHERE title LIKE '%Gamificación%' LIMIT 5;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Este script es SEGURO - solo modifica datos corruptos
 * 2. Después de ejecutar, los datos tendrán encoding correcto
 * 3. Los usuarios verán "Martínez" en lugar de "Mart†nez"
 * 4. Requiere acceso WRITE a la base de datos Neon
 * 5. Usa DO $$...END$$ para ignorar tablas que no existen
 * 6. Si hay problemas, contactar al admin de Neon
 *
 * CÓMO EJECUTAR EN NEON:
 * 1. Abrir https://console.neon.tech
 * 2. Ir a SQL Editor
 * 3. Copiar TODO este contenido
 * 4. Pegar en el editor
 * 5. Click "Run" o Ctrl+Enter
 * 6. Esperar a que termine
 * 7. Ver resultados en las secciones de VERIFICACIÓN
 * 8. Reiniciar servidor backend
 * 9. Hard refresh en navegador
 */
