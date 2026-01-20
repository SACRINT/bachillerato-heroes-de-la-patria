/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🎓 DASHBOARD ESTUDIANTIL - Sistema Integrado
 * Maneja la interfaz y funcionalidades del dashboard estudiantil
 */

// ============================================
// CONFIGURACIONES DOMPURIFY - XSS PROTECTION
// ============================================

// Contexto 1: Tablas y Listados (Datos sensibles)
const DOMPURIFY_CONFIG_TABLAS = {
    ALLOWED_TAGS: ['div', 'p', 'span', 'table', 'tr', 'td', 'thead', 'tbody', 'th', 'strong', 'em', 'a', 'br', 'small', 'h6', 'h5', 'h2', 'h3', 'i', 'button'],
    ALLOWED_ATTR: ['class', 'id', 'data-*', 'href', 'target', 'rel', 'style', 'role', 'aria-label', 'data-bs-dismiss', 'data-notification-id', 'data-section', 'tabindex', 'type'],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
};

// Contexto 2: Formularios (Validaciones, errores)
const DOMPURIFY_CONFIG_FORMULARIOS = {
    ALLOWED_TAGS: ['span', 'div', 'p', 'em', 'strong', 'small', 'a'],
    ALLOWED_ATTR: ['class', 'id'],
    KEEP_CONTENT: true
};

// Contexto 3: Contenido de Usuario (Comentarios, mensajes)
const DOMPURIFY_CONFIG_UGC = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'blockquote', 'code', 'pre', 'span', 'div', 'small'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    KEEP_CONTENT: true,
    RETURN_DOM: false
};

// Contexto 4: HTML Simple (Modales, alertas)
const DOMPURIFY_CONFIG_SIMPLE = {
    ALLOWED_TAGS: ['div', 'p', 'span', 'a', 'strong', 'em', 'i', 'button', 'br'],
    ALLOWED_ATTR: ['class', 'id', 'type', 'data-bs-dismiss'],
    KEEP_CONTENT: true
};

// ============================================
// FIN CONFIGURACIONES
// ============================================

class StudentDashboard {
    constructor() {
        try {
            debugLog.log('DASHBOARD', '🎓 [DASHBOARD] Inicializando dashboard estudiantil...');
            this.apiBase = '/api/students/';
            this.authToken = localStorage.getItem('student_auth_token');
            this.currentStudent = JSON.parse(localStorage.getItem('current_student') || 'null');

            this.init();
        } catch (error) {
            debugLog.error('ERROR', '❌ Error inicializando StudentDashboard:', error);
            this.fallbackInitialization();
        }
    }

    fallbackInitialization() {
        debugLog.log('DASHBOARD', '🔄 [DASHBOARD] Iniciando modo de respaldo...');
        this.apiBase = '/api/students/';
        this.authToken = null;
        this.currentStudent = null;
        // NO mostrar modal automáticamente en modo de respaldo
        debugLog.log('APP', 'ℹ️ Modo de respaldo iniciado. Use el botón para login.');
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        debugLog.log('DASHBOARD', '✅ [DASHBOARD] Dashboard estudiantil inicializado');
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
            debugLog.log('APP', 'ℹ️ Usuario no autenticado');
            return false;
        }

