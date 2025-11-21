// api/settings.js - Endpoint serverless para configuración
module.exports = async (req, res) => {
    res.json({
        success: true,
        data: {
            theme: 'light',
            language: 'es',
            notifications: true,
            timezone: 'America/Mexico_City'
        }
    });
};
