/**
 * IMAGE OPTIMIZATION SERVICE
 * BGE Héroes de la Patria
 * Servicio para optimización automática de imágenes
 * Fecha: 19 de Octubre, 2025
 */

// const sharp = require('sharp'); // ⚠️ Lazy loading to avoid bundling heavy binaries if unused
const devLogger = require('../utils/devLogger');
const fs = require('fs').promises;
const path = require('path');

class ImageOptimizationService {
    constructor(options = {}) {
        // 🚨 FIX VERCEL: Usar /tmp en entornos serverless
        // 🚨 FIX VERCEL: Usar /tmp en entornos serverless
        if (this.isServerlessEnvironment()) {
            this.uploadsDir = options.uploadsDir || '/tmp/uploads';
            devLogger.log('ℹ️ Image Optimization: Usando /tmp/uploads (entorno serverless)');
        } else {
            // OBFUSCATION: 'pub'+'lic' to prevent NFT tracing
            const p = 'pub' + 'lic';
            this.uploadsDir = options.uploadsDir || path.join(__dirname, '..', '..', p, 'uploads');
            devLogger.log('ℹ️ Image Optimization: Usando public/uploads (entorno local)');
        }

        this.thumbnailsDir = path.join(this.uploadsDir, 'thumbnails');
        this.webpDir = path.join(this.uploadsDir, 'webp');

        // Configuración de tamaños
        this.sizes = {
            thumbnail: { width: 200, height: 200 },
            small: { width: 400, height: 300 },
            medium: { width: 800, height: 600 },
            large: { width: 1200, height: 900 }
        };

        // Configuración de calidad
        this.quality = {
            jpeg: 85,
            webp: 90,
            png: 90
        };
    }

    /**
     * Detectar si estamos en entorno serverless (Vercel, AWS Lambda, etc.)
     * 🚨 FIX VERCEL: Detección de entornos serverless
     */
    isServerlessEnvironment() {
        return process.env.VERCEL === '1' ||
            process.env.VERCEL_ENV ||
            process.env.AWS_LAMBDA_FUNCTION_NAME ||
            process.env.AWS_EXECUTION_ENV ||
            process.env.NETLIFY === 'true' ||
            process.env.LAMBDA_TASK_ROOT ||
            typeof process.env.LAMBDA_RUNTIME_DIR !== 'undefined';
    }

    /**
     * Inicializar directorios necesarios
     */
    async init() {
        try {
            await fs.mkdir(this.uploadsDir, { recursive: true });
            await fs.mkdir(this.thumbnailsDir, { recursive: true });
            await fs.mkdir(this.webpDir, { recursive: true });
            devLogger.log('✅ Directorios de optimización de imágenes creados');
        } catch (error) {
            devLogger.error('❌ Error al crear directorios:', error);
            throw error;
        }
    }

    /**
     * Optimizar imagen y generar múltiples tamaños
     * @param {string} inputPath - Ruta de la imagen original
     * @param {string} filename - Nombre del archivo
     * @returns {Promise<Object>} - Rutas de las imágenes generadas
     */
    async optimizeImage(inputPath, filename) {
        try {
            const ext = path.extname(filename).toLowerCase();
            const baseName = path.basename(filename, ext);
            const results = {
                original: inputPath,
                optimized: {},
                webp: {},
                thumbnails: {}
            };

            // Leer metadata de la imagen
            let sharp;
            try {
                sharp = require('sharp');
            } catch (e) {
                devLogger.warn('Sharp not available for optimization');
                return { original: inputPath, error: 'Sharp module missing' }; // Graceful fallback
            }

            const metadata = await sharp(inputPath).metadata();
            devLogger.log(`📸 Procesando imagen: ${filename} (${metadata.width}x${metadata.height})`);

            // 1. Generar versión optimizada del tamaño original
            const optimizedPath = path.join(this.uploadsDir, `${baseName}_optimized${ext}`);
            await this.createOptimizedVersion(inputPath, optimizedPath, metadata.format);
            results.optimized.full = optimizedPath;

            // 2. Generar thumbnails en diferentes tamaños
            for (const [sizeName, dimensions] of Object.entries(this.sizes)) {
                const thumbPath = path.join(
                    this.thumbnailsDir,
                    `${baseName}_${sizeName}${ext}`
                );
                await this.createThumbnail(inputPath, thumbPath, dimensions, metadata.format);
                results.thumbnails[sizeName] = thumbPath;
            }

            // 3. Convertir a WebP (mejor compresión)
            const webpPath = path.join(this.webpDir, `${baseName}.webp`);
            await this.convertToWebP(inputPath, webpPath);
            results.webp.full = webpPath;

            // 4. Generar thumbnails WebP
            for (const [sizeName, dimensions] of Object.entries(this.sizes)) {
                const webpThumbPath = path.join(
                    this.webpDir,
                    `${baseName}_${sizeName}.webp`
                );
                await this.convertToWebP(inputPath, webpThumbPath, dimensions);
                results.webp[sizeName] = webpThumbPath;
            }

            devLogger.log(`✅ Imagen ${filename} optimizada exitosamente`);
            return results;

        } catch (error) {
            devLogger.error(`❌ Error optimizando imagen ${filename}:`, error);
            throw error;
        }
    }

