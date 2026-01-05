/**
 * 🔧 INFRASTRUCTURE MAINTENANCE MODULE - Index
 * Semana 40: Mantenimiento Mayor de Infraestructura
 */

const infrastructureMaintenanceService = require('./infrastructure_maintenance_service');
const routes = require('./routes');

module.exports = {
    infrastructureMaintenanceService,
    routes,

    // Convenience exports
    upgradeDatabase: () => infrastructureMaintenanceService.upgradeDatabaseVersions(),
    migrateSystems: () => infrastructureMaintenanceService.migrateSystemsOrClusters(),
    rearchitect: () => infrastructureMaintenanceService.rearchitectComponents(),
    cleanupDW: () => infrastructureMaintenanceService.cleanupDataWarehouse(),
    rotateKeys: () => infrastructureMaintenanceService.rotateCryptographicKeys(),
    testDRP: () => infrastructureMaintenanceService.performDRPTests(),
    retrainModels: () => infrastructureMaintenanceService.retrainBaseModels(),
    optimizeNetwork: () => infrastructureMaintenanceService.optimizeNetworkTopology(),
    updateAIFrameworks: () => infrastructureMaintenanceService.updateAIFrameworks(),
    getMaintenanceReport: () => infrastructureMaintenanceService.generateMaintenanceReport()
};
