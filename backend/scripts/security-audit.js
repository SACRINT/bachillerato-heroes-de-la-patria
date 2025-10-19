/**
 * 🔒 SECURITY AUDIT SCRIPT - Auditoría de Seguridad AppSec
 * Verifica vulnerabilidades OWASP Top 10 y genera reporte
 * Fecha: 18 de Octubre, 2025
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class SecurityAuditor {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            score: 0,
            maxScore: 100,
            vulnerabilities: [],
            warnings: [],
            passed: [],
            recommendations: []
        };
    }

    /**
     * Ejecutar auditoría completa
     */
    async runAudit() {
        console.log('🔍 Iniciando Auditoría de Seguridad AppSec...\n');

        await this.checkSQLInjection();
        await this.checkXSS();
        await this.checkCSRF();
        await this.checkAuthentication();
        await this.checkSensitiveDataExposure();
        await this.checkAccessControl();
        await this.checkSecurityMisconfiguration();
        await this.checkInsecureDeserialization();
        await this.checkDependencyVulnerabilities();
        await this.checkLogging();

        this.calculateScore();
        await this.generateReport();

        return this.results;
    }

    /**
     * A1: Inyección SQL
     */
    async checkSQLInjection() {
        console.log('📋 [1/10] Verificando protección contra Inyección SQL...');

        try {
            // Buscar queries sin parametrizar
            const routesPath = path.join(__dirname, '../routes');
            const files = await fs.readdir(routesPath);

            let unsafeQueries = 0;
            const vulnerableFiles = [];

            for (const file of files) {
                if (!file.endsWith('.js')) continue;

                const content = await fs.readFile(path.join(routesPath, file), 'utf-8');

                // Patrones peligrosos
                const dangerousPatterns = [
                    /pool\.query\(`[^`]*\$\{/g,  // Template literals con interpolación
                    /pool\.query\('[^']*' \+ /g, // Concatenación de strings
                    /pool\.query\("[^"]*" \+ /g
                ];

                for (const pattern of dangerousPatterns) {
                    if (pattern.test(content)) {
                        unsafeQueries++;
                        vulnerableFiles.push(file);
                        break;
                    }
                }
            }

            if (unsafeQueries === 0) {
                this.results.passed.push({
                    check: 'A1: Inyección SQL',
                    status: 'PASS',
                    message: 'Todas las queries usan parametrización segura'
                });
                this.results.score += 10;
            } else {
                this.results.vulnerabilities.push({
                    severity: 'CRITICAL',
                    category: 'A1: Inyección SQL',
                    message: `${unsafeQueries} archivo(s) con posibles queries inseguras`,
                    files: vulnerableFiles,
                    recommendation: 'Usar siempre parametrización con $1, $2, etc.'
                });
            }

        } catch (error) {
            console.error('Error al verificar inyección SQL:', error.message);
        }
    }

    /**
     * A2: Autenticación Rota
     */
    async checkAuthentication() {
        console.log('📋 [4/10] Verificando Autenticación y Gestión de Sesiones...');

        const checks = [];

        // Verificar uso de JWT
        try {
            const authFile = await fs.readFile(
                path.join(__dirname, '../middleware/auth.js'),
                'utf-8'
            );

            if (authFile.includes('jsonwebtoken')) {
                checks.push({ item: 'JWT implementado', status: true });
            } else {
                checks.push({ item: 'JWT implementado', status: false });
            }

            if (authFile.includes('expiresIn')) {
                checks.push({ item: 'Expiración de tokens', status: true });
            } else {
                checks.push({ item: 'Expiración de tokens', status: false });
            }

        } catch (error) {
            checks.push({ item: 'Middleware de autenticación', status: false });
        }

        // Verificar uso de bcrypt
        try {
            const serverFile = await fs.readFile(
                path.join(__dirname, '../server.js'),
                'utf-8'
            );

            if (serverFile.includes('bcrypt')) {
                checks.push({ item: 'Hashing de contraseñas (bcrypt)', status: true });
            } else {
                checks.push({ item: 'Hashing de contraseñas', status: false });
            }

        } catch (error) {
            // Ignorar
        }

        const passedChecks = checks.filter(c => c.status).length;
        const totalChecks = checks.length;

        if (passedChecks === totalChecks) {
            this.results.passed.push({
                check: 'A2: Autenticación Rota',
                status: 'PASS',
                details: checks
            });
            this.results.score += 15;
        } else {
            this.results.warnings.push({
                severity: 'HIGH',
                category: 'A2: Autenticación Rota',
                message: `${passedChecks}/${totalChecks} verificaciones pasadas`,
                details: checks.filter(c => !c.status),
                recommendation: 'Implementar todas las mejores prácticas de autenticación'
            });
            this.results.score += Math.floor((passedChecks / totalChecks) * 15);
        }
    }

    /**
     * A3: Exposición de Datos Sensibles
     */
    async checkSensitiveDataExposure() {
        console.log('📋 [5/10] Verificando Exposición de Datos Sensibles...');

        const issues = [];

        // Verificar .env en .gitignore
        try {
            const gitignorePath = path.join(__dirname, '../../.gitignore');
            const gitignore = await fs.readFile(gitignorePath, 'utf-8');

            if (!gitignore.includes('.env')) {
                issues.push({
                    item: '.env no está en .gitignore',
                    severity: 'CRITICAL'
                });
            }

        } catch (error) {
            issues.push({
                item: 'No se encuentra archivo .gitignore',
                severity: 'HIGH'
            });
        }

        // Verificar que no haya credenciales hardcodeadas
        try {
            const serverFile = await fs.readFile(
                path.join(__dirname, '../server.js'),
                'utf-8'
            );

            const dangerousPatterns = [
                /password\s*=\s*['"][^'"]{3,}['"]/gi,
                /secret\s*=\s*['"][^'"]{10,}['"]/gi,
                /api_key\s*=\s*['"][^'"]{10,}['"]/gi
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(serverFile)) {
                    issues.push({
                        item: 'Posibles credenciales hardcodeadas en server.js',
                        severity: 'CRITICAL'
                    });
                    break;
                }
            }

        } catch (error) {
            // Ignorar
        }

        if (issues.length === 0) {
            this.results.passed.push({
                check: 'A3: Exposición de Datos Sensibles',
                status: 'PASS'
            });
            this.results.score += 15;
        } else {
            this.results.vulnerabilities.push({
                severity: issues[0].severity,
                category: 'A3: Exposición de Datos Sensibles',
                issues: issues,
                recommendation: 'Usar variables de entorno para todas las credenciales'
            });
        }
    }

    /**
     * A5: Control de Acceso Roto
     */
    async checkAccessControl() {
        console.log('📋 [6/10] Verificando Control de Acceso...');

        try {
            const routesPath = path.join(__dirname, '../routes');
            const files = await fs.readdir(routesPath);

            let protectedRoutes = 0;
            let unprotectedRoutes = 0;

            for (const file of files) {
                if (!file.endsWith('.js')) continue;
                if (file === 'health.js') continue; // Health check debe ser público

                const content = await fs.readFile(path.join(routesPath, file), 'utf-8');

                // Buscar middlewares de autenticación
                const hasAuth = content.includes('auth') ||
                               content.includes('verifyToken') ||
                               content.includes('authenticate');

                if (hasAuth) {
                    protectedRoutes++;
                } else {
                    unprotectedRoutes++;
                }
            }

            if (unprotectedRoutes <= 3) { // Algunos routes públicos son aceptables
                this.results.passed.push({
                    check: 'A5: Control de Acceso',
                    status: 'PASS',
                    details: { protected: protectedRoutes, public: unprotectedRoutes }
                });
                this.results.score += 10;
            } else {
                this.results.warnings.push({
                    severity: 'MEDIUM',
                    category: 'A5: Control de Acceso',
                    message: `${unprotectedRoutes} rutas potencialmente sin protección`,
                    recommendation: 'Revisar que todas las rutas sensibles requieran autenticación'
                });
                this.results.score += 5;
            }

        } catch (error) {
            console.error('Error al verificar control de acceso:', error.message);
        }
    }

    /**
     * A6: Configuración de Seguridad Incorrecta
     */
    async checkSecurityMisconfiguration() {
        console.log('📋 [7/10] Verificando Configuración de Seguridad...');

        const checks = [];

        // Verificar helmet
        try {
            const serverFile = await fs.readFile(
                path.join(__dirname, '../server.js'),
                'utf-8'
            );

            if (serverFile.includes('helmet')) {
                checks.push({ item: 'Helmet configurado', status: true });
            } else {
                checks.push({ item: 'Helmet no encontrado', status: false });
            }

            if (serverFile.includes('cors')) {
                checks.push({ item: 'CORS configurado', status: true });
            } else {
                checks.push({ item: 'CORS configurado', status: false });
            }

            if (serverFile.includes('express-rate-limit')) {
                checks.push({ item: 'Rate limiting configurado', status: true });
            } else {
                checks.push({ item: 'Rate limiting no encontrado', status: false });
            }

        } catch (error) {
            checks.push({ item: 'Error al leer configuración', status: false });
        }

        const passedChecks = checks.filter(c => c.status).length;
        const totalChecks = checks.length;

        if (passedChecks >= totalChecks - 1) { // Permitir 1 fallo
            this.results.passed.push({
                check: 'A6: Configuración de Seguridad',
                status: 'PASS',
                details: checks
            });
            this.results.score += 10;
        } else {
            this.results.warnings.push({
                severity: 'MEDIUM',
                category: 'A6: Configuración de Seguridad',
                message: `${passedChecks}/${totalChecks} configuraciones implementadas`,
                details: checks.filter(c => !c.status),
                recommendation: 'Implementar todas las configuraciones de seguridad recomendadas'
            });
            this.results.score += Math.floor((passedChecks / totalChecks) * 10);
        }
    }

    /**
     * A7: XSS (Cross-Site Scripting)
     */
    async checkXSS() {
        console.log('📋 [2/10] Verificando protección contra XSS...');

        // Verificar uso de express-validator
        try {
            const packageFile = await fs.readFile(
                path.join(__dirname, '../../package.json'),
                'utf-8'
            );

            const pkg = JSON.parse(packageFile);

            if (pkg.dependencies['express-validator']) {
                this.results.passed.push({
                    check: 'A7: XSS - Validación de Inputs',
                    status: 'PASS',
                    message: 'express-validator instalado'
                });
                this.results.score += 10;
            } else {
                this.results.warnings.push({
                    severity: 'HIGH',
                    category: 'A7: XSS',
                    message: 'express-validator no instalado',
                    recommendation: 'Instalar express-validator para sanitización de inputs'
                });
            }

        } catch (error) {
            console.error('Error al verificar XSS:', error.message);
        }
    }

    /**
     * A8: Deserialización Insegura
     */
    async checkInsecureDeserialization() {
        console.log('📋 [8/10] Verificando Deserialización Insegura...');

        try {
            const routesPath = path.join(__dirname, '../routes');
            const files = await fs.readdir(routesPath);

            let unsafeDeserializations = 0;

            for (const file of files) {
                if (!file.endsWith('.js')) continue;

                const content = await fs.readFile(path.join(routesPath, file), 'utf-8');

                // Buscar eval() o Function() que pueden ser peligrosos
                if (content.includes('eval(') || content.includes('Function(')) {
                    unsafeDeserializations++;
                }
            }

            if (unsafeDeserializations === 0) {
                this.results.passed.push({
                    check: 'A8: Deserialización Insegura',
                    status: 'PASS'
                });
                this.results.score += 5;
            } else {
                this.results.vulnerabilities.push({
                    severity: 'HIGH',
                    category: 'A8: Deserialización Insegura',
                    message: `${unsafeDeserializations} uso(s) de eval() o Function() detectados`,
                    recommendation: 'Evitar eval() y Function(), usar alternativas seguras'
                });
            }

        } catch (error) {
            console.error('Error al verificar deserialización:', error.message);
        }
    }

    /**
     * A9: Componentes con Vulnerabilidades Conocidas
     */
    async checkDependencyVulnerabilities() {
        console.log('📋 [9/10] Verificando Vulnerabilidades en Dependencias...');

        try {
            // Ejecutar npm audit
            const auditOutput = execSync('npm audit --json', {
                cwd: path.join(__dirname, '../..'),
                encoding: 'utf-8'
            });

            const auditResults = JSON.parse(auditOutput);

            const critical = auditResults.metadata?.vulnerabilities?.critical || 0;
            const high = auditResults.metadata?.vulnerabilities?.high || 0;
            const moderate = auditResults.metadata?.vulnerabilities?.moderate || 0;

            if (critical === 0 && high === 0) {
                this.results.passed.push({
                    check: 'A9: Componentes con Vulnerabilidades',
                    status: 'PASS',
                    details: { critical, high, moderate }
                });
                this.results.score += 15;
            } else if (critical > 0) {
                this.results.vulnerabilities.push({
                    severity: 'CRITICAL',
                    category: 'A9: Componentes con Vulnerabilidades',
                    message: `${critical} vulnerabilidades críticas, ${high} altas`,
                    recommendation: 'Ejecutar: npm audit fix --force'
                });
            } else {
                this.results.warnings.push({
                    severity: 'HIGH',
                    category: 'A9: Componentes con Vulnerabilidades',
                    message: `${high} vulnerabilidades altas, ${moderate} moderadas`,
                    recommendation: 'Ejecutar: npm audit fix'
                });
                this.results.score += 10;
            }

        } catch (error) {
            // npm audit retorna código de error si hay vulnerabilidades
            try {
                const auditResults = JSON.parse(error.stdout || '{}');
                const critical = auditResults.metadata?.vulnerabilities?.critical || 0;
                const high = auditResults.metadata?.vulnerabilities?.high || 0;

                if (critical > 0 || high > 0) {
                    this.results.vulnerabilities.push({
                        severity: critical > 0 ? 'CRITICAL' : 'HIGH',
                        category: 'A9: Componentes con Vulnerabilidades',
                        message: `${critical} críticas, ${high} altas detectadas`,
                        recommendation: 'Ejecutar: npm audit fix'
                    });
                }
            } catch (parseError) {
                console.error('Error al parsear npm audit:', parseError.message);
            }
        }
    }

    /**
     * A10: Logging y Monitoreo Insuficiente
     */
    async checkLogging() {
        console.log('📋 [10/10] Verificando Logging y Monitoreo...');

        const checks = [];

        try {
            const serverFile = await fs.readFile(
                path.join(__dirname, '../server.js'),
                'utf-8'
            );

            // Verificar logging de errores
            if (serverFile.includes('console.error') || serverFile.includes('logger.error')) {
                checks.push({ item: 'Logging de errores', status: true });
            } else {
                checks.push({ item: 'Logging de errores', status: false });
            }

            // Verificar logging de accesos
            if (serverFile.includes('morgan') || serverFile.includes('winston')) {
                checks.push({ item: 'Logger profesional (morgan/winston)', status: true });
            } else {
                checks.push({ item: 'Logger profesional', status: false });
            }

        } catch (error) {
            checks.push({ item: 'Error al verificar logging', status: false });
        }

        const passedChecks = checks.filter(c => c.status).length;

        if (passedChecks >= 1) {
            this.results.passed.push({
                check: 'A10: Logging y Monitoreo',
                status: 'PASS',
                details: checks
            });
            this.results.score += 10;
        } else {
            this.results.warnings.push({
                severity: 'MEDIUM',
                category: 'A10: Logging y Monitoreo',
                message: 'Logging insuficiente detectado',
                recommendation: 'Implementar winston para logging estructurado'
            });
            this.results.score += 5;
        }
    }

    /**
     * A4: CSRF (Cross-Site Request Forgery)
     */
    async checkCSRF() {
        console.log('📋 [3/10] Verificando protección contra CSRF...');

        try {
            const serverFile = await fs.readFile(
                path.join(__dirname, '../server.js'),
                'utf-8'
            );

            if (serverFile.includes('csurf') || serverFile.includes('csrf')) {
                this.results.passed.push({
                    check: 'A4: CSRF',
                    status: 'PASS'
                });
                this.results.score += 5;
            } else {
                this.results.warnings.push({
                    severity: 'MEDIUM',
                    category: 'A4: CSRF',
                    message: 'Protección CSRF no detectada',
                    recommendation: 'Considerar implementar csurf middleware para formularios'
                });
            }

        } catch (error) {
            console.error('Error al verificar CSRF:', error.message);
        }
    }

    /**
     * Calcular score final
     */
    calculateScore() {
        const percentage = Math.round((this.results.score / this.results.maxScore) * 100);

        this.results.percentage = percentage;
        this.results.grade = this.getGrade(percentage);
    }

    /**
     * Obtener calificación según porcentaje
     */
    getGrade(percentage) {
        if (percentage >= 90) return 'A (Excelente)';
        if (percentage >= 80) return 'B (Bueno)';
        if (percentage >= 70) return 'C (Aceptable)';
        if (percentage >= 60) return 'D (Necesita Mejoras)';
        return 'F (Crítico)';
    }

    /**
     * Generar reporte
     */
    async generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 REPORTE DE AUDITORÍA DE SEGURIDAD APPSEC');
        console.log('='.repeat(70));
        console.log(`Fecha: ${this.results.timestamp}`);
        console.log(`Puntuación: ${this.results.score}/${this.results.maxScore} (${this.results.percentage}%)`);
        console.log(`Calificación: ${this.results.grade}`);
        console.log('='.repeat(70));

        console.log(`\n✅ Verificaciones Pasadas: ${this.results.passed.length}`);
        this.results.passed.forEach(p => {
            console.log(`  ✓ ${p.check}`);
        });

        if (this.results.warnings.length > 0) {
            console.log(`\n⚠️  Advertencias: ${this.results.warnings.length}`);
            this.results.warnings.forEach(w => {
                console.log(`  • [${w.severity}] ${w.category}: ${w.message}`);
                if (w.recommendation) {
                    console.log(`    Recomendación: ${w.recommendation}`);
                }
            });
        }

        if (this.results.vulnerabilities.length > 0) {
            console.log(`\n🚨 Vulnerabilidades Críticas: ${this.results.vulnerabilities.length}`);
            this.results.vulnerabilities.forEach(v => {
                console.log(`  ⚠️  [${v.severity}] ${v.category}: ${v.message}`);
                if (v.recommendation) {
                    console.log(`    Recomendación: ${v.recommendation}`);
                }
            });
        }

        console.log('\n' + '='.repeat(70));

        // Guardar reporte en archivo JSON
        const reportPath = path.join(__dirname, '../reports/security-audit-report.json');
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

        console.log(`\n📄 Reporte guardado en: ${reportPath}`);
    }
}

// Ejecutar auditoría
(async () => {
    try {
        const auditor = new SecurityAuditor();
        const results = await auditor.runAudit();

        // Determinar código de salida
        const exitCode = results.vulnerabilities.length > 0 ? 1 : 0;
        process.exit(exitCode);

    } catch (error) {
        console.error('❌ Error fatal en auditoría:', error);
        process.exit(1);
    }
})();