    /**
     * Crear versión optimizada de la imagen
     */
    async createOptimizedVersion(inputPath, outputPath, format) {
        const sharp = require('sharp');
        const pipeline = sharp(inputPath);

        switch (format) {
            case 'jpeg':
            case 'jpg':
                await pipeline
                    .jpeg({ quality: this.quality.jpeg, progressive: true })
                    .toFile(outputPath);
                break;

            case 'png':
                await pipeline
                    .png({ quality: this.quality.png, compressionLevel: 9 })
                    .toFile(outputPath);
                break;

            default:
                await pipeline.toFile(outputPath);
        }
    }

    /**
     * Crear thumbnail
     */
    async createThumbnail(inputPath, outputPath, dimensions, format) {
        const sharp = require('sharp');
        const pipeline = sharp(inputPath)
            .resize(dimensions.width, dimensions.height, {
                fit: 'cover',
                position: 'center'
            });

        switch (format) {
            case 'jpeg':
            case 'jpg':
                await pipeline
                    .jpeg({ quality: this.quality.jpeg })
                    .toFile(outputPath);
                break;

            case 'png':
                await pipeline
                    .png({ quality: this.quality.png })
                    .toFile(outputPath);
                break;

            default:
                await pipeline.toFile(outputPath);
        }
    }

    /**
     * Convertir imagen a WebP
     */
    async convertToWebP(inputPath, outputPath, dimensions = null) {
        const sharp = require('sharp');
        const pipeline = sharp(inputPath);

        if (dimensions) {
            pipeline.resize(dimensions.width, dimensions.height, {
                fit: 'cover',
                position: 'center'
            });
        }

        await pipeline
            .webp({ quality: this.quality.webp })
            .toFile(outputPath);
    }

    /**
     * Optimización batch de múltiples imágenes
     */
    async optimizeBatch(imagePaths) {
        const results = [];
        const errors = [];

        for (const imagePath of imagePaths) {
            try {
                const filename = path.basename(imagePath);
                const result = await this.optimizeImage(imagePath, filename);
                results.push({ filename, success: true, ...result });
            } catch (error) {
                errors.push({ filename: path.basename(imagePath), error: error.message });
            }
        }

        return {
            total: imagePaths.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        };
    }

    /**
     * Obtener estadísticas de optimización (ahorro de espacio)
     */
    async getOptimizationStats(originalPath, optimizedPath) {
        try {
            const originalStats = await fs.stat(originalPath);
            const optimizedStats = await fs.stat(optimizedPath);

            const originalSize = originalStats.size;
            const optimizedSize = optimizedStats.size;
            const savedBytes = originalSize - optimizedSize;
            const savedPercent = ((savedBytes / originalSize) * 100).toFixed(2);

            return {
                originalSize,
                optimizedSize,
                savedBytes,
                savedPercent: parseFloat(savedPercent),
                ratio: (optimizedSize / originalSize).toFixed(2)
            };
        } catch (error) {
            devLogger.error('Error calculando estadísticas:', error);
            return null;
        }
    }

    /**
     * Limpiar archivos antiguos (garbage collection)
     */
    async cleanOldImages(daysOld = 30) {
        try {
            const now = Date.now();
            const maxAge = daysOld * 24 * 60 * 60 * 1000;
            let deletedCount = 0;

            const dirs = [this.uploadsDir, this.thumbnailsDir, this.webpDir];

            for (const dir of dirs) {
                const files = await fs.readdir(dir);

                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await fs.stat(filePath);

                    if (now - stats.mtimeMs > maxAge) {
                        await fs.unlink(filePath);
                        deletedCount++;
                    }
                }
            }

            devLogger.log(`🗑️ Limpiados ${deletedCount} archivos antiguos (> ${daysOld} días)`);
            return deletedCount;

        } catch (error) {
            devLogger.error('Error limpiando archivos antiguos:', error);
            throw error;
        }
    }

    /**
     * Generar imagen responsive (srcset)
     */
    async generateResponsiveSet(inputPath, filename) {
        const baseName = path.basename(filename, path.extname(filename));
        const srcset = [];

        // Generar versiones para diferentes densidades de píxeles
        const densities = [1, 1.5, 2, 3];

        for (const density of densities) {
            const width = Math.round(800 * density);
            const outputPath = path.join(
                this.uploadsDir,
                `${baseName}_${width}w.webp`
            );

            await sharp(inputPath)
                .resize(width, null, { withoutEnlargement: true })
                .webp({ quality: this.quality.webp })
                .toFile(outputPath);

            srcset.push(`${outputPath} ${width}w`);
        }

        return srcset.join(', ');
    }
}

module.exports = ImageOptimizationService;
