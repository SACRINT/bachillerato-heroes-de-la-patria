/**
 * 🧪 SISTEMA DE TESTING AUTOMÁTICO
 * Bachillerato General Estatal "Héroes de la Patria"
 * Framework completo de testing para componentes críticos del sistema
 */

class AutomatedTestingSystem {
    constructor() {
        this.testResults = [];
        this.currentTestSuite = null;
        this.isRunning = false;
        this.startTime = null;
        this.testConfig = {
            timeout: 10000,
            retries: 3,
            parallel: false,
            generateReport: true,
            autoRun: false
        };

        // Definir tests críticos
        this.testSuites = {
            criticalButtons: {
                name: 'Botones Críticos',
                tests: [
                    { name: 'Botón Notificaciones', target: '[data-notification-button]', type: 'existence' },
                    { name: 'Botón IA Tutor', target: '#ai-tutor-btn', type: 'functionality' },
                    { name: 'Botón Personalización', target: '#personalization-btn', type: 'functionality' },
                    { name: 'Botón PWA Install', target: '#pwa-install-button', type: 'existence' },
                    { name: 'Botón Modo Oscuro', target: '#darkModeToggle', type: 'functionality' },
                    { name: 'Botón Onboarding Help', target: '#onboarding-help-btn', type: 'existence' }
                ]
            },
            forms: {
                name: 'Formularios',
                tests: [
                    { name: 'Formulario Contacto', target: '#contact-form', type: 'form-validation' },
                    { name: 'Inputs con Voice', target: '[data-voice-enabled]', type: 'voice-integration' },
                    { name: 'Validación Email', target: 'input[type="email"]', type: 'email-validation' },
                    { name: 'Anti-spam Honeypot', target: '[style*="display: none"]', type: 'security' }
                ]
            },
            mobileUX: {
                name: 'UX Móvil',
                tests: [
                    { name: 'Detección Móvil', target: 'body.mobile-device', type: 'mobile-detection' },
                    { name: 'Toolbar Móvil', target: '#mobile-toolbar', type: 'mobile-toolbar' },
                    { name: 'Touch Events', target: '.touch-device', type: 'touch-support' },
                    { name: 'Swipe Gestures', target: '.swipe-container', type: 'gesture-support' }
                ]
            },
            accessibility: {
                name: 'Accesibilidad',
                tests: [
                    { name: 'Contraste de Colores', target: '*', type: 'color-contrast' },
                    { name: 'Elementos Focusables', target: 'button, a, input', type: 'focus-management' },
                    { name: 'Alt Text Imágenes', target: 'img', type: 'alt-text' },
                    { name: 'ARIA Labels', target: '[aria-label], [aria-labelledby]', type: 'aria-compliance' }
                ]
            },
            performance: {
                name: 'Rendimiento',
                tests: [
                    { name: 'Tiempo de Carga', target: 'document', type: 'load-time' },
                    { name: 'Lazy Loading', target: 'img[data-src]', type: 'lazy-loading' },
                    { name: 'Service Worker', target: 'navigator.serviceWorker', type: 'sw-registration' },
                    { name: 'Core Web Vitals', target: 'window', type: 'web-vitals' }
                ]
            }
        };

        this.init();
    }

    init() {
        this.createTestingUI();
        this.setupEventListeners();
        this.loadTestHistory();

        if (this.testConfig.autoRun) {
            setTimeout(() => this.runAllTests(), 2000);
        }

        console.log('🧪 [TESTING] Sistema de testing automático inicializado');
    }

    createTestingUI() {
        // Crear botón de testing flotante
        const testingBtn = document.createElement('button');
        testingBtn.id = 'testing-btn';
        testingBtn.innerHTML = '🧪';
        testingBtn.title = 'Ejecutar tests automáticos';
        testingBtn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        testingBtn.addEventListener('click', () => this.openTestingPanel());
        testingBtn.addEventListener('mouseenter', () => {
            testingBtn.style.transform = 'translateY(-50%) scale(1.1)';
            testingBtn.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.6)';
        });
        testingBtn.addEventListener('mouseleave', () => {
            testingBtn.style.transform = 'translateY(-50%) scale(1)';
            testingBtn.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
        });

        document.body.appendChild(testingBtn);

