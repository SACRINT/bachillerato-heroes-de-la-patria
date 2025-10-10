#!/usr/bin/env node

/**
 * 🔄 SINCRONIZADOR DE ARCHIVOS
 * Copia archivos optimizados desde /dist/ a /public/ para Vercel
 */

const fs = require('fs');
const path = require('path');

class FileSyncer {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.distDir = path.join(this.projectRoot, 'dist');
        this.publicDir = path.join(this.projectRoot, 'public');

        this.log('🔄 Iniciando sincronización de archivos...');
    }

    log(message) {
        const timestamp = new Date().toISOString().slice(11, 23);
        console.log(`[${timestamp}] ${message}`);
    }

    // ==========================================
    // SINCRONIZACIÓN PRINCIPAL
    // ==========================================

    async sync() {
        try {
            // 1. Verificar que /dist/ existe
            if (!fs.existsSync(this.distDir)) {
                this.log('❌ Directorio /dist/ no existe. Ejecuta primero: node scripts/build-simple.js');
                return false;
            }

            // 2. Limpiar /public/ (excepto archivos especiales)
            await this.cleanPublic();

            // 3. Copiar archivos optimizados desde /dist/
            await this.copyFromDist();

            // 4. Verificar sincronización
            await this.verifySyncStatus();

            this.log('✅ Sincronización completada exitosamente');
            return true;

        } catch (error) {
            this.log(`❌ Error durante sincronización: ${error.message}`);
            return false;
        }
    }

    async cleanPublic() {
        this.log('🧹 Limpiando directorio /public/...');

        // Archivos que NO se deben eliminar
        const preserveFiles = [
            'CAMBIOS_REALIZADOS.md',
            'CAMBIOS-LOG.md',
            'CLAUDE.md',
            'ESTADO-PROYECTO-Y-CONVERSACION.md',
            'package.json',
            'README.md',
            'vercel.json'
        ];

        const items = fs.readdirSync(this.publicDir);

        for (const item of items) {
            if (preserveFiles.includes(item)) {
                this.log(`  📌 Preservando: ${item}`);
                continue;
            }

            const itemPath = path.join(this.publicDir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                fs.rmSync(itemPath, { recursive: true });
                this.log(`  🗑️ Eliminado directorio: ${item}/`);
            } else {
                fs.unlinkSync(itemPath);
                this.log(`  🗑️ Eliminado archivo: ${item}`);
            }
        }
    }

    async copyFromDist() {
        this.log('📋 Copiando archivos optimizados desde /dist/...');

        const items = fs.readdirSync(this.distDir);

        for (const item of items) {
            const srcPath = path.join(this.distDir, item);
            const destPath = path.join(this.publicDir, item);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
                this.log(`  ✅ Copiado directorio: ${item}/`);
            } else {
                fs.copyFileSync(srcPath, destPath);
                this.log(`  ✅ Copiado archivo: ${item}`);
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

    async verifySyncStatus() {
        this.log('🔍 Verificando estado de sincronización...');

        const publicItems = fs.readdirSync(this.publicDir).length;
        const distItems = fs.readdirSync(this.distDir).length;

        this.log(`📊 Archivos en /public/: ${publicItems}`);
        this.log(`📊 Archivos en /dist/: ${distItems}`);

        // Verificar archivos críticos
        const criticalFiles = ['index.html', 'js', 'css', 'images'];
        const missingFiles = [];

        for (const file of criticalFiles) {
            const publicPath = path.join(this.publicDir, file);
            if (!fs.existsSync(publicPath)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            this.log(`⚠️ Archivos faltantes en /public/: ${missingFiles.join(', ')}`);
        } else {
            this.log('✅ Todos los archivos críticos están sincronizados');
        }
    }

    // ==========================================
    // COMANDO REVERSO
    // ==========================================

    async syncFromRoot() {
        this.log('🔄 Sincronizando desde raíz a /public/...');

        const rootFiles = fs.readdirSync(this.projectRoot)
            .filter(file => file.endsWith('.html'));

        for (const file of rootFiles) {
            const srcPath = path.join(this.projectRoot, file);
            const destPath = path.join(this.publicDir, file);

            fs.copyFileSync(srcPath, destPath);
            this.log(`  ✅ Copiado: ${file}`);
        }

        // Copiar directorios importantes
        const dirs = ['js', 'css', 'images', 'data', 'partials'];
        for (const dir of dirs) {
            const srcDir = path.join(this.projectRoot, dir);
            const destDir = path.join(this.publicDir, dir);

            if (fs.existsSync(srcDir)) {
                if (fs.existsSync(destDir)) {
                    fs.rmSync(destDir, { recursive: true });
                }
                this.copyDirectory(srcDir, destDir);
                this.log(`  ✅ Copiado directorio: ${dir}/`);
            }
        }

        this.log('✅ Sincronización desde raíz completada');
    }
}

// ==========================================
// EJECUCIÓN CON ARGUMENTOS
// ==========================================

async function main() {
    const syncer = new FileSyncer();
    const args = process.argv.slice(2);

    if (args.includes('--from-root')) {
        await syncer.syncFromRoot();
    } else {
        await syncer.sync();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = FileSyncer;