/**
 * 🏢 Tenant Auto-Updater
 * 
 * Actualiza automáticamente elementos HTML con la configuración del tenant.
 * Escucha el evento 'tenantConfigLoaded' y actualiza elementos con atributos data-tenant-*.
 * 
 * @requires tenant-config-loader.js (debe cargarse primero)
 * @author Claude Code
 * @date 2025-12-05
 * @version 1.0.0
 */

(function () {
    'use strict';

    // ========================================
    // CONFIGURACIÓN
    // ========================================

    const SELECTORS = {
        // Elementos con atributo data-tenant-field="xxx" (nuevo formato)
        FIELD: '[data-tenant-field]',
        // Elementos con atributo data-tenant="xxx" (formato legacy en header/footer)
        TENANT: '[data-tenant]',
        // Elementos específicos por tipo
        TITLE: 'title[data-tenant-field], #page-title',
        META_DESCRIPTION: 'meta[name="description"]',
        SCHEMA_ORG: 'script[type="application/ld+json"]'
    };

    // Mapeo de campos de configuración a sus valores
    // Soporta ambos formatos: data-tenant-field="school_name" y data-tenant="school-name"
    const FIELD_MAPPING = {
        // Formato nuevo (data-tenant-field)
        'school_name': 'school_name',
        'school_short_name': 'school_short_name',
        'school_address': 'address',
        'school_phone': 'phone',
        'school_website': 'website',
        'school_logo': 'logo_url',
        'primary_color': 'primary_color',
        'secondary_color': 'secondary_color',
        // Formato legacy (data-tenant) - usado en header/footer
        'school-name': 'school_short_name', // Fix: Usar short_name (ahora configurado como "Héroes de la Patria")
        'school-name-copyright': 'school_name',
        'school-logo': 'logo_url',
        'school-address': 'address',
        'school-phone': 'phone',
        'school-email': 'email',
        'school-hours': 'hours'
    };

    // ========================================
    // FUNCIONES DE ACTUALIZACIÓN
    // ========================================

    /**
     * Obtiene un valor de la configuración del tenant
     * @param {string} field - Nombre del campo
     * @returns {string|null} Valor del campo o null
     */
    function getConfigValue(field) {
        if (!window.TENANT_CONFIG) return null;

        const mappedField = FIELD_MAPPING[field] || field;
        return window.TENANT_CONFIG[mappedField] || null;
    }

    /**
     * Actualiza elementos con data-tenant-field
     */
    function updateTenantFields() {
        const elements = document.querySelectorAll(SELECTORS.FIELD);

        elements.forEach(el => {
            const field = el.getAttribute('data-tenant-field');
            const value = getConfigValue(field);

            if (value) {
                // Si es un input, actualizar value
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = value;
                }
                // Si es una imagen, actualizar src
                else if (el.tagName === 'IMG') {
                    el.src = value;
                    el.alt = el.alt || `Logo ${window.TENANT_CONFIG.school_short_name}`;
                }
                // Para otros elementos, actualizar textContent
                else {
                    el.textContent = value;
                }
            }
        });

        console.log(`[TENANT-UPDATER] Actualizados ${elements.length} elementos data-tenant-field`);
    }

    /**
     * Actualiza elementos con data-tenant (formato legacy en header/footer)
     */
    function updateLegacyTenantElements() {
        const elements = document.querySelectorAll(SELECTORS.TENANT);

        elements.forEach(el => {
            const field = el.getAttribute('data-tenant');
            const value = getConfigValue(field);

            if (value) {
                // Si es una imagen, actualizar src
                if (el.tagName === 'IMG') {
                    el.src = value;
                    el.alt = el.alt || `Logo ${window.TENANT_CONFIG.school_short_name || 'BGE'}`;
                }
                // Si es un enlace, actualizar href también
                else if (el.tagName === 'A' && field.includes('phone')) {
                    el.href = `tel:${value}`;
                    el.textContent = value;
                }
                else if (el.tagName === 'A' && field.includes('email')) {
                    el.href = `mailto:${value}`;
                    el.textContent = value;
                }
                // Para otros elementos, actualizar textContent
                else {
                    el.textContent = value;
                }
            }
        });

        console.log(`[TENANT-UPDATER] Actualizados ${elements.length} elementos data-tenant (legacy)`);
    }

    /**
     * Actualiza el título de la página
     */
    function updatePageTitle() {
        const titleEl = document.querySelector('title');
        if (!titleEl || !window.TENANT_CONFIG) return;

        const baseTitle = titleEl.getAttribute('data-base-title');
        if (baseTitle) {
            // Si hay un título base, concatenar con nombre de escuela
            titleEl.textContent = `${baseTitle} | ${window.TENANT_CONFIG.school_short_name}`;
        } else if (titleEl.textContent.includes('Héroes de la Patria')) {
            // Reemplazar referencias hardcodeadas
            titleEl.textContent = titleEl.textContent
                .replace(/Bachillerato General Estatal\s*"?Héroes de la Patria"?/gi, window.TENANT_CONFIG.school_name)
                .replace(/BGE\s*Héroes de la Patria/gi, window.TENANT_CONFIG.school_short_name);
        }
    }

    /**
     * Actualiza meta description
     */
    function updateMetaDescription() {
        const metaEl = document.querySelector(SELECTORS.META_DESCRIPTION);
        if (!metaEl || !window.TENANT_CONFIG) return;

        const content = metaEl.getAttribute('content');
        if (content && content.includes('Héroes de la Patria')) {
            metaEl.setAttribute('content',
                content
                    .replace(/Bachillerato General Estatal\s*"?Héroes de la Patria"?/gi, window.TENANT_CONFIG.school_name)
                    .replace(/BGE\s*Héroes de la Patria/gi, window.TENANT_CONFIG.school_short_name)
            );
        }
    }

    /**
     * Actualiza Schema.org JSON-LD
     */
    function updateSchemaOrg() {
        const scripts = document.querySelectorAll(SELECTORS.SCHEMA_ORG);

        scripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);

                // Actualizar campos de Schema.org
                if (data['@type'] === 'EducationalOrganization') {
                    data.name = window.TENANT_CONFIG.school_name;
                    data.alternateName = window.TENANT_CONFIG.school_short_name;
                    data.logo = window.TENANT_CONFIG.logo_url;

                    if (data.address) {
                        data.address.streetAddress = window.TENANT_CONFIG.address;
                    }

                    script.textContent = JSON.stringify(data, null, 2);
                }
            } catch (e) {
                // Ignorar errores de parsing
            }
        });
    }

    /**
     * Actualiza variables CSS con colores del tenant
     */
    function updateCSSVariables() {
        if (!window.TENANT_CONFIG) return;

        const root = document.documentElement;

        if (window.TENANT_CONFIG.primary_color) {
            root.style.setProperty('--tenant-primary-color', window.TENANT_CONFIG.primary_color);
            root.style.setProperty('--primary-color', window.TENANT_CONFIG.primary_color);
        }

        if (window.TENANT_CONFIG.secondary_color) {
            root.style.setProperty('--tenant-secondary-color', window.TENANT_CONFIG.secondary_color);
            root.style.setProperty('--secondary-color', window.TENANT_CONFIG.secondary_color);
        }

        if (window.TENANT_CONFIG.accent_color) {
            root.style.setProperty('--tenant-accent-color', window.TENANT_CONFIG.accent_color);
        }
    }

    /**
     * Ejecuta todas las actualizaciones
     */
    function runAllUpdates() {
        console.log('[TENANT-UPDATER] Ejecutando actualizaciones...');

        updateTenantFields();
        updateLegacyTenantElements();
        updatePageTitle();
        updateMetaDescription();
        updateSchemaOrg();
        updateCSSVariables();

        console.log('[TENANT-UPDATER] ✅ Todas las actualizaciones completadas');
    }

    // ========================================
    // INICIALIZACIÓN
    // ========================================

    // Si TENANT_CONFIG ya está disponible, ejecutar inmediatamente
    if (window.TENANT_CONFIG) {
        // Esperar a que DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runAllUpdates);
        } else {
            runAllUpdates();
        }
    }

    // También escuchar el evento por si config se carga después
    document.addEventListener('tenantConfigLoaded', function (event) {
        console.log('[TENANT-UPDATER] Evento tenantConfigLoaded recibido');
        runAllUpdates();
    });

    // Exponer función de actualización para uso manual
    window.updateTenantUI = runAllUpdates;

})();
