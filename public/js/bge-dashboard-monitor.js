/**
 * 📊 BGE - DASHBOARD DE MONITOREO INTEGRAL
 * Fase 4: Dashboard centralizado para todos los sistemas BGE
 *
 * Monitoreo integrado de:
 * - 5 Sistemas IA de Fase 3
 * - Sistema de Testing
 * - Sistema de Optimización
 * - Sistema de Seguridad
 *
 * Desarrollado para Bachillerato General Estatal "Héroes de la Patria"
 * @version 4.0.0
 * @author BGE Dashboard Team
 * @date 2025-09-25
 */

class BGEDashboardMonitor {
    constructor() {
        this.version = '4.0.0';
        this.sistema = 'Dashboard de Monitoreo Integral BGE';

        // Configuración del dashboard
        this.config = {
            // Sistemas monitoreados
            systems: {
                // Fase 3 - Sistemas IA
                chatbot: {
                    name: 'Chatbot IA',
                    type: 'ai_system',
                    phase: 3,
                    globalVar: 'window.bgeChatbot',
                    priority: 'high',
                    healthEndpoint: '/api/chatbot-ia/status'
                },
                recommendations: {
                    name: 'Recomendaciones ML',
                    type: 'ai_system',
                    phase: 3,
                    globalVar: 'window.bgeRecomendaciones',
                    priority: 'high',
                    healthEndpoint: '/api/recomendaciones-ml/status'
                },
                analytics: {
                    name: 'Analytics Predictivo',
                    type: 'ai_system',
                    phase: 3,
                    globalVar: 'window.bgeAnalytics',
                    priority: 'critical',
                    healthEndpoint: '/api/analytics-predictivo/status'
                },
                assistant: {
                    name: 'Asistente Virtual',
                    type: 'ai_system',
                    phase: 3,
                    globalVar: 'window.bgeAsistenteVirtual',
                    priority: 'high',
                    healthEndpoint: '/api/asistente-virtual/status'
                },
                riskDetection: {
                    name: 'Detección Riesgos',
                    type: 'ai_system',
                    phase: 3,
                    globalVar: 'window.bgeDeteccionRiesgos',
                    priority: 'critical',
                    healthEndpoint: '/api/deteccion-riesgos/status'
                },

                // Fase 4 - Sistemas de Soporte
                testing: {
                    name: 'Sistema Testing',
                    type: 'support_system',
                    phase: 4,
                    globalVar: 'window.bgeTestingSystem',
                    priority: 'medium',
                    healthEndpoint: null
                },
                optimizer: {
                    name: 'Optimizador',
                    type: 'support_system',
                    phase: 4,
                    globalVar: 'window.bgePerformanceOptimizer',
                    priority: 'high',
                    healthEndpoint: null
                },
                security: {
                    name: 'Sistema Seguridad',
                    type: 'support_system',
                    phase: 4,
                    globalVar: 'window.bgeSecurityManager',
                    priority: 'critical',
                    healthEndpoint: null
                }
            },

            // Configuración de monitoreo
            monitoring: {
                refreshInterval: 5000,      // 5 segundos
                alertThreshold: 80,         // 80% para alertas
                criticalThreshold: 95,      // 95% crítico
                historyRetention: 100,      // 100 entradas de historial
                autoActions: true           // Acciones automáticas
            },

            // Configuración de alertas
            alerts: {
                enabled: true,
                soundEnabled: false,
                showNotifications: true,
                severity: {
                    low: { color: '#28a745', sound: null },
                    medium: { color: '#ffc107', sound: 'beep' },
                    high: { color: '#ff6b35', sound: 'alert' },
                    critical: { color: '#dc3545', sound: 'siren' }
                }
            }
        };

        // Estado del dashboard
        this.state = {
            active: false,
            systemsStatus: new Map(),
            overallHealth: 100,
            activeAlerts: [],
            metricsHistory: new Map(),
            lastUpdate: null,
            connectedSystems: 0,
            totalSystems: Object.keys(this.config.systems).length
        };

        // Métricas consolidadas
        this.consolidatedMetrics = {
            performance: {
                avgResponseTime: 0,
                totalThroughput: 0,
                errorRate: 0,
                uptime: 0
            },
            resources: {
                memoryUsage: 0,
                cpuUsage: 0,
                cacheHitRate: 0,
                networkLatency: 0
            },
            security: {
                threatLevel: 'low',
                blockedRequests: 0,
                securityScore: 100,
                lastScan: null
            },
            quality: {
                testsPassed: 0,
                testsTotal: 0,
                codeQuality: 0,
                bugCount: 0
            }
        };

        // Sistema de alertas
        this.alertSystem = {
            queue: [],
            history: [],
            activeAlerts: new Map(),
            sounds: new Map()
        };

        // Intervals y timers
        this.intervals = new Map();
        this.timers = new Map();

        this.init();
    }

