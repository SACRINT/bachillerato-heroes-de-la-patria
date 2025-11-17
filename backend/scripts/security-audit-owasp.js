#!/usr/bin/env node
/**
 * 🔐 SECURITY AUDIT - OWASP TOP 10 SCANNER
 *
 * Escanea todo el código en busca de vulnerabilidades comunes
 * Genera reporte detallado con recomendaciones
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURACIÓN
// ============================================

const CONFIG = {
    rootDir: path.join(__dirname, '../..'),
    excludeDirs: ['node_modules', '.git', 'dist', 'build', 'no_usados'],
    fileExtensions: ['.js', '.jsx', '.ts', '.tsx', '.html', '.ejs'],
    outputFile: 'docs/OWASP_SECURITY_AUDIT_REPORT.md'
};

// ============================================
// PATRONES DE VULNERABILIDADES OWASP TOP 10
// ============================================

const VULNERABILITY_PATTERNS = {
    // A01: Broken Access Control
    brokenAccessControl: [
        {
            pattern: /localStorage\.setItem\(['"](?:admin|token|password|secret)/gi,
            severity: 'HIGH',
            message: 'Datos sensibles en localStorage (no encriptado)',
            owasp: 'A01:2021 - Broken Access Control'
        },
        {
            pattern: /if\s*\(\s*role\s*===?\s*['"]admin['"]\s*\)/gi,
            severity: 'MEDIUM',
            message: 'Control de acceso basado en cliente (verificar en servidor)',
            owasp: 'A01:2021 - Broken Access Control'
        }
    ],

    // A02: Cryptographic Failures
    cryptographicFailures: [
        {
            pattern: /(password|secret|apiKey|token)\s*=\s*['"][^'"]{1,20}['"]/gi,
            severity: 'CRITICAL',
            message: 'Posible credencial hardcodeada en código',
            owasp: 'A02:2021 - Cryptographic Failures'
        },
        {
            pattern: /md5\(|sha1\(/gi,
            severity: 'HIGH',
            message: 'Uso de algoritmo criptográfico débil (MD5/SHA1)',
            owasp: 'A02:2021 - Cryptographic Failures'
        },
        {
            pattern: /Math\.random\(\)/gi,
            severity: 'MEDIUM',
            message: 'Math.random() no es criptográficamente seguro (usar crypto)',
            owasp: 'A02:2021 - Cryptographic Failures'
        }
    ],

    // A03: Injection
    injection: [
        {
            pattern: /eval\s*\(/gi,
            severity: 'CRITICAL',
            message: 'Uso de eval() - permite inyección de código arbitrario',
            owasp: 'A03:2021 - Injection'
        },
        {
            pattern: /innerHTML\s*=\s*(?!DOMPurify|sanitizeHTML)/gi,
            severity: 'HIGH',
            message: 'innerHTML sin sanitización (riesgo XSS)',
            owasp: 'A03:2021 - Injection'
        },
        {
            pattern: /\.html\(['"].*\$\{.*\}.*['"]\)/gi,
            severity: 'HIGH',
            message: 'Template literal en HTML sin sanitización',
            owasp: 'A03:2021 - Injection'
        },
        {
            pattern: /query\s*=\s*['"].*\+.*['"]/gi,
            severity: 'HIGH',
            message: 'Posible concatenación de SQL query (usar parámetros)',
            owasp: 'A03:2021 - Injection'
        },
        {
            pattern: /execute\(['"]SELECT.*\+/gi,
            severity: 'CRITICAL',
            message: 'SQL query con concatenación directa',
            owasp: 'A03:2021 - Injection'
        }
    ],

    // A04: Insecure Design
    insecureDesign: [
        {
            pattern: /setTimeout\(.*eval/gi,
            severity: 'CRITICAL',
            message: 'setTimeout con eval (doble riesgo)',
            owasp: 'A04:2021 - Insecure Design'
        },
        {
            pattern: /Function\(['"].*['"]\)/gi,
            severity: 'HIGH',
            message: 'Constructor Function() - similar a eval()',
            owasp: 'A04:2021 - Insecure Design'
        }
    ],

    // A05: Security Misconfiguration
    securityMisconfiguration: [
        {
            pattern: /cors\(\{[\s\S]*origin:\s*['"]?\*['"]?/gi,
            severity: 'HIGH',
            message: 'CORS configurado con wildcard (*) - permite todos los orígenes',
            owasp: 'A05:2021 - Security Misconfiguration'
        },
        {
            pattern: /script-src\s+['"]?unsafe-inline['"]?/gi,
            severity: 'HIGH',
            message: 'CSP permite unsafe-inline (XSS posible)',
            owasp: 'A05:2021 - Security Misconfiguration'
        },
        {
            pattern: /\.log\(.*password.*\)/gi,
            severity: 'HIGH',
            message: 'Logging de contraseñas o datos sensibles',
            owasp: 'A05:2021 - Security Misconfiguration'
        }
    ],

    // A06: Vulnerable and Outdated Components
    outdatedComponents: [
        {
            pattern: /"jquery":\s*"[12]\./gi,
            severity: 'MEDIUM',
            message: 'jQuery versión antigua (posibles vulnerabilidades)',
            owasp: 'A06:2021 - Vulnerable Components'
        }
    ],

    // A07: Identification and Authentication Failures
    authFailures: [
        {
            pattern: /password\.length\s*<\s*[1-5]/gi,
            severity: 'HIGH',
            message: 'Validación de contraseña débil (menos de 6 caracteres)',
            owasp: 'A07:2021 - Authentication Failures'
        },
        {
            pattern: /session\s*=\s*\{.*maxAge:\s*[^\d]*(\d+)[^\d].*\}/gi,
            severity: 'MEDIUM',
            message: 'Verificar tiempo de expiración de sesión',
            owasp: 'A07:2021 - Authentication Failures'
        }
    ],

    // A08: Software and Data Integrity Failures
    integrityFailures: [
        {
            pattern: /<script\s+src=["']https?:\/\/[^"']*["']\s*>/gi,
            severity: 'MEDIUM',
            message: 'Script externo sin Subresource Integrity (SRI)',
            owasp: 'A08:2021 - Integrity Failures'
        }
    ],

    // A09: Security Logging and Monitoring Failures
    loggingFailures: [
        {
            pattern: /try\s*\{[\s\S]*\}\s*catch\s*\([^)]*\)\s*\{\s*\}/gi,
            severity: 'LOW',
            message: 'Bloque catch vacío - error silenciado sin logging',
            owasp: 'A09:2021 - Logging Failures'
        }
    ],

    // A10: Server-Side Request Forgery (SSRF)
    ssrf: [
        {
            pattern: /fetch\(['"].*req\.(?:query|body|params)\./gi,
            severity: 'HIGH',
            message: 'Fetch con URL desde user input (riesgo SSRF)',
            owasp: 'A10:2021 - SSRF'
        },
        {
            pattern: /axios\.get\(['"].*\$\{.*req\./gi,
            severity: 'HIGH',
            message: 'Axios con URL desde user input (riesgo SSRF)',
            owasp: 'A10:2021 - SSRF'
        }
    ]
};

// ============================================
// SCANNER
// ============================================

const results = {
    filesScanned: 0,
    vulnerabilities: [],
    summary: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
    }
};

/**
 * Escanear archivo en busca de vulnerabilidades
 */
