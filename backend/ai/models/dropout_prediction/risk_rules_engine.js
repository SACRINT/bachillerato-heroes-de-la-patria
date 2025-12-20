/**
 * @file risk_rules_engine.js
 * @description Modelo V0: Motor de reglas heurísticas para detección de riesgo.
 * Se usa cuando no hay suficientes datos históricos para un modelo de ML entrenado.
 */

class RiskRulesEngine {
    constructor() {
        // Pesos configurables por expertos (Pedagogos)
        this.weights = {
            promedio: 0.45,
            faltas: 0.35,
            reprobadas: 0.20
        };

        // Umbrales de riesgo
        this.thresholds = {
            CRITICAL: 0.8,
            HIGH: 0.6,
            MEDIUM: 0.4
        };
    }

    /**
     * Calcula el score de riesgo basado en features.
     * @param {Object} features Datos del estudiante (normalizados 0-1)
     * @returns {Object} Score y Factores de riesgo
     */
    predict(features) {
        // 1. Normalización inversa o directa según el sentido del riesgo
        // Promedio bajo = Mas riesgo. (1.0 - norm_promedio)
        const riskPromedio = (1.0 - features.norm_promedio);

        // Faltas altas = Mas riesgo. (norm_faltas ya crece con las faltas)
        // Asumiendo norm_faltas viene escalado 0-1 aprox. Si no, clarear.
        const riskFaltas = Math.min(features.norm_faltas, 1.0);

        // Reprobadas. 3 o más es critico.
        const riskReprobadas = Math.min(features.metadatos_ia.heuristic_risk_level / 2, 1.0);

        // 2. Cálculo Ponderado
        const totalScore = (
            (riskPromedio * this.weights.promedio) +
            (riskFaltas * this.weights.faltas) +
            (riskReprobadas * this.weights.reprobadas)
        );

        // 3. Clasificación
        let level = 'LOW';
        if (totalScore >= this.thresholds.CRITICAL) level = 'CRITICAL';
        else if (totalScore >= this.thresholds.HIGH) level = 'HIGH';
        else if (totalScore >= this.thresholds.MEDIUM) level = 'MEDIUM';

        // 4. Explicabilidad (XAI Lite)
        const factors = [];
        if (riskPromedio > 0.6) factors.push('Bajo Rendimiento Académico');
        if (riskFaltas > 0.6) factors.push('Ausentismo Crónico');
        if (riskReprobadas > 0.5) factors.push('Materias Reprobadas');

        return {
            probability: parseFloat(totalScore.toFixed(4)),
            risk_level: level,
            risk_factors: factors,
            model_version: 'v0.1_heuristic'
        };
    }
}

module.exports = new RiskRulesEngine();
