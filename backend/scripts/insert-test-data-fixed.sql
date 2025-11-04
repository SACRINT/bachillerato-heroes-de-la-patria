-- ============================================================================
-- 📊 SCRIPT DE DATOS DE PRUEBA - VERSIÓN CORREGIDA
-- Usa los campos reales de las tablas en Neon PostgreSQL
-- Fecha: 3 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- 1. INSERTAR USUARIOS PRIMERO (para docentes y padres)
-- ============================================================================
-- Crear 10 usuarios base (5 docentes + 5 padres)
INSERT INTO usuarios (email, password_hash, nombre, apellido_paterno, apellido_materno, tipo_usuario, activo)
VALUES
    -- Docentes
    ('carlos.mendoza@bgepat.edu.ec', '$2a$10$dummyhash1', 'Carlos', 'Mendoza', NULL, 'docente', true),
    ('laura.garcia@bgepat.edu.ec', '$2a$10$dummyhash2', 'Laura', 'García', NULL, 'docente', true),
    ('diego.lopez@bgepat.edu.ec', '$2a$10$dummyhash3', 'Diego', 'López', NULL, 'docente', true),
    ('isabel.rodriguez@bgepat.edu.ec', '$2a$10$dummyhash4', 'Isabel', 'Rodríguez', NULL, 'docente', true),
    ('juan.martinez@bgepat.edu.ec', '$2a$10$dummyhash5', 'Juan', 'Martínez', NULL, 'docente', true),
    -- Padres
    ('maria.garcia@gmail.com', '$2a$10$dummyhash6', 'María', 'García', 'López', 'padre_familia', true),
    ('juan.garcia@gmail.com', '$2a$10$dummyhash7', 'Juan', 'García', 'López', 'padre_familia', true),
    ('rosa.martinez@gmail.com', '$2a$10$dummyhash8', 'Rosa', 'Martínez', 'Pérez', 'padre_familia', true),
    ('roberto.martinez@gmail.com', '$2a$10$dummyhash9', 'Roberto', 'Martínez', 'Pérez', 'padre_familia', true),
    ('carmen.rodriguez@gmail.com', '$2a$10$dummyhash10', 'Carmen', 'Rodríguez', 'Díaz', 'padre_familia', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 2. INSERTAR DATOS DE PRUEBA EN TABLA: docentes
-- Usando los campos reales de Neon
-- ============================================================================
INSERT INTO docentes (usuario_id, numero_empleado, cedula_profesional, especialidad, anos_experiencia, grado_estudios, fecha_ingreso_plantel, tipo_contrato, horas_asignadas, estatus)
VALUES
    (1, 'D001', 'PROF-001', 'Matemáticas', 5, 'maestria', CURRENT_DATE, 'base', 40, 'activo'),
    (2, 'D002', 'PROF-002', 'Lengua y Literatura', 8, 'licenciatura', CURRENT_DATE, 'base', 40, 'activo'),
    (3, 'D003', 'PROF-003', 'Ciencias Naturales', 3, 'licenciatura', CURRENT_DATE, 'base', 40, 'activo'),
    (4, 'D004', 'PROF-004', 'Historia y Geografía', 10, 'maestria', CURRENT_DATE, 'base', 40, 'activo'),
    (5, 'D005', 'PROF-005', 'Educación Física', 6, 'licenciatura', CURRENT_DATE, 'interino', 30, 'activo')
ON CONFLICT (numero_empleado) DO NOTHING;

-- ============================================================================
-- 3. INSERTAR DATOS DE PRUEBA EN TABLA: parents
-- Usando los campos reales de Neon (usuario_id, relacion, estudiante_id)
-- ============================================================================
INSERT INTO parents (usuario_id, relacion, estudiante_id, activo)
VALUES
    (6, 'Madre', 1, true),
    (7, 'Padre', 1, true),
    (8, 'Madre', 2, true),
    (9, 'Padre', 2, true),
    (10, 'Abuela', 3, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. INSERTAR DATOS DE PRUEBA EN TABLA: solicitudes
-- ============================================================================
INSERT INTO solicitudes (estudiante_id, tipo_solicitud, descripcion, estado, fecha_solicitud)
VALUES
    (1, 'Certificado Académico', 'Solicitud de certificado de calificaciones para continuidad de estudios', 'en_proceso', NOW()),
    (2, 'Constancia de Alumno', 'Constancia de alumno activo para trámites personales', 'completada', NOW() - INTERVAL '5 days'),
    (3, 'Horario de Clases', 'Solicitud de horario actualizado para el semestre actual', 'en_proceso', NOW()),
    (1, 'Recalificación', 'Solicitud de revisión de calificación en Matemáticas', 'pendiente', NOW() - INTERVAL '1 day'),
    (2, 'Justificación de Inasistencia', 'Justificante médico para inasistencias', 'completada', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INSERTAR DATOS DE PRUEBA EN TABLA: citas
-- Validar nombre exacto de columnas en tu tabla
-- ============================================================================
INSERT INTO citas (nombre_completo, email, telefono, motivo, fecha_solicitada, hora_solicitada, estado, notas)
VALUES
    (
        'Ana Rodríguez',
        'ana.rodriguez@email.com',
        '0987654321',
        'Consulta académica',
        CURRENT_DATE + INTERVAL '7 days',
        '10:00',
        'confirmada',
        'Cita para discutir plan académico'
    ),
    (
        'Miguel Fernández',
        'miguel.fernandez@email.com',
        '0987654322',
        'Orientación vocacional',
        CURRENT_DATE + INTERVAL '5 days',
        '14:30',
        'pendiente',
        'Primera cita para evaluación vocacional'
    ),
    (
        'Sandra López',
        'sandra.lopez@email.com',
        '0987654323',
        'Revisión de calificaciones',
        CURRENT_DATE + INTERVAL '3 days',
        '11:00',
        'confirmada',
        'Revisión de notas del semestre anterior'
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. INSERTAR DATOS DE PRUEBA EN TABLA: pendientes_aprobacion
-- ============================================================================
INSERT INTO pendientes_aprobacion (tipo_solicitud, email_usuario, datos_json, estado)
VALUES
    (
        'bolsa_trabajo',
        'egresado1@email.com',
        '{
            "name": "Carlos Quispe",
            "email": "carlos.quispe@email.com",
            "phone": "+593987654321",
            "graduationYear": 2020,
            "subject": "Ingeniería en Sistemas",
            "message": "Egresado con 3 años de experiencia en desarrollo web. Especializado en JavaScript y Python.",
            "skills": "JavaScript, React, Node.js, Python, PostgreSQL"
        }'::jsonb,
        'pendiente'
    ),
    (
        'bolsa_trabajo',
        'egresado2@email.com',
        '{
            "name": "Patricia Gómez",
            "email": "patricia.gomez@email.com",
            "phone": "+593987654322",
            "graduationYear": 2021,
            "subject": "Administración de Empresas",
            "message": "Profesional con experiencia en gestión de recursos humanos y administración",
            "skills": "SAP, Excel avanzado, Comunicación empresarial, Gestión de proyectos"
        }'::jsonb,
        'pendiente'
    ),
    (
        'egresado',
        'egresado3@email.com',
        '{
            "nombre": "Roberto Sánchez",
            "email": "roberto.sanchez@email.com",
            "anio_egreso": 2019,
            "profesion_actual": "Contador Público",
            "empresa": "Deloitte Ecuador",
            "logros": "Auditoría externa, consultoría fiscal, implementación de sistemas contables"
        }'::jsonb,
        'pendiente'
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT '✅ Usuarios insertados:' AS status, COUNT(*) as cantidad FROM usuarios WHERE tipo_usuario IN ('docente', 'padre_familia');
SELECT '✅ Docentes insertados:' AS status, COUNT(*) as cantidad FROM docentes;
SELECT '✅ Padres insertados:' AS status, COUNT(*) as cantidad FROM parents;
SELECT '✅ Solicitudes insertadas:' AS status, COUNT(*) as cantidad FROM solicitudes;
SELECT '✅ Citas insertadas:' AS status, COUNT(*) as cantidad FROM citas;
SELECT '✅ Aprobaciones pendientes insertadas:' AS status, COUNT(*) as cantidad FROM pendientes_aprobacion;

-- ============================================================================
-- ⚠️ NOTAS IMPORTANTES:
-- ============================================================================
-- Si alguna tabla no existe o tiene columnas diferentes:
-- 1. Este script usa ON CONFLICT DO NOTHING para no fallar si existen duplicados
-- 2. Si una tabla tiene esquema diferente, ese INSERT fallará pero los otros seguirán
-- 3. Revisa el mensaje de error para identificar qué columnas faltan
-- 4. Adapta los nombres de columnas según tu esquema real
--
-- Si necesitas verificar el esquema de una tabla:
-- SELECT * FROM information_schema.columns WHERE table_name='docentes';
-- ============================================================================
