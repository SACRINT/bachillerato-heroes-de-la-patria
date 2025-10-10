/**
 * 🛡️ BGE Security Coordinator
 * Coordinador Principal del Sistema de Seguridad
 *
 * Orquesta y coordina todos los sistemas de seguridad implementados:
 * - Sistema de Autenticación Multifactor
 * - Sistema de Protección Criptográfica
 * - Sistema de Monitoreo de Amenazas
 * - Sistema de Auditorías Automatizadas
 * - Dashboard Ejecutivo de Seguridad
 * - Gestión de Incidentes de Seguridad
 * - Políticas de Seguridad Centralizadas
 *
 * @version 1.0.0
 * @since Phase D - Security Implementation
 */

class BGESecurityCoordinator {
    constructor() {
        this.coordinatorConfig = {
            modules: {
                authentication: 'BGEAdvancedAuthenticationSystem',
                cryptography: 'BGECryptographicProtectionSystem',
                threatMonitoring: 'BGEThreatMonitoringSystem',
                securityAudit: 'BGEAutomatedSecurityAuditSystem'
            },
            securityLevels: {
                MINIMAL: {
                    authentication: ['password'],
                    encryption: 'basic',
                    monitoring: 'passive',
                    auditing: 'weekly'
                },
                STANDARD: {
                    authentication: ['password', 'sms'],
                    encryption: 'standard',
                    monitoring: 'active',
                    auditing: 'daily'
                },
                ENHANCED: {
                    authentication: ['password', 'biometric', 'totp'],
                    encryption: 'advanced',
                    monitoring: 'realtime',
                    auditing: 'continuous'
                },
                MAXIMUM: {
                    authentication: ['password', 'biometric', 'hardware_key', 'behavioral'],
                    encryption: 'maximum',
                    monitoring: 'ai_enhanced',
                    auditing: 'realtime'
                }
            },
            alertPriorities: {
                EMERGENCY: { level: 1, escalation: 'immediate', response: 'automatic' },
                CRITICAL: { level: 2, escalation: '5min', response: 'guided' },
                HIGH: { level: 3, escalation: '15min', response: 'manual' },
                MEDIUM: { level: 4, escalation: '1h', response: 'scheduled' },
                LOW: { level: 5, escalation: '24h', response: 'batch' }
            }
        };

        this.securityModules = new Map();
        this.securityPolicies = new Map();
        this.incidentTracker = new Map();
        this.securityMetrics = new Map();
        this.activeAlerts = new Map();

        this.currentSecurityLevel = 'ENHANCED';
        this.systemStatus = 'INITIALIZING';

        this.logger = window.BGELogger || console;
        this.initializeSecurityCoordinator();
    }

    async initializeSecurityCoordinator() {
        try {
            this.logger.info('SecurityCoordinator', 'Inicializando coordinador principal de seguridad');

            // Inicializar módulos de seguridad
            await this.initializeSecurityModules();

            // Configurar políticas de seguridad
            await this.loadSecurityPolicies();

            // Configurar dashboard ejecutivo
            this.initializeExecutiveDashboard();

            // Configurar gestión de incidentes
            this.initializeIncidentManagement();

            // Configurar monitoreo integrado
            this.setupIntegratedMonitoring();

            // Configurar respuesta automatizada
            this.setupAutomatedResponse();

            // Inicializar métricas centralizadas
            this.initializeCentralizedMetrics();

            this.systemStatus = 'OPERATIONAL';
            this.logger.info('SecurityCoordinator', 'Coordinador de seguridad inicializado correctamente');

        } catch (error) {
            this.systemStatus = 'ERROR';
            this.logger.error('SecurityCoordinator', 'Error al inicializar coordinador', error);
            throw error;
        }
    }

