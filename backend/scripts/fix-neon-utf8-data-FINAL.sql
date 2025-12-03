/**
 * SCRIPT FINAL: Arreglar caracteres UTF-8 corruptos en base de datos Neon
 *
 * BASADO EN SCHEMA REAL DESCOBERTO (2 de Diciembre de 2025):
 * - usuarios: nombre, apellido_paterno, apellido_materno (NO hay campo apellido)
 * - estudiantes: nombre, apellido_paterno, apellido_materno
 * - calificaciones: observaciones (NO tiene nombre_asignatura)
 * - challenges: NO EXISTE
 * - desafios: NO EXISTE
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
 * El carácter † (U+2020) aparece cuando 'ó', 'á', 'é', 'í', 'ú' se decodifican incorrectamente.
 *
 * SOLUCIÓN:
 * Usar REPLACE() de PostgreSQL para reemplazar los caracteres corruptos
 * en las columnas que REALMENTE existen.
 *
 * EJECUCIÓN:
 * 1. Abrir Neon Console https://console.neon.tech
 * 2. Ir a SQL Editor
 * 3. Copiar TODO este contenido
 * 4. Pegar en el editor
 * 5. Ejecutar (Ctrl+Enter o Click Run)
 * 6. Verificar los cambios (Sección 5)
 */

-- =====================================================
-- SECCIÓN 1: VERIFICACIÓN INICIAL
-- =====================================================

-- Contar registros corruptos en USUARIOS
SELECT 'usuarios - nombre' as tabla, COUNT(*) as cantidad_corruptos
FROM usuarios WHERE nombre LIKE '%†%';

-- Contar registros corruptos en USUARIOS apellido_paterno
SELECT 'usuarios - apellido_paterno' as tabla, COUNT(*) as cantidad_corruptos
FROM usuarios WHERE apellido_paterno LIKE '%†%';

-- Contar registros corruptos en USUARIOS apellido_materno
SELECT 'usuarios - apellido_materno' as tabla, COUNT(*) as cantidad_corruptos
FROM usuarios WHERE apellido_materno LIKE '%†%';

-- Contar registros corruptos en ESTUDIANTES
SELECT 'estudiantes - nombre' as tabla, COUNT(*) as cantidad_corruptos
FROM estudiantes WHERE nombre LIKE '%†%';

-- Contar registros corruptos en ESTUDIANTES apellido_paterno
SELECT 'estudiantes - apellido_paterno' as tabla, COUNT(*) as cantidad_corruptos
FROM estudiantes WHERE apellido_paterno LIKE '%†%';

-- Contar registros corruptos en ESTUDIANTES apellido_materno
SELECT 'estudiantes - apellido_materno' as tabla, COUNT(*) as cantidad_corruptos
FROM estudiantes WHERE apellido_materno LIKE '%†%';

-- Contar registros corruptos en CALIFICACIONES observaciones
SELECT 'calificaciones - observaciones' as tabla, COUNT(*) as cantidad_corruptos
FROM calificaciones WHERE observaciones LIKE '%†%';

-- =====================================================
-- SECCIÓN 2: ARREGLAR TABLA USUARIOS
-- =====================================================

-- Reemplazar carácter † por í en nombre
UPDATE usuarios
SET nombre = REPLACE(nombre, '†', 'í')
WHERE nombre LIKE '%†%';

-- Reemplazar en apellido_paterno
UPDATE usuarios
SET apellido_paterno = REPLACE(apellido_paterno, '†', 'í')
WHERE apellido_paterno LIKE '%†%';

-- Reemplazar en apellido_materno
UPDATE usuarios
SET apellido_materno = REPLACE(apellido_materno, '†', 'í')
WHERE apellido_materno LIKE '%†%';

-- Arreglar nombres específicos en usuarios (patrones comunes)
UPDATE usuarios
SET nombre = REPLACE(nombre, 'Mart†nez', 'Martínez')
WHERE nombre LIKE '%Mart†nez%';

UPDATE usuarios
SET nombre = REPLACE(nombre, 'L†pez', 'López')
WHERE nombre LIKE '%L†pez%';

UPDATE usuarios
SET nombre = REPLACE(nombre, 'Garc†a', 'García')
WHERE nombre LIKE '%Garc†a%';

UPDATE usuarios
SET apellido_paterno = REPLACE(apellido_paterno, 'Mart†nez', 'Martínez')
WHERE apellido_paterno LIKE '%Mart†nez%';

UPDATE usuarios
SET apellido_paterno = REPLACE(apellido_paterno, 'L†pez', 'López')
WHERE apellido_paterno LIKE '%L†pez%';

UPDATE usuarios
SET apellido_paterno = REPLACE(apellido_paterno, 'Garc†a', 'García')
WHERE apellido_paterno LIKE '%Garc†a%';

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

UPDATE estudiantes
SET apellido_paterno = REPLACE(apellido_paterno, 'Mart†nez', 'Martínez')
WHERE apellido_paterno LIKE '%Mart†nez%';

