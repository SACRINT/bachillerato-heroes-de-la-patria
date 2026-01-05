/**
 * ♿ ACCESSIBILITY AI MODULE - Index
 * Semana 27: Accesibilidad e Inclusión
 */

const accessibilityAIService = require('./accessibility_service');
const routes = require('./routes');

module.exports = {
    accessibilityAIService,
    routes,

    // Convenience exports
    auditAccessibility: (url, options) => accessibilityAIService.auditAccessibility(url, options),
    transcribe: (audio, options) => accessibilityAIService.transcribeWithAccents(audio, options),
    simplifyText: (text, level) => accessibilityAIService.simplifyText(text, level),
    generateAltText: (imageUrl, context) => accessibilityAIService.generateAltText(imageUrl, context),
    getVisualAdaptation: (userId, prefs) => accessibilityAIService.getVisualAdaptation(userId, prefs),
    translate: (text, target, source) => accessibilityAIService.translateContent(text, target, source),
    evaluateBias: (modelId, data) => accessibilityAIService.evaluateBias(modelId, data),
    processVoiceCommand: (cmd, ctx) => accessibilityAIService.processVoiceCommand(cmd, ctx)
};
