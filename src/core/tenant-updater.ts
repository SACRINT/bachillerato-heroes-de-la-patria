
/**
 * src/core/tenant-updater.ts
 * Actualiza automáticamente elementos HTML con la configuración del tenant.
 * Migrado desde public/js/tenant-auto-updater.js
 */

export class TenantUpdater {
    // Selectores
    private readonly SELECTORS = {
        FIELD: '[data-tenant-field]',
        TENANT: '[data-tenant]',
        TITLE: 'title[data-tenant-field], #page-title',
        META_DESCRIPTION: 'meta[name="description"]',
        SCHEMA_ORG: 'script[type="application/ld+json"]'
    };

    // Mapping
    private readonly FIELD_MAPPING: Record<string, string> = {
        'school_name': 'school_name',
        'school_short_name': 'school_short_name',
        'school_address': 'address',
        'school_phone': 'phone',
        'school_website': 'website',
        'school_logo': 'logo_url',
        'primary_color': 'primary_color',
        'secondary_color': 'secondary_color',
        'school-name': 'school_short_name',
        'school-name-copyright': 'school_name',
        'school-logo': 'logo_url',
        'school-address': 'address',
        'school-phone': 'phone',
        'school-email': 'email',
        'school-hours': 'hours'
    };

    constructor() {
        console.log('[TenantUpdater] Initialized');
        // Exponer globalmente para compatibilidad
        (window as any).updateTenantUI = () => this.runAllUpdates();
    }

    public init(): void {
        const tenantConfig = (window as any).TENANT_CONFIG;
        if (tenantConfig) {
            this.runAllUpdates();
        }

        // Escuchar evento
        document.addEventListener('tenantConfigLoaded', () => {
            console.log('[TenantUpdater] Event tenantConfigLoaded received');
            this.runAllUpdates();
        });
    }

    private getConfigValue(field: string): string | null {
        const config = (window as any).TENANT_CONFIG;
        if (!config) return null;
        const mappedField = this.FIELD_MAPPING[field] || field;
        return config[mappedField] || null;
    }

    private runAllUpdates(): void {
        console.log('[TenantUpdater] Running updates...');
        this.updateTenantFields();
        this.updateLegacyTenantElements();
        this.updatePageTitle();
        this.updateMetaDescription();
        this.updateSchemaOrg();
        this.updateCSSVariables();
        console.log('[TenantUpdater] ✅ Updates completed');
    }

    private updateTenantFields(): void {
        const elements = document.querySelectorAll(this.SELECTORS.FIELD);
        elements.forEach(el => {
            const field = el.getAttribute('data-tenant-field');
            if (field) {
                const value = this.getConfigValue(field);
                if (value) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        (el as HTMLInputElement).value = value;
                    } else if (el.tagName === 'IMG') {
                        (el as HTMLImageElement).src = value;
                        const config = (window as any).TENANT_CONFIG;
                        (el as HTMLImageElement).alt = (el as HTMLImageElement).alt || `Logo ${config?.school_short_name}`;
                    } else {
                        el.textContent = value;
                    }
                }
            }
        });
    }

    private updateLegacyTenantElements(): void {
        const elements = document.querySelectorAll(this.SELECTORS.TENANT);
        elements.forEach(el => {
            const field = el.getAttribute('data-tenant');
            if (field) {
                const value = this.getConfigValue(field);
                if (value) {
                    if (el.tagName === 'IMG') {
                        (el as HTMLImageElement).src = value;
                        const config = (window as any).TENANT_CONFIG;
                        (el as HTMLImageElement).alt = (el as HTMLImageElement).alt || `Logo ${config?.school_short_name || 'BGE'}`;
                    } else if (el.tagName === 'A' && field.includes('phone')) {
                        (el as HTMLAnchorElement).href = `tel:${value}`;
                        el.textContent = value;
                    } else if (el.tagName === 'A' && field.includes('email')) {
                        (el as HTMLAnchorElement).href = `mailto:${value}`;
                        el.textContent = value;
                    } else {
                        el.textContent = value;
                    }
                }
            }
        });
    }

    private updatePageTitle(): void {
        const config = (window as any).TENANT_CONFIG;
        if (!config) return;

        const titleEl = document.querySelector('title');
        if (!titleEl) return;

        const baseTitle = titleEl.getAttribute('data-base-title');
        if (baseTitle) {
            titleEl.textContent = `${baseTitle} | ${config.school_short_name}`;
        } else if (titleEl.textContent && titleEl.textContent.includes('Héroes de la Patria')) {
            titleEl.textContent = titleEl.textContent
                .replace(/Bachillerato General Estatal\s*"?Héroes de la Patria"?/gi, config.school_name)
                .replace(/BGE\s*Héroes de la Patria/gi, config.school_short_name);
        }
    }

    private updateMetaDescription(): void {
        const config = (window as any).TENANT_CONFIG;
        if (!config) return;

        const metaEl = document.querySelector(this.SELECTORS.META_DESCRIPTION);
        if (!metaEl) return;

        const content = metaEl.getAttribute('content');
        if (content && content.includes('Héroes de la Patria')) {
            metaEl.setAttribute('content',
                content
                    .replace(/Bachillerato General Estatal\s*"?Héroes de la Patria"?/gi, config.school_name)
                    .replace(/BGE\s*Héroes de la Patria/gi, config.school_short_name)
            );
        }
    }

    private updateSchemaOrg(): void {
        const config = (window as any).TENANT_CONFIG;
        if (!config) return;

        const scripts = document.querySelectorAll(this.SELECTORS.SCHEMA_ORG);
        scripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent || '{}');
                if (data['@type'] === 'EducationalOrganization') {
                    data.name = config.school_name;
                    data.alternateName = config.school_short_name;
                    data.logo = config.logo_url;
                    if (data.address) {
                        data.address.streetAddress = config.address;
                    }
                    script.textContent = JSON.stringify(data, null, 2);
                }
            } catch (e) {
                // Ignore
            }
        });
    }

    private updateCSSVariables(): void {
        const config = (window as any).TENANT_CONFIG;
        if (!config) return;

        const root = document.documentElement;
        if (config.primary_color) {
            root.style.setProperty('--tenant-primary-color', config.primary_color);
            root.style.setProperty('--primary-color', config.primary_color);
        }
        if (config.secondary_color) {
            root.style.setProperty('--tenant-secondary-color', config.secondary_color);
            root.style.setProperty('--secondary-color', config.secondary_color);
        }
        if (config.accent_color) {
            root.style.setProperty('--tenant-accent-color', config.accent_color);
        }
    }
}
