/**
 * 🌐 BGE MULTI-TENANT SYSTEM
 * Sistema revolucionario para configuración dinámica multi-escuela
 * Permite transformar completamente el sitio con solo cambiar archivos JSON
 *
 * Características:
 * - Configuración 100% dinámica mediante JSON
 * - Cambio instantáneo de identidad institucional
 * - Sistema de plantillas inteligente
 * - Cache optimizado para rendimiento
 * - Validación automática de configuraciones
 *
 * @version 1.0.0
 * @author Claude Code - BGE Development Team
 * @date 2025-09-25
 */

class BGEMultiTenantSystem {
    constructor() {
        this.version = '1.0.0';
        this.currentConfig = null;
        this.defaultTenant = 'bge-heroes-patria-001';
        this.configCache = new Map();
        this.templateCache = new Map();

        // Configuración del sistema
        this.config = {
            apiEndpoint: '/api/multi-tenant',
            configPath: '/config',
            cacheTTL: 300000, // 5 minutos
            retryAttempts: 3,
            retryDelay: 1000
        };

        // Templates dinámicos
        this.templates = {
            institutionName: '{{INSTITUTION_NAME}}',
            shortName: '{{INSTITUTION_SHORT_NAME}}',
            address: '{{FULL_ADDRESS}}',
            phone: '{{MAIN_PHONE}}',
            email: '{{MAIN_EMAIL}}',
            missionStatement: '{{MISSION_STATEMENT}}',
            visionStatement: '{{VISION_STATEMENT}}',
            welcomeMessage: '{{WELCOME_MESSAGE}}',
            heroSlogan: '{{HERO_SLOGAN}}'
        };

        // Eventos del sistema
        this.events = {
            configLoaded: 'multiTenant:configLoaded',
            configChanged: 'multiTenant:configChanged',
            templateApplied: 'multiTenant:templateApplied',
            error: 'multiTenant:error'
        };

        this.init();
    }

    /**
     * Inicialización del sistema multi-tenant
     */
    async init() {
        try {
            console.log(`🌐 Iniciando BGE Multi-Tenant System v${this.version}`);

            // Cargar configuración por defecto
            await this.loadConfiguration();

            // Aplicar configuración inicial
            await this.applyConfiguration();

            // Configurar eventos
            this.setupEventListeners();

            console.log('✅ Sistema Multi-Tenant inicializado correctamente');

            this.dispatchEvent(this.events.configLoaded, {
                tenant: this.currentConfig?.tenantId,
                config: this.currentConfig
            });

        } catch (error) {
            console.error('❌ Error inicializando Multi-Tenant System:', error);
            this.handleError(error);
        }
    }

    /**
     * Cargar configuración de tenant
     * @param {string} tenantId - ID del tenant a cargar
     */
    async loadConfiguration(tenantId = null) {
        try {
            const targetTenant = tenantId || this.detectTenant() || this.defaultTenant;

            // Verificar cache
            if (this.configCache.has(targetTenant)) {
                const cached = this.configCache.get(targetTenant);
                if (Date.now() - cached.timestamp < this.config.cacheTTL) {
                    this.currentConfig = cached.data;
                    return this.currentConfig;
                }
            }

            // Cargar desde servidor
            const configUrl = `${this.config.configPath}/${this.getConfigFileName(targetTenant)}`;
            const response = await this.fetchWithRetry(configUrl);

            if (!response.ok) {
                throw new Error(`Error cargando configuración: ${response.status} - ${response.statusText}`);
            }

            const config = await response.json();

            // Validar configuración
            this.validateConfiguration(config);

            // Actualizar cache
            this.configCache.set(targetTenant, {
                data: config,
                timestamp: Date.now()
            });

            this.currentConfig = config;

            console.log(`✅ Configuración cargada para tenant: ${targetTenant}`);
            return this.currentConfig;

        } catch (error) {
            console.error('❌ Error cargando configuración:', error);

            // Cargar configuración por defecto en caso de error
            if (tenantId !== this.defaultTenant) {
                console.log('🔄 Intentando cargar configuración por defecto...');
                return await this.loadConfiguration(this.defaultTenant);
            }

            throw error;
        }
    }

