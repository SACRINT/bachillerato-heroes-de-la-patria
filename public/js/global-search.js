/**
 * GLOBAL SEARCH - Búsqueda Global con Cmd/Ctrl+K
 * Sistema de búsqueda rápida en todo el dashboard
 * Fecha: 18 de Octubre, 2025
 */

class GlobalSearch {
    constructor() {
        this.modal = null;
        this.searchInput = null;
        this.resultsContainer = null;
        this.isOpen = false;
        this.searchTimeout = null;
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.results = [];
    }

    /**
     * Inicializar el componente de búsqueda
     */
    init() {
        this.createSearchModal();
        this.bindKeyboardShortcut();
        console.log('🔍 Global Search inicializado (Cmd/Ctrl+K)');
    }

    /**
     * Crear el modal de búsqueda
     */
    createSearchModal() {
        const modalHTML = `
            <div id="globalSearchModal" class="modal fade" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header border-0 pb-0">
                            <div class="input-group input-group-lg">
                                <span class="input-group-text bg-transparent border-0">
                                    <i class="fas fa-search text-muted"></i>
                                </span>
                                <input
                                    type="text"
                                    id="globalSearchInput"
                                    class="form-control border-0 shadow-none"
                                    placeholder="Buscar en todo el sistema... (Esc para cerrar)"
                                    autocomplete="off"
                                />
                                <span class="input-group-text bg-transparent border-0">
                                    <kbd class="bg-light text-muted px-2 py-1 rounded">Esc</kbd>
                                </span>
                            </div>
                        </div>
                        <div class="modal-body pt-2">
                            <div id="globalSearchResults" class="search-results" style="max-height: 400px; overflow-y: auto;">
                                <div class="text-center text-muted py-5">
                                    <i class="fas fa-search fa-3x mb-3 opacity-25"></i>
                                    <p>Escribe para buscar en noticias, eventos, avisos, comunicados y egresados</p>
                                    <small class="text-muted">Mínimo 2 caracteres</small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0 pb-3">
                            <small class="text-muted me-auto">
                                <kbd class="bg-light px-2 py-1 rounded me-1">↑</kbd>
                                <kbd class="bg-light px-2 py-1 rounded me-1">↓</kbd>
                                Navegar
                                <kbd class="bg-light px-2 py-1 rounded ms-2">Enter</kbd>
                                Abrir
                            </small>
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalHTML));

        this.modal = new bootstrap.Modal(document.getElementById('globalSearchModal'));
        this.searchInput = document.getElementById('globalSearchInput');
        this.resultsContainer = document.getElementById('globalSearchResults');

        // Eventos del modal
        document.getElementById('globalSearchModal').addEventListener('shown.bs.modal', () => {
            this.searchInput.focus();
        });

        document.getElementById('globalSearchModal').addEventListener('hidden.bs.modal', () => {
            this.reset();
        });

        // Eventos del input
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }

    /**
     * Vincular atajo de teclado Cmd/Ctrl+K
     */
    bindKeyboardShortcut() {
        document.addEventListener('keydown', (e) => {
            // Cmd+K (Mac) o Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // Esc para cerrar
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Abrir/cerrar el modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Abrir el modal
     */
    open() {
        this.modal.show();
        this.isOpen = true;
    }

    /**
     * Cerrar el modal
     */
    close() {
        this.modal.hide();
        this.isOpen = false;
    }

    /**
     * Resetear el estado de búsqueda
     */
    reset() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.selectedIndex = -1;
        this.results = [];
        this.resultsContainer.innerHTML = sanitizeHTML(`
            <div class="text-center text-muted py-5">
                <i class="fas fa-search fa-3x mb-3 opacity-25"></i>
                <p>Escribe para buscar en noticias, eventos, avisos, comunicados y egresados</p>
                <small class="text-muted">Mínimo 2 caracteres</small>
            </div>
        `);
    }

    /**
     * Manejar búsqueda con debounce
     */
    handleSearch(query) {
        clearTimeout(this.searchTimeout);

        if (query.length < 2) {
            this.reset();
            return;
        }

        this.currentQuery = query;
        this.resultsContainer.innerHTML = sanitizeHTML(`
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Buscando...</span>
                </div>
                <p class="mt-3 text-muted">Buscando "${query}"...</p>
            </div>
        `);

        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300); // 300ms debounce
    }

    /**
     * Realizar búsqueda en el backend
     */
    async performSearch(query) {
        try {
            const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            this.displayResults(data.results);
        } catch (error) {
            console.error('Error en búsqueda:', error);
            this.resultsContainer.innerHTML = sanitizeHTML(`
                <div class="text-center text-danger py-5">
                    <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                    <p>Error al buscar. Intenta nuevamente.</p>
                </div>
            `);
        }
    }

    /**
     * Mostrar resultados de búsqueda
     */
    displayResults(results) {
        if (results.total === 0) {
            this.resultsContainer.innerHTML = sanitizeHTML(`
                <div class="text-center text-muted py-5">
                    <i class="fas fa-inbox fa-3x mb-3 opacity-25"></i>
                    <p>No se encontraron resultados para "${this.currentQuery}"</p>
                    <small class="text-muted">Intenta con otros términos de búsqueda</small>
                </div>
            `);
            return;
        }

        let html = '';
        this.results = [];

        // Resultados de Noticias
        if (results.noticias.length > 0) {
            html += this.renderResultSection('Noticias', results.noticias, 'newspaper', 'primary');
            this.results.push(...results.noticias);
        }

        // Resultados de Eventos
        if (results.eventos.length > 0) {
            html += this.renderResultSection('Eventos', results.eventos, 'calendar-alt', 'success');
            this.results.push(...results.eventos);
        }

        // Resultados de Avisos
        if (results.avisos.length > 0) {
            html += this.renderResultSection('Avisos', results.avisos, 'bullhorn', 'warning');
            this.results.push(...results.avisos);
        }

        // Resultados de Comunicados
        if (results.comunicados.length > 0) {
            html += this.renderResultSection('Comunicados', results.comunicados, 'file-alt', 'info');
            this.results.push(...results.comunicados);
        }

        // Resultados de Egresados
        if (results.egresados.length > 0) {
            html += this.renderResultSection('Egresados', results.egresados, 'user-graduate', 'secondary');
            this.results.push(...results.egresados);
        }

        html += `
            <div class="text-center text-muted py-3 border-top">
                <small>Total: ${results.total} resultados encontrados</small>
            </div>
        `;

        this.resultsContainer.innerHTML = html;

        // Agregar event listeners a los resultados
        this.bindResultClicks();
    }

    /**
     * Renderizar sección de resultados
     */
    renderResultSection(title, items, icon, color) {
        let html = `
            <div class="result-section mb-3">
                <h6 class="text-${color} mb-2">
                    <i class="fas fa-${icon} me-2"></i>${title}
                </h6>
                <div class="list-group list-group-flush">
        `;

        items.forEach((item, index) => {
            const globalIndex = this.results.length + index;
            html += `
                <a href="#" class="list-group-item list-group-item-action border-0 py-2 search-result-item" data-index="${globalIndex}" data-url="${item.url}">
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${this.highlightText(item.title, this.currentQuery)}</h6>
                            ${item.description ? `<p class="mb-1 text-muted small">${this.truncate(item.description, 80)}</p>` : ''}
                        </div>
                        <small class="text-muted ms-2">
                            <i class="fas fa-arrow-right"></i>
                        </small>
                    </div>
                </a>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Resaltar texto de búsqueda
     */
    highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark class="bg-warning bg-opacity-25">$1</mark>');
    }

