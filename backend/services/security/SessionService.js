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
exports.SessionService = void 0;
const crypto = __importStar(require("crypto"));
const config_1 = require("./config");
const securityDAO = require('../../data/security-advanced.dao');
class SessionService {
    async create(userId, deviceInfo = {}) {
        const sessionId = crypto.randomUUID();
        const token = this._generateToken();
        await this._enforceSessionLimit(userId);
        const expiresAt = new Date(Date.now() + config_1.SECURITY_CONFIG.session.absoluteTimeout);
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
    async validate(sessionId, token) {
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
        if (now - lastActivity > config_1.SECURITY_CONFIG.session.idleTimeout) {
            await this.destroy(sessionId);
            return { valid: false, reason: 'SESSION_IDLE_TIMEOUT' };
        }
        await this._updateActivity(sessionId);
        let newToken = token;
        if (config_1.SECURITY_CONFIG.session.rotateOnUse) {
            newToken = await this._rotateToken(sessionId);
        }
        return {
            valid: true,
            userId: session.user_id,
            newToken
        };
    }
    async destroy(sessionId) {
        await securityDAO.destroySession(sessionId);
    }
    async destroyAll(userId) {
        await securityDAO.destroyAllUserSessions(userId);
        console.log(`[SECURITY] Todas las sesiones destruidas para usuario ${userId}`);
    }
    async listUserSessions(userId) {
        const sessions = await securityDAO.listUserSessions(userId);
        return sessions.map(row => ({
            ...row,
            device_info: typeof row.device_info === 'string' ? JSON.parse(row.device_info) : row.device_info
        }));
    }
    _generateToken() {
        return crypto.randomBytes(64).toString('hex');
    }
    async _enforceSessionLimit(userId) {
        const count = await securityDAO.countActiveSessions(userId);
        if (count >= config_1.SECURITY_CONFIG.session.maxConcurrent) {
            await securityDAO.destroyOldestSessions(userId, config_1.SECURITY_CONFIG.session.maxConcurrent);
        }
    }
    async _updateActivity(sessionId) {
        await securityDAO.updateSessionActivity(sessionId);
    }
    async _rotateToken(sessionId) {
        const newToken = this._generateToken();
        await securityDAO.rotateSessionToken(sessionId, newToken);
        return newToken;
    }
}
exports.SessionService = SessionService;
