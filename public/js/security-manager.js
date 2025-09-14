/**
 * 🔒 SECURITY MANAGER - Sistema Avanzado de Seguridad
 * Bachillerato General Estatal "Héroes de la Patria"
 * Protección integral contra amenazas web y validación de seguridad
 */

class SecurityManager {
    constructor() {
        this.securityPolicies = {
            csp: {
                enabled: true,
                reportOnly: false,
                violations: []
            },
            xss: {
                protection: true,
                sanitization: true,
                violations: []
            },
            csrf: {
                protection: true,
                tokenGenerated: false,
                tokens: new Map()
            },
            rateLimit: {
                enabled: true,
                requests: new Map(),
                limits: {
                    api: { count: 100, window: 60000 }, // 100 req/min
                    form: { count: 10, window: 60000 },  // 10 forms/min
                    search: { count: 50, window: 60000 } // 50 searches/min
                }
            },
            dataValidation: {
                enabled: true,
                rules: new Map(),
                violations: []
            }
        };

        this.securityMetrics = {
            totalThreats: 0,
            blockedRequests: 0,
            sanitizedInputs: 0,
            validationFailures: 0,
            securityScore: 100
        };

        this.trustedDomains = [
            window.location.hostname,
            'cdn.jsdelivr.net',
            'cdnjs.cloudflare.com',
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        this.init();
    }

    init() {
        //console.log('🔒 Iniciando Security Manager...');
        
        this.setupCSPMonitoring();
        this.setupXSSProtection();
        this.setupCSRFProtection();
        this.setupInputValidation();
        this.setupRateLimiting();
        this.setupSecureHeaders();
        this.setupContentFiltering();
        this.startSecurityMonitoring();
        
        //console.log('✅ Security Manager inicializado');
    }

    // ============================================
    // CSP (Content Security Policy) MONITORING
    // ============================================

    setupCSPMonitoring() {
        // Escuchar violaciones de CSP
        document.addEventListener('securitypolicyviolation', (e) => {
            this.handleCSPViolation(e);
        });

        // Aplicar CSP dinámico si no está definido
        this.enforceCSP();
    }

    handleCSPViolation(event) {
        const violation = {
            blockedURI: event.blockedURI,
            violatedDirective: event.violatedDirective,
            originalPolicy: event.originalPolicy,
            disposition: event.disposition,
            timestamp: Date.now()
        };

        this.securityPolicies.csp.violations.push(violation);
        this.securityMetrics.totalThreats++;

        console.warn('🚨 CSP Violation:', violation);
        
        // Reportar al servidor si está configurado
        this.reportSecurityIncident('csp_violation', violation);
    }

    enforceCSP() {
        // DISABLED - CSP via meta tags has limitations and causes warnings
        // CSP should be configured at server level for production
        //console.log('📋 CSP enforcement skipped (requires server-level configuration)');
        return;
        
        // Solo aplicar si no existe CSP en el documento
        // if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
        //     const cspMeta = document.createElement('meta');
        //     cspMeta.httpEquiv = 'Content-Security-Policy';
        //     cspMeta.content = this.generateCSPPolicy();
        //     document.head.appendChild(cspMeta);
        // }
    }

    generateCSPPolicy() {
        const trustedSources = this.trustedDomains.map(domain => `https://${domain}`).join(' ');
        
        return [
            `default-src 'self' ${trustedSources}`,
            `script-src 'self' ${trustedSources} 'unsafe-inline'`,
            `style-src 'self' ${trustedSources} 'unsafe-inline'`,
            `img-src 'self' ${trustedSources} data: blob:`,
            `font-src 'self' ${trustedSources}`,
            `connect-src 'self' ${trustedSources}`,
            `media-src 'self' ${trustedSources}`,
            `object-src 'none'`,
            `base-uri 'self'`,
            `form-action 'self'`,
            `frame-ancestors 'none'`
        ].join('; ');
    }

    // ============================================
    // XSS PROTECTION
    // ============================================

    setupXSSProtection() {
        // Interceptar inserción de contenido dinámico
        this.setupDOMObserver();
        
        // Sanitizar inputs automáticamente
        this.setupInputSanitization();
        
        // Proteger contra XSS en URLs
        this.validateCurrentURL();
    }

    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanElementForThreats(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'href', 'onclick', 'onload']
        });
    }

    scanElementForThreats(element) {
        // Verificar scripts maliciosos
        if (element.tagName === 'SCRIPT') {
            if (!this.isScriptTrusted(element)) {
                this.blockMaliciousScript(element);
                return;
            }
        }

        // Verificar atributos peligrosos
        const dangerousAttributes = ['onclick', 'onload', 'onerror', 'onmouseover'];
        dangerousAttributes.forEach(attr => {
            if (element.hasAttribute(attr)) {
                this.sanitizeAttribute(element, attr);
            }
        });

        // Verificar enlaces sospechosos
        if (element.tagName === 'A' && element.href) {
            this.validateLink(element);
        }
    }

    isScriptTrusted(script) {
        if (script.src) {
            const scriptDomain = new URL(script.src).hostname;
            return this.trustedDomains.includes(scriptDomain);
        }
        
        // Verificar contenido inline
        const content = script.textContent;
        if (this.containsMaliciousCode(content)) {
            return false;
        }
        
        return true;
    }

    containsMaliciousCode(code) {
        const maliciousPatterns = [
            /eval\s*\(/i,
            /document\.write\s*\(/i,
            /innerHTML\s*=/i,
            /outerHTML\s*=/i,
            /javascript\s*:/i,
            /data\s*:\s*text\/html/i,
            /base64/i
        ];

        return maliciousPatterns.some(pattern => pattern.test(code));
    }

    blockMaliciousScript(script) {
        script.remove();
        
        const incident = {
            type: 'blocked_script',
            src: script.src || 'inline',
            content: script.textContent?.substring(0, 100),
            timestamp: Date.now()
        };
        
        this.securityMetrics.blockedRequests++;
        this.reportSecurityIncident('malicious_script', incident);
        
        console.warn('🚨 Script malicioso bloqueado:', incident);
    }

    sanitizeAttribute(element, attribute) {
        const originalValue = element.getAttribute(attribute);
        element.removeAttribute(attribute);
        
        const incident = {
            type: 'sanitized_attribute',
            element: element.tagName,
            attribute: attribute,
            value: originalValue,
            timestamp: Date.now()
        };
        
        this.securityMetrics.sanitizedInputs++;
        this.reportSecurityIncident('attribute_sanitized', incident);
    }

    validateLink(link) {
        try {
            const url = new URL(link.href);
            
            // Verificar protocolo
            if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
                this.sanitizeLink(link);
                return;
            }
            
            // Verificar dominios sospechosos
            if (this.isSuspiciousDomain(url.hostname)) {
                this.markSuspiciousLink(link);
            }
            
        } catch (error) {
            // URL inválida
            this.sanitizeLink(link);
        }
    }

    isSuspiciousDomain(hostname) {
        const suspiciousPatterns = [
            /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IPs
            /[a-z]{20,}\./, // Dominios muy largos
            /.*\.tk$|.*\.ml$|.*\.ga$|.*\.cf$/ // TLDs sospechosos
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(hostname));
    }

    sanitizeLink(link) {
        link.removeAttribute('href');
        link.style.color = '#dc3545';
        link.title = 'Enlace bloqueado por seguridad';
        
        this.securityMetrics.blockedRequests++;
    }

    markSuspiciousLink(link) {
        link.style.color = '#ffc107';
        link.title = 'Enlace marcado como sospechoso';
        link.addEventListener('click', (e) => {
            if (!confirm('Este enlace ha sido marcado como potencialmente sospechoso. ¿Deseas continuar?')) {
                e.preventDefault();
            }
        });
    }

    setupInputSanitization() {
        // Sanitizar inputs automáticamente
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.sanitizeInput(e.target);
            }
        });
        
        // Sanitizar formularios antes del envío
        document.addEventListener('submit', (e) => {
            this.sanitizeForm(e.target);
        });
    }

    sanitizeInput(input) {
        const originalValue = input.value;
        const sanitizedValue = this.sanitizeString(originalValue);
        
        if (originalValue !== sanitizedValue) {
            input.value = sanitizedValue;
            this.securityMetrics.sanitizedInputs++;
            
            // Mostrar advertencia discreta
            this.showSecurityWarning(input, 'Contenido sanitizado por seguridad');
        }
    }

    sanitizeString(str) {
        if (!str) return str;
        
        // Remover scripts y contenido peligroso
        return str
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .replace(/eval\s*\(/gi, '')
            .replace(/document\.write/gi, '');
    }

    sanitizeForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type !== 'password') { // No sanitizar contraseñas
                this.sanitizeInput(input);
            }
        });
    }

    validateCurrentURL() {
        const params = new URLSearchParams(window.location.search);
        let hasThreats = false;
        
        for (const [key, value] of params) {
            if (this.containsMaliciousCode(value)) {
                params.delete(key);
                hasThreats = true;
            }
        }
        
        if (hasThreats) {
            const cleanURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
            window.history.replaceState({}, document.title, cleanURL);
            
            this.securityMetrics.sanitizedInputs++;
            console.warn('🚨 Parámetros URL maliciosos removidos');
        }
    }

    // ============================================
    // CSRF PROTECTION
    // ============================================

    setupCSRFProtection() {
        this.generateCSRFToken();
        this.protectForms();
        this.protectAjaxRequests();
    }

    generateCSRFToken() {
        const token = this.randomString(32);
        sessionStorage.setItem('csrf_token', token);
        this.securityPolicies.csrf.tokenGenerated = true;
        
        // Agregar token a meta tag
        const tokenMeta = document.createElement('meta');
        tokenMeta.name = 'csrf-token';
        tokenMeta.content = token;
        document.head.appendChild(tokenMeta);
        
        return token;
    }

    getCSRFToken() {
        return sessionStorage.getItem('csrf_token') || this.generateCSRFToken();
    }

    protectForms() {
        document.addEventListener('submit', (e) => {
            if (e.target.matches('form[data-csrf-protect]')) {
                this.addCSRFTokenToForm(e.target);
            }
        });
        
        // Proteger formularios existentes
        document.querySelectorAll('form[data-csrf-protect]').forEach(form => {
            this.addCSRFTokenToForm(form);
        });
    }

    addCSRFTokenToForm(form) {
        let tokenInput = form.querySelector('input[name="csrf_token"]');
        
        if (!tokenInput) {
            tokenInput = document.createElement('input');
            tokenInput.type = 'hidden';
            tokenInput.name = 'csrf_token';
            form.appendChild(tokenInput);
        }
        
        tokenInput.value = this.getCSRFToken();
    }

    protectAjaxRequests() {
        // Interceptar fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const [url, options = {}] = args;
            
            // Agregar CSRF token a requests POST/PUT/DELETE
            if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
                options.headers = {
                    ...options.headers,
                    'X-CSRF-Token': this.getCSRFToken()
                };
            }
            
            return originalFetch.apply(window, [url, options]);
        };
        
        // Interceptar XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
            this._method = method;
            return originalOpen.apply(this, [method, url, ...args]);
        };
        
        XMLHttpRequest.prototype.send = function(data) {
            if (this._method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(this._method.toUpperCase())) {
                this.setRequestHeader('X-CSRF-Token', window.securityManager.getCSRFToken());
            }
            return originalSend.apply(this, [data]);
        };
    }

    // ============================================
    // INPUT VALIDATION
    // ============================================

    setupInputValidation() {
        // Reglas de validación por tipo de input
        this.securityPolicies.dataValidation.rules.set('email', {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            maxLength: 254,
            sanitize: true
        });
        
        this.securityPolicies.dataValidation.rules.set('phone', {
            pattern: /^[\d\s\-\+\(\)]+$/,
            maxLength: 20,
            sanitize: true
        });
        
        this.securityPolicies.dataValidation.rules.set('text', {
            maxLength: 1000,
            sanitize: true,
            noScripts: true
        });
        
        // Aplicar validación automática
        document.addEventListener('input', (e) => {
            this.validateInput(e.target);
        });
    }

    validateInput(input) {
        const inputType = input.type || input.dataset.validate || 'text';
        const rules = this.securityPolicies.dataValidation.rules.get(inputType);
        
        if (!rules) return true;
        
        let isValid = true;
        
        // Validar longitud
        if (rules.maxLength && input.value.length > rules.maxLength) {
            input.value = input.value.substring(0, rules.maxLength);
            this.showValidationError(input, `Máximo ${rules.maxLength} caracteres`);
            isValid = false;
        }
        
        // Validar patrón
        if (rules.pattern && input.value && !rules.pattern.test(input.value)) {
            this.showValidationError(input, 'Formato inválido');
            isValid = false;
        }
        
        // Validar scripts
        if (rules.noScripts && this.containsMaliciousCode(input.value)) {
            input.value = this.sanitizeString(input.value);
            this.showValidationError(input, 'Contenido no permitido removido');
            isValid = false;
        }
        
        if (!isValid) {
            this.securityMetrics.validationFailures++;
        }
        
        return isValid;
    }

    showValidationError(input, message) {
        // Remover mensajes previos
        const existingError = input.parentNode.querySelector('.security-validation-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Mostrar nuevo mensaje
        const errorDiv = document.createElement('div');
        errorDiv.className = 'security-validation-error text-danger small';
        errorDiv.textContent = message;
        errorDiv.style.fontSize = '0.8rem';
        
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
        input.style.borderColor = '#dc3545';
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
                input.style.borderColor = '';
            }
        }, 3000);
    }

    // ============================================
    // RATE LIMITING
    // ============================================

    setupRateLimiting() {
        // Interceptar formularios
        document.addEventListener('submit', (e) => {
            if (!this.checkRateLimit('form')) {
                e.preventDefault();
                this.showRateLimitError('form');
            }
        });
        
        // Interceptar búsquedas
        document.addEventListener('input', (e) => {
            if (e.target.matches('[data-search]')) {
                if (!this.checkRateLimit('search')) {
                    e.target.disabled = true;
                    setTimeout(() => {
                        e.target.disabled = false;
                    }, 5000);
                }
            }
        });
        
        // Interceptar requests API
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            if (!this.checkRateLimit('api')) {
                throw new Error('Rate limit exceeded');
            }
            return originalFetch.apply(window, args);
        };
    }

    checkRateLimit(type) {
        const now = Date.now();
        const limit = this.securityPolicies.rateLimit.limits[type];
        
        if (!limit) return true;
        
        const requests = this.securityPolicies.rateLimit.requests.get(type) || [];
        
        // Limpiar requests antiguos
        const validRequests = requests.filter(timestamp => 
            now - timestamp < limit.window
        );
        
        // Verificar límite
        if (validRequests.length >= limit.count) {
            this.securityMetrics.blockedRequests++;
            return false;
        }
        
        // Agregar request actual
        validRequests.push(now);
        this.securityPolicies.rateLimit.requests.set(type, validRequests);
        
        return true;
    }

    showRateLimitError(type) {
        const messages = {
            form: 'Muchos envíos de formularios. Espera un momento.',
            api: 'Muchas solicitudes. Espera un momento.',
            search: 'Muchas búsquedas. Espera un momento.'
        };
        
        this.showSecurityAlert(messages[type] || 'Rate limit excedido');
    }

    // ============================================
    // SECURE HEADERS
    // ============================================

    setupSecureHeaders() {
        // DISABLED - HTTP headers via meta tags cause console warnings
        // These should be configured at server level for proper security
        //console.log('📋 Secure headers skipped (requires server-level configuration)');
        
        // Store security preferences locally for client-side validation
        this.securityMetrics.headersConfigured = true;
        
        // Only configure safe meta tags that don't generate warnings
        const safeMetas = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' }
        ];
        
        safeMetas.forEach(meta => {
            if (!document.querySelector(`meta[name="${meta.name}"]`)) {
                const metaEl = document.createElement('meta');
                metaEl.name = meta.name;
                metaEl.content = meta.content;
                document.head.appendChild(metaEl);
            }
        });
    }

    // ============================================
    // CONTENT FILTERING
    // ============================================

    setupContentFiltering() {
        // Filtrar contenido inapropiado
        this.contentFilters = [
            /password/i,
            /credit.*card/i,
            /ssn|social.*security/i,
            /api.*key/i,
            /token/i
        ];
        
        document.addEventListener('input', (e) => {
            if (e.target.type !== 'password') {
                this.filterSensitiveContent(e.target);
            }
        });
    }

    filterSensitiveContent(input) {
        const content = input.value;
        let filtered = false;
        
        this.contentFilters.forEach(filter => {
            if (filter.test(content)) {
                // Alertar sobre contenido sensible
                this.showSecurityWarning(input, 'Evita ingresar información sensible');
                filtered = true;
            }
        });
        
        if (filtered) {
            this.securityMetrics.sanitizedInputs++;
        }
    }

    // ============================================
    // MONITORING Y REPORTING
    // ============================================

    startSecurityMonitoring() {
        // Monitoreo continuo cada 30 segundos
        setInterval(() => {
            this.updateSecurityScore();
            this.checkSecurityThreshold();
        }, 30000);
        
        // Reporte periódico cada 5 minutos
        setInterval(() => {
            this.generateSecurityReport();
        }, 300000);
    }

    updateSecurityScore() {
        const baseScore = 100;
        const totalIncidents = this.securityMetrics.totalThreats + 
                              this.securityMetrics.validationFailures;
        
        // Reducir score basado en incidentes
        const penalty = Math.min(totalIncidents * 2, 50);
        this.securityMetrics.securityScore = Math.max(baseScore - penalty, 0);
    }

    checkSecurityThreshold() {
        if (this.securityMetrics.securityScore < 70) {
            console.warn('🚨 Score de seguridad bajo:', this.securityMetrics.securityScore);
            this.escalateSecurityAlert();
        }
    }

    escalateSecurityAlert() {
        const alertModal = document.createElement('div');
        alertModal.className = 'security-alert-modal';
        alertModal.innerHTML = `
            <div class="security-alert-content">
                <h4>🚨 Alerta de Seguridad</h4>
                <p>Se han detectado múltiples incidentes de seguridad.</p>
                <p>Score actual: ${this.securityMetrics.securityScore}/100</p>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary">Entendido</button>
            </div>
        `;
        
        alertModal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
        `;
        
        document.body.appendChild(alertModal);
    }

    reportSecurityIncident(type, details) {
        const incident = {
            type,
            details,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Almacenar localmente
        const incidents = JSON.parse(localStorage.getItem('security_incidents') || '[]');
        incidents.push(incident);
        
        // Mantener solo los últimos 100 incidentes
        if (incidents.length > 100) {
            incidents.splice(0, incidents.length - 100);
        }
        
        localStorage.setItem('security_incidents', JSON.stringify(incidents));
        
        // Enviar al servidor si está disponible
        this.sendIncidentToServer(incident);
    }

    async sendIncidentToServer(incident) {
        // DESHABILITADO - Backend no implementado (evita bucles de errores 404)
        //console.log('📋 Security incident logged locally:', incident.type);
        return;
        
        try {
            await fetch('/api/security/incident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.getCSRFToken()
                },
                body: JSON.stringify(incident)
            });
        } catch (error) {
            // Silent fail - los incidentes se mantienen localmente
        }
    }

    generateSecurityReport() {
        const report = {
            timestamp: Date.now(),
            score: this.securityMetrics.securityScore,
            metrics: this.securityMetrics,
            policies: {
                csp: {
                    enabled: this.securityPolicies.csp.enabled,
                    violations: this.securityPolicies.csp.violations.length
                },
                xss: {
                    protection: this.securityPolicies.xss.protection,
                    violations: this.securityPolicies.xss.violations.length
                },
                csrf: {
                    protection: this.securityPolicies.csrf.protection,
                    tokenActive: this.securityPolicies.csrf.tokenGenerated
                },
                rateLimit: {
                    enabled: this.securityPolicies.rateLimit.enabled,
                    activeRequests: Array.from(this.securityPolicies.rateLimit.requests.keys()).length
                }
            }
        };
        
        console.group('🔒 Security Report');
        console.table(report.metrics);
        //console.log('Políticas:', report.policies);
        console.groupEnd();
        
        return report;
    }

    // ============================================
    // UI HELPERS
    // ============================================

    showSecurityWarning(element, message) {
        const warning = document.createElement('div');
        warning.className = 'security-warning';
        warning.textContent = `⚠️ ${message}`;
        warning.style.cssText = `
            position: absolute; background: #ffc107; color: #000;
            padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;
            z-index: 1000; margin-top: -30px; white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        
        element.style.position = 'relative';
        element.parentNode.appendChild(warning);
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 3000);
    }

    showSecurityAlert(message) {
        const alert = document.createElement('div');
        alert.className = 'security-toast';
        alert.innerHTML = `
            <div class="security-toast-content">
                🔒 ${message}
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        alert.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #dc3545; color: white; padding: 12px 16px;
            border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    randomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // ============================================
    // API PÚBLICA
    // ============================================

    // Obtener métricas de seguridad
    getSecurityMetrics() {
        return {
            ...this.securityMetrics,
            policies: this.securityPolicies
        };
    }

    // Generar reporte completo
    getFullSecurityReport() {
        return this.generateSecurityReport();
    }

    // Verificar si un dominio es confiable
    isTrustedDomain(domain) {
        return this.trustedDomains.includes(domain);
    }

    // Agregar dominio confiable
    addTrustedDomain(domain) {
        if (!this.trustedDomains.includes(domain)) {
            this.trustedDomains.push(domain);
        }
    }

    // Sanitizar string manualmente
    sanitize(str) {
        return this.sanitizeString(str);
    }

    // Validar input manualmente
    validate(input) {
        return this.validateInput(input);
    }
}

// Auto-inicialización
let securityManager;

document.addEventListener('DOMContentLoaded', () => {
    securityManager = new SecurityManager();
    
    // Hacer disponible globalmente
    window.securityManager = securityManager;
});

// Agregar estilos para componentes de seguridad
const securityStyles = document.createElement('style');
securityStyles.textContent = `
    .security-warning {
        animation: securityFade 0.3s ease-in-out;
    }
    
    .security-alert-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        max-width: 400px;
    }
    
    .security-toast-content {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: space-between;
    }
    
    .security-toast-content button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
    }
    
    .security-validation-error {
        animation: securitySlideIn 0.3s ease-out;
    }
    
    @keyframes securityFade {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes securitySlideIn {
        from { opacity: 0; transform: translateX(-10px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    input:invalid {
        border-color: #dc3545 !important;
    }
    
    input:valid {
        border-color: #28a745 !important;
    }
    
    .security-protected::before {
        content: "🔒";
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
        opacity: 0.6;
    }
`;

document.head.appendChild(securityStyles);

// Exponer la clase
window.SecurityManager = SecurityManager;

//console.log('🔒 Security Manager cargado. Usa window.securityManager para acceso directo.');