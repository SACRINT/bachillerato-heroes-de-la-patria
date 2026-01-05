/**
 * 💰 FINOPS MODULE - Index
 * Semana 30: Optimización de Costos (FinOps)
 */

const finOpsService = require('./finops_service');
const routes = require('./routes');

module.exports = {
    finOpsService,
    routes,

    // Convenience exports
    analyzeCosts: (period) => finOpsService.analyzeCostBreakdown(period),
    getUnusedResources: () => finOpsService.identifyUnusedResources(),
    getCachingOpportunities: () => finOpsService.analyzeCachingOpportunities(),
    getModelCosts: () => finOpsService.evaluateModelCosts(),
    getBudgets: () => finOpsService.getDepartmentBudgets(),
    getFeatureROI: () => finOpsService.calculateFeatureROI(),
    getWeeklyReport: () => finOpsService.generateWeeklyCostReport(),
    validateSavings: (period) => finOpsService.validateSavings(period),
    getForecast: (months) => finOpsService.getCostForecast(months)
};
