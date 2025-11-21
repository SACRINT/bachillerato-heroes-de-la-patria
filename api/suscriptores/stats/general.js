// api/suscriptores/stats/general.js
module.exports = async (req, res) => {
    res.json({ success: true, total: 0, active: 0, unsubscribed: 0 });
};
