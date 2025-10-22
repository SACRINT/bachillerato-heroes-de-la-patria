/**
 * 📤 API DE SUBIDA DE ARCHIVOS - PostgreSQL
 * Sistema de gestión de subida de imágenes para el CMS
 * Fecha: 18 Octubre 2025
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio de uploads si no existe
// __dirname es backend/routes, necesitamos subir a la raíz del proyecto
// const uploadsDir = path.join(__dirname, '../../public/uploads');
// if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
// }

// // Subdirectorios por tipo de contenido
// const contentDirs = ['noticias', 'eventos', 'avisos', 'comunicados', 'general'];
// contentDirs.forEach(dir => {
//     const fullPath = path.join(uploadsDir, dir);
//     if (!fs.existsSync(fullPath)) {
//         fs.mkdirSync(fullPath, { recursive: true });
//     }
// });

// Configuración de Multer para almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determinar subdirectorio basado en el tipo de contenido
        const contentType = req.body.contentType || req.query.contentType || 'general';
        const destinationPath = path.join(uploadsDir, contentType);
        cb(null, destinationPath);
    },
    filename: function (req, file, cb) {
        // Generar nombre único: timestamp-nombre-original
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        // Limpiar nombre de archivo
        const cleanName = nameWithoutExt
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // Remover acentos
            .replace(/[^a-z0-9]/g, '-')  // Reemplazar caracteres especiales
            .replace(/-+/g, '-')  // Remover guiones múltiples
            .substring(0, 50);  // Limitar longitud

        cb(null, cleanName + '-' + uniqueSuffix + ext);
    }
});

// Filtro de archivos - solo imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP, SVG)'));
    }
};

// Configurar Multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024  // Límite de 5MB
    },
    fileFilter: fileFilter
});

// =====================================================
// POST /api/upload/image - Subir imagen
// =====================================================
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó ningún archivo'
            });
        }

        const contentType = req.body.contentType || 'general';
        const imageUrl = `/uploads/${contentType}/${req.file.filename}`;

        console.log('✅ Imagen subida:', imageUrl);

        res.status(201).json({
            success: true,
            message: 'Imagen subida exitosamente',
            data: {
                url: imageUrl,
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
                contentType: contentType
            }
        });

    } catch (error) {
        console.error('❌ Error al subir imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir la imagen'
        });
    }
});

// =====================================================
// POST /api/upload/multiple - Subir múltiples imágenes
// =====================================================
router.post('/multiple', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionaron archivos'
            });
        }

        const contentType = req.body.contentType || 'general';
        const uploadedFiles = req.files.map(file => ({
            url: `/uploads/${contentType}/${file.filename}`,
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        }));

        console.log(`✅ ${uploadedFiles.length} imágenes subidas`);

        res.status(201).json({
            success: true,
            message: `${uploadedFiles.length} imágenes subidas exitosamente`,
            data: uploadedFiles
        });

    } catch (error) {
        console.error('❌ Error al subir imágenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al subir las imágenes'
        });
    }
});

// =====================================================
// DELETE /api/upload/image/:filename - Eliminar imagen
// =====================================================
router.delete('/image/:contentType/:filename', async (req, res) => {
    try {
        const { contentType, filename } = req.params;

        // Validar que el contentType sea válido
        if (!contentDirs.includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de contenido no válido'
            });
        }

        const filePath = path.join(uploadsDir, contentType, filename);

        // Verificar que el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Archivo no encontrado'
            });
        }

        // Eliminar archivo
        fs.unlinkSync(filePath);

        console.log('✅ Imagen eliminada:', filename);

        res.json({
            success: true,
            message: 'Imagen eliminada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error al eliminar imagen:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la imagen'
        });
    }
});

// =====================================================
// GET /api/upload/list/:contentType - Listar imágenes
// =====================================================
router.get('/list/:contentType', async (req, res) => {
    try {
        const { contentType } = req.params;

        // Validar que el contentType sea válido
        if (!contentDirs.includes(contentType)) {
            return res.status(400).json({
                success: false,
                error: 'Tipo de contenido no válido'
            });
        }

        const dirPath = path.join(uploadsDir, contentType);
        const files = fs.readdirSync(dirPath);

        const images = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
            })
            .map(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);

                return {
                    filename: file,
                    url: `/uploads/${contentType}/${file}`,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.created - a.created);  // Ordenar por fecha de creación descendente

        res.json({
            success: true,
            data: images,
            total: images.length
        });

    } catch (error) {
        console.error('❌ Error al listar imágenes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al listar las imágenes'
        });
    }
});

// Middleware de manejo de errores de Multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'El archivo es demasiado grande. Tamaño máximo: 5MB'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Demasiados archivos o nombre de campo incorrecto'
            });
        }
    }

    if (error.message.includes('Solo se permiten archivos de imagen')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    next(error);
});

module.exports = router;
