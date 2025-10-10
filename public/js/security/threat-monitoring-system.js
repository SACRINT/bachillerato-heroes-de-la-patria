/**
 * 🛡️ BGE Threat Monitoring System
 * Sistema de Monitoreo de Amenazas en Tiempo Real
 *
 * Implementa detección avanzada de amenazas de seguridad:
 * - Detección de intrusiones (IDS/IPS)
 * - Análisis de patrones anómalos
 * - Monitoreo de ataques DDoS
 * - Detección de malware/scripts maliciosos
 * - Análisis de comportamiento sospechoso
 * - Geolocalización de amenazas
 * - Alertas en tiempo real
 * - Respuesta automática a incidentes
 *
 * @version 1.0.0
 * @since Phase D - Security Implementation
 */

class BGEThreatMonitoringSystem {
    constructor() {
        this.threatConfig = {
            monitoring: {
                scanInterval: 5000,      // 5 segundos
                deepScanInterval: 30000, // 30 segundos
                alertThreshold: 3,       // Alertas antes de bloqueo
                maxRequestsPerMinute: 100,
                maxFailedLogins: 5,
                suspiciousActivityWindow: 300000 // 5 minutos
            },
            threats: {
                SQL_INJECTION: { level: 'CRITICAL', score: 100 },
                XSS_ATTACK: { level: 'HIGH', score: 80 },
                CSRF_ATTACK: { level: 'HIGH', score: 75 },
                BRUTE_FORCE: { level: 'HIGH', score: 85 },
                DDOS_ATTACK: { level: 'CRITICAL', score: 95 },
                MALWARE_DETECTED: { level: 'CRITICAL', score: 100 },
                SUSPICIOUS_BEHAVIOR: { level: 'MEDIUM', score: 50 },
                UNAUTHORIZED_ACCESS: { level: 'HIGH', score: 90 },
                DATA_EXFILTRATION: { level: 'CRITICAL', score: 100 },
                ANOMALOUS_PATTERN: { level: 'MEDIUM', score: 40 }
            }
        };

        this.activeThreats = new Map();
        this.threatHistory = [];
        this.blockedIPs = new Set();
        this.suspiciousActivities = new Map();
        this.alertQueue = [];
        this.securityMetrics = {
            threatsDetected: 0,
            threatsBlocked: 0,
            alertsSent: 0,
            lastScanTime: null,
            systemStatus: 'SECURE'
        };

        this.anomalyDetector = new BGEAnomalyDetector();
        this.geolocationAnalyzer = new BGEGeolocationAnalyzer();
        this.patternAnalyzer = new BGEPatternAnalyzer();

        this.logger = window.BGELogger || console;
        this.initializeThreatMonitoring();
    }

    async initializeThreatMonitoring() {
        try {
            this.logger.info('ThreatMonitoring', 'Inicializando sistema de monitoreo de amenazas');

            // Inicializar detectores especializados
            await this.initializeIntrusionDetection();
            await this.initializeMalwareDetection();
            await this.initializeBehaviorAnalysis();
            await this.initializeNetworkMonitoring();

            // Configurar monitoreo en tiempo real
            this.startRealTimeMonitoring();

            // Configurar respuesta automática
            this.setupAutomaticResponse();

            // Inicializar alertas
            this.initializeAlertSystem();

            this.logger.info('ThreatMonitoring', 'Sistema de monitoreo inicializado correctamente');

        } catch (error) {
            this.logger.error('ThreatMonitoring', 'Error al inicializar monitoreo', error);
            throw error;
        }
    }

