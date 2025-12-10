/**
 * ✅ CONSENT MANAGEMENT SERVICE - TypeScript Version
 * GDPR Article 7 - Gestión de Consentimiento
 * Migrado: 07 Diciembre 2025
 */
declare const CONSENT_TYPES: {
    readonly TERMS_OF_SERVICE: {
        readonly type: "terms_of_service";
        readonly required: true;
        readonly description: "Acceptance of Terms of Service";
        readonly legalBasis: "contract";
    };
    readonly PRIVACY_POLICY: {
        readonly type: "privacy_policy";
        readonly required: true;
        readonly description: "Acceptance of Privacy Policy";
        readonly legalBasis: "contract";
    };
    readonly MARKETING_EMAILS: {
        readonly type: "marketing_emails";
        readonly required: false;
        readonly description: "Receive marketing emails and newsletters";
        readonly legalBasis: "consent";
    };
    readonly MARKETING_SMS: {
        readonly type: "marketing_sms";
        readonly required: false;
        readonly description: "Receive marketing SMS messages";
        readonly legalBasis: "consent";
    };
    readonly DATA_SHARING: {
        readonly type: "data_sharing";
        readonly required: false;
        readonly description: "Share data with third-party educational partners";
        readonly legalBasis: "consent";
    };
    readonly COOKIES_ANALYTICS: {
        readonly type: "cookies_analytics";
        readonly required: false;
        readonly description: "Use of analytics cookies";
        readonly legalBasis: "legitimate_interests";
    };
    readonly COOKIES_MARKETING: {
        readonly type: "cookies_marketing";
        readonly required: false;
        readonly description: "Use of marketing cookies";
        readonly legalBasis: "consent";
    };
    readonly THIRD_PARTY_SHARING: {
        readonly type: "third_party_sharing";
        readonly required: false;
        readonly description: "Share data with third-party providers";
        readonly legalBasis: "consent";
    };
};
interface GrantConsentOptions {
    documentVersion?: string;
    consentMethod?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}
interface ConsentRecord {
    id: number;
    consent_type: string;
    granted: boolean;
    revoked?: boolean;
}
interface MissingConsent {
    type: string;
    description: string;
    required: boolean;
}
interface RevokeResult {
    success: boolean;
    consentType: string;
    message: string;
}
declare function grantConsent(userId: number, consentType: string, options?: GrantConsentOptions): Promise<any>;
declare function revokeConsent(userId: number, consentType: string): Promise<RevokeResult>;
declare function getUserConsents(userId: number): Promise<ConsentRecord[]>;
declare function hasActiveConsent(userId: number, consentType: string): Promise<boolean>;
declare function getMissingRequiredConsents(userId: number): Promise<MissingConsent[]>;
declare function bulkGrantConsents(userId: number, consents: Array<{
    type: string;
    granted: boolean;
}>, options?: GrantConsentOptions): Promise<any[]>;
declare function createPrivacyPolicyVersion(version: string, content: string, options?: Record<string, any>): Promise<any>;
declare function getCurrentPrivacyPolicyVersion(): Promise<any>;
declare function generateConsentReport(filters?: Record<string, any>): Promise<any>;
export { CONSENT_TYPES, grantConsent, revokeConsent, getUserConsents, hasActiveConsent, getMissingRequiredConsents, bulkGrantConsents, createPrivacyPolicyVersion, getCurrentPrivacyPolicyVersion, generateConsentReport };
//# sourceMappingURL=consent-management.service.d.ts.map