    /**
     * Aplicar configuración al sitio web
     */
    async applyConfiguration() {
        if (!this.currentConfig) {
            throw new Error('No hay configuración cargada');
        }

        try {
            console.log(`🎨 Aplicando configuración para: ${this.currentConfig.institution.name}`);

            // Aplicar cambios en paralelo
            await Promise.all([
                this.applyBrandingChanges(),
                this.applyContentChanges(),
                this.applyMetadataChanges(),
                this.applyFeatureFlags(),
                this.applyLocalizationSettings()
            ]);

            console.log('✅ Configuración aplicada exitosamente');

            this.dispatchEvent(this.events.configChanged, {
                tenant: this.currentConfig.tenantId,
                institution: this.currentConfig.institution.name
            });

        } catch (error) {
            console.error('❌ Error aplicando configuración:', error);
            this.handleError(error);
        }
    }

    /**
     * Aplicar cambios de branding (colores, logos, fuentes)
     */
    async applyBrandingChanges() {
        const branding = this.currentConfig.branding;

        // Actualizar CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--primary-color', branding.primaryColor);
        root.style.setProperty('--secondary-color', branding.secondaryColor);
        root.style.setProperty('--accent-color', branding.accentColor);
        root.style.setProperty('--font-family', branding.fontFamily);

        // Actualizar logos
        this.updateLogos(branding);

        // Actualizar favicon
        this.updateFavicon(branding.faviconUrl);

        // Actualizar imagen hero
        this.updateHeroImage(branding.heroImageUrl);

        console.log('🎨 Branding actualizado');
    }

    /**
     * Aplicar cambios de contenido dinámico
     */
    async applyContentChanges() {
        const config = this.currentConfig;

        // Mapeo de contenido dinámico
        const contentMap = {
            '{{INSTITUTION_NAME}}': config.institution.name,
            '{{INSTITUTION_SHORT_NAME}}': config.institution.shortName,
            '{{FULL_ADDRESS}}': this.formatAddress(config.institution.address),
            '{{MAIN_PHONE}}': config.institution.contact.phone,
            '{{MAIN_EMAIL}}': config.institution.contact.email,
            '{{MISSION_STATEMENT}}': config.academicInfo.missionStatement,
            '{{VISION_STATEMENT}}': config.academicInfo.visionStatement,
            '{{WELCOME_MESSAGE}}': config.customContent?.welcomeMessage || 'Bienvenidos',
            '{{HERO_SLOGAN}}': config.customContent?.heroSlogan || 'Educación de Excelencia'
        };

        // Aplicar plantillas a todo el documento
        this.applyTemplatesToDocument(contentMap);

        // Actualizar contenido específico
        this.updateSpecificContent(config);

        console.log('📝 Contenido actualizado');
    }

    /**
     * Aplicar cambios en metadata (SEO)
     */
    async applyMetadataChanges() {
        const metadata = this.currentConfig.metadata;

        // Título de la página
        document.title = metadata.ogTitle || this.currentConfig.institution.name;

        // Meta description
        this.updateMetaTag('description', metadata.description);

        // Meta keywords
        this.updateMetaTag('keywords', metadata.keywords?.join(', '));

        // Open Graph tags
        this.updateMetaTag('og:title', metadata.ogTitle);
        this.updateMetaTag('og:description', metadata.ogDescription);
        this.updateMetaTag('og:url', window.location.href);

        console.log('🔍 Metadata actualizada');
    }

    /**
     * Aplicar flags de características
     */
    async applyFeatureFlags() {
        const features = this.currentConfig.features;

        // Ocultar/mostrar características según configuración
        Object.keys(features).forEach(feature => {
            const enabled = features[feature];
            const elements = document.querySelectorAll(`[data-feature="${feature}"]`);

            elements.forEach(element => {
                if (enabled) {
                    element.style.display = '';
                    element.classList.remove('feature-disabled');
                } else {
                    element.style.display = 'none';
                    element.classList.add('feature-disabled');
                }
            });
        });

        console.log('⚡ Feature flags aplicados');
    }

