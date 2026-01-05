/**
 * 🏁 YEAR 2 COMPLETION MODULE - Index
 * Semana 44: Preparacion para Cierre de Año 2
 */

const year2CompletionService = require('./year2_completion_service');
const routes = require('./routes');

module.exports = {
    year2CompletionService,
    routes,

    // Convenience exports
    prepareCycleClosing: () => year2CompletionService.prepareCycleClosing(),
    getClosingStatus: () => year2CompletionService.getClosingStatus(),
    getDocumentationStatus: () => year2CompletionService.getDocumentationStatus(),
    runFinalTests: () => year2CompletionService.runFinalTestRound(),
    getTestReport: () => year2CompletionService.getTestReport(),
    prepareTraining: () => year2CompletionService.prepareTrainingHandover(),
    compileMetrics: () => year2CompletionService.compileSuccessMetrics(),
    draftYear3Roadmap: () => year2CompletionService.draftYear3Roadmap(),
    prepareAudit: () => year2CompletionService.prepareAudit(),
    prepareArchive: () => year2CompletionService.prepareArchive(),
    getSummary: () => year2CompletionService.getCompletionSummary()
};
