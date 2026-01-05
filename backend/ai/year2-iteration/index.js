/**
 * 🔄 YEAR 2 ITERATION MODULE - Index
 * Semana 42: Iteración sobre Modelos Existentes
 */

const year2IterationService = require('./year2_iteration_service');
const routes = require('./routes');

module.exports = {
    year2IterationService,
    routes,

    // Convenience exports
    createVersion: (model, version, config) => year2IterationService.createModelVersion(model, version, config),
    getVersionHistory: (model) => year2IterationService.getModelVersionHistory(model),
    createExperiment: (config) => year2IterationService.createABExperiment(config),
    runHPO: (model, space) => year2IterationService.runHyperparameterSearch(model, space),
    getFeatureImportance: (model) => year2IterationService.analyzeFeatureImportance(model),
    configureCL: (model, config) => year2IterationService.configureContinuousLearning(model, config),
    createEnsemble: (config) => year2IterationService.createEnsemble(config),
    getDriftReport: (model) => year2IterationService.getDriftReport(model),
    runBenchmark: (model) => year2IterationService.runBenchmark(model),
    getSummary: () => year2IterationService.getIterationSummary()
};
