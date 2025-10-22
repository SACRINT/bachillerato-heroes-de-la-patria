/**
 * 🔄 SYNC CORE FILES - SINCRONIZACIÓN AUTOMÁTICA
 * Script para mantener sincronizados los archivos entre root y public
 */

const fs = require('fs');
const path = require('path');

class CoreFileSync {
    constructor() {
        this.rootDir = 'C:\\03 BachilleratoHeroesWeb';
        this.publicDir = path.join(this.rootDir, 'public');

        this.coreFiles = [
            'js/core/logger.js',
            'js/core/bundle-manager.js',
            'js/core/bundle-optimizer.js',
            'js/core/context-manager.js',
            'js/core/dependency-analyzer.js',
            'js/core/bge-loader.js'
        ];

        this.criticalFiles = [
            'admin-dashboard.html',
            'index.html',
            'js/dashboard-manager-2025.js',
            'js/resource-optimizer.js',
            'js/build-optimizer.js'
        ];

        console.log('🔄 Core File Sync inicializado');
        this.sync();
    }

    // Sincronizar todos los archivos
    sync() {
        console.log('📁 Iniciando sincronización...');

        // Sincronizar archivos core
        this.syncCoreFiles();

        // Sincronizar archivos críticos
        this.syncCriticalFiles();

        // Verificar sincronización
        this.verifySyncStatus();

        console.log('✅ Sincronización completada');
    }

    // Sincronizar archivos core
    syncCoreFiles() {
        this.coreFiles.forEach(file => {
            const sourceFile = path.join(this.rootDir, file);
            const destFile = path.join(this.publicDir, file);

            try {
                if (fs.existsSync(sourceFile)) {
                    // Crear directorio si no existe
                    const destDir = path.dirname(destFile);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }

                    // Copiar archivo
                    fs.copyFileSync(sourceFile, destFile);
                    console.log(`✅ Core: ${file} sincronizado`);
                } else {
                    console.warn(`⚠️ Core: ${file} no encontrado en root`);
                }
            } catch (error) {
                console.error(`❌ Error sincronizando ${file}:`, error.message);
            }
        });
    }

    // Sincronizar archivos críticos
    syncCriticalFiles() {
        this.criticalFiles.forEach(file => {
            const sourceFile = path.join(this.rootDir, file);
            const destFile = path.join(this.publicDir, file);

            try {
                if (fs.existsSync(sourceFile)) {
                    // Crear directorio si no existe
                    const destDir = path.dirname(destFile);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }

                    // Copiar archivo
                    fs.copyFileSync(sourceFile, destFile);
                    console.log(`✅ Critical: ${file} sincronizado`);
                } else {
                    console.warn(`⚠️ Critical: ${file} no encontrado en root`);
                }
            } catch (error) {
                console.error(`❌ Error sincronizando ${file}:`, error.message);
            }
        });
    }

    // Verificar estado de sincronización
    verifySyncStatus() {
        console.log('\n📊 Verificando sincronización...');

        let syncedCount = 0;
        let totalCount = this.coreFiles.length + this.criticalFiles.length;

        [...this.coreFiles, ...this.criticalFiles].forEach(file => {
            const sourceFile = path.join(this.rootDir, file);
            const destFile = path.join(this.publicDir, file);

            if (fs.existsSync(sourceFile) && fs.existsSync(destFile)) {
                const sourceStats = fs.statSync(sourceFile);
                const destStats = fs.statSync(destFile);

                if (sourceStats.mtime.getTime() === destStats.mtime.getTime()) {
                    syncedCount++;
                } else {
                    console.warn(`⚠️ Timestamps diferentes: ${file}`);
                }
            }
        });

        console.log(`📈 Sincronización: ${syncedCount}/${totalCount} archivos`);

        if (syncedCount === totalCount) {
            console.log('🎉 Todos los archivos están sincronizados');
        } else {
            console.log(`⚠️ ${totalCount - syncedCount} archivos necesitan atención`);
        }
    }

    // Sincronización bidireccional
    syncBidirectional() {
        console.log('🔄 Iniciando sincronización bidireccional...');

        [...this.coreFiles, ...this.criticalFiles].forEach(file => {
            const rootFile = path.join(this.rootDir, file);
            const publicFile = path.join(this.publicDir, file);

            try {
                if (fs.existsSync(rootFile) && fs.existsSync(publicFile)) {
                    const rootStats = fs.statSync(rootFile);
                    const publicStats = fs.statSync(publicFile);

                    // Sincronizar el más reciente
                    if (rootStats.mtime > publicStats.mtime) {
                        fs.copyFileSync(rootFile, publicFile);
                        console.log(`📤 ${file}: root → public`);
                    } else if (publicStats.mtime > rootStats.mtime) {
                        fs.copyFileSync(publicFile, rootFile);
                        console.log(`📥 ${file}: public → root`);
                    }
                } else if (fs.existsSync(rootFile)) {
                    // Crear directorio y copiar
                    const destDir = path.dirname(publicFile);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.copyFileSync(rootFile, publicFile);
                    console.log(`📤 ${file}: root → public (nuevo)`);
                } else if (fs.existsSync(publicFile)) {
                    // Crear directorio y copiar
                    const destDir = path.dirname(rootFile);
                    if (!fs.existsSync(destDir)) {
                        fs.mkdirSync(destDir, { recursive: true });
                    }
                    fs.copyFileSync(publicFile, rootFile);
                    console.log(`📥 ${file}: public → root (nuevo)`);
                }
            } catch (error) {
                console.error(`❌ Error en sincronización bidireccional ${file}:`, error.message);
            }
        });
    }

    // Watch para sincronización automática
    setupWatch() {
        console.log('👁️ Configurando observador de archivos...');

        const watchDirs = [
            path.join(this.rootDir, 'js', 'core'),
            path.join(this.rootDir, 'js'),
            this.rootDir
        ];

        watchDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.watch(dir, { recursive: false }, (eventType, filename) => {
                    if (filename && filename.endsWith('.js') || filename.endsWith('.html')) {
                        console.log(`🔔 Archivo modificado: ${filename}`);

                        // Sincronizar después de un pequeño delay
                        setTimeout(() => {
                            this.sync();
                        }, 500);
                    }
                });

                console.log(`👁️ Observando: ${dir}`);
            }
        });
    }
}

// Ejecutar sincronización
if (require.main === module) {
    const sync = new CoreFileSync();

    // Si se pasa argumento 'watch', configurar observador
    if (process.argv.includes('--watch')) {
        sync.setupWatch();
        console.log('👁️ Observador activo. Presiona Ctrl+C para detener.');

        // Mantener el proceso activo
        process.stdin.resume();
    }
}

module.exports = CoreFileSync;