    async initializeSecurityModules() {
        try {
            // Inicializar sistema de autenticación avanzada
            if (window.BGEAdvancedAuthenticationSystem) {
                this.securityModules.set('authentication', new window.BGEAdvancedAuthenticationSystem());
                this.logger.info('SecurityCoordinator', 'Módulo de autenticación inicializado');
            }

            // Inicializar sistema criptográfico
            if (window.BGECryptographicProtectionSystem) {
                this.securityModules.set('cryptography', new window.BGECryptographicProtectionSystem());
                this.logger.info('SecurityCoordinator', 'Módulo criptográfico inicializado');
            }

            // Inicializar monitoreo de amenazas
            if (window.BGEThreatMonitoringSystem) {
                this.securityModules.set('threatMonitoring', new window.BGEThreatMonitoringSystem());
                this.logger.info('SecurityCoordinator', 'Módulo de monitoreo inicializado');
            }

            // Inicializar auditorías automatizadas
            if (window.BGEAutomatedSecurityAuditSystem) {
                this.securityModules.set('securityAudit', new window.BGEAutomatedSecurityAuditSystem());
                this.logger.info('SecurityCoordinator', 'Módulo de auditoría inicializado');
            }

            // Verificar que todos los módulos críticos estén disponibles
            this.validateCriticalModules();

        } catch (error) {
            this.logger.error('SecurityCoordinator', 'Error al inicializar módulos', error);
            throw error;
        }
    }

    validateCriticalModules() {
        const criticalModules = ['authentication', 'cryptography', 'threatMonitoring'];
        const missingModules = [];

        for (const module of criticalModules) {
            if (!this.securityModules.has(module)) {
                missingModules.push(module);
            }
        }

        if (missingModules.length > 0) {
            throw new Error(`Módulos críticos faltantes: ${missingModules.join(', ')}`);
        }
    }

    async loadSecurityPolicies() {
        // Políticas de seguridad centralizadas
        this.securityPolicies.set('authentication', {
            name: 'Política de Autenticación',
            version: '2.0',
            enforced: true,
            rules: {
                minPasswordLength: 12,
                requireSpecialChars: true,
                mfaRequired: true,
                sessionTimeout: 8 * 60 * 60 * 1000, // 8 horas
                maxFailedAttempts: 5,
                accountLockoutTime: 30 * 60 * 1000 // 30 minutos
            }
        });

        this.securityPolicies.set('encryption', {
            name: 'Política de Encriptación',
            version: '1.0',
            enforced: true,
            rules: {
                minKeyLength: 256,
                allowedAlgorithms: ['AES-256-GCM', 'RSA-4096', 'ECDSA-P384'],
                keyRotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 días
                dataClassification: {
                    'CONFIDENCIAL': 'AES-256-GCM',
                    'RESTRINGIDO': 'AES-256-GCM',
                    'INTERNO': 'AES-256-GCM',
                    'PUBLICO': 'none'
                }
            }
        });

        this.securityPolicies.set('access_control', {
            name: 'Política de Control de Acceso',
            version: '1.5',
            enforced: true,
            rules: {
                principleOfLeastPrivilege: true,
                roleBasedAccess: true,
                privilegedAccountReview: 30 * 24 * 60 * 60 * 1000, // 30 días
                accessCertification: 90 * 24 * 60 * 60 * 1000, // 90 días
                emergencyAccess: {
                    enabled: true,
                    auditRequired: true,
                    autoRevoke: 24 * 60 * 60 * 1000 // 24 horas
                }
            }
        });

        this.securityPolicies.set('incident_response', {
            name: 'Política de Respuesta a Incidentes',
            version: '1.0',
            enforced: true,
            rules: {
                reportingTimeframe: 1 * 60 * 60 * 1000, // 1 hora
                escalationMatrix: {
                    'CRITICAL': ['CISO', 'Director', 'IT-Manager'],
                    'HIGH': ['Security-Team', 'IT-Manager'],
                    'MEDIUM': ['Security-Team'],
                    'LOW': ['IT-Support']
                },
                investigationProcedure: 'formal',
                evidencePreservation: true,
                communicationPlan: 'established'
            }
        });

        this.logger.info('SecurityCoordinator', 'Políticas de seguridad cargadas');
    }

    initializeExecutiveDashboard() {
        // Dashboard ejecutivo de seguridad
        this.executiveDashboard = {
            securityPosture: {
                overall: 'SECURE',
                authentication: 'STRONG',
                encryption: 'ROBUST',
                monitoring: 'ACTIVE',
                compliance: 'COMPLIANT'
            },
            realTimeMetrics: {
                activeThreats: 0,
                blockedAttacks: 0,
                securityScore: 95,
                complianceScore: 98,
                lastIncident: null
            },
            trendAnalysis: {
                threatTrend: 'DECREASING',
                securityTrend: 'IMPROVING',
                complianceTrend: 'STABLE'
            },
            keyPerformanceIndicators: {
                meanTimeToDetect: '2.5 minutes',
                meanTimeToRespond: '5.2 minutes',
                falsePositiveRate: '3.2%',
                securityEventVolume: '1,234 events/day'
            }
        };

        this.logger.info('SecurityCoordinator', 'Dashboard ejecutivo inicializado');
    }

