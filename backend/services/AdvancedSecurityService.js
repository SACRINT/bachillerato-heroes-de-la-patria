/**
 * Advanced Security Service
 * Servicio de seguridad avanzada con 2FA, rate limiting, intrusion detection
 * OWASP Top 10 compliance
 *
 * @version 1.0.0
 * @author Claude Code - Arquitecto IA
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    // 2FA Configuration
    twoFactor: {
        codeLength: 6,
        codeExpiry: 300000,        // 5 minutes
        maxAttempts: 3,
        backupCodesCount: 10
    },

    // Rate Limiting
    rateLimiting: {
        windows: {
            login: { maxRequests: 5, windowMs: 900000 },      // 5 per 15 min
            api: { maxRequests: 100, windowMs: 60000 },       // 100 per min
            password: { maxRequests: 3, windowMs: 3600000 }   // 3 per hour
        }
    },

    // Session Security
    session: {
        maxConcurrent: 5,
        absoluteTimeout: 86400000,   // 24 hours
        idleTimeout: 1800000,        // 30 minutes
        rotateOnUse: true
    },

    // Intrusion Detection
    ids: {
        bruteForceThreshold: 10,
        suspiciousPatterns: [
            /union\s+select/i,
            /;.*drop\s+table/i,
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i
        ],
        blockDuration: 3600000       // 1 hour
    },

    // Password Policy
    password: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        maxAge: 90 * 24 * 3600000,   // 90 days
        historyCount: 5
    },

    // Encryption
    encryption: {
        algorithm: 'aes-256-gcm',
        keyLength: 32,
        ivLength: 16,
        tagLength: 16
    }
};

// ============================================
// SERVICE ERROR CLASS
// ============================================
class ServiceError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

// ============================================
// TWO-FACTOR AUTHENTICATION
// ============================================
class TwoFactorAuth {
    constructor(pool) {
        this.pool = pool;
        this.pendingCodes = new Map();
    }

    /**
     * Genera secreto TOTP para usuario
     */
    async setupTOTP(userId) {
        // Generar secreto base32
        const secret = this._generateSecret(32);
        const backupCodes = this._generateBackupCodes();

        // Guardar en BD (encriptado)
        const encryptedSecret = await this._encryptSecret(secret);
        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code => bcrypt.hash(code, 10))
        );

        const query = `
            INSERT INTO user_2fa (
                user_id, totp_secret, backup_codes, enabled, created_at
            ) VALUES ($1, $2, $3, false, NOW())
            ON CONFLICT (user_id) DO UPDATE SET
                totp_secret = EXCLUDED.totp_secret,
                backup_codes = EXCLUDED.backup_codes,
                enabled = false,
                updated_at = NOW()
            RETURNING id
        `;

        await this.pool.query(query, [userId, encryptedSecret, JSON.stringify(hashedBackupCodes)]);

        // Generar URL para QR
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
    async enableTOTP(userId, code) {
        const userAuth = await this._getUserAuth(userId);
        if (!userAuth) {
            throw new ServiceError('2FA no configurado', '2FA_NOT_SETUP', 400);
        }

        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);

        if (!isValid) {
            throw new ServiceError('Código inválido', 'INVALID_CODE', 400);
        }

        // Habilitar 2FA
        await this.pool.query(
            'UPDATE user_2fa SET enabled = true, verified_at = NOW() WHERE user_id = $1',
            [userId]
        );

        console.log(`[SECURITY] 2FA habilitado para usuario ${userId}`);

        return { enabled: true };
    }

    /**
     * Verifica código 2FA
     */
    async verify(userId, code) {
        const userAuth = await this._getUserAuth(userId);

        if (!userAuth || !userAuth.enabled) {
            return true; // 2FA no habilitado, pasar
        }

        // Verificar intentos fallidos
        if (userAuth.failed_attempts >= CONFIG.twoFactor.maxAttempts) {
            const lockoutTime = new Date(userAuth.last_failed_at).getTime() + CONFIG.twoFactor.codeExpiry;
            if (Date.now() < lockoutTime) {
                throw new ServiceError('Demasiados intentos fallidos', 'TOO_MANY_ATTEMPTS', 429);
            }
            // Reset después de lockout
            await this._resetAttempts(userId);
        }

        const secret = await this._decryptSecret(userAuth.totp_secret);
        const isValid = this._verifyTOTP(secret, code);

        if (isValid) {
            await this._resetAttempts(userId);
            return true;
        }

        // Verificar backup codes
        const isBackupValid = await this._verifyBackupCode(userId, code, userAuth.backup_codes);
        if (isBackupValid) {
            return true;
        }

        // Incrementar intentos fallidos
        await this._incrementFailedAttempts(userId);

        throw new ServiceError('Código 2FA inválido', 'INVALID_2FA_CODE', 401);
    }

    /**
     * Genera código temporal (para email/SMS)
     */
    async generateTemporaryCode(userId, method = 'email') {
        const code = this._generateNumericCode(CONFIG.twoFactor.codeLength);
        const expires = Date.now() + CONFIG.twoFactor.codeExpiry;

        this.pendingCodes.set(`${userId}:${method}`, {
            code,
            expires,
            attempts: 0
        });

        return code;
    }

    /**
     * Verifica código temporal
     */
    async verifyTemporaryCode(userId, code, method = 'email') {
        const key = `${userId}:${method}`;
        const pending = this.pendingCodes.get(key);

        if (!pending) {
            throw new ServiceError('No hay código pendiente', 'NO_PENDING_CODE', 400);
        }

        if (Date.now() > pending.expires) {
            this.pendingCodes.delete(key);
            throw new ServiceError('Código expirado', 'CODE_EXPIRED', 400);
        }

        if (pending.attempts >= CONFIG.twoFactor.maxAttempts) {
            this.pendingCodes.delete(key);
            throw new ServiceError('Demasiados intentos', 'TOO_MANY_ATTEMPTS', 429);
        }

        if (pending.code !== code) {
            pending.attempts++;
            throw new ServiceError('Código incorrecto', 'INVALID_CODE', 401);
        }

        this.pendingCodes.delete(key);
        return true;
    }

    /**
     * Deshabilita 2FA
     */
    async disable(userId, password) {
        // Verificar contraseña primero (en implementación real)
        await this.pool.query(
            'UPDATE user_2fa SET enabled = false WHERE user_id = $1',
            [userId]
        );

        console.log(`[SECURITY] 2FA deshabilitado para usuario ${userId}`);

        return { disabled: true };
    }

    // Métodos privados

    _generateSecret(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            secret += chars[bytes[i] % chars.length];
        }
        return secret;
    }

    _generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < CONFIG.twoFactor.backupCodesCount; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
        }
        return codes;
    }

    _generateNumericCode(length) {
        let code = '';
        const bytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            code += (bytes[i] % 10).toString();
        }
        return code;
    }

    _verifyTOTP(secret, code) {
        // Simplified TOTP verification
        // En producción usar librería como 'otplib'
        const counter = Math.floor(Date.now() / 30000);

        for (let i = -1; i <= 1; i++) {
            const expectedCode = this._generateTOTP(secret, counter + i);
            if (expectedCode === code) {
                return true;
            }
        }

        return false;
    }

    _generateTOTP(secret, counter) {
        // Simplified TOTP generation
        const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
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

    async _getUserAuth(userId) {
        const result = await this.pool.query(
            'SELECT * FROM user_2fa WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    }

    async _encryptSecret(secret) {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const iv = crypto.randomBytes(CONFIG.encryption.ivLength);
        const cipher = crypto.createCipheriv(CONFIG.encryption.algorithm, Buffer.from(key, 'hex'), iv);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    }

    async _decryptSecret(encryptedSecret) {
        const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
        const [ivHex, tagHex, encrypted] = encryptedSecret.split(':');

        const decipher = crypto.createDecipheriv(
            CONFIG.encryption.algorithm,
            Buffer.from(key, 'hex'),
            Buffer.from(ivHex, 'hex')
        );

        decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    async _verifyBackupCode(userId, code, hashedCodes) {
        const codes = JSON.parse(hashedCodes);

        for (let i = 0; i < codes.length; i++) {
            const isMatch = await bcrypt.compare(code, codes[i]);
            if (isMatch) {
                // Invalidar código usado
                codes.splice(i, 1);
                await this.pool.query(
                    'UPDATE user_2fa SET backup_codes = $1 WHERE user_id = $2',
                    [JSON.stringify(codes), userId]
                );
                return true;
            }
        }

        return false;
    }

    async _resetAttempts(userId) {
        await this.pool.query(
            'UPDATE user_2fa SET failed_attempts = 0 WHERE user_id = $1',
            [userId]
        );
    }

    async _incrementFailedAttempts(userId) {
        await this.pool.query(
            'UPDATE user_2fa SET failed_attempts = failed_attempts + 1, last_failed_at = NOW() WHERE user_id = $1',
            [userId]
        );
    }
}

// ============================================
// RATE LIMITER
// ============================================
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    /**
     * Verifica límite de tasa
     */
    check(key, windowType = 'api') {
        const config = CONFIG.rateLimiting.windows[windowType];
        if (!config) {
            return { allowed: true };
        }

        const now = Date.now();
        const windowKey = `${key}:${windowType}`;

        let windowData = this.requests.get(windowKey);

        if (!windowData || now - windowData.windowStart > config.windowMs) {
            // Nueva ventana
            windowData = {
                windowStart: now,
                count: 0
            };
        }

        windowData.count++;

        if (windowData.count > config.maxRequests) {
            const resetTime = windowData.windowStart + config.windowMs;
            return {
                allowed: false,
                retryAfter: Math.ceil((resetTime - now) / 1000),
                limit: config.maxRequests,
                remaining: 0
            };
        }

        this.requests.set(windowKey, windowData);

        return {
            allowed: true,
            limit: config.maxRequests,
            remaining: config.maxRequests - windowData.count
        };
    }

    /**
     * Reset manual de límites
     */
    reset(key, windowType = 'api') {
        const windowKey = `${key}:${windowType}`;
        this.requests.delete(windowKey);
    }

    /**
     * Limpia entradas expiradas
     */
    cleanup() {
        const now = Date.now();

        for (const [key, data] of this.requests.entries()) {
            const windowType = key.split(':').pop();
            const config = CONFIG.rateLimiting.windows[windowType];

            if (config && now - data.windowStart > config.windowMs) {
                this.requests.delete(key);
            }
        }
    }
}

// ============================================
// INTRUSION DETECTION SYSTEM
// ============================================
class IntrusionDetectionSystem {
    constructor(pool) {
        this.pool = pool;
        this.blockedIPs = new Map();
        this.failedAttempts = new Map();
    }

    /**
     * Analiza request por amenazas
     */
    analyze(request) {
        const { ip, path, body, query, headers } = request;

        // Verificar si IP está bloqueada
        if (this._isBlocked(ip)) {
            return {
                blocked: true,
                reason: 'IP bloqueada temporalmente'
            };
        }

        const threats = [];

        // Detectar patrones sospechosos
        const dataToCheck = JSON.stringify({ path, body, query });
        for (const pattern of CONFIG.ids.suspiciousPatterns) {
            if (pattern.test(dataToCheck)) {
                threats.push({
                    type: 'SUSPICIOUS_PATTERN',
                    pattern: pattern.toString(),
                    severity: 'high'
                });
            }
        }

        // Detectar user agent sospechoso
        const ua = headers['user-agent'] || '';
        if (!ua || ua.length < 10 || /curl|wget|scanner/i.test(ua)) {
            threats.push({
                type: 'SUSPICIOUS_USER_AGENT',
                severity: 'medium'
            });
        }

        // Detectar intentos de path traversal
        if (/\.\.\/|\.\.\\/.test(path)) {
            threats.push({
                type: 'PATH_TRAVERSAL',
                severity: 'high'
            });
        }

        if (threats.length > 0) {
            this._logThreat(ip, threats);

            // Bloquear si hay amenazas de alta severidad
            const highSeverity = threats.filter(t => t.severity === 'high');
            if (highSeverity.length > 0) {
                this._blockIP(ip);
                return {
                    blocked: true,
                    reason: 'Actividad maliciosa detectada',
                    threats
                };
            }
        }

        return {
            blocked: false,
            threats
        };
    }

    /**
     * Registra intento de login fallido
     */
    recordFailedLogin(ip, userId) {
        const key = `login:${ip}`;
        let attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };

        attempts.count++;
        attempts.lastAttempt = Date.now();
        attempts.lastUserId = odafiUserId;

        this.failedAttempts.set(key, attempts);

        // Verificar brute force
        if (attempts.count >= CONFIG.ids.bruteForceThreshold) {
            this._blockIP(ip);
            this._logThreat(ip, [{
                type: 'BRUTE_FORCE_DETECTED',
                severity: 'critical',
                attempts: attempts.count
            }]);

            console.log(`[SECURITY] Brute force detectado desde ${ip}`);

            return {
                blocked: true,
                attempts: attempts.count
            };
        }

        return {
            blocked: false,
            attempts: attempts.count
        };
    }

    /**
     * Limpia intentos fallidos después de login exitoso
     */
    clearFailedLogins(ip) {
        const key = `login:${ip}`;
        this.failedAttempts.delete(key);
    }

    /**
     * Verifica si una IP está bloqueada
     */
    _isBlocked(ip) {
        const blockData = this.blockedIPs.get(ip);
        if (!blockData) return false;

        if (Date.now() > blockData.until) {
            this.blockedIPs.delete(ip);
            return false;
        }

        return true;
    }

    /**
     * Bloquea una IP
     */
    _blockIP(ip) {
        this.blockedIPs.set(ip, {
            since: Date.now(),
            until: Date.now() + CONFIG.ids.blockDuration
        });

        console.log(`[SECURITY] IP bloqueada: ${ip}`);
    }

    /**
     * Desbloquea una IP manualmente
     */
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.failedAttempts.delete(`login:${ip}`);
        console.log(`[SECURITY] IP desbloqueada: ${ip}`);
    }

    /**
     * Lista IPs bloqueadas
     */
    getBlockedIPs() {
        const blocked = [];
        const now = Date.now();

        for (const [ip, data] of this.blockedIPs.entries()) {
            if (now < data.until) {
                blocked.push({
                    ip,
                    since: new Date(data.since),
                    until: new Date(data.until)
                });
            }
        }

        return blocked;
    }

    /**
     * Registra amenaza en BD
     */
    async _logThreat(ip, threats) {
        const query = `
            INSERT INTO security_threats (ip_address, threats, detected_at)
            VALUES ($1, $2, NOW())
        `;

        await this.pool.query(query, [ip, JSON.stringify(threats)])
            .catch(err => console.error('[SECURITY] Error logging threat:', err));
    }
}

