/**
 * ============================================
 * SCRIPT DE INSTALACIÓN - SISTEMA DE MENSAJERÍA INTERNA
 * ============================================
 * Versión: 1.0.0
 * Fecha: 19 de Octubre, 2025
 * Descripción: Ejecuta el script SQL para crear las estructuras
 *              del sistema de mensajería interna
 * Características:
 *   - Verificación de conexión a base de datos
 *   - Ejecución del script SQL
 *   - Validación de instalación exitosa
 *   - Logging detallado
 * ============================================
 */

require('dotenv').config();
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const { Pool } = require('pg');

// ============================================
// CONFIGURACIÓN DE BASE DE DATOS
// ============================================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verifica si una tabla existe en la base de datos
 */
async function tableExists(client, tableName) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = $1
        )`,
        [tableName]
    );
    return result.rows[0].exists;
}

/**
 * Verifica si una vista existe en la base de datos
 */
async function viewExists(client, viewName) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name = $1
        )`,
        [viewName]
    );
    return result.rows[0].exists;
}

/**
 * Verifica si una función existe en la base de datos
 */
async function functionExists(client, functionName) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT FROM pg_proc
            WHERE proname = $1
        )`,
        [functionName]
    );
    return result.rows[0].exists;
}

/**
 * Verifica si un trigger existe en la base de datos
 */
async function triggerExists(client, triggerName, tableName) {
    const result = await client.query(
        `SELECT EXISTS (
            SELECT FROM information_schema.triggers
            WHERE trigger_name = $1
            AND event_object_table = $2
        )`,
        [triggerName, tableName]
    );
    return result.rows[0].exists;
}

/**
 * Cuenta el número de registros en una tabla
 */
async function countRecords(client, tableName) {
    try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        return parseInt(result.rows[0].count);
    } catch (error) {
        return 0;
    }
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function installMessagingSystemTables() {
    const client = await pool.connect();

    try {
        devLogger.log('============================================');
        devLogger.log('📦 INSTALANDO SISTEMA DE MENSAJERÍA INTERNA');
        devLogger.log('============================================\n');

        // 1. Verificar conexión
        devLogger.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        devLogger.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        // 2. Leer script SQL
        devLogger.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-messaging-system-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        devLogger.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        // 3. Ejecutar script
        devLogger.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        devLogger.log('   ✅ Script ejecutado exitosamente\n');

        // 4. Verificar tablas creadas
        devLogger.log('4️⃣  Verificando tablas creadas...');
        const tables = [
            'conversations',
            'conversation_participants',
            'messages',
            'message_attachments',
            'message_read_status',
            'conversation_settings',
            'typing_indicators'
        ];

        let tablesCreated = 0;
        for (const table of tables) {
            const exists = await tableExists(client, table);
            const count = await countRecords(client, table);
            if (exists) {
                devLogger.log(`   ✅ Tabla "${table}" creada (${count} registros)`);
                tablesCreated++;
            } else {
                devLogger.log(`   ❌ Tabla "${table}" NO encontrada`);
            }
        }
        devLogger.log(`   📊 Total: ${tablesCreated}/${tables.length} tablas creadas\n`);

        // 5. Verificar vistas creadas
        devLogger.log('5️⃣  Verificando vistas creadas...');
        const views = [
            'v_user_conversations',
            'v_messaging_stats'
        ];

        let viewsCreated = 0;
        for (const view of views) {
            const exists = await viewExists(client, view);
            if (exists) {
                devLogger.log(`   ✅ Vista "${view}" creada`);
                viewsCreated++;
            } else {
                devLogger.log(`   ❌ Vista "${view}" NO encontrada`);
            }
        }
        devLogger.log(`   📊 Total: ${viewsCreated}/${views.length} vistas creadas\n`);

        // 6. Verificar funciones creadas
        devLogger.log('6️⃣  Verificando funciones creadas...');
        const functions = [
            'update_conversation_updated_at',
            'update_conversation_message_count',
            'update_unread_count_on_read',
            'cleanup_typing_indicators'
        ];

        let functionsCreated = 0;
        for (const func of functions) {
            const exists = await functionExists(client, func);
            if (exists) {
                devLogger.log(`   ✅ Función "${func}" creada`);
                functionsCreated++;
            } else {
                devLogger.log(`   ❌ Función "${func}" NO encontrada`);
            }
        }
        devLogger.log(`   📊 Total: ${functionsCreated}/${functions.length} funciones creadas\n`);

        // 7. Verificar triggers creados
        devLogger.log('7️⃣  Verificando triggers creados...');
        const triggers = [
            { name: 'trigger_conversations_updated_at', table: 'conversations' },
            { name: 'trigger_update_message_count', table: 'messages' },
            { name: 'trigger_update_unread_count', table: 'message_read_status' },
            { name: 'trigger_settings_updated_at', table: 'conversation_settings' }
        ];

        let triggersCreated = 0;
        for (const trigger of triggers) {
            const exists = await triggerExists(client, trigger.name, trigger.table);
            if (exists) {
                devLogger.log(`   ✅ Trigger "${trigger.name}" creado en "${trigger.table}"`);
                triggersCreated++;
            } else {
                devLogger.log(`   ❌ Trigger "${trigger.name}" NO encontrado en "${trigger.table}"`);
            }
        }
        devLogger.log(`   📊 Total: ${triggersCreated}/${triggers.length} triggers creados\n`);

        // 8. Resumen final
        devLogger.log('============================================');
        devLogger.log('📊 RESUMEN DE INSTALACIÓN');
        devLogger.log('============================================');
        devLogger.log(`✅ Tablas:    ${tablesCreated}/${tables.length}`);
        devLogger.log(`✅ Vistas:    ${viewsCreated}/${views.length}`);
        devLogger.log(`✅ Funciones: ${functionsCreated}/${functions.length}`);
        devLogger.log(`✅ Triggers:  ${triggersCreated}/${triggers.length}`);
        devLogger.log('============================================\n');

        // Verificar éxito total
        const totalExpected = tables.length + views.length + functions.length + triggers.length;
        const totalCreated = tablesCreated + viewsCreated + functionsCreated + triggersCreated;

        if (totalCreated === totalExpected) {
            devLogger.log('🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!');
            devLogger.log(`   Se instalaron correctamente ${totalCreated}/${totalExpected} estructuras\n`);
            return true;
        } else {
            devLogger.log('⚠️  INSTALACIÓN PARCIAL');
            devLogger.log(`   Se instalaron ${totalCreated}/${totalExpected} estructuras`);
            devLogger.log(`   Faltaron ${totalExpected - totalCreated} estructuras\n`);
            return false;
        }

    } catch (error) {
        devLogger.error('❌ ERROR durante la instalación:', error.message);
        devLogger.error('   Stack:', error.stack);
        return false;
    } finally {
        client.release();
        await pool.end();
    }
}

// ============================================
// EJECUCIÓN
// ============================================

if (require.main === module) {
    // Solo ejecutar si se llama directamente
    installMessagingSystemTables()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            devLogger.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    // Exportar para uso en otros módulos
    module.exports = { installMessagingSystemTables };
}
