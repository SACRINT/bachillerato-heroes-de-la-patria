export class JWTUtils {
    jwtSecret: string;
    algorithm: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    rememberMeExpiry: string;
    issuer: string;
    audience: string;
    tokenBlacklist: Set<any>;
    tokenAttempts: Map<any, any>;
    maxAttempts: number;
    attemptWindow: number;
    /**
     * Generar token de acceso
     */
    generateAccessToken(payload: any, options?: {}): never;
    /**
     * Generar refresh token
     */
    generateRefreshToken(payload: any, options?: {}): never;
    /**
     * Generar token "recordarme"
     */
    generateRememberMeToken(payload: any): never;
    /**
     * Verificar token
     */
    verifyToken(token: any, options?: {}): any;
    /**
     * Decodificar token sin verificar
     */
    decodeToken(token: any): jwt.Jwt;
    /**
     * Extraer token del header Authorization
     */
    extractTokenFromHeader(authHeader: any): any;
    /**
     * Validar estructura del token
     */
    validateTokenStructure(token: any): boolean;
    /**
     * Agregar token a blacklist
     */
    blacklistToken(token: any): boolean;
    /**
     * Verificar si token está en blacklist
     */
    isTokenBlacklisted(token: any): boolean;
    /**
     * Aplicar rate limiting para intentos de verificación
     */
    applyRateLimit(token: any): void;
    /**
     * Registrar intento fallido
     */
    recordFailedAttempt(token: any): void;
    /**
     * Generar par de tokens (access + refresh)
     */
    generateTokenPair(userPayload: any, rememberMe?: boolean): {
        accessToken: never;
        refreshToken: never;
        accessTokenExpiry: any;
        refreshTokenExpiry: any;
        tokenType: string;
    };
    /**
     * Renovar par de tokens
     */
    renewTokenPair(refreshToken: any): {
        accessToken: never;
        refreshToken: never;
        accessTokenExpiry: any;
        refreshTokenExpiry: any;
        tokenType: string;
    };
    /**
     * Obtener información del token
     */
    getTokenInfo(token: any): {
        type: any;
        userId: any;
        email: any;
        role: any;
        issuedAt: Date;
        expiresAt: Date;
        issuer: any;
        audience: any;
        subject: string | (() => string);
        jwtId: any;
        isExpired: boolean;
        isBlacklisted: boolean;
    };
    /**
     * Limpiar blacklist y contadores expirados
     */
    cleanup(): void;
    /**
     * Estadísticas del sistema JWT
     */
    getStats(): {
        blacklistedTokens: number;
        activeAttempts: number;
        settings: {
            accessTokenExpiry: string;
            refreshTokenExpiry: string;
            rememberMeExpiry: string;
            maxAttempts: number;
            attemptWindow: number;
        };
    };
}
export function getJWTUtils(): any;
import jwt = require("jsonwebtoken");
//# sourceMappingURL=jwtUtils.d.ts.map