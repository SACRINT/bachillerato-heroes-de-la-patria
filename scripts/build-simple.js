#!/usr/bin/env node

/**
 * 🏗️ SISTEMA DE BUILD SIMPLIFICADO PARA BGE
 * Versión simplificada y funcional para optimización inmediata
 */

const fs = require('fs');
const path = require('path');

class SimpleBuildSystem {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.distDir = path.join(this.projectRoot, 'dist');

        this.log('🏗️ Inicializando build simplificado...');
    }

    log(message) {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] ${message}`);
    }

    // ==========================================
    // PREPARACIÓN
    // ==========================================

    async prepareBuild() {
        this.log('📁 Preparando directorio de build...');

        if (fs.existsSync(this.distDir)) {
            fs.rmSync(this.distDir, { recursive: true });
        }

        fs.mkdirSync(this.distDir, { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'js'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'css'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'images'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'data'), { recursive: true });
        fs.mkdirSync(path.join(this.distDir, 'partials'), { recursive: true });
    }

    // ==========================================
    // BUNDLING SIMPLIFICADO DE JS
    // ==========================================

    async bundleJavaScript() {
        this.log('📦 Creando bundles de JavaScript...');

        const bundles = {
            'main': ['js/script.js', 'js/search-simple.js'],
            'admin': ['js/dashboard-manager-2025.js', 'js/cms-manager.js', 'js/stats-counter.js'],
            'forms': ['js/professional-forms.js', 'js/security-manager.js'],
            'features': ['js/chatbot.js', 'js/dynamic-loader.js']
        };

        for (const [bundleName, files] of Object.entries(bundles)) {
            let bundledCode = this.generateBundleHeader(bundleName);

            for (const file of files) {
                const filePath = path.join(this.projectRoot, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    bundledCode += `\n\n// === ${file} ===\n`;
                    bundledCode += content;
                    this.log(`  ✅ Agregado: ${file}`);
                } else {
                    this.log(`  ⚠️ No encontrado: ${file}`);
                }
            }

            bundledCode += '\n\n})();'; // Cerrar IIFE

            // Minificar básico
            bundledCode = this.basicMinifyJS(bundledCode);

            const outputPath = path.join(this.distDir, 'js', `${bundleName}.bundle.js`);
            fs.writeFileSync(outputPath, bundledCode);
            this.log(`✅ Bundle creado: ${bundleName}.bundle.js`);
        }
    }

    generateBundleHeader(bundleName) {
        return `/**
 * BGE Bundle: ${bundleName.toUpperCase()}
 * Generado: ${new Date().toISOString()}
 */
(function(window, document) {
    'use strict';
`;
    }

    basicMinifyJS(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios
            .replace(/\/\/.*$/gm, '') // Comentarios de línea
            .replace(/^\s+/gm, '') // Espacios al inicio
            .replace(/\n\s*\n/g, '\n') // Líneas vacías
            .trim();
    }

    // ==========================================
    // CSS BUNDLING
    // ==========================================

    async bundleCSS() {
        this.log('🎨 Creando bundle de CSS...');

        let combinedCSS = `/* BGE Styles Bundle - ${new Date().toISOString()} */\n\n`;

        // Agregar CSS crítico
        combinedCSS += `/* Critical CSS */
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

        // Agregar CSS principal
        const mainCSS = path.join(this.projectRoot, 'css', 'style.css');
        if (fs.existsSync(mainCSS)) {
            const content = fs.readFileSync(mainCSS, 'utf8');
            combinedCSS += '\n/* Main Styles */\n' + content;
            this.log('  ✅ CSS principal agregado');
        }

        // Minificar CSS
        combinedCSS = this.basicMinifyCSS(combinedCSS);

        const outputPath = path.join(this.distDir, 'css', 'styles.bundle.css');
        fs.writeFileSync(outputPath, combinedCSS);
        this.log('✅ Bundle CSS creado');
    }

    basicMinifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Comentarios
            .replace(/\s+/g, ' ') // Espacios múltiples
            .replace(/;\s*}/g, '}') // Optimizar llaves
            .replace(/\s*{\s*/g, '{')
            .trim();
    }

    // ==========================================
    // HTML PROCESSING
    // ==========================================

    async processHTML() {
        this.log('📄 Procesando archivos HTML...');

        const htmlFiles = fs.readdirSync(this.projectRoot)
            .filter(file => file.endsWith('.html'));

        for (const htmlFile of htmlFiles) {
            let content = fs.readFileSync(path.join(this.projectRoot, htmlFile), 'utf8');

            // Actualizar referencias a bundles
            content = this.updateHTMLReferences(content);

            // Inyectar CSS crítico inline
            content = this.injectCriticalCSS(content);

            fs.writeFileSync(path.join(this.distDir, htmlFile), content);
            this.log(`  ✅ Procesado: ${htmlFile}`);
        }
    }

    updateHTMLReferences(content) {
        // Actualizar JS principales
        content = content.replace(/js\/script\.js/g, 'js/main.bundle.js');
        content = content.replace(/js\/dashboard-manager-2025\.js/g, 'js/admin.bundle.js');
        content = content.replace(/js\/professional-forms\.js/g, 'js/forms.bundle.js');
        content = content.replace(/js\/chatbot\.js/g, 'js/features.bundle.js');

        // Actualizar CSS
        content = content.replace(/css\/style\.css/g, 'css/styles.bundle.css');

        return content;
    }

    injectCriticalCSS(content) {
        const criticalCSS = `<style>
.hero-section{min-height:60vh;background:linear-gradient(135deg,#0d6efd 0%,#495057 100%);}
.skeleton{background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:loading 1.5s infinite;}
@keyframes loading{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
</style>`;

        return content.replace('</head>', `${criticalCSS}\n</head>`);
    }

    // ==========================================
    // COPY ASSETS
    // ==========================================

    async copyAssets() {
        this.log('📁 Copiando assets...');

        const directories = ['images', 'data', 'partials'];
        const files = ['manifest.json', 'sw-offline-first.js', 'robots.txt', 'sitemap.xml'];

        // Copiar directorios
        for (const dir of directories) {
            const srcDir = path.join(this.projectRoot, dir);
            const destDir = path.join(this.distDir, dir);

            if (fs.existsSync(srcDir)) {
                this.copyDirectory(srcDir, destDir);
                this.log(`  ✅ Copiado: ${dir}/`);
            }
        }

        // Copiar archivos individuales
        for (const file of files) {
            const srcFile = path.join(this.projectRoot, file);
            const destFile = path.join(this.distDir, file);

            if (fs.existsSync(srcFile)) {
                fs.copyFileSync(srcFile, destFile);
                this.log(`  ✅ Copiado: ${file}`);
            }
        }
    }

    copyDirectory(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const items = fs.readdirSync(src);

        for (const item of items) {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    // ==========================================
    // REPORTE
    // ==========================================

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            bundles: {
                js: fs.readdirSync(path.join(this.distDir, 'js')),
                css: fs.readdirSync(path.join(this.distDir, 'css'))
            },
            files: fs.readdirSync(this.distDir).filter(f => f.endsWith('.html')),
            optimizations: [
                'JavaScript bundling y minificación básica',
                'CSS bundling con critical CSS inline',
                'Referencias actualizadas a bundles',
                'Assets copiados para producción'
            ]
        };

        fs.writeFileSync(
            path.join(this.distDir, 'build-report.json'),
            JSON.stringify(report, null, 2)
        );

        return report;
    }

    // ==========================================
    // MAIN BUILD
    // ==========================================

    async build() {
        const startTime = Date.now();

        try {
            await this.prepareBuild();
            await this.bundleJavaScript();
            await this.bundleCSS();
            await this.processHTML();
            await this.copyAssets();

            const report = await this.generateReport();
            const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);

            this.log('');
            this.log('🎉 ¡Build completado exitosamente!');
            this.log(`⏱️ Tiempo: ${buildTime}s`);
            this.log(`📦 Bundles JS: ${report.bundles.js.length}`);
            this.log(`🎨 Bundles CSS: ${report.bundles.css.length}`);
            this.log(`📄 Archivos HTML: ${report.files.length}`);
            this.log(`📁 Output: ${this.distDir}`);
            this.log('');
            this.log('🚀 Sitio listo para producción en /dist/');
            this.log('💡 Mejoras aplicadas:');
            report.optimizations.forEach(opt => this.log(`   • ${opt}`));

        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
            console.error(error);
        }
    }
}

// Ejecutar
if (require.main === module) {
    const buildSystem = new SimpleBuildSystem();
    buildSystem.build();
}

module.exports = SimpleBuildSystem;