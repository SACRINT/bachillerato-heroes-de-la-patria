/**
 * 🔧 TECH DEBT MODULE - Index
 * Semana 31: Mantenimiento y Deuda Técnica
 */

const techDebtService = require('./tech_debt_service');
const routes = require('./routes');

module.exports = {
    techDebtService,
    routes,

    // Convenience exports
    analyzeCodeQuality: () => techDebtService.analyzeCodeQuality(),
    analyzeDependencies: () => techDebtService.analyzeDependencies(),
    getTestCoverage: () => techDebtService.analyzeTestCoverage(),
    scanTodos: () => techDebtService.scanTodosAndFixmes(),
    analyzeDocker: () => techDebtService.analyzeDockerImages(),
    analyzeLogs: (period) => techDebtService.analyzeLogs(period),
    getSystemHealth: () => techDebtService.performSystemHealthCheck(),
    getFullReport: () => techDebtService.generateTechDebtReport()
};
