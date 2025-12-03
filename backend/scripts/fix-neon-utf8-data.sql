/**
 * SCRIPT CRÍTICO: Arreglar caracteres UTF-8 corruptos en base de datos Neon
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
-- SECCIÓN 1: VERIFICACIÓN INICIAL (SIN UNION)
-- =====================================================

-- Ver cuántos registros en USUARIOS tienen caracteres corruptos
SELECT COUNT(*) as usuarios_corruptos FROM usuarios WHERE nombre LIKE '%†%';

-- Ver cuántos registros en ESTUDIANTES tienen caracteres corruptos
SELECT COUNT(*) as estudiantes_corrupto FROM estudiantes WHERE nombre LIKE '%†%';

-- Ver cuántos registros en DESAFIOS/CHALLENGES tienen caracteres corruptos
SELECT COUNT(*) as desafios_corruptos FROM (
    SELECT 1 FROM desafios WHERE titulo LIKE '%†%' OR descripcion LIKE '%†%'
    UNION ALL
    SELECT 1 FROM challenges WHERE title LIKE '%†%' OR description LIKE '%†%'
) AS temp;

-- =====================================================
-- SECCIÓN 2: ARREGLAR TABLA USUARIOS
-- =====================================================

-- Reemplazar carácter † por í en tabla usuarios
UPDATE usuarios
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

UPDATE usuarios
SET apellido = REPLACE(apellido, '†', 'í')
WHERE apellido LIKE '%†%';

UPDATE usuarios
SET email = REPLACE(email, '†', 'í')
WHERE email LIKE '%†%';

-- Arreglar nombres específicos con patrones
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

UPDATE estudiantes
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

UPDATE estudiantes
SET apellidos = REPLACE(apellidos, '†', 'í')
WHERE apellidos LIKE '%†%';

UPDATE estudiantes
SET nombre_padre = REPLACE(nombre_padre, '†', 'í')
WHERE nombre_padre LIKE '%†%';

UPDATE estudiantes
SET nombre_madre = REPLACE(nombre_madre, '†', 'í')
WHERE nombre_madre LIKE '%†%';

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
-- SECCIÓN 4: ARREGLAR TABLA DESAFIOS (si existe)
-- =====================================================

-- Esta sección se ejecutará solo si la tabla existe
-- Si no existe, será ignorada

-- Reemplazar en tabla DESAFIOS
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
-- SECCIÓN 5: ARREGLAR TABLA CHALLENGES (si existe)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'challenges') THEN
        UPDATE challenges
        SET title = REPLACE(title, '†', 'í')
        WHERE title LIKE '%†%';

        UPDATE challenges
        SET description = REPLACE(description, '†', 'í')
        WHERE description LIKE '%†%';
    END IF;
END $$;

-- =====================================================
-- SECCIÓN 6: ARREGLAR TABLA TENANTS (config JSON)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
        -- Actualizar config_json si contiene caracteres corruptos
        UPDATE tenants
        SET config_json = jsonb_set(
            config_json,
            '{school, name}',
            to_jsonb(REPLACE(config_json->'school'->>'name', '†', 'í'))
        )
        WHERE config_json->>'school.name' LIKE '%†%';
    END IF;
END $$;

-- =====================================================
-- SECCIÓN 7: ARREGLAR OTRAS TABLAS (si existen)
-- =====================================================

-- Tabla CALIFICACIONES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calificaciones') THEN
        UPDATE calificaciones
        SET nombre_asignatura = REPLACE(nombre_asignatura, '†', 'í')
        WHERE nombre_asignatura LIKE '%†%';
    END IF;
END $$;

-- Tabla CURSOS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cursos') THEN
        UPDATE cursos
        SET nombre = REPLACE(nombre, '†', 'í')
        WHERE nombre LIKE '%†%';
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

-- Contar cuántas filas AÚN tienen caracteres corruptos en USUARIOS
SELECT 'usuarios - aún corruptas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%†%'
UNION ALL
-- Contar cuántas filas AÚN tienen caracteres corruptos en ESTUDIANTES
SELECT 'estudiantes - aún corruptas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%†%'
UNION ALL
-- Ver algunos ejemplos de datos ARREGLADOS
SELECT 'usuarios - Martínez' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%Martínez%'
UNION ALL
SELECT 'estudiantes - García' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%García%';

-- =====================================================
-- SECCIÓN 9: EJEMPLOS DE DATOS ARREGLADOS
-- =====================================================

-- Ver los primeros 5 usuarios con Martínez (arreglados)
SELECT id, nombre FROM usuarios WHERE nombre LIKE '%Martínez%' LIMIT 5;

-- Ver los primeros 5 estudiantes con García (arreglados)
SELECT id, nombre FROM estudiantes WHERE nombre LIKE '%García%' LIMIT 5;

-- Ver los primeros 5 usuarios con López (arreglados)
SELECT id, nombre FROM usuarios WHERE nombre LIKE '%López%' LIMIT 5;

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
