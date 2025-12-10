declare const _exports: EncryptionService;
export = _exports;
declare class EncryptionService {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
    encryptionKey: NonSharedBuffer;
    generateKey(): NonSharedBuffer;
    encrypt(plaintext: any): string;
    decrypt(ciphertext: any): string;
    hashPassword(password: any): Promise<string>;
    verifyPassword(password: any, storedHash: any): Promise<boolean>;
    hash(data: any, algorithm?: string): string;
    hmac(data: any, key?: NonSharedBuffer): string;
    randomString(length?: number): string;
    randomInt(min: any, max: any): number;
    uuid(): `${string}-${string}-${string}-${string}-${string}`;
    encryptObject(obj: any): string;
    decryptObject(ciphertext: any): any;
    encryptFields(obj: any, fields: any): any;
    decryptFields(obj: any, fields: any): any;
    mask(value: any, visibleChars?: number): string;
    maskEmail(email: any): string;
}
//# sourceMappingURL=encryptionService.d.ts.map