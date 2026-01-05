/**
 * 📚 KNOWLEDGE TRANSFER MODULE - Index
 * Semana 35: Documentación y Transferencia de Conocimiento
 */

const knowledgeTransferService = require('./knowledge_transfer_service');
const routes = require('./routes');

module.exports = {
    knowledgeTransferService,
    routes,

    // Convenience exports
    getArchitecture: () => knowledgeTransferService.generateArchitectureDoc(),
    getManuals: () => knowledgeTransferService.generateUserManuals(),
    getVideos: () => knowledgeTransferService.generateVideoTutorials(),
    getMLOps: () => knowledgeTransferService.documentMLOpsProcesses(),
    getKnowledgeBase: () => knowledgeTransferService.createKnowledgeBase(),
    scheduleBrownBag: (topic) => knowledgeTransferService.scheduleBrownBagSession(topic),
    createADR: (decision) => knowledgeTransferService.createADR(decision),
    getAPIDoc: () => knowledgeTransferService.generateAPIDocumentation(),
    getOnboarding: (role) => knowledgeTransferService.createOnboardingGuide(role),
    getFullPackage: () => knowledgeTransferService.generateDocumentationPackage()
};
