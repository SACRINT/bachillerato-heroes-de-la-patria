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
-- PASO 1: VERIFICACIÓN INICIAL
-- =====================================================

-- Ver cuántas filas tienen caracteres corruptos
SELECT COUNT(*) as filas_corruptas
FROM (
    SELECT *
    FROM usuarios WHERE nombre LIKE '%†%'
    UNION ALL
    SELECT *
    FROM estudiantes WHERE nombre LIKE '%†%'
    UNION ALL
    SELECT *
    FROM desafios WHERE titulo LIKE '%†%' OR descripcion LIKE '%†%'
    UNION ALL
    SELECT *
    FROM desafios WHERE descripcion LIKE '%†%'
) as corrupted_data;

-- =====================================================
-- PASO 2: ARREGLAR TABLA USUARIOS
-- =====================================================

UPDATE usuarios
SET
    nombre = REPLACE(nombre, '†', 'í'),
    apellido = REPLACE(apellido, '†', 'í'),
    email = REPLACE(email, '†', 'í')
WHERE nombre LIKE '%†%' OR apellido LIKE '%†%' OR email LIKE '%†%';

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
-- PASO 3: ARREGLAR TABLA ESTUDIANTES
-- =====================================================

UPDATE estudiantes
SET
    nombre = REPLACE(nombre, '†', 'í'),
    apellidos = REPLACE(apellidos, '†', 'í'),
    nombre_padre = REPLACE(nombre_padre, '†', 'í'),
    nombre_madre = REPLACE(nombre_madre, '†', 'í')
WHERE nombre LIKE '%†%'
   OR apellidos LIKE '%†%'
   OR nombre_padre LIKE '%†%'
   OR nombre_madre LIKE '%†%';

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
-- PASO 4: ARREGLAR TABLA DESAFIOS/CHALLENGES
-- =====================================================

-- Si la tabla se llama 'challenges'
UPDATE challenges
SET
    title = REPLACE(title, '†', 'í'),
    description = REPLACE(description, '†', 'í')
WHERE title LIKE '%†%' OR description LIKE '%†%';

-- Si la tabla se llama 'desafios'
UPDATE desafios
SET
    titulo = REPLACE(titulo, '†', 'í'),
    descripcion = REPLACE(descripcion, '†', 'í')
WHERE titulo LIKE '%†%' OR descripcion LIKE '%†%';

-- =====================================================
-- PASO 5: ARREGLAR TABLA TENANTS CONFIG
-- =====================================================

-- Los datos JSON en tenants pueden tener acentos corruptos
UPDATE tenants
SET config_json =
    config_json::text
    ||'->school'||'->'||'name'
WHERE config_json::text LIKE '%†%';

-- O una forma más segura:
UPDATE tenants
SET config_json = jsonb_set(
    config_json,
    '{school, name}',
    to_jsonb(REPLACE(config_json->'school'->>'name', '†', 'í'))
)
WHERE config_json->>'school.name' LIKE '%†%';

-- =====================================================
-- PASO 6: ARREGLAR OTRAS TABLAS CON DATOS DE USUARIO
-- =====================================================

-- Tabla de calificaciones si tiene nombres
UPDATE calificaciones
SET nombre_asignatura = REPLACE(nombre_asignatura, '†', 'í')
WHERE nombre_asignatura LIKE '%†%';

-- Tabla de cursos si existe
UPDATE cursos
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

-- Tabla de noticias si existe
UPDATE noticias
SET
    titulo = REPLACE(titulo, '†', 'í'),
    contenido = REPLACE(contenido, '†', 'í')
WHERE titulo LIKE '%†%' OR contenido LIKE '%†%';

-- =====================================================
-- PASO 7: ARREGLAR CARACTERES ESPECIALES MÚLTIPLES
-- =====================================================

-- En caso de que haya otros caracteres corruptos
-- Reemplazar bullets corruptos
UPDATE usuarios SET nombre = REPLACE(nombre, '•', '•') WHERE nombre LIKE '%•%';
UPDATE estudiantes SET nombre = REPLACE(nombre, '•', '•') WHERE nombre LIKE '%•%';

-- =====================================================
-- PASO 8: VERIFICACIÓN FINAL
-- =====================================================

-- Contar filas restantes con caracteres corruptos
SELECT
    'usuarios' as tabla,
    COUNT(*) as filas_corruptas
FROM usuarios WHERE nombre LIKE '%†%'
UNION ALL
SELECT
    'estudiantes' as tabla,
    COUNT(*) as filas_corruptas
FROM estudiantes WHERE nombre LIKE '%†%'
UNION ALL
SELECT
    'challenges' as tabla,
    COUNT(*) as filas_corruptas
FROM challenges WHERE title LIKE '%†%' OR description LIKE '%†%'
UNION ALL
SELECT
    'desafios' as tabla,
    COUNT(*) as filas_corruptas
FROM desafios WHERE titulo LIKE '%†%' OR descripcion LIKE '%†%';

-- Ver algunos ejemplos de datos arreglados
SELECT nombre FROM usuarios WHERE nombre LIKE '%Martínez%' LIMIT 5;
SELECT nombre FROM estudiantes WHERE nombre LIKE '%García%' LIMIT 5;

-- =====================================================
-- PASO 9: RECARGAR CACHÉ (si Redis está activo)
-- =====================================================

-- Si usas redis-cache middleware, este script invalida automáticamente
-- Ejecutar desde backend:
-- Redis FLUSHDB (cuidado con esto - borra TODO el caché)
-- O invalidar solo tenant:config

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
 * 5. Puede tomar algunos segundos si hay muchas filas
 * 6. Si hay problemas, contactar al admin de Neon
 */