function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(CONFIG.rootDir, filePath);

    // Escanear cada categoría de vulnerabilidades
    for (const [category, patterns] of Object.entries(VULNERABILITY_PATTERNS)) {
        for (const vuln of patterns) {
            let match;
            const regex = new RegExp(vuln.pattern.source, vuln.pattern.flags);

            while ((match = regex.exec(content)) !== null) {
                // Encontrar número de línea
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const lineContent = lines[lineNumber - 1].trim();

                results.vulnerabilities.push({
                    file: relativePath,
                    line: lineNumber,
                    severity: vuln.severity,
                    category: category,
                    owasp: vuln.owasp,
                    message: vuln.message,
                    code: lineContent.substring(0, 100) // Primeros 100 chars
                });

                results.summary[vuln.severity]++;
            }
        }
    }

    results.filesScanned++;
}

/**
 * Escanear directorio recursivamente
 */
function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Excluir directorios
        if (entry.isDirectory()) {
            if (!CONFIG.excludeDirs.includes(entry.name)) {
                scanDirectory(fullPath);
            }
            continue;
        }

        // Escanear solo archivos válidos
        const ext = path.extname(entry.name);
        if (CONFIG.fileExtensions.includes(ext)) {
            try {
                scanFile(fullPath);
            } catch (error) {
                console.error(`Error escaneando ${fullPath}:`, error.message);
            }
        }
    }
}

