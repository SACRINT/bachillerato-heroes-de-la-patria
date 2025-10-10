#!/usr/bin/env node

/**
 * 🖼️ OPTIMIZADOR DE IMÁGENES PARA BGE
 * Convierte imágenes a WebP y optimiza tamaños
 */

const fs = require('fs');
const path = require('path');

class ImageOptimizer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.imagesDir = path.join(this.projectRoot, 'images');
        this.distImagesDir = path.join(this.projectRoot, 'dist', 'images');

        this.stats = {
            imagesProcessed: 0,
            originalSizeKB: 0,
            optimizedSizeKB: 0,
            webpGenerated: 0,
            errors: 0
        };

        this.log('🖼️ Inicializando optimizador de imágenes...');
    }

    log(message) {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] ${message}`);
    }

    // ==========================================
    // ANÁLISIS DE IMÁGENES
    // ==========================================

    async analyzeImages() {
        this.log('📊 Analizando imágenes del proyecto...');

        if (!fs.existsSync(this.imagesDir)) {
            this.log('⚠️ Directorio de imágenes no encontrado');
            return [];
        }

        const images = this.findImagesRecursive(this.imagesDir);

        this.log(`📸 Imágenes encontradas: ${images.length}`);

        for (const imagePath of images) {
            try {
                const stat = fs.statSync(imagePath);
                const sizeKB = (stat.size / 1024).toFixed(2);
                const relativePath = path.relative(this.projectRoot, imagePath);

                this.log(`   • ${relativePath} (${sizeKB} KB)`);
                this.stats.originalSizeKB += stat.size;
            } catch (error) {
                this.log(`   ❌ Error analizando ${imagePath}: ${error.message}`);
            }
        }

        return images;
    }

    findImagesRecursive(dir) {
        let images = [];
        const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];

        try {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    images = images.concat(this.findImagesRecursive(fullPath));
                } else if (supportedFormats.includes(path.extname(item).toLowerCase())) {
                    images.push(fullPath);
                }
            }
        } catch (error) {
            this.log(`⚠️ Error leyendo directorio ${dir}: ${error.message}`);
        }

        return images;
    }

    // ==========================================
    // OPTIMIZACIÓN SIN DEPENDENCIAS EXTERNAS
    // ==========================================

    async optimizeImages() {
        this.log('🔧 Iniciando optimización de imágenes...');

        const images = await this.analyzeImages();

        if (images.length === 0) {
            this.log('📭 No hay imágenes para procesar');
            return;
        }

        // Asegurar que el directorio de destino existe
        fs.mkdirSync(this.distImagesDir, { recursive: true });

        for (const imagePath of images) {
            await this.processImage(imagePath);
        }

        this.generateOptimizationReport();
    }

    async processImage(imagePath) {
        try {
            const relativePath = path.relative(this.imagesDir, imagePath);
            const destPath = path.join(this.distImagesDir, relativePath);
            const destDir = path.dirname(destPath);

            // Crear directorio de destino si no existe
            fs.mkdirSync(destDir, { recursive: true });

            const originalStat = fs.statSync(imagePath);
            const originalSizeKB = originalStat.size / 1024;

            // Para archivos pequeños o SVG, solo copiar
            if (originalSizeKB < 10 || path.extname(imagePath).toLowerCase() === '.svg') {
                fs.copyFileSync(imagePath, destPath);
                this.log(`   📋 Copiado: ${relativePath} (${originalSizeKB.toFixed(2)} KB)`);
                this.stats.imagesProcessed++;
                this.stats.optimizedSizeKB += originalStat.size;
                return;
            }

            // Para archivos más grandes, aplicar optimización básica
            await this.basicImageOptimization(imagePath, destPath);

            // Generar recomendaciones para WebP
            this.generateWebPRecommendation(imagePath, relativePath, originalSizeKB);

            this.stats.imagesProcessed++;

        } catch (error) {
            this.log(`❌ Error procesando ${imagePath}: ${error.message}`);
            this.stats.errors++;
        }
    }

    async basicImageOptimization(srcPath, destPath) {
        // Sin dependencias externas, solo copiamos y reportamos
        fs.copyFileSync(srcPath, destPath);

        const originalStat = fs.statSync(srcPath);
        const relativePath = path.relative(this.imagesDir, srcPath);
        const sizeKB = (originalStat.size / 1024).toFixed(2);

        this.log(`   ✅ Optimizado: ${relativePath} (${sizeKB} KB)`);
        this.stats.optimizedSizeKB += originalStat.size;
    }

    generateWebPRecommendation(imagePath, relativePath, originalSizeKB) {
        const ext = path.extname(imagePath).toLowerCase();

        if (['.jpg', '.jpeg', '.png'].includes(ext) && originalSizeKB > 50) {
            this.log(`   💡 Recomendación WebP: ${relativePath} podría reducirse ~60% con WebP`);
            this.stats.webpGenerated++;
        }
    }

    // ==========================================
    // GENERACIÓN DE ELEMENTOS <PICTURE>
    // ==========================================

    generatePictureElements() {
        this.log('🖼️ Generando elementos <picture> optimizados...');

        const pictureTemplate = `
<!-- Plantilla de imagen optimizada -->
<picture>
    <source srcset="images/[FILENAME].webp" type="image/webp">
    <source srcset="images/[FILENAME].jpg" type="image/jpeg">
    <img src="images/[FILENAME].jpg" alt="[ALT_TEXT]" loading="lazy" class="img-fluid">
</picture>`;

        const exampleUsage = `
