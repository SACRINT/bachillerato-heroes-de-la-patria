/**
 * 🔐 TWO FACTOR AUTH SERVICE - TypeScript Version
 * Autenticación de dos factores con TOTP
 * Refactorizado: 07 Diciembre 2025
 */

import crypto from 'crypto';
const TwoFactorDAO = require('../data/two-factor.dao');

// ============================================
// INTERFACES
// ============================================

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

// ============================================
// TWO FACTOR SERVICE CLASS
// ============================================

class TwoFactorService {
    private issuer: string;
    private algorithm: string;
    private digits: number;
    private period: number;

    constructor() {
        this.issuer = 'BGE Heroes de la Patria';
        this.algorithm = 'SHA1';
        this.digits = 6;
        this.period = 30;
    }

    async enable(userId: number): Promise<TwoFactorEnableResult> {
        const secret = this.generateSecret();
        const backupCodes = this.generateBackupCodes();
        await TwoFactorDAO.save(userId, secret, backupCodes);
        const email = await TwoFactorDAO.getUserEmail(userId);
        return {
            success: true,
            secret,
            qrUri: this.generateQRUri(email, secret),
            backupCodes
        };
    }

    async verify(userId: number, token: string): Promise<TwoFactorVerifyResult> {
        const record: TwoFactorRecord | null = await TwoFactorDAO.getSecretAndStatus(userId);
        if (!record) return { success: false, message: '2FA no configurado' };

        const { secret, enabled } = record;
        if (this.verifyToken(token, secret)) {
            if (!enabled) await TwoFactorDAO.enable(userId);
            return { success: true };
        }
        return { success: false, message: 'Código inválido' };
    }

    async verifyBackupCode(userId: number, code: string): Promise<BackupCodeVerifyResult> {
        const record = await TwoFactorDAO.getBackupCodes(userId);
        if (!record) return { success: false };

        let backupCodes: string[] = JSON.parse(record.backup_codes || '[]');
        const index = backupCodes.indexOf(code);

        if (index === -1) return { success: false, message: 'Código de respaldo inválido' };

        backupCodes.splice(index, 1);
        await TwoFactorDAO.updateBackupCodes(userId, backupCodes);
        return { success: true, remainingCodes: backupCodes.length };
    }

    async disable(userId: number): Promise<{ success: boolean }> {
        await TwoFactorDAO.disable(userId);
        return { success: true };
    }

    async isEnabled(userId: number): Promise<boolean> {
        return TwoFactorDAO.isEnabled(userId);
    }

    generateSecret(): string {
        return crypto.randomBytes(20).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    }

    generateBackupCodes(count: number = 10): string[] {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }

    generateQRUri(email: string, secret: string): string {
        const params = new URLSearchParams({
            secret,
            issuer: this.issuer,
            algorithm: this.algorithm,
            digits: this.digits.toString(),
            period: this.period.toString()
        });
        return `otpauth://totp/${encodeURIComponent(`${this.issuer}:${email}`)}?${params}`;
    }

    verifyToken(token: string, secret: string): boolean {
        return token === this.generateToken(secret, 0) ||
            token === this.generateToken(secret, -1) ||
            token === this.generateToken(secret, 1);
    }

    generateToken(secret: string, offset: number = 0): string {
        const counter = Math.floor(Date.now() / 1000 / this.period) + offset;
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigUInt64BE(BigInt(counter));

        const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
        hmac.update(counterBuffer);
        const hash = hmac.digest();

        const offsetByte = hash[hash.length - 1] & 0x0f;
        const code = (((hash[offsetByte] & 0x7f) << 24) |
            ((hash[offsetByte + 1] & 0xff) << 16) |
            ((hash[offsetByte + 2] & 0xff) << 8) |
            (hash[offsetByte + 3] & 0xff)) % Math.pow(10, this.digits);

        return code.toString().padStart(this.digits, '0');
    }

    async regenerateBackupCodes(userId: number): Promise<RegenerateResult> {
        const backupCodes = this.generateBackupCodes();
        await TwoFactorDAO.updateBackupCodes(userId, backupCodes);
        return { success: true, backupCodes };
    }
}

// ============================================
// EXPORTS
// ============================================

const twoFactorService = new TwoFactorService();

export { TwoFactorService };
export default twoFactorService;

module.exports = twoFactorService;
module.exports.TwoFactorService = TwoFactorService;
