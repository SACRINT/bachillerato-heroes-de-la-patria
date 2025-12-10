/**
 * 🔐 WEBAUTHN SERVICE - TypeScript Version
 * Autenticación biométrica FIDO2/WebAuthn
 * Refactorizado: 07 Diciembre 2025
 */
export interface WebAuthnCredential {
    id: number;
    user_id: number;
    credential_id: string;
    public_key?: string;
    credential_public_key?: string;
    counter: number;
    transports?: string[];
    device_name?: string;
    created_at: Date;
    last_used?: Date;
}
export interface RegistrationOptionsResult {
    success: boolean;
    options: any;
}
export interface VerifyRegistrationResult {
    success: boolean;
    verified: boolean;
    credentialId: string;
}
export interface AuthenticationOptionsResult {
    success: boolean;
    options: any;
}
export interface VerifyAuthenticationResult {
    success: boolean;
    verified: boolean;
    userId: number;
    credentialId: string;
}
export interface CredentialData {
    userId: number;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    deviceName: string;
}
declare class WebAuthnService {
    private rpName;
    private rpID;
    private origin;
    constructor();
    private getRPID;
    private getOrigin;
    generateRegistrationOptions(userId: number, userName: string, userEmail: string): Promise<RegistrationOptionsResult>;
    verifyRegistrationResponse(userId: number, response: any, deviceName?: string): Promise<VerifyRegistrationResult>;
    generateAuthenticationOptions(userId?: number | null): Promise<AuthenticationOptionsResult>;
    verifyAuthenticationResponse(response: any, userId?: number | null): Promise<VerifyAuthenticationResult>;
    storeChallenge(userId: string | number, challenge: string, type: string): Promise<void>;
    getChallenge(userId: string | number, type: string): Promise<string | null>;
    clearChallenge(userId: string | number, type: string): Promise<void>;
    storeCredential(data: CredentialData): Promise<any>;
    getUserCredentials(userId: number): Promise<WebAuthnCredential[]>;
    getCredential(credentialId: string): Promise<WebAuthnCredential | null>;
    updateCounter(id: number, newCounter: number): Promise<void>;
    updateLastUsed(id: number): Promise<void>;
    deleteCredential(id: number, userId: number): Promise<boolean>;
    hasCredentials(userId: number): Promise<boolean>;
}
declare const webAuthnService: WebAuthnService;
export { WebAuthnService };
export default webAuthnService;
//# sourceMappingURL=webauthn.service.d.ts.map