/**
 * 🔐 TWO FACTOR DAO - TypeScript
 * Data Access Object para 2FA
 *
 * Migración TypeScript: 06 Diciembre 2025
 */
export interface TwoFactorData {
    secret: string;
    enabled: boolean;
}
export interface BackupCodesData {
    backup_codes: string[];
}
declare class TwoFactorDAO {
    static save(userId: number, secret: string, backupCodes: string[]): Promise<void>;
    static getUserEmail(userId: number): Promise<string>;
    static getSecretAndStatus(userId: number): Promise<TwoFactorData | undefined>;
    static enable(userId: number): Promise<void>;
    static disable(userId: number): Promise<void>;
    static getBackupCodes(userId: number): Promise<BackupCodesData | undefined>;
    static updateBackupCodes(userId: number, backupCodes: string[]): Promise<void>;
    static isEnabled(userId: number): Promise<boolean>;
}
export default TwoFactorDAO;
//# sourceMappingURL=two-factor.dao.d.ts.map