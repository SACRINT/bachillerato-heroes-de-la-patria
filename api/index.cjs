// ✅ CARGAR BACKEND COMPLETO DESDE /backend/server.js Y ADAPTARLO PARA VERCEL

const app = require('../backend/server'); // Importamos tu app Express ya configurada

// Vercel requiere que exportemos una función tipo "handler"
module.exports = (req, res) => {
  app(req, res);
};
