/**
 * Script de Verificación - Tablas de Encuestas
 * Verifica que todas las tablas, triggers y funciones existan en PostgreSQL
 */

const { pool } = require('../config/database');

async function verifyPollsTables() {
    const client = await pool.connect();

    try {
        console.log('\n🔍 Verificando Sistema de Encuestas en PostgreSQL...\n');

        // 1. Verificar tablas
        console.log('📊 VERIFICANDO TABLAS:');
        const tablesQuery = `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name LIKE 'poll%'
            ORDER BY table_name
        `;

        const tablesResult = await client.query(tablesQuery);

        const expectedTables = [
            'poll_categories',
            'poll_open_responses',
            'poll_options',
            'poll_votes',
            'polls'
        ];

        expectedTables.forEach(tableName => {
            const found = tablesResult.rows.some(row => row.table_name === tableName);
            console.log(`  ${found ? '✅' : '❌'} ${tableName}`);
        });

        // 2. Verificar funciones
        console.log('\n🔧 VERIFICANDO FUNCIONES:');
        const functionsQuery = `
            SELECT routine_name
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name LIKE '%poll%'
            ORDER BY routine_name
        `;

        const functionsResult = await client.query(functionsQuery);

        const expectedFunctions = [
            'update_poll_vote_counts',
            'calculate_poll_percentages',
            'check_duplicate_vote'
        ];

        expectedFunctions.forEach(funcName => {
            const found = functionsResult.rows.some(row => row.routine_name === funcName);
            console.log(`  ${found ? '✅' : '❌'} ${funcName}`);
        });

        // 3. Verificar triggers
        console.log('\n⚡ VERIFICANDO TRIGGERS:');
        const triggersQuery = `
            SELECT trigger_name
            FROM information_schema.triggers
            WHERE event_object_schema = 'public'
            AND trigger_name LIKE '%poll%'
            ORDER BY trigger_name
        `;

        const triggersResult = await client.query(triggersQuery);

        const expectedTriggers = [
            'poll_vote_insert_trigger',
            'poll_percentages_trigger'
        ];

        expectedTriggers.forEach(triggerName => {
            const found = triggersResult.rows.some(row => row.trigger_name === triggerName);
            console.log(`  ${found ? '✅' : '❌'} ${triggerName}`);
        });

        // 4. Verificar categorías iniciales
        console.log('\n📁 VERIFICANDO CATEGORÍAS INICIALES:');
        const categoriesQuery = 'SELECT COUNT(*) as count FROM poll_categories';
        const categoriesResult = await client.query(categoriesQuery);
        const categoriesCount = parseInt(categoriesResult.rows[0].count);

        console.log(`  ${categoriesCount > 0 ? '✅' : '❌'} Categorías encontradas: ${categoriesCount}`);

        // 5. Verificar vistas
        console.log('\n👁️  VERIFICANDO VISTAS:');
        const viewsQuery = `
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE '%poll%'
            ORDER BY table_name
        `;

        const viewsResult = await client.query(viewsQuery);

        const expectedViews = [
            'active_polls',
            'poll_results_summary'
        ];

        expectedViews.forEach(viewName => {
            const found = viewsResult.rows.some(row => row.table_name === viewName);
            console.log(`  ${found ? '✅' : '❌'} ${viewName}`);
        });

        console.log('\n✅ Verificación completada.\n');

    } catch (error) {
        console.error('\n❌ Error durante la verificación:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar verificación
verifyPollsTables();
