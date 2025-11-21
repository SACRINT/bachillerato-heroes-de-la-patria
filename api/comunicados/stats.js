// api/comunicados/stats.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, published: 0, draft: 0 });
};
