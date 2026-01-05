/**
 * 📅 CYCLE CLOSURE MODULE - Index
 * Semana 33: Preparación para Cierre de Ciclo
 */

const cycleClosureService = require('./cycle_closure_service');
const routes = require('./routes');

module.exports = {
    cycleClosureService,
    routes,

    // Convenience exports
    getMetrics: () => cycleClosureService.defineFinalMetrics(),
    validateCertificates: () => cycleClosureService.validateCertificateDataIntegrity(),
    prepareAmnesia: () => cycleClosureService.prepareSelectiveAmnesia(),
    planGraduates: () => cycleClosureService.planGraduateMigration(),
    archiveModels: () => cycleClosureService.archiveCycleModels(),
    getImpactReport: () => cycleClosureService.generateAnnualImpactReport(),
    auditAccess: () => cycleClosureService.auditAndRevokeAccess(),
    validateBackups: () => cycleClosureService.validateEndOfYearBackups(),
    generateYearbook: () => cycleClosureService.generateAIYearbook(),
    planVacation: () => cycleClosureService.planVacationServiceShutdown(),
    getChecklist: () => cycleClosureService.getClosureChecklist()
};
