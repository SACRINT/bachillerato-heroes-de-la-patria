-- Script to backfill missing student profiles for existing users
-- FIXED VERSION: Handles NULL values in usuarios table
INSERT INTO estudiantes (
        usuario_id,
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        genero,
        semestre,
        especialidad,
        fecha_ingreso,
        created_at,
        updated_at
    )
SELECT u.id,
    'A' || to_char(CURRENT_DATE, 'YYYY') || lpad(u.id::text, 4, '0'),
    COALESCE(u.nombre, 'Usuario Genérico'),
    COALESCE(u.apellido_paterno, 'Sin Apellido'),
    COALESCE(u.apellido_materno, ''),
    'M',
    1,
    'Tronco Común',
    CURRENT_DATE,
    NOW(),
    NOW()
FROM usuarios u
    LEFT JOIN estudiantes e ON u.id = e.usuario_id
WHERE u.role = 'estudiante'
    AND e.id IS NULL;
-- Verification
SELECT count(*) as fixed_students
FROM estudiantes
WHERE created_at >= NOW() - INTERVAL '1 minute';