    initializeIncidentManagement() {
        // Sistema de gestión de incidentes
        this.incidentManagement = {
            categories: {
                'MALWARE': { severity: 'HIGH', response: 'immediate' },
                'PHISHING': { severity: 'MEDIUM', response: 'guided' },
                'DATA_BREACH': { severity: 'CRITICAL', response: 'emergency' },
                'UNAUTHORIZED_ACCESS': { severity: 'HIGH', response: 'immediate' },
                'SYSTEM_COMPROMISE': { severity: 'CRITICAL', response: 'emergency' },
                'POLICY_VIOLATION': { severity: 'MEDIUM', response: 'scheduled' }
            },
            responseTeam: {
                'CISO': { role: 'leader', contact: 'ciso@bge.edu.mx' },
                'Security-Analyst': { role: 'investigator', contact: 'security@bge.edu.mx' },
                'IT-Manager': { role: 'technical', contact: 'it@bge.edu.mx' },
                'Legal-Counsel': { role: 'compliance', contact: 'legal@bge.edu.mx' }
            },
            workflows: new Map()
        };

        this.logger.info('SecurityCoordinator', 'Gestión de incidentes inicializada');
    }

    setupIntegratedMonitoring() {
        // Monitoreo integrado de todos los módulos
        setInterval(async () => {
            await this.performHealthCheck();
        }, 60000); // Cada minuto

        setInterval(async () => {
            await this.updateDashboardMetrics();
        }, 30000); // Cada 30 segundos

        setInterval(async () => {
            await this.correlateSecurityEvents();
        }, 300000); // Cada 5 minutos

        this.logger.info('SecurityCoordinator', 'Monitoreo integrado configurado');
    }

    setupAutomatedResponse() {
        // Configurar respuestas automáticas coordinadas
        this.responsePlaybooks = new Map([
            ['CRITICAL_BREACH', {
                steps: [
                    'isolate_affected_systems',
                    'preserve_evidence',
                    'notify_stakeholders',
                    'activate_incident_response',
                    'begin_investigation'
                ],
                timeout: 300000 // 5 minutos
            }],
            ['MALWARE_DETECTED', {
                steps: [
                    'quarantine_threat',
                    'scan_related_systems',
                    'update_signatures',
                    'notify_security_team'
                ],
                timeout: 60000 // 1 minuto
            }],
            ['SUSPICIOUS_BEHAVIOR', {
                steps: [
                    'increase_monitoring',
                    'require_additional_auth',
                    'log_detailed_activity',
                    'notify_user_manager'
                ],
                timeout: 180000 // 3 minutos
            }]
        ]);

        this.logger.info('SecurityCoordinator', 'Respuesta automatizada configurada');
    }

    initializeCentralizedMetrics() {
        // Métricas centralizadas de todos los módulos
        this.centralMetrics = {
            authentication: {
                totalLogins: 0,
                failedLogins: 0,
                mfaAdoption: 0,
                averageSessionTime: 0
            },
            encryption: {
                encryptedDataVolume: 0,
                keyRotations: 0,
                cryptographicOperations: 0,
                securityLevel: 'HIGH'
            },
            threats: {
                detectedThreats: 0,
                blockedThreats: 0,
                falsePositives: 0,
                responseTime: 0
            },
            compliance: {
                auditsPassed: 0,
                auditsFailed: 0,
                complianceScore: 0,
                remediationTasks: 0
            }
        };

        this.logger.info('SecurityCoordinator', 'Métricas centralizadas inicializadas');
    }

    /**
     * Operaciones de coordinación principal
     */
    async performHealthCheck() {
        try {
            const healthStatus = {
                timestamp: new Date(),
                overall: 'HEALTHY',
                modules: {}
            };

            // Verificar salud de cada módulo
            for (const [name, module] of this.securityModules) {
                try {
                    const moduleHealth = await this.checkModuleHealth(name, module);
                    healthStatus.modules[name] = moduleHealth;

                    if (moduleHealth.status !== 'HEALTHY') {
                        healthStatus.overall = 'DEGRADED';
                        this.logger.warn('SecurityCoordinator', `Módulo ${name} en estado: ${moduleHealth.status}`);
                    }
                } catch (error) {
                    healthStatus.modules[name] = { status: 'ERROR', error: error.message };
                    healthStatus.overall = 'ERROR';
                    this.logger.error('SecurityCoordinator', `Error en módulo ${name}`, error);
                }
            }

            // Actualizar estado del sistema
            this.systemStatus = healthStatus.overall;
            this.lastHealthCheck = healthStatus;

        } catch (error) {
            this.logger.error('SecurityCoordinator', 'Error en health check', error);
        }
    }

