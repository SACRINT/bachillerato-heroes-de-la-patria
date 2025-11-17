#!/usr/bin/env node
/**
 * 🔐 SCRIPT DE AUDITORÍA DE SQL INJECTION
 *
 * Analiza queries SQL en el backend para detectar vulnerabilidades de SQL injection
 * Verifica que se usen parámetros ($1, $2) en lugar de concatenación de strings
 *
 * Semana 2 - Tarea 8: SQL Injection Prevention
 * Fecha: 17 Noviembre 2025
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    // Directorios a escanear
    scanDirs: [
        path.join(__dirname, '../routes'),
        path.join(__dirname, '../data'),
        path.join(__dirname, '../services'),
        path.join(__dirname, '../')
    ],

    // Extensiones a procesar
    extensions: ['.js', '.mjs'],

    // Archivos a ignorar
    ignoreFiles: [
        'audit-sql-injection.mjs',
        'security-audit-owasp.js',
        'test-',
        '.test.js',
        '.spec.js'
    ],

    // Patrones de queries SQL inseguras
    unsafePatterns: [
        {
            name: 'String concatenation in SELECT',
            regex: /SELECT\s+.*?\s+FROM\s+.*?\s+WHERE\s+.*?(\+|`\$\{|"\s*\+\s*|'\s*\+\s*)/gi,
            severity: 'CRITICAL',
            description: 'Query SQL con concatenación de strings en WHERE clause'
        },
        {
            name: 'String interpolation in query',
            regex: /query\([`"]SELECT\s+.*?\$\{.*?\}/gi,
            severity: 'CRITICAL',
            description: 'Template literals usados directamente en query'
        },
        {
            name: 'Direct variable in WHERE',
            regex: /WHERE\s+\w+\s*=\s*['"]?\s*[^$\d][^'"]*?["']?\s*(?:AND|OR|\)|;)/gi,
            severity: 'HIGH',
            description: 'Variable directa en WHERE sin parametrización'
        },
        {
            name: 'INSERT with concatenation',
            regex: /INSERT\s+INTO\s+.*?VALUES\s*\([^)]*?(\+|`\$\{|"\s*\+\s*)/gi,
            severity: 'CRITICAL',
            description: 'INSERT con concatenación de strings en VALUES'
        },
        {
            name: 'UPDATE with concatenation',
            regex: /UPDATE\s+.*?SET\s+.*?(\+|`\$\{|"\s*\+\s*)/gi,
            severity: 'CRITICAL',
            description: 'UPDATE con concatenación de strings en SET'
        },
        {
            name: 'DELETE with concatenation',
            regex: /DELETE\s+FROM\s+.*?WHERE\s+.*?(\+|`\$\{|"\s*\+\s*)/gi,
            severity: 'CRITICAL',
            description: 'DELETE con concatenación de strings en WHERE'
        }
    ],

    // Patrones de queries seguras (parametrizadas)
    safePatterns: [
        {
            name: 'Parameterized query with $1, $2, etc',
            regex: /query\([`"].*?\$\d+.*?[`"]\s*,\s*\[/g,
            description: 'Query parametrizada con $1, $2, $3...'
        },
        {
            name: 'Prepared statement',
            regex: /prepare\(|prepared/gi,
            description: 'Uso de prepared statements'
        }
    ]
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtener todos los archivos JS recursivamente
 */
async function getAllJSFiles(dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Ignorar node_modules, .git, etc.
            if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                continue;
            }

            if (entry.isDirectory()) {
                files.push(...await getAllJSFiles(fullPath));
            } else if (entry.isFile() && CONFIG.extensions.includes(path.extname(entry.name))) {
                // Ignorar archivos en la lista de exclusión
                const shouldIgnore = CONFIG.ignoreFiles.some(ignore =>
                    entry.name.includes(ignore)
                );

                if (!shouldIgnore) {
                    files.push(fullPath);
                }
            }
        }
    } catch (error) {
        // Directorio no existe o no tiene permisos
        console.warn(`⚠️ No se pudo leer directorio: ${dir}`);
    }

    return files;
}

/**
 * Analizar un archivo para vulnerabilidades SQL
 */
async function analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    const vulnerabilities = [];
    const safeQueries = [];

    // Buscar queries inseguras
    for (const pattern of CONFIG.unsafePatterns) {
        const matches = [...content.matchAll(pattern.regex)];

        for (const match of matches) {
            // Encontrar número de línea
            const index = match.index;
            let lineNumber = 1;
            let currentIndex = 0;

            for (let i = 0; i < lines.length; i++) {
                currentIndex += lines[i].length + 1; // +1 para el \n
                if (currentIndex > index) {
                    lineNumber = i + 1;
                    break;
                }
            }

            vulnerabilities.push({
                pattern: pattern.name,
                severity: pattern.severity,
                description: pattern.description,
                line: lineNumber,
                code: match[0].substring(0, 150) // Primeros 150 caracteres
            });
        }
    }

    // Buscar queries seguras (para estadísticas)
    for (const pattern of CONFIG.safePatterns) {
        const matches = [...content.matchAll(pattern.regex)];
        safeQueries.push(...matches.map(m => ({
            pattern: pattern.name,
            count: 1
        })));
    }

    return {
        vulnerabilities,
        safeQueryCount: safeQueries.length,
        totalLines: lines.length
    };
}

