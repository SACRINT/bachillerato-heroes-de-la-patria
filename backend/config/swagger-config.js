const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Cargar el archivo OpenAPI YAML
const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/openapi.yaml'));

// Configuración de Swagger UI
const swaggerOptions = {
    swaggerOptions: {
        url: "/api-docs-spec", // Ruta donde el frontend buscará el YAML
        docExpansion: 'none', // Colapsa todas las operaciones por defecto
        filter: true, // Habilita la barra de búsqueda de filtros
        operationsSorter: 'alpha', // Ordena las operaciones alfabéticamente
        tagsSorter: 'alpha', // Ordena las etiquetas alfabéticamente
        showRequestHeaders: true, // Muestra las cabeceras de la petición
        tryItOutEnabled: true, // Habilita el botón "Try it out"
    },
    customCss: '.swagger-ui .topbar { display: none }', // Oculta la barra superior de Swagger
    customSiteTitle: "BGE Héroes de la Patria API Docs",
};

module.exports = {
    swaggerUi,
    swaggerDocument,
    swaggerOptions
};