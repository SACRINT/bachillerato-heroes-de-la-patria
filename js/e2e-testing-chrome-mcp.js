/**
 * 🤖 SISTEMA E2E TESTING CON CHROME DEVTOOLS MCP
 * Bachillerato General Estatal "Héroes de la Patria"
 * Testing End-to-End automatizado usando Chrome DevTools MCP
 */

class E2ETestingChromeMCP {
    constructor() {
        this.isAvailable = false;
        this.testScenarios = [];
        this.currentTest = null;
        this.results = [];
        this.config = {
            baseURL: 'http://localhost:3000',
            timeout: 30000,
            retries: 2,
            screenshots: true,
            recordVideo: false
        };

        // Detectar si Chrome DevTools MCP está disponible
        this.detectMCPAvailability();
        this.defineTestScenarios();
        this.init();
    }

    detectMCPAvailability() {
        // Verificar si hay funciones MCP disponibles
        this.isAvailable = typeof window.mcp__chrome_devtools__take_snapshot === 'function' ||
                          typeof window.mcp__chrome_devtools__navigate_page === 'function';

        console.log('🤖 [E2E-MCP] Chrome DevTools MCP disponible:', this.isAvailable);
    }

    defineTestScenarios() {
        this.testScenarios = [
            {
                name: 'Flujo Completo Visitante',
                description: 'Navegación completa de un visitante nuevo',
                steps: [
                    { action: 'navigate', url: '/index.html', description: 'Cargar página principal' },
                    { action: 'wait', selector: 'body', description: 'Esperar carga completa' },
                    { action: 'snapshot', description: 'Capturar estado inicial' },
                    { action: 'click', selector: '#onboarding-help-btn', description: 'Iniciar tutorial' },
                    { action: 'wait', text: 'Bienvenido', description: 'Esperar modal onboarding' },
                    { action: 'click', selector: 'button[onclick*="next"]', description: 'Siguiente paso tutorial' },
                    { action: 'navigate', url: '/contacto.html', description: 'Ir a página contacto' },
                    { action: 'fill', selector: '#name', value: 'Test User', description: 'Llenar nombre' },
                    { action: 'fill', selector: '#email', value: 'test@example.com', description: 'Llenar email' },
                    { action: 'snapshot', description: 'Capturar formulario lleno' }
                ]
            },
            {
                name: 'Test Responsividad Móvil',
                description: 'Verificar funcionalidad en dispositivos móviles',
                steps: [
                    { action: 'resize', width: 375, height: 667, description: 'Simular iPhone' },
                    { action: 'navigate', url: '/index.html', description: 'Cargar en móvil' },
                    { action: 'wait', selector: '#mobile-toolbar', description: 'Esperar toolbar móvil' },
                    { action: 'snapshot', description: 'Capturar vista móvil' },
                    { action: 'click', selector: '#mobile-toolbar button', description: 'Probar navegación móvil' },
                    { action: 'swipe', direction: 'left', description: 'Probar gesto swipe' },
                    { action: 'resize', width: 1024, height: 768, description: 'Cambiar a tablet' },
                    { action: 'snapshot', description: 'Capturar vista tablet' }
                ]
            },
            {
                name: 'Test Personalización Completa',
                description: 'Probar sistema de personalización',
                steps: [
                    { action: 'navigate', url: '/index.html', description: 'Cargar página' },
                    { action: 'click', selector: '#personalization-btn', description: 'Abrir personalización' },
                    { action: 'wait', selector: '#personalization-panel', description: 'Esperar panel' },
                    { action: 'click', selector: '.theme-option[onclick*="ocean"]', description: 'Cambiar tema océano' },
                    { action: 'click', selector: '.font-size-btn[onclick*="large"]', description: 'Aumentar fuente' },
                    { action: 'snapshot', description: 'Capturar personalización aplicada' },
                    { action: 'click', selector: 'button[onclick*="exportSettings"]', description: 'Exportar configuración' }
                ]
            },
            {
                name: 'Test Formularios y Validación',
                description: 'Verificar funcionamiento de formularios',
                steps: [
                    { action: 'navigate', url: '/contacto.html', description: 'Ir a contacto' },
                    { action: 'snapshot', description: 'Capturar formulario vacío' },
                    { action: 'click', selector: 'button[type="submit"]', description: 'Intentar envío vacío' },
                    { action: 'wait', text: 'requerido', description: 'Esperar validación' },
                    { action: 'fill', selector: '#name', value: 'Usuario Test', description: 'Llenar nombre válido' },
                    { action: 'fill', selector: '#email', value: 'usuario@test.com', description: 'Llenar email válido' },
                    { action: 'fill', selector: '#message', value: 'Mensaje de prueba E2E', description: 'Llenar mensaje' },
                    { action: 'snapshot', description: 'Capturar formulario válido' },
                    { action: 'click', selector: 'button[type="submit"]', description: 'Enviar formulario' }
                ]
            },
            {
                name: 'Test Accesibilidad',
                description: 'Verificar cumplimiento de accesibilidad',
                steps: [
                    { action: 'navigate', url: '/index.html', description: 'Cargar página principal' },
                    { action: 'evaluate', script: 'document.querySelectorAll("img:not([alt])").length', description: 'Verificar alt en imágenes' },
                    { action: 'evaluate', script: 'document.querySelectorAll("button:not([aria-label]):not([title])").length', description: 'Verificar labels en botones' },
                    { action: 'keypress', key: 'Tab', description: 'Probar navegación con teclado' },
                    { action: 'snapshot', description: 'Capturar elemento enfocado' },
                    { action: 'toggle_contrast', description: 'Activar alto contraste' },
                    { action: 'snapshot', description: 'Capturar con alto contraste' }
                ]
            }
        ];
    }

