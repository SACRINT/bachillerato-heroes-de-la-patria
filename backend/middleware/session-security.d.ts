/**
 * Middleware de autenticación con renovación automática
 */
export function authenticateWithRenewal(req: any, res: any, next: any): any;
/**
 * Middleware para refrescar access token con refresh token
 */
export function refreshAccessToken(req: any, res: any, next: any): any;
/**
 * Middleware para prevenir session fixation en login
 */
export function preventSessionFixation(req: any, res: any, next: any): void;
/**
 * Generar Access Token (corta duración)
 */
export function generateAccessToken(payload: any): never;
/**
 * Generar Refresh Token (larga duración)
 */
export function generateRefreshToken(payload: any): never;
/**
 * Verificar Access Token
 */
export function verifyAccessToken(token: any): string | jwt.JwtPayload;
/**
 * Verificar Refresh Token
 */
export function verifyRefreshToken(token: any): string | jwt.JwtPayload;
/**
 * Crear sesión nueva
 */
export function createSession(userId: any, metadata?: {}): string;
/**
 * Obtener sesión
 */
export function getSession(sessionId: any): any;
/**
 * Actualizar última actividad
 */
export function touchSession(sessionId: any): void;
/**
 * Invalidar sesión específica
 */
export function invalidateSession(sessionId: any): void;
/**
 * Invalidar todas las sesiones de un usuario
 */
export function invalidateUserSessions(userId: any): void;
/**
 * Limpiar sesiones inactivas
 */
export function cleanupInactiveSessions(): void;
/**
 * Limpiar sesiones viejas de un usuario (mantener solo las N más recientes)
 */
export function cleanupUserSessions(userId: any): void;
/**
 * Tarea programada para limpiar sesiones inactivas (ejecutar cada 5 minutos)
 */
export function startSessionCleanup(): void;
export namespace SESSION_CONFIG {
    let accessTokenExpiry: string;
    let refreshTokenExpiry: string;
    let autoRenewThreshold: number;
    let regenerateOnLogin: boolean;
    let regenerateOnPrivilegeChange: boolean;
    let activeSessions: Map<any, any>;
    let maxSessionsPerUser: number;
    let inactivityTimeout: number;
    let tokenHeader: string;
    let refreshTokenCookie: string;
}
import jwt = require("jsonwebtoken");
//# sourceMappingURL=session-security.d.ts.map