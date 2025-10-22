// api/index.js
// Este archivo es el punto de entrada para el entorno serverless de Vercel.
// Importa la aplicación Express completa desde el backend y la exporta.

require('dotenv/config'); // Cargar variables de entorno al inicio

const app = require('../backend/server.js');

// Vercel espera que se exporte por defecto la función del servidor.
module.exports = app;