    async initializeIntrusionDetection() {
        // Sistema de detección de intrusiones
        this.intrusionDetector = {
            signatures: new Map([
                ['sql_injection', /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b.*(\b(FROM|WHERE|ORDER|GROUP)\b|[;\'\"]))|(\'(\s)*(OR|AND)(\s)*\')/i],
                ['xss_attack', /<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=/i],
                ['path_traversal', /(\.\.[\/\\]){2,}|(\.\.[\/\\].*){3,}/],
                ['command_injection', /(\||;|&|`|\$\()/],
                ['ldap_injection', /(\(|\)|&|\||\*|!|=|<|>|~)/]
            ]),
            behaviorRules: new Map([
                ['rapid_requests', { threshold: 50, window: 60000 }],
                ['failed_logins', { threshold: 5, window: 300000 }],
                ['unusual_patterns', { threshold: 10, window: 600000 }]
            ])
        };

        this.logger.info('ThreatMonitoring', 'Detector de intrusiones inicializado');
    }

    async initializeMalwareDetection() {
        // Sistema de detección de malware
        this.malwareDetector = {
            signatures: new Map([
                ['suspicious_eval', /eval\s*\(.*\)/i],
                ['base64_payload', /atob\s*\(|btoa\s*\(|fromCharCode/i],
                ['obfuscated_js', /[a-zA-Z0-9+/]{100,}={0,2}/],
                ['crypto_miner', /(coinhive|cryptonight|monero|bitcoin)/i],
                ['keylogger', /(keydown|keyup|keypress).*log/i]
            ]),
            fileHashes: new Set(), // Hashes conocidos de malware
            quarantine: new Map()
        };

        this.logger.info('ThreatMonitoring', 'Detector de malware inicializado');
    }

    async initializeBehaviorAnalysis() {
        // Análisis de comportamiento
        this.behaviorAnalyzer = {
            userProfiles: new Map(),
            anomalyThreshold: 0.7,
            learningPeriod: 7 * 24 * 60 * 60 * 1000, // 7 días
            features: [
                'access_patterns',
                'request_frequency',
                'data_access_volume',
                'geographical_location',
                'device_fingerprint',
                'session_duration'
            ]
        };

        this.logger.info('ThreatMonitoring', 'Analizador de comportamiento inicializado');
    }

    async initializeNetworkMonitoring() {
        // Monitoreo de red
        this.networkMonitor = {
            connectionTracker: new Map(),
            ddosDetector: {
                requestCounts: new Map(),
                threshold: 1000,
                timeWindow: 60000
            },
            geoBlocklist: new Set(['CN', 'RU', 'KP']), // Países bloqueados por defecto
            rateLimiter: new Map()
        };

        this.logger.info('ThreatMonitoring', 'Monitor de red inicializado');
    }

    startRealTimeMonitoring() {
        // Monitoreo continuo
        setInterval(() => {
            this.performSecurityScan();
        }, this.threatConfig.monitoring.scanInterval);

        // Análisis profundo periódico
        setInterval(() => {
            this.performDeepSecurityAnalysis();
        }, this.threatConfig.monitoring.deepScanInterval);

        // Limpiar datos antiguos
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000); // 1 hora

        this.logger.info('ThreatMonitoring', 'Monitoreo en tiempo real iniciado');
    }

    setupAutomaticResponse() {
        // Configurar respuestas automáticas a amenazas
        this.responseActions = {
            'CRITICAL': [
                'blockIP',
                'quarantineSession',
                'alertAdministrators',
                'logIncident',
                'backupData'
            ],
            'HIGH': [
                'rateLimitIP',
                'alertAdministrators',
                'logIncident',
                'increaseMonitoring'
            ],
            'MEDIUM': [
                'logIncident',
                'increaseMonitoring',
                'alertSecurity'
            ],
            'LOW': [
                'logIncident'
            ]
        };

        this.logger.info('ThreatMonitoring', 'Sistema de respuesta automática configurado');
    }

    initializeAlertSystem() {
        // Sistema de alertas
        this.alertSystem = {
            channels: ['console', 'storage', 'display'],
            templates: {
                'INTRUSION_DETECTED': 'Intrusión detectada desde IP {ip} - Tipo: {type}',
                'MALWARE_FOUND': 'Malware detectado: {signature} en {location}',
                'ANOMALY_DETECTED': 'Comportamiento anómalo detectado para usuario {user}',
                'DDOS_ATTACK': 'Posible ataque DDoS desde {ip} - {requests} requests',
                'UNAUTHORIZED_ACCESS': 'Acceso no autorizado detectado: {details}'
            },
            cooldown: new Map() // Evitar spam de alertas
        };

        this.logger.info('ThreatMonitoring', 'Sistema de alertas inicializado');
    }

    /**
     * Escaneo de seguridad en tiempo real
     */
    async performSecurityScan() {
        try {
            this.securityMetrics.lastScanTime = new Date();

            // Detectar intrusiones
            await this.detectIntrusions();

            // Detectar malware
            await this.detectMalware();

            // Analizar comportamiento
            await this.analyzeBehavior();

            // Monitorear red
            await this.monitorNetwork();

            // Actualizar estado del sistema
            this.updateSystemStatus();

        } catch (error) {
            this.logger.error('ThreatMonitoring', 'Error en escaneo de seguridad', error);
        }
    }

    async detectIntrusions() {
        // Analizar logs de requests recientes
        const recentRequests = this.getRecentRequests();

        for (const request of recentRequests) {
            // Verificar contra firmas conocidas
            for (const [threatType, signature] of this.intrusionDetector.signatures) {
                if (this.testSignature(request, signature)) {
                    await this.handleThreatDetection({
                        type: 'INTRUSION_DETECTED',
                        subtype: threatType,
                        severity: this.threatConfig.threats.SQL_INJECTION.level,
                        source: request.ip,
                        details: request,
                        timestamp: new Date()
                    });
                }
            }

            // Verificar reglas de comportamiento
            await this.checkBehaviorRules(request);
        }
    }

    async detectMalware() {
        // Escanear scripts cargados
        const scripts = document.scripts;

        for (let script of scripts) {
            if (script.src) {
                // Verificar URL sospechosa
                if (await this.isSuspiciousURL(script.src)) {
                    await this.handleThreatDetection({
                        type: 'MALWARE_DETECTED',
                        subtype: 'suspicious_script',
                        severity: 'CRITICAL',
                        source: script.src,
                        details: { element: script.outerHTML },
                        timestamp: new Date()
                    });
                }
            } else if (script.innerHTML) {
                // Escanear contenido inline
                await this.scanScriptContent(script.innerHTML, script);
            }
        }

        // Monitorear modificaciones DOM
        this.monitorDOMChanges();
    }

    async scanScriptContent(content, element) {
        for (const [signature, pattern] of this.malwareDetector.signatures) {
            if (pattern.test(content)) {
                await this.handleThreatDetection({
                    type: 'MALWARE_DETECTED',
                    subtype: signature,
                    severity: 'CRITICAL',
                    source: 'inline_script',
                    details: {
                        content: content.substring(0, 200),
                        element: element.outerHTML.substring(0, 100)
                    },
                    timestamp: new Date()
                });

                // Neutralizar script malicioso
                element.remove();
                break;
            }
        }
    }

    monitorDOMChanges() {
        if (!this.domObserver) {
            this.domObserver = new MutationObserver((mutations) => {
                mutations.forEach(async (mutation) => {
                    if (mutation.type === 'childList') {
                        for (let node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.tagName === 'SCRIPT') {
                                    await this.scanScriptContent(node.innerHTML, node);
                                }
                            }
                        }
                    }
                });
            });

            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    async analyzeBehavior() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;

        const userProfile = this.behaviorAnalyzer.userProfiles.get(currentUser.id);
        const currentBehavior = await this.getCurrentUserBehavior(currentUser);

        if (userProfile) {
            const anomalyScore = await this.calculateAnomalyScore(userProfile, currentBehavior);

            if (anomalyScore > this.behaviorAnalyzer.anomalyThreshold) {
                await this.handleThreatDetection({
                    type: 'ANOMALY_DETECTED',
                    subtype: 'behavior_anomaly',
                    severity: 'MEDIUM',
                    source: currentUser.id,
                    details: {
                        anomalyScore: anomalyScore,
                        behavior: currentBehavior,
                        baseline: userProfile.baseline
                    },
                    timestamp: new Date()
                });
            }
        } else {
            // Crear perfil inicial para usuario nuevo
            this.createUserProfile(currentUser, currentBehavior);
        }
    }

    async monitorNetwork() {
        // Monitorear patrones de red sospechosos
        const connections = this.getActiveConnections();

        for (const connection of connections) {
            // Detectar posibles ataques DDoS
            if (await this.isDDoSAttack(connection)) {
                await this.handleThreatDetection({
                    type: 'DDOS_ATTACK',
                    subtype: 'high_volume_requests',
                    severity: 'CRITICAL',
                    source: connection.ip,
                    details: connection,
                    timestamp: new Date()
                });
            }

            // Verificar geolocalización
            const geoInfo = await this.geolocationAnalyzer.analyze(connection.ip);
            if (this.networkMonitor.geoBlocklist.has(geoInfo.country)) {
                await this.handleThreatDetection({
                    type: 'UNAUTHORIZED_ACCESS',
                    subtype: 'geo_blocked_region',
                    severity: 'HIGH',
                    source: connection.ip,
                    details: { geo: geoInfo },
                    timestamp: new Date()
                });
            }
        }
    }

    async performDeepSecurityAnalysis() {
        try {
            this.logger.debug('ThreatMonitoring', 'Iniciando análisis profundo de seguridad');

            // Análisis de patrones avanzados
            await this.analyzeAdvancedPatterns();

            // Correlación de amenazas
            await this.correlateThreatData();

            // Predicción de amenazas
            await this.predictThreats();

            // Optimización de reglas
            await this.optimizeDetectionRules();

            this.logger.debug('ThreatMonitoring', 'Análisis profundo completado');

        } catch (error) {
            this.logger.error('ThreatMonitoring', 'Error en análisis profundo', error);
        }
    }

    async analyzeAdvancedPatterns() {
        // Análisis de patrones complejos usando ML básico
        const threatData = this.getThreatDataForAnalysis();
        const patterns = await this.patternAnalyzer.findPatterns(threatData);

        for (const pattern of patterns) {
            if (pattern.confidence > 0.8) {
                this.logger.warn('ThreatMonitoring', `Patrón de amenaza detectado: ${pattern.type}`);

                // Actualizar reglas de detección
                this.updateDetectionRules(pattern);
            }
        }
    }

    async correlateThreatData() {
        // Correlacionar amenazas para detectar ataques coordinados
        const recentThreats = this.getRecentThreats(3600000); // 1 hora

        const correlatedAttacks = this.findCorrelatedAttacks(recentThreats);

        for (const attack of correlatedAttacks) {
            await this.handleThreatDetection({
                type: 'COORDINATED_ATTACK',
                subtype: attack.type,
                severity: 'CRITICAL',
                source: attack.sources,
                details: attack,
                timestamp: new Date()
            });
        }
    }

    async predictThreats() {
        // Predicción básica de amenazas basada en tendencias
        const historicalData = this.threatHistory.slice(-100);
        const predictions = await this.anomalyDetector.predict(historicalData);

        for (const prediction of predictions) {
            if (prediction.probability > 0.7) {
                this.logger.info('ThreatMonitoring', `Amenaza predicha: ${prediction.type} (${prediction.probability})`);

                // Preparar contramedidas preventivas
                await this.preparePreventiveMeasures(prediction);
            }
        }
    }

    /**
     * Manejo de amenazas detectadas
     */
    async handleThreatDetection(threat) {
        try {
            this.logger.warn('ThreatMonitoring', `Amenaza detectada: ${threat.type} - ${threat.severity}`);

            // Registrar amenaza
            this.registerThreat(threat);

            // Ejecutar respuesta automática
            await this.executeAutomaticResponse(threat);

            // Enviar alertas
            await this.sendAlert(threat);

            // Actualizar métricas
            this.updateThreatMetrics(threat);

        } catch (error) {
            this.logger.error('ThreatMonitoring', 'Error al manejar amenaza', error);
        }
    }

    registerThreat(threat) {
        // Registrar en amenazas activas
        const threatId = this.generateThreatId();
        this.activeThreats.set(threatId, threat);

        // Agregar al historial
        this.threatHistory.push({
            id: threatId,
            ...threat
        });

        // Mantener solo las últimas 1000 amenazas en historial
        if (this.threatHistory.length > 1000) {
            this.threatHistory.shift();
        }
    }

    async executeAutomaticResponse(threat) {
        const responseActions = this.responseActions[threat.severity] || this.responseActions['LOW'];

        for (const action of responseActions) {
            try {
                await this.executeResponseAction(action, threat);
            } catch (error) {
                this.logger.error('ThreatMonitoring', `Error en acción de respuesta ${action}`, error);
            }
        }
    }

    async executeResponseAction(action, threat) {
        switch (action) {
            case 'blockIP':
                this.blockIP(threat.source);
                break;

            case 'quarantineSession':
                await this.quarantineSession(threat);
                break;

            case 'rateLimitIP':
                this.rateLimitIP(threat.source);
                break;

            case 'alertAdministrators':
                await this.alertAdministrators(threat);
                break;

            case 'logIncident':
                this.logSecurityIncident(threat);
                break;

            case 'backupData':
                await this.triggerEmergencyBackup();
                break;

            case 'increaseMonitoring':
                this.increaseMonitoringLevel(threat.source);
                break;

            case 'alertSecurity':
                await this.alertSecurityTeam(threat);
                break;
        }
    }

    blockIP(ip) {
        this.blockedIPs.add(ip);
        this.logger.info('ThreatMonitoring', `IP bloqueada: ${ip}`);

        // Configurar desbloqueo automático después de 24 horas
        setTimeout(() => {
            this.blockedIPs.delete(ip);
            this.logger.info('ThreatMonitoring', `IP desbloqueada automáticamente: ${ip}`);
        }, 24 * 60 * 60 * 1000);
    }

    async quarantineSession(threat) {
        // Aislar sesión sospechosa
        const sessionId = threat.details?.sessionId || this.getCurrentSessionId();

        if (sessionId) {
            // Invalidar sesión
            await this.invalidateSession(sessionId);

            // Requerir re-autenticación
            this.requireReAuthentication(sessionId);

            this.logger.info('ThreatMonitoring', `Sesión en cuarentena: ${sessionId}`);
        }
    }

    rateLimitIP(ip) {
        const currentLimits = this.networkMonitor.rateLimiter.get(ip) || { requests: 0, resetTime: Date.now() + 60000 };

        // Reducir límite para IP sospechosa
        currentLimits.maxRequests = Math.floor((currentLimits.maxRequests || 100) / 2);
        this.networkMonitor.rateLimiter.set(ip, currentLimits);

        this.logger.info('ThreatMonitoring', `Rate limit aplicado a IP: ${ip}`);
    }

    async sendAlert(threat) {
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            threat: threat,
            timestamp: new Date(),
            status: 'ACTIVE'
        };

        // Verificar cooldown para evitar spam
        const cooldownKey = `${threat.type}_${threat.source}`;
        const lastAlert = this.alertSystem.cooldown.get(cooldownKey);

        if (lastAlert && (Date.now() - lastAlert) < 60000) { // 1 minuto de cooldown
            return;
        }

        this.alertSystem.cooldown.set(cooldownKey, Date.now());

        // Enviar alert por todos los canales configurados
        for (const channel of this.alertSystem.channels) {
            await this.sendAlertToChannel(alert, channel);
        }

        this.alertQueue.push(alert);
        this.securityMetrics.alertsSent++;
    }

    async sendAlertToChannel(alert, channel) {
        const message = this.formatAlertMessage(alert);

        switch (channel) {
            case 'console':
                this.logger.error('SECURITY_ALERT', message);
                break;

            case 'storage':
                this.storeAlert(alert);
                break;

            case 'display':
                this.displayAlert(alert);
                break;

            case 'email':
                await this.sendEmailAlert(alert);
                break;

            case 'sms':
                await this.sendSMSAlert(alert);
                break;
        }
    }

    formatAlertMessage(alert) {
        const template = this.alertSystem.templates[alert.threat.type] ||
                        'Amenaza detectada: {type} desde {source}';

        return template
            .replace('{type}', alert.threat.type)
            .replace('{ip}', alert.threat.source)
            .replace('{source}', alert.threat.source)
            .replace('{user}', alert.threat.details?.user || 'desconocido')
            .replace('{requests}', alert.threat.details?.requests || 'N/A')
            .replace('{details}', JSON.stringify(alert.threat.details));
    }

    /**
     * Utilidades de detección
     */
    testSignature(request, signature) {
        // Probar firma contra diferentes partes del request
        const testFields = [
            request.url,
            request.userAgent,
            request.referer,
            JSON.stringify(request.headers),
            JSON.stringify(request.body)
        ].filter(Boolean);

        return testFields.some(field => signature.test(field));
    }

    async isSuspiciousURL(url) {
        // Lista de dominios sospechosos
        const suspiciousDomains = [
            'suspicious-domain.com',
            'malware-host.net',
            'phishing-site.org'
        ];

        try {
            const urlObj = new URL(url);
            return suspiciousDomains.some(domain =>
                urlObj.hostname.includes(domain)
            );
        } catch {
            return true; // URL malformada es sospechosa
        }
    }

    async isDDoSAttack(connection) {
        const ip = connection.ip;
        const currentRequests = this.networkMonitor.ddosDetector.requestCounts.get(ip) || [];
        const now = Date.now();

        // Filtrar requests en la ventana de tiempo
        const recentRequests = currentRequests.filter(
            timestamp => now - timestamp < this.networkMonitor.ddosDetector.timeWindow
        );

        return recentRequests.length > this.networkMonitor.ddosDetector.threshold;
    }

    async calculateAnomalyScore(userProfile, currentBehavior) {
        // Implementación simplificada de detección de anomalías
        let score = 0;
        let factors = 0;

        for (const feature of this.behaviorAnalyzer.features) {
            const baseline = userProfile.baseline[feature];
            const current = currentBehavior[feature];

            if (baseline && current !== undefined) {
                const deviation = Math.abs(current - baseline.mean) / (baseline.stdDev || 1);
                score += Math.min(deviation / 3, 1); // Normalizar a 0-1
                factors++;
            }
        }

        return factors > 0 ? score / factors : 0;
    }

    /**
     * Gestión de datos
     */
    getRecentRequests() {
        // Simulación - en producción obtener de logs reales
        return [
            {
                ip: '192.168.1.100',
                url: '/admin/login',
                method: 'POST',
                userAgent: 'Mozilla/5.0...',
                timestamp: new Date(),
                body: { username: 'admin', password: 'password' }
            }
        ];
    }

    getCurrentUser() {
        // Obtener usuario actual del sistema de autenticación
        return window.currentUser || null;
    }

    async getCurrentUserBehavior(user) {
        // Recopilar métricas de comportamiento actual
        return {
            access_patterns: this.getAccessPatterns(user),
            request_frequency: this.getRequestFrequency(user),
            data_access_volume: this.getDataAccessVolume(user),
            geographical_location: await this.getUserLocation(),
            device_fingerprint: this.getDeviceFingerprint(),
            session_duration: this.getSessionDuration()
        };
    }

    getActiveConnections() {
        // Simulación de conexiones activas
        return [
            { ip: '192.168.1.100', requests: 50, timestamp: new Date() },
            { ip: '10.0.0.5', requests: 25, timestamp: new Date() }
        ];
    }

    updateSystemStatus() {
        const activeCriticalThreats = Array.from(this.activeThreats.values())
            .filter(threat => threat.severity === 'CRITICAL').length;

        if (activeCriticalThreats > 0) {
            this.securityMetrics.systemStatus = 'UNDER_ATTACK';
        } else if (this.activeThreats.size > 5) {
            this.securityMetrics.systemStatus = 'ELEVATED';
        } else {
            this.securityMetrics.systemStatus = 'SECURE';
        }
    }

    cleanupOldData() {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // Limpiar amenazas antiguas
        for (const [id, threat] of this.activeThreats) {
            if (threat.timestamp.getTime() < oneWeekAgo) {
                this.activeThreats.delete(id);
            }
        }

        // Limpiar actividades sospechosas antiguas
        for (const [key, activity] of this.suspiciousActivities) {
            if (activity.timestamp < oneWeekAgo) {
                this.suspiciousActivities.delete(key);
            }
        }
    }

    /**
     * API pública
     */
    getThreatMetrics() {
        return {
            ...this.securityMetrics,
            activeThreats: this.activeThreats.size,
            blockedIPs: this.blockedIPs.size,
            alertsInQueue: this.alertQueue.length,
            threatHistory: this.threatHistory.length
        };
    }

    getSecurityStatus() {
        return {
            status: this.securityMetrics.systemStatus,
            lastScan: this.securityMetrics.lastScanTime,
            threats: {
                active: this.activeThreats.size,
                critical: Array.from(this.activeThreats.values())
                    .filter(t => t.severity === 'CRITICAL').length,
                high: Array.from(this.activeThreats.values())
                    .filter(t => t.severity === 'HIGH').length
            },
            monitoring: {
                intrusionDetection: 'ACTIVE',
                malwareDetection: 'ACTIVE',
                behaviorAnalysis: 'ACTIVE',
                networkMonitoring: 'ACTIVE'
            }
        };
    }

    isIPBlocked(ip) {
        return this.blockedIPs.has(ip);
    }

    async reportThreat(threatData) {
        // Permitir reportes manuales de amenazas
        await this.handleThreatDetection({
            type: 'MANUAL_REPORT',
            subtype: threatData.type || 'unknown',
            severity: threatData.severity || 'MEDIUM',
            source: threatData.source || 'manual',
            details: threatData,
            timestamp: new Date()
        });
    }

    // Utilidades auxiliares
    generateThreatId() {
        return 'threat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

/**
 * Detectores especializados auxiliares
 */
class BGEAnomalyDetector {
    async predict(historicalData) {
        // Implementación básica de predicción
        return [];
    }
}

class BGEGeolocationAnalyzer {
    async analyze(ip) {
        // Simulación de análisis de geolocalización
        return { country: 'MX', region: 'PUE', city: 'Puebla' };
    }
}

class BGEPatternAnalyzer {
    async findPatterns(data) {
        // Análisis básico de patrones
        return [];
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEThreatMonitoringSystem;
} else if (typeof window !== 'undefined') {
    window.BGEThreatMonitoringSystem = BGEThreatMonitoringSystem;
}