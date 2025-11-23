-- 🚀 PASO 1: ANÁLISIS DE RENDIMIENTO EN NEON
-- Por favor, ejecuta este bloque de código en tu consola de Neon.
-- El resultado será un texto en formato JSON. Copia y pégamelo completo.
-- Esto me mostrará el plan de ejecución EXACTO que usa Neon y revelará los cuellos de botella.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    e.id,
    e.matricula,
    e.nombre_completo,
    AVG(c.calificacion) as promedio
FROM
    estudiantes e
INNER JOIN
    calificaciones c ON e.id = c.estudiante_id
WHERE
    e.semestre = 1
GROUP BY
    e.id, e.matricula, e.nombre_completo
ORDER BY
    promedio DESC
LIMIT 10;


-- 🚀 PASO 2: CREACIÓN DE ÍNDICES DE RENDIMIENTO
-- Una vez que me hayas pasado el resultado del PASO 1, y después de que yo lo analice,
-- te pediré que ejecutes este segundo bloque.
-- Estos son los índices que, con alta probabilidad, solucionarán los problemas de rendimiento.
-- No los ejecutes hasta que yo te confirme.

-- Índice en la clave foránea de calificaciones para acelerar los JOINs.
CREATE INDEX IF NOT EXISTS idx_calificaciones_estudiante_id ON calificaciones(estudiante_id);

-- Índice en la columna usada para filtrar en la tabla de estudiantes.
CREATE INDEX IF NOT EXISTS idx_estudiantes_semestre ON estudiantes(semestre);

-- Índice compuesto para la tabla de calificaciones que puede ayudar en búsquedas más complejas.
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia_id_estudiante_id ON calificaciones(materia_id, estudiante_id);

-- Índice en la columna de fecha para reportes de tendencias.
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones(created_at);

-- Mensaje de confirmación que verás en la consola.
SELECT 'Índices de rendimiento creados (o ya existían).';


-- 🚀 PASO 3: VERIFICACIÓN POST-OPTIMIZACIÓN
-- Después de ejecutar el PASO 2, ejecuta este bloque final y envíame el resultado.
-- Esto nos permitirá comparar el "antes" y el "después" y confirmar la mejora en el rendimiento.

EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    e.id,
    e.matricula,
    e.nombre_completo,
    AVG(c.calificacion) as promedio
FROM
    estudiantes e
INNER JOIN
    calificaciones c ON e.id = c.estudiante_id
WHERE
    e.semestre = 1
GROUP BY
    e.id, e.matricula, e.nombre_completo
ORDER BY
    promedio DESC
LIMIT 10;
