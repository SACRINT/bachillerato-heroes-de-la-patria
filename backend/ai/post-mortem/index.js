/**
 * 📊 POST-MORTEM MODULE - Index
 * Semana 38: Análisis Post-Mortem del Año
 */

const postMortemService = require('./post_mortem_service');
const routes = require('./routes');

module.exports = {
    postMortemService,
    routes,

    // Convenience exports
    reviewIncidents: () => postMortemService.reviewAnnualIncidents(),
    analyzeDowntime: () => postMortemService.analyzeDowntime(),
    evaluateModels: () => postMortemService.evaluateModelAccuracy(),
    calculateSavings: () => postMortemService.calculateAutomationSavings(),
    reviewArchitecture: () => postMortemService.identifyArchitectureErrors(),
    analyzeSecurity: () => postMortemService.analyzeSecurityPosture(),
    evaluateVendors: () => postMortemService.evaluateVendors(),
    reviewSLAs: () => postMortemService.reviewSLACompliance(),
    getLessonsLearned: () => postMortemService.documentLessonsLearned(),
    getAnnualReport: () => postMortemService.generateAnnualTechnicalReport()
};
