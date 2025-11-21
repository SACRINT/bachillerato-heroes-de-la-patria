// api/config/tenant.js - Endpoint serverless independiente
module.exports = (req, res) => {
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
};