/**
 * Generar reporte en Markdown
 */
function generateReport() {
    const reportPath = path.join(CONFIG.rootDir, CONFIG.outputFile);

    let markdown = `# 🔐 REPORTE DE AUDITORÍA DE SEGURIDAD - OWASP TOP 10\n\n`;
    markdown += `**Fecha:** ${new Date().toLocaleDateString('es-MX')}\n`;
    markdown += `**Archivos Escaneados:** ${results.filesScanned}\n`;
    markdown += `**Vulnerabilidades Encontradas:** ${results.vulnerabilities.length}\n\n`;

    markdown += `---\n\n## 📊 RESUMEN POR SEVERIDAD\n\n`;
    markdown += `| Severidad | Cantidad | Porcentaje |\n`;
    markdown += `|-----------|----------|------------|\n`;

    const total = results.vulnerabilities.length || 1;
    for (const [severity, count] of Object.entries(results.summary)) {
        const percent = ((count / total) * 100).toFixed(1);
        const emoji = {
            CRITICAL: '🔴',
            HIGH: '🟠',
            MEDIUM: '🟡',
            LOW: '🟢'
        }[severity];
        markdown += `| ${emoji} **${severity}** | ${count} | ${percent}% |\n`;
    }

    markdown += `\n---\n\n## 🚨 VULNERABILIDADES CRÍTICAS\n\n`;

    // Agrupar por severidad
    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
        const vulns = results.vulnerabilities.filter(v => v.severity === severity);
        if (vulns.length === 0) continue;

        const emoji = {
            CRITICAL: '🔴',
            HIGH: '🟠',
            MEDIUM: '🟡',
            LOW: '🟢'
        }[severity];

        markdown += `### ${emoji} ${severity} (${vulns.length})\n\n`;

        // Agrupar por categoría OWASP
        const byOwasp = {};
        vulns.forEach(v => {
            if (!byOwasp[v.owasp]) byOwasp[v.owasp] = [];
            byOwasp[v.owasp].push(v);
        });

        for (const [owasp, items] of Object.entries(byOwasp)) {
            markdown += `#### ${owasp}\n\n`;

            items.slice(0, 20).forEach((v, idx) => { // Primeros 20 por categoría
                markdown += `**${idx + 1}. ${v.message}**\n`;
                markdown += `- **Archivo:** \`${v.file}:${v.line}\`\n`;
                markdown += `- **Código:** \`${v.code}\`\n\n`;
            });

            if (items.length > 20) {
                markdown += `*... y ${items.length - 20} más en esta categoría*\n\n`;
            }
        }

        markdown += `\n`;
    }

    markdown += `---\n\n## ✅ RECOMENDACIONES\n\n`;
    markdown += `### Acciones Inmediatas (CRITICAL y HIGH):\n\n`;
    markdown += `1. **Eliminar eval() y Function()**: Reemplazar con alternativas seguras\n`;
    markdown += `2. **Sanitizar innerHTML**: Usar DOMPurify en todos los casos\n`;
    markdown += `3. **Remover credenciales hardcodeadas**: Mover a variables de entorno\n`;
    markdown += `4. **Parametrizar queries SQL**: Usar \`$1, $2\` en lugar de concatenación\n`;
    markdown += `5. **Configurar CSP strict**: Eliminar unsafe-inline\n\n`;

    markdown += `### Acciones Corto Plazo (MEDIUM):\n\n`;
    markdown += `1. **Implementar CORS restrictivo**: Whitelist de dominios\n`;
    markdown += `2. **Validar inputs**: Implementar validadores en todos los endpoints\n`;
    markdown += `3. **Mejorar logging**: No registrar datos sensibles\n`;
    markdown += `4. **Actualizar dependencias**: Revisar package.json\n\n`;

    markdown += `### Acciones Largo Plazo (LOW):\n\n`;
    markdown += `1. **Implementar SRI**: Subresource Integrity en scripts externos\n`;
    markdown += `2. **Monitoreo continuo**: Integrar scanner en CI/CD\n`;
    markdown += `3. **Training**: Capacitar equipo en OWASP Top 10\n\n`;

    markdown += `---\n\n`;
    markdown += `**Generado por:** Security Audit Script v1.0.0\n`;
    markdown += `**Comando:** \`node backend/scripts/security-audit-owasp.js\`\n`;

    fs.writeFileSync(reportPath, markdown, 'utf8');
    console.log(`\n✅ Reporte generado: ${reportPath}`);
}

