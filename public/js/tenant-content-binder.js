/**
 * 🏢 TENANT CONTENT BINDER - Motor de Bindeo Universal Multi-Tenant
 *
 * Reemplaza contenido hardcodeado con datos dinámicos del tenant actual.
 * Soporta 4 tipos de atributos data-tenant:
 *   - data-tenant-field="campo"  → Texto
 *   - data-tenant-src="campo"    → Imágenes (src)
 *   - data-tenant-href="campo"   → Enlaces (href)
 *   - data-tenant-style="campo:propiedadCSS" → Estilos dinámicos
 *
 * Además:
 *   - Inyecta variables CSS en :root (--color-primary, etc.)
 *   - Actualiza meta tags SEO (title, og:*, favicon)
 *   - Velo anti-FOUC con transición suave
 *   - Caché en sessionStorage con TTL 1 hora
 *
 * @version 1.0.0
 * @license MIT
 */

(function () {
    'use strict';

    // ========================================
    // 1. CONFIGURACIÓN
    // ========================================

    const CACHE_KEY = 'tenant_content_cache';
    const CACHE_TTL = 3600000; // 1 hora
    const FOUC_DELAY = 100; // ms antes de aplicar estilos
    const LOG_PREFIX = '[TENANT-BINDER]';

    // ========================================
    // 2. OBTENER CONFIGURACIÓN DEL TENANT
    // ========================================

    function getTenantConfig() {
        // Prioridad: window.TENANT_CONFIG > caché > default
        if (window.TENANT_CONFIG && window.TENANT_CONFIG.school_name) {
            return window.TENANT_CONFIG;
        }

        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data && (Date.now() - data._timestamp) < CACHE_TTL) {
                    return data;
                }
            } catch (e) { /* caché corrupto, ignorar */ }
        }

        return getDefaultConfig();
    }

    function getDefaultConfig() {
        return {
            school_name: 'Bachillerato General',
            school_official_name: 'Bachillerato General',
            school_short_name: 'BGE',
            school_type: 'Bachillerato General Estatal',
            cct: '21EBHXXXXX',
            zona_escolar: '0XX',
            turno: 'Matutino',
            logo_url: '/images/logo/logo-general-bge.webp',
            escudo_url: '/images/logo/logo-general-bge.webp',
            favicon_url: '/images/logo/logo-general-bge.webp',
            colors: {
                primary: '#1e40af',
                secondary: '#dc2626',
                accent: '#059669'
            },
            font_family: 'Inter',
            direccion: 'Dirección del plantel',
            codigo_postal: 'XXXXX',
            municipio: 'Municipio',
            estado: 'Puebla',
            telefono: '(XXX) XXX-XXXX',
            email_institucional: 'contacto@ejemplo.edu.mx',
            website_url: '',
            horario_clases: '8:00 AM - 1:30 PM',
            horario_atencion: '8:00 AM - 2:00 PM',
            latitud: null,
            longitud: null,
            google_maps_embed_url: '',
            facebook_url: '',
            twitter_url: '',
            instagram_url: '',
            youtube_url: '',
            tiktok_url: '',
            whatsapp_number: '',
            director_name: 'Nombre del Director',
            director_email: 'director@ejemplo.edu.mx',
            director_phone: '(XXX) XXX-XXXX',
            director_photo_url: '',
            director_message: 'Bienvenidos a nuestra institución educativa.',
            mision: 'Misión institucional',
            vision: 'Visión institucional',
            valores: 'Valores institucionales',
            historia: 'Historia del plantel',
            sicep_url: 'https://www.siged.sep.gob.mx/SIGED/alumnos.html',
            eslogan: 'Tu futuro comienza aquí',
            config_json: {}
        };
    }

    // ========================================
    // 3. BINDING DE TEXTO (data-tenant-field)
    // ========================================

    function bindTextFields(config) {
        const elements = document.querySelectorAll('[data-tenant-field]');
        let count = 0;

        elements.forEach(el => {
            const field = el.getAttribute('data-tenant-field');
            const value = resolveField(config, field);

            if (value !== null && value !== undefined && String(value).trim() !== '') {
                // Si el elemento tiene un data-default-text, usarlo como fallback
                const defaultText = el.getAttribute('data-default-text');
                const finalValue = String(value).trim() || defaultText || '';

                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.value = finalValue;
                } else {
                    el.textContent = finalValue;
                }
                count++;
            }
        });

        return count;
    }

    // ========================================
    // 4. BINDING DE IMÁGENES (data-tenant-src)
    // ========================================

    function bindImageSources(config) {
        const elements = document.querySelectorAll('[data-tenant-src]');
        let count = 0;

        elements.forEach(el => {
            const field = el.getAttribute('data-tenant-src');
            const value = resolveField(config, field);

            if (value && String(value).trim() !== '') {
                el.src = value;
                el.removeAttribute('data-default-src');
                count++;
            }
        });

        return count;
    }

    // ========================================
    // 5. BINDING DE ENLACES (data-tenant-href)
    // ========================================

    function bindLinks(config) {
        const elements = document.querySelectorAll('[data-tenant-href]');
        let count = 0;

        elements.forEach(el => {
            const field = el.getAttribute('data-tenant-href');
            const value = resolveField(config, field);

            if (value && String(value).trim() !== '') {
                // Caso especial: whatsapp_number → enlace wa.me
                if (field === 'whatsapp_number') {
                    const cleaned = String(value).replace(/[^0-9+]/g, '');
                    el.href = `https://wa.me/${cleaned}`;
                } else {
                    el.href = value;
                }
                count++;
            }
        });

        return count;
    }

    // ========================================
    // 6. BINDING DE ESTILOS (data-tenant-style)
    // ========================================

    function bindStyles(config) {
        const elements = document.querySelectorAll('[data-tenant-style]');
        let count = 0;

        elements.forEach(el => {
            const styleDef = el.getAttribute('data-tenant-style');
            // Formato: "campo:propiedadCSS" ej: "colors.primary:background-color"
            const [field, cssProp] = styleDef.split(':');

            if (field && cssProp) {
                const value = resolveField(config, field);
                if (value) {
                    el.style.setProperty(cssProp, value);
                    count++;
                }
            }
        });

        return count;
    }

    // ========================================
    // 7. INYECCIÓN DE VARIABLES CSS (:root)
    // ========================================

    function injectCSSVariables(config) {
        const root = document.documentElement;
        let count = 0;

        // Colores
        const colors = config.colors || {};
        if (colors.primary) {
            root.style.setProperty('--color-primary', colors.primary);
            root.style.setProperty('--bs-primary', colors.primary);
            count++;
        }
        if (colors.secondary) {
            root.style.setProperty('--color-secondary', colors.secondary);
            root.style.setProperty('--bs-secondary', colors.secondary);
            count++;
        }
        if (colors.accent) {
            root.style.setProperty('--color-accent', colors.accent);
            root.style.setProperty('--bs-accent', colors.accent);
            count++;
        }

        // Fuente
        if (config.font_family) {
            root.style.setProperty('--font-family', config.font_family);
            root.style.setProperty('--bs-body-font-family', config.font_family);
            count++;
        }

        // Radio de bordes
        if (config.border_radius) {
            root.style.setProperty('--border-radius', config.border_radius);
            count++;
        }

        return count;
    }

    // ========================================
    // 8. ACTUALIZACIÓN DE META TAGS SEO
    // ========================================

    function updateMetaTags(config) {
        let count = 0;
        const schoolName = config.school_name || 'Bachillerato General';
        const description = config.mision ||
            `${schoolName} - Educación media superior de calidad.`;
        const logoUrl = resolveAbsoluteUrl(config.logo_url || config.escudo_url);

        // Title
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            const baseTitle = titleEl.getAttribute('data-base-title') || '';
            titleEl.textContent = baseTitle ? `${schoolName} | ${baseTitle}` : schoolName;
            count++;
        }

        // Meta description
        const descEl = document.getElementById('page-description');
        if (descEl) {
            descEl.setAttribute('content', description.substring(0, 160));
            count++;
        }

        // Open Graph
        setMetaProperty('og:title', schoolName);
        setMetaProperty('og:description', description.substring(0, 200));
        if (logoUrl) setMetaProperty('og:image', logoUrl);
        count += 3;

        // Twitter Card
        setMetaName('twitter:title', schoolName);
        setMetaName('twitter:description', description.substring(0, 200));
        if (logoUrl) setMetaName('twitter:image', logoUrl);
        count += 3;

        // Favicon
        if (config.favicon_url) {
            const faviconEl = document.querySelector('link[rel="icon"]');
            if (faviconEl) {
                faviconEl.href = config.favicon_url;
                count++;
            }
        }

        // Apple Touch Icon
        if (config.logo_url) {
            const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (appleIcon) {
                appleIcon.href = config.logo_url;
                count++;
            }
        }

        // Schema.org JSON-LD
        updateSchemaOrg(config);
        count++;

        return count;
    }

    function setMetaProperty(property, content) {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (el) {
            el.setAttribute('content', content);
        } else {
            el = document.createElement('meta');
            el.setAttribute('property', property);
            el.setAttribute('content', content);
            document.head.appendChild(el);
        }
    }

    function setMetaName(name, content) {
        let el = document.querySelector(`meta[name="${name}"]`);
        if (el) {
            el.setAttribute('content', content);
        } else {
            el = document.createElement('meta');
            el.setAttribute('name', name);
            el.setAttribute('content', content);
            document.head.appendChild(el);
        }
    }

    function updateSchemaOrg(config) {
        const scriptEl = document.querySelector('script[type="application/ld+json"]');
        if (!scriptEl) return;

        try {
            const schema = {
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "name": config.school_official_name || config.school_name || 'Bachillerato General',
                "alternateName": config.school_short_name || 'BGE',
                "description": config.mision || config.vision || '',
                "url": config.website_url || '',
                "logo": resolveAbsoluteUrl(config.logo_url || config.escudo_url),
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": config.direccion || '',
                    "addressLocality": config.municipio || '',
                    "addressRegion": config.estado || 'Puebla',
                    "addressCountry": "MX"
                },
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": config.telefono || '',
                    "contactType": "Admissions"
                },
                "educationalLevel": "Upper Secondary Education"
            };
            scriptEl.textContent = JSON.stringify(schema, null, 4);
        } catch (e) { /* no romper si JSON-LD falla */ }
    }

    // ========================================
    // 9. VELO ANTI-FOUC
    // ========================================

    function applyFOUCVeil() {
        document.documentElement.classList.add('tenant-ready');
    }

    function removeFOUCVeil() {
        // Transición suave de opacidad
        document.documentElement.style.transition = 'opacity 0.15s ease-in';
        document.documentElement.classList.add('tenant-applied');

        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 200);
    }

    // ========================================
    // 10. UTILIDADES
    // ========================================

    function resolveField(config, fieldPath) {
        if (!fieldPath) return null;

        // Soporte para rutas anidadas: "colors.primary"
        const parts = fieldPath.split('.');
        let value = config;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }

        return value !== undefined && value !== null ? value : null;
    }

    function resolveAbsoluteUrl(url) {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
            return url;
        }
        // Convertir relativo a absoluto
        const base = window.location.origin || '';
        return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
    }

    function saveToCache(config) {
        try {
            const data = { ...config, _timestamp: Date.now() };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) { /* localStorage lleno, ignorar */ }
    }

    // ========================================
    // 11. FUNCIÓN PRINCIPAL DE BINDEO
    // ========================================

    function bindAllTenantContent(config) {
        if (!config) {
            config = getTenantConfig();
        }

        const stats = {
            textFields: bindTextFields(config),
            images: bindImageSources(config),
            links: bindLinks(config),
            styles: bindStyles(config),
            cssVars: injectCSSVariables(config),
            metaTags: updateMetaTags(config)
        };

        // Guardar en caché
        saveToCache(config);

        // Aplicar velo anti-FOUC
        applyFOUCVeil();

        // Log detallado
        console.log(
            `${LOG_PREFIX} Contenido bindeado:`,
            `${stats.textFields} textos,`,
            `${stats.images} imágenes,`,
            `${stats.links} enlaces,`,
            `${stats.styles} estilos,`,
            `${stats.cssVars} variables CSS,`,
            `${stats.metaTags} meta tags`
        );

        // Disparar evento personalizado
        document.dispatchEvent(new CustomEvent('tenantContentBound', {
            detail: { config, stats }
        }));

        return stats;
    }

    // ========================================
    // 12. INICIALIZACIÓN
    // ========================================

    function init() {
        // Aplicar velo inmediatamente
        document.documentElement.classList.add('tenant-binding');

        // Esperar a que tenant-config-loader.js cargue la config
        if (window.TENANT_CONFIG && window.TENANT_CONFIG.school_name) {
            // Config ya disponible, bindear inmediatamente
            setTimeout(() => {
                bindAllTenantContent(window.TENANT_CONFIG);
                removeFOUCVeil();
            }, FOUC_DELAY);
        } else {
            // Esperar evento tenantConfigLoaded
            document.addEventListener('tenantConfigLoaded', function onConfigLoaded(e) {
                document.removeEventListener('tenantConfigLoaded', onConfigLoaded);

                setTimeout(() => {
                    bindAllTenantContent(e.detail || window.TENANT_CONFIG);
                    removeFOUCVeil();
                }, FOUC_DELAY);
            });

            // Fallback: si el evento nunca llega, bindear con defaults
            setTimeout(() => {
                if (!document.documentElement.classList.contains('tenant-applied')) {
                    bindAllTenantContent(getDefaultConfig());
                    removeFOUCVeil();
                }
            }, 2000); // 2 segundos de espera máxima
        }
    }

    // ========================================
    // 13. APIs PÚBLICAS
    // ========================================

    /**
     * Re-bindear todo el contenido (útil después de cambios en CMS)
     */
    window.rebindTenantContent = function () {
        // Limpiar caché
        sessionStorage.removeItem(CACHE_KEY);
        // Forzar recarga de config
        if (window.TENANT_CONFIG) {
            bindAllTenantContent(window.TENANT_CONFIG);
        }
    };

    /**
     * Bindear un elemento específico por ID
     */
    window.bindTenantField = function (elementId, config) {
        const el = document.getElementById(elementId);
        if (!el) return false;

        const field = el.getAttribute('data-tenant-field');
        if (!field) return false;

        const value = resolveField(config || getTenantConfig(), field);
        if (value !== null) {
            el.textContent = String(value);
            return true;
        }
        return false;
    };

    /**
     * Obtener valor de configuración del tenant
     */
    window.getTenantValue = function (field, defaultValue) {
        return resolveField(getTenantConfig(), field) || defaultValue || null;
    };

    // ========================================
    // 14. AUTO-INICIALIZACIÓN
    // ========================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
