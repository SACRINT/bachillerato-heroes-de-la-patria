/**
 * 📚 CONTENT RECOMMENDATION MODULE - Index
 * Semana 15: Sistema de Recomendación de Contenidos
 */

const recommendationService = require('./recommendation_service');
const routes = require('./routes');

module.exports = {
    recommendationService,
    routes,

    // Convenience exports
    getPersonalized: (userId) => recommendationService.getPersonalizedRecommendations(userId),
    getNextSteps: (userId) => recommendationService.getNextStepsRecommendations(userId),
    getReinforcement: (userId) => recommendationService.getReinforcementRecommendations(userId),
    recordFeedback: (userId, resourceId, feedback) => recommendationService.recordFeedback(userId, resourceId, feedback)
};
