import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// Helper para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (req, res) => {
  try {
    // Construir la ruta al archivo JSON de forma robusta
    const jsonPath = path.join(__dirname, '..', 'data', 'estudiantes.json');
    
    // Leer el archivo
    const fileContent = await fs.readFile(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    // Aplicar límite si se especifica en la query
    const url = new URL(req.url, `http://${req.headers.host}`);
    const limit = url.searchParams.has('limit') ? parseInt(url.searchParams.get('limit'), 10) : undefined;
    const students = limit ? data.estudiantes.slice(0, limit) : data.estudiantes;

    // Enviar respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Datos de estudiantes obtenidos correctamente.',
      data: {
        overview: {
          totalStudents: data.estadisticas.totalEstudiantes,
          totalTeachers: data.estadisticas.totalDocentes || 68, // Fallback si no existe
          totalSubjects: data.estadisticas.totalMaterias || 42, // Fallback si no existe
          generalAverage: data.estadisticas.promedioGeneral
        },
        students: students
      }
    });
  } catch (error) {
    console.error('Error en /api/students:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener los datos de los estudiantes.',
      details: error.message
    });
  }
};
