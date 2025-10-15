/**
 * 🎯 FASE 2A - UPLOADS ROUTES
 * Sistema de gestión de archivos para BGE
 * Upload de imágenes con optimización automática
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken, requireRole } = require('../middleware/auth');

// Servicios
const uploadService = require('../services/uploadService');

// ============================================
// CONFIGURACIÓN DE MULTER PARA UPLOADS
// ============================================

// Configuración de almacenamiento
const storage = multer.memoryStorage();

// Filtros de archivos permitidos
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        videos: ['video/mp4', 'video/webm', 'video/ogg']
    };

    const allAllowed = [...allowedTypes.images, ...allowedTypes.documents, ...allowedTypes.videos];

    if (allAllowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
    }
};

// Configuración de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
        files: 5 // Máximo 5 archivos simultáneos
    },
    fileFilter: fileFilter
});

// ============================================
// MIDDLEWARE DE UPLOADS
// ============================================

const requireAdmin = requireRole(['admin', 'director', 'coordinador']);

// Crear directorios si no existen
const ensureDirectories = async () => {
    const dirs = [
        'uploads',
        'uploads/images',
        'uploads/images/thumbnails',
        'uploads/documents',
        'uploads/videos',
        'uploads/temp'
    ];

    for (const dir of dirs) {
        try {
            await fs.access(path.join(__dirname, '../../public', dir));
        } catch {
            await fs.mkdir(path.join(__dirname, '../../public', dir), { recursive: true });
        }
    }
};

// Asegurar directorios al inicializar
ensureDirectories();

// ============================================
// RUTAS DE UPLOAD
// ============================================

/**
 * @swagger
 * /api/uploads/image:
 *   post:
 *     summary: Subir imagen con optimización automática
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Archivo de imagen
 *       - in: formData
 *         name: category
 *         type: string
 *         description: Categoría de la imagen
 *       - in: formData
 *         name: alt_text
 *         type: string
 *         description: Texto alternativo
 *     responses:
 *       200:
 *         description: Imagen subida y optimizada exitosamente
 *       400:
 *         description: Error en el archivo
 *       401:
 *         description: No autorizado
 */
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        const { category = 'general', alt_text = '', title = '' } = req.body;

        // Verificar que es una imagen
        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                error: 'El archivo debe ser una imagen'
            });
        }

        // Procesar imagen con Sharp
        const timestamp = Date.now();
        const originalName = path.parse(req.file.originalname).name;
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');

        const fileName = `${safeName}_${timestamp}`;
        const outputDir = path.join(__dirname, '../../public/uploads/images', category);

        // Crear directorio de categoría si no existe
        await fs.mkdir(outputDir, { recursive: true });

        // Procesar imagen original (optimizada)
        const optimizedPath = path.join(outputDir, `${fileName}.webp`);
        const jpegPath = path.join(outputDir, `${fileName}.jpg`);

        // Crear versión WebP optimizada
        await sharp(req.file.buffer)
            .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({
                quality: 85,
                progressive: true
            })
            .toFile(optimizedPath);

        // Crear versión JPEG como fallback
        await sharp(req.file.buffer)
            .resize(1920, 1080, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: 85,
                progressive: true
            })
            .toFile(jpegPath);

        // Crear thumbnail
        const thumbnailPath = path.join(__dirname, '../../public/uploads/images/thumbnails', `${fileName}_thumb.webp`);
        await sharp(req.file.buffer)
            .resize(300, 200, {
                fit: 'cover',
                position: 'center'
            })
            .webp({
                quality: 80
            })
            .toFile(thumbnailPath);

        // Obtener información de la imagen
        const metadata = await sharp(req.file.buffer).metadata();

        // Guardar información en la base de datos
        const fileInfo = {
            original_name: req.file.originalname,
            file_name: fileName,
            category,
            alt_text,
            title,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            width: metadata.width,
            height: metadata.height,
            webp_url: `/uploads/images/${category}/${fileName}.webp`,
            jpeg_url: `/uploads/images/${category}/${fileName}.jpg`,
            thumbnail_url: `/uploads/images/thumbnails/${fileName}_thumb.webp`,
            uploaded_by: req.user.id,
            upload_date: new Date()
        };

        const savedFile = await uploadService.saveFileInfo(fileInfo);

        res.json({
            success: true,
            message: 'Imagen subida y optimizada exitosamente',
            data: {
                id: savedFile.id,
                urls: {
                    webp: fileInfo.webp_url,
                    jpeg: fileInfo.jpeg_url,
                    thumbnail: fileInfo.thumbnail_url
                },
                metadata: {
                    original_size: req.file.size,
                    dimensions: `${metadata.width}x${metadata.height}`,
                    format: 'WebP + JPEG fallback'
                }
            }
        });

    } catch (error) {
        console.error('Error subiendo imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando imagen',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/uploads/document:
 *   post:
 *     summary: Subir documento
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/document', authenticateToken, requireAdmin, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        const { category = 'general', title = '', description = '' } = req.body;

        // Verificar que es un documento permitido
        const allowedDocs = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedDocs.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de documento no permitido'
            });
        }

        const timestamp = Date.now();
        const originalName = path.parse(req.file.originalname).name;
        const extension = path.extname(req.file.originalname);
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');

        const fileName = `${safeName}_${timestamp}${extension}`;
        const outputDir = path.join(__dirname, '../../public/uploads/documents', category);

        // Crear directorio si no existe
        await fs.mkdir(outputDir, { recursive: true });

        // Guardar archivo
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, req.file.buffer);

        // Guardar información en la base de datos
        const fileInfo = {
            original_name: req.file.originalname,
            file_name: fileName,
            category,
            title,
            description,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            file_url: `/uploads/documents/${category}/${fileName}`,
            uploaded_by: req.user.id,
            upload_date: new Date()
        };

        const savedFile = await uploadService.saveFileInfo(fileInfo);

        res.json({
            success: true,
            message: 'Documento subido exitosamente',
            data: {
                id: savedFile.id,
                url: fileInfo.file_url,
                metadata: {
                    original_name: req.file.originalname,
                    size: req.file.size,
                    type: req.file.mimetype
                }
            }
        });

    } catch (error) {
        console.error('Error subiendo documento:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando documento',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/uploads/multiple:
 *   post:
 *     summary: Subir múltiples archivos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/multiple', authenticateToken, requireAdmin, upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron archivos'
            });
        }

        const { category = 'general' } = req.body;
        const results = [];
        const errors = [];

        for (let i = 0; i < req.files.length; i++) {
            try {
                const file = req.files[i];

                if (file.mimetype.startsWith('image/')) {
                    // Procesar como imagen
                    const result = await uploadService.processImage(file, category, req.user.id);
                    results.push(result);
                } else {
                    // Procesar como documento
                    const result = await uploadService.processDocument(file, category, req.user.id);
                    results.push(result);
                }
            } catch (error) {
                errors.push({
                    file: req.files[i].originalname,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `${results.length} archivos procesados exitosamente`,
            data: results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error en upload múltiple:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando archivos',
            message: error.message
        });
    }
});

