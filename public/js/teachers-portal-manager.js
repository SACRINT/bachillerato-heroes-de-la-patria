/**
 * 👨‍🏫 TEACHERS PORTAL MANAGER
 * window.getTenantConfigValue('school_name', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'BGE Héroes')')')')')') de la Patria')
 * Fecha: 19 de Octubre, 2025
 *
 * Gestor completo del Portal de Docentes
 * Maneja autenticación, dashboard, clases, calificaciones, asistencias, recursos, mensajería
 */

class TeachersPortalManager {
    constructor(options = {}) {
        this.apiBaseURL = options.apiBaseURL || '/api/teachers-portal';
        this.token = this.getStoredToken();
        this.teacher = null;
        this.currentSection = 'dashboard';
        this.classes = [];
        this.selectedClass = null;

        this.init();
    }

    /**
     * Inicializar portal
     */
    async init() {
        // Verificar si hay token
        if (this.token) {
            // Intentar cargar dashboard
            await this.loadDashboard();
        } else {
            // Mostrar pantalla de login
            this.showLogin();
        }

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Sidebar menu links
        const menuLinks = document.querySelectorAll('.menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);

                // Update active class
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Toggle sidebar (mobile)
        const toggleSidebar = document.getElementById('toggleSidebar');
        if (toggleSidebar) {
            toggleSidebar.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

        // Save class button
        const saveClassBtn = document.getElementById('saveClassBtn');
        if (saveClassBtn) {
            saveClassBtn.addEventListener('click', () => this.saveClass());
        }

        // Save resource button
        const saveResourceBtn = document.getElementById('saveResourceBtn');
        if (saveResourceBtn) {
            saveResourceBtn.addEventListener('click', () => this.saveResource());
        }

        // Send message button
        const sendMessageBtn = document.getElementById('sendMessageBtn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => this.sendMessage());
        }

        // Grades select changes
        const gradesClassSelect = document.getElementById('gradesClassSelect');
        const gradesPeriodSelect = document.getElementById('gradesPeriodSelect');
        if (gradesClassSelect && gradesPeriodSelect) {
            gradesClassSelect.addEventListener('change', () => this.loadGrades());
            gradesPeriodSelect.addEventListener('change', () => this.loadGrades());
        }

        // Save grades button
        const saveGradesBtn = document.getElementById('saveGradesBtn');
        if (saveGradesBtn) {
            saveGradesBtn.addEventListener('click', () => this.saveGrades());
        }

        // Start attendance button
        const startAttendanceBtn = document.getElementById('startAttendanceBtn');
        if (startAttendanceBtn) {
            startAttendanceBtn.addEventListener('click', () => this.startAttendanceSession());
        }

        // Escuchar login unificado desde el header o modal global
        window.addEventListener('bge-user-logged-in', async () => {
            const token = this.getStoredToken();
            if (token) {
                this.setToken(token);
                await this.loadDashboard();
            }
        });
    }

    /**
     * Handle login
     */
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al iniciar sesión');
            }

            if (!data.success) {
                throw new Error(data.error || data.message || 'Login falló');
            }

            // Guardar token
            this.setToken(data.token);
            this.teacher = data.teacher;
            localStorage.setItem('bge_auth_token', data.token);
            localStorage.setItem('bge_auth_session', JSON.stringify({
                user: data.teacher,
                role: data.teacher?.role || 'docente'
            }));

            // Cerrar modales si existen
            this.dismissAuthModals();

            // Cargar dashboard
            await this.loadDashboard();

        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Dismiss authentication modals and clean backdrops
     */
    dismissAuthModals() {
        const unifiedModal = document.getElementById('unified-auth-modal');
        if (unifiedModal) {
            unifiedModal.classList.remove('show');
            unifiedModal.style.display = 'none';
            unifiedModal.setAttribute('aria-hidden', 'true');
        }
        const modalEl = document.getElementById('loginModal');
        if (modalEl && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.removeAttribute('style');
    }

    /**
     * Logout
     */
    logout() {
        this.token = null;
        this.teacher = null;
        localStorage.removeItem('teachers_auth_token');
        sessionStorage.removeItem('teachers_auth_token');
        localStorage.removeItem('bge_auth_token');
        localStorage.removeItem('bge_auth_session');
        this.showLogin();
    }

    /**
     * Show login screen
     */
    showLogin() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboardContainer').classList.remove('active');
    }

    /**
     * Show dashboard
     */
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardContainer').classList.add('active');
        this.dismissAuthModals();
    }

