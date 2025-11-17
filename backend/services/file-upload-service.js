/**
 * 📤 FILE UPLOAD SERVICE - Cloud Storage con Cloudinary
 * Gestión de archivos y multimedia
 * Semana 11-12 - Features Avanzadas
 */

const cloudinary = require('cloudinary').v2;
const logger = require('../utils/winston-logger');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// =============================================================================
// SUBIDA DE ARCHIVOS
// =============================================================================

/**
 * Subir archivo a Cloudinary
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de subida
 * @returns {object} - Información del archivo subido
 */
async function uploadFile(file, options = {}) {
  const {
    folder = 'bge-uploads',
    resourceType = 'auto',
    transformation = null,
    tags = [],
    context = {},
  } = options;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: resourceType,
      transformation,
      tags,
      context,
      use_filename: true,
      unique_filename: true,
    });

    logger.info('[FILE-UPLOAD] Archivo subido a Cloudinary', {
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  } catch (error) {
    logger.logError(error, { context: 'uploadFile', fileName: file.originalname });
    throw new Error(`Error al subir archivo: ${error.message}`);
  }
}

/**
 * Subir imagen con transformaciones
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de transformación
 */
async function uploadImage(file, options = {}) {
  const { width = 800, height = 600, crop = 'limit', quality = 'auto', folder = 'bge-images' } = options;

  const transformation = [
    {
      width,
      height,
      crop,
      quality,
      fetch_format: 'auto',
    },
  ];

  return await uploadFile(file, {
    folder,
    resourceType: 'image',
    transformation,
    ...options,
  });
}

/**
 * Subir documento (PDF, Word, etc)
 * @param {object} file - Objeto de archivo (multer)
 * @param {string} category - Categoría del documento
 */
async function uploadDocument(file, category = 'general') {
  const allowedFormats = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
  const fileExtension = path.extname(file.originalname).slice(1).toLowerCase();

  if (!allowedFormats.includes(fileExtension)) {
    throw new Error(`Formato de archivo no permitido: ${fileExtension}`);
  }

  return await uploadFile(file, {
    folder: `bge-documents/${category}`,
    resourceType: 'raw',
    tags: ['document', category],
  });
}

/**
 * Subir video
 * @param {object} file - Objeto de archivo (multer)
 * @param {object} options - Opciones de video
 */
async function uploadVideo(file, options = {}) {
  const { folder = 'bge-videos', maxDuration = 600, quality = 'auto' } = options;

  const transformation = [
    {
      quality,
      fetch_format: 'auto',
    },
  ];

  return await uploadFile(file, {
    folder,
    resourceType: 'video',
    transformation,
    tags: ['video'],
    ...options,
  });
}

// =============================================================================
// GESTIÓN DE ARCHIVOS
// =============================================================================

/**
 * Obtener información de archivo
 * @param {string} publicId - ID público del archivo
 * @param {object} options - Opciones de recursos
 */
async function getFileInfo(publicId, options = {}) {
  try {
    const result = await cloudinary.api.resource(publicId, options);

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      size: result.bytes,
      width: result.width,
      height: result.height,
      createdAt: result.created_at,
      tags: result.tags,
      context: result.context,
    };
  } catch (error) {
    logger.logError(error, { context: 'getFileInfo', publicId });
    throw error;
  }
}

/**
 * Eliminar archivo
 * @param {string} publicId - ID público del archivo
 * @param {string} resourceType - Tipo de recurso (image, video, raw)
 */
async function deleteFile(publicId, resourceType = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    logger.info('[FILE-UPLOAD] Archivo eliminado de Cloudinary', {
      publicId,
      result: result.result,
    });

    return result.result === 'ok';
  } catch (error) {
    logger.logError(error, { context: 'deleteFile', publicId });
    throw error;
  }
}

/**
 * Actualizar tags de archivo
 * @param {string} publicId - ID público del archivo
 * @param {array} tags - Nuevos tags
 */
async function updateFileTags(publicId, tags) {
  try {
    await cloudinary.uploader.add_tag(tags.join(','), [publicId]);

    logger.info('[FILE-UPLOAD] Tags actualizados', { publicId, tags });
    return true;
  } catch (error) {
    logger.logError(error, { context: 'updateFileTags', publicId });
    throw error;
  }
}

// =============================================================================
// TRANSFORMACIONES
// =============================================================================

/**
 * Generar URL con transformaciones
 * @param {string} publicId - ID público del archivo
 * @param {object} transformations - Transformaciones a aplicar
 */
function getTransformedUrl(publicId, transformations = {}) {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = transformations;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
    secure: true,
  });
}

/**
 * Generar thumbnail
 * @param {string} publicId - ID público de la imagen
 * @param {number} size - Tamaño del thumbnail
 */
function getThumbnailUrl(publicId, size = 150) {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true,
  });
}

// =============================================================================
// GESTIÓN DE CARPETAS
// =============================================================================

/**
 * Listar archivos en carpeta
 * @param {string} folder - Nombre de la carpeta
 * @param {object} options - Opciones de listado
 */
async function listFilesInFolder(folder, options = {}) {
  const { maxResults = 100, type = 'upload', prefix = '' } = options;

  try {
    const result = await cloudinary.api.resources({
      type,
      prefix: folder + (prefix ? `/${prefix}` : ''),
      max_results: maxResults,
    });

    return result.resources.map((resource) => ({
      publicId: resource.public_id,
      url: resource.secure_url,
      format: resource.format,
      size: resource.bytes,
      createdAt: resource.created_at,
    }));
  } catch (error) {
    logger.logError(error, { context: 'listFilesInFolder', folder });
    throw error;
  }
}

/**
 * Eliminar carpeta completa
 * @param {string} folder - Nombre de la carpeta
 */
async function deleteFolder(folder) {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folder);

    logger.info('[FILE-UPLOAD] Carpeta eliminada de Cloudinary', {
      folder,
      deleted: result.deleted,
    });

    return result;
  } catch (error) {
    logger.logError(error, { context: 'deleteFolder', folder });
    throw error;
  }
}

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Validar tipo de archivo
 * @param {string} mimetype - MIME type del archivo
 * @param {array} allowedTypes - Tipos permitidos
 */
function validateFileType(mimetype, allowedTypes) {
  if (!allowedTypes.includes(mimetype)) {
    throw new Error(`Tipo de archivo no permitido: ${mimetype}`);
  }
  return true;
}

/**
 * Validar tamaño de archivo
 * @param {number} size - Tamaño del archivo en bytes
 * @param {number} maxSize - Tamaño máximo permitido (bytes)
 */
function validateFileSize(size, maxSize = 10 * 1024 * 1024) {
  // Default: 10MB
  if (size > maxSize) {
    throw new Error(`Archivo demasiado grande. Máximo: ${maxSize / 1024 / 1024}MB`);
  }
  return true;
}

/**
 * Obtener formato de archivo desde MIME type
 * @param {string} mimetype - MIME type
 */
function getFileFormat(mimetype) {
  const formatMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'video/mp4': 'mp4',
    'video/mpeg': 'mpeg',
  };

  return formatMap[mimetype] || 'unknown';
}

module.exports = {
  uploadFile,
  uploadImage,
  uploadDocument,
  uploadVideo,
  getFileInfo,
  deleteFile,
  updateFileTags,
  getTransformedUrl,
  getThumbnailUrl,
  listFilesInFolder,
  deleteFolder,
  validateFileType,
  validateFileSize,
  getFileFormat,
};
