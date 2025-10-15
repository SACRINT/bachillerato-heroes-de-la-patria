import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Helper para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (req, res) => {
  try {
    // Construir la ruta al archivo JSON de forma robusta
    const jsonPath = path.join(__dirname, '..', 'data', 'docentes.json');
    
    // Leer el archivo
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Aplicar límite si se especifica en la query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = url.searchParams.has('limit') ? parseInt(url.searchParams.get('limit'), 10) : undefined;
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
