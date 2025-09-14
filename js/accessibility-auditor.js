/**
 * ♿ ACCESSIBILITY AUDITOR - Sistema de Auditoría de Accesibilidad
 * Bachillerato General Estatal "Héroes de la Patria"
 * Cumplimiento con WCAG 2.1 AA
 */

class AccessibilityAuditor {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.recommendations = [];
        this.score = 0;
        this.maxScore = 0;
        
        // Auto-inicialización en desarrollo
        if (window.location.hostname === 'localhost' || window.location.search.includes('a11y=true')) {
            this.init();
        }
    }

    init() {
        //console.log('♿ Iniciando Auditoría de Accesibilidad...');
        
        if (document.readyState === 'complete') {
            this.runAudit();
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.runAudit(), 1500);
            });
        }
    }

    runAudit() {
        //console.log('🔍 Ejecutando auditoría de accesibilidad...');
        
        // Reset scores
        this.issues = [];
        this.warnings = [];
        this.recommendations = [];
        this.score = 0;
        this.maxScore = 0;

        // Ejecutar todas las auditorías
        this.auditImages();
        this.auditButtons();
        this.auditForms();
        this.auditHeadings();
        this.auditColors();
        this.auditKeyboardNavigation();
        this.auditAriaLabels();
        this.auditLandmarks();
        this.auditSkipLinks();
        this.auditFocusManagement();

        this.calculateScore();
        this.displayResults();
        
        if (window.location.search.includes('a11y=true')) {
            this.createAccessibilityReport();
        }
    }

    // === AUDITORÍAS ESPECÍFICAS ===

    auditImages() {
        const images = document.querySelectorAll('img');
        let imageScore = 0;
        let maxImageScore = images.length * 2; // 2 puntos por imagen correcta

        images.forEach(img => {
            // Alt text obligatorio
            if (!img.alt && !img.hasAttribute('alt')) {
                this.issues.push({
                    type: 'error',
                    element: 'img',
                    message: `Imagen sin atributo alt: ${img.src || img.dataset.src || 'src no encontrado'}`,
                    wcag: 'WCAG 1.1.1'
                });
            } else if (img.alt === '') {
                // Alt vacío está bien para imágenes decorativas
                imageScore += 2;
            } else if (img.alt.length > 125) {
                this.warnings.push({
                    type: 'warning',
                    element: 'img',
                    message: `Alt text muy largo (${img.alt.length} caracteres): ${img.alt.substring(0, 50)}...`,
                    wcag: 'WCAG 1.1.1'
                });
                imageScore += 1;
            } else {
                imageScore += 2;
            }

            // Title redundante con alt
            if (img.title && img.alt && img.title === img.alt) {
                this.warnings.push({
                    type: 'warning',
                    element: 'img',
                    message: 'Title e alt idénticos (redundante)',
                    wcag: 'WCAG 1.1.1'
                });
            }
        });

        this.score += imageScore;
        this.maxScore += maxImageScore;
    }

    auditButtons() {
        const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
        let buttonScore = 0;
        let maxButtonScore = buttons.length * 3;

        buttons.forEach(button => {
            let elementScore = 0;

            // Texto accesible
            const accessibleText = this.getAccessibleText(button);
            if (!accessibleText) {
                this.issues.push({
                    type: 'error',
                    element: 'button',
                    message: 'Botón sin texto accesible',
                    wcag: 'WCAG 4.1.2'
                });
            } else {
                elementScore += 1;
            }

            // Focus visible
            if (button.style.outline === 'none' && !button.classList.contains('btn-outline')) {
                this.warnings.push({
                    type: 'warning',
                    element: 'button',
                    message: 'Botón podría tener problemas de focus visible',
                    wcag: 'WCAG 2.4.7'
                });
            } else {
                elementScore += 1;
            }

            // Tamaño mínimo (44x44px)
            const rect = button.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
                this.warnings.push({
                    type: 'warning',
                    element: 'button',
                    message: `Botón pequeño (${Math.round(rect.width)}x${Math.round(rect.height)}px) - mínimo recomendado 44x44px`,
                    wcag: 'WCAG 2.5.5'
                });
            } else {
                elementScore += 1;
            }

            buttonScore += elementScore;
        });

        this.score += buttonScore;
        this.maxScore += maxButtonScore;
    }

    auditForms() {
        const formElements = document.querySelectorAll('input, textarea, select');
        let formScore = 0;
        let maxFormScore = formElements.length * 2;

        formElements.forEach(element => {
            let elementScore = 0;

            // Label asociado
            const hasLabel = this.hasAssociatedLabel(element);
            if (!hasLabel) {
                this.issues.push({
                    type: 'error',
                    element: element.tagName.toLowerCase(),
                    message: `Campo de formulario sin label: ${element.name || element.id || 'sin identificador'}`,
                    wcag: 'WCAG 1.3.1'
                });
            } else {
                elementScore += 1;
            }

            // Required fields
            if (element.required && !element.hasAttribute('aria-required')) {
                this.recommendations.push({
                    type: 'recommendation',
                    element: element.tagName.toLowerCase(),
                    message: 'Campo requerido debería tener aria-required="true"',
                    wcag: 'WCAG 3.3.2'
                });
            } else {
                elementScore += 1;
            }

            formScore += elementScore;
        });

        this.score += formScore;
        this.maxScore += maxFormScore;
    }

    auditHeadings() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let headingScore = 0;
        let maxHeadingScore = 10; // Score fijo para estructura de headings

        // Verificar que existe h1
        const h1s = document.querySelectorAll('h1');
        if (h1s.length === 0) {
            this.issues.push({
                type: 'error',
                element: 'heading',
                message: 'No se encontró h1 en la página',
                wcag: 'WCAG 1.3.1'
            });
        } else if (h1s.length > 1) {
            this.warnings.push({
                type: 'warning',
                element: 'heading',
                message: `Múltiples h1 encontrados (${h1s.length})`,
                wcag: 'WCAG 1.3.1'
            });
            headingScore += 5;
        } else {
            headingScore += 10;
        }

        // Verificar orden jerárquico
        let previousLevel = 0;
        headings.forEach(heading => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            if (currentLevel > previousLevel + 1) {
                this.warnings.push({
                    type: 'warning',
                    element: 'heading',
                    message: `Salto en jerarquía de headings: de h${previousLevel} a h${currentLevel}`,
                    wcag: 'WCAG 1.3.1'
                });
            }
            previousLevel = currentLevel;
        });

        this.score += headingScore;
        this.maxScore += maxHeadingScore;
    }

    auditColors() {
        const elementsToCheck = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, .btn');
        let colorScore = 0;
        let maxColorScore = 20;

        // Simulación básica de contraste
        let contrastIssues = 0;
        elementsToCheck.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            // Check básico para textos muy claros sobre fondos claros
            if (color.includes('rgb(255') || color.includes('#fff') || color.includes('white')) {
                if (backgroundColor.includes('rgb(255') || backgroundColor.includes('#fff') || backgroundColor === 'rgba(0, 0, 0, 0)') {
                    contrastIssues++;
                }
            }
        });

        if (contrastIssues > 5) {
            this.warnings.push({
                type: 'warning',
                element: 'color',
                message: `Posibles problemas de contraste detectados en ${contrastIssues} elementos`,
                wcag: 'WCAG 1.4.3'
            });
            colorScore += 10;
        } else {
            colorScore += 20;
        }

        this.score += colorScore;
        this.maxScore += maxColorScore;
    }

    auditKeyboardNavigation() {
        const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]');
        let keyboardScore = 0;
        let maxKeyboardScore = 15;

        let negativeTabIndex = 0;
        let missingTabIndex = 0;

        interactiveElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');
            
            if (tabIndex === '-1' && element.tagName !== 'DIV') {
                negativeTabIndex++;
            }
            
            // Elementos personalizados sin tabindex
            if (element.hasAttribute('role') && !element.hasAttribute('tabindex')) {
                missingTabIndex++;
            }
        });

        if (negativeTabIndex > 0) {
            this.warnings.push({
                type: 'warning',
                element: 'keyboard',
                message: `${negativeTabIndex} elementos con tabindex="-1" podrían ser inaccesibles por teclado`,
                wcag: 'WCAG 2.1.1'
            });
            keyboardScore += 5;
        } else {
            keyboardScore += 15;
        }

        if (missingTabIndex > 0) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'keyboard',
                message: `${missingTabIndex} elementos con role personalizado deberían tener tabindex`,
                wcag: 'WCAG 2.1.1'
            });
        }

        this.score += keyboardScore;
        this.maxScore += maxKeyboardScore;
    }

    auditAriaLabels() {
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
        let ariaScore = 0;
        let maxAriaScore = 10;

        ariaElements.forEach(element => {
            const ariaLabel = element.getAttribute('aria-label');
            const ariaLabelledBy = element.getAttribute('aria-labelledby');
            
            if (ariaLabel && ariaLabel.length === 0) {
                this.warnings.push({
                    type: 'warning',
                    element: 'aria',
                    message: 'aria-label vacío',
                    wcag: 'WCAG 4.1.2'
                });
            }
            
            if (ariaLabelledBy) {
                const referencedElement = document.getElementById(ariaLabelledBy);
                if (!referencedElement) {
                    this.issues.push({
                        type: 'error',
                        element: 'aria',
                        message: `aria-labelledby referencia elemento inexistente: ${ariaLabelledBy}`,
                        wcag: 'WCAG 4.1.2'
                    });
                }
            }
        });

        ariaScore = Math.max(0, 10 - this.issues.filter(i => i.element === 'aria').length * 2);
        this.score += ariaScore;
        this.maxScore += maxAriaScore;
    }

    auditLandmarks() {
        const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[aria-label], [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]');
        let landmarkScore = 0;
        let maxLandmarkScore = 15;

        const hasMain = document.querySelector('main, [role="main"]');
        const hasNav = document.querySelector('nav, [role="navigation"]');
        const hasHeader = document.querySelector('header, [role="banner"]');

        if (!hasMain) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'landmark',
                message: 'Página debería tener un landmark main',
                wcag: 'WCAG 1.3.1'
            });
        } else {
            landmarkScore += 5;
        }

        if (!hasNav) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'landmark',
                message: 'Página debería tener un landmark nav',
                wcag: 'WCAG 1.3.1'
            });
        } else {
            landmarkScore += 5;
        }

        if (!hasHeader) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'landmark',
                message: 'Página debería tener un landmark header',
                wcag: 'WCAG 1.3.1'
            });
        } else {
            landmarkScore += 5;
        }

        this.score += landmarkScore;
        this.maxScore += maxLandmarkScore;
    }

    auditSkipLinks() {
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        let skipScore = 0;
        let maxSkipScore = 5;

        const hasSkipToMain = Array.from(skipLinks).some(link => 
            link.textContent.toLowerCase().includes('skip') || 
            link.textContent.toLowerCase().includes('saltar')
        );

        if (!hasSkipToMain) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'navigation',
                message: 'Consider adding skip links for keyboard navigation',
                wcag: 'WCAG 2.4.1'
            });
        } else {
            skipScore += 5;
        }

        this.score += skipScore;
        this.maxScore += maxSkipScore;
    }

    auditFocusManagement() {
        const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"], [data-toggle="modal"]');
        let focusScore = 0;
        let maxFocusScore = 5;

        if (modalTriggers.length > 0) {
            this.recommendations.push({
                type: 'recommendation',
                element: 'focus',
                message: 'Modales detectados - verificar que el focus se gestiona correctamente',
                wcag: 'WCAG 2.4.3'
            });
            focusScore += 3;
        } else {
            focusScore += 5;
        }

        this.score += focusScore;
        this.maxScore += maxFocusScore;
    }

    // === MÉTODOS AUXILIARES ===

    getAccessibleText(element) {
        return element.textContent || 
               element.getAttribute('aria-label') || 
               element.getAttribute('title') || 
               element.value ||
               '';
    }

    hasAssociatedLabel(element) {
        const id = element.getAttribute('id');
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return true;
        }

        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return true;

        const ariaLabelledBy = element.getAttribute('aria-labelledby');
        if (ariaLabelledBy) return true;

        // Implicit label (element inside label)
        const parentLabel = element.closest('label');
        if (parentLabel) return true;

        return false;
    }

    calculateScore() {
        if (this.maxScore === 0) {
            this.accessibilityScore = 100;
        } else {
            this.accessibilityScore = Math.round((this.score / this.maxScore) * 100);
        }
    }

    displayResults() {
        const errorCount = this.issues.length;
        const warningCount = this.warnings.length;
        const recommendationCount = this.recommendations.length;

        //console.log(`♿ AUDITORÍA DE ACCESIBILIDAD COMPLETADA`);
        //console.log(`📊 Puntuación: ${this.accessibilityScore}/100`);
        //console.log(`🚨 Errores: ${errorCount}`);
        //console.log(`⚠️ Advertencias: ${warningCount}`);
        //console.log(`💡 Recomendaciones: ${recommendationCount}`);

        if (errorCount > 0) {
            //console.log('\n🚨 ERRORES CRÍTICOS:');
            this.issues.forEach(issue => {
                //console.log(`- ${issue.message} (${issue.wcag})`);
            });
        }

        if (warningCount > 0) {
            //console.log('\n⚠️ ADVERTENCIAS:');
            this.warnings.forEach(warning => {
                //console.log(`- ${warning.message} (${warning.wcag})`);
            });
        }
    }

    createAccessibilityReport() {
        const report = document.createElement('div');
        report.id = 'a11y-report';
        report.innerHTML = `
            <div style="
                position: fixed; top: 10px; left: 10px; 
                background: white; border: 2px solid #333;
                padding: 15px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                font-family: Arial, sans-serif; font-size: 14px; z-index: 10000; 
                max-width: 450px; max-height: 400px; overflow-y: auto;
            ">
                <h3 style="margin:0 0 15px 0; color: #333;">♿ Accessibility Report</h3>
                <div style="margin-bottom: 15px; padding: 10px; background: ${this.accessibilityScore >= 90 ? '#d4edda' : this.accessibilityScore >= 70 ? '#fff3cd' : '#f8d7da'}; border-radius: 5px;">
                    <strong>Score: ${this.accessibilityScore}/100</strong>
                </div>
                
                <div><strong>🚨 Errors:</strong> ${this.issues.length}</div>
                <div><strong>⚠️ Warnings:</strong> ${this.warnings.length}</div>
                <div><strong>💡 Recommendations:</strong> ${this.recommendations.length}</div>
                
                <hr style="margin: 15px 0;">
                
                ${this.issues.slice(0, 5).map(issue => `
                    <div style="margin-bottom: 8px; padding: 8px; background: #f8d7da; border-radius: 3px;">
                        <strong>🚨 Error:</strong><br>
                        <small>${issue.message}</small><br>
                        <em style="color: #666;">${issue.wcag}</em>
                    </div>
                `).join('')}
                
                ${this.warnings.slice(0, 3).map(warning => `
                    <div style="margin-bottom: 8px; padding: 8px; background: #fff3cd; border-radius: 3px;">
                        <strong>⚠️ Warning:</strong><br>
                        <small>${warning.message}</small><br>
                        <em style="color: #666;">${warning.wcag}</em>
                    </div>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(report);

        // Auto-hide después de 15 segundos
        setTimeout(() => {
            if (report.parentNode) {
                report.parentNode.removeChild(report);
            }
        }, 15000);
    }

    // Método público para ejecutar auditoría manual
    runAccessibilityAudit() {
        this.runAudit();
    }

    getAccessibilityReport() {
        return {
            score: this.accessibilityScore,
            issues: this.issues,
            warnings: this.warnings,
            recommendations: this.recommendations,
            summary: {
                errors: this.issues.length,
                warnings: this.warnings.length,
                recommendations: this.recommendations.length
            }
        };
    }
}

// Inicialización automática
const accessibilityAuditor = new AccessibilityAuditor();

// Exponer globalmente para debug
window.accessibilityAuditor = accessibilityAuditor;
window.runA11yAudit = () => accessibilityAuditor.runAccessibilityAudit();

//console.log('♿ Accessibility Auditor inicializado. Usa runA11yAudit() para ejecutar manualmente.');