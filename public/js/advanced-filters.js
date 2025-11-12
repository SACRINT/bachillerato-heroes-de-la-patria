/**
 * ADVANCED FILTERS - Sistema de Filtros Avanzados para Admin Dashboard
 * Sistema centralizado y reutilizable de filtrado avanzado
 * Fecha: 19 de Octubre, 2025
 */

class AdvancedFilters {
    constructor(options = {}) {
        this.containerId = options.containerId;
        this.onFilterChange = options.onFilterChange || (() => {});
        this.filters = options.filters || [];
        this.currentValues = {};
        this.debounceTime = options.debounceTime || 300;
        this.debounceTimeout = null;
    }

    /**
     * Renderiza los filtros en el contenedor
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`[AdvancedFilters] Contenedor no encontrado: ${this.containerId}`);
            return;
        }

        let html = '<div class="advanced-filters">';
        html += '<div class="row g-3">';

        this.filters.forEach(filter => {
            html += this.renderFilter(filter);
        });

        // Botones de acción
        html += `
            <div class="col-12 col-md-auto ms-auto d-flex gap-2 align-items-end">
                <button type="button" class="btn btn-primary btn-sm" onclick="window.advancedFilters['${this.containerId}'].apply()">
                    <i class="fas fa-filter me-1"></i>Aplicar
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" onclick="window.advancedFilters['${this.containerId}'].reset()">
                    <i class="fas fa-undo me-1"></i>Limpiar
                </button>
            </div>
        `;

        html += '</div></div>';
        container.innerHTML = html;

        // Agregar listeners después de renderizar
        this.attachListeners();
    }

    /**
     * Renderiza un filtro individual
     */
    renderFilter(filter) {
        const id = `filter-${filter.name}`;
        const colSize = filter.width || 'col-12 col-md-3';

        let inputHtml = '';

        switch (filter.type) {
            case 'text':
                inputHtml = `
                    <input type="text"
                           class="form-control form-control-sm"
                           id="${id}"
                           placeholder="${filter.placeholder || ''}"
                           data-filter-name="${filter.name}">
                `;
                break;

            case 'select':
                inputHtml = `
                    <select class="form-select form-select-sm"
                            id="${id}"
                            data-filter-name="${filter.name}">
                        <option value="">Todos</option>
                        ${filter.options.map(opt =>
                            `<option value="${opt.value}">${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
                break;

            case 'date':
                inputHtml = `
                    <input type="date"
                           class="form-control form-control-sm"
                           id="${id}"
                           data-filter-name="${filter.name}">
                `;
                break;

            case 'dateRange':
                inputHtml = `
                    <div class="input-group input-group-sm">
                        <input type="date"
                               class="form-control"
                               id="${id}-from"
                               data-filter-name="${filter.name}-from"
                               placeholder="Desde">
                        <span class="input-group-text">-</span>
                        <input type="date"
                               class="form-control"
                               id="${id}-to"
                               data-filter-name="${filter.name}-to"
                               placeholder="Hasta">
                    </div>
                `;
                break;

            case 'number':
                inputHtml = `
                    <input type="number"
                           class="form-control form-control-sm"
                           id="${id}"
                           placeholder="${filter.placeholder || ''}"
                           min="${filter.min || ''}"
                           max="${filter.max || ''}"
                           data-filter-name="${filter.name}">
                `;
                break;

            case 'checkbox':
                inputHtml = `
                    <div class="form-check mt-2">
                        <input class="form-check-input"
                               type="checkbox"
                               id="${id}"
                               data-filter-name="${filter.name}">
                        <label class="form-check-label" for="${id}">
                            ${filter.placeholder || filter.label}
                        </label>
                    </div>
                `;
                break;

            case 'multiSelect':
                inputHtml = `
                    <select class="form-select form-select-sm"
                            id="${id}"
                            multiple
                            data-filter-name="${filter.name}">
                        ${filter.options.map(opt =>
                            `<option value="${opt.value}">${opt.label}</option>`
                        ).join('')}
                    </select>
                `;
                break;

            default:
                inputHtml = `<input type="text" class="form-control form-control-sm" id="${id}" data-filter-name="${filter.name}">`;
        }

        return `
            <div class="${colSize}">
                ${filter.type !== 'checkbox' ? `<label for="${id}" class="form-label small mb-1">${filter.label}</label>` : ''}
                ${inputHtml}
            </div>
        `;
    }

    /**
     * Adjunta listeners a los elementos del filtro
     */
    attachListeners() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const inputs = container.querySelectorAll('[data-filter-name]');

        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.addEventListener('change', () => this.onInputChange(input));
            } else {
                input.addEventListener('input', () => this.onInputChange(input));
                input.addEventListener('change', () => this.onInputChange(input));
            }

