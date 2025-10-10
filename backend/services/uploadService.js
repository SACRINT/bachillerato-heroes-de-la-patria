/**
 * 🎯 FASE 2A - UPLOAD SERVICE
 * Servicio de gestión de archivos para BGE
 * Upload, optimización y gestión de archivos multimedia
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class UploadService {
    constructor() {
        this.dbAvailable = false;
        this.db = null;
        this.uploadsPath = path.join(__dirname, '../../public/uploads');
        this.initialize();
    }

    async initialize() {
        try {
            // Intentar conexión con MySQL
            this.db = require('../config/database');
            const isConnected = await this.db.testConnection();

            if (isConnected) {
                this.dbAvailable = true;
                console.log('✅ Upload Service: MySQL disponible');
            } else {
                console.log('⚠️ Upload Service: Sin base de datos');
            }
        } catch (error) {
            console.log('⚠️ Upload Service: Sin base de datos -', error.message);
        }

        // Asegurar directorios de uploads
        await this.ensureDirectories();
    }

    // ============================================
    // INICIALIZACIÓN DE DIRECTORIOS
    // ============================================

    async ensureDirectories() {
        const dirs = [
            'uploads',
            'uploads/images',
            'uploads/images/thumbnails',
            'uploads/documents',
            'uploads/videos',
            'uploads/temp',
            'uploads/images/avisos',
            'uploads/images/noticias',
            'uploads/images/eventos',
            'uploads/images/comunicados',
            'uploads/documents/avisos',
            'uploads/documents/noticias',
            'uploads/documents/eventos',
            'uploads/documents/comunicados'
        ];

        for (const dir of dirs) {
            const fullPath = path.join(__dirname, '../../public', dir);
            try {
                await fs.access(fullPath);
            } catch {
                await fs.mkdir(fullPath, { recursive: true });
                console.log(`📁 Creado directorio: ${dir}`);
            }
        }
    }

    // ============================================
    // PROCESAMIENTO DE IMÁGENES
    // ============================================

    async processImage(file, category = 'general', userId) {
        try {
            const timestamp = Date.now();
            const originalName = path.parse(file.originalname).name;
            const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${safeName}_${timestamp}`;

            const outputDir = path.join(__dirname, '../../public/uploads/images', category);
            await fs.mkdir(outputDir, { recursive: true });

            // Obtener metadatos de la imagen original
            const metadata = await sharp(file.buffer).metadata();

            // Crear versión WebP optimizada
            const webpPath = path.join(outputDir, `${fileName}.webp`);
            await sharp(file.buffer)
                .resize(1920, 1080, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({
                    quality: 85,
                    progressive: true,
                    effort: 6
                })
                .toFile(webpPath);

            // Crear versión JPEG como fallback
            const jpegPath = path.join(outputDir, `${fileName}.jpg`);
            await sharp(file.buffer)
                .resize(1920, 1080, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({
                    quality: 85,
                    progressive: true,
                    mozjpeg: true
                })
                .toFile(jpegPath);

            // Crear thumbnail
            const thumbnailDir = path.join(__dirname, '../../public/uploads/images/thumbnails');
            const thumbnailPath = path.join(thumbnailDir, `${fileName}_thumb.webp`);
            await sharp(file.buffer)
                .resize(300, 200, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({
                    quality: 80
                })
                .toFile(thumbnailPath);

            // Crear versión móvil (opcional)
            const mobilePath = path.join(outputDir, `${fileName}_mobile.webp`);
            await sharp(file.buffer)
                .resize(800, 600, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({
                    quality: 75
                })
                .toFile(mobilePath);

            // Obtener información de archivos creados
            const webpStats = await fs.stat(webpPath);
            const jpegStats = await fs.stat(jpegPath);
            const thumbnailStats = await fs.stat(thumbnailPath);
            const mobileStats = await fs.stat(mobilePath);

            const fileInfo = {
                original_name: file.originalname,
                file_name: fileName,
                category,
                file_size: file.size,
                mime_type: file.mimetype,
                width: metadata.width,
                height: metadata.height,
                webp_url: `/uploads/images/${category}/${fileName}.webp`,
                jpeg_url: `/uploads/images/${category}/${fileName}.jpg`,
                thumbnail_url: `/uploads/images/thumbnails/${fileName}_thumb.webp`,
                mobile_url: `/uploads/images/${category}/${fileName}_mobile.webp`,
                uploaded_by: userId,
                upload_date: new Date(),
                processed_sizes: {
                    original: file.size,
                    webp: webpStats.size,
                    jpeg: jpegStats.size,
                    thumbnail: thumbnailStats.size,
                    mobile: mobileStats.size
                },
                compression_ratio: ((file.size - webpStats.size) / file.size * 100).toFixed(2)
            };

            // Guardar información en base de datos si está disponible
            const savedFile = await this.saveFileInfo(fileInfo);

            return {
                id: savedFile?.id || `img_${timestamp}`,
                urls: {
                    webp: fileInfo.webp_url,
                    jpeg: fileInfo.jpeg_url,
                    thumbnail: fileInfo.thumbnail_url,
                    mobile: fileInfo.mobile_url
                },
                metadata: {
                    original_size: file.size,
                    optimized_size: webpStats.size,
                    compression_ratio: fileInfo.compression_ratio + '%',
                    dimensions: `${metadata.width}x${metadata.height}`,
                    formats: ['WebP', 'JPEG', 'Thumbnail', 'Mobile']
                }
            };

        } catch (error) {
            console.error('Error procesando imagen:', error);
            throw error;
        }
    }

    async processDocument(file, category = 'general', userId) {
        try {
            const timestamp = Date.now();
            const originalName = path.parse(file.originalname).name;
            const extension = path.extname(file.originalname);
            const safeName = originalName.replace(/[^a-zA-Z0-9\-_]/g, '_');
            const fileName = `${safeName}_${timestamp}${extension}`;

            const outputDir = path.join(__dirname, '../../public/uploads/documents', category);
            await fs.mkdir(outputDir, { recursive: true });

            // Guardar archivo
            const filePath = path.join(outputDir, fileName);
            await fs.writeFile(filePath, file.buffer);

            const fileInfo = {
                original_name: file.originalname,
                file_name: fileName,
                category,
                file_size: file.size,
                mime_type: file.mimetype,
                file_url: `/uploads/documents/${category}/${fileName}`,
                uploaded_by: userId,
                upload_date: new Date()
            };

            const savedFile = await this.saveFileInfo(fileInfo);

            return {
                id: savedFile?.id || `doc_${timestamp}`,
                url: fileInfo.file_url,
                metadata: {
                    original_name: file.originalname,
                    size: file.size,
                    type: file.mimetype,
                    extension: extension
                }
            };

        } catch (error) {
            console.error('Error procesando documento:', error);
            throw error;
        }
    }

    // ============================================
    // GESTIÓN DE ARCHIVOS EN BASE DE DATOS
    // ============================================

    async saveFileInfo(fileInfo) {
        if (!this.dbAvailable) {
            console.log('⚠️ No se pudo guardar info del archivo: DB no disponible');
            return { id: null };
        }

        try {
            const query = `
                INSERT INTO cms_files (
                    original_name, file_name, category, alt_text, title,
                    file_size, mime_type, width, height,
                    webp_url, jpeg_url, file_url, thumbnail_url,
                    uploaded_by, upload_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                fileInfo.original_name,
                fileInfo.file_name,
                fileInfo.category || 'general',
                fileInfo.alt_text || null,
                fileInfo.title || null,
                fileInfo.file_size,
                fileInfo.mime_type,
                fileInfo.width || null,
                fileInfo.height || null,
                fileInfo.webp_url || null,
                fileInfo.jpeg_url || null,
                fileInfo.file_url || null,
                fileInfo.thumbnail_url || null,
                fileInfo.uploaded_by,
                fileInfo.upload_date || new Date()
            ];

            const [result] = await this.db.execute(query, params);

            return { id: result.insertId };

        } catch (error) {
            console.error('Error guardando información del archivo:', error);
            return { id: null };
        }
    }

    async getFiles(filters = {}) {
        if (!this.dbAvailable) {
            return { files: [], total: 0 };
        }

        try {
            let query = `
                SELECT
                    id, original_name, file_name, category, alt_text, title,
                    file_size, mime_type, width, height,
                    webp_url, jpeg_url, file_url, thumbnail_url,
                    uploaded_by, upload_date
                FROM cms_files
                WHERE 1=1
            `;
            const params = [];

            // Aplicar filtros
            if (filters.category) {
                query += ' AND category = ?';
                params.push(filters.category);
            }

            if (filters.type) {
                query += ' AND mime_type LIKE ?';
                params.push(`${filters.type}%`);
            }

            if (filters.search) {
                query += ' AND (original_name LIKE ? OR title LIKE ?)';
                params.push(`%${filters.search}%`, `%${filters.search}%`);
            }

            query += ' ORDER BY upload_date DESC';

            // Paginación
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(filters.offset);
            }

            const [files] = await this.db.execute(query, params);

            // Contar total
            let countQuery = 'SELECT COUNT(*) as total FROM cms_files WHERE 1=1';
            const countParams = [];

            if (filters.category) {
                countQuery += ' AND category = ?';
                countParams.push(filters.category);
            }

            if (filters.type) {
                countQuery += ' AND mime_type LIKE ?';
                countParams.push(`${filters.type}%`);
            }

            const [countResult] = await this.db.execute(countQuery, countParams);
            const total = countResult[0].total;

            return { files, total };

        } catch (error) {
            console.error('Error obteniendo archivos:', error);
            throw error;
        }
    }

    async deleteFile(id) {
        if (!this.dbAvailable) {
            return false;
        }

        try {
            // Obtener información del archivo antes de eliminarlo
            const fileQuery = 'SELECT * FROM cms_files WHERE id = ?';
            const [files] = await this.db.execute(fileQuery, [id]);

            if (files.length === 0) {
                return false;
            }

            const file = files[0];

            // Eliminar archivos físicos
            const filesToDelete = [];

            if (file.webp_url) {
                filesToDelete.push(path.join(__dirname, '../../public', file.webp_url));
            }
            if (file.jpeg_url) {
                filesToDelete.push(path.join(__dirname, '../../public', file.jpeg_url));
            }
            if (file.file_url) {
                filesToDelete.push(path.join(__dirname, '../../public', file.file_url));
            }
            if (file.thumbnail_url) {
                filesToDelete.push(path.join(__dirname, '../../public', file.thumbnail_url));
            }

            // Intentar eliminar archivos físicos
            for (const filePath of filesToDelete) {
                try {
                    await fs.unlink(filePath);
                } catch (error) {
                    console.warn(`No se pudo eliminar archivo físico: ${filePath}`);
                }
            }

            // Eliminar registro de la base de datos
            const deleteQuery = 'DELETE FROM cms_files WHERE id = ?';
            const [result] = await this.db.execute(deleteQuery, [id]);

            return result.affectedRows > 0;

        } catch (error) {
            console.error('Error eliminando archivo:', error);
            throw error;
        }
    }

    // ============================================
    // OPTIMIZACIÓN Y UTILIDADES
    // ============================================

    async optimizeImage(id, options = {}) {
        if (!this.dbAvailable) {
            return null;
        }

        try {
            // Obtener información del archivo
            const fileQuery = 'SELECT * FROM cms_files WHERE id = ?';
            const [files] = await this.db.execute(fileQuery, [id]);

            if (files.length === 0) {
                return null;
            }

            const file = files[0];

            if (!file.webp_url) {
                throw new Error('El archivo no es una imagen');
            }

            // Ruta del archivo original
            const originalPath = path.join(__dirname, '../../public', file.webp_url);

            // Crear nuevas versiones optimizadas
            const timestamp = Date.now();
            const fileName = path.parse(file.file_name).name + '_opt_' + timestamp;
            const category = file.category;
            const outputDir = path.join(__dirname, '../../public/uploads/images', category);

            // Aplicar nuevas optimizaciones
            const quality = options.quality || 85;
            const width = options.width || null;
            const height = options.height || null;

            let sharpInstance = sharp(originalPath);

            if (width || height) {
                sharpInstance = sharpInstance.resize(width, height, {
                    fit: 'inside',
                    withoutEnlargement: true
                });
            }

            // Crear nueva versión WebP
            const newWebpPath = path.join(outputDir, `${fileName}.webp`);
            await sharpInstance
                .webp({
                    quality: quality,
                    progressive: true,
                    effort: 6
                })
                .toFile(newWebpPath);

            // Actualizar base de datos con nueva información
            const updateQuery = `
                UPDATE cms_files
                SET webp_url = ?, updated_at = NOW()
                WHERE id = ?
            `;

            const newWebpUrl = `/uploads/images/${category}/${fileName}.webp`;
            await this.db.execute(updateQuery, [newWebpUrl, id]);

            // Obtener estadísticas del nuevo archivo
            const stats = await fs.stat(newWebpPath);

            return {
                id,
                url: newWebpUrl,
                old_size: file.file_size,
                new_size: stats.size,
                compression_improvement: ((file.file_size - stats.size) / file.file_size * 100).toFixed(2) + '%'
            };

        } catch (error) {
            console.error('Error optimizando imagen:', error);
            throw error;
        }
    }

    async cleanupOrphanedFiles() {
        const results = {
            filesDeleted: 0,
            spaceFreed: 0
        };

        try {
            // Obtener lista de archivos en base de datos
            const dbFiles = new Set();

            if (this.dbAvailable) {
                const query = 'SELECT webp_url, jpeg_url, file_url, thumbnail_url FROM cms_files';
                const [files] = await this.db.execute(query);

                files.forEach(file => {
                    if (file.webp_url) dbFiles.add(file.webp_url);
                    if (file.jpeg_url) dbFiles.add(file.jpeg_url);
                    if (file.file_url) dbFiles.add(file.file_url);
                    if (file.thumbnail_url) dbFiles.add(file.thumbnail_url);
                });
            }

            // Escanear directorios de uploads
            const uploadDirs = [
                'uploads/images',
                'uploads/images/thumbnails',
                'uploads/documents'
            ];

            for (const dir of uploadDirs) {
                const fullPath = path.join(__dirname, '../../public', dir);

                try {
                    const files = await fs.readdir(fullPath, { recursive: true });

                    for (const file of files) {
                        const filePath = path.join(fullPath, file);
                        const relativePath = `/${dir}/${file}`.replace(/\\/g, '/');

                        const stats = await fs.stat(filePath);

                        if (stats.isFile() && !dbFiles.has(relativePath)) {
                            // Archivo huérfano encontrado
                            try {
                                await fs.unlink(filePath);
                                results.filesDeleted++;
                                results.spaceFreed += stats.size;
                            } catch (deleteError) {
                                console.warn(`No se pudo eliminar archivo huérfano: ${filePath}`);
                            }
                        }
                    }
                } catch (dirError) {
                    console.warn(`No se pudo escanear directorio: ${dir}`);
                }
            }

            console.log(`🧹 Limpieza completada: ${results.filesDeleted} archivos eliminados, ${(results.spaceFreed / 1024 / 1024).toFixed(2)} MB liberados`);

            return results;

        } catch (error) {
            console.error('Error en limpieza de archivos:', error);
            throw error;
        }
    }

    // ============================================
    // UTILIDADES DE IMAGEN
    // ============================================

    async createThumbnail(imagePath, outputPath, size = { width: 300, height: 200 }) {
        try {
            await sharp(imagePath)
                .resize(size.width, size.height, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({
                    quality: 80
                })
                .toFile(outputPath);

            return outputPath;
        } catch (error) {
            console.error('Error creando thumbnail:', error);
            throw error;
        }
    }

    async getImageMetadata(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = await fs.stat(imagePath);

            return {
                format: metadata.format,
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels,
                density: metadata.density,
                hasAlpha: metadata.hasAlpha,
                fileSize: stats.size
            };
        } catch (error) {
            console.error('Error obteniendo metadatos de imagen:', error);
            throw error;
        }
    }

    async convertToWebP(inputPath, outputPath, quality = 85) {
        try {
            await sharp(inputPath)
                .webp({
                    quality: quality,
                    progressive: true,
                    effort: 6
                })
                .toFile(outputPath);

            return outputPath;
        } catch (error) {
            console.error('Error convirtiendo a WebP:', error);
            throw error;
        }
    }
}

// Singleton instance
let uploadServiceInstance = null;

const getUploadService = () => {
    if (!uploadServiceInstance) {
        uploadServiceInstance = new UploadService();
    }
    return uploadServiceInstance;
};

module.exports = getUploadService();