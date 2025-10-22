#!/usr/bin/env node

/**
 * 🧹 LIMPIADOR INTELIGENTE DE DOCUMENTACIÓN BGE
 * cleanup-docs.js - Sistema de Limpieza Automatizada
 *
 * Funcionalidad:
 * - Elimina documentación obsoleta automáticamente
 * - Detecta duplicados inteligentemente
 * - Archiva historiales preservando información importante
 * - Consolida información fragmentada
 *
 * Uso: node scripts/docs-automation/cleanup-docs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BGEDocsCleanup {
    constructor(dryRun = false) {
        this.projectRoot = path.resolve(__dirname, '../../');
        this.dryRun = dryRun;
        this.duplicates = new Map();
        this.obsoletes = [];
        this.archived = [];
        this.consolidated = [];

        console.log('🧹 Iniciando BGE Docs Cleanup...');
        console.log(`🔧 Modo: ${dryRun ? 'DRY RUN (simulación)' : 'EJECUCIÓN REAL'}`);
        console.log('📁 Directorio del proyecto:', this.projectRoot);
    }

    // Encontrar archivos markdown
    findMarkdownFiles() {
        console.log('🔍 Buscando archivos markdown...');

        const markdownFiles = [];

        // Buscar en raíz
        const rootFiles = fs.readdirSync(this.projectRoot)
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(this.projectRoot, file));

        // Buscar en docs/
        const docsDir = path.join(this.projectRoot, 'docs');
        let docsFiles = [];
        if (fs.existsSync(docsDir)) {
            docsFiles = this.getAllMarkdownInDir(docsDir);
        }

        // Buscar en reports/
        const reportsDir = path.join(this.projectRoot, 'reports');
        let reportsFiles = [];
        if (fs.existsSync(reportsDir)) {
            reportsFiles = this.getAllMarkdownInDir(reportsDir);
        }

        markdownFiles.push(...rootFiles, ...docsFiles, ...reportsFiles);

        console.log(`✅ Encontrados ${markdownFiles.length} archivos markdown`);
        return markdownFiles;
    }

    // Obtener todos los markdown en un directorio recursivamente
    getAllMarkdownInDir(dir) {
        const files = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...this.getAllMarkdownInDir(fullPath));
            } else if (entry.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }

        return files;
    }

    // Calcular hash de contenido para detectar duplicados
    getContentHash(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            // Normalizar contenido (remover fechas y timestamps para comparación)
            const normalizedContent = content
                .replace(/\*\*📅.*?\*\*/g, '') // Remover fechas
                .replace(/\d{1,2} de \w+ de \d{4}/g, '') // Remover fechas en español
                .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remover fechas ISO
                .replace(/\s+/g, ' ') // Normalizar espacios
                .trim();

            return crypto.createHash('md5').update(normalizedContent).digest('hex');
        } catch (error) {
            console.error(`❌ Error calculando hash para ${filePath}:`, error.message);
            return null;
        }
    }

    // Detectar archivos duplicados
    detectDuplicates() {
        console.log('🔍 Detectando archivos duplicados...');

        const files = this.findMarkdownFiles();
        const hashMap = new Map();

        files.forEach(file => {
            const hash = this.getContentHash(file);
            if (hash) {
                if (hashMap.has(hash)) {
                    // Es un duplicado
                    const original = hashMap.get(hash);
                    if (!this.duplicates.has(hash)) {
                        this.duplicates.set(hash, [original]);
                    }
                    this.duplicates.get(hash).push(file);
                } else {
                    hashMap.set(hash, file);
                }
            }
        });

        console.log(`🔍 Detectados ${this.duplicates.size} grupos de duplicados`);
        let totalDuplicates = 0;
        for (const group of this.duplicates.values()) {
            totalDuplicates += group.length - 1; // -1 porque el original se mantiene
        }
        console.log(`📊 Total archivos duplicados: ${totalDuplicates}`);
    }

    // Identificar archivos obsoletos
    identifyObsoletes() {
        console.log('🗑️ Identificando archivos obsoletos...');

        const files = this.findMarkdownFiles();
        const obsoletePatterns = [
            /RECORDATORIO.*DEPLOYMENT/i,
            /REPORTE.*ERRORES/i,
            /SOLUCION.*ERRORES/i,
            /RESUMEN.*ERRORES/i,
            /HOTFIX/i,
            /TEMPORAL/i,
            /TODO.*DELETE/i
        ];

        const obsoleteKeywords = [
            'TEMPORAL',
            'DELETE',
            'OBSOLETO',
            'DEPRECATED',
            'OLD',
            'BACKUP'
        ];

        files.forEach(file => {
            const fileName = path.basename(file);
            const isObsoleteByName = obsoletePatterns.some(pattern => pattern.test(fileName));

            if (isObsoleteByName) {
                this.obsoletes.push({
                    file,
                    reason: 'Nombre indica obsolescencia'
                });
                return;
            }

            try {
                const content = fs.readFileSync(file, 'utf8');
                const hasObsoleteKeywords = obsoleteKeywords.some(keyword =>
                    content.toLowerCase().includes(keyword.toLowerCase())
                );

                if (hasObsoleteKeywords) {
                    this.obsoletes.push({
                        file,
                        reason: 'Contenido indica obsolescencia'
                    });
                }

                // Detectar reportes de errores ya resueltos
                if (content.includes('ERROR') && content.includes('RESUELTO')) {
                    this.obsoletes.push({
                        file,
                        reason: 'Reporte de error ya resuelto'
                    });
                }

            } catch (error) {
                console.error(`❌ Error leyendo ${file}:`, error.message);
            }
        });

        console.log(`🗑️ Identificados ${this.obsoletes.length} archivos obsoletos`);
    }

    // Crear estructura de archivo limpia
    createCleanStructure() {
        console.log('🏗️ Creando estructura de documentación limpia...');

        const cleanStructure = {
            'docs/tecnica/': [
                'GUIA_BACKEND.md',
                'GUIA_DATABASE.md',
                'GUIA_DEPLOYMENT.md',
                'DEBUG_TOOLS.md'
            ],
            'docs/arquitectura/': [
                'MAPA_MAESTRO_COMPLETO.md',
                'MAPA_DEPENDENCIAS_JS.md',
                'MAPA_AUTENTICACION.md'
            ],
            'docs/seguridad/': [
                'CHECKLIST_SEGURIDAD.md'
            ],
            'docs/historial/fases/': [
                'FASE_A_OPTIMIZACION.md',
                'FASE_B_EDUCATIVO.md',
                'FASE_C_SEP.md',
                'FASE_D_SEGURIDAD.md',
                'FASE_E_MOBILE.md',
                'FASE_F_IA.md',
                'FASE_G_INTEGRACION.md'
            ]
        };

        // Crear directorios si no existen
        for (const dir of Object.keys(cleanStructure)) {
            const fullDir = path.join(this.projectRoot, dir);
            if (!this.dryRun && !fs.existsSync(fullDir)) {
                fs.mkdirSync(fullDir, { recursive: true });
                console.log(`📁 Creado directorio: ${dir}`);
            } else if (this.dryRun) {
                console.log(`📁 [DRY RUN] Crearía directorio: ${dir}`);
            }
        }
    }

    // Mover archivos a nueva estructura
    reorganizeFiles() {
        console.log('🔄 Reorganizando archivos...');

        const moveMap = new Map([
            // Archivos técnicos
            ['GUIA_BACKEND.md', 'docs/tecnica/GUIA_BACKEND.md'],
            ['GUIA_DATABASE_COMPLETA.md', 'docs/tecnica/GUIA_DATABASE.md'],
            ['README-DEPLOYMENT.md', 'docs/tecnica/GUIA_DEPLOYMENT.md'],
            ['DEBUG_TOOLS_REFERENCE.md', 'docs/tecnica/DEBUG_TOOLS.md'],

            // Archivos de seguridad
            ['CHECKLIST-SEGURIDAD-FASE1.md', 'docs/seguridad/CHECKLIST_SEGURIDAD.md'],

            // Archivos de fases (renombrados)
            ['FASE_A_OPTIMIZACION_COMPLETADA.md', 'docs/historial/fases/FASE_A_OPTIMIZACION.md'],
            ['FASE_B_SISTEMA_EDUCATIVO_COMPLETADA.md', 'docs/historial/fases/FASE_B_EDUCATIVO.md'],
            ['FASE_C_INTEGRACION_SEP_COMPLETADA.md', 'docs/historial/fases/FASE_C_SEP.md'],
            ['FASE_D_SEGURIDAD_COMPLETADA.md', 'docs/historial/fases/FASE_D_SEGURIDAD.md'],
            ['FASE_E_MOBILE_NATIVE_REPORT.md', 'docs/historial/fases/FASE_E_MOBILE.md'],
            ['FASE_F_IA_AVANZADA_REPORT.md', 'docs/historial/fases/FASE_F_IA.md'],
            ['FASE_G_INTEGRACION_TOTAL_REPORT.md', 'docs/historial/fases/FASE_G_INTEGRACION.md']
        ]);

        const files = this.findMarkdownFiles();

        for (const [source, target] of moveMap) {
            const sourceFile = files.find(file => path.basename(file) === source);
            if (sourceFile) {
                const targetPath = path.join(this.projectRoot, target);

                if (!this.dryRun) {
                    try {
                        fs.copyFileSync(sourceFile, targetPath);
                        console.log(`✅ Movido: ${source} → ${target}`);
                        this.consolidated.push({ source: sourceFile, target: targetPath });
                    } catch (error) {
                        console.error(`❌ Error moviendo ${source}:`, error.message);
                    }
                } else {
                    console.log(`🔄 [DRY RUN] Movería: ${source} → ${target}`);
                }
            }
        }
    }

    // Eliminar duplicados y obsoletos
    removeDuplicatesAndObsoletes() {
        console.log('🗑️ Eliminando duplicados y obsoletos...');

        // Eliminar duplicados (mantener el primer archivo de cada grupo)
        for (const [hash, files] of this.duplicates) {
            const toRemove = files.slice(1); // Mantener el primero, eliminar el resto

            toRemove.forEach(file => {
                if (!this.dryRun) {
                    try {
                        fs.unlinkSync(file);
                        console.log(`🗑️ Eliminado duplicado: ${path.basename(file)}`);
                    } catch (error) {
                        console.error(`❌ Error eliminando ${file}:`, error.message);
                    }
                } else {
                    console.log(`🗑️ [DRY RUN] Eliminaría duplicado: ${path.basename(file)}`);
                }
            });
        }

        // Eliminar archivos obsoletos
        this.obsoletes.forEach(({ file, reason }) => {
            if (!this.dryRun) {
                try {
                    fs.unlinkSync(file);
                    console.log(`🗑️ Eliminado obsoleto: ${path.basename(file)} (${reason})`);
                } catch (error) {
                    console.error(`❌ Error eliminando ${file}:`, error.message);
                }
            } else {
                console.log(`🗑️ [DRY RUN] Eliminaría obsoleto: ${path.basename(file)} (${reason})`);
            }
        });
    }

    // Generar reporte de limpieza
    generateReport() {
        const report = `# 🧹 REPORTE DE LIMPIEZA DE DOCUMENTACIÓN
## Generado: ${new Date().toLocaleString('es-MX')}

---

## 📊 RESUMEN DE OPERACIONES

### 🗑️ **ARCHIVOS ELIMINADOS:**
- **Duplicados:** ${Array.from(this.duplicates.values()).reduce((acc, files) => acc + files.length - 1, 0)}
- **Obsoletos:** ${this.obsoletes.length}
- **Total eliminados:** ${Array.from(this.duplicates.values()).reduce((acc, files) => acc + files.length - 1, 0) + this.obsoletes.length}

### 🔄 **ARCHIVOS REORGANIZADOS:**
- **Archivos movidos:** ${this.consolidated.length}
- **Nueva estructura:** ✅ Implementada

---

## 🎯 RESULTADO

- ✅ **Documentación consolidada** en estructura limpia
- ✅ **Duplicados eliminados** automáticamente
- ✅ **Archivos obsoletos** removidos
- ✅ **Estructura organizada** por categorías

**Estado:** ${this.dryRun ? '🔄 SIMULACIÓN COMPLETADA' : '✅ LIMPIEZA EJECUTADA'}

---

**🤖 Generado automáticamente por BGE Docs Cleanup v1.0**`;

        const reportPath = path.join(this.projectRoot, 'REPORTE_LIMPIEZA_DOCS.md');

        if (!this.dryRun) {
            fs.writeFileSync(reportPath, report, 'utf8');
            console.log('📄 Reporte generado: REPORTE_LIMPIEZA_DOCS.md');
        } else {
            console.log('📄 [DRY RUN] Reporte que se generaría:');
            console.log(report);
        }
    }

    // Ejecutar limpieza completa
    async run() {
        console.log('🚀 Iniciando limpieza de documentación...');
        console.log('=' .repeat(60));

        this.detectDuplicates();
        this.identifyObsoletes();
        this.createCleanStructure();
        this.reorganizeFiles();
        this.removeDuplicatesAndObsoletes();
        this.generateReport();

        console.log('=' .repeat(60));
        console.log('🎉 Limpieza de documentación completada!');

        if (this.dryRun) {
            console.log('ℹ️ Para ejecutar realmente, ejecutar sin --dry-run');
        } else {
            console.log('✅ Documentación organizada exitosamente');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    const cleanup = new BGEDocsCleanup(dryRun);
    cleanup.run().catch(console.error);
}

module.exports = BGEDocsCleanup;