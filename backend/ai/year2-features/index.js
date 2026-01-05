/**
 * 🚀 YEAR 2 FEATURES MODULE - Index
 * Semana 41: Desarrollo de Features Año 2
 */

const year2FeaturesService = require('./year2_features_service');
const routes = require('./routes');

module.exports = {
    year2FeaturesService,
    routes,

    // Convenience exports
    getMobileApp: () => year2FeaturesService.initializeMobileAppMVP(),
    getGamification: () => year2FeaturesService.initializeAdvancedGamification(),
    getPayments: () => year2FeaturesService.initializePaymentIntegration(),
    getParentPortal: () => year2FeaturesService.initializeEnhancedParentPortal(),
    getVoiceTutor: () => year2FeaturesService.initializeVoiceTutoring(),
    getAdaptiveTesting: () => year2FeaturesService.initializeAdaptiveTesting(),
    getMultiCampus: () => year2FeaturesService.initializeMultiCampusSupport(),
    getAllFeatures: () => year2FeaturesService.getAllFeatures(),
    getRoadmap: () => year2FeaturesService.getFeatureRoadmap()
};
