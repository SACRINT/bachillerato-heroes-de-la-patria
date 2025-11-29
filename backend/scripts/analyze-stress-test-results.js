#!/usr/bin/env node

/**
 * 📊 ANALIZADOR DE RESULTADOS STRESS TEST
 *
 * Propósito:
 * - Extraer métricas de archivo de log de Artillery
 * - Comparar resultados FASE 30.4 vs FASE 30.5
 * - Generar reporte con % de mejora por componente
 * - Validar si se alcanzaron los objetivos
 */

const fs = require('fs');
const path = require('path');

const BLUE = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// Archivos de log
const FASE_30_4_LOG = 'C:\\03_BachilleratoHeroesWeb\\backend\\load-tests\\stress-test-fase-30-4-ACTUAL.log';
const FASE_30_5_LOG = 'C:\\03_BachilleratoHeroesWeb\\backend\\load-tests\\stress-test-fase-30-5-RESULTADO.log';

// Valores de BASELINE (hardcoded desde FASE 30.4)
const BASELINE = {
    totalRequests: 19693,
    successful2xx: 845,
    errors401: 2418,
    errors404: 3776,
    etimeout: 12320,
    econnrefused: 334,
    meanResponse: 4025,
    p95Response: 9999.2,
    p99Response: 9999.2,
    mean2xx: 4227.1,
    p952xx: 6569.8,
    p992xx: 6569.8,
    mean4xx: 3997.4,
    usersCompleted: 2946,
    usersFailed: 12654,
    sessionLength: 7462.8
};

// Función para extraer "Summary report" del log
function extractSummaryFromLog(logContent) {
    const summaryMatch = logContent.match(/Summary report[^]*?(?=\n\n|$)/);
    if (!summaryMatch) return null;

    const summary = summaryMatch[0];
    const metrics = {};

    // Extraer valores usando regex flexible
    const patterns = {
        totalRequests: /http\.requests:\s*\.+\s+(\d+)/,
        successful2xx: /http\.codes\.200:\s*\.+\s+(\d+)/,
        errors401: /http\.codes\.401:\s*\.+\s+(\d+)/,
        errors404: /http\.codes\.404:\s*\.+\s+(\d+)/,
        etimeout: /errors\.ETIMEDOUT:\s*\.+\s+(\d+)/,
        econnrefused: /errors\.ECONNREFUSED:\s*\.+\s+(\d+)/,
        meanResponse: /http\.response_time:[\s\S]*?mean:\s*\.+\s+(\d+)/,
        p95Response: /http\.response_time:[\s\S]*?p95:\s*\.+\s+([\d.]+)/,
        p99Response: /http\.response_time:[\s\S]*?p99:\s*\.+\s+([\d.]+)/,
        mean2xx: /http\.response_time\.2xx:[\s\S]*?mean:\s*\.+\s+(\d+)/,
        p952xx: /http\.response_time\.2xx:[\s\S]*?p95:\s*\.+\s+([\d.]+)/,
        p992xx: /http\.response_time\.2xx:[\s\S]*?p99:\s*\.+\s+([\d.]+)/,
        mean4xx: /http\.response_time\.4xx:[\s\S]*?mean:\s*\.+\s+(\d+)/,
        usersCompleted: /vusers\.completed:\s*\.+\s+(\d+)/,
        usersFailed: /vusers\.failed:\s*\.+\s+(\d+)/,
        sessionLength: /vusers\.session_length:[\s\S]*?mean:\s*\.+\s+([\d.]+)/
    };

    for (const [key, pattern] of Object.entries(patterns)) {
        const match = summary.match(pattern);
        if (match) {
            metrics[key] = parseFloat(match[1]);
        }
    }

    return metrics;
}

// Función para calcular porcentaje de mejora
function calculateImprovement(baseline, current, metricsToInvert = []) {
    if (baseline === 0) return 0;

    // Para métricas donde MENOR es mejor (errores, latencia)
    if (metricsToInvert.includes(current)) {
        return ((baseline - current) / baseline) * 100;
    }

    // Para métricas donde MAYOR es mejor (éxito)
    return ((current - baseline) / baseline) * 100;
}

// Función para formatear números
function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    return Math.round(num * 100) / 100;
}

