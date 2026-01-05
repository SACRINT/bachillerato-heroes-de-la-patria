/**
 * 🌡️ SENTIMENT ANALYSIS MODULE - Index
 * Semana 14: Análisis de Sentimiento Institucional
 */

const sentimentService = require('./sentiment_service');
const routes = require('./routes');

module.exports = {
    sentimentService,
    routes,

    // Convenience exports
    analyze: (text) => sentimentService.analyzeText(text),
    getThermometer: (days) => sentimentService.getInstitutionalThermometer(days),
    getTrends: () => sentimentService.detectNegativeTrends(),
    getAlerts: () => sentimentService.getHighRiskAlerts(),
    getReport: (month) => sentimentService.generateMonthlyReport(month)
};
