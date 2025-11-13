-- ============================================
-- SCRIPT: Crear Usuario Administrador
-- Fecha: 13 Noviembre 2025
-- Propósito: Crear un usuario admin para acceder al dashboard
-- ============================================

-- INSTRUCCIONES:
-- 1. Abre Neon Console: https://console.neon.tech
-- 2. Selecciona tu base de datos
-- 3. Ve a SQL Editor
-- 4. Copia y pega este script completo
-- 5. Ejecuta el script
-- 6. Las credenciales serán:
--    Email: admin@bge.edu.mx
--    Usuario: admin
--    Contraseña: Admin123!
--    Rol: admin

-- ============================================

-- Verificar si el usuario ya existe
DO $$
BEGIN
    -- Intentar insertar el usuario admin
    INSERT INTO usuarios (
        uuid,
        email,
        username,
        password_hash,
        nombre,
        apellido_paterno,
        apellido_materno,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'admin@bge.edu.mx',
        'admin',
        -- Password hash para "Admin123!" (bcrypt con salt 10)
        '$2b$10$8Kd3iZ4xF9qR7jY5nW2tL.eX7mQ4vP6hN8wK3sJ9tL2rF4gH5kI1m',
        'Administrador',
        'Sistema',
        'BGE',
        'admin',
        'activo',
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET
        username = 'admin',
        password_hash = '$2b$10$8Kd3iZ4xF9qR7jY5nW2tL.eX7mQ4vP6hN8wK3sJ9tL2rF4gH5kI1m',
        role = 'admin',
        status = 'activo',
        updated_at = NOW();

    RAISE NOTICE '✅ Usuario administrador creado/actualizado exitosamente';
END $$;

-- Verificar que el usuario se creó correctamente
SELECT
    id,
    uuid,
    email,
    username,
    nombre,
    apellido_paterno,
    role,
    status,
    created_at
FROM usuarios
WHERE email = 'admin@bge.edu.mx';

-- ============================================
-- CREDENCIALES DEL ADMINISTRADOR
-- ============================================
-- Email:     admin@bge.edu.mx
-- Usuario:   admin
-- Contraseña: Admin123!
-- Rol:       admin
-- ============================================

-- NOTAS:
-- - El password_hash es el hash bcrypt de "Admin123!"
-- - Si ya existe un usuario con ese email, se ACTUALIZARÁ
-- - El script usa ON CONFLICT para evitar errores
-- ============================================
