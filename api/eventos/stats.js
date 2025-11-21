// api/eventos/stats.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, upcoming: 0, past: 0 });
};