            // Enter para aplicar
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.apply();
                }
            });
        });
    }

    /**
     * Manejador de cambios en inputs
     */
    onInputChange(input) {
        clearTimeout(this.debounceTimeout);

        this.debounceTimeout = setTimeout(() => {
            const filterName = input.dataset.filterName;
            let value;

            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'select-multiple') {
                value = Array.from(input.selectedOptions).map(opt => opt.value);
            } else {
                value = input.value;
            }

            this.currentValues[filterName] = value;

            // Auto-aplicar si está habilitado
            if (this.autoApply) {
                this.apply();
            }
        }, this.debounceTime);
    }

    /**
     * Obtiene los valores actuales de los filtros
     */
    getValues() {
        const container = document.getElementById(this.containerId);
        if (!container) return {};

        const values = {};
        const inputs = container.querySelectorAll('[data-filter-name]');

        inputs.forEach(input => {
            const filterName = input.dataset.filterName;
            let value;

            if (input.type === 'checkbox') {
                value = input.checked;
            } else if (input.type === 'select-multiple') {
                value = Array.from(input.selectedOptions).map(opt => opt.value);
            } else {
                value = input.value;
            }

            // Solo incluir valores no vacíos
            if (value !== '' && value !== null && value !== undefined) {
                if (Array.isArray(value) && value.length === 0) {
                    return;
                }
                if (input.type === 'checkbox' && !value) {
                    return;
                }
                values[filterName] = value;
            }
        });

        return values;
    }

    /**
     * Establece valores de filtros programáticamente
     */
    setValues(values) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        Object.keys(values).forEach(filterName => {
            const input = container.querySelector(`[data-filter-name="${filterName}"]`);
            if (!input) return;

            const value = values[filterName];

            if (input.type === 'checkbox') {
                input.checked = value;
            } else if (input.type === 'select-multiple') {
                Array.from(input.options).forEach(opt => {
                    opt.selected = value.includes(opt.value);
                });
            } else {
                input.value = value;
            }
        });

        this.currentValues = { ...values };
    }

    /**
     * Aplica los filtros actuales
     */
    apply() {
        const values = this.getValues();
        this.currentValues = values;
        this.onFilterChange(values);
    }

    /**
     * Resetea todos los filtros
     */
    reset() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const inputs = container.querySelectorAll('[data-filter-name]');

        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else if (input.type === 'select-multiple') {
                Array.from(input.options).forEach(opt => opt.selected = false);
            } else {
                input.value = '';
            }
        });

        this.currentValues = {};
        this.onFilterChange({});
    }

    /**
     * Construye query string desde filtros
     */
    buildQueryString() {
        const values = this.getValues();
        const params = new URLSearchParams();

        Object.keys(values).forEach(key => {
            const value = values[key];
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            } else {
                params.append(key, value);
            }
        });

        return params.toString();
    }

    /**
     * Destruye la instancia del filtro
     */
    destroy() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = sanitizeHTML('');
        }

        if (window.advancedFilters && window.advancedFilters[this.containerId]) {
            delete window.advancedFilters[this.containerId];
        }
    }
}

// Almacenamiento global de instancias
if (typeof window !== 'undefined') {
    window.advancedFilters = window.advancedFilters || {};
}

/**
 * Crea una instancia de filtros avanzados
 * @param {Object} config - Configuración del filtro
 * @returns {AdvancedFilters} - Instancia del filtro
 */
function createAdvancedFilters(config) {
    const instance = new AdvancedFilters(config);
    instance.render();

    // Guardar en registro global
    if (config.containerId) {
        window.advancedFilters[config.containerId] = instance;
    }

    return instance;
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedFilters, createAdvancedFilters };
}