    /**
     * Aplicar configuración de localización
     */
    async applyLocalizationSettings() {
        const localization = this.currentConfig.localization;

        // Establecer idioma del documento
        document.documentElement.lang = localization.language;

        // Configurar zona horaria global si existe una función
        if (window.BGEConfig) {
            window.BGEConfig.timezone = localization.timezone;
            window.BGEConfig.currency = localization.currency;
            window.BGEConfig.dateFormat = localization.dateFormat;
        }

        console.log('🌍 Configuración de localización aplicada');
    }

    /**
     * Cambiar tenant dinámicamente
     * @param {string} newTenantId - ID del nuevo tenant
     */
    async switchTenant(newTenantId) {
        try {
            console.log(`🔄 Cambiando a tenant: ${newTenantId}`);

            // Mostrar indicador de carga
            this.showLoadingIndicator();

            // Cargar nueva configuración
            await this.loadConfiguration(newTenantId);

            // Aplicar nueva configuración
            await this.applyConfiguration();

            // Ocultar indicador de carga
            this.hideLoadingIndicator();

            console.log(`✅ Cambio a tenant ${newTenantId} completado`);

        } catch (error) {
            console.error(`❌ Error cambiando tenant:`, error);
            this.hideLoadingIndicator();
            this.handleError(error);
        }
    }

    /**
     * Detectar tenant actual (por URL, localStorage, etc.)
     */
    detectTenant() {
        // Detectar por parámetro URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('tenant')) {
            return urlParams.get('tenant');
        }

        // Detectar por localStorage
        if (localStorage.getItem('currentTenant')) {
            return localStorage.getItem('currentTenant');
        }

        // Detectar por subdominio
        const subdomain = window.location.hostname.split('.')[0];
        if (subdomain && subdomain !== 'www') {
            return `${subdomain}-001`;
        }