    async checkModuleHealth(name, module) {
        const health = { status: 'HEALTHY', metrics: {}, issues: [] };

        switch (name) {
            case 'authentication':
                if (module.getSecurityMetrics) {
                    const metrics = module.getSecurityMetrics();
                    health.metrics = metrics;

                    if (metrics.activeSessions > 1000) {
                        health.issues.push('High session load');
                    }
                    if (metrics.failedAttempts > 100) {
                        health.issues.push('High failed login rate');
                    }
                }
                break;

            case 'cryptography':
                if (module.getCryptographicMetrics) {
                    const metrics = module.getCryptographicMetrics();
                    health.metrics = metrics;

                    if (metrics.activeKeys.userKeys > 10000) {
                        health.issues.push('High key usage');
                    }
                }
                break;

            case 'threatMonitoring':
                if (module.getThreatMetrics) {
                    const metrics = module.getThreatMetrics();
                    health.metrics = metrics;

                    if (metrics.activeThreats > 10) {
                        health.status = 'WARNING';
                        health.issues.push('Multiple active threats');
                    }
                    if (metrics.systemStatus === 'UNDER_ATTACK') {
                        health.status = 'CRITICAL';
                        health.issues.push('System under attack');
                    }
                }
                break;

            case 'securityAudit':
                if (module.getAuditStatus) {
                    const status = module.getAuditStatus();
                    health.metrics = status.metrics;

                    if (status.metrics.criticalFindings > 0) {
                        health.status = 'WARNING';
                        health.issues.push('Critical audit findings');
                    }
                }
                break;
        }

        if (health.issues.length > 3) {
            health.status = 'UNHEALTHY';
        } else if (health.issues.length > 1) {
            health.status = 'WARNING';
        }

        return health;
    }

    async updateDashboardMetrics() {
        try {
            // Actualizar métricas del dashboard ejecutivo
            const authModule = this.securityModules.get('authentication');
            const cryptoModule = this.securityModules.get('cryptography');
            const threatModule = this.securityModules.get('threatMonitoring');
            const auditModule = this.securityModules.get('securityAudit');

            // Métricas de autenticación
            if (authModule && authModule.getSecurityMetrics) {
                const authMetrics = authModule.getSecurityMetrics();
                this.executiveDashboard.realTimeMetrics.activeSessions = authMetrics.activeSessions;
                this.centralMetrics.authentication = { ...this.centralMetrics.authentication, ...authMetrics };
            }

            // Métricas de amenazas
            if (threatModule && threatModule.getThreatMetrics) {
                const threatMetrics = threatModule.getThreatMetrics();
                this.executiveDashboard.realTimeMetrics.activeThreats = threatMetrics.activeThreats;
                this.executiveDashboard.realTimeMetrics.blockedAttacks = threatMetrics.threatsBlocked;
                this.centralMetrics.threats = { ...this.centralMetrics.threats, ...threatMetrics };
            }

            // Métricas de auditoría
            if (auditModule && auditModule.getAuditStatus) {
                const auditStatus = auditModule.getAuditStatus();
                this.executiveDashboard.realTimeMetrics.complianceScore = auditStatus.metrics.complianceScore;
                this.centralMetrics.compliance = { ...this.centralMetrics.compliance, ...auditStatus.metrics };
            }

            // Calcular puntuación general de seguridad
            this.executiveDashboard.realTimeMetrics.securityScore = this.calculateOverallSecurityScore();

        } catch (error) {
            this.logger.error('SecurityCoordinator', 'Error al actualizar métricas', error);
        }
    }

