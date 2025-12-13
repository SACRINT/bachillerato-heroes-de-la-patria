/**
 * 🚀 VIRTUAL SCROLLING - TypeScript
 *
 * Renderiza solo elementos visibles en tablas grandes (1000+ filas)
 * Mejora performance 90%+ en tablas grandes
 *
 * Migrado a TypeScript: 13 Diciembre 2025
 */

declare const DOMPurify: {
    sanitize: (html: string) => string;
};

export interface VirtualScrollOptions<T = any> {
    container: HTMLElement;
    data: T[];
    rowHeight?: number;
    bufferSize?: number;
    renderRow: (item: T, index: number) => HTMLElement;
    onScroll?: (scrollTop: number) => void;
    onVisibleChange?: (visibleStart: number, visibleEnd: number) => void;
}

export interface TableColumn {
    key: string;
    label?: string;
    width?: string;
    className?: string;
    render?: (value: any, item: any, index: number) => string;
}

export class VirtualScrollTable<T = any> {
    private container: HTMLElement;
    private data: T[];
    private rowHeight: number;
    private bufferSize: number;
    private renderRow: (item: T, index: number) => HTMLElement;
    private onScroll?: (scrollTop: number) => void;
    private onVisibleChange?: (visibleStart: number, visibleEnd: number) => void;

    private wrapper!: HTMLDivElement;
    private viewport!: HTMLDivElement;
    private scrollTop: number = 0;
    private visibleStart: number = 0;
    private visibleEnd: number = 0;
    private animationFrameId: number | null = null;
    private isDestroyed: boolean = false;

    constructor(options: VirtualScrollOptions<T>) {
        this.container = options.container;
        this.data = options.data || [];
        this.rowHeight = options.rowHeight || 50;
        this.bufferSize = options.bufferSize || 5;
        this.renderRow = options.renderRow;
        this.onScroll = options.onScroll;
        this.onVisibleChange = options.onVisibleChange;

        this.init();
    }

    private init(): void {
        // Create wrapper with total height
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'virtual-scroll-wrapper';
        this.wrapper.style.cssText = `
            position: relative;
            height: ${this.data.length * this.rowHeight}px;
        `;

        // Create viewport for visible rows
        this.viewport = document.createElement('div');
        this.viewport.className = 'virtual-scroll-viewport';
        this.viewport.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
        `;

        this.wrapper.appendChild(this.viewport);
        this.container.innerHTML = '';
        this.container.appendChild(this.wrapper);
        this.container.style.overflowY = 'auto';
        this.container.style.position = 'relative';

        // Event listeners with RAF optimization
        this.container.addEventListener('scroll', this.handleScrollThrottled.bind(this));

        // Initial render
        this.render();
    }

    private handleScrollThrottled(): void {
        if (this.animationFrameId) return;

        this.animationFrameId = requestAnimationFrame(() => {
            this.handleScroll();
            this.animationFrameId = null;
        });
    }

    private handleScroll(): void {
        if (this.isDestroyed) return;

        this.scrollTop = this.container.scrollTop;
        this.render();

        if (this.onScroll) {
            this.onScroll(this.scrollTop);
        }
    }

    render(): void {
        if (this.isDestroyed) return;

        const containerHeight = this.container.clientHeight;
        const previousStart = this.visibleStart;
        const previousEnd = this.visibleEnd;

        // Calculate visible rows
        this.visibleStart = Math.floor(this.scrollTop / this.rowHeight);
        this.visibleEnd = Math.ceil((this.scrollTop + containerHeight) / this.rowHeight);

        // Add buffer
        const start = Math.max(0, this.visibleStart - this.bufferSize);
        const end = Math.min(this.data.length, this.visibleEnd + this.bufferSize);

        // Clear viewport
        this.viewport.innerHTML = '';

        // Render only visible rows
        for (let i = start; i < end; i++) {
            const row = this.renderRow(this.data[i], i);
            row.style.position = 'absolute';
            row.style.top = `${i * this.rowHeight}px`;
            row.style.width = '100%';
            row.dataset.index = String(i);

            this.viewport.appendChild(row);
        }

        // Notify if visible range changed
        if (this.onVisibleChange &&
            (this.visibleStart !== previousStart || this.visibleEnd !== previousEnd)) {
            this.onVisibleChange(this.visibleStart, this.visibleEnd);
        }
    }

    /**
     * Update data and re-render
     */
    updateData(newData: T[]): void {
        this.data = newData;
        this.wrapper.style.height = `${this.data.length * this.rowHeight}px`;
        this.render();
    }

    /**
     * Append data to existing
     */
    appendData(items: T[]): void {
        this.data = [...this.data, ...items];
        this.wrapper.style.height = `${this.data.length * this.rowHeight}px`;
        this.render();
    }

    /**
     * Scroll to specific index
     */
    scrollToIndex(index: number, behavior: ScrollBehavior = 'auto'): void {
        const targetTop = index * this.rowHeight;
        this.container.scrollTo({
            top: targetTop,
            behavior
        });
    }

    /**
     * Scroll to top
     */
    scrollToTop(behavior: ScrollBehavior = 'auto'): void {
        this.scrollToIndex(0, behavior);
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom(behavior: ScrollBehavior = 'auto'): void {
        this.scrollToIndex(this.data.length - 1, behavior);
    }

    /**
     * Get current visible range
     */
    getVisibleRange(): { start: number; end: number } {
        return {
            start: this.visibleStart,
            end: this.visibleEnd
        };
    }

    /**
     * Get data count
     */
    getCount(): number {
        return this.data.length;
    }

    /**
     * Get item at index
     */
    getItem(index: number): T | undefined {
        return this.data[index];
    }

    /**
     * Refresh render
     */
    refresh(): void {
        this.render();
    }

    /**
     * Destroy instance
     */
    destroy(): void {
        this.isDestroyed = true;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.container.removeEventListener('scroll', this.handleScrollThrottled);
        this.container.innerHTML = '';
    }
}

/**
 * Helper for creating virtual tables from HTML
 */
export function createVirtualTable<T = any>(
    containerId: string,
    data: T[],
    columns: TableColumn[]
): VirtualScrollTable<T> | null {
    const container = document.getElementById(containerId);
    if (!container) return null;

    return new VirtualScrollTable<T>({
        container: container,
        data: data,
        rowHeight: 60,
        bufferSize: 10,
        renderRow: (item: any, _index: number) => {
            const row = document.createElement('div');
            row.className = 'virtual-table-row';
            row.innerHTML = columns.map(col => {
                const value = item[col.key] || '';
                const content = col.render ? col.render(value, item, _index) : value;
                return `<div class="virtual-table-cell ${col.className || ''}" style="${col.width ? `width: ${col.width}` : ''}">${content}</div>`;
            }).join('');
            return row;
        }
    });
}

// Export globally
if (typeof window !== 'undefined') {
    (window as any).VirtualScrollTable = VirtualScrollTable;
    (window as any).createVirtualTable = createVirtualTable;
}

export default VirtualScrollTable;
