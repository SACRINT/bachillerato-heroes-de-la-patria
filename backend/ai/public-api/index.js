/**
 * 🌐 PUBLIC API MODULE - Index
 * Semana 25: Integraciones Externas y API Pública
 */

const publicAPIService = require('./public_api_service');
const routes = require('./routes');

module.exports = {
    publicAPIService,
    routes,

    // Convenience exports
    getDocumentation: () => publicAPIService.getAPIDocumentation(),
    generateAPIKey: (orgId, plan) => publicAPIService.generateAPIKey(orgId, plan),
    validateAPIKey: (key) => publicAPIService.validateAPIKey(key),
    getUsageStats: (orgId) => publicAPIService.getUsageStats(orgId),
    registerWebhook: (orgId, config) => publicAPIService.registerWebhook(orgId, config),
    createSandbox: (orgId) => publicAPIService.createSandbox(orgId),
    getAnalytics: (orgId, period) => publicAPIService.getAPIAnalytics(orgId, period)
};
