/**
 * 🔍 DEBUG ENDPOINT: Lista todos los archivos incluidos en el entorno de ejecución
 * Útil para confirmar si backend/config/database.js fue empaquetado correctamente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (req, res) => {
  try {
    const baseDir = path.join(__dirname, "../");
    const backendDir = path.join(baseDir, "backend");

    let files = [];

    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          files.push(path.relative(baseDir, fullPath));
        }
      }
    }

    if (fs.existsSync(backendDir)) {
      walk(backendDir);
    } else {
      return res.status(404).json({
        error: "Directorio backend no encontrado. Puede no haber sido incluido en el paquete.",
        baseDir,
        cwd: process.cwd(),
      });
    }

    res.status(200).json({
      success: true,
      count: files.length,
      message: "Archivos encontrados dentro del despliegue actual",
      files: files.sort(),
      timestamp: new Date().toISOString(),
      workingDirectory: process.cwd(),
    });
  } catch (err) {
    res.status(500).json({
      error: "Error al listar archivos",
      message: err.message,
    });
  }
};