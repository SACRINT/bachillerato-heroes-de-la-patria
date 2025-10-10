/**
 * 💼 PANEL DE GESTIÓN DE BOLSA DE TRABAJO
 * Dashboard Administrativo - BGE Héroes de la Patria
 *
 * @description Sistema completo de visualización y gestión de candidatos de bolsa de trabajo
 * @version 1.0.0
 * @date 2025-10-09
 */

class BolsaTrabajoManager {
    constructor() {
        // Datos principales
        this.candidatos = [];
        this.filteredCandidatos = [];
        this.stats = null;

        // Filtros
        this.filters = {
            search: '',
            estado: '',
            generacion: ''
        };

        // Paginación
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 0;

        // Ordenamiento
        this.sortColumn = 'fecha_registro';
        this.sortDirection = 'desc';

        // API Base URL
        this.apiBase = '/api/bolsa-trabajo';

        console.log('💼 [BOLSA-TRABAJO] Manager inicializado');
    }

    /**
     * Inicialización del dashboard
     */
    async init() {
        try {
            console.log('💼 [BOLSA-TRABAJO] Cargando dashboard...');

            // Mostrar loading
            this.showLoading(true);

            // Cargar datos
            await this.loadStats();
            await this.loadData();

            // Renderizar componentes
            this.renderStats();
            this.applyFilters();
            this.renderTable();

            // Setup event listeners
            this.setupEventListeners();

            // Ocultar loading
            this.showLoading(false);

            // Actualizar badge en nav
            this.updateNavBadge();

            console.log('✅ [BOLSA-TRABAJO] Dashboard cargado exitosamente');
            this.showToast('Dashboard de bolsa de trabajo cargado', 'success');

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al inicializar:', error);
            this.showToast('Error al cargar el dashboard de bolsa de trabajo', 'error');
            this.showLoading(false);
            this.showError();
        }
    }

