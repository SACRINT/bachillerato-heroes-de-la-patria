/**
 * 🔍 SCRIPT DE VERIFICACIÓN DE CONFIGURACIÓN DE PRODUCCIÓN
 * Sistema automatizado para verificar que el proyecto BGE Framework
 * esté correctamente configurado para producción
 *
 * @version 1.0.0
 * @author BGE Verification Team
 * @date 2025-09-27
 */

const fs = require('fs');
const path = require('path');

class ProductionConfigVerifier {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '..');
        this.publicPath = path.join(this.projectRoot, 'public');
        this.errors = [];
        this.warnings = [];
        this.passed = [];

        this.startTime = Date.now();
        console.log('🔍 Iniciando verificación de configuración de producción...\n');
    }

    /**
     * Ejecutar todas las verificaciones
     */
    async runAllChecks() {
        await this.checkDevOverrideStatus();
        await this.checkAutoUpdateSystem();
        await this.checkSynchronization();
        await this.checkHtmlFiles();
        await this.checkEnvironmentVariables();
        await this.checkServiceWorkers();

        this.generateReport();
    }

    /**
     * Verificar estado de dev-override.js
     */
    async checkDevOverrideStatus() {
        console.log('📋 Verificando estado de dev-override.js...');

        // Archivos críticos a verificar
        const criticalFiles = [
            'index.html',
            'admin-dashboard.html',
            'public/index.html',
            'public/admin-dashboard.html'
        ];

        for (const file of criticalFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verificar que dev-override esté comentado
                if (content.includes('<script src="js/dev-override.js">') &&
                    !content.includes('<!-- <script src="js/dev-override.js">')) {
                    this.errors.push(`❌ ${file}: dev-override.js está ACTIVO (debe estar comentado para producción)`);
                } else if (content.includes('<!-- <script src="js/dev-override.js">')) {
                    this.passed.push(`✅ ${file}: dev-override.js correctamente DESHABILITADO`);
                }

                // Verificar dev-credentials
                if (content.includes('<script src="js/dev-credentials.js">') &&
                    !content.includes('<!-- <script src="js/dev-credentials.js">')) {
                    this.errors.push(`❌ ${file}: dev-credentials.js está ACTIVO (debe estar comentado para producción)`);
                } else if (content.includes('<!-- <script src="js/dev-credentials.js">')) {
                    this.passed.push(`✅ ${file}: dev-credentials.js correctamente DESHABILITADO`);
                }
            }
        }
    }

    /**
     * Verificar configuración de auto-update-system
     */
    async checkAutoUpdateSystem() {
        console.log('📋 Verificando auto-update-system.js...');

        const autoUpdatePaths = [
            'js/auto-update-system.js',
            'public/js/auto-update-system.js'
        ];

        for (const file of autoUpdatePaths) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                // Verificar que esté habilitado para producción
                if (content.includes('Sistema HABILITADO para producción')) {
                    this.passed.push(`✅ ${file}: Auto-update habilitado para producción`);
                } else {
                    this.warnings.push(`⚠️ ${file}: Verificar configuración de producción`);
                }

                // Verificar detección de desarrollo
                if (content.includes('detectDevelopmentEnvironment')) {
                    this.passed.push(`✅ ${file}: Detección de entorno implementada`);
                }
            }
        }
    }

    /**
     * Verificar sincronización entre raíz y public
     */
    async checkSynchronization() {
        console.log('📋 Verificando sincronización raíz ↔ public...');

        const filesToSync = [
            'index.html',
            'admin-dashboard.html'
        ];

        for (const file of filesToSync) {
            const rootFile = path.join(this.projectRoot, file);
            const publicFile = path.join(this.projectRoot, 'public', file);

            if (fs.existsSync(rootFile) && fs.existsSync(publicFile)) {
                const rootContent = fs.readFileSync(rootFile, 'utf8');
                const publicContent = fs.readFileSync(publicFile, 'utf8');

                // Verificar scripts críticos estén sincronizados
                const criticalScripts = ['dev-override', 'dev-credentials', 'auto-update-system'];

                for (const script of criticalScripts) {
                    const rootHasScript = rootContent.includes(`${script}.js`);
                    const publicHasScript = publicContent.includes(`${script}.js`);

                    if (rootHasScript === publicHasScript) {
                        this.passed.push(`✅ ${file}: ${script} sincronizado entre raíz y public`);
                    } else {
                        this.errors.push(`❌ ${file}: ${script} NO sincronizado (raíz: ${rootHasScript}, public: ${publicHasScript})`);
                    }
                }
            }
        }
    }

    /**
     * Verificar otros archivos HTML
     */
    async checkHtmlFiles() {
        console.log('📋 Verificando otros archivos HTML...');

        const htmlFiles = fs.readdirSync(this.projectRoot)
            .filter(file => file.endsWith('.html') &&
                    !['index.html', 'admin-dashboard.html'].includes(file))
            .slice(0, 10); // Limitar para performance

        let devScriptsFound = 0;

        for (const file of htmlFiles) {
            const filePath = path.join(this.projectRoot, file);
            const content = fs.readFileSync(filePath, 'utf8');

            if (content.includes('dev-override.js') || content.includes('dev-credentials.js')) {
                devScriptsFound++;
                this.warnings.push(`⚠️ ${file}: Contiene scripts de desarrollo`);
            }
        }

        if (devScriptsFound === 0) {
            this.passed.push(`✅ Otros archivos HTML: Sin scripts de desarrollo detectados`);
        }
    }

    /**
     * Verificar variables de entorno
     */
    async checkEnvironmentVariables() {
        console.log('📋 Verificando variables de entorno...');

        const envFiles = ['.env', '.env.production', '.env.local'];
        let envFound = false;

        for (const envFile of envFiles) {
            const envPath = path.join(this.projectRoot, envFile);
            if (fs.existsSync(envPath)) {
                envFound = true;
                this.passed.push(`✅ Archivo de entorno encontrado: ${envFile}`);
            }
        }

        if (!envFound) {
            this.warnings.push('⚠️ No se encontraron archivos de entorno (.env)');
        }
    }

    /**
     * Verificar Service Workers
     */
    async checkServiceWorkers() {
        console.log('📋 Verificando Service Workers...');

        const swFiles = ['sw.js', 'sw-offline-first.js', 'public/sw.js', 'public/sw-offline-first.js'];

        for (const swFile of swFiles) {
            const swPath = path.join(this.projectRoot, swFile);
            if (fs.existsSync(swPath)) {
                this.passed.push(`✅ Service Worker encontrado: ${swFile}`);
            }
        }
    }

    /**
     * Generar reporte final
     */
    generateReport() {
        const executionTime = Date.now() - this.startTime;

        console.log('\n' + '='.repeat(80));
        console.log('📊 REPORTE DE VERIFICACIÓN DE CONFIGURACIÓN DE PRODUCCIÓN');
        console.log('='.repeat(80));

        console.log(`\n✅ VERIFICACIONES EXITOSAS (${this.passed.length}):`);
        this.passed.forEach(item => console.log(`   ${item}`));

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ ADVERTENCIAS (${this.warnings.length}):`);
            this.warnings.forEach(item => console.log(`   ${item}`));
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORES CRÍTICOS (${this.errors.length}):`);
            this.errors.forEach(item => console.log(`   ${item}`));
        }

        console.log('\n' + '='.repeat(80));
        console.log('📈 RESUMEN:');
        console.log(`   ✅ Exitosas: ${this.passed.length}`);
        console.log(`   ⚠️ Advertencias: ${this.warnings.length}`);
        console.log(`   ❌ Errores: ${this.errors.length}`);
        console.log(`   ⏱️ Tiempo de ejecución: ${executionTime}ms`);

        const status = this.errors.length === 0 ?
            (this.warnings.length === 0 ? '🟢 LISTO PARA PRODUCCIÓN' : '🟡 LISTO CON ADVERTENCIAS') :
            '🔴 REQUIERE CORRECCIONES';

        console.log(`   🎯 Estado: ${status}`);
        console.log('='.repeat(80));

        // Salir con código de error si hay errores críticos
        if (this.errors.length > 0) {
            process.exit(1);
        }
    }
}

// Ejecutar verificación si es llamado directamente
if (require.main === module) {
    const verifier = new ProductionConfigVerifier();
    verifier.runAllChecks().catch(error => {
        console.error('❌ Error durante la verificación:', error);
        process.exit(1);
    });
}

module.exports = ProductionConfigVerifier;