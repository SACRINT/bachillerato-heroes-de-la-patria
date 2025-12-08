/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA - TypeScript
 * Devuelve configuración segura para el frontend
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';

// GDPR Logging - Debug condicional y sanitización
import { debugLog } from '../utils/debug-logger';
import { sanitizeError, maskEmail } from '../utils/sanitized-errors';
import { getTenantByDomain } from '../data/database-access';

const router: Router = express.Router();

// ============================================
// INTERFACES
// ============================================

interface TenantConfig {
    school_name: string;
    school_short_name: string;
    school_type: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    enable_notifications: boolean;
    enable_gamification: boolean;
}

interface TenantInfo {
    id: number;
    uuid: string;
    school_name: string;
    schema_name: string;
    domain: string;
    status: string;
    config_json?: TenantConfig;
}

interface ConfigResponse {
    success: boolean;
    clientId?: string;
    environment?: string;
    error?: string;
    message?: string;
}

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/config/google-client-id
 * Devuelve el Google OAuth Client ID según el entorno
 */
router.get('/google-client-id', (req: Request, res: Response): void => {
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

    } catch (error: unknown) {
        debugLog.error('CONFIG', '❌ Error obteniendo Google Client ID:', sanitizeError(error as Error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: (error as Error).message
        });
    }
});

/**
 * GET /api/config/public
 * Devuelve configuración pública del frontend
 */
router.get('/public', (req: Request, res: Response): void => {
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

    } catch (error: unknown) {
        debugLog.error('CONFIG', '❌ Error obteniendo configuración pública:', sanitizeError(error as Error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: (error as Error).message
        });
    }
});

/**
 * GET /api/config/tenant
 * Obtiene la configuración del tenant desde la base de datos
 */
router.get('/tenant', async (req: Request, res: Response): Promise<void> => {
    try {
        const hostname = req.headers.host || req.host || 'localhost';

        debugLog.log('CONFIG', '[CONFIG] Buscando configuración de tenant para dominio:', hostname);

        const tenant = await getTenantByDomain(hostname) as TenantInfo | null;

        // Configuración por defecto de BGE
        const defaultConfig: TenantConfig = {
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
            debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant no encontrado para dominio: ${hostname}, usando configuración por defecto`);

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
            debugLog.log('CONFIG', `[CONFIG] ⚠️ Tenant inactivo: ${hostname} (status: ${tenant.status})`);
            res.status(403).json({
                success: false,
                error: 'Tenant inactivo',
                message: `El tenant está ${tenant.status}`,
                status: tenant.status
            });
            return;
        }

        debugLog.log('CONFIG', `[CONFIG] ✅ Configuración de tenant encontrada: ${tenant.school_name}`);

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

    } catch (error: unknown) {
        const err = error as Error & { code?: string };
        debugLog.error('CONFIG', 'Error durante operación');

        // Si la tabla no existe, retornar config por defecto
        if (err.code === '42P01') {
            const defaultConfig: TenantConfig = {
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
router.get('/public-keys', (req: Request, res: Response): void => {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const tinymceKey = process.env.TINYMCE_API_KEY || null;

        debugLog.log('CONFIG', 'Operación iniciada');

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

    } catch (error: unknown) {
        debugLog.error('CONFIG', '❌ Error obteniendo claves públicas:', sanitizeError(error as Error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error al obtener claves públicas',
            message: (error as Error).message
        });
    }
});

/**
 * GET /api/config/health
 * Verifica si las variables críticas están configuradas
 */
router.get('/health', (req: Request, res: Response): void => {
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

    } catch (error: unknown) {
        debugLog.error('CONFIG', '❌ Error en health check de configuración:', sanitizeError(error as Error, 'config'));
        res.status(500).json({
            success: false,
            error: 'Error en health check',
            message: (error as Error).message
        });
    }
});

export default router;
