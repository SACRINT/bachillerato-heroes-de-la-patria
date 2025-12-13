/**
 * PAGINATION MANAGER - TypeScript
 * Sistema reutilizable de paginación para listas
 * Migrado a TypeScript: 13 Diciembre 2025
 */

declare const DOMPurify: {
    sanitize: (html: string) => string;
};

export interface PaginationOptions {
    currentPage?: number;
    itemsPerPage?: number;
    totalItems?: number;
    maxButtons?: number;
    containerId?: string;
    onPageChange?: (page: number, offset: number, limit: number) => void;
    showInfo?: boolean;
    labels?: {
        previous?: string;
        next?: string;
        showing?: string;
        of?: string;
        results?: string;
    };
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    offset: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class PaginationManager {
    private _currentPage: number;
    private itemsPerPage: number;
    private _totalItems: number;
    private maxButtons: number;
    private onPageChange: (page: number, offset: number, limit: number) => void;
    private containerId?: string;
    private showInfo: boolean;
    private labels: Required<PaginationOptions['labels']>;

    constructor(options: PaginationOptions = {}) {
        this._currentPage = options.currentPage || 1;
        this.itemsPerPage = options.itemsPerPage || 20;
        this._totalItems = options.totalItems || 0;
        this.maxButtons = options.maxButtons || 5;
        this.onPageChange = options.onPageChange || (() => { });
        this.containerId = options.containerId;
        this.showInfo = options.showInfo !== false;
        this.labels = {
            previous: options.labels?.previous || 'Anterior',
            next: options.labels?.next || 'Siguiente',
            showing: options.labels?.showing || 'Mostrando',
            of: options.labels?.of || 'de',
            results: options.labels?.results || 'resultados'
        };

        // Register globally for onclick handlers
        if (this.containerId && typeof window !== 'undefined') {
            (window as any).paginationManagers = (window as any).paginationManagers || {};
            (window as any).paginationManagers[this.containerId] = this;
        }
    }

    get currentPage(): number {
        return this._currentPage;
    }

    get totalItems(): number {
        return this._totalItems;
    }

    get totalPages(): number {
        return Math.ceil(this._totalItems / this.itemsPerPage);
    }

    get offset(): number {
        return (this._currentPage - 1) * this.itemsPerPage;
    }

    get hasNextPage(): boolean {
        return this._currentPage < this.totalPages;
    }

    get hasPreviousPage(): boolean {
        return this._currentPage > 1;
    }

    /**
     * Get current pagination state
     */
    getState(): PaginationState {
        return {
            currentPage: this._currentPage,
            totalPages: this.totalPages,
            offset: this.offset,
            hasNextPage: this.hasNextPage,
            hasPreviousPage: this.hasPreviousPage
        };
    }

    /**
     * Navigate to specific page
     */
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;

        this._currentPage = page;
        this.onPageChange(this._currentPage, this.offset, this.itemsPerPage);
        this.render();
    }

    /**
     * Navigate to next page
     */
    nextPage(): void {
        if (this.hasNextPage) {
            this.goToPage(this._currentPage + 1);
        }
    }

    /**
     * Navigate to previous page
     */
    previousPage(): void {
        if (this.hasPreviousPage) {
            this.goToPage(this._currentPage - 1);
        }
    }

    /**
     * Go to first page
     */
    firstPage(): void {
        this.goToPage(1);
    }

    /**
     * Go to last page
     */
    lastPage(): void {
        this.goToPage(this.totalPages);
    }

    /**
     * Update total items count
     */
    updateTotalItems(total: number): void {
        this._totalItems = total;

        // If current page no longer exists, go to last valid page
        if (this._currentPage > this.totalPages && this.totalPages > 0) {
            this._currentPage = this.totalPages;
        }

        this.render();
    }

    /**
     * Update items per page
     */
    setItemsPerPage(count: number): void {
        this.itemsPerPage = count;
        this._currentPage = 1; // Reset to first page
        this.render();
    }

    /**
     * Get visible page numbers
     */
    getPageRange(): number[] {
        const totalPages = this.totalPages;
        const current = this._currentPage;
        const maxButtons = this.maxButtons;

        let start = Math.max(1, current - Math.floor(maxButtons / 2));
        let end = Math.min(totalPages, start + maxButtons - 1);

        // Adjust start if we're close to the end
        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }

        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    }

    /**
     * Render pagination UI
     */
    render(): void {
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
                    <!-- Previous Button -->
                    <li class="page-item ${!this.hasPreviousPage ? 'disabled' : ''}">
                        <button class="page-link" ${!this.hasPreviousPage ? 'disabled' : ''}
                                onclick="window.paginationManagers['${this.containerId}'].previousPage()"
                                aria-label="${this.labels.previous}">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                    </li>

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

                    ${pages.map(page => `
                        <li class="page-item ${page === this._currentPage ? 'active' : ''}">
                            <button class="page-link"
                                    onclick="window.paginationManagers['${this.containerId}'].goToPage(${page})"
                                    ${page === this._currentPage ? 'aria-current="page"' : ''}>
                                ${page}
                            </button>
                        </li>
                    `).join('')}

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

                    <!-- Next Button -->
                    <li class="page-item ${!this.hasNextPage ? 'disabled' : ''}">
                        <button class="page-link" ${!this.hasNextPage ? 'disabled' : ''}
                                onclick="window.paginationManagers['${this.containerId}'].nextPage()"
                                aria-label="${this.labels.next}">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>

            ${this.showInfo ? `
                <div class="text-center mt-2">
                    <small class="text-muted">
                        ${this.labels.showing} ${Math.min(this.offset + 1, this._totalItems)} - ${Math.min(this.offset + this.itemsPerPage, this._totalItems)}
                        ${this.labels.of} ${this._totalItems} ${this.labels.results}
                    </small>
                </div>
            ` : ''}
        `;

        container.innerHTML = typeof DOMPurify !== 'undefined'
            ? DOMPurify.sanitize(html)
            : html;
    }

    /**
     * Reset to first page
     */
    reset(): void {
        this._currentPage = 1;
        this.render();
    }

    /**
     * Destroy and cleanup
     */
    destroy(): void {
        if (this.containerId && typeof window !== 'undefined') {
            delete (window as any).paginationManagers?.[this.containerId];
        }
    }
}

// Global storage for pagination instances
if (typeof window !== 'undefined') {
    (window as any).paginationManagers = (window as any).paginationManagers || {};
    (window as any).PaginationManager = PaginationManager;
}

export default PaginationManager;
