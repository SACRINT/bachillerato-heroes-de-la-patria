"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntrusionDetectionService = void 0;
const config_1 = require("./config");
const securityDAO = require('../../data/security-advanced.dao');
class IntrusionDetectionService {
    constructor() {
        this.blockedIPs = new Map();
        this.failedAttempts = new Map();
    }
    analyze(request) {
        const { ip, path, body, query, headers } = request;
        if (this._isBlocked(ip)) {
            return {
                blocked: true,
                reason: 'IP bloqueada temporalmente'
            };
        }
        const threats = [];
        const dataToCheck = JSON.stringify({ path, body, query });
        for (const pattern of config_1.SECURITY_CONFIG.ids.suspiciousPatterns) {
            if (pattern.test(dataToCheck)) {
                threats.push({
                    type: 'SUSPICIOUS_PATTERN',
                    pattern: pattern.toString(),
                    severity: 'high'
                });
            }
        }
        const ua = headers['user-agent'] || '';
        if (!ua || ua.length < 10 || /curl|wget|scanner/i.test(ua)) {
            threats.push({
                type: 'SUSPICIOUS_USER_AGENT',
                severity: 'medium'
            });
        }
        if (/\.\.\/|\.\.\\/.test(path)) {
            threats.push({
                type: 'PATH_TRAVERSAL',
                severity: 'high'
            });
        }
        if (threats.length > 0) {
            this._logThreat(ip, threats);
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
    recordFailedLogin(ip, userId) {
        const key = `login:${ip}`;
        let attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        attempts.lastUserId = userId; // FIXED: Typo from original 'odafiUserId'
        this.failedAttempts.set(key, attempts);
        if (attempts.count >= config_1.SECURITY_CONFIG.ids.bruteForceThreshold) {
            this._blockIP(ip);
            const threat = {
                type: 'BRUTE_FORCE_DETECTED',
                severity: 'critical',
                attempts: attempts.count
            };
            this._logThreat(ip, [threat]);
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
    clearFailedLogins(ip) {
        const key = `login:${ip}`;
        this.failedAttempts.delete(key);
    }
    unblockIP(ip) {
        this.blockedIPs.delete(ip);
        this.failedAttempts.delete(`login:${ip}`);
        console.log(`[SECURITY] IP desbloqueada: ${ip}`);
    }
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
    _isBlocked(ip) {
        const blockData = this.blockedIPs.get(ip);
        if (!blockData)
            return false;
        if (Date.now() > blockData.until) {
            this.blockedIPs.delete(ip);
            return false;
        }
        return true;
    }
    _blockIP(ip) {
        this.blockedIPs.set(ip, {
            since: Date.now(),
            until: Date.now() + config_1.SECURITY_CONFIG.ids.blockDuration
        });
        console.log(`[SECURITY] IP bloqueada: ${ip}`);
    }
    async _logThreat(ip, threats) {
        try {
            await securityDAO.logSecurityThreat(ip, threats);
        }
        catch (err) {
            console.error('[SECURITY] Error logging threat:', err);
        }
    }
}
exports.IntrusionDetectionService = IntrusionDetectionService;
