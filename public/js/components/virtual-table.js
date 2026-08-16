/**
 * 📊 VIRTUAL TABLE COMPONENT - SEMANA 3
 * Virtual Scrolling para tablas con miles de filas
 *
 * Features:
 * - Renderiza solo filas visibles
 * - Scroll suave
 * - Sorting y filtering
 * - Selección múltiple
 * - Responsive
 *
 * Fecha: 20 Noviembre 2025
 */

class VirtualTable {
  constructor(container, options = {}) {
    this.container = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!this.container) {
      throw new Error('VirtualTable: Container no encontrado');
    }

    // Configuración por defecto
    this.options = {
      rowHeight: 48,
      bufferSize: 5,
      columns: [],
      data: [],
      sortable: true,
      filterable: true,
      selectable: false,
      pageSize: 50,
      onRowClick: null,
      onSelectionChange: null,
      ...options
    };

    // Estado interno
    this.state = {
      scrollTop: 0,
      visibleStart: 0,
      visibleEnd: 0,
      sortColumn: null,
      sortDirection: 'asc',
      filters: {},
      selectedRows: new Set(),
      filteredData: [...this.options.data]
    };

    this.init();
  }

  init() {
    this.createStructure();
    this.bindEvents();
    this.render();
  }

  createStructure() {
    this.container.innerHTML = `
      <div class="virtual-table-wrapper">
        ${this.options.filterable ? this.createFilterBar() : ''}
        <div class="virtual-table-header">
          <table>
            <thead>
              <tr>
                ${this.options.selectable ? '<th class="vt-checkbox"><input type="checkbox" class="select-all"></th>' : ''}
                ${this.options.columns.map(col => `
                  <th
                    data-column="${col.key}"
                    class="${this.options.sortable && col.sortable !== false ? 'sortable' : ''}"
                    style="width: ${col.width || 'auto'}"
                  >
                    ${col.label}
                    ${this.options.sortable && col.sortable !== false ? '<span class="sort-icon"></span>' : ''}
                  </th>
                `).join('')}
              </tr>
            </thead>
          </table>
        </div>
        <div class="virtual-table-body" style="height: ${this.options.pageSize * this.options.rowHeight}px">
          <div class="virtual-table-spacer"></div>
          <table>
            <tbody></tbody>
          </table>
        </div>
        <div class="virtual-table-footer">
          <span class="vt-info"></span>
        </div>
      </div>
    `;

    // Referencias a elementos
    this.headerEl = this.container.querySelector('.virtual-table-header');
    this.bodyEl = this.container.querySelector('.virtual-table-body');
    this.tbodyEl = this.container.querySelector('tbody');
    this.spacerEl = this.container.querySelector('.virtual-table-spacer');
    this.infoEl = this.container.querySelector('.vt-info');
  }

  createFilterBar() {
    return `
      <div class="virtual-table-filters">
        <input type="text" class="vt-search" placeholder="Buscar...">
        <select class="vt-column-filter">
          <option value="">Todas las columnas</option>
          ${this.options.columns.map(col =>
            `<option value="${col.key}">${col.label}</option>`
          ).join('')}
        </select>
      </div>
    `;
  }

  bindEvents() {
    // Scroll event con throttle
    let ticking = false;
    this.bodyEl.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.onScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Sort click
    if (this.options.sortable) {
      this.headerEl.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => this.onSort(th.dataset.column));
      });
    }

    // Filter input
    if (this.options.filterable) {
      const searchInput = this.container.querySelector('.vt-search');
      const columnSelect = this.container.querySelector('.vt-column-filter');

      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.onFilter(e.target.value, columnSelect.value);
        }, 300);
      });

      columnSelect.addEventListener('change', () => {
        this.onFilter(searchInput.value, columnSelect.value);
      });
    }

    // Row click
    this.tbodyEl.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const index = parseInt(row.dataset.index);
        if (this.options.onRowClick) {
          this.options.onRowClick(this.state.filteredData[index], index);
        }
      }
    });

    // Select all
    if (this.options.selectable) {
      const selectAll = this.container.querySelector('.select-all');
      selectAll.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.state.filteredData.forEach((_, i) => this.state.selectedRows.add(i));
        } else {
          this.state.selectedRows.clear();
        }
        this.render();
        this.notifySelectionChange();
      });
    }
  }

  onScroll() {
    this.state.scrollTop = this.bodyEl.scrollTop;
    this.calculateVisibleRange();
    this.renderRows();
  }

  onSort(column) {
    if (this.state.sortColumn === column) {
      this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.state.sortColumn = column;
      this.state.sortDirection = 'asc';
    }

    this.sortData();
    this.render();
    this.updateSortIndicators();
  }

  onFilter(searchTerm, column) {
    const term = searchTerm.toLowerCase().trim();

    if (!term) {
      this.state.filteredData = [...this.options.data];
    } else {
      this.state.filteredData = this.options.data.filter(row => {
        if (column) {
          const value = String(row[column] || '').toLowerCase();
          return value.includes(term);
        } else {
          return Object.values(row).some(val =>
            String(val || '').toLowerCase().includes(term)
          );
        }
      });
    }

    // Re-aplicar sort si existe
    if (this.state.sortColumn) {
      this.sortData();
    }

    this.render();
  }

  sortData() {
    const { sortColumn, sortDirection } = this.state;

    this.state.filteredData.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Manejar números
      if (!isNaN(aVal) && !isNaN(bVal)) {
        aVal = Number(aVal);
        bVal = Number(bVal);
      }

      // Manejar strings
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  calculateVisibleRange() {
    const { rowHeight, bufferSize } = this.options;
    const { scrollTop } = this.state;
    const viewportHeight = this.bodyEl.clientHeight;

    const start = Math.floor(scrollTop / rowHeight);
    const visible = Math.ceil(viewportHeight / rowHeight);

    this.state.visibleStart = Math.max(0, start - bufferSize);
    this.state.visibleEnd = Math.min(
      this.state.filteredData.length,
      start + visible + bufferSize
    );
  }

  render() {
    this.calculateVisibleRange();
    this.updateSpacer();
    this.renderRows();
    this.updateInfo();
  }

  updateSpacer() {
    const totalHeight = this.state.filteredData.length * this.options.rowHeight;
    this.spacerEl.style.height = `${totalHeight}px`;
  }

  renderRows() {
    const { visibleStart, visibleEnd, filteredData, selectedRows } = this.state;
    const { columns, rowHeight, selectable } = this.options;

    const rows = [];

    for (let i = visibleStart; i < visibleEnd; i++) {
      const row = filteredData[i];
      if (!row) continue;

      const top = i * rowHeight;
      const isSelected = selectedRows.has(i);

      rows.push(`
        <tr
          data-index="${i}"
          style="position: absolute; top: ${top}px; width: 100%"
          class="${isSelected ? 'selected' : ''}"
        >
          ${selectable ? `
            <td class="vt-checkbox">
              <input type="checkbox" ${isSelected ? 'checked' : ''} data-index="${i}">
            </td>
          ` : ''}
          ${columns.map(col => `
            <td style="width: ${col.width || 'auto'}">
              ${col.render ? col.render(row[col.key], row) : (row[col.key] || '')}
            </td>
          `).join('')}
        </tr>
      `);
    }

    this.tbodyEl.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rows.join('')) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(rows.join('')) : rows.join('')));

    // Bind checkbox events
    if (selectable) {
      this.tbodyEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
          const index = parseInt(e.target.dataset.index);
          if (e.target.checked) {
            selectedRows.add(index);
          } else {
            selectedRows.delete(index);
          }
          this.notifySelectionChange();
        });
      });
    }
  }

  updateSortIndicators() {
    this.headerEl.querySelectorAll('th.sortable').forEach(th => {
      const icon = th.querySelector('.sort-icon');
      if (th.dataset.column === this.state.sortColumn) {
        icon.textContent = this.state.sortDirection === 'asc' ? '↑' : '↓';
        th.classList.add('sorted');
      } else {
        icon.textContent = '';
        th.classList.remove('sorted');
      }
    });
  }

  updateInfo() {
    const total = this.options.data.length;
    const filtered = this.state.filteredData.length;
    const selected = this.state.selectedRows.size;

    let info = `Mostrando ${filtered} de ${total} registros`;
    if (selected > 0) {
      info += ` (${selected} seleccionados)`;
    }

    this.infoEl.textContent = info;
  }

  notifySelectionChange() {
    if (this.options.onSelectionChange) {
      const selectedData = Array.from(this.state.selectedRows)
        .map(i => this.state.filteredData[i]);
      this.options.onSelectionChange(selectedData);
    }
  }

  // Public API
  setData(data) {
    this.options.data = data;
    this.state.filteredData = [...data];
    this.state.selectedRows.clear();

    if (this.state.sortColumn) {
      this.sortData();
    }

    this.render();
  }

  getData() {
    return this.state.filteredData;
  }

  getSelectedData() {
    return Array.from(this.state.selectedRows)
      .map(i => this.state.filteredData[i]);
  }

  clearSelection() {
    this.state.selectedRows.clear();
    this.render();
  }

  scrollToRow(index) {
    const top = index * this.options.rowHeight;
    this.bodyEl.scrollTop = top;
  }

  refresh() {
    this.render();
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VirtualTable;
} else {
  window.VirtualTable = VirtualTable;
}
