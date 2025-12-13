/**
 * Real-Time Collaboration Service (Legacy Bridge)
 * 
 * Este archivo ha sido refactorizado a TypeScript modular.
 * La implementación real ahora reside en ./collaboration/index.ts
 * 
 * @deprecated Use imports from ./collaboration/index instead
 */

const { RealTimeCollaborationService, collaborationService, ServiceError } = require('./collaboration/index');

module.exports = {
    RealTimeCollaborationService,
    collaborationService,
    ServiceError
};
