/**
 * Script para crear la tabla de egresados en la base de datos
 * Ejecutar: node backend/scripts/setup-egresados-table.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const createEgresadosTable = `
CREATE TABLE IF NOT EXISTS egresados (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Información Personal
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    generacion VARCHAR(20) NOT NULL,
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    ocupacion_actual VARCHAR(150),

    -- Formación Académica
    universidad VARCHAR(150),
    carrera VARCHAR(150),
    estatus_estudios ENUM('estudiante', 'titulado', 'trunco', 'no-estudios'),
    año_egreso YEAR,

    -- Historia de Éxito
    historia_exito TEXT,
    autoriza_publicar BOOLEAN DEFAULT FALSE,

    -- Metadatos
    autoriza_datos BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT TRUE,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_registro VARCHAR(45),

    -- Índices para búsqueda rápida
    INDEX idx_email (email),
    INDEX idx_generacion (generacion),
    INDEX idx_fecha_registro (fecha_registro),
    INDEX idx_verificado (verificado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function setupDatabase() {
    let connection;

    try {
        console.log('🔌 Conectando a la base de datos...');

        // Crear conexión
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'bge_user',
            password: process.env.DB_PASSWORD || 'HeroesPatria2025DB!',
            database: process.env.DB_NAME || 'heroes_patria_db'
        });

        console.log('✅ Conexión establecida');

        // Crear tabla de egresados
        console.log('📋 Creando tabla egresados...');
        await connection.query(createEgresadosTable);
        console.log('✅ Tabla egresados creada exitosamente');

        // Verificar que la tabla existe
        const [tables] = await connection.query('SHOW TABLES LIKE "egresados"');
        if (tables.length > 0) {
            console.log('✅ Verificación: Tabla egresados existe en la base de datos');

            // Mostrar estructura de la tabla
            const [columns] = await connection.query('DESCRIBE egresados');
            console.log('\n📊 Estructura de la tabla egresados:');
            console.table(columns);
        }

    } catch (error) {
        console.error('❌ Error al configurar la base de datos:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar el script
setupDatabase();
