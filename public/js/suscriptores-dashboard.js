/**
 * 📧 PANEL DE GESTIÓN DE SUSCRIPTORES
 * Dashboard Administrativo - BGE Héroes de la Patria
 *
 * @description Sistema completo de visualización y gestión de suscriptores de newsletters
 * @version 1.0.0
 * @date 2025-10-09
 */

class SuscriptoresManager {
    constructor() {
        // Datos principales
        this.suscriptores = [];
        this.filteredSuscriptores = [];
        this.stats = null;

        // Filtros
        this.filters = {
            search: '',
            estado: '',
            verificacion: ''
        };

        // Paginación
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 0;

        // Ordenamiento
        this.sortColumn = 'fecha_registro';
        this.sortDirection = 'desc';

        // API Base URL
        this.apiBase = '/api/suscriptores';

        console.log('📧 [SUSCRIPTORES] Manager inicializado');
    }

    /**
     * Inicialización del dashboard
     */
    async init() {
        try {
            console.log('📧 [SUSCRIPTORES] Cargando dashboard...');

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

            console.log('✅ [SUSCRIPTORES] Dashboard cargado exitosamente');
            this.showToast('Dashboard de suscriptores cargado', 'success');

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al inicializar:', error);
            this.showToast('Error al cargar el dashboard de suscriptores', 'error');
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
            console.log('📊 [SUSCRIPTORES] Estadísticas cargadas:', this.stats);

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al cargar stats:', error);
            // Stats por defecto
            this.stats = {
                total: 0,
                nuevosUltimos7Dias: 0,
                tasaAperturaPromedio: 0,
                porEstado: [],
                porVerificacion: [],
                porTipo: {
                    convocatorias: 0,
                    becas: 0,
                    eventos: 0,
                    noticias: 0,
                    todas: 0
                }
            };
        }
    }

    /**
     * Cargar lista de suscriptores
     */
    async loadData() {
        try {
            const response = await fetch(this.apiBase);
            if (!response.ok) throw new Error('Error al cargar suscriptores');

            this.suscriptores = await response.json();
            console.log(`📋 [SUSCRIPTORES] ${this.suscriptores.length} suscriptores cargados`);

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al cargar lista:', error);
            this.suscriptores = [];
        }
    }

    /**
     * Renderizar tarjetas de estadísticas
     */
    renderStats() {
        // Actualizar cards individuales
        this.updateStatCard('stats-total-suscriptores', this.stats.total || 0);
        this.updateStatCard('stats-nuevos-suscriptores', this.stats.nuevosUltimos7Dias || 0);

        // Calcular suscriptores activos
        const activos = this.stats.porEstado?.find(e => e.estado === 'activo')?.cantidad || 0;
        this.updateStatCard('stats-activos-suscriptores', activos);

        // Calcular suscriptores verificados
        const verificados = this.stats.porVerificacion?.find(v => v.verificado === true)?.cantidad || 0;
        this.updateStatCard('stats-verificados-suscriptores', verificados);

        console.log('📊 [SUSCRIPTORES] Estadísticas renderizadas');
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
        const badge = document.getElementById('suscriptores-count');
        if (badge) {
            badge.textContent = this.stats.total || 0;
        }
    }