    /**
     * Inicialización del dashboard
     */
    async init() {
        try {
            console.log(`📊 Inicializando ${this.sistema} v${this.version}`);

            await this.discoverSystems();
            await this.initializeMetricsCollection();
            this.setupAlertSystem();
            this.createUI();
            this.setupEventListeners();
            this.startMonitoring();

            this.state.active = true;
            console.log('✅ Dashboard de Monitoreo inicializado correctamente');
            this.logDashboardEvent('info', 'Dashboard BGE inicializado exitosamente');

        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            this.logDashboardEvent('error', `Error de inicialización: ${error.message}`);
        }
    }

    /**
     * Descubrir sistemas disponibles
     */
    async discoverSystems() {
        let connectedCount = 0;

        for (const [systemKey, systemConfig] of Object.entries(this.config.systems)) {
            try {
                const isAvailable = await this.checkSystemAvailability(systemKey, systemConfig);

                if (isAvailable) {
                    connectedCount++;
                    this.state.systemsStatus.set(systemKey, {
                        status: 'online',
                        lastSeen: Date.now(),
                        health: 100,
                        metrics: {},
                        errors: []
                    });
                } else {
                    this.state.systemsStatus.set(systemKey, {
                        status: 'offline',
                        lastSeen: null,
                        health: 0,
                        metrics: {},
                        errors: ['Sistema no disponible']
                    });
                }
            } catch (error) {
                this.state.systemsStatus.set(systemKey, {
                    status: 'error',
                    lastSeen: null,
                    health: 0,
                    metrics: {},
                    errors: [error.message]
                });
            }
        }

        this.state.connectedSystems = connectedCount;
        this.logDashboardEvent('info', `Descubrimiento completado: ${connectedCount}/${this.state.totalSystems} sistemas conectados`);
    }

