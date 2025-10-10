/**
 * 🔐 UTILIDADES JWT - BGE HÉROES DE LA PATRIA
 * Funciones auxiliares para manejo de tokens JWT
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTUtils {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'heroes_patria_secret_2024';
        this.algorithm = 'HS256';

        // Configuraciones de tiempo
        this.accessTokenExpiry = process.env.JWT_EXPIRY || '1h';
        this.refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '7d';
        this.rememberMeExpiry = process.env.REMEMBER_ME_EXPIRY || '30d';

        // Configuración de emisor
        this.issuer = 'bge-heroes-patria';
        this.audience = 'bge-users';

        // Blacklist de tokens (en memoria, en producción usar Redis)
        this.tokenBlacklist = new Set();

        // Rate limiting para tokens
        this.tokenAttempts = new Map();
        this.maxAttempts = 5;
        this.attemptWindow = 15 * 60 * 1000; // 15 minutos
    }

    /**
     * Generar token de acceso
     */
    generateAccessToken(payload, options = {}) {
        const defaultPayload = {
            type: 'access',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID() // JWT ID único
        };

        const tokenPayload = {
            ...defaultPayload,
            ...payload
        };

        const defaultOptions = {
            expiresIn: this.accessTokenExpiry,
            issuer: this.issuer,
            audience: this.audience,
            subject: payload.userId?.toString(),
            algorithm: this.algorithm
        };

        return jwt.sign(tokenPayload, this.jwtSecret, {
            ...defaultOptions,
            ...options
        });
    }

    /**
     * Generar refresh token
     */
    generateRefreshToken(payload, options = {}) {
        const defaultPayload = {
            type: 'refresh',
            iat: Math.floor(Date.now() / 1000),
            jti: crypto.randomUUID()
        };

        const tokenPayload = {
            userId: payload.userId,
            email: payload.email,
            ...defaultPayload
        };

        const defaultOptions = {
            expiresIn: this.refreshTokenExpiry,
            issuer: this.issuer,
            audience: this.audience,
            subject: payload.userId?.toString(),
            algorithm: this.algorithm
        };

        return jwt.sign(tokenPayload, this.jwtSecret, {
            ...defaultOptions,
            ...options
        });
    }

    /**
     * Generar token "recordarme"
     */
    generateRememberMeToken(payload) {
        return this.generateRefreshToken(payload, {
            expiresIn: this.rememberMeExpiry
        });
    }

    /**
     * Verificar token
     */
    verifyToken(token, options = {}) {
        try {
            // Verificar si está en blacklist
            if (this.isTokenBlacklisted(token)) {
                throw new Error('Token revocado');
            }

            // Aplicar rate limiting
            this.applyRateLimit(token);

            const defaultOptions = {
                issuer: this.issuer,
                audience: this.audience,
                algorithms: [this.algorithm]
            };

            const decoded = jwt.verify(token, this.jwtSecret, {
                ...defaultOptions,
                ...options
            });

            // Verificar que no esté cerca de expirar (renovar automáticamente)
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = decoded.exp - now;

            return {
                ...decoded,
                shouldRefresh: timeUntilExpiry < 300, // Menos de 5 minutos
                timeUntilExpiry
            };

        } catch (error) {
            this.recordFailedAttempt(token);
            throw new Error(`Token inválido: ${error.message}`);
        }
    }

    /**
     * Decodificar token sin verificar
     */
    decodeToken(token) {
        try {
            return jwt.decode(token, { complete: true });
        } catch (error) {
            throw new Error(`Error decodificando token: ${error.message}`);
        }
    }

    /**
     * Extraer token del header Authorization
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            throw new Error('Header de autorización requerido');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new Error('Formato de token inválido. Use: Bearer <token>');
        }

        return parts[1];
    }

    /**
     * Validar estructura del token
     */
    validateTokenStructure(token) {
        if (!token || typeof token !== 'string') {
            throw new Error('Token debe ser una cadena válida');
        }

        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Token JWT debe tener 3 partes');
        }

        return true;
    }

    /**
     * Agregar token a blacklist
     */
    blacklistToken(token) {
        try {
            const decoded = this.decodeToken(token);
            const tokenId = decoded.payload.jti || token;

            this.tokenBlacklist.add(tokenId);

            // Programar limpieza automática cuando expire
            if (decoded.payload.exp) {
                const expiryTime = decoded.payload.exp * 1000;
                const timeUntilExpiry = expiryTime - Date.now();

                if (timeUntilExpiry > 0) {
                    setTimeout(() => {
                        this.tokenBlacklist.delete(tokenId);
                    }, timeUntilExpiry);
                }
            }

            console.log(`🚫 Token agregado a blacklist: ${tokenId}`);
            return true;
        } catch (error) {
            console.error('❌ Error agregando token a blacklist:', error);
            return false;
        }
    }

    /**
     * Verificar si token está en blacklist
     */
    isTokenBlacklisted(token) {
        try {
            const decoded = this.decodeToken(token);
            const tokenId = decoded.payload.jti || token;
            return this.tokenBlacklist.has(tokenId);
        } catch {
            return this.tokenBlacklist.has(token);
        }
    }

    /**
     * Aplicar rate limiting para intentos de verificación
     */
    applyRateLimit(token) {
        const tokenHash = crypto.createHash('sha256').update(token.substring(0, 50)).digest('hex');
        const now = Date.now();

        if (!this.tokenAttempts.has(tokenHash)) {
            this.tokenAttempts.set(tokenHash, { count: 1, firstAttempt: now });
            return;
        }

        const attempts = this.tokenAttempts.get(tokenHash);

        // Si ha pasado la ventana de tiempo, reiniciar contador
        if (now - attempts.firstAttempt > this.attemptWindow) {
            this.tokenAttempts.set(tokenHash, { count: 1, firstAttempt: now });
            return;
        }

        // Incrementar contador
        attempts.count++;

        if (attempts.count > this.maxAttempts) {
            throw new Error('Demasiados intentos de verificación. Intenta más tarde.');
        }
    }

    /**
     * Registrar intento fallido
     */
    recordFailedAttempt(token) {
        const tokenHash = crypto.createHash('sha256').update(token.substring(0, 50)).digest('hex');
        const now = Date.now();

        if (!this.tokenAttempts.has(tokenHash)) {
            this.tokenAttempts.set(tokenHash, { count: 1, firstAttempt: now, failures: 1 });
        } else {
            const attempts = this.tokenAttempts.get(tokenHash);
            attempts.failures = (attempts.failures || 0) + 1;
        }
    }

    /**
     * Generar par de tokens (access + refresh)
     */
    generateTokenPair(userPayload, rememberMe = false) {
        const accessToken = this.generateAccessToken(userPayload);

        const refreshToken = rememberMe
            ? this.generateRememberMeToken(userPayload)
            : this.generateRefreshToken(userPayload);

        const accessDecoded = this.decodeToken(accessToken);
        const refreshDecoded = this.decodeToken(refreshToken);

        return {
            accessToken,
            refreshToken,
            accessTokenExpiry: accessDecoded.payload.exp,
            refreshTokenExpiry: refreshDecoded.payload.exp,
            tokenType: 'Bearer'
        };
    }

    /**
     * Renovar par de tokens
     */
    renewTokenPair(refreshToken) {
        const decoded = this.verifyToken(refreshToken);

        if (decoded.type !== 'refresh') {
            throw new Error('Token de refresh requerido');
        }

        // Blacklist el refresh token usado
        this.blacklistToken(refreshToken);

        // Generar nuevo par
        const userPayload = {
            userId: decoded.userId,
            email: decoded.email,
            username: decoded.username,
            role: decoded.role,
            permissions: decoded.permissions
        };

        return this.generateTokenPair(userPayload);
    }

    /**
     * Obtener información del token
     */
    getTokenInfo(token) {
        try {
            const decoded = this.decodeToken(token);
            const payload = decoded.payload;

            return {
                type: payload.type,
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                issuedAt: new Date(payload.iat * 1000),
                expiresAt: new Date(payload.exp * 1000),
                issuer: payload.iss,
                audience: payload.aud,
                subject: payload.sub,
                jwtId: payload.jti,
                isExpired: payload.exp < Math.floor(Date.now() / 1000),
                isBlacklisted: this.isTokenBlacklisted(token)
            };
        } catch (error) {
            throw new Error(`Error obteniendo información del token: ${error.message}`);
        }
    }

    /**
     * Limpiar blacklist y contadores expirados
     */
    cleanup() {
        const now = Date.now();

        // Limpiar intentos expirados
        for (const [key, value] of this.tokenAttempts.entries()) {
            if (now - value.firstAttempt > this.attemptWindow) {
                this.tokenAttempts.delete(key);
            }
        }

        console.log('🧹 Limpieza de JWT Utils completada');
    }

    /**
     * Estadísticas del sistema JWT
     */
    getStats() {
        return {
            blacklistedTokens: this.tokenBlacklist.size,
            activeAttempts: this.tokenAttempts.size,
            settings: {
                accessTokenExpiry: this.accessTokenExpiry,
                refreshTokenExpiry: this.refreshTokenExpiry,
                rememberMeExpiry: this.rememberMeExpiry,
                maxAttempts: this.maxAttempts,
                attemptWindow: this.attemptWindow
            }
        };
    }
}

// Singleton para mantener estado
let jwtUtilsInstance = null;

function getJWTUtils() {
    if (!jwtUtilsInstance) {
        jwtUtilsInstance = new JWTUtils();

        // Programar limpieza automática cada hora
        setInterval(() => {
            jwtUtilsInstance.cleanup();
        }, 60 * 60 * 1000);
    }
    return jwtUtilsInstance;
}

module.exports = {
    JWTUtils,
    getJWTUtils
};