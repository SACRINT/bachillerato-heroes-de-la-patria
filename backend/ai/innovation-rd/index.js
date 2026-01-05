/**
 * 🚀 INNOVATION R&D MODULE - Index
 * Semana 32: Innovación - Nuevas Fronteras (R&D)
 */

const innovationRDService = require('./innovation_rd_service');
const routes = require('./routes');

module.exports = {
    innovationRDService,
    routes,

    // Convenience exports
    researchArchitectures: () => innovationRDService.researchNewArchitectures(),
    prototypeVideo: (topic) => innovationRDService.prototypeVideoGeneration(topic),
    exploreAR: () => innovationRDService.exploreARWithAI(),
    evaluateAgents: () => innovationRDService.evaluateAutonomousAgents(),
    evaluateVoice: () => innovationRDService.evaluateVoiceCloning(),
    investigateFederated: () => innovationRDService.investigateFederatedLearning(),
    evaluateEmotional: () => innovationRDService.evaluateEmotionalAssistants(),
    selectPilot: () => innovationRDService.selectTechnologyForPilot(),
    designPoC: (techId) => innovationRDService.designPoC(techId),
    getProposals: () => innovationRDService.generateInnovationProposals()
};
