/**
 * ICON FALLBACK SYSTEM
 * Sistema de respaldo para iconos cuando Font Awesome falla
 */

class IconFallback {
    constructor() {
        this.fontAwesomeLoaded = false;
        this.fallbackIcons = {
            // Mapeo de iconos Font Awesome a SVG de respaldo
            'fas fa-star': this.createStarSVG(),
            'fas fa-home': this.createHomeSVG(),
            'fas fa-cog': this.createGearSVG(),
            'fas fa-cogs': this.createGearSVG(),
            'fas fa-chart-bar': this.createChartSVG(),
            'fas fa-chart-line': this.createChartSVG(),
            'fas fa-dollar-sign': this.createDollarSVG(),
            'fas fa-graduation-cap': this.createGradCapSVG(),
            'fas fa-users': this.createUsersSVG(),
            'fas fa-credit-card': this.createCardSVG()
        };
        
        this.checkFontAwesome();
    }

    // Verificar si Font Awesome se cargó correctamente
    async checkFontAwesome() {
        try {
            // Esperar un poco para que Font Awesome se cargue
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar si las fuentes de Font Awesome están disponibles
            const testElement = document.createElement('i');
            testElement.className = 'fas fa-star';
            testElement.style.position = 'absolute';
            testElement.style.left = '-9999px';
            document.body.appendChild(testElement);
            
            const computedStyle = window.getComputedStyle(testElement, '::before');
            const content = computedStyle.getPropertyValue('content');
            
            // Si Font Awesome está cargado, debería tener contenido
            this.fontAwesomeLoaded = content && content !== 'none' && content !== '';
            
            document.body.removeChild(testElement);
            
            if (!this.fontAwesomeLoaded) {
                console.warn('⚠️ Font Awesome no detectado, activando sistema de respaldo');
                this.activateFallbacks();
            } else {
                console.log('✅ Font Awesome cargado correctamente');
            }
            
        } catch (error) {
            console.error('❌ Error al verificar Font Awesome:', error);
            this.activateFallbacks();
        }
    }

    // Activar sistema de respaldo
    activateFallbacks() {
        const iconElements = document.querySelectorAll('i[class*="fa"]');
        
        iconElements.forEach(element => {
            const classes = element.className;
            const fallbackSVG = this.getFallbackSVG(classes);
            
            if (fallbackSVG) {
                // Reemplazar el icono con SVG de respaldo
                const wrapper = document.createElement('span');
                wrapper.innerHTML = fallbackSVG;
                wrapper.className = element.className.replace(/fa[sr]?\s+fa-[\w-]+/g, '');
                
                element.parentNode.replaceChild(wrapper.firstChild, element);
            }
        });
    }

    // Obtener SVG de respaldo según la clase
    getFallbackSVG(className) {
        for (const [faClass, svg] of Object.entries(this.fallbackIcons)) {
            if (className.includes(faClass.split(' ')[1])) {
                return svg;
            }
        }
        return null;
    }

    // SVGs de respaldo
    createStarSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    createHomeSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>';
    }

    createGearSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zM19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65c-.03-.24-.24-.42-.49-.42h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z"/></svg>';
    }

    createChartSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M5,9.2h3v9.9h-3V9.2z M10.6,5h3v14.1h-3V5z M16.2,13.7h3v5.4h-3V13.7z"/></svg>';
    }

    createDollarSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>';
    }

    createGradCapSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>';
    }

    createUsersSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.98 2.98 0 0 0 17.14 7c-.82 0-1.54.5-1.85 1.26l-1.92 5.77A2.98 2.98 0 0 0 16.14 17H18v5h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-3A2.5 2.5 0 0 0 8.5 15v6H11v-5.5h2V21h2.5v-6A2.5 2.5 0 0 0 14 12.5zM6 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM2 20v-6h2.5l2.54-7.63A2.98 2.98 0 0 1 9.86 5c.82 0 1.54.5 1.85 1.26l1.92 5.77A2.98 2.98 0 0 1 10.86 15H9v5H2z"/></svg>';
    }

    createCardSVG() {
        return '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>';
    }
}

// Inicializar el sistema automáticamente
document.addEventListener('DOMContentLoaded', () => {
    new IconFallback();
});

// También exportar para uso manual
window.IconFallback = IconFallback;