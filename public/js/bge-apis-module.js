/**
 * 🌐 BGE APIS MODULE - BACHILLERATO GENERAL ESTATAL "HÉROES DE LA PATRIA"
 * Módulo unificado para manejo de APIs externas y integraciones gubernamentales
 *
 * CONSOLIDA:
 * - external-integrations.js (Sistema completo con SEP, CURP, Google Workspace, etc.)
 * - external-apis-integration.js (Sistema simplificado Google Classroom + SEP)
 * - google-classroom-integration.js (Funcionalidad específica)
 * - sep-connectivity-system.js (Conectividad SEP)
 *
 * Versión: 1.0.0
 * Fecha: 27 de Septiembre, 2025
 * Reducción: 4 archivos → 1 módulo (-75% archivos)
 */

class BGEAPIsModule extends BGEModule {
    constructor(framework) {
        super(framework);
        this.version = '1.0.0';
        this.name = 'apis';

        // Configuración de APIs
        this.config = {
            enableGoogleClassroom: true,
            enableSEPConnectivity: true,
            enableCURPValidation: true,
            enableSocialIntegrations: false, // Deshabilitado por defecto
            enableRealTimeSync: false, // Solo en producción
            enableOfflineMode: true,
            syncInterval: 300000, // 5 minutos
            retryAttempts: 3,
            timeout: 30000,
            developmentMode: window.location.hostname === 'localhost'
        };

        // Estado de APIs
        this.apiStatus = {
            googleClassroom: {
                connected: false,
                lastSync: null,
                error: null,
                features: []
            },
            sepConnectivity: {
                connected: false,
                lastSync: null,
                error: null,
                services: []
            },
            curpValidator: {
                connected: false,
                lastValidation: null,
                error: null
            },
            socialMedia: {
                connected: false,
                platforms: [],
                error: null
            }
        };

        // Endpoints configurables
        this.endpoints = {
            sep: 'https://api.sep.gob.mx/v1/',
            curp: 'https://renapo.gob.mx/api/v1/',
            googleClassroom: '/api/google-classroom/',
            internal: '/api/',
            backup: this.config.developmentMode ? '/api/' : '/api/'
        };

        // Integraciones disponibles
        this.integrations = new Map();
        this.offlineQueue = [];
        this.syncInProgress = false;
    }

    async initialize() {
        await super.initialize();

        try {
            this.log('Inicializando BGE APIs Module...');

            // 1. Verificar dependencias y conexiones
            await this.checkDependencies();

            // 2. Inicializar integraciones por prioridad
            await this.initializeCoreIntegrations();

            // 3. Configurar validaciones automáticas
            this.setupAutomaticValidations();

            // 4. Configurar sincronización
            this.setupSynchronization();

            // 5. Configurar modo offline
            this.setupOfflineMode();

            // 6. Configurar API unificada
            this.setupUnifiedAPI();

            this.log('✅ BGE APIs Module inicializado correctamente');

            // Generar reporte inicial después de 3 segundos
            setTimeout(() => this.generateIntegrationReport(), 3000);

        } catch (error) {
            this.error('Error inicializando APIs Module:', error);
        }
    }

    /**
     * 🔍 Verificar dependencias del sistema
     */
    async checkDependencies() {
        const dependencies = {
            fetch: typeof fetch !== 'undefined',
            localStorage: typeof localStorage !== 'undefined',
            googleClassroom: typeof GoogleClassroomIntegration !== 'undefined' || window.googleClassroom,
            sepConnectivity: typeof SEPConnectivitySystem !== 'undefined' || window.sepConnectivitySystem,
            navigator: typeof navigator !== 'undefined'
        };

        this.log('🔍 Verificando dependencias:', dependencies);

        // Verificar conectividad de red
        if (navigator.onLine) {
            try {
                const testResponse = await fetch(this.endpoints.internal + 'ping', {
                    method: 'GET',
                    timeout: 5000
                });
                dependencies.networkConnectivity = testResponse.ok;
            } catch {
                dependencies.networkConnectivity = false;
            }
        } else {
            dependencies.networkConnectivity = false;
        }

        this.dependencies = dependencies;
        return dependencies;
    }

