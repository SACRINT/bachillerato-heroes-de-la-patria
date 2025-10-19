-- ============================================
-- 🗄️ TABLA DE SESIONES DE USUARIO (PostgreSQL)
-- Bachillerato General Estatal "Héroes de la Patria"
-- ============================================
-- PROPÓSITO: Almacenar sesiones de usuario de forma persistente
-- COMPATIBLE CON: connect-pg-simple (express-session store)
-- FECHA: Octubre 2025
-- ============================================

-- Eliminar tabla existente si existe (solo para desarrollo)
-- ⚠️ COMENTAR ESTA LÍNEA EN PRODUCCIÓN
DROP TABLE IF EXISTS user_sessions;

-- Crear tabla de sesiones
CREATE TABLE user_sessions (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

-- Añadir constraint de clave primaria
ALTER TABLE user_sessions
ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Crear índice en la columna de expiración para mejorar performance
-- Este índice ayuda a limpiar sesiones expiradas de forma eficiente
CREATE INDEX IF NOT EXISTS IDX_session_expire ON user_sessions (expire);

-- Verificar creación de tabla
SELECT 'user_sessions' AS tabla_creada,
       COUNT(*) AS registros_actuales
FROM user_sessions;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Esta tabla se llenará automáticamente cuando los usuarios inicien sesión
-- 2. connect-pg-simple manejará automáticamente:
--    - Inserción de nuevas sesiones
--    - Actualización de sesiones existentes
--    - Eliminación de sesiones expiradas
-- 3. La columna 'sid' contiene el ID de sesión (session ID)
-- 4. La columna 'sess' contiene los datos de sesión en formato JSON
-- 5. La columna 'expire' indica cuándo expira la sesión
-- 6. NO necesitas hacer consultas manuales a esta tabla
-- ============================================
