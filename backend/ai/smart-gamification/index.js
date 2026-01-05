/**
 * 🎮 SMART GAMIFICATION MODULE - Index
 * Semana 26: Gamificación Inteligente
 */

const smartGamificationService = require('./smart_gamification_service');
const routes = require('./routes');

module.exports = {
    smartGamificationService,
    routes,

    // Convenience exports
    generateAchievement: (studentId, behavior) => smartGamificationService.generateDynamicAchievement(studentId, behavior),
    getMissions: (studentId) => smartGamificationService.generatePersonalizedMissions(studentId),
    getNarrative: (studentId, event) => smartGamificationService.generateNarrativeUpdate(studentId, event),
    detectCheat: (studentId, activity) => smartGamificationService.detectCheatBehavior(studentId, activity),
    getAvatar: (studentId) => smartGamificationService.getAvatarState(studentId),
    getFeedback: (studentId, event) => smartGamificationService.generateRealTimeFeedback(studentId, event),
    adjustDifficulty: (studentId) => smartGamificationService.adjustDifficulty(studentId),
    suggestTeam: (studentId) => smartGamificationService.suggestTeamFormation(studentId)
};
