"use strict";
/**
 * ✅ CONSENT MANAGEMENT SERVICE - TypeScript Version
 * GDPR Article 7 - Gestión de Consentimiento
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONSENT_TYPES = void 0;
exports.grantConsent = grantConsent;
exports.revokeConsent = revokeConsent;
exports.getUserConsents = getUserConsents;
exports.hasActiveConsent = hasActiveConsent;
exports.getMissingRequiredConsents = getMissingRequiredConsents;
exports.bulkGrantConsents = bulkGrantConsents;
exports.createPrivacyPolicyVersion = createPrivacyPolicyVersion;
exports.getCurrentPrivacyPolicyVersion = getCurrentPrivacyPolicyVersion;
exports.generateConsentReport = generateConsentReport;
const gdpr_dao_1 = __importDefault(require('../data/gdpr.dao.js'));
// ==================== CONSENT TYPES ====================
const CONSENT_TYPES = {
    TERMS_OF_SERVICE: { type: 'terms_of_service', required: true, description: 'Acceptance of Terms of Service', legalBasis: 'contract' },
    PRIVACY_POLICY: { type: 'privacy_policy', required: true, description: 'Acceptance of Privacy Policy', legalBasis: 'contract' },
    MARKETING_EMAILS: { type: 'marketing_emails', required: false, description: 'Receive marketing emails and newsletters', legalBasis: 'consent' },
    MARKETING_SMS: { type: 'marketing_sms', required: false, description: 'Receive marketing SMS messages', legalBasis: 'consent' },
    DATA_SHARING: { type: 'data_sharing', required: false, description: 'Share data with third-party educational partners', legalBasis: 'consent' },
    COOKIES_ANALYTICS: { type: 'cookies_analytics', required: false, description: 'Use of analytics cookies', legalBasis: 'legitimate_interests' },
    COOKIES_MARKETING: { type: 'cookies_marketing', required: false, description: 'Use of marketing cookies', legalBasis: 'consent' },
    THIRD_PARTY_SHARING: { type: 'third_party_sharing', required: false, description: 'Share data with third-party providers', legalBasis: 'consent' }
};
exports.CONSENT_TYPES = CONSENT_TYPES;
// ==================== SERVICE FUNCTIONS ====================
async function grantConsent(userId, consentType, options = {}) {
    const { documentVersion = '1.0.0', consentMethod = 'explicit_checkbox', ipAddress = '0.0.0.0', userAgent = 'Unknown', metadata = {} } = options;
    const validType = Object.values(CONSENT_TYPES).find(c => c.type === consentType);
    if (!validType)
        throw new Error(`Invalid consent type: ${consentType}`);
    console.log(`[CONSENT] Granting consent: ${userId} → ${consentType}`);
    const result = await gdpr_dao_1.default.grantConsent(userId, consentType, true, ipAddress, userAgent, { ...metadata, documentVersion, consentMethod });
    console.log(`[CONSENT] Consent granted: ${result.id}`);
    return result;
}
async function revokeConsent(userId, consentType) {
    console.log(`[CONSENT] Revoking consent: ${userId} → ${consentType}`);
    const consentConfig = Object.values(CONSENT_TYPES).find(c => c.type === consentType);
    if (consentConfig && consentConfig.required) {
        throw new Error(`Cannot revoke required consent: ${consentType}. Deactivate account instead.`);
    }
    const success = await gdpr_dao_1.default.revokeConsent(userId, consentType);
    if (!success)
        throw new Error(`No active consent found for type: ${consentType}`);
    await handleConsentRevocation(userId, consentType);
    return { success: true, consentType, message: `Consent for ${consentType} has been revoked` };
}
async function handleConsentRevocation(userId, consentType) {
    switch (consentType) {
        case 'marketing_emails':
            console.log(`[CONSENT] Unsubscribing user ${userId} from marketing emails`);
            break;
        case 'marketing_sms':
            console.log(`[CONSENT] Unsubscribing user ${userId} from SMS`);
            break;
        case 'data_sharing':
            console.log(`[CONSENT] Notifying third parties about revocation for user ${userId}`);
            break;
        case 'cookies_marketing':
            console.log(`[CONSENT] Marketing cookies consent revoked for user ${userId}`);
            break;
    }
}
async function getUserConsents(userId) {
    return gdpr_dao_1.default.getUserConsents(userId);
}
async function hasActiveConsent(userId, consentType) {
    return gdpr_dao_1.default.hasActiveConsent(userId, consentType);
}
async function getMissingRequiredConsents(userId) {
    const userConsents = await getUserConsents(userId);
    const requiredTypes = Object.values(CONSENT_TYPES).filter(c => c.required).map(c => c.type);
    const grantedTypes = userConsents.filter(c => c.granted && !c.revoked).map(c => c.consent_type);
    return requiredTypes.filter(type => !grantedTypes.includes(type)).map(type => {
        const config = Object.values(CONSENT_TYPES).find(c => c.type === type);
        return { type, description: config.description, required: true };
    });
}
async function bulkGrantConsents(userId, consents, options = {}) {
    console.log(`[CONSENT] Bulk granting consents for user: ${userId}`);
    const results = [];
    for (const { type, granted } of consents) {
        if (granted)
            results.push(await grantConsent(userId, type, options));
    }
    console.log(`[CONSENT] Bulk granted ${results.length} consents`);
    return results;
}
async function createPrivacyPolicyVersion(version, content, options = {}) {
    console.log(`[CONSENT] Creating privacy policy version: ${version}`);
    return gdpr_dao_1.default.createPrivacyPolicyVersion(version, content, options);
}
async function getCurrentPrivacyPolicyVersion() {
    return gdpr_dao_1.default.getCurrentPrivacyPolicyVersion();
}
async function generateConsentReport(filters = {}) {
    console.log(`[CONSENT] Generating consent report`);
    const stats = await gdpr_dao_1.default.generateConsentReport(filters);
    return { consentsByType: stats, reportGeneratedAt: new Date().toISOString() };
}
//# sourceMappingURL=consent-management.service.js.map