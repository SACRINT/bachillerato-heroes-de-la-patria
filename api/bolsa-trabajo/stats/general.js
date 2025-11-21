// api/bolsa-trabajo/stats/general.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, active: 0, filled: 0 });
};
