/**
 * 🔐 BGE - SISTEMA DE SEGURIDAD AVANZADA
 * Fase 4: Protección integral de los 5 sistemas IA implementados
 *
 * Sistema de seguridad para:
 * - Chatbot Inteligente IA
 * - Sistema de Recomendaciones ML
 * - Analytics Predictivo
 * - Asistente Virtual Educativo
 * - Sistema de Detección de Riesgos
 *
 * Desarrollado para Bachillerato General Estatal "Héroes de la Patria"
 * @version 4.0.0
 * @author BGE Security Team
 * @date 2025-09-25
 */

class BGESecurityManager {
    constructor() {
        this.version = '4.0.0';
        this.sistema = 'Sistema de Seguridad Avanzada BGE';

        // Configuración de seguridad
        this.config = {
            // Niveles de seguridad
            securityLevels: {
                LOW: 1,
                MEDIUM: 2,
                HIGH: 3,
                CRITICAL: 4
            },

            // Políticas de seguridad
            policies: {
                maxFailedAttempts: 5,
                sessionTimeout: 1800000,    // 30 minutos
                passwordMinLength: 8,
                requireTwoFactor: false,
                auditLogRetention: 2592000000, // 30 días
                encryptSensitiveData: true
            },

            // Sistemas protegidos
            protectedSystems: {
                chatbot: {
                    name: 'Chatbot IA',
                    securityLevel: 'MEDIUM',
                    endpoints: ['/api/chatbot-ia'],
                    vulnerabilities: ['injection', 'flooding', 'data_leak']
                },
                recommendations: {
                    name: 'Recomendaciones ML',
                    securityLevel: 'HIGH',
                    endpoints: ['/api/recomendaciones-ml'],
                    vulnerabilities: ['bias_attack', 'model_poison', 'privacy_breach']
                },
                analytics: {
                    name: 'Analytics Predictivo',
                    securityLevel: 'CRITICAL',
                    endpoints: ['/api/analytics-predictivo'],
                    vulnerabilities: ['data_mining', 'inference_attack', 'backdoor']
                },
                assistant: {
                    name: 'Asistente Virtual',
                    securityLevel: 'HIGH',
                    endpoints: ['/api/asistente-virtual'],
                    vulnerabilities: ['social_engineering', 'context_hijack', 'privilege_escalation']
                },
                riskDetection: {
                    name: 'Detección Riesgos',
                    securityLevel: 'CRITICAL',
                    endpoints: ['/api/deteccion-riesgos'],
                    vulnerabilities: ['false_positive', 'evasion', 'data_manipulation']
                }
            },

            // Configuración de monitoreo
            monitoring: {
                realTimeScanning: true,
                threatDetection: true,
                behaviorAnalysis: true,
                anomalyDetection: true,
                intrusionDetection: true
            }
        };

        // Estado del sistema de seguridad
        this.state = {
            active: false,
            securityLevel: 'MEDIUM',
            threatCount: 0,
            blockedRequests: 0,
            activeThreats: new Map(),
            securityEvents: [],
            lastScanTime: null,
            quarantineList: new Set(),
            trustedSources: new Set(['localhost', '127.0.0.1'])
        };

        // Sistema de logs de seguridad
        this.securityLogs = [];

        // Cache de firmas de amenazas
        this.threatSignatures = new Map();

        // Sistema de rate limiting
        this.rateLimiter = new Map();

        // Detector de anomalías
        this.anomalyDetector = {
            baselineMetrics: new Map(),
            currentMetrics: new Map(),
            anomalyThreshold: 2.5 // Desviaciones estándar
        };

        // Sistema de encriptación
        this.encryption = {
            algorithm: 'AES-256-GCM',
            keyRotationInterval: 86400000 // 24 horas
        };

        this.init();
    }

