import { SECURITY_CONFIG } from './config';

// Interface provisional para el DAO
interface SecurityDAO {
    logSecurityThreat(ip: string, threats: any): Promise<any>;
}

const securityDAO = require('../../data/security-advanced.dao') as SecurityDAO;

interface IDSRequest {
    ip: string;
    path: string;
    body: any;
    query: any;
    headers: any;
}

interface Threat {
    type: string;
    pattern?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    attempts?: number;
}

interface IDSResult {
    blocked: boolean;
    reason?: string;
    threats?: Threat[];
    attempts?: number;
}

export class IntrusionDetectionService {
    private blockedIPs = new Map<string, { since: number; until: number }>();
    private failedAttempts = new Map<string, { count: number; firstAttempt: number, lastAttempt?: number, lastUserId?: string | number }>();

    analyze(request: IDSRequest): IDSResult {
        const { ip, path, body, query, headers } = request;

        if (this._isBlocked(ip)) {
            return {
                blocked: true,
                reason: 'IP bloqueada temporalmente'
            };
        }

        const threats: Threat[] = [];

        const dataToCheck = JSON.stringify({ path, body, query });
        for (const pattern of SECURITY_CONFIG.ids.suspiciousPatterns) {
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

    recordFailedLogin(ip: string, userId: string | number): IDSResult {
        const key = `login:${ip}`;
        let attempts = this.failedAttempts.get(key) || { count: 0, firstAttempt: Date.now() };

        attempts.count++;
        attempts.lastAttempt = Date.now();
        attempts.lastUserId = userId; // FIXED: Typo from original 'odafiUserId'

        this.failedAttempts.set(key, attempts);

        if (attempts.count >= SECURITY_CONFIG.ids.bruteForceThreshold) {
            this._blockIP(ip);
            const threat: Threat = {
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

    clearFailedLogins(ip: string): void {
        const key = `login:${ip}`;
        this.failedAttempts.delete(key);
    }

    unblockIP(ip: string): void {
        this.blockedIPs.delete(ip);
        this.failedAttempts.delete(`login:${ip}`);
        console.log(`[SECURITY] IP desbloqueada: ${ip}`);
    }

    getBlockedIPs(): any[] {
        const blocked: any[] = [];
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

    private _isBlocked(ip: string): boolean {
        const blockData = this.blockedIPs.get(ip);
        if (!blockData) return false;

        if (Date.now() > blockData.until) {
            this.blockedIPs.delete(ip);
            return false;
        }
        return true;
    }

    private _blockIP(ip: string): void {
        this.blockedIPs.set(ip, {
            since: Date.now(),
            until: Date.now() + SECURITY_CONFIG.ids.blockDuration
        });
        console.log(`[SECURITY] IP bloqueada: ${ip}`);
    }

    private async _logThreat(ip: string, threats: any[]): Promise<void> {
        try {
            await securityDAO.logSecurityThreat(ip, threats);
        } catch (err) {
            console.error('[SECURITY] Error logging threat:', err);
        }
    }
}
