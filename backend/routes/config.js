/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA
 * Devuelve configuración segura para el frontend
 * Las variables de entorno se leen del .env en el backend
 */

const express = require('express');
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
        console.error('❌ Error obteniendo Google Client ID:', error);
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
        console.error('❌ Error obteniendo configuración pública:', error);
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
        // Obtener el dominio de la solicitud
        const hostname = req.hostname;  // ej: 'localhost:3000' o 'heroes.localhost'

        console.log('[CONFIG] Buscando configuración de tenant para dominio:', hostname);

        // Consultar la BD usando la función DAL
        const tenant = await getTenantByDomain(hostname);

        // Si no encuentra el tenant, retornar error
        if (!tenant) {
            console.warn(`[CONFIG] ⚠️ Tenant no encontrado para dominio: ${hostname}`);
            return res.status(404).json({
                success: false,
                error: 'Tenant no encontrado',
                message: `No hay configuración para el dominio: ${hostname}`,
                hostname: hostname
            });
        }

        // Si el tenant existe pero está inactivo, retornar error
        if (tenant.status !== 'activo') {
            console.warn(`[CONFIG] ⚠️ Tenant inactivo: ${hostname} (status: ${tenant.status})`);
            return res.status(403).json({
                success: false,
                error: 'Tenant inactivo',
                message: `El tenant está ${tenant.status}`,
                status: tenant.status
            });
        }

        console.log(`[CONFIG] ✅ Configuración de tenant encontrada: ${tenant.school_name}`);

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
        console.error('[CONFIG] ❌ Error obteniendo configuración de tenant:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración del tenant',
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
        console.error('❌ Error en health check de configuración:', error);
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: error.message
        });
    }
});

module.exports = router;
