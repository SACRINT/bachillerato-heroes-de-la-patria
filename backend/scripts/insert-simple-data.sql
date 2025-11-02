/**
 * 🗄️ SCRIPT SIMPLIFICADO DE INSERCIÓN - SOLO TABLAS EXISTENTES
 * Inserta datos de prueba solo en tablas que existen en branch main
 */

-- ============================================
-- 1. USUARIOS (6 registros: admin + 2 parents + 2 estudiantes + 1 docente)
-- ============================================
INSERT INTO usuarios (id, email, username, password_hash, role, status, created_at, updated_at)
VALUES
    (1, 'admin@heroespatria.edu.mx', 'admin', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin', 'activo', NOW(), NOW()),
    (3, 'parent1@example.com', 'parent1', 'hashed_password_parent1', 'padre', 'activo', NOW(), NOW()),
    (4, 'parent2@example.com', 'parent2', 'hashed_password_parent2', 'padre', 'activo', NOW(), NOW()),
    (5, 'ash.ketchum@heroespatria.edu.mx', 'ash_ketchum', '$2b$12$temp_hash_001', 'estudiante', 'activo', NOW(), NOW()),
    (6, 'misty.waterflower@heroespatria.edu.mx', 'misty_waterflower', '$2b$12$temp_hash_002', 'estudiante', 'activo', NOW(), NOW()),
    (7, 'prof.oak@heroespatria.edu.mx', 'prof_oak', '$2b$12$temp_hash_003', 'docente', 'activo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- ============================================
-- 2. PARENTS (2 registros)
-- ============================================
INSERT INTO parents (id, nombre, email, password_hash, created_at, updated_at)
VALUES
    (1, 'Delia Ketchum', 'parent1@example.com', 'hashed_password_parent1', NOW(), NOW()),
    (2, 'Daisy Waterflower', 'parent2@example.com', 'hashed_password_parent2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('parents_id_seq', (SELECT MAX(id) FROM parents));

-- ============================================
-- 3. ESTUDIANTES (2 registros)
-- ============================================
INSERT INTO estudiantes (id, usuario_id, matricula, nombre, apellido_paterno, apellido_materno, genero, semestre, fecha_ingreso)
VALUES
    (1, 5, '20250001', 'Ash', 'Ketchum', NULL, 'M', 1, '2025-08-15'),
    (2, 6, '20250002', 'Misty', 'Waterflower', NULL, 'F', 1, '2025-08-15')
ON CONFLICT (id) DO NOTHING;

SELECT setval('estudiantes_id_seq', (SELECT MAX(id) FROM estudiantes));

-- ============================================
-- 4. DOCENTES (1 registro)
-- ============================================
INSERT INTO docentes (id, usuario_id, numero_empleado, nombre, apellido_paterno, apellido_materno, especialidad, fecha_ingreso)
VALUES
    (1, NULL, 'EMP-001', 'Samuel', 'Oak', NULL, 'Pokémonology', '2020-01-15')
ON CONFLICT (id) DO NOTHING;

SELECT setval('docentes_id_seq', (SELECT MAX(id) FROM docentes));

-- ============================================
-- 5. BOLSA_TRABAJO (3 registros)
-- ============================================
INSERT INTO bolsa_trabajo (id, nombre_completo, email, telefono, generacion, habilidades, experiencia, estado, fecha_registro)
VALUES
    (1, 'Ana García Martínez', 'ana.garcia@example.com', '5551112233', '2022', 'JavaScript, React, Node.js, MySQL, PostgreSQL', NULL, 'nuevo', NOW()),
    (2, 'Brock Pewter', 'brock@example.com', '555-1234', '2022', 'Cooking, Rock-type Pokemon', 'Gym Leader', 'nuevo', NOW()),
    (3, 'Tracey Sketchit', 'tracey@example.com', '555-5678', '2023', 'Pokemon Watching, Drawing', 'Pokemon Watcher', 'revisado', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('bolsa_trabajo_id_seq', (SELECT MAX(id) FROM bolsa_trabajo));

-- ============================================
-- 6. EGRESADOS (3 registros - estructura simplificada)
-- ============================================
INSERT INTO egresados (id, nombre, email, telefono, generacion, anio_egreso, ciudad, verificado, fecha_registro)
VALUES
    (1, 'Juan Carlos Pérez García', 'juan.perez@example.com', '2221234567', '2020-2023', 2023, 'Puebla', false, NOW()),
    (2, 'María Fernanda López Ramírez', 'maria.lopez@example.com', '2229876543', '2019-2022', 2022, 'Puebla', true, NOW()),
    (3, 'Carlos Eduardo Hernández Sánchez', 'carlos.hernandez@example.com', '2223456789', '2021-2024', 2024, 'Puebla', true, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('egresados_id_seq', (SELECT MAX(id) FROM egresados));

-- ============================================
-- 7. CONTACTOS (3 registros)
-- ============================================
INSERT INTO contactos (id, nombre, email, telefono, asunto, mensaje, tipo_consulta, form_type, status, verificado, email_sent, fecha_creacion)
VALUES
    (1, 'Ana Martínez', 'ana@test.com', '2221234567', 'Consulta sobre horarios', 'Quisiera saber los horarios de atención', 'Información General', 'Contacto General', 'pendiente', true, false, NOW()),
    (2, 'Carlos Gómez', 'carlos@test.com', NULL, 'Proceso de inscripción', '¿Cuál es el proceso para inscribir a mi hijo?', 'Admisiones e Inscripciones', 'Contacto General', 'pendiente', true, false, NOW()),
    (3, 'Laura Torres', 'laura@test.com', '2229876543', 'Información de becas', 'Me gustaría conocer las becas disponibles', 'Becas y Apoyos', 'Contacto General', 'pendiente', false, false, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('contactos_id_seq', (SELECT MAX(id) FROM contactos));

-- ============================================
-- 8. CITAS (3 registros)
-- ============================================
INSERT INTO citas (id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, estado, confirmada, token_confirmacion, created_at)
VALUES
    (1, 'CITA-2025-0001', 'Juan Pérez García', 'juan.perez@example.com', '2221234567', 'padre', 'Asesoría Académica', 'Consulta sobre el desempeño académico', '2025-11-05', 'pendiente', false, 'token_001', NOW()),
    (2, 'CITA-2025-0002', 'María López Hernández', 'maria.lopez@example.com', '2229876543', 'madre', 'Inscripción', 'Información sobre proceso de inscripción', '2025-11-07', 'aprobada', true, 'token_002', NOW()),
    (3, 'CITA-2025-0003', 'Carlos Rodríguez', 'carlos.rodriguez@example.com', '2225551234', 'estudiante', 'Orientación Vocacional', 'Orientación sobre carrera universitaria', '2025-11-03', 'aprobada', true, 'token_003', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('citas_id_seq', (SELECT MAX(id) FROM citas));

-- ============================================
-- 9. SOLICITUDES_DOCUMENTOS (3 registros)
-- ============================================
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud)
VALUES
    (1, 'María González', 'maria@test.com', 'student', 'Constancia de estudios', 'Para trámite de beca universitaria', 'high', 'pendiente', NOW()),
    (2, 'Pedro Ramírez', 'pedro@test.com', 'parent', 'Certificado de calificaciones', 'Solicitud de universidad', 'normal', 'pendiente', NOW()),
    (3, 'Ana Torres', 'ana@test.com', 'teacher', 'Constancia laboral', 'Trámite personal', 'low', 'pendiente', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('solicitudes_documentos_id_seq', (SELECT MAX(id) FROM solicitudes_documentos));

-- ============================================
-- 10. POLL_CATEGORIES (3 registros)
-- ============================================
INSERT INTO poll_categories (id, name, slug, description, icon, color, active, display_order, created_at)
VALUES
    (1, 'Académico', 'academico', 'Encuestas académicas y educativos', '📚', '#3498db', true, 1, NOW()),
    (2, 'Eventos', 'eventos', 'Encuestas sobre eventos escolares', '🎉', '#9b59b6', true, 2, NOW()),
    (3, 'Instalaciones', 'instalaciones', 'Encuestas sobre infraestructura', '🏫', '#e74c3c', true, 3, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('poll_categories_id_seq', (SELECT MAX(id) FROM poll_categories));

-- ============================================
-- RESUMEN
-- ============================================
DO $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COUNT(*) INTO total FROM usuarios; RAISE NOTICE 'Usuarios: %', total;
    SELECT COUNT(*) INTO total FROM parents; RAISE NOTICE 'Parents: %', total;
    SELECT COUNT(*) INTO total FROM estudiantes; RAISE NOTICE 'Estudiantes: %', total;
    SELECT COUNT(*) INTO total FROM docentes; RAISE NOTICE 'Docentes: %', total;
    SELECT COUNT(*) INTO total FROM bolsa_trabajo; RAISE NOTICE 'Bolsa Trabajo: %', total;
    SELECT COUNT(*) INTO total FROM egresados; RAISE NOTICE 'Egresados: %', total;
    RAISE NOTICE '✅ DATOS INSERTADOS CORRECTAMENTE';
END $$;
