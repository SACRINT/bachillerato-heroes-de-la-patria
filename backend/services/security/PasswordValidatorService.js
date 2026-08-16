"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordValidatorService = void 0;
const config_1 = require("./config");
const bcrypt = __importStar(require("bcryptjs"));
const securityDAO = require('../../data/security-advanced.dao');
class PasswordValidatorService {
    validate(password) {
        const errors = [];
        if (password.length < config_1.SECURITY_CONFIG.password.minLength) {
            errors.push(`Mínimo ${config_1.SECURITY_CONFIG.password.minLength} caracteres`);
        }
        if (config_1.SECURITY_CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Requiere al menos una mayúscula');
        }
        if (config_1.SECURITY_CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Requiere al menos una minúscula');
        }
        if (config_1.SECURITY_CONFIG.password.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Requiere al menos un número');
        }
        if (config_1.SECURITY_CONFIG.password.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
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
    async checkHistory(userId, password) {
        const history = await securityDAO.getPasswordHistory(userId, config_1.SECURITY_CONFIG.password.historyCount);
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
    async saveToHistory(userId, passwordHash) {
        await securityDAO.savePasswordToHistory(userId, passwordHash);
        await securityDAO.cleanOldPasswordHistory(userId, config_1.SECURITY_CONFIG.password.historyCount);
    }
    async needsChange(userId) {
        const result = await securityDAO.checkPasswordAge(userId);
        if (result.needs_change || !result.last_changed) {
            return true;
        }
        const lastChange = new Date(result.last_changed).getTime();
        return Date.now() - lastChange > config_1.SECURITY_CONFIG.password.maxAge;
    }
    _calculateStrength(password) {
        let score = 0;
        if (password.length >= 8)
            score += 1;
        if (password.length >= 12)
            score += 1;
        if (password.length >= 16)
            score += 1;
        if (/[a-z]/.test(password))
            score += 1;
        if (/[A-Z]/.test(password))
            score += 1;
        if (/[0-9]/.test(password))
            score += 1;
        if (/[^a-zA-Z0-9]/.test(password))
            score += 2;
        return Math.min(score, 10);
    }
}
exports.PasswordValidatorService = PasswordValidatorService;
