// api/health.js - Endpoint serverless de health check
module.exports = (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '2.28.0'
    });
};
