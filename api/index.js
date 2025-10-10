/**
 * 🚀 VERCEL SERVERLESS ENTRY POINT
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Este archivo es el punto de entrada para las funciones serverless de Vercel.
 * Simplemente importa y exporta la aplicación Express desde backend/server.js
 */

const app = require('../backend/server');

module.exports = app;
