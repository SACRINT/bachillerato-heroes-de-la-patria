/**
 * @file transform_features.js
 * @description Lógica de limpieza, normalización y cálculo de features para el modelo de riesgo.
 */

/**
 * Calcula el Feature Vector normalizado para un estudiante.
 * @param {Object} rawData Datos crudos de extract_grades.js
 * @returns {Object} Feature object listo para insertar
 */
function transformStudentData(rawData) {
    // 1. Quality Gate: Validar rangos imposibles
    if (rawData.promedio_general < 0 || rawData.promedio_general > 10) {
        console.warn(`[TRANSFORM] Skip: Promedio inválido para estudiante ${rawData.estudiante_id}: ${rawData.promedio_general}`);
        return null;
    }

    // 2. Feature Engineering: Tendencia (Mock por ahora, requeriría histórico)
    // En fase 1, asumimos tendencia neutral (0) si no hay histórico.
    const tendencia = 0.0;

    // 3. Feature Engineering: Risk Score Heurístico (Base para etiqueta inicial)
    // Regla simple: Si promedio < 6 O reprobadas > 2 -> Alto Riesgo
    let riskLabel = 0; // 0 = Bajo, 1 = Medio, 2 = Alto
    if (rawData.promedio_general < 6.0 || rawData.materias_reprobadas >= 3) {
        riskLabel = 2;
    } else if (rawData.promedio_general < 7.5 || rawData.materias_reprobadas >= 1) {
        riskLabel = 1;
    }

    // 4. Normalización (Scaling) - Preparación para ML (0 a 1)
    // Promedio (0-10 -> 0-1)
    const norm_promedio = parseFloat(rawData.promedio_general) / 10.0;

    // Faltas (Log scaling para reducir impacto de outliers)
    // log(1 + x)
    const norm_faltas = Math.log(1 + parseInt(rawData.total_faltas));

    return {
        estudiante_id: rawData.estudiante_id,
        promedio_actual: parseFloat(rawData.promedio_general).toFixed(2),
        total_faltas_acumuladas: parseInt(rawData.total_faltas),
        tendencia_calificaciones: tendencia,
        // Campos adicionales calculados
        metadatos_ia: {
            norm_promedio: norm_promedio.toFixed(4),
            norm_faltas: norm_faltas.toFixed(4),
            heuristic_risk_level: riskLabel
        }
    };
}

/**
 * Procesa un lote de registros
 */
function processBatch(batch) {
    const validFeatures = [];
    let skipped = 0;

    for (const record of batch) {
        const feature = transformStudentData(record);
        if (feature) {
            validFeatures.push(feature);
        } else {
            skipped++;
        }
    }

    console.log(`[TRANSFORM] Batch procesado. Ok: ${validFeatures.length}, Skipped: ${skipped}`);
    return validFeatures;
}

module.exports = { processBatch, transformStudentData };
