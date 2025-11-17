#!/usr/bin/env node
/**
 * 🔑 REMOVE HARDCODED SECRETS
 *
 * Detecta y ayuda a eliminar credenciales hardcodeadas en el código
 * OWASP: A02:2021 - Cryptographic Failures
 *
 * Versión: 1.0.0
 * Fecha: 17 Noviembre 2025
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    rootDir: path.join(__dirname, '../..'),
    excludeDirs: ['node_modules', '.git', 'dist', 'build', 'no_usados'],
    outputFile: 'docs/HARDCODED_SECRETS_REPORT.md'
};

// Patrones de credenciales hardcodeadas
const SECRET_PATTERNS = {
    passwords: [
        {
            pattern: /password\s*=\s*['"][^'"]{3,20}['"]/gi,
            severity: 'CRITICAL',
            message: 'Contraseña hardcodeada',
            replacement: 'password = process.env.PASSWORD'
        },
        {
            pattern: /admin123|password123|12345|qwerty/gi,
            severity: 'CRITICAL',
            message: 'Contraseña débil hardcodeada'
        }
    ],
    apiKeys: [
        {
            pattern: /apiKey\s*=\s*['"][^'"]{20,}['"]/gi,
            severity: 'CRITICAL',
            message: 'API key hardcodeada',
            replacement: 'apiKey = process.env.API_KEY'
        },
        {
            pattern: /api[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/gi,
            severity: 'CRITICAL',
            message: 'API key hardcodeada'
        }
    ],
    tokens: [
        {
            pattern: /token\s*=\s*['"][^'"]{30,}['"]/gi,
            severity: 'HIGH',
            message: 'Token hardcodeado',
            replacement: 'token = process.env.AUTH_TOKEN'
        },
        {
            pattern: /jwt[_-]?secret\s*[:=]\s*['"][^'"]{10,}['"]/gi,
            severity: 'CRITICAL',
            message: 'JWT secret hardcodeado',
            replacement: 'jwtSecret = process.env.JWT_SECRET'
        }
    ],
    databaseUrls: [
        {
            pattern: /postgres:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
            severity: 'CRITICAL',
            message: 'Database URL con credenciales',
            replacement: 'DATABASE_URL = process.env.DATABASE_URL'
        },
        {
            pattern: /mongodb:\/\/[^:]+:[^@]+@[^\s'"]+/gi,
            severity: 'CRITICAL',
            message: 'MongoDB URL con credenciales'
        }
    ],
    awsKeys: [
        {
            pattern: /AKIA[0-9A-Z]{16}/g,
            severity: 'CRITICAL',
            message: 'AWS Access Key ID'
        }
    ]
};

const results = {
    filesScanned: 0,
    secrets: [],
    summary: { CRITICAL: 0, HIGH: 0, MEDIUM: 0 }
};

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(CONFIG.rootDir, filePath);

    for (const [category, patterns] of Object.entries(SECRET_PATTERNS)) {
        for (const secret of patterns) {
            let match;
            const regex = new RegExp(secret.pattern.source, secret.pattern.flags);

            while ((match = regex.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const lineContent = lines[lineNumber - 1].trim();

                // Excluir falsos positivos (comentarios de ejemplo, documentación)
                if (lineContent.includes('//') || lineContent.includes('/*') || lineContent.includes('*')) {
                    continue;
                }

                // Excluir strings de ejemplo obvios
                if (lineContent.includes('example') || lineContent.includes('placeholder') || lineContent.includes('YOUR_')) {
                    continue;
                }

                results.secrets.push({
                    file: relativePath,
                    line: lineNumber,
                    severity: secret.severity,
                    category: category,
                    message: secret.message,
                    code: lineContent.substring(0, 100),
                    replacement: secret.replacement || 'Usar variable de entorno'
                });

                results.summary[secret.severity]++;
            }
        }
    }

    results.filesScanned++;
}

function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (!CONFIG.excludeDirs.includes(entry.name)) {
                scanDirectory(fullPath);
            }
            continue;
        }

        const ext = path.extname(entry.name);
        if (['.js', '.ts', '.jsx', '.tsx', '.env'].includes(ext)) {
            try {
                scanFile(fullPath);
            } catch (error) {
                console.error(`Error escaneando ${fullPath}:`, error.message);
            }
        }
    }
}

function generateReport() {
    const reportPath = path.join(CONFIG.rootDir, CONFIG.outputFile);

    let markdown = `# 🔑 REPORTE DE CREDENCIALES HARDCODEADAS\n\n`;
    markdown += `**Fecha:** ${new Date().toLocaleDateString('es-MX')}\n`;
    markdown += `**Archivos Escaneados:** ${results.filesScanned}\n`;
    markdown += `**Credenciales Encontradas:** ${results.secrets.length}\n\n`;

    markdown += `---\n\n## 📊 RESUMEN POR SEVERIDAD\n\n`;
    markdown += `| Severidad | Cantidad |\n|-----------|----------|\n`;
    for (const [severity, count] of Object.entries(results.summary)) {
        const emoji = { CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡' }[severity];
        markdown += `| ${emoji} **${severity}** | ${count} |\n`;
    }

    markdown += `\n---\n\n## 🚨 CREDENCIALES ENCONTRADAS\n\n`;

    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM']) {
        const secrets = results.secrets.filter(s => s.severity === severity);
        if (secrets.length === 0) continue;

        markdown += `### ${severity} (${secrets.length})\n\n`;

        secrets.forEach((s, idx) => {
            markdown += `**${idx + 1}. ${s.message}**\n`;
            markdown += `- **Archivo:** \`${s.file}:${s.line}\`\n`;
            markdown += `- **Código:** \`${s.code}\`\n`;
            markdown += `- **Reemplazo:** \`${s.replacement}\`\n\n`;
        });
    }

    markdown += `---\n\n## ✅ INSTRUCCIONES DE CORRECCIÓN\n\n`;
    markdown += `### 1. Crear archivo .env\n\n`;
    markdown += `\`\`\`bash\n`;
    markdown += `# .env (NO commitear a Git)\n`;
    markdown += `DATABASE_URL=postgres://user:pass@host:5432/dbname\n`;
    markdown += `JWT_SECRET=tu_secret_aqui\n`;
    markdown += `API_KEY=tu_api_key\n`;
    markdown += `PASSWORD=tu_password\n`;
    markdown += `\`\`\`\n\n`;

    markdown += `### 2. Actualizar .gitignore\n\n`;
    markdown += `\`\`\`\n.env\n.env.local\n.env.*.local\n\`\`\`\n\n`;

    markdown += `### 3. Cargar variables en Node.js\n\n`;
    markdown += `\`\`\`javascript\nrequire('dotenv').config();\nconst password = process.env.PASSWORD;\n\`\`\`\n\n`;

    fs.writeFileSync(reportPath, markdown, 'utf8');
    console.log(`\n✅ Reporte generado: ${reportPath}`);
}

// Ejecución
console.log('🔑 Escaneando credenciales hardcodeadas...\n');

scanDirectory(path.join(CONFIG.rootDir, 'public'));
scanDirectory(path.join(CONFIG.rootDir, 'backend'));
scanDirectory(path.join(CONFIG.rootDir, 'api'));

console.log(`\n📊 RESULTADOS:`);
console.log(`   Archivos escaneados: ${results.filesScanned}`);
console.log(`   Credenciales: ${results.secrets.length}`);
console.log(`   🔴 CRITICAL: ${results.summary.CRITICAL}`);
console.log(`   🟠 HIGH: ${results.summary.HIGH}`);
console.log(`   🟡 MEDIUM: ${results.summary.MEDIUM}`);

generateReport();

process.exit(results.summary.CRITICAL > 0 ? 1 : 0);
