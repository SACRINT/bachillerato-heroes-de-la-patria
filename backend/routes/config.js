"use strict";
/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA - TypeScript
 * Devuelve configuración segura para el frontend
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// GDPR Logging - Debug condicional y sanitización
const debug_logger_1 = require("../utils/debug-logger");
const sanitized_errors_1 = require("../utils/sanitized-errors");
const database_access_1 = require("../data/database-access");
const router = express_1.default.Router();
// ============================================
// ROUTES
// ============================================
/**
 * GET /api/config/google-client-id
 * Devuelve el Google OAuth Client ID según el entorno
 */
router.get('/google-client-id', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const clientId = isDevelopment
            ? process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
            : process.env.GOOGLE_OAUTH_CLIENT_ID_PROD;
        if (!clientId) {
            res.status(500).json({
                success: false,
                error: 'Google OAuth no configurado en el servidor',
                message: `Variable ${isDevelopment ? 'GOOGLE_OAUTH_CLIENT_ID_DEV' : 'GOOGLE_OAUTH_CLIENT_ID_PROD'} no encontrada en .env`
            });
            return;
        }
        res.json({
            success: true,
            clientId: clientId,
            environment: isDevelopment ? 'development' : 'production'
        });
    }
    catch (error) {
        debug_logger_1.debugLog.error('CONFIG', '❌ Error obteniendo Google Client ID:', (0, sanitized_errors_1.sanitizeError)(error, 'config'));
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('CONFIG', '❌ Error obteniendo configuración pública:', (0, sanitized_errors_1.sanitizeError)(error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
});
/**
 * GET /api/config/tenant
 * Obtiene la configuración del tenant desde la base de datos
 */
router.get('/tenant', async (req, res) => {
    try {
        const hostname = req.headers.host || req.host || 'localhost';
        debug_logger_1.debugLog.log('CONFIG', '[CONFIG] Buscando configuración de tenant para dominio:', hostname);
        const tenant = await (0, database_access_1.getTenantByDomain)(hostname);
        // Configuración por defecto de BGE
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
        if (!tenant) {
            debug_logger_1.debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant no encontrado para dominio: ${hostname}, usando configuración por defecto`);
            res.json({
                success: true,
                isDefault: true,
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
            return;
        }
        if (tenant.status !== 'activo') {
            debug_logger_1.debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant inactivo: ${hostname} (status: ${tenant.status})`);
            res.status(403).json({
                success: false,
                error: 'Tenant inactivo',
                message: `El tenant está ${tenant.status}`,
                status: tenant.status
            });
            return;
        }
        debug_logger_1.debugLog.log('CONFIG', `[CONFIG] ✅ Configuración de tenant encontrada: ${tenant.school_name}`);
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
            config: tenant.config_json
        });
    }
    catch (error) {
        const err = error;
        debug_logger_1.debugLog.error('CONFIG', 'Error durante operación');
        // Si la tabla no existe, retornar config por defecto
        if (err.code === '42P01') {
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
            res.json({
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
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: err.message,
            errorType: err.constructor.name
        });
    }
});
/**
 * GET /api/config/public-keys
 * Devuelve claves públicas de servicios externos
 */
router.get('/public-keys', (req, res) => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const tinymceKey = process.env.TINYMCE_API_KEY || null;
        debug_logger_1.debugLog.log('CONFIG', 'Operación iniciada');
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('CONFIG', '❌ Error obteniendo claves públicas:', (0, sanitized_errors_1.sanitizeError)(error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener claves públicas',
            message: error.message
        });
    }
});
/**
 * GET /api/config/health
 * Verifica si las variables críticas están configuradas
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
    }
    catch (error) {
        debug_logger_1.debugLog.error('CONFIG', '❌ Error en health check de configuración:', (0, sanitized_errors_1.sanitizeError)(error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=config.js.map