    /**
     * 🚀 Inicializar integraciones principales
     */
    async initializeCoreIntegrations() {
        const initPromises = [];

        // Google Classroom (prioridad alta)
        if (this.config.enableGoogleClassroom) {
            initPromises.push(this.initializeGoogleClassroom());
        }

        // SEP Connectivity (prioridad alta)
        if (this.config.enableSEPConnectivity) {
            initPromises.push(this.initializeSEPConnectivity());
        }

        // CURP Validation (prioridad media)
        if (this.config.enableCURPValidation) {
            initPromises.push(this.initializeCURPValidator());
        }

        // Social Integrations (prioridad baja)
        if (this.config.enableSocialIntegrations) {
            initPromises.push(this.initializeSocialIntegrations());
        }

        // Ejecutar todas las inicializaciones
        const results = await Promise.allSettled(initPromises);
        this.logInitializationResults(results);
    }

    /**
     * 🎓 Inicializar Google Classroom
     */
    async initializeGoogleClassroom() {
        try {
            let classroom = null;

            // Verificar si Google Classroom ya está disponible
            if (window.googleClassroom) {
                classroom = window.googleClassroom;
            } else if (typeof GoogleClassroomIntegration !== 'undefined') {
                classroom = new GoogleClassroomIntegration();
                await classroom.init();
            }

            if (classroom) {
                this.integrations.set('googleClassroom', classroom);
                this.apiStatus.googleClassroom.connected = true;
                this.apiStatus.googleClassroom.lastSync = new Date().toISOString();
                this.apiStatus.googleClassroom.features = [
                    'assignments', 'grades', 'courses', 'students'
                ];
                this.log('🎓 Google Classroom conectado exitosamente');
            } else {
                throw new Error('Google Classroom no está disponible');
            }

        } catch (error) {
            this.log('⚠️ Error conectando Google Classroom:', error.message);
            this.apiStatus.googleClassroom.error = error.message;
        }
    }

    /**
     * 🏛️ Inicializar conectividad SEP
     */
    async initializeSEPConnectivity() {
        try {
            let sep = null;

            // Verificar si SEP ya está disponible
            if (window.sepConnectivitySystem) {
                sep = window.sepConnectivitySystem;
            } else if (typeof SEPConnectivitySystem !== 'undefined') {
                sep = new SEPConnectivitySystem();
                await sep.init();
            }

            if (sep) {
                this.integrations.set('sepConnectivity', sep);
                this.apiStatus.sepConnectivity.connected = true;
                this.apiStatus.sepConnectivity.lastSync = new Date().toISOString();
                this.apiStatus.sepConnectivity.services = [
                    'student_records', 'certificates', 'enrollment'
                ];
                this.log('🏛️ SEP Connectivity conectado exitosamente');
            } else {
                throw new Error('SEP Connectivity no está disponible');
            }

        } catch (error) {
            this.log('⚠️ Error conectando SEP:', error.message);
            this.apiStatus.sepConnectivity.error = error.message;
        }
    }

    /**
     * 🆔 Inicializar validador CURP
     */
    async initializeCURPValidator() {
        try {
            this.curpValidator = {
                validate: async (curp) => {
                    return this.validateCURP(curp);
                },
                formatCURP: (curp) => {
                    return curp.toUpperCase().replace(/[^A-Z0-9]/g, '');
                },
                isValidFormat: (curp) => {
                    const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
                    return curpRegex.test(curp);
                }
            };

            this.integrations.set('curpValidator', this.curpValidator);
            this.apiStatus.curpValidator.connected = true;
            this.log('🆔 CURP Validator inicializado exitosamente');

        } catch (error) {
            this.log('⚠️ Error inicializando CURP Validator:', error.message);
            this.apiStatus.curpValidator.error = error.message;
        }
    }

