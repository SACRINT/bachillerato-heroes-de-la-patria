/**
 * Script de Análisis de Console Logs - Auditoría GDPR
 *
 * Busca console.log/error/warn/info que expongan datos sensibles
 * Genera reporte en docs/logging-audit/console-calls-to-replace.md
 */

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '..');
const results = [];

// Patrones de datos sensibles
const SENSITIVE_PATTERNS = {
    TOKEN: /\b(token|jwt|credential|auth|api_key|apiKey)\b/i,
    EMAIL: /\b(email|correo|mail)\b/i,
    PASSWORD: /\b(password|pwd|contraseña|pass)\b/i,
    USER_ID: /\b(user\.id|userId|user_id|id_usuario)\b/i,
    USER_DATA: /\b(user\.|req\.user|userData)\b/i,
    PERSONAL_DATA: /\b(nombre|apellido|telefono|phone|direccion|address)\b/i
};

function searchDir(dir, relativePath = '') {
    // Ignorar directorios
    if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('scripts')) {
        return;
    }

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
                searchDir(fullPath, relPath);
            } else if (entry.name.endsWith('.js') &&
                       !entry.name.includes('devLogger') &&
                       !entry.name.includes('logger.js') &&
                       !entry.name.includes('analyze-console-logs')) {
                analyzeFile(fullPath, relPath);
            }
        }
    } catch (error) {
        console.error(`Error leyendo directorio ${dir}:`, error.message);
    }
}

function analyzeFile(filePath, relativePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            const trimmed = line.trim();
            
            // Detectar console.log/error/warn/info/debug
            const consoleMatch = trimmed.match(/console\.(log|error|warn|info|debug)\((.*)\)/);
            
            if (consoleMatch) {
                const logContent = consoleMatch[2];
                
                // Detectar si contiene datos sensibles
                let severity = 'LOW';
                let dataType = 'OTHER';
                
                for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
                    if (pattern.test(logContent)) {
                        dataType = type;
                        
                        if (['TOKEN', 'PASSWORD'].includes(type)) {
                            severity = 'CRITICAL';
                        } else if (['EMAIL', 'USER_ID', 'USER_DATA'].includes(type)) {
                            severity = 'HIGH';
                        } else {
                            severity = 'MEDIUM';
                        }
                        break;
                    }
                }
                
                if (severity !== 'LOW') {
                    results.push({
                        file: relativePath,
                        line: index + 1,
                        method: consoleMatch[1],
                        content: logContent.substring(0, 100),
                        severity: severity,
                        dataType: dataType
                    });
                }
            }
        });
    } catch (error) {
        console.error(`Error analizando ${filePath}:`, error.message);
    }
}

console.log('🔍 Analizando archivos en backend/...\n');

// Buscar recursivamente
searchDir(BACKEND_DIR);

// Agrupar por severidad
const bySeverity = {
    'CRITICAL': results.filter(r => r.severity === 'CRITICAL'),
    'HIGH': results.filter(r => r.severity === 'HIGH'),
    'MEDIUM': results.filter(r => r.severity === 'MEDIUM'),
    'LOW': results.filter(r => r.severity === 'LOW')
};

// Generar reporte
let report = `# 🔍 AUDITORÍA DE CONSOLE LOGS - EXPOSICIÓN DE DATOS SENSIBLES\n\n`;
report += `**Fecha:** ${new Date().toISOString().split('T')[0]}\n`;
report += `**Total de logs con datos sensibles:** ${results.length}\n\n`;
report += `---\n\n`;
report += `## 📊 RESUMEN POR SEVERIDAD\n\n`;
report += `| Severidad | Cantidad | Descripción |\n`;
report += `|-----------|----------|-------------|\n`;
report += `| 🔴 CRITICAL | ${bySeverity.CRITICAL.length} | Tokens JWT, Passwords, API Keys |\n`;
report += `| 🟠 HIGH | ${bySeverity.HIGH.length} | Emails, User IDs |\n`;
report += `| 🟡 MEDIUM | ${bySeverity.MEDIUM.length} | User Data, Personal Data |\n`;
report += `| 🟢 LOW | ${bySeverity.LOW.length} | Otros datos sensibles |\n\n`;
report += `---\n\n`;

// Incluir logs por severidad
['CRITICAL', 'HIGH', 'MEDIUM'].forEach(severity => {
    if (bySeverity[severity].length > 0) {
        report += `## ${severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡'} ${severity} - ${bySeverity[severity].length} LOGS\n\n`;
        bySeverity[severity].slice(0, 10).forEach((log, idx) => {
            report += `### ${idx + 1}. ${log.file}:${log.line}\n`;
            report += `**Tipo:** ${log.dataType} | **Método:** ${log.method}\n\n`;
            report += "```\n" + log.content + "\n```\n\n";
        });
        if (bySeverity[severity].length > 10) {
            report += `*(+${bySeverity[severity].length - 10} logs más)*\n\n`;
        }
    }
});

// Guardar reporte
const reportPath = path.join(BACKEND_DIR, '../docs/logging-audit/console-calls-to-replace.md');
const reportDir = path.dirname(reportPath);
if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
}
fs.writeFileSync(reportPath, report, 'utf8');

console.log(`✅ Análisis completado: ${results.length} logs con datos sensibles encontrados\n`);
console.log(`📄 Reporte guardado en: ${reportPath}\n`);
console.log(`📊 RESUMEN:`);
console.log(`🔴 CRITICAL: ${bySeverity.CRITICAL.length}`);
console.log(`🟠 HIGH: ${bySeverity.HIGH.length}`);
console.log(`🟡 MEDIUM: ${bySeverity.MEDIUM.length}`);
console.log(`🟢 LOW: ${bySeverity.LOW.length}`);
console.log(`\n🎯 Total: ${results.length}\n`);