        try {
            // Si hay token, cargar dashboard directamente
            this.loadDashboard();
            return true;
        } catch (error) {
            debugLog.error('ERROR', '❌ Error verificando autenticación:', error);
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

        const sanitized = DOMPurify.sanitize(loginModalHtml, DOMPURIFY_CONFIG_SIMPLE);
        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitized));

        // Mostrar modal de forma segura
        try {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = new bootstrap.Modal(document.getElementById('studentLoginModal'));
                modal.show();
            } else {
                debugLog.warn('APP', '⚠️ Bootstrap no disponible, mostrando modal con fallback');
                document.getElementById('studentLoginModal').style.display = 'block';
                document.getElementById('studentLoginModal').classList.add('show');
            }
        } catch (error) {
            debugLog.error('ERROR', '❌ Error mostrando modal:', error);
        }

        // Setup form listener
        document.getElementById('studentLoginForm').addEventListener('submit', (e) => this.handleLogin(e));
    }

    async handleLogin(e) {
        e.preventDefault();

        const matriculaOrEmail = document.getElementById('matricula').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('loginError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            loginError.classList.add('d-none');

            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';
            }

            // Try real backend authentication first
            let loginSuccess = false;
            let studentData = null;

            try {
                const response = await fetch('/api/students-auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: matriculaOrEmail.includes('@') ? matriculaOrEmail : `${matriculaOrEmail}@estudiante.bge.edu.mx`,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    loginSuccess = true;
                    studentData = {
                        token: 'real_session_' + Date.now(),
                        student: {
                            id: data.student.id,
                            matricula: matriculaOrEmail,
                            nombre: data.student.name,
                            grupo: data.student.group || 'N/A',
                            especialidad: data.student.specialty || 'General',
                            semestre: data.student.semester || 1,
                            email: data.student.email
                        }
                    };
                    debugLog.log('APP', '✅ Login real exitoso');
                } else {
                    debugLog.warn('APP', '⚠️ Backend login failed:', data.message);
                }
            } catch (apiError) {
                debugLog.warn('APP', '⚠️ API not available, trying demo mode:', apiError.message);
            }

            // Fallback to demo credentials if real backend fails
            if (!loginSuccess && matriculaOrEmail === '2025-0001' && password === 'student123') {
                loginSuccess = true;
                studentData = {
                    token: 'demo_token_' + Date.now(),
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
                debugLog.log('APP', 'ℹ️ Usando modo demo');
            }

            if (loginSuccess && studentData) {
                // Store authentication data
                localStorage.setItem('student_auth_token', studentData.token);
                localStorage.setItem('current_student', JSON.stringify(studentData.student));

                this.authToken = studentData.token;
                this.currentStudent = studentData.student;

                // Close modal
                try {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('studentLoginModal'));
                        if (modal) modal.hide();
                    } else {
                        document.getElementById('studentLoginModal').style.display = 'none';
                        document.getElementById('studentLoginModal').classList.remove('show');
                    }
                } catch (modalError) {
                    debugLog.warn('ERROR', '⚠️ Error cerrando modal:', modalError);
                }

                // Hide login prompt
                if (typeof hideLoginPrompt === 'function') {
                    hideLoginPrompt();
                }

                this.showNotification('¡Bienvenido al dashboard estudiantil!', 'success');
                this.loadDashboard();
            } else {
                loginError.textContent = 'Credenciales incorrectas. Verifica tu matrícula/email y contraseña.';
                loginError.classList.remove('d-none');
            }
        } catch (error) {
            debugLog.error('ERROR', '❌ Error en login:', error);
            loginError.textContent = 'Error de conexión. Intenta nuevamente.';
            loginError.classList.remove('d-none');
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Ingresar';
            }
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
        debugLog.log('DASHBOARD', '🔄 Restableciendo estado inicial del dashboard...');

        // Limpiar el contenedor del dashboard
        const dashboardContainer = document.getElementById('dashboardContainer');
        if (dashboardContainer) {
            // Restaurar el HTML inicial con el botón de login
            const initialHTML = `
                <!-- Estado inicial: Botón para acceder al dashboard -->
                <div id="loginPrompt" class="text-center py-5">
                    <div class="card border-0 shadow-sm mx-auto" style="max-width: 400px;">
                        <div class="card-body p-4">
                            <div class="mb-3">
                                <i class="fas fa-user-graduate fa-3x text-primary mb-3"></i>
                            </div>
                            <h5 class="card-title text-primary mb-3">Accede a tu Dashboard</h5>
                            <p class="text-muted mb-4">Inicia sesión para ver tu información académica personalizada</p>
                            <button class="btn btn-primary btn-lg" data-action="show-student-login">
                                <i class="fas fa-sign-in-alt me-2"></i>
                                Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
                <!-- El dashboard se cargará dinámicamente aquí después del login -->
            `;
            dashboardContainer.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(initialHTML, DOMPURIFY_CONFIG_SIMPLE));
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
            debugLog.log('DASHBOARD', '📊 [DASHBOARD] Cargando datos del dashboard...');

            // Mostrar loading
            this.showLoading();

            // Intentar cargar datos reales del backend
            let dashboardData;
            const useRealBackend = this.authToken && !this.authToken.startsWith('mock_') && !this.authToken.startsWith('demo_');

            if (useRealBackend && this.currentStudent?.id) {
                try {
                    // Fetch all data in parallel for better performance
                    const [gradesResponse, profileResponse, scheduleResponse, assignmentsResponse, notificationsResponse] = await Promise.all([
                        this.fetchStudentGrades(this.currentStudent.id),
                        this.fetchStudentProfile(this.currentStudent.id),
                        this.fetchStudentSchedule(),
                        this.fetchStudentAssignments(),
                        this.fetchStudentNotifications()
                    ]);

                    dashboardData = {
                        profile: profileResponse || this.currentStudent,
                        statistics: {
                            promedio_general: this.calculateAverage(gradesResponse?.materias || []),
                            tareas_pendientes: assignmentsResponse?.length || 0,
                            notificaciones_nuevas: notificationsResponse?.length || 0,
                            materias_cursando: gradesResponse?.materias?.length || 0
                        },
                        recent_grades: this.formatGradesForDashboard(gradesResponse?.materias || []),
                        pending_assignments: assignmentsResponse?.slice(0, 5) || [],
                        recent_notifications: notificationsResponse?.slice(0, 5) || [],
                        schedule: scheduleResponse || [],
                        schedule_today: this.getTodaySchedule(scheduleResponse || [])
                    };

                    debugLog.log('DASHBOARD', '✅ Datos reales cargados del backend');
                } catch (apiError) {
                    debugLog.warn('DASHBOARD', '⚠️ Error cargando datos reales, usando mock:', apiError);
                    dashboardData = this.getMockDashboardData();
                }
            } else {
                // Usar datos simulados para demostración
                debugLog.log('DASHBOARD', 'ℹ️ Usando datos mock (modo demo)');
                dashboardData = this.getMockDashboardData();
            }

            this.renderDashboard(dashboardData);
        } catch (error) {
            debugLog.error('DASHBOARD', '❌ Error cargando dashboard:', error);
            this.showNotification('Error cargando dashboard', 'error');
        }
    }

    /**
     * Get today's schedule from full schedule
     */
    getTodaySchedule(schedule) {
        const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const today = days[new Date().getDay()];
        return schedule.filter(item => (item.dia || '').toLowerCase() === today);
    }

    /**
     * Fetch grades from real backend API
     */
    async fetchStudentGrades(studentId) {
        const cicloEscolar = '2025-2026';
        const response = await fetch(`/api/grades/student/${studentId}?cicloEscolar=${cicloEscolar}`, {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Grades API error: ${response.status}`);
        }

        const data = await response.json();
        return data.success ? data.data : null;
    }

    /**
     * Fetch student profile from backend
     */
    async fetchStudentProfile(studentId) {
        try {
            const response = await fetch(`/api/students/${studentId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (e) {
            debugLog.warn('DASHBOARD', '⚠️ Profile endpoint not available');
            return null;
        }
    }

    /**
     * Fetch student schedule from backend
     */
    async fetchStudentSchedule() {
        try {
            const response = await fetch('/api/students/schedule', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];
            const data = await response.json();
            return data.success ? (data.data || []) : [];
        } catch (e) {
            debugLog.warn('DASHBOARD', '⚠️ Schedule endpoint not available');
            return [];
        }
    }

    /**
     * Fetch student assignments from backend
     */
    async fetchStudentAssignments() {
        try {
            const response = await fetch('/api/students/assignments?status=pending', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];
            const data = await response.json();
            return data.success ? (data.data || []) : [];
        } catch (e) {
            debugLog.warn('DASHBOARD', '⚠️ Assignments endpoint not available');
            return [];
        }
    }

    /**
     * Fetch student notifications from backend
     */
    async fetchStudentNotifications() {
        try {
            const response = await fetch('/api/students/notifications?unread_only=true', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) return [];
            const data = await response.json();
            return data.success ? (data.data || []) : [];
        } catch (e) {
            debugLog.warn('DASHBOARD', '⚠️ Notifications endpoint not available');
            return [];
        }
    }

    /**
     * Calculate average from grades array
     */
    calculateAverage(materias) {
        if (!materias || materias.length === 0) return 0;
        const validGrades = materias.filter(m => m.promedio_final && !isNaN(parseFloat(m.promedio_final)));
        if (validGrades.length === 0) return 0;
        const sum = validGrades.reduce((acc, m) => acc + parseFloat(m.promedio_final), 0);
        return sum / validGrades.length;
    }

    /**
     * Format grades for dashboard display
     */
    formatGradesForDashboard(materias) {
        if (!materias) return [];
        return materias.slice(0, 4).map(m => ({
            materia: m.materia,
            promedio: parseFloat(m.promedio_final) || 0
        }));
    }

    /**
     * Get mock dashboard data for demo mode
     */
    getMockDashboardData() {
        return {
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
        };
    }

    showLoading() {
        const container = document.getElementById('dashboardContainer');
        if (container) {
            const loadingHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="text-muted">Cargando tu dashboard...</p>
                </div>
            `;
            container.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(loadingHTML, DOMPURIFY_CONFIG_SIMPLE));
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

        container.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(dashboardHtml, DOMPURIFY_CONFIG_TABLAS));

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

        return grades.map(grade => {
            const sanitizedMateria = DOMPurify.sanitize(grade.materia, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            return `
            <div class="grade-item border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${sanitizedMateria}</h6>
                        <small class="text-muted">Promedio del semestre</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${this.getGradeBadgeClass(grade.promedio)} fs-6">
                            ${grade.promedio.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
        `;
        }).join('');
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

        return assignments.map(assignment => {
            const sanitizedTitulo = DOMPurify.sanitize(assignment.titulo, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            const sanitizedMateria = DOMPurify.sanitize(assignment.materia, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            const sanitizedPrioridad = DOMPurify.sanitize(assignment.prioridad, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            return `
            <div class="assignment-item border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${sanitizedTitulo}</h6>
                        <p class="text-muted small mb-1">${sanitizedMateria}</p>
                        <small class="text-danger">
                            <i class="fas fa-calendar me-1"></i>
                            Entrega: ${this.formatDate(assignment.fecha_entrega)}
                        </small>
                    </div>
                    <span class="badge ${this.getPriorityBadgeClass(assignment.prioridad)}">
                        ${sanitizedPrioridad}
                    </span>
                </div>
            </div>
        `;
        }).join('');
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

        return notifications.map(notification => {
            const sanitizedTitulo = DOMPurify.sanitize(notification.titulo, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            const sanitizedMensaje = DOMPurify.sanitize(notification.mensaje, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
            return `
            <div class="notification-item border-bottom pb-3 mb-3 ${!notification.leido ? 'bg-light' : ''}"
                 data-notification-id="${notification.id}" style="cursor: pointer;">
                <div class="d-flex align-items-start">
                    <div class="notification-icon me-3">
                        <i class="fas ${this.getNotificationIcon(notification.tipo)} text-${this.getNotificationColor(notification.tipo)}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${sanitizedTitulo}</h6>
                        <p class="text-muted small mb-1">${sanitizedMensaje}</p>
                        <small class="text-muted">
                            ${this.formatDate(notification.fecha)}
                        </small>
                    </div>
                    ${!notification.leido ? '<div class="notification-badge"><span class="badge bg-primary">Nuevo</span></div>' : ''}
                </div>
            </div>
        `;
        }).join('');
    }

    async markNotificationAsRead(notificationElement) {
        const notificationId = notificationElement.dataset.notificationId;
        if (!notificationId) return;

        try {
            const response = await fetch(`/api/students/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                notificationElement.classList.remove('bg-light');
                const badge = notificationElement.querySelector('.notification-badge');
                if (badge) badge.remove();
            }
        } catch (error) {
            debugLog.error('ERROR', '❌ Error marcando notificación:', error);
        }
    }

    /**
     * Update student profile (editable fields)
     */
    async updateProfile(profileData) {
        try {
            const response = await fetch('/api/students/profile', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Perfil actualizado exitosamente', 'success');
                // Refresh to show updated data
                this.loadDashboard();
                return { success: true };
            } else {
                this.showNotification(data.message || 'Error actualizando perfil', 'danger');
                return { success: false, message: data.message };
            }
        } catch (error) {
            debugLog.error('ERROR', '❌ Error actualizando perfil:', error);
            this.showNotification('Error de conexión', 'danger');
            return { success: false, message: 'Error de conexión' };
        }
    }

    /**
     * Show profile edit modal
     */
    showProfileEditModal() {
        const profile = this.currentStudent;
        if (!profile) return;

        const modalHtml = `
            <div class="modal fade" id="profileEditModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="fas fa-user-edit me-2"></i>Editar Perfil</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="profileEditForm">
                                <div class="mb-3">
                                    <label for="edit-telefono" class="form-label">Teléfono</label>
                                    <input type="tel" class="form-control" id="edit-telefono" 
                                           value="${profile.telefono || ''}" 
                                           placeholder="Ej: 5512345678">
                                </div>
                                <div class="mb-3">
                                    <label for="edit-foto" class="form-label">URL de Foto de Perfil</label>
                                    <input type="url" class="form-control" id="edit-foto" 
                                           value="${profile.foto_url || ''}" 
                                           placeholder="https://ejemplo.com/mi-foto.jpg">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="saveProfileBtn">
                                <i class="fas fa-save me-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existing = document.getElementById('profileEditModal');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(modalHtml));

        const modal = new bootstrap.Modal(document.getElementById('profileEditModal'));
        modal.show();

        // Handle save
        document.getElementById('saveProfileBtn').addEventListener('click', async () => {
            const telefono = document.getElementById('edit-telefono').value.trim();
            const foto_url = document.getElementById('edit-foto').value.trim();

            const updateData = {};
            if (telefono) updateData.telefono = telefono;
            if (foto_url) updateData.foto_url = foto_url;

            if (Object.keys(updateData).length > 0) {
                const result = await this.updateProfile(updateData);
                if (result.success) {
                    modal.hide();
                }
            } else {
                modal.hide();
            }
        });
    }

    async handleRefresh(e) {
        const section = e.target.closest('.refresh-btn').dataset.section;
        debugLog.log('APP', `🔄 Refrescando sección: ${section}`);

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
        const sanitizedMessage = DOMPurify.sanitize(message, { ALLOWED_TAGS: [], KEEP_CONTENT: true });
        const notificationHTML = `
            ${sanitizedMessage}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertDiv.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(notificationHTML, DOMPURIFY_CONFIG_SIMPLE));

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Solo inicializar si estamos en la página de estudiantes
    if (document.getElementById('dashboardContainer') || document.body.classList.contains('student-portal')) {
        window.studentDashboard = new StudentDashboard();
    }
});

debugLog.log('DASHBOARD', '📝 [DASHBOARD] student-dashboard.js cargado exitosamente');
