#!/usr/bin/env node
/**
 * 🤖 SCRIPT DE TESTS E2E PARA CI/CD
 * Ejecuta tests End-to-End automáticos en pipeline
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class E2ETestRunner {
    constructor() {
        this.baseURL = process.env.TEST_URL || 'http://localhost:3000';
        this.results = [];
        this.startTime = Date.now();
    }

    async runTests() {
        console.log('🤖 [E2E-CI] Iniciando tests E2E para CI/CD...');
        console.log(`📍 [E2E-CI] URL base: ${this.baseURL}`);

        try {
            await this.waitForServer();
            await this.executeTestSuite();
            this.generateReport();
            this.exitWithCode();
        } catch (error) {
            console.error('❌ [E2E-CI] Error en tests E2E:', error.message);
            process.exit(1);
        }
    }

    async waitForServer() {
        console.log('⏳ [E2E-CI] Esperando que el servidor esté listo...');

        for (let i = 0; i < 30; i++) {
            try {
                const response = await fetch(this.baseURL);
                if (response.ok) {
                    console.log('✅ [E2E-CI] Servidor listo');
                    return;
                }
            } catch (error) {
                // Servidor no listo, seguir esperando
            }

            await this.sleep(2000);
        }

        throw new Error('Timeout esperando servidor');
    }

    async executeTestSuite() {
        const tests = [
            { name: 'Carga de página principal', test: this.testHomePage.bind(this) },
            { name: 'Sistema de onboarding', test: this.testOnboarding.bind(this) },
            { name: 'Personalización', test: this.testPersonalization.bind(this) },
            { name: 'Formulario de contacto', test: this.testContactForm.bind(this) },
            { name: 'Responsividad móvil', test: this.testMobileResponsive.bind(this) },
            { name: 'Accesibilidad básica', test: this.testBasicAccessibility.bind(this) }
        ];

        for (const test of tests) {
            console.log(`🧪 [E2E-CI] Ejecutando: ${test.name}...`);

            try {
                const result = await test.test();
                this.results.push({
                    name: test.name,
                    status: 'pass',
                    duration: result.duration || 0,
                    message: result.message || 'Test pasó correctamente'
                });
                console.log(`✅ [E2E-CI] ${test.name}: PASÓ`);
            } catch (error) {
                this.results.push({
                    name: test.name,
                    status: 'fail',
                    duration: 0,
                    message: error.message
                });
                console.log(`❌ [E2E-CI] ${test.name}: FALLÓ - ${error.message}`);
            }
        }
    }

    async testHomePage() {
        const startTime = Date.now();
        const response = await fetch(this.baseURL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Verificar elementos críticos
        const checks = [
            { check: html.includes('<title>'), error: 'Falta elemento title' },
            { check: html.includes('Héroes de la Patria'), error: 'Falta título del sitio' },
            { check: html.includes('js/main.js'), error: 'Falta script principal' },
            { check: html.includes('bootstrap'), error: 'Falta Bootstrap' }
        ];

        for (const { check, error } of checks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Página principal carga correctamente'
        };
    }

    async testOnboarding() {
        const startTime = Date.now();
        const response = await fetch(this.baseURL);
        const html = await response.text();

        const onboardingChecks = [
            { check: html.includes('onboarding-system.js'), error: 'Falta script de onboarding' },
            { check: html.includes('tutorial') || html.includes('onboarding'), error: 'Falta referencia a tutorial' }
        ];

        for (const { check, error } of onboardingChecks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Sistema de onboarding presente'
        };
    }

    async testPersonalization() {
        const startTime = Date.now();
        const response = await fetch(this.baseURL);
        const html = await response.text();

        const personalizationChecks = [
            { check: html.includes('advanced-personalization-system.js'), error: 'Falta script de personalización' },
            { check: html.includes('theme') || html.includes('personaliz'), error: 'Falta referencia a personalización' }
        ];

        for (const { check, error } of personalizationChecks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Sistema de personalización presente'
        };
    }

    async testContactForm() {
        const startTime = Date.now();
        const response = await fetch(`${this.baseURL}/contacto.html`);

        if (!response.ok) {
            throw new Error(`Página de contacto no accesible: HTTP ${response.status}`);
        }

        const html = await response.text();

        const formChecks = [
            { check: html.includes('<form'), error: 'Falta formulario de contacto' },
            { check: html.includes('name') && html.includes('email'), error: 'Faltan campos básicos' },
            { check: html.includes('professional-forms.js'), error: 'Falta script de formularios' }
        ];

        for (const { check, error } of formChecks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Formulario de contacto funcional'
        };
    }

    async testMobileResponsive() {
        const startTime = Date.now();
        const response = await fetch(this.baseURL);
        const html = await response.text();

        const mobileChecks = [
            { check: html.includes('viewport'), error: 'Falta meta viewport' },
            { check: html.includes('mobile-ux-advanced.js'), error: 'Falta script UX móvil' },
            { check: html.includes('responsive') || html.includes('mobile'), error: 'Falta referencia a móvil' }
        ];

        for (const { check, error } of mobileChecks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Optimización móvil presente'
        };
    }

    async testBasicAccessibility() {
        const startTime = Date.now();
        const response = await fetch(this.baseURL);
        const html = await response.text();

        const a11yChecks = [
            { check: html.includes('lang='), error: 'Falta atributo lang' },
            { check: html.includes('alt=') || html.includes('alt '), error: 'Posibles imágenes sin alt' },
            { check: html.includes('accessibility-auditor-system.js'), error: 'Falta auditor de accesibilidad' }
        ];

        for (const { check, error } of a11yChecks) {
            if (!check) throw new Error(error);
        }

        return {
            duration: Date.now() - startTime,
            message: 'Características de accesibilidad presentes'
        };
    }

    generateReport() {
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => r.status === 'pass').length;
        const failedTests = this.results.filter(r => r.status === 'fail').length;
        const duration = Date.now() - this.startTime;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                duration: duration,
                passRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
            },
            environment: {
                baseURL: this.baseURL,
                nodeVersion: process.version,
                platform: process.platform
            },
            results: this.results
        };

        // Crear directorio de reportes si no existe
        const reportsDir = path.join(process.cwd(), 'e2e-reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Guardar reporte JSON
        const reportPath = path.join(reportsDir, `e2e-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // Generar reporte markdown
        const markdownReport = this.generateMarkdownReport(report);
        const markdownPath = path.join(reportsDir, `e2e-report-${Date.now()}.md`);
        fs.writeFileSync(markdownPath, markdownReport);

        console.log('\n📊 [E2E-CI] RESUMEN DE TESTS E2E:');
        console.log(`✅ Pasaron: ${passedTests}/${totalTests}`);
        console.log(`❌ Fallaron: ${failedTests}/${totalTests}`);
        console.log(`⏱️ Duración: ${duration}ms`);
        console.log(`📄 Reporte: ${reportPath}`);

        return report;
    }

    generateMarkdownReport(report) {
        let markdown = `# 🤖 Reporte E2E Tests\n\n`;
        markdown += `**Fecha:** ${report.timestamp}\n`;
        markdown += `**URL Base:** ${report.environment.baseURL}\n`;
        markdown += `**Duración:** ${report.summary.duration}ms\n\n`;

        markdown += `## 📊 Resumen\n\n`;
        markdown += `- **Total:** ${report.summary.total} tests\n`;
        markdown += `- **✅ Pasaron:** ${report.summary.passed}\n`;
        markdown += `- **❌ Fallaron:** ${report.summary.failed}\n`;
        markdown += `- **📈 Tasa de éxito:** ${report.summary.passRate}%\n\n`;

        markdown += `## 📋 Resultados Detallados\n\n`;

        report.results.forEach(result => {
            const icon = result.status === 'pass' ? '✅' : '❌';
            markdown += `### ${icon} ${result.name}\n`;
            markdown += `- **Estado:** ${result.status}\n`;
            markdown += `- **Duración:** ${result.duration}ms\n`;
            markdown += `- **Mensaje:** ${result.message}\n\n`;
        });

        return markdown;
    }

    exitWithCode() {
        const failedTests = this.results.filter(r => r.status === 'fail').length;
        const exitCode = failedTests > 0 ? 1 : 0;

        if (exitCode === 0) {
            console.log('🎉 [E2E-CI] Todos los tests E2E pasaron exitosamente');
        } else {
            console.log('💥 [E2E-CI] Algunos tests E2E fallaron');
        }

        process.exit(exitCode);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Ejecutar tests si es llamado directamente
if (require.main === module) {
    const runner = new E2ETestRunner();
    runner.runTests().catch(error => {
        console.error('💥 [E2E-CI] Error fatal:', error);
        process.exit(1);
    });
}

module.exports = E2ETestRunner;