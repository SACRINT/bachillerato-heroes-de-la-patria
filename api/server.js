/**
 * 🚀 VERCEL SERVERLESS FUNCTION
 * Re-exports backend/server.js for Vercel deployment
 */

// Set NODE_PATH to include backend node_modules
process.env.NODE_PATH = require('path').join(__dirname, '../server/node_modules');
require('module').Module._initPaths();

// Export the backend server
module.exports = require('../server/server');
