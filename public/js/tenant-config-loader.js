/**
 * 🏢 Tenant Configuration Loader
 *
 * Carga la configuración específica del tenant desde el backend
 * y la hace disponible globalmente en window.TENANT_CONFIG
 *
 * Propósito: Permitir multi-tenancy - una instalación puede servir
 * múltiples instituciones educativas con diferente configuración
 *
 * @author Claude Code
 * @date 2025-11-10
 * @version 1.0.0
 */

(function () {
    'use strict';

    // IIFE para evitar contaminación del scope global
    // Solo window.TENANT_CONFIG será expuesto

    // ========================================
    // 1. CONFIGURACIÓN DEFAULT (FALLBACK)
    // ========================================

    const DEFAULT_CONFIG = {
        id: null,
        uuid: null,
        school_name: 'Bachillerato General',
        school_official_name: 'Bachillerato General',
        school_short_name: 'BGE',
        school_type: 'Bachillerato General Estatal',
        cct: '21EBHXXXXX',
        zona_escolar: '0XX',
        turno: 'Matutino',
        domain: 'localhost:3000',
        subdomain: 'default',
        logo_url: '/images/logo-bachillerato-HDLP.webp',
        escudo_url: '/images/logo-bachillerato-HDLP.webp',
        favicon_url: '/favicon.ico',
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
        director_name: 'Nombre del Director',
        director_email: 'director@ejemplo.edu.mx',
        director_phone: '(XXX) XXX-XXXX',
        director_photo_url: '',
        director_message: 'Bienvenidos a nuestra institución educativa.',
        sicep_url: 'https://www.siged.sep.gob.mx/SIGED/alumnos.html',
        mision: 'Misión institucional',
        vision: 'Visión institucional',
        valores: 'Valores institucionales',
        historia: 'Historia del plantel',
        eslogan: 'Tu futuro comienza aquí',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        youtube_url: '',
        tiktok_url: '',
        whatsapp_number: '',
        latitud: null,
        longitud: null,
        google_maps_embed_url: '',
        status: 'activo',
        features: {
            google_oauth: true,
            student_portal: true,
            parent_portal: true,
            teacher_portal: true,
            admin_dashboard: true,
            chat: true,
            notifications: true,
            calendar: true,
            grades_system: true,
            attendance_system: true
        },
        features_enabled: {
            chatbot_ia: true,
            gamificacion_iacoins: true,
            alerta_temprana: true,
            portal_estudiantes: true,
            portal_docentes: true,
            portal_padres: true,
            portal_egresados: true,
            biblioteca_digital: true,
            citas_orientacion: true
        },
        localization: {
            language: 'es',
            timezone: 'America/Mexico_City',
            date_format: 'DD/MM/YYYY',
            currency: 'MXN'
        }
    };

    // ========================================
    // 2. FUNCIÓN DE CARGA
    // ========================================

    async function loadTenantConfig() {
        try {
            const cached = sessionStorage.getItem('bge_cache_tenant_config');
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {}
            }

            const response = await fetch('/api/config/tenant', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                return DEFAULT_CONFIG;
            }

            const data = await response.json();

            if (!data.success || !data.tenant) {
                return DEFAULT_CONFIG;
            }

            const finalConfig = {
                ...DEFAULT_CONFIG,
                ...data.tenant,
                ...(data.config || {}),
                config: data.config
            };

            // Asegurar que colors sea un objeto
            if (!finalConfig.colors || typeof finalConfig.colors !== 'object') {
                finalConfig.colors = {
                    primary: finalConfig.primary_color || DEFAULT_CONFIG.colors.primary,
                    secondary: finalConfig.secondary_color || DEFAULT_CONFIG.colors.secondary,
                    accent: finalConfig.accent_color || DEFAULT_CONFIG.colors.accent
                };
            }

            // Asegurar school_short_name
            if (!finalConfig.school_short_name || finalConfig.school_short_name === 'BGE') {
                finalConfig.school_short_name = finalConfig.school_name
                    ? finalConfig.school_name.substring(0, 10)
                    : 'BGE';
            }

            try {
                sessionStorage.setItem('bge_cache_tenant_config', JSON.stringify(finalConfig));
            } catch (e) {}

            return finalConfig;

        } catch (error) {
            return DEFAULT_CONFIG;
        }
    }

    // ========================================
    // 3. INICIALIZAR CONFIGURACIÓN
    // ========================================

    loadTenantConfig().then(config => {
        window.TENANT_CONFIG = config;
        const event = new CustomEvent('tenantConfigLoaded', { detail: config });
        document.dispatchEvent(event);
    }).catch(() => {
        window.TENANT_CONFIG = DEFAULT_CONFIG;
    });

    // ========================================
    // 4. HELPER PARA ACCESO A CONFIGURACIÓN
    // ========================================

    /**
     * Obtiene un valor de la configuración de forma segura
     * @param {string} path - Ruta tipo "school_name" o "features.google_oauth"
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} El valor encontrado o el default
     */
    window.getTenantConfigValue = function (path, defaultValue = null) {
        if (!window.TENANT_CONFIG) {
            return defaultValue;
        }

        const keys = path.split('.');
        let value = window.TENANT_CONFIG;

        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }

        return value !== undefined ? value : defaultValue;
    };

})();

// ========================================
// EJEMPLOS DE USO:
// ========================================
/*

// Acceder a configuración global
void 0;

// Acceder con helper
void 0;
void 0;

// Escuchar cuando está lista
document.addEventListener('tenantConfigLoaded', (event) => {
    void 0;
});

// Actualizar elementos HTML dinámicamente
document.addEventListener('tenantConfigLoaded', (event) => {
    const config = event.detail;

    // Actualizar nombre de institución
    const schoolNameEl = document.getElementById('school-name');
    if (schoolNameEl) {
        schoolNameEl.textContent = config.school_name;
    }

    // Actualizar logo
    const logoEl = document.getElementById('school-logo');
    if (logoEl) {
        logoEl.src = config.logo_url;
    }

    // Actualizar color primario (CSS variable)
    document.documentElement.style.setProperty('--primary-color', config.primary_color);
});

*/
