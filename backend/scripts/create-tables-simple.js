/**
 * 🔧 SCRIPT SIMPLIFICADO: Crear tablas bolsa_trabajo y suscriptores
 * Fecha: 09 Octubre 2025
 */

const db = require('../config/database');

async function createTables() {
    console.log('🚀 Iniciando creación de tablas...\n');

    try {
        // ===== TABLA 1: bolsa_trabajo =====
        console.log('📄 Creando tabla bolsa_trabajo...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS bolsa_trabajo (
                id INT AUTO_INCREMENT PRIMARY KEY,

                nombre VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                telefono VARCHAR(20),
                ciudad VARCHAR(100),

                generacion VARCHAR(4),
                area_interes TEXT,

                resumen_profesional TEXT,
                habilidades TEXT,

                cv_filename VARCHAR(255),
                cv_path VARCHAR(500),
                cv_url VARCHAR(500),

                estado ENUM('nuevo', 'revisado', 'contactado', 'contratado', 'rechazado', 'archivado') DEFAULT 'nuevo',
                notas_admin TEXT,
                empresas_compartido TEXT,

                ip_registro VARCHAR(45),
                user_agent VARCHAR(500),
                form_type VARCHAR(100) DEFAULT 'Registro Bolsa de Trabajo',

                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                fecha_ultimo_contacto TIMESTAMP NULL,

                INDEX idx_email (email),
                INDEX idx_estado (estado),
                INDEX idx_generacion (generacion),
                INDEX idx_fecha_registro (fecha_registro)

            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla bolsa_trabajo creada\n');

        // ===== TABLA 2: suscriptores_notificaciones =====
        console.log('📧 Creando tabla suscriptores_notificaciones...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS suscriptores_notificaciones (
                id INT AUTO_INCREMENT PRIMARY KEY,

                email VARCHAR(255) NOT NULL UNIQUE,
                nombre VARCHAR(255) NULL,

                notif_convocatorias BOOLEAN DEFAULT FALSE,
                notif_becas BOOLEAN DEFAULT FALSE,
                notif_eventos BOOLEAN DEFAULT FALSE,
                notif_noticias BOOLEAN DEFAULT FALSE,
                notif_todas BOOLEAN DEFAULT TRUE,

                estado ENUM('activo', 'inactivo', 'cancelado') DEFAULT 'activo',
                verificado BOOLEAN DEFAULT FALSE,
                token_verificacion VARCHAR(100),
                fecha_verificacion TIMESTAMP NULL,

                total_enviados INT DEFAULT 0,
                total_abiertos INT DEFAULT 0,
                ultimo_envio TIMESTAMP NULL,

                ip_registro VARCHAR(45),
                user_agent VARCHAR(500),
                fuente VARCHAR(100) DEFAULT 'Formulario Web',

                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                fecha_cancelacion TIMESTAMP NULL,

                INDEX idx_email (email),
                INDEX idx_estado (estado),
                INDEX idx_verificado (verificado),
                INDEX idx_fecha_registro (fecha_registro)

            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla suscriptores_notificaciones creada\n');

        // ===== TABLA 3: empresas_asociadas (opcional) =====
        console.log('🏢 Creando tabla empresas_asociadas...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS empresas_asociadas (
                id INT AUTO_INCREMENT PRIMARY KEY,

                nombre_empresa VARCHAR(255) NOT NULL,
                rfc VARCHAR(13),
                sector VARCHAR(100),
                tamanio ENUM('micro', 'pequeña', 'mediana', 'grande'),

                nombre_contacto VARCHAR(255),
                email_contacto VARCHAR(255) NOT NULL,
                telefono_contacto VARCHAR(20),
                sitio_web VARCHAR(255),

                ciudad VARCHAR(100),
                estado VARCHAR(100),
                direccion TEXT,

                activa BOOLEAN DEFAULT TRUE,
                puede_ver_cvs BOOLEAN DEFAULT FALSE,
                puede_descargar_cvs BOOLEAN DEFAULT FALSE,

                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                INDEX idx_email (email_contacto),
                INDEX idx_activa (activa)

            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Tabla empresas_asociadas creada\n');

        // ===== VERIFICACIÓN =====
        console.log('📊 Verificando tablas:\n');

        const [bolsaCount] = await db.query('SELECT COUNT(*) as total FROM bolsa_trabajo');
        console.log(`   📄 bolsa_trabajo: ${bolsaCount[0].total} registros`);

        const [subsCount] = await db.query('SELECT COUNT(*) as total FROM suscriptores_notificaciones');
        console.log(`   📧 suscriptores_notificaciones: ${subsCount[0].total} registros`);

        const [empresasCount] = await db.query('SELECT COUNT(*) as total FROM empresas_asociadas');
        console.log(`   🏢 empresas_asociadas: ${empresasCount[0].total} registros`);

        // ===== INSERTAR REGISTRO DE PRUEBA (el que el usuario ya envió) =====
        console.log('\n📝 Insertando registro de prueba (formulario ya enviado)...');

        await db.query(`
            INSERT IGNORE INTO bolsa_trabajo (
                nombre, email, telefono, ciudad, generacion,
                area_interes, resumen_profesional, habilidades, estado
            ) VALUES (
                'Samuel Cruz Interal',
                'samuelcis377@gmail.com',
                '744-123-4567',
                'Guerrero',
                '2020',
                'Comunicacion grafica',
                'Egresado con experiencia en diseño gráfico. Manejo de Adobe Creative Suite.',
                'Photoshop, Illustrator, InDesign, Excel, Inglés, Atención al cliente',
                'nuevo'
            )
        `);

        await db.query(`
            INSERT IGNORE INTO suscriptores_notificaciones (
                email, nombre, notif_todas, estado, verificado
            ) VALUES (
                'samuelcis377@gmail.com',
                'Samuel Cruz',
                TRUE,
                'activo',
                TRUE
            )
        `);

        console.log('   ✅ Registros de prueba insertados\n');

        console.log('✅ ¡Todas las tablas creadas exitosamente!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
createTables();
