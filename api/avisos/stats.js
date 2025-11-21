// api/avisos/stats.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, active: 0, expired: 0 });
};
