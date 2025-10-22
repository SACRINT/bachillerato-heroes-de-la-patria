/**
 * 🔍 ANALYZE DEPENDENCIES - BGE PROJECT AUDITOR
 * Script para analizar dependencias y archivos obsoletos en el proyecto BGE
 */

const fs = require('fs');
const path = require('path');

class BGEProjectAuditor {
    constructor() {
        this.projectRoot = process.cwd();
        this.htmlFiles = [];
        this.jsFiles = [];
        this.cssFiles = [];
        this.dependencies = new Map();
        this.orphanedFiles = [];
        this.duplicateFiles = [];
        this.obsoleteFiles = [];
    }

    async auditProject() {
        console.log('🔍 Iniciando auditoría completa del proyecto BGE...\n');

        // 1. Encontrar todos los archivos
        await this.findAllFiles();

        // 2. Analizar dependencias HTML
        await this.analyzeHTMLDependencies();

        // 3. Analizar archivos JS
        await this.analyzeJSFiles();

        // 4. Encontrar archivos huérfanos
        await this.findOrphanedFiles();

        // 5. Encontrar duplicados
        await this.findDuplicateFiles();

        // 6. Generar reporte
        await this.generateReport();
    }

    async findAllFiles() {
        const scanDirectory = (dir) => {
            const files = fs.readdirSync(dir);

            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !this.shouldSkipDirectory(file)) {
                    scanDirectory(fullPath);
                } else if (stat.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    const relativePath = path.relative(this.projectRoot, fullPath);

                    if (ext === '.html') {
                        this.htmlFiles.push(relativePath);
                    } else if (ext === '.js') {
                        this.jsFiles.push(relativePath);
                    } else if (ext === '.css') {
                        this.cssFiles.push(relativePath);
                    }
                }
            });
        };

        scanDirectory(this.projectRoot);

        console.log(`📁 Archivos encontrados:`);
        console.log(`   HTML: ${this.htmlFiles.length}`);
        console.log(`   JS: ${this.jsFiles.length}`);
        console.log(`   CSS: ${this.cssFiles.length}\n`);
    }

    shouldSkipDirectory(dir) {
        const skipDirs = [
            'node_modules', '.git', 'backend/node_modules',
            'server/node_modules', '.next', 'dist', 'build'
        ];
        return skipDirs.includes(dir);
    }

    async analyzeHTMLDependencies() {
        console.log('🔍 Analizando dependencias HTML...');

        for (const htmlFile of this.htmlFiles) {
            try {
                const content = fs.readFileSync(htmlFile, 'utf8');
                const dependencies = this.extractDependencies(content);

                this.dependencies.set(htmlFile, {
                    js: dependencies.js,
                    css: dependencies.css,
                    external: dependencies.external
                });

            } catch (error) {
                console.warn(`⚠️ Error leyendo ${htmlFile}:`, error.message);
            }
        }

        console.log(`✅ ${this.htmlFiles.length} archivos HTML analizados\n`);
    }

    extractDependencies(content) {
        const dependencies = {
            js: [],
            css: [],
            external: []
        };

        // Extraer scripts JS
        const scriptRegex = /<script[^>]+src\s*=\s*["']([^"']+)["'][^>]*>/gi;
        let match;

        while ((match = scriptRegex.exec(content)) !== null) {
            const src = match[1];
            if (src.startsWith('http') || src.startsWith('//')) {
                dependencies.external.push(src);
            } else {
                dependencies.js.push(src);
            }
        }

        // Extraer CSS
        const linkRegex = /<link[^>]+href\s*=\s*["']([^"']+)["'][^>]*>/gi;
        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            if (href.includes('.css')) {
                if (href.startsWith('http') || href.startsWith('//')) {
                    dependencies.external.push(href);
                } else {
                    dependencies.css.push(href);
                }
            }
        }

        return dependencies;
    }

    async analyzeJSFiles() {
        console.log('🔍 Analizando archivos JavaScript...');

        const jsAnalysis = {
            framework: [],
            utility: [],
            component: [],
            obsolete: [],
            system: []
        };

        for (const jsFile of this.jsFiles) {
            try {
                const content = fs.readFileSync(jsFile, 'utf8');
                const analysis = this.analyzeJSContent(content, jsFile);

                jsAnalysis[analysis.category].push({
                    file: jsFile,
                    size: content.length,
                    functions: analysis.functions,
                    dependencies: analysis.dependencies,
                    lastModified: fs.statSync(jsFile).mtime
                });

            } catch (error) {
                console.warn(`⚠️ Error analizando ${jsFile}:`, error.message);
            }
        }

        this.jsAnalysis = jsAnalysis;
        console.log(`✅ ${this.jsFiles.length} archivos JS analizados\n`);
    }

    analyzeJSContent(content, filename) {
        const analysis = {
            category: 'utility',
            functions: [],
            dependencies: [],
            isClass: false,
            isFramework: false
        };

        // Detectar clases
        const classRegex = /class\s+(\w+)/g;
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            analysis.functions.push(match[1]);
            analysis.isClass = true;
        }

        // Detectar funciones
        const functionRegex = /function\s+(\w+)/g;
        while ((match = functionRegex.exec(content)) !== null) {
            analysis.functions.push(match[1]);
        }

        // Categorizar archivo
        if (filename.includes('framework') || analysis.functions.length > 10) {
            analysis.category = 'framework';
        } else if (filename.includes('system') || filename.includes('manager')) {
            analysis.category = 'system';
        } else if (filename.includes('component') || analysis.isClass) {
            analysis.category = 'component';
        } else if (this.isObsoleteFile(filename, content)) {
            analysis.category = 'obsolete';
        }

        return analysis;
    }

    isObsoleteFile(filename, content) {
        const obsoletePatterns = [
            'deprecated',
            'old',
            'backup',
            'temp',
            'test',
            '_old',
            '.backup'
        ];

        // Verificar nombre de archivo
        if (obsoletePatterns.some(pattern => filename.includes(pattern))) {
            return true;
        }

        // Verificar comentarios de deprecación
        if (content.includes('@deprecated') || content.includes('// DEPRECATED')) {
            return true;
        }

        return false;
    }

    async findOrphanedFiles() {
        console.log('🔍 Buscando archivos huérfanos...');

        const usedFiles = new Set();

        // Recopilar todos los archivos referenciados
        for (const [htmlFile, deps] of this.dependencies) {
            deps.js.forEach(js => usedFiles.add(this.normalizePath(js)));
            deps.css.forEach(css => usedFiles.add(this.normalizePath(css)));
        }

        // Encontrar archivos no referenciados
        this.jsFiles.forEach(jsFile => {
            if (!usedFiles.has(jsFile) && !this.isSystemFile(jsFile)) {
                this.orphanedFiles.push(jsFile);
            }
        });

        this.cssFiles.forEach(cssFile => {
            if (!usedFiles.has(cssFile)) {
                this.orphanedFiles.push(cssFile);
            }
        });

        console.log(`⚠️ ${this.orphanedFiles.length} archivos huérfanos encontrados\n`);
    }

    normalizePath(filePath) {
        // Normalizar rutas para comparación
        return filePath.replace(/^\.\//, '').replace(/^\//, '');
    }

    isSystemFile(filename) {
        const systemPatterns = [
            'sw.js',
            'sw-',
            'service-worker',
            'dev-override',
            'context-manager'
        ];

        return systemPatterns.some(pattern => filename.includes(pattern));
    }

    async findDuplicateFiles() {
        console.log('🔍 Buscando archivos duplicados...');

        const fileContents = new Map();

        // Verificar JS duplicados
        for (const jsFile of this.jsFiles) {
            try {
                const content = fs.readFileSync(jsFile, 'utf8');
                const hash = this.simpleHash(content);

                if (fileContents.has(hash)) {
                    this.duplicateFiles.push({
                        original: fileContents.get(hash),
                        duplicate: jsFile,
                        type: 'js'
                    });
                } else {
                    fileContents.set(hash, jsFile);
                }
            } catch (error) {
                // Ignorar errores de lectura
            }
        }

        console.log(`🔄 ${this.duplicateFiles.length} archivos duplicados encontrados\n`);
    }

    simpleHash(content) {
        // Hash simple para detectar contenido similar
        return content.replace(/\s+/g, '').substring(0, 100);
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalHTML: this.htmlFiles.length,
                totalJS: this.jsFiles.length,
                totalCSS: this.cssFiles.length,
                orphanedFiles: this.orphanedFiles.length,
                duplicateFiles: this.duplicateFiles.length
            },
            htmlFiles: this.htmlFiles,
            dependencies: Object.fromEntries(this.dependencies),
            jsAnalysis: this.jsAnalysis,
            orphanedFiles: this.orphanedFiles,
            duplicateFiles: this.duplicateFiles,
            recommendations: this.generateRecommendations()
        };

        // Guardar reporte
        const reportPath = path.join(this.projectRoot, 'reports', 'project-audit.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Mostrar resumen
        this.displaySummary(report);

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Archivos huérfanos
        if (this.orphanedFiles.length > 0) {
            recommendations.push({
                type: 'cleanup',
                priority: 'medium',
                action: `Mover ${this.orphanedFiles.length} archivos huérfanos a no_usados/`,
                files: this.orphanedFiles
            });
        }

        // Archivos duplicados
        if (this.duplicateFiles.length > 0) {
            recommendations.push({
                type: 'consolidation',
                priority: 'high',
                action: `Consolidar ${this.duplicateFiles.length} archivos duplicados`,
                files: this.duplicateFiles
            });
        }

        // Framework consolidation
        if (this.jsAnalysis.framework.length > 5) {
            recommendations.push({
                type: 'framework',
                priority: 'high',
                action: 'Crear framework unificado BGE',
                reason: `${this.jsAnalysis.framework.length} archivos de framework detectados`
            });
        }

        return recommendations;
    }

    displaySummary(report) {
        console.log('📊 RESUMEN DE AUDITORÍA DEL PROYECTO BGE');
        console.log('='.repeat(50));
        console.log(`📁 Total archivos HTML: ${report.summary.totalHTML}`);
        console.log(`📄 Total archivos JS: ${report.summary.totalJS}`);
        console.log(`🎨 Total archivos CSS: ${report.summary.totalCSS}`);
        console.log(`⚠️  Archivos huérfanos: ${report.summary.orphanedFiles}`);
        console.log(`🔄 Archivos duplicados: ${report.summary.duplicateFiles}`);
        console.log('\n🎯 RECOMENDACIONES:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        });
        console.log('\n✅ Reporte guardado en: reports/project-audit.json');
    }
}

// Ejecutar auditoría
if (require.main === module) {
    const auditor = new BGEProjectAuditor();
    auditor.auditProject().catch(console.error);
}

module.exports = BGEProjectAuditor;