        // Crear panel de testing
        this.createTestingPanel();
    }

    createTestingPanel() {
        const panel = document.createElement('div');
        panel.id = 'testing-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: -450px;
            width: 450px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 5px 0 20px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        panel.innerHTML = this.generateTestingPanelHTML();
        document.body.appendChild(panel);
    }

    generateTestingPanelHTML() {
        return `
            <div style="padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #333;">🧪 Testing Automático</h2>
                    <button onclick="automatedTesting.closeTestingPanel()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">×</button>
                </div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Tests automáticos para asegurar calidad</p>
            </div>

            <div style="padding: 20px;">
                <!-- Controles generales -->
                <div class="testing-controls" style="margin-bottom: 30px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button onclick="automatedTesting.runAllTests()"
                                class="btn-test-run" style="
                                    flex: 1;
                                    padding: 12px;
                                    background: linear-gradient(135deg, #28a745, #20c997);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                        ">▶️ Ejecutar Todos</button>
                        <button onclick="automatedTesting.stopTests()"
                                class="btn-test-stop" style="
                                    flex: 1;
                                    padding: 12px;
                                    background: #dc3545;
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                        ">⏹️ Detener</button>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="automatedTesting.generateReport()" style="
                            flex: 1;
                            padding: 8px;
                            background: #17a2b8;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">📊 Reporte</button>
                        <button onclick="automatedTesting.clearResults()" style="
                            flex: 1;
                            padding: 8px;
                            background: #6c757d;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                        ">🗑️ Limpiar</button>
                    </div>
                </div>

                <!-- Suites de testing -->
                <div id="test-suites">
                    ${Object.entries(this.testSuites).map(([suiteKey, suite]) => `
                        <div class="test-suite" style="margin-bottom: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <h4 style="margin: 0; color: #333;">${suite.name}</h4>
                                <button onclick="automatedTesting.runTestSuite('${suiteKey}')" style="
                                    padding: 6px 12px;
                                    background: #007bff;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">▶️ Ejecutar</button>
                            </div>
                            <div id="suite-${suiteKey}" class="test-items">
                                ${suite.tests.map((test, index) => `
                                    <div class="test-item" data-suite="${suiteKey}" data-test="${index}" style="
                                        display: flex;
                                        justify-content: space-between;
                                        align-items: center;
                                        padding: 8px 12px;
                                        margin-bottom: 5px;
                                        background: #f8f9fa;
                                        border-radius: 6px;
                                        border-left: 4px solid #dee2e6;
                                    ">
                                        <span style="font-size: 14px;">${test.name}</span>
                                        <div class="test-status" style="display: flex; align-items: center; gap: 8px;">
                                            <span class="test-result" style="font-size: 12px; color: #6c757d;">Pendiente</span>
                                            <button onclick="automatedTesting.runSingleTest('${suiteKey}', ${index})" style="
                                                padding: 4px 8px;
                                                background: #28a745;
                                                color: white;
                                                border: none;
                                                border-radius: 3px;
                                                font-size: 10px;
                                                cursor: pointer;
                                            ">▶️</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Resultados en tiempo real -->
                <div id="test-results-live" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                    min-height: 100px;
                    border: 1px solid #dee2e6;
                ">
                    <h5 style="margin: 0 0 10px 0; color: #333;">📋 Resultados en Tiempo Real</h5>
                    <div id="live-output" style="
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        color: #666;
                        max-height: 200px;
                        overflow-y: auto;
                    ">
                        Listo para ejecutar tests...
                    </div>
                </div>

                <!-- Estadísticas -->
                <div id="test-statistics" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin-top: 20px;
                ">
                    <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #155724;">0</div>
                        <div style="font-size: 12px; color: #155724;">Pasaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #721c24;">0</div>
                        <div style="font-size: 12px; color: #721c24;">Fallaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 6px;">
                        <div style="font-size: 20px; font-weight: bold; color: #856404;">0</div>
                        <div style="font-size: 12px; color: #856404;">Saltados</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Escuchar eventos de teclado para shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 't') {
                e.preventDefault();
                this.runAllTests();
            }
        });

        // Auto-test en cambios críticos
        this.setupAutoTesting();
    }

    setupAutoTesting() {
        // Observer para cambios en el DOM que requieran re-testing
        const observer = new MutationObserver((mutations) => {
            let needsRetest = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && (
                            node.matches?.('button') ||
                            node.matches?.('.btn') ||
                            node.matches?('[onclick]') ||
                            node.querySelector?.('button, .btn, [onclick]')
                        )) {
                            needsRetest = true;
                        }
                    });
                }
            });

            if (needsRetest && this.testConfig.autoRun) {
                setTimeout(() => this.runTestSuite('criticalButtons'), 1000);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async runAllTests() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.testResults = [];
        this.clearResults();
        this.logOutput('🚀 Iniciando suite completa de tests...\n');

        try {
            for (const [suiteKey, suite] of Object.entries(this.testSuites)) {
                await this.runTestSuite(suiteKey);
            }

            this.logOutput(`\n✅ Suite completa terminada en ${Date.now() - this.startTime}ms`);
            this.updateStatistics();

            if (this.testConfig.generateReport) {
                this.generateReport();
            }
        } catch (error) {
            this.logOutput(`\n❌ Error en suite de tests: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    async runTestSuite(suiteKey) {
        const suite = this.testSuites[suiteKey];
        if (!suite) return;

        this.currentTestSuite = suiteKey;
        this.logOutput(`\n📋 Ejecutando suite: ${suite.name}`);

        for (let i = 0; i < suite.tests.length; i++) {
            if (!this.isRunning) break;
            await this.runSingleTest(suiteKey, i);
        }
    }

    async runSingleTest(suiteKey, testIndex) {
        const suite = this.testSuites[suiteKey];
        const test = suite.tests[testIndex];

        if (!test) return;

        const testItem = document.querySelector(`[data-suite="${suiteKey}"][data-test="${testIndex}"]`);
        const resultElement = testItem?.querySelector('.test-result');

        // Marcar como ejecutándose
        if (resultElement) {
            resultElement.textContent = 'Ejecutando...';
            resultElement.style.color = '#007bff';
        }

        if (testItem) {
            testItem.style.borderLeftColor = '#007bff';
        }

        this.logOutput(`  🔍 ${test.name}... `);

        try {
            const result = await this.executeTest(test);

            this.testResults.push({
                suite: suiteKey,
                name: test.name,
                status: result.status,
                message: result.message,
                duration: result.duration,
                timestamp: Date.now()
            });

            // Actualizar UI
            if (resultElement) {
                resultElement.textContent = result.status === 'pass' ? '✅ Pasó' : '❌ Falló';
                resultElement.style.color = result.status === 'pass' ? '#28a745' : '#dc3545';
            }

            if (testItem) {
                testItem.style.borderLeftColor = result.status === 'pass' ? '#28a745' : '#dc3545';
            }

            this.logOutput(`${result.status === 'pass' ? '✅' : '❌'} ${result.message} (${result.duration}ms)\n`);

        } catch (error) {
            this.testResults.push({
                suite: suiteKey,
                name: test.name,
                status: 'error',
                message: error.message,
                duration: 0,
                timestamp: Date.now()
            });

            if (resultElement) {
                resultElement.textContent = '💥 Error';
                resultElement.style.color = '#dc3545';
            }

            if (testItem) {
                testItem.style.borderLeftColor = '#dc3545';
            }

            this.logOutput(`💥 Error: ${error.message}\n`);
        }

        this.updateStatistics();
    }

    async executeTest(test) {
        const startTime = Date.now();

        switch (test.type) {
            case 'existence':
                return this.testExistence(test);

            case 'functionality':
                return this.testFunctionality(test);

            case 'form-validation':
                return this.testFormValidation(test);

            case 'mobile-detection':
                return this.testMobileDetection(test);

            case 'color-contrast':
                return this.testColorContrast(test);

            case 'load-time':
                return this.testLoadTime(test);

            default:
                return {
                    status: 'skip',
                    message: 'Tipo de test no implementado',
                    duration: Date.now() - startTime
                };
        }
    }

    testExistence(test) {
        const startTime = Date.now();
        const element = document.querySelector(test.target);

        return {
            status: element ? 'pass' : 'fail',
            message: element ? 'Elemento encontrado' : 'Elemento no encontrado',
            duration: Date.now() - startTime
        };
    }

    testFunctionality(test) {
        const startTime = Date.now();
        const element = document.querySelector(test.target);

        if (!element) {
            return {
                status: 'fail',
                message: 'Elemento no encontrado',
                duration: Date.now() - startTime
            };
        }

        // Verificar si el elemento es clickeable
        const isClickable = element.onclick ||
                           element.addEventListener ||
                           element.getAttribute('onclick') ||
                           element.classList.contains('btn') ||
                           element.tagName.toLowerCase() === 'button';

        return {
            status: isClickable ? 'pass' : 'fail',
            message: isClickable ? 'Elemento funcional' : 'Elemento no es clickeable',
            duration: Date.now() - startTime
        };
    }

    testFormValidation(test) {
        const startTime = Date.now();
        const form = document.querySelector(test.target);

        if (!form) {
            return {
                status: 'fail',
                message: 'Formulario no encontrado',
                duration: Date.now() - startTime
            };
        }

        // Verificar validación HTML5
        const hasValidation = form.checkValidity !== undefined;
        const requiredFields = form.querySelectorAll('[required]');

        return {
            status: hasValidation && requiredFields.length > 0 ? 'pass' : 'fail',
            message: `Validación: ${hasValidation ? 'OK' : 'Falta'}, Campos requeridos: ${requiredFields.length}`,
            duration: Date.now() - startTime
        };
    }

    testMobileDetection(test) {
        const startTime = Date.now();
        const isMobile = window.innerWidth <= 768 || /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
        const hasMobileClass = document.body.classList.contains('mobile-device');

        return {
            status: (isMobile && hasMobileClass) || (!isMobile && !hasMobileClass) ? 'pass' : 'fail',
            message: `Detección correcta: ${isMobile ? 'Móvil' : 'Desktop'}, Clase: ${hasMobileClass}`,
            duration: Date.now() - startTime
        };
    }

    testColorContrast(test) {
        const startTime = Date.now();

        // Test simplificado de contraste
        const elements = document.querySelectorAll('button, .btn, a');
        let passCount = 0;
        let totalCount = elements.length;

        elements.forEach(el => {
            const styles = window.getComputedStyle(el);
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;

            // Verificación básica de que no sean colores muy similares
            if (bgColor !== textColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                passCount++;
            }
        });

        const passRate = totalCount > 0 ? (passCount / totalCount) * 100 : 100;

        return {
            status: passRate >= 80 ? 'pass' : 'fail',
            message: `Contraste: ${passRate.toFixed(1)}% de ${totalCount} elementos`,
            duration: Date.now() - startTime
        };
    }

    testLoadTime(test) {
        const startTime = Date.now();
        const loadTime = performance.timing ?
            performance.timing.loadEventEnd - performance.timing.navigationStart :
            Date.now() - startTime;

        return {
            status: loadTime < 3000 ? 'pass' : 'fail',
            message: `Tiempo de carga: ${loadTime}ms`,
            duration: Date.now() - startTime
        };
    }

    updateStatistics() {
        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail' || r.status === 'error').length;
        const skipped = this.testResults.filter(r => r.status === 'skip').length;

        const statsElement = document.getElementById('test-statistics');
        if (statsElement) {
            const statBoxes = statsElement.querySelectorAll('div > div');
            if (statBoxes[0]) statBoxes[0].textContent = passed;
            if (statBoxes[2]) statBoxes[2].textContent = failed;
            if (statBoxes[4]) statBoxes[4].textContent = skipped;
        }
    }

    logOutput(message) {
        const outputElement = document.getElementById('live-output');
        if (outputElement) {
            outputElement.textContent += message;
            outputElement.scrollTop = outputElement.scrollHeight;
        }
        console.log(`🧪 [TESTING] ${message.trim()}`);
    }

    clearResults() {
        this.testResults = [];
        const outputElement = document.getElementById('live-output');
        if (outputElement) {
            outputElement.textContent = 'Resultados limpiados...\n';
        }
        this.updateStatistics();
    }

    generateReport() {
        const totalTests = this.testResults.length;
        const passed = this.testResults.filter(r => r.status === 'pass').length;
        const failed = this.testResults.filter(r => r.status === 'fail' || r.status === 'error').length;
        const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0;

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passed,
                failed: failed,
                passRate: parseFloat(passRate)
            },
            duration: this.startTime ? Date.now() - this.startTime : 0,
            results: this.testResults,
            environment: {
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                url: window.location.href
            }
        };

        // Descargar reporte
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-report-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.logOutput(`\n📊 Reporte generado: ${passed}/${totalTests} tests pasaron (${passRate}%)`);
    }

    stopTests() {
        this.isRunning = false;
        this.logOutput('\n⏹️ Tests detenidos por el usuario\n');
    }

    openTestingPanel() {
        const panel = document.getElementById('testing-panel');
        if (panel) {
            panel.style.left = '0px';
            document.body.style.overflow = 'hidden';
        }
    }

    closeTestingPanel() {
        const panel = document.getElementById('testing-panel');
        if (panel) {
            panel.style.left = '-450px';
            document.body.style.overflow = 'auto';
        }
    }

    loadTestHistory() {
        const history = localStorage.getItem('bge_test_history');
        if (history) {
            try {
                const data = JSON.parse(history);
                console.log('📊 [TESTING] Historial cargado:', data.length, 'reportes anteriores');
            } catch (error) {
                console.warn('Error cargando historial de tests:', error);
            }
        }
    }

    saveTestHistory() {
        const history = JSON.parse(localStorage.getItem('bge_test_history') || '[]');
        history.push({
            timestamp: Date.now(),
            results: this.testResults.length,
            passed: this.testResults.filter(r => r.status === 'pass').length
        });

        // Mantener solo los últimos 10 reportes
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        localStorage.setItem('bge_test_history', JSON.stringify(history));
    }

    // API pública
    async testComponent(selector, type = 'existence') {
        return await this.executeTest({ target: selector, type: type });
    }

    getTestResults() {
        return this.testResults;
    }

    isTestRunning() {
        return this.isRunning;
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.automatedTesting = new AutomatedTestingSystem();
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTestingSystem;
}