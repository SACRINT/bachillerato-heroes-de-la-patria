/**
 * 👨‍🏫 SCRIPT DE INSTALACIÓN - PORTAL DE DOCENTES
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 *
 * Este script ejecuta el archivo SQL para crear las tablas del Portal de Docentes
 */

const fs = require('fs').promises;
const devLogger = require('../utils/devLogger');
const path = require('path');
const { pool } = require('../config/database');

async function executeSQLFile() {
    const client = await pool.connect();

    try {
        devLogger.log('🔧 Iniciando instalación del Portal de Docentes...\n');

        // Leer archivo SQL
        const sqlFilePath = path.join(__dirname, 'create-teachers-portal-tables.sql');
        devLogger.log(`📄 Leyendo archivo: ${sqlFilePath}`);

        const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');
        devLogger.log(`✅ Archivo SQL cargado (${sqlContent.length} caracteres)\n`);

        // Ejecutar SQL
        devLogger.log('⚙️  Ejecutando SQL...');
        await client.query('BEGIN');

        try {
            await client.query(sqlContent);
            await client.query('COMMIT');
            devLogger.log('✅ SQL ejecutado exitosamente\n');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        // Verificar tablas creadas
        devLogger.log('🔍 Verificando tablas creadas...\n');

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
                devLogger.log(`  ✅ Tabla '${table}' creada correctamente`);
            } else {
                devLogger.log(`  ❌ Tabla '${table}' NO encontrada`);
            }
        }

        // Verificar vistas creadas
        devLogger.log('\n🔍 Verificando vistas creadas...\n');

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
                devLogger.log(`  ✅ Vista '${view}' creada correctamente`);
            } else {
                devLogger.log(`  ❌ Vista '${view}' NO encontrada`);
            }
        }

        // Verificar índices creados
        devLogger.log('\n🔍 Verificando índices creados...\n');

        const indexResult = await client.query(`
            SELECT COUNT(*) as total
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND (
                tablename LIKE 'teacher_%'
            )
        `);

        devLogger.log(`  ✅ Total de índices creados: ${indexResult.rows[0].total}`);

        // Verificar funciones y triggers
        devLogger.log('\n🔍 Verificando funciones y triggers...\n');

        const functionResult = await client.query(`
            SELECT COUNT(*) as total
            FROM pg_proc
            WHERE proname = 'update_updated_at_column'
            OR proname = 'update_class_student_count'
        `);

        devLogger.log(`  ✅ Funciones creadas: ${functionResult.rows[0].total}`);

        const triggerResult = await client.query(`
            SELECT COUNT(*) as total
            FROM information_schema.triggers
            WHERE trigger_schema = 'public'
            AND event_object_table LIKE 'teacher_%'
        `);

        devLogger.log(`  ✅ Triggers creados: ${triggerResult.rows[0].total}`);

        // Resumen final
        devLogger.log('\n' + '='.repeat(60));
        devLogger.log('🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE');
        devLogger.log('='.repeat(60));
        devLogger.log('\n📊 Resumen:');
        devLogger.log(`  • ${tablesToCheck.length} tablas creadas`);
        devLogger.log(`  • ${viewsToCheck.length} vistas creadas`);
        devLogger.log(`  • ${indexResult.rows[0].total} índices creados`);
        devLogger.log(`  • ${functionResult.rows[0].total} funciones creadas`);
        devLogger.log(`  • ${triggerResult.rows[0].total} triggers creados`);
        devLogger.log('\n✅ El Portal de Docentes está listo para usar\n');

    } catch (error) {
        devLogger.error('\n❌ ERROR durante la instalación:', error.message);
        devLogger.error('\nStack trace:', error.stack);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar script
executeSQLFile();
