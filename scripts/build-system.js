#!/usr/bin/env node

/**
 * 🏗️ SISTEMA DE BUILD AVANZADO PARA BGE
 * Compila, optimiza y prepara el sitio para producción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildSystem {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.buildDir = path.join(this.projectRoot, 'build');
        this.distDir = path.join(this.projectRoot, 'dist');

        this.config = {
            // Archivos JS principales que serán bundled
            jsEntry: {
                main: 'js/script.js',
                dashboard: 'js/dashboard-manager-2025.js',
                forms: 'js/professional-forms.js',
                security: 'js/security-manager.js',
                chatbot: 'js/chatbot.js'
            },

            // CSS que será concatenado y minificado
            cssFiles: [
                'css/style.css'
            ],

            // Archivos a copyar directamente
            staticFiles: [
                'manifest.json',
                'sw-offline-first.js',
                'robots.txt',
                'sitemap.xml'
            ],

            // Configuración de optimización
            optimization: {
                minifyHTML: true,
                minifyCSS: true,
                minifyJS: true,
                optimizeImages: true,
                generateSourceMaps: false
            }
        };

        this.stats = {
            originalSize: 0,
            optimizedSize: 0,
            filesProcessed: 0,
            timeStart: Date.now()
        };

        this.log('🏗️ Inicializando sistema de build BGE...');
    }

    log(message) {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] ${message}`);
    }

    // ==========================================
    // PREPARACIÓN DEL BUILD
    // ==========================================

    async prepareBuild() {
        this.log('📁 Preparando directorios de build...');

        // Limpiar directorios existentes
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true });
        }
        if (fs.existsSync(this.distDir)) {
            fs.rmSync(this.distDir, { recursive: true });
        }

        // Crear directorios
        fs.mkdirSync(this.buildDir, { recursive: true });
        fs.mkdirSync(this.distDir, { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'js'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'css'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'images'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'data'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'partials'), { recursive: true });

        this.log('✅ Directorios preparados');
    }

    // ==========================================
    // BUNDLING DE JAVASCRIPT
    // ==========================================

    async bundleJavaScript() {
        this.log('📦 Empaquetando JavaScript...');

        for (const [bundleName, entryFile] of Object.entries(this.config.jsEntry)) {
            try {
                const fullPath = path.join(this.projectRoot, entryFile);

                if (!fs.existsSync(fullPath)) {
                    this.log(`⚠️ Archivo no encontrado: ${entryFile}`);
                    continue;
                }

                let jsContent = fs.readFileSync(fullPath, 'utf8');

                // Analizar dependencias y concatenar
                const dependencies = this.analyzeDependencies(fullPath);
                let bundledCode = this.generateBundleHeader(bundleName);

                // Agregar dependencias
                for (const dep of dependencies) {
                    try {
                        const depContent = fs.readFileSync(dep, 'utf8');
                        bundledCode += `\\n\\n// === ${path.basename(dep)} ===\\n`;
                        bundledCode += this.cleanJSCode(depContent);
                    } catch (error) {
                        this.log(`⚠️ Error cargando dependencia ${dep}: ${error.message}`);
                    }
                }

                // Agregar archivo principal
                bundledCode += `\\n\\n// === ${path.basename(entryFile)} (MAIN) ===\\n`;
                bundledCode += this.cleanJSCode(jsContent);

                // Minificar si está habilitado
                if (this.config.optimization.minifyJS) {
                    bundledCode = this.minifyJS(bundledCode);
                }

                // Guardar bundle
                const outputPath = path.join(this.distDir, 'js', `${bundleName}.bundle.js`);
                fs.writeFileSync(outputPath, bundledCode);

                this.stats.filesProcessed++;
                this.log(`✅ Bundle creado: ${bundleName}.bundle.js`);

            } catch (error) {
                this.log(`❌ Error empaquetando ${bundleName}: ${error.message}`);
            }
        }
    }

    analyzeDependencies(filePath) {
        // Análisis básico de dependencias (puede expandirse)
        const dependencies = [];
        const content = fs.readFileSync(filePath, 'utf8');

        // Buscar imports relativos comunes
        const importMatches = content.match(/import.*from ['"](\.\.?\/.+)['"];?/g) || [];
        for (const match of importMatches) {
            const pathMatch = match.match(/['"](\.\.?\/.+)['"]/);
            if (pathMatch) {
                const depPath = path.resolve(path.dirname(filePath), pathMatch[1]);
                if (fs.existsSync(depPath)) {
                    dependencies.push(depPath);
                }
            }
        }

        return dependencies;
    }

    cleanJSCode(code) {
        // Remover imports/exports para bundling
        return code
            .replace(/import.*from.*['"];?\\n?/g, '')
            .replace(/export\\s+(default\\s+)?/g, '')
            .replace(/export\\s*\\{[^}]*\\}\\s*;?\\n?/g, '');
    }

    generateBundleHeader(bundleName) {
        const header = `
/**
 * 📦 BUNDLE: ${bundleName.toUpperCase()}
 * Generado automáticamente por BGE Build System
 * Fecha: ${new Date().toISOString()}
 *
 * Este archivo combina múltiples scripts para optimizar el rendimiento.
 * No editar manualmente - regenerar con: npm run build
 */

