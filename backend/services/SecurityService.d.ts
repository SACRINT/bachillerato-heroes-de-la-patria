declare const _exports: SecurityService;
export = _exports;
declare class SecurityService {
    config: {
        bcryptRounds: number;
        tokenLength: number;
        otpLength: number;
        otpExpiry: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
        sessionTimeout: number;
        passwordMinLength: number;
        passwordMaxAge: number;
    };
    loginAttempts: Map<any, any>;
    temporaryTokens: Map<any, any>;
    blockedIPs: Set<any>;
    attackPatterns: {
        sqlInjection: RegExp;
        xss: RegExp;
        pathTraversal: RegExp;
        commandInjection: RegExp;
    };
    /**
     * Hash de contraseña con bcrypt
     */
    hashPassword(password: any): Promise<string>;
    /**
     * Verificar contraseña
     */
    verifyPassword(password: any, hash: any): Promise<boolean>;
    /**
     * Generar token aleatorio seguro
     */
    generateSecureToken(length?: number): string;
    /**
     * Generar OTP numérico
     */
    generateOTP(length?: number): string;
    /**
     * Hash SHA-256
     */
    sha256(data: any): string;
    /**
     * HMAC para firmas
     */
    hmac(data: any, secret: any): string;
    /**
     * Encriptar datos con AES-256
     */
    encrypt(text: any, key: any): string;
    /**
     * Desencriptar datos AES-256
     */
    decrypt(encryptedText: any, key: any): string;
    /**
     * Validar fortaleza de contraseña
     */
    validatePasswordStrength(password: any): {
        valid: boolean;
        errors: string[];
        strength: {
            score: number;
            level: string;
        };
    };
    /**
     * Detectar patrones de ataque en input
     */
    detectAttackPatterns(input: any): any[];
    /**
     * Sanitizar input básico
     */
    sanitizeInput(input: any): any;
    /**
     * Validar y sanitizar email
     */
    validateEmail(email: any): {
        valid: boolean;
        sanitized: any;
    };
    /**
     * Registrar intento de login fallido
     */
    recordFailedLogin(identifier: any): {
        blocked: boolean;
        lockoutUntil: number;
        message: string;
        attemptsRemaining?: undefined;
    } | {
        blocked: boolean;
        attemptsRemaining: number;
        lockoutUntil?: undefined;
        message?: undefined;
    };
    /**
     * Verificar si está bloqueado
     */
    isLocked(identifier: any): false | {
        locked: boolean;
        remainingTime: number;
    } | {
        locked: boolean;
        remainingTime?: undefined;
    };
    /**
     * Resetear intentos de login
     */
    resetLoginAttempts(identifier: any): void;
    /**
     * Bloquear IP
     */
    blockIP(ip: any, reason?: string): boolean;
    /**
     * Desbloquear IP
     */
    unblockIP(ip: any): boolean;
    /**
     * Verificar si IP está bloqueada
     */
    isIPBlocked(ip: any): boolean;
    /**
     * Crear token temporal
     */
    createTemporaryToken(userId: any, type: any, expirySeconds?: number): string;
    /**
     * Verificar token temporal
     */
    verifyTemporaryToken(userId: any, type: any, token: any): {
        valid: boolean;
        error: string;
    } | {
        valid: boolean;
        error?: undefined;
    };
    /**
     * Generar fingerprint del navegador
     */
    generateFingerprint(req: any): string;
    /**
     * Validar consistencia de sesión
     */
    validateSessionConsistency(session: any, req: any): boolean;
    /**
     * Generar token CSRF
     */
    generateCSRFToken(): string;
    /**
     * Verificar token CSRF
     */
    verifyCSRFToken(token: any, storedToken: any): boolean;
    /**
     * Obtener estadísticas de seguridad
     */
    getStats(): {
        blockedIPs: number;
        activeLoginTracking: number;
        pendingTokens: number;
        config: {
            maxLoginAttempts: number;
            lockoutDuration: number;
            passwordMinLength: number;
        };
    };
    /**
     * Limpiar datos expirados
     */
    cleanup(): number;
    /**
     * Verificar si contraseña necesita renovación
     */
    passwordNeedsRenewal(lastChanged: any): boolean;
    /**
     * Generar contraseña aleatoria segura
     */
    generateRandomPassword(length?: number): string;
}
//# sourceMappingURL=SecurityService.d.ts.map