    /**
     * Cargar estadísticas generales
     */
    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats/general`);
            if (!response.ok) throw new Error('Error al cargar estadísticas');

            this.stats = await response.json();
            console.log('📊 [BOLSA-TRABAJO] Estadísticas cargadas:', this.stats);

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al cargar stats:', error);
            // Stats por defecto
            this.stats = {
                total: 0,
                nuevosUltimos7Dias: 0,
                conCV: 0,
                porEstado: [],
                porGeneracion: []
            };
        }
    }

    /**
     * Cargar lista de candidatos
     */
    async loadData() {
        try {
            const response = await fetch(this.apiBase);
            if (!response.ok) throw new Error('Error al cargar candidatos');

            this.candidatos = await response.json();
            console.log(`📋 [BOLSA-TRABAJO] ${this.candidatos.length} candidatos cargados`);

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al cargar lista:', error);
            this.candidatos = [];
        }
    }

    /**
     * Renderizar tarjetas de estadísticas
     */
    renderStats() {
        // Actualizar cards individuales
        this.updateStatCard('stats-total-bolsa', this.stats.total || 0);
        this.updateStatCard('stats-nuevos-bolsa', this.stats.nuevosUltimos7Dias || 0);

        // Calcular candidatos revisados
        const revisados = this.stats.porEstado?.find(e => e.estado === 'revisado')?.cantidad || 0;
        this.updateStatCard('stats-revisados-bolsa', revisados);

        // Calcular candidatos contratados
        const contratados = this.stats.porEstado?.find(e => e.estado === 'contratado')?.cantidad || 0;
        this.updateStatCard('stats-contratados-bolsa', contratados);

        console.log('📊 [BOLSA-TRABAJO] Estadísticas renderizadas');
    }

    /**
     * Actualizar card de estadística individual
     */
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Actualizar badge en nav
     */
    updateNavBadge() {
        const badge = document.getElementById('bolsa-trabajo-count');
        if (badge) {
            badge.textContent = this.stats.total || 0;
        }
    }

    /**
     * Aplicar filtros
     */
    applyFilters() {
        this.filteredCandidatos = this.candidatos.filter(candidato => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                const nombre = (candidato.nombre || '').toLowerCase();
                const email = (candidato.email || '').toLowerCase();
                if (!nombre.includes(search) && !email.includes(search)) {
                    return false;
                }
            }

            // Filtro de estado
            if (this.filters.estado && candidato.estado !== this.filters.estado) {
                return false;
            }

            // Filtro de generación
            if (this.filters.generacion && candidato.generacion != this.filters.generacion) {
                return false;
            }

            return true;
        });

        // Aplicar ordenamiento
        this.sortData();

        // Calcular paginación
        this.totalPages = Math.ceil(this.filteredCandidatos.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

        // Actualizar contadores
        this.updateCounters();

        console.log(`🔍 [BOLSA-TRABAJO] Filtros aplicados: ${this.filteredCandidatos.length} resultados`);
    }

    /**
     * Actualizar contadores de resultados
     */
    updateCounters() {
        const showingCount = document.getElementById('showing-count-bolsa');
        const totalCount = document.getElementById('total-count-bolsa');

        if (showingCount) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(this.currentPage * this.pageSize, this.filteredCandidatos.length);
            showingCount.textContent = this.filteredCandidatos.length > 0 ? `${start}-${end}` : '0';
        }

        if (totalCount) {
            totalCount.textContent = this.filteredCandidatos.length;
        }
    }

    /**
     * Ordenar datos
     */
    sortData() {
        this.filteredCandidatos.sort((a, b) => {
            let valueA = a[this.sortColumn];
            let valueB = b[this.sortColumn];

            // Manejar valores null/undefined
            if (valueA === null || valueA === undefined) valueA = '';
            if (valueB === null || valueB === undefined) valueB = '';

            // Comparación
            if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Renderizar tabla de candidatos
     */
    renderTable() {
        const loadingEl = document.getElementById('bolsa-loading');
        const errorEl = document.getElementById('bolsa-error');
        const emptyEl = document.getElementById('bolsa-empty');
        const tableContainer = document.getElementById('bolsa-table-container');
        const tableBody = document.getElementById('bolsa-table-body');

        // Ocultar todos los estados
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) errorEl.classList.add('d-none');
        if (emptyEl) emptyEl.classList.add('d-none');
        if (tableContainer) tableContainer.classList.add('d-none');

        // Si no hay datos
        if (this.filteredCandidatos.length === 0) {
            if (emptyEl) emptyEl.classList.remove('d-none');
            return;
        }

        // Mostrar tabla
        if (tableContainer) tableContainer.classList.remove('d-none');
        if (!tableBody) return;

        // Datos paginados
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.filteredCandidatos.slice(start, end);

        tableBody.innerHTML = pageData.map(candidato => this.renderTableRow(candidato)).join('');

        console.log(`📋 [BOLSA-TRABAJO] Tabla renderizada: ${pageData.length} filas`);
    }

    /**
     * Renderizar fila de tabla
     */
    renderTableRow(candidato) {
        const estadoBadge = this.getEstadoBadge(candidato.estado);
        const fechaRegistro = new Date(candidato.fecha_registro).toLocaleDateString('es-MX');

        return `
            <tr>
                <td><strong>${this.escapeHtml(candidato.nombre || 'Sin nombre')}</strong></td>
                <td class="text-muted small">${this.escapeHtml(candidato.email || 'Sin email')}</td>
                <td><span class="badge bg-primary">${candidato.generacion || '-'}</span></td>
                <td class="small">${this.escapeHtml(candidato.area_interes || '-')}</td>
                <td>${estadoBadge}</td>
                <td class="small text-muted">${fechaRegistro}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="bolsaTrabajoManager.viewDetails(${candidato.id})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning"
                                onclick="bolsaTrabajoManager.edit(${candidato.id})"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger"
                                onclick="bolsaTrabajoManager.delete(${candidato.id})"
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Obtener badge de estado
     */
    getEstadoBadge(estado) {
        const badges = {
            'nuevo': 'info',
            'revisado': 'primary',
            'contactado': 'warning',
            'entrevistado': 'secondary',
            'contratado': 'success',
            'descartado': 'danger'
        };

        const color = badges[estado] || 'secondary';
        const text = estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Sin estado';

        return `<span class="badge bg-${color}">${text}</span>`;
    }

