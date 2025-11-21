// api/config/google-client-id.js - Endpoint serverless independiente
module.exports = (req, res) => {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID_PROD
        || process.env.GOOGLE_OAUTH_CLIENT_ID
        || process.env.GOOGLE_OAUTH_CLIENT_ID_DEV
        || '';

    res.json({
        success: true,
        clientId: clientId,
        configured: !!clientId,
        environment: process.env.NODE_ENV === 'development' ? 'development' : 'production'
    });
};
