/**
 * 🎓 PANEL DE GESTIÓN DE EGRESADOS
 * Dashboard Administrativo - BGE Héroes de la Patria
 *
 * @description Sistema completo de visualización y gestión de egresados
 * @version 1.0.0
 * @date 2025-10-03
 */

class EgresadosDashboard {
    constructor() {
        // Datos principales
        this.egresados = [];
        this.filteredEgresados = [];
        this.stats = null;

        // Filtros
        this.filters = {
            search: '',
            generacion: '',
            estatus: '',
            ciudad: ''
        };

        // Paginación
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalPages = 0;

        // Ordenamiento
        this.sortColumn = 'fecha_registro';
        this.sortDirection = 'desc';

        // Charts
        this.charts = {
            generacion: null,
            estatus: null,
            timeline: null
        };

        // API Base URL
        this.apiBase = '/api/egresados';

        console.log('🎓 [EGRESADOS] Dashboard inicializado');
    }

    /**
     * Inicialización del dashboard
     */
    async init() {
        try {
            console.log('🎓 [EGRESADOS] Cargando dashboard...');

            // Mostrar loading
            this.showLoading(true);

            // Cargar datos
            await this.loadStats();
            await this.loadEgresados();

            // Renderizar componentes
            this.renderStats();
            this.renderFilters();
            this.applyFilters();
            this.renderTable();
            this.renderCharts();

            // Setup event listeners
            this.setupEventListeners();

            // Ocultar loading
            this.showLoading(false);

            console.log('✅ [EGRESADOS] Dashboard cargado exitosamente');
            this.showToast('Dashboard de egresados cargado', 'success');

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al inicializar:', error);
            this.showToast('Error al cargar el dashboard de egresados', 'error');
            this.showLoading(false);
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
            console.log('📊 [EGRESADOS] Estadísticas cargadas:', this.stats);

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al cargar stats:', error);
            // Stats por defecto
            this.stats = {
                total: 0,
                porGeneracion: {},
                porEstatus: {},
                publicables: 0,
                ultimos30Dias: 0
            };
        }
    }

    /**
     * Cargar lista de egresados
     */
    async loadEgresados() {
        try {
            const response = await fetch(this.apiBase);
            if (!response.ok) throw new Error('Error al cargar egresados');

            this.egresados = await response.json();
            console.log(`📋 [EGRESADOS] ${this.egresados.length} egresados cargados`);

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al cargar lista:', error);
            this.egresados = [];
        }
    }

