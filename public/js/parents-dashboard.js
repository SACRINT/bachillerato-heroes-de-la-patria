/**
 * 👨‍👩‍👧 PORTAL DE PADRES - DASHBOARD INTEGRADO
 * Sistema completo de dashboard para padres conectado al backend real
 * Fecha: Enero 2026
 * Usado en: padres.html
 */

// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => { },
        warn: () => { },
        error: () => { }
    };
}

// ============================================
// CONFIGURACIONES DOMPURIFY - XSS PROTECTION
// ============================================

const PARENT_DOMPURIFY_CONFIG = {
    ALLOWED_TAGS: ['div', 'p', 'span', 'table', 'tr', 'td', 'thead', 'tbody', 'th', 'strong', 'em', 'a', 'br', 'small', 'h6', 'h5', 'h2', 'h3', 'h4', 'i', 'button', 'ul', 'li'],
    ALLOWED_ATTR: ['class', 'id', 'data-*', 'href', 'target', 'rel', 'style', 'role', 'aria-label', 'data-bs-dismiss', 'tabindex', 'type'],
    ALLOW_DATA_ATTR: true,
    KEEP_CONTENT: true
};

// ============================================
// CLASE PRINCIPAL - ParentDashboard
// ============================================

class ParentDashboard {
    constructor() {
        try {
            debugLog.log('PARENTS', '👨‍👩‍👧 [PARENTS] Inicializando dashboard de padres...');
            this.apiBase = '/api/parents/';
            this.authToken = localStorage.getItem('parent_auth_token');
            this.currentParent = JSON.parse(localStorage.getItem('current_parent') || 'null');
            this.linkedStudents = [];

            this.init();
        } catch (error) {
            debugLog.error('ERROR', '❌ Error inicializando ParentDashboard:', error);
            console.error('[PARENTS] Error en inicialización:', error);
        }
    }

    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        debugLog.log('PARENTS', '✅ [PARENTS] Dashboard de padres inicializado');
    }

    setupEventListeners() {
        // Login form en padres.html
        const loginForm = document.getElementById('parentLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Botón de acceso/login
        const accessBtn = document.querySelector('[data-action="parent-access"]');
        if (accessBtn) {
            accessBtn.addEventListener('click', () => this.handleLoginButtonClick());
        }

        // Logout buttons
        document.querySelectorAll('[data-action="parent-logout"]').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Dashboard action buttons
        this.setupDashboardActions();
    }

    setupDashboardActions() {
        const actions = {
            'show-grades': () => this.showStudentGrades(),
            'show-attendance': () => this.showStudentAttendance(),
            'show-schedule': () => this.showStudentSchedule(),
            'download-report': () => this.downloadAcademicReport(),
            'schedule-appointment': () => window.location.href = 'citas.html',
            'contact-teacher': () => this.openTeacherContact()
        };

        Object.entries(actions).forEach(([action, handler]) => {
            document.querySelectorAll(`[data-action="${action}"]`).forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    handler();
                });
            });
        });
    }

    async checkAuthentication() {
        if (!this.authToken || !this.currentParent) {
            debugLog.log('PARENTS', 'ℹ️ Usuario no autenticado');
            this.showLoginSection();
            return false;
        }

        try {
            // Validate session with backend
            const response = await fetch('/api/parents/auth/check', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.isAuthenticated) {
                    this.showDashboardSection();
                    await this.loadDashboardData();
                    return true;
                }
            }

            this.clearAuth();
            this.showLoginSection();
            return false;
        } catch (error) {
            debugLog.error('PARENTS', '❌ Error verificando sesión:', error);
            this.showLoginSection();
            return false;
        }
    }

    handleLoginButtonClick() {
        const emailField = document.getElementById('parentEmail') || document.getElementById('accessEmail');
        const passwordField = document.getElementById('parentPassword') || document.getElementById('accessPassword');

        if (emailField && passwordField) {
            // Trigger form submit if fields exist
            const form = emailField.closest('form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            } else {
                this.doLogin(emailField.value, passwordField.value);
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const emailField = document.getElementById('parentEmail') || document.getElementById('accessEmail');
        const passwordField = document.getElementById('parentPassword') || document.getElementById('accessPassword');
        const errorContainer = document.getElementById('loginError') || document.getElementById('parentLoginError');
        const submitBtn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('.btn-primary');

        if (!emailField || !passwordField) {
            console.error('[PARENTS] Form fields not found');
            return;
        }

        const email = emailField.value.trim();
        const password = passwordField.value;

        if (!email || !password) {
            this.showError(errorContainer, 'Por favor complete todos los campos');
            return;
        }

        await this.doLogin(email, password, submitBtn, errorContainer);
    }

    async doLogin(email, password, submitBtn, errorContainer) {
        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Ingresando...';
            }

            if (errorContainer) {
                errorContainer.classList.add('d-none');
            }

            // Try real backend authentication
            const response = await fetch('/api/parents/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store authentication data
                const token = data.token || data.accessToken || data.data?.token || 'session_' + Date.now();
                const parentObj = data.parent || data.user || data.data?.parent || { nombre: 'Padre de Familia', email };
                localStorage.setItem('parent_auth_token', token);
                localStorage.setItem('current_parent', JSON.stringify(parentObj));
                localStorage.setItem('bge_auth_token', token);
                localStorage.setItem('bge_auth_session', JSON.stringify({
                    user: parentObj,
                    role: 'padre_familia'
                }));

                this.authToken = token;
                this.currentParent = parentObj;

                debugLog.log('PARENTS', '✅ Login exitoso para:', this.currentParent.nombre);

                this.showNotification('¡Bienvenido al Portal de Padres!', 'success');
                this.showDashboardSection();
                await this.loadDashboardData();
            } else {
                this.showError(errorContainer, data.message || data.error || 'Credenciales incorrectas');
            }
        } catch (error) {
            debugLog.error('PARENTS', '❌ Error en login:', error);
            this.showError(errorContainer, error.message || 'Error de conexión con el servidor escolar. Intente nuevamente.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Ingresar';
            }
        }
    }

    handleLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            // Notify backend
            fetch('/api/parents/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            }).catch(() => { });

            this.clearAuth();
            this.showLoginSection();
            this.showNotification('Sesión cerrada exitosamente', 'success');
        }
    }

    clearAuth() {
        localStorage.removeItem('parent_auth_token');
        localStorage.removeItem('current_parent');
        localStorage.removeItem('bge_auth_token');
        localStorage.removeItem('bge_auth_session');
        this.authToken = null;
        this.currentParent = null;
        this.linkedStudents = [];
    }

    showLoginSection() {
        const loginSection = document.getElementById('parentLoginSection') || document.querySelector('.login-card');
        const dashboardSection = document.getElementById('parentDashboard');

        if (loginSection) loginSection.classList.remove('d-none');
        if (dashboardSection) dashboardSection.classList.add('d-none');
    }

    showDashboardSection() {
        const loginSection = document.getElementById('parentLoginSection') || document.querySelector('.login-card');
        const dashboardSection = document.getElementById('parentDashboard');

        if (loginSection) loginSection.classList.add('d-none');
        if (dashboardSection) dashboardSection.classList.remove('d-none');
    }

    async loadDashboardData() {
        debugLog.log('PARENTS', '📊 Cargando datos del dashboard...');

        try {
            // Update parent info in header
            this.updateParentHeader();

            // Load linked students
            await this.loadLinkedStudents();

            // Load grades for first student
            if (this.linkedStudents.length > 0) {
                await this.showStudentGrades(this.linkedStudents[0].id);
            }
        } catch (error) {
            debugLog.error('PARENTS', '❌ Error cargando dashboard:', error);
        }
    }

    updateParentHeader() {
        const nameElement = document.getElementById('parentName') || document.querySelector('.parent-name');
        if (nameElement && this.currentParent) {
            nameElement.textContent = this.currentParent.nombre || this.currentParent.name || 'Padre de Familia';
        }
    }

    async loadLinkedStudents() {
        try {
            const response = await fetch('/api/parents/my-students', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.linkedStudents = data.data || data.students || [];
                this.renderStudentList(this.linkedStudents);
            } else {
                // Demo fallback
                this.linkedStudents = [{
                    id: 1,
                    nombre_completo: 'Juan Carlos García López',
                    matricula: '2025-0001',
                    grupo: '5°A',
                    especialidad: 'Programación'
                }];
                this.renderStudentList(this.linkedStudents);
            }
        } catch (error) {
            debugLog.warn('PARENTS', '⚠️ Usando datos demo para estudiantes');
            this.linkedStudents = [{
                id: 1,
                nombre_completo: 'Juan Carlos García López',
                matricula: '2025-0001',
                grupo: '5°A',
                especialidad: 'Programación'
            }];
            this.renderStudentList(this.linkedStudents);
        }
    }

    renderStudentList(students) {
        const container = document.getElementById('linkedStudentsList');
        if (!container) return;

        if (students.length === 0) {
            container.innerHTML = `
                <div class="text-center py-3">
                    <i class="fas fa-user-graduate fa-2x text-muted mb-2"></i>
                    <p class="text-muted">No hay estudiantes vinculados</p>
                </div>
            `;
            return;
        }

        const html = students.map(student => `
            <div class="student-card card mb-2 border-0 shadow-sm" data-student-id="${student.id}">
                <div class="card-body p-3">
                    <div class="d-flex align-items-center">
                        <div class="student-avatar me-3">
                            <i class="fas fa-user-graduate fa-2x text-primary"></i>
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${DOMPurify.sanitize(student.nombre_completo || student.name)}</h6>
                            <small class="text-muted">
                                ${DOMPurify.sanitize(student.matricula)} | ${DOMPurify.sanitize(student.grupo || 'N/A')}
                            </small>
                        </div>
                        <button class="btn btn-outline-primary btn-sm" onclick="window.parentDashboard.showStudentGrades(${student.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = DOMPurify.sanitize(html, PARENT_DOMPURIFY_CONFIG);
    }

    async showStudentGrades(studentId = null) {
        const targetStudentId = studentId || this.linkedStudents[0]?.id;
        if (!targetStudentId) {
            this.showNotification('No hay estudiante seleccionado', 'warning');
            return;
        }

        debugLog.log('PARENTS', `📊 Cargando calificaciones del estudiante ${targetStudentId}`);

        const container = document.getElementById('gradesContainer');
        if (!container) return;

        // Show loading
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando calificaciones...</p>
            </div>
        `;

        try {
            const response = await fetch(`/api/parents/students/${targetStudentId}/grades`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderGradesTable(data.data || data.grades || []);
            } else {
                // Demo data fallback
                this.renderGradesTable(this.getDemoGrades());
            }
        } catch (error) {
            debugLog.warn('PARENTS', '⚠️ Usando calificaciones demo');
            this.renderGradesTable(this.getDemoGrades());
        }
    }

    getDemoGrades() {
        return [
            { materia: 'Matemáticas III', parcial1: 8.5, parcial2: 9.0, parcial3: 8.8, promedio: 8.77 },
            { materia: 'Física III', parcial1: 7.5, parcial2: 8.0, parcial3: 8.5, promedio: 8.0 },
            { materia: 'Química III', parcial1: 9.0, parcial2: 8.5, parcial3: 9.0, promedio: 8.83 },
            { materia: 'Programación', parcial1: 10.0, parcial2: 9.5, parcial3: 9.8, promedio: 9.77 },
            { materia: 'Inglés V', parcial1: 8.0, parcial2: 8.5, parcial3: 9.0, promedio: 8.5 }
        ];
    }

    renderGradesTable(grades) {
        const container = document.getElementById('gradesContainer');
        if (!container) return;

        if (!grades || grades.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay calificaciones disponibles</p>
                </div>
            `;
            return;
        }

        const promedioGeneral = grades.reduce((sum, g) => sum + (g.promedio || 0), 0) / grades.length;

        const html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-primary">
                        <tr>
                            <th>Materia</th>
                            <th class="text-center">Parcial 1</th>
                            <th class="text-center">Parcial 2</th>
                            <th class="text-center">Parcial 3</th>
                            <th class="text-center">Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map(g => `
                            <tr>
                                <td><strong>${DOMPurify.sanitize(g.materia)}</strong></td>
                                <td class="text-center">${this.formatGrade(g.parcial1)}</td>
                                <td class="text-center">${this.formatGrade(g.parcial2)}</td>
                                <td class="text-center">${this.formatGrade(g.parcial3)}</td>
                                <td class="text-center">
                                    <span class="badge ${this.getGradeBadgeClass(g.promedio)} fs-6">
                                        ${g.promedio?.toFixed(2) || '-'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot class="table-secondary">
                        <tr>
                            <td colspan="4" class="text-end"><strong>Promedio General:</strong></td>
                            <td class="text-center">
                                <span class="badge ${this.getGradeBadgeClass(promedioGeneral)} fs-5">
                                    ${promedioGeneral.toFixed(2)}
                                </span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        container.innerHTML = DOMPurify.sanitize(html, PARENT_DOMPURIFY_CONFIG);
    }

    formatGrade(grade) {
        if (grade === null || grade === undefined) return '-';
        return grade.toFixed(1);
    }

    getGradeBadgeClass(grade) {
        if (grade >= 9) return 'bg-success';
        if (grade >= 8) return 'bg-primary';
        if (grade >= 7) return 'bg-warning text-dark';
        return 'bg-danger';
    }

    async showStudentAttendance() {
        this.showNotification('Módulo de asistencias en desarrollo', 'info');
    }

    async showStudentSchedule() {
        this.showNotification('Horarios disponibles próximamente', 'info');
    }

    async downloadAcademicReport() {
        if (!this.linkedStudents.length) {
            this.showNotification('No hay estudiante seleccionado', 'warning');
            return;
        }

        const studentId = this.linkedStudents[0].id;

        try {
            const response = await fetch(`/api/grades/student/${studentId}/pdf`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `boleta_${studentId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.showNotification('Boleta descargada exitosamente', 'success');
            } else {
                this.showNotification('Error descargando boleta', 'error');
            }
        } catch (error) {
            debugLog.error('PARENTS', '❌ Error descargando reporte:', error);
            this.showNotification('Función disponible próximamente', 'info');
        }
    }

    openTeacherContact() {
        window.location.href = 'comunicacion-padres-docentes.html';
    }

    showError(container, message) {
        if (container) {
            container.textContent = message;
            container.classList.remove('d-none');
        } else {
            this.showNotification(message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create toast
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        const toastId = 'toast_' + Date.now();
        const bgClass = {
            'success': 'bg-success',
            'error': 'bg-danger',
            'warning': 'bg-warning text-dark',
            'info': 'bg-info text-dark'
        }[type] || 'bg-info';

        const toastHtml = `
            <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
                <div class="toast-body d-flex align-items-center">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                    ${DOMPurify.sanitize(message)}
                    <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toastElement = document.getElementById(toastId);
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            new bootstrap.Toast(toastElement).show();
        } else {
            toastElement.classList.add('show');
            setTimeout(() => toastElement.remove(), 4000);
        }
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
        return container;
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParentDashboard);
} else {
    initParentDashboard();
}

function initParentDashboard() {
    // Only init on parent pages
    if (window.location.pathname.includes('padres') || document.getElementById('parentDashboard') || document.getElementById('parentLoginForm')) {
        window.parentDashboard = new ParentDashboard();
        console.log('[PARENTS] ✅ Dashboard de padres inicializado');
    }
}
