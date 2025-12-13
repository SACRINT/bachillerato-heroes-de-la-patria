-- ============================================
-- CREAR USUARIOS DE PRUEBA PARA DEBUGGING
-- ============================================
-- Fecha: 12 Diciembre 2025
-- Propósito: Permitir testing del sistema de login
--
-- Notas:
-- - El login ahora usa EMAIL (no username)
-- - Las contraseñas están hasheadas con bcrypt nivel 10
-- - Los usuarios tienen roles: docente, admin, estudiante

-- ✅ USUARIO DOCENTE (Email: docente@test.com, Password: Test123!)
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'docente_test',
    'docente@test.com',
    '$2a$10$zYgIkP51upm0kyxOP5asR.VpMJW.GZYSzjgI8/2B.IdnD4kDOSa6W',
    'docente',
    'activo',
    'Docente',
    'Test',
    'BGE'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ✅ USUARIO ADMIN (Email: admin@test.com, Password: Admin123!)
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'admin_test',
    'admin@test.com',
    '$2a$10$lepyfr3qX6oUOvdaxn0TEeQQ4Aq/pGWyj9RdcQtkHNphgTLgcvR8a',
    'admin',
    'activo',
    'Admin',
    'Test',
    'BGE'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ✅ USUARIO ESTUDIANTE (Email: estudiante@test.com, Password: Estudiante123!)
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'estudiante_test',
    'estudiante@test.com',
    '$2a$10$u6LzWNLkkqJhTzEKdwZXe.U0wJ0rNKpzFNJzYYCZwZR5WFwzJ0OyO',
    'estudiante',
    'activo',
    'Estudiante',
    'Test',
    'BGE'
)
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ✅ Verificar usuarios creados
SELECT username, email, role, status, nombre FROM usuarios
WHERE email IN ('docente@test.com', 'admin@test.com', 'estudiante@test.com');
