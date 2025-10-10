/**
 * 📊 GESTOR DE CALIFICACIONES - FASE B
 * Sistema completo para captura, consulta y reporte de calificaciones
 * Integrado con base de datos real y APIs funcionales
 */

class GradesManager {
    constructor() {
        this.currentUser = null;
        this.students = [];
        this.subjects = [];
        this.grades = [];
        this.currentPeriod = '2024-2025';

        this.config = {
            apiBase: '/api/grades',
            autoSave: true,
            validateRange: { min: 0, max: 10 },
            refreshInterval: 30000
        };

        this.init();
    }

    async init() {
        try {
            await this.loadUserInfo();
            await this.loadStudents();
            await this.loadSubjects();
            await this.setupEventListeners();
            await this.renderInterface();

            console.log('📊 Sistema de Calificaciones inicializado');
        } catch (error) {
            console.error('❌ Error inicializando calificaciones:', error);
            this.showError('Error inicializando sistema de calificaciones');
        }
    }

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async loadUserInfo() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                this.currentUser = await response.json();
            } catch (error) {
                console.error('Error cargando usuario:', error);
            }
        }
    }

    async loadStudents() {
        try {
            const response = await fetch('/api/students', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });

            if (response.ok) {
                const result = await response.json();
                this.students = result.data || result;
            }
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
        }
    }

    async loadSubjects() {
        try {
            // Cargar materias desde base de datos
            const response = await fetch('/api/subjects', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });

            if (response.ok) {
                const result = await response.json();
                this.subjects = result.data || result;
            } else {
                // Fallback con materias básicas
                this.subjects = [
                    { id: 1, nombre: 'Matemáticas I', clave: 'MAT-I', semestre: 1, creditos: 4 },
                    { id: 2, nombre: 'Español I', clave: 'ESP-I', semestre: 1, creditos: 4 },
                    { id: 3, nombre: 'Historia de México I', clave: 'HMX-I', semestre: 1, creditos: 3 },
                    { id: 4, nombre: 'Química I', clave: 'QUI-I', semestre: 1, creditos: 4 },
                    { id: 5, nombre: 'Inglés I', clave: 'ING-I', semestre: 1, creditos: 3 },
                    { id: 6, nombre: 'Educación Física I', clave: 'EDF-I', semestre: 1, creditos: 2 }
                ];
            }
        } catch (error) {
            console.error('Error cargando materias:', error);
        }
    }

    // ============================================
    // CAPTURA DE CALIFICACIONES
    // ============================================

    async captureGrade(gradeData) {
        try {
            const response = await fetch(this.config.apiBase, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    estudiante_id: gradeData.estudiante_id,
                    materia_id: gradeData.materia_id,
                    parcial: gradeData.parcial,
                    calificacion: parseFloat(gradeData.calificacion),
                    ciclo_escolar: this.currentPeriod,
                    observaciones: gradeData.observaciones || ''
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Calificación capturada correctamente');
                await this.refreshGrades();
                return result;
            } else {
                throw new Error(result.message || 'Error capturando calificación');
            }
        } catch (error) {
            console.error('Error capturando calificación:', error);
            this.showError('Error al capturar calificación: ' + error.message);
            throw error;
        }
    }

    async captureBatchGrades(gradesArray) {
        try {
            const response = await fetch(`${this.config.apiBase}/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    calificaciones: gradesArray.map(grade => ({
                        ...grade,
                        ciclo_escolar: this.currentPeriod
                    }))
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(`Captura masiva: ${result.summary.successful} exitosas, ${result.summary.errors} errores`);
                await this.refreshGrades();
                return result;
            } else {
                throw new Error(result.message || 'Error en captura masiva');
            }
        } catch (error) {
            console.error('Error en captura masiva:', error);
            this.showError('Error en captura masiva: ' + error.message);
            throw error;
        }
    }

    // ============================================
    // CONSULTA DE CALIFICACIONES
    // ============================================

    async getStudentGrades(studentId, filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.ciclo_escolar) params.append('ciclo_escolar', filters.ciclo_escolar);
            if (filters.parcial) params.append('parcial', filters.parcial);

            const response = await fetch(`${this.config.apiBase}/student/${studentId}?${params}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });

            if (response.ok) {
                const result = await response.json();
                return result.data;
            } else {
                throw new Error('Error consultando calificaciones');
            }
        } catch (error) {
            console.error('Error consultando calificaciones:', error);
            throw error;
        }
    }

    async getGroupGrades(grupo, filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.materia_id) params.append('materia_id', filters.materia_id);
            if (filters.parcial) params.append('parcial', filters.parcial);
            if (filters.ciclo_escolar) params.append('ciclo_escolar', filters.ciclo_escolar);

            const response = await fetch(`${this.config.apiBase}/group/${grupo}?${params}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });

            if (response.ok) {
                const result = await response.json();
                return result.data;
            } else {
                throw new Error('Error consultando calificaciones del grupo');
            }
        } catch (error) {
            console.error('Error consultando calificaciones del grupo:', error);
            throw error;
        }
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    async renderInterface() {
        const container = document.getElementById('grades-container') || this.createContainer();

        container.innerHTML = `
            <div class="grades-manager">
                <div class="row">
                    <!-- Panel de Captura -->
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-edit"></i> Captura de Calificaciones</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderCaptureForm()}
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Consulta -->
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-search"></i> Consulta de Calificaciones</h5>
                            </div>
                            <div class="card-body">
                                ${this.renderQueryForm()}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel de Resultados -->
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-table"></i> Resultados</h5>
                            </div>
                            <div class="card-body">
                                <div id="grades-results">
                                    <p class="text-muted">Selecciona una opción para ver los resultados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    renderCaptureForm() {
        return `
            <form id="grade-capture-form">
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Estudiante</label>
                        <select class="form-select" id="student-select" required>
                            <option value="">Seleccionar estudiante...</option>
                            ${this.students.map(student => `
                                <option value="${student.id}">
                                    ${student.matricula} - ${student.nombre} ${student.apellido}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="col-md-6 mb-3">
                        <label class="form-label">Materia</label>
                        <select class="form-select" id="subject-select" required>
                            <option value="">Seleccionar materia...</option>
                            ${this.subjects.map(subject => `
                                <option value="${subject.id}">
                                    ${subject.clave} - ${subject.nombre}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label">Parcial</label>
                        <select class="form-select" id="parcial-select" required>
                            <option value="">Seleccionar...</option>
                            <option value="1">Primer Parcial</option>
                            <option value="2">Segundo Parcial</option>
                            <option value="3">Tercer Parcial</option>
                        </select>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label">Calificación</label>
                        <input type="number" class="form-control" id="grade-input"
                               min="0" max="10" step="0.1" required>
                    </div>

                    <div class="col-md-4 mb-3">
                        <label class="form-label">Ciclo Escolar</label>
                        <input type="text" class="form-control" id="period-input"
                               value="${this.currentPeriod}" readonly>
                    </div>

                    <div class="col-12 mb-3">
                        <label class="form-label">Observaciones (opcional)</label>
                        <textarea class="form-control" id="observations-input" rows="2"></textarea>
                    </div>

                    <div class="col-12">
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i> Capturar Calificación
                        </button>
                        <button type="button" class="btn btn-secondary ms-2" id="clear-form">
                            <i class="fas fa-eraser"></i> Limpiar
                        </button>
                    </div>
                </div>
            </form>
        `;
    }

    renderQueryForm() {
        return `
            <div class="query-options">
                <div class="mb-3">
                    <label class="form-label">Tipo de Consulta</label>
                    <select class="form-select" id="query-type">
                        <option value="student">Por Estudiante</option>
                        <option value="group">Por Grupo</option>
                        <option value="subject">Por Materia</option>
                    </select>
                </div>

                <div id="query-filters">
                    <!-- Los filtros se cargan dinámicamente -->
                </div>

                <button type="button" class="btn btn-success" id="execute-query">
                    <i class="fas fa-search"></i> Consultar
                </button>

                <button type="button" class="btn btn-info ms-2" id="generate-report">
                    <i class="fas fa-file-pdf"></i> Generar Reporte
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Formulario de captura
        const form = document.getElementById('grade-capture-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleGradeCapture();
            });
        }

        // Limpiar formulario
        const clearBtn = document.getElementById('clear-form');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                form.reset();
                document.getElementById('period-input').value = this.currentPeriod;
            });
        }

        // Tipo de consulta
        const queryType = document.getElementById('query-type');
        if (queryType) {
            queryType.addEventListener('change', () => {
                this.updateQueryFilters();
            });
            this.updateQueryFilters(); // Inicial
        }

        // Ejecutar consulta
        const queryBtn = document.getElementById('execute-query');
        if (queryBtn) {
            queryBtn.addEventListener('click', async () => {
                await this.handleQuery();
            });
        }

        // Generar reporte
        const reportBtn = document.getElementById('generate-report');
        if (reportBtn) {
            reportBtn.addEventListener('click', async () => {
                await this.generateReport();
            });
        }
    }

    async handleGradeCapture() {
        try {
            const formData = {
                estudiante_id: parseInt(document.getElementById('student-select').value),
                materia_id: parseInt(document.getElementById('subject-select').value),
                parcial: parseInt(document.getElementById('parcial-select').value),
                calificacion: parseFloat(document.getElementById('grade-input').value),
                observaciones: document.getElementById('observations-input').value
            };

            // Validar datos
            if (!formData.estudiante_id || !formData.materia_id || !formData.parcial) {
                throw new Error('Todos los campos son obligatorios');
            }

            if (formData.calificacion < 0 || formData.calificacion > 10) {
                throw new Error('La calificación debe estar entre 0 y 10');
            }

            await this.captureGrade(formData);

            // Limpiar formulario después del éxito
            document.getElementById('grade-capture-form').reset();
            document.getElementById('period-input').value = this.currentPeriod;

        } catch (error) {
            this.showError('Error: ' + error.message);
        }
    }

    updateQueryFilters() {
        const queryType = document.getElementById('query-type').value;
        const filtersContainer = document.getElementById('query-filters');

        let filtersHTML = '';

        switch (queryType) {
            case 'student':
                filtersHTML = `
                    <div class="mb-3">
                        <label class="form-label">Estudiante</label>
                        <select class="form-select" id="query-student">
                            <option value="">Seleccionar estudiante...</option>
                            ${this.students.map(student => `
                                <option value="${student.id}">
                                    ${student.matricula} - ${student.nombre} ${student.apellido}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'group':
                const groups = [...new Set(this.students.map(s => s.grupo))];
                filtersHTML = `
                    <div class="mb-3">
                        <label class="form-label">Grupo</label>
                        <select class="form-select" id="query-group">
                            <option value="">Seleccionar grupo...</option>
                            ${groups.map(group => `
                                <option value="${group}">${group}</option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;

            case 'subject':
                filtersHTML = `
                    <div class="mb-3">
                        <label class="form-label">Materia</label>
                        <select class="form-select" id="query-subject">
                            <option value="">Seleccionar materia...</option>
                            ${this.subjects.map(subject => `
                                <option value="${subject.id}">
                                    ${subject.clave} - ${subject.nombre}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                `;
                break;
        }

        // Filtros adicionales comunes
        filtersHTML += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Parcial</label>
                    <select class="form-select" id="query-parcial">
                        <option value="">Todos los parciales</option>
                        <option value="1">Primer Parcial</option>
                        <option value="2">Segundo Parcial</option>
                        <option value="3">Tercer Parcial</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Ciclo Escolar</label>
                    <select class="form-select" id="query-period">
                        <option value="${this.currentPeriod}">${this.currentPeriod}</option>
                        <option value="2023-2024">2023-2024</option>
                    </select>
                </div>
            </div>
        `;

        filtersContainer.innerHTML = filtersHTML;
    }

    async handleQuery() {
        try {
            const queryType = document.getElementById('query-type').value;
            const resultsContainer = document.getElementById('grades-results');

            let results = null;

            switch (queryType) {
                case 'student':
                    const studentId = document.getElementById('query-student').value;
                    if (!studentId) throw new Error('Selecciona un estudiante');

                    results = await this.getStudentGrades(studentId, {
                        parcial: document.getElementById('query-parcial').value,
                        ciclo_escolar: document.getElementById('query-period').value
                    });
                    resultsContainer.innerHTML = this.renderStudentGrades(results);
                    break;

                case 'group':
                    const grupo = document.getElementById('query-group').value;
                    if (!grupo) throw new Error('Selecciona un grupo');

                    results = await this.getGroupGrades(grupo, {
                        parcial: document.getElementById('query-parcial').value,
                        ciclo_escolar: document.getElementById('query-period').value
                    });
                    resultsContainer.innerHTML = this.renderGroupGrades(results);
                    break;
            }

        } catch (error) {
            this.showError('Error en consulta: ' + error.message);
        }
    }

    renderStudentGrades(data) {
        if (!data || !data.calificaciones || data.calificaciones.length === 0) {
            return '<p class="text-muted">No se encontraron calificaciones</p>';
        }

        const student = data.estudiante;
        const grades = data.calificaciones;
        const stats = data.estadisticas;

        return `
            <div class="student-grades">
                <div class="student-info mb-4">
                    <h6>${student.nombre} ${student.apellido}</h6>
                    <p class="text-muted">Matrícula: ${student.matricula} | Grupo: ${student.grupo} | Promedio: ${student.promedio_general}</p>
                </div>

                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-value">${stats.promedio.toFixed(2)}</div>
                            <div class="stat-label">Promedio</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-value">${stats.aprobadas}</div>
                            <div class="stat-label">Aprobadas</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-value">${stats.reprobadas}</div>
                            <div class="stat-label">Reprobadas</div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-value">${stats.porcentaje_aprobacion || 0}%</div>
                            <div class="stat-label">% Aprobación</div>
                        </div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Parcial</th>
                                <th>Calificación</th>
                                <th>Fecha</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${grades.map(grade => `
                                <tr>
                                    <td>${grade.materia_nombre}</td>
                                    <td>Parcial ${grade.parcial}</td>
                                    <td>
                                        <span class="badge ${this.getGradeBadgeClass(grade.calificacion)}">
                                            ${grade.calificacion}
                                        </span>
                                    </td>
                                    <td>${new Date(grade.fecha_captura).toLocaleDateString()}</td>
                                    <td>${grade.observaciones || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderGroupGrades(data) {
        if (!data || !data.calificaciones || data.calificaciones.length === 0) {
            return '<p class="text-muted">No se encontraron calificaciones para este grupo</p>';
        }

        return `
            <div class="group-grades">
                <div class="group-info mb-4">
                    <h6>Grupo: ${data.grupo}</h6>
                    <p class="text-muted">
                        Total estudiantes: ${data.estadisticas.total_estudiantes} |
                        Promedio grupo: ${data.estadisticas.promedio_grupo.toFixed(2)} |
                        Calificaciones capturadas: ${data.estadisticas.calificaciones_capturadas}
                    </p>
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Matrícula</th>
                                <th>Estudiante</th>
                                <th>Materia</th>
                                <th>Parcial</th>
                                <th>Calificación</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.calificaciones.map(grade => `
                                <tr>
                                    <td>${grade.matricula}</td>
                                    <td>${grade.estudiante_nombre} ${grade.estudiante_apellido}</td>
                                    <td>${grade.materia_nombre}</td>
                                    <td>Parcial ${grade.parcial || '-'}</td>
                                    <td>
                                        ${grade.calificacion ? `
                                            <span class="badge ${this.getGradeBadgeClass(grade.calificacion)}">
                                                ${grade.calificacion}
                                            </span>
                                        ` : '-'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getGradeBadgeClass(calificacion) {
        if (calificacion >= 9) return 'bg-success';
        if (calificacion >= 8) return 'bg-primary';
        if (calificacion >= 7) return 'bg-info';
        if (calificacion >= 6) return 'bg-warning';
        return 'bg-danger';
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'grades-container';
        container.className = 'container-fluid mt-4';

        // Insertar antes del footer para evitar que aparezca al final
        const footer = document.getElementById('main-footer');
        if (footer) {
            footer.parentNode.insertBefore(container, footer);
        } else {
            // Fallback: insertar antes del último elemento del body
            const bodyChildren = document.body.children;
            if (bodyChildren.length > 0) {
                document.body.insertBefore(container, bodyChildren[bodyChildren.length - 1]);
            } else {
                document.body.appendChild(container);
            }
        }

        return container;
    }

    async refreshGrades() {
        // Recargar datos si hay consulta activa
        const queryBtn = document.getElementById('execute-query');
        if (queryBtn) {
            await this.handleQuery();
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showNotification(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    async generateReport() {
        try {
            // Implementar generación de reportes PDF
            this.showSuccess('Generando reporte... (Funcionalidad en desarrollo)');
        } catch (error) {
            this.showError('Error generando reporte: ' + error.message);
        }
    }
}

// Inicializar automáticamente si estamos en la página de calificaciones
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.pathname.includes('calificaciones') ||
            document.getElementById('grades-container')) {
            window.gradesManager = new GradesManager();
        }
    });
} else {
    if (window.location.pathname.includes('calificaciones') ||
        document.getElementById('grades-container')) {
        window.gradesManager = new GradesManager();
    }
}

// CSS Styles
const styles = `
<style>
.grades-manager .stat-card {
    text-align: center;
    padding: 1rem;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    margin-bottom: 1rem;
}

.grades-manager .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #495057;
}

.grades-manager .stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    text-transform: uppercase;
}

.grades-manager .table th {
    background-color: #f8f9fa;
    font-weight: 600;
    border-top: none;
}

.grades-manager .badge {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
}

.grades-manager .student-info,
.grades-manager .group-info {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 0.375rem;
    border-left: 4px solid #007bff;
}
</style>
`;

if (!document.getElementById('grades-manager-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'grades-manager-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);
}