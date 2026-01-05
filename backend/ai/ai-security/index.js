/**
 * 🔒 AI SECURITY MODULE - Index
 * Semana 24: Seguridad de IA (AI Security)
 */

const aiSecurityService = require('./ai_security_service');
const routes = require('./routes');

module.exports = {
    aiSecurityService,
    routes,

    // Convenience exports
    detectPromptInjection: (text) => aiSecurityService.detectPromptInjection(text),
    sanitizePrompt: (text) => aiSecurityService.sanitizePrompt(text),
    detectPII: (text) => aiSecurityService.detectPII(text),
    redactPII: (text) => aiSecurityService.redactPII(text),
    runRedTeam: (endpoint, type) => aiSecurityService.runRedTeamTest(endpoint, type),
    checkAccess: (userId, feature, role, mfa) => aiSecurityService.checkAccess(userId, feature, role, mfa),
    checkRateLimit: (userId, endpoint) => aiSecurityService.checkRateLimit(userId, endpoint),
    detectAbuse: (userId) => aiSecurityService.detectAbusePatterns(userId),
    runSecurityScan: (endpoint) => aiSecurityService.runSecurityScan(endpoint)
};
