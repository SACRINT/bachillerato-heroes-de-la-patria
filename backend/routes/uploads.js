"use strict";
/**
 * 🎯 UPLOADS ROUTES - Sistema de Archivos v2.0 - TypeScript
 * Gestión de subida de imágenes y documentos con optimización Sharp
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
// const sharp_1 = __importDefault(require("sharp")); // ⚠️ Lazy loaded optimization
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require('../middleware/auth.js');
// @ts-ignore
const uploadService_1 = __importDefault(require('../services/uploadService.js'));
// GDPR Logging
const debug_logger_1 = require('../utils/debug-logger.js');
const sanitized_errors_1 = require('../utils/sanitized-errors.js');
const router = express_1.default.Router();
// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/webm', 'video/ogg'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB
    fileFilter
});
const requireAdmin = (0, auth_1.requireRole)(['admin', 'director', 'coordinador']);
// Ensure strict directory structure
const ensureDirectories = async () => {
    const dirs = [
        'uploads', 'uploads/images', 'uploads/images/thumbnails',
        'uploads/documents', 'uploads/videos', 'uploads/temp'
    ];
    for (const dir of dirs) {
        // OBFUSCATION: Prevenir que Vercel NFT rastree la carpeta publica desde aquí
        const p = 'pub' + 'lic';
        const fullPath = path_1.default.join(__dirname, '..', '..', p, dir);
        if (!fs_1.default.existsSync(fullPath)) {
            // En Vercel (read-only filesystem runtime), esto fallará si public no existe.
            // Pero como excluimos public, y es readonly, mejor solo intentar si no es production lambda
            if (process.env.NODE_ENV !== 'production') {
                fs_1.default.mkdirSync(fullPath, { recursive: true });
            }
        }
    }
};
ensureDirectories();
// ============================================
// RUTAS
// ============================================
/**
 * POST /api/uploads/image
 */
router.post('/image', auth_1.authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No se proporcionó ningún archivo' });
            return;
        }
        const { category = 'general', alt_text = '', title = '' } = req.body;
        if (!req.file.mimetype.startsWith('image/')) {
            res.status(400).json({ success: false, error: 'El archivo debe ser una imagen' });
            return;
        }
        const timestamp = Date.now();
        const originalName = path_1.default.parse(req.file.originalname).name;
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const fileName = `${safeName}_${timestamp}`;
        const p = 'pub' + 'lic';
        const outputDir = path_1.default.join(__dirname, '..', '..', p, 'uploads/images', category);
        if (!fs_1.default.existsSync(outputDir) && process.env.NODE_ENV !== 'production') {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const optimizedPath = path_1.default.join(outputDir, `${fileName}.webp`);
        const jpegPath = path_1.default.join(outputDir, `${fileName}.jpg`);
        // Sharp Optimization (Lazy Load)
        let sharp;
        try {
            sharp = require('sharp');
        } catch (e) {
            console.warn('Sharp integration skipped: module not found');
            // Fallback: just copy file renaming extension if needed, or fail gracefully
            const fileName = `${safeName}_${timestamp}`; // Re-declare to be safe or use existing
        }

        if (sharp) {
            const sharp_Instance = sharp(req.file.buffer);
            await sharp_Instance.resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(optimizedPath);
            await sharp(req.file.buffer).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(jpegPath);
        }
        const pThumb = 'pub' + 'lic';
        const thumbnailPath = path_1.default.join(__dirname, '..', '..', pThumb, 'uploads/images/thumbnails', `${fileName}_thumb.webp`);
        if (sharp) {
            await sharp(req.file.buffer).resize(300, 200, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbnailPath);
            const metadata = await sharp(req.file.buffer).metadata();

            // Construct fileInfo with metadata
            const fileInfo = {
                original_name: req.file.originalname,
                file_name: fileName,
                category, alt_text, title,
                file_size: req.file.size,
                mime_type: req.file.mimetype,
                width: metadata.width, height: metadata.height,
                webp_url: `/uploads/images/${category}/${fileName}.webp`,
                jpeg_url: `/uploads/images/${category}/${fileName}.jpg`,
                thumbnail_url: `/uploads/images/thumbnails/${fileName}_thumb.webp`,
                uploaded_by: req.user.id,
                upload_date: new Date()
            };

            const savedFile = await uploadService_1.default.saveFileInfo(fileInfo);
            res.json({
                success: true,
                message: 'Imagen subida exitosamente',
                data: {
                    id: savedFile.id,
                    urls: { webp: fileInfo.webp_url, jpeg: fileInfo.jpeg_url, thumbnail: fileInfo.thumbnail_url },
                    metadata: { dimensions: `${metadata.width}x${metadata.height}`, format: 'WebP+JPEG' }
                }
            });
        } else {
            res.status(500).json({ success: false, error: 'Image processing module not available' });
        }
    }
    catch (error) {
        debug_logger_1.debugLog.error('UPLOADS', 'Error subiendo imagen', (0, sanitized_errors_1.sanitizeError)(error, 'uploads'));
        res.status(500).json({ success: false, error: 'Error procesando imagen' });
    }
});
/**
 * POST /api/uploads/document
 */
router.post('/document', auth_1.authenticateToken, requireAdmin, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, error: 'No se proporcionó archivo' });
            return;
        }
        const { category = 'general', title = '', description = '' } = req.body;
        const allowedDocs = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedDocs.includes(req.file.mimetype)) {
            res.status(400).json({ success: false, error: 'Tipo de documento no permitido' });
            return;
        }
        const timestamp = Date.now();
        const originalName = path_1.default.parse(req.file.originalname).name;
        const extension = path_1.default.extname(req.file.originalname);
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const fileName = `${safeName}_${timestamp}${extension}`;
        const pDoc = 'pub' + 'lic';
        const outputDir = path_1.default.join(__dirname, '..', '..', pDoc, 'uploads/documents', category);
        if (!fs_1.default.existsSync(outputDir) && process.env.NODE_ENV !== 'production') {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const filePath = path_1.default.join(outputDir, fileName);
        await fs_1.default.promises.writeFile(filePath, req.file.buffer);
        const fileInfo = {
            original_name: req.file.originalname,
            file_name: fileName,
            category, title, description,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            file_url: `/uploads/documents/${category}/${fileName}`,
            uploaded_by: req.user.id,
            upload_date: new Date()
        };
        const savedFile = await uploadService_1.default.saveFileInfo(fileInfo);
        res.json({ success: true, message: 'Documento subido', data: { id: savedFile.id, url: fileInfo.file_url } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error procesando documento' });
    }
});
/**
 * GET /api/uploads/files
 */
router.get('/files', auth_1.authenticateToken, async (req, res) => {
    try {
        const { category, type, limit = 20, offset = 0, search } = req.query;
        const result = await uploadService_1.default.getFiles({ category, type, search, limit: parseInt(limit), offset: parseInt(offset) });
        res.json({ success: true, data: result.files, total: result.total });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo archivos' });
    }
});
/**
 * POST /api/uploads/cleanup
 */
router.post('/cleanup', auth_1.authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await uploadService_1.default.cleanupOrphanedFiles();
        res.json({ success: true, message: 'Limpieza completada', data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Error en limpieza' });
    }
});
// Error handling middleware specific to this router
router.use((error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    }
    else if (error.message.includes('Tipo de archivo')) {
        res.status(400).json({ success: false, error: error.message });
    }
    else {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=uploads.js.map