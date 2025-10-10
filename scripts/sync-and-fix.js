#!/usr/bin/env node

/**
 * 🔧 SINCRONIZADOR Y REPARADOR
 * Copia archivos optimizados y repara referencias JavaScript
 */

const fs = require('fs');
const path = require('path');

class SyncAndFix {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.publicDir = path.join(this.projectRoot, 'public');
        this.rootDir = this.projectRoot;

        this.log('🔧 Iniciando sincronización y reparación...');
    }

    log(message) {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] ${message}`);
    }

    // ==========================================
    // COPIA MEJORADA DE ARCHIVOS
    // ==========================================

    async syncFiles() {
        this.log('📋 Copiando archivos desde raíz...');

        // Archivos HTML
        const htmlFiles = fs.readdirSync(this.rootDir)
            .filter(file => file.endsWith('.html'));

        for (const file of htmlFiles) {
            const srcPath = path.join(this.rootDir, file);
            const destPath = path.join(this.publicDir, file);

            fs.copyFileSync(srcPath, destPath);
            this.log(`  ✅ HTML: ${file}`);
        }

        // Directorios importantes
        const dirs = ['js', 'css', 'images', 'data', 'partials'];
        for (const dir of dirs) {
            const srcDir = path.join(this.rootDir, dir);
            const destDir = path.join(this.publicDir, dir);

            if (fs.existsSync(srcDir)) {
                if (fs.existsSync(destDir)) {
                    fs.rmSync(destDir, { recursive: true });
                }
                this.copyDirectory(srcDir, destDir);
                this.log(`  ✅ DIR: ${dir}/`);
            }
        }

        // Archivos individuales importantes
        const files = ['manifest.json', 'sw-offline-first.js', 'robots.txt', 'sitemap.xml'];
        for (const file of files) {
            const srcPath = path.join(this.rootDir, file);
            const destPath = path.join(this.publicDir, file);

            if (fs.existsSync(srcPath)) {
                fs.copyFileSync(srcPath, destPath);
                this.log(`  ✅ FILE: ${file}`);
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
    // REPARACIÓN DE REFERENCIAS JS
    // ==========================================

    async fixJavaScriptReferences() {
        this.log('🔧 Reparando referencias JavaScript...');

        const htmlFiles = fs.readdirSync(this.publicDir)
            .filter(file => file.endsWith('.html'));

        for (const htmlFile of htmlFiles) {
            const htmlPath = path.join(this.publicDir, htmlFile);
            let content = fs.readFileSync(htmlPath, 'utf8');

            // Eliminar referencias a archivos que ya no existen
            const filesToRemove = [
                'js/config.js',
                'js/dynamic-loader.js',
                'js/admin-auth-secure.js',
                'js/auth-interface.js',
                'js/search-simple.js',
                'js/pwa-advanced.js',
                'js/security-manager.js',
                'js/image-optimizer.js',
                'js/cms-integration.js',
                'js/api-client.js',
                'js/performance-optimizer.js',
                'js/cache-manager.js',
                'js/advanced-search.js',
                'js/mobile-enhancements.js'
            ];

            let changed = false;
            for (const fileToRemove of filesToRemove) {
                const patterns = [
                    new RegExp(`<script src="${fileToRemove}(\\?v=[^"]*)?"></script>`, 'g'),
                    new RegExp(`<script src="${fileToRemove}(\\?v=[^"]*)?"><\\/script>`, 'g'),
                    new RegExp(`<script.*src="[^"]*${fileToRemove.replace('js/', '')}[^"]*"[^>]*></script>`, 'g')
                ];

                for (const pattern of patterns) {
                    const before = content.length;
                    content = content.replace(pattern, '');
                    if (content.length !== before) {
                        changed = true;
                    }
                }
            }

            // Agregar bundles si no existen
            if (!content.includes('main.bundle.js')) {
                const scriptSection = content.indexOf('</body>');
                if (scriptSection !== -1) {
                    const bundleScripts = `
    <!-- Bundles optimizados -->
    <script src="js/main.bundle.js"></script>
    <script src="js/features.bundle.js"></script>
`;
                    content = content.substring(0, scriptSection) + bundleScripts + content.substring(scriptSection);
                    changed = true;
                }
            }

            if (changed) {
                fs.writeFileSync(htmlPath, content);
                this.log(`  🔧 Reparado: ${htmlFile}`);
            }
        }
    }

    // ==========================================
    // COPIAR ARCHIVOS FALTANTES
    // ==========================================

    async copyMissingFiles() {
        this.log('📁 Copiando archivos faltantes...');

        const jsDir = path.join(this.publicDir, 'js');
        const rootJsDir = path.join(this.rootDir, 'js');

        // Lista de archivos JS que pueden necesitarse individualmente
        const criticalFiles = [
            'script.js',
            'chatbot.js'
        ];

        for (const file of criticalFiles) {
            const srcPath = path.join(rootJsDir, file);
            const destPath = path.join(jsDir, file);

            if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
                fs.copyFileSync(srcPath, destPath);
                this.log(`  ✅ Copiado crítico: js/${file}`);
            }
        }
    }

    // ==========================================
    // VERIFICACIÓN FINAL
    // ==========================================

    async verifySetup() {
        this.log('🔍 Verificando configuración...');

        const jsDir = path.join(this.publicDir, 'js');
        const jsFiles = fs.readdirSync(jsDir);

        this.log(`📊 Archivos JS en /public/js/: ${jsFiles.length}`);
        jsFiles.forEach(file => {
            const size = fs.statSync(path.join(jsDir, file)).size;
            this.log(`   • ${file} (${(size / 1024).toFixed(1)} KB)`);
        });

        // Verificar que index.html existe y es válido
        const indexPath = path.join(this.publicDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf8');
            const hasMainBundle = content.includes('main.bundle.js');
            this.log(`📄 index.html: ${hasMainBundle ? '✅ Con bundles' : '⚠️ Sin bundles'}`);
        }
    }

    // ==========================================
    // EJECUCIÓN PRINCIPAL
    // ==========================================

    async run() {
        try {
            await this.syncFiles();
            await this.copyMissingFiles();
            await this.fixJavaScriptReferences();
            await this.verifySetup();

            this.log('');
            this.log('🎉 ¡Sincronización y reparación completadas!');
            this.log('🌐 Prueba: http://localhost:8080');
            this.log('💡 Para formularios usa: http://localhost:3000');

        } catch (error) {
            this.log(`❌ Error: ${error.message}`);
        }
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    const syncer = new SyncAndFix();
    syncer.run().catch(console.error);
}

module.exports = SyncAndFix;