// ============================================
// RUTAS DE GESTIÓN DE ARCHIVOS
// ============================================

/**
 * @swagger
 * /api/uploads/files:
 *   get:
 *     summary: Listar archivos subidos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.get('/files', authenticateToken, async (req, res) => {
    try {
        const {
            category,
            type,
            limit = 20,
            offset = 0,
            search
        } = req.query;

        const filters = {
            category,
            type,
            search,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };

        const result = await uploadService.getFiles(filters);

        res.json({
            success: true,
            data: result.files,
            total: result.total,
            pagination: {
                limit: filters.limit,
                offset: filters.offset,
                total: result.total,
                pages: Math.ceil(result.total / filters.limit)
            }
        });
    } catch (error) {
        console.error('Error obteniendo archivos:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/uploads/files/{id}:
 *   delete:
 *     summary: Eliminar archivo
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/files/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await uploadService.deleteFile(id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Archivo eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message
        });
    }
});

// ============================================
// OPTIMIZACIÓN Y UTILIDADES
// ============================================

/**
 * @swagger
 * /api/uploads/optimize/{id}:
 *   post:
 *     summary: Reoptimizar imagen existente
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/optimize/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { quality = 85, width, height } = req.body;

        const result = await uploadService.optimizeImage(id, {
            quality,
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Imagen no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Imagen reoptimizada exitosamente',
            data: result
        });
    } catch (error) {
        console.error('Error reoptimizando imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error procesando imagen',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/uploads/cleanup:
 *   post:
 *     summary: Limpiar archivos huérfanos
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 */
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await uploadService.cleanupOrphanedFiles();

        res.json({
            success: true,
            message: 'Limpieza completada exitosamente',
            data: {
                filesDeleted: result.filesDeleted,
                spaceFreed: result.spaceFreed
            }
        });
    } catch (error) {
        console.error('Error en limpieza:', error);
        res.status(500).json({
            success: false,
            error: 'Error en limpieza',
            message: error.message
        });
    }
});

// ============================================
// MANEJO DE ERRORES DE MULTER
// ============================================

router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'Archivo demasiado grande',
                    maxSize: '10MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Demasiados archivos',
                    maxFiles: 5
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Campo de archivo inesperado'
                });
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Error en upload',
                    message: error.message
                });
        }
    } else if (error.message.includes('Tipo de archivo no permitido')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    next(error);
});

module.exports = router;