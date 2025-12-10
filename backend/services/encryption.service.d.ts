/**
 * 🔒 ENCRYPTION SERVICE - TypeScript Version
 * Servicio de encriptación de datos sensibles
 *
 * Features:
 * - AES-256-GCM encryption
 * - Key rotation
 * - Field-level encryption
 * - Hash functions
 * - Secure random
 *
 * Refactorizado: 07 Diciembre 2025
 */
export type HashAlgorithm = 'sha256' | 'sha512' | 'md5';
export interface EncryptedData {
    iv: string;
    tag: string;
    data: string;
}
declare class EncryptionService {
    private algorithm;
    private keyLength;
    private ivLength;
    private tagLength;
    private encryptionKey;
    constructor();
    generateKey(): Buffer;
    encrypt(plaintext: string): string | null;
    decrypt(ciphertext: string): string | null;
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, storedHash: string): Promise<boolean>;
    hash(data: string, algorithm?: HashAlgorithm): string;
    hmac(data: string, key?: Buffer): string;
    randomString(length?: number): string;
    randomInt(min: number, max: number): number;
    uuid(): string;
    encryptObject(obj: Record<string, any>): string | null;
    decryptObject(ciphertext: string): Record<string, any> | null;
    encryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T;
    decryptFields<T extends Record<string, any>>(obj: T, fields: (keyof T)[]): T;
    mask(value: string, visibleChars?: number): string;
    maskEmail(email: string): string;
}
declare const encryptionService: EncryptionService;
export { EncryptionService };
export default encryptionService;
//# sourceMappingURL=encryption.service.d.ts.map