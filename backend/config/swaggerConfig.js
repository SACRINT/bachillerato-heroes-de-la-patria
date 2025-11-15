// backend/config/swaggerConfig.js
const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API del Bachillerato General "Héroes de la Patria"',
    version: '1.0.0',
    description: 'Documentación completa de la API REST para el sistema de gestión escolar BGE. Incluye endpoints para autenticación, gestión de usuarios, noticias, eventos y más.',
    contact: {
      name: 'Soporte Técnico',
      email: 'soporte.bge@example.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor de Desarrollo Local',
    },
    {
      url: 'https://bachilleratohp.vercel.app',
      description: 'Servidor de Producción (Vercel)',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Rutas a los archivos que contienen las anotaciones de la API
  apis: ['./routes/*.js', './routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