        return null;
    }

    /**
     * Obtener nombre del archivo de configuración
     */
    getConfigFileName(tenantId) {
        return `${tenantId.replace('-001', '-config')}.json`;
    }

    /**
     * Validar configuración cargada
     */
    validateConfiguration(config) {
        const requiredFields = [
            'tenantId',
            'institution.name',
            'branding.primaryColor',
            'localization.language'
        ];

        requiredFields.forEach(field => {
            if (!this.getNestedProperty(config, field)) {
                throw new Error(`Campo requerido faltante: ${field}`);
            }
        });

        console.log('✅ Configuración validada correctamente');
    }

    /**
     * Aplicar plantillas al documento
     */
    applyTemplatesToDocument(contentMap) {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            let content = textNode.textContent;
            let hasReplacements = false;

            Object.keys(contentMap).forEach(placeholder => {
                if (content.includes(placeholder)) {
                    content = content.replace(new RegExp(placeholder, 'g'), contentMap[placeholder]);
                    hasReplacements = true;
                }
            });

            if (hasReplacements) {
                textNode.textContent = content;
            }
        });
    }

    /**
     * Actualizar contenido específico por selectores
     */
    updateSpecificContent(config) {
        // Actualizar elementos específicos
        const updates = [
            { selector: '.institution-name', content: config.institution.name },
            { selector: '.institution-address', content: this.formatAddress(config.institution.address) },
            { selector: '.contact-phone', content: config.institution.contact.phone },
            { selector: '.contact-email', content: config.institution.contact.email },
            { selector: '.mission-statement', content: config.academicInfo.missionStatement },
            { selector: '.vision-statement', content: config.academicInfo.visionStatement }
        ];

        updates.forEach(update => {
            const elements = document.querySelectorAll(update.selector);
            elements.forEach(element => {
                element.textContent = update.content;
            });
        });
    }

    /**
     * Actualizar logos en el sitio
     */
    updateLogos(branding) {
        const logoSelectors = [
            'img[alt*="logo"]',
            '.logo img',
            '.navbar-brand img',
            '.header-logo'
        ];

        logoSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.src = branding.logoUrl;
                element.alt = `Logo ${this.currentConfig.institution.shortName}`;
            });
        });
    }

    /**
     * Actualizar favicon
     */
    updateFavicon(faviconUrl) {
        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            document.head.appendChild(favicon);
        }
        favicon.href = faviconUrl;
    }

    /**
     * Actualizar imagen hero
     */
    updateHeroImage(heroImageUrl) {
        const heroElements = document.querySelectorAll('.hero-image, .hero-bg, [data-hero]');
        heroElements.forEach(element => {
            if (element.tagName === 'IMG') {
                element.src = heroImageUrl;
            } else {
                element.style.backgroundImage = `url(${heroImageUrl})`;
            }
        });
    }

    /**
     * Actualizar meta tags
     */
    updateMetaTag(name, content) {
        if (!content) return;

        let meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    /**
     * Formatear dirección completa
     */
    formatAddress(address) {
        return `${address.street}, ${address.city}, ${address.state}, ${address.country} ${address.postalCode}`;
    }

    /**
     * Obtener propiedad anidada de objeto
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Fetch con reintentos
     */
    async fetchWithRetry(url, options = {}) {
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const response = await fetch(url, options);
                return response;
            } catch (error) {
                if (attempt === this.config.retryAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
            }
        }
    }

    /**
     * Mostrar indicador de carga
     */
    showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'tenant-loading';
        loader.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>Configurando institución...</p>
            </div>
        `;
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        document.body.appendChild(loader);
    }

    /**
     * Ocultar indicador de carga
     */
    hideLoadingIndicator() {
        const loader = document.getElementById('tenant-loading');
        if (loader) loader.remove();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Listener para cambios de tenant vía URL
        window.addEventListener('popstate', () => {
            const newTenant = this.detectTenant();
            if (newTenant && newTenant !== this.currentConfig?.tenantId) {
                this.switchTenant(newTenant);
            }
        });

        // Listener para mensajes entre ventanas
        window.addEventListener('message', (event) => {
            if (event.data.type === 'SWITCH_TENANT') {
                this.switchTenant(event.data.tenantId);
            }
        });
    }

    /**
     * Dispatcher de eventos personalizados
     */
    dispatchEvent(eventName, detail) {
        const event = new CustomEvent(eventName, { detail });
        window.dispatchEvent(event);
    }

    /**
     * Manejo de errores
     */
    handleError(error) {
        this.dispatchEvent(this.events.error, { error: error.message, stack: error.stack });

        // Mostrar notificación de error al usuario
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error en configuración multi-tenant', 'error');
        }
    }

    /**
     * API pública para integración
     */
    getPublicAPI() {
        return {
            switchTenant: (tenantId) => this.switchTenant(tenantId),
            getCurrentConfig: () => this.currentConfig,
            reloadConfiguration: () => this.loadConfiguration(this.currentConfig?.tenantId),
            getAvailableTenants: () => this.getAvailableTenants(),
            version: this.version
        };
    }

    /**
     * Obtener lista de tenants disponibles
     */
    async getAvailableTenants() {
        try {
            const response = await fetch(`${this.config.apiEndpoint}/tenants`);
            return await response.json();
        } catch (error) {
            console.warn('No se pudieron cargar los tenants disponibles:', error);
            return [];
        }
    }
}

// Inicialización automática cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultiTenant);
} else {
    initializeMultiTenant();
}

function initializeMultiTenant() {
    // Crear instancia global del sistema
    window.BGEMultiTenant = new BGEMultiTenantSystem();

    // Exponer API pública
    window.MultiTenantAPI = window.BGEMultiTenant.getPublicAPI();

    console.log('🌐 BGE Multi-Tenant System activado globalmente');
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEMultiTenantSystem;
}