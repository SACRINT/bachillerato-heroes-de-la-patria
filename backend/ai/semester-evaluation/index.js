/**
 * 📊 SEMESTER EVALUATION MODULE - Index
 * Semana 28: Evaluación Semestral y Re-calibración
 */

const semesterEvaluationService = require('./semester_evaluation_service');
const routes = require('./routes');

module.exports = {
    semesterEvaluationService,
    routes,

    // Convenience exports
    analyzeKPIs: () => semesterEvaluationService.analyzeKPIs(),
    calculateROI: () => semesterEvaluationService.calculateROI(),
    getSatisfaction: () => semesterEvaluationService.getSatisfactionSurveyResults(),
    evaluateTeam: () => semesterEvaluationService.evaluateTeamPerformance(),
    reviewTechnology: () => semesterEvaluationService.getTechnologyReview(),
    analyzeFeatures: () => semesterEvaluationService.analyzeFeatureUsage(),
    generatePlan: () => semesterEvaluationService.generateNextSemesterPlan(),
    runMaintenance: () => semesterEvaluationService.performDatabaseMaintenance(),
    getLessons: () => semesterEvaluationService.documentLessonsLearned(),
    getSuccessStory: () => semesterEvaluationService.generateSuccessStory(),
    getExecutiveReport: () => semesterEvaluationService.generateExecutiveReport()
};
