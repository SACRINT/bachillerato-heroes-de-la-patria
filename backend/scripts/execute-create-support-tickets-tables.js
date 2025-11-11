/**
 * SCRIPT DE INSTALACIÓN - SISTEMA DE TICKETS DE SOPORTE
 * Ejecuta el script SQL para crear las estructuras del sistema de tickets
 */

require('dotenv').config();
const fs = require('fs');
const devLogger = require('../utils/devLogger');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function tableExists(client, tableName) {
    const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [tableName]
    );
    return result.rows[0].exists;
}

async function viewExists(client, viewName) {
    const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.views WHERE table_schema = 'public' AND table_name = $1)`,
        [viewName]
    );
    return result.rows[0].exists;
}

async function functionExists(client, functionName) {
    const result = await client.query(
        `SELECT EXISTS (SELECT FROM pg_proc WHERE proname = $1)`,
        [functionName]
    );
    return result.rows[0].exists;
}

async function triggerExists(client, triggerName, tableName) {
    const result = await client.query(
        `SELECT EXISTS (SELECT FROM information_schema.triggers WHERE trigger_name = $1 AND event_object_table = $2)`,
        [triggerName, tableName]
    );
    return result.rows[0].exists;
}

async function countRecords(client, tableName) {
    try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        return parseInt(result.rows[0].count);
    } catch (error) {
        return 0;
    }
}

async function installSupportTicketsTables() {
    const client = await pool.connect();

    try {
        devLogger.log('============================================');
        devLogger.log('🎫 INSTALANDO SISTEMA DE TICKETS DE SOPORTE');
        devLogger.log('============================================\n');

        devLogger.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        devLogger.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        devLogger.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-support-tickets-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        devLogger.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        devLogger.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        devLogger.log('   ✅ Script ejecutado exitosamente\n');

        devLogger.log('4️⃣  Verificando tablas creadas...');
        const tables = [
            'support_departments',
            'support_ticket_categories',
            'support_tickets',
            'support_ticket_comments',
            'support_ticket_attachments',
            'support_ticket_history',
            'support_ticket_watchers',
            'support_canned_responses'
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

        devLogger.log('5️⃣  Verificando vistas creadas...');
        const views = [
            'v_support_tickets_full',
            'v_support_department_stats',
            'v_support_agent_stats'
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

        devLogger.log('6️⃣  Verificando funciones creadas...');
        const functions = [
            'update_support_updated_at',
            'generate_ticket_number',
            'calculate_sla_deadlines',
            'log_ticket_change',
            'check_sla_compliance',
            'update_category_ticket_count',
            'update_ticket_counters'
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

        devLogger.log('7️⃣  Verificando triggers creados...');
        const triggers = [
            { name: 'trigger_tickets_updated_at', table: 'support_tickets' },
            { name: 'trigger_departments_updated_at', table: 'support_departments' },
            { name: 'trigger_categories_updated_at', table: 'support_ticket_categories' },
            { name: 'trigger_comments_updated_at', table: 'support_ticket_comments' },
            { name: 'trigger_generate_ticket_number', table: 'support_tickets' },
            { name: 'trigger_calculate_sla', table: 'support_tickets' },
            { name: 'trigger_log_ticket_changes', table: 'support_tickets' },
            { name: 'trigger_check_sla_compliance', table: 'support_tickets' },
            { name: 'trigger_update_category_count', table: 'support_tickets' },
            { name: 'trigger_update_comment_count', table: 'support_ticket_comments' },
            { name: 'trigger_update_attachment_count', table: 'support_ticket_attachments' }
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

        devLogger.log('8️⃣  Verificando datos iniciales...');
        const deptCount = await countRecords(client, 'support_departments');
        const catCount = await countRecords(client, 'support_ticket_categories');
        devLogger.log(`   ✅ Departamentos: ${deptCount} registros`);
        devLogger.log(`   ✅ Categorías: ${catCount} registros\n`);

        devLogger.log('============================================');
        devLogger.log('📊 RESUMEN DE INSTALACIÓN');
        devLogger.log('============================================');
        devLogger.log(`✅ Tablas:       ${tablesCreated}/${tables.length}`);
        devLogger.log(`✅ Vistas:       ${viewsCreated}/${views.length}`);
        devLogger.log(`✅ Funciones:    ${functionsCreated}/${functions.length}`);
        devLogger.log(`✅ Triggers:     ${triggersCreated}/${triggers.length}`);
        devLogger.log(`✅ Departamentos: ${deptCount}`);
        devLogger.log(`✅ Categorías:   ${catCount}`);
        devLogger.log('============================================\n');

        const totalExpected = tables.length + views.length + functions.length + triggers.length;
        const totalCreated = tablesCreated + viewsCreated + functionsCreated + triggersCreated;

        if (totalCreated === totalExpected) {
            devLogger.log('🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!');
            devLogger.log(`   Se instalaron correctamente ${totalCreated}/${totalExpected} estructuras\n`);
            devLogger.log('📋 PRÓXIMOS PASOS:');
            devLogger.log('   1. Revisar departamentos y categorías creados');
            devLogger.log('   2. Configurar agentes de soporte');
            devLogger.log('   3. Personalizar respuestas predefinidas');
            devLogger.log('   4. Ajustar SLA según necesidades institucionales');
            devLogger.log('   5. Acceder al sistema en /soporte.html\n');
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

if (require.main === module) {
    installSupportTicketsTables()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            devLogger.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    module.exports = { installSupportTicketsTables };
}