// ============================================
// SESSION MANAGER
// ============================================
class SessionManager {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Crea nueva sesión
     */
    async create(userId, deviceInfo = {}) {
        const sessionId = crypto.randomUUID();
        const token = this._generateToken();

        // Verificar límite de sesiones concurrentes
        await this._enforceSessionLimit(userId);

        const query = `
            INSERT INTO user_sessions (
                session_id, user_id, token, device_info,
                ip_address, user_agent, created_at, last_activity, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7)
            RETURNING session_id
        `;

        const expiresAt = new Date(Date.now() + CONFIG.session.absoluteTimeout);

        await this.pool.query(query, [
            sessionId, userId, token, JSON.stringify(deviceInfo),
            deviceInfo.ip, deviceInfo.userAgent, expiresAt
        ]);

        console.log(`[SECURITY] Sesión creada para usuario ${userId}`);

        return {
            sessionId,
            token,
            expiresAt
        };
    }

    /**
     * Valida sesión
     */
    async validate(sessionId, token) {
        const query = `
            SELECT * FROM user_sessions
            WHERE session_id = $1 AND token = $2
        `;

        const result = await this.pool.query(query, [sessionId, token]);

        if (result.rows.length === 0) {
            return { valid: false, reason: 'SESSION_NOT_FOUND' };
        }

        const session = result.rows[0];
        const now = Date.now();

        // Verificar expiración absoluta
        if (new Date(session.expires_at).getTime() < now) {
            await this.destroy(sessionId);
            return { valid: false, reason: 'SESSION_EXPIRED' };
        }

        // Verificar timeout por inactividad
        const lastActivity = new Date(session.last_activity).getTime();
        if (now - lastActivity > CONFIG.session.idleTimeout) {
            await this.destroy(sessionId);
            return { valid: false, reason: 'SESSION_IDLE_TIMEOUT' };
        }

        // Actualizar última actividad
        await this._updateActivity(sessionId);

        // Rotar token si está configurado
        let newToken = token;
        if (CONFIG.session.rotateOnUse) {
            newToken = await this._rotateToken(sessionId);
        }

        return {
            valid: true,
            userId: session.user_id,
            newToken
        };
    }

