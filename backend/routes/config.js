/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA
 * Devuelve configuración segura para el frontend
 * Las variables de entorno se leen del .env en el backend
 */

const express = require('express');
// GDPR Logging - Debug condicional y sanitización
const { debugLog } = require('../utils/debug-logger');
const { sanitizeError, maskEmail } = require('../utils/sanitized-errors');
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
        debugLog.error('CONFIG', '❌ Error obteniendo Google Client ID:', sanitizeError(error, 'config'));
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
        debugLog.error('CONFIG', '❌ Error obteniendo configuración pública:', sanitizeError(error, 'config'));
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

        debugLog.log('CONFIG', '[CONFIG] Buscando configuración de tenant para dominio:', hostname);

        // Consultar la BD usando la función DAL
        const tenant = await getTenantByDomain(hostname);

        // Si no encuentra el tenant, usar configuración por defecto (BGE)
        if (!tenant) {
            debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant no encontrado para dominio: ${hostname}, usando configuración por defecto`);

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
            debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant inactivo: ${hostname} (status: ${tenant.status})`);
            return res.status(403).json({
                success: false,
                error: 'Tenant inactivo',
                message: `El tenant está ${tenant.status}`,
                status: tenant.status
            });
        }

        debugLog.log('CONFIG', `[CONFIG] ✅ Configuración de tenant encontrada: ${tenant.school_name}`);

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
        // 🔍 DIAGNÓSTICO DE RAÍZ (GDPR-compliant)
        debugLog.error('CONFIG', 'Error durante operación'); // Error en /api/config/tenant (stack trace masked)

        // ✅ FIX (19 Nov 2025): Si la tabla no existe, retornar config por defecto
        if (error.code === '42P01') { // Tabla no existe
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
                isDefault: true,
                tenant: {
                    id: 1,
                    uuid: 'default-uuid',
                    school_name: defaultConfig.school_name,
                    schema_name: 'public',
                    domain: req.headers.host || 'localhost',
                    status: 'activo'
                },
                config: defaultConfig
            });
        }

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

        // 🔍 LOGGING DIAGNÓSTICO (GDPR-compliant)
        debugLog.log('CONFIG', 'Operación iniciada'); // [PUBLIC-KEYS] Request recibido (API key metadata no se logea por seguridad)

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
        debugLog.error('CONFIG', '❌ Error obteniendo claves públicas:', sanitizeError(error, 'config'));
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
        debugLog.error('CONFIG', '❌ Error en health check de configuración:', sanitizeError(error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: error.message
        });
    }
});

module.exports = router;