    /**
     * 📱 Inicializar integraciones sociales
     */
    async initializeSocialIntegrations() {
        try {
            this.socialIntegrations = {
                facebook: {
                    share: (url, title) => this.shareToFacebook(url, title),
                    connected: false
                },
                twitter: {
                    share: (url, title) => this.shareToTwitter(url, title),
                    connected: false
                },
                whatsapp: {
                    share: (url, title) => this.shareToWhatsApp(url, title),
                    connected: true // Siempre disponible
                }
            };

            this.integrations.set('socialMedia', this.socialIntegrations);
            this.apiStatus.socialMedia.connected = true;
            this.apiStatus.socialMedia.platforms = ['whatsapp', 'facebook', 'twitter'];
            this.log('📱 Integraciones sociales inicializadas');

        } catch (error) {
            this.log('⚠️ Error inicializando integraciones sociales:', error.message);
            this.apiStatus.socialMedia.error = error.message;
        }
    }

    /**
     * 🔧 Configurar validaciones automáticas
     */
    setupAutomaticValidations() {
        // Validación automática de CURP en formularios
        document.addEventListener('input', (e) => {
            if (e.target.name === 'curp' || e.target.id === 'curp' || e.target.classList.contains('curp-field')) {
                this.handleCURPValidation(e.target);
            }
        });

        // Validación de formularios antes del envío
        document.addEventListener('submit', (e) => {
            if (e.target.classList.contains('form-with-apis')) {
                this.handleFormSubmission(e);
            }
        });

        // Manejo de enlaces de compartir social
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('social-share') || e.target.closest('.social-share')) {
                this.handleSocialShare(e);
            }
        });

        this.log('🔧 Validaciones automáticas configuradas');
    }

    /**
     * 🆔 Manejar validación de CURP
     */
    async handleCURPValidation(field) {
        const curp = field.value.toUpperCase().trim();

        // Limpiar validación anterior
        this.clearFieldValidation(field);

        if (curp.length === 0) return;

        if (curp.length === 18) {
            // Mostrar loading
            this.showFieldLoading(field, '🔍 Validando CURP...');

            try {
                const isValid = await this.validateCURP(curp);
                this.updateFieldValidation(field, isValid,
                    isValid ? '✅ CURP válida' : '❌ CURP no válida o no encontrada');

                // Registrar validación
                this.apiStatus.curpValidator.lastValidation = {
                    curp: curp,
                    valid: isValid,
                    timestamp: Date.now()
                };

            } catch (error) {
                this.updateFieldValidation(field, false, '⚠️ Error validando CURP');
                this.log('Error validando CURP:', error);
            }
        } else {
            // Validación de formato básica
            const hasValidFormat = this.curpValidator.isValidFormat(curp + 'X'.repeat(18 - curp.length));
            if (curp.length >= 4 && !hasValidFormat) {
                this.updateFieldValidation(field, false, '⚠️ Formato de CURP incorrecto');
            }
        }
    }

    /**
     * 🔍 Validar CURP con APIs
     */
    async validateCURP(curp) {
        // Validación de formato
        if (!this.curpValidator.isValidFormat(curp)) {
            return false;
        }

        // En modo desarrollo, usar validación simulada
        if (this.config.developmentMode) {
            return this.simulateCURPValidation(curp);
        }

        try {
            // Intentar validación real con API
            const response = await fetch(`${this.endpoints.curp}validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ curp: curp }),
                timeout: this.config.timeout
            });

            if (response.ok) {
                const result = await response.json();
                return result.valid === true;
            }

            // Si la API no está disponible, usar validación local
            return this.validateCURPLocal(curp);

        } catch (error) {
            this.log('Error en validación CURP online, usando validación local');
            return this.validateCURPLocal(curp);
        }
    }

    /**
     * 🔍 Validación CURP simulada para desarrollo
     */
    simulateCURPValidation(curp) {
        // Simulación: CURPs que empiecen con 'AAA' son inválidas
        if (curp.startsWith('AAA')) return false;

        // Simulación: formato válido = CURP válida
        return this.curpValidator.isValidFormat(curp);
    }

    /**
     * 🔍 Validación CURP local (algoritmo de verificación)
     */
    validateCURPLocal(curp) {
        // Algoritmo simplificado de validación de CURP
        if (!this.curpValidator.isValidFormat(curp)) return false;

        // Verificar dígito verificador
        const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let sum = 0;

        for (let i = 0; i < 17; i++) {
            const charValue = alphabet.indexOf(curp.charAt(i));
            sum += charValue * (18 - i);
        }

        const checkDigit = 10 - (sum % 10);
        const expectedCheckDigit = checkDigit === 10 ? 0 : checkDigit;
        const actualCheckDigit = parseInt(curp.charAt(17));

        return expectedCheckDigit === actualCheckDigit;
    }

    /**
     * 📱 Manejar compartir en redes sociales
     */
    handleSocialShare(event) {
        event.preventDefault();

        const button = event.target.closest('.social-share');
        const platform = button.dataset.platform;
        const url = button.dataset.url || window.location.href;
        const title = button.dataset.title || document.title;

        switch (platform) {
            case 'facebook':
                this.shareToFacebook(url, title);
                break;
            case 'twitter':
                this.shareToTwitter(url, title);
                break;
            case 'whatsapp':
                this.shareToWhatsApp(url, title);
                break;
            default:
                this.log('Plataforma social no soportada:', platform);
        }

        // Registrar evento
        this.framework.dispatchEvent('socialShare', {
            platform: platform,
            url: url,
            title: title,
            timestamp: Date.now()
        });
    }

    /**
     * 📘 Compartir en Facebook
     */
    shareToFacebook(url, title) {
        const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        this.openShareWindow(shareUrl, 'Facebook');
    }

    /**
     * 🐦 Compartir en Twitter
     */
    shareToTwitter(url, title) {
        const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        this.openShareWindow(shareUrl, 'Twitter');
    }

    /**
     * 💬 Compartir en WhatsApp
     */
    shareToWhatsApp(url, title) {
        const text = `${title} ${url}`;
        const shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(shareUrl, '_blank');
    }

    /**
     * 🪟 Abrir ventana para compartir
     */
    openShareWindow(url, platform) {
        const width = 600;
        const height = 400;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        window.open(url, `share${platform}`,
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
    }

    /**
     * 🔄 Configurar sincronización
     */
    setupSynchronization() {
        if (!this.config.enableRealTimeSync) {
            this.log('Sincronización en tiempo real deshabilitada');
            return;
        }

        // Sincronización periódica
        setInterval(() => {
            if (!this.syncInProgress) {
                this.synchronizeData();
            }
        }, this.config.syncInterval);

        // Sincronización cuando se recupera conexión
        window.addEventListener('online', () => {
            this.log('🌐 Conexión restaurada, sincronizando...');
            this.synchronizeData();
        });

        this.log('🔄 Sistema de sincronización configurado');
    }

    /**
     * 🔄 Sincronizar datos
     */
    async synchronizeData() {
        if (this.syncInProgress) return;
        this.syncInProgress = true;

        try {
            this.log('🔄 Iniciando sincronización de datos...');

            // Sincronizar con Google Classroom
            if (this.apiStatus.googleClassroom.connected) {
                await this.syncGoogleClassroom();
            }

            // Sincronizar con SEP
            if (this.apiStatus.sepConnectivity.connected) {
                await this.syncSEP();
            }

            // Procesar cola offline
            await this.processOfflineQueue();

            this.log('✅ Sincronización completada');

        } catch (error) {
            this.error('Error en sincronización:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * 🎓 Sincronizar Google Classroom
     */
    async syncGoogleClassroom() {
        const classroom = this.integrations.get('googleClassroom');
        if (!classroom || !classroom.sync) return;

        try {
            const syncResult = await classroom.sync();
            this.apiStatus.googleClassroom.lastSync = new Date().toISOString();
            this.log('🎓 Google Classroom sincronizado:', syncResult);
        } catch (error) {
            this.log('⚠️ Error sincronizando Google Classroom:', error);
        }
    }

    /**
     * 🏛️ Sincronizar SEP
     */
    async syncSEP() {
        const sep = this.integrations.get('sepConnectivity');
        if (!sep || !sep.sync) return;

        try {
            const syncResult = await sep.sync();
            this.apiStatus.sepConnectivity.lastSync = new Date().toISOString();
            this.log('🏛️ SEP sincronizado:', syncResult);
        } catch (error) {
            this.log('⚠️ Error sincronizando SEP:', error);
        }
    }

    /**
     * 📴 Configurar modo offline
     */
    setupOfflineMode() {
        if (!this.config.enableOfflineMode) return;

        // Detectar cambios de conectividad
        window.addEventListener('offline', () => {
            this.log('📴 Modo offline activado');
            this.showOfflineNotification();
        });

        window.addEventListener('online', () => {
            this.log('🌐 Conexión restaurada');
            this.hideOfflineNotification();
            this.processOfflineQueue();
        });

        this.log('📴 Modo offline configurado');
    }

    /**
     * 📄 Procesar cola offline
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        this.log(`📄 Procesando ${this.offlineQueue.length} elementos de cola offline`);

        const processed = [];
        for (const item of this.offlineQueue) {
            try {
                await this.processOfflineItem(item);
                processed.push(item);
            } catch (error) {
                this.log('Error procesando item offline:', error);
            }
        }

        // Remover items procesados
        this.offlineQueue = this.offlineQueue.filter(item => !processed.includes(item));
    }

    /**
     * 🔧 Configurar API unificada
     */
    setupUnifiedAPI() {
        // Exponer API unificada en el framework
        this.framework.apis = {
            // Google Classroom
            classroom: {
                getCourses: () => this.callAPI('googleClassroom', 'getCourses'),
                getAssignments: (courseId) => this.callAPI('googleClassroom', 'getAssignments', courseId),
                submitGrade: (assignmentId, grade) => this.callAPI('googleClassroom', 'submitGrade', assignmentId, grade)
            },

            // SEP
            sep: {
                getStudentRecord: (curp) => this.callAPI('sepConnectivity', 'getStudentRecord', curp),
                getCertificates: (studentId) => this.callAPI('sepConnectivity', 'getCertificates', studentId),
                validateEnrollment: (data) => this.callAPI('sepConnectivity', 'validateEnrollment', data)
            },

            // CURP
            curp: {
                validate: (curp) => this.validateCURP(curp),
                format: (curp) => this.curpValidator.formatCURP(curp),
                isValidFormat: (curp) => this.curpValidator.isValidFormat(curp)
            },

            // Social
            social: {
                share: (platform, url, title) => this.shareContent(platform, url, title)
            },

            // Utilidades
            utils: {
                getStatus: () => this.getAPIStatus(),
                sync: () => this.synchronizeData(),
                clearOfflineQueue: () => this.clearOfflineQueue()
            }
        };

        this.log('🔧 API unificada configurada');
    }

    /**
     * 📞 Llamar API específica
     */
    async callAPI(integrationName, method, ...args) {
        const integration = this.integrations.get(integrationName);
        if (!integration) {
            throw new Error(`Integración ${integrationName} no está disponible`);
        }

        if (typeof integration[method] !== 'function') {
            throw new Error(`Método ${method} no existe en ${integrationName}`);
        }

        try {
            return await integration[method](...args);
        } catch (error) {
            // Si falla y estamos offline, agregar a cola
            if (!navigator.onLine && this.config.enableOfflineMode) {
                this.offlineQueue.push({
                    integration: integrationName,
                    method: method,
                    args: args,
                    timestamp: Date.now()
                });
                throw new Error('Sin conexión: operación agregada a cola offline');
            }
            throw error;
        }
    }

    /**
     * 🔍 Utilidades de UI para validación de campos
     */
    clearFieldValidation(field) {
        const feedback = field.parentNode.querySelector('.bge-validation-feedback');
        if (feedback) feedback.remove();

        field.classList.remove('is-valid', 'is-invalid');
    }

    showFieldLoading(field, message) {
        this.clearFieldValidation(field);

        const feedback = document.createElement('div');
        feedback.className = 'bge-validation-feedback text-muted';
        feedback.innerHTML = DOMPurify.sanitize( DOMPurify.sanitize(`<small>${message}</small>`));
        field.parentNode.appendChild(feedback);
    }

    updateFieldValidation(field, isValid, message) {
        this.clearFieldValidation(field);

        const feedback = document.createElement('div');
        feedback.className = `bge-validation-feedback ${isValid ? 'text-success' : 'text-danger'}`;
        feedback.innerHTML = DOMPurify.sanitize( DOMPurify.sanitize(`<small>${message}</small>`));

        field.classList.add(isValid ? 'is-valid' : 'is-invalid');
        field.parentNode.appendChild(feedback);
    }

    /**
     * 📊 Generar reporte de integraciones
     */
    generateIntegrationReport() {
        const report = {
            version: this.version,
            timestamp: Date.now(),
            integrations: Object.fromEntries(
                Object.entries(this.apiStatus).map(([key, status]) => [
                    key,
                    {
                        connected: status.connected,
                        lastSync: status.lastSync,
                        hasError: !!status.error,
                        features: status.features || status.services || []
                    }
                ])
            ),
            offlineQueue: this.offlineQueue.length,
            configuration: {
                developmentMode: this.config.developmentMode,
                realTimeSync: this.config.enableRealTimeSync,
                offlineMode: this.config.enableOfflineMode
            }
        };

        this.log('📊 Reporte de integraciones:', report);
        this.framework.dispatchEvent('integrationReport', report);
        return report;
    }

    /**
     * 📋 Registrar resultados de inicialización
     */
    logInitializationResults(results) {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        this.log(`📋 Inicialización completada: ${successful} exitosas, ${failed} fallidas`);

        results.forEach((result, index) => {
            const integrationNames = ['googleClassroom', 'sepConnectivity', 'curpValidator', 'socialMedia'];
            const name = integrationNames[index] || `integration_${index}`;

            if (result.status === 'rejected') {
                this.log(`❌ ${name}:`, result.reason.message);
            } else {
                this.log(`✅ ${name}: inicializado`);
            }
        });
    }

    /**
     * 🔔 Mostrar notificación offline
     */
    showOfflineNotification() {
        // Solo mostrar si no existe ya
        if (document.getElementById('bge-offline-notification')) return;

        const notification = document.createElement('div');
        notification.id = 'bge-offline-notification';
        notification.className = 'alert alert-warning position-fixed';
        notification.style.cssText = `
            top: 20px; right: 20px; z-index: 1060;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.innerHTML = DOMPurify.sanitize(`
            <div class="d-flex align-items-center">
                <span class="me-2">📴</span>
                <div>
                    <strong>Sin conexión</strong><br>
                    <small>Los datos se sincronizarán cuando se restaure la conexión</small>
                </div>
            </div>
        `);

        document.body.appendChild(notification);
    }

    /**
     * 🔔 Ocultar notificación offline
     */
    hideOfflineNotification() {
        const notification = document.getElementById('bge-offline-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * 📊 API pública del módulo
     */
    getAPIStatus() {
        return {
            status: this.apiStatus,
            dependencies: this.dependencies,
            offlineQueue: this.offlineQueue.length,
            syncInProgress: this.syncInProgress
        };
    }

    getIntegration(name) {
        return this.integrations.get(name);
    }

    async testConnection(integrationName) {
        const integration = this.integrations.get(integrationName);
        if (!integration) return false;

        try {
            if (integration.test) {
                return await integration.test();
            }
            return integration.connected || false;
        } catch {
            return false;
        }
    }

    clearOfflineQueue() {
        this.offlineQueue = [];
        this.log('📄 Cola offline limpiada');
    }

    shareContent(platform, url, title) {
        const event = {
            target: {
                closest: () => ({
                    dataset: { platform, url, title }
                })
            }
        };
        this.handleSocialShare(event);
    }
}

// Registro global para compatibilidad
window.BGEAPIsModule = BGEAPIsModule;

// Auto-instanciación si no hay framework
if (typeof window !== 'undefined' && !window.BGE) {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.bgeAPIsModule) {
            window.bgeAPIsModule = new BGEAPIsModule({
                config: { debug: true },
                dispatchEvent: (event, data) => void 0,
                modules: new Map()
            });
        }
    });
}