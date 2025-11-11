/**
 * SCRIPT DE INSTALACIÓN - BIBLIOTECA DIGITAL
 * Ejecuta el script SQL para crear las estructuras de la biblioteca digital
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

async function installDigitalLibraryTables() {
    const client = await pool.connect();

    try {
        devLogger.log('============================================');
        devLogger.log('📚 INSTALANDO BIBLIOTECA DIGITAL');
        devLogger.log('============================================\n');

        devLogger.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        devLogger.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        devLogger.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-digital-library-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        devLogger.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        devLogger.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        devLogger.log('   ✅ Script ejecutado exitosamente\n');

        devLogger.log('4️⃣  Verificando tablas creadas...');
        const tables = [
            'library_categories',
            'library_documents',
            'library_document_versions',
            'library_tags',
            'library_document_tags',
            'library_document_permissions',
            'library_favorites',
            'library_download_history',
            'library_document_comments',
            'library_document_ratings'
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
        const views = ['v_library_documents_full', 'v_library_category_stats'];

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
            'update_library_updated_at',
            'update_category_document_count',
            'update_document_avg_rating',
            'update_document_favorites_count',
            'update_tag_usage_count'
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
            { name: 'trigger_documents_updated_at', table: 'library_documents' },
            { name: 'trigger_categories_updated_at', table: 'library_categories' },
            { name: 'trigger_update_category_count', table: 'library_documents' },
            { name: 'trigger_update_avg_rating', table: 'library_document_ratings' },
            { name: 'trigger_update_favorites_count', table: 'library_favorites' },
            { name: 'trigger_update_tag_usage', table: 'library_document_tags' }
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

        devLogger.log('============================================');
        devLogger.log('📊 RESUMEN DE INSTALACIÓN');
        devLogger.log('============================================');
        devLogger.log(`✅ Tablas:    ${tablesCreated}/${tables.length}`);
        devLogger.log(`✅ Vistas:    ${viewsCreated}/${views.length}`);
        devLogger.log(`✅ Funciones: ${functionsCreated}/${functions.length}`);
        devLogger.log(`✅ Triggers:  ${triggersCreated}/${triggers.length}`);
        devLogger.log('============================================\n');

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

if (require.main === module) {
    installDigitalLibraryTables()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            devLogger.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    module.exports = { installDigitalLibraryTables };
}
