/**
 * Logger utility para backend
 * Proporciona funciones de logging condicionales
 */

const devLogger = require('./devLogger');
const isDevelopment = process.env.NODE_ENV !== 'production';

const logAction = (action, details = '') => {
    if (isDevelopment) {
        devLogger.log(`[${new Date().toISOString()}] ${action}${details ? ': ' + details : ''}`);
    }
};

const logError = (action, error = '') => {
    devLogger.error(`[ERROR] ${action}${error ? ': ' + error : ''}`);
};

const logWarning = (action, details = '') => {
    devLogger.warn(`[WARN] ${action}${details ? ': ' + details : ''}`);
};

module.exports = {
    logAction,
    logError,
    logWarning
};
