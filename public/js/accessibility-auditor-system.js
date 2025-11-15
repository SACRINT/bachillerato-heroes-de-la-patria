/**
 * ♿ SISTEMA DE AUDITORÍA DE ACCESIBILIDAD AUTOMÁTICA
 * Bachillerato General Estatal "Héroes de la Patria"
 * Auditor automático de cumplimiento WCAG 2.1 y mejores prácticas de accesibilidad
 */

class AccessibilityAuditorSystem {
    constructor() {
        this.auditResults = [];
        this.isRunning = false;
        this.currentAudit = null;
        this.wcagLevels = ['A', 'AA', 'AAA'];
        this.selectedLevel = 'AA';

        // Configuración de auditoría
        this.auditConfig = {
            level: 'AA', // WCAG Level
            includeWarnings: true,
            autoFix: false,
            generateReport: true,
            realTimeMonitoring: true
        };

        // Reglas de auditoría WCAG
        this.auditRules = {
            // Nivel A
            images: {
                level: 'A',
                name: 'Imágenes con texto alternativo',
                description: 'Todas las imágenes deben tener atributo alt descriptivo',
                check: this.checkImageAlt.bind(this),
                fix: this.fixImageAlt.bind(this)
            },
            headings: {
                level: 'A',
                name: 'Estructura de encabezados',
                description: 'Los encabezados deben seguir una secuencia lógica (h1, h2, h3...)',
                check: this.checkHeadingStructure.bind(this),
                fix: null
            },
            links: {
                level: 'A',
                name: 'Enlaces descriptivos',
                description: 'Los enlaces deben tener texto descriptivo o aria-label',
                check: this.checkLinkText.bind(this),
                fix: this.fixLinkText.bind(this)
            },
            forms: {
                level: 'A',
                name: 'Etiquetas de formulario',
                description: 'Todos los campos de formulario deben tener etiquetas asociadas',
                check: this.checkFormLabels.bind(this),
                fix: this.fixFormLabels.bind(this)
            },

            // Nivel AA
            colorContrast: {
                level: 'AA',
                name: 'Contraste de colores',
                description: 'Relación de contraste mínima 4.5:1 para texto normal, 3:1 para texto grande',
                check: this.checkColorContrast.bind(this),
                fix: this.fixColorContrast.bind(this)
            },
            focusManagement: {
                level: 'AA',
                name: 'Gestión de foco',
                description: 'Todos los elementos interactivos deben ser accesibles por teclado',
                check: this.checkFocusManagement.bind(this),
                fix: this.fixFocusManagement.bind(this)
            },
            skipLinks: {
                level: 'AA',
                name: 'Enlaces de salto',
                description: 'Debe existir un enlace para saltar al contenido principal',
                check: this.checkSkipLinks.bind(this),
                fix: this.fixSkipLinks.bind(this)
            },
            languageAttribute: {
                level: 'AA',
                name: 'Atributo de idioma',
                description: 'El documento debe especificar el idioma principal',
                check: this.checkLanguageAttribute.bind(this),
                fix: this.fixLanguageAttribute.bind(this)
            },

            // Nivel AAA
            contextualHelp: {
                level: 'AAA',
                name: 'Ayuda contextual',
                description: 'Elementos complejos deben incluir ayuda contextual',
                check: this.checkContextualHelp.bind(this),
                fix: null
            },
            readingLevel: {
                level: 'AAA',
                name: 'Nivel de lectura',
                description: 'El contenido debe ser comprensible para un nivel de educación secundaria',
                check: this.checkReadingLevel.bind(this),
                fix: null
            }
        };

        this.init();
    }

    init() {
        this.createAuditorUI();
        this.setupEventListeners();
        this.loadAuditHistory();

        if (this.auditConfig.realTimeMonitoring) {
            this.startRealTimeMonitoring();
        }

        console.log('♿ [ACCESSIBILITY] Sistema de auditoría de accesibilidad inicializado');
    }

    createAuditorUI() {
        // Crear botón de accesibilidad flotante
        const a11yBtn = document.createElement('button');
        a11yBtn.id = 'accessibility-btn';
        a11yBtn.innerHTML = DOMPurify.sanitize('♿');
        a11yBtn.title = 'Auditoría de Accesibilidad';
        a11yBtn.style.cssText = `
            position: fixed;
            top: 70%;
            left: 20px;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #17a2b8 0%, #007bff 100%);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 9997;
            box-shadow: 0 4px 15px rgba(23, 162, 184, 0.4);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        a11yBtn.addEventListener('click', () => this.openAccessibilityPanel());
        document.body.appendChild(a11yBtn);

        // Crear panel de accesibilidad
        this.createAccessibilityPanel();
    }

    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.style.cssText = `
            position: fixed;
            top: 0;
            left: -550px;
            width: 550px;
            height: 100vh;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            box-shadow: 5px 0 20px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        panel.innerHTML = DOMPurify.sanitize(this.generateAccessibilityPanelHTML(), 'ugc');
        document.body.appendChild(panel);
    }

