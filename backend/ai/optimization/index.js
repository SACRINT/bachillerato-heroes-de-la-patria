/**
 * 🔧 OPTIMIZATION MODULE - Index
 * Semana 20: Optimización y Refinamiento Fase 3
 */

const optimizationService = require('./optimization_service');
const routes = require('./routes');

module.exports = {
    optimizationService,
    routes,

    // Convenience exports
    reviewPerformance: () => optimizationService.reviewGlobalPerformance(),
    analyzeCosts: () => optimizationService.analyzeCosts(),
    runAudit: () => optimizationService.runCodeAudit(),
    getTestCoverage: () => optimizationService.getTestCoverage(),
    validateScalability: () => optimizationService.validateScalability(),
    evaluateDebt: () => optimizationService.evaluateTechnicalDebt(),
    getPhase3Summary: () => optimizationService.generatePhase3Summary()
};
