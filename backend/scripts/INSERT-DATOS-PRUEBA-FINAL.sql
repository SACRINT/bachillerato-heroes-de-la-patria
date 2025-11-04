-- ============================================================================
-- 📊 SCRIPT FINAL DE DATOS DE PRUEBA - SCHEMA CORRECTO (Neon PostgreSQL)
-- Basado en el schema REAL de create-core-tables-postgres.sql
-- Fecha: 3 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- 1. INSERTAR USUARIOS DOCENTES
-- Columnas reales: id, uuid, username, email, password_hash, role, status, ...
-- ============================================================================
INSERT INTO usuarios (username, email, password_hash, role, status)
VALUES
    ('cmendoza', 'carlos.mendoza@bgepat.edu.ec', '$2a$10$dummyhash1', 'docente', 'activo'),
    ('lgarcia', 'laura.garcia@bgepat.edu.ec', '$2a$10$dummyhash2', 'docente', 'activo'),
    ('dlopez', 'diego.lopez@bgepat.edu.ec', '$2a$10$dummyhash3', 'docente', 'activo'),
    ('irodriguez', 'isabel.rodriguez@bgepat.edu.ec', '$2a$10$dummyhash4', 'docente', 'activo'),
    ('jmartinez', 'juan.martinez@bgepat.edu.ec', '$2a$10$dummyhash5', 'docente', 'activo'),
    -- USUARIOS PADRES
    ('mgarcia', 'maria.garcia@gmail.com', '$2a$10$dummyhash6', 'padre', 'activo'),
    ('jgarcia', 'juan.garcia@gmail.com', '$2a$10$dummyhash7', 'padre', 'activo'),
    ('rmartinez', 'rosa.martinez@gmail.com', '$2a$10$dummyhash8', 'padre', 'activo'),
    ('rbmartinez', 'roberto.martinez@gmail.com', '$2a$10$dummyhash9', 'padre', 'activo'),
    ('crodriguez', 'carmen.rodriguez@gmail.com', '$2a$10$dummyhash10', 'padre', 'activo')
ON CONFLICT (username) DO NOTHING;

-- ============================================================================
-- 2. INSERTAR DOCENTES
-- Columnas reales: id, usuario_id, numero_empleado, nombre, apellido_paterno,
--                  apellido_materno, especialidad, telefono, email_institucional, status, fecha_ingreso
-- ============================================================================
INSERT INTO docentes (usuario_id, numero_empleado, nombre, apellido_paterno, especialidad, email_institucional, status, fecha_ingreso)
VALUES
    ((SELECT id FROM usuarios WHERE username='cmendoza'), 'D001', 'Carlos', 'Mendoza', 'Matemáticas', 'carlos.mendoza@bgepat.edu.ec', 'activo', CURRENT_DATE),
    ((SELECT id FROM usuarios WHERE username='lgarcia'), 'D002', 'Laura', 'García', 'Lengua y Literatura', 'laura.garcia@bgepat.edu.ec', 'activo', CURRENT_DATE),
    ((SELECT id FROM usuarios WHERE username='dlopez'), 'D003', 'Diego', 'López', 'Ciencias Naturales', 'diego.lopez@bgepat.edu.ec', 'activo', CURRENT_DATE),
    ((SELECT id FROM usuarios WHERE username='irodriguez'), 'D004', 'Isabel', 'Rodríguez', 'Historia y Geografía', 'isabel.rodriguez@bgepat.edu.ec', 'activo', CURRENT_DATE),
    ((SELECT id FROM usuarios WHERE username='jmartinez'), 'D005', 'Juan', 'Martínez', 'Educación Física', 'juan.martinez@bgepat.edu.ec', 'activo', CURRENT_DATE)
ON CONFLICT (numero_empleado) DO NOTHING;

-- ============================================================================
-- 3. INSERTAR CITAS
-- Columnas reales: id, cita_id, nombre_completo, email, telefono, tipo_persona,
--                  motivo, descripcion, fecha_solicitada, hora_solicitada, estado,
--                  confirmada, token_confirmacion, created_at
-- ============================================================================
INSERT INTO citas (cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, confirmada)
VALUES
    ('CITA-2025-0001', 'Ana Rodríguez', 'ana.rodriguez@email.com', '0987654321', 'padre', 'Consulta académica', 'Consulta sobre plan académico del estudiante', CURRENT_DATE + INTERVAL '7 days', '10:00'::TIME, 'pendiente', FALSE),
    ('CITA-2025-0002', 'Miguel Fernández', 'miguel.fernandez@email.com', '0987654322', 'estudiante', 'Orientación vocacional', 'Orientación sobre opciones de carrera', CURRENT_DATE + INTERVAL '5 days', '14:30'::TIME, 'pendiente', FALSE),
    ('CITA-2025-0003', 'Sandra López', 'sandra.lopez@email.com', '0987654323', 'madre', 'Revisión de calificaciones', 'Revisar notas del semestre anterior', CURRENT_DATE + INTERVAL '3 days', '11:00'::TIME, 'aprobada', TRUE)
ON CONFLICT (cita_id) DO NOTHING;

-- ============================================================================
-- 4. INSERTAR DATOS EN PENDIENTES_APROBACION
-- Columnas reales: id, tipo_solicitud, email_usuario, datos_json, estado, fecha_solicitud
-- ============================================================================
INSERT INTO pendientes_aprobacion (tipo_solicitud, email_usuario, datos_json, estado, fecha_solicitud)
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
            "message": "Egresado con 3 años de experiencia en desarrollo web",
            "skills": "JavaScript, React, Node.js, Python, PostgreSQL"
        }'::JSONB,
        'pendiente',
        CURRENT_TIMESTAMP
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
            "message": "Profesional con experiencia en gestión de RRHH",
            "skills": "SAP, Excel, Comunicación empresarial"
        }'::JSONB,
        'pendiente',
        CURRENT_TIMESTAMP
    ),
    (
        'egresado',
        'egresado3@email.com',
        '{
            "nombre": "Roberto Sánchez",
            "email": "roberto.sanchez@email.com",
            "anio_egreso": 2019,
            "profesion": "Contador Público",
            "empresa": "Deloitte Ecuador",
            "logros": "Auditoría externa, consultoría fiscal"
        }'::JSONB,
        'pendiente',
        CURRENT_TIMESTAMP
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================================
SELECT '✅ USUARIOS INSERTADOS' AS step, COUNT(*) as cantidad FROM usuarios WHERE role IN ('docente', 'padre');
SELECT '✅ DOCENTES INSERTADOS' AS step, COUNT(*) as cantidad FROM docentes;
SELECT '✅ CITAS INSERTADAS' AS step, COUNT(*) as cantidad FROM citas;
SELECT '✅ APROBACIONES PENDIENTES INSERTADAS' AS step, COUNT(*) as cantidad FROM pendientes_aprobacion;

-- ============================================================================
-- 📝 NOTAS IMPORTANTES:
-- ============================================================================
-- Este script usa el schema REAL de PostgreSQL en Neon
-- Si algún INSERT falla, verificar el error específico
-- Los IDs se asignan automáticamente por SERIAL/SEQUENCE
-- Los timestamps se asignan automáticamente
-- ============================================================================
