/**
 * 🔒 CODE FREEZE MODULE - Index
 * Semana 36: Congelamiento de Cambios y Estabilidad (FINAL)
 */

const codeFreezeService = require('./code_freeze_service');
const routes = require('./routes');

module.exports = {
    codeFreezeService,
    routes,

    // Convenience exports
    activateFreeze: (config) => codeFreezeService.activateCodeFreeze(config),
    getFreezeStatus: () => codeFreezeService.getCodeFreezeStatus(),
    getBugs: () => codeFreezeService.getBugStatus(),
    getMonitoring: () => codeFreezeService.getIntensiveMonitoring(),
    validateConsistency: () => codeFreezeService.validateDataConsistency(),
    preparePeakLoad: () => codeFreezeService.preparePeakLoad(),
    getAlerts: () => codeFreezeService.reviewAlertThresholds(),
    securityAudit: () => codeFreezeService.performFinalSecurityAudit(),
    getUptime: () => codeFreezeService.getUptimeStatus(),
    getContingency: () => codeFreezeService.getContingencyPlan(),
    getFeatureFlags: () => codeFreezeService.getFeatureFlags(),
    getStabilityReport: () => codeFreezeService.generateStabilityReport()
};
