/**
 * Servicio de Seguridad Avanzada
 * BGE Héroes de la Patria
 * FASE 4 - Semana 27-28
 *
 * Utilidades de seguridad, validación y protección
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class SecurityService {
    constructor() {
        // Configuración de seguridad
        this.config = {
            bcryptRounds: 12,
            tokenLength: 32,
            otpLength: 6,
            otpExpiry: 300, // 5 minutos
            maxLoginAttempts: 5,
            lockoutDuration: 900, // 15 minutos
            sessionTimeout: 3600, // 1 hora
            passwordMinLength: 8,
            passwordMaxAge: 90 // días
        };

        // Tracking de intentos de login
        this.loginAttempts = new Map();

        // Tokens temporales (OTP, reset password)
        this.temporaryTokens = new Map();

        // Lista de IPs bloqueadas
        this.blockedIPs = new Set();

        // Patrones de ataques conocidos
        this.attackPatterns = {
            sqlInjection: /('|"|;|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b)/i,
            xss: /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/i,
            pathTraversal: /(\.\.\/)|(\.\.\\)/,
            commandInjection: /[;&|`$()]/
        };

        console.log('[SECURITY-SERVICE] Servicio de seguridad inicializado');
    }

    // ========================================
    // HASHING Y ENCRIPTACIÓN
    // ========================================

    /**
     * Hash de contraseña con bcrypt
     */
    async hashPassword(password) {
        return await bcrypt.hash(password, this.config.bcryptRounds);
    }

    /**
     * Verificar contraseña
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generar token aleatorio seguro
     */
    generateSecureToken(length = this.config.tokenLength) {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Generar OTP numérico
     */
    generateOTP(length = this.config.otpLength) {
        const digits = '0123456789';
        let otp = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            otp += digits[bytes[i] % 10];
        }
        return otp;
    }

    /**
     * Hash SHA-256
     */
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * HMAC para firmas
     */
    hmac(data, secret) {
        return crypto.createHmac('sha256', secret).update(data).digest('hex');
    }

    /**
     * Encriptar datos con AES-256
     */
    encrypt(text, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Desencriptar datos AES-256
     */
    decrypt(encryptedText, key) {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    // ========================================
    // VALIDACIÓN DE CONTRASEÑAS
    // ========================================

    /**
     * Validar fortaleza de contraseña
     */
    validatePasswordStrength(password) {
        const errors = [];
        const strength = {
            score: 0,
            level: 'weak'
        };

        if (password.length < this.config.passwordMinLength) {
            errors.push(`Mínimo ${this.config.passwordMinLength} caracteres`);
        } else {
            strength.score += 1;
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Debe incluir al menos una minúscula');
        } else {
            strength.score += 1;
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Debe incluir al menos una mayúscula');
        } else {
            strength.score += 1;
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Debe incluir al menos un número');
        } else {
            strength.score += 1;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Debe incluir al menos un carácter especial');
        } else {
            strength.score += 1;
        }

        // Verificar patrones comunes
        const commonPatterns = [
            /^123456/,
            /^password/i,
            /^qwerty/i,
            /^abc123/i,
            /(.)\1{2,}/ // 3+ caracteres repetidos
        ];

        for (const pattern of commonPatterns) {
            if (pattern.test(password)) {
                errors.push('Contraseña demasiado común o predecible');
                strength.score = Math.max(0, strength.score - 1);
                break;
            }
        }

        // Determinar nivel
        if (strength.score >= 5) {
            strength.level = 'strong';
        } else if (strength.score >= 3) {
            strength.level = 'medium';
        } else {
            strength.level = 'weak';
        }

        return {
            valid: errors.length === 0,
            errors,
            strength
        };
    }

    // ========================================
    // PROTECCIÓN CONTRA ATAQUES
    // ========================================

    /**
     * Detectar patrones de ataque en input
     */
    detectAttackPatterns(input) {
        const threats = [];

        if (typeof input !== 'string') {
            return threats;
        }

        if (this.attackPatterns.sqlInjection.test(input)) {
            threats.push({
                type: 'sql_injection',
                severity: 'critical',
                message: 'Posible intento de SQL injection'
            });
        }

        if (this.attackPatterns.xss.test(input)) {
            threats.push({
                type: 'xss',
                severity: 'high',
                message: 'Posible intento de XSS'
            });
        }

        if (this.attackPatterns.pathTraversal.test(input)) {
            threats.push({
                type: 'path_traversal',
                severity: 'high',
                message: 'Posible intento de path traversal'
            });
        }

        if (this.attackPatterns.commandInjection.test(input)) {
            threats.push({
                type: 'command_injection',
                severity: 'critical',
                message: 'Posible intento de command injection'
            });
        }

        return threats;
    }

    /**
     * Sanitizar input básico
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;

        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Validar y sanitizar email
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = email.toLowerCase().trim();

        return {
            valid: emailRegex.test(sanitized),
            sanitized
        };
    }

    // ========================================
    // CONTROL DE ACCESO Y BLOQUEOS
    // ========================================

    /**
     * Registrar intento de login fallido
     */
    recordFailedLogin(identifier) {
        const key = identifier.toLowerCase();
        const attempts = this.loginAttempts.get(key) || {
            count: 0,
            firstAttempt: Date.now(),
            lastAttempt: Date.now()
        };

        attempts.count++;
        attempts.lastAttempt = Date.now();

        this.loginAttempts.set(key, attempts);

        // Verificar si debe bloquearse
        if (attempts.count >= this.config.maxLoginAttempts) {
            return {
                blocked: true,
                lockoutUntil: Date.now() + (this.config.lockoutDuration * 1000),
                message: `Cuenta bloqueada por ${this.config.lockoutDuration / 60} minutos`
            };
        }

        return {
            blocked: false,
            attemptsRemaining: this.config.maxLoginAttempts - attempts.count
        };
    }

    /**
     * Verificar si está bloqueado
     */
    isLocked(identifier) {
        const key = identifier.toLowerCase();
        const attempts = this.loginAttempts.get(key);

        if (!attempts) return false;

        if (attempts.count >= this.config.maxLoginAttempts) {
            const lockoutEnd = attempts.lastAttempt + (this.config.lockoutDuration * 1000);
            if (Date.now() < lockoutEnd) {
                return {
                    locked: true,
                    remainingTime: Math.ceil((lockoutEnd - Date.now()) / 1000)
                };
            }
            // Lockout expirado, resetear
            this.loginAttempts.delete(key);
        }

        return { locked: false };
    }

    /**
     * Resetear intentos de login
     */
    resetLoginAttempts(identifier) {
        this.loginAttempts.delete(identifier.toLowerCase());
    }

    /**
     * Bloquear IP
     */
    blockIP(ip, reason = 'suspicious_activity') {
        this.blockedIPs.add(ip);
        console.warn(`[SECURITY] IP bloqueada: ${ip} - Razón: ${reason}`);
        return true;
    }

    /**
     * Desbloquear IP
     */
    unblockIP(ip) {
        return this.blockedIPs.delete(ip);
    }

    /**
     * Verificar si IP está bloqueada
     */
    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    // ========================================
    // TOKENS TEMPORALES (OTP, RESET)
    // ========================================

    /**
     * Crear token temporal
     */
    createTemporaryToken(userId, type, expirySeconds = this.config.otpExpiry) {
        const token = type === 'otp' ? this.generateOTP() : this.generateSecureToken();
        const key = `${type}:${userId}`;

        this.temporaryTokens.set(key, {
            token,
            createdAt: Date.now(),
            expiresAt: Date.now() + (expirySeconds * 1000),
            attempts: 0
        });

        return token;
    }

    /**
     * Verificar token temporal
     */
    verifyTemporaryToken(userId, type, token) {
        const key = `${type}:${userId}`;
        const stored = this.temporaryTokens.get(key);

        if (!stored) {
            return { valid: false, error: 'Token no encontrado' };
        }

        if (Date.now() > stored.expiresAt) {
            this.temporaryTokens.delete(key);
            return { valid: false, error: 'Token expirado' };
        }

        stored.attempts++;
        if (stored.attempts > 3) {
            this.temporaryTokens.delete(key);
            return { valid: false, error: 'Demasiados intentos' };
        }

        if (stored.token !== token) {
            return { valid: false, error: 'Token inválido' };
        }

        // Token válido, eliminar
        this.temporaryTokens.delete(key);
        return { valid: true };
    }

    // ========================================
    // VALIDACIÓN DE SESIONES
    // ========================================

    /**
     * Generar fingerprint del navegador
     */
    generateFingerprint(req) {
        const components = [
            req.headers['user-agent'] || '',
            req.headers['accept-language'] || '',
            req.headers['accept-encoding'] || ''
        ];

        return this.sha256(components.join('|'));
    }

    /**
     * Validar consistencia de sesión
     */
    validateSessionConsistency(session, req) {
        if (!session.fingerprint) return true;

        const currentFingerprint = this.generateFingerprint(req);
        return session.fingerprint === currentFingerprint;
    }

    // ========================================
    // GENERACIÓN DE CSRF TOKENS
    // ========================================

    /**
     * Generar token CSRF
     */
    generateCSRFToken() {
        return this.generateSecureToken(32);
    }

    /**
     * Verificar token CSRF
     */
    verifyCSRFToken(token, storedToken) {
        if (!token || !storedToken) return false;
        return crypto.timingSafeEqual(
            Buffer.from(token),
            Buffer.from(storedToken)
        );
    }

    // ========================================
    // UTILIDADES
    // ========================================

    /**
     * Obtener estadísticas de seguridad
     */
    getStats() {
        return {
            blockedIPs: this.blockedIPs.size,
            activeLoginTracking: this.loginAttempts.size,
            pendingTokens: this.temporaryTokens.size,
            config: {
                maxLoginAttempts: this.config.maxLoginAttempts,
                lockoutDuration: this.config.lockoutDuration,
                passwordMinLength: this.config.passwordMinLength
            }
        };
    }

    /**
     * Limpiar datos expirados
     */
    cleanup() {
        const now = Date.now();
        let cleaned = 0;

        // Limpiar tokens expirados
        for (const [key, data] of this.temporaryTokens) {
            if (now > data.expiresAt) {
                this.temporaryTokens.delete(key);
                cleaned++;
            }
        }

        // Limpiar intentos de login antiguos
        for (const [key, data] of this.loginAttempts) {
            const age = now - data.lastAttempt;
            if (age > this.config.lockoutDuration * 1000 * 2) {
                this.loginAttempts.delete(key);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Verificar si contraseña necesita renovación
     */
    passwordNeedsRenewal(lastChanged) {
        if (!lastChanged) return true;

        const daysSinceChange = (Date.now() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceChange > this.config.passwordMaxAge;
    }

    /**
     * Generar contraseña aleatoria segura
     */
    generateRandomPassword(length = 16) {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=';
        const all = lowercase + uppercase + numbers + special;

        let password = '';
        // Asegurar al menos uno de cada tipo
        password += lowercase[crypto.randomInt(lowercase.length)];
        password += uppercase[crypto.randomInt(uppercase.length)];
        password += numbers[crypto.randomInt(numbers.length)];
        password += special[crypto.randomInt(special.length)];

        // Completar con caracteres aleatorios
        for (let i = 4; i < length; i++) {
            password += all[crypto.randomInt(all.length)];
        }

        // Mezclar
        return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
    }
}

module.exports = new SecurityService();