    /**
     * Renderizar tarjetas de estadísticas
     */
    renderStats() {
        const statsContainer = document.getElementById('egresados-stats');
        if (!statsContainer) return;

        const totalEgresados = this.stats.total || 0;
        const generacionReciente = this.getGeneracionReciente();
        const publicables = this.stats.publicables || 0;
        const ultimos30 = this.stats.ultimos30Dias || 0;

        statsContainer.innerHTML = `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stat-card bg-primary text-white h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon me-3">
                            <i class="fas fa-graduation-cap fa-3x opacity-50"></i>
                        </div>
                        <div class="stat-content">
                            <h3 class="mb-0 fw-bold">${totalEgresados}</h3>
                            <p class="mb-0 small">Total Egresados</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stat-card bg-success text-white h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon me-3">
                            <i class="fas fa-calendar-alt fa-3x opacity-50"></i>
                        </div>
                        <div class="stat-content">
                            <h3 class="mb-0 fw-bold">${generacionReciente.year}</h3>
                            <p class="mb-0 small">${generacionReciente.count} egresados</p>
                            <p class="mb-0 small opacity-75">Generación reciente</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stat-card bg-info text-white h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon me-3">
                            <i class="fas fa-star fa-3x opacity-50"></i>
                        </div>
                        <div class="stat-content">
                            <h3 class="mb-0 fw-bold">${publicables}</h3>
                            <p class="mb-0 small">Historias Publicables</p>
                            <p class="mb-0 small opacity-75">${Math.round((publicables/totalEgresados)*100)}% del total</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 col-sm-6 mb-3">
                <div class="card stat-card bg-warning text-white h-100">
                    <div class="card-body d-flex align-items-center">
                        <div class="stat-icon me-3">
                            <i class="fas fa-clock fa-3x opacity-50"></i>
                        </div>
                        <div class="stat-content">
                            <h3 class="mb-0 fw-bold">${ultimos30}</h3>
                            <p class="mb-0 small">Últimos 30 días</p>
                            <p class="mb-0 small opacity-75">Registros nuevos</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener generación más reciente
     */
    getGeneracionReciente() {
        if (!this.stats.porGeneracion || Object.keys(this.stats.porGeneracion).length === 0) {
            return { year: new Date().getFullYear(), count: 0 };
        }

        const years = Object.keys(this.stats.porGeneracion).map(Number).sort((a, b) => b - a);
        const recentYear = years[0];
        return {
            year: recentYear,
            count: this.stats.porGeneracion[recentYear]
        };
    }

    /**
     * Renderizar filtros
     */
    renderFilters() {
        const filtersContainer = document.getElementById('egresados-filters');
        if (!filtersContainer) return;

        // Obtener valores únicos para dropdowns
        const generaciones = [...new Set(this.egresados.map(e => e.generacion))].sort((a, b) => b - a);
        const estatus = [...new Set(this.egresados.map(e => e.estatus_academico).filter(Boolean))];
        const ciudades = [...new Set(this.egresados.map(e => e.ciudad).filter(Boolean))].sort();

        filtersContainer.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text"
                               id="search-input"
                               class="form-control"
                               placeholder="Buscar por nombre o email...">
                    </div>
                </div>

                <div class="col-md-2">
                    <select id="filter-generacion" class="form-select">
                        <option value="">Todas las generaciones</option>
                        ${generaciones.map(g => `<option value="${g}">${g}</option>`).join('')}
                    </select>
                </div>

                <div class="col-md-2">
                    <select id="filter-estatus" class="form-select">
                        <option value="">Todos los estatus</option>
                        ${estatus.map(e => `<option value="${e}">${e}</option>`).join('')}
                    </select>
                </div>

                <div class="col-md-2">
                    <select id="filter-ciudad" class="form-select">
                        <option value="">Todas las ciudades</option>
                        ${ciudades.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>

                <div class="col-md-3">
                    <button class="btn btn-outline-secondary me-2" onclick="egresadosApp.clearFilters()">
                        <i class="fas fa-times"></i> Limpiar
                    </button>
                    <button class="btn btn-outline-primary me-2" onclick="egresadosApp.refresh()">
                        <i class="fas fa-sync-alt"></i> Refrescar
                    </button>
                    <button class="btn btn-success" onclick="egresadosApp.exportToExcel()">
                        <i class="fas fa-file-excel"></i> Excel
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Aplicar filtros
     */
    applyFilters() {
        this.filteredEgresados = this.egresados.filter(egresado => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                const nombre = egresado.nombre.toLowerCase();
                const email = egresado.email.toLowerCase();
                if (!nombre.includes(search) && !email.includes(search)) {
                    return false;
                }
            }

            // Filtro de generación
            if (this.filters.generacion && egresado.generacion != this.filters.generacion) {
                return false;
            }

            // Filtro de estatus
            if (this.filters.estatus && egresado.estatus_academico !== this.filters.estatus) {
                return false;
            }

            // Filtro de ciudad
            if (this.filters.ciudad && egresado.ciudad !== this.filters.ciudad) {
                return false;
            }

            return true;
        });

        // Aplicar ordenamiento
        this.sortData();

        // Calcular paginación
        this.totalPages = Math.ceil(this.filteredEgresados.length / this.pageSize);
        this.currentPage = Math.min(this.currentPage, this.totalPages || 1);

        console.log(`🔍 [EGRESADOS] Filtros aplicados: ${this.filteredEgresados.length} resultados`);
    }

    /**
     * Ordenar datos
     */
    sortData() {
        this.filteredEgresados.sort((a, b) => {
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
     * Renderizar tabla de egresados
     */
    renderTable() {
        const tableContainer = document.getElementById('egresados-table');
        if (!tableContainer) return;

        // Datos paginados
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageData = this.filteredEgresados.slice(start, end);

        if (pageData.length === 0) {
            tableContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                    <h5 class="text-muted">No se encontraron egresados</h5>
                    <p class="text-muted">Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        tableContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover table-striped align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th onclick="egresadosApp.sortBy('id')" style="cursor: pointer;">
                                ID ${this.getSortIcon('id')}
                            </th>
                            <th onclick="egresadosApp.sortBy('nombre')" style="cursor: pointer;">
                                Nombre ${this.getSortIcon('nombre')}
                            </th>
                            <th onclick="egresadosApp.sortBy('email')" style="cursor: pointer;">
                                Email ${this.getSortIcon('email')}
                            </th>
                            <th onclick="egresadosApp.sortBy('generacion')" style="cursor: pointer;">
                                Generación ${this.getSortIcon('generacion')}
                            </th>
                            <th>Ciudad</th>
                            <th>Ocupación</th>
                            <th>Universidad</th>
                            <th onclick="egresadosApp.sortBy('estatus_academico')" style="cursor: pointer;">
                                Estatus ${this.getSortIcon('estatus_academico')}
                            </th>
                            <th onclick="egresadosApp.sortBy('fecha_registro')" style="cursor: pointer;">
                                Registro ${this.getSortIcon('fecha_registro')}
                            </th>
                            <th class="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageData.map(egresado => this.renderTableRow(egresado)).join('')}
                    </tbody>
                </table>
            </div>

            ${this.renderPagination()}
        `;
    }

