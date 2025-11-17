#!/usr/bin/env node
/**
 * 🔍 QUERY OPTIMIZATION ANALYZER
 * Analiza queries SQL para detectar y optimizar queries lentas
 * Semana 4 - Tarea 1
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
    routesDir: path.join(__dirname, '../routes'),
    servicesDir: path.join(__dirname, '../services'),
    dataDir: path.join(__dirname, '../data')
};

async function analyzeQueries() {
    const files = await getAllFiles([CONFIG.routesDir, CONFIG.servicesDir, CONFIG.dataDir]);
    const slowQueries = [];

    for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');

        // Detectar SELECT sin LIMIT
        if (content.match(/SELECT.*FROM.*(?!LIMIT)/gi)) {
            const matches = content.match(/SELECT[\s\S]*?FROM[\s\S]*?(?=;|\))/gi) || [];
            matches.forEach(query => {
                if (!query.includes('LIMIT') && query.length < 500) {
                    slowQueries.push({
                        file: path.relative(path.join(__dirname, '..'), file),
                        type: 'No LIMIT',
                        query: query.substring(0, 150),
                        severity: 'HIGH',
                        fix: 'Agregar LIMIT para evitar full table scans'
                    });
                }
            });
        }

        // Detectar JOINs múltiples sin índices
        const joinMatches = content.match(/JOIN.*ON/gi) || [];
        if (joinMatches.length > 3) {
            slowQueries.push({
                file: path.relative(path.join(__dirname, '..'), file),
                type: 'Multiple JOINs',
                query: `${joinMatches.length} JOINs detectados`,
                severity: 'MEDIUM',
                fix: 'Verificar índices en columnas de JOIN'
            });
        }

        // Detectar SELECT *
        if (content.match(/SELECT\s+\*/gi)) {
            const selectStarMatches = content.match(/SELECT\s+\*\s+FROM/gi) || [];
            selectStarMatches.forEach(() => {
                slowQueries.push({
                    file: path.relative(path.join(__dirname, '..'), file),
                    type: 'SELECT *',
                    query: 'SELECT * detectado',
                    severity: 'MEDIUM',
                    fix: 'Especificar columnas necesarias'
                });
            });
        }
    }

    // Generar reporte
    let report = `# 🔍 QUERY OPTIMIZATION REPORT\n\n`;
    report += `**Fecha:** ${new Date().toLocaleString('es-MX')}\n`;
    report += `**Queries analizadas:** ${slowQueries.length}\n\n`;
    report += `---\n\n`;

    const byFile = {};
    slowQueries.forEach(q => {
        if (!byFile[q.file]) byFile[q.file] = [];
        byFile[q.file].push(q);
    });

    for (const [file, queries] of Object.entries(byFile)) {
        report += `## ${file}\n\n`;
        queries.forEach(q => {
            report += `### ${q.severity} - ${q.type}\n`;
            report += `**Query:** \`${q.query}\`\n`;
            report += `**Fix:** ${q.fix}\n\n`;
        });
    }

    await fs.writeFile(
        path.join(__dirname, '../../docs/QUERY_OPTIMIZATION_REPORT.md'),
        report
    );

    console.log(`✅ Análisis completado: ${slowQueries.length} queries necesitan optimización`);
}

async function getAllFiles(dirs) {
    const files = [];
    for (const dir of dirs) {
        try {
            const entries = await fs.readdir(dir, { recursive: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = await fs.stat(fullPath);
                if (stat.isFile() && fullPath.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        } catch (e) {}
    }
    return files;
}

analyzeQueries().catch(console.error);
