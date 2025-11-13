/**
 * 🧪 QUALITY ASSURANCE - Sistema de Testing Básico
 * Bachillerato General Estatal "Héroes de la Patria"
 * Testing ligero sin dependencias externas
 */

class QualityAssurance {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        this.criticalErrors = [];
        
        // Auto-inicialización en desarrollo/testing
        if (window.location.hostname === 'localhost' || window.location.search.includes('test=true')) {
            this.init();
        }
    }

    init() {
        //console.log('🧪 Iniciando Quality Assurance...');
        
        // Esperar a que la página cargue completamente
        if (document.readyState === 'complete') {
            this.runAllTests();
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.runAllTests(), 1000);
            });
        }
    }

    // === FRAMEWORK DE TESTING BÁSICO ===
    test(name, testFunction, critical = false) {
        this.tests.push({
            name,
            testFunction,
            critical
        });
    }

    runAllTests() {
        //console.log('🔬 Ejecutando tests...');
        
        this.tests.forEach(test => {
            try {
                const result = test.testFunction();
                if (result === true) {
                    this.results.passed++;
                    this.results.details.push({
                        name: test.name,
                        status: 'PASS',
                        critical: test.critical
                    });
                } else {
                    this.results.failed++;
                    this.results.details.push({
                        name: test.name,
                        status: 'FAIL',
                        error: result || 'Test returned false',
                        critical: test.critical
                    });
                    
                    if (test.critical) {
                        this.criticalErrors.push(test.name);
                    }
                }
            } catch (error) {
                this.results.failed++;
                this.results.details.push({
                    name: test.name,
                    status: 'ERROR',
                    error: error.message,
                    critical: test.critical
                });
                
                if (test.critical) {
                    this.criticalErrors.push(test.name);
                }
            }
        });

        this.results.total = this.results.passed + this.results.failed;
        this.displayResults();
        
        // Reportar errores críticos
        if (this.criticalErrors.length > 0) {
            console.error('🚨 ERRORES CRÍTICOS DETECTADOS:', this.criticalErrors);
        }
    }

    displayResults() {
        const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        
        //console.log(`📊 RESULTADOS DE TESTING:`);
        //console.log(`✅ Pasaron: ${this.results.passed}/${this.results.total} (${passRate}%)`);
        //console.log(`❌ Fallaron: ${this.results.failed}`);
        //console.log(`🚨 Críticos: ${this.criticalErrors.length}`);
        
        // Detalles de fallos
        const failures = this.results.details.filter(r => r.status !== 'PASS');
        if (failures.length > 0) {
            //console.log('📝 DETALLES DE FALLOS:');
            failures.forEach(fail => {
                //console.log(`${fail.critical ? '🚨' : '⚠️'} ${fail.name}: ${fail.error}`);
            });
        }

        // Crear reporte visual si estamos en modo debug
        if (window.location.search.includes('debug=true')) {
            this.createVisualReport();
        }
    }

    createVisualReport() {
        const report = document.createElement('div');
        report.id = 'qa-report';
        report.innerHTML = sanitizeHTML(`
            <div style="
                position: fixed; top: 10px; right: 10px; 
                background: white; border: 2px solid #333;
                padding: 15px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                font-family: monospace; font-size: 12px; z-index: 10000; max-width: 400px;
                max-height: 300px; overflow-y: auto;
            ">
                <h4 style="margin:0 0 10px 0; color: #333;">🧪 QA Report</h4>
                <div>✅ Passed: ${this.results.passed}</div>
                <div>❌ Failed: ${this.results.failed}</div>
                <div>🚨 Critical: ${this.criticalErrors.length}</div>
                <hr>
                ${this.results.details.map(detail => `
                    <div style="color: ${detail.status === 'PASS' ? 'green' : 'red'};">
                        ${detail.status === 'PASS' ? '✅' : (detail.critical ? '🚨' : '⚠️')}
                        ${detail.name}
                        ${detail.error ? `<br><small style="color: #666;">${detail.error}</small>` : ''}
                    </div>
                `).join('')}
            </div>
        `);
        document.body.appendChild(report);

        // Auto-hide después de 10 segundos
        setTimeout(() => {
            if (report.parentNode) {
                report.parentNode.removeChild(report);
            }
        }, 10000);
    }

    // === TESTS ESPECÍFICOS PARA EL PROYECTO ===
    setupProjectTests() {
        // Test 1: Elementos críticos de navegación
        this.test('Navegación Principal Existe', () => {
            return document.querySelector('.navbar') !== null;
        }, true);

        // Test 2: Header se carga correctamente
        this.test('Header Cargado', () => {
            const header = document.querySelector('header');
            return header && header.children.length > 0;
        }, true);

        // Test 3: Dark mode funciona
        this.test('Dark Mode Disponible', () => {
            const darkModeToggle = document.querySelector('#darkModeToggle') || 
                                   document.querySelector('.dark-mode-toggle');
            return darkModeToggle !== null;
        }, false);

        // Test 4: Service Worker está registrado
        this.test('Service Worker Registrado', () => {
            return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
        }, false);

        // Test 5: No hay errores JavaScript críticos
        this.test('Sin Errores JS Críticos', () => {
            return window.jsErrors ? window.jsErrors.length === 0 : true;
        }, true);

        // Test 6: Todas las imágenes importantes cargan
        this.test('Imágenes Críticas Cargan', () => {
            const criticalImages = document.querySelectorAll('img[src*="logo"], img[src*="hero"]');
            let loadedCount = 0;
            
            criticalImages.forEach(img => {
                if (img.complete && img.naturalWidth > 0) {
                    loadedCount++;
                }
            });
            
            return criticalImages.length === 0 || loadedCount > 0;
        }, false);

        // Test 7: Bootstrap está cargado
        this.test('Bootstrap CSS Cargado', () => {
            const bootstrapTest = document.createElement('div');
            bootstrapTest.className = 'container d-none';
            document.body.appendChild(bootstrapTest);
            
            const computedStyle = window.getComputedStyle(bootstrapTest);
            const isBootstrapLoaded = computedStyle.display === 'none';
            
            document.body.removeChild(bootstrapTest);
            return isBootstrapLoaded;
        }, true);

        // Test 8: FontAwesome está cargado
        this.test('FontAwesome Cargado', () => {
            const faTest = document.createElement('i');
            faTest.className = 'fas fa-home';
            faTest.style.display = 'none';
            document.body.appendChild(faTest);
            
            const computedStyle = window.getComputedStyle(faTest, '::before');
            const isFALoaded = computedStyle.fontFamily.includes('Font Awesome') || 
                              computedStyle.content !== 'none';
            
            document.body.removeChild(faTest);
            return isFALoaded;
        }, false);

        // Test 9: Performance básico
        this.test('Tiempo de Carga Aceptable', () => {
            const loadTime = performance.now();
            return loadTime < 5000; // Menos de 5 segundos
        }, false);

        // Test 10: Responsive design básico
        this.test('Responsive Meta Tag', () => {
            const viewportMeta = document.querySelector('meta[name="viewport"]');
            return viewportMeta && viewportMeta.content.includes('width=device-width');
        }, true);
    }

    // Método para agregar listener de errores JS
    setupErrorTracking() {
        window.jsErrors = window.jsErrors || [];
        
        window.addEventListener('error', (event) => {
            window.jsErrors.push({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            window.jsErrors.push({
                message: 'Unhandled Promise Rejection',
                error: event.reason
            });
        });
    }

    // Método público para ejecutar tests manuales
    runTests() {
        this.runAllTests();
    }

    // Método para obtener resultados
    getResults() {
        return {
            ...this.results,
            criticalErrors: this.criticalErrors,
            passed: this.results.passed,
            failed: this.results.failed,
            passRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
        };
    }
}

// Inicialización automática
const qa = new QualityAssurance();

// Setup de tracking de errores
qa.setupErrorTracking();

// Setup de tests del proyecto
qa.setupProjectTests();

// Exponer globalmente para debug
window.qa = qa;

// Comando de consola para ejecutar tests manualmente
window.runQATests = () => qa.runTests();

//console.log('🧪 Quality Assurance inicializado. Usa runQATests() para ejecutar manualmente.');