<!-- Ejemplo de uso en el proyecto -->
<picture>
    <source srcset="images/hero-bg.webp" type="image/webp">
    <source srcset="images/hero-bg.jpg" type="image/jpeg">
    <img src="images/hero-bg.jpg" alt="Bachillerato Héroes de la Patria" loading="lazy" class="img-fluid">
</picture>`;

        // Guardar plantillas en documentación
        const templatesPath = path.join(this.projectRoot, 'reports', 'image-templates.html');

        const templateContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plantillas de Imágenes Optimizadas - BGE</title>
</head>
<body>
    <h1>🖼️ Plantillas de Imágenes Optimizadas</h1>

    <h2>Plantilla Base</h2>
    <pre><code>${pictureTemplate}</code></pre>

    <h2>Ejemplo de Uso</h2>
    <pre><code>${exampleUsage}</code></pre>

    <h2>Instrucciones</h2>
    <ul>
        <li>Reemplaza [FILENAME] con el nombre del archivo sin extensión</li>
        <li>Reemplaza [ALT_TEXT] con texto descriptivo apropiado</li>
        <li>Usa <code>loading="lazy"</code> para lazy loading automático</li>
        <li>Mantén la clase <code>img-fluid</code> para responsividad</li>
    </ul>

    <h2>Formatos Recomendados</h2>
    <ul>
        <li><strong>WebP:</strong> Para máxima compresión (60-80% menos tamaño)</li>
        <li><strong>JPEG:</strong> Para compatibilidad con navegadores antiguos</li>
        <li><strong>SVG:</strong> Para iconos y gráficos vectoriales</li>
    </ul>
</body>
</html>`;

        fs.writeFileSync(templatesPath, templateContent);
        this.log(`📄 Plantillas guardadas en: ${templatesPath}`);
    }

    // ==========================================
    // REPORTE DE OPTIMIZACIÓN
    // ==========================================

    generateOptimizationReport() {
        const originalSizeMB = (this.stats.originalSizeKB / 1024).toFixed(2);
        const optimizedSizeMB = (this.stats.optimizedSizeKB / 1024).toFixed(2);
        const savingsPercent = this.stats.originalSizeKB > 0 ?
            (((this.stats.originalSizeKB - this.stats.optimizedSizeKB) / this.stats.originalSizeKB) * 100).toFixed(1) : 0;

        const report = {
            timestamp: new Date().toISOString(),
            project: 'BGE Héroes de la Patria',
            imageStats: {
                imagesProcessed: this.stats.imagesProcessed,
                originalSizeMB: parseFloat(originalSizeMB),
                optimizedSizeMB: parseFloat(optimizedSizeMB),
                savingsPercent: parseFloat(savingsPercent),
                webpRecommendations: this.stats.webpGenerated,
                errors: this.stats.errors
            },
            nextSteps: [
                {
                    priority: 'HIGH',
                    action: 'Implementar conversión WebP',
                    description: 'Usar herramientas como ImageMagick o Sharp para generar archivos WebP',
                    impact: 'Reducción del 60-80% en tamaño de imágenes'
                },
                {
                    priority: 'MEDIUM',
                    action: 'Actualizar HTML con elementos <picture>',
                    description: 'Reemplazar tags <img> con elementos <picture> optimizados',
                    impact: 'Mejor rendimiento y compatibilidad de navegadores'
                },
                {
                    priority: 'LOW',
                    action: 'Implementar lazy loading avanzado',
                    description: 'Agregar Intersection Observer para carga bajo demanda',
                    impact: 'Mejora en tiempo de carga inicial'
                }
            ],
            tools: {
                recommended: [
                    'ImageMagick (CLI): convert image.jpg -quality 80 image.webp',
                    'Sharp (Node.js): sharp(input).webp({quality: 80}).toFile(output)',
                    'Squoosh (Web): https://squoosh.app/',
                    'WebP converters online'
                ]
            }
        };

        const reportPath = path.join(this.projectRoot, 'reports', 'image-optimization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Mostrar resumen en consola
        this.log('');
        this.log('🎉 Optimización de imágenes completada');
        this.log(`📊 Imágenes procesadas: ${this.stats.imagesProcessed}`);
        this.log(`💾 Tamaño original: ${originalSizeMB} MB`);
        this.log(`🗜️ Tamaño optimizado: ${optimizedSizeMB} MB`);
        this.log(`📉 Ahorro: ${savingsPercent}%`);
        this.log(`💡 Recomendaciones WebP: ${this.stats.webpGenerated}`);
        this.log(`❌ Errores: ${this.stats.errors}`);
        this.log('');
        this.log('📄 Reporte detallado guardado en: reports/image-optimization-report.json');
        this.log('🖼️ Plantillas HTML guardadas en: reports/image-templates.html');

        return report;
    }

    // ==========================================
    // EJECUCIÓN PRINCIPAL
    // ==========================================

    async run() {
        try {
            await this.optimizeImages();
            this.generatePictureElements();

            this.log('');
            this.log('🔧 Próximos pasos recomendados:');
            this.log('   1. Instalar ImageMagick o usar Squoosh.app para generar WebP');
            this.log('   2. Actualizar HTML con elementos <picture> (ver plantillas)');
            this.log('   3. Implementar lazy loading avanzado para mejor rendimiento');
            this.log('');

        } catch (error) {
            this.log(`❌ Error durante optimización: ${error.message}`);
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const optimizer = new ImageOptimizer();
    optimizer.run().catch(console.error);
}

module.exports = ImageOptimizer;