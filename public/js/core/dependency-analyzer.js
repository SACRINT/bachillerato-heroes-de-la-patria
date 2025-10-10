/**
 * 🔍 DEPENDENCY ANALYZER - ANÁLISIS DE DEPENDENCIAS BGE
 * Analizador de dependencias y optimización de archivos
 */

class BGEDependencyAnalyzer {
    constructor() {
        this.dependencies = new Map();
        this.duplicates = new Map();
        this.obsoleteFiles = new Set();
        this.analysisResults = {
            totalFiles: 0,
            duplicateCount: 0,
            obsoleteCount: 0,
            sizeSaved: 0,
            recommendations: []
        };

        this.init();
    }

    init() {
        BGELogger?.info('Dependency Analyzer', '🔍 Iniciando análisis de dependencias...');

        // Analizar scripts cargados
        this.analyzeLoadedScripts();

        // Detectar duplicados
        this.detectDuplicates();

        // Identificar archivos obsoletos
        this.identifyObsoleteFiles();

        // Generar recomendaciones
        this.generateRecommendations();
    }

    // Analizar scripts cargados
    analyzeLoadedScripts() {
        const scripts = document.querySelectorAll('script[src]');

        scripts.forEach(script => {
            const src = script.src;
            const filename = this.extractFilename(src);

            if (filename.endsWith('.js')) {
                this.dependencies.set(filename, {
                    src,
                    element: script,
                    size: this.estimateFileSize(script),
                    loadOrder: this.dependencies.size,
                    isExternal: this.isExternalScript(src),
                    category: this.categorizeScript(filename)
                });

                this.analysisResults.totalFiles++;
            }
        });

        BGELogger?.debug('Dependency Analyzer', `📊 Scripts analizados: ${this.analysisResults.totalFiles}`);
    }

    // Extraer nombre de archivo
    extractFilename(src) {
        return src.split('/').pop().split('?')[0];
    }

    // Estimar tamaño de archivo
    estimateFileSize(script) {
        // Estimación basada en el tipo y nombre del archivo
        const filename = this.extractFilename(script.src);

        const sizeEstimates = {
            'dashboard-manager-2025.js': 150000, // ~150KB
            'ai-educational-system.js': 80000,   // ~80KB
            'advanced-ai-system.js': 70000,      // ~70KB
            'chatbot.js': 45000,                 // ~45KB
            'bundle-manager.js': 15000,          // ~15KB
            'logger.js': 12000                   // ~12KB
        };

        return sizeEstimates[filename] || 20000; // Default 20KB
    }

    // Verificar si es script externo
    isExternalScript(src) {
        return src.includes('cdn.') ||
               src.includes('googleapis.') ||
               src.includes('bootstrap') ||
               src.startsWith('http') && !src.includes(window.location.hostname);
    }

