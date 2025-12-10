declare const _exports: TwoFactorService;
export = _exports;
declare class TwoFactorService {
    issuer: string;
    algorithm: string;
    digits: number;
    period: number;
    enable(userId: any): Promise<{
        success: boolean;
        secret: string;
        qrUri: string;
        backupCodes: string[];
    }>;
    verify(userId: any, token: any): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    verifyBackupCode(userId: any, code: any): Promise<{
        success: boolean;
        message?: undefined;
        remainingCodes?: undefined;
    } | {
        success: boolean;
        message: string;
        remainingCodes?: undefined;
    } | {
        success: boolean;
        remainingCodes: any;
        message?: undefined;
    }>;
    disable(userId: any): Promise<{
        success: boolean;
    }>;
    isEnabled(userId: any): Promise<any>;
    generateSecret(): string;
    generateBackupCodes(count?: number): string[];
    generateQRUri(email: any, secret: any): string;
    verifyToken(token: any, secret: any): boolean;
    generateToken(secret: any, offset?: number): string;
    regenerateBackupCodes(userId: any): Promise<{
        success: boolean;
        backupCodes: string[];
    }>;
}
//# sourceMappingURL=twoFactorService.d.ts.map