    /**
     * Truncar texto
     */
    truncate(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    /**
     * Vincular clicks en resultados
     */
    bindResultClicks() {
        const resultItems = document.querySelectorAll('.search-result-item');
        resultItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const url = item.dataset.url;
                this.navigateToResult(url);
            });
        });
    }

    /**
     * Navegar a resultado
     */
    navigateToResult(url) {
        console.log('📍 Navegando a:', url);
        // Aquí puedes implementar la navegación según tu arquitectura
        // Por ejemplo: window.location.href = url;
        // O activar un modal específico, etc.
        this.close();

        // Mostrar notificación
        alert(`Navegando a: ${url}\n\n(En producción, esto abrirá el recurso correspondiente)`);
    }

    /**
     * Manejar navegación con teclado
     */
    handleKeyNavigation(e) {
        const resultItems = document.querySelectorAll('.search-result-item');
        if (resultItems.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, resultItems.length - 1);
                this.updateSelection(resultItems);
                break;

            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.updateSelection(resultItems);
                break;

            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < resultItems.length) {
                    resultItems[this.selectedIndex].click();
                }
                break;
        }
    }

    /**
     * Actualizar selección visual
     */
    updateSelection(resultItems) {
        resultItems.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('active');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('active');
            }
        });
    }
}

// Instancia global
const globalSearch = new GlobalSearch();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        globalSearch.init();
    });
} else {
    globalSearch.init();
}