    /**
     * Renderizar fila de tabla
     */
    renderTableRow(egresado) {
        const estatusBadge = this.getEstatusBadge(egresado.estatus_academico);
        const fechaRegistro = new Date(egresado.fecha_registro).toLocaleDateString('es-MX');

        return `
            <tr>
                <td><span class="badge bg-secondary">${egresado.id}</span></td>
                <td>
                    <strong>${this.escapeHtml(egresado.nombre)}</strong>
                    ${egresado.autoriza_publicar ? '<i class="fas fa-star text-warning ms-1" title="Historia publicable"></i>' : ''}
                </td>
                <td class="text-muted small">${this.escapeHtml(egresado.email)}</td>
                <td><span class="badge bg-primary">${egresado.generacion}</span></td>
                <td>${this.escapeHtml(egresado.ciudad || '-')}</td>
                <td class="small">${this.truncate(egresado.ocupacion_actual, 30)}</td>
                <td class="small">${this.truncate(egresado.universidad, 25)}</td>
                <td>${estatusBadge}</td>
                <td class="small text-muted">${fechaRegistro}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-info"
                                onclick="egresadosApp.viewDetails(${egresado.id})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning"
                                onclick="egresadosApp.editEgresado(${egresado.id})"
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger"
                                onclick="egresadosApp.deleteEgresado(${egresado.id})"
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Obtener badge de estatus
     */
    getEstatusBadge(estatus) {
        const badges = {
            'Estudiante universitario': 'primary',
            'Profesionista': 'success',
            'Estudiante de posgrado': 'info',
            'Otro': 'secondary'
        };

        const color = badges[estatus] || 'secondary';
        const text = estatus || 'No especificado';

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
     * Renderizar paginación
     */
    renderPagination() {
        if (this.totalPages <= 1) return '';

        const start = (this.currentPage - 1) * this.pageSize + 1;
        const end = Math.min(this.currentPage * this.pageSize, this.filteredEgresados.length);
        const total = this.filteredEgresados.length;

        let pages = [];
        const maxPages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <div class="text-muted">
                    Mostrando ${start} - ${end} de ${total} egresados
                </div>
                <nav>
                    <ul class="pagination mb-0">
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="event.preventDefault(); egresadosApp.changePage(1)">
                                <i class="fas fa-angle-double-left"></i>
                            </a>
                        </li>
                        <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="event.preventDefault(); egresadosApp.changePage(${this.currentPage - 1})">
                                <i class="fas fa-angle-left"></i>
                            </a>
                        </li>

                        ${pages.map(page => `
                            <li class="page-item ${page === this.currentPage ? 'active' : ''}">
                                <a class="page-link" href="#" onclick="event.preventDefault(); egresadosApp.changePage(${page})">
                                    ${page}
                                </a>
                            </li>
                        `).join('')}

                        <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="event.preventDefault(); egresadosApp.changePage(${this.currentPage + 1})">
                                <i class="fas fa-angle-right"></i>
                            </a>
                        </li>
                        <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" onclick="event.preventDefault(); egresadosApp.changePage(${this.totalPages})">
                                <i class="fas fa-angle-double-right"></i>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        `;
    }

    /**
     * Renderizar gráficas
     */
    renderCharts() {
        this.renderGeneracionChart();
        this.renderEstatusChart();
        this.renderTimelineChart();
    }

