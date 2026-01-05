/**
 * 🧪 AI QA TESTING MODULE - Index
 * Semana 22: Testing y QA de IA
 */

const qaTestingService = require('./qa_testing_service');
const routes = require('./routes');

module.exports = {
    qaTestingService,
    routes,

    // Convenience exports
    runProbabilisticTests: (modelId) => qaTestingService.runProbabilisticTests(modelId),
    runGoldenDatasetTests: (modelId) => qaTestingService.runGoldenDatasetTests(modelId),
    runBehavioralTests: (modelId, type) => qaTestingService.runBehavioralTests(modelId, type),
    runBiasTests: (modelId) => qaTestingService.runBiasTests(modelId),
    runRobustnessTests: (modelId) => qaTestingService.runRobustnessTests(modelId),
    calculateFairness: (modelId) => qaTestingService.calculateFairnessMetrics(modelId),
    runStressTests: (modelId, config) => qaTestingService.runStressTests(modelId, config),
    runE2ETests: () => qaTestingService.runE2ETests(),
    evaluateQualityGates: (modelId, metrics) => qaTestingService.evaluateQualityGates(modelId, metrics),
    generateReport: (modelId) => qaTestingService.generateTestReport(modelId)
};
