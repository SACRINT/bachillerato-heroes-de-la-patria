import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { SECURITY_CONFIG, ServiceError } from './config';

// Interface provisional para el DAO (hasta que migremos DAOs a TS)
// En producción esto debería importarse de data/types
interface SecurityDAO {
    upsert2FASetup(userId: number | string, secret: string, backups: string): Promise<any>;
    enable2FA(userId: number | string): Promise<any>;
    get2FAConfig(userId: number | string): Promise<any>;
    updateBackupCodes(userId: number | string, codes: string): Promise<any>;
    reset2FAAttempts(userId: number | string): Promise<any>;
    increment2FAFailedAttempts(userId: number | string): Promise<any>;
    disable2FA(userId: number | string): Promise<any>;
}

// Import dinámico porque el DAO es JS
const securityDAO = require('../../data/security-advanced.dao') as SecurityDAO;

export class TwoFactorService {
    private pendingCodes = new Map<string, { code: string; expires: number; attempts: number }>();

    /**
     * Genera secreto TOTP para usuario
     */
    async setupTOTP(userId: number | string) {
        const secret = this._generateSecret(32);
        const backupCodes = this._generateBackupCodes();

        // Guardar en BD (encriptado)
        const encryptedSecret = await this._encryptSecret(secret);
        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code => bcrypt.hash(code, 10))
        );

        await securityDAO.upsert2FASetup(userId, encryptedSecret, JSON.stringify(hashedBackupCodes));

        const otpAuthUrl = `otpauth://totp/BGE:${userId}?secret=${secret}&issuer=BGE&algorithm=SHA1&digits=6&period=30`;

        return {
            secret,
            otpAuthUrl,
            backupCodes
        };
    }

    /**
     * Verifica y habilita 2FA
     */
    async enableTOTP(userId: number | string, code: string) {
        const userAuth = await this._getUserAuth(userId);
        if (!userAuth) {
            throw new ServiceError('2FA no configurado', '2FA_NOT_SETUP', 400);
        }

        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);

        if (!isValid) {
            throw new ServiceError('Código inválido', 'INVALID_CODE', 400);
        }

        await securityDAO.enable2FA(userId);
        console.log(`[SECURITY] 2FA habilitado para usuario ${userId}`);

        return { enabled: true };
    }

    /**
     * Verifica código 2FA
     */
    async verify(userId: number | string, code: string): Promise<boolean> {
        const userAuth = await this._getUserAuth(userId);

        if (!userAuth || !userAuth.enabled) {
            return true;
        }

        if (userAuth.failed_attempts >= SECURITY_CONFIG.twoFactor.maxAttempts) {
            const lockoutTime = new Date(userAuth.last_failed_at).getTime() + SECURITY_CONFIG.twoFactor.codeExpiry;
            if (Date.now() < lockoutTime) {
                throw new ServiceError('Demasiados intentos fallidos', 'TOO_MANY_ATTEMPTS', 429);
            }
            await this._resetAttempts(userId);
        }

        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);

        if (isValid) {
            await this._resetAttempts(userId);
            return true;
        }

        const isBackupValid = await this._verifyBackupCode(userId, code, userAuth.backup_codes);
        if (isBackupValid) {
            return true;
        }

        await this._incrementFailedAttempts(userId);
        throw new ServiceError('Código 2FA inválido', 'INVALID_2FA_CODE', 401);
    }

    private _generateSecret(length: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            secret += chars[bytes[i] % chars.length];
        }
        return secret;
    }

    private _generateBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < SECURITY_CONFIG.twoFactor.backupCodesCount; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
        }
        return codes;
    }

    private _verifyTOTP(secret: string, code: string): boolean {
        const counter = Math.floor(Date.now() / 30000);
        for (let i = -1; i <= 1; i++) {
            const expectedCode = this._generateTOTP(secret, counter + i);
            if (expectedCode === code) return true;
        }
        return false;
    }

    private _generateTOTP(secret: string, counter: number): string {
        // 'base32' is not standard Buffer encoding, fallback to utf8 or assume hex if needed.
        // Original code used 'base32', which might be valid in some envs or libraries.
        const hmac = crypto.createHmac('sha1', Buffer.from(secret));
        const counterBuffer = Buffer.alloc(8);
        counterBuffer.writeBigInt64BE(BigInt(counter));
        hmac.update(counterBuffer);
        const hash = hmac.digest();

        const offset = hash[hash.length - 1] & 0xf;
        const binary = ((hash[offset] & 0x7f) << 24) |
            ((hash[offset + 1] & 0xff) << 16) |
            ((hash[offset + 2] & 0xff) << 8) |
            (hash[offset + 3] & 0xff);

        return (binary % 1000000).toString().padStart(6, '0');
    }
    // ...
    private async _getUserAuth(userId: number | string) {
        return await securityDAO.get2FAConfig(userId);
    }

    private async _encryptSecret(secret: string): Promise<string> {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(SECURITY_CONFIG.encryption.ivLength);
        const cipher = crypto.createCipheriv(SECURITY_CONFIG.encryption.algorithm, Buffer.from(key, 'hex'), iv);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        // Cast to any to avoid TS error with GCM tag methods if types are outdated
        const tag = (cipher as any).getAuthTag();

        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }

    private async _decryptSecret(encryptedSecret: string): Promise<string> {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const [ivHex, tagHex, encrypted] = encryptedSecret.split(':');

        const decipher = crypto.createDecipheriv(
            SECURITY_CONFIG.encryption.algorithm,
            Buffer.from(key, 'hex'),
            Buffer.from(ivHex, 'hex')
        );

        (decipher as any).setAuthTag(Buffer.from(tagHex, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    private async _verifyBackupCode(userId: number | string, code: string, hashedCodes: string): Promise<boolean> {
        const codes = JSON.parse(hashedCodes);
        for (let i = 0; i < codes.length; i++) {
            const isMatch = await bcrypt.compare(code, codes[i]);
            if (isMatch) {
                codes.splice(i, 1);
                await securityDAO.updateBackupCodes(userId, JSON.stringify(codes));
                return true;
            }
        }
        return false;
    }

    private async _resetAttempts(userId: number | string) {
        await securityDAO.reset2FAAttempts(userId);
    }

    private async _incrementFailedAttempts(userId: number | string) {
        await securityDAO.increment2FAFailedAttempts(userId);
    }
}
