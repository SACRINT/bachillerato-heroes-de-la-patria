/**
 * 🔐 TWO FACTOR AUTH SERVICE - TypeScript Version
 * Autenticación de dos factores con TOTP
 * Refactorizado: 07 Diciembre 2025
 */
export interface TwoFactorEnableResult {
    success: boolean;
    secret: string;
    qrUri: string;
    backupCodes: string[];
}
export interface TwoFactorVerifyResult {
    success: boolean;
    message?: string;
}
export interface BackupCodeVerifyResult {
    success: boolean;
    message?: string;
    remainingCodes?: number;
}
export interface RegenerateResult {
    success: boolean;
    backupCodes: string[];
}
export interface TwoFactorRecord {
    secret: string;
    enabled: boolean;
    backup_codes?: string;
}
declare class TwoFactorService {
    private issuer;
    private algorithm;
    private digits;
    private period;
    constructor();
    enable(userId: number): Promise<TwoFactorEnableResult>;
    verify(userId: number, token: string): Promise<TwoFactorVerifyResult>;
    verifyBackupCode(userId: number, code: string): Promise<BackupCodeVerifyResult>;
    disable(userId: number): Promise<{
        success: boolean;
    }>;
    isEnabled(userId: number): Promise<boolean>;
    generateSecret(): string;
    generateBackupCodes(count?: number): string[];
    generateQRUri(email: string, secret: string): string;
    verifyToken(token: string, secret: string): boolean;
    generateToken(secret: string, offset?: number): string;
    regenerateBackupCodes(userId: number): Promise<RegenerateResult>;
}
declare const twoFactorService: TwoFactorService;
export { TwoFactorService };
export default twoFactorService;
//# sourceMappingURL=two-factor.service.d.ts.map