(function(window, document) {
    'use strict';

    // === BUNDLE START ===
`;
        return header;
    }

    minifyJS(code) {
        // Minificación básica (sin dependencias externas)
        return code
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remover comentarios de bloque
            .replace(/\\/\\/.*$/gm, '') // Remover comentarios de línea
            .replace(/^\\s+/gm, '') // Remover espacios al inicio de línea
            .replace(/\\n\\s*\\n/g, '\\n') // Remover líneas vacías múltiples
            .replace(/;\\s*}/g, '}') // Optimizar llaves
            .replace(/\\s*{\\s*/g, '{') // Optimizar llaves de apertura
            .trim();
    }

    // ==========================================
    // PROCESAMIENTO DE CSS
    // ==========================================

    async processCSS() {
        this.log('🎨 Procesando archivos CSS...');

        let combinedCSS = '';
        let originalSize = 0;

        // Combinar archivos CSS
        for (const cssFile of this.config.cssFiles) {
            try {
                const fullPath = path.join(this.projectRoot, cssFile);
                if (fs.existsSync(fullPath)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    originalSize += content.length;

                    combinedCSS += `\\n\\n/* === ${cssFile} === */\\n`;
                    combinedCSS += content;

                    this.log(`✅ CSS agregado: ${cssFile}`);
                }
            } catch (error) {
                this.log(`❌ Error procesando ${cssFile}: ${error.message}`);
            }
        }

        // Agregar CSS crítico inline
        combinedCSS = this.addCriticalCSS() + combinedCSS;

        // Minificar CSS si está habilitado
        if (this.config.optimization.minifyCSS) {
            combinedCSS = this.minifyCSS(combinedCSS);
        }

        // Guardar CSS combinado
        const outputPath = path.join(this.distDir, 'css', 'styles.bundle.css');
        fs.writeFileSync(outputPath, combinedCSS);

        const optimizedSize = combinedCSS.length;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

        this.log(`✅ CSS bundle creado: ${optimizedSize} bytes (${savings}% reducción)`);
        this.stats.filesProcessed++;
    }

    addCriticalCSS() {
        return `
/* === CRITICAL CSS === */
/* Above-the-fold styles for faster rendering */

:root {
    --bs-primary: #0d6efd;
    --bs-success: #198754;
    --bs-warning: #ffc107;
    --bs-danger: #dc3545;
}

.hero-section {
    min-height: 60vh;
    background: linear-gradient(135deg, var(--bs-primary) 0%, #495057 100%);
}

.navbar-brand {
    font-weight: 700;
}

/* Skeleton loaders for perceived performance */
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

`;
    }

    minifyCSS(css) {
        return css
            .replace(/\\/\\*[\\s\\S]*?\\*\\//g, '') // Remover comentarios
            .replace(/\\s+/g, ' ') // Normalizar espacios
            .replace(/;\\s*}/g, '}') // Optimizar llaves
            .replace(/\\s*{\\s*/g, '{') // Optimizar llaves de apertura
            .replace(/;\\s*;/g, ';') // Remover punto y coma duplicado
            .replace(/\\s*,\\s*/g, ',') // Optimizar comas
            .trim();
    }

    // ==========================================
    // PROCESAMIENTO DE HTML
    // ==========================================

    async processHTML() {
        this.log('📄 Procesando archivos HTML...');

        const htmlFiles = fs.readdirSync(this.projectRoot)
            .filter(file => file.endsWith('.html'));

        for (const htmlFile of htmlFiles) {
            try {
                let content = fs.readFileSync(path.join(this.projectRoot, htmlFile), 'utf8');

                // Actualizar referencias a bundles
                content = this.updateHTMLReferences(content);

                // Inyectar CSS crítico
                content = this.injectCriticalCSS(content);

                // Minificar HTML si está habilitado
                if (this.config.optimization.minifyHTML) {
                    content = this.minifyHTML(content);
                }

                fs.writeFileSync(path.join(this.distDir, htmlFile), content);
                this.stats.filesProcessed++;
                this.log(`✅ HTML procesado: ${htmlFile}`);

            } catch (error) {
                this.log(`❌ Error procesando ${htmlFile}: ${error.message}`);
            }
        }
    }

    updateHTMLReferences(content) {
        // Actualizar referencias a archivos JS bundled
        content = content.replace(
            /<script src="js\\/script\\.js"><\\/script>/g,
            '<script src="js/main.bundle.js"></script>'
        );

        content = content.replace(
            /<script src="js\\/dashboard-manager-2025\\.js"><\\/script>/g,
            '<script src="js/dashboard.bundle.js"></script>'
        );

        // Actualizar referencia a CSS
        content = content.replace(
            /<link rel="stylesheet" href="css\\/style\\.css">/g,
            '<link rel="stylesheet" href="css/styles.bundle.css">'
        );

        return content;
    }

    injectCriticalCSS(content) {
        // Buscar e inyectar CSS crítico en <head>
        const criticalCSS = `
<style>
/* Critical CSS for faster FCP */
.hero-section{min-height:60vh;background:linear-gradient(135deg,#0d6efd 0%,#495057 100%);}
.navbar-brand{font-weight:700;}
.skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:loading 1.5s infinite;}
@keyframes loading{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
</style>`;

        return content.replace('</head>', `${criticalCSS}\\n</head>`);
    }

    minifyHTML(html) {
        return html
            .replace(/<!--[\\s\\S]*?-->/g, '') // Remover comentarios HTML
            .replace(/\\s+/g, ' ') // Normalizar espacios
            .replace(/> </g, '><') // Remover espacios entre tags
            .trim();
    }

    // ==========================================
    // COPIA DE ARCHIVOS ESTÁTICOS
    // ==========================================

    async copyStaticFiles() {
        this.log('📁 Copiando archivos estáticos...');

        const directories = ['images', 'data', 'partials'];

        // Copiar directorios completos
        for (const dir of directories) {
            const srcDir = path.join(this.projectRoot, dir);
            const destDir = path.join(this.distDir, dir);

            if (fs.existsSync(srcDir)) {
                await this.copyDirectory(srcDir, destDir);
                this.log(`✅ Directorio copiado: ${dir}/`);
            }
        }

        // Copiar archivos individuales
        for (const file of this.config.staticFiles) {
            const srcFile = path.join(this.projectRoot, file);
            const destFile = path.join(this.distDir, file);

            if (fs.existsSync(srcFile)) {
                fs.copyFileSync(srcFile, destFile);
                this.log(`✅ Archivo copiado: ${file}`);
            }
        }
    }

    async copyDirectory(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const items = fs.readdirSync(src);

        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    // ==========================================
    // GENERACIÓN DE REPORTE DE BUILD
    // ==========================================

    async generateBuildReport() {
        const buildTime = Date.now() - this.stats.timeStart;

        const report = {
            timestamp: new Date().toISOString(),
            buildTime: buildTime,
            stats: this.stats,
            bundles: {
                js: fs.readdirSync(path.join(this.distDir, 'js')),
                css: fs.readdirSync(path.join(this.distDir, 'css'))
            },
            config: this.config,
            performance: {
                filesProcessed: this.stats.filesProcessed,
                averageTimePerFile: buildTime / this.stats.filesProcessed,
                buildTimeHuman: `${(buildTime / 1000).toFixed(2)}s`
            }
        };

        const reportPath = path.join(this.distDir, 'build-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log('📊 Reporte de build generado');
        return report;
    }

    // ==========================================
    // EJECUCIÓN PRINCIPAL
    // ==========================================

    async build() {
        try {
            this.log('🚀 Iniciando build del proyecto...');

            await this.prepareBuild();
            await this.bundleJavaScript();
            await this.processCSS();
            await this.processHTML();
            await this.copyStaticFiles();

            const report = await this.generateBuildReport();

            this.log('');
            this.log('🎉 ¡Build completado exitosamente!');
            this.log(`📦 Archivos procesados: ${report.stats.filesProcessed}`);
            this.log(`⏱️ Tiempo total: ${report.performance.buildTimeHuman}`);
            this.log(`📁 Output: ${this.distDir}`);
            this.log('');
            this.log('🚀 El sitio está listo para producción en /dist/');

        } catch (error) {
            this.log(`❌ Error durante el build: ${error.message}`);
            process.exit(1);
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const buildSystem = new BuildSystem();
    buildSystem.build().catch(console.error);
}

module.exports = BuildSystem;