/**
 * 🎨 MULTIMODAL CHATBOT MODULE - Index
 * Semana 17: Mejora del Chatbot (Multimodalidad)
 */

const multimodalService = require('./multimodal_service');
const routes = require('./routes');

module.exports = {
    multimodalService,
    routes,

    // Convenience exports
    processImage: (data, ctx) => multimodalService.processImage(data, ctx),
    transcribe: (audio, lang) => multimodalService.transcribeAudio(audio, lang),
    synthesize: (text, opts) => multimodalService.synthesizeSpeech(text, opts),
    generateVisual: (type, data) => multimodalService.generateVisualResponse(type, data),
    getMetrics: () => multimodalService.getMetrics()
};
