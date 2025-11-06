const { pool } = require('../config/database');

const fixConstraint = async () => {
    const client = await pool.connect();
    try {
        console.log('Iniciando corrección del CHECK constraint `tipo_solicitud_check`...');
        await client.query('BEGIN');

        // 1. Eliminar el constraint antiguo (si existe)
        console.log('  -> Intentando eliminar constraint antiguo...');
        await client.query(`
            DO $$BEGIN
                ALTER TABLE pendientes_aprobacion DROP CONSTRAINT IF EXISTS tipo_solicitud_check;
            END $$;
        `);

        // 2. Añadir el nuevo constraint con 'egresados' incluido y otros valores comunes
        console.log('  -> Añadiendo nuevo constraint con valor "egresados" y otros valores comunes...');
        await client.query(`
            ALTER TABLE pendientes_aprobacion
            ADD CONSTRAINT tipo_solicitud_check
            CHECK (tipo_solicitud IN ('bolsa_trabajo', 'egresados', 'contacto', 'inscripcion', 'quejas', 'suscripcion', 'cita'));
        `);

        await client.query('COMMIT');
        console.log('✅ ¡CHECK constraint `tipo_solicitud_check` corregido exitosamente!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante la corrección del constraint:', error.message);
    } finally {
        client.release();
        pool.end();
    }
};

fixConstraint();
