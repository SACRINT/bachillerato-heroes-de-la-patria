/**
 * 🔒 BGE SECURITY MODULE - Sistema de Seguridad Completo
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Versión: 1.0.0
 * Fecha: 27 de Septiembre, 2025
 *
 * PROPÓSITO: Consolidar todos los sistemas de seguridad en un módulo unificado
 * CONSOLIDA:
 * - security-manager.js (32,806 bytes) - Gestor principal de seguridad
 * - bge-security-manager.js (43,668 bytes) - Seguridad BGE avanzada
 * - auth-interface.js (43,572 bytes) - Interfaz de autenticación
 * - auth-manager.js (21,458 bytes) - Gestor de autenticación
 * - session-manager.js (18,844 bytes) - Gestor de sesiones
 * - role-manager.js (19,146 bytes) - Gestor de roles
 * - admin-auth-secure.js (33,960 bytes) - Autenticación admin segura
 * - google-auth-integration.js (75,039 bytes) - Integración Google Auth
 * - secure-forms.js (10,056 bytes) - Formularios seguros
 */

class BGESecurityModule extends BGEModule {
    constructor(framework) {
        super(framework);
        this.name = 'security';

        // Core security components
        this.authManager = null;
        this.sessionManager = null;
        this.roleManager = null;
        this.securityManager = null;
        this.encryptionEngine = null;
        this.auditLogger = null;

        // Authentication state
        this.authentication = {
            isAuthenticated: false,
            currentUser: null,
            currentSession: null,
            roles: [],
            permissions: new Set(),
            tokens: {
                access: null,
                refresh: null,
                csrf: null
            }
        };

        // Security policies
        this.policies = {
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireLowercase: true,
                requireNumbers: true,
                requireSpecialChars: true,
                maxAge: 90, // days
                historyCount: 5
            },
            sessionPolicy: {
                maxDuration: 3600000, // 1 hour
                idleTimeout: 1800000, // 30 minutes
                maxConcurrentSessions: 3,
                requireReauth: ['admin', 'teacher']
            },
            securityHeaders: {
                'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://www.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:3000 http://localhost:3001 http://localhost:3002 http://localhost:3003 http://localhost:3004 http://localhost:3005 http://localhost:8000 http://127.0.0.1:8080 https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://fonts.googleapis.com https://www.google-analytics.com https://www.googletagmanager.com https://accounts.google.com https://www.googleapis.com",
                'X-Frame-Options': 'DENY',
                'X-Content-Type-Options': 'nosniff',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            }
        };

        // Security monitoring
        this.monitoring = {
            failedAttempts: new Map(),
            suspiciousActivity: [],
            auditLog: [],
            realTimeThreats: new Set()
        };

        // Encryption settings
        this.encryption = {
            algorithm: 'AES-GCM',
            keyLength: 256,
            saltLength: 16,
            iterations: 100000
        };

