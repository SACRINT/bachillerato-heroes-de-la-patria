/**
 * 🚨 DROPOUT PREDICTION MODULE - Index
 * Semana 13: Predicción de Deserción Escolar
 */

const dropoutService = require('./dropout_service');
const routes = require('./routes');

module.exports = {
    dropoutService,
    routes,

    // Convenience exports
    predict: (studentId) => dropoutService.predictDropoutRisk(studentId),
    explain: (studentId) => dropoutService.explainPrediction(studentId),
    interventions: (studentId) => dropoutService.suggestInterventions(studentId),
    performEDA: () => dropoutService.performEDA()
};
