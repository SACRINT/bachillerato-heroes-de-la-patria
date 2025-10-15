const path = require('path');
const fs = require('fs').promises;

module.exports = async (req, res) => {
  // Simple check for admin authentication (en un caso real, esto usaría un middleware y validación de token JWT)
  const isAuthenticated = req.headers.authorization;

  if (!isAuthenticated) {
    return res.status(401).json({ success: false, error: 'No autorizado' });
  }

  try {
    // Construir la ruta al archivo JSON
    const jsonPath = path.join(__dirname, '..', 'data', 'pending-registrations.json');
    
    // Leer el archivo
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const requests = JSON.parse(fileContent);

    // Enviar respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Solicitudes de registro pendientes obtenidas correctamente.',
      count: requests.length,
      requests: requests
    });
  } catch (error) {
    console.error('Error en /api/admin/pending-registrations:', error);
    // Si el archivo no existe, devolver un array vacío, que es un estado válido.
    if (error.code === 'ENOENT') {
        return res.status(200).json({ success: true, message: 'No hay solicitudes pendientes.', count: 0, requests: [] });
    }
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener las solicitudes.',
      details: error.message
    });
  }
};
