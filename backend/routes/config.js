/**
 * 🔧 RUTAS DE CONFIGURACIÓN PÚBLICA
 * Devuelve configuración segura para el frontend
 * Las variables de entorno se leen del .env en el backend
 */

const express = require('express');
const router = express.Router();

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
