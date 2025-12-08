/**
 * 🎯 UPLOADS ROUTES - Sistema de Archivos v2.0 - TypeScript
 * Gestión de subida de imágenes y documentos con optimización Sharp
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, NextFunction, Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireRole } from '../middleware/auth';
// @ts-ignore
import uploadService from '../services/uploadService';

// GDPR Logging
import { debugLog } from '../utils/debug-logger';
import { sanitizeError } from '../utils/sanitized-errors';

const router: Router = express.Router();

// ============================================
// CONFIGURACIÓN DE MULTER
// ============================================

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/webm', 'video/ogg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB
    fileFilter
});

const requireAdmin = requireRole(['admin', 'director', 'coordinador']);

interface RequestWithFile extends Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
    user?: { id: number; role: string };
}

// Ensure strict directory structure
const ensureDirectories = async () => {
    const dirs = [
        'uploads', 'uploads/images', 'uploads/images/thumbnails',
        'uploads/documents', 'uploads/videos', 'uploads/temp'
    ];
    for (const dir of dirs) {
        const fullPath = path.join(__dirname, '../../public', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
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
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req: RequestWithFile, res: Response): Promise<void> => {
    try {
        if (!req.file) { res.status(400).json({ success: false, error: 'No se proporcionó ningún archivo' }); return; }

        const { category = 'general', alt_text = '', title = '' } = req.body;
        if (!req.file.mimetype.startsWith('image/')) { res.status(400).json({ success: false, error: 'El archivo debe ser una imagen' }); return; }

        const timestamp = Date.now();
        const originalName = path.parse(req.file.originalname).name;
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const fileName = `${safeName}_${timestamp}`;
        const outputDir = path.join(__dirname, '../../public/uploads/images', category);

        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const optimizedPath = path.join(outputDir, `${fileName}.webp`);
        const jpegPath = path.join(outputDir, `${fileName}.jpg`);

        // Sharp Optimization
        await sharp(req.file.buffer).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toFile(optimizedPath);
        await sharp(req.file.buffer).resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toFile(jpegPath);

        const thumbnailPath = path.join(__dirname, '../../public/uploads/images/thumbnails', `${fileName}_thumb.webp`);
        await sharp(req.file.buffer).resize(300, 200, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbnailPath);

        const metadata = await sharp(req.file.buffer).metadata();

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
            uploaded_by: req.user!.id,
            upload_date: new Date()
        };

        const savedFile = await uploadService.saveFileInfo(fileInfo);

        res.json({
            success: true,
            message: 'Imagen subida exitosamente',
            data: {
                id: savedFile.id,
                urls: { webp: fileInfo.webp_url, jpeg: fileInfo.jpeg_url, thumbnail: fileInfo.thumbnail_url },
                metadata: { dimensions: `${metadata.width}x${metadata.height}`, format: 'WebP+JPEG' }
            }
        });

    } catch (error) {
        debugLog.error('UPLOADS', 'Error subiendo imagen', sanitizeError(error as Error, 'uploads'));
        res.status(500).json({ success: false, error: 'Error procesando imagen' });
    }
});

/**
 * POST /api/uploads/document
 */
router.post('/document', authenticateToken, requireAdmin, upload.single('document'), async (req: RequestWithFile, res: Response): Promise<void> => {
    try {
        if (!req.file) { res.status(400).json({ success: false, error: 'No se proporcionó archivo' }); return; }

        const { category = 'general', title = '', description = '' } = req.body;
        const allowedDocs = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedDocs.includes(req.file.mimetype)) { res.status(400).json({ success: false, error: 'Tipo de documento no permitido' }); return; }

        const timestamp = Date.now();
        const originalName = path.parse(req.file.originalname).name;
        const extension = path.extname(req.file.originalname);
        const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
        const fileName = `${safeName}_${timestamp}${extension}`;
        const outputDir = path.join(__dirname, '../../public/uploads/documents', category);

        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }
        const filePath = path.join(outputDir, fileName);
        await fs.promises.writeFile(filePath, req.file.buffer);

        const fileInfo = {
            original_name: req.file.originalname,
            file_name: fileName,
            category, title, description,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            file_url: `/uploads/documents/${category}/${fileName}`,
            uploaded_by: req.user!.id,
            upload_date: new Date()
        };

        const savedFile = await uploadService.saveFileInfo(fileInfo);
        res.json({ success: true, message: 'Documento subido', data: { id: savedFile.id, url: fileInfo.file_url } });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Error procesando documento' });
    }
});

/**
 * GET /api/uploads/files
 */
router.get('/files', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { category, type, limit = 20, offset = 0, search } = req.query as any;
        const result = await uploadService.getFiles({ category, type, search, limit: parseInt(limit), offset: parseInt(offset) });
        res.json({ success: true, data: result.files, total: result.total });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo archivos' });
    }
});

/**
 * POST /api/uploads/cleanup
 */
router.post('/cleanup', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await uploadService.cleanupOrphanedFiles();
        res.json({ success: true, message: 'Limpieza completada', data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error en limpieza' });
    }
});

// Error handling middleware specific to this router
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof multer.MulterError) {
        res.status(400).json({ success: false, error: error.message, code: error.code });
    } else if (error.message.includes('Tipo de archivo')) {
        res.status(400).json({ success: false, error: error.message });
    } else {
        next(error);
    }
});

export default router;
