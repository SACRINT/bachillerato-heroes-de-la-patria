/**
 * 🎓 DASHBOARD ESTUDIANTIL - Sistema Integrado
 * Maneja la interfaz y funcionalidades del dashboard estudiantil
 */

class StudentDashboard {
    constructor() {
        try {
            console.log('🎓 [DASHBOARD] Inicializando dashboard estudiantil...');
            this.apiBase = 'http://localhost:3000/api/students/';
            this.authToken = localStorage.getItem('student_auth_token');
            this.currentStudent = JSON.parse(localStorage.getItem('current_student') || 'null');

            this.init();
        } catch (error) {
            console.error('❌ Error inicializando StudentDashboard:', error);
            this.fallbackInitialization();
        }
    }

    fallbackInitialization() {
        console.log('🔄 [DASHBOARD] Iniciando modo de respaldo...');
        this.apiBase = 'http://localhost:3000/api/students/';
        this.authToken = null;
        this.currentStudent = null;
        // NO mostrar modal automáticamente en modo de respaldo
        console.log('ℹ️ Modo de respaldo iniciado. Use el botón para login.');
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        console.log('✅ [DASHBOARD] Dashboard estudiantil inicializado');
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('studentLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Refresh buttons
        document.querySelectorAll('.refresh-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRefresh(e));
        });

        // Notification interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.notification-item')) {
                this.markNotificationAsRead(e.target.closest('.notification-item'));
            }
        });
    }

    async checkAuthentication() {
        if (!this.authToken || !this.currentStudent) {
            // NO mostrar modal automáticamente, solo verificar estado
            console.log('ℹ️ Usuario no autenticado');
            return false;
        }

        try {
            // Si hay token, cargar dashboard directamente
            this.loadDashboard();
            return true;
        } catch (error) {
            console.error('❌ Error verificando autenticación:', error);
            this.clearAuth();
            return false;
        }
    }

    showLoginModal() {
        const loginModalHtml = `
            <div class="modal fade" id="studentLoginModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-user-graduate me-2"></i>
                                Acceso Estudiantil
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <form id="studentLoginForm">
                                <div class="mb-3">
                                    <label for="matricula" class="form-label">Matrícula</label>
                                    <input type="text" class="form-control" id="matricula" required
                                           placeholder="Ej: 2025-0001" value="2025-0001">
                                </div>
                                <div class="mb-3">
                                    <label for="password" class="form-label">Contraseña</label>
                                    <input type="password" class="form-control" id="password" required
                                           placeholder="Tu contraseña" value="student123">
                                </div>
                                <div class="alert alert-info small">
                                    <i class="fas fa-info-circle me-2"></i>
                                    <strong>Credenciales de prueba:</strong><br>
                                    Matrícula: 2025-0001<br>
                                    Contraseña: student123
                                </div>
                                <div id="loginError" class="alert alert-danger d-none"></div>
                                <button type="submit" class="btn btn-primary w-100">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Ingresar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existingModal = document.getElementById('studentLoginModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', loginModalHtml);

        // Mostrar modal de forma segura
        try {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(document.getElementById('studentLoginModal'));
                modal.show();
            } else {
                console.warn('⚠️ Bootstrap no disponible, mostrando modal con fallback');
                document.getElementById('studentLoginModal').style.display = 'block';
                document.getElementById('studentLoginModal').classList.add('show');
            }
        } catch (error) {
            console.error('❌ Error mostrando modal:', error);
        }

        // Setup form listener
        document.getElementById('studentLoginForm').addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();

        const matricula = document.getElementById('matricula').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');

        try {
            loginError.classList.add('d-none');

            // Verificar credenciales de demo
            if (matricula === '2025-0001' && password === 'student123') {
                // Simular datos de estudiante exitoso
                const mockStudentData = {
                    token: 'mock_token_' + Date.now(),
                    student: {
                        id: 1,
                        matricula: '2025-0001',
                        nombre: 'Juan Carlos Pérez',
                        grupo: '5°A',
                        especialidad: 'Programación',
                        semestre: 5,
                        email: 'juan.perez@estudiante.edu.mx'
                    }
                };

                // Guardar datos de autenticación
                localStorage.setItem('student_auth_token', mockStudentData.token);
                localStorage.setItem('current_student', JSON.stringify(mockStudentData.student));

                this.authToken = mockStudentData.token;
                this.currentStudent = mockStudentData.student;

                // Cerrar modal y cargar dashboard
                try {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('studentLoginModal'));
                        if (modal) modal.hide();
                    } else {
                        document.getElementById('studentLoginModal').style.display = 'none';
                        document.getElementById('studentLoginModal').classList.remove('show');
                    }
                } catch (error) {
                    console.warn('⚠️ Error cerrando modal:', error);
                }

                // Ocultar el prompt de login
                if (typeof hideLoginPrompt === 'function') {
                    hideLoginPrompt();
                }

                this.showNotification('¡Bienvenido al dashboard estudiantil!', 'success');
                this.loadDashboard();
            } else {
                loginError.textContent = 'Credenciales incorrectas. Usa: Matrícula: 2025-0001, Contraseña: student123';
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            loginError.textContent = 'Error de conexión. Usando modo demo.';
            loginError.classList.remove('d-none');
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            this.clearAuth();

            // Limpiar inmediatamente el dashboard y mostrar botón de login
            this.resetToInitialState();

            this.showNotification('Sesión cerrada exitosamente', 'success');
        }
    }

    resetToInitialState() {
        console.log('🔄 Restableciendo estado inicial del dashboard...');

        // Limpiar el contenedor del dashboard
        const dashboardContainer = document.getElementById('dashboardContainer');
        if (dashboardContainer) {
            // Restaurar el HTML inicial con el botón de login
            dashboardContainer.innerHTML = `
                <!-- Estado inicial: Botón para acceder al dashboard -->
                <div id="loginPrompt" class="text-center py-5">
                    <div class="card border-0 shadow-sm mx-auto" style="max-width: 400px;">
                        <div class="card-body p-4">
                            <div class="mb-3">
                                <i class="fas fa-user-graduate fa-3x text-primary mb-3"></i>
                            </div>
                            <h5 class="card-title text-primary mb-3">Accede a tu Dashboard</h5>
                            <p class="text-muted mb-4">Inicia sesión para ver tu información académica personalizada</p>
                            <button class="btn btn-primary btn-lg" onclick="showStudentLogin()">
                                <i class="fas fa-sign-in-alt me-2"></i>
                                Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
                <!-- El dashboard se cargará dinámicamente aquí después del login -->
            `;
        }

        // Remover cualquier modal de login que pueda estar abierto
        const existingModal = document.getElementById('studentLoginModal');
        if (existingModal) {
            existingModal.remove();
        }
    }

    clearAuth() {
        localStorage.removeItem('student_auth_token');
        localStorage.removeItem('current_student');
        this.authToken = null;
        this.currentStudent = null;
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            }
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.apiBase}${endpoint}`, config);
        return await response.json();
    }

    async loadDashboard() {
        try {
            console.log('📊 [DASHBOARD] Cargando datos del dashboard...');

            // Mostrar loading
            this.showLoading();

            // Usar datos simulados para demostración
            const mockDashboardData = {
                success: true,
                data: {
                    profile: this.currentStudent,
                    statistics: {
                        promedio_general: 8.7,
                        tareas_pendientes: 3,
                        notificaciones_nuevas: 2,
                        materias_cursando: 8
                    },
                    recent_grades: [
                        { materia: 'Matemáticas III', promedio: 9.2 },
                        { materia: 'Física III', promedio: 8.5 },
                        { materia: 'Química III', promedio: 8.9 },
                        { materia: 'Programación', promedio: 9.5 }
                    ],
                    pending_assignments: [
                        {
                            titulo: 'Ejercicios de derivadas',
                            materia: 'Matemáticas III',
                            fecha_entrega: '2025-09-30',
                            prioridad: 'alta'
                        },
                        {
                            titulo: 'Práctica de laboratorio',
                            materia: 'Química III',
                            fecha_entrega: '2025-10-02',
                            prioridad: 'media'
                        }
                    ],
                    recent_notifications: [
                        {
                            id: 1,
                            titulo: 'Nueva tarea asignada',
                            mensaje: 'Se ha asignado una nueva tarea en Matemáticas III',
                            fecha: '2025-09-28',
                            tipo: 'assignment',
                            leido: false
                        },
                        {
                            id: 2,
                            titulo: 'Calificación publicada',
                            mensaje: 'Nueva calificación disponible en Física III',
                            fecha: '2025-09-27',
                            tipo: 'grade',
                            leido: false
                        }
                    ]
                }
            };

            this.renderDashboard(mockDashboardData.data);
        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showNotification('Error cargando dashboard', 'error');
        }
    }

    showLoading() {
        const container = document.getElementById('dashboardContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-muted">Cargando tu dashboard...</p>
                </div>
            `;
        }
    }

    renderDashboard(data) {
        const container = document.getElementById('dashboardContainer');
        if (!container) return;

        const { profile, statistics, recent_grades, pending_assignments, recent_notifications } = data;

        const dashboardHtml = `
            <!-- Header del estudiante -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card border-0 shadow-sm bg-gradient-primary text-white">
                        <div class="card-body p-4">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <h2 class="mb-2">¡Hola, ${profile.nombre}!</h2>
                                    <p class="mb-1 opacity-75">
                                        <i class="fas fa-id-card me-2"></i>
                                        Matrícula: ${profile.matricula} | Grupo: ${profile.grupo}
                                    </p>
                                    <p class="mb-0 opacity-75">
                                        <i class="fas fa-graduation-cap me-2"></i>
                                        ${profile.especialidad} - Semestre ${profile.semestre}
                                    </p>
                                </div>
                                <div class="col-md-4 text-center">
                                    <div class="student-avatar mb-2">
                                        <i class="fas fa-user-circle" style="font-size: 4rem;"></i>
                                    </div>
                                    <button class="btn btn-outline-light btn-sm logout-btn">
                                        <i class="fas fa-sign-out-alt me-1"></i>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="stat-icon bg-primary text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                <i class="fas fa-chart-line fa-lg"></i>
                            </div>
                            <h3 class="text-primary mb-1">${statistics.promedio_general.toFixed(1)}</h3>
                            <p class="text-muted mb-0">Promedio General</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="stat-icon bg-warning text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                <i class="fas fa-tasks fa-lg"></i>
                            </div>
                            <h3 class="text-warning mb-1">${statistics.tareas_pendientes}</h3>
                            <p class="text-muted mb-0">Tareas Pendientes</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="stat-icon bg-info text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                <i class="fas fa-bell fa-lg"></i>
                            </div>
                            <h3 class="text-info mb-1">${statistics.notificaciones_nuevas}</h3>
                            <p class="text-muted mb-0">Notificaciones</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="stat-icon bg-success text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                                <i class="fas fa-book fa-lg"></i>
                            </div>
                            <h3 class="text-success mb-1">${statistics.materias_cursando}</h3>
                            <p class="text-muted mb-0">Materias</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenido principal -->
            <div class="row">
                <!-- Calificaciones recientes -->
                <div class="col-lg-6 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-clipboard-list text-primary me-2"></i>
                                    Calificaciones Recientes
                                </h5>
                                <button class="btn btn-sm btn-outline-primary refresh-btn" data-section="grades">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderRecentGrades(recent_grades)}
                        </div>
                    </div>
                </div>

                <!-- Tareas pendientes -->
                <div class="col-lg-6 mb-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-tasks text-warning me-2"></i>
                                    Tareas Pendientes
                                </h5>
                                <button class="btn btn-sm btn-outline-warning refresh-btn" data-section="assignments">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderPendingAssignments(pending_assignments)}
                        </div>
                    </div>
                </div>

                <!-- Notificaciones recientes -->
                <div class="col-12">
                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-transparent border-0 pb-0">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">
                                    <i class="fas fa-bell text-info me-2"></i>
                                    Notificaciones Recientes
                                </h5>
                                <button class="btn btn-sm btn-outline-info refresh-btn" data-section="notifications">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            ${this.renderRecentNotifications(recent_notifications)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = dashboardHtml;

        // Re-setup event listeners
        this.setupEventListeners();
    }

    renderRecentGrades(grades) {
        if (grades.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="fas fa-clipboard-list fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay calificaciones disponibles</p>
                </div>
            `;
        }

        return grades.map(grade => `
            <div class="grade-item border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${grade.materia}</h6>
                        <small class="text-muted">Promedio del semestre</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${this.getGradeBadgeClass(grade.promedio)} fs-6">
                            ${grade.promedio.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPendingAssignments(assignments) {
        if (assignments.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
                    <p class="text-muted">¡No tienes tareas pendientes!</p>
                </div>
            `;
        }

        return assignments.map(assignment => `
            <div class="assignment-item border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${assignment.titulo}</h6>
                        <p class="text-muted small mb-1">${assignment.materia}</p>
                        <small class="text-danger">
                            <i class="fas fa-calendar me-1"></i>
                            Entrega: ${this.formatDate(assignment.fecha_entrega)}
                        </small>
                    </div>
                    <span class="badge ${this.getPriorityBadgeClass(assignment.prioridad)}">
                        ${assignment.prioridad}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderRecentNotifications(notifications) {
        if (notifications.length === 0) {
            return `
                <div class="text-center py-3">
                    <i class="fas fa-bell-slash fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay notificaciones recientes</p>
                </div>
            `;
        }

        return notifications.map(notification => `
            <div class="notification-item border-bottom pb-3 mb-3 ${!notification.leido ? 'bg-light' : ''}"
                 data-notification-id="${notification.id}" style="cursor: pointer;">
                <div class="d-flex align-items-start">
                    <div class="notification-icon me-3">
                        <i class="fas ${this.getNotificationIcon(notification.tipo)} text-${this.getNotificationColor(notification.tipo)}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${notification.titulo}</h6>
                        <p class="text-muted small mb-1">${notification.mensaje}</p>
                        <small class="text-muted">
                            ${this.formatDate(notification.fecha)}
                        </small>
                    </div>
                    ${!notification.leido ? '<div class="notification-badge"><span class="badge bg-primary">Nuevo</span></div>' : ''}
                </div>
            </div>
        `).join('');
    }

    async markNotificationAsRead(notificationElement) {
        const notificationId = notificationElement.dataset.notificationId;
        if (!notificationId) return;

        try {
            const response = await this.apiCall(`notifications/${notificationId}/read`, 'PUT');
            if (response.success) {
                notificationElement.classList.remove('bg-light');
                const badge = notificationElement.querySelector('.notification-badge');
                if (badge) badge.remove();
            }
        } catch (error) {
            console.error('❌ Error marcando notificación:', error);
        }
    }

    async handleRefresh(e) {
        const section = e.target.closest('.refresh-btn').dataset.section;
        console.log(`🔄 Refrescando sección: ${section}`);

        // Aquí podrías refrescar secciones específicas
        this.loadDashboard();
    }

    // Utility methods
    getGradeBadgeClass(grade) {
        if (grade >= 9) return 'bg-success';
        if (grade >= 8) return 'bg-primary';
        if (grade >= 7) return 'bg-warning';
        return 'bg-danger';
    }

    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'alta': return 'bg-danger';
            case 'media': return 'bg-warning';
            default: return 'bg-secondary';
        }
    }

    getNotificationIcon(tipo) {
        switch (tipo) {
            case 'grade': return 'fa-clipboard-list';
            case 'assignment': return 'fa-tasks';
            case 'event': return 'fa-calendar-alt';
            default: return 'fa-info-circle';
        }
    }

    getNotificationColor(tipo) {
        switch (tipo) {
            case 'grade': return 'primary';
            case 'assignment': return 'warning';
            case 'event': return 'success';
            default: return 'info';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
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
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si estamos en la página de estudiantes
    if (document.getElementById('dashboardContainer') || document.body.classList.contains('student-portal')) {
        window.studentDashboard = new StudentDashboard();
    }
});

console.log('📝 [DASHBOARD] student-dashboard.js cargado exitosamente');