/**
 * 🔧 API CONFIG ENDPOINTS
 * Maneja configuración de tenant y keys públicas
 * Para Vercel serverless functions
 */

module.exports = (req, res) => {
    try {
        // Debug logging
        console.log(`[CONFIG-API] ${req.method} ${req.url}`);
        console.log('[CONFIG-API] Headers:', {
            host: req.headers.host,
            'x-forwarded-host': req.headers['x-forwarded-host'],
            'user-agent': req.headers['user-agent']
        });

        // Route handling
        if (req.url === '/api/config/tenant' && req.method === 'GET') {
            return handleTenantConfig(req, res);
        } else if (req.url === '/api/config/public-keys' && req.method === 'GET') {
            return handlePublicKeys(req, res);
        } else {
            return res.status(404).json({
                success: false,
                error: 'Endpoint no encontrado',
                path: req.url,
                method: req.method
            });
        }
    } catch (error) {
        console.error('[CONFIG-API] Error no capturado:', error.message);
        console.error('[CONFIG-API] Stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};

function handleTenantConfig(req, res) {
    try {
        const defaultConfig = {
            school_name: 'Bachillerato General Estatal "Héroes de la Patria"',
            school_short_name: 'BGE',
            school_type: 'Bachillerato General por Competencias',
            primary_color: '#2563eb',
            secondary_color: '#1e40af',
            logo_url: '/images/logo-bge.png',
            contact_email: 'contacto@heroespatria.edu.mx',
            contact_phone: '(777) 123-4567',
            address: 'Calle Principal #123, Cuernavaca, Morelos',
            enable_notifications: true,
            enable_gamification: true
        };

        // Obtener hostname de forma segura
        let hostname = 'bge-heroesdelapatria.vercel.app';
        try {
            hostname = req.headers.host || req.headers['x-forwarded-host'] || 'bge-heroesdelapatria.vercel.app';
        } catch (e) {
            console.warn('[CONFIG-API] Warning obtaining hostname:', e.message);
        }

        console.log('[CONFIG-API] Returning tenant config for domain:', hostname);

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({
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
        }));
    } catch (error) {
        console.error('[CONFIG-API] Error en handleTenantConfig:', error.message);
        console.error('[CONFIG-API] Stack:', error.stack);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        }));
    }
}

function handlePublicKeys(req, res) {
    try {
        const isDevelopment = process.env.NODE_ENV === 'development';

        // Safe key retrieval
        const tinymceKey = process.env.TINYMCE_API_KEY || null;
        const googleOAuthId = isDevelopment
            ? (process.env.GOOGLE_OAUTH_CLIENT_ID_DEV || '')
            : (process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '');

        console.log('[CONFIG-API] Returning public keys - NODE_ENV:', process.env.NODE_ENV);

        const response = {
            success: true,
            environment: isDevelopment ? 'development' : 'production',
            keys: {
                tinymce: tinymceKey,
                google_oauth_client_id: googleOAuthId
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(response));
    } catch (error) {
        console.error('[CONFIG-API] Error en handlePublicKeys:', error.message);
        console.error('[CONFIG-API] Stack:', error.stack);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({
            success: false,
            error: 'Error al obtener keys',
            message: error.message
        }));
    }
}