    generateAccessibilityPanelHTML() {
        return `
            <div style="padding: 20px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 24px; color: #333;">♿ Auditoría A11Y</h2>
                    <button data-action="closeAccessibilityPanel" data-context="accessibility-panel" style="
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
                    Auditoría automática de accesibilidad WCAG 2.1
                </p>
            </div>

            <div style="padding: 20px;">
                <!-- Controles de auditoría -->
                <div class="audit-controls" style="margin-bottom: 30px;">
                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                        <button data-action="runFullAudit" data-context="audit-controls"
                                style="
                                    flex: 1;
                                    padding: 12px;
                                    background: linear-gradient(135deg, #17a2b8, #007bff);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                        ">🔍 Auditar Todo</button>
                        <button data-action="runQuickAudit" data-context="audit-controls"
                                style="
                                    flex: 1;
                                    padding: 12px;
                                    background: #28a745;
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                        ">⚡ Auditoría Rápida</button>
                    </div>

                    <!-- Configuración WCAG -->
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h5 style="margin: 0 0 10px 0;">⚙️ Nivel WCAG</h5>
                        <div style="display: flex; gap: 10px;">
                            ${this.wcagLevels.map(level => `
                                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                                    <input type="radio" name="wcag-level" value="${level}"
                                           ${this.selectedLevel === level ? 'checked' : ''}
                                           onchange="accessibilityAuditor.setWCAGLevel('${level}')">
                                    <span style="font-weight: ${this.selectedLevel === level ? 'bold' : 'normal'};">
                                        ${level}
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                        <small style="color: #666; margin-top: 5px; display: block;">
                            A: Básico | AA: Estándar | AAA: Avanzado
                        </small>
                    </div>

                    <!-- Opciones adicionales -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${this.auditConfig.includeWarnings ? 'checked' : ''}
                                   onchange="accessibilityAuditor.auditConfig.includeWarnings = this.checked">
                            Incluir advertencias
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${this.auditConfig.autoFix ? 'checked' : ''}
                                   onchange="accessibilityAuditor.auditConfig.autoFix = this.checked">
                            Auto-reparar
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${this.auditConfig.realTimeMonitoring ? 'checked' : ''}
                                   onchange="accessibilityAuditor.toggleRealTimeMonitoring(this.checked)">
                            Monitoreo tiempo real
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" ${this.auditConfig.generateReport ? 'checked' : ''}
                                   onchange="accessibilityAuditor.auditConfig.generateReport = this.checked">
                            Generar reporte
                        </label>
                    </div>
                </div>

                <!-- Reglas de auditoría -->
                <div id="audit-rules" style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px 0; color: #333;">📋 Reglas de Auditoría</h4>
                    ${Object.entries(this.auditRules).map(([ruleKey, rule]) => `
                        <div class="audit-rule" data-rule="${ruleKey}" style="
                            border: 1px solid #dee2e6;
                            border-radius: 8px;
                            margin-bottom: 10px;
                            overflow: hidden;
                            ${['A', 'AA', 'AAA'].indexOf(rule.level) > ['A', 'AA', 'AAA'].indexOf(this.selectedLevel) ? 'opacity: 0.5;' : ''}
                        ">
                            <div style="
                                padding: 12px 15px;
                                background: #f8f9fa;
                                border-bottom: 1px solid #dee2e6;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <div>
                                    <span style="font-weight: bold; color: #333;">${rule.name}</span>
                                    <span style="
                                        background: ${rule.level === 'A' ? '#28a745' : rule.level === 'AA' ? '#ffc107' : '#dc3545'};
                                        color: ${rule.level === 'AA' ? '#000' : '#fff'};
                                        padding: 2px 6px;
                                        border-radius: 3px;
                                        font-size: 10px;
                                        margin-left: 8px;
                                    ">${rule.level}</span>
                                </div>
                                <button data-action="runSingleRule-${ruleKey}" data-context="audit-rules" style="
                                    padding: 4px 8px;
                                    background: #17a2b8;
                                    color: white;
                                    border: none;
                                    border-radius: 3px;
                                    font-size: 12px;
                                    cursor: pointer;
                                ">▶️ Probar</button>
                            </div>
                            <div style="padding: 10px 15px;">
                                <p style="margin: 0; font-size: 13px; color: #666;">${rule.description}</p>
                                <div id="rule-${ruleKey}-result" class="rule-result" style="
                                    margin-top: 8px;
                                    padding: 8px;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    display: none;
                                "></div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Resultados de auditoría -->
                <div id="audit-results" style="
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    border: 1px solid #dee2e6;
                ">
                    <h5 style="margin: 0 0 10px 0; color: #333;">📊 Resultados de Auditoría</h5>
                    <div id="audit-output" style="
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        color: #666;
                        max-height: 250px;
                        overflow-y: auto;
                        background: white;
                        padding: 10px;
                        border-radius: 4px;
                    ">
                        Listo para ejecutar auditoría de accesibilidad...
                    </div>
                </div>

                <!-- Estadísticas -->
                <div id="audit-statistics" style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 20px;
                ">
                    <div style="text-align: center; padding: 10px; background: #d4edda; border-radius: 6px;">
                        <div id="a11y-passed" style="font-size: 18px; font-weight: bold; color: #155724;">0</div>
                        <div style="font-size: 11px; color: #155724;">Pasaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8d7da; border-radius: 6px;">
                        <div id="a11y-failed" style="font-size: 18px; font-weight: bold; color: #721c24;">0</div>
                        <div style="font-size: 11px; color: #721c24;">Fallaron</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #fff3cd; border-radius: 6px;">
                        <div id="a11y-warnings" style="font-size: 18px; font-weight: bold; color: #856404;">0</div>
                        <div style="font-size: 11px; color: #856404;">Advertencias</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #d1ecf1; border-radius: 6px;">
                        <div id="a11y-score" style="font-size: 18px; font-weight: bold; color: #0c5460;">0%</div>
                        <div style="font-size: 11px; color: #0c5460;">Puntuación</div>
                    </div>
                </div>

                <!-- Acciones rápidas -->
                <div style="display: flex; gap: 10px;">
                    <button data-action="exportAuditReport" data-context="quick-actions" style="
                        flex: 1;
                        padding: 10px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">📄 Exportar</button>
                    <button data-action="clearAuditResults" data-context="quick-actions" style="
                        flex: 1;
                        padding: 10px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">🗑️ Limpiar</button>
                    <button data-action="fixAllIssues" data-context="quick-actions" style="
                        flex: 1;
                        padding: 10px;
                        background: #fd7e14;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">🔧 Auto-Fix</button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Teclas de acceso rápido
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key === 'a') {
                e.preventDefault();
                this.runQuickAudit();
            }
        });

        // Observer para cambios en el DOM
        this.setupDOMObserver();
    }

    setupDOMObserver() {
        this.domObserver = new MutationObserver((mutations) => {
            if (this.auditConfig.realTimeMonitoring) {
                let needsReaudit = false;

                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1 && (
                                node.tagName === 'IMG' ||
                                node.tagName === 'INPUT' ||
                                node.tagName === 'BUTTON' ||
                                node.tagName === 'A'
                            )) {
                                needsReaudit = true;
                            }
                        });
                    }
                });

                if (needsReaudit) {
                    setTimeout(() => this.runQuickAudit(), 1000);
                }
            }
        });

        this.domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['alt', 'aria-label', 'aria-labelledby', 'for', 'id']
        });
    }

    async runFullAudit() {
        this.isRunning = true;
        this.auditResults = [];
        this.logAudit('🔍 Iniciando auditoría completa de accesibilidad...\n');

        const applicableRules = this.getApplicableRules();

        for (const [ruleKey, rule] of Object.entries(applicableRules)) {
            await this.runSingleRule(ruleKey);
        }

        this.calculateScore();
        this.updateStatistics();

        if (this.auditConfig.generateReport) {
            this.exportAuditReport();
        }

        this.logAudit('\n✅ Auditoría completa finalizada');
        this.isRunning = false;
    }

    async runQuickAudit() {
        this.logAudit('⚡ Ejecutando auditoría rápida...\n');

        const quickRules = ['images', 'forms', 'links', 'colorContrast'];
        for (const ruleKey of quickRules) {
            if (this.auditRules[ruleKey]) {
                await this.runSingleRule(ruleKey);
            }
        }

        this.calculateScore();
        this.updateStatistics();
    }

    async runSingleRule(ruleKey) {
        const rule = this.auditRules[ruleKey];
        if (!rule) return;

        this.logAudit(`  📋 ${rule.name}... `);

        try {
            const result = await rule.check();

            this.auditResults.push({
                rule: ruleKey,
                name: rule.name,
                level: rule.level,
                status: result.status,
                message: result.message,
                elements: result.elements || [],
                suggestions: result.suggestions || [],
                timestamp: Date.now()
            });

            // Actualizar UI de regla específica
            this.updateRuleUI(ruleKey, result);

            // Auto-fix si está habilitado
            if (this.auditConfig.autoFix && result.status === 'fail' && rule.fix) {
                this.logAudit(`🔧 Auto-reparando... `);
                await rule.fix(result.elements);
                this.logAudit(`✅\n`);
            } else {
                this.logAudit(`${result.status === 'pass' ? '✅' : '❌'} ${result.message}\n`);
            }

        } catch (error) {
            this.logAudit(`💥 Error: ${error.message}\n`);
        }
    }

    // Implementación de reglas WCAG

    async checkImageAlt() {
        const images = document.querySelectorAll('img');
        const issues = [];

        images.forEach((img, index) => {
            if (!img.hasAttribute('alt')) {
                issues.push({
                    element: img,
                    issue: 'Falta atributo alt',
                    suggestion: 'Agregar atributo alt descriptivo'
                });
            } else if (img.alt.trim() === '') {
                issues.push({
                    element: img,
                    issue: 'Atributo alt vacío',
                    suggestion: 'Proporcionar descripción de la imagen o usar alt="" para imágenes decorativas'
                });
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'fail',
            message: `${images.length - issues.length}/${images.length} imágenes tienen alt apropiado`,
            elements: issues,
            suggestions: ['Usar texto alternativo descriptivo', 'Para imágenes decorativas usar alt=""']
        };
    }

    async checkHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const issues = [];
        let lastLevel = 0;

        headings.forEach((heading, index) => {
            const currentLevel = parseInt(heading.tagName.charAt(1));

            if (index === 0 && currentLevel !== 1) {
                issues.push({
                    element: heading,
                    issue: 'El primer encabezado debe ser h1',
                    suggestion: 'Cambiar el primer encabezado a h1'
                });
            }

            if (currentLevel > lastLevel + 1) {
                issues.push({
                    element: heading,
                    issue: `Salto de nivel: h${lastLevel} a h${currentLevel}`,
                    suggestion: 'No saltar niveles de encabezado'
                });
            }

            lastLevel = currentLevel;
        });

        return {
            status: issues.length === 0 ? 'pass' : 'fail',
            message: `Estructura de ${headings.length} encabezados: ${issues.length} problemas`,
            elements: issues,
            suggestions: ['Mantener jerarquía lógica de encabezados', 'Comenzar con h1']
        };
    }

    async checkLinkText() {
        const links = document.querySelectorAll('a[href]');
        const issues = [];

        links.forEach(link => {
            const text = link.textContent.trim();
            const ariaLabel = link.getAttribute('aria-label');
            const title = link.getAttribute('title');

            if (!text && !ariaLabel && !title) {
                issues.push({
                    element: link,
                    issue: 'Enlace sin texto descriptivo',
                    suggestion: 'Agregar texto, aria-label o title descriptivo'
                });
            } else if (text && ['click here', 'read more', 'más', 'aquí'].includes(text.toLowerCase())) {
                issues.push({
                    element: link,
                    issue: 'Texto de enlace poco descriptivo',
                    suggestion: 'Usar texto más específico que describa el destino'
                });
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'fail',
            message: `${links.length - issues.length}/${links.length} enlaces tienen texto descriptivo`,
            elements: issues,
            suggestions: ['Usar texto descriptivo', 'Evitar "clic aquí" o "leer más"']
        };
    }

    async checkFormLabels() {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        const issues = [];

        inputs.forEach(input => {
            const id = input.id;
            const label = id ? document.querySelector(`label[for="${id}"]`) : null;
            const ariaLabel = input.getAttribute('aria-label');
            const ariaLabelledby = input.getAttribute('aria-labelledby');

            if (!label && !ariaLabel && !ariaLabelledby) {
                issues.push({
                    element: input,
                    issue: 'Campo sin etiqueta asociada',
                    suggestion: 'Agregar label, aria-label o aria-labelledby'
                });
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'fail',
            message: `${inputs.length - issues.length}/${inputs.length} campos tienen etiquetas`,
            elements: issues,
            suggestions: ['Usar elementos label', 'Asociar con atributo for', 'Usar aria-label para casos especiales']
        };
    }

    async checkColorContrast() {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, button, a, span, div');
        const issues = [];
        let totalElements = 0;

        elements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const textColor = styles.color;
            const bgColor = styles.backgroundColor;

            // Solo verificar elementos con texto visible
            if (element.textContent.trim() && textColor !== bgColor) {
                totalElements++;

                // Verificación básica de contraste (simplificada)
                const contrast = this.calculateContrastRatio(textColor, bgColor);
                const fontSize = parseFloat(styles.fontSize);
                const fontWeight = styles.fontWeight;

                const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
                const requiredRatio = isLargeText ? 3 : 4.5;

                if (contrast < requiredRatio) {
                    issues.push({
                        element: element,
                        issue: `Contraste insuficiente: ${contrast.toFixed(2)}:1 (req: ${requiredRatio}:1)`,
                        suggestion: 'Aumentar contraste entre texto y fondo'
                    });
                }
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'warning',
            message: `${totalElements - issues.length}/${totalElements} elementos tienen contraste adecuado`,
            elements: issues,
            suggestions: ['Usar herramientas de verificación de contraste', 'Probar con diferentes fondos']
        };
    }

    async checkFocusManagement() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        const issues = [];

        interactiveElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');

            if (tabIndex && parseInt(tabIndex) > 0) {
                issues.push({
                    element: element,
                    issue: 'Tabindex positivo puede romper orden de navegación',
                    suggestion: 'Usar tabindex="0" o reordenar elementos en HTML'
                });
            }

            // Verificar si es visible pero no enfocable
            if (element.offsetParent !== null && tabIndex === '-1' && !element.disabled) {
                issues.push({
                    element: element,
                    issue: 'Elemento visible pero no enfocable',
                    suggestion: 'Remover tabindex="-1" o hacer elemento no interactivo'
                });
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'warning',
            message: `${interactiveElements.length - issues.length}/${interactiveElements.length} elementos enfocables correctamente`,
            elements: issues,
            suggestions: ['Evitar tabindex positivos', 'Usar orden lógico en HTML']
        };
    }

    async checkSkipLinks() {
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        const hasSkipToMain = Array.from(skipLinks).some(link =>
            link.textContent.toLowerCase().includes('contenido') ||
            link.textContent.toLowerCase().includes('main') ||
            link.getAttribute('href') === '#main'
        );

        return {
            status: hasSkipToMain ? 'pass' : 'fail',
            message: hasSkipToMain ? 'Enlace de salto al contenido principal encontrado' : 'No se encontró enlace de salto al contenido',
            elements: hasSkipToMain ? [] : [{
                element: document.body,
                issue: 'Falta enlace de salto al contenido principal',
                suggestion: 'Agregar enlace "Saltar al contenido principal" al inicio de la página'
            }],
            suggestions: ['Agregar skip link al inicio', 'Enlazar a #main o elemento principal']
        };
    }

    async checkLanguageAttribute() {
        const html = document.documentElement;
        const lang = html.getAttribute('lang');

        return {
            status: lang ? 'pass' : 'fail',
            message: lang ? `Idioma especificado: ${lang}` : 'Atributo lang no especificado',
            elements: lang ? [] : [{
                element: html,
                issue: 'Falta atributo lang en elemento html',
                suggestion: 'Agregar lang="es" al elemento html'
            }],
            suggestions: ['Agregar lang="es" al elemento html', 'Especificar idioma para contenido en otros idiomas']
        };
    }

    async checkContextualHelp() {
        const complexElements = document.querySelectorAll('form, [role="application"], canvas');
        const issues = [];

        complexElements.forEach(element => {
            const hasHelp = element.querySelector('[role="tooltip"], .help-text, .hint') ||
                           element.getAttribute('aria-describedby') ||
                           element.getAttribute('title');

            if (!hasHelp) {
                issues.push({
                    element: element,
                    issue: 'Elemento complejo sin ayuda contextual',
                    suggestion: 'Agregar tooltip, texto de ayuda o aria-describedby'
                });
            }
        });

        return {
            status: issues.length === 0 ? 'pass' : 'warning',
            message: `${complexElements.length - issues.length}/${complexElements.length} elementos complejos tienen ayuda`,
            elements: issues,
            suggestions: ['Agregar tooltips para elementos complejos', 'Usar aria-describedby']
        };
    }

    async checkReadingLevel() {
        const textElements = document.querySelectorAll('p, div, span, li');
        let totalWords = 0;
        let longSentences = 0;
        let difficultWords = 0;

        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text) {
                const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
                const words = text.split(/\s+/).filter(w => w.length > 0);

                totalWords += words.length;

                sentences.forEach(sentence => {
                    const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
                    if (sentenceWords.length > 20) {
                        longSentences++;
                    }
                });

                words.forEach(word => {
                    if (word.length > 12) {
                        difficultWords++;
                    }
                });
            }
        });

        const longSentenceRate = totalWords > 0 ? (longSentences / totalWords) * 100 : 0;
        const difficultWordRate = totalWords > 0 ? (difficultWords / totalWords) * 100 : 0;

        return {
            status: longSentenceRate < 10 && difficultWordRate < 15 ? 'pass' : 'warning',
            message: `Nivel de lectura: ${longSentenceRate.toFixed(1)}% oraciones largas, ${difficultWordRate.toFixed(1)}% palabras difíciles`,
            elements: [],
            suggestions: ['Usar oraciones cortas', 'Simplificar vocabulario', 'Agregar glosario para términos técnicos']
        };
    }

    // Métodos de reparación automática

    async fixImageAlt(elements) {
        elements.forEach(item => {
            const img = item.element;
            if (!img.hasAttribute('alt')) {
                // Intentar generar alt text basado en src o contexto
                const src = img.src;
                const altText = this.generateAltText(src, img);
                img.setAttribute('alt', altText);
            }
        });
    }

    async fixLinkText(elements) {
        elements.forEach(item => {
            const link = item.element;
            const href = link.getAttribute('href');

            if (!link.textContent.trim() && !link.getAttribute('aria-label')) {
                // Generar texto descriptivo basado en href
                const descriptiveText = this.generateLinkText(href);
                link.setAttribute('aria-label', descriptiveText);
            }
        });
    }

    async fixFormLabels(elements) {
        elements.forEach(item => {
            const input = item.element;

            if (!input.id) {
                input.id = 'input-' + Math.random().toString(36).substr(2, 9);
            }

            // Buscar texto cercano que pueda servir como label
            const placeholder = input.getAttribute('placeholder');
            const nearbyText = this.findNearbyText(input);

            const labelText = placeholder || nearbyText || 'Campo de entrada';

            // Crear label si no existe
            let label = document.querySelector(`label[for="${input.id}"]`);
            if (!label) {
                label = document.createElement('label');
                label.setAttribute('for', input.id);
                label.textContent = labelText;
                input.parentNode.insertBefore(label, input);
            }
        });
    }

    async fixColorContrast(elements) {
        elements.forEach(item => {
            const element = item.element;
            // Aplicar clase de alto contraste
            element.classList.add('high-contrast-fix');
        });

        // Agregar estilos de alto contraste si no existen
        if (!document.getElementById('high-contrast-styles')) {
            const style = document.createElement('style');
            style.id = 'high-contrast-styles';
            style.textContent = `
                .high-contrast-fix {
                    color: #000000 !important;
                    background-color: #ffffff !important;
                    border: 1px solid #000000 !important;
                }
                .high-contrast-fix:hover {
                    color: #ffffff !important;
                    background-color: #000000 !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async fixFocusManagement(elements) {
        elements.forEach(item => {
            const element = item.element;
            const tabIndex = element.getAttribute('tabindex');

            if (tabIndex && parseInt(tabIndex) > 0) {
                element.setAttribute('tabindex', '0');
            }
        });
    }

    async fixSkipLinks(elements) {
        if (elements.length > 0) {
            // Crear enlace de salto al contenido principal
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.textContent = 'Saltar al contenido principal';
            skipLink.className = 'skip-link';
            skipLink.style.cssText = `
                position: absolute;
                top: -40px;
                left: 6px;
                background: #000;
                color: #fff;
                padding: 8px;
                text-decoration: none;
                z-index: 9999;
            `;

            // Mostrar en focus
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '6px';
            });
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });

            document.body.insertBefore(skipLink, document.body.firstChild);

            // Crear o marcar elemento main
            let main = document.querySelector('main, #main, #main-content');
            if (!main) {
                main = document.querySelector('.container, .content, article');
                if (main) {
                    main.id = 'main-content';
                }
            }
        }
    }

    async fixLanguageAttribute(elements) {
        if (elements.length > 0) {
            document.documentElement.setAttribute('lang', 'es');
        }
    }

    // Métodos auxiliares

    generateAltText(src, img) {
        // Generar texto alternativo básico basado en src
        const filename = src.split('/').pop().split('.')[0];
        const words = filename.split(/[-_]/).map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        return words || 'Imagen';
    }

    generateLinkText(href) {
        if (href.startsWith('mailto:')) {
            return `Enviar email a ${href.replace('mailto:', '')}`;
        } else if (href.startsWith('tel:')) {
            return `Llamar a ${href.replace('tel:', '')}`;
        } else if (href.includes('facebook')) {
            return 'Página de Facebook';
        } else if (href.includes('twitter')) {
            return 'Página de Twitter';
        } else {
            return 'Enlace externo';
        }
    }

    findNearbyText(element) {
        // Buscar texto en elementos cercanos que pueda servir como label
        const parent = element.parentElement;
        if (parent) {
            const textNodes = Array.from(parent.childNodes)
                .filter(node => node.nodeType === 3 && node.textContent.trim())
                .map(node => node.textContent.trim());

            return textNodes[0] || null;
        }
        return null;
    }

    calculateContrastRatio(color1, color2) {
        // Cálculo simplificado de ratio de contraste
        const rgb1 = this.getRGBValues(color1);
        const rgb2 = this.getRGBValues(color2);

        if (!rgb1 || !rgb2) return 7; // Asumir contraste alto si no se puede calcular

        const l1 = this.getRelativeLuminance(rgb1);
        const l2 = this.getRelativeLuminance(rgb2);

        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    getRGBValues(color) {
        // Convertir color CSS a valores RGB
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);

        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);

        const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
    }

    getRelativeLuminance(rgb) {
        // Calcular luminancia relativa
        const [r, g, b] = rgb.map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    // Métodos de interfaz

    getApplicableRules() {
        const levelIndex = this.wcagLevels.indexOf(this.selectedLevel);
        const applicableLevels = this.wcagLevels.slice(0, levelIndex + 1);

        return Object.fromEntries(
            Object.entries(this.auditRules).filter(([key, rule]) =>
                applicableLevels.includes(rule.level)
            )
        );
    }

    updateRuleUI(ruleKey, result) {
        const resultElement = document.getElementById(`rule-${ruleKey}-result`);
        if (resultElement) {
            resultElement.style.display = 'block';
            resultElement.className = `rule-result ${result.status}`;

            const bgColor = result.status === 'pass' ? '#d4edda' :
                           result.status === 'warning' ? '#fff3cd' : '#f8d7da';
            const textColor = result.status === 'pass' ? '#155724' :
                             result.status === 'warning' ? '#856404' : '#721c24';

            resultElement.style.backgroundColor = bgColor;
            resultElement.style.color = textColor;
            resultElement.textContent = result.message;
        }
    }

    calculateScore() {
        const total = this.auditResults.length;
        const passed = this.auditResults.filter(r => r.status === 'pass').length;
        const score = total > 0 ? Math.round((passed / total) * 100) : 0;

        const scoreElement = document.getElementById('a11y-score');
        if (scoreElement) {
            scoreElement.textContent = `${score}%`;
        }
    }

    updateStatistics() {
        const passed = this.auditResults.filter(r => r.status === 'pass').length;
        const failed = this.auditResults.filter(r => r.status === 'fail').length;
        const warnings = this.auditResults.filter(r => r.status === 'warning').length;

        const elements = {
            passed: document.getElementById('a11y-passed'),
            failed: document.getElementById('a11y-failed'),
            warnings: document.getElementById('a11y-warnings')
        };

        if (elements.passed) elements.passed.textContent = passed;
        if (elements.failed) elements.failed.textContent = failed;
        if (elements.warnings) elements.warnings.textContent = warnings;
    }

    logAudit(message) {
        const outputElement = document.getElementById('audit-output');
        if (outputElement) {
            outputElement.textContent += message;
            outputElement.scrollTop = outputElement.scrollHeight;
        }
        console.log(`♿ [A11Y-AUDIT] ${message.trim()}`);
    }

    clearAuditResults() {
        this.auditResults = [];
        const outputElement = document.getElementById('audit-output');
        if (outputElement) {
            outputElement.textContent = 'Resultados limpiados...\n';
        }
        this.updateStatistics();
        this.calculateScore();
    }

    exportAuditReport() {
        const report = {
            timestamp: new Date().toISOString(),
            wcagLevel: this.selectedLevel,
            url: window.location.href,
            summary: {
                total: this.auditResults.length,
                passed: this.auditResults.filter(r => r.status === 'pass').length,
                failed: this.auditResults.filter(r => r.status === 'fail').length,
                warnings: this.auditResults.filter(r => r.status === 'warning').length
            },
            results: this.auditResults,
            recommendations: this.generateRecommendations()
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-audit-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.logAudit('\n📄 Reporte de accesibilidad exportado');
    }

    generateRecommendations() {
        const failed = this.auditResults.filter(r => r.status === 'fail');
        const recommendations = [];

        if (failed.some(r => r.rule === 'images')) {
            recommendations.push('Prioridad Alta: Agregar texto alternativo a todas las imágenes');
        }
        if (failed.some(r => r.rule === 'forms')) {
            recommendations.push('Prioridad Alta: Asociar etiquetas a todos los campos de formulario');
        }
        if (failed.some(r => r.rule === 'colorContrast')) {
            recommendations.push('Prioridad Media: Mejorar contraste de colores');
        }
        if (failed.some(r => r.rule === 'headings')) {
            recommendations.push('Prioridad Media: Corregir estructura de encabezados');
        }

        return recommendations;
    }

    async fixAllIssues() {
        this.logAudit('🔧 Iniciando reparación automática de problemas...\n');

        const failedResults = this.auditResults.filter(r => r.status === 'fail');

        for (const result of failedResults) {
            const rule = this.auditRules[result.rule];
            if (rule && rule.fix) {
                this.logAudit(`  🔧 Reparando: ${rule.name}... `);
                try {
                    await rule.fix(result.elements);
                    this.logAudit(`✅\n`);
                } catch (error) {
                    this.logAudit(`❌ Error: ${error.message}\n`);
                }
            }
        }

        // Re-ejecutar auditoría después de las reparaciones
        setTimeout(() => {
            this.runQuickAudit();
        }, 1000);
    }

    setWCAGLevel(level) {
        this.selectedLevel = level;
        this.auditConfig.level = level;

        // Actualizar UI para mostrar/ocultar reglas según nivel
        Object.entries(this.auditRules).forEach(([ruleKey, rule]) => {
            const ruleElement = document.querySelector(`[data-rule="${ruleKey}"]`);
            if (ruleElement) {
                const levelIndex = this.wcagLevels.indexOf(rule.level);
                const selectedIndex = this.wcagLevels.indexOf(level);
                ruleElement.style.opacity = levelIndex <= selectedIndex ? '1' : '0.5';
            }
        });
    }

    toggleRealTimeMonitoring(enabled) {
        this.auditConfig.realTimeMonitoring = enabled;

        if (enabled) {
            this.startRealTimeMonitoring();
        } else {
            this.stopRealTimeMonitoring();
        }
    }

    startRealTimeMonitoring() {
        if (this.domObserver) {
            this.domObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['alt', 'aria-label', 'aria-labelledby', 'for', 'id']
            });
        }
    }

    stopRealTimeMonitoring() {
        if (this.domObserver) {
            this.domObserver.disconnect();
        }
    }

    openAccessibilityPanel() {
        const panel = document.getElementById('accessibility-panel');
        if (panel) {
            panel.style.left = '0px';
            document.body.style.overflow = 'hidden';
        }
    }

    closeAccessibilityPanel() {
        const panel = document.getElementById('accessibility-panel');
        if (panel) {
            panel.style.left = '-550px';
            document.body.style.overflow = 'auto';
        }
    }

    loadAuditHistory() {
        const history = localStorage.getItem('bge_accessibility_history');
        if (history) {
            try {
                const data = JSON.parse(history);
                console.log('♿ [A11Y] Historial cargado:', data.length, 'auditorías anteriores');
            } catch (error) {
                console.warn('Error cargando historial de accesibilidad:', error);
            }
        }
    }

    saveAuditHistory() {
        const history = JSON.parse(localStorage.getItem('bge_accessibility_history') || '[]');
        history.push({
            timestamp: Date.now(),
            level: this.selectedLevel,
            results: this.auditResults.length,
            score: this.calculateScore()
        });

        if (history.length > 20) {
            history.splice(0, history.length - 20);
        }

        localStorage.setItem('bge_accessibility_history', JSON.stringify(history));
    }

    // API pública
    getAuditResults() {
        return this.auditResults;
    }

    isAuditRunning() {
        return this.isRunning;
    }

    getWCAGLevel() {
        return this.selectedLevel;
    }
}

