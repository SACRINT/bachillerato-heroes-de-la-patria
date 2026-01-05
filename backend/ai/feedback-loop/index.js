/**
 * 💬 FEEDBACK LOOP MODULE - Index
 * Semana 34: Feedback Loop Docente/Administrativo
 */

const feedbackLoopService = require('./feedback_loop_service');
const routes = require('./routes');

module.exports = {
    feedbackLoopService,
    routes,

    // Convenience exports
    scheduleRoundTable: (config) => feedbackLoopService.scheduleRoundTable(config),
    getStories: () => feedbackLoopService.collectSuccessStories(),
    analyzeSuggestions: () => feedbackLoopService.analyzeSuggestions(),
    getTrainingNeeds: () => feedbackLoopService.identifyTrainingNeeds(),
    validateReports: () => feedbackLoopService.validateReportUtility(),
    coDesign: (topic) => feedbackLoopService.facilitateCoDesign(topic),
    getLearningCurve: () => feedbackLoopService.analyzeLearningCurve(),
    getFrictions: () => feedbackLoopService.identifyWorkflowFrictions(),
    getQoLFeatures: () => feedbackLoopService.prioritizeQoLFeatures(),
    getFullReport: () => feedbackLoopService.generateFeedbackReport()
};
