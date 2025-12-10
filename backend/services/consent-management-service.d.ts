export namespace CONSENT_TYPES {
    namespace TERMS_OF_SERVICE {
        let type: string;
        let required: boolean;
        let description: string;
        let legalBasis: string;
    }
    namespace PRIVACY_POLICY {
        let type_1: string;
        export { type_1 as type };
        let required_1: boolean;
        export { required_1 as required };
        let description_1: string;
        export { description_1 as description };
        let legalBasis_1: string;
        export { legalBasis_1 as legalBasis };
    }
    namespace MARKETING_EMAILS {
        let type_2: string;
        export { type_2 as type };
        let required_2: boolean;
        export { required_2 as required };
        let description_2: string;
        export { description_2 as description };
        let legalBasis_2: string;
        export { legalBasis_2 as legalBasis };
    }
    namespace MARKETING_SMS {
        let type_3: string;
        export { type_3 as type };
        let required_3: boolean;
        export { required_3 as required };
        let description_3: string;
        export { description_3 as description };
        let legalBasis_3: string;
        export { legalBasis_3 as legalBasis };
    }
    namespace DATA_SHARING {
        let type_4: string;
        export { type_4 as type };
        let required_4: boolean;
        export { required_4 as required };
        let description_4: string;
        export { description_4 as description };
        let legalBasis_4: string;
        export { legalBasis_4 as legalBasis };
    }
    namespace COOKIES_ANALYTICS {
        let type_5: string;
        export { type_5 as type };
        let required_5: boolean;
        export { required_5 as required };
        let description_5: string;
        export { description_5 as description };
        let legalBasis_5: string;
        export { legalBasis_5 as legalBasis };
    }
    namespace COOKIES_MARKETING {
        let type_6: string;
        export { type_6 as type };
        let required_6: boolean;
        export { required_6 as required };
        let description_6: string;
        export { description_6 as description };
        let legalBasis_6: string;
        export { legalBasis_6 as legalBasis };
    }
    namespace THIRD_PARTY_SHARING {
        let type_7: string;
        export { type_7 as type };
        let required_7: boolean;
        export { required_7 as required };
        let description_7: string;
        export { description_7 as description };
        let legalBasis_7: string;
        export { legalBasis_7 as legalBasis };
    }
}
export function grantConsent(userId: any, consentType: any, options?: {}): Promise<any>;
export function revokeConsent(userId: any, consentType: any): Promise<{
    success: boolean;
    consentType: any;
    message: string;
}>;
export function getUserConsents(userId: any): Promise<any>;
export function hasActiveConsent(userId: any, consentType: any): Promise<any>;
export function getMissingRequiredConsents(userId: any): Promise<{
    type: string;
    description: string;
    required: boolean;
}[]>;
export function bulkGrantConsents(userId: any, consents: any, options?: {}): Promise<any[]>;
export function createPrivacyPolicyVersion(version: any, content: any, options?: {}): Promise<any>;
export function getCurrentPrivacyPolicyVersion(): Promise<any>;
export function generateConsentReport(filters?: {}): Promise<{
    consentsByType: any;
    reportGeneratedAt: string;
}>;
//# sourceMappingURL=consent-management-service.d.ts.map