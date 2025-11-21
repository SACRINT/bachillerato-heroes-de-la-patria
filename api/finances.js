// api/finances.js - Endpoint serverless para finanzas
module.exports = async (req, res) => {
    res.json({
        success: true,
        data: {
            ingresos: [],
            gastos: [],
            balance: 0,
            presupuesto: { total: 0, usado: 0 }
        }
    });
};
