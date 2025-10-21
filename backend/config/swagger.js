/**
 * 📚 CONFIGURACIÓN SWAGGER - BGE API
 * Documentación automática de la API REST
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BGE Héroes de la Patria - API',
            version: '1.0.0',
            description: 'API para el sistema educativo del Bachillerato General Estatal "Héroes de la Patria"',
            contact: {
                name: 'BGE Development Team',
                email: 'desarrollo@heroespatria.edu.mx'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de desarrollo'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        './routes/*.js',
        './models/*.js',
        './server.js'
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;