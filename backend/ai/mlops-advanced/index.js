/**
 * 🚀 ADVANCED MLOPS MODULE - Index
 * Semana 21: Infraestructura de MLOps Madura
 */

const mlopsAdvancedService = require('./mlops_advanced_service');
const routes = require('./routes');

module.exports = {
    mlopsAdvancedService,
    routes,

    // Convenience exports - Feature Store
    getFeatures: (entity, id, names) => mlopsAdvancedService.getFeatures(entity, id, names),

    // Convenience exports - Model Registry
    listModels: (stage) => mlopsAdvancedService.listModels(stage),
    registerModel: (def) => mlopsAdvancedService.registerModel(def),
    promoteModel: (id, stage, approvers) => mlopsAdvancedService.promoteModel(id, stage, approvers),

    // Convenience exports - Drift & Canary
    checkDrift: (modelId) => mlopsAdvancedService.checkDataDrift(modelId),
    createCanary: (modelId, version) => mlopsAdvancedService.createCanaryDeployment(modelId, version),

    // Convenience exports - Testing
    runRegressionTests: (modelId) => mlopsAdvancedService.runRegressionTests(modelId)
};
