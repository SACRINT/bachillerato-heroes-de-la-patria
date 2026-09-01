/**
 * GET /api/config/tenant
 * Retorna configuración de tenant para el frontend
 * Resuelve el tenant por subdominio/dominio y retorna toda la configuración necesaria
 * para el motor de bindeo tenant-content-binder.js
 */

// Cache simple en memoria (se reinicia en cada deploy de serverless)
let tenantCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 300000; // 5 minutos

/**
 * Configuración genérica por defecto (sin datos de ninguna escuela específica)
 */
function getDefaultConfig(hostname) {
    return {
        id: 1,
        uuid: 'default-uuid',
        school_name: 'Bachillerato General',
        school_official_name: 'Bachillerato General',
        school_short_name: 'BGE',
        school_type: 'Bachillerato General Estatal',
        cct: '21EBHXXXXX',
        zona_escolar: '0XX',
        turno: 'Matutino',
        domain: hostname,
        subdomain: 'default',
        status: 'activo',
        logo_url: '/images/logo-bachillerato-HDLP.webp',
        escudo_url: '/images/logo-bachillerato-HDLP.webp',
        favicon_url: '/favicon.ico',
        colors: {
            primary: '#1e40af',
            secondary: '#dc2626',
            accent: '#059669'
        },
        font_family: 'Inter',
        direccion: 'Dirección del plantel',
        codigo_postal: 'XXXXX',
        municipio: 'Municipio',
        estado: 'Puebla',
        telefono: '(XXX) XXX-XXXX',
        email_institucional: 'contacto@ejemplo.edu.mx',
        website_url: '',
        horario_clases: '8:00 AM - 1:30 PM',
        horario_atencion: '8:00 AM - 2:00 PM',
        director_name: 'Nombre del Director',
        director_email: 'director@ejemplo.edu.mx',
        director_phone: '(XXX) XXX-XXXX',
        director_photo_url: '',
        director_message: 'Bienvenidos a nuestra institución educativa.',
        mision: 'Misión institucional',
        vision: 'Visión institucional',
        valores: 'Valores institucionales',
        historia: 'Historia del plantel',
        eslogan: 'Tu futuro comienza aquí',
        facebook_url: '',
        twitter_url: '',
        instagram_url: '',
        youtube_url: '',
        tiktok_url: '',
        whatsapp_number: '',
        latitud: null,
        longitud: null,
        google_maps_embed_url: '',
        features_enabled: {
            chatbot_ia: true,
            gamificacion_iacoins: true,
            alerta_temprana: true,
            portal_estudiantes: true,
            portal_docentes: true,
            portal_padres: true,
            portal_egresados: true,
            biblioteca_digital: true,
            citas_orientacion: true
        }
    };
}

module.exports = function handler(req, res) {
    try {
        // Solo GET permitido
        if (req.method !== 'GET') {
            return res.status(405).json({
                success: false,
                error: 'Método no permitido'
            });
        }

        // Obtener hostname de forma segura
        let hostname = '';
        try {
            hostname = req.headers.host || req.headers['x-forwarded-host'] || '';
            hostname = hostname.split(':')[0]; // Remover puerto
        } catch (e) {
            hostname = '';
        }

        console.log('[TENANT-CONFIG] Request para domain:', hostname);

        // Intentar obtener del caché
        const cacheKey = hostname || 'default';
        if (tenantCache && tenantCache.id === cacheKey && (Date.now() - cacheTimestamp) < CACHE_TTL) {
            console.log('[TENANT-CONFIG] Retornando del caché');
            return res.status(200).json(tenantCache.data);
        }

        // Intentar conectar a BD para obtener tenant real
        // En Vercel serverless, la BD puede no estar disponible
        let tenantData = null;
        try {
            // Solo intentar BD si no estamos en Vercel serverless sin DB
            if (process.env.DATABASE_URL && !hostname.includes('vercel.app')) {
                const { Pool } = require('pg');
                const pool = new Pool({
                    connectionString: process.env.DATABASE_URL,
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
                });

                // Buscar por subdomain o domain
                const subdomain = hostname.split('.')[0];
                const result = await pool.query(
                    `SELECT * FROM tenants WHERE subdomain = $1 OR domain = $2 OR custom_domain = $2 LIMIT 1`,
                    [subdomain, hostname]
                );

                if (result.rows.length > 0) {
                    const tenant = result.rows[0];
                    tenantData = {
                        id: tenant.id,
                        uuid: tenant.uuid,
                        school_name: tenant.school_name,
                        school_official_name: tenant.school_official_name,
                        school_short_name: tenant.school_short_name,
                        school_type: tenant.school_type,
                        cct: tenant.cct,
                        zona_escolar: tenant.zona_escolar,
                        turno: tenant.turno,
                        domain: tenant.domain,
                        subdomain: tenant.subdomain,
                        status: tenant.status,
                        logo_url: tenant.logo_url,
                        escudo_url: tenant.escudo_url,
                        favicon_url: tenant.favicon_url,
                        colors: tenant.colors || getDefaultConfig(hostname).colors,
                        font_family: tenant.font_family,
                        direccion: tenant.direccion,
                        codigo_postal: tenant.codigo_postal,
                        municipio: tenant.municipio,
                        estado: tenant.estado,
                        telefono: tenant.telefono,
                        email_institucional: tenant.email_institucional,
                        website_url: tenant.website_url,
                        horario_clases: tenant.horario_clases,
                        horario_atencion: tenant.horario_atencion,
                        director_name: tenant.director_name,
                        director_email: tenant.director_email,
                        director_phone: tenant.director_phone,
                        director_photo_url: tenant.director_photo_url,
                        director_message: tenant.director_message,
                        mision: tenant.mision,
                        vision: tenant.vision,
                        valores: tenant.valores,
                        historia: tenant.historia,
                        eslogan: tenant.eslogan,
                        facebook_url: tenant.facebook_url,
                        twitter_url: tenant.twitter_url,
                        instagram_url: tenant.instagram_url,
                        youtube_url: tenant.youtube_url,
                        tiktok_url: tenant.tiktok_url,
                        whatsapp_number: tenant.whatsapp_number,
                        latitud: tenant.latitud,
                        longitud: tenant.longitud,
                        google_maps_embed_url: tenant.google_maps_embed_url,
                        features_enabled: tenant.features_enabled
                    };
                }
                await pool.end();
            }
        } catch (dbError) {
            console.warn('[TENANT-CONFIG] BD no disponible, usando config por defecto:', dbError.message);
        }

        // Si no hay tenant en BD, usar config genérica
        if (!tenantData) {
            tenantData = getDefaultConfig(hostname);
        }

        const responseData = {
            success: true,
            isDefault: !tenantData.id || tenantData.id === 1,
            tenant: tenantData,
            config: tenantData
        };

        // Guardar en caché
        tenantCache = { id: cacheKey, data: responseData };
        cacheTimestamp = Date.now();

        return res.status(200).json(responseData);
    } catch (error) {
        console.error('[TENANT-CONFIG] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Error al obtener configuración',
            message: error.message
        });
    }
};
