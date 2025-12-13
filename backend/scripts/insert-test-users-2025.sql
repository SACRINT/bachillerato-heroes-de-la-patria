-- ============================================
-- CREAR USUARIOS DE PRUEBA PARA DEBUGGING
-- ============================================
-- Fecha: 12 Diciembre 2025
-- Propósito: Permitir testing del sistema de login

-- ✅ USUARIO DOCENTE
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'docente_test',
    'docente@test.com',
    '$2a$10$zYgIkP51upm0kyxOP5asR.VpMJW.GZYSzjgI8/2B.IdnD4kDOSa6W',  -- Password: Test123!
    'docente',
    'activo',
    'Docente',
    'Test',
    'BGE'
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ✅ USUARIO ADMIN
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'admin_test',
    'admin@test.com',
    '$2a$10$lepyfr3qX6oUOvdaxn0TEeQQ4Aq/pGWyj9RdcQtkHNphgTLgcvR8a',  -- Password: Admin123!
    'admin',
    'activo',
    'Admin',
    'Test',
    'BGE'
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ✅ USUARIO ESTUDIANTE
INSERT INTO usuarios (username, email, password_hash, role, status, nombre, apellido_paterno, apellido_materno)
VALUES (
    'estudiante_test',
    'estudiante@test.com',
    '$2a$10$u6LzWNLkkqJhTzEKdwZXe.U0wJ0rNKpzFNJzYYCZwZR5WFwzJ0OyO',  -- Password: Estudiante123!
    'estudiante',
    'activo',
    'Estudiante',
    'Test',
    'BGE'
)
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Verificar usuarios creados
SELECT username, email, role, status FROM usuarios
WHERE username IN ('docente_test', 'admin_test', 'estudiante_test');
