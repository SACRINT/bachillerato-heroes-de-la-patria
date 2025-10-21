/**
 * 👨‍🏫 SCRIPT DE INSTALACIÓN - PORTAL DE DOCENTES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Este script ejecuta el archivo SQL para crear las tablas del Portal de Docentes
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/database');

async function executeSQLFile() {
    const client = await pool.connect();

    try {
        console.log('🔧 Iniciando instalación del Portal de Docentes...\n');

        // Leer archivo SQL
        const sqlFilePath = path.join(__dirname, 'create-teachers-portal-tables.sql');
        console.log(`📄 Leyendo archivo: ${sqlFilePath}`);

        const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');
        console.log(`✅ Archivo SQL cargado (${sqlContent.length} caracteres)\n`);

        // Ejecutar SQL
        console.log('⚙️  Ejecutando SQL...');
        await client.query('BEGIN');

        try {
            await client.query(sqlContent);
            await client.query('COMMIT');
            console.log('✅ SQL ejecutado exitosamente\n');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        // Verificar tablas creadas
        console.log('🔍 Verificando tablas creadas...\n');

        const tablesToCheck = [
            'teacher_classes',
            'teacher_class_students',
            'teacher_resources',
            'teacher_assignments',
            'teacher_assignment_submissions',
            'teacher_notifications',
            'teacher_messages',
            'teacher_attendance_sessions'
        ];

        for (const table of tablesToCheck) {
            const result = await client.query(`
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = $1
            `, [table]);

            if (result.rows[0].count > 0) {
                console.log(`  ✅ Tabla '${table}' creada correctamente`);
            } else {
                console.log(`  ❌ Tabla '${table}' NO encontrada`);
            }
        }

        // Verificar vistas creadas
        console.log('\n🔍 Verificando vistas creadas...\n');

        const viewsToCheck = [
            'v_teacher_classes_summary',
            'v_pending_assignment_reviews',
            'v_teacher_unread_messages'
        ];

        for (const view of viewsToCheck) {
            const result = await client.query(`
                SELECT COUNT(*) as count
                FROM information_schema.views
                WHERE table_schema = 'public'
                AND table_name = $1
            `, [view]);

            if (result.rows[0].count > 0) {
                console.log(`  ✅ Vista '${view}' creada correctamente`);
            } else {
                console.log(`  ❌ Vista '${view}' NO encontrada`);
            }
        }

        // Verificar índices creados
        console.log('\n🔍 Verificando índices creados...\n');

        const indexResult = await client.query(`
            SELECT COUNT(*) as total
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (
                tablename LIKE 'teacher_%'
            )
        `);

        console.log(`  ✅ Total de índices creados: ${indexResult.rows[0].total}`);

        // Verificar funciones y triggers
        console.log('\n🔍 Verificando funciones y triggers...\n');

        const functionResult = await client.query(`
            SELECT COUNT(*) as total
            FROM pg_proc
            WHERE proname = 'update_updated_at_column'
            OR proname = 'update_class_student_count'
        `);

        console.log(`  ✅ Funciones creadas: ${functionResult.rows[0].total}`);

        const triggerResult = await client.query(`
            SELECT COUNT(*) as total
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table LIKE 'teacher_%'
        `);

        console.log(`  ✅ Triggers creados: ${triggerResult.rows[0].total}`);

        // Resumen final
        console.log('\n' + '='.repeat(60));
        console.log('🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE');
        console.log('='.repeat(60));
        console.log('\n📊 Resumen:');
        console.log(`  • ${tablesToCheck.length} tablas creadas`);
        console.log(`  • ${viewsToCheck.length} vistas creadas`);
        console.log(`  • ${indexResult.rows[0].total} índices creados`);
        console.log(`  • ${functionResult.rows[0].total} funciones creadas`);
        console.log(`  • ${triggerResult.rows[0].total} triggers creados`);
        console.log('\n✅ El Portal de Docentes está listo para usar\n');

    } catch (error) {
        console.error('\n❌ ERROR durante la instalación:', error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar script
executeSQLFile();
