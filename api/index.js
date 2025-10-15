/**
 * 🚀 VERCEL SERVERLESS ENTRY POINT
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Este archivo es el punto de entrada para las funciones serverless de Vercel.
 * Carga el servidor Express desde el directorio backend
 */

// Cargar variables de entorno
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Importar y exportar la aplicación Express
const app = require(require('path').join(__dirname, '../server/server'));

module.exports = app;
