/**
 * 🔄 MLOPS MODULE - Index
 * Semana 11: MLOps Básico y Automatización
 */

const mlopsService = require('./mlops_service');
const routes = require('./routes');

module.exports = {
    mlopsService,
    routes,

    // Convenience exports
    logExperiment: (data) => mlopsService.logExperiment(data),
    detectDrift: (model, metrics) => mlopsService.detectDrift(model, metrics),
    runAudit: () => mlopsService.runFullAudit(),
    getVersion: () => mlopsService.getPromptVersion()
};
