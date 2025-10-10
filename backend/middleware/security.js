/**
 * 🔒 MIDDLEWARE DE SEGURIDAD
 */

function securityMiddleware(req, res, next) {
    // Headers de seguridad básicos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    next();
}

module.exports = {
    securityMiddleware
};
