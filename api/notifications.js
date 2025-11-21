// api/notifications.js - Endpoint serverless para notificaciones
module.exports = async (req, res) => {
    res.json({ success: true, data: [], total: 0, unread: 0 });
};
