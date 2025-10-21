/**
 * SCRIPT DE INSTALACIÓN - SISTEMA DE TICKETS DE SOPORTE
 * Ejecuta el script SQL para crear las estructuras del sistema de tickets
 */

require('dotenv').config();
const fs = require('fs');
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
        console.log('============================================');
        console.log('🎫 INSTALANDO SISTEMA DE TICKETS DE SOPORTE');
        console.log('============================================\n');

        console.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        console.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        console.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-support-tickets-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        console.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        console.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        console.log('   ✅ Script ejecutado exitosamente\n');

        console.log('4️⃣  Verificando tablas creadas...');
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
                console.log(`   ✅ Tabla "${table}" creada (${count} registros)`);
                tablesCreated++;
            } else {
                console.log(`   ❌ Tabla "${table}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${tablesCreated}/${tables.length} tablas creadas\n`);

        console.log('5️⃣  Verificando vistas creadas...');
        const views = [
            'v_support_tickets_full',
            'v_support_department_stats',
            'v_support_agent_stats'
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

        console.log('6️⃣  Verificando funciones creadas...');
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
                console.log(`   ✅ Función "${func}" creada`);
                functionsCreated++;
            } else {
                console.log(`   ❌ Función "${func}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${functionsCreated}/${functions.length} funciones creadas\n`);

        console.log('7️⃣  Verificando triggers creados...');
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
                console.log(`   ✅ Trigger "${trigger.name}" creado en "${trigger.table}"`);
                triggersCreated++;
            } else {
                console.log(`   ❌ Trigger "${trigger.name}" NO encontrado en "${trigger.table}"`);
            }
        }
        console.log(`   📊 Total: ${triggersCreated}/${triggers.length} triggers creados\n`);

        console.log('8️⃣  Verificando datos iniciales...');
        const deptCount = await countRecords(client, 'support_departments');
        const catCount = await countRecords(client, 'support_ticket_categories');
        console.log(`   ✅ Departamentos: ${deptCount} registros`);
        console.log(`   ✅ Categorías: ${catCount} registros\n`);

        console.log('============================================');
        console.log('📊 RESUMEN DE INSTALACIÓN');
        console.log('============================================');
        console.log(`✅ Tablas:       ${tablesCreated}/${tables.length}`);
        console.log(`✅ Vistas:       ${viewsCreated}/${views.length}`);
        console.log(`✅ Funciones:    ${functionsCreated}/${functions.length}`);
        console.log(`✅ Triggers:     ${triggersCreated}/${triggers.length}`);
        console.log(`✅ Departamentos: ${deptCount}`);
        console.log(`✅ Categorías:   ${catCount}`);
        console.log('============================================\n');

        const totalExpected = tables.length + views.length + functions.length + triggers.length;
        const totalCreated = tablesCreated + viewsCreated + functionsCreated + triggersCreated;

        if (totalCreated === totalExpected) {
            console.log('🎉 ¡INSTALACIÓN COMPLETADA EXITOSAMENTE!');
            console.log(`   Se instalaron correctamente ${totalCreated}/${totalExpected} estructuras\n`);
            console.log('📋 PRÓXIMOS PASOS:');
            console.log('   1. Revisar departamentos y categorías creados');
            console.log('   2. Configurar agentes de soporte');
            console.log('   3. Personalizar respuestas predefinidas');
            console.log('   4. Ajustar SLA según necesidades institucionales');
            console.log('   5. Acceder al sistema en /soporte.html\n');
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

if (require.main === module) {
    installSupportTicketsTables()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    module.exports = { installSupportTicketsTables };
}
