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
        school_name: '"Héroes de la Patria"', // Nombre visual
        school_official_name: 'Bachillerato General por Competencias "Héroes de la Patria"',
        school_short_name: '"Héroes de la Patria"', // Fix: Reemplazar "BGE" por el nombre que el usuario prefiere
        domain: 'localhost:3000',
        address: 'Coronel Tito Hernández, Venustiano Carranza, Puebla',
        phone: '+52-xxx-xxx-xxxx',
        website: 'https://heroes-de-la-patria.edu.mx',
        logo_url: '/images/logo-bachillerato-HDLP.webp',
        primary_color: '#1976D2',
        secondary_color: '#FFC107',
        accent_color: '#FF5722',
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
            // Hacer petición al endpoint
            const response = await fetch('/api/config/tenant', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Incluir cookies de sesión
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
                config: data.config
            };

            if (finalConfig.school_short_name === 'BGE') {
                finalConfig.school_short_name = '"Héroes de la Patria"';
            }

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
console.log(window.TENANT_CONFIG.school_name);

// Acceder con helper
console.log(window.getTenantConfigValue('school_name'));
console.log(window.getTenantConfigValue('features.google_oauth'));

// Escuchar cuando está lista
document.addEventListener('tenantConfigLoaded', (event) => {
    console.log('Configuración cargada:', event.detail);
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
