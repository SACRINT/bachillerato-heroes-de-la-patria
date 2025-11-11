const { pool } = require('../config/database');

const fixConstraint = async () => {
    const client = await pool.connect();
    try {
        devLogger.log('🚀 Iniciando corrección del CHECK constraint `tipo_solicitud_check`...');
        await client.query('BEGIN');

        // 1. Eliminar el constraint antiguo (si existe)
        devLogger.log('  -> 1/3: Eliminando constraint antiguo `tipo_solicitud_check` (si existe)...');
        await client.query(`
            DO $$ BEGIN
                ALTER TABLE pendientes_aprobacion DROP CONSTRAINT IF EXISTS tipo_solicitud_check;
            END $$;
        `);
        devLogger.log('  -> ✅ Constraint antiguo eliminado o no existente.');

        // 2. Añadir el nuevo constraint con 'egresados' incluido
        devLogger.log('  -> 2/3: Añadiendo nuevo constraint con valor "egresados"...');
        await client.query(`
            ALTER TABLE pendientes_aprobacion 
            ADD CONSTRAINT tipo_solicitud_check 
            CHECK (tipo_solicitud IN ('bolsa_trabajo', 'egresados', 'contacto', 'inscripcion', 'quejas', 'suscripcion', 'cita'));
        `);
        devLogger.log('  -> ✅ Nuevo constraint `tipo_solicitud_check` creado exitosamente.');

        // 3. Confirmar transacción
        await client.query('COMMIT');
        devLogger.log('  -> 3/3: Transacción confirmada.');
        devLogger.log('✅ ¡Base de datos corregida! La tabla `pendientes_aprobacion` ahora acepta solicitudes de tipo `egresados`.');

    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error('❌ Error durante la corrección del constraint:', error.message);
        devLogger.error('   La transacción ha sido revertida. La base de datos no ha sido modificada.');
    } finally {
        client.release();
        pool.end();
    }
};

fixConstraint();