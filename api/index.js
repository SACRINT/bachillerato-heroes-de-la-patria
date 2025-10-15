/**
 * 🚀 VERCEL SERVERLESS ENTRY POINT
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Este archivo es el punto de entrada para las funciones serverless de Vercel.
 * Carga el servidor Express desde el directorio backend
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

// Set NODE_PATH to include server node_modules
process.env.NODE_PATH = require('path').join(__dirname, '../server/node_modules');
require('module').Module._initPaths();

// Change current working directory to 'server' before requiring server.js
// This makes relative requires within server.js work correctly
process.chdir(require('path').join(__dirname, '../server'));

// Importar y exportar la aplicación Express desde el directorio server
const app = require('./server'); // Now it's relative to the new CWD

module.exports = app;
