-- ============================================
-- SCRIPT: Crear Usuario Administrador CON CREDENCIALES DEL USUARIO
-- Fecha: 13 Noviembre 2025
-- Propósito: Crear usuario admin con las credenciales REALES del usuario
-- ============================================

-- INSTRUCCIONES:
-- 1. Abre Neon Console: https://console.neon.tech
-- 2. Selecciona tu base de datos BGE
-- 3. Ve a SQL Editor
-- 4. Copia y pega este script completo
-- 5. Ejecuta el script
-- 6. Las credenciales serán:
--    Email: admin@heroespatria.edu.mx
--    Usuario: Administrador
--    Contraseña: HeroesPatria2024!
--    Rol: admin

-- ============================================

-- 1. Activar extensión pgcrypto para generar hashes bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Verificar si el usuario ya existe y eliminarlo (para recrear)
DELETE FROM usuarios WHERE email = 'admin@heroespatria.edu.mx';

-- 3. Insertar usuario administrador con contraseña hasheada
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
    'admin@heroespatria.edu.mx',
    'Administrador',
    -- Password hash para "HeroesPatria2024!" usando crypt (bcrypt con salt automático)
    crypt('HeroesPatria2024!', gen_salt('bf', 10)),
    'Administrador',
    'Sistema',
    'BGE',
    'admin',
    'activo',
    NOW(),
    NOW()
);

-- 4. Verificar que el usuario se creó correctamente
SELECT
    id,
    uuid,
    email,
    username,
    nombre,
    apellido_paterno,
    role,
    status,
    created_at,
    LENGTH(password_hash) as password_hash_length
FROM usuarios
WHERE email = 'admin@heroespatria.edu.mx';

-- 5. Test de login (OPCIONAL - para verificar que la contraseña funciona)
-- Descomenta estas líneas si quieres probar la contraseña:
-- SELECT
--     email,
--     username,
--     (password_hash = crypt('HeroesPatria2024!', password_hash)) as password_matches
-- FROM usuarios
-- WHERE email = 'admin@heroespatria.edu.mx';

-- ============================================
-- CREDENCIALES DEL ADMINISTRADOR
-- ============================================
-- Email:     admin@heroespatria.edu.mx
-- Usuario:   Administrador
-- Contraseña: HeroesPatria2024!
-- Rol:       admin
-- ============================================

-- NOTAS:
-- - El password_hash usa bcrypt con salt 10 (estándar de seguridad)
-- - La contraseña es "HeroesPatria2024!" (EXACTAMENTE como la escribiste)
-- - El script usa pgcrypto para hashear en la base de datos
-- - Si ya existía un usuario con ese email, se eliminó y recreó
-- ============================================

-- RESULTADO ESPERADO:
-- Deberías ver:
-- - ✅ Usuario con id, uuid, email, username, role='admin', status='activo'
-- - ✅ password_hash_length = 60 (longitud estándar de bcrypt)
