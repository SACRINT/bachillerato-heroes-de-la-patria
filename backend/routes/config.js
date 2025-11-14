/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA
 * Devuelve configuración segura para el frontend
 * Las variables de entorno se leen del .env en el backend
 */

const express = require('express');
const devLogger = require('../utils/devLogger');
const router = express.Router();
const { getTenantByDomain } = require('../data/database-access');

/**
 * GET /api/config/google-client-id
 * Devuelve el Google OAuth Client ID según el entorno
 */
router.get('/google-client-id', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';

        // Seleccionar Client ID según entorno
        const clientId = isDevelopment
            ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
            : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD;

        // Verificar que exista la configuración
        if (!clientId) {
            return res.status(500).json({
                success: false,
                error: 'Google OAuth no configurado en el servidor',
                message: `Variable ${isDevelopment ? 'GOOGLE_OAUTH_CLIENT_ID_DEV' : 'GOOGLE_OAUTH_CLIENT_ID_PROD'} no encontrada en .env`
            });
        }

        // Devolver configuración
        res.json({
            success: true,
            clientId: clientId,
            environment: isDevelopment ? 'development' : 'production'
        });

    } catch (error) {
        devLogger.error('❌ Error obteniendo Google Client ID:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
});

/**
 * GET /api/config/public
 * Devuelve configuración pública del frontend
 */
router.get('/public', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';

        const config = {
            success: true,
            environment: isDevelopment ? 'development' : 'production',
            google: {
                clientId: isDevelopment
                    ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
                    : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD,
                enabled: !!(process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || process.env.GOOGLE_OAUTH_CLIENT_ID_PROD)
            },
            tinymce: {
                apiKey: process.env.TINYMCE_API_KEY || null
            },
            app: {
                name: 'BGE Héroes de la Patria',
                version: '2.18.0'
            }
        };

        res.json(config);

    } catch (error) {
        devLogger.error('❌ Error obteniendo configuración pública:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
});

/**
 * GET /api/config/tenant
 * NUEVO ENDPOINT MULTI-TENANT
 * Obtiene la configuración del tenant desde la base de datos usando el dominio
 * Este endpoint es CRÍTICO para arquitectura multi-tenant
 */
router.get('/tenant', async (req, res) => {
    try {
        // Obtener el dominio de la solicitud (INCLUIR PUERTO)
        // ✅ FIX (9 NOV 2025 - REVISADO): Usar req.headers.host en lugar de req.host
        // req.hostname retorna solo 'localhost' (sin puerto) ❌
        // req.host retorna 'localhost:3000' pero está deprecado ⚠️
        // req.headers.host retorna el valor EXACTO del header Host: 'localhost:3000' ✅
        const hostname = req.headers.host || req.host || 'localhost';  // ej: 'localhost:3000' o 'heroes.localhost'

        devLogger.log('[CONFIG] Buscando configuración de tenant para dominio:', hostname);

        // Consultar la BD usando la función DAL
        const tenant = await getTenantByDomain(hostname);

        // Si no encuentra el tenant, usar configuración por defecto (BGE)
        if (!tenant) {
            devLogger.warn(`[CONFIG] ⚠️ Tenant no encontrado para dominio: ${hostname}, usando configuración por defecto`);

            // Configuración por defecto de BGE Héroes de la Patria
            const defaultConfig = {
                school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
                school_short_name: 'BGE',
                school_type: 'Bachillerato General por Competencias',
                primary_color: '#2563eb',
                secondary_color: '#1e40af',
                logo_url: '/public/images/logo-bge.png',
                contact_email: 'contacto@heroespatria.edu.mx',
                contact_phone: '(777) 123-4567',
                address: 'Calle Principal #123, Cuernavaca, Morelos',
                enable_notifications: true,
                enable_gamification: true
            };

            return res.json({
                success: true,
                isDefault: true,  // Indicar que es configuración por defecto
                tenant: {
                    id: 1,
                    uuid: 'default-uuid',
                    school_name: defaultConfig.school_name,
                    schema_name: 'public',
                    domain: hostname,
                    status: 'activo'
                },
                config: defaultConfig
            });
        }

        // Si el tenant existe pero está inactivo, retornar error
        if (tenant.status !== 'activo') {
            devLogger.warn(`[CONFIG] ⚠️ Tenant inactivo: ${hostname} (status: ${tenant.status})`);
            return res.status(403).json({
                success: false,
                error: 'Tenant inactivo',
                message: `El tenant está ${tenant.status}`,
                status: tenant.status
            });
        }

        devLogger.log(`[CONFIG] ✅ Configuración de tenant encontrada: ${tenant.school_name}`);

        // Retornar la configuración JSON del tenant
        res.json({
            success: true,
            tenant: {
                id: tenant.id,
                uuid: tenant.uuid,
                school_name: tenant.school_name,
                schema_name: tenant.schema_name,
                domain: tenant.domain,
                status: tenant.status
            },
            config: tenant.config_json  // La configuración completa JSON
        });

    } catch (error) {
        // 🔍 DIAGNÓSTICO DE RAÍZ - Logging detallado para identificar el error exacto
        console.error('[DIAGNÓSTICO DE RAÍZ] Error detallado en /api/config/tenant:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        console.error('[DIAGNÓSTICO DE RAÍZ] Stack trace completo:', error.stack);
        console.error('[DIAGNÓSTICO DE RAÍZ] Tipo de error:', error.constructor.name);
        console.error('[DIAGNÓSTICO DE RAÍZ] Mensaje:', error.message);

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message,
            errorType: error.constructor.name
        });
    }
});