// ============================================
// EJECUCIÓN
// ============================================

console.log('🔐 Iniciando auditoría de seguridad OWASP Top 10...\n');
console.log(`📁 Escaneando: ${CONFIG.rootDir}`);
console.log(`📝 Extensiones: ${CONFIG.fileExtensions.join(', ')}`);
console.log(`🚫 Excluidos: ${CONFIG.excludeDirs.join(', ')}\n`);

// Escanear directorios principales
scanDirectory(path.join(CONFIG.rootDir, 'public'));
scanDirectory(path.join(CONFIG.rootDir, 'backend'));
scanDirectory(path.join(CONFIG.rootDir, 'api'));

console.log(`\n📊 RESULTADOS:`);
console.log(`   Archivos escaneados: ${results.filesScanned}`);
console.log(`   Vulnerabilidades: ${results.vulnerabilities.length}`);
console.log(`   🔴 CRITICAL: ${results.summary.CRITICAL}`);
console.log(`   🟠 HIGH: ${results.summary.HIGH}`);
console.log(`   🟡 MEDIUM: ${results.summary.MEDIUM}`);
console.log(`   🟢 LOW: ${results.summary.LOW}`);

generateReport();

// Calcular score de seguridad (0-100)
const maxScore = 100;
const criticalPenalty = results.summary.CRITICAL * 5;
const highPenalty = results.summary.HIGH * 2;
const mediumPenalty = results.summary.MEDIUM * 0.5;
const lowPenalty = results.summary.LOW * 0.1;
const totalPenalty = criticalPenalty + highPenalty + mediumPenalty + lowPenalty;
const securityScore = Math.max(0, maxScore - totalPenalty);

console.log(`\n🎯 SECURITY SCORE: ${securityScore.toFixed(1)}/100`);

if (securityScore < 50) {
    console.log('   ❌ CRÍTICO - Requiere acción inmediata');
    process.exit(1);
} else if (securityScore < 70) {
    console.log('   ⚠️ BAJO - Mejorar seguridad');
} else if (securityScore < 85) {
    console.log('   ✅ ACEPTABLE - Continuar mejorando');
} else {
    console.log('   🎉 EXCELENTE - Seguridad sólida');
}
