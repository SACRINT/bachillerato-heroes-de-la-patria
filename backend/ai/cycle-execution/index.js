/**
 * 🎓 CYCLE EXECUTION MODULE - Index
 * Semana 37: Ejecución de Cierre de Ciclo Escolar
 */

const cycleExecutionService = require('./cycle_execution_service');
const routes = require('./routes');

module.exports = {
    cycleExecutionService,
    routes,

    // Convenience exports
    activateExamSupport: () => cycleExecutionService.activateExamSupport(),
    generateReports: () => cycleExecutionService.generateMassReports(),
    processDocuments: () => cycleExecutionService.processOfficialDocuments(),
    runPredictions: () => cycleExecutionService.runFinalPredictiveAnalysis(),
    executePipelines: () => cycleExecutionService.executeClosurePipelines(),
    executePromotion: () => cycleExecutionService.executeAutomaticPromotion(),
    generateInsights: () => cycleExecutionService.generateAnnualInsights(),
    executeColdBackup: () => cycleExecutionService.executeColdStorageBackup(),
    cleanup: () => cycleExecutionService.cleanupTemporaryData(),
    publishResults: () => cycleExecutionService.publishResults(),
    getClosureReport: () => cycleExecutionService.generateClosureReport()
};
