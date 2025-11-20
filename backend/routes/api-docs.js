/**
 * 📚 API DOCUMENTATION ROUTES - SEMANA 29-30
 * Swagger UI Integration para documentación interactiva de API
 *
 * Endpoints:
 * - GET /api-docs - Swagger UI interface
 * - GET /api-docs/spec - OpenAPI 3.0 JSON spec
 * - GET /api-docs/spec.json - Alias para compatibilidad
 *
 * Features:
 * - Swagger UI interactivo con "Try it out"
 * - Auto-generación de spec desde rutas Express
 * - Autenticación JWT integrada en UI
 * - Examples automáticos para cada endpoint
 * - Portable y modular
 *
 * Fecha: 20 Noviembre 2025
 */

const express = require('express');
const router = express.Router();
const swaggerUi = require('swagger-ui-express');
const openApiGenerator = require('../services/openApiGenerator');
const devLogger = require('../utils/devLogger');

// Cache del spec (regenerar cada hora o en desarrollo siempre)
let cachedSpec = null;
let lastGenerated = null;
const CACHE_TTL = process.env.NODE_ENV === 'production' ? 60 * 60 * 1000 : 0; // 1 hora en prod, 0 en dev

/**
 * GENERATE OR GET CACHED SPEC
 */
async function getOpenAPISpec(app) {
    const now = Date.now();

    // Return cached if valid
    if (cachedSpec && lastGenerated && (now - lastGenerated) < CACHE_TTL) {
        return cachedSpec;
    }

    // Generate new spec
    devLogger.log('API-DOCS', '📚 Generating fresh OpenAPI spec...');

    const spec = await openApiGenerator.generateSpec(app);

    cachedSpec = spec;
    lastGenerated = now;

    devLogger.log('API-DOCS', `✅ Spec generated with ${Object.keys(spec.paths).length} paths`);

    return spec;
}

/**
 * SWAGGER UI OPTIONS
 */
const swaggerUiOptions = {
    customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
        .swagger-ui .scheme-container {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .swagger-ui .btn.authorize {
            background-color: #28a745;
            border-color: #28a745;
        }
        .swagger-ui .btn.authorize:hover {
            background-color: #218838;
            border-color: #1e7e34;
        }
    `,
    customSiteTitle: 'BGE API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true, // Mantener token JWT entre reloads
        displayRequestDuration: true,
        filter: true, // Enable filtering endpoints
        tryItOutEnabled: true,
        requestSnippetsEnabled: true,
        syntaxHighlight: {
            activate: true,
            theme: 'monokai'
        }
    }
};

/**
 * SETUP SWAGGER UI ROUTES
 * Debe ser llamado después de que todas las rutas estén registradas
 */
function setupSwaggerUI(app) {
    devLogger.log('API-DOCS', '🚀 Setting up Swagger UI routes...');

    // Endpoint para obtener spec JSON
    router.get('/spec', async (req, res) => {
        try {
            const spec = await getOpenAPISpec(app);
            res.json(spec);
        } catch (error) {
            devLogger.error('API-DOCS', 'Error generating spec:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate OpenAPI spec'
            });
        }
    });

    // Alias para compatibilidad
    router.get('/spec.json', async (req, res) => {
        try {
            const spec = await getOpenAPISpec(app);
            res.json(spec);
        } catch (error) {
            devLogger.error('API-DOCS', 'Error generating spec:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate OpenAPI spec'
            });
        }
    });

    // Función para servir Swagger UI de forma dinámica
    router.use('/', async (req, res, next) => {
        try {
            const spec = await getOpenAPISpec(app);

            // Crear middleware de Swagger UI con spec dinámico
            const serve = swaggerUi.serve;
            const setup = swaggerUi.setup(spec, swaggerUiOptions);

            // Ejecutar middleware de Swagger UI
            serve[0](req, res, () => {
                setup(req, res, next);
            });

        } catch (error) {
            devLogger.error('API-DOCS', 'Error serving Swagger UI:', error);
            res.status(500).send(`
                <html>
                    <head><title>API Documentation Error</title></head>
                    <body>
                        <h1>Error Loading API Documentation</h1>
                        <p>${error.message}</p>
                        <p>Please check server logs for details.</p>
                    </body>
                </html>
            `);
        }
    });

    devLogger.log('API-DOCS', '✅ Swagger UI routes configured');
    devLogger.log('API-DOCS', '📖 Documentation available at: /api-docs');

    return router;
}

/**
 * INVALIDATE CACHE
 * Útil cuando se agregan nuevas rutas en desarrollo
 */
function invalidateCache() {
    cachedSpec = null;
    lastGenerated = null;
    devLogger.log('API-DOCS', '🔄 OpenAPI spec cache invalidated');
}

module.exports = {
    setupSwaggerUI,
    invalidateCache,
    router // Export para uso directo si se prefiere
};
