import { SECURITY_CONFIG } from './config';
import * as bcrypt from 'bcrypt';

// Interface provisional DAO
interface SecurityDAO {
    getPasswordHistory(userId: number | string, limit: number): Promise<any[]>;
    savePasswordToHistory(userId: number | string, hash: string): Promise<any>;
    cleanOldPasswordHistory(userId: number | string, keep: number): Promise<any>;
    checkPasswordAge(userId: number | string): Promise<{ needs_change?: boolean; last_changed?: string | Date }>;
}

const securityDAO = require('../../data/security-advanced.dao') as SecurityDAO;

export class PasswordValidatorService {
    validate(password: string): { valid: boolean; errors: string[]; strength: number } {
        const errors: string[] = [];

        if (password.length < SECURITY_CONFIG.password.minLength) {
            errors.push(`Mínimo ${SECURITY_CONFIG.password.minLength} caracteres`);
        }

        if (SECURITY_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Requiere al menos una mayúscula');
        }

        if (SECURITY_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Requiere al menos una minúscula');
        }

        if (SECURITY_CONFIG.password.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Requiere al menos un número');
        }

        if (SECURITY_CONFIG.password.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Requiere al menos un carácter especial');
        }

        // Verificar patrones comunes
        const commonPatterns = [
            /^123/, /password/i, /qwerty/i, /abc123/i
        ];

        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                errors.push('No usar patrones comunes');
                break;
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            strength: this._calculateStrength(password)
        };
    }

    async checkHistory(userId: number | string, password: string): Promise<{ used: boolean; message?: string }> {
        const history = await securityDAO.getPasswordHistory(userId, SECURITY_CONFIG.password.historyCount);

        for (const row of history) {
            const match = await bcrypt.compare(password, row.password_hash);
            if (match) {
                return {
                    used: true,
                    message: 'Esta contraseña fue usada recientemente'
                };
            }
        }

        return { used: false };
    }

    async saveToHistory(userId: number | string, passwordHash: string): Promise<void> {
        await securityDAO.savePasswordToHistory(userId, passwordHash);
        await securityDAO.cleanOldPasswordHistory(userId, SECURITY_CONFIG.password.historyCount);
    }

    async needsChange(userId: number | string): Promise<boolean> {
        const result = await securityDAO.checkPasswordAge(userId);

        if (result.needs_change || !result.last_changed) {
            return true;
        }

        const lastChange = new Date(result.last_changed).getTime();
        return Date.now() - lastChange > SECURITY_CONFIG.password.maxAge;
    }

    private _calculateStrength(password: string): number {
        let score = 0;

        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 2;

        return Math.min(score, 10);
    }
}
