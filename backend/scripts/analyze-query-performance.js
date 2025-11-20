/**
 * 🔍 QUERY PERFORMANCE ANALYZER - SEMANA 26
 * Script para analizar performance de queries con EXPLAIN ANALYZE
 *
 * Uso:
 * node backend/scripts/analyze-query-performance.js
 *
 * Fecha: 20 Noviembre 2025
 */

const { Pool } = require('pg');
require('dotenv').config();

class QueryPerformanceAnalyzer {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        // Common queries to analyze
        this.commonQueries = [
            {
                name: 'Get All Students',
                query: 'SELECT * FROM usuarios WHERE role = $1',
                params: ['estudiante']
            },
            {
                name: 'Get Student with Grades',
                query: `SELECT u.*, c.nombre as curso
                        FROM usuarios u
                        LEFT JOIN calificaciones cal ON u.id = cal.estudiante_id
                        LEFT JOIN cursos c ON cal.curso_id = c.id
                        WHERE u.role = $1`,
                params: ['estudiante']
            },
            {
                name: 'Search News',
                query: `SELECT * FROM noticias
                        WHERE titulo LIKE $1 OR contenido LIKE $1
                        ORDER BY fecha_publicacion DESC`,
                params: ['%educación%']
            },
            {
                name: 'Get Recent Notifications',
                query: `SELECT * FROM notificaciones
                        WHERE usuario_id = $1
                        ORDER BY created_at DESC
                        LIMIT 20`,
                params: [1]
            },
            {
                name: 'Count Active Users by Role',
                query: `SELECT role, COUNT(*) as total
                        FROM usuarios
                        WHERE status = 'activo'
                        GROUP BY role`
            }
        ];

