const { executeQuery } = require('../config/database');

async function runMigration() {
    console.log('🚀 Iniciando reparación de esquema SUSCRIPTORES...');

    // 1. Crear tabla suscriptores_notificaciones si no existe
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS suscriptores_notificaciones (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            nombre VARCHAR(255),
            notif_convocatorias BOOLEAN DEFAULT FALSE,
            notif_becas BOOLEAN DEFAULT FALSE,
            notif_eventos BOOLEAN DEFAULT FALSE,
            notif_noticias BOOLEAN DEFAULT FALSE,
            notif_todas BOOLEAN DEFAULT TRUE,
            estado VARCHAR(50) DEFAULT 'activo',
            verificado BOOLEAN DEFAULT FALSE,
            token_verificacion VARCHAR(255),
            fuente VARCHAR(100),
            fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_verificacion TIMESTAMP,
            fecha_cancelacion TIMESTAMP,
            ip_registro VARCHAR(45),
            user_agent TEXT,
            total_enviados INTEGER DEFAULT 0,
            total_abiertos INTEGER DEFAULT 0,
            ultimo_envio TIMESTAMP
        );
    `;

    try {
        await executeQuery(createTableQuery, []);
        console.log('✅ Tabla `suscriptores_notificaciones` verificada/creada.');
    } catch (error) {
        console.error('❌ Error creando tabla suscriptores_notificaciones:', error.message);
    }

    // 2. Intentar migrar datos de tabla errónea 'suscriptores' si existe
    try {
        const checkOldTable = "SELECT to_regclass('public.suscriptores')";
        const exists = await executeQuery(checkOldTable, []);

        if (exists[0].to_regclass) {
            console.log('⚠️ Tabla antigua `suscriptores` detectada. Intentando migrar datos...');
            // Migración simplificada (ajustar campos según sea necesario)
            const migrationQuery = `
                INSERT INTO suscriptores_notificaciones (email, nombre, fecha_registro, estado)
                SELECT email, name, subscribed_at, CASE WHEN active THEN 'activo' ELSE 'inactivo' END
                FROM suscriptores
                ON CONFLICT (email) DO NOTHING;
            `;
            await executeQuery(migrationQuery, []);
            console.log('✅ Datos migrados de `suscriptores` a `suscriptores_notificaciones`.');

            // Opcional: Renombrar tabla vieja para backup
            // await executeQuery("ALTER TABLE suscriptores RENAME TO suscriptores_backup_legacy", []);
        }
    } catch (error) {
        console.warn('⚠️ No se pudo migrar desde `suscriptores` (quizás no existe o esquema difiere):', error.message);
    }

    console.log('🏁 Reparación de suscriptores finalizada.');
    process.exit(0);
}

runMigration();
