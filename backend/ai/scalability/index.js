/**
 * ⚡ SCALABILITY MODULE - Index
 * Semana 23: Escalabilidad y Performance
 */

const scalabilityService = require('./scalability_service');
const routes = require('./routes');

module.exports = {
    scalabilityService,
    routes,

    // Convenience exports
    evaluateScaling: () => scalabilityService.evaluateAutoScaling(),
    getMetrics: () => scalabilityService.getCurrentMetrics(),
    analyzeModel: (modelId) => scalabilityService.analyzeModelOptimization(modelId),
    getCacheStats: () => scalabilityService.getCacheStats(),
    runLoadTest: (config) => scalabilityService.runLoadTest(config),
    getQueueStatus: () => scalabilityService.getAsyncQueueStatus(),
    getHAStatus: () => scalabilityService.getHAStatus()
};
