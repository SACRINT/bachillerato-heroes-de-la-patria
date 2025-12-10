/**
 * 🔐 WEBAUTHN DAO - TypeScript
 * Data Access Object para autenticación biométrica FIDO2/WebAuthn
 *
 * Migración TypeScript: 07 Diciembre 2025
 */
export interface WebAuthnCredential {
    id: number;
    user_id: number;
    credential_id: string;
    public_key: string;
    counter: number;
    transports: string[];
    device_name: string;
    aaguid: string;
    created_at: Date;
    last_used: Date;
}
export interface StoreCredentialInput {
    userId: number;
    credentialId: string;
    publicKey: string;
    counter: number;
    transports: string[];
    deviceName: string;
    aaguid: string;
}
declare class WebAuthnDAO {
    static storeChallenge(userId: number, challenge: string, type: string): Promise<void>;
    static getChallenge(userId: number, type: string): Promise<string | undefined>;
    static clearChallenge(userId: number, type: string): Promise<void>;
    static storeCredential(data: StoreCredentialInput): Promise<WebAuthnCredential>;
    static getUserCredentials(userId: number): Promise<WebAuthnCredential[]>;
    static getCredentialByCredentialId(credentialId: string): Promise<WebAuthnCredential | null>;
    static updateCounter(id: number, newCounter: number): Promise<void>;
    static updateLastUsed(id: number): Promise<void>;
    static deleteCredential(id: number, userId: number): Promise<boolean>;
    static hasCredentials(userId: number): Promise<boolean>;
}
export default WebAuthnDAO;
//# sourceMappingURL=webauthn.dao.d.ts.map