const express = require('express');
const router = express.Router();
const YAML = require('yamljs'); // Importar YAML
const { swaggerUi, swaggerDocument, swaggerOptions } = require('../config/swagger-config.js');

// Ruta para servir la documentación de Swagger UI
router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Ruta para servir el archivo OpenAPI YAML directamente
router.get('/spec', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(YAML.stringify(swaggerDocument)); // Asegurarse que YAML esté definido si se usa
});

module.exports = router;