    /**
     * Load dashboard
     */
    async loadDashboard() {
        this.showLoading(true);

        try {
            const response = await this.apiRequest('/dashboard');

            if (!response.success) {
                throw new Error('Error cargando dashboard');
            }

            const { data } = response;

            // Update teacher info
            this.teacher = data.teacher;
            document.getElementById('teacherName').textContent =
                `${data.teacher.nombre} ${data.teacher.apellido_paterno}`;

            // Update stats (using new simplified format)
            if (document.getElementById('totalClasses')) {
                document.getElementById('totalClasses').textContent = data.stats?.classes || 0;
            }
            if (document.getElementById('totalStudents')) {
                document.getElementById('totalStudents').textContent = data.stats?.students || 0;
            }
            if (document.getElementById('pendingReviews')) {
                document.getElementById('pendingReviews').textContent = data.stats?.messages || 0;
            }
            if (document.getElementById('unreadMessages')) {
                document.getElementById('unreadMessages').textContent = data.stats?.messages || 0;
            }

            // Update badges
            if (data.stats?.notifications > 0) {
                const badge = document.getElementById('unreadNotificationsCount');
                if (badge) {
                    badge.textContent = data.stats.notifications;
                    badge.style.display = 'inline-block';
                }
            }

            if (data.stats?.messages > 0) {
                const badge = document.getElementById('unreadMessagesCount');
                if (badge) {
                    badge.textContent = data.stats.messages;
                    badge.style.display = 'inline-block';
                }
            }

            // Update upcoming classes table
            this.renderUpcomingClasses(data.upcomingClasses || []);

            // Store classes (empty for now in simplified dashboard)
            this.classes = [];

            // Show dashboard
            this.showDashboard();
            this.showSection('dashboard');

        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Si falla, logout
            this.logout();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render upcoming classes
     */
    renderUpcomingClasses(classes) {
        const tbody = document.getElementById('upcomingClassesTable');

        if (classes.length === 0) {
            tbody.innerHTML = DOMPurify.sanitize('<tr><td colspan="5" class="text-center text-muted">No hay clases próximas</td></tr>');
            return;
        }

        tbody.innerHTML = classes.map(cls => `
            <tr>
                <td>${cls.hora_inicio || '-'} - ${cls.hora_fin || '-'}</td>
                <td>${cls.materia}</td>
                <td>${cls.grado}° ${cls.grupo}</td>
                <td>${cls.salon || '-'}</td>
                <td><span class="badge bg-primary">${cls.total_estudiantes}</span></td>
            </tr>
        `).join('');
    }

    /**
     * Show section
     */
    async showSection(section) {
        this.currentSection = section;

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        document.getElementById(`section-${section}`).classList.add('active');

        // Load section data
        switch (section) {
            case 'classes':
                await this.loadClasses();
                break;
            case 'grades':
                await this.loadClassesForGrades();
                break;
            case 'attendance':
                await this.loadAttendanceSection();
                break;
            case 'resources':
                await this.loadResources();
                break;
            case 'messages':
                await this.loadMessages();
                break;
            case 'notifications':
                await this.loadNotifications();
                break;
        }
    }

    /**
     * Load classes
     */
    async loadClasses() {
        this.showLoading(true);

        try {
            const response = await this.apiRequest('/classes');

            if (!response.success) {
                throw new Error('Error cargando clases');
            }

            this.classes = response.data;
            this.renderClasses(response.data);

        } catch (error) {
            console.error('Error loading classes:', error);
            this.showToast('Error al cargar clases', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render classes
     */
    renderClasses(classes) {
        const grid = document.getElementById('classesGrid');

        if (classes.length === 0) {
            grid.innerHTML = DOMPurify.sanitize('<div class="col-12 text-center text-muted"><p>No hay clases registradas</p></div>');
            return;
        }

        grid.innerHTML = classes.map(cls => `
            <div class="col-md-6 col-lg-4">
                <div class="stat-card">
                    <h5 class="mb-2">${cls.materia}</h5>
                    <p class="text-muted mb-2">${cls.grado}° ${cls.grupo} - ${cls.ciclo_escolar}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-people"></i> ${cls.total_estudiantes || 0} estudiantes
                        </div>
                        <div>
                            <button class="btn btn-sm btn-outline-primary" onclick="teachersPortal.viewClass(${cls.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Save class
     */
    async saveClass() {
        const form = document.getElementById('addClassForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        this.showLoading(true);

        try {
            const response = await this.apiRequest('/classes', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (!response.success) {
                throw new Error(response.error || 'Error al guardar clase');
            }

            this.showToast('Clase creada exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addClassModal')).hide();
            form.reset();
            await this.loadClasses();

        } catch (error) {
            console.error('Error saving class:', error);
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load classes for grades select
     */
    async loadClassesForGrades() {
        const select = document.getElementById('gradesClassSelect');

        if (this.classes.length === 0) {
            const response = await this.apiRequest('/classes');
            this.classes = response.data || [];
        }

        select.innerHTML = '<option value="">Seleccionar clase...</option>' +
            this.classes.map(cls =>
                `<option value="${cls.id}">${cls.materia} - ${cls.grado}° ${cls.grupo}</option>`
            ).join('');
    }

    /**
     * Load grades
     */
    async loadGrades() {
        const classId = document.getElementById('gradesClassSelect').value;
        const periodo = document.getElementById('gradesPeriodSelect').value;

        if (!classId || !periodo) {
            return;
        }

        this.showLoading(true);

        try {
            const response = await this.apiRequest(`/classes/${classId}/grades?periodo=${periodo}`);

            if (!response.success) {
                throw new Error('Error cargando calificaciones');
            }

            this.renderGradesTable(response.data.grades);
            document.getElementById('saveGradesBtn').disabled = false;

        } catch (error) {
            console.error('Error loading grades:', error);
            this.showToast('Error al cargar calificaciones', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render grades table
     */
    renderGradesTable(grades) {
        const tbody = document.getElementById('gradesTableBody');

        if (grades.length === 0) {
            tbody.innerHTML = DOMPurify.sanitize('<tr><td colspan="8" class="text-center text-muted">No hay estudiantes</td></tr>');
            return;
        }

        tbody.innerHTML = grades.map((grade, index) => `
            <tr>
                <td>${grade.matricula}</td>
                <td>${grade.nombre_completo}</td>
                <td>
                    <input type="number" class="form-control" min="0" max="10" step="0.1"
                           value="${grade.calificacion || ''}"
                           data-student-id="${grade.student_id}"
                           data-field="calificacion">
                </td>
                <td>
                    <select class="form-select" data-student-id="${grade.student_id}" data-field="calificacion_letra">
                        <option value="">-</option>
                        <option value="MB" ${grade.calificacion_letra === 'MB' ? 'selected' : ''}>MB</option>
                        <option value="B" ${grade.calificacion_letra === 'B' ? 'selected' : ''}>B</option>
                        <option value="S" ${grade.calificacion_letra === 'S' ? 'selected' : ''}>S</option>
                        <option value="NA" ${grade.calificacion_letra === 'NA' ? 'selected' : ''}>NA</option>
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control" min="0" value="${grade.faltas || 0}"
                           data-student-id="${grade.student_id}" data-field="faltas">
                </td>
                <td>
                    <input type="number" class="form-control" min="0" value="${grade.retardos || 0}"
                           data-student-id="${grade.student_id}" data-field="retardos">
                </td>
                <td>
                    <input type="text" class="form-control" value="${grade.observaciones || ''}"
                           data-student-id="${grade.student_id}" data-field="observaciones">
                </td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="teachersPortal.saveIndividualGrade(${grade.student_id})">
                        <i class="bi bi-save"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Save individual grade
     */
    async saveIndividualGrade(studentId) {
        const classId = document.getElementById('gradesClassSelect').value;
        const periodo = document.getElementById('gradesPeriodSelect').value;

        // Get grade data from inputs
        const inputs = document.querySelectorAll(`[data-student-id="${studentId}"]`);
        const gradeData = {
            student_id: studentId,
            class_id: parseInt(classId),
            periodo: periodo,
            ciclo_escolar: '2025-2026'
        };

        inputs.forEach(input => {
            const field = input.dataset.field;
            gradeData[field] = input.value;
        });

        this.showLoading(true);

        try {
            const response = await this.apiRequest('/grades', {
                method: 'POST',
                body: JSON.stringify(gradeData)
            });

            if (!response.success) {
                throw new Error('Error guardando calificación');
            }

            this.showToast('Calificación guardada', 'success');

        } catch (error) {
            console.error('Error saving grade:', error);
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load attendance section
     */
    async loadAttendanceSection() {
        // Implementar según necesidad
        void 0;
    }

    /**
     * Start attendance session
     */
    async startAttendanceSession() {
        // Implementar modal para seleccionar clase y fecha
        void 0;
    }

    /**
     * Load resources
     */
    async loadResources() {
        this.showLoading(true);

        try {
            const response = await this.apiRequest('/resources');

            if (!response.success) {
                throw new Error('Error cargando recursos');
            }

            this.renderResources(response.data);

        } catch (error) {
            console.error('Error loading resources:', error);
            this.showToast('Error al cargar recursos', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render resources
     */
    renderResources(resources) {
        const grid = document.getElementById('resourcesGrid');

        if (resources.length === 0) {
            grid.innerHTML = DOMPurify.sanitize('<div class="col-12 text-center text-muted"><p>No hay recursos disponibles</p></div>');
            return;
        }

        grid.innerHTML = resources.map(resource => `
            <div class="col-md-4">
                <div class="stat-card">
                    <h6>${resource.titulo}</h6>
                    <p class="text-muted small">${resource.descripcion || ''}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-secondary">${resource.tipo}</span>
                        <a href="${resource.archivo_url || resource.enlace_externo}" target="_blank" class="btn btn-sm btn-primary">
                            <i class="bi bi-download"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Save resource
     */
    async saveResource() {
        const form = document.getElementById('addResourceForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        this.showLoading(true);

        try {
            const response = await this.apiRequest('/resources', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (!response.success) {
                throw new Error('Error al guardar recurso');
            }

            this.showToast('Recurso guardado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('addResourceModal')).hide();
            form.reset();
            await this.loadResources();

        } catch (error) {
            console.error('Error saving resource:', error);
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load messages
     */
    async loadMessages() {
        this.showLoading(true);

        try {
            const response = await this.apiRequest('/messages');

            if (!response.success) {
                throw new Error('Error cargando mensajes');
            }

            this.renderMessages(response.data);

        } catch (error) {
            console.error('Error loading messages:', error);
            this.showToast('Error al cargar mensajes', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render messages
     */
    renderMessages(messages) {
        const tbody = document.getElementById('messagesTableBody');

        if (messages.length === 0) {
            tbody.innerHTML = DOMPurify.sanitize('<tr><td colspan="5" class="text-center text-muted">No hay mensajes</td></tr>');
            return;
        }

        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td>${msg.recipient_type === 'parent' ? 'Padre' : 'Estudiante'}</td>
                <td>${msg.asunto}</td>
                <td>${new Date(msg.created_at).toLocaleDateString()}</td>
                <td>${msg.leido ? '<span class="badge bg-success">Leído</span>' : '<span class="badge bg-warning">Nuevo</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="teachersPortal.viewMessage(${msg.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    /**
     * Send message
     */
    async sendMessage() {
        const form = document.getElementById('newMessageForm');
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        this.showLoading(true);

        try {
            const response = await this.apiRequest('/messages', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (!response.success) {
                throw new Error('Error al enviar mensaje');
            }

            this.showToast('Mensaje enviado exitosamente', 'success');
            bootstrap.Modal.getInstance(document.getElementById('newMessageModal')).hide();
            form.reset();
            await this.loadMessages();

        } catch (error) {
            console.error('Error sending message:', error);
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load notifications
     */
    async loadNotifications() {
        this.showLoading(true);

        try {
            const response = await this.apiRequest('/notifications?limit=50');

            if (!response.success) {
                throw new Error('Error cargando notificaciones');
            }

            this.renderNotifications(response.data);

        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showToast('Error al cargar notificaciones', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Render notifications
     */
    renderNotifications(notifications) {
        const container = document.getElementById('notificationsList');

        if (notifications.length === 0) {
            container.innerHTML = DOMPurify.sanitize('<p class="text-muted">No hay notificaciones</p>');
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="alert alert-${this.getNotificationColor(notif.prioridad)} ${notif.leida ? 'opacity-50' : ''}" role="alert">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="alert-heading">${notif.titulo}</h6>
                        <p class="mb-1">${notif.mensaje}</p>
                        <small class="text-muted">${new Date(notif.created_at).toLocaleString()}</small>
                    </div>
                    ${!notif.leida ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="teachersPortal.markNotificationRead(${notif.id})">
                            <i class="bi bi-check"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Get notification color based on priority
     */
    getNotificationColor(priority) {
        const colors = {
            'baja': 'info',
            'normal': 'primary',
            'alta': 'warning',
            'urgente': 'danger'
        };
        return colors[priority] || 'primary';
    }

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        try {
            await this.apiRequest(`/notifications/${notificationId}/read`, {
                method: 'PUT'
            });

            await this.loadNotifications();

        } catch (error) {
            console.error('Error marking notification:', error);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * API request helper
     */
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseURL}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
            }
        };

        if (options.body) {
            config.body = options.body;
        }

        const response = await fetch(url, config);
        return await response.json();
    }

    /**
     * Get stored token
     */
    getStoredToken() {
        return localStorage.getItem('teachers_auth_token') || 
               sessionStorage.getItem('teachers_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('bge_auth_token');
    }

    /**
     * Set token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('teachers_auth_token', token);
        localStorage.setItem('bge_auth_token', token);
    }

    /**
     * Show loading spinner
     */
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.add('active');
        } else {
            spinner.classList.remove('active');
        }
    }

    /**
     * Show error message
     */
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('d-none');
            setTimeout(() => {
                errorElement.classList.add('d-none');
            }, 5000);
        }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.TeachersPortalManager = TeachersPortalManager;
}

// Export for Node.js/Jest
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeachersPortalManager;
}
