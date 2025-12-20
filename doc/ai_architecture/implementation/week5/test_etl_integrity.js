/**
 * @file validate_etl_schema.js
 * @description Script de validación de integridad para los outputs del ETL (Data Quality).
 */

const { transformStudentData } = require('../../backend/ai/etl/transform_features');

// Mock data para pruebas
const testCases = [
    { estudiante_id: 1, promedio_general: 9.5, total_faltas: 0, materias_reprobadas: 0 },
    { estudiante_id: 2, promedio_general: 5.0, total_faltas: 10, materias_reprobadas: 4 }, // High risk
    { estudiante_id: 3, promedio_general: 11.0, total_faltas: 0, materias_reprobadas: 0 }, // Invalid input
    { estudiante_id: 4, promedio_general: 7.0, total_faltas: -5, materias_reprobadas: 0 }, // Impossible Input (faltas negativas)
];

console.log('🧪 Iniciando Tests de Integridad ETL...');

testCases.forEach(tc => {
    console.log(`Prueba Estudiante [${tc.estudiante_id}]: Prom ${tc.promedio_general}, Faltas ${tc.total_faltas}`);
    const result = transformStudentData(tc);

    if (tc.promedio_general > 10) {
        if (result === null) console.log('✅ PASSED: Invalid grade rejected.');
        else console.error('❌ FAILED: Invalid grade accepted!');
    } else {
        if (result) {
            console.log(`   -> Normalized: ${result.metadatos_ia.norm_promedio}`);
            console.log(`   -> Risk Label: ${result.metadatos_ia.heuristic_risk_level}`);

            // Assertion Logic
            if (tc.promedio_general < 6 && result.metadatos_ia.heuristic_risk_level !== 2) {
                console.error('❌ FAILED: Logic Error in Risk Calculation');
            } else {
                console.log('✅ PASSED: Transformation logical.');
            }
        }
    }
});
