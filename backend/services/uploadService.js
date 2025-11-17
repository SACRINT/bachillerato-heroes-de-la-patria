/**
 * Upload Service - Capa de servicios para gestión de archivos
 * Maneja subida, validación y almacenamiento de archivos
 * GDPR Compliant - Logging condicional
 */

const { debugLog } = require('../utils/debug-logger');
const { sanitizeError } = require('../utils/sanitized-errors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UploadService {
  constructor() {
    // Directorios de almacenamiento
    this.uploadDirs = {
      cv: path.join(__dirname, '../../uploads/cv'),
      documents: path.join(__dirname, '../../uploads/documents'),
      images: path.join(__dirname, '../../uploads/images'),
      temp: path.join(__dirname, '../../uploads/temp')
    };

    // Tipos de archivo permitidos
    this.allowedTypes = {
      cv: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    };

    // Tamaños máximos (en bytes)
    this.maxSizes = {
      cv: 5 * 1024 * 1024,       // 5 MB
      images: 2 * 1024 * 1024,   // 2 MB
      documents: 10 * 1024 * 1024 // 10 MB
    };
  }

  /**
   * Subir un archivo
   * @param {Object} file - Objeto de archivo (req.file de multer)
   * @param {string} category - Categoría (cv, images, documents)
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Información del archivo subido
   */
  async uploadFile(file, category = 'documents', options = {}) {
    debugLog.log('UPLOAD', `Uploading ${category} file`, { originalName: file.originalname });

    try {
      // Validar archivo
      this._validateFile(file, category);

      // Asegurar que el directorio existe
      await this._ensureDirectory(this.uploadDirs[category]);

      // Generar nombre único
      const uniqueFilename = this._generateUniqueFilename(file.originalname);
      const filePath = path.join(this.uploadDirs[category], uniqueFilename);

      // Guardar archivo
      await fs.writeFile(filePath, file.buffer);

      const fileInfo = {
        originalName: file.originalname,
        filename: uniqueFilename,
        path: filePath,
        relativePath: `/uploads/${category}/${uniqueFilename}`,
        mimetype: file.mimetype,
        size: file.size,
        category: category,
        uploadedAt: new Date().toISOString()
      };

      debugLog.log('UPLOAD', 'File uploaded successfully', { filename: uniqueFilename, size: file.size });

      return fileInfo;
    } catch (error) {
      debugLog.error('UPLOAD', 'Error uploading file', sanitizeError(error, 'uploadFile'));
      throw error;
    }
  }

  /**
   * Eliminar un archivo
   * @param {string} filename - Nombre del archivo
   * @param {string} category - Categoría del archivo
   * @returns {Promise<boolean>} true si se eliminó correctamente
   */
  async deleteFile(filename, category = 'documents') {
    debugLog.log('UPLOAD', `Deleting ${category} file`, { filename });

    try {
      const filePath = path.join(this.uploadDirs[category], filename);

      // Verificar que el archivo existe
      await fs.access(filePath);

      // Eliminar archivo
      await fs.unlink(filePath);

      debugLog.log('UPLOAD', 'File deleted successfully', { filename });

      return true;
    } catch (error) {
      debugLog.error('UPLOAD', 'Error deleting file', sanitizeError(error, 'deleteFile'));
      throw error;
    }
  }

  /**
   * Obtener información de un archivo
   * @param {string} filename - Nombre del archivo
   * @param {string} category - Categoría del archivo
   * @returns {Promise<Object>} Información del archivo
   */
  async getFileInfo(filename, category = 'documents') {
    debugLog.log('UPLOAD', `Getting ${category} file info`, { filename });

    try {
      const filePath = path.join(this.uploadDirs[category], filename);

      const stats = await fs.stat(filePath);

      return {
        filename: filename,
        path: filePath,
        relativePath: `/uploads/${category}/${filename}`,
        size: stats.size,
        category: category,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      debugLog.error('UPLOAD', 'Error getting file info', sanitizeError(error, 'getFileInfo'));
      throw error;
    }
  }

  /**
   * Listar archivos en una categoría
   * @param {string} category - Categoría
   * @returns {Promise<Array>} Lista de archivos
   */
  async listFiles(category = 'documents') {
    debugLog.log('UPLOAD', `Listing ${category} files`);

    try {
      await this._ensureDirectory(this.uploadDirs[category]);

      const files = await fs.readdir(this.uploadDirs[category]);

      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          try {
            return await this.getFileInfo(filename, category);
          } catch (err) {
            return null;
          }
        })
      );

      // Filtrar archivos nulos (errores)
      const validFiles = fileInfos.filter(f => f !== null);

      debugLog.log('UPLOAD', 'Files listed', { count: validFiles.length });

      return validFiles;
    } catch (error) {
      debugLog.error('UPLOAD', 'Error listing files', sanitizeError(error, 'listFiles'));
      throw error;
    }
  }

  /**
   * Validar archivo
   * @private
   */
  _validateFile(file, category) {
    if (!file) {
      throw new Error('No se proporcionó archivo');
    }

    // Validar tipo de archivo
    const allowedTypes = this.allowedTypes[category] || this.allowedTypes.documents;
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
    }

    // Validar tamaño
    const maxSize = this.maxSizes[category] || this.maxSizes.documents;
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      throw new Error(`El archivo excede el tamaño máximo permitido de ${maxSizeMB} MB`);
    }

    // Validar nombre de archivo
    if (!file.originalname || file.originalname.length === 0) {
      throw new Error('Nombre de archivo inválido');
    }
  }

  /**
   * Generar nombre único de archivo
   * @private
   */
  _generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');

    return `${timestamp}-${randomString}${ext}`;
  }

  /**
   * Asegurar que el directorio existe
   * @private
   */
  async _ensureDirectory(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Directorio no existe, crearlo
      await fs.mkdir(dirPath, { recursive: true });
      debugLog.log('UPLOAD', 'Directory created', { dirPath });
    }
  }

  /**
   * Limpiar archivos temporales antiguos
   * @param {number} maxAgeHours - Edad máxima en horas (default: 24)
   * @returns {Promise<number>} Número de archivos eliminados
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    debugLog.log('UPLOAD', 'Cleaning up temp files', { maxAgeHours });

    try {
      const tempDir = this.uploadDirs.temp;
      await this._ensureDirectory(tempDir);

      const files = await fs.readdir(tempDir);
      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const filename of files) {
        const filePath = path.join(tempDir, filename);
        const stats = await fs.stat(filePath);

        if (now - stats.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      debugLog.log('UPLOAD', 'Temp files cleaned', { deletedCount });

      return deletedCount;
    } catch (error) {
      debugLog.error('UPLOAD', 'Error cleaning temp files', sanitizeError(error, 'cleanupTempFiles'));
      throw error;
    }
  }
}

module.exports = new UploadService();
