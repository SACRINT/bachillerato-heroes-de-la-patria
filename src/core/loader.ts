/**
 * 🔄 LOADER JS - Sistema de Carga Dinámica (TypeScript)
 * Portal BGE Héroes de la Patria
 * Migrado a TypeScript: 13 Diciembre 2025
 */

// Declaraciones de tipos externos
declare const DOMPurify: {
    sanitize: (html: string) => string;
};

declare function sanitizeHTML(html: string): string;

export interface LoaderOptions {
    message?: string;
    backgroundColor?: string;
    spinnerColor?: string;
    zIndex?: number;
}

export class LoaderSystem {
    private loadingElements: Map<string, string>;
    private defaultOptions: LoaderOptions;

    constructor(options: LoaderOptions = {}) {
        this.loadingElements = new Map();
        this.defaultOptions = {
            message: 'Cargando...',
            backgroundColor: 'rgba(0,0,0,0.5)',
            spinnerColor: '#ffffff',
            zIndex: 9999,
            ...options
        };
        this.initializeLoader();
    }

    private initializeLoader(): void {
        
        this.createGlobalLoader();
    }

    private createGlobalLoader(): void {
        // Crear elemento de loading global si no existe
        if (!document.getElementById('global-loader')) {
            const loader = document.createElement('div');
            loader.id = 'global-loader';

            // Use sanitizeHTML if available, otherwise basic template
            const content = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <p>${this.defaultOptions.message}</p>
                </div>
            `;

            loader.innerHTML = typeof sanitizeHTML !== 'undefined'
                ? sanitizeHTML(content)
                : content;

            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: ${this.defaultOptions.backgroundColor};
                display: none;
                justify-content: center;
                align-items: center;
                z-index: ${this.defaultOptions.zIndex};
            `;

            // Add spinner styles
            const style = document.createElement('style');
            style.textContent = `
                #global-loader .loader-content {
                    text-align: center;
                    color: ${this.defaultOptions.spinnerColor};
                }
                #global-loader .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: ${this.defaultOptions.spinnerColor};
                    border-radius: 50%;
                    animation: loader-spin 1s linear infinite;
                    margin: 0 auto 10px;
                }
                @keyframes loader-spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(loader);
        }
    }

    /**
     * Show the loader
     */
    show(elementId: string = 'global-loader'): void {
        const loader = document.getElementById(elementId);
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    /**
     * Hide the loader
     */
    hide(elementId: string = 'global-loader'): void {
        const loader = document.getElementById(elementId);
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * Show inline loader for a specific element
     */
    showForElement(elementSelector: string, message: string = 'Cargando...'): string | undefined {
        const element = document.querySelector(elementSelector);
        if (element) {
            const loaderId = 'loader-' + Date.now();
            const loader = document.createElement('div');
            loader.id = loaderId;

            const content = `<div class="inline-loader">${message}</div>`;
            loader.innerHTML = typeof DOMPurify !== 'undefined'
                ? DOMPurify.sanitize(content)
                : content;

            loader.style.cssText = 'text-align: center; padding: 20px;';

            element.appendChild(loader);
            this.loadingElements.set(elementSelector, loaderId);
            return loaderId;
        }
        return undefined;
    }

    /**
     * Hide inline loader for a specific element
     */
    hideForElement(elementSelector: string): void {
        const loaderId = this.loadingElements.get(elementSelector);
        if (loaderId) {
            const loader = document.getElementById(loaderId);
            if (loader) {
                loader.remove();
            }
            this.loadingElements.delete(elementSelector);
        }
    }

    /**
     * Load a script dynamically with optional callback
     */
    loadScript(src: string, callback?: () => void): Promise<void> {
        return new Promise((resolve, reject) => {
            this.show();
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.hide();
                if (callback) callback();
                resolve();
            };
            script.onerror = () => {
                this.hide();
                console.error('❌ [LOADER] Error cargando script:', src);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Load a CSS file dynamically
     */
    loadCSS(href: string): HTMLLinkElement {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        return link;
    }

    /**
     * Load multiple scripts in sequence
     */
    async loadScripts(scripts: string[]): Promise<void> {
        for (const src of scripts) {
            await this.loadScript(src);
        }
    }

    /**
     * Show loader with custom message
     */
    showWithMessage(message: string): void {
        const loader = document.getElementById('global-loader');
        if (loader) {
            const textEl = loader.querySelector('p');
            if (textEl) {
                textEl.textContent = message;
            }
            this.show();
        }
    }

    /**
     * Check if loader is currently visible
     */
    isVisible(elementId: string = 'global-loader'): boolean {
        const loader = document.getElementById(elementId);
        return loader ? loader.style.display === 'flex' : false;
    }
}

// Singleton instance
export const loaderSystem = new LoaderSystem();

// Exponer globalmente para compatibilidad legacy
if (typeof window !== 'undefined') {
    (window as any).loaderSystem = loaderSystem;
    (window as any).showLoader = () => loaderSystem.show();
    (window as any).hideLoader = () => loaderSystem.hide();
}



export default loaderSystem;