    /**
     * Gráfica de egresados por generación
     */
    renderGeneracionChart() {
        const canvas = document.getElementById('chart-generacion');
        if (!canvas) return;

        // Destruir gráfica anterior
        if (this.charts.generacion) {
            this.charts.generacion.destroy();
        }

        const ctx = canvas.getContext('2d');
        const data = this.stats.porGeneracion || {};
        const years = Object.keys(data).sort();
        const values = years.map(y => data[y]);

        this.charts.generacion = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Egresados',
                    data: values,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Egresados por Generación'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Gráfica de estatus académico
     */
    renderEstatusChart() {
        const canvas = document.getElementById('chart-estatus');
        if (!canvas) return;

        // Destruir gráfica anterior
        if (this.charts.estatus) {
            this.charts.estatus.destroy();
        }

        const ctx = canvas.getContext('2d');
        const data = this.stats.porEstatus || {};
        const labels = Object.keys(data);
        const values = Object.values(data);

        const colors = [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 99, 132, 0.6)'
        ];

        this.charts.estatus = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors.map(c => c.replace('0.6', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Distribución por Estatus Académico'
                    }
                }
            }
        });
    }

    /**
     * Gráfica de timeline de registros
     */
    renderTimelineChart() {
        const canvas = document.getElementById('chart-timeline');
        if (!canvas) return;

        // Destruir gráfica anterior
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }

        // Agrupar registros por mes
        const monthlyData = this.getMonthlyRegistrations();
        const labels = Object.keys(monthlyData).sort();
        const values = labels.map(l => monthlyData[l]);

        const ctx = canvas.getContext('2d');

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Registros',
                    data: values,
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Registros por Mes (Últimos 12 meses)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    /**
     * Obtener registros mensuales
     */
    getMonthlyRegistrations() {
        const monthly = {};
        const now = new Date();
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Inicializar últimos 12 meses
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            monthly[key] = 0;
        }

        // Contar registros
        this.egresados.forEach(egresado => {
            const date = new Date(egresado.fecha_registro);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (monthly.hasOwnProperty(key)) {
                monthly[key]++;
            }
        });

        return monthly;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Búsqueda en tiempo real
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }

        // Filtro de generación
        const filterGeneracion = document.getElementById('filter-generacion');
        if (filterGeneracion) {
            filterGeneracion.addEventListener('change', (e) => {
                this.filters.generacion = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }

        // Filtro de estatus
        const filterEstatus = document.getElementById('filter-estatus');
        if (filterEstatus) {
            filterEstatus.addEventListener('change', (e) => {
                this.filters.estatus = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
                this.renderTable();
            });
        }

        // Filtro de ciudad
        const filterCiudad = document.getElementById('filter-ciudad');
        if (filterCiudad) {
            filterCiudad.addEventListener('change', (e) => {
                this.filters.ciudad = e.target.value;
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
        document.getElementById('egresados-table')?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Limpiar filtros
     */
    clearFilters() {
        this.filters = {
            search: '',
            generacion: '',
            estatus: '',
            ciudad: ''
        };

        // Limpiar inputs
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = '';

        const filterGeneracion = document.getElementById('filter-generacion');
        if (filterGeneracion) filterGeneracion.value = '';

        const filterEstatus = document.getElementById('filter-estatus');
        if (filterEstatus) filterEstatus.value = '';

        const filterCiudad = document.getElementById('filter-ciudad');
        if (filterCiudad) filterCiudad.value = '';

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
     * Ver detalles de egresado
     */
    async viewDetails(id) {
        try {
            const egresado = this.egresados.find(e => e.id === id);
            if (!egresado) throw new Error('Egresado no encontrado');

            const modal = this.createDetailsModal(egresado);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al ver detalles:', error);
            this.showToast('Error al cargar detalles', 'error');
        }
    }

    /**
     * Crear modal de detalles
     */
    createDetailsModal(egresado) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'egresadoDetailsModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-graduation-cap me-2"></i>
                            Detalles del Egresado
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Nombre Completo</label>
                                <p class="mb-0">${this.escapeHtml(egresado.nombre)}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Email</label>
                                <p class="mb-0">${this.escapeHtml(egresado.email)}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Teléfono</label>
                                <p class="mb-0">${egresado.telefono || 'No proporcionado'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Generación</label>
                                <p class="mb-0"><span class="badge bg-primary">${egresado.generacion}</span></p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-map-marker-alt me-2"></i>Ubicación</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Ciudad</label>
                                <p class="mb-0">${egresado.ciudad || 'No especificada'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Estado</label>
                                <p class="mb-0">${egresado.estado || 'No especificado'}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-university me-2"></i>Información Académica</h6>
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <label class="fw-bold text-muted small">Universidad</label>
                                <p class="mb-0">${egresado.universidad || 'No especificada'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Carrera</label>
                                <p class="mb-0">${egresado.carrera || 'No especificada'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Estatus Académico</label>
                                <p class="mb-0">${this.getEstatusBadge(egresado.estatus_academico)}</p>
                            </div>
                        </div>

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-briefcase me-2"></i>Información Laboral</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Ocupación Actual</label>
                                <p class="mb-0">${egresado.ocupacion_actual || 'No especificada'}</p>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="fw-bold text-muted small">Empresa</label>
                                <p class="mb-0">${egresado.empresa || 'No especificada'}</p>
                            </div>
                        </div>

                        ${egresado.autoriza_publicar && egresado.historia_exito ? `
                            <hr>
                            <h6 class="fw-bold mb-3">
                                <i class="fas fa-star text-warning me-2"></i>
                                Historia de Éxito
                            </h6>
                            <div class="card bg-light">
                                <div class="card-body">
                                    <p class="mb-0">${this.escapeHtml(egresado.historia_exito)}</p>
                                </div>
                            </div>
                        ` : ''}

                        <hr>

                        <h6 class="fw-bold mb-3"><i class="fas fa-info-circle me-2"></i>Información Adicional</h6>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Fecha de Registro</label>
                                <p class="mb-0 small">${new Date(egresado.fecha_registro).toLocaleString('es-MX')}</p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Historia Publicable</label>
                                <p class="mb-0">
                                    ${egresado.autoriza_publicar
                                        ? '<span class="badge bg-success"><i class="fas fa-check"></i> Sí</span>'
                                        : '<span class="badge bg-secondary"><i class="fas fa-times"></i> No</span>'}
                                </p>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="fw-bold text-muted small">Email Verificado</label>
                                <p class="mb-0">
                                    ${egresado.email_verificado
                                        ? '<span class="badge bg-success"><i class="fas fa-check"></i> Sí</span>'
                                        : '<span class="badge bg-warning"><i class="fas fa-clock"></i> Pendiente</span>'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-warning" onclick="egresadosApp.editEgresado(${egresado.id}); bootstrap.Modal.getInstance(document.getElementById('egresadoDetailsModal')).hide();">
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
     * Editar egresado
     */
    async editEgresado(id) {
        try {
            const egresado = this.egresados.find(e => e.id === id);
            if (!egresado) throw new Error('Egresado no encontrado');

            const modal = this.createEditModal(egresado);
            document.body.appendChild(modal);

            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Limpiar cuando se cierre
            modal.addEventListener('hidden.bs.modal', () => modal.remove());

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al editar:', error);
            this.showToast('Error al cargar formulario de edición', 'error');
        }
    }

    /**
     * Crear modal de edición
     */
    createEditModal(egresado) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'egresadoEditModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            Editar Egresado
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editEgresadoForm">
                            <input type="hidden" id="edit-id" value="${egresado.id}">

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Nombre Completo *</label>
                                    <input type="text" class="form-control" id="edit-nombre" value="${this.escapeHtml(egresado.nombre)}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Email *</label>
                                    <input type="email" class="form-control" id="edit-email" value="${this.escapeHtml(egresado.email)}" required>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Teléfono</label>
                                    <input type="tel" class="form-control" id="edit-telefono" value="${egresado.telefono || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Generación *</label>
                                    <input type="number" class="form-control" id="edit-generacion" value="${egresado.generacion}" required min="1990" max="2030">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Ciudad</label>
                                    <input type="text" class="form-control" id="edit-ciudad" value="${egresado.ciudad || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Estado</label>
                                    <input type="text" class="form-control" id="edit-estado" value="${egresado.estado || ''}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-12 mb-3">
                                    <label class="form-label">Universidad</label>
                                    <input type="text" class="form-control" id="edit-universidad" value="${egresado.universidad || ''}">
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Carrera</label>
                                    <input type="text" class="form-control" id="edit-carrera" value="${egresado.carrera || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Estatus Académico</label>
                                    <select class="form-select" id="edit-estatus">
                                        <option value="">Seleccionar...</option>
                                        <option value="Estudiante universitario" ${egresado.estatus_academico === 'Estudiante universitario' ? 'selected' : ''}>Estudiante universitario</option>
                                        <option value="Profesionista" ${egresado.estatus_academico === 'Profesionista' ? 'selected' : ''}>Profesionista</option>
                                        <option value="Estudiante de posgrado" ${egresado.estatus_academico === 'Estudiante de posgrado' ? 'selected' : ''}>Estudiante de posgrado</option>
                                        <option value="Otro" ${egresado.estatus_academico === 'Otro' ? 'selected' : ''}>Otro</option>
                                    </select>
                                </div>
                            </div>

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Ocupación Actual</label>
                                    <input type="text" class="form-control" id="edit-ocupacion" value="${egresado.ocupacion_actual || ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Empresa</label>
                                    <input type="text" class="form-control" id="edit-empresa" value="${egresado.empresa || ''}">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Historia de Éxito</label>
                                <textarea class="form-control" id="edit-historia" rows="4">${egresado.historia_exito || ''}</textarea>
                            </div>

                            <div class="form-check mb-3">
                                <input type="checkbox" class="form-check-input" id="edit-autoriza" ${egresado.autoriza_publicar ? 'checked' : ''}>
                                <label class="form-check-label" for="edit-autoriza">
                                    Autorizar publicación de historia de éxito
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-warning" onclick="egresadosApp.saveEdit()">
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
                generacion: parseInt(document.getElementById('edit-generacion').value),
                ciudad: document.getElementById('edit-ciudad').value || null,
                estado: document.getElementById('edit-estado').value || null,
                universidad: document.getElementById('edit-universidad').value || null,
                carrera: document.getElementById('edit-carrera').value || null,
                estatus_academico: document.getElementById('edit-estatus').value || null,
                ocupacion_actual: document.getElementById('edit-ocupacion').value || null,
                empresa: document.getElementById('edit-empresa').value || null,
                historia_exito: document.getElementById('edit-historia').value || null,
                autoriza_publicar: document.getElementById('edit-autoriza').checked
            };

            // Validar
            if (!data.nombre || !data.email || !data.generacion) {
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

            if (!response.ok) throw new Error('Error al actualizar egresado');

            this.showToast('Egresado actualizado exitosamente', 'success');

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('egresadoEditModal')).hide();

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al guardar:', error);
            this.showToast('Error al guardar cambios', 'error');
        }
    }

    /**
     * Eliminar egresado
     */
    async deleteEgresado(id) {
        const egresado = this.egresados.find(e => e.id === id);
        if (!egresado) return;

        if (!confirm(`¿Estás seguro de eliminar a ${egresado.nombre}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar egresado');

            this.showToast('Egresado eliminado exitosamente', 'success');

            // Refrescar datos
            await this.refresh();

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al eliminar:', error);
            this.showToast('Error al eliminar egresado', 'error');
        }
    }

    /**
     * Exportar a Excel
     */
    exportToExcel() {
        try {
            // Preparar datos
            const data = this.filteredEgresados.map(e => ({
                'ID': e.id,
                'Nombre': e.nombre,
                'Email': e.email,
                'Teléfono': e.telefono || '',
                'Generación': e.generacion,
                'Ciudad': e.ciudad || '',
                'Estado': e.estado || '',
                'Universidad': e.universidad || '',
                'Carrera': e.carrera || '',
                'Estatus Académico': e.estatus_academico || '',
                'Ocupación': e.ocupacion_actual || '',
                'Empresa': e.empresa || '',
                'Autoriza Publicar': e.autoriza_publicar ? 'Sí' : 'No',
                'Fecha Registro': new Date(e.fecha_registro).toLocaleDateString('es-MX')
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
            link.download = `egresados_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            this.showToast('Archivo Excel exportado exitosamente', 'success');

        } catch (error) {
            console.error('❌ [EGRESADOS] Error al exportar:', error);
            this.showToast('Error al exportar a Excel', 'error');
        }
    }

    /**
     * Mostrar/ocultar loading
     */
    showLoading(show) {
        const container = document.getElementById('egresados-section');
        if (!container) return;

        if (show) {
            const loading = document.createElement('div');
            loading.id = 'egresados-loading';
            loading.className = 'text-center py-5';
            loading.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-3 text-muted">Cargando datos de egresados...</p>
            `;
            container.appendChild(loading);
        } else {
            document.getElementById('egresados-loading')?.remove();
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
     * Utilidades
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, length) {
        if (!text) return '-';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Inicializar cuando el DOM esté listo
let egresadosApp;

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página correcta
    if (document.getElementById('egresados-section')) {
        egresadosApp = new EgresadosDashboard();

        // Auto-iniciar si el contenedor existe
        if (document.getElementById('egresados-stats')) {
            egresadosApp.init();
        }
    }
});

console.log('✅ [EGRESADOS] Script cargado');
