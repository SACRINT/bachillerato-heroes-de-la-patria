/**
 * @file inference_service.js
 * @description Servicio de Inferencia. Abstrae la lógica de llamar al modelo (Reglas o ML).
 */

const rulesEngine = require('./risk_rules_engine');
// const xgboostModel = require('./xgboost_loader'); // Futuro: V1

const db = require('../../utils/db_connector');

/**
 * Obtiene la predicción de riesgo para un estudiante.
 * @param {number} studentId ID del estudiante
 */
async function getStudentRiskPrediction(studentId) {
    try {
        // 1. Fetch Features from Feature Store
        const result = await db.query(
            `SELECT * FROM feature_store_student_360 WHERE estudiante_id = $1`,
            [studentId]
        );

        if (result.rows.length === 0) {
            return { error: 'Estudiante no encontrado en Feature Store. Ejecute ETL primero.' };
        }

        const features = result.rows[0];

        // 2. Pre-processing (Parsear JSONB si es necesario)
        // En Postgres node driver, los campos jsonb ya vienen como objetos.
        // Asegurar tipos numéricos
        const processedFeatures = {
            norm_promedio: parseFloat(features.promedio_actual) / 10.0, // Recalcular si no está en DB
            norm_faltas: Math.log(1 + parseInt(features.total_faltas_acumuladas)),
            metadatos_ia: {
                heuristic_risk_level: features.promedio_actual < 6 ? 2 : 0 // Simplificado
            }
        };

        // 3. Predict (Router de Modelos: A/B Testing podría ir aquí)
        // Actualmente solo usamos V0 (Reglas)
        const prediction = rulesEngine.predict(processedFeatures);

        // 4. Log Prediction (Para monitoreo y futuro entrenamiento)
        // await logPrediction(studentId, prediction); -- TODO

        return {
            student_id: studentId,
            ...prediction,
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('[INFERENCE] Error:', error);
        throw new Error('Error calculando riesgo de deserción.');
    }
}

module.exports = { getStudentRiskPrediction };