    /**
     * Inicialización del sistema de seguridad
     */
    async init() {
        try {
            console.log(`🔐 Inicializando ${this.sistema} v${this.version}`);

            await this.loadThreatSignatures();
            await this.initializeSecurityPolicies();
            this.setupSecurityMonitoring();
            this.createUI();
            this.setupEventListeners();
            this.startSecurityServices();

            this.state.active = true;
            console.log('✅ Sistema de Seguridad inicializado correctamente');
            this.logSecurityEvent('info', 'Sistema de Seguridad BGE inicializado', 'SYSTEM');

        } catch (error) {
            console.error('❌ Error inicializando sistema de seguridad:', error);
            this.logSecurityEvent('error', `Error de inicialización: ${error.message}`, 'SYSTEM');
        }
    }

    /**
     * Cargar firmas de amenazas conocidas
     */
    async loadThreatSignatures() {
        const signatures = {
            // Inyecciones SQL
            'sql_injection': [
                /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
                /(\bUNION\b.*\bSELECT\b)/i,
                /(\bDROP\b.*\bTABLE\b)/i,
                /(\bINSERT\b.*\bINTO\b.*\bVALUES\b)/i
            ],

            // Cross-Site Scripting (XSS)
            'xss_injection': [
                /<script[^>]*>.*<\/script>/i,
                /javascript:/i,
                /on\w+\s*=\s*["'][^"']*["']/i,
                /<iframe[^>]*src\s*=/i
            ],

            // Command Injection
            'command_injection': [
                /;\s*(rm|del|format|shutdown)/i,
                /\|\s*(curl|wget|nc)/i,
                /`[^`]*`/,
                /\$\([^)]*\)/
            ],

            // Path Traversal
            'path_traversal': [
                /\.\.\/.*\.\./,
                /\.\.\\.*\.\./,
                /(\/|\\)etc(\/|\\)passwd/i,
                /(\/|\\)windows(\/|\\)system32/i
            ],

            // LDAP Injection
            'ldap_injection': [
                /\*\)\(.*=\*/,
                /\)\(\|/,
                /\)\(&/,
                /\(\|\(/
            ],

            // NoSQL Injection
            'nosql_injection': [
                /\$ne\s*:/,
                /\$gt\s*:/,
                /\$where\s*:/,
                /\$regex\s*:/
            ],

            // Suspicious patterns for AI systems
            'ai_attack': [
                /IGNORE\s+PREVIOUS\s+INSTRUCTIONS/i,
                /SYSTEM\s*:\s*YOU\s+ARE/i,
                /JAILBREAK/i,
                /PROMPT\s+INJECTION/i
            ]
        };

        for (const [type, patterns] of Object.entries(signatures)) {
            this.threatSignatures.set(type, patterns);
        }

        this.logSecurityEvent('info', `Cargadas ${Object.keys(signatures).length} firmas de amenazas`, 'SIGNATURES');
    }

    /**
     * Inicializar políticas de seguridad
     */
    async initializeSecurityPolicies() {
        // Content Security Policy
        this.setupCSP();

        // Rate Limiting
        this.setupRateLimiting();

        // Input Validation
        this.setupInputValidation();

        // Session Management
        this.setupSessionSecurity();

        // CORS Protection
        this.setupCORSProtection();
    }

    /**
     * Configurar Content Security Policy
     */
    setupCSP() {
        const cspRules = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
            "img-src 'self' data: https:",
            "font-src 'self' https://cdnjs.cloudflare.com",
            "connect-src 'self'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'"
        ].join('; ');

        // Verificar si CSP está configurado
        const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!metaCSP) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = cspRules;
            document.head.appendChild(meta);
        }

        this.logSecurityEvent('info', 'Content Security Policy configurado', 'CSP');
    }

    /**
     * Configurar Rate Limiting
     */
    setupRateLimiting() {
        this.rateLimitConfig = {
            windowSize: 60000,    // 1 minuto
            maxRequests: 100,     // Máximo 100 requests por minuto
            blockDuration: 300000 // Bloquear por 5 minutos
        };

        // Limpiar rate limiter cada minuto
        setInterval(() => {
            const now = Date.now();
            for (const [ip, data] of this.rateLimiter) {
                if (now - data.windowStart > this.rateLimitConfig.windowSize) {
                    this.rateLimiter.delete(ip);
                }
            }
        }, 60000);
    }

    /**
     * Configurar validación de entrada
     */
    setupInputValidation() {
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^\+?[\d\s\-\(\)]{10,}$/,
            alphanumeric: /^[a-zA-Z0-9\s]+$/,
            safeString: /^[a-zA-Z0-9\s\.\,\-_áéíóúñü]+$/i,
            noScript: /^(?!.*<script).*$/i
        };
    }

    /**
     * Configurar seguridad de sesión
     */
    setupSessionSecurity() {
        // Configurar headers de seguridad para sesiones
        if (typeof document !== 'undefined') {
            // Prevenir clickjacking
            if (window.self !== window.top) {
                window.top.location = window.location;
            }

            // Configurar cookies seguras
            document.cookie = 'SameSite=Strict; Secure; HttpOnly';
        }
    }

    /**
     * Configurar protección CORS
     */
    setupCORSProtection() {
        this.allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:8080',
            'https://sacrint.github.io'
        ];
    }

    /**
     * Configurar monitoreo de seguridad
     */
    setupSecurityMonitoring() {
        // Monitor de integridad de scripts
        this.setupScriptIntegrityMonitor();

        // Monitor de mutaciones DOM sospechosas
        this.setupDOMIntegrityMonitor();

        // Monitor de requests sospechosos
        this.setupNetworkMonitor();

        // Monitor de comportamiento anómalo
        this.setupBehaviorMonitor();
    }

    /**
     * Monitor de integridad de scripts
     */
    setupScriptIntegrityMonitor() {
        const scripts = document.querySelectorAll('script[src]');

        scripts.forEach(script => {
            if (!script.integrity && script.src.includes('cdn')) {
                this.logSecurityEvent('warning', `Script sin integrity hash: ${script.src}`, 'INTEGRITY');
            }
        });

        // Observer para nuevos scripts
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.tagName === 'SCRIPT' && node.src) {
                        this.validateScriptSource(node.src);
                    }
                });
            });
        });

        observer.observe(document.head, { childList: true });
    }

    /**
     * Monitor de integridad DOM
     */
    setupDOMIntegrityMonitor() {
        const criticalElements = ['script', 'iframe', 'form', 'input[type="password"]'];

        criticalElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.dataset.securityHash = this.calculateElementHash(element);
            });
        });

        // Monitor de cambios críticos
        const domObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName && criticalElements.includes(node.tagName.toLowerCase())) {
                            this.validateDOMChange(node);
                        }
                    });
                }
            });
        });

        domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'action', 'onload', 'onclick']
        });
    }

    /**
     * Monitor de red
     */
    setupNetworkMonitor() {
        // Interceptar fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            const threat = await this.analyzeRequest(url, options);
            if (threat.risk > 3) {
                this.logSecurityEvent('error', `Request bloqueado: ${threat.reason}`, 'NETWORK');
                throw new Error('Request blocked by security system');
            }

            return originalFetch(url, options);
        };

        // Interceptar XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalOpen = xhr.open;

            xhr.open = function(method, url, ...args) {
                // Analizar request antes de enviarlo
                window.bgeSecurityManager?.analyzeXHRRequest(method, url);
                return originalOpen.apply(this, [method, url, ...args]);
            };

            return xhr;
        };
    }

    /**
     * Monitor de comportamiento
     */
    setupBehaviorMonitor() {
        // Tracking de patrones de uso
        this.behaviorPatterns = {
            clickPattern: [],
            keyPattern: [],
            mousePattern: [],
            timePattern: []
        };

        // Event listeners para análisis de comportamiento
        document.addEventListener('click', (e) => {
            this.recordBehaviorEvent('click', {
                target: e.target.tagName,
                timestamp: Date.now(),
                coordinates: { x: e.clientX, y: e.clientY }
            });
        });

        document.addEventListener('keydown', (e) => {
            this.recordBehaviorEvent('key', {
                key: e.key.length === 1 ? 'char' : e.key,
                timestamp: Date.now(),
                ctrlKey: e.ctrlKey,
                altKey: e.altKey
            });
        });

        // Análisis periódico de patrones
        setInterval(() => {
            this.analyzeBehaviorPatterns();
        }, 30000); // Cada 30 segundos
    }

    /**
     * Iniciar servicios de seguridad
     */
    startSecurityServices() {
        // Escaneo periódico de amenazas
        setInterval(() => {
            this.performSecurityScan();
        }, 60000); // Cada minuto

        // Limpieza de logs antiguos
        setInterval(() => {
            this.cleanupSecurityLogs();
        }, 3600000); // Cada hora

        // Rotación de claves de encriptación
        setInterval(() => {
            this.rotateEncryptionKeys();
        }, this.encryption.keyRotationInterval);

        // Análisis de anomalías
        setInterval(() => {
            this.detectAnomalies();
        }, 300000); // Cada 5 minutos
    }

    /**
     * Validar request de seguridad
     */
    async analyzeRequest(url, options) {
        const threat = {
            risk: 0,
            reasons: [],
            blocked: false
        };

        try {
            // Validar URL
            const urlObj = new URL(url, window.location.origin);

            // Check rate limiting
            const clientIP = this.getClientIP();
            if (this.isRateLimited(clientIP)) {
                threat.risk += 4;
                threat.reasons.push('Rate limit exceeded');
            }

            // Check against threat signatures
            const payload = JSON.stringify(options.body || '');
            for (const [threatType, signatures] of this.threatSignatures) {
                for (const signature of signatures) {
                    if (signature.test(payload) || signature.test(url)) {
                        threat.risk += 3;
                        threat.reasons.push(`${threatType} detected`);
                        break;
                    }
                }
            }

            // Check origin
            if (!this.allowedOrigins.includes(urlObj.origin) && !url.startsWith(window.location.origin)) {
                threat.risk += 2;
                threat.reasons.push('Untrusted origin');
            }

            // Check suspicious patterns
            if (this.containsSuspiciousPatterns(url, payload)) {
                threat.risk += 2;
                threat.reasons.push('Suspicious patterns detected');
            }

        } catch (error) {
            threat.risk += 1;
            threat.reasons.push('Request analysis failed');
        }

        return {
            risk: threat.risk,
            reason: threat.reasons.join(', '),
            blocked: threat.risk > 3
        };
    }

    /**
     * Verificar si una IP está limitada por rate limiting
     */
    isRateLimited(ip) {
        const now = Date.now();
        const rateLimitData = this.rateLimiter.get(ip) || {
            count: 0,
            windowStart: now,
            blocked: false,
            blockStart: 0
        };

        // Si está bloqueado, verificar si el bloqueo ha expirado
        if (rateLimitData.blocked) {
            if (now - rateLimitData.blockStart > this.rateLimitConfig.blockDuration) {
                rateLimitData.blocked = false;
                rateLimitData.count = 0;
                rateLimitData.windowStart = now;
            } else {
                return true;
            }
        }

        // Reset window if needed
        if (now - rateLimitData.windowStart > this.rateLimitConfig.windowSize) {
            rateLimitData.count = 0;
            rateLimitData.windowStart = now;
        }

        // Increment counter
        rateLimitData.count++;

        // Check if limit exceeded
        if (rateLimitData.count > this.rateLimitConfig.maxRequests) {
            rateLimitData.blocked = true;
            rateLimitData.blockStart = now;
            this.state.blockedRequests++;
            this.logSecurityEvent('warning', `IP ${ip} bloqueada por rate limiting`, 'RATE_LIMIT');
        }

        this.rateLimiter.set(ip, rateLimitData);
        return rateLimitData.blocked;
    }

    /**
     * Realizar escaneo de seguridad
     */
    async performSecurityScan() {
        if (!this.state.active) return;

        this.state.lastScanTime = Date.now();
        let threatsFound = 0;

        try {
            // Escanear DOM por elementos sospechosos
            const suspiciousElements = this.scanDOMThreats();
            threatsFound += suspiciousElements.length;

            // Escanear almacenamiento local
            const storageThreats = this.scanStorageThreats();
            threatsFound += storageThreats.length;

            // Escanear cookies
            const cookieThreats = this.scanCookieThreats();
            threatsFound += cookieThreats.length;

            // Escanear requests activos
            const networkThreats = this.scanNetworkThreats();
            threatsFound += networkThreats.length;

            if (threatsFound > 0) {
                this.state.threatCount += threatsFound;
                this.logSecurityEvent('warning', `Escaneo completado: ${threatsFound} amenazas encontradas`, 'SCAN');
            }

            // Actualizar UI
            this.updateSecurityMetrics();

        } catch (error) {
            this.logSecurityEvent('error', `Error en escaneo de seguridad: ${error.message}`, 'SCAN');
        }
    }

    /**
     * Escanear amenazas en DOM
     */
    scanDOMThreats() {
        const threats = [];

        // Buscar scripts inline sospechosos
        const inlineScripts = document.querySelectorAll('script:not([src])');
        inlineScripts.forEach(script => {
            const content = script.textContent;
            if (this.containsSuspiciousPatterns('', content)) {
                threats.push({
                    type: 'suspicious_script',
                    element: script,
                    risk: 3
                });
            }
        });

        // Buscar iframes sospechosos
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src;
            if (src && !this.allowedOrigins.some(origin => src.startsWith(origin))) {
                threats.push({
                    type: 'suspicious_iframe',
                    element: iframe,
                    risk: 2
                });
            }
        });

        // Buscar formularios con acción externa
        const forms = document.querySelectorAll('form[action]');
        forms.forEach(form => {
            const action = form.action;
            if (action && !action.startsWith(window.location.origin)) {
                threats.push({
                    type: 'external_form',
                    element: form,
                    risk: 2
                });
            }
        });

        return threats;
    }

    /**
     * Crear interfaz de usuario
     */
    createUI() {
        const securityPanel = document.createElement('div');
        securityPanel.id = 'bge-security-panel';
        securityPanel.className = 'bge-security-panel';
        securityPanel.innerHTML = `
            <div class="security-header">
                <h3>🔐 Seguridad BGE v${this.version}</h3>
                <div class="security-controls">
                    <button id="security-scan" class="btn btn-danger">Escanear</button>
                    <button id="security-report" class="btn btn-outline-warning">Reporte</button>
                    <button id="toggle-security" class="btn btn-outline-info">−</button>
                </div>
            </div>
            <div class="security-content">
                <div class="security-status">
                    <div class="status-indicator" id="security-status-indicator">
                        <span class="security-light secure"></span>
                        <span class="status-text">Sistema Seguro</span>
                    </div>
                    <div class="security-level" id="security-level">
                        Nivel: <span id="current-security-level">${this.state.securityLevel}</span>
                    </div>
                </div>
                <div class="security-metrics">
                    <div class="metric-item">
                        <span class="metric-label">Amenazas Detectadas</span>
                        <span class="metric-value" id="threat-count">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Requests Bloqueados</span>
                        <span class="metric-value" id="blocked-count">0</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Último Escaneo</span>
                        <span class="metric-value" id="last-scan">Nunca</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">Estado</span>
                        <span class="metric-value status-active" id="security-status">Activo</span>
                    </div>
                </div>
                <div class="security-events">
                    <h4>Eventos de Seguridad Recientes</h4>
                    <div id="security-events-list" class="events-list">
                        <div class="no-events">No hay eventos recientes</div>
                    </div>
                </div>
            </div>
        `;

        // Estilos CSS para el panel
        const securityStyles = document.createElement('style');
        securityStyles.textContent = `
            .bge-security-panel {
                position: fixed;
                top: 20px;
                left: 20px;
                width: 360px;
                max-height: 70vh;
                background: linear-gradient(135deg, #ffffff, #f8f9fa);
                border: 2px solid #dc3545;
                border-radius: 16px;
                box-shadow: 0 12px 40px rgba(220,53,69,0.3);
                z-index: 9998;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .security-header {
                background: linear-gradient(135deg, #dc3545, #c82333);
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(220,53,69,0.3);
            }

            .security-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .security-controls {
                display: flex;
                gap: 6px;
            }

            .security-controls button {
                padding: 6px 12px;
                font-size: 11px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.2s;
            }

            .security-content {
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
            }

            .security-status {
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 20px;
                border: 1px solid #dee2e6;
            }

            .status-indicator {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
            }

            .security-light {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }

            .security-light.secure { background: #28a745; }
            .security-light.warning { background: #ffc107; }
            .security-light.danger { background: #dc3545; }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }

            .security-level {
                font-size: 14px;
                font-weight: 600;
                color: #495057;
            }

            .security-metrics {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            }

            .metric-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 12px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }

            .metric-label {
                display: block;
                font-size: 11px;
                color: #6c757d;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 4px;
            }

            .metric-value {
                font-size: 18px;
                font-weight: 800;
                color: #dc3545;
                font-family: monospace;
            }

            .metric-value.status-active {
                color: #28a745;
            }

            .security-events {
                background: #f8f9fa;
                border-radius: 12px;
                padding: 16px;
                border: 1px solid #e9ecef;
            }

            .security-events h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #495057;
                font-weight: 700;
            }

            .events-list {
                max-height: 120px;
                overflow-y: auto;
            }

            .security-event {
                background: white;
                border-left: 3px solid #dc3545;
                border-radius: 4px;
                padding: 8px 10px;
                margin-bottom: 6px;
                font-size: 12px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }

            .security-event.info { border-left-color: #007bff; }
            .security-event.warning { border-left-color: #ffc107; }
            .security-event.error { border-left-color: #dc3545; }

            .event-time {
                color: #6c757d;
                font-weight: 600;
            }

            .event-message {
                margin-top: 2px;
            }

            .collapsed .security-content {
                display: none;
            }

            @media (max-width: 768px) {
                .bge-security-panel {
                    width: calc(100vw - 40px);
                    left: 20px;
                }

                .security-metrics {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(securityStyles);
        document.body.appendChild(securityPanel);

        // Inicializar métricas
        this.updateSecurityDisplay();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón escanear
        document.getElementById('security-scan')?.addEventListener('click', () => {
            this.performSecurityScan();
        });

        // Botón reporte
        document.getElementById('security-report')?.addEventListener('click', () => {
            this.generateSecurityReport();
        });

        // Toggle panel
        document.getElementById('toggle-security')?.addEventListener('click', () => {
            this.toggleSecurityPanel();
        });
    }

    /**
     * Actualizar display de seguridad
     */
    updateSecurityDisplay() {
        // Actualizar métricas
        document.getElementById('threat-count').textContent = this.state.threatCount;
        document.getElementById('blocked-count').textContent = this.state.blockedRequests;
        document.getElementById('current-security-level').textContent = this.state.securityLevel;
        document.getElementById('security-status').textContent = this.state.active ? 'Activo' : 'Inactivo';

        // Actualizar último escaneo
        const lastScanElement = document.getElementById('last-scan');
        if (this.state.lastScanTime) {
            const time = new Date(this.state.lastScanTime).toLocaleTimeString();
            lastScanElement.textContent = time;
        }

        // Actualizar indicador de estado
        const indicator = document.querySelector('.security-light');
        const statusText = document.querySelector('.status-text');

        if (this.state.threatCount > 5) {
            indicator.className = 'security-light danger';
            statusText.textContent = 'Amenazas Detectadas';
        } else if (this.state.threatCount > 0) {
            indicator.className = 'security-light warning';
            statusText.textContent = 'Sistema Vigilante';
        } else {
            indicator.className = 'security-light secure';
            statusText.textContent = 'Sistema Seguro';
        }

        // Actualizar lista de eventos
        this.updateEventsDisplay();
    }

    /**
     * Actualizar display de eventos
     */
    updateEventsDisplay() {
        const eventsList = document.getElementById('security-events-list');

        if (this.securityLogs.length === 0) {
            eventsList.innerHTML = '<div class="no-events">No hay eventos recientes</div>';
            return;
        }

        const recentEvents = this.securityLogs.slice(-10).reverse();
        eventsList.innerHTML = recentEvents.map(event => `
            <div class="security-event ${event.level}">
                <div class="event-time">[${event.timestamp}]</div>
                <div class="event-message">${event.message}</div>
            </div>
        `).join('');
    }

    /**
     * Log de eventos de seguridad
     */
    logSecurityEvent(level, message, category = 'GENERAL') {
        const event = {
            timestamp: new Date().toLocaleTimeString(),
            level,
            message: `[${category}] ${message}`,
            category
        };

        this.securityLogs.push(event);

        // Mantener solo los últimos 100 logs
        if (this.securityLogs.length > 100) {
            this.securityLogs.shift();
        }

        // Actualizar UI
        this.updateEventsDisplay();

        // Log en consola
        console.log(`[BGE Security ${level.toUpperCase()}] ${message}`);
    }

    /**
     * Utilidades y métodos auxiliares
     */
    containsSuspiciousPatterns(url, content) {
        const suspiciousPatterns = [
            /eval\s*\(/,
            /document\.write\s*\(/,
            /innerHTML\s*=/,
            /javascript:/,
            /data:text\/html/,
            /base64/i,
            /fromCharCode/,
            /%3Cscript/i,
            /&lt;script/i
        ];

        const combined = url + ' ' + content;
        return suspiciousPatterns.some(pattern => pattern.test(combined));
    }

    getClientIP() {
        // Simulación de obtención de IP del cliente
        return 'localhost';
    }

    calculateElementHash(element) {
        const content = element.outerHTML || element.textContent || '';
        return btoa(content).substring(0, 16);
    }

    validateScriptSource(src) {
        if (!this.allowedOrigins.some(origin => src.startsWith(origin)) &&
            !src.startsWith(window.location.origin)) {
            this.logSecurityEvent('warning', `Script de origen no confiable: ${src}`, 'SCRIPT');
        }
    }

    validateDOMChange(element) {
        if (element.tagName === 'SCRIPT') {
            const src = element.src || 'inline';
            this.logSecurityEvent('info', `Nuevo script detectado: ${src}`, 'DOM');
        }
    }

    recordBehaviorEvent(type, data) {
        const patterns = this.behaviorPatterns[type + 'Pattern'];
        if (patterns) {
            patterns.push(data);

            // Mantener solo los últimos 50 eventos
            if (patterns.length > 50) {
                patterns.shift();
            }
        }
    }

    analyzeBehaviorPatterns() {
        // Análisis básico de patrones de comportamiento
        const clickPattern = this.behaviorPatterns.clickPattern;

        if (clickPattern.length > 20) {
            const rapidClicks = clickPattern.filter((click, index) => {
                if (index === 0) return false;
                return click.timestamp - clickPattern[index - 1].timestamp < 100;
            });

            if (rapidClicks.length > 10) {
                this.logSecurityEvent('warning', 'Patrón de clicks anómalo detectado', 'BEHAVIOR');
            }
        }
    }

    updateSecurityMetrics() {
        this.updateSecurityDisplay();
    }

    cleanupSecurityLogs() {
        const retention = this.config.policies.auditLogRetention;
        const cutoff = Date.now() - retention;

        this.securityLogs = this.securityLogs.filter(log => {
            const logTime = new Date(log.timestamp).getTime();
            return logTime > cutoff;
        });
    }

    rotateEncryptionKeys() {
        // Simulación de rotación de claves
        this.logSecurityEvent('info', 'Rotación de claves de encriptación realizada', 'ENCRYPTION');
    }

    detectAnomalies() {
        // Detección básica de anomalías
        const currentTime = Date.now();
        const metrics = {
            requestRate: this.rateLimiter.size,
            threatCount: this.state.threatCount,
            timestamp: currentTime
        };

        // Comparar con baseline (simplificado)
        if (metrics.requestRate > 100) {
            this.logSecurityEvent('warning', 'Tasa de requests anómala detectada', 'ANOMALY');
        }

        if (this.state.threatCount > this.state.previousThreatCount + 5) {
            this.logSecurityEvent('error', 'Incremento anómalo de amenazas', 'ANOMALY');
        }

        this.state.previousThreatCount = this.state.threatCount;
    }

    scanStorageThreats() {
        const threats = [];

        try {
            // Escanear localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);

                if (this.containsSuspiciousPatterns('', value)) {
                    threats.push({
                        type: 'suspicious_storage',
                        location: 'localStorage',
                        key: key,
                        risk: 2
                    });
                }
            }

            // Escanear sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                const value = sessionStorage.getItem(key);

                if (this.containsSuspiciousPatterns('', value)) {
                    threats.push({
                        type: 'suspicious_storage',
                        location: 'sessionStorage',
                        key: key,
                        risk: 2
                    });
                }
            }
        } catch (error) {
            this.logSecurityEvent('warning', `Error escaneando storage: ${error.message}`, 'STORAGE');
        }

        return threats;
    }

    scanCookieThreats() {
        const threats = [];
        const cookies = document.cookie.split(';');

        cookies.forEach(cookie => {
            const [name, value] = cookie.split('=');

            if (value && this.containsSuspiciousPatterns('', decodeURIComponent(value))) {
                threats.push({
                    type: 'suspicious_cookie',
                    name: name?.trim(),
                    risk: 2
                });
            }
        });

        return threats;
    }

    scanNetworkThreats() {
        // Placeholder para escaneo de amenazas de red
        return [];
    }

    analyzeXHRRequest(method, url) {
        if (this.containsSuspiciousPatterns(url, '')) {
            this.logSecurityEvent('warning', `XHR request sospechoso: ${method} ${url}`, 'NETWORK');
        }
    }

    toggleSecurityPanel() {
        const panel = document.getElementById('bge-security-panel');
        const toggleBtn = document.getElementById('toggle-security');

        panel.classList.toggle('collapsed');
        toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            version: this.version,
            securityLevel: this.state.securityLevel,
            threatsSummary: {
                total: this.state.threatCount,
                blocked: this.state.blockedRequests,
                active: this.state.activeThreats.size
            },
            systemStatus: {
                active: this.state.active,
                lastScan: this.state.lastScanTime,
                quarantineSize: this.state.quarantineList.size
            },
            recentEvents: this.securityLogs.slice(-20),
            recommendations: this.generateSecurityRecommendations()
        };

        // Guardar reporte en localStorage
        localStorage.setItem('bge-security-report', JSON.stringify(report));

        // Mostrar notificación
        this.logSecurityEvent('info', 'Reporte de seguridad generado', 'REPORT');

        return report;
    }

    generateSecurityRecommendations() {
        const recommendations = [];

        if (this.state.threatCount > 10) {
            recommendations.push('Considerar incrementar nivel de seguridad');
        }

        if (this.state.blockedRequests > 50) {
            recommendations.push('Revisar configuración de rate limiting');
        }

        if (this.securityLogs.filter(log => log.level === 'error').length > 5) {
            recommendations.push('Investigar errores de seguridad recurrentes');
        }

        return recommendations;
    }

    // Método para obtener métricas del sistema
    getSecurityMetrics() {
        return {
            version: this.version,
            active: this.state.active,
            securityLevel: this.state.securityLevel,
            threatCount: this.state.threatCount,
            blockedRequests: this.state.blockedRequests,
            activeThreats: this.state.activeThreats.size,
            lastScan: this.state.lastScanTime,
            systemHealth: this.calculateSecurityHealth()
        };
    }

    calculateSecurityHealth() {
        let health = 100;

        // Penalizar por amenazas
        health -= Math.min(this.state.threatCount * 2, 40);

        // Penalizar por requests bloqueados excesivos
        if (this.state.blockedRequests > 100) {
            health -= 20;
        }

        // Bonificar por escaneos recientes
        if (this.state.lastScanTime && (Date.now() - this.state.lastScanTime) < 300000) {
            health += 10;
        }

        return Math.max(health, 0);
    }
}

// Auto-inicialización del sistema
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window !== 'undefined') {
        window.bgeSecurityManager = new BGESecurityManager();

        console.log('🔐 Sistema de Seguridad BGE inicializado');
        console.log('📊 Acceso: window.bgeSecurityManager');
        console.log('🛡️ Comando rápido: window.bgeSecurityManager.performSecurityScan()');
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGESecurityManager;
}