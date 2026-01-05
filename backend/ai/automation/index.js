/**
 * 🤖 ADMINISTRATIVE AUTOMATION MODULE - Index
 * Semana 16: Automatización Administrativa (RPA + AI)
 */

const automationService = require('./automation_service');
const routes = require('./routes');

module.exports = {
    automationService,
    routes,

    // Convenience exports
    processOCR: (path, type) => automationService.processDocumentOCR(path, type),
    classifyEmail: (subject, body) => automationService.classifyEmail(subject, body),
    validatePayment: (data) => automationService.validatePayment(data),
    generateCertificate: (studentId, type) => automationService.generateCertificate(studentId, type),
    generateSchedule: (params) => automationService.generateSchedule(params),
    getMetrics: () => automationService.getAutomationMetrics()
};