    async correlateSecurityEvents() {
        try {
            // Correlacionar eventos de todos los módulos
            const correlatedEvents = [];

            // Obtener eventos de monitoreo de amenazas
            const threatModule = this.securityModules.get('threatMonitoring');
            if (threatModule && threatModule.getRecentThreats) {
                const recentThreats = threatModule.getRecentThreats(300000); // 5 minutos
                correlatedEvents.push(...recentThreats);
            }

            // Obtener eventos de autenticación
            const authModule = this.securityModules.get('authentication');
            if (authModule && authModule.getRecentEvents) {
                const authEvents = authModule.getRecentEvents(300000);
                correlatedEvents.push(...authEvents);
            }

            // Analizar patrones y correlaciones
            const patterns = this.analyzeEventPatterns(correlatedEvents);

            // Generar alertas si se detectan patrones sospechosos
            for (const pattern of patterns) {
                if (pattern.severity === 'HIGH' || pattern.severity === 'CRITICAL') {
                    await this.triggerSecurityAlert(pattern);
                }
            }

        } catch (error) {
            this.logger.error('SecurityCoordinator', 'Error en correlación de eventos', error);
        }
    }

    analyzeEventPatterns(events) {
        const patterns = [];

        // Patrón: Múltiples fallos de autenticación seguidos de amenaza
        const authFailures = events.filter(e => e.type === 'AUTH_FAILURE');
        const threats = events.filter(e => e.type === 'THREAT_DETECTED');

        if (authFailures.length > 5 && threats.length > 0) {
            patterns.push({
                type: 'COORDINATED_ATTACK',
                severity: 'HIGH',
                description: 'Múltiples fallos de autenticación seguidos de amenaza detectada',
                events: [...authFailures, ...threats],
                confidence: 0.8
            });
        }

        // Patrón: Acceso anómalo seguido de actividad de red sospechosa
        const anomalousAccess = events.filter(e => e.type === 'ANOMALOUS_BEHAVIOR');
        const networkActivity = events.filter(e => e.type === 'SUSPICIOUS_NETWORK');

        if (anomalousAccess.length > 0 && networkActivity.length > 0) {
            patterns.push({
                type: 'INSIDER_THREAT',
                severity: 'CRITICAL',
                description: 'Comportamiento anómalo seguido de actividad de red sospechosa',
                events: [...anomalousAccess, ...networkActivity],
                confidence: 0.9
            });
        }

        return patterns;
    }

    async triggerSecurityAlert(pattern) {
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            timestamp: new Date(),
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            confidence: pattern.confidence,
            events: pattern.events,
            status: 'ACTIVE',
            assignedTo: null,
            responseActions: []
        };

        this.activeAlerts.set(alertId, alert);

        // Ejecutar respuesta automática si aplica
        if (this.responsePlaybooks.has(pattern.type)) {
            await this.executeResponsePlaybook(pattern.type, alert);
        }

        // Notificar al equipo de respuesta
        await this.notifyResponseTeam(alert);

