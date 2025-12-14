/**
 * 🏢 TENANT CONFIG MANAGER - Singleton
 *
 * Propósito: Obtener y proveer la configuración del tenant a toda la aplicación
 * de forma centralizada. Evita múltiples llamadas fetch al mismo endpoint.
 *
 * Uso:
 * - Al cargar la página: TenantConfigManager.loadTenantConfig()
 * - Desde cualquier script: TenantConfigManager.getConfig()
 * - Escuchar cambios: document.addEventListener('tenantConfigLoaded', handler)
 *
 * Fecha: 8 de Noviembre de 2025
 * Versión: 1.0.0
 */

const TenantConfigManager = (function() {
    'use strict';

    // Variables privadas (singleton)
    let config = null;
    let isLoading = false;
    let loadPromise = null;

    /**
     * Cargar la configuración del tenant desde el backend
     * Singleton: Solo se carga una vez, las siguientes llamadas devuelven el cache
     *
     * @returns {Promise<Object|null>} Configuración del tenant o null si error
     */
    async function loadTenantConfig() {
        // Si ya está cargado, devolverlo inmediatamente
        if (config !== null) {
            console.log('[TENANT-CONFIG] ✅ Configuración ya cargada, usando cache');
            return config;
        }

        // Si ya está cargando, esperar a que termine
        if (isLoading) {
            console.log('[TENANT-CONFIG] ⏳ Configuración cargándose, esperando...');
            return loadPromise;
        }

        // Iniciar la carga
        isLoading = true;
        loadPromise = (async () => {
            try {
                console.log('[TENANT-CONFIG] 🔄 Iniciando carga de configuración del tenant...');

                // LLAMADA CRÍTICA: Usar la URL exacta /api/admin/tenant/config
                const response = await fetch('/api/admin/tenant/config');

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const jsonData = await response.json();

                // Validar estructura de respuesta
                if (!jsonData.success || !jsonData.data) {
                    throw new Error('Respuesta inválida: falta field "success" o "data"');
                }

                // Guardar en variable local (CRÍTICO: acceder a data dentro de la respuesta)
                config = jsonData.data;

                console.log('[TENANT-CONFIG] ✅ Configuración cargada para:', config.school?.name || 'Unknown School');

                // Disparar evento para que otros scripts se enturen
                // Usar CustomEvent para pasar la configuración
                const event = new CustomEvent('tenantConfigLoaded', {
                    detail: config,
                    bubbles: true,
                    cancelable: false
                });
                document.dispatchEvent(event);

                console.log('[TENANT-CONFIG] 📢 Evento "tenantConfigLoaded" disparado');

                return config;

            } catch (error) {
                console.error('[TENANT-CONFIG] ❌ Error cargando la configuración:', error);

                // Disparar evento de error también
                const errorEvent = new CustomEvent('tenantConfigError', {
                    detail: error.message,
                    bubbles: true,
                    cancelable: false
                });
                document.dispatchEvent(errorEvent);

                return null;

            } finally {
                isLoading = false;
            }
        })();

        return loadPromise;
    }

    /**
     * Obtener la configuración del tenant cargada
     * Si no está cargada, devuelve null (usar loadTenantConfig primero)
     *
     * @returns {Object|null} Configuración del tenant
     */
    function getConfig() {
        if (config === null) {
            console.warn('[TENANT-CONFIG] ⚠️ Configuración no cargada. Llama a loadTenantConfig() primero.');
            return null;
        }
        return config;
    }

    /**
     * Obtener un valor específico de la configuración
     * Soporta notación de punto: 'school.name', 'branding.primaryColor', etc
     *
     * @param {string} path - Ruta del valor (ej: 'school.name', 'features.googleOAuth')
     * @param {*} defaultValue - Valor por defecto si no existe
     * @returns {*} El valor o defaultValue
     */
    function getConfigValue(path, defaultValue = null) {
        if (config === null) {
            return defaultValue;
        }

        try {
            const parts = path.split('.');
            let value = config;

            for (const part of parts) {
                value = value[part];
                if (value === undefined) {
                    return defaultValue;
                }
            }

            return value;
        } catch (error) {
            console.warn(`[TENANT-CONFIG] ⚠️ Error accediendo a ${path}:`, error);
            return defaultValue;
        }
    }

    /**
     * Recargar la configuración (útil si cambió en la BD)
     * Fuerza a recargar incluso si ya estaba cacheada
     *
     * @returns {Promise<Object|null>} Nueva configuración
     */
    async function reloadConfig() {
        console.log('[TENANT-CONFIG] 🔄 Forzando recarga de configuración...');
        config = null;
        isLoading = false;
        loadPromise = null;
        return loadTenantConfig();
    }

    /**
     * API pública del singleton
     */
    return {
        // Métodos principales
        loadTenantConfig,
        getConfig,
        getConfigValue,
        reloadConfig,

        // Información de estado
        isLoaded: () => config !== null,
        isLoading: () => isLoading
    };
})();

/**
 * AUTOLOAD: Cargar configuración tan pronto como el script se ejecute
 * Esto garantiza que esté disponible para otros scripts
 */
if (document.readyState === 'loading') {
    // Si el DOM aún está cargando, esperar
    document.addEventListener('DOMContentLoaded', () => {
        TenantConfigManager.loadTenantConfig().catch(error => {
            console.error('[TENANT-CONFIG] Error en autoload:', error);
        });
    });
} else {
    // Si el DOM ya está listo, cargar inmediatamente
    TenantConfigManager.loadTenantConfig().catch(error => {
        console.error('[TENANT-CONFIG] Error en autoload:', error);
    });
}

console.log('[TENANT-CONFIG] 📦 TenantConfigManager cargado y disponible globalmente');
