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
        console.log('============================================');
        console.log('📦 INSTALANDO SISTEMA DE MENSAJERÍA INTERNA');
        console.log('============================================\n');

        // 1. Verificar conexión
        console.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        console.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        // 2. Leer script SQL
        console.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-messaging-system-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        console.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        // 3. Ejecutar script
        console.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        console.log('   ✅ Script ejecutado exitosamente\n');

        // 4. Verificar tablas creadas
        console.log('4️⃣  Verificando tablas creadas...');
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
                console.log(`   ✅ Tabla "${table}" creada (${count} registros)`);
                tablesCreated++;
            } else {
                console.log(`   ❌ Tabla "${table}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${tablesCreated}/${tables.length} tablas creadas\n`);

        // 5. Verificar vistas creadas
        console.log('5️⃣  Verificando vistas creadas...');
        const views = [
            'v_user_conversations',
            'v_messaging_stats'
        ];

        let viewsCreated = 0;
        for (const view of views) {
            const exists = await viewExists(client, view);
            if (exists) {
                console.log(`   ✅ Vista "${view}" creada`);
                viewsCreated++;
            } else {
                console.log(`   ❌ Vista "${view}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${viewsCreated}/${views.length} vistas creadas\n`);

        // 6. Verificar funciones creadas
        console.log('6️⃣  Verificando funciones creadas...');
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
                console.log(`   ✅ Función "${func}" creada`);
                functionsCreated++;
            } else {
                console.log(`   ❌ Función "${func}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${functionsCreated}/${functions.length} funciones creadas\n`);

        // 7. Verificar triggers creados
        console.log('7️⃣  Verificando triggers creados...');
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
                console.log(`   ✅ Trigger "${trigger.name}" creado en "${trigger.table}"`);
                triggersCreated++;
            } else {
                console.log(`   ❌ Trigger "${trigger.name}" NO encontrado en "${trigger.table}"`);
            }
        }
        console.log(`   📊 Total: ${triggersCreated}/${triggers.length} triggers creados\n`);

        // 8. Resumen final
        console.log('============================================');
        console.log('📊 RESUMEN DE INSTALACIÓN');
        console.log('============================================');
        console.log(`✅ Tablas:    ${tablesCreated}/${tables.length}`);
        console.log(`✅ Vistas:    ${viewsCreated}/${views.length}`);
        console.log(`✅ Funciones: ${functionsCreated}/${functions.length}`);
        console.log(`✅ Triggers:  ${triggersCreated}/${triggers.length}`);
        console.log('============================================\n');

        // Verificar éxito total
        const totalExpected = tables.length + views.length + functions.length + triggers.length;
        const totalCreated = tablesCreated + viewsCreated + functionsCreated + triggersCreated;

        if (totalCreated === totalExpected) {
            console.log('🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!');
            console.log(`   Se instalaron correctamente ${totalCreated}/${totalExpected} estructuras\n`);
            return true;
        } else {
            console.log('⚠️  INSTALACIÓN PARCIAL');
            console.log(`   Se instalaron ${totalCreated}/${totalExpected} estructuras`);
            console.log(`   Faltaron ${totalExpected - totalCreated} estructuras\n`);
            return false;
        }

    } catch (error) {
        console.error('❌ ERROR durante la instalación:', error.message);
        console.error('   Stack:', error.stack);
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
            console.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    // Exportar para uso en otros módulos
    module.exports = { installMessagingSystemTables };
}