        this.results = [];
    }

    /**
     * RUN ANALYSIS
     */
    async analyze() {
        console.log('🔍 Starting Query Performance Analysis...\n');

        try {
            // Analyze common queries
            for (const queryDef of this.commonQueries) {
                await this.analyzeQuery(queryDef);
            }

            // Generate report
            this.generateReport();

            // Generate index recommendations
            this.generateIndexRecommendations();

        } catch (error) {
            console.error('❌ Analysis error:', error);
        } finally {
            await this.pool.end();
        }
    }

    /**
     * ANALYZE SINGLE QUERY
     */
    async analyzeQuery(queryDef) {
        console.log(`\n📊 Analyzing: ${queryDef.name}`);
        console.log(`Query: ${queryDef.query.substring(0, 100)}...`);

        try {
            // Run EXPLAIN ANALYZE
            const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${queryDef.query}`;
            const explainResult = await this.pool.query(explainQuery, queryDef.params || []);

            const plan = explainResult.rows[0]['QUERY PLAN'][0];
            const planningTime = plan['Planning Time'];
            const executionTime = plan['Execution Time'];
            const totalTime = planningTime + executionTime;

            console.log(`   Planning: ${planningTime.toFixed(2)}ms`);
            console.log(`   Execution: ${executionTime.toFixed(2)}ms`);
            console.log(`   Total: ${totalTime.toFixed(2)}ms`);

            // Analyze plan
            const analysis = this.analyzePlan(plan.Plan);

            // Store result
            this.results.push({
                name: queryDef.name,
                query: queryDef.query,
                planningTime,
                executionTime,
                totalTime,
                plan: plan,
                analysis
            });

            // Print warnings
            if (analysis.warnings.length > 0) {
                console.log(`   ⚠️  Warnings:`);
                analysis.warnings.forEach(w => console.log(`      - ${w}`));
            }

            // Print recommendations
            if (analysis.recommendations.length > 0) {
                console.log(`   💡 Recommendations:`);
                analysis.recommendations.forEach(r => console.log(`      - ${r}`));
            }

        } catch (error) {
            console.error(`   ❌ Error analyzing "${queryDef.name}":`, error.message);
        }
    }

    /**
     * ANALYZE EXECUTION PLAN
     */
    analyzePlan(plan, depth = 0) {
        const analysis = {
            warnings: [],
            recommendations: [],
            seqScans: 0,
            indexScans: 0,
            totalRows: 0
        };

        // Check node type
        if (plan['Node Type'] === 'Seq Scan') {
            analysis.seqScans++;
            analysis.warnings.push(`Sequential scan en tabla ${plan['Relation Name']} (${plan['Actual Rows']} rows)`);
            analysis.recommendations.push(`Considerar índice en ${plan['Relation Name']}`);
        }

        if (plan['Node Type'] === 'Index Scan' || plan['Node Type'] === 'Index Only Scan') {
            analysis.indexScans++;
        }

        // Check for large row counts
        if (plan['Actual Rows'] > 1000) {
            analysis.warnings.push(`Query retorna ${plan['Actual Rows']} rows (considerar paginación)`);
        }

        // Check for row estimate mismatch
        if (plan['Plan Rows'] && plan['Actual Rows']) {
            const ratio = plan['Actual Rows'] / plan['Plan Rows'];
            if (ratio > 10 || ratio < 0.1) {
                analysis.warnings.push(`Estimación de rows muy incorrecta (estimado: ${plan['Plan Rows']}, actual: ${plan['Actual Rows']})`);
                analysis.recommendations.push('Ejecutar ANALYZE en las tablas involucradas');
            }
        }

        // Check for sorts
        if (plan['Node Type'] === 'Sort') {
            if (plan['Sort Method'] && plan['Sort Method'].includes('external')) {
                analysis.warnings.push('Sort usando disco (slow)');
                analysis.recommendations.push('Aumentar work_mem o agregar índice para ORDER BY');
            }
        }

        // Recursively analyze child plans
        if (plan.Plans) {
            plan.Plans.forEach(childPlan => {
                const childAnalysis = this.analyzePlan(childPlan, depth + 1);
                analysis.warnings.push(...childAnalysis.warnings);
                analysis.recommendations.push(...childAnalysis.recommendations);
                analysis.seqScans += childAnalysis.seqScans;
                analysis.indexScans += childAnalysis.indexScans;
            });
        }

        return analysis;
    }

    /**
     * GENERATE REPORT
     */
    generateReport() {
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('📊 QUERY PERFORMANCE ANALYSIS REPORT');
        console.log('═══════════════════════════════════════════════════════════\n');

        // Sort by execution time
        const sortedResults = this.results.sort((a, b) => b.totalTime - a.totalTime);

        console.log('🐌 SLOWEST QUERIES:\n');
        sortedResults.forEach((result, index) => {
            console.log(`${index + 1}. ${result.name}`);
            console.log(`   Total Time: ${result.totalTime.toFixed(2)}ms`);
            console.log(`   Sequential Scans: ${result.analysis.seqScans}`);
            console.log(`   Index Scans: ${result.analysis.indexScans}`);
            if (result.analysis.warnings.length > 0) {
                console.log(`   Issues: ${result.analysis.warnings.length} warnings`);
            }
            console.log('');
        });

        // Summary statistics
        const avgTime = sortedResults.reduce((sum, r) => sum + r.totalTime, 0) / sortedResults.length;
        const totalSeqScans = sortedResults.reduce((sum, r) => sum + r.analysis.seqScans, 0);

        console.log('📈 SUMMARY:\n');
        console.log(`   Total Queries Analyzed: ${sortedResults.length}`);
        console.log(`   Average Execution Time: ${avgTime.toFixed(2)}ms`);
        console.log(`   Total Sequential Scans: ${totalSeqScans}`);
        console.log(`   Queries with Warnings: ${sortedResults.filter(r => r.analysis.warnings.length > 0).length}`);

        console.log('\n═══════════════════════════════════════════════════════════\n');
    }

    /**
     * GENERATE INDEX RECOMMENDATIONS
     */
    generateIndexRecommendations() {
        console.log('💡 INDEX RECOMMENDATIONS:\n');

        const recommendations = new Set();

        this.results.forEach(result => {
            result.analysis.recommendations.forEach(rec => {
                if (rec.includes('índice')) {
                    recommendations.add(rec);
                }
            });
        });

        if (recommendations.size === 0) {
            console.log('   ✅ No index recommendations at this time\n');
            return;
        }

        // Common index recommendations
        const commonIndexes = [
            {
                table: 'usuarios',
                columns: ['email'],
                reason: 'Email usado frecuentemente para login'
            },
            {
                table: 'usuarios',
                columns: ['role', 'status'],
                reason: 'Consultas frecuentes por role y status'
            },
            {
                table: 'notificaciones',
                columns: ['usuario_id', 'created_at'],
                reason: 'Queries de notificaciones recientes por usuario'
            },
            {
                table: 'noticias',
                columns: ['fecha_publicacion'],
                reason: 'ORDER BY fecha_publicacion frecuente'
            },
            {
                table: 'calificaciones',
                columns: ['estudiante_id', 'curso_id'],
                reason: 'JOINs frecuentes con estudiantes y cursos'
            }
        ];

        console.log('   Suggested Indexes:\n');

        commonIndexes.forEach((index, i) => {
            const indexName = `idx_${index.table}_${index.columns.join('_')}`;
            const createSQL = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${index.table}(${index.columns.join(', ')});`;

            console.log(`   ${i + 1}. ${indexName}`);
            console.log(`      Table: ${index.table}`);
            console.log(`      Columns: ${index.columns.join(', ')}`);
            console.log(`      Reason: ${index.reason}`);
            console.log(`      SQL: ${createSQL}`);
            console.log('');
        });

        // Generate SQL file
        this.generateIndexSQL(commonIndexes);
    }

    /**
     * GENERATE INDEX SQL FILE
     */
    generateIndexSQL(indexes) {
        const fs = require('fs');
        const path = require('path');

        let sql = `-- 🔍 RECOMMENDED INDEXES - SEMANA 26
-- Generated: ${new Date().toISOString()}
-- Based on query performance analysis

`;

        indexes.forEach(index => {
            const indexName = `idx_${index.table}_${index.columns.join('_')}`;
            sql += `-- ${index.reason}\n`;
            sql += `CREATE INDEX IF NOT EXISTS ${indexName} ON ${index.table}(${index.columns.join(', ')});\n\n`;
        });

        sql += `-- After creating indexes, run ANALYZE to update statistics:\n`;
        const uniqueTables = [...new Set(indexes.map(i => i.table))];
        uniqueTables.forEach(table => {
            sql += `ANALYZE ${table};\n`;
        });

        const outputPath = path.join(__dirname, '../scripts/recommended-indexes.sql');
        fs.writeFileSync(outputPath, sql);

        console.log(`\n   📄 SQL file generated: ${outputPath}\n`);
    }
}

// Run analysis
const analyzer = new QueryPerformanceAnalyzer();
analyzer.analyze().catch(console.error);
