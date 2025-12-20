/**
 * 🎓 AI TUTOR MODULE - Index
 * Semana 10: Sistema de Tutoría IA (Fase Alpha)
 * 
 * Exporta todos los componentes del módulo de tutoría
 */

const tutorAlphaService = require('./tutor_alpha_service');
const routesAlpha = require('./routes_alpha');

// Compatibilidad con servicio anterior
const { processTutorInteraction } = require('./tutor_service');
const { SOCRATIC_SYSTEM_PROMPT } = require('./tutor_prompts');

module.exports = {
    // Nuevo servicio Alpha (Semana 10)
    tutorAlphaService,
    routesAlpha,

    // Servicios legacy (compatibilidad)
    processTutorInteraction,
    SOCRATIC_SYSTEM_PROMPT,

    // Convenience exports
    chat: (params) => tutorAlphaService.processTutorMessage(params),
    generateQuiz: (...args) => tutorAlphaService.generateQuiz(...args),
    detectRisk: (message) => tutorAlphaService.detectRisk(message),
    getSuggestions: (studentId) => tutorAlphaService.suggestTopics(studentId)
};
