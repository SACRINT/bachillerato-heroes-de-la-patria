/**
 * 🚀 EJECUTOR DE SCRIPT SQL - INSERCIÓN DE DATOS DE PRUEBA
 * Ejecuta el script SQL insert-test-data.sql en la base de datos Neon
 */

const path = require('path');
const fs = require('fs').promises;

// Cargar .env desde la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { pool } = require('../config/database');

async function executeInsertScript() {
    console.log('🔍 EJECUTOR DE SCRIPT SQL - INSERCIÓN DE DATOS');
    console.log('='.repeat(60));

    try {
        // Leer el archivo SQL simplificado
        const sqlPath = path.join(__dirname, 'insert-simple-data.sql');
        console.log(`\n📄 Leyendo archivo SQL: ${sqlPath}`);

        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        console.log(`✅ Archivo leído correctamente (${sqlContent.length} caracteres)`);

        // Conectar a la base de datos
        console.log('\n🔌 Conectando a la base de datos...');
        const client = await pool.connect();
        console.log('✅ Conexión establecida');

        // Verificar base de datos actual
        const dbCheck = await client.query('SELECT current_database()');
        console.log(`📊 Base de datos: ${dbCheck.rows[0].current_database}`);

        // Ejecutar el script SQL
        console.log('\n🚀 Ejecutando script SQL...');
        console.log('⏳ Esto puede tomar unos segundos...\n');

        await client.query(sqlContent);

        console.log('\n✅ Script SQL ejecutado exitosamente');

        // Verificar inserciones
        console.log('\n📊 VERIFICANDO INSERCIONES:');
        console.log('='.repeat(60));

        const tables = [
            'usuarios',
            'parents',
            'estudiantes',
            'docentes',
            'bolsa_trabajo',
            'egresados',
            'suscriptores',
            'newsletters',
            'newsletter_envios',
            'citas',
            'contactos',
            'solicitudes_documentos',
            'password_recovery_requests',
            'pending_approvals',
            'poll_categories'
        ];

        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
                const count = parseInt(result.rows[0].count);
                console.log(`  ✅ ${table.padEnd(30)} ${count} registros`);
            } catch (error) {
                console.log(`  ⚠️  ${table.padEnd(30)} ERROR: ${error.message}`);
            }
        }

        // Verificar estudiantes específicamente
        console.log('\n🎓 ESTUDIANTES INSERTADOS:');
        console.log('='.repeat(60));
        const estudiantesResult = await client.query(`
            SELECT id, matricula, nombre, apellido_paterno, apellido_materno, semestre
            FROM estudiantes
            ORDER BY id
        `);
        if (estudiantesResult.rows.length > 0) {
            estudiantesResult.rows.forEach(row => {
                const nombreCompleto = `${row.nombre} ${row.apellido_paterno}${row.apellido_materno ? ' ' + row.apellido_materno : ''}`;
                console.log(`  ${row.id}. ${row.matricula} - ${nombreCompleto} (Semestre ${row.semestre})`);
            });
        } else {
            console.log('  ⚠️ No se encontraron estudiantes');
        }

        client.release();
        console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR EJECUTANDO SCRIPT:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Ejecutar
executeInsertScript();
