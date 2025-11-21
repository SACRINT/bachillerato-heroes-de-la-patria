// api/config/public-keys.js - Endpoint serverless independiente
module.exports = (req, res) => {
    res.json({
        success: true,
        keys: {
            google_oauth_client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID_PROD || '',
            tinymce: process.env.TINYMCE_API_KEY || 'no-api-key',
        },
        timestamp: new Date().toISOString()
    });
};