// Auto-inicialización
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityAuditor = new AccessibilityAuditorSystem();
});

// ============================================
// EVENT DELEGATION HANDLER (CSP Compliant)
// Pattern B: onclick con parámetros → data-action
// ============================================
document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.getAttribute('data-action');
    const context = actionElement.getAttribute('data-context') || 'accessibility-auditor';

    try {
        // Pattern B: Acciones del auditor de accesibilidad
        if (action === 'closeAccessibilityPanel') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.closeAccessibilityPanel === 'function') {
                window.accessibilityAuditor.closeAccessibilityPanel();
            }
            return;
        }

        if (action === 'runFullAudit') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.runFullAudit === 'function') {
                window.accessibilityAuditor.runFullAudit();
            }
            return;
        }

        if (action === 'runQuickAudit') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.runQuickAudit === 'function') {
                window.accessibilityAuditor.runQuickAudit();
            }
            return;
        }

        if (action.startsWith('runSingleRule-')) {
            const ruleKey = action.replace('runSingleRule-', '');
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.runSingleRule === 'function') {
                window.accessibilityAuditor.runSingleRule(ruleKey);
            }
            return;
        }

        if (action === 'exportAuditReport') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.exportAuditReport === 'function') {
                window.accessibilityAuditor.exportAuditReport();
            }
            return;
        }

        if (action === 'clearAuditResults') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.clearAuditResults === 'function') {
                window.accessibilityAuditor.clearAuditResults();
            }
            return;
        }

        if (action === 'fixAllIssues') {
            if (window.accessibilityAuditor && typeof window.accessibilityAuditor.fixAllIssues === 'function') {
                window.accessibilityAuditor.fixAllIssues();
            }
            return;
        }

        console.warn('[ACCESSIBILITY-AUDITOR] Unhandled data-action:', action);
    } catch (error) {
        console.error('[ACCESSIBILITY-AUDITOR] Error handling action:', action, error);
    }
});

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityAuditorSystem;
}