-- ============================================================================
-- 📊 INSERTAR DATOS DE PRUEBA PARA BOLSA DE TRABAJO
-- Propósito: Llenar la BD con datos de prueba para testing en local
-- Ejecutar: psql -U username -d database -f backend/scripts/insert-bolsa-trabajo-test-data.sql
-- ============================================================================

-- 1. Insertar registros pendientes de confirmación
INSERT INTO bolsa_trabajo_pending_confirmation (
    email,
    confirmation_token,
    token_expires_at,
    form_data,
    created_at,
    ip_address,
    user_agent
) VALUES
(
    'juan.perez@email.com',
    'token_test_1_juan_perez',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object(
        'name', 'Juan Pérez López',
        'email', 'juan.perez@email.com',
        'phone', '5551234567',
        'graduationYear', '2023',
        'subject', 'Desarrollo de Software',
        'message', 'Tengo experiencia en JavaScript y Python. Soy estudiante de ingeniería en sistemas.',
        'skills', jsonb_build_array('JavaScript', 'Python', 'React', 'PostgreSQL')
    ),
    NOW(),
    '192.168.1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
),
(
    'maria.garcia@email.com',
    'token_test_2_maria_garcia',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object(
        'name', 'María García Sánchez',
        'email', 'maria.garcia@email.com',
        'phone', '5552345678',
        'graduationYear', '2022',
        'subject', 'Administración',
        'message', 'Soy egresada en administración de empresas con 2 años de experiencia en recursos humanos.',
        'skills', jsonb_build_array('Excel', 'HR', 'RRHH', 'Comunicación')
    ),
    NOW(),
    '192.168.1.2',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
),
(
    'carlos.lopez@email.com',
    'token_test_3_carlos_lopez',
    NOW() + INTERVAL '24 hours',
    jsonb_build_object(
        'name', 'Carlos López Martínez',
        'email', 'carlos.lopez@email.com',
        'phone', '5553456789',
        'graduationYear', '2021',
        'subject', 'Diseño Gráfico',
        'message', 'Diseñador gráfico con experiencia en Adobe Creative Suite. Tengo portafolio con 15+ proyectos.',
        'skills', jsonb_build_array('Adobe XD', 'Photoshop', 'Ilustración', 'UX/UI')
    ),
    NOW(),
    '192.168.1.3',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
);

-- 2. Insertar solicitudes CONFIRMADAS en pendientes_aprobacion (como si ya pasaron por confirmación)
INSERT INTO pendientes_aprobacion (
    tipo_solicitud,
    email_usuario,
    datos_json,
    estado,
    email_confirmado,
    fecha_solicitud,
    created_at
) VALUES
(
    'bolsa_trabajo',
    'ana.rodriguez@email.com',
    jsonb_build_object(
        'name', 'Ana Rodríguez Flores',
        'email', 'ana.rodriguez@email.com',
        'phone', '5554567890',
        'graduationYear', '2020',
        'subject', 'Marketing Digital',
        'message', 'Especialista en marketing digital con expertise en SEO, SEM y social media. 3 años de experiencia.',
        'skills', jsonb_build_array('SEO', 'SEM', 'Google Ads', 'Social Media')
    ),
    'pendiente',
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    'bolsa_trabajo',
    'luis.torres@email.com',
    jsonb_build_object(
        'name', 'Luis Torres Ruiz',
        'email', 'luis.torres@email.com',
        'phone', '5555678901',
        'graduationYear', '2019',
        'subject', 'Desarrollo Web',
        'message', 'Full-stack developer con experiencia en MERN stack. He trabajado en startups y empresas medianas.',
        'skills', jsonb_build_array('JavaScript', 'React', 'Node.js', 'MongoDB', 'PostgreSQL')
    ),
    'pendiente',
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
(
    'bolsa_trabajo',
    'elena.morales@email.com',
    jsonb_build_object(
        'name', 'Elena Morales Gómez',
        'email', 'elena.morales@email.com',
        'phone', '5556789012',
        'graduationYear', '2023',
        'subject', 'Contabilidad',
        'message', 'Contadora con conocimientos en impuestos, auditoría y gestión financiera. Software contable: SAP y CFDI.',
        'skills', jsonb_build_array('Contabilidad', 'SAP', 'CFDI', 'Auditoría', 'Impuestos')
    ),
    'pendiente',
    true,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
),
(
    'bolsa_trabajo',
    'diego.sanchez@email.com',
    jsonb_build_object(
        'name', 'Diego Sánchez Vargas',
        'email', 'diego.sanchez@email.com',
        'phone', '5557890123',
        'graduationYear', '2022',
        'subject', 'Ingeniería Industrial',
        'message', 'Ingeniero industrial con experiencia en optimización de procesos y mejora continua. Certificado en Lean Six Sigma.',
        'skills', jsonb_build_array('Lean Six Sigma', 'Procesos', 'Optimización', 'Excel', 'Project Management')
    ),
    'pendiente',
    true,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes'
);

-- 3. Resumen de lo insertado
SELECT
    'bolsa_trabajo_pending_confirmation' as tabla,
    COUNT(*) as registros
FROM bolsa_trabajo_pending_confirmation
UNION ALL
SELECT
    'pendientes_aprobacion (bolsa_trabajo)',
    COUNT(*)
FROM pendientes_aprobacion
WHERE tipo_solicitud = 'bolsa_trabajo'
UNION ALL
SELECT
    'pendientes_aprobacion (pendiente)',
    COUNT(*)
FROM pendientes_aprobacion
WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente' AND email_confirmado = true;
