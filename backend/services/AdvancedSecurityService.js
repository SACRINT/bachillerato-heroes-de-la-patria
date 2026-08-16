/**
 * Advanced Security Service (Legacy Bridge)
 * 
 * Este archivo ha sido refactorizado a TypeScript modular.
 * La implementación real ahora reside en ./security/index.ts
 * 
 * @deprecated Use imports from ./security/index instead
 */

const { AdvancedSecurityService, securityService, ServiceError } = require('./security/index.js');

module.exports = {
    AdvancedSecurityService,
    securityService,
    ServiceError
};
