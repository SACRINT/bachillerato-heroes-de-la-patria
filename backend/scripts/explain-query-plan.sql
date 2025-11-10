-- =====================================================
-- 📊 ANÁLISIS DE PLAN DE EJECUCIÓN DE QUERY
-- Tabla: estudiantes
-- Fecha: 9 de Noviembre de 2025
-- =====================================================

-- Ejecutar EXPLAIN ANALYZE para ver el plan de ejecución REAL
-- con el nuevo índice creado

-- ✅ CORRECCIÓN: Usando columnas verificadas que existen en tabla estudiantes
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    id,
    matricula,
    nombre,
    apellido_paterno,
    apellido_materno,
    especialidad,
    semestre,
    promedio,
    status_academico
FROM estudiantes
ORDER BY apellido_paterno, apellido_materno, nombre ASC;
