/**
 * 🗄️ SCRIPT DE INSERCIÓN DE DATOS DE PRUEBA
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Este script inserta todos los datos de prueba en la base de datos Neon (branch main)
 * Datos basados en el reporte del usuario del 30 de Octubre 2025
 */

-- ============================================
-- LIMPIEZA PREVIA (opcional - comentar si no quieres borrar datos existentes)
-- ============================================
-- TRUNCATE TABLE newsletter_envios CASCADE;
-- TRUNCATE TABLE newsletters CASCADE;
-- TRUNCATE TABLE suscriptores CASCADE;
-- TRUNCATE TABLE pending_approvals CASCADE;
-- TRUNCATE TABLE password_recovery_requests CASCADE;
-- TRUNCATE TABLE solicitudes_documentos CASCADE;
-- TRUNCATE TABLE notificaciones_convocatorias CASCADE;
-- TRUNCATE TABLE contactos CASCADE;
-- TRUNCATE TABLE citas CASCADE;
-- TRUNCATE TABLE bolsa_trabajo_cv CASCADE;
-- TRUNCATE TABLE egresados CASCADE;
-- TRUNCATE TABLE bolsa_trabajo CASCADE;
-- TRUNCATE TABLE estudiantes CASCADE;
-- TRUNCATE TABLE docentes CASCADE;
-- TRUNCATE TABLE parents CASCADE;
-- TRUNCATE TABLE poll_categories CASCADE;
-- TRUNCATE TABLE usuarios CASCADE;

