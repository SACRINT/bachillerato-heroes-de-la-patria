/**
 * 📋 STRATEGIC PLANNING MODULE - Index
 * Semana 39: Planificación Estratégica Año 2
 */

const strategicPlanningService = require('./strategic_planning_service');
const routes = require('./routes');

module.exports = {
    strategicPlanningService,
    routes,

    // Convenience exports
    getObjectives: () => strategicPlanningService.defineHighLevelObjectives(),
    getBusinessNeeds: () => strategicPlanningService.evaluateBusinessNeeds(),
    getRoadmap: () => strategicPlanningService.createYearTwoRoadmap(),
    getBudget: () => strategicPlanningService.createBudgetPlan(),
    getInfrastructure: () => strategicPlanningService.planInfrastructureExpansion(),
    getHiring: () => strategicPlanningService.planHiring(),
    getAIKPIs: () => strategicPlanningService.defineAIKPIs(),
    getStrategicPlan: () => strategicPlanningService.generateStrategicPlan()
};