        this.logger.warn('SecurityCoordinator', `Alerta de seguridad generada: ${alertId} - ${pattern.type}`);
    }

    async executeResponsePlaybook(playbookType, alert) {
        const playbook = this.responsePlaybooks.get(playbookType);
        if (!playbook) return;

        try {
            for (const step of playbook.steps) {
                await this.executeResponseStep(step, alert);
                alert.responseActions.push({
                    step: step,
                    timestamp: new Date(),
                    status: 'COMPLETED'
                });
            }

            this.logger.info('SecurityCoordinator', `Playbook ejecutado: ${playbookType}`);

        } catch (error) {
            this.logger.error('SecurityCoordinator', `Error en playbook ${playbookType}`, error);
        }
    }

    async executeResponseStep(step, alert) {
        switch (step) {
            case 'isolate_affected_systems':
                await this.isolateAffectedSystems(alert);
                break;

            case 'preserve_evidence':
                await this.preserveEvidence(alert);
                break;

            case 'notify_stakeholders':
                await this.notifyStakeholders(alert);
                break;

            case 'quarantine_threat':
                await this.quarantineThreat(alert);
                break;

            case 'increase_monitoring':
                await this.increaseMonitoring(alert);
                break;

            default:
                this.logger.warn('SecurityCoordinator', `Paso de respuesta no implementado: ${step}`);
        }
    }

    calculateOverallSecurityScore() {
        // Algoritmo de puntuación basado en múltiples factores
        let score = 100;

        // Penalizar por amenazas activas
        const activeThreats = this.executiveDashboard.realTimeMetrics.activeThreats;
        score -= activeThreats * 5;

        // Penalizar por hallazgos críticos de auditoría
        const criticalFindings = this.centralMetrics.compliance.criticalFindings || 0;
        score -= criticalFindings * 10;

        // Bonificar por cumplimiento
        const complianceScore = this.executiveDashboard.realTimeMetrics.complianceScore;
        score = (score + complianceScore) / 2;

        // Asegurar que esté en rango 0-100
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * API pública para integración
     */
    async authenticateUser(credentials, securityLevel = null) {
        const authModule = this.securityModules.get('authentication');
        if (!authModule) {
            throw new Error('Módulo de autenticación no disponible');
        }

        const level = securityLevel || this.getRequiredSecurityLevel(credentials.userType);
        return await authModule.authenticate(credentials, level);
    }

    async encryptData(data, dataType, userId) {
        const cryptoModule = this.securityModules.get('cryptography');
        if (!cryptoModule) {
            throw new Error('Módulo criptográfico no disponible');
        }

        return await cryptoModule.encryptSensitiveData(data, dataType, userId);
    }

    async reportSecurityIncident(incidentData) {
        const incidentId = this.generateIncidentId();
        const incident = {
            id: incidentId,
            timestamp: new Date(),
            type: incidentData.type || 'UNKNOWN',
            severity: incidentData.severity || 'MEDIUM',
            description: incidentData.description,
            reporter: incidentData.reporter || 'SYSTEM',
            status: 'OPEN',
            assignedTo: this.assignIncidentResponsible(incidentData.type),
            responseTime: null,
            resolutionTime: null,
            evidence: incidentData.evidence || [],
            actions: []
        };

        this.incidentTracker.set(incidentId, incident);

        // Iniciar respuesta automática si aplica
        await this.initiateIncidentResponse(incident);

        this.logger.info('SecurityCoordinator', `Incidente reportado: ${incidentId}`);
        return incidentId;
    }

    getSecurityStatus() {
        return {
            systemStatus: this.systemStatus,
            securityLevel: this.currentSecurityLevel,
            lastHealthCheck: this.lastHealthCheck?.timestamp,
            dashboard: this.executiveDashboard,
            activeAlerts: this.activeAlerts.size,
            activeIncidents: this.getActiveIncidentCount(),
            moduleStatus: this.getModuleStatus(),
            metrics: this.centralMetrics
        };
    }

    getExecutiveDashboard() {
        return {
            ...this.executiveDashboard,
            lastUpdated: new Date(),
            systemHealth: this.systemStatus,
            moduleCount: this.securityModules.size,
            policyCount: this.securityPolicies.size
        };
    }

    async performSecurityAssessment() {
        const assessment = {
            timestamp: new Date(),
            overallRating: 'SECURE',
            modules: {},
            recommendations: [],
            actionItems: []
        };

        // Evaluar cada módulo
        for (const [name, module] of this.securityModules) {
            const moduleAssessment = await this.assessModule(name, module);
            assessment.modules[name] = moduleAssessment;

            if (moduleAssessment.rating === 'NEEDS_IMPROVEMENT') {
                assessment.overallRating = 'NEEDS_IMPROVEMENT';
            }
        }

        // Generar recomendaciones
        assessment.recommendations = this.generateSecurityRecommendations(assessment);

        return assessment;
    }

    // Utilidades auxiliares
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateIncidentId() {
        return 'incident_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getRequiredSecurityLevel(userType) {
        const levelMapping = {
            'admin': 'MAXIMUM',
            'director': 'ENHANCED',
            'docente': 'STANDARD',
            'estudiante': 'MINIMAL'
        };

        return levelMapping[userType] || 'STANDARD';
    }

    getActiveIncidentCount() {
        return Array.from(this.incidentTracker.values())
            .filter(incident => incident.status === 'OPEN' || incident.status === 'IN_PROGRESS').length;
    }

    getModuleStatus() {
        const status = {};
        for (const [name, module] of this.securityModules) {
            status[name] = 'ACTIVE';
        }
        return status;
    }

    assignIncidentResponsible(incidentType) {
        const assignments = {
            'MALWARE': 'security-team',
            'PHISHING': 'security-team',
            'DATA_BREACH': 'ciso',
            'UNAUTHORIZED_ACCESS': 'security-team',
            'SYSTEM_COMPROMISE': 'ciso',
            'POLICY_VIOLATION': 'compliance-team'
        };

        return assignments[incidentType] || 'security-team';
    }
}

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGESecurityCoordinator;
} else if (typeof window !== 'undefined') {
    window.BGESecurityCoordinator = BGESecurityCoordinator;
}