-- ============================================
-- 1. USUARIOS (3 registros)
-- ============================================
INSERT INTO usuarios (id, email, username, password_hash, role, status, created_at, updated_at)
VALUES
    (1, 'admin@heroespatria.edu.mx', 'admin', '$2b$12$c6XQgfRG4WAkwhADy7RcQeSIfAVidcWV/F/OTcswVQ.L/99CUfGIK', 'admin', 'activo', '2025-10-20 22:16:22.091313-06:00', '2025-10-20 22:16:22.091313-06:00'),
    (3, 'parent1@example.com', 'parent1', 'hashed_password_parent1', 'padre', 'activo', '2025-10-24 19:48:43.835876-06:00', '2025-10-24 19:48:43.835876-06:00'),
    (4, 'parent2@example.com', 'parent2', 'hashed_password_parent2', 'padre', 'activo', '2025-10-24 19:48:43.835876-06:00', '2025-10-24 19:48:43.835876-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- ============================================
-- 2. PARENTS (2 registros)
-- ============================================
INSERT INTO parents (id, nombre, email, password_hash, created_at, updated_at)
VALUES
    (1, 'Delia Ketchum', 'parent1@example.com', 'hashed_password_parent1', '2025-10-24 19:48:50.59066-06:00', '2025-10-24 19:48:50.59066-06:00'),
    (2, 'Daisy Waterflower', 'parent2@example.com', 'hashed_password_parent2', '2025-10-24 19:48:50.59066-06:00', '2025-10-24 19:48:50.59066-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('parents_id_seq', (SELECT MAX(id) FROM parents));

-- ============================================
-- 3. ESTUDIANTES (2 registros)
-- Nota: usuario_id es NOT NULL, creando usuarios temporales primero
-- ============================================

-- Primero crear usuarios para los estudiantes
INSERT INTO usuarios (id, email, username, password_hash, role, status, created_at, updated_at)
VALUES
    (5, 'ash.ketchum@heroespatria.edu.mx', 'ash_ketchum', '$2b$12$temp_password_hash_001', 'estudiante', 'activo', NOW(), NOW()),
    (6, 'misty.waterflower@heroespatria.edu.mx', 'misty_waterflower', '$2b$12$temp_password_hash_002', 'estudiante', 'activo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia de usuarios
SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios));

-- Ahora insertar estudiantes con estructura real
INSERT INTO estudiantes (id, usuario_id, matricula, nombre, apellido_paterno, apellido_materno, genero, semestre, fecha_ingreso, created_at, updated_at)
VALUES
    (1, 5, '20250001', 'Ash', 'Ketchum', NULL, 'M', 1, '2025-08-15', NOW(), NOW()),
    (2, 6, '20250002', 'Misty', 'Waterflower', NULL, 'F', 1, '2025-08-15', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('estudiantes_id_seq', (SELECT MAX(id) FROM estudiantes));

-- ============================================
-- 4. DOCENTES (1 registro)
-- ============================================
INSERT INTO docentes (id, nombre_completo, especialidad, usuario_id)
VALUES
    (1, 'Profesor Oak', 'Pokémonology', NULL)
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('docentes_id_seq', (SELECT MAX(id) FROM docentes));

-- ============================================
-- 5. BOLSA_TRABAJO (3 registros)
-- ============================================
INSERT INTO bolsa_trabajo (id, nombre_completo, email, telefono, generacion, habilidades, experiencia, cv_url, estado, fecha_registro, fecha_actualizacion, notas)
VALUES
    (1, 'Ana García Martínez', 'ana.garcia@example.com', '5551112233', '2022', 'JavaScript, React, Node.js, MySQL, PostgreSQL', NULL, NULL, 'nuevo', '2025-10-14 17:44:44.669029-06:00', '2025-10-14 17:44:44.669029-06:00', NULL),
    (2, 'Brock Pewter', 'brock@example.com', '555-1234', '2022', 'Cooking, Rock-type Pokemon', 'Gym Leader', 'http://example.com/brock.pdf', 'nuevo', '2025-10-24 19:49:04.343173-06:00', '2025-10-24 19:49:04.343173-06:00', 'Good with rock types'),
    (3, 'Tracey Sketchit', 'tracey@example.com', '555-5678', '2023', 'Pokemon Watching, Drawing', 'Pokemon Watcher', 'http://example.com/tracey.pdf', 'revisado', '2025-10-24 19:49:04.343173-06:00', '2025-10-24 19:49:04.343173-06:00', 'Good artist')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('bolsa_trabajo_id_seq', (SELECT MAX(id) FROM bolsa_trabajo));

-- ============================================
-- 6. EGRESADOS (3 registros)
-- ============================================
INSERT INTO egresados (id, egresado_id, nombre_completo, email, telefono, generacion, anio_egreso, carrera_tecnica, ciudad, estado, habilidades, idiomas, linkedin_url, experiencia_laboral, disponibilidad, estado_perfil, confirmado, token_confirmacion, created_at, updated_at)
VALUES
    (1, 'EGR-2025-0001', 'Juan Carlos Pérez García', 'juan.perez@example.com', '2221234567', '2020-2023', 2023, 'Técnico en Programación', 'Puebla', 'Puebla', '["JavaScript","React","Node.js","PostgreSQL","Git"]'::jsonb, '["Español (Nativo)","Inglés (Intermedio)"]'::jsonb, 'https://linkedin.com/in/juanperez', 'Desarrollador Junior en Tech Solutions - 1 año de experiencia en desarrollo web con React y Node.js', 'inmediata', 'pendiente', false, 'test_token_001', '2025-10-17 01:03:31.001385-06:00', '2025-10-17 01:03:31.001385-06:00'),
    (2, 'EGR-2025-0002', 'María Fernanda López Ramírez', 'maria.lopez@example.com', '2229876543', '2019-2022', 2022, 'Técnico en Contabilidad', 'Puebla', 'Puebla', '["Contabilidad","Excel Avanzado","CONTPAQi","Facturación Electrónica","SAT"]'::jsonb, '["Español (Nativo)","Inglés (Básico)"]'::jsonb, 'https://linkedin.com/in/marialopez', 'Auxiliar Contable en Contadores Asociados - 2 años de experiencia en contabilidad general y nómina', 'inmediata', 'aprobado', true, 'test_token_002', '2025-10-17 01:03:31.001385-06:00', '2025-10-17 01:03:31.001385-06:00'),
    (3, 'EGR-2025-0003', 'Carlos Eduardo Hernández Sánchez', 'carlos.hernandez@example.com', '2223456789', '2021-2024', 2024, 'Técnico en Mecatrónica', 'Puebla', 'Puebla', '["Arduino","PLC","AutoCAD","Electrónica","Mantenimiento Industrial"]'::jsonb, '["Español (Nativo)","Inglés (Avanzado)"]'::jsonb, 'https://linkedin.com/in/carloshernandez', 'Recién egresado con proyecto final en automatización industrial', 'inmediata', 'pendiente', true, 'test_token_003', '2025-10-17 01:03:31.001385-06:00', '2025-10-17 01:03:31.001385-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('egresados_id_seq', (SELECT MAX(id) FROM egresados));

-- ============================================
-- 7. SUSCRIPTORES (5 registros)
-- ============================================
INSERT INTO suscriptores (id, subscription_id, email, nombre, categories, source, active, subscribed_at, unsubscribe_token, emails_sent, last_email_sent)
VALUES
    (1, 'SUB-2025-0001', 'ejemplo1@gmail.com', 'Juan Pérez', '["all","noticias","eventos"]'::jsonb, 'newsletter', true, '2025-10-16 23:21:44.031777-06:00', 'eeb3f9717ccdf7b78b49fb90a5832347f10a8e886ff25297ed7053f82fa505f5', 1, '2025-10-16 23:21:44.031777-06:00'),
    (2, 'SUB-2025-0002', 'ejemplo2@gmail.com', 'María García', '["becas","convocatorias"]'::jsonb, 'newsletter', true, '2025-10-16 23:21:44.031777-06:00', 'd0f450ea3b42655d57be3723b9707e658b01bf4e1b6829196d97720e70a9ba9f', 1, '2025-10-16 23:21:44.031777-06:00'),
    (3, 'SUB-2025-0003', 'ejemplo3@gmail.com', 'Carlos López', '["all"]'::jsonb, 'newsletter', false, '2025-10-16 23:21:44.031777-06:00', '2a87b96608d09d287721d80bb03c820021bdfa5551614ad7afe477a6d66ae141', 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('suscriptores_id_seq', (SELECT MAX(id) FROM suscriptores));

-- ============================================
-- 8. NEWSLETTERS (1 registro)
-- ============================================
INSERT INTO newsletters (id, newsletter_id, subject, content, target_category, sent_to, success_count, failure_count, sent_at)
VALUES
    (1, 'NEWS-2025-0001', 'Bienvenida al BGE Héroes de la Patria', '<h2>Bienvenida</h2><p>Gracias por suscribirte a nuestras noticias.</p>', 'all', 2, 2, 0, '2025-10-16 23:21:44.031777-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('newsletters_id_seq', (SELECT MAX(id) FROM newsletters));

-- ============================================
-- 9. NEWSLETTER_ENVIOS (2 registros)
-- ============================================
INSERT INTO newsletter_envios (id, newsletter_id, subscriber_id, email, status, sent_at, opened, clicked)
VALUES
    (1, 1, 1, 'ejemplo1@gmail.com', 'sent', '2025-10-16 23:21:44.031777-06:00', false, false),
    (2, 1, 2, 'ejemplo2@gmail.com', 'sent', '2025-10-16 23:21:44.031777-06:00', false, false)
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('newsletter_envios_id_seq', (SELECT MAX(id) FROM newsletter_envios));

-- ============================================
-- 10. CITAS (3 registros)
-- ============================================
INSERT INTO citas (id, cita_id, nombre_completo, email, telefono, tipo_persona, motivo, descripcion, fecha_solicitada, hora_solicitada, estado, confirmada, token_confirmacion, created_at, updated_at)
VALUES
    (1, 'CITA-2025-0001', 'Juan Pérez García', 'juan.perez@example.com', '2221234567', 'padre', 'Asesoría Académica', 'Consulta sobre el desempeño académico de mi hijo en matemáticas', '2025-10-19 00:00:00Z', '10:00:00', 'pendiente', false, 'e5e6ba983f008f0e7d28ef91e6af4d29d548f9ca5ed06254c72aca26a35946ff', '2025-10-16 23:22:01.395288-06:00', '2025-10-16 23:22:01.395288-06:00'),
    (2, 'CITA-2025-0002', 'María López Hernández', 'maria.lopez@example.com', '2229876543', 'madre', 'Inscripción', 'Información sobre el proceso de inscripción para el próximo ciclo', '2025-10-21 00:00:00Z', '11:00:00', 'aprobada', true, 'f2969e52a22bdc4c664fe1d844672e2d12e29405828848e51ca955fe8767da2a', '2025-10-16 23:22:01.395288-06:00', '2025-10-16 23:22:01.395288-06:00'),
    (3, 'CITA-2025-0003', 'Carlos Rodríguez', 'carlos.rodriguez@example.com', '2225551234', 'estudiante', 'Orientación Vocacional', 'Necesito orientación sobre opciones de carrera universitaria', '2025-10-17 00:00:00Z', '14:00:00', 'aprobada', true, 'c250e21a55f130ec48ff14dabb38fe2b165893268d9d5cc22c56656882127e67', '2025-10-16 23:22:01.395288-06:00', '2025-10-16 23:22:01.395288-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('citas_id_seq', (SELECT MAX(id) FROM citas));

-- ============================================
-- 11. CONTACTOS (3 registros)
-- ============================================
INSERT INTO contactos (id, nombre, email, telefono, asunto, mensaje, tipo_consulta, form_type, status, verificado, email_sent, fecha_creacion, fecha_actualizacion)
VALUES
    (1, 'Ana Martínez', 'ana@test.com', '2221234567', 'Consulta sobre horarios', 'Quisiera saber los horarios de atención', 'Información General', 'Contacto General', 'pendiente', true, false, '2025-10-17 16:12:14.766627-06:00', '2025-10-17 16:12:14.766627-06:00'),
    (2, 'Carlos Gómez', 'carlos@test.com', NULL, 'Proceso de inscripción', '¿Cuál es el proceso para inscribir a mi hijo?', 'Admisiones e Inscripciones', 'Contacto General', 'pendiente', true, false, '2025-10-17 16:12:14.766627-06:00', '2025-10-17 16:12:14.766627-06:00'),
    (3, 'Laura Torres', 'laura@test.com', '2229876543', 'Información de becas', 'Me gustaría conocer las becas disponibles', 'Becas y Apoyos', 'Contacto General', 'pendiente', false, false, '2025-10-17 16:12:14.766627-06:00', '2025-10-17 16:12:14.766627-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('contactos_id_seq', (SELECT MAX(id) FROM contactos));

-- ============================================
-- 12. SOLICITUDES_DOCUMENTOS (4 registros)
-- ============================================
INSERT INTO solicitudes_documentos (id, nombre, email, tipo_usuario, documento_solicitado, motivo, nivel_urgencia, status, fecha_solicitud)
VALUES
    (1, 'María González', 'maria@test.com', 'student', 'Constancia de estudios', 'Para trámite de beca universitaria', 'high', 'pendiente', '2025-10-17 16:33:03.177332-06:00'),
    (2, 'Pedro Ramírez', 'pedro@test.com', 'parent', 'Certificado de calificaciones', 'Solicitud de universidad', 'normal', 'pendiente', '2025-10-17 16:33:03.177332-06:00'),
    (3, 'Ana Torres', 'ana@test.com', 'teacher', 'Constancia laboral', 'Trámite personal', 'low', 'pendiente', '2025-10-17 16:33:03.177332-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('solicitudes_documentos_id_seq', (SELECT MAX(id) FROM solicitudes_documentos));

-- ============================================
-- 13. PASSWORD_RECOVERY_REQUESTS (4 registros)
-- ============================================
INSERT INTO password_recovery_requests (id, email, student_id, status, token, token_expires_at, fecha_solicitud, ip_address, user_agent)
VALUES
    (1, 'padre1@test.com', 'BGE-2024-001', 'pending', NULL, NULL, '2025-10-17 16:36:51.241752-06:00', NULL, NULL),
    (2, 'padre2@test.com', 'BGE-2024-002', 'pending', NULL, NULL, '2025-10-17 16:36:51.241752-06:00', NULL, NULL),
    (3, 'test@example.com', NULL, 'pending', '9073b64267532eecdfe788bc6f5166205e903aba6077e23ddf59be8bd242b7c3', '2025-10-19 03:46:49.231-06:00', '2025-10-18 03:46:49.232074-06:00', '::1', 'curl/8.15.0')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('password_recovery_requests_id_seq', (SELECT MAX(id) FROM password_recovery_requests));

-- ============================================
-- 14. PENDING_APPROVALS (2 registros)
-- ============================================
INSERT INTO pending_approvals (id, form_type, submission_data, status, created_at)
VALUES
    (1, 'bolsa_trabajo', '{"email":"meowth@example.com","experiencia":"Team Rocket","generacion":"2024","habilidades":"Talking","nombre_completo":"Meowth","telefono":"555-9999"}'::jsonb, 'pending', '2025-10-24 19:49:20.484695-06:00'),
    (2, 'egresados', '{"email":"gary@example.com","generacion":"2022","nombre":"Gary Oak"}'::jsonb, 'pending', '2025-10-24 19:49:20.484695-06:00')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('pending_approvals_id_seq', (SELECT MAX(id) FROM pending_approvals));

-- ============================================
-- 15. POLL_CATEGORIES (7 registros)
-- ============================================
INSERT INTO poll_categories (id, name, slug, description, icon, color, active, display_order, created_at)
VALUES
    (1, 'Académico', 'academico', 'Encuestas relacionadas con temas académicos y educativos', '📚', '#3498db', true, 1, '2025-10-19 12:39:30.501279Z'),
    (2, 'Eventos', 'eventos', 'Encuestas sobre eventos escolares y actividades', '🎉', '#9b59b6', true, 2, '2025-10-19 12:39:30.501279Z'),
    (3, 'Instalaciones', 'instalaciones', 'Encuestas sobre infraestructura y servicios', '🏫', '#e74c3c', true, 3, '2025-10-19 12:39:30.501279Z')
ON CONFLICT (id) DO NOTHING;

-- Actualizar secuencia
SELECT setval('poll_categories_id_seq', (SELECT MAX(id) FROM poll_categories));

-- ============================================
-- RESUMEN DE INSERCIONES
-- ============================================
DO $$
DECLARE
    total_usuarios INTEGER;
    total_parents INTEGER;
    total_estudiantes INTEGER;
    total_docentes INTEGER;
    total_bolsa INTEGER;
    total_egresados INTEGER;
    total_suscriptores INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_usuarios FROM usuarios;
    SELECT COUNT(*) INTO total_parents FROM parents;
    SELECT COUNT(*) INTO total_estudiantes FROM estudiantes;
    SELECT COUNT(*) INTO total_docentes FROM docentes;
    SELECT COUNT(*) INTO total_bolsa FROM bolsa_trabajo;
    SELECT COUNT(*) INTO total_egresados FROM egresados;
    SELECT COUNT(*) INTO total_suscriptores FROM suscriptores;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATOS INSERTADOS EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usuarios: %', total_usuarios;
    RAISE NOTICE 'Parents: %', total_parents;
    RAISE NOTICE 'Estudiantes: %', total_estudiantes;
    RAISE NOTICE 'Docentes: %', total_docentes;
    RAISE NOTICE 'Bolsa de Trabajo: %', total_bolsa;
    RAISE NOTICE 'Egresados: %', total_egresados;
    RAISE NOTICE 'Suscriptores: %', total_suscriptores;
    RAISE NOTICE '========================================';
END $$;
