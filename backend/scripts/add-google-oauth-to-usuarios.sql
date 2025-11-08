/**
 * Script de Migración: Agregar Soporte Google OAuth a Tabla USUARIOS
 * Fecha: 8 de Noviembre de 2025
 *
 * Propósito: Agregar columnas necesarias a la tabla 'usuarios' EXISTENTE
 * para soportar Google OAuth sin alterar datos existentes
 *
 * NOTA: Este script es SEGURO - NO elimina datos, solo agrega columnas
 */

-- =====================================================
-- PASO 1: Agregar columnas para Google OAuth
-- =====================================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- =====================================================
-- PASO 2: Crear índice en google_id para búsquedas rápidas
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);

-- =====================================================
-- PASO 3: Actualizar comentarios de columnas (OPCIONAL)
-- =====================================================

COMMENT ON COLUMN usuarios.google_id IS 'ID único de Google (sub del JWT) para autenticación OAuth';
COMMENT ON COLUMN usuarios.oauth_provider IS 'Proveedor de autenticación: local, google, facebook, etc';
COMMENT ON COLUMN usuarios.profile_picture IS 'URL de foto de perfil desde Google u otro proveedor OAuth';

-- =====================================================
-- PASO 4: Verificación (Ejecutar después de migración)
-- =====================================================

/*
-- Ver estructura de la tabla
\d usuarios

-- Ver columnas específicas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- Ver índices
\di idx_usuarios*

-- Contar usuarios
SELECT COUNT(*) FROM usuarios;

-- Ver si hay columnas NULL
SELECT
    COUNT(*) as total_usuarios,
    COUNT(google_id) as usuarios_con_google,
    COUNT(CASE WHEN oauth_provider = 'google' THEN 1 END) as usuarios_oauth
FROM usuarios;
*/

-- =====================================================
-- PASO 5: Script de Prueba (OPCIONAL - Descomenta para usar)
-- =====================================================

/*
-- Insertar usuario de prueba con Google OAuth
INSERT INTO usuarios
(uuid, email, username, password_hash, role, status, nombre, apellido_paterno, apellido_materno,
 google_id, oauth_provider, profile_picture, created_at)
VALUES
(gen_random_uuid(),
 'usuario@gmail.com',
 'usuario_gmail',
 NULL,  -- No tiene password hash (es Google OAuth)
 'estudiante',
 'activo',
 'Juan',
 'García',
 'López',
 '123456789',  -- Google ID de ejemplo
 'google',
 'https://lh3.googleusercontent.com/example',
 NOW());
*/

-- =====================================================
-- Fin del Script de Migración
-- =====================================================

-- INSTRUCCIONES DE USO:
-- 1. Abrir Neon Console
-- 2. Ir a SQL Editor
-- 3. Copiar TODO este contenido
-- 4. Pegar en el editor
-- 5. Click en "Run" o Ctrl+Enter
-- 6. Esperar confirmación "Query executed successfully"
-- 7. Reiniciar servidor backend
