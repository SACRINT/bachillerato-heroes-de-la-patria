/**
 * Rutas de Documentación API
 * BGE Héroes de la Patria
 * FASE 4 - Semana 29-30
 *
 * Endpoints para servir documentación OpenAPI/Swagger
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

// Cargar especificación OpenAPI
let openApiSpec = null;
const specPath = path.join(__dirname, '../docs/openapi.yaml');

try {
    const specContent = fs.readFileSync(specPath, 'utf8');
    openApiSpec = yaml.load(specContent);
    console.log('[API-DOCS] Especificación OpenAPI cargada correctamente');
} catch (error) {
    console.error('[API-DOCS] Error cargando especificación OpenAPI:', error);
}

/**
 * GET /api/docs
 * Swagger UI HTML
 */
router.get('/', (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BGE API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .swagger-ui .topbar {
            background-color: #1a5f7a;
        }
        .swagger-ui .info .title {
            color: #1a5f7a;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: #61affe;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: #49cc90;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
            background: #fca130;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
            background: #f93e3e;
        }
        .swagger-ui .btn.authorize {
            background-color: #1a5f7a;
            border-color: #1a5f7a;
        }
        .swagger-ui .btn.authorize:hover {
            background-color: #0d3d4f;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "/api/docs/openapi.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                validatorUrl: null,
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                tagsSorter: 'alpha',
                operationsSorter: 'alpha'
            });
            window.ui = ui;
        };
    </script>
</body>
</html>
    `;
    res.send(html);
});

/**
 * GET /api/docs/openapi.json
 * Especificación OpenAPI en JSON
 */
router.get('/openapi.json', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación OpenAPI no disponible'
        });
    }
    res.json(openApiSpec);
});

/**
 * GET /api/docs/openapi.yaml
 * Especificación OpenAPI en YAML
 */
router.get('/openapi.yaml', (req, res) => {
    try {
        const yamlContent = fs.readFileSync(specPath, 'utf8');
        res.set('Content-Type', 'text/yaml');
        res.send(yamlContent);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error leyendo especificación'
        });
    }
});

/**
 * GET /api/docs/endpoints
 * Lista de todos los endpoints
 */
router.get('/endpoints', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    const endpoints = [];

    for (const [path, methods] of Object.entries(openApiSpec.paths || {})) {
        for (const [method, details] of Object.entries(methods)) {
            endpoints.push({
                method: method.toUpperCase(),
                path,
                summary: details.summary || '',
                tags: details.tags || [],
                security: details.security ? 'Requiere autenticación' : 'Público'
            });
        }
    }

    res.json({
        success: true,
        data: {
            total: endpoints.length,
            endpoints: endpoints.sort((a, b) => a.path.localeCompare(b.path))
        }
    });
});

/**
 * GET /api/docs/tags
 * Lista de tags/categorías
 */
router.get('/tags', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    const tags = openApiSpec.tags || [];

    // Contar endpoints por tag
    const tagCounts = {};
    for (const [, methods] of Object.entries(openApiSpec.paths || {})) {
        for (const [, details] of Object.entries(methods)) {
            for (const tag of details.tags || []) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            }
        }
    }

    const tagsWithCount = tags.map(tag => ({
        ...tag,
        endpointCount: tagCounts[tag.name] || 0
    }));

    res.json({
        success: true,
        data: tagsWithCount
    });
});

/**
 * GET /api/docs/schemas
 * Lista de schemas/modelos
 */
router.get('/schemas', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    const schemas = openApiSpec.components?.schemas || {};

    const schemaList = Object.entries(schemas).map(([name, schema]) => ({
        name,
        type: schema.type || 'object',
        properties: Object.keys(schema.properties || {}),
        required: schema.required || []
    }));

    res.json({
        success: true,
        data: {
            total: schemaList.length,
            schemas: schemaList
        }
    });
});

/**
 * GET /api/docs/info
 * Información general de la API
 */
router.get('/info', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    // Contar endpoints
    let endpointCount = 0;
    for (const methods of Object.values(openApiSpec.paths || {})) {
        endpointCount += Object.keys(methods).length;
    }

    res.json({
        success: true,
        data: {
            title: openApiSpec.info?.title,
            version: openApiSpec.info?.version,
            description: openApiSpec.info?.description,
            contact: openApiSpec.info?.contact,
            servers: openApiSpec.servers,
            stats: {
                endpoints: endpointCount,
                tags: (openApiSpec.tags || []).length,
                schemas: Object.keys(openApiSpec.components?.schemas || {}).length
            }
        }
    });
});

/**
 * GET /api/docs/search
 * Buscar en la documentación
 */
router.get('/search', (req, res) => {
    const { q } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'Query debe tener al menos 2 caracteres'
        });
    }

    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    const results = [];
    const query = q.toLowerCase();

    // Buscar en endpoints
    for (const [path, methods] of Object.entries(openApiSpec.paths || {})) {
        for (const [method, details] of Object.entries(methods)) {
            const searchText = [
                path,
                details.summary || '',
                details.description || '',
                ...(details.tags || [])
            ].join(' ').toLowerCase();

            if (searchText.includes(query)) {
                results.push({
                    type: 'endpoint',
                    method: method.toUpperCase(),
                    path,
                    summary: details.summary,
                    tags: details.tags
                });
            }
        }
    }

    // Buscar en schemas
    for (const [name, schema] of Object.entries(openApiSpec.components?.schemas || {})) {
        if (name.toLowerCase().includes(query)) {
            results.push({
                type: 'schema',
                name,
                properties: Object.keys(schema.properties || {})
            });
        }
    }

    res.json({
        success: true,
        data: {
            query: q,
            total: results.length,
            results
        }
    });
});

/**
 * GET /api/docs/postman
 * Exportar colección de Postman
 */
router.get('/postman', (req, res) => {
    if (!openApiSpec) {
        return res.status(500).json({
            success: false,
            message: 'Especificación no disponible'
        });
    }

    // Convertir a formato Postman básico
    const postmanCollection = {
        info: {
            name: openApiSpec.info?.title || 'BGE API',
            description: openApiSpec.info?.description || '',
            schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
        },
        variable: [
            {
                key: 'baseUrl',
                value: openApiSpec.servers?.[0]?.url || 'http://localhost:3000/api',
                type: 'string'
            },
            {
                key: 'token',
                value: '',
                type: 'string'
            }
        ],
        item: []
    };

    // Agrupar por tags
    const taggedItems = {};

    for (const [path, methods] of Object.entries(openApiSpec.paths || {})) {
        for (const [method, details] of Object.entries(methods)) {
            const tag = details.tags?.[0] || 'General';

            if (!taggedItems[tag]) {
                taggedItems[tag] = {
                    name: tag,
                    item: []
                };
            }

            const request = {
                name: details.summary || path,
                request: {
                    method: method.toUpperCase(),
                    header: details.security ? [
                        {
                            key: 'Authorization',
                            value: 'Bearer {{token}}',
                            type: 'text'
                        }
                    ] : [],
                    url: {
                        raw: '{{baseUrl}}' + path,
                        host: ['{{baseUrl}}'],
                        path: path.split('/').filter(Boolean)
                    }
                }
            };

            taggedItems[tag].item.push(request);
        }
    }

    postmanCollection.item = Object.values(taggedItems);

    res.set('Content-Disposition', 'attachment; filename=bge-api-collection.json');
    res.json(postmanCollection);
});

console.log('[API-DOCS] Rutas de documentación cargadas');

module.exports = router;