    /**
     * Aplicar filtros
     */
    applyFilters() {
        this.filteredSuscriptores = this.suscriptores.filter(suscriptor => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                const email = (suscriptor.email || '').toLowerCase();
                const nombre = (suscriptor.nombre || '').toLowerCase();
                if (!email.includes(search) && !nombre.includes(search)) {
                    return false;
                }
            }

            // Filtro de estado
            if (this.filters.estado && suscriptor.estado !== this.filters.estado) {
                return false;
            }

            // Filtro de verificación
            if (this.filters.verificacion !== '') {
                const verificado = this.filters.verificacion === 'true';
                if (suscriptor.verificado !== verificado) {
                    return false;
                }
            }

            return true;
        });

        // Aplicar ordenamiento
        this.sortData();

        // Calcular paginación
        this.totalPages = Math.ceil(this.filteredSuscriptores.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

        // Actualizar contadores
        this.updateCounters();

        console.log(`🔍 [SUSCRIPTORES] Filtros aplicados: ${this.filteredSuscriptores.length} resultados`);
    }

    /**
     * Actualizar contadores de resultados
     */
    updateCounters() {
        const showingCount = document.getElementById('showing-count-suscriptores');
        const totalCount = document.getElementById('total-count-suscriptores');

        if (showingCount) {
            const start = (this.currentPage - 1) * this.pageSize + 1;
            const end = Math.min(this.currentPage * this.pageSize, this.filteredSuscriptores.length);
            showingCount.textContent = this.filteredSuscriptores.length > 0 ? `${start}-${end}` : '0';
        }

        if (totalCount) {
            totalCount.textContent = this.filteredSuscriptores.length;
        }
    }

    /**
     * Ordenar datos
     */
    sortData() {
        this.filteredSuscriptores.sort((a, b) => {
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
     * Renderizar tabla de suscriptores
     */
    renderTable() {
        const loadingEl = document.getElementById('suscriptores-loading');
        const errorEl = document.getElementById('suscriptores-error');
        const emptyEl = document.getElementById('suscriptores-empty');
        const tableContainer = document.getElementById('suscriptores-table-container');
        const tableBody = document.getElementById('suscriptores-table-body');

        // Ocultar todos los estados
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) errorEl.classList.add('d-none');
        if (emptyEl) emptyEl.classList.add('d-none');
        if (tableContainer) tableContainer.classList.add('d-none');

        // Si no hay datos
        if (this.filteredSuscriptores.length === 0) {
            if (emptyEl) emptyEl.classList.remove('d-none');
            return;
        }

        // Mostrar tabla
        if (tableContainer) tableContainer.classList.remove('d-none');
        if (!tableBody) return;

        // Datos paginados
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.filteredSuscriptores.slice(start, end);

        tableBody.innerHTML = pageData.map(suscriptor => this.renderTableRow(suscriptor)).join('');

        console.log(`📋 [SUSCRIPTORES] Tabla renderizada: ${pageData.length} filas`);
    }

    /**
     * Renderizar fila de tabla
     */
    renderTableRow(suscriptor) {
        const estadoBadge = this.getEstadoBadge(suscriptor.estado);
        const verificadoBadge = this.getVerificadoBadge(suscriptor.verificado);
        const fechaRegistro = new Date(suscriptor.fecha_registro).toLocaleDateString('es-MX');

        // Renderizar preferencias como íconos
        const preferencias = this.renderPreferencias(suscriptor);

        return `
            <tr>
                <td class="small">${this.escapeHtml(suscriptor.email || 'Sin email')}</td>
                <td>${this.escapeHtml(suscriptor.nombre || 'Sin nombre')}</td>
                <td class="text-center">${preferencias}</td>
                <td>${estadoBadge}</td>
                <td>${verificadoBadge}</td>
                <td class="small text-muted">${fechaRegistro}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="suscriptoresManager.viewDetails(${suscriptor.id})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning"
                                onclick="suscriptoresManager.edit(${suscriptor.id})"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${suscriptor.estado === 'activo' ? `
                            <button class="btn btn-outline-secondary"
                                    onclick="suscriptoresManager.cancelar(${suscriptor.id})"
                                    title="Cancelar suscripción">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-outline-danger"
                                onclick="suscriptoresManager.delete(${suscriptor.id})"
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Renderizar preferencias como íconos
     */
    renderPreferencias(suscriptor) {
        const icons = [];

        if (suscriptor.notif_convocatorias) {
            icons.push('<i class="fas fa-bullhorn text-primary" title="Convocatorias"></i>');
        }
        if (suscriptor.notif_becas) {
            icons.push('<i class="fas fa-graduation-cap text-success" title="Becas"></i>');
        }
        if (suscriptor.notif_eventos) {
            icons.push('<i class="fas fa-calendar text-info" title="Eventos"></i>');
        }
        if (suscriptor.notif_noticias) {
            icons.push('<i class="fas fa-newspaper text-warning" title="Noticias"></i>');
        }
        if (suscriptor.notif_todas) {
            icons.push('<i class="fas fa-envelope text-danger" title="Todas"></i>');
        }

        return icons.length > 0 ? icons.join(' ') : '<span class="text-muted">-</span>';
    }

    /**
     * Obtener badge de estado
     */
    getEstadoBadge(estado) {
        const badges = {
            'activo': 'success',
            'inactivo': 'secondary',
            'cancelado': 'danger',
            'pendiente': 'warning'
        };

        const color = badges[estado] || 'secondary';
        const text = estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Sin estado';

        return `<span class="badge bg-${color}">${text}</span>`;
    }

    /**
     * Obtener badge de verificado
     */
    getVerificadoBadge(verificado) {
        if (verificado) {
            return '<span class="badge bg-success"><i class="fas fa-check"></i> Verificado</span>';
        } else {
            return '<span class="badge bg-warning"><i class="fas fa-clock"></i> Pendiente</span>';
        }
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
        const searchInput = document.getElementById('search-suscriptor');
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
        const filterEstado = document.getElementById('filter-estado-suscriptor');
        if (filterEstado) {
            filterEstado.addEventListener('change', (e) => {
                this.filters.estado = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }

        // Filtro de verificación
        const filterVerificacion = document.getElementById('filter-verificacion-suscriptor');
        if (filterVerificacion) {
            filterVerificacion.addEventListener('change', (e) => {
                this.filters.verificacion = e.target.value;
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
        document.getElementById('suscriptores-table-container')?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Limpiar filtros
     */
    clearFilters() {
        this.filters = {
            search: '',
            estado: '',
            verificacion: ''
        };

        // Limpiar inputs
        const searchInput = document.getElementById('search-suscriptor');
        if (searchInput) searchInput.value = '';

        const filterEstado = document.getElementById('filter-estado-suscriptor');
        if (filterEstado) filterEstado.value = '';

        const filterVerificacion = document.getElementById('filter-verificacion-suscriptor');
        if (filterVerificacion) filterVerificacion.value = '';

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
     * Ver detalles de suscriptor
     */
    async viewDetails(id) {
        try {
            const suscriptor = this.suscriptores.find(s => s.id === id);
            if (!suscriptor) throw new Error('Suscriptor no encontrado');

            const modal = this.createDetailsModal(suscriptor);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al ver detalles:', error);
            this.showToast('Error al cargar detalles', 'error');
        }
    }

    /**
     * Crear modal de detalles
     */
    createDetailsModal(suscriptor) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'suscriptorDetailsModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-envelope me-2"></i>
                            Detalles del Suscriptor
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Email</label>
                                <p class="mb-0">${this.escapeHtml(suscriptor.email || 'No especificado')}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Nombre</label>
                                <p class="mb-0">${this.escapeHtml(suscriptor.nombre || 'No especificado')}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-bell me-2"></i>Preferencias de Notificaciones</h6>
                        <div class="row">
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${suscriptor.notif_convocatorias ? 'checked' : ''} disabled>
                                    <label class="form-check-label">
                                        <i class="fas fa-bullhorn text-primary me-1"></i> Convocatorias
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${suscriptor.notif_becas ? 'checked' : ''} disabled>
                                    <label class="form-check-label">
                                        <i class="fas fa-graduation-cap text-success me-1"></i> Becas
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${suscriptor.notif_eventos ? 'checked' : ''} disabled>
                                    <label class="form-check-label">
                                        <i class="fas fa-calendar text-info me-1"></i> Eventos
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${suscriptor.notif_noticias ? 'checked' : ''} disabled>
                                    <label class="form-check-label">
                                        <i class="fas fa-newspaper text-warning me-1"></i> Noticias
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-6 mb-2">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" ${suscriptor.notif_todas ? 'checked' : ''} disabled>
                                    <label class="form-check-label">
                                        <i class="fas fa-envelope text-danger me-1"></i> Todas las notificaciones
                                    </label>
                                </div>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-info-circle me-2"></i>Estado y Verificación</h6>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Estado</label>
                                <p class="mb-0">${this.getEstadoBadge(suscriptor.estado)}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Verificado</label>
                                <p class="mb-0">${this.getVerificadoBadge(suscriptor.verificado)}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Fecha Verificación</label>
                                <p class="mb-0 small">${suscriptor.fecha_verificacion ? new Date(suscriptor.fecha_verificacion).toLocaleDateString('es-MX') : 'No verificado'}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-chart-bar me-2"></i>Estadísticas de Envío</h6>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Total Enviados</label>
                                <p class="mb-0">${suscriptor.total_enviados || 0}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Total Abiertos</label>
                                <p class="mb-0">${suscriptor.total_abiertos || 0}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Tasa de Apertura</label>
                                <p class="mb-0">
                                    ${suscriptor.total_enviados > 0
                                        ? Math.round((suscriptor.total_abiertos / suscriptor.total_enviados) * 100) + '%'
                                        : '0%'}
                                </p>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Último Envío</label>
                                <p class="mb-0 small">${suscriptor.ultimo_envio ? new Date(suscriptor.ultimo_envio).toLocaleString('es-MX') : 'Nunca'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Fecha Registro</label>
                                <p class="mb-0 small">${new Date(suscriptor.fecha_registro).toLocaleString('es-MX')}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-warning" onclick="suscriptoresManager.edit(${suscriptor.id}); bootstrap.Modal.getInstance(document.getElementById('suscriptorDetailsModal')).hide();">
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
     * Editar suscriptor
     */
    async edit(id) {
        try {
            const suscriptor = this.suscriptores.find(s => s.id === id);
            if (!suscriptor) throw new Error('Suscriptor no encontrado');

            const modal = this.createEditModal(suscriptor);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al editar:', error);
            this.showToast('Error al cargar formulario de edición', 'error');
        }
    }

    /**
     * Crear modal de edición
     */
    createEditModal(suscriptor) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'suscriptorEditModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Editar Suscriptor
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editSuscriptorForm">
                            <input type="hidden" id="edit-id" value="${suscriptor.id}">

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="edit-email" value="${this.escapeHtml(suscriptor.email || '')}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombre</label>
                                    <input type="text" class="form-control" id="edit-nombre" value="${this.escapeHtml(suscriptor.nombre || '')}">
                                </div>
                            </div>

                            <hr>

                            <h6 class="fw-bold mb-3">Preferencias de Notificaciones</h6>
                            <div class="row">
                                <div class="col-md-6 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="edit-convocatorias" ${suscriptor.notif_convocatorias ? 'checked' : ''}>
                                        <label class="form-check-label" for="edit-convocatorias">
                                            <i class="fas fa-bullhorn text-primary me-1"></i> Convocatorias
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="edit-becas" ${suscriptor.notif_becas ? 'checked' : ''}>
                                        <label class="form-check-label" for="edit-becas">
                                            <i class="fas fa-graduation-cap text-success me-1"></i> Becas
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="edit-eventos" ${suscriptor.notif_eventos ? 'checked' : ''}>
                                        <label class="form-check-label" for="edit-eventos">
                                            <i class="fas fa-calendar text-info me-1"></i> Eventos
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="edit-noticias" ${suscriptor.notif_noticias ? 'checked' : ''}>
                                        <label class="form-check-label" for="edit-noticias">
                                            <i class="fas fa-newspaper text-warning me-1"></i> Noticias
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6 mb-2">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="edit-todas" ${suscriptor.notif_todas ? 'checked' : ''}>
                                        <label class="form-check-label" for="edit-todas">
                                            <i class="fas fa-envelope text-danger me-1"></i> Todas las notificaciones
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <hr>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Estado</label>
                                    <select class="form-select" id="edit-estado">
                                        <option value="activo" ${suscriptor.estado === 'activo' ? 'selected' : ''}>Activo</option>
                                        <option value="inactivo" ${suscriptor.estado === 'inactivo' ? 'selected' : ''}>Inactivo</option>
                                        <option value="cancelado" ${suscriptor.estado === 'cancelado' ? 'selected' : ''}>Cancelado</option>
                                        <option value="pendiente" ${suscriptor.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Verificado</label>
                                    <select class="form-select" id="edit-verificado">
                                        <option value="true" ${suscriptor.verificado ? 'selected' : ''}>Sí</option>
                                        <option value="false" ${!suscriptor.verificado ? 'selected' : ''}>No</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" onclick="suscriptoresManager.saveEdit()">
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
                email: document.getElementById('edit-email').value,
                nombre: document.getElementById('edit-nombre').value || null,
                notif_convocatorias: document.getElementById('edit-convocatorias').checked,
                notif_becas: document.getElementById('edit-becas').checked,
                notif_eventos: document.getElementById('edit-eventos').checked,
                notif_noticias: document.getElementById('edit-noticias').checked,
                notif_todas: document.getElementById('edit-todas').checked,
                estado: document.getElementById('edit-estado').value,
                verificado: document.getElementById('edit-verificado').value === 'true'
            };

            // Validar
            if (!data.email) {
                this.showToast('Por favor ingresa un email válido', 'warning');
                return;
            }

            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Error al actualizar suscriptor');

            this.showToast('Suscriptor actualizado exitosamente', 'success');

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('suscriptorEditModal')).hide();

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al guardar:', error);
            this.showToast('Error al guardar cambios', 'error');
        }
    }

    /**
     * Cancelar suscripción
     */
    async cancelar(id) {
        const suscriptor = this.suscriptores.find(s => s.id === id);
        if (!suscriptor) return;

        if (!confirm(`¿Estás seguro de cancelar la suscripción de ${suscriptor.email}?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'cancelado' })
            });

            if (!response.ok) throw new Error('Error al cancelar suscripción');

            this.showToast('Suscripción cancelada exitosamente', 'success');

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al cancelar:', error);
            this.showToast('Error al cancelar suscripción', 'error');
        }
    }

    /**
     * Eliminar suscriptor
     */
    async delete(id) {
        const suscriptor = this.suscriptores.find(s => s.id === id);
        if (!suscriptor) return;

        if (!confirm(`¿Estás seguro de eliminar a ${suscriptor.email}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar suscriptor');

            this.showToast('Suscriptor eliminado exitosamente', 'success');

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al eliminar:', error);
            this.showToast('Error al eliminar suscriptor', 'error');
        }
    }

    /**
     * Exportar a CSV
     */
    exportToCSV() {
        try {
            // Preparar datos
            const data = this.filteredSuscriptores.map(s => ({
                'ID': s.id,
                'Email': s.email,
                'Nombre': s.nombre || '',
                'Convocatorias': s.notif_convocatorias ? 'Sí' : 'No',
                'Becas': s.notif_becas ? 'Sí' : 'No',
                'Eventos': s.notif_eventos ? 'Sí' : 'No',
                'Noticias': s.notif_noticias ? 'Sí' : 'No',
                'Todas': s.notif_todas ? 'Sí' : 'No',
                'Estado': s.estado || '',
                'Verificado': s.verificado ? 'Sí' : 'No',
                'Total Enviados': s.total_enviados || 0,
                'Total Abiertos': s.total_abiertos || 0,
                'Fecha Registro': new Date(s.fecha_registro).toLocaleDateString('es-MX')
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
            link.download = `suscriptores_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            this.showToast('Archivo CSV exportado exitosamente', 'success');

        } catch (error) {
            console.error('❌ [SUSCRIPTORES] Error al exportar:', error);
            this.showToast('Error al exportar a CSV', 'error');
        }
    }

    /**
     * Mostrar/ocultar loading
     */
    showLoading(show) {
        const loadingEl = document.getElementById('suscriptores-loading');
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
        const errorEl = document.getElementById('suscriptores-error');
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
let suscriptoresManager;

// Funciones globales para onclick en HTML
window.loadSuscriptores = () => {
    if (!suscriptoresManager) {
        suscriptoresManager = new SuscriptoresManager();
    }
    suscriptoresManager.init();
};

window.filterSuscriptores = () => {
    if (suscriptoresManager) {
        suscriptoresManager.applyFilters();
        suscriptoresManager.renderTable();
    }
};

window.clearFiltersSuscriptores = () => {
    if (suscriptoresManager) {
        suscriptoresManager.clearFilters();
    }
};

window.exportSuscriptoresCSV = () => {
    if (suscriptoresManager) {
        suscriptoresManager.exportToCSV();
    }
};

console.log('✅ [SUSCRIPTORES] Script cargado');
