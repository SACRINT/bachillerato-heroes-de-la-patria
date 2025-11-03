-- ============================================================================
-- 📊 SCRIPT DE DATOS DE PRUEBA - TODAS LAS TABLAS
-- Insertar datos demo para testing de todos los tabs del dashboard
-- Fecha: 3 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- 1. INSERTAR DATOS DE PRUEBA EN TABLA: docentes
-- ============================================================================
INSERT INTO docentes (nombre, email, especialidad, estado_verificado, activo, created_at, updated_at)
VALUES
    ('Profesor Carlos Mendoza', 'carlos.mendoza@bgepat.edu.ec', 'Matemáticas', true, true, NOW(), NOW()),
    ('Profesora Laura García', 'laura.garcia@bgepat.edu.ec', 'Lengua y Literatura', true, true, NOW(), NOW()),
    ('Profesor Diego López', 'diego.lopez@bgepat.edu.ec', 'Ciencias Naturales', true, true, NOW(), NOW()),
    ('Profesora Isabel Rodríguez', 'isabel.rodriguez@bgepat.edu.ec', 'Historia y Geografía', true, true, NOW(), NOW()),
    ('Profesor Juan Martínez', 'juan.martinez@bgepat.edu.ec', 'Educación Física', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. INSERTAR DATOS DE PRUEBA EN TABLA: parents
-- ============================================================================
INSERT INTO parents (nombre, email, telefono, relacion, estudiante_id, activo, created_at, updated_at)
VALUES
    ('María García López', 'maria.garcia@gmail.com', '0987654321', 'Madre', 1, true, NOW(), NOW()),
    ('Juan García López', 'juan.garcia@gmail.com', '0987654322', 'Padre', 1, true, NOW(), NOW()),
    ('Rosa Martínez Pérez', 'rosa.martinez@gmail.com', '0987654323', 'Madre', 2, true, NOW(), NOW()),
    ('Roberto Martínez Pérez', 'roberto.martinez@gmail.com', '0987654324', 'Padre', 2, true, NOW(), NOW()),
    ('Carmen Rodríguez Díaz', 'carmen.rodriguez@gmail.com', '0987654325', 'Abuela', 3, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. INSERTAR DATOS DE PRUEBA EN TABLA: solicitudes
-- ============================================================================
INSERT INTO solicitudes (estudiante_id, tipo_solicitud, descripcion, estado, fecha_solicitud, created_at, updated_at)
VALUES
    (1, 'Certificado Académico', 'Solicitud de certificado de calificaciones para continuidad de estudios', 'en_proceso', NOW(), NOW(), NOW()),
    (2, 'Constancia de Alumno', 'Constancia de alumno activo para trámites personales', 'completada', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days', NOW()),
    (3, 'Horario de Clases', 'Solicitud de horario actualizado para el semestre actual', 'en_proceso', NOW(), NOW(), NOW()),
    (1, 'Recalificación', 'Solicitud de revisión de calificación en Matemáticas', 'pendiente', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW()),
    (2, 'Justificación de Inasistencia', 'Justificante médico para inasistencias', 'completada', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. INSERTAR DATOS DE PRUEBA EN TABLA: citas
-- ============================================================================
INSERT INTO citas (
    nombre_completo,
    email,
    telefono,
    motivo,
    fecha_solicitada,
    hora_solicitada,
    estado,
    notas,
    created_at,
    updated_at
)
VALUES
    (
        'Ana Rodríguez',
        'ana.rodriguez@email.com',
        '0987654321',
        'Consulta académica',
        NOW()::date + INTERVAL '7 days',
        '10:00',
        'confirmada',
        'Cita para discutir plan académico',
        NOW(),
        NOW()
    ),
    (
        'Miguel Fernández',
        'miguel.fernandez@email.com',
        '0987654322',
        'Orientación vocacional',
        NOW()::date + INTERVAL '5 days',
        '14:30',
        'pendiente',
        'Primera cita para evaluación vocacional',
        NOW(),
        NOW()
    ),
    (
        'Sandra López',
        'sandra.lopez@email.com',
        '0987654323',
        'Revisión de calificaciones',
        NOW()::date + INTERVAL '3 days',
        '11:00',
        'confirmada',
        'Revisión de notas del semestre anterior',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. INSERTAR DATOS DE PRUEBA EN TABLA: pendientes_aprobacion
-- ============================================================================
INSERT INTO pendientes_aprobacion (
    tipo_solicitud,
    email_usuario,
    datos_json,
    estado,
    fecha_solicitud,
    created_at,
    updated_at
)
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
        'pendiente',
        NOW(),
        NOW(),
        NOW()
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
        'pendiente',
        NOW(),
        NOW(),
        NOW()
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
        'pendiente',
        NOW(),
        NOW(),
        NOW()
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT '✅ Docentes insertados:' AS status, COUNT(*) as cantidad FROM docentes;
SELECT '✅ Padres insertados:' AS status, COUNT(*) as cantidad FROM parents;
SELECT '✅ Solicitudes insertadas:' AS status, COUNT(*) as cantidad FROM solicitudes;
SELECT '✅ Citas insertadas:' AS status, COUNT(*) as cantidad FROM citas;
SELECT '✅ Aprobaciones pendientes insertadas:' AS status, COUNT(*) as cantidad FROM pendientes_aprobacion;

-- ============================================================================
-- SCRIPT COMPLETADO
-- ============================================================================
-- Próximos pasos:
-- 1. Ejecutar este script en Neon Console: copy-paste en SQL editor
-- 2. Verificar que todos los datos fueron insertados correctamente
-- 3. Reiniciar servidor backend (Node.js)
-- 4. Verificar que los tabs del dashboard ahora muestran datos
-- 5. Probar flujo completo: Formulario → Aprobaciones → Tabla Final
-- ============================================================================
