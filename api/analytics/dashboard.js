// api/analytics/dashboard.js - Endpoint serverless para analytics
module.exports = async (req, res) => {
    res.json({
        success: true,
        data: {
            totalUsers: 0,
            activeUsers: 0,
            pageViews: 0,
            sessions: 0
        }
    });
};