    /**
     * Obtener icono de ordenamiento
     */
    getSortIcon(column) {
        if (this.sortColumn !== column) {
            return '<i class="fas fa-sort text-muted small"></i>';
        }
        return this.sortDirection === 'asc'
            ? '<i class="fas fa-sort-up text-primary small"></i>'
            : '<i class="fas fa-sort-down text-primary small"></i>';
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Búsqueda en tiempo real con debounce
        const searchInput = document.getElementById('search-bolsa');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.applyFilters();
                    this.renderTable();
                }, 300);
            });
        }

        // Filtro de estado
        const filterEstado = document.getElementById('filter-estado-bolsa');
        if (filterEstado) {
            filterEstado.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }

        // Filtro de generación
        const filterGeneracion = document.getElementById('filter-generacion-bolsa');
        if (filterGeneracion) {
            filterGeneracion.addEventListener('change', (e) => {
                this.filters.generacion = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }
    }

    /**
     * Ordenar por columna
     */
    sortBy(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.applyFilters();
        this.renderTable();
    }

    /**
     * Cambiar página
     */
    changePage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderTable();

        // Scroll to top
        document.getElementById('bolsa-table-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Limpiar filtros
     */
    clearFilters() {
        this.filters = {
            search: '',
            estado: '',
            generacion: ''
        };

        // Limpiar inputs
        const searchInput = document.getElementById('search-bolsa');
        if (searchInput) searchInput.value = '';

        const filterEstado = document.getElementById('filter-estado-bolsa');
        if (filterEstado) filterEstado.value = '';

        const filterGeneracion = document.getElementById('filter-generacion-bolsa');
        if (filterGeneracion) filterGeneracion.value = '';

        this.currentPage = 1;
        this.applyFilters();
        this.renderTable();

        this.showToast('Filtros limpiados', 'info');
    }

    /**
     * Refrescar datos
     */
    async refresh() {
        this.showToast('Refrescando datos...', 'info');
        await this.init();
    }

    /**
     * Ver detalles de candidato
     */
    async viewDetails(id) {
        try {
            const candidato = this.candidatos.find(c => c.id === id);
            if (!candidato) throw new Error('Candidato no encontrado');

            const modal = this.createDetailsModal(candidato);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al ver detalles:', error);
            this.showToast('Error al cargar detalles', 'error');
        }
    }

    /**
     * Crear modal de detalles
     */
    createDetailsModal(candidato) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'bolsaTrabajoDetailsModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-briefcase me-2"></i>
                            Detalles del Candidato
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Nombre Completo</label>
                                <p class="mb-0">${this.escapeHtml(candidato.nombre || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Email</label>
                                <p class="mb-0">${this.escapeHtml(candidato.email || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Teléfono</label>
                                <p class="mb-0">${candidato.telefono || 'No proporcionado'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Ciudad</label>
                                <p class="mb-0">${candidato.ciudad || 'No especificada'}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-graduation-cap me-2"></i>Información Académica</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Generación</label>
                                <p class="mb-0"><span class="badge bg-primary">${candidato.generacion || 'No especificada'}</span></p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Área de Interés</label>
                                <p class="mb-0">${candidato.area_interes || 'No especificada'}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-user me-2"></i>Perfil Profesional</h6>
                        <div class="mb-3">
                            <label class="fw-bold text-muted small">Resumen Profesional</label>
                            <p class="mb-0">${candidato.resumen_profesional || 'No especificado'}</p>
                        </div>
                        <div class="mb-3">
                            <label class="fw-bold text-muted small">Habilidades</label>
                            <p class="mb-0">${candidato.habilidades || 'No especificadas'}</p>
                        </div>

                        ${candidato.cv_filename ? `
                            <hr>
                            <h6 class="fw-bold mb-3"><i class="fas fa-file-pdf me-2"></i>Curriculum Vitae</h6>
                            <p class="mb-2"><strong>Archivo:</strong> ${this.escapeHtml(candidato.cv_filename)}</p>
                            ${candidato.cv_url ? `
                                <a href="${candidato.cv_url}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    <i class="fas fa-download"></i> Descargar CV
                                </a>
                            ` : ''}
                        ` : ''}

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-chart-line me-2"></i>Estado y Seguimiento</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Estado</label>
                                <p class="mb-0">${this.getEstadoBadge(candidato.estado)}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Fecha Registro</label>
                                <p class="mb-0 small">${new Date(candidato.fecha_registro).toLocaleString('es-MX')}</p>
                            </div>
                        </div>

                        ${candidato.notas_admin ? `
                            <div class="mb-3">
                                <label class="fw-bold text-muted small">Notas Administrativas</label>
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <p class="mb-0">${this.escapeHtml(candidato.notas_admin)}</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${candidato.empresas_compartido ? `
                            <div class="mb-3">
                                <label class="fw-bold text-muted small">Empresas Compartido</label>
                                <p class="mb-0">${this.escapeHtml(candidato.empresas_compartido)}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-warning" onclick="bolsaTrabajoManager.edit(${candidato.id}); bootstrap.Modal.getInstance(document.getElementById('bolsaTrabajoDetailsModal')).hide();">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Editar candidato
     */
    async edit(id) {
        try {
            const candidato = this.candidatos.find(c => c.id === id);
            if (!candidato) throw new Error('Candidato no encontrado');

            const modal = this.createEditModal(candidato);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al editar:', error);
            this.showToast('Error al cargar formulario de edición', 'error');
        }
    }

    /**
     * Crear modal de edición
     */
    createEditModal(candidato) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'bolsaTrabajoEditModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Editar Candidato
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editBolsaTrabajoForm">
                            <input type="hidden" id="edit-id" value="${candidato.id}">

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombre Completo *</label>
                                    <input type="text" class="form-control" id="edit-nombre" value="${this.escapeHtml(candidato.nombre || '')}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="edit-email" value="${this.escapeHtml(candidato.email || '')}" required>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <input type="tel" class="form-control" id="edit-telefono" value="${candidato.telefono || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Ciudad</label>
                                    <input type="text" class="form-control" id="edit-ciudad" value="${candidato.ciudad || ''}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Generación</label>
                                    <input type="number" class="form-control" id="edit-generacion" value="${candidato.generacion || ''}" min="1990" max="2030">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Área de Interés</label>
                                    <input type="text" class="form-control" id="edit-area" value="${candidato.area_interes || ''}">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Resumen Profesional</label>
                                <textarea class="form-control" id="edit-resumen" rows="3">${candidato.resumen_profesional || ''}</textarea>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Habilidades</label>
                                <textarea class="form-control" id="edit-habilidades" rows="2">${candidato.habilidades || ''}</textarea>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" id="edit-estado">
                                        <option value="nuevo" ${candidato.estado === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                                        <option value="revisado" ${candidato.estado === 'revisado' ? 'selected' : ''}>Revisado</option>
                                        <option value="contactado" ${candidato.estado === 'contactado' ? 'selected' : ''}>Contactado</option>
                                        <option value="entrevistado" ${candidato.estado === 'entrevistado' ? 'selected' : ''}>Entrevistado</option>
                                        <option value="contratado" ${candidato.estado === 'contratado' ? 'selected' : ''}>Contratado</option>
                                        <option value="descartado" ${candidato.estado === 'descartado' ? 'selected' : ''}>Descartado</option>
                                    </select>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Notas Administrativas</label>
                                <textarea class="form-control" id="edit-notas" rows="3">${candidato.notas_admin || ''}</textarea>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Empresas Compartido</label>
                                <input type="text" class="form-control" id="edit-empresas" value="${candidato.empresas_compartido || ''}">
                                <small class="form-text text-muted">Separar por comas</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" onclick="bolsaTrabajoManager.saveEdit()">
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Guardar edición
     */
    async saveEdit() {
        try {
            const id = document.getElementById('edit-id').value;

            const data = {
                nombre: document.getElementById('edit-nombre').value,
                email: document.getElementById('edit-email').value,
                telefono: document.getElementById('edit-telefono').value || null,
                ciudad: document.getElementById('edit-ciudad').value || null,
                generacion: document.getElementById('edit-generacion').value ? parseInt(document.getElementById('edit-generacion').value) : null,
                area_interes: document.getElementById('edit-area').value || null,
                resumen_profesional: document.getElementById('edit-resumen').value || null,
                habilidades: document.getElementById('edit-habilidades').value || null,
                estado: document.getElementById('edit-estado').value,
                notas_admin: document.getElementById('edit-notas').value || null,
                empresas_compartido: document.getElementById('edit-empresas').value || null
            };

            // Validar
            if (!data.nombre || !data.email) {
                this.showToast('Por favor completa los campos obligatorios', 'warning');
                return;
            }

            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al actualizar candidato');

            this.showToast('Candidato actualizado exitosamente', 'success');

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('bolsaTrabajoEditModal')).hide();

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al guardar:', error);
            this.showToast('Error al guardar cambios', 'error');
        }
    }

    /**
     * Eliminar candidato
     */
    async delete(id) {
        const candidato = this.candidatos.find(c => c.id === id);
        if (!candidato) return;

        if (!confirm(`¿Estás seguro de eliminar a ${candidato.nombre}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar candidato');

            this.showToast('Candidato eliminado exitosamente', 'success');

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al eliminar:', error);
            this.showToast('Error al eliminar candidato', 'error');
        }
    }

    /**
     * Exportar a CSV
     */
    exportToCSV() {
        try {
            // Preparar datos
            const data = this.filteredCandidatos.map(c => ({
                'ID': c.id,
                'Nombre': c.nombre,
                'Email': c.email,
                'Teléfono': c.telefono || '',
                'Ciudad': c.ciudad || '',
                'Generación': c.generacion || '',
                'Área Interés': c.area_interes || '',
                'Estado': c.estado || '',
                'CV': c.cv_filename || '',
                'Fecha Registro': new Date(c.fecha_registro).toLocaleDateString('es-MX')
            }));

            // Crear CSV
            const headers = Object.keys(data[0]);
            let csv = headers.join(',') + '\n';

            data.forEach(row => {
                csv += headers.map(header => {
                    let value = row[header] || '';
                    // Escapar comillas y comas
                    value = value.toString().replace(/"/g, '""');
                    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                    return value;
                }).join(',') + '\n';
            });

            // Descargar
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `bolsa-trabajo_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            this.showToast('Archivo CSV exportado exitosamente', 'success');

        } catch (error) {
            console.error('❌ [BOLSA-TRABAJO] Error al exportar:', error);
            this.showToast('Error al exportar a CSV', 'error');
        }
    }

    /**
     * Mostrar/ocultar loading
     */
    showLoading(show) {
        const loadingEl = document.getElementById('bolsa-loading');
        if (!loadingEl) return;

        if (show) {
            loadingEl.classList.remove('d-none');
        } else {
            loadingEl.classList.add('d-none');
        }
    }

    /**
     * Mostrar error
     */
    showError() {
        const errorEl = document.getElementById('bolsa-error');
        if (errorEl) {
            errorEl.classList.remove('d-none');
        }
    }

    /**
     * Mostrar toast de notificación
     */
    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-success',
            error: 'bg-danger',
            warning: 'bg-warning',
            info: 'bg-info'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white ${colors[type]} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${icons[type]} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '11000';
            document.body.appendChild(container);
        }

        container.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();

        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }

    /**
     * Utilidades - Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utilidades - Truncar texto
     */
    truncate(text, length) {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Inicializar instancia global
let bolsaTrabajoManager;

// Funciones globales para onclick en HTML
window.loadBolsaTrabajo = () => {
    if (!bolsaTrabajoManager) {
        bolsaTrabajoManager = new BolsaTrabajoManager();
    }
    bolsaTrabajoManager.init();
};

window.filterBolsaTrabajo = () => {
    if (bolsaTrabajoManager) {
        bolsaTrabajoManager.applyFilters();
        bolsaTrabajoManager.renderTable();
    }
};

window.clearFiltersBolsaTrabajo = () => {
    if (bolsaTrabajoManager) {
        bolsaTrabajoManager.clearFilters();
    }
};

window.exportBolsaTrabajoCSV = () => {
    if (bolsaTrabajoManager) {
        bolsaTrabajoManager.exportToCSV();
    }
};

console.log('✅ [BOLSA-TRABAJO] Script cargado');
