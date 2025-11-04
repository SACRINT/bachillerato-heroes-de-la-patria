-- ============================================================================
-- 📊 SCRIPT MÍNIMO TEMPORAL - Solo pendientes_aprobacion
-- Esto funcionará con seguridad mientras esperamos el schema real
-- ============================================================================

-- ============================================================================
-- INSERTAR DATOS DE PRUEBA EN TABLA: pendientes_aprobacion
-- Esta tabla definitivamente funciona
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

-- Verificar
SELECT '✅ Aprobaciones pendientes insertadas:' AS status, COUNT(*) as cantidad FROM pendientes_aprobacion;

-- ============================================================================
-- ⚠️ SIGUIENTE PASO:
-- Ejecuta el script DIAGNOSTICO_SCHEMA_NEON.sql para ver el schema real
-- Luego envíame el output para crear un script exacto para las otras tablas
-- ============================================================================