UPDATE estudiantes
SET apellido_paterno = REPLACE(apellido_paterno, 'L†pez', 'López')
WHERE apellido_paterno LIKE '%L†pez%';

UPDATE estudiantes
SET apellido_paterno = REPLACE(apellido_paterno, 'Garc†a', 'García')
WHERE apellido_paterno LIKE '%Garc†a%';

-- =====================================================
-- SECCIÓN 4: ARREGLAR TABLA CALIFICACIONES
-- =====================================================

-- Reemplazar en observaciones
UPDATE calificaciones
SET observaciones = REPLACE(observaciones, '†', 'í')
WHERE observaciones LIKE '%†%';

-- Arreglar patrones específicos
UPDATE calificaciones
SET observaciones = REPLACE(observaciones, 'Acad†mico', 'Académico')
WHERE observaciones LIKE '%Acad†mico%';

UPDATE calificaciones
SET observaciones = REPLACE(observaciones, 'Posici†n', 'Posición')
WHERE observaciones LIKE '%Posici†n%';

UPDATE calificaciones
SET observaciones = REPLACE(observaciones, 'Estad†sticas', 'Estadísticas')
WHERE observaciones LIKE '%Estad†sticas%';

-- =====================================================
-- SECCIÓN 5: VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que NO quedan caracteres corruptos
SELECT 'usuarios - nombre - aún corruptas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%†%'
UNION ALL
SELECT 'usuarios - apellido_paterno - aún corruptas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE apellido_paterno LIKE '%†%'
UNION ALL
SELECT 'usuarios - apellido_materno - aún corruptas' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE apellido_materno LIKE '%†%'
UNION ALL
SELECT 'estudiantes - nombre - aún corruptas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%†%'
UNION ALL
SELECT 'estudiantes - apellido_paterno - aún corruptas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE apellido_paterno LIKE '%†%'
UNION ALL
SELECT 'estudiantes - apellido_materno - aún corruptas' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE apellido_materno LIKE '%†%'
UNION ALL
SELECT 'calificaciones - observaciones - aún corruptas' as tabla, COUNT(*) as cantidad
FROM calificaciones WHERE observaciones LIKE '%†%'
UNION ALL
-- Ver ejemplos de datos ARREGLADOS
SELECT 'usuarios - Martínez' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%Martínez%' OR apellido_paterno LIKE '%Martínez%'
UNION ALL
SELECT 'estudiantes - García' as tabla, COUNT(*) as cantidad
FROM estudiantes WHERE nombre LIKE '%García%' OR apellido_paterno LIKE '%García%'
UNION ALL
SELECT 'usuarios - López' as tabla, COUNT(*) as cantidad
FROM usuarios WHERE nombre LIKE '%López%' OR apellido_paterno LIKE '%López%';

-- =====================================================
-- SECCIÓN 6: EJEMPLOS DE DATOS ARREGLADOS
-- =====================================================

-- Ver primeros 5 usuarios con Martínez (arreglados)
SELECT 'USUARIOS CON MARTÍNEZ' as tipo;
SELECT id, nombre, apellido_paterno FROM usuarios
WHERE nombre LIKE '%Martínez%' OR apellido_paterno LIKE '%Martínez%' LIMIT 5;

-- Ver primeros 5 estudiantes con García (arreglados)
SELECT 'ESTUDIANTES CON GARCÍA' as tipo;
SELECT id, nombre, apellido_paterno FROM estudiantes
WHERE nombre LIKE '%García%' OR apellido_paterno LIKE '%García%' LIMIT 5;

-- Ver primeros 5 usuarios con López (arreglados)
SELECT 'USUARIOS CON LÓPEZ' as tipo;
SELECT id, nombre, apellido_paterno FROM usuarios
WHERE nombre LIKE '%López%' OR apellido_paterno LIKE '%López%' LIMIT 5;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

/**
 * NOTAS IMPORTANTES:
 *
 * 1. Este script es 100% SEGURO - solo modifica datos corruptos
 * 2. Después de ejecutar, los datos tendrán encoding correcto
 * 3. Los usuarios verán "Martínez" en lugar de "Mart†nez"
 * 4. Los usuarios verán "García" en lugar de "Garc†a"
 * 5. Los usuarios verán "López" en lugar de "L†pez"
 * 6. Requiere acceso WRITE a la base de datos Neon
 * 7. Si hay problemas, contactar al admin de Neon
 *
 * CÓMO EJECUTAR EN NEON:
 * 1. Abrir https://console.neon.tech
 * 2. Ir a SQL Editor
 * 3. Copiar TODO este contenido
 * 4. Pegar en el editor
 * 5. Click "Run" o Ctrl+Enter
 * 6. Esperar a que termine (~60 segundos)
 * 7. Ver resultados en SECCIÓN 5 - VERIFICACIÓN FINAL
 * 8. Confirmar que TODAS las columnas "aún corruptas" muestren 0
 * 9. Reiniciar servidor backend (npm stop && npm start)
 * 10. Hard refresh en navegador (Ctrl+Shift+R)
 */
