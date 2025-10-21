/**
 * SCRIPT DE INSTALACIÓN - BIBLIOTECA DIGITAL
 * Ejecuta el script SQL para crear las estructuras de la biblioteca digital
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

async function installDigitalLibraryTables() {
    const client = await pool.connect();

    try {
        console.log('============================================');
        console.log('📚 INSTALANDO BIBLIOTECA DIGITAL');
        console.log('============================================\n');

        console.log('1️⃣  Verificando conexión a la base de datos...');
        const connectionTest = await client.query('SELECT NOW()');
        console.log(`   ✅ Conexión exitosa: ${connectionTest.rows[0].now}\n`);

        console.log('2️⃣  Leyendo script SQL...');
        const sqlPath = path.join(__dirname, 'create-digital-library-tables.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        console.log(`   ✅ Script leído: ${sqlScript.length} caracteres\n`);

        console.log('3️⃣  Ejecutando script SQL...');
        await client.query(sqlScript);
        console.log('   ✅ Script ejecutado exitosamente\n');

        console.log('4️⃣  Verificando tablas creadas...');
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
                console.log(`   ✅ Tabla "${table}" creada (${count} registros)`);
                tablesCreated++;
            } else {
                console.log(`   ❌ Tabla "${table}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${tablesCreated}/${tables.length} tablas creadas\n`);

        console.log('5️⃣  Verificando vistas creadas...');
        const views = ['v_library_documents_full', 'v_library_category_stats'];

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
                console.log(`   ✅ Función "${func}" creada`);
                functionsCreated++;
            } else {
                console.log(`   ❌ Función "${func}" NO encontrada`);
            }
        }
        console.log(`   📊 Total: ${functionsCreated}/${functions.length} funciones creadas\n`);

        console.log('7️⃣  Verificando triggers creados...');
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
                console.log(`   ✅ Trigger "${trigger.name}" creado en "${trigger.table}"`);
                triggersCreated++;
            } else {
                console.log(`   ❌ Trigger "${trigger.name}" NO encontrado en "${trigger.table}"`);
            }
        }
        console.log(`   📊 Total: ${triggersCreated}/${triggers.length} triggers creados\n`);

        console.log('============================================');
        console.log('📊 RESUMEN DE INSTALACIÓN');
        console.log('============================================');
        console.log(`✅ Tablas:    ${tablesCreated}/${tables.length}`);
        console.log(`✅ Vistas:    ${viewsCreated}/${views.length}`);
        console.log(`✅ Funciones: ${functionsCreated}/${functions.length}`);
        console.log(`✅ Triggers:  ${triggersCreated}/${triggers.length}`);
        console.log('============================================\n');

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

if (require.main === module) {
    installDigitalLibraryTables()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('❌ ERROR FATAL:', error);
            process.exit(1);
        });
} else {
    module.exports = { installDigitalLibraryTables };
}