    /**
     * Destruye sesión
     */
    async destroy(sessionId) {
        await this.pool.query(
            'DELETE FROM user_sessions WHERE session_id = $1',
            [sessionId]
        );
    }

    /**
     * Destruye todas las sesiones de un usuario
     */
    async destroyAll(userId) {
        await this.pool.query(
            'DELETE FROM user_sessions WHERE user_id = $1',
            [userId]
        );

        console.log(`[SECURITY] Todas las sesiones destruidas para usuario ${userId}`);
    }

    /**
     * Lista sesiones activas de un usuario
     */
    async listUserSessions(userId) {
        const query = `
            SELECT session_id, device_info, ip_address, user_agent, created_at, last_activity
            FROM user_sessions
            WHERE user_id = $1 AND expires_at > NOW()
            ORDER BY last_activity DESC
        `;

        const result = await this.pool.query(query, [userId]);
        return result.rows.map(row => ({
            ...row,
            device_info: typeof row.device_info === 'string' ? JSON.parse(row.device_info) : row.device_info
        }));
    }

    // Métodos privados

    _generateToken() {
        return crypto.randomBytes(64).toString('hex');
    }

    async _enforceSessionLimit(userId) {
        const countResult = await this.pool.query(
            'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1 AND expires_at > NOW()',
            [userId]
        );

        const count = parseInt(countResult.rows[0].count);

        if (count >= CONFIG.session.maxConcurrent) {
            // Eliminar sesión más antigua
            await this.pool.query(`
                DELETE FROM user_sessions
                WHERE session_id = (
                    SELECT session_id FROM user_sessions
                    WHERE user_id = $1
                    ORDER BY last_activity ASC
                    LIMIT 1
                )
            `, [userId]);
        }
    }

