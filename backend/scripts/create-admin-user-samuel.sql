-- ============================================
-- SCRIPT: Crear/Actualizar Administrador Principal
-- Usuario: samuelci6377@gmail.com
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO usuarios (
    uuid,
    email,
    username,
    password_hash,
    nombre,
    apellido_paterno,
    role,
    status,
    email_verified,
    email_verified_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'samuelci6377@gmail.com',
    'samuelci6377',
    crypt('BGE2024Admin!', gen_salt('bf', 10)),
    'Samuel',
    'CI',
    'admin',
    'activo',
    true,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = crypt('BGE2024Admin!', gen_salt('bf', 10)),
    role = 'admin',
    status = 'activo',
    email_verified = true,
    updated_at = NOW();
