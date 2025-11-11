const { pool } = require('../config/database');

const addConstraint = async () => {
    const client = await pool.connect();
    const constraintName = 'egresados_pending_email_unique';
    const tableName = 'egresados_pending_confirmation';

    try {
        devLogger.log(`🚀 Iniciando adición de constraint UNIQUE a la tabla ${tableName}...`);
        await client.query('BEGIN');

        // Verificar si el constraint ya existe
        const checkConstraintQuery = `
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = $1 AND constraint_name = $2;
        `;
        const { rows } = await client.query(checkConstraintQuery, [tableName, constraintName]);

        if (rows.length > 0) {
            devLogger.log(`✅ El constraint '${constraintName}' ya existe en la tabla '${tableName}'. No se necesitan cambios.`);
        } else {
            devLogger.log(`  -> Añadiendo constraint UNIQUE (${constraintName}) a la columna 'email_usuario'...`);
            const addConstraintQuery = `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraintName} UNIQUE (email_usuario);`;
            await client.query(addConstraintQuery);
            devLogger.log(`  -> ✅ Constraint añadido exitosamente.`);
        }

        await client.query('COMMIT');
        devLogger.log('✅ ¡Base de datos actualizada!');

    } catch (error) {
        await client.query('ROLLBACK');
        devLogger.error(`❌ Error durante la adición del constraint:`, error.message);
        devLogger.error('   La transacción ha sido revertida.');
    } finally {
        client.release();
        pool.end();
    }
};

addConstraint();
