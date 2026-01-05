/**
 * 🛤️ LEARNING PATH MODULE - Index
 * Semana 18: Personalización del Aprendizaje
 */

const learningPathService = require('./learning_path_service');
const routes = require('./routes');

module.exports = {
    learningPathService,
    routes,

    // Convenience exports
    generatePath: (userId, target) => learningPathService.generateLearningPath(userId, target),
    getProgress: (userId) => learningPathService.getProgressVisualization(userId),
    getCredentials: (userId) => learningPathService.checkMicroCredentials(userId),
    getReview: (userId) => learningPathService.getSpacedRepetitionReview(userId),
    getGraph: () => learningPathService.getFullKnowledgeGraph()
};