    async _updateActivity(sessionId) {
        await this.pool.query(
            'UPDATE user_sessions SET last_activity = NOW() WHERE session_id = $1',
            [sessionId]
        );
    }

    async _rotateToken(sessionId) {
        const newToken = this._generateToken();
        await this.pool.query(
            'UPDATE user_sessions SET token = $1 WHERE session_id = $2',
            [newToken, sessionId]
        );
        return newToken;
    }
}

// ============================================
// PASSWORD VALIDATOR
// ============================================
class PasswordValidator {
    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Valida fortaleza de contraseña
     */
    validate(password) {
        const errors = [];

        if (password.length < CONFIG.password.minLength) {
            errors.push(`Mínimo ${CONFIG.password.minLength} caracteres`);
        }

        if (CONFIG.password.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Requiere al menos una mayúscula');
        }

        if (CONFIG.password.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Requiere al menos una minúscula');
        }

        if (CONFIG.password.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Requiere al menos un número');
        }

        if (CONFIG.password.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
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

    /**
     * Verifica si contraseña fue usada anteriormente
     */
    async checkHistory(userId, password) {
        const query = `
            SELECT password_hash FROM password_history
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;

        const result = await this.pool.query(query, [userId, CONFIG.password.historyCount]);

        for (const row of result.rows) {
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

    /**
     * Guarda contraseña en historial
     */
    async saveToHistory(userId, passwordHash) {
        const query = `
            INSERT INTO password_history (user_id, password_hash, created_at)
            VALUES ($1, $2, NOW())
        `;

        await this.pool.query(query, [userId, passwordHash]);

        // Limpiar historial antiguo
        await this.pool.query(`
            DELETE FROM password_history
            WHERE user_id = $1 AND id NOT IN (
                SELECT id FROM password_history
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2
            )
        `, [userId, CONFIG.password.historyCount]);
    }

    /**
     * Verifica si contraseña necesita cambio
     */
    async needsChange(userId) {
        const query = `
            SELECT password_changed_at FROM usuarios WHERE id = $1
        `;

        const result = await this.pool.query(query, [userId]);
        if (result.rows.length === 0) return false;

        const lastChange = new Date(result.rows[0].password_changed_at).getTime();
        return Date.now() - lastChange > CONFIG.password.maxAge;
    }

    _calculateStrength(password) {
        let score = 0;

        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 2;

        if (score <= 2) return 'weak';
        if (score <= 4) return 'fair';
        if (score <= 6) return 'good';
        return 'strong';
    }
}

// ============================================
// MAIN SERVICE
// ============================================
class AdvancedSecurityService {
    constructor() {
        this.pool = null;
        this.twoFactor = null;
        this.rateLimiter = null;
        this.ids = null;
        this.sessionManager = null;
        this.passwordValidator = null;
        this.initialized = false;
    }

    /**
     * Inicializa el servicio
     */
    async initialize(pool) {
        if (this.initialized) return;

        this.pool = pool || new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });

        this.twoFactor = new TwoFactorAuth(this.pool);
        this.rateLimiter = new RateLimiter();
        this.ids = new IntrusionDetectionSystem(this.pool);
        this.sessionManager = new SessionManager(this.pool);
        this.passwordValidator = new PasswordValidator(this.pool);

        // Limpiar rate limiter periódicamente
        setInterval(() => this.rateLimiter.cleanup(), 60000);

        this.initialized = true;
        console.log('[SECURITY] Advanced Security Service inicializado');
    }

    // 2FA Methods
    async setup2FA(userId) {
        return this.twoFactor.setupTOTP(userId);
    }

    async enable2FA(userId, code) {
        return this.twoFactor.enableTOTP(userId, code);
    }

    async verify2FA(userId, code) {
        return this.twoFactor.verify(userId, code);
    }

    async disable2FA(userId, password) {
        return this.twoFactor.disable(userId, password);
    }

    async generateVerificationCode(userId, method) {
        return this.twoFactor.generateTemporaryCode(userId, method);
    }

    async verifyTemporaryCode(userId, code, method) {
        return this.twoFactor.verifyTemporaryCode(userId, code, method);
    }

    // Rate Limiting Methods
    checkRateLimit(key, windowType) {
        return this.rateLimiter.check(key, windowType);
    }

    resetRateLimit(key, windowType) {
        return this.rateLimiter.reset(key, windowType);
    }

    // IDS Methods
    analyzeRequest(request) {
        return this.ids.analyze(request);
    }

    recordFailedLogin(ip, userId) {
        return this.ids.recordFailedLogin(ip, userId);
    }

    clearFailedLogins(ip) {
        return this.ids.clearFailedLogins(ip);
    }

    unblockIP(ip) {
        return this.ids.unblockIP(ip);
    }

    getBlockedIPs() {
        return this.ids.getBlockedIPs();
    }

    // Session Methods
    async createSession(userId, deviceInfo) {
        return this.sessionManager.create(userId, deviceInfo);
    }

    async validateSession(sessionId, token) {
        return this.sessionManager.validate(sessionId, token);
    }

    async destroySession(sessionId) {
        return this.sessionManager.destroy(sessionId);
    }

    async destroyAllSessions(userId) {
        return this.sessionManager.destroyAll(userId);
    }

    async listSessions(userId) {
        return this.sessionManager.listUserSessions(userId);
    }

    // Password Methods
    validatePassword(password) {
        return this.passwordValidator.validate(password);
    }

    async checkPasswordHistory(userId, password) {
        return this.passwordValidator.checkHistory(userId, password);
    }

    async savePasswordToHistory(userId, passwordHash) {
        return this.passwordValidator.saveToHistory(userId, passwordHash);
    }

    async passwordNeedsChange(userId) {
        return this.passwordValidator.needsChange(userId);
    }
}

// ============================================
// EXPORT
// ============================================
const securityService = new AdvancedSecurityService();

module.exports = {
    AdvancedSecurityService,
    securityService,
    ServiceError
};