// ============================================
// PROCESAMIENTO PRINCIPAL
// ============================================

async function main() {
    console.log('🔐 INICIANDO AUDITORÍA DE SQL INJECTION\n');
    console.log(`📁 Escaneando directorios: ${CONFIG.scanDirs.length}`);
    console.log(`🔍 Patrones inseguros: ${CONFIG.unsafePatterns.length} tipos\n`);

    const results = {
        totalFiles: 0,
        filesWithVulnerabilities: 0,
        totalVulnerabilities: 0,
        totalSafeQueries: 0,
        vulnerabilitiesByFile: [],
        vulnerabilitiesBySeverity: {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0
        }
    };

    // Obtener todos los archivos de todos los directorios
    let allFiles = [];
    for (const dir of CONFIG.scanDirs) {
        const files = await getAllJSFiles(dir);
        allFiles.push(...files);
    }

    // Eliminar duplicados
    allFiles = [...new Set(allFiles)];
    results.totalFiles = allFiles.length;

    console.log(`📄 Archivos encontrados: ${results.totalFiles}\n`);

    // Analizar cada archivo
    for (const filePath of allFiles) {
        const relativePath = path.relative(path.join(__dirname, '../'), filePath);

        try {
            const analysis = await analyzeFile(filePath);

            if (analysis.vulnerabilities.length > 0) {
                results.filesWithVulnerabilities++;
                results.totalVulnerabilities += analysis.vulnerabilities.length;
                results.vulnerabilitiesByFile.push({
                    file: relativePath,
                    vulnerabilities: analysis.vulnerabilities,
                    safeQueries: analysis.safeQueryCount
                });

                // Contar por severidad
                for (const vuln of analysis.vulnerabilities) {
                    results.vulnerabilitiesBySeverity[vuln.severity]++;
                }

                console.log(`🚨 ${relativePath} - ${analysis.vulnerabilities.length} vulnerabilidades`);
            }

            results.totalSafeQueries += analysis.safeQueryCount;

        } catch (error) {
            console.error(`❌ Error analizando ${relativePath}:`, error.message);
        }
    }

    // ============================================
    // REPORTE FINAL
    // ============================================

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE AUDITORÍA SQL INJECTION');
    console.log('='.repeat(60) + '\n');

    console.log(`📄 Archivos escaneados:           ${results.totalFiles}`);
    console.log(`🚨 Archivos con vulnerabilidades: ${results.filesWithVulnerabilities}`);
    console.log(`🔐 Total vulnerabilidades:        ${results.totalVulnerabilities}`);
    console.log(`✅ Queries seguras (parametrizadas): ${results.totalSafeQueries}\n`);

    console.log('📊 VULNERABILIDADES POR SEVERIDAD:\n');
    console.log(`🔴 CRITICAL: ${results.vulnerabilitiesBySeverity.CRITICAL}`);
    console.log(`🟠 HIGH:     ${results.vulnerabilitiesBySeverity.HIGH}`);
    console.log(`🟡 MEDIUM:   ${results.vulnerabilitiesBySeverity.MEDIUM}`);
    console.log(`🟢 LOW:      ${results.vulnerabilitiesBySeverity.LOW}\n`);

    if (results.vulnerabilitiesByFile.length > 0) {
        console.log('📋 TOP 10 ARCHIVOS CON MÁS VULNERABILIDADES:\n');

        const top10 = results.vulnerabilitiesByFile
            .sort((a, b) => b.vulnerabilities.length - a.vulnerabilities.length)
            .slice(0, 10);

        for (const fileData of top10) {
            console.log(`📄 ${fileData.file}`);
            console.log(`   Vulnerabilidades: ${fileData.vulnerabilities.length}`);
            console.log(`   Queries seguras: ${fileData.safeQueries}\n`);
        }
    }

    // Guardar reporte en archivo
    const reportPath = path.join(__dirname, '../../docs/SQL_INJECTION_AUDIT_REPORT.md');
    const reportContent = generateMarkdownReport(results);
    await fs.writeFile(reportPath, reportContent, 'utf-8');

    console.log(`📝 Reporte guardado en: ${reportPath}\n`);

    // Conclusión
    if (results.totalVulnerabilities === 0) {
        console.log('✅ NO SE ENCONTRARON VULNERABILIDADES DE SQL INJECTION\n');
        console.log('🎉 TODAS LAS QUERIES ESTÁN PARAMETRIZADAS CORRECTAMENTE\n');
    } else {
        console.log('⚠️ SE ENCONTRARON VULNERABILIDADES QUE REQUIEREN CORRECCIÓN\n');
        console.log('📝 Revisar reporte para detalles y recomendaciones\n');
    }

    console.log('✅ AUDITORÍA SQL INJECTION COMPLETADA\n');
}

