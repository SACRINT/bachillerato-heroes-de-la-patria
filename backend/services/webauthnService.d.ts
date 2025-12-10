declare const _exports: WebAuthnService;
export = _exports;
declare class WebAuthnService {
    rpName: string;
    rpID: string;
    origin: string;
    getRPID(): string;
    getOrigin(): string;
    generateRegistrationOptions(userId: any, userName: any, userEmail: any): Promise<{
        success: boolean;
        options: import("@simplewebauthn/server").PublicKeyCredentialCreationOptionsJSON;
    }>;
    verifyRegistrationResponse(userId: any, response: any, deviceName?: string): Promise<{
        success: boolean;
        verified: boolean;
        credentialId: string;
    }>;
    generateAuthenticationOptions(userId?: any): Promise<{
        success: boolean;
        options: import("@simplewebauthn/server").PublicKeyCredentialRequestOptionsJSON;
    }>;
    verifyAuthenticationResponse(response: any, userId?: any): Promise<{
        success: boolean;
        verified: boolean;
        userId: any;
        credentialId: any;
    }>;
    storeChallenge(userId: any, challenge: any, type: any): Promise<void>;
    getChallenge(userId: any, type: any): Promise<any>;
    clearChallenge(userId: any, type: any): Promise<void>;
    storeCredential(data: any): Promise<any>;
    getUserCredentials(userId: any): Promise<any>;
    getCredential(credentialId: any): Promise<any>;
    updateCounter(id: any, newCounter: any): Promise<void>;
    updateLastUsed(id: any): Promise<void>;
    deleteCredential(id: any, userId: any): Promise<any>;
    hasCredentials(userId: any): Promise<any>;
}
//# sourceMappingURL=webauthnService.d.ts.map