    // Categorizar script
    categorizeScript(filename) {
        const categories = {
            'core': ['logger', 'bundle-manager', 'context-manager', 'performance-monitor'],
            'auth': ['auth-interface', 'admin-auth', 'google-auth'],
            'ai': ['ai-educational', 'ai-tutor', 'ai-recommendation', 'chatbot', 'ai-progress'],
            'dashboard': ['dashboard-manager', 'dashboard-personalizer'],
            'ar': ['ar-education', 'virtual-labs', 'lab-simulator'],
            'gamification': ['achievement-system', 'competitions', 'gamification'],
            'utils': ['image-optimizer', 'theme-manager', 'notification-manager'],
            'deprecated': ['OLD-BACKUP', 'backup', 'deprecated']
        };

        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => filename.toLowerCase().includes(keyword.toLowerCase()))) {
                return category;
            }
        }

        return 'other';
    }

    // Detectar duplicados
    detectDuplicates() {
        const fileGroups = new Map();

        // Agrupar archivos similares
        this.dependencies.forEach((info, filename) => {
            const baseName = this.getBaseName(filename);

            if (!fileGroups.has(baseName)) {
                fileGroups.set(baseName, []);
            }

            fileGroups.get(baseName).push({ filename, ...info });
        });

        // Identificar duplicados
        fileGroups.forEach((files, baseName) => {
            if (files.length > 1) {
                this.duplicates.set(baseName, files);
                this.analysisResults.duplicateCount += files.length - 1;

                BGELogger?.warn('Dependency Analyzer', `🔄 Duplicados detectados: ${baseName}`, {
                    count: files.length,
                    files: files.map(f => f.filename)
                });
            }
        });
    }

    // Obtener nombre base (sin versiones/sufijos)
    getBaseName(filename) {
        return filename
            .replace(/(-v\d+|-\d+|-OLD|-BACKUP|-backup)/, '')
            .replace(/\.(min|dev)/, '')
            .replace('.js', '');
    }

    // Identificar archivos obsoletos
    identifyObsoleteFiles() {
        const obsoletePatterns = [
            /OLD-BACKUP/i,
            /\.backup/i,
            /deprecated/i,
            /-old/i,
            /temp-/i,
            /test-/i
        ];

        this.dependencies.forEach((info, filename) => {
            if (obsoletePatterns.some(pattern => pattern.test(filename))) {
                this.obsoleteFiles.add(filename);
                this.analysisResults.obsoleteCount++;
                this.analysisResults.sizeSaved += info.size;
            }
        });

        BGELogger?.info('Dependency Analyzer', `🗑️ Archivos obsoletos: ${this.analysisResults.obsoleteCount}`);
    }

    // Generar recomendaciones
    generateRecommendations() {
        const recommendations = [];

        // Recomendaciones para duplicados
        if (this.duplicates.size > 0) {
            recommendations.push({
                type: 'duplicates',
                priority: 'high',
                description: `Eliminar ${this.analysisResults.duplicateCount} archivos duplicados`,
                action: 'remove_duplicates',
                files: Array.from(this.duplicates.values()).flat().map(f => f.filename)
            });
        }

        // Recomendaciones para archivos obsoletos
        if (this.obsoleteFiles.size > 0) {
            recommendations.push({
                type: 'obsolete',
                priority: 'high',
                description: `Mover ${this.obsoleteFiles.size} archivos obsoletos`,
                action: 'move_to_unused',
                files: Array.from(this.obsoleteFiles),
                sizeSaved: this.analysisResults.sizeSaved
            });
        }

        // Recomendaciones de bundling
        const aiFiles = Array.from(this.dependencies.entries())
            .filter(([, info]) => info.category === 'ai')
            .length;

        if (aiFiles > 3) {
            recommendations.push({
                type: 'bundling',
                priority: 'medium',
                description: `Crear bundle AI (${aiFiles} archivos)`,
                action: 'create_ai_bundle',
                files: Array.from(this.dependencies.entries())
                    .filter(([, info]) => info.category === 'ai')
                    .map(([filename]) => filename)
            });
        }

        // Recomendaciones de lazy loading
        const largeFiles = Array.from(this.dependencies.entries())
            .filter(([, info]) => info.size > 50000)
            .map(([filename]) => filename);

        if (largeFiles.length > 0) {
            recommendations.push({
                type: 'lazy_loading',
                priority: 'medium',
                description: `Implementar lazy loading para ${largeFiles.length} archivos grandes`,
                action: 'setup_lazy_loading',
                files: largeFiles
            });
        }

        this.analysisResults.recommendations = recommendations;
    }

    // Ejecutar optimización automática
    async performAutomaticOptimization() {
        BGELogger?.info('Dependency Analyzer', '🚀 Ejecutando optimización automática...');

        for (const recommendation of this.analysisResults.recommendations) {
            if (recommendation.priority === 'high') {
                try {
                    await this.executeRecommendation(recommendation);
                } catch (error) {
                    BGELogger?.error('Dependency Analyzer', `Error ejecutando: ${recommendation.action}`, error);
                }
            }
        }
    }

    // Ejecutar recomendación específica
    async executeRecommendation(recommendation) {
        switch (recommendation.action) {
            case 'remove_duplicates':
                this.removeDuplicateFiles(recommendation.files);
                break;

            case 'move_to_unused':
                this.moveObsoleteFiles(recommendation.files);
                break;

            case 'create_ai_bundle':
                await this.createAIBundle(recommendation.files);
                break;

            case 'setup_lazy_loading':
                this.setupLazyLoadingForFiles(recommendation.files);
                break;
        }
    }

    // Remover archivos duplicados
    removeDuplicateFiles(files) {
        files.forEach(filename => {
            const info = this.dependencies.get(filename);
            if (info && info.element && filename.includes('backup')) {
                info.element.remove();
                BGELogger?.info('Dependency Analyzer', `🗑️ Removido duplicado: ${filename}`);
            }
        });
    }

    // Mover archivos obsoletos (simular)
    moveObsoleteFiles(files) {
        files.forEach(filename => {
            const info = this.dependencies.get(filename);
            if (info && info.element) {
                // En un entorno real, aquí se movería el archivo físico
                info.element.remove();
                BGELogger?.info('Dependency Analyzer', `📁 Marcado para mover: ${filename}`);
            }
        });
    }

    // Crear bundle AI
    async createAIBundle(files) {
        BGELogger?.info('Dependency Analyzer', '📦 Creando bundle AI...', { files });

        // Aquí se implementaría la lógica de bundling real
        // Por ahora, solo documentamos la recomendación

        return new Promise(resolve => {
            setTimeout(() => {
                BGELogger?.info('Dependency Analyzer', '✅ Bundle AI conceptual creado');
                resolve();
            }, 100);
        });
    }

    // Configurar lazy loading
    setupLazyLoadingForFiles(files) {
        files.forEach(filename => {
            BGELogger?.info('Dependency Analyzer', `⏳ Configurando lazy loading: ${filename}`);

            // Aquí se implementaría lazy loading real
            // Por ahora, solo marcar como configurado
        });
    }

    // Generar reporte detallado
    generateDetailedReport() {
        const report = {
            summary: {
                totalFiles: this.analysisResults.totalFiles,
                duplicates: this.analysisResults.duplicateCount,
                obsolete: this.analysisResults.obsoleteCount,
                sizeSavedKB: Math.round(this.analysisResults.sizeSaved / 1024),
                recommendations: this.analysisResults.recommendations.length
            },
            categories: this.getCategoryBreakdown(),
            duplicateDetails: this.getDuplicateDetails(),
            obsoleteFiles: Array.from(this.obsoleteFiles),
            recommendations: this.analysisResults.recommendations,
            optimizationPotential: this.calculateOptimizationPotential()
        };

        BGELogger?.info('Dependency Analyzer', '📋 REPORTE DETALLADO DE DEPENDENCIAS', report);
        return report;
    }

    // Desglose por categorías
    getCategoryBreakdown() {
        const breakdown = {};

        this.dependencies.forEach((info, filename) => {
            const category = info.category;
            if (!breakdown[category]) {
                breakdown[category] = { count: 0, totalSize: 0 };
            }
            breakdown[category].count++;
            breakdown[category].totalSize += info.size;
        });

        return breakdown;
    }

    // Detalles de duplicados
    getDuplicateDetails() {
        const details = {};

        this.duplicates.forEach((files, baseName) => {
            details[baseName] = {
                count: files.length,
                files: files.map(f => ({
                    filename: f.filename,
                    size: f.size,
                    category: f.category
                })),
                recommendedAction: 'keep_latest'
            };
        });

        return details;
    }

    // Calcular potencial de optimización
    calculateOptimizationPotential() {
        const totalSize = Array.from(this.dependencies.values())
            .reduce((sum, info) => sum + info.size, 0);

        const optimizableSize = this.analysisResults.sizeSaved +
            Array.from(this.duplicates.values())
                .flat()
                .reduce((sum, file) => sum + file.size, 0);

        return {
            totalSizeKB: Math.round(totalSize / 1024),
            optimizableSizeKB: Math.round(optimizableSize / 1024),
            optimizationPercentage: Math.round((optimizableSize / totalSize) * 100)
        };
    }
}

// Inicialización global
window.BGEDependencyAnalyzer = new BGEDependencyAnalyzer();

// Auto-análisis después de carga
window.addEventListener('load', () => {
    setTimeout(() => {
        window.BGEDependencyAnalyzer.generateDetailedReport();
    }, 2000);
});

console.log('✅ BGE Dependency Analyzer cargado exitosamente');