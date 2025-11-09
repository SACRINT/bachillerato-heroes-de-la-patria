/**
 * Logger utility para backend
 * Proporciona funciones de logging condicionales
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const logAction = (action, details = '') => {
    if (isDevelopment) {
        console.log(`[${new Date().toISOString()}] ${action}${details ? ': ' + details : ''}`);
    }
};

const logError = (action, error = '') => {
    console.error(`[ERROR] ${action}${error ? ': ' + error : ''}`);
};

const logWarning = (action, details = '') => {
    console.warn(`[WARN] ${action}${details ? ': ' + details : ''}`);
};

module.exports = {
    logAction,
    logError,
    logWarning
};