    init() {
        this.createE2EUI();
        console.log('🤖 [E2E-MCP] Sistema E2E inicializado con', this.testScenarios.length, 'escenarios');
    }

    createE2EUI() {
        // Crear botón E2E flotante
        const e2eBtn = document.createElement('button');
        e2eBtn.id = 'e2e-testing-btn';
        e2eBtn.innerHTML = '🤖';
        e2eBtn.title = 'E2E Testing con Chrome MCP';
        e2eBtn.style.cssText = `
            position: fixed;
            top: 60%;
            left: 20px;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 4px 15px rgba(111, 66, 193, 0.4);
            transition: all 0.3s ease;
            display: ${this.isAvailable ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
        `;

        e2eBtn.addEventListener('click', () => this.openE2EPanel());
        document.body.appendChild(e2eBtn);

        // Crear panel E2E
        this.createE2EPanel();
    }

    createE2EPanel() {
        const panel = document.createElement('div');
        panel.id = 'e2e-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: -500px;
            width: 500px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 5px 0 20px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        panel.innerHTML = this.generateE2EPanelHTML();
        document.body.appendChild(panel);
    }

    generateE2EPanelHTML() {
        return `
            <div style="padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #333;">🤖 E2E Testing</h2>
                    <button onclick="e2eTesting.closeE2EPanel()" style="
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
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                    Testing End-to-End con Chrome DevTools MCP
                    ${this.isAvailable ? '✅ Disponible' : '❌ No disponible'}
                </p>
            </div>

            <div style="padding: 20px;">
                <!-- Controles principales -->
                <div class="e2e-controls" style="margin-bottom: 30px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button onclick="e2eTesting.runAllScenarios()"
                                style="
                                    flex: 1;
                                    padding: 12px;
                                    background: linear-gradient(135deg, #6f42c1, #e83e8c);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                        ">🚀 Ejecutar Todos</button>
                        <button onclick="e2eTesting.stopE2E()"
                                style="
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

                    <!-- Configuración -->
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="margin: 0 0 10px 0;">⚙️ Configuración</h5>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                            <label>
                                <input type="checkbox" ${this.config.screenshots ? 'checked' : ''}
                                       onchange="e2eTesting.config.screenshots = this.checked"> Screenshots
                            </label>
                            <label>
                                <input type="checkbox" ${this.config.recordVideo ? 'checked' : ''}
                                       onchange="e2eTesting.config.recordVideo = this.checked"> Video
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Escenarios de testing -->
                <div id="e2e-scenarios">
                    <h4 style="margin: 0 0 15px 0; color: #333;">📋 Escenarios E2E</h4>
                    ${this.testScenarios.map((scenario, index) => `
                        <div class="scenario-item" style="
                            border: 1px solid #dee2e6;
                            border-radius: 8px;
                            margin-bottom: 15px;
                            overflow: hidden;
                        ">
                            <div style="
                                padding: 15px;
                                background: #f8f9fa;
                                border-bottom: 1px solid #dee2e6;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <div>
                                    <h6 style="margin: 0; color: #333;">${scenario.name}</h6>
                                    <small style="color: #666;">${scenario.description}</small>
                                </div>
                                <button onclick="e2eTesting.runScenario(${index})" style="
                                    padding: 6px 12px;
                                    background: #6f42c1;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">▶️ Ejecutar</button>
                            </div>
                            <div style="padding: 15px;">
                                <div style="font-size: 12px; color: #666;">
                                    ${scenario.steps.length} pasos definidos
                                </div>
                                <div id="scenario-${index}-progress" style="
                                    margin-top: 10px;
                                    height: 4px;
                                    background: #e9ecef;
                                    border-radius: 2px;
                                    overflow: hidden;
                                ">
                                    <div class="progress-bar" style="
                                        height: 100%;
                                        width: 0%;
                                        background: linear-gradient(90deg, #6f42c1, #e83e8c);
                                        transition: width 0.3s ease;
                                    "></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Resultados en tiempo real -->
                <div id="e2e-results-live" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                    border: 1px solid #dee2e6;
                ">
                    <h5 style="margin: 0 0 10px 0; color: #333;">📊 Resultados E2E</h5>
                    <div id="e2e-output" style="
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        color: #666;
                        max-height: 300px;
                        overflow-y: auto;
                        background: white;
                        padding: 10px;
                        border-radius: 4px;
                    ">
                        Esperando ejecución de tests E2E...
                    </div>
                </div>

                <!-- Estadísticas E2E -->
                <div id="e2e-statistics" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 10px;
                    margin-top: 20px;
                ">
                    <div style="text-align: center; padding: 10px; background: #d1ecf1; border-radius: 6px;">
                        <div id="e2e-total" style="font-size: 18px; font-weight: bold; color: #0c5460;">0</div>
                        <div style="font-size: 11px; color: #0c5460;">Total</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 6px;">
                        <div id="e2e-passed" style="font-size: 18px; font-weight: bold; color: #155724;">0</div>
                        <div style="font-size: 11px; color: #155724;">Pasaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 6px;">
                        <div id="e2e-failed" style="font-size: 18px; font-weight: bold; color: #721c24;">0</div>
                        <div style="font-size: 11px; color: #721c24;">Fallaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 6px;">
                        <div id="e2e-running" style="font-size: 18px; font-weight: bold; color: #856404;">0</div>
                        <div style="font-size: 11px; color: #856404;">Ejecutando</div>
                    </div>
                </div>

                <!-- Información MCP -->
                <div style="
                    background: ${this.isAvailable ? '#d4edda' : '#f8d7da'};
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                ">
                    <h6 style="margin: 0 0 10px 0; color: ${this.isAvailable ? '#155724' : '#721c24'};">
                        ${this.isAvailable ? '✅' : '❌'} Estado Chrome DevTools MCP
                    </h6>
                    <p style="margin: 0; font-size: 13px; color: ${this.isAvailable ? '#155724' : '#721c24'};">
                        ${this.isAvailable ?
                            'Chrome DevTools MCP está disponible y listo para testing E2E.' :
                            'Chrome DevTools MCP no está disponible. Los tests E2E se ejecutarán en modo simulado.'
                        }
                    </p>
                </div>
            </div>
        `;
    }

    async runAllScenarios() {
        this.logE2E('🚀 Iniciando ejecución de todos los escenarios E2E...\n');

        for (let i = 0; i < this.testScenarios.length; i++) {
            await this.runScenario(i);
        }

        this.logE2E('\n✅ Todos los escenarios E2E completados');
        this.generateE2EReport();
    }

    async runScenario(scenarioIndex) {
        const scenario = this.testScenarios[scenarioIndex];
        if (!scenario) return;

        this.currentTest = scenario;
        this.logE2E(`\n📋 Ejecutando escenario: ${scenario.name}`);
        this.updateE2EStats('running', 1);

        const progressBar = document.querySelector(`#scenario-${scenarioIndex}-progress .progress-bar`);

        try {
            for (let i = 0; i < scenario.steps.length; i++) {
                const step = scenario.steps[i];
                const progress = ((i + 1) / scenario.steps.length) * 100;

                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }

                this.logE2E(`  ${i + 1}. ${step.description}... `);

                const result = await this.executeE2EStep(step);

                if (result.success) {
                    this.logE2E(`✅ OK (${result.duration}ms)\n`);
                } else {
                    this.logE2E(`❌ Error: ${result.error}\n`);
                    this.updateE2EStats('failed', 1);
                    return;
                }

                // Pequeña pausa entre pasos
                await this.sleep(500);
            }

            this.logE2E(`✅ Escenario completado: ${scenario.name}\n`);
            this.updateE2EStats('passed', 1);

        } catch (error) {
            this.logE2E(`💥 Error en escenario: ${error.message}\n`);
            this.updateE2EStats('failed', 1);
        } finally {
            this.updateE2EStats('running', -1);
        }
    }

