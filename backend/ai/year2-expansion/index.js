/**
 * 🌐 YEAR 2 EXPANSION MODULE - Index
 * Semana 43: Expansión de Capacidades
 */

const year2ExpansionService = require('./year2_expansion_service');
const routes = require('./routes');

module.exports = {
    year2ExpansionService,
    routes,

    // Convenience exports
    configureMultiRegional: (config) => year2ExpansionService.configureMultiRegional(config),
    getRegionalStatus: () => year2ExpansionService.getRegionalStatus(),
    activateAICapability: (cap) => year2ExpansionService.activateNewAICapability(cap),
    getAICapabilities: () => year2ExpansionService.getActiveAICapabilities(),
    configureAnalytics: (config) => year2ExpansionService.configureExtendedAnalytics(config),
    getInsights: () => year2ExpansionService.getAnalyticsInsights(),
    configureIntegration: (platform, config) => year2ExpansionService.configureIntegration(platform, config),
    getIntegrationStatus: () => year2ExpansionService.getIntegrationStatus(),
    configureScaling: (config) => year2ExpansionService.configureAutoScaling(config),
    getScalingMetrics: () => year2ExpansionService.getScalingMetrics(),
    getSummary: () => year2ExpansionService.getExpansionSummary()
};
