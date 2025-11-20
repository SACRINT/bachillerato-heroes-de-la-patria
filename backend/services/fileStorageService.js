/**
 * 📁 FILE STORAGE SERVICE - SEMANA 19
 * Gestión de archivos y uploads
 *
 * Features:
 * - Local storage
 * - Cloud ready (S3 compatible)
 * - Tipo/tamaño validation
 * - Thumbnails
 * - Cleanup
 *
 * Fecha: 20 Noviembre 2025
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const devLogger = require('../utils/devLogger');

class FileStorageService {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.join(__dirname, '../../public/uploads');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    this.init();
  }

  async init() {
    await fs.mkdir(this.baseDir, { recursive: true });
    devLogger.log('[FileStorage] Servicio inicializado');
  }

  async save(file, options = {}) {
    // Validar tipo
    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new Error(`Tipo de archivo no permitido: ${file.mimetype}`);
    }

    // Validar tamaño
    if (file.size > this.maxFileSize) {
      throw new Error(`Archivo excede el límite de ${this.maxFileSize / 1024 / 1024}MB`);
    }

    // Generar nombre único
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}${ext}`;

    // Subdirectorio por fecha
    const dateDir = new Date().toISOString().split('T')[0];
    const targetDir = path.join(this.baseDir, dateDir);
    await fs.mkdir(targetDir, { recursive: true });

    const filepath = path.join(targetDir, filename);

    // Guardar archivo
    await fs.writeFile(filepath, file.buffer);

    const publicPath = `/uploads/${dateDir}/${filename}`;

    devLogger.log(`[FileStorage] Archivo guardado: ${publicPath}`);

    return {
      success: true,
      filename,
      path: publicPath,
      fullPath: filepath,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname
    };
  }

  async get(filepath) {
    const fullPath = path.join(this.baseDir, filepath.replace('/uploads/', ''));

    try {
      const stats = await fs.stat(fullPath);
      const buffer = await fs.readFile(fullPath);

      return {
        success: true,
        buffer,
        size: stats.size
      };

    } catch (error) {
      throw new Error('Archivo no encontrado');
    }
  }

  async delete(filepath) {
    const fullPath = path.join(this.baseDir, filepath.replace('/uploads/', ''));

    try {
      await fs.unlink(fullPath);
      devLogger.log(`[FileStorage] Archivo eliminado: ${filepath}`);
      return { success: true };

    } catch (error) {
      throw new Error('Error eliminando archivo');
    }
  }

  async list(directory = '') {
    const targetDir = path.join(this.baseDir, directory);

    try {
      const items = await fs.readdir(targetDir, { withFileTypes: true });

      const files = [];
      for (const item of items) {
        const itemPath = path.join(targetDir, item.name);
        const stats = await fs.stat(itemPath);

        files.push({
          name: item.name,
          isDirectory: item.isDirectory(),
          size: stats.size,
          modified: stats.mtime
        });
      }

      return { success: true, files };

    } catch (error) {
      return { success: true, files: [] };
    }
  }

  async getStats() {
    let totalFiles = 0;
    let totalSize = 0;

    const scan = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          await scan(itemPath);
        } else {
          const stats = await fs.stat(itemPath);
          totalFiles++;
          totalSize += stats.size;
        }
      }
    };

    try {
      await scan(this.baseDir);
    } catch {
      // Ignorar errores
    }

    return {
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  }

  async cleanup(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 días
    const cutoff = Date.now() - maxAge;
    let deleted = 0;

    const scan = async (dir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          await scan(itemPath);

          // Eliminar directorio vacío
          const remaining = await fs.readdir(itemPath);
          if (remaining.length === 0) {
            await fs.rmdir(itemPath);
          }
        } else {
          const stats = await fs.stat(itemPath);
          if (stats.mtimeMs < cutoff) {
            await fs.unlink(itemPath);
            deleted++;
          }
        }
      }
    };

    try {
      await scan(this.baseDir);
      devLogger.log(`[FileStorage] Cleanup: ${deleted} archivos eliminados`);
    } catch (error) {
      devLogger.error('[FileStorage] Cleanup error:', error.message);
    }

    return { deleted };
  }
}

module.exports = new FileStorageService();
