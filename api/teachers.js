const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  try {
    // Construir la ruta al archivo JSON
    const jsonPath = path.resolve(process.cwd(), 'data', 'docentes.json');
    
    // Leer el archivo
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Aplicar límite si se especifica en la query
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const teachers = limit ? data.docentes.slice(0, limit) : data.docentes;

    // Enviar respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Datos de docentes obtenidos correctamente.',
      data: {
        teachers: teachers
      }
    });
  } catch (error) {
    console.error('Error en /api/teachers:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener los datos de los docentes.',
      details: error.message
    });
  }
};
