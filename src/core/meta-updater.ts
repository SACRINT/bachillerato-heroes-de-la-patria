/**
 * META UPDATER - Actualizador de metadatos dinámicos
 * Actualiza title, description y meta tags basado en configuración del tenant
 * Migrado a TypeScript: 13 Diciembre 2025
 */

export interface TenantConfig {
    school_name?: string;
    school_short_form?: string;
    school_description?: string;
    school_logo?: string;
    school_email?: string;
    school_phone?: string;
    school_address?: string;
    primary_color?: string;
    secondary_color?: string;
    [key: string]: any;
}

export class MetaUpdater {
    private static instance: MetaUpdater;
    private currentConfig: TenantConfig | null = null;

    private constructor() {
        this.setupEventListeners();

        // Fallback por si el script carga después del evento
        if ((window as any).TENANT_CONFIG) {
            this.updateMetadata((window as any).TENANT_CONFIG);
        }
    }

    /**
     * Singleton pattern
     */
    static getInstance(): MetaUpdater {
        if (!MetaUpdater.instance) {
            MetaUpdater.instance = new MetaUpdater();
        }
        return MetaUpdater.instance;
    }

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        document.addEventListener('tenantConfigLoaded', ((e: CustomEvent<TenantConfig>) => {
            this.updateMetadata(e.detail);
        }) as EventListener);
    }

    /**
     * Update all metadata based on tenant config
     */
    updateMetadata(tenantConfig: TenantConfig): void {
        if (!tenantConfig) return;

        this.currentConfig = tenantConfig;

        // Actualizar título de la página
        this.updateTitle(tenantConfig);

        // Actualizar descripción
        this.updateDescription(tenantConfig);

        // Actualizar meta tags sociales
        this.updateSocialMetaTags(tenantConfig);

        console.log('📄 [META] Metadatos actualizados para:', tenantConfig.school_name);
    }

    /**
     * Update page title
     */
    private updateTitle(config: TenantConfig): void {
        const titleElement = document.getElementById('page-title') as HTMLTitleElement | null;

        if (titleElement && config.school_name) {
            const baseTitle = titleElement.dataset.baseTitle || '';
            titleElement.textContent = baseTitle
                ? `${baseTitle} | ${config.school_name}`
                : config.school_name;
        }

        // También actualizar document.title directamente
        if (config.school_name) {
            const currentTitle = document.title;
            if (currentTitle.includes('Héroes de la Patria')) {
                document.title = currentTitle.replace(/Héroes de la Patria/g, config.school_name);
            } else if (currentTitle.includes('{school_name}')) {
                document.title = currentTitle.replace(/{school_name}/g, config.school_name);
            }
        }
    }

    /**
     * Update meta description
     */
    private updateDescription(config: TenantConfig): void {
        const descriptionElement = document.getElementById('page-description') as HTMLMetaElement | null;

        if (descriptionElement && config.school_description) {
            const currentContent = descriptionElement.getAttribute('content') || '';

            if (currentContent.includes('{school_name}') && config.school_name) {
                descriptionElement.setAttribute('content',
                    currentContent.replace(/{school_name}/g, config.school_name));
            } else if (currentContent.includes('Héroes de la Patria') && config.school_name) {
                descriptionElement.setAttribute('content',
                    currentContent.replace(/Héroes de la Patria/g, config.school_name));
            } else {
                descriptionElement.setAttribute('content', config.school_description);
            }
        }
    }

    /**
     * Update social meta tags (Open Graph, Twitter)
     */
    private updateSocialMetaTags(config: TenantConfig): void {
        if (config.school_name) {
            this.updateMetaTag('meta[property="og:title"]', config.school_name);
            this.updateMetaTag('meta[name="twitter:title"]', config.school_name);
            this.updateMetaTag('meta[name="author"]', config.school_name);
            this.updateMetaTag('meta[property="og:site_name"]', config.school_name);
        }

        if (config.school_description) {
            this.updateMetaTag('meta[property="og:description"]', config.school_description);
            this.updateMetaTag('meta[name="twitter:description"]', config.school_description);
            this.updateMetaTag('meta[name="description"]', config.school_description);
        }

        if (config.school_logo) {
            this.updateMetaTag('meta[property="og:image"]', config.school_logo);
            this.updateMetaTag('meta[name="twitter:image"]', config.school_logo);
        }
    }

    /**
     * Helper to update a meta tag by selector
     */
    private updateMetaTag(selector: string, value: string): void {
        const element = document.querySelector<HTMLMetaElement>(selector);
        if (element && value) {
            const currentContent = element.getAttribute('content') || '';

            if (currentContent.includes('{school_name}')) {
                element.setAttribute('content', currentContent.replace(/{school_name}/g, value));
            } else if (currentContent.includes('Héroes de la Patria')) {
                element.setAttribute('content', currentContent.replace(/Héroes de la Patria/g, value));
            } else {
                element.setAttribute('content', value);
            }
        }
    }

    /**
     * Get current tenant config
     */
    getConfig(): TenantConfig | null {
        return this.currentConfig;
    }

    /**
     * Set a specific meta tag value
     */
    setMeta(name: string, content: string): void {
        let element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

        if (!element) {
            element = document.createElement('meta');
            element.name = name;
            document.head.appendChild(element);
        }

        element.setAttribute('content', content);
    }

    /**
     * Set Open Graph meta tag
     */
    setOGMeta(property: string, content: string): void {
        let element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);

        if (!element) {
            element = document.createElement('meta');
            element.setAttribute('property', property);
            document.head.appendChild(element);
        }

        element.setAttribute('content', content);
    }
}

// Singleton instance
export const metaUpdater = MetaUpdater.getInstance();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).metaUpdater = metaUpdater;
    (window as any).MetaUpdater = MetaUpdater;
}

export default metaUpdater;