    /**
     * Verificar disponibilidad de sistema
     */
    async checkSystemAvailability(systemKey, systemConfig) {
        try {
            // Verificar variable global
            if (systemConfig.globalVar) {
                const globalObj = this.getGlobalObject(systemConfig.globalVar);
                if (globalObj) {
                    return true;
                }
            }

            // Verificar endpoint de salud
            if (systemConfig.healthEndpoint) {
                const response = await fetch(systemConfig.healthEndpoint, {
                    timeout: 3000
                });
                return response.ok;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Inicializar recolección de métricas
     */
    async initializeMetricsCollection() {
        // Configurar historial de métricas para cada sistema
        for (const systemKey of Object.keys(this.config.systems)) {
            this.state.metricsHistory.set(systemKey, []);
        }

        // Configurar métricas consolidadas
        this.state.metricsHistory.set('consolidated', []);
    }

    /**
     * Configurar sistema de alertas
     */
    setupAlertSystem() {
        // Cargar sonidos de alertas (si están disponibles)
        this.loadAlertSounds();

        // Configurar niveles de alerta
        this.alertLevels = {
            info: { priority: 1, color: '#17a2b8' },
            warning: { priority: 2, color: '#ffc107' },
            error: { priority: 3, color: '#fd7e14' },
            critical: { priority: 4, color: '#dc3545' }
        };
    }

    /**
     * Cargar sonidos de alerta
     */
    loadAlertSounds() {
        const sounds = {
            beep: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAAB...',
            alert: 'data:audio/wav;base64,UklGRnIHAABXQVZFZm10IBAAAAAB...',
            siren: 'data:audio/wav;base64,UklGRpQHAABXQVZFZm10IBAAAAAB...'
        };

        for (const [name, data] of Object.entries(sounds)) {
            try {
                const audio = new Audio(data);
                this.alertSystem.sounds.set(name, audio);
            } catch (error) {
                console.warn(`No se pudo cargar sonido ${name}:`, error);
            }
        }
    }

    /**
     * Iniciar monitoreo
     */
    startMonitoring() {
        // Monitoreo principal
        this.intervals.set('main-monitoring', setInterval(() => {
            this.collectAllMetrics();
        }, this.config.monitoring.refreshInterval));

        // Análisis de salud general
        this.intervals.set('health-analysis', setInterval(() => {
            this.analyzeSystemHealth();
        }, 10000)); // Cada 10 segundos

        // Limpieza de historial
        this.intervals.set('cleanup', setInterval(() => {
            this.cleanupMetricsHistory();
        }, 60000)); // Cada minuto

        // Verificación de alertas
        this.intervals.set('alert-check', setInterval(() => {
            this.processAlerts();
        }, 2000)); // Cada 2 segundos

        this.logDashboardEvent('info', 'Monitoreo iniciado');
    }

    /**
     * Recopilar todas las métricas
     */
    async collectAllMetrics() {
        const timestamp = Date.now();
        const metrics = {};

        try {
            // Recopilar métricas de cada sistema
            for (const [systemKey, systemConfig] of Object.entries(this.config.systems)) {
                const systemMetrics = await this.collectSystemMetrics(systemKey, systemConfig);
                metrics[systemKey] = systemMetrics;

                // Actualizar estado del sistema
                this.updateSystemStatus(systemKey, systemMetrics);
            }

            // Consolidar métricas
            await this.consolidateMetrics(metrics, timestamp);

            // Actualizar UI
            this.updateDashboardDisplay();

            this.state.lastUpdate = timestamp;

        } catch (error) {
            this.logDashboardEvent('error', `Error recopilando métricas: ${error.message}`);
        }
    }

    /**
     * Recopilar métricas de un sistema específico
     */
    async collectSystemMetrics(systemKey, systemConfig) {
        const defaultMetrics = {
            status: 'unknown',
            health: 0,
            responseTime: 0,
            memoryUsage: 0,
            errorCount: 0,
            timestamp: Date.now()
        };

        try {
            // Obtener objeto del sistema
            const systemObj = this.getGlobalObject(systemConfig.globalVar);

            if (!systemObj) {
                return { ...defaultMetrics, status: 'offline' };
            }

            // Recopilar métricas específicas por tipo de sistema
            let metrics = { ...defaultMetrics, status: 'online' };

            if (systemObj.getSystemMetrics) {
                const systemSpecificMetrics = systemObj.getSystemMetrics();
                metrics = { ...metrics, ...systemSpecificMetrics };
            } else if (systemObj.getSecurityMetrics) {
                const securityMetrics = systemObj.getSecurityMetrics();
                metrics = { ...metrics, ...securityMetrics };
            } else if (systemObj.getMetrics) {
                const generalMetrics = systemObj.getMetrics();
                metrics = { ...metrics, ...generalMetrics };
            }

            // Métricas adicionales basadas en tipo
            if (systemConfig.type === 'ai_system') {
                metrics.aiSpecific = await this.collectAIMetrics(systemKey, systemObj);
            } else if (systemConfig.type === 'support_system') {
                metrics.supportSpecific = await this.collectSupportMetrics(systemKey, systemObj);
            }

            return metrics;

        } catch (error) {
            return {
                ...defaultMetrics,
                status: 'error',
                errorCount: 1,
                lastError: error.message
            };
        }
    }

    /**
     * Recopilar métricas específicas de sistemas IA
     */
    async collectAIMetrics(systemKey, systemObj) {
        const aiMetrics = {
            accuracy: 0,
            processedRequests: 0,
            averageResponseTime: 0,
            modelVersion: 'unknown'
        };

        try {
            // Intentar obtener métricas específicas de IA
            if (systemObj.getAccuracy) {
                aiMetrics.accuracy = systemObj.getAccuracy();
            }

            if (systemObj.getProcessedRequests) {
                aiMetrics.processedRequests = systemObj.getProcessedRequests();
            }

            if (systemObj.getAverageResponseTime) {
                aiMetrics.averageResponseTime = systemObj.getAverageResponseTime();
            }

            if (systemObj.version) {
                aiMetrics.modelVersion = systemObj.version;
            }

        } catch (error) {
            aiMetrics.error = error.message;
        }

        return aiMetrics;
    }

    /**
     * Recopilar métricas específicas de sistemas de soporte
     */
    async collectSupportMetrics(systemKey, systemObj) {
        const supportMetrics = {
            tasksCompleted: 0,
            activeProcesses: 0,
            efficiency: 0,
            uptime: 0
        };

        try {
            // Testing system metrics
            if (systemKey === 'testing' && systemObj.getSystemMetrics) {
                const testMetrics = systemObj.getSystemMetrics();
                supportMetrics.testsRun = testMetrics.totalTests || 0;
                supportMetrics.successRate = testMetrics.successRate || 0;
            }

            // Performance optimizer metrics
            if (systemKey === 'optimizer' && systemObj.getSystemMetrics) {
                const optimizerMetrics = systemObj.getSystemMetrics();
                supportMetrics.optimizationCount = optimizerMetrics.optimizationCount || 0;
                supportMetrics.improvementPercentage = optimizerMetrics.improvementPercentage || 0;
            }

            // Security manager metrics
            if (systemKey === 'security' && systemObj.getSecurityMetrics) {
                const securityMetrics = systemObj.getSecurityMetrics();
                supportMetrics.threatsDetected = securityMetrics.threatCount || 0;
                supportMetrics.securityScore = securityMetrics.systemHealth || 100;
            }

        } catch (error) {
            supportMetrics.error = error.message;
        }

        return supportMetrics;
    }

    /**
     * Consolidar todas las métricas
     */
    async consolidateMetrics(systemsMetrics, timestamp) {
        const consolidated = {
            timestamp,
            performance: { avgResponseTime: 0, totalThroughput: 0, errorRate: 0, uptime: 0 },
            resources: { memoryUsage: 0, cpuUsage: 0, cacheHitRate: 0, networkLatency: 0 },
            security: { threatLevel: 'low', blockedRequests: 0, securityScore: 100, lastScan: null },
            quality: { testsPassed: 0, testsTotal: 0, codeQuality: 0, bugCount: 0 }
        };

        let validSystems = 0;
        let totalResponseTime = 0;
        let totalMemoryUsage = 0;
        let totalErrors = 0;
        let totalRequests = 0;

        // Agregar métricas de todos los sistemas
        for (const [systemKey, metrics] of Object.entries(systemsMetrics)) {
            if (metrics.status === 'online') {
                validSystems++;

                // Rendimiento
                if (metrics.responseTime) {
                    totalResponseTime += metrics.responseTime;
                }

                if (metrics.memoryUsage) {
                    totalMemoryUsage += metrics.memoryUsage;
                }

                if (metrics.errorCount) {
                    totalErrors += metrics.errorCount;
                }

                // Métricas específicas por sistema
                if (systemKey === 'security' && metrics.threatCount) {
                    consolidated.security.blockedRequests += metrics.threatCount;
                    consolidated.security.securityScore = Math.min(consolidated.security.securityScore, metrics.systemHealth || 100);
                }

                if (systemKey === 'testing' && metrics.totalTests) {
                    consolidated.quality.testsTotal += metrics.totalTests;
                    consolidated.quality.testsPassed += metrics.successRate ? Math.round(metrics.totalTests * (metrics.successRate / 100)) : 0;
                }
            }
        }

        // Calcular promedios
        if (validSystems > 0) {
            consolidated.performance.avgResponseTime = Math.round(totalResponseTime / validSystems);
            consolidated.resources.memoryUsage = Math.round(totalMemoryUsage / validSystems);
            consolidated.performance.errorRate = totalErrors > 0 ? Math.round((totalErrors / (totalRequests || validSystems)) * 100) : 0;
        }

        // Calcular salud general del sistema
        const healthScore = this.calculateOverallHealth(systemsMetrics);
        consolidated.overallHealth = healthScore;

        // Guardar en historial
        const history = this.state.metricsHistory.get('consolidated') || [];
        history.push(consolidated);

        // Mantener solo las últimas entradas
        if (history.length > this.config.monitoring.historyRetention) {
            history.shift();
        }

        this.state.metricsHistory.set('consolidated', history);
        this.consolidatedMetrics = consolidated;
    }

    /**
     * Actualizar estado de sistema
     */
    updateSystemStatus(systemKey, metrics) {
        const currentStatus = this.state.systemsStatus.get(systemKey) || {};

        const updatedStatus = {
            ...currentStatus,
            status: metrics.status,
            health: metrics.health || this.calculateSystemHealth(metrics),
            lastSeen: Date.now(),
            metrics: metrics,
            errors: metrics.lastError ? [metrics.lastError] : []
        };

        this.state.systemsStatus.set(systemKey, updatedStatus);

        // Actualizar historial de métricas del sistema
        const systemHistory = this.state.metricsHistory.get(systemKey) || [];
        systemHistory.push({
            timestamp: Date.now(),
            ...metrics
        });

        if (systemHistory.length > this.config.monitoring.historyRetention) {
            systemHistory.shift();
        }

        this.state.metricsHistory.set(systemKey, systemHistory);
    }

    /**
     * Calcular salud del sistema
     */
    calculateSystemHealth(metrics) {
        let health = 100;

        if (metrics.status === 'offline') return 0;
        if (metrics.status === 'error') return 25;

        // Penalizar por errores
        if (metrics.errorCount > 0) {
            health -= Math.min(metrics.errorCount * 10, 50);
        }

        // Penalizar por tiempo de respuesta alto
        if (metrics.responseTime > 2000) {
            health -= 20;
        }

        // Penalizar por uso de memoria alto
        if (metrics.memoryUsage > 100) {
            health -= 15;
        }

        return Math.max(health, 0);
    }

    /**
     * Calcular salud general
     */
    calculateOverallHealth(systemsMetrics) {
        const systemHealthScores = [];

        for (const [systemKey, metrics] of Object.entries(systemsMetrics)) {
            const systemConfig = this.config.systems[systemKey];
            const health = this.calculateSystemHealth(metrics);

            // Ponderar por prioridad
            let weight = 1;
            if (systemConfig.priority === 'critical') weight = 3;
            else if (systemConfig.priority === 'high') weight = 2;
            else if (systemConfig.priority === 'medium') weight = 1.5;

            systemHealthScores.push(health * weight);
        }

        if (systemHealthScores.length === 0) return 0;

        const averageHealth = systemHealthScores.reduce((sum, score) => sum + score, 0) / systemHealthScores.length;
        return Math.round(averageHealth);
    }

    /**
     * Analizar salud del sistema
     */
    analyzeSystemHealth() {
        const overallHealth = this.consolidatedMetrics.overallHealth || 0;

        // Generar alertas basadas en salud
        if (overallHealth < 50) {
            this.createAlert('critical', 'Salud general crítica', `Salud del sistema: ${overallHealth}%`);
        } else if (overallHealth < 70) {
            this.createAlert('error', 'Salud general baja', `Salud del sistema: ${overallHealth}%`);
        } else if (overallHealth < 85) {
            this.createAlert('warning', 'Salud general degradada', `Salud del sistema: ${overallHealth}%`);
        }

        // Analizar sistemas individuales
        for (const [systemKey, status] of this.state.systemsStatus) {
            const systemConfig = this.config.systems[systemKey];

            if (status.status === 'offline' && systemConfig.priority === 'critical') {
                this.createAlert('critical', `Sistema crítico offline`, `${systemConfig.name} no disponible`);
            } else if (status.health < 50) {
                this.createAlert('error', `Sistema con problemas`, `${systemConfig.name}: ${status.health}% salud`);
            }
        }

        this.state.overallHealth = overallHealth;
    }

    /**
     * Crear alerta
     */
    createAlert(level, title, message) {
        const alertId = `${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const alert = {
            id: alertId,
            level,
            title,
            message,
            timestamp: Date.now(),
            acknowledged: false,
            actions: []
        };

        // Verificar si ya existe una alerta similar
        const existingSimilar = this.alertSystem.activeAlerts.has(`${level}_${title}`);
        if (existingSimilar) return;

        this.alertSystem.activeAlerts.set(`${level}_${title}`, alert);
        this.alertSystem.queue.push(alert);

        // Reproducir sonido si está habilitado
        if (this.config.alerts.soundEnabled) {
            this.playAlertSound(level);
        }

        // Mostrar notificación si está habilitado
        if (this.config.alerts.showNotifications) {
            this.showNotification(alert);
        }

        this.logDashboardEvent('warning', `Alerta generada: ${title} - ${message}`);
    }

    /**
     * Reproducir sonido de alerta
     */
    playAlertSound(level) {
        const soundConfig = this.config.alerts.severity[level];
        if (soundConfig && soundConfig.sound) {
            const audio = this.alertSystem.sounds.get(soundConfig.sound);
            if (audio) {
                audio.play().catch(e => console.warn('No se pudo reproducir sonido:', e));
            }
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`BGE Dashboard - ${alert.title}`, {
                body: alert.message,
                icon: '/images/logo-bge.png',
                badge: '/images/alert-badge.png'
            });
        }
    }

    /**
     * Crear interfaz de usuario
     */
    createUI() {
        const dashboardPanel = document.createElement('div');
        dashboardPanel.id = 'bge-dashboard-monitor';
        dashboardPanel.className = 'bge-dashboard-monitor';
        dashboardPanel.innerHTML = `
            <div class="dashboard-header">
                <h3>📊 Dashboard BGE v${this.version}</h3>
                <div class="dashboard-controls">
                    <button id="refresh-dashboard" class="btn btn-info">↻</button>
                    <button id="export-metrics" class="btn btn-outline-success">📊</button>
                    <button id="dashboard-settings" class="btn btn-outline-secondary">⚙️</button>
                    <button id="toggle-dashboard" class="btn btn-outline-info">−</button>
                </div>
            </div>
            <div class="dashboard-content">
                <div class="dashboard-overview">
                    <div class="overview-card health">
                        <div class="card-header">
                            <span class="card-title">Salud General</span>
                            <span class="health-indicator" id="overall-health">100%</span>
                        </div>
                        <div class="health-bar">
                            <div class="health-fill" id="health-fill" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="overview-card systems">
                        <div class="card-header">
                            <span class="card-title">Sistemas</span>
                            <span class="systems-count" id="systems-count">0/0</span>
                        </div>
                        <div class="systems-status" id="systems-status"></div>
                    </div>
                </div>

                <div class="dashboard-metrics">
                    <div class="metrics-row">
                        <div class="metric-card performance">
                            <div class="metric-header">⚡ Rendimiento</div>
                            <div class="metric-value" id="avg-response-time">--ms</div>
                            <div class="metric-label">Tiempo promedio</div>
                        </div>
                        <div class="metric-card resources">
                            <div class="metric-header">💾 Recursos</div>
                            <div class="metric-value" id="memory-usage">--MB</div>
                            <div class="metric-label">Memoria usada</div>
                        </div>
                        <div class="metric-card security">
                            <div class="metric-header">🔐 Seguridad</div>
                            <div class="metric-value" id="security-score">100</div>
                            <div class="metric-label">Puntuación</div>
                        </div>
                        <div class="metric-card quality">
                            <div class="metric-header">🧪 Calidad</div>
                            <div class="metric-value" id="tests-passed">--</div>
                            <div class="metric-label">Tests pasados</div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-alerts">
                    <div class="alerts-header">
                        <h4>🚨 Alertas Activas</h4>
                        <button id="clear-alerts" class="btn btn-sm btn-outline-danger">Limpiar</button>
                    </div>
                    <div class="alerts-list" id="alerts-list">
                        <div class="no-alerts">No hay alertas activas</div>
                    </div>
                </div>

                <div class="dashboard-systems-list">
                    <h4>🔧 Estado de Sistemas</h4>
                    <div class="systems-grid" id="systems-grid"></div>
                </div>
            </div>
        `;

        // Estilos CSS
        const dashboardStyles = document.createElement('style');
        dashboardStyles.textContent = `
            .bge-dashboard-monitor {
                position: fixed;
                top: 50%;
                right: 20px;
                transform: translateY(-50%);
                width: 450px;
                max-height: 90vh;
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                border: 2px solid #007bff;
                border-radius: 20px;
                box-shadow: 0 16px 48px rgba(0,123,255,0.25);
                z-index: 9997;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(20px);
            }

            .dashboard-header {
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 20px rgba(0,123,255,0.3);
            }

            .dashboard-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 800;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                letter-spacing: -0.5px;
            }

            .dashboard-controls {
                display: flex;
                gap: 8px;
            }

            .dashboard-controls button {
                padding: 8px 12px;
                font-size: 12px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 700;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .dashboard-controls button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }

            .dashboard-content {
                padding: 24px;
                max-height: 70vh;
                overflow-y: auto;
            }

            .dashboard-overview {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }

            .overview-card {
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                border: 1px solid #e9ecef;
                border-radius: 16px;
                padding: 20px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
            }

            .overview-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .card-title {
                font-weight: 700;
                color: #495057;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .health-indicator {
                font-size: 24px;
                font-weight: 900;
                color: #28a745;
                font-family: 'JetBrains Mono', monospace;
            }

            .systems-count {
                font-size: 20px;
                font-weight: 800;
                color: #007bff;
                font-family: 'JetBrains Mono', monospace;
            }

            .health-bar {
                width: 100%;
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
            }

            .health-fill {
                height: 100%;
                background: linear-gradient(90deg, #28a745, #20c997);
                border-radius: 4px;
                transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .systems-status {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .system-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                transition: all 0.3s ease;
            }

            .system-dot.online { background: #28a745; }
            .system-dot.offline { background: #6c757d; }
            .system-dot.error { background: #dc3545; }

            .dashboard-metrics {
                margin-bottom: 24px;
            }

            .metrics-row {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
            }

            .metric-card {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }

            .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }

            .metric-header {
                font-size: 12px;
                color: #6c757d;
                font-weight: 700;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .metric-value {
                font-size: 20px;
                font-weight: 900;
                color: #007bff;
                margin-bottom: 4px;
                font-family: 'JetBrains Mono', monospace;
            }

            .metric-label {
                font-size: 10px;
                color: #868e96;
                font-weight: 500;
            }

            .dashboard-alerts {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 24px;
            }

            .alerts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .alerts-header h4 {
                margin: 0;
                font-size: 14px;
                font-weight: 700;
                color: #495057;
            }

            .alerts-list {
                max-height: 120px;
                overflow-y: auto;
            }

            .alert-item {
                background: white;
                border-left: 4px solid #dc3545;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.05);
                transition: all 0.3s ease;
            }

            .alert-item:hover {
                transform: translateX(4px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .alert-item.critical { border-left-color: #dc3545; }
            .alert-item.error { border-left-color: #fd7e14; }
            .alert-item.warning { border-left-color: #ffc107; }
            .alert-item.info { border-left-color: #17a2b8; }

            .alert-title {
                font-weight: 700;
                font-size: 12px;
                margin-bottom: 4px;
                color: #495057;
            }

            .alert-message {
                font-size: 11px;
                color: #6c757d;
                line-height: 1.4;
            }

            .dashboard-systems-list {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 12px;
                padding: 16px;
            }

            .dashboard-systems-list h4 {
                margin: 0 0 16px 0;
                font-size: 14px;
                font-weight: 700;
                color: #495057;
            }

            .systems-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 12px;
            }

            .system-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 12px;
                transition: all 0.3s ease;
                cursor: pointer;
                box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            }

            .system-item:hover {
                transform: translateY(-2px);
                box-shadow: 0 3px 12px rgba(0,0,0,0.1);
            }

            .system-name {
                font-weight: 700;
                font-size: 12px;
                margin-bottom: 4px;
                color: #495057;
            }

            .system-status {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 10px;
                color: #6c757d;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .status-dot.online { background: #28a745; }
            .status-dot.offline { background: #6c757d; }
            .status-dot.error { background: #dc3545; }

            .collapsed .dashboard-content {
                display: none;
            }

            @media (max-width: 768px) {
                .bge-dashboard-monitor {
                    width: calc(100vw - 40px);
                    right: 20px;
                    position: fixed;
                    top: auto;
                    bottom: 20px;
                    transform: none;
                }

                .dashboard-overview {
                    grid-template-columns: 1fr;
                }

                .metrics-row {
                    grid-template-columns: repeat(2, 1fr);
                }

                .systems-grid {
                    grid-template-columns: 1fr;
                }
            }

            /* Scrollbar personalizado */
            .dashboard-content::-webkit-scrollbar,
            .alerts-list::-webkit-scrollbar {
                width: 6px;
            }

            .dashboard-content::-webkit-scrollbar-track,
            .alerts-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .dashboard-content::-webkit-scrollbar-thumb,
            .alerts-list::-webkit-scrollbar-thumb {
                background: #007bff;
                border-radius: 3px;
            }

            .dashboard-content::-webkit-scrollbar-thumb:hover,
            .alerts-list::-webkit-scrollbar-thumb:hover {
                background: #0056b3;
            }
        `;

        document.head.appendChild(dashboardStyles);
        document.body.appendChild(dashboardPanel);

        // Inicializar display
        this.updateDashboardDisplay();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Refresh manual
        document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
            this.collectAllMetrics();
        });

        // Export metrics
        document.getElementById('export-metrics')?.addEventListener('click', () => {
            this.exportMetrics();
        });

        // Settings
        document.getElementById('dashboard-settings')?.addEventListener('click', () => {
            this.showSettings();
        });

        // Toggle panel
        document.getElementById('toggle-dashboard')?.addEventListener('click', () => {
            this.toggleDashboard();
        });

        // Clear alerts
        document.getElementById('clear-alerts')?.addEventListener('click', () => {
            this.clearAllAlerts();
        });
    }

    /**
     * Actualizar display del dashboard
     */
    updateDashboardDisplay() {
        // Actualizar salud general
        const healthElement = document.getElementById('overall-health');
        const healthFill = document.getElementById('health-fill');

        if (healthElement && healthFill) {
            const health = this.state.overallHealth;
            healthElement.textContent = `${health}%`;
            healthFill.style.width = `${health}%`;

            // Cambiar color basado en salud
            if (health >= 80) {
                healthFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
                healthElement.style.color = '#28a745';
            } else if (health >= 60) {
                healthFill.style.background = 'linear-gradient(90deg, #ffc107, #fd7e14)';
                healthElement.style.color = '#ffc107';
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
                healthElement.style.color = '#dc3545';
            }
        }

        // Actualizar conteo de sistemas
        const systemsCount = document.getElementById('systems-count');
        if (systemsCount) {
            systemsCount.textContent = `${this.state.connectedSystems}/${this.state.totalSystems}`;
        }

        // Actualizar puntos de estado de sistemas
        this.updateSystemsStatus();

        // Actualizar métricas
        this.updateMetricsDisplay();

        // Actualizar alertas
        this.updateAlertsDisplay();

        // Actualizar lista de sistemas
        this.updateSystemsList();
    }

    /**
     * Actualizar status de sistemas
     */
    updateSystemsStatus() {
        const statusContainer = document.getElementById('systems-status');
        if (!statusContainer) return;

        statusContainer.innerHTML = '';

        for (const [systemKey, status] of this.state.systemsStatus) {
            const dot = document.createElement('div');
            dot.className = `system-dot ${status.status}`;
            dot.title = `${this.config.systems[systemKey].name}: ${status.status}`;
            statusContainer.appendChild(dot);
        }
    }

    /**
     * Actualizar display de métricas
     */
    updateMetricsDisplay() {
        const metrics = this.consolidatedMetrics;

        // Tiempo de respuesta promedio
        const responseTimeElement = document.getElementById('avg-response-time');
        if (responseTimeElement) {
            responseTimeElement.textContent = `${metrics.performance.avgResponseTime}ms`;
        }

        // Uso de memoria
        const memoryElement = document.getElementById('memory-usage');
        if (memoryElement) {
            memoryElement.textContent = `${metrics.resources.memoryUsage}MB`;
        }

        // Puntuación de seguridad
        const securityElement = document.getElementById('security-score');
        if (securityElement) {
            securityElement.textContent = Math.round(metrics.security.securityScore);
        }

        // Tests pasados
        const testsElement = document.getElementById('tests-passed');
        if (testsElement) {
            const passed = metrics.quality.testsPassed;
            const total = metrics.quality.testsTotal;
            testsElement.textContent = total > 0 ? `${passed}/${total}` : '--';
        }
    }

    /**
     * Actualizar display de alertas
     */
    updateAlertsDisplay() {
        const alertsList = document.getElementById('alerts-list');
        if (!alertsList) return;

        if (this.alertSystem.queue.length === 0) {
            alertsList.innerHTML = '<div class="no-alerts">No hay alertas activas</div>';
            return;
        }

        alertsList.innerHTML = this.alertSystem.queue
            .slice(-10)
            .reverse()
            .map(alert => `
                <div class="alert-item ${alert.level}">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `)
            .join('');
    }

    /**
     * Actualizar lista de sistemas
     */
    updateSystemsList() {
        const systemsGrid = document.getElementById('systems-grid');
        if (!systemsGrid) return;

        systemsGrid.innerHTML = '';

        for (const [systemKey, systemConfig] of Object.entries(this.config.systems)) {
            const status = this.state.systemsStatus.get(systemKey) || { status: 'unknown', health: 0 };

            const systemItem = document.createElement('div');
            systemItem.className = 'system-item';
            systemItem.innerHTML = `
                <div class="system-name">${systemConfig.name}</div>
                <div class="system-status">
                    <span class="status-dot ${status.status}"></span>
                    <span>${status.status.toUpperCase()} - ${status.health}%</span>
                </div>
            `;

            systemItem.addEventListener('click', () => {
                this.showSystemDetails(systemKey);
            });

            systemsGrid.appendChild(systemItem);
        }
    }

    /**
     * Utilidades y métodos auxiliares
     */
    getGlobalObject(path) {
        return path.split('.').reduce((obj, prop) => obj && obj[prop], window);
    }

    processAlerts() {
        // Procesar cola de alertas pendientes
        if (this.alertSystem.queue.length > 0) {
            // Ordenar por prioridad
            this.alertSystem.queue.sort((a, b) => {
                const levelA = this.alertLevels[a.level]?.priority || 0;
                const levelB = this.alertLevels[b.level]?.priority || 0;
                return levelB - levelA;
            });

            this.updateAlertsDisplay();
        }

        // Limpiar alertas expiradas (más de 5 minutos)
        const now = Date.now();
        const expiredThreshold = 5 * 60 * 1000; // 5 minutos

        this.alertSystem.queue = this.alertSystem.queue.filter(alert => {
            return (now - alert.timestamp) < expiredThreshold;
        });
    }

    cleanupMetricsHistory() {
        for (const [systemKey, history] of this.state.metricsHistory) {
            if (history.length > this.config.monitoring.historyRetention) {
                this.state.metricsHistory.set(systemKey, history.slice(-this.config.monitoring.historyRetention));
            }
        }
    }

    clearAllAlerts() {
        this.alertSystem.queue = [];
        this.alertSystem.activeAlerts.clear();
        this.updateAlertsDisplay();
        this.logDashboardEvent('info', 'Todas las alertas limpiadas');
    }

    toggleDashboard() {
        const panel = document.getElementById('bge-dashboard-monitor');
        const toggleBtn = document.getElementById('toggle-dashboard');

        panel.classList.toggle('collapsed');
        toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
    }

    exportMetrics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            version: this.version,
            overallHealth: this.state.overallHealth,
            systemsStatus: Object.fromEntries(this.state.systemsStatus),
            consolidatedMetrics: this.consolidatedMetrics,
            activeAlerts: this.alertSystem.queue,
            metricsHistory: Object.fromEntries(this.state.metricsHistory)
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `bge-dashboard-metrics-${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.logDashboardEvent('info', 'Métricas exportadas exitosamente');
    }

    showSettings() {
        // Implementar ventana de configuración
        alert('Configuración del dashboard - Próximamente');
    }

    showSystemDetails(systemKey) {
        const systemConfig = this.config.systems[systemKey];
        const status = this.state.systemsStatus.get(systemKey);

        const details = [
            `Sistema: ${systemConfig.name}`,
            `Tipo: ${systemConfig.type}`,
            `Fase: ${systemConfig.phase}`,
            `Prioridad: ${systemConfig.priority}`,
            `Estado: ${status.status}`,
            `Salud: ${status.health}%`,
            `Última actualización: ${status.lastSeen ? new Date(status.lastSeen).toLocaleTimeString() : 'Nunca'}`
        ];

        alert(details.join('\n'));
    }

    logDashboardEvent(level, message) {
        const event = {
            timestamp: new Date().toISOString(),
            level,
            message,
            system: 'dashboard'
        };

        console.log(`[BGE Dashboard ${level.toUpperCase()}] ${message}`);
    }

    // Método para obtener métricas del dashboard
    getDashboardMetrics() {
        return {
            version: this.version,
            active: this.state.active,
            overallHealth: this.state.overallHealth,
            connectedSystems: this.state.connectedSystems,
            totalSystems: this.state.totalSystems,
            activeAlerts: this.alertSystem.queue.length,
            lastUpdate: this.state.lastUpdate,
            consolidatedMetrics: this.consolidatedMetrics
        };
    }

    // Cleanup al destruir
    destroy() {
        // Limpiar todos los intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        // Limpiar todos los timers
        this.timers.forEach(timer => clearTimeout(timer));
        this.timers.clear();

        // Remover UI
        const panel = document.getElementById('bge-dashboard-monitor');
        if (panel) {
            panel.remove();
        }

        this.state.active = false;
        console.log('🧹 Dashboard BGE destruido correctamente');
    }
}

// Auto-inicialización del dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined') {
        // Esperar un poco para que otros sistemas se inicialicen
        setTimeout(() => {
            window.bgeDashboardMonitor = new BGEDashboardMonitor();

            console.log('📊 Dashboard de Monitoreo BGE inicializado');
            console.log('📈 Acceso: window.bgeDashboardMonitor');
            console.log('🎯 Comando rápido: window.bgeDashboardMonitor.collectAllMetrics()');
        }, 2000);
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEDashboardMonitor;
}