// Función para generar tabla
function printComparisonTable(fase30_4, fase30_5) {
    console.log(`\n${BOLD}${BLUE}📊 TABLA COMPARATIVA FASE 30.4 vs FASE 30.5${RESET}\n`);

    const metricsToInvert = ['etimeout', 'econnrefused', 'meanResponse', 'p95Response', 'p99Response', 'mean2xx', 'p952xx', 'p992xx', 'mean4xx'];

    const rows = [
        { label: '📊 Total Requests', key: 'totalRequests', unit: '' },
        { label: '✅ Successful (2xx)', key: 'successful2xx', unit: '' },
        { label: '❌ ETIMEDOUT', key: 'etimeout', unit: '', critical: true },
        { label: '⚠️  ECONNREFUSED', key: 'econnrefused', unit: '' },
        { label: '📈 Mean Response', key: 'meanResponse', unit: 'ms', invert: true },
        { label: '📈 p95 Response', key: 'p95Response', unit: 'ms', invert: true },
        { label: '📈 p99 Response', key: 'p99Response', unit: 'ms', invert: true },
        { label: '📈 Mean (2xx)', key: 'mean2xx', unit: 'ms', invert: true },
        { label: '📈 p95 (2xx)', key: 'p952xx', unit: 'ms', invert: true },
        { label: '👥 Users Completed', key: 'usersCompleted', unit: '' },
        { label: '❌ Users Failed', key: 'usersFailed', unit: '', invert: true }
    ];

    console.log('┌' + '─'.repeat(45) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┐');
    console.log('│ Métrica' + ' '.repeat(38) + '│ FASE 30.4' + ' '.repeat(5) + '│ FASE 30.5' + ' '.repeat(5) + '│ Mejora' + ' '.repeat(8) + '│');
    console.log('├' + '─'.repeat(45) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┤');

    for (const row of rows) {
        const baseline = fase30_4[row.key] !== undefined ? formatNumber(fase30_4[row.key]) : 'N/A';
        const current = fase30_5[row.key] !== undefined ? formatNumber(fase30_5[row.key]) : 'N/A';

        let improvement = 'N/A';
        let color = RESET;

        if (typeof baseline === 'number' && typeof current === 'number') {
            const change = calculateImprovement(baseline, current, metricsToInvert);
            improvement = change > 0 ? `${GREEN}+${formatNumber(change)}%${RESET}` : `${RED}${formatNumber(change)}%${RESET}`;
            color = change > 0 ? GREEN : RED;
        }

        const label = row.label.padEnd(45);
        const baselineStr = String(baseline).padStart(13) + (row.unit || '').padEnd(1);
        const currentStr = String(current).padStart(13) + (row.unit || '').padEnd(1);

        console.log(`│ ${label} │ ${baselineStr} │ ${currentStr} │ ${improvement.padStart(12)} │`);
    }

    console.log('└' + '─'.repeat(45) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┘');
}

// Función para imprimir análisis de éxito
function printSuccessAnalysis(fase30_4, fase30_5) {
    console.log(`\n${BOLD}${BLUE}🎯 ANÁLISIS DE ÉXITO${RESET}\n`);

    const goals = [
        {
            name: 'ETIMEDOUT Rate < 40%',
            baseline: (fase30_4.etimeout / fase30_4.totalRequests) * 100,
            target: 40,
            current: (fase30_5.etimeout / fase30_5.totalRequests) * 100,
            weight: 0.35
        },
        {
            name: 'Response Time mean < 2,500ms',
            baseline: fase30_4.meanResponse,
            target: 2500,
            current: fase30_5.meanResponse,
            weight: 0.25,
            invert: true
        },
        {
            name: 'Response Time p95 < 6,000ms',
            baseline: fase30_4.p95Response,
            target: 6000,
            current: fase30_5.p95Response,
            weight: 0.20,
            invert: true
        },
        {
            name: 'Success Rate (2xx) > 30%',
            baseline: (fase30_4.successful2xx / fase30_4.totalRequests) * 100,
            target: 30,
            current: (fase30_5.successful2xx / fase30_5.totalRequests) * 100,
            weight: 0.20
        }
    ];

    let totalScore = 0;

    for (const goal of goals) {
        const achieved = goal.invert
            ? goal.current < goal.target
            : goal.current > goal.target;

        const status = achieved ? `${GREEN}✅ CUMPLIDA${RESET}` : `${RED}❌ NO CUMPLIDA${RESET}`;
        const pointContribution = achieved ? 100 * goal.weight : 0;
        totalScore += pointContribution;

        console.log(`${goal.name}`);
        console.log(`  Baseline: ${formatNumber(goal.baseline)} → Target: ${formatNumber(goal.target)} → Current: ${formatNumber(goal.current)}`);
        console.log(`  Status: ${status} (Contribución: ${formatNumber(pointContribution * 5)}/${formatNumber(100 * goal.weight * 5)} puntos)`);
        console.log('');
    }

    const finalScore = totalScore / 5; // Normalizar a 100
    const gradeColor = finalScore >= 80 ? GREEN : finalScore >= 60 ? YELLOW : RED;
    console.log(`${BOLD}Calificación Final: ${gradeColor}${formatNumber(finalScore)}/100${RESET}${BOLD}\n${RESET}`);
}

// Main
async function main() {
    console.log(`\n${BOLD}${BLUE}🔴 ANALIZADOR DE STRESS TEST - FASE 30.5${RESET}\n`);

    // Verificar si el archivo de FASE 30.5 existe
    if (!fs.existsSync(FASE_30_5_LOG)) {
        console.log(`${RED}❌ Archivo no encontrado: ${FASE_30_5_LOG}${RESET}`);
        console.log(`${YELLOW}El test aún está en ejecución. Vuelve en unos minutos.${RESET}`);
        process.exit(1);
    }

    try {
        // Leer archivo de FASE 30.5
        const content30_5 = fs.readFileSync(FASE_30_5_LOG, 'utf8');
        const metrics30_5 = extractSummaryFromLog(content30_5);

        if (!metrics30_5 || Object.keys(metrics30_5).length === 0) {
            console.log(`${RED}❌ No se pudo extraer métricas de FASE 30.5${RESET}`);
            console.log(`${YELLOW}El test aún podría estar en ejecución. Vuelve en unos minutos.${RESET}`);
            process.exit(1);
        }

        console.log(`${GREEN}✅ Métricas extraídas exitosamente${RESET}\n`);

        // Imprimir tabla comparativa
        printComparisonTable(BASELINE, metrics30_5);

        // Análisis de éxito
        printSuccessAnalysis(BASELINE, metrics30_5);

        // Estadísticas de mejora
        console.log(`${BOLD}${BLUE}📈 MEJORAS POR COMPONENTE${RESET}\n`);

        const etimeoutReduction = (BASELINE.etimeout - metrics30_5.etimeout) / BASELINE.etimeout * 100;
        const responseTimeReduction = (BASELINE.meanResponse - metrics30_5.meanResponse) / BASELINE.meanResponse * 100;
        const successRateImprovement = ((metrics30_5.successful2xx / metrics30_5.totalRequests) - (BASELINE.successful2xx / BASELINE.totalRequests)) * 100;

        console.log(`Pool Manager Impact:`);
        console.log(`  ETIMEDOUT reduction: ${GREEN}${formatNumber(etimeoutReduction)}%${RESET} (${BASELINE.etimeout} → ${metrics30_5.etimeout})`);
        console.log(`  Expected: 22.5% reduction (62.5% → 40%)`);
        console.log('');

        console.log(`Redis Cache Impact:`);
        console.log(`  Response time reduction: ${responseTimeReduction > 0 ? GREEN : RED}${formatNumber(responseTimeReduction)}%${RESET} (${BASELINE.meanResponse}ms → ${formatNumber(metrics30_5.meanResponse)}ms)`);
        console.log(`  Expected: 37.8% reduction (4,025ms → <2,500ms)`);
        console.log('');

        console.log(`Overall Success Impact:`);
        console.log(`  Success rate improvement: ${successRateImprovement > 0 ? GREEN : RED}${formatNumber(successRateImprovement * 100)}%${RESET}`);
        console.log(`  Expected: >25.7 percentage points (4.3% → >30%)`);
        console.log('');

    } catch (err) {
        console.log(`${RED}❌ Error durante análisis: ${err.message}${RESET}`);
        process.exit(1);
    }
}

main();
