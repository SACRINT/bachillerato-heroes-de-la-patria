/**
 * Vercel Serverless Function Entry Point
 * Este archivo es el punto de entrada para todas las rutas /api/*
 * Importa y usa la aplicación Express desde app.js
 */

const app = require('./app.js');

/**
 * Vercel Serverless Handler
 * Maneja todas las solicitudes HTTP a /api/*
 *
 * Vercel automáticamente pasa req y res a esta función
 */
module.exports = app;

// O alternativamente, para ser explícito:
// module.exports = (req, res) => {
//     return app(req, res);
// };
