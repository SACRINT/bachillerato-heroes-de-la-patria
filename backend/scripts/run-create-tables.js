/**
 * 🔧 SCRIPT: Ejecutar creación de tablas bolsa_trabajo y suscriptores
 * Fecha: 09 Octubre 2025
 */

const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const db = require('../config/database');

async function runScript() {
    devLogger.log('🚀 Iniciando creación de tablas...\n');

    try {
        // Leer archivo SQL
        const sqlPath = path.join(__dirname, 'create_bolsa_trabajo_tables.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Dividir en statements individuales
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        devLogger.log(`📄 ${statements.length} statements SQL encontrados\n`);

        // Ejecutar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Saltar comentarios
            if (statement.startsWith('--') || statement.startsWith('/*')) {
                continue;
            }

            // Saltar USE database (ya estamos conectados)
            if (statement.toUpperCase().startsWith('USE ')) {
                devLogger.log(`⏭️  Saltando: ${statement.substring(0, 50)}...`);
                continue;
            }

            try {
                devLogger.log(`⚙️  Ejecutando statement ${i + 1}/${statements.length}...`);

                await db.query(statement);

                devLogger.log(`   ✅ Exitoso\n`);

            } catch (error) {
                // Ignorar errores de "ya existe"
                if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                    devLogger.log(`   ℹ️  Tabla ya existe, continuando...\n`);
                } else if (error.code === 'ER_DUP_FIELDNAME') {
                    devLogger.log(`   ℹ️  Campo ya existe, continuando...\n`);
                } else {
                    devLogger.error(`   ❌ Error:`, error.message);
                    devLogger.error(`   Statement: ${statement.substring(0, 100)}...\n`);
                }
            }
        }

        // Verificar tablas creadas
        devLogger.log('\n📊 Verificando tablas creadas:\n');

        const [tables] = await db.query(`
            SHOW TABLES LIKE 'bolsa_trabajo'
            UNION
            SHOW TABLES LIKE 'suscriptores_notificaciones'
            UNION
            SHOW TABLES LIKE 'empresas_asociadas'
            UNION
            SHOW TABLES LIKE 'historial_compartidos'
        `);

        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            devLogger.log(`   ✅ ${tableName}`);
        });

        // Mostrar estadísticas
        devLogger.log('\n📈 Estadísticas iniciales:\n');

        const [bolsaStats] = await db.query('SELECT COUNT(*) as total FROM bolsa_trabajo');
        devLogger.log(`   📄 Bolsa de Trabajo: ${bolsaStats[0].total} registros`);

        const [subsStats] = await db.query('SELECT COUNT(*) as total FROM suscriptores_notificaciones');
        devLogger.log(`   📧 Suscriptores: ${subsStats[0].total} registros`);

        const [empresasStats] = await db.query('SELECT COUNT(*) as total FROM empresas_asociadas');
        devLogger.log(`   🏢 Empresas: ${empresasStats[0].total} registros`);

        const [historialStats] = await db.query('SELECT COUNT(*) as total FROM historial_compartidos');
        devLogger.log(`   📋 Historial Compartidos: ${historialStats[0].total} registros`);

        devLogger.log('\n✅ ¡Tablas creadas exitosamente!\n');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ Error fatal:', error);
        process.exit(1);
    }
}

// Ejecutar
runScript();
