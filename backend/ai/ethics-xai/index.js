/**
 * 🔍 ETHICS AND XAI MODULE - Index
 * Semana 29: Auditoría Ética y Explicabilidad (XAI)
 */

const ethicsXAIService = require('./ethics_xai_service');
const routes = require('./routes');

module.exports = {
    ethicsXAIService,
    routes,

    // Convenience exports
    explainPrediction: (modelId, predictionId, method) => ethicsXAIService.explainPrediction(modelId, predictionId, method),
    getFeatureImportance: (modelId) => ethicsXAIService.getFeatureImportance(modelId),
    auditDecision: (decisionId, modelId) => ethicsXAIService.auditDecision(decisionId, modelId),
    getEthicsCommittee: () => ethicsXAIService.getEthicsCommittee(),
    analyzeDatasetBias: (datasetId) => ethicsXAIService.analyzeDatasetBias(datasetId),
    submitAppeal: (appealData) => ethicsXAIService.submitAppeal(appealData),
    getModelCard: (modelId) => ethicsXAIService.getModelCard(modelId),
    calculateFairness: (modelId) => ethicsXAIService.calculateFairnessMetrics(modelId),
    getEthicalPrinciples: () => ethicsXAIService.getEthicalPrinciples(),
    generateTransparencyReport: () => ethicsXAIService.generateTransparencyReport()
};
