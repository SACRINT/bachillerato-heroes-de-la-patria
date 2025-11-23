-- Script para agregar datos de prueba a las tablas estudiantes y calificaciones
-- v2: Corregido para usar los valores 'M' y 'F' del enum genero_type.

-- Agrega 1000 estudiantes de prueba
INSERT INTO estudiantes (usuario_id, matricula, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, genero, telefono, direccion, semestre, especialidad, promedio, status_academico, fecha_ingreso, curp, tutor_id, grupo_id)
SELECT
    (SELECT id FROM usuarios ORDER BY RANDOM() LIMIT 1), -- Asumiendo que hay usuarios existentes
    'MAT-' || LPAD(s.id::text, 4, '0'),
    'NombreEstudiante' || s.id,
    'ApellidoPaterno' || s.id,
    'ApellidoMaterno' || s.id,
    '2000-01-01'::date + (s.id * 7)::int * '1 day'::interval,
    CASE WHEN s.id % 2 = 0 THEN 'M'::genero_type ELSE 'F'::genero_type END, -- CORREGIDO
    '55' || LPAD(s.id::text, 8, '0'),
    'Calle Falsa ' || s.id || ', Ciudad',
    (s.id % 6) + 1, -- Semestre del 1 al 6
    'Programacion',
    (RANDOM() * 5 + 5)::numeric(4,2), -- Promedio entre 5 y 10
    'regular'::status_academico_type,
    '2022-09-01'::date + (s.id * 3)::int * '1 day'::interval,
    'CURP' || LPAD(s.id::text, 10, '0'),
    NULL,
    NULL
FROM generate_series(1, 1000) AS s(id);

-- Agrega 5000 calificaciones de prueba para los estudiantes existentes
INSERT INTO calificaciones (estudiante_id, materia_id, docente_id, parcial, calificacion, fecha_evaluacion, observaciones)
SELECT
    e.id,
    (SELECT id FROM materias ORDER BY RANDOM() LIMIT 1), -- Asumiendo que hay materias existentes
    (SELECT id FROM docentes ORDER BY RANDOM() LIMIT 1), -- Asumiendo que hay docentes existentes
    (s.id % 3) + 1, -- Parcial 1, 2 o 3
    (RANDOM() * 5 + 5)::numeric(4,2), -- Calificación entre 5 y 10
    '2023-01-01'::date + (s.id * 1)::int * '1 day'::interval,
    'Observacion ' || s.id
FROM estudiantes e, generate_series(1, 5) AS s(id) -- 5 calificaciones por estudiante
ORDER BY RANDOM()
LIMIT 5000; -- Limitar a 5000 calificaciones


-- Mensaje de confirmación
SELECT 'Datos de prueba (v2) agregados exitosamente a estudiantes (1000) y calificaciones (5000).';