/**
 * GET /api/config/public-keys
 * Devuelve claves públicas de servicios externos (TinyMCE, Google, etc)
 * AGREGADO: 13 Nov 2025 - Fix 404 errors
 */
router.get('/public-keys', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const tinymceKey = process.env.TINYMCE_API_KEY || null;

        // 🔍 LOGGING DIAGNÓSTICO
        console.log('═══════════════════════════════════════════════════');
        console.log('[PUBLIC-KEYS] Request recibido');
        console.log('[PUBLIC-KEYS] NODE_ENV:', process.env.NODE_ENV || 'undefined');
        console.log('[PUBLIC-KEYS] isDevelopment:', isDevelopment);
        console.log('[PUBLIC-KEYS] TINYMCE_API_KEY presente:', !!tinymceKey);
        console.log('[PUBLIC-KEYS] TINYMCE_API_KEY longitud:', tinymceKey ? tinymceKey.length : 0);
        console.log('[PUBLIC-KEYS] TINYMCE_API_KEY primeros 10 caracteres:', tinymceKey ? tinymceKey.substring(0, 10) + '...' : 'null');
        console.log('═══════════════════════════════════════════════════');

        const response = {
            success: true,
            keys: {
                tinymce: tinymceKey,
                google_oauth_client_id: isDevelopment
                    ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
                    : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD
            },
            environment: isDevelopment ? 'development' : 'production'
        };

        res.json(response);

    } catch (error) {
        devLogger.error('❌ Error obteniendo claves públicas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener claves públicas',
            message: error.message
        });
    }
});

/**
 * GET /api/config/health
 * Verifica si las variables críticas de configuración están presentes
 */
router.get('/health', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';

        const config = {
            success: true,
            google_oauth: {
                configured: !!(isDevelopment ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD),
                environment: isDevelopment ? 'development' : 'production'
            },
            database: {
                configured: !!process.env.DATABASE_URL
            },
            jwt: {
                configured: !!process.env.JWT_SECRET
            },
            email: {
                configured: !!process.env.SMTP_HOST && !!process.env.SMTP_USER
            }
        };

        res.json(config);

    } catch (error) {
        devLogger.error('❌ Error en health check de configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: error.message
        });
    }
});

module.exports = router;
