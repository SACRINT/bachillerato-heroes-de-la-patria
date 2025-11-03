/**
 * PAGINATION MANAGER
 * Sistema reutilizable de paginación para listas
 * Fecha: 19 de Octubre, 2025
 */

class PaginationManager {
    constructor(options = {}) {
        this.currentPage = options.currentPage || 1;
        this.itemsPerPage = options.itemsPerPage || 20;
        this.totalItems = options.totalItems || 0;
        this.maxButtons = options.maxButtons || 5;
        this.onPageChange = options.onPageChange || (() => {});
        this.containerId = options.containerId;
    }

    get totalPages() {
        return Math.ceil(this.totalItems / this.itemsPerPage);
    }

    get offset() {
        return (this.currentPage - 1) * this.itemsPerPage;
    }

    get hasNextPage() {
        return this.currentPage < this.totalPages;
    }

    get hasPreviousPage() {
        return this.currentPage > 1;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;

        this.currentPage = page;
        this.onPageChange(this.currentPage, this.offset, this.itemsPerPage);
        this.render();
    }

    nextPage() {
        if (this.hasNextPage) {
            this.goToPage(this.currentPage + 1);
        }
    }

    previousPage() {
        if (this.hasPreviousPage) {
            this.goToPage(this.currentPage - 1);
        }
    }

    updateTotalItems(total) {
        this.totalItems = total;

        // Si la página actual ya no existe, ir a la última página válida
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }

        this.render();
    }

    getPageRange() {
        const totalPages = this.totalPages;
        const current = this.currentPage;
        const maxButtons = this.maxButtons;

        let start = Math.max(1, current - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);

        // Ajustar el inicio si estamos cerca del final
        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    render() {
        if (!this.containerId) return;

        const container = document.getElementById(this.containerId);
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const pages = this.getPageRange();
        const showFirstLast = this.totalPages > this.maxButtons;

        let html = `
            <nav aria-label="Paginación">
                <ul class="pagination justify-content-center mb-0">
                    <!-- Botón Anterior -->
                    <li class="page-item ${!this.hasPreviousPage ? 'disabled' : ''}">
                        <button class="page-link" ${!this.hasPreviousPage ? 'disabled' : ''}
                                onclick="window.paginationManagers['${this.containerId}'].previousPage()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </li>

                    <!-- Primera página si no está visible -->
                    ${showFirstLast && pages[0] > 1 ? `
                        <li class="page-item">
                            <button class="page-link" onclick="window.paginationManagers['${this.containerId}'].goToPage(1)">
                                1
                            </button>
                        </li>
                        ${pages[0] > 2 ? `
                            <li class="page-item disabled">
                                <span class="page-link">...</span>
                            </li>
                        ` : ''}
                    ` : ''}

                    <!-- Botones de páginas -->
                    ${pages.map(page => `
                        <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                            <button class="page-link"
                                    onclick="window.paginationManagers['${this.containerId}'].goToPage(${page})">
                                ${page}
                                ${page === this.currentPage ? '<span class="visually-hidden">(actual)</span>' : ''}
                            </button>
                        </li>
                    `).join('')}

                    <!-- Última página si no está visible -->
                    ${showFirstLast && pages[pages.length - 1] < this.totalPages ? `
                        ${pages[pages.length - 1] < this.totalPages - 1 ? `
                            <li class="page-item disabled">
                                <span class="page-link">...</span>
                            </li>
                        ` : ''}
                        <li class="page-item">
                            <button class="page-link" onclick="window.paginationManagers['${this.containerId}'].goToPage(${this.totalPages})">
                                ${this.totalPages}
                            </button>
                        </li>
                    ` : ''}

                    <!-- Botón Siguiente -->
                    <li class="page-item ${!this.hasNextPage ? 'disabled' : ''}">
                        <button class="page-link" ${!this.hasNextPage ? 'disabled' : ''}
                                onclick="window.paginationManagers['${this.containerId}'].nextPage()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>

            <!-- Info de paginación -->
            <div class="text-center mt-2">
                <small class="text-muted">
                    Mostrando ${Math.min(this.offset + 1, this.totalItems)} - ${Math.min(this.offset + this.itemsPerPage, this.totalItems)}
                    de ${this.totalItems} resultados
                </small>
            </div>
        `;

        container.innerHTML = html;
    }

    reset() {
        this.currentPage = 1;
        this.render();
    }
}

// Almacenamiento global de instancias de paginación
if (typeof window !== 'undefined') {
    window.paginationManagers = window.paginationManagers || {};
}
