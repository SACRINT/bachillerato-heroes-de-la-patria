/**
 * @file load_feature_store.js
 * @description Carga datos transformados a la tabla feature_store_student_360.
 */

const db = require('../utils/db_connector');

/**
 * Guarda los features en la base de datos usando UPSERT.
 * @param {Array} features Lista de objetos transformados
 */
async function loadFeatures(features) {
    if (!features || features.length === 0) {
        console.log('[LOAD] No features to load.');
        return;
    }

    console.log(`[LOAD] Iniciando carga de ${features.length} registros...`);
    const client = await db.getPool().connect();

    try {
        await client.query('BEGIN');

        // Upsert eficiente (Batch processing sería mejor, pero loop simple por ahora para claridad)
        const queryText = `
            INSERT INTO feature_store_student_360 (
                estudiante_id, 
                promedio_actual, 
                total_faltas_acumuladas, 
                tendencia_calificaciones,
                last_updated
            ) VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (estudiante_id) 
            DO UPDATE SET
                promedio_actual = EXCLUDED.promedio_actual,
                total_faltas_acumuladas = EXCLUDED.total_faltas_acumuladas,
                tendencia_calificaciones = EXCLUDED.tendencia_calificaciones,
                last_updated = NOW();
        `;

        for (const f of features) {
            await client.query(queryText, [
                f.estudiante_id,
                f.promedio_actual,
                f.total_faltas_acumuladas,
                f.tendencia_calificaciones
            ]);
        }

        await client.query('COMMIT');
        console.log('[LOAD] Carga exitosa. Commit realizado.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[LOAD] Error durante la carga transaccional:', err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { loadFeatures };
