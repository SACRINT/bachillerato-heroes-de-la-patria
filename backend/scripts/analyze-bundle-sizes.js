/**
 * 📦 BUNDLE SIZE ANALYZER - SEMANA 26
 * Script para analizar tamaños de bundles JavaScript
 *
 * Uso:
 * node backend/scripts/analyze-bundle-sizes.js
 *
 * Fecha: 20 Noviembre 2025
 */

const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
    constructor() {
        this.publicJsDir = path.join(__dirname, '../../public/js');
        this.files = [];
        this.stats = {
            totalFiles: 0,
            totalSize: 0,
            largeFiles: [],      // >50KB
            mediumFiles: [],     // 20-50KB
            smallFiles: [],      // <20KB
            duplicatePatterns: [],
            recommendations: []
        };
    }

    /**
     * ANALYZE ALL FILES
     */
    analyze() {
        console.log('📦 Analyzing bundle sizes...\n');

        // Read all JS files
        this.readDirectory(this.publicJsDir);

        // Calculate statistics
        this.calculateStats();

        // Detect duplications
        this.detectDuplications();

        // Generate recommendations
        this.generateRecommendations();

        // Print report
        this.printReport();
    }

    /**
     * READ DIRECTORY RECURSIVELY
     */
    readDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                this.readDirectory(fullPath);
            } else if (entry.name.endsWith('.js')) {
                const stats = fs.statSync(fullPath);
                const content = fs.readFileSync(fullPath, 'utf-8');

                this.files.push({
                    name: entry.name,
                    path: fullPath.replace(path.join(__dirname, '../..'), ''),
                    size: stats.size,
                    sizeKB: (stats.size / 1024).toFixed(2),
                    lines: content.split('\n').length,
                    content: content
                });
            }
        }
    }

    /**
     * CALCULATE STATISTICS
     */
    calculateStats() {
        this.stats.totalFiles = this.files.length;
        this.stats.totalSize = this.files.reduce((sum, f) => sum + f.size, 0);

        // Categorize by size
        for (const file of this.files) {
            const sizeKB = parseFloat(file.sizeKB);

            if (sizeKB > 50) {
                this.stats.largeFiles.push(file);
            } else if (sizeKB > 20) {
                this.stats.mediumFiles.push(file);
            } else {
                this.stats.smallFiles.push(file);
            }
        }

        // Sort by size
        this.stats.largeFiles.sort((a, b) => b.size - a.size);
        this.stats.mediumFiles.sort((a, b) => b.size - a.size);
    }

    /**
     * DETECT DUPLICATIONS
     */
    detectDuplications() {
        // Common library patterns
        const libraryPatterns = [
            { name: 'Chart.js', pattern: /Chart\./g },
            { name: 'Bootstrap JS', pattern: /bootstrap/gi },
            { name: 'jQuery', pattern: /\$\(/g },
            { name: 'Lodash', pattern: /_\./g },
            { name: 'Moment.js', pattern: /moment\(/g },
            { name: 'Axios', pattern: /axios\./g },
            { name: 'DOMPurify', pattern: /DOMPurify/g }
        ];

        const detections = new Map();

        for (const file of this.files) {
            for (const lib of libraryPatterns) {
                const matches = file.content.match(lib.pattern);
                if (matches && matches.length > 5) {
                    if (!detections.has(lib.name)) {
                        detections.set(lib.name, []);
                    }
                    detections.get(lib.name).push({
                        file: file.name,
                        occurrences: matches.length
                    });
                }
            }
        }

        // Store duplications with multiple files
        for (const [libName, files] of detections.entries()) {
            if (files.length > 1) {
                this.stats.duplicatePatterns.push({
                    library: libName,
                    files: files,
                    count: files.length
                });
            }
        }
    }

    /**
     * GENERATE RECOMMENDATIONS
     */
    generateRecommendations() {
        const recs = this.stats.recommendations;

        // Recommendation 1: Large files
        if (this.stats.largeFiles.length > 0) {
            recs.push({
                priority: 'HIGH',
                category: 'Code Splitting',
                issue: `${this.stats.largeFiles.length} files are >50KB`,
                files: this.stats.largeFiles.map(f => f.name),
                solution: 'Consider code splitting these large files into smaller modules'
            });
        }

        // Recommendation 2: Duplications
        if (this.stats.duplicatePatterns.length > 0) {
            recs.push({
                priority: 'MEDIUM',
                category: 'Library Deduplication',
                issue: `${this.stats.duplicatePatterns.length} libraries found in multiple files`,
                libraries: this.stats.duplicatePatterns.map(d => d.library),
                solution: 'Load these libraries once globally or use a bundler'
            });
        }

        // Recommendation 3: Bundle size
        const totalSizeMB = (this.stats.totalSize / 1024 / 1024).toFixed(2);
        if (totalSizeMB > 2) {
            recs.push({
                priority: 'HIGH',
                category: 'Total Bundle Size',
                issue: `Total JS size is ${totalSizeMB}MB`,
                solution: 'Implement lazy loading for non-critical scripts'
            });
        }

        // Recommendation 4: Minification
        const unminified = this.files.filter(f => !f.name.includes('.min.'));
        if (unminified.length > 10) {
            recs.push({
                priority: 'MEDIUM',
                category: 'Minification',
                issue: `${unminified.length} files are not minified`,
                solution: 'Use Webpack/Rollup with minification for production'
            });
        }

        // Recommendation 5: Lazy loading candidates
        const lazyLoadCandidates = this.files.filter(f =>
            f.name.includes('advanced') ||
            f.name.includes('gamification') ||
            f.name.includes('ai-') ||
            f.name.includes('ml-') ||
            f.name.includes('ar-') ||
            f.name.includes('vr-')
        );

        if (lazyLoadCandidates.length > 0) {
            recs.push({
                priority: 'MEDIUM',
                category: 'Lazy Loading',
                issue: `${lazyLoadCandidates.length} advanced feature files load on every page`,
                files: lazyLoadCandidates.map(f => f.name),
                solution: 'Lazy load these features only when needed'
            });
        }
    }

    /**
     * PRINT REPORT
     */
    printReport() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 BUNDLE SIZE ANALYSIS REPORT');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Summary
        console.log('📈 SUMMARY:');
        console.log(`   Total Files: ${this.stats.totalFiles}`);
        console.log(`   Total Size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Large Files (>50KB): ${this.stats.largeFiles.length}`);
        console.log(`   Medium Files (20-50KB): ${this.stats.mediumFiles.length}`);
        console.log(`   Small Files (<20KB): ${this.stats.smallFiles.length}\n`);

        // Large files
        if (this.stats.largeFiles.length > 0) {
            console.log('🔴 LARGE FILES (>50KB):');
            for (const file of this.stats.largeFiles.slice(0, 10)) {
                console.log(`   ${file.name.padEnd(50)} ${file.sizeKB} KB (${file.lines} lines)`);
            }
            console.log('');
        }

        // Medium files
        if (this.stats.mediumFiles.length > 0) {
            console.log('🟡 MEDIUM FILES (20-50KB):');
            for (const file of this.stats.mediumFiles.slice(0, 5)) {
                console.log(`   ${file.name.padEnd(50)} ${file.sizeKB} KB`);
            }
            console.log('');
        }

        // Duplications
        if (this.stats.duplicatePatterns.length > 0) {
            console.log('📦 DUPLICATE LIBRARY USAGE:');
            for (const dup of this.stats.duplicatePatterns) {
                console.log(`   ${dup.library} - found in ${dup.count} files:`);
                for (const file of dup.files.slice(0, 5)) {
                    console.log(`     - ${file.file} (${file.occurrences} occurrences)`);
                }
            }
            console.log('');
        }

        // Recommendations
        if (this.stats.recommendations.length > 0) {
            console.log('💡 RECOMMENDATIONS:');
            for (let i = 0; i < this.stats.recommendations.length; i++) {
                const rec = this.stats.recommendations[i];
                console.log(`\n   ${i + 1}. [${rec.priority}] ${rec.category}`);
                console.log(`      Issue: ${rec.issue}`);
                console.log(`      Solution: ${rec.solution}`);

                if (rec.files && rec.files.length > 0) {
                    console.log(`      Files: ${rec.files.slice(0, 3).join(', ')}${rec.files.length > 3 ? '...' : ''}`);
                }
            }
            console.log('');
        }

        console.log('═══════════════════════════════════════════════════════════\n');

        // Write JSON report
        this.writeJSONReport();
    }

    /**
     * WRITE JSON REPORT
     */
    writeJSONReport() {
        const reportPath = path.join(__dirname, '../../docs/bundle-analysis-report.json');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.stats.totalFiles,
                totalSizeMB: (this.stats.totalSize / 1024 / 1024).toFixed(2),
                largeFilesCount: this.stats.largeFiles.length,
                mediumFilesCount: this.stats.mediumFiles.length,
                smallFilesCount: this.stats.smallFiles.length
            },
            largeFiles: this.stats.largeFiles.map(f => ({
                name: f.name,
                path: f.path,
                sizeKB: f.sizeKB,
                lines: f.lines
            })),
            duplicatePatterns: this.stats.duplicatePatterns,
            recommendations: this.stats.recommendations
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 JSON report saved to: ${reportPath}\n`);
    }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze();