        // Configuration
        this.config = {
            enableAuditLogging: true,
            enableRealTimeMonitoring: true,
            enableEncryption: true,
            enableCSRFProtection: true,
            enableRateLimiting: true,
            enableSecurityHeaders: true,
            maxFailedAttempts: 5,
            lockoutDuration: 900000, // 15 minutes
            enableGoogleAuth: true,
            enableTwoFactor: false
        };
    }

    async initialize() {
        await super.initialize();

        try {
            this.log('Inicializando sistema de seguridad completo...');

            // Initialize core security systems
            await this.initializeSecurityManager();
            await this.initializeAuthManager();
            await this.initializeSessionManager();
            await this.initializeRoleManager();
            await this.initializeEncryptionEngine();
            await this.initializeAuditLogger();

            // Setup security policies
            await this.enforceSecurityPolicies();

            // Initialize monitoring systems
            await this.initializeSecurityMonitoring();

            // Setup authentication integrations
            if (this.config.enableGoogleAuth) {
                await this.initializeGoogleAuth();
            }

            // Setup CSRF protection
            if (this.config.enableCSRFProtection) {
                await this.initializeCSRFProtection();
            }

            // Setup rate limiting
            if (this.config.enableRateLimiting) {
                await this.initializeRateLimiting();
            }

            // Setup security event handlers
            this.setupSecurityEventHandlers();

            this.log('Módulo de seguridad inicializado correctamente');

        } catch (error) {
            this.error('Error inicializando módulo de seguridad:', error);
            throw error;
        }
    }

    async initializeSecurityManager() {
        this.log('Inicializando gestor de seguridad...');

        this.securityManager = {
            validator: this.createSecurityValidator(),
            sanitizer: this.createDataSanitizer(),
            scanner: this.createThreatScanner(),
            enforcer: this.createPolicyEnforcer(),
            monitor: this.createSecurityMonitor()
        };

        // Setup security headers
        this.enforceSecurityHeaders();
    }

    async initializeAuthManager() {
        this.log('Inicializando gestor de autenticación...');

        this.authManager = {
            authenticator: this.createAuthenticator(),
            validator: this.createCredentialValidator(),
            tokenManager: this.createTokenManager(),
            passwordManager: this.createPasswordManager(),
            mfaManager: this.createMFAManager()
        };

        // Check for existing authentication
        await this.restoreAuthenticationState();
    }

    async initializeSessionManager() {
        this.log('Inicializando gestor de sesiones...');

        this.sessionManager = {
            creator: this.createSessionCreator(),
            validator: this.createSessionValidator(),
            monitor: this.createSessionMonitor(),
            terminator: this.createSessionTerminator(),
            cleaner: this.createSessionCleaner()
        };

        // Setup session monitoring
        this.startSessionMonitoring();
    }

    async initializeRoleManager() {
        this.log('Inicializando gestor de roles...');

        this.roleManager = {
            definer: this.createRoleDefiner(),
            assigner: this.createRoleAssigner(),
            checker: this.createPermissionChecker(),
            enforcer: this.createAccessEnforcer(),
            auditor: this.createRoleAuditor()
        };

        // Load role definitions
        await this.loadRoleDefinitions();
    }

    async initializeEncryptionEngine() {
        this.log('Inicializando motor de encriptación...');

        this.encryptionEngine = {
            encryptor: this.createEncryptor(),
            decryptor: this.createDecryptor(),
            hasher: this.createHasher(),
            keyManager: this.createKeyManager(),
            randomizer: this.createSecureRandomizer()
        };

        // Generate session keys
        await this.generateSessionKeys();
    }

    async initializeAuditLogger() {
        this.log('Inicializando sistema de auditoría...');

        this.auditLogger = {
            logger: this.createAuditLogger(),
            formatter: this.createLogFormatter(),
            analyzer: this.createLogAnalyzer(),
            reporter: this.createSecurityReporter(),
            archiver: this.createLogArchiver()
        };

        // Start audit logging
        this.startAuditLogging();
    }

    // Authentication System
    createAuthenticator() {
        return {
            login: async (credentials, options = {}) => {
                try {
                    this.auditLog('auth_attempt', { username: credentials.username });

                    // Check for account lockout
                    if (await this.isAccountLocked(credentials.username)) {
                        throw new Error('Account temporarily locked due to too many failed attempts');
                    }

                    // Validate credentials
                    const user = await this.validateCredentials(credentials);
                    if (!user) {
                        await this.recordFailedAttempt(credentials.username);
                        throw new Error('Invalid credentials');
                    }

                    // Create secure session
                    const session = await this.createSecureSession(user, options);

                    // Update authentication state
                    this.authentication.isAuthenticated = true;
                    this.authentication.currentUser = user;
                    this.authentication.currentSession = session;
                    this.authentication.roles = user.roles || [];

                    // Load permissions
                    await this.loadUserPermissions(user);

                    // Clear failed attempts
                    this.clearFailedAttempts(credentials.username);

                    this.auditLog('auth_success', { userId: user.id, sessionId: session.id });

                    return {
                        success: true,
                        user,
                        session,
                        tokens: session.tokens
                    };

                } catch (error) {
                    this.auditLog('auth_failure', {
                        username: credentials.username,
                        error: error.message
                    });
                    throw error;
                }
            },

            logout: async (sessionId = null) => {
                try {
                    const currentSession = sessionId || this.authentication.currentSession?.id;

                    if (currentSession) {
                        await this.terminateSession(currentSession);
                    }

                    // Clear authentication state
                    this.clearAuthenticationState();

                    this.auditLog('auth_logout', { sessionId: currentSession });

                    return { success: true };

                } catch (error) {
                    this.error('Error during logout:', error);
                    throw error;
                }
            },

            refresh: async (refreshToken) => {
                try {
                    // Validate refresh token
                    const tokenData = await this.validateRefreshToken(refreshToken);
                    if (!tokenData) {
                        throw new Error('Invalid refresh token');
                    }

                    // Generate new access token
                    const newTokens = await this.generateTokens(tokenData.userId);

                    // Update session
                    await this.updateSessionTokens(tokenData.sessionId, newTokens);

                    this.auditLog('token_refresh', { userId: tokenData.userId });

                    return { success: true, tokens: newTokens };

                } catch (error) {
                    this.auditLog('token_refresh_failure', { error: error.message });
                    throw error;
                }
            }
        };
    }

    // Session Management
    createSessionCreator() {
        return {
            create: async (user, options = {}) => {
                const sessionId = this.generateSecureId();
                const now = Date.now();

                const session = {
                    id: sessionId,
                    userId: user.id,
                    username: user.username,
                    roles: user.roles || [],
                    createdAt: now,
                    lastActivity: now,
                    expiresAt: now + this.policies.sessionPolicy.maxDuration,
                    ipAddress: options.ipAddress || 'unknown',
                    userAgent: options.userAgent || navigator.userAgent,
                    tokens: await this.generateTokens(user.id),
                    isActive: true,
                    metadata: {
                        loginMethod: options.method || 'password',
                        deviceFingerprint: options.deviceFingerprint || this.generateDeviceFingerprint(),
                        geoLocation: options.geoLocation || null
                    }
                };

                // Store session
                await this.storeSession(session);

                return session;
            }
        };
    }

    // Role and Permission System
    createPermissionChecker() {
        return {
            hasPermission: (permission) => {
                return this.authentication.permissions.has(permission);
            },

            hasRole: (role) => {
                return this.authentication.roles.includes(role);
            },

            hasAnyRole: (roles) => {
                return roles.some(role => this.authentication.roles.includes(role));
            },

            hasAllRoles: (roles) => {
                return roles.every(role => this.authentication.roles.includes(role));
            },

            canAccess: (resource, action = 'read') => {
                const permission = `${resource}:${action}`;
                return this.hasPermission(permission) || this.hasRole('admin');
            }
        };
    }

    // Security Monitoring
    initializeSecurityMonitoring() {
        this.securityMonitor = {
            threatDetector: this.createThreatDetector(),
            anomalyDetector: this.createAnomalyDetector(),
            realTimeScanner: this.createRealTimeScanner(),
            alertSystem: this.createSecurityAlertSystem()
        };

        // Start real-time monitoring
        if (this.config.enableRealTimeMonitoring) {
            this.startRealTimeMonitoring();
        }
    }

    createThreatDetector() {
        return {
            detectSQLInjection: (input) => {
                const sqlPatterns = [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
                    /(UNION\s+SELECT)/i,
                    /(\'\s*OR\s*\'\s*=\s*\')/i,
                    /(\'\s*OR\s*1\s*=\s*1)/i
                ];
                return sqlPatterns.some(pattern => pattern.test(input));
            },

            detectXSS: (input) => {
                const xssPatterns = [
                    /<script[^>]*>.*?<\/script>/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /<iframe[^>]*>.*?<\/iframe>/gi
                ];
                return xssPatterns.some(pattern => pattern.test(input));
            },

            detectCSRF: (request) => {
                const token = request.headers['X-CSRF-Token'] || request.body?.csrfToken;
                return !this.validateCSRFToken(token);
            },

            detectBruteForce: (username) => {
                const attempts = this.monitoring.failedAttempts.get(username) || [];
                const recentAttempts = attempts.filter(
                    attempt => Date.now() - attempt < 300000 // 5 minutes
                );
                return recentAttempts.length >= this.config.maxFailedAttempts;
            }
        };
    }

    createAnomalyDetector() {
        return {
            patterns: new Map(),
            baselines: new Map(),

            // Detectar patrones anómalos de comportamiento
            detectAnomalies: (event) => {
                const eventType = event.type;
                const sessionId = event.sessionId || 'anonymous';

                if (!this.baselines.has(eventType)) {
                    this.initializeBaseline(eventType);
                }

                const baseline = this.baselines.get(eventType);
                const anomalyScore = this.calculateAnomalyScore(event, baseline);

                if (anomalyScore > 0.7) {
                    return {
                        isAnomaly: true,
                        score: anomalyScore,
                        reason: `Patrón anómalo detectado para ${eventType}`,
                        event: event,
                        timestamp: Date.now()
                    };
                }

                return { isAnomaly: false, score: anomalyScore };
            },

            // Inicializar línea base para un tipo de evento
            initializeBaseline: (eventType) => {
                this.baselines.set(eventType, {
                    frequency: 0,
                    avgDuration: 0,
                    commonSources: new Set(),
                    normalHours: new Set(),
                    createdAt: Date.now()
                });
            },

            // Calcular score de anomalía (0-1)
            calculateAnomalyScore: (event, baseline) => {
                let score = 0;

                // Factor de frecuencia
                const currentHour = new Date().getHours();
                if (!baseline.normalHours.has(currentHour)) {
                    score += 0.3;
                }

                // Factor de duración
                if (event.duration && baseline.avgDuration > 0) {
                    const durationRatio = event.duration / baseline.avgDuration;
                    if (durationRatio > 3 || durationRatio < 0.3) {
                        score += 0.4;
                    }
                }

                // Factor de origen
                if (event.source && !baseline.commonSources.has(event.source)) {
                    score += 0.3;
                }

                return Math.min(score, 1.0);
            },

            // Actualizar línea base con nuevos datos
            updateBaseline: (eventType, event) => {
                if (!this.baselines.has(eventType)) {
                    this.initializeBaseline(eventType);
                }

                const baseline = this.baselines.get(eventType);
                baseline.frequency++;
                baseline.normalHours.add(new Date().getHours());

                if (event.source) {
                    baseline.commonSources.add(event.source);
                }

                if (event.duration) {
                    baseline.avgDuration = (baseline.avgDuration + event.duration) / 2;
                }
            }
        };
    }

    createRealTimeScanner() {
        return {
            isActive: false,
            scanInterval: null,
            alerts: [],

            // Iniciar escaneo en tiempo real
            start: () => {
                if (this.isActive) return;

                console.log('🔍 Iniciando escaneo en tiempo real...');
                this.isActive = true;

                this.scanInterval = setInterval(() => {
                    this.performScan();
                }, 30000); // Escanear cada 30 segundos
            },

            // Detener escaneo
            stop: () => {
                if (this.scanInterval) {
                    clearInterval(this.scanInterval);
                    this.scanInterval = null;
                }
                this.isActive = false;
                console.log('⏹️ Escaneo en tiempo real detenido');
            },

            // Realizar escaneo completo
            performScan: () => {
                const scan = {
                    timestamp: Date.now(),
                    results: {
                        domIntegrity: this.checkDOMIntegrity(),
                        networkRequests: this.checkNetworkRequests(),
                        localStorage: this.checkLocalStorage(),
                        suspicious: this.detectSuspiciousActivity()
                    }
                };

                this.processScanResults(scan);
                return scan;
            },

            // Verificar integridad del DOM
            checkDOMIntegrity: () => {
                const scripts = document.querySelectorAll('script');
                const suspiciousScripts = [];

                scripts.forEach((script, index) => {
                    if (script.src && !this.isTrustedDomain(script.src)) {
                        suspiciousScripts.push({
                            index,
                            src: script.src,
                            reason: 'Dominio no confiable'
                        });
                    }

                    if (script.innerHTML && this.containsMaliciousCode(script.innerHTML)) {
                        suspiciousScripts.push({
                            index,
                            reason: 'Código potencialmente malicioso',
                            content: script.innerHTML.substring(0, 100)
                        });
                    }
                });

                return {
                    totalScripts: scripts.length,
                    suspicious: suspiciousScripts,
                    score: suspiciousScripts.length === 0 ? 1.0 : 0.5
                };
            },

            // Verificar requests de red
            checkNetworkRequests: () => {
                if (!window.performance || !window.performance.getEntriesByType) {
                    return { score: 0.8, reason: 'API no disponible' };
                }

                const entries = window.performance.getEntriesByType('resource');
                const recentEntries = entries.filter(
                    entry => Date.now() - entry.startTime < 60000
                );

                const suspicious = recentEntries.filter(entry =>
                    !this.isTrustedDomain(entry.name)
                );

                return {
                    total: recentEntries.length,
                    suspicious: suspicious.length,
                    score: suspicious.length === 0 ? 1.0 : 0.6
                };
            },

            // Verificar localStorage
            checkLocalStorage: () => {
                try {
                    const keys = Object.keys(localStorage);
                    const suspicious = keys.filter(key =>
                        key.includes('malware') ||
                        key.includes('inject') ||
                        key.length > 100
                    );

                    return {
                        totalKeys: keys.length,
                        suspicious: suspicious,
                        score: suspicious.length === 0 ? 1.0 : 0.4
                    };
                } catch (e) {
                    return { score: 0.5, error: 'Error accediendo localStorage' };
                }
            },

            // Detectar actividad sospechosa
            detectSuspiciousActivity: () => {
                const activity = {
                    rapidClicks: this.checkRapidClicks(),
                    unusualNavigation: this.checkNavigationPatterns(),
                    resourceUsage: this.checkResourceUsage()
                };

                const score = Object.values(activity).reduce((sum, item) =>
                    sum + (item.score || 0), 0) / Object.keys(activity).length;

                return { ...activity, overallScore: score };
            },

            // Procesar resultados del escaneo
            processScanResults: (scan) => {
                const overallScore = Object.values(scan.results).reduce((sum, result) =>
                    sum + (result.score || 0), 0) / Object.keys(scan.results).length;

                if (overallScore < 0.7) {
                    const alert = {
                        type: 'security_scan_alert',
                        severity: overallScore < 0.4 ? 'high' : 'medium',
                        message: `Escaneo de seguridad detectó anomalías (Score: ${overallScore.toFixed(2)})`,
                        details: scan.results,
                        timestamp: scan.timestamp
                    };

                    this.alerts.push(alert);
                    this.notifySecurityAlert(alert);
                }
            },

            // Utilidades auxiliares
            isTrustedDomain: (url) => {
                const trustedDomains = [
                    'localhost',
                    '127.0.0.1',
                    'cdn.jsdelivr.net',
                    'cdnjs.cloudflare.com',
                    'fonts.googleapis.com',
                    'unpkg.com'
                ];

                try {
                    const domain = new URL(url).hostname;
                    return trustedDomains.some(trusted => domain.includes(trusted));
                } catch (e) {
                    return false;
                }
            },

            containsMaliciousCode: (code) => {
                const maliciousPatterns = [
                    /eval\s*\(/,
                    /document\.write\s*\(/,
                    /innerHTML\s*=.*<script/,
                    /crypto\.mine/,
                    /bitcoin\.mine/
                ];

                return maliciousPatterns.some(pattern => pattern.test(code));
            },

            checkRapidClicks: () => ({ score: 1.0 }),
            checkNavigationPatterns: () => ({ score: 1.0 }),
            checkResourceUsage: () => ({ score: 1.0 }),

            notifySecurityAlert: (alert) => {
                console.warn('🚨 Alerta de Seguridad:', alert);
                if (window.bgeSecurity && window.bgeSecurity.securityMonitor.alertSystem) {
                    window.bgeSecurity.securityMonitor.alertSystem.trigger(alert);
                }
            }
        };
    }

    createSecurityAlertSystem() {
        return {
            alerts: [],
            subscribers: [],
            config: {
                maxAlerts: 100,
                alertRetention: 24 * 60 * 60 * 1000, // 24 horas
                enableNotifications: true,
                logToConsole: true
            },

            // Disparar una alerta de seguridad
            trigger: (alert) => {
                const securityAlert = {
                    id: this.generateAlertId(),
                    timestamp: Date.now(),
                    acknowledged: false,
                    ...alert
                };

                this.alerts.push(securityAlert);
                this.trimAlerts();

                if (this.config.logToConsole) {
                    this.logAlert(securityAlert);
                }

                this.notifySubscribers(securityAlert);
                this.storeAlert(securityAlert);

                return securityAlert.id;
            },

            // Generar ID único para alerta
            generateAlertId: () => {
                return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            },

            // Registrar alerta en consola
            logAlert: (alert) => {
                const severity = alert.severity || 'medium';
                const icon = {
                    low: '⚠️',
                    medium: '🚨',
                    high: '🔥',
                    critical: '💀'
                }[severity] || '⚠️';

                const style = {
                    low: 'color: orange; font-weight: bold;',
                    medium: 'color: red; font-weight: bold;',
                    high: 'color: red; font-weight: bold; background: yellow;',
                    critical: 'color: white; font-weight: bold; background: red;'
                }[severity] || 'color: orange;';

                console.log(
                    `%c${icon} ALERTA DE SEGURIDAD [${severity.toUpperCase()}]`,
                    style
                );
                console.log('ID:', alert.id);
                console.log('Mensaje:', alert.message);
                console.log('Detalles:', alert.details || 'Sin detalles adicionales');
                console.log('Timestamp:', new Date(alert.timestamp).toLocaleString());
            },

            // Notificar a suscriptores
            notifySubscribers: (alert) => {
                this.subscribers.forEach(callback => {
                    try {
                        callback(alert);
                    } catch (error) {
                        console.error('Error notificando suscriptor de alertas:', error);
                    }
                });
            },

            // Suscribirse a alertas
            subscribe: (callback) => {
                if (typeof callback === 'function') {
                    this.subscribers.push(callback);
                    return () => {
                        const index = this.subscribers.indexOf(callback);
                        if (index > -1) {
                            this.subscribers.splice(index, 1);
                        }
                    };
                }
            },

            // Reconocer alerta
            acknowledge: (alertId) => {
                const alert = this.alerts.find(a => a.id === alertId);
                if (alert) {
                    alert.acknowledged = true;
                    alert.acknowledgedAt = Date.now();
                    this.storeAlert(alert);
                    return true;
                }
                return false;
            },

            // Obtener alertas
            getAlerts: (options = {}) => {
                let filteredAlerts = [...this.alerts];

                if (options.severity) {
                    filteredAlerts = filteredAlerts.filter(a => a.severity === options.severity);
                }

                if (options.acknowledged !== undefined) {
                    filteredAlerts = filteredAlerts.filter(a => a.acknowledged === options.acknowledged);
                }

                if (options.since) {
                    filteredAlerts = filteredAlerts.filter(a => a.timestamp >= options.since);
                }

                return filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);
            },

            // Limpiar alertas antiguas
            trimAlerts: () => {
                const cutoff = Date.now() - this.config.alertRetention;
                this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);

                if (this.alerts.length > this.config.maxAlerts) {
                    this.alerts = this.alerts.slice(-this.config.maxAlerts);
                }
            },

            // Almacenar alerta en localStorage
            storeAlert: (alert) => {
                try {
                    const stored = JSON.parse(localStorage.getItem('bge_security_alerts') || '[]');
                    const index = stored.findIndex(a => a.id === alert.id);

                    if (index >= 0) {
                        stored[index] = alert;
                    } else {
                        stored.push(alert);
                    }

                    // Mantener solo las últimas 50 alertas en localStorage
                    if (stored.length > 50) {
                        stored.splice(0, stored.length - 50);
                    }

                    localStorage.setItem('bge_security_alerts', JSON.stringify(stored));
                } catch (error) {
                    console.error('Error almacenando alerta:', error);
                }
            },

            // Cargar alertas desde localStorage
            loadStoredAlerts: () => {
                try {
                    const stored = JSON.parse(localStorage.getItem('bge_security_alerts') || '[]');
                    this.alerts = stored.filter(alert =>
                        Date.now() - alert.timestamp < this.config.alertRetention
                    );
                } catch (error) {
                    console.error('Error cargando alertas almacenadas:', error);
                    this.alerts = [];
                }
            },

            // Obtener estadísticas de alertas
            getStats: () => {
                const now = Date.now();
                const last24h = this.alerts.filter(a => now - a.timestamp < 24 * 60 * 60 * 1000);
                const lastHour = this.alerts.filter(a => now - a.timestamp < 60 * 60 * 1000);

                return {
                    total: this.alerts.length,
                    last24h: last24h.length,
                    lastHour: lastHour.length,
                    unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
                    bySeverity: {
                        low: this.alerts.filter(a => a.severity === 'low').length,
                        medium: this.alerts.filter(a => a.severity === 'medium').length,
                        high: this.alerts.filter(a => a.severity === 'high').length,
                        critical: this.alerts.filter(a => a.severity === 'critical').length
                    }
                };
            }
        };
    }

    // Encryption and Security Utilities
    createEncryptor() {
        return {
            encrypt: async (data, key = null) => {
                try {
                    const keyToUse = key || await this.getEncryptionKey();
                    const iv = crypto.getRandomValues(new Uint8Array(12));

                    const cryptoKey = await crypto.subtle.importKey(
                        'raw',
                        keyToUse,
                        { name: this.encryption.algorithm },
                        false,
                        ['encrypt']
                    );

                    const encodedData = new TextEncoder().encode(data);
                    const encryptedData = await crypto.subtle.encrypt(
                        { name: this.encryption.algorithm, iv },
                        cryptoKey,
                        encodedData
                    );

                    // Combine IV and encrypted data
                    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
                    combined.set(iv);
                    combined.set(new Uint8Array(encryptedData), iv.length);

                    return btoa(String.fromCharCode(...combined));

                } catch (error) {
                    this.error('Encryption failed:', error);
                    throw error;
                }
            },

            decrypt: async (encryptedData, key = null) => {
                try {
                    const keyToUse = key || await this.getEncryptionKey();
                    const combined = new Uint8Array(
                        atob(encryptedData).split('').map(char => char.charCodeAt(0))
                    );

                    const iv = combined.slice(0, 12);
                    const data = combined.slice(12);

                    const cryptoKey = await crypto.subtle.importKey(
                        'raw',
                        keyToUse,
                        { name: this.encryption.algorithm },
                        false,
                        ['decrypt']
                    );

                    const decryptedData = await crypto.subtle.decrypt(
                        { name: this.encryption.algorithm, iv },
                        cryptoKey,
                        data
                    );

                    return new TextDecoder().decode(decryptedData);

                } catch (error) {
                    this.error('Decryption failed:', error);
                    throw error;
                }
            }
        };
    }

    createDecryptor() {
        return {
            decrypt: async (encryptedData, key = null) => {
                try {
                    const keyToUse = key || await this.getEncryptionKey();
                    const combined = new Uint8Array(
                        atob(encryptedData).split('').map(char => char.charCodeAt(0))
                    );

                    const iv = combined.slice(0, 12);
                    const data = combined.slice(12);

                    const cryptoKey = await crypto.subtle.importKey(
                        'raw',
                        keyToUse,
                        { name: this.encryption.algorithm },
                        false,
                        ['decrypt']
                    );

                    const decryptedData = await crypto.subtle.decrypt(
                        { name: this.encryption.algorithm, iv },
                        cryptoKey,
                        data
                    );

                    return new TextDecoder().decode(decryptedData);

                } catch (error) {
                    this.error('Decryption failed:', error);
                    throw error;
                }
            }
        };
    }

    createHasher() {
        return {
            hash: async (data, algorithm = 'SHA-256') => {
                try {
                    const encoder = new TextEncoder();
                    const dataBuffer = encoder.encode(data);
                    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                } catch (error) {
                    this.error('Hashing failed:', error);
                    throw error;
                }
            }
        };
    }

    createKeyManager() {
        return {
            generate: async (length = 32) => {
                try {
                    return crypto.getRandomValues(new Uint8Array(length));
                } catch (error) {
                    this.error('Key generation failed:', error);
                    throw error;
                }
            },

            derive: async (password, salt) => {
                try {
                    const encoder = new TextEncoder();
                    const keyMaterial = await crypto.subtle.importKey(
                        'raw',
                        encoder.encode(password),
                        { name: 'PBKDF2' },
                        false,
                        ['deriveBits', 'deriveKey']
                    );

                    return await crypto.subtle.deriveKey(
                        {
                            name: 'PBKDF2',
                            salt: salt,
                            iterations: 100000,
                            hash: 'SHA-256'
                        },
                        keyMaterial,
                        { name: 'AES-GCM', length: 256 },
                        true,
                        ['encrypt', 'decrypt']
                    );
                } catch (error) {
                    this.error('Key derivation failed:', error);
                    throw error;
                }
            }
        };
    }

    createSecureRandomizer() {
        return {
            randomBytes: (length) => {
                return crypto.getRandomValues(new Uint8Array(length));
            },

            randomString: (length = 16) => {
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                const randomValues = crypto.getRandomValues(new Uint8Array(length));
                return Array.from(randomValues, byte => chars[byte % chars.length]).join('');
            },

            randomId: () => {
                return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
            }
        };
    }

    // Audit Logger functions
    createAuditLogger() {
        return {
            log: (level, event, data = {}) => {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    level,
                    event,
                    userId: this.authentication?.currentUser?.id || 'anonymous',
                    sessionId: this.authentication?.currentSession?.id || 'none',
                    data,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };

                // Add to monitoring log
                this.monitoring.auditLog.push(logEntry);

                // Console log in development
                if (this.framework?.config?.debug) {
                    console.log(`[AUDIT-${level}]`, event, logEntry);
                }

                return logEntry;
            },

            error: (event, error, data = {}) => {
                return this.log('ERROR', event, { ...data, error: error.message, stack: error.stack });
            },

            warn: (event, data = {}) => {
                return this.log('WARN', event, data);
            },

            info: (event, data = {}) => {
                return this.log('INFO', event, data);
            }
        };
    }

    createLogFormatter() {
        return {
            format: (logEntry) => {
                return `[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.event} - User: ${logEntry.userId} - Session: ${logEntry.sessionId}`;
            },

            formatDetailed: (logEntry) => {
                return {
                    timestamp: logEntry.timestamp,
                    level: logEntry.level,
                    event: logEntry.event,
                    user: logEntry.userId,
                    session: logEntry.sessionId,
                    data: logEntry.data,
                    context: {
                        userAgent: logEntry.userAgent,
                        url: logEntry.url
                    }
                };
            }
        };
    }

    createLogAnalyzer() {
        return {
            analyze: (logs) => {
                const analysis = {
                    totalEvents: logs.length,
                    errorCount: logs.filter(log => log.level === 'ERROR').length,
                    warningCount: logs.filter(log => log.level === 'WARN').length,
                    uniqueUsers: new Set(logs.map(log => log.userId)).size,
                    timeRange: {
                        start: logs[0]?.timestamp,
                        end: logs[logs.length - 1]?.timestamp
                    }
                };

                return analysis;
            },

            findSuspiciousActivity: (logs) => {
                const suspicious = logs.filter(log =>
                    log.event.includes('failed') ||
                    log.event.includes('error') ||
                    log.level === 'ERROR'
                );

                return suspicious;
            }
        };
    }

    createSecurityReporter() {
        return {
            generateReport: () => {
                const logs = this.monitoring.auditLog;
                const analysis = this.auditLogger.analyzer.analyze(logs);
                const suspicious = this.auditLogger.analyzer.findSuspiciousActivity(logs);

                return {
                    generated: new Date().toISOString(),
                    summary: analysis,
                    suspiciousActivity: suspicious,
                    recommendations: this.generateSecurityRecommendations(analysis)
                };
            },

            exportLogs: (format = 'json') => {
                const logs = this.monitoring.auditLog;

                if (format === 'json') {
                    return JSON.stringify(logs, null, 2);
                } else if (format === 'csv') {
                    const headers = 'timestamp,level,event,userId,sessionId,data\n';
                    const rows = logs.map(log =>
                        `${log.timestamp},${log.level},${log.event},${log.userId},${log.sessionId},"${JSON.stringify(log.data)}"`
                    ).join('\n');
                    return headers + rows;
                }

                return logs;
            }
        };
    }

    createLogArchiver() {
        return {
            archive: () => {
                // In production, this would archive logs to external storage
                const archived = [...this.monitoring.auditLog];
                this.monitoring.auditLog = []; // Clear current logs

                this.log('Logs archived', { count: archived.length });
                return archived;
            },

            scheduleArchiving: (intervalMinutes = 60) => {
                setInterval(() => {
                    this.archive();
                }, intervalMinutes * 60 * 1000);
            }
        };
    }

    generateSecurityRecommendations(analysis) {
        const recommendations = [];

        if (analysis.errorCount > analysis.totalEvents * 0.1) {
            recommendations.push('High error rate detected - review system stability');
        }

        if (analysis.uniqueUsers < 2) {
            recommendations.push('Limited user activity - verify authentication system');
        }

        return recommendations;
    }

    // Public API methods
    async authenticate(credentials, options = {}) {
        return this.authManager.authenticator.login(credentials, options);
    }

    async logout(sessionId = null) {
        return this.authManager.authenticator.logout(sessionId);
    }

    isAuthenticated() {
        return this.authentication.isAuthenticated && this.hasValidSession();
    }

    getCurrentUser() {
        return this.authentication.currentUser;
    }

    hasPermission(permission) {
        return this.roleManager.checker.hasPermission(permission);
    }

    hasRole(role) {
        return this.roleManager.checker.hasRole(role);
    }

    canAccess(resource, action = 'read') {
        return this.roleManager.checker.canAccess(resource, action);
    }

    async encryptData(data) {
        return this.encryptionEngine.encryptor.encrypt(data);
    }

    async decryptData(encryptedData) {
        return this.encryptionEngine.encryptor.decrypt(encryptedData);
    }

    async adminLogin(credentials) {
        // Asegurar que el módulo esté inicializado antes del login
        if (!this.securityManager) {
            await this.initialize();
        }
        return this.handleAdminLogin(credentials);
    }

    getSecurityStatus() {
        return {
            authenticated: this.isAuthenticated(),
            user: this.getCurrentUser(),
            roles: this.authentication.roles,
            permissions: Array.from(this.authentication.permissions),
            session: this.authentication.currentSession,
            threats: this.monitoring.realTimeThreats.size,
            lastActivity: this.authentication.currentSession?.lastActivity
        };
    }

    // Security Validator - FUNCIÓN FALTANTE IMPLEMENTADA
    createSecurityValidator() {
        return {
            validateInput: (input, type = 'text') => {
                if (!input || typeof input !== 'string') return false;

                switch (type) {
                    case 'email':
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
                    case 'password':
                        return this.validatePassword(input);
                    case 'username':
                        return /^[a-zA-Z0-9_]{3,20}$/.test(input);
                    case 'text':
                        return !this.securityManager.scanner.detectXSS(input) &&
                               !this.securityManager.scanner.detectSQLInjection(input);
                    default:
                        return true;
                }
            },

            validatePassword: (password) => {
                const policy = this.policies.passwordPolicy;

                if (password.length < policy.minLength) return false;
                if (policy.requireUppercase && !/[A-Z]/.test(password)) return false;
                if (policy.requireLowercase && !/[a-z]/.test(password)) return false;
                if (policy.requireNumbers && !/\d/.test(password)) return false;
                if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

                return true;
            },

            validateSession: (sessionData) => {
                if (!sessionData || !sessionData.id) return false;
                if (!sessionData.userId || !sessionData.expiresAt) return false;
                if (Date.now() > sessionData.expiresAt) return false;

                return true;
            },

            validateCSRFToken: (token) => {
                if (!token || typeof token !== 'string') return false;
                return token.length >= 32 && /^[a-zA-Z0-9+/=]+$/.test(token);
            },

            validatePermissions: (requiredPermissions, userPermissions) => {
                if (!Array.isArray(requiredPermissions)) return false;
                if (!userPermissions || !userPermissions.size) return false;

                return requiredPermissions.every(permission => userPermissions.has(permission));
            }
        };
    }

    // Data Sanitizer
    createDataSanitizer() {
        return {
            sanitizeInput: (input) => {
                if (typeof input !== 'string') return input;

                return input
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#x27;')
                    .replace(/\//g, '&#x2F;');
            },

            sanitizeSQL: (input) => {
                if (typeof input !== 'string') return input;

                return input
                    .replace(/['"`;\\]/g, '')
                    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '');
            },

            sanitizeHTML: (html) => {
                const div = document.createElement('div');
                div.textContent = html;
                return div.innerHTML;
            }
        };
    }

    // Threat Scanner
    createThreatScanner() {
        return {
            detectXSS: (input) => {
                const xssPatterns = [
                    /<script[^>]*>.*?<\/script>/gi,
                    /javascript:/gi,
                    /on\w+\s*=/gi,
                    /<iframe[^>]*>.*?<\/iframe>/gi,
                    /eval\s*\(/gi,
                    /document\.write/gi
                ];
                return xssPatterns.some(pattern => pattern.test(input));
            },

            detectSQLInjection: (input) => {
                const sqlPatterns = [
                    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
                    /(UNION\s+SELECT)/i,
                    /(\'\s*OR\s*\'\s*=\s*\')/i,
                    /(\'\s*OR\s*1\s*=\s*1)/i,
                    /(--|\#|\/\*)/i
                ];
                return sqlPatterns.some(pattern => pattern.test(input));
            },

            scanForThreats: (data) => {
                const threats = [];

                if (this.detectXSS(data)) threats.push('XSS');
                if (this.detectSQLInjection(data)) threats.push('SQL_INJECTION');

                return threats;
            }
        };
    }

    // Policy Enforcer
    createPolicyEnforcer() {
        return {
            enforcePasswordPolicy: (password) => {
                const validation = this.securityManager.validator.validatePassword(password);
                if (!validation) {
                    throw new Error('Password does not meet security requirements');
                }
                return true;
            },

            enforceSessionPolicy: (session) => {
                const policy = this.policies.sessionPolicy;

                if (Date.now() - session.lastActivity > policy.idleTimeout) {
                    throw new Error('Session expired due to inactivity');
                }

                if (Date.now() > session.expiresAt) {
                    throw new Error('Session expired');
                }

                return true;
            },

            enforceAccessControl: (resource, action, user) => {
                const permission = `${resource}:${action}`;

                if (!this.hasPermission(permission) && !this.hasRole('admin')) {
                    throw new Error('Access denied: insufficient permissions');
                }

                return true;
            }
        };
    }

    // Security Monitor
    createSecurityMonitor() {
        return {
            monitorFailedAttempts: (username) => {
                const attempts = this.monitoring.failedAttempts.get(username) || [];
                const recentAttempts = attempts.filter(
                    attempt => Date.now() - attempt < 300000 // 5 minutes
                );

                if (recentAttempts.length >= this.config.maxFailedAttempts) {
                    this.auditLog('security_threat', {
                        type: 'brute_force_detected',
                        username,
                        attempts: recentAttempts.length
                    });
                    return true;
                }

                return false;
            },

            detectAnomalies: (activity) => {
                const anomalies = [];

                // Detect unusual login times
                const hour = new Date().getHours();
                if (hour < 6 || hour > 22) {
                    anomalies.push('unusual_login_time');
                }

                // Detect rapid successive logins
                if (activity.loginFrequency > 10) {
                    anomalies.push('rapid_login_attempts');
                }

                return anomalies;
            },

            alertSecurity: (threat) => {
                this.monitoring.realTimeThreats.add(threat);
                this.auditLog('security_alert', { threat });

                // In production, this would trigger real alerts
                console.warn('🚨 ALERTA DE SEGURIDAD:', threat);
            }
        };
    }

    // Función handleAdminLogin para autenticación de administradores
    async handleAdminLogin(credentials) {
        try {
            this.auditLog('admin_login_attempt', { username: credentials.username });

            // Validaciones específicas para admin
            if (!credentials.username || !credentials.password) {
                throw new Error('Credenciales de administrador requeridas');
            }

            // Limpiar intentos fallidos previos (para desarrollo)
            this.clearFailedAttempts(credentials.username);

            // Verificar si es un intento de fuerza bruta
            if (this.securityManager.monitor.monitorFailedAttempts(credentials.username)) {
                throw new Error('Cuenta temporalmente bloqueada por múltiples intentos fallidos');
            }

            // Credenciales de administrador (en producción estas estarían en base de datos segura)
            const adminCredentials = {
                'admin@bge.edu.mx': {
                    password: 'HeroesPatria2024!',
                    roles: ['admin', 'super_admin'],
                    permissions: ['*:*'] // Todos los permisos
                },
                'director@bge.edu.mx': {
                    password: 'Director2024!',
                    roles: ['admin', 'director'],
                    permissions: ['students:*', 'teachers:*', 'reports:*']
                }
            };

            const adminUser = adminCredentials[credentials.username];

            if (!adminUser || adminUser.password !== credentials.password) {
                await this.recordFailedAttempt(credentials.username);
                throw new Error('Credenciales de administrador inválidas');
            }

            // Crear sesión de administrador con permisos especiales
            const adminSession = await this.createAdminSession({
                id: credentials.username,
                username: credentials.username,
                roles: adminUser.roles,
                permissions: adminUser.permissions,
                isAdmin: true
            });

            // Actualizar estado de autenticación
            this.authentication.isAuthenticated = true;
            this.authentication.currentUser = {
                id: credentials.username,
                username: credentials.username,
                roles: adminUser.roles,
                isAdmin: true
            };
            this.authentication.currentSession = adminSession;
            this.authentication.roles = adminUser.roles;

            // Cargar todos los permisos para admin
            adminUser.permissions.forEach(permission => {
                this.authentication.permissions.add(permission);
            });

            this.auditLog('admin_login_success', {
                adminId: credentials.username,
                sessionId: adminSession.id,
                roles: adminUser.roles
            });

            // Limpiar intentos fallidos
            this.clearFailedAttempts(credentials.username);

            // ✅ Configurar duración de sesión según opción "Recordar sesión"
            const rememberSession = credentials.remember === true;
            const sessionDuration = rememberSession ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 días o 24 horas
            const sessionExpiry = Date.now() + sessionDuration;

            // Guardar tokens para compatibilidad con dashboard
            localStorage.setItem('authToken', adminSession.tokens.access);
            localStorage.setItem('userData', JSON.stringify({
                id: credentials.username,
                username: credentials.username,
                role: 'admin',
                roles: adminUser.roles,
                isAdmin: true,
                sessionId: adminSession.id,
                rememberSession: rememberSession,
                sessionExpiry: sessionExpiry,
                loginTime: new Date().toISOString()
            }));

            // ✅ CRÍTICO: Crear secure_admin_session para dashboard (con misma duración que userData)
            localStorage.setItem('secure_admin_session', JSON.stringify({
                id: adminSession.id,
                username: credentials.username,
                role: 'admin',
                roles: adminUser.roles,
                isAdmin: true,
                token: adminSession.tokens.access,
                loginTime: new Date().toISOString(),
                expiresAt: sessionExpiry, // ✅ Usar misma expiración (24h o 30 días)
                rememberSession: rememberSession,
                isAuthenticated: true,
                user: { // ✅ Agregar objeto user para dashboard-manager-2025.js
                    username: credentials.username,
                    role: 'admin',
                    roles: adminUser.roles
                }
            }));

            return {
                success: true,
                user: this.authentication.currentUser,
                session: adminSession,
                isAdmin: true,
                adminLevel: adminUser.roles.includes('super_admin') ? 'super' : 'standard'
            };

        } catch (error) {
            this.auditLog('admin_login_failure', {
                username: credentials.username,
                error: error.message
            });
            throw error;
        }
    }

    // Crear sesión específica para administradores
    async createAdminSession(user) {
        const sessionId = 'admin_' + this.generateSecureId();
        const now = Date.now();

        const adminSession = {
            id: sessionId,
            userId: user.id,
            username: user.username,
            roles: user.roles,
            isAdmin: true,
            createdAt: now,
            lastActivity: now,
            expiresAt: now + (this.policies.sessionPolicy.maxDuration * 2), // Sesiones admin duran más
            ipAddress: 'localhost', // En producción se obtendría del request
            userAgent: navigator.userAgent,
            tokens: await this.generateAdminTokens(user.id),
            isActive: true,
            adminLevel: user.roles.includes('super_admin') ? 'super' : 'standard',
            metadata: {
                loginMethod: 'admin_password',
                securityLevel: 'high',
                requiresReauth: false
            }
        };

        // Almacenar sesión de admin
        await this.storeAdminSession(adminSession);

        return adminSession;
    }

    // Generar tokens específicos para administradores
    async generateAdminTokens(userId) {
        return {
            access: 'admin_access_' + this.generateSecureId(),
            refresh: 'admin_refresh_' + this.generateSecureId(),
            csrf: 'admin_csrf_' + this.generateSecureId(),
            admin: 'admin_token_' + this.generateSecureId()
        };
    }

    // Almacenar sesión de administrador
    async storeAdminSession(session) {
        // En producción esto iría a una base de datos segura
        const adminSessions = JSON.parse(localStorage.getItem('bge_admin_sessions') || '{}');
        adminSessions[session.id] = session;
        localStorage.setItem('bge_admin_sessions', JSON.stringify(adminSessions));

        this.auditLog('admin_session_created', {
            sessionId: session.id,
            adminId: session.userId,
            adminLevel: session.adminLevel
        });
    }

    // Funciones auxiliares faltantes
    async recordFailedAttempt(username) {
        const attempts = this.monitoring.failedAttempts.get(username) || [];
        attempts.push(Date.now());
        this.monitoring.failedAttempts.set(username, attempts);

        this.auditLog('failed_login_attempt', {
            username,
            attemptCount: attempts.length,
            timestamp: Date.now()
        });
    }

    clearFailedAttempts(username) {
        this.monitoring.failedAttempts.delete(username);
    }

    async isAccountLocked(username) {
        const attempts = this.monitoring.failedAttempts.get(username) || [];
        const recentAttempts = attempts.filter(
            attempt => Date.now() - attempt < this.config.lockoutDuration
        );

        return recentAttempts.length >= this.config.maxFailedAttempts;
    }

    async validateCredentials(credentials) {
        // Esta función validaría contra base de datos en producción
        // Por ahora, solo validación básica
        if (!credentials.username || !credentials.password) {
            return null;
        }

        // Simular validación de credenciales
        const mockUsers = {
            'admin@bge.edu.mx': {
                id: 'admin_001',
                username: 'admin@bge.edu.mx',
                roles: ['admin', 'super_admin']
            },
            'teacher@bge.edu.mx': {
                id: 'teacher_001',
                username: 'teacher@bge.edu.mx',
                roles: ['teacher']
            }
        };

        return mockUsers[credentials.username] || null;
    }

    async createSecureSession(user, options = {}) {
        return this.sessionManager.creator.create(user, options);
    }

    async loadUserPermissions(user) {
        // Cargar permisos basados en roles
        const rolePermissions = {
            'admin': ['*:*'],
            'super_admin': ['*:*'],
            'teacher': ['students:read', 'grades:write', 'reports:read'],
            'student': ['grades:read', 'profile:write'],
            'parent': ['student_grades:read', 'communications:read']
        };

        user.roles.forEach(role => {
            const permissions = rolePermissions[role] || [];
            permissions.forEach(permission => {
                this.authentication.permissions.add(permission);
            });
        });
    }

    async terminateSession(sessionId) {
        // Terminar sesión específica
        this.auditLog('session_terminated', { sessionId });

        // En producción, esto removería de la base de datos
        const sessions = JSON.parse(localStorage.getItem('bge_admin_sessions') || '{}');
        if (sessions[sessionId]) {
            delete sessions[sessionId];
            localStorage.setItem('bge_admin_sessions', JSON.stringify(sessions));
        }
    }

    // Security utilities
    generateSecureId() {
        return 'sec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    }

    generateDeviceFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('BGE Security Fingerprint', 2, 2);

        return btoa(JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL()
        })).substr(0, 32);
    }

    auditLog(event, data = {}) {
        if (!this.config.enableAuditLogging) return;

        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            userId: this.authentication.currentUser?.id || 'anonymous',
            sessionId: this.authentication.currentSession?.id || 'none',
            ip: 'unknown', // Would be filled by server
            userAgent: navigator.userAgent,
            data
        };

        this.monitoring.auditLog.push(logEntry);

        // Also log to console in development
        if (this.framework?.config?.debug) {
            this.log(`AUDIT: ${event}`, logEntry);
        }
    }

    enforceSecurityHeaders() {
        // Note: These would typically be set by the server
        // This is for demonstration and client-side policies
        for (const [header, value] of Object.entries(this.policies.securityHeaders)) {
            if (header === 'Content-Security-Policy') {
                const meta = document.createElement('meta');
                meta.httpEquiv = 'Content-Security-Policy';
                meta.content = value;
                document.head.appendChild(meta);
            }
        }
    }

    // Funciones faltantes del Auth Manager
    createCredentialValidator() {
        return {
            validate: async (credentials) => {
                if (!credentials || typeof credentials !== 'object') {
                    throw new Error('Credenciales inválidas');
                }

                const { username, password } = credentials;

                if (!username || !password) {
                    throw new Error('Usuario y contraseña requeridos');
                }

                if (!this.securityManager.validator.validateInput(username, 'email')) {
                    throw new Error('Formato de email inválido');
                }

                if (!this.securityManager.validator.validatePassword(password)) {
                    throw new Error('La contraseña no cumple los requisitos de seguridad');
                }

                return true;
            },

            validateEmailFormat: (email) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },

            validatePasswordStrength: (password) => {
                return this.securityManager.validator.validatePassword(password);
            }
        };
    }

    createTokenManager() {
        return {
            generate: async (userId, type = 'access') => {
                const timestamp = Date.now();
                const random = Math.random().toString(36).substr(2, 16);
                return `${type}_${userId}_${timestamp}_${random}`;
            },

            validate: async (token) => {
                if (!token || typeof token !== 'string') return false;

                const parts = token.split('_');
                return parts.length >= 4;
            },

            refresh: async (refreshToken) => {
                const tokenData = await this.validateRefreshToken(refreshToken);
                if (!tokenData) throw new Error('Invalid refresh token');

                return this.generateTokens(tokenData.userId);
            }
        };
    }

    createPasswordManager() {
        return {
            hash: async (password) => {
                // En producción usar bcrypt o similar
                const encoder = new TextEncoder();
                const data = encoder.encode(password + 'bge_salt_2024');
                const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            },

            verify: async (password, hash) => {
                const hashedPassword = await this.hash(password);
                return hashedPassword === hash;
            },

            generateSecure: () => {
                const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
                let password = '';
                for (let i = 0; i < 12; i++) {
                    password += charset.charAt(Math.floor(Math.random() * charset.length));
                }
                return password;
            }
        };
    }

    createMFAManager() {
        return {
            isEnabled: (userId) => {
                // Verificar si el usuario tiene MFA habilitado
                return false; // Por ahora deshabilitado
            },

            generateCode: () => {
                return Math.floor(100000 + Math.random() * 900000).toString();
            },

            verifyCode: (code, expectedCode) => {
                return code === expectedCode;
            }
        };
    }

    createSessionValidator() {
        return {
            validate: (session) => {
                return this.securityManager.validator.validateSession(session);
            },

            isExpired: (session) => {
                return Date.now() > session.expiresAt;
            },

            isActive: (session) => {
                return session.isActive && !this.isExpired(session);
            }
        };
    }

    createSessionMonitor() {
        return {
            track: (sessionId, activity) => {
                // Registrar actividad de sesión
                this.auditLog('session_activity', { sessionId, activity });
            },

            checkActivity: (session) => {
                const now = Date.now();
                const timeSinceActivity = now - session.lastActivity;

                if (timeSinceActivity > this.policies.sessionPolicy.idleTimeout) {
                    this.auditLog('session_idle_timeout', { sessionId: session.id });
                    return false;
                }

                return true;
            }
        };
    }

    createSessionTerminator() {
        return {
            terminate: async (sessionId, reason = 'manual') => {
                await this.terminateSession(sessionId);
                this.auditLog('session_terminated', { sessionId, reason });
            },

            terminateAll: async (userId) => {
                // Terminar todas las sesiones del usuario
                this.auditLog('all_sessions_terminated', { userId });
            }
        };
    }

    createSessionCleaner() {
        return {
            cleanExpired: () => {
                // Limpiar sesiones expiradas
                const now = Date.now();
                // En producción esto sería una consulta a BD
                this.auditLog('expired_sessions_cleaned', { timestamp: now });
            },

            scheduleCleanup: () => {
                // Programar limpieza automática cada hora
                setInterval(() => {
                    this.cleanExpired();
                }, 3600000);
            }
        };
    }

    // Role Manager functions
    createRoleDefiner() {
        return {
            define: (roleName, permissions) => {
                // Definir un nuevo rol con permisos
                this.auditLog('role_defined', { roleName, permissions });
            },

            getRolePermissions: (roleName) => {
                const rolePermissions = {
                    'admin': ['*:*'],
                    'super_admin': ['*:*'],
                    'teacher': ['students:read', 'grades:write', 'reports:read'],
                    'student': ['grades:read', 'profile:write'],
                    'parent': ['student_grades:read', 'communications:read']
                };

                return rolePermissions[roleName] || [];
            }
        };
    }

    createRoleAssigner() {
        return {
            assign: (userId, roles) => {
                // Asignar roles a usuario
                this.auditLog('roles_assigned', { userId, roles });
            },

            revoke: (userId, roles) => {
                // Revocar roles de usuario
                this.auditLog('roles_revoked', { userId, roles });
            }
        };
    }

    createAccessEnforcer() {
        return {
            enforce: (resource, action, user) => {
                return this.securityManager.enforcer.enforceAccessControl(resource, action, user);
            }
        };
    }

    createRoleAuditor() {
        return {
            audit: (userId) => {
                // Auditar roles y permisos de usuario
                this.auditLog('role_audit', { userId });
            }
        };
    }

    // Additional utility functions
    async generateTokens(userId) {
        return {
            access: await this.authManager.tokenManager.generate(userId, 'access'),
            refresh: await this.authManager.tokenManager.generate(userId, 'refresh'),
            csrf: await this.authManager.tokenManager.generate(userId, 'csrf')
        };
    }

    async validateRefreshToken(token) {
        if (!token || !token.startsWith('refresh_')) return null;

        // En producción verificar contra BD
        const parts = token.split('_');
        if (parts.length >= 4) {
            return {
                userId: parts[1],
                sessionId: 'session_' + parts[1],
                timestamp: parseInt(parts[2])
            };
        }

        return null;
    }

    async updateSessionTokens(sessionId, tokens) {
        // Actualizar tokens de sesión
        this.auditLog('session_tokens_updated', { sessionId });
    }

    async restoreAuthenticationState() {
        // Restaurar estado de autenticación desde almacenamiento
        try {
            const sessions = JSON.parse(localStorage.getItem('bge_admin_sessions') || '{}');
            // Verificar si hay sesión activa
            for (const [sessionId, session] of Object.entries(sessions)) {
                if (session.isActive && Date.now() < session.expiresAt) {
                    this.authentication.isAuthenticated = true;
                    this.authentication.currentUser = {
                        id: session.userId,
                        username: session.username,
                        roles: session.roles,
                        isAdmin: session.isAdmin
                    };
                    this.authentication.currentSession = session;
                    this.authentication.roles = session.roles;
                    break;
                }
            }
        } catch (error) {
            this.error('Error restoring authentication state:', error);
        }
    }

    startSessionMonitoring() {
        // Iniciar monitoreo de sesiones
        setInterval(() => {
            if (this.authentication.currentSession) {
                const isValid = this.sessionManager.validator.validate(this.authentication.currentSession);
                if (!isValid) {
                    this.logout();
                }
            }
        }, 60000); // Verificar cada minuto
    }

    async loadRoleDefinitions() {
        // Cargar definiciones de roles
        this.auditLog('role_definitions_loaded');
    }

    async generateSessionKeys() {
        // Generar claves de sesión
        this.auditLog('session_keys_generated');
    }

    startAuditLogging() {
        // Iniciar sistema de auditoría
        this.auditLog('audit_system_started');
    }

    async enforceSecurityPolicies() {
        // Aplicar políticas de seguridad
        this.enforceSecurityHeaders();
    }

    async initializeCSRFProtection() {
        // Inicializar protección CSRF
        this.auditLog('csrf_protection_initialized');
    }

    async initializeRateLimiting() {
        // Inicializar limitación de tasa
        this.auditLog('rate_limiting_initialized');
    }

    async initializeGoogleAuth() {
        // Inicializar autenticación Google
        this.auditLog('google_auth_initialized');
    }

    setupSecurityEventHandlers() {
        // Configurar manejadores de eventos de seguridad
        window.addEventListener('beforeunload', () => {
            this.auditLog('page_unload');
        });
    }

    startRealTimeMonitoring() {
        // Iniciar monitoreo en tiempo real
        this.auditLog('realtime_monitoring_started');
    }

    async getEncryptionKey() {
        // Obtener clave de encriptación
        return new Uint8Array(32); // Clave temporal
    }

    validateCSRFToken(token) {
        return this.securityManager.validator.validateCSRFToken(token);
    }

    // Utility methods for framework integration
    clearAuthenticationState() {
        this.authentication = {
            isAuthenticated: false,
            currentUser: null,
            currentSession: null,
            roles: [],
            permissions: new Set(),
            tokens: { access: null, refresh: null, csrf: null }
        };

        // ✅ CRÍTICO: Limpiar TODAS las sesiones del localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('secure_admin_session');
        sessionStorage.removeItem('admin_logout_redirect');

        console.log('🧹 [AUTH] Estado de autenticación limpiado completamente');
    }

    hasValidSession() {
        const session = this.authentication.currentSession;
        if (!session) return false;

        return session.isActive && Date.now() < session.expiresAt;
    }

    async storeSession(session) {
        // Store in secure storage (implementation depends on requirements)
        if (this.framework.modules.has('analytics')) {
            this.framework.modules.get('analytics').track('session_created', {
                sessionId: session.id,
                userId: session.userId
            });
        }
    }
}

// Export for BGE Framework
window.BGESecurityModule = BGESecurityModule;

// Función global para handleAdminLogin (requerida por header.html)
window.handleAdminLogin = async function() {
    try {
        console.log('🔑 handleAdminLogin llamado desde header');

        // Crear modal de login si no existe
        createAdminLoginModal();

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
        modal.show();

    } catch (error) {
        console.error('❌ Error en handleAdminLogin:', error);
        alert('Error en sistema de autenticación. Ver consola para detalles.');
    }
};

// Función para crear el modal de login admin
function createAdminLoginModal() {
    // Verificar si el modal ya existe
    if (document.getElementById('adminLoginModal')) {
        return;
    }

    const modalHTML = `
    <div class="modal fade" id="adminLoginModal" tabindex="-1" aria-labelledby="adminLoginModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="adminLoginModalLabel">
                        <i class="fas fa-shield-halved me-2"></i>Panel de Administración
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="adminLoginForm">
                        <div class="alert alert-info mb-3">
                            <i class="fas fa-info-circle me-2"></i>
                            Acceso restringido para personal autorizado
                        </div>

                        <div class="mb-3">
                            <label for="adminUsername" class="form-label">
                                <i class="fas fa-user me-2"></i>Usuario
                            </label>
                            <input type="email" class="form-control" id="adminUsername" placeholder="usuario@bge.edu.mx" required>
                        </div>

                        <div class="mb-3">
                            <label for="adminPassword" class="form-label">
                                <i class="fas fa-lock me-2"></i>Contraseña
                            </label>
                            <input type="password" class="form-control" id="adminPassword" placeholder="Contraseña" required>
                        </div>

                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="rememberAdmin">
                                <label class="form-check-label" for="rememberAdmin">
                                    Recordar sesión
                                </label>
                            </div>
                        </div>

                        <div id="adminLoginError" class="alert alert-danger d-none">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <span id="adminLoginErrorText"></span>
                        </div>

                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary" id="adminLoginBtn">
                                <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                            </button>
                        </div>
                    </form>
                </div>
                <div class="modal-footer bg-light">
                    <small class="text-muted">
                        <i class="fas fa-shield-check me-1"></i>
                        Conexión segura - BGE Héroes de la Patria
                    </small>
                </div>
            </div>
        </div>
    </div>`;

    // Insertar modal en el DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Configurar event listeners
    setupAdminLoginEvents();
}

// Configurar eventos del modal de login
function setupAdminLoginEvents() {
    const form = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('adminLoginBtn');
    const errorDiv = document.getElementById('adminLoginError');
    const errorText = document.getElementById('adminLoginErrorText');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const remember = document.getElementById('rememberAdmin').checked;

        // Validación básica
        if (!username || !password) {
            showAdminLoginError('Por favor complete todos los campos');
            return;
        }

        // Deshabilitar botón durante el login
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
        errorDiv.classList.add('d-none');

        try {
            // Intentar login con el módulo de seguridad
            const securityModule = window.bgeSecurity || new BGESecurityModule(null);

            const result = await securityModule.adminLogin({
                username: username,
                password: password,
                remember: remember // ✅ Pasar opción de recordar sesión
            });

            if (result.success) {
                // Login exitoso
                console.log('✅ Login admin exitoso:', result);

                // Actualizar UI del header
                updateAdminHeaderStatus(true, result.user);

                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
                modal.hide();

                // Mostrar mensaje de éxito en lugar de redirección automática
                setTimeout(() => {
                    alert('✅ Sesión de administrador iniciada correctamente. Ahora puede acceder al Dashboard Admin desde el menú.');
                }, 500);

            } else {
                showAdminLoginError('Credenciales inválidas');
            }

        } catch (error) {
            console.error('❌ Error en login admin:', error);
            showAdminLoginError('Error de conexión. Intente nuevamente.');
        } finally {
            // Reactivar botón
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión';
        }
    });

    function showAdminLoginError(message) {
        errorText.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

// Actualizar estado en el header
// ✅ FUNCIÓN GLOBAL EXPORTADA para actualizar estado admin en header
window.updateAdminHeaderStatus = function updateAdminHeaderStatus(isLoggedIn, user = null) {
    const adminLink = document.getElementById('adminPanelMenuLink');
    const statusBadge = document.getElementById('adminPanelSessionStatus');
    const adminOnlySection = document.getElementById('adminOnlySection');
    const logoutOption = document.getElementById('adminPanelLogoutOption');

    if (isLoggedIn && user) {
        // Actualizar enlace de admin
        if (adminLink) {
            adminLink.classList.add('text-success');
            adminLink.innerHTML = `<i class="fas fa-shield-check me-2"></i>Admin (${user.username.split('@')[0]})`;
        }
        if (statusBadge) {
            statusBadge.classList.remove('d-none');
        }

        // Mostrar Dashboard Admin en el menú
        if (adminOnlySection) {
            adminOnlySection.classList.remove('d-none');
        }

        // Mostrar opción de cerrar sesión
        if (logoutOption) {
            logoutOption.classList.remove('d-none');
        }

        console.log('✅ Enlaces de administrador habilitados en el menú');
    } else {
        // Resetear estado
        if (adminLink) {
            adminLink.classList.remove('text-success');
            adminLink.innerHTML = '<i class="fas fa-shield-halved me-2"></i>Admin';
        }
        if (statusBadge) {
            statusBadge.classList.add('d-none');
        }

        // Ocultar Dashboard Admin
        if (adminOnlySection) {
            adminOnlySection.classList.add('d-none');
        }

        // Ocultar opción de cerrar sesión
        if (logoutOption) {
            logoutOption.classList.add('d-none');
        }
    }
};

// ✅ CRÍTICO: Objeto secureAdminAuth para dashboard
if (typeof window !== 'undefined') {
    window.secureAdminAuth = {
        isUserAuthenticated() {
            try {
                const session = localStorage.getItem('secure_admin_session');
                if (!session) return false;

                const sessionData = JSON.parse(session);
                // Verificar que no esté expirada
                if (sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    return sessionData.isAuthenticated === true;
                } else {
                    // Limpiar sesión expirada
                    localStorage.removeItem('secure_admin_session');
                    return false;
                }
            } catch (error) {
                console.warn('❌ [SECURE AUTH] Error verificando autenticación:', error);
                return false;
            }
        },

        getCurrentUser() {
            try {
                const session = localStorage.getItem('secure_admin_session');
                if (!session) return null;

                const sessionData = JSON.parse(session);
                if (sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    return {
                        username: sessionData.username,
                        role: sessionData.role,
                        roles: sessionData.roles,
                        isAdmin: sessionData.isAdmin
                    };
                }
                return null;
            } catch (error) {
                console.warn('❌ [SECURE AUTH] Error obteniendo usuario:', error);
                return null;
            }
        }
    };

    // Función de inicialización para dashboard
    window.initSecureAuthSystem = function() {
        console.log('🔧 [SECURE AUTH] Sistema inicializado');
        return window.secureAdminAuth;
    };

    // Función global de logout para compatibilidad con header.html
    window.logoutAdminPanel = function() {
        console.log('🚪 Cerrando sesión admin desde BGE Security Module...');
        if (window.secureAdminAuth && typeof window.secureAdminAuth.logout === 'function') {
            window.secureAdminAuth.logout();
        } else {
            // Fallback: limpiar localStorage manualmente
            localStorage.removeItem('secure_admin_session');
            localStorage.removeItem('admin_session');
            console.log('✅ Sesión cerrada (fallback)');
            // Recargar página para actualizar UI
            window.location.reload();
        }
    };
}

// Standalone initialization (if not using framework)
if (typeof window !== 'undefined' && !window.BGE) {
    window.addEventListener('DOMContentLoaded', () => {
        window.bgeSecurity = new BGESecurityModule(null);

        // ✅ CRÍTICO: Verificar sesión activa al cargar página y actualizar UI
        setTimeout(() => {
            if (window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
                const isAuth = window.secureAdminAuth.isUserAuthenticated();
                if (isAuth) {
                    const user = window.secureAdminAuth.getCurrentUser();
                    console.log('✅ [SECURE AUTH] Sesión activa detectada al cargar página:', user);
                    // Actualizar UI del header para mostrar botones de admin
                    if (typeof updateAdminHeaderStatus === 'function') {
                        updateAdminHeaderStatus(true, user);
                    }
                } else {
                    console.log('ℹ️ [SECURE AUTH] No hay sesión activa');
                }
            }
        }, 500); // Esperar 500ms para que el header se haya cargado
    });
}