/**
 * Generar reporte en Markdown
 */
function generateMarkdownReport(results) {
    let md = `# 🔐 REPORTE DE AUDITORÍA SQL INJECTION\n\n`;
    md += `**Fecha:** ${new Date().toLocaleString('es-MX')}\n`;
    md += `**Script:** backend/scripts/audit-sql-injection.mjs\n\n`;
    md += `---\n\n`;

    md += `## 📊 RESUMEN\n\n`;
    md += `| Métrica | Valor |\n`;
    md += `|---------|-------|\n`;
    md += `| Archivos escaneados | ${results.totalFiles} |\n`;
    md += `| Archivos con vulnerabilidades | ${results.filesWithVulnerabilities} |\n`;
    md += `| Total vulnerabilidades | ${results.totalVulnerabilities} |\n`;
    md += `| Queries seguras | ${results.totalSafeQueries} |\n\n`;

    md += `### Por Severidad\n\n`;
    md += `| Severidad | Cantidad |\n`;
    md += `|-----------|----------|\n`;
    md += `| 🔴 CRITICAL | ${results.vulnerabilitiesBySeverity.CRITICAL} |\n`;
    md += `| 🟠 HIGH | ${results.vulnerabilitiesBySeverity.HIGH} |\n`;
    md += `| 🟡 MEDIUM | ${results.vulnerabilitiesBySeverity.MEDIUM} |\n`;
    md += `| 🟢 LOW | ${results.vulnerabilitiesBySeverity.LOW} |\n\n`;

    md += `---\n\n`;

    if (results.vulnerabilitiesByFile.length > 0) {
        md += `## 🚨 VULNERABILIDADES ENCONTRADAS (${results.vulnerabilitiesByFile.length} archivos)\n\n`;

        for (const fileData of results.vulnerabilitiesByFile) {
            md += `### ⚠️ ${fileData.file}\n\n`;
            md += `**Vulnerabilidades:** ${fileData.vulnerabilities.length}\n`;
            md += `**Queries seguras:** ${fileData.safeQueries}\n\n`;

            for (const vuln of fileData.vulnerabilities) {
                md += `#### ${vuln.severity} - ${vuln.pattern}\n\n`;
                md += `**Línea:** ${vuln.line}\n\n`;
                md += `**Descripción:** ${vuln.description}\n\n`;
                md += `**Código:**\n`;
                md += `\`\`\`sql\n`;
                md += `${vuln.code}\n`;
                md += `\`\`\`\n\n`;
            }
        }
    } else {
        md += `## ✅ NO SE ENCONTRARON VULNERABILIDADES\n\n`;
        md += `Todas las queries SQL están usando parametrización correcta ($1, $2, etc).\n\n`;
    }

    md += `---\n\n`;
    md += `## 🔐 RECOMENDACIONES\n\n`;
    md += `### ✅ Patrón Seguro (Parametrización PostgreSQL)\n\n`;
    md += `\`\`\`javascript\n`;
    md += `// ✅ CORRECTO - Parametrización con $1, $2, $3\n`;
    md += `const query = 'SELECT * FROM usuarios WHERE email = $1 AND active = $2';\n`;
    md += `const values = [email, true];\n`;
    md += `const result = await pool.query(query, values);\n`;
    md += `\`\`\`\n\n`;

    md += `### ❌ Patrón Inseguro (Concatenación)\n\n`;
    md += `\`\`\`javascript\n`;
    md += `// ❌ INSEGURO - Concatenación de strings (SQL Injection)\n`;
    md += `const query = "SELECT * FROM usuarios WHERE email = '" + email + "' AND active = true";\n`;
    md += `const result = await pool.query(query);\n`;
    md += `\n`;
    md += `// ❌ INSEGURO - Template literals\n`;
    md += `const query = \`SELECT * FROM usuarios WHERE email = '\${email}' AND active = true\`;\n`;
    md += `const result = await pool.query(query);\n`;
    md += `\`\`\`\n\n`;

    md += `---\n\n`;
    md += `## ✅ ESTADO FINAL\n\n`;

    if (results.totalVulnerabilities === 0) {
        md += `**Resultado:** ✅ TODAS LAS QUERIES SEGURAS - SEMANA 2 TAREA 8 COMPLETADA\n\n`;
    } else {
        md += `**Resultado:** ⚠️ ${results.totalVulnerabilities} vulnerabilidades requieren corrección\n\n`;
        md += `**Siguiente paso:** Refactorizar queries inseguras a parametrización\n`;
    }

    return md;
}

// Ejecutar
main().catch(console.error);