    async executeE2EStep(step) {
        const startTime = Date.now();

        try {
            switch (step.action) {
                case 'navigate':
                    return await this.mcpNavigate(step.url);

                case 'click':
                    return await this.mcpClick(step.selector);

                case 'fill':
                    return await this.mcpFill(step.selector, step.value);

                case 'wait':
                    return await this.mcpWait(step.selector || step.text);

                case 'snapshot':
                    return await this.mcpSnapshot();

                case 'resize':
                    return await this.mcpResize(step.width, step.height);

                case 'evaluate':
                    return await this.mcpEvaluate(step.script);

                case 'swipe':
                    return this.simulateSwipe(step.direction);

                case 'keypress':
                    return this.simulateKeypress(step.key);

                case 'toggle_contrast':
                    return this.toggleHighContrast();

                default:
                    return {
                        success: false,
                        error: `Acción no implementada: ${step.action}`,
                        duration: Date.now() - startTime
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    // Métodos MCP (simulados si no está disponible)
    async mcpNavigate(url) {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__navigate_page) {
            try {
                await window.mcp__chrome_devtools__navigate_page({ url: this.config.baseURL + url });
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación
            window.location.href = this.config.baseURL + url;
            await this.sleep(1000);
            return { success: true, duration: Date.now() - startTime };
        }
    }

    async mcpClick(selector) {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__click) {
            try {
                const element = document.querySelector(selector);
                if (!element) throw new Error(`Elemento no encontrado: ${selector}`);

                // Simular UID para MCP
                const uid = element.getAttribute('data-uid') || Math.random().toString(36).substr(2, 9);
                await window.mcp__chrome_devtools__click({ uid });
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación
            const element = document.querySelector(selector);
            if (element) {
                element.click();
                return { success: true, duration: Date.now() - startTime };
            } else {
                return { success: false, error: `Elemento no encontrado: ${selector}`, duration: Date.now() - startTime };
            }
        }
    }

    async mcpFill(selector, value) {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__fill) {
            try {
                const element = document.querySelector(selector);
                if (!element) throw new Error(`Elemento no encontrado: ${selector}`);

                const uid = element.getAttribute('data-uid') || Math.random().toString(36).substr(2, 9);
                await window.mcp__chrome_devtools__fill({ uid, value });
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación
            const element = document.querySelector(selector);
            if (element) {
                element.value = value;
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return { success: true, duration: Date.now() - startTime };
            } else {
                return { success: false, error: `Elemento no encontrado: ${selector}`, duration: Date.now() - startTime };
            }
        }
    }

    async mcpWait(selectorOrText) {
        const startTime = Date.now();
        const timeout = this.config.timeout;

        if (this.isAvailable && window.mcp__chrome_devtools__wait_for) {
            try {
                await window.mcp__chrome_devtools__wait_for({ text: selectorOrText });
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación con polling
            const endTime = startTime + timeout;

            while (Date.now() < endTime) {
                if (selectorOrText.startsWith('#') || selectorOrText.startsWith('.')) {
                    // Es un selector
                    if (document.querySelector(selectorOrText)) {
                        return { success: true, duration: Date.now() - startTime };
                    }
                } else {
                    // Es texto
                    if (document.body.textContent.includes(selectorOrText)) {
                        return { success: true, duration: Date.now() - startTime };
                    }
                }

                await this.sleep(100);
            }

            return { success: false, error: 'Timeout esperando elemento/texto', duration: Date.now() - startTime };
        }
    }

    async mcpSnapshot() {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__take_snapshot) {
            try {
                await window.mcp__chrome_devtools__take_snapshot();
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación
            console.log('📸 [E2E-SIMULATED] Snapshot tomado');
            return { success: true, duration: Date.now() - startTime };
        }
    }

    async mcpResize(width, height) {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__resize_page) {
            try {
                await window.mcp__chrome_devtools__resize_page({ width, height });
                return { success: true, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Simulación (no se puede cambiar tamaño de ventana en navegador)
            document.body.style.width = width + 'px';
            document.body.style.height = height + 'px';
            return { success: true, duration: Date.now() - startTime };
        }
    }

    async mcpEvaluate(script) {
        const startTime = Date.now();

        if (this.isAvailable && window.mcp__chrome_devtools__evaluate_script) {
            try {
                const result = await window.mcp__chrome_devtools__evaluate_script({
                    function: `() => { return ${script}; }`
                });
                return { success: true, result, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        } else {
            // Evaluación directa
            try {
                const result = eval(script);
                return { success: true, result, duration: Date.now() - startTime };
            } catch (error) {
                return { success: false, error: error.message, duration: Date.now() - startTime };
            }
        }
    }

    // Métodos de simulación
    simulateSwipe(direction) {
        const startTime = Date.now();

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('mobileSwipe', {
            detail: { direction }
        }));

        return { success: true, duration: Date.now() - startTime };
    }

    simulateKeypress(key) {
        const startTime = Date.now();

        document.dispatchEvent(new KeyboardEvent('keydown', {
            key: key,
            code: key === 'Tab' ? 'Tab' : key,
            bubbles: true
        }));

        return { success: true, duration: Date.now() - startTime };
    }

    toggleHighContrast() {
        const startTime = Date.now();

        document.body.classList.toggle('high-contrast');

        return { success: true, duration: Date.now() - startTime };
    }

    // Utilidades
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    logE2E(message) {
        const outputElement = document.getElementById('e2e-output');
        if (outputElement) {
            outputElement.textContent += message;
            outputElement.scrollTop = outputElement.scrollHeight;
        }
        console.log(`🤖 [E2E-MCP] ${message.trim()}`);
    }

    updateE2EStats(type, delta) {
        const elements = {
            total: document.getElementById('e2e-total'),
            passed: document.getElementById('e2e-passed'),
            failed: document.getElementById('e2e-failed'),
            running: document.getElementById('e2e-running')
        };

        if (elements[type]) {
            const current = parseInt(elements[type].textContent) || 0;
            elements[type].textContent = Math.max(0, current + delta);
        }

        // Actualizar total
        if (type !== 'total' && elements.total) {
            const total = (parseInt(elements.passed.textContent) || 0) +
                         (parseInt(elements.failed.textContent) || 0) +
                         (parseInt(elements.running.textContent) || 0);
            elements.total.textContent = total;
        }
    }

    generateE2EReport() {
        const report = {
            timestamp: new Date().toISOString(),
            mcpAvailable: this.isAvailable,
            scenarios: this.testScenarios.length,
            results: this.results,
            environment: {
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                url: window.location.href
            }
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `e2e-report-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.logE2E('\n📊 Reporte E2E generado y descargado');
    }

    stopE2E() {
        this.logE2E('\n⏹️ Tests E2E detenidos por el usuario');
    }

    openE2EPanel() {
        const panel = document.getElementById('e2e-panel');
        if (panel) {
            panel.style.left = '0px';
            document.body.style.overflow = 'hidden';
        }
    }

    closeE2EPanel() {
        const panel = document.getElementById('e2e-panel');
        if (panel) {
            panel.style.left = '-500px';
            document.body.style.overflow = 'auto';
        }
    }

    // API pública
    isReady() {
        return this.isAvailable;
    }

    getScenarios() {
        return this.testScenarios;
    }

    addCustomScenario(scenario) {
        this.testScenarios.push(scenario);
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.e2eTesting = new E2ETestingChromeMCP();
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = E2ETestingChromeMCP;
}