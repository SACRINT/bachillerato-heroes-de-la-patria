/**
 * 🔄 LOADER JS - Sistema de Carga Dinámica
 * Portal BGE Héroes de la Patria
 * Archivo faltante identificado - referenciado en chatbot.html línea 571
 */

class LoaderSystem {
    constructor() {
        this.loadingElements = new Map();
        this.initializeLoader();
    }

    initializeLoader() {
        console.log('🔄 [LOADER] Sistema de carga inicializado');
        this.createGlobalLoader();
    }

    createGlobalLoader() {
        // Crear elemento de loading global si no existe
        if (!document.getElementById('global-loader')) {
            const loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p>Cargando...</p>
                </div>
            `;
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            `;
            document.body.appendChild(loader);
        }
    }

    show(elementId = 'global-loader') {
        const loader = document.getElementById(elementId);
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hide(elementId = 'global-loader') {
        const loader = document.getElementById(elementId);
        if (loader) {
            loader.style.display = 'none';
        }
    }

    showForElement(elementSelector, message = 'Cargando...') {
        const element = document.querySelector(elementSelector);
        if (element) {
            const loaderId = 'loader-' + Date.now();
            const loader = document.createElement('div');
            loader.id = loaderId;
            loader.innerHTML = `<div class="inline-loader">${message}</div>`;
            loader.style.cssText = 'text-align: center; padding: 20px;';

            element.appendChild(loader);
            this.loadingElements.set(elementSelector, loaderId);
            return loaderId;
        }
    }

    hideForElement(elementSelector) {
        const loaderId = this.loadingElements.get(elementSelector);
        if (loaderId) {
            const loader = document.getElementById(loaderId);
            if (loader) {
                loader.remove();
            }
            this.loadingElements.delete(elementSelector);
        }
    }

    loadScript(src, callback) {
        this.show();
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            this.hide();
            if (callback) callback();
        };
        script.onerror = () => {
            this.hide();
            console.error('❌ [LOADER] Error cargando script:', src);
        };
        document.head.appendChild(script);
    }

    loadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }
}

// Inicializar sistema de loader
const loaderSystem = new LoaderSystem();

// Hacer disponible globalmente
window.loaderSystem = loaderSystem;

// Para compatibilidad
window.showLoader = () => loaderSystem.show();
window.hideLoader = () => loaderSystem.hide();

console.log('✅ [LOADER] loader.js cargado exitosamente');