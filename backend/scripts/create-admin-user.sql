-- =====================================================
-- SCRIPT: Crear Usuario Admin de Prueba
-- Fecha: 19 Nov 2025
--
-- Credenciales:
-- Email: admin@heroespatria.edu.mx
-- Password: HeroesPatria2024!
-- =====================================================

-- Primero verificar si el usuario ya existe y actualizar o insertar
INSERT INTO usuarios (
    uuid,
    email,
    username,
    password_hash,
    role,
    status,
    nombre,
    apellido_paterno,
    apellido_materno,
    created_at
) VALUES (
    gen_random_uuid(),
    'admin@heroespatria.edu.mx',
    'admin',
    '$2b$10$4X5BpGaFoCYq1mfr/krJ0uSn6q5hMOnL1NGD.ZThjxMoxpLZy7ebO',
    'admin',
    'activo',
    'Administrador',
    'Sistema',
    'BGE',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    status = 'activo',
    nombre = 'Administrador',
    apellido_paterno = 'Sistema',
    apellido_materno = 'BGE';

-- Verificar que el usuario fue creado/actualizado
SELECT id, uuid, email, username, role, status, nombre, created_at
FROM usuarios
WHERE email = 'admin@heroespatria.edu.mx';
