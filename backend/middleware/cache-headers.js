/**
 * 💾 CACHE HEADERS MIDDLEWARE
 * Implementa estrategia de caching inteligente
 */

function cacheHeaders(req, res, next) {
    const path = req.path;

    // Static assets (1 año con cache busting)
    if (path.match(/\.(js|css|woff2|jpg|png|webp|svg)$/)) {
        if (path.includes('dist/') || path.match(/\.[a-f0-9]{8}\./)) {
            // Assets con hash: cache agresivo
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else {
            // Assets sin hash: revalidar
            res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
        }
    }

    // HTML pages (siempre revalidar)
    else if (path.match(/\.html$/)) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        res.setHeader('ETag', generateETag(path));
    }

    // API responses (sin cache)
    else if (path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    next();
}

function generateETag(path) {
    // Generar ETag basado en file modification time
    return require('crypto')
        .createHash('md5')
        .update(path + Date.now())
        .digest('hex');
}

module.exports = { cacheHeaders };