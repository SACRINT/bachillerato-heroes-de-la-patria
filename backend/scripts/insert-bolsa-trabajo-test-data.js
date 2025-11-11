/**
 * 📊 Script: Insertar datos de prueba para Bolsa de Trabajo
 * Ejecutar: node backend/scripts/insert-bolsa-trabajo-test-data.js
 */

require('dotenv').config();
const { pool } = require('../config/database');

async function insertTestData() {
    const client = await pool.connect();

    try {
        devLogger.log('🔄 Iniciando inserción de datos de prueba...\n');

        // 1. Insertar registros pendientes de confirmación
        devLogger.log('📝 Insertando registros pendientes de confirmación...');

        const pendingRecords = [
            {
                email: 'juan.perez@email.com',
                name: 'Juan Pérez López',
                phone: '5551234567',
                graduationYear: '2023',
                subject: 'Desarrollo de Software',
                message: 'Tengo experiencia en JavaScript y Python. Soy estudiante de ingeniería en sistemas.',
                skills: ['JavaScript', 'Python', 'React', 'PostgreSQL']
            },
            {
                email: 'maria.garcia@email.com',
                name: 'María García Sánchez',
                phone: '5552345678',
                graduationYear: '2022',
                subject: 'Administración',
                message: 'Soy egresada en administración de empresas con 2 años de experiencia en recursos humanos.',
                skills: ['Excel', 'HR', 'RRHH', 'Comunicación']
            },
            {
                email: 'carlos.lopez@email.com',
                name: 'Carlos López Martínez',
                phone: '5553456789',
                graduationYear: '2021',
                subject: 'Diseño Gráfico',
                message: 'Diseñador gráfico con experiencia en Adobe Creative Suite. Tengo portafolio con 15+ proyectos.',
                skills: ['Adobe XD', 'Photoshop', 'Ilustración', 'UX/UI']
            }
        ];

        for (const record of pendingRecords) {
            const token = `test_token_${record.email.split('@')[0]}_${Date.now()}`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

            await client.query(`
                INSERT INTO bolsa_trabajo_pending_confirmation (
                    email,
                    confirmation_token,
                    token_expires_at,
                    form_data,
                    created_at,
                    ip_address,
                    user_agent
                ) VALUES ($1, $2, $3, $4, NOW(), $5, $6)
                ON CONFLICT (email) DO NOTHING
            `, [
                record.email,
                token,
                expiresAt,
                JSON.stringify(record),
                '192.168.1.1',
                'Mozilla/5.0 (Testing)'
            ]);

            devLogger.log(`  ✓ ${record.email}`);
        }

        devLogger.log('✅ Registros pendientes insertados\n');

        // 2. Insertar solicitudes CONFIRMADAS en pendientes_aprobacion
        devLogger.log('📝 Insertando solicitudes confirmadas pendientes de aprobación...');

        const approvalRecords = [
            {
                email: 'ana.rodriguez@email.com',
                name: 'Ana Rodríguez Flores',
                phone: '5554567890',
                graduationYear: '2020',
                subject: 'Marketing Digital',
                message: 'Especialista en marketing digital con expertise en SEO, SEM y social media. 3 años de experiencia.',
                skills: ['SEO', 'SEM', 'Google Ads', 'Social Media']
            },
            {
                email: 'luis.torres@email.com',
                name: 'Luis Torres Ruiz',
                phone: '5555678901',
                graduationYear: '2019',
                subject: 'Desarrollo Web',
                message: 'Full-stack developer con experiencia en MERN stack. He trabajado en startups y empresas medianas.',
                skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'PostgreSQL']
            },
            {
                email: 'elena.morales@email.com',
                name: 'Elena Morales Gómez',
                phone: '5556789012',
                graduationYear: '2023',
                subject: 'Contabilidad',
                message: 'Contadora con conocimientos en impuestos, auditoría y gestión financiera. Software contable: SAP y CFDI.',
                skills: ['Contabilidad', 'SAP', 'CFDI', 'Auditoría', 'Impuestos']
            },
            {
                email: 'diego.sanchez@email.com',
                name: 'Diego Sánchez Vargas',
                phone: '5557890123',
                graduationYear: '2022',
                subject: 'Ingeniería Industrial',
                message: 'Ingeniero industrial con experiencia en optimización de procesos y mejora continua. Certificado en Lean Six Sigma.',
                skills: ['Lean Six Sigma', 'Procesos', 'Optimización', 'Excel', 'Project Management']
            }
        ];

        for (const record of approvalRecords) {
            await client.query(`
                INSERT INTO pendientes_aprobacion (
                    tipo_solicitud,
                    email_usuario,
                    datos_json,
                    estado,
                    email_confirmado,
                    fecha_solicitud,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `, [
                'bolsa_trabajo',
                record.email,
                JSON.stringify(record),
                'pendiente',
                true
            ]);

            devLogger.log(`  ✓ ${record.email}`);
        }

        devLogger.log('✅ Solicitudes confirmadas insertadas\n');

        // 3. Mostrar resumen
        devLogger.log('📊 RESUMEN DE DATOS INSERTADOS:\n');

        const pendingCount = await client.query(`
            SELECT COUNT(*) as count FROM bolsa_trabajo_pending_confirmation
        `);

        const approvalCount = await client.query(`
            SELECT COUNT(*) as count FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'bolsa_trabajo'
        `);

        const approvalPendingCount = await client.query(`
            SELECT COUNT(*) as count FROM pendientes_aprobacion
            WHERE tipo_solicitud = 'bolsa_trabajo' AND estado = 'pendiente' AND email_confirmado = true
        `);

        devLogger.log(`📋 Registros pendientes de confirmación: ${pendingCount.rows[0].count}`);
        devLogger.log(`📋 Solicitudes en aprobación: ${approvalCount.rows[0].count}`);
        devLogger.log(`📋 Solicitudes PENDIENTES de aprobación: ${approvalPendingCount.rows[0].count}\n`);

        devLogger.log('✅ ¡Datos de prueba insertados exitosamente!');
        devLogger.log('\n🚀 Próximos pasos:');
        devLogger.log('   1. Ir al dashboard en http://localhost:3000/admin-dashboard.html');
        devLogger.log('   2. Hacer clic en el tab "Aprobaciones"');
        devLogger.log('   3. Deberías ver las 4 solicitudes pendientes de aprobación');
        devLogger.log('   4. Puedes aprobar/rechazar cada solicitud');
        devLogger.log('   5. Las confirmaciones de email pueden testearse manualmente con el token\n');

        process.exit(0);

    } catch (error) {
        devLogger.error('\n❌ Error al insertar datos:', error.message);
        devLogger.error('\nDetalles:', error);
        process.exit(1);

    } finally {
        client.release();
        await pool.end();
    }
}

insertTestData();
