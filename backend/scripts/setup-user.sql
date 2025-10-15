-- 👤 SCRIPT DE CONFIGURACIÓN DE USUARIO BGE
-- ========================================
-- Crea el usuario de base de datos para el proyecto BGE
-- Proyecto: Bachillerato General Estatal "Héroes de la Patria"
-- Ejecutar como usuario root de MySQL

-- ============================================
-- CONFIGURACIÓN DE USUARIO DE BASE DE DATOS
-- ============================================

-- Eliminar usuario si ya existe (para reconfiguración)
DROP USER IF EXISTS 'bge_user'@'localhost';

-- Crear usuario BGE con contraseña segura
CREATE USER 'bge_user'@'localhost' IDENTIFIED BY 'HeroesPatria2025DB!';

-- ============================================
-- PERMISOS PARA BASE DE DATOS PRINCIPAL
-- ============================================

-- Otorgar permisos completos en la base de datos BGE
GRANT ALL PRIVILEGES ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- Permisos específicos para operaciones comunes
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- Permisos para procedimientos almacenados y funciones
GRANT CREATE ROUTINE, ALTER ROUTINE, EXECUTE ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- Permisos para vistas
GRANT CREATE VIEW, SHOW VIEW ON heroes_patria_db.* TO 'bge_user'@'localhost';

-- ============================================
-- PERMISOS ADICIONALES PARA DESARROLLO
-- ============================================

-- Permiso para crear bases de datos de test (opcional)
GRANT CREATE ON *.* TO 'bge_user'@'localhost';

-- Permisos para ver información del esquema
GRANT SELECT ON information_schema.* TO 'bge_user'@'localhost';

-- Permisos para ver estadísticas de rendimiento
GRANT SELECT ON performance_schema.* TO 'bge_user'@'localhost';

-- ============================================
-- CONFIGURACIÓN DE SEGURIDAD
-- ============================================

-- Establecer límites de recursos para evitar sobrecarga
ALTER USER 'bge_user'@'localhost'
WITH MAX_QUERIES_PER_HOUR 1000
     MAX_CONNECTIONS_PER_HOUR 100
     MAX_UPDATES_PER_HOUR 500;

-- ============================================
-- APLICAR CAMBIOS
-- ============================================

-- Aplicar todos los cambios de permisos
FLUSH PRIVILEGES;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Mostrar permisos otorgados al usuario
SHOW GRANTS FOR 'bge_user'@'localhost';

-- Verificar que el usuario se creó correctamente
SELECT User, Host, authentication_string FROM mysql.user WHERE User = 'bge_user';

-- ============================================
-- INFORMACIÓN DE CONEXIÓN
-- ============================================

SELECT 'Usuario BGE configurado exitosamente' as STATUS;
SELECT 'Host: localhost' as CONNECTION_INFO;
SELECT 'Port: 3306' as CONNECTION_INFO;
SELECT 'Username: bge_user' as CONNECTION_INFO;
SELECT 'Password: HeroesPatria2025DB!' as CONNECTION_INFO;
SELECT 'Database: heroes_patria_db' as CONNECTION_INFO;

-- ============================================
-- COMANDOS PARA PROBAR LA CONEXIÓN
-- ============================================

/*
Desde línea de comandos:
mysql -u bge_user -pHeroesPatria2025DB! -h localhost

Para conectar a la base de datos específica:
mysql -u bge_user -pHeroesPatria2025DB! -h localhost heroes_patria_db

Desde Node.js:
const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'bge_user',
    password: 'HeroesPatria2025DB!',
    database: 'heroes_patria_db'
});
*/