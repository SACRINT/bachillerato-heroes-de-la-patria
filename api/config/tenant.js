/**
 * GET /api/config/tenant
 * Retorna configuración de tenant para el frontend
 */

module.exports = function handler(req, res) {
    try {
        // Solo GET permitido
        if (req.method !== 'GET') {
            return res.status(405).json({
                success: false,
                error: 'Método no permitido'
            });
        }

        console.log('[TENANT-CONFIG] Request recibida');

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
            console.warn('[TENANT-CONFIG] Warning getting hostname:', e.message);
        }

        console.log('[TENANT-CONFIG] Retornando config para domain:', hostname);

        return res.status(200).json({
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
    } catch (error) {
        console.error('[TENANT-CONFIG] Error:', error.message);
        console.error('[TENANT-CONFIG] Stack:', error.stack);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
};
