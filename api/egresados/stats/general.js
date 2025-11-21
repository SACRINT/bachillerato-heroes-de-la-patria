// api/egresados/stats/general.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, verified: 0, pending: 0 });
};
