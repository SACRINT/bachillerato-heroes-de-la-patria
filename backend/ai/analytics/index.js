/**
 * 📊 AI ANALYTICS MODULE - Index
 * Semana 9: Analítica Descriptiva Inteligente
 * 
 * Exporta todos los componentes del módulo de analítica
 */

const descriptiveAnalyticsService = require('./descriptive_analytics_service');
const pdfReportGenerator = require('./pdf_report_generator');
const routes = require('./routes');

module.exports = {
    // Servicio principal
    descriptiveAnalyticsService,

    // Generador de reportes PDF
    pdfReportGenerator,

    // Rutas Express
    routes,

    // Convenience exports
    getExecutiveDashboard: () => descriptiveAnalyticsService.getExecutiveDashboard(),
    generateWeeklySummary: () => descriptiveAnalyticsService.generateWeeklySummary(),
    detectAnomalies: (category) => descriptiveAnalyticsService.detectAnomalies(category),
    getStudentClusters: () => descriptiveAnalyticsService.getStudentClusters(),
    generateAutoInsights: () => descriptiveAnalyticsService.generateAutoInsights(),
    checkMetricAlerts: () => descriptiveAnalyticsService.checkMetricAlerts()
};
