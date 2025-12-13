import * as crypto from 'crypto';
import { SECURITY_CONFIG } from './config';

// Interface provisional DAO
interface SecurityDAO {
    createSession(data: any): Promise<any>;
    validateSession(sessionId: string, token: string): Promise<any>; // Retorna la session o null
    destroySession(sessionId: string): Promise<any>;
    destroyAllUserSessions(userId: number | string): Promise<any>;
    listUserSessions(userId: number | string): Promise<any[]>;
    countActiveSessions(userId: number | string): Promise<number>;
    destroyOldestSessions(userId: number | string, limit: number): Promise<any>;
    updateSessionActivity(sessionId: string): Promise<any>;
    rotateSessionToken(sessionId: string, newToken: string): Promise<any>;
}

const securityDAO = require('../../data/security-advanced.dao') as SecurityDAO;

export class SessionService {
    async create(userId: number | string, deviceInfo: any = {}) {
        const sessionId = crypto.randomUUID();
        const token = this._generateToken();

        await this._enforceSessionLimit(userId);

        const expiresAt = new Date(Date.now() + SECURITY_CONFIG.session.absoluteTimeout);

        await securityDAO.createSession({
            userId,
            sessionId,
            tokenHash: token,
            deviceInfo,
            ipAddress: deviceInfo.ip,
            expiresAt
        });

        console.log(`[SECURITY] Sesión creada para usuario ${userId}`);

        return {
            sessionId,
            token,
            expiresAt
        };
    }

    async validate(sessionId: string, token: string) {
        const session = await securityDAO.validateSession(sessionId, token);

        if (!session) {
            return { valid: false, reason: 'SESSION_NOT_FOUND' };
        }

        const now = Date.now();

        if (new Date(session.expires_at).getTime() < now) {
            await this.destroy(sessionId);
            return { valid: false, reason: 'SESSION_EXPIRED' };
        }

        const lastActivity = new Date(session.last_activity).getTime();
        if (now - lastActivity > SECURITY_CONFIG.session.idleTimeout) {
            await this.destroy(sessionId);
            return { valid: false, reason: 'SESSION_IDLE_TIMEOUT' };
        }

        await this._updateActivity(sessionId);

        let newToken = token;
        if (SECURITY_CONFIG.session.rotateOnUse) {
            newToken = await this._rotateToken(sessionId);
        }

        return {
            valid: true,
            userId: session.user_id,
            newToken
        };
    }

    async destroy(sessionId: string) {
        await securityDAO.destroySession(sessionId);
    }

    async destroyAll(userId: number | string) {
        await securityDAO.destroyAllUserSessions(userId);
        console.log(`[SECURITY] Todas las sesiones destruidas para usuario ${userId}`);
    }

    async listUserSessions(userId: number | string) {
        const sessions = await securityDAO.listUserSessions(userId);
        return sessions.map(row => ({
            ...row,
            device_info: typeof row.device_info === 'string' ? JSON.parse(row.device_info) : row.device_info
        }));
    }

    private _generateToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    private async _enforceSessionLimit(userId: number | string) {
        const count = await securityDAO.countActiveSessions(userId);

        if (count >= SECURITY_CONFIG.session.maxConcurrent) {
            await securityDAO.destroyOldestSessions(userId, SECURITY_CONFIG.session.maxConcurrent);
        }
    }

    private async _updateActivity(sessionId: string) {
        await securityDAO.updateSessionActivity(sessionId);
    }

    private async _rotateToken(sessionId: string): Promise<string> {
        const newToken = this._generateToken();
        await securityDAO.rotateSessionToken(sessionId, newToken);
        return newToken;
    }
}
