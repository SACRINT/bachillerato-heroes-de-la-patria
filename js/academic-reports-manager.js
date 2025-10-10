/**
 * 📊 SISTEMA DE REPORTES ACADÉMICOS - FASE B CORE EDUCATIVO
 * Sistema completo de generación y gestión de reportes académicos
 * Integra calificaciones, asistencias, estadísticas y análisis de rendimiento
 */

class AcademicReportsManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.authToken = null;
        this.reportData = [];
        this.availableReports = [];
        this.currentReport = null;
        this.filters = {};

        this.config = {
            apiBase: '/api/grades-analytics',
            refreshInterval: 60000,
            exportFormats: ['pdf', 'excel', 'csv'],
            reportTypes: [
                'boletas-calificaciones',
                'estadisticas-grupo',
                'rendimiento-materia',
                'seguimiento-alumno',
                'comparativo-periodos',
                'reporte-asistencias',
                'analisis-reprobacion',
                'estadisticas-generales'
            ],
            chartColors: {
                primary: '#0d6efd',
                success: '#198754',
                warning: '#ffc107',
                danger: '#dc3545',
                info: '#0dcaf0',
                secondary: '#6c757d'
            }
        };

        this.init();
    }

    async init() {
        console.log('🚀 Inicializando Sistema de Reportes Académicos...');

        try {
            await this.loadUserAuth();
            await this.setupUI();
            await this.loadAvailableReports();
            await this.bindEvents();

            console.log('✅ Sistema de Reportes Académicos inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Sistema de Reportes:', error);
            this.showError('Error al inicializar el sistema de reportes');
        }
    }

    async loadUserAuth() {
        this.authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (this.authToken && userData) {
            const user = JSON.parse(userData);
            this.currentUser = user;
            this.userRole = user.rol || user.role;
        } else {
            throw new Error('Usuario no autenticado');
        }
    }

    async setupUI() {
        const container = document.getElementById('academic-reports-container');
        if (!container) return;

        container.innerHTML = `
            <div class="academic-reports-system">
                <!-- Header del Sistema -->
                <div class="reports-header bg-primary text-white p-4 rounded-top">
                    <h2><i class="fas fa-chart-bar me-2"></i>Reportes Académicos</h2>
                    <p class="mb-0">Sistema integral de reportes y análisis académico</p>
                </div>

                <!-- Navegación de Reportes -->
                <div class="reports-nav bg-light p-3 border-bottom">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <div class="btn-group" role="group">
                                <button type="button" class="btn btn-outline-primary active" data-view="generator">
                                    <i class="fas fa-plus-circle me-1"></i>Generar Reporte
                                </button>
                                <button type="button" class="btn btn-outline-primary" data-view="history">
                                    <i class="fas fa-history me-1"></i>Historial
                                </button>
                                <button type="button" class="btn btn-outline-primary" data-view="statistics">
                                    <i class="fas fa-chart-line me-1"></i>Estadísticas
                                </button>
                            </div>
                        </div>
                        <div class="col-md-6 text-end">
                            <button type="button" class="btn btn-success" id="exportAllBtn">
                                <i class="fas fa-download me-1"></i>Exportar Todo
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Área de Contenido -->
                <div class="reports-content">
                    <!-- Generador de Reportes -->
                    <div id="generator-view" class="report-view active">
                        <div class="row">
                            <!-- Panel de Filtros -->
                            <div class="col-lg-4">
                                <div class="card">
                                    <div class="card-header bg-secondary text-white">
                                        <h5 class="mb-0"><i class="fas fa-filter me-2"></i>Filtros de Reporte</h5>
                                    </div>
                                    <div class="card-body">
                                        <!-- Tipo de Reporte -->
                                        <div class="mb-3">
                                            <label class="form-label">Tipo de Reporte</label>
                                            <select class="form-select" id="reportType">
                                                <option value="">Seleccionar tipo...</option>
                                                <option value="boletas-calificaciones">Boletas de Calificaciones</option>
                                                <option value="estadisticas-grupo">Estadísticas por Grupo</option>
                                                <option value="rendimiento-materia">Rendimiento por Materia</option>
                                                <option value="seguimiento-alumno">Seguimiento de Alumno</option>
                                                <option value="comparativo-periodos">Comparativo de Períodos</option>
                                                <option value="reporte-asistencias">Reporte de Asistencias</option>
                                                <option value="analisis-reprobacion">Análisis de Reprobación</option>
                                                <option value="estadisticas-generales">Estadísticas Generales</option>
                                            </select>
                                        </div>

                                        <!-- Período Académico -->
                                        <div class="mb-3">
                                            <label class="form-label">Período Académico</label>
                                            <select class="form-select" id="academicPeriod">
                                                <option value="2024-2025">2024-2025</option>
                                                <option value="2023-2024">2023-2024</option>
                                                <option value="2022-2023">2022-2023</option>
                                            </select>
                                        </div>

                                        <!-- Parcial -->
                                        <div class="mb-3">
                                            <label class="form-label">Parcial</label>
                                            <select class="form-select" id="partialFilter">
                                                <option value="">Todos los parciales</option>
                                                <option value="1">Primer Parcial</option>
                                                <option value="2">Segundo Parcial</option>
                                                <option value="3">Tercer Parcial</option>
                                            </select>
                                        </div>

                                        <!-- Grupo -->
                                        <div class="mb-3">
                                            <label class="form-label">Grupo</label>
                                            <select class="form-select" id="groupFilter">
                                                <option value="">Todos los grupos</option>
                                            </select>
                                        </div>

                                        <!-- Materia -->
                                        <div class="mb-3">
                                            <label class="form-label">Materia</label>
                                            <select class="form-select" id="subjectFilter">
                                                <option value="">Todas las materias</option>
                                            </select>
                                        </div>

                                        <!-- Alumno Individual -->
                                        <div class="mb-3">
                                            <label class="form-label">Alumno (Opcional)</label>
                                            <input type="text" class="form-control" id="studentFilter"
                                                   placeholder="Buscar alumno...">
                                            <div id="studentSuggestions" class="suggestions-dropdown"></div>
                                        </div>

                                        <!-- Botón Generar -->
                                        <button type="button" class="btn btn-primary w-100" id="generateReportBtn">
                                            <i class="fas fa-chart-bar me-1"></i>Generar Reporte
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Área de Resultados -->
                            <div class="col-lg-8">
                                <div class="card">
                                    <div class="card-header d-flex justify-content-between align-items-center">
                                        <h5 class="mb-0" id="reportTitle">Selecciona un tipo de reporte</h5>
                                        <div class="btn-group" id="exportButtons" style="display: none;">
                                            <button type="button" class="btn btn-sm btn-outline-primary" data-format="pdf">
                                                <i class="fas fa-file-pdf me-1"></i>PDF
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-success" data-format="excel">
                                                <i class="fas fa-file-excel me-1"></i>Excel
                                            </button>
                                            <button type="button" class="btn btn-sm btn-outline-info" data-format="csv">
                                                <i class="fas fa-file-csv me-1"></i>CSV
                                            </button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div id="reportResults">
                                            <div class="text-center text-muted py-5">
                                                <i class="fas fa-chart-bar fa-3x mb-3"></i>
                                                <p>Configura los filtros y genera un reporte para ver los resultados</p>
                                            </div>
                                        </div>
                                        <div id="loadingSpinner" style="display: none;" class="text-center py-5">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Generando reporte...</span>
                                            </div>
                                            <p class="mt-2 text-muted">Generando reporte...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vista de Historial -->
                    <div id="history-view" class="report-view">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Reportes</h5>
                            </div>
                            <div class="card-body">
                                <div id="reportHistory">
                                    <div class="text-center text-muted py-5">
                                        <i class="fas fa-history fa-3x mb-3"></i>
                                        <p>Aquí aparecerán los reportes generados anteriormente</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vista de Estadísticas -->
                    <div id="statistics-view" class="report-view">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">Estadísticas Generales</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="generalStatsChart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h5 class="mb-0">Rendimiento por Materia</h5>
                                    </div>
                                    <div class="card-body">
                                        <canvas id="subjectPerformanceChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadAvailableReports() {
        try {
            // Cargar grupos disponibles
            await this.loadGroups();

            // Cargar materias disponibles
            await this.loadSubjects();

            // Cargar configuraciones según el rol del usuario
            this.setupRoleBasedAccess();

        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }

    async loadGroups() {
        try {
            const response = await fetch('/api/students/groups', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const groups = await response.json();
                const groupSelect = document.getElementById('groupFilter');

                groups.forEach(group => {
                    const option = document.createElement('option');
                    option.value = group.id || group.grupo;
                    option.textContent = group.nombre || `${group.grado}° ${group.grupo}`;
                    groupSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando grupos:', error);
        }
    }

    async loadSubjects() {
        try {
            const response = await fetch('/api/teachers/subjects', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const subjects = await response.json();
                const subjectSelect = document.getElementById('subjectFilter');

                subjects.forEach(subject => {
                    const option = document.createElement('option');
                    option.value = subject.id || subject.codigo;
                    option.textContent = subject.nombre || subject.materia;
                    subjectSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    }

    setupRoleBasedAccess() {
        const reportTypeSelect = document.getElementById('reportType');

        // Configurar acceso según el rol
        switch (this.userRole) {
            case 'docente':
                // Los docentes solo pueden ver reportes de sus materias
                this.hideOptions(['estadisticas-generales', 'comparativo-periodos']);
                break;

            case 'padre':
                // Los padres solo pueden ver reportes de sus hijos
                this.hideOptions(['estadisticas-grupo', 'estadisticas-generales']);
                break;

            case 'alumno':
                // Los alumnos solo pueden ver sus propios reportes
                this.hideOptions(['estadisticas-grupo', 'estadisticas-generales', 'analisis-reprobacion']);
                break;
        }
    }

    hideOptions(optionsToHide) {
        const reportTypeSelect = document.getElementById('reportType');
        optionsToHide.forEach(optionValue => {
            const option = reportTypeSelect.querySelector(`option[value="${optionValue}"]`);
            if (option) {
                option.style.display = 'none';
            }
        });
    }

    async bindEvents() {
        // Navegación entre vistas
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('[data-view]').dataset.view;
                this.switchView(view);
            });
        });

        // Generar reporte
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateReport();
        });

        // Exportar reporte
        document.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.closest('[data-format]').dataset.format;
                this.exportReport(format);
            });
        });

        // Filtro de estudiante con autocompletado
        document.getElementById('studentFilter').addEventListener('input', (e) => {
            this.searchStudents(e.target.value);
        });

        // Cambio de tipo de reporte
        document.getElementById('reportType').addEventListener('change', (e) => {
            this.onReportTypeChange(e.target.value);
        });
    }

    switchView(view) {
        // Actualizar botones activos
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        // Mostrar vista correspondiente
        document.querySelectorAll('.report-view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Cargar contenido específico de la vista
        switch (view) {
            case 'history':
                this.loadReportHistory();
                break;
            case 'statistics':
                this.loadStatistics();
                break;
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        if (!reportType) {
            this.showError('Por favor selecciona un tipo de reporte');
            return;
        }

        const filters = this.getFilters();

        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('reportResults').style.display = 'none';

        try {
            const response = await fetch(`${this.config.apiBase}/generate-report`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportType,
                    filters,
                    userId: this.currentUser.id,
                    userRole: this.userRole
                })
            });

            if (response.ok) {
                const reportData = await response.json();
                this.displayReport(reportData);
                this.saveReportToHistory(reportType, filters, reportData);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Error generando el reporte');
            }
        } catch (error) {
            console.error('Error generando reporte:', error);
            this.showError(`Error generando reporte: ${error.message}`);
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('reportResults').style.display = 'block';
        }
    }

    getFilters() {
        return {
            academicPeriod: document.getElementById('academicPeriod').value,
            partial: document.getElementById('partialFilter').value,
            group: document.getElementById('groupFilter').value,
            subject: document.getElementById('subjectFilter').value,
            student: document.getElementById('studentFilter').value
        };
    }

    displayReport(reportData) {
        const resultsContainer = document.getElementById('reportResults');
        const exportButtons = document.getElementById('exportButtons');
        const reportTitle = document.getElementById('reportTitle');

        // Actualizar título
        reportTitle.textContent = reportData.title || 'Reporte Generado';

        // Mostrar botones de exportación
        exportButtons.style.display = 'block';

        // Guardar datos para exportación
        this.currentReport = reportData;

        // Generar HTML del reporte según el tipo
        let reportHTML = '';

        switch (reportData.type) {
            case 'boletas-calificaciones':
                reportHTML = this.generateGradeReportHTML(reportData);
                break;
            case 'estadisticas-grupo':
                reportHTML = this.generateGroupStatsHTML(reportData);
                break;
            case 'rendimiento-materia':
                reportHTML = this.generateSubjectPerformanceHTML(reportData);
                break;
            case 'seguimiento-alumno':
                reportHTML = this.generateStudentTrackingHTML(reportData);
                break;
            default:
                reportHTML = this.generateGenericReportHTML(reportData);
        }

        resultsContainer.innerHTML = reportHTML;

        // Generar gráficos si es necesario
        if (reportData.charts) {
            setTimeout(() => this.renderCharts(reportData.charts), 100);
        }
    }

    generateGradeReportHTML(reportData) {
        let html = `
            <div class="grade-report">
                <div class="report-summary mb-4">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card bg-primary text-white p-3 rounded">
                                <h4>${reportData.summary.totalStudents}</h4>
                                <small>Estudiantes</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-success text-white p-3 rounded">
                                <h4>${reportData.summary.averageGrade}</h4>
                                <small>Promedio General</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-warning text-white p-3 rounded">
                                <h4>${reportData.summary.passedStudents}</h4>
                                <small>Aprobados</small>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card bg-danger text-white p-3 rounded">
                                <h4>${reportData.summary.failedStudents}</h4>
                                <small>Reprobados</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Estudiante</th>
                                <th>Matrícula</th>
                                <th>Grupo</th>
                                <th>Parcial 1</th>
                                <th>Parcial 2</th>
                                <th>Parcial 3</th>
                                <th>Promedio</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        reportData.data.forEach(student => {
            const status = student.promedio >= 6 ? 'Aprobado' : 'Reprobado';
            const statusClass = student.promedio >= 6 ? 'success' : 'danger';

            html += `
                <tr>
                    <td>${student.nombre}</td>
                    <td>${student.matricula}</td>
                    <td>${student.grupo}</td>
                    <td>${student.parcial1 || 'N/A'}</td>
                    <td>${student.parcial2 || 'N/A'}</td>
                    <td>${student.parcial3 || 'N/A'}</td>
                    <td><strong>${student.promedio}</strong></td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                </tr>
            `;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        return html;
    }

    generateGroupStatsHTML(reportData) {
        return `
            <div class="group-stats">
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6>Distribución de Calificaciones</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="gradeDistributionChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6>Estadísticas por Materia</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="subjectStatsChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-secondary">
                            <tr>
                                <th>Materia</th>
                                <th>Promedio</th>
                                <th>Aprobados</th>
                                <th>Reprobados</th>
                                <th>% Aprobación</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.subjects.map(subject => `
                                <tr>
                                    <td>${subject.nombre}</td>
                                    <td>${subject.promedio}</td>
                                    <td>${subject.aprobados}</td>
                                    <td>${subject.reprobados}</td>
                                    <td>${subject.porcentajeAprobacion}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateSubjectPerformanceHTML(reportData) {
        return `
            <div class="subject-performance">
                <h5 class="mb-3">Rendimiento: ${reportData.subjectName}</h5>

                <div class="row mb-4">
                    <div class="col-md-12">
                        <canvas id="performanceChart" width="800" height="300"></canvas>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-info">
                            <tr>
                                <th>Estudiante</th>
                                <th>Grupo</th>
                                <th>Parcial 1</th>
                                <th>Parcial 2</th>
                                <th>Parcial 3</th>
                                <th>Promedio</th>
                                <th>Tendencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.students.map(student => {
                                const trend = this.calculateTrend(student);
                                return `
                                    <tr>
                                        <td>${student.nombre}</td>
                                        <td>${student.grupo}</td>
                                        <td>${student.parcial1 || 'N/A'}</td>
                                        <td>${student.parcial2 || 'N/A'}</td>
                                        <td>${student.parcial3 || 'N/A'}</td>
                                        <td><strong>${student.promedio}</strong></td>
                                        <td>
                                            <span class="trend-indicator ${trend.class}">
                                                <i class="fas fa-${trend.icon}"></i>
                                                ${trend.text}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateStudentTrackingHTML(reportData) {
        return `
            <div class="student-tracking">
                <div class="student-info mb-4">
                    <h5>${reportData.student.nombre}</h5>
                    <p class="text-muted">Matrícula: ${reportData.student.matricula} | Grupo: ${reportData.student.grupo}</p>
                </div>

                <div class="row mb-4">
                    <div class="col-md-8">
                        <div class="card">
                            <div class="card-header">
                                <h6>Evolución Académica</h6>
                            </div>
                            <div class="card-body">
                                <canvas id="studentEvolutionChart" width="600" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-header">
                                <h6>Resumen Académico</h6>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label small">Promedio General</label>
                                    <h4 class="text-primary">${reportData.student.promedioGeneral}</h4>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Materias Aprobadas</label>
                                    <h5 class="text-success">${reportData.student.materiasAprobadas}</h5>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Materias en Riesgo</label>
                                    <h5 class="text-warning">${reportData.student.materiasRiesgo}</h5>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small">Asistencia</label>
                                    <h5 class="text-info">${reportData.student.asistencia}%</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Materia</th>
                                <th>Docente</th>
                                <th>P1</th>
                                <th>P2</th>
                                <th>P3</th>
                                <th>Promedio</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.student.materias.map(materia => {
                                const status = materia.promedio >= 6 ? 'Aprobado' : 'Reprobado';
                                const statusClass = materia.promedio >= 6 ? 'success' : 'danger';

                                return `
                                    <tr>
                                        <td>${materia.nombre}</td>
                                        <td>${materia.docente}</td>
                                        <td>${materia.parcial1 || 'N/A'}</td>
                                        <td>${materia.parcial2 || 'N/A'}</td>
                                        <td>${materia.parcial3 || 'N/A'}</td>
                                        <td><strong>${materia.promedio}</strong></td>
                                        <td><span class="badge bg-${statusClass}">${status}</span></td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateGenericReportHTML(reportData) {
        return `
            <div class="generic-report">
                <div class="alert alert-info">
                    <h6>${reportData.title}</h6>
                    <p>${reportData.description}</p>
                </div>

                <pre class="bg-light p-3 rounded">
                    ${JSON.stringify(reportData, null, 2)}
                </pre>
            </div>
        `;
    }

    calculateTrend(student) {
        const grades = [student.parcial1, student.parcial2, student.parcial3].filter(g => g !== null && g !== undefined);

        if (grades.length < 2) {
            return { class: 'text-muted', icon: 'minus', text: 'Sin datos' };
        }

        const first = grades[0];
        const last = grades[grades.length - 1];
        const diff = last - first;

        if (diff > 0.5) {
            return { class: 'text-success', icon: 'arrow-up', text: 'Mejorando' };
        } else if (diff < -0.5) {
            return { class: 'text-danger', icon: 'arrow-down', text: 'Bajando' };
        } else {
            return { class: 'text-warning', icon: 'arrow-right', text: 'Estable' };
        }
    }

    async exportReport(format) {
        if (!this.currentReport) {
            this.showError('No hay reporte para exportar');
            return;
        }

        try {
            const response = await fetch(`${this.config.apiBase}/export-report`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reportData: this.currentReport,
                    format: format,
                    userId: this.currentUser.id
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `reporte_${Date.now()}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess(`Reporte exportado en formato ${format.toUpperCase()}`);
            } else {
                throw new Error('Error en la exportación');
            }
        } catch (error) {
            console.error('Error exportando reporte:', error);
            this.showError(`Error exportando reporte: ${error.message}`);
        }
    }

    async searchStudents(query) {
        if (query.length < 2) {
            document.getElementById('studentSuggestions').innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const students = await response.json();
                this.displayStudentSuggestions(students);
            }
        } catch (error) {
            console.error('Error buscando estudiantes:', error);
        }
    }

    displayStudentSuggestions(students) {
        const suggestions = document.getElementById('studentSuggestions');

        if (students.length === 0) {
            suggestions.innerHTML = '';
            return;
        }

        const html = students.map(student => `
            <div class="suggestion-item p-2 border-bottom" data-student-id="${student.id}" data-student-name="${student.nombre}">
                <strong>${student.nombre}</strong><br>
                <small class="text-muted">${student.matricula} - ${student.grupo}</small>
            </div>
        `).join('');

        suggestions.innerHTML = html;
        suggestions.style.display = 'block';

        // Agregar eventos de clic
        suggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const studentName = e.currentTarget.dataset.studentName;
                document.getElementById('studentFilter').value = studentName;
                suggestions.style.display = 'none';
            });
        });
    }

    onReportTypeChange(reportType) {
        const title = this.getReportTitle(reportType);
        document.getElementById('reportTitle').textContent = title;

        // Limpiar resultados anteriores
        document.getElementById('reportResults').innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-chart-bar fa-3x mb-3"></i>
                <p>Configura los filtros y genera el reporte "${title}" para ver los resultados</p>
            </div>
        `;

        document.getElementById('exportButtons').style.display = 'none';
    }

    getReportTitle(reportType) {
        const titles = {
            'boletas-calificaciones': 'Boletas de Calificaciones',
            'estadisticas-grupo': 'Estadísticas por Grupo',
            'rendimiento-materia': 'Rendimiento por Materia',
            'seguimiento-alumno': 'Seguimiento de Alumno',
            'comparativo-periodos': 'Comparativo de Períodos',
            'reporte-asistencias': 'Reporte de Asistencias',
            'analisis-reprobacion': 'Análisis de Reprobación',
            'estadisticas-generales': 'Estadísticas Generales'
        };

        return titles[reportType] || 'Reporte Personalizado';
    }

    saveReportToHistory(reportType, filters, reportData) {
        const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');

        history.unshift({
            id: Date.now(),
            type: reportType,
            title: this.getReportTitle(reportType),
            filters: filters,
            data: reportData,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser.nombre
        });

        // Mantener solo los últimos 20 reportes
        if (history.length > 20) {
            history.splice(20);
        }

        localStorage.setItem('reportHistory', JSON.stringify(history));
    }

    loadReportHistory() {
        const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
        const historyContainer = document.getElementById('reportHistory');

        if (history.length === 0) {
            historyContainer.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-history fa-3x mb-3"></i>
                    <p>No hay reportes generados anteriormente</p>
                </div>
            `;
            return;
        }

        const html = history.map(report => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="card-title">${report.title}</h6>
                            <p class="card-text text-muted small">
                                Generado el ${new Date(report.createdAt).toLocaleString()}
                                por ${report.createdBy}
                            </p>
                            <div class="d-flex gap-2 flex-wrap">
                                ${Object.entries(report.filters).map(([key, value]) =>
                                    value ? `<span class="badge bg-secondary">${key}: ${value}</span>` : ''
                                ).filter(Boolean).join('')}
                            </div>
                        </div>
                        <div class="btn-group-vertical">
                            <button type="button" class="btn btn-sm btn-outline-primary"
                                    onclick="academicReports.loadHistoryReport(${report.id})">
                                <i class="fas fa-eye me-1"></i>Ver
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-success"
                                    onclick="academicReports.exportHistoryReport(${report.id})">
                                <i class="fas fa-download me-1"></i>Exportar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        historyContainer.innerHTML = html;
    }

    loadHistoryReport(reportId) {
        const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
        const report = history.find(r => r.id === reportId);

        if (report) {
            this.switchView('generator');
            this.currentReport = report.data;
            this.displayReport(report.data);
        }
    }

    exportHistoryReport(reportId) {
        const history = JSON.parse(localStorage.getItem('reportHistory') || '[]');
        const report = history.find(r => r.id === reportId);

        if (report) {
            this.currentReport = report.data;
            this.exportReport('pdf'); // Por defecto PDF
        }
    }

    async loadStatistics() {
        try {
            const response = await fetch(`${this.config.apiBase}/general-statistics`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.renderGeneralStatistics(stats);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    renderGeneralStatistics(stats) {
        // Renderizar gráficos de estadísticas generales
        setTimeout(() => {
            this.renderChart('generalStatsChart', stats.general);
            this.renderChart('subjectPerformanceChart', stats.subjects);
        }, 100);
    }

    renderChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Aquí integrarías Chart.js o similar
        console.log(`Renderizando gráfico ${canvasId} con datos:`, data);
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Crear toast notification
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 5000);
    }

    destroy() {
        // Limpiar recursos si es necesario
        console.log('🧹 Limpiando Sistema de Reportes Académicos...');
    }
}

// Inicializar automáticamente si el contenedor existe
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('academic-reports-container')) {
        window.academicReports = new AcademicReportsManager();
    }
});

// Exportar para uso global
window.AcademicReportsManager = AcademicReportsManager;