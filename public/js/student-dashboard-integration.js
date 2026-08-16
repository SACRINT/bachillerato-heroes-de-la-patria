/**
 * Student Dashboard Integration
 * Conecta estudiantes.html con múltiples endpoints del backend
 */

class StudentDashboard {
    constructor() {
        this.API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';
        this.init();
    }

    async init() {
        // Check authentication
        if (!SimpleAuth || !SimpleAuth.isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }

        // Load all dashboard data
        await this.loadAll();
    }

    async loadAll() {
        try {
            await Promise.all([
                this.loadProfile(),
                this.loadGrades(),
                this.loadSchedule(),
                this.loadAssignments(),
                this.loadNotifications()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    /**
     * Cargar perfil del estudiante
     */
    async loadProfile() {
        try {
            const response = await SimpleAuth.authenticatedFetch('/api/students/profile');
            const data = await response.json();

            // Update profile UI
            this.updateProfileUI(data);
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showElement('profile-error');
        }
    }

    /**
     * Cargar calificaciones
     */
    async loadGrades() {
        try {
            const user = SimpleAuth.getUser();
            const response = await SimpleAuth.authenticatedFetch(`/api/grades/student/${user.id}`);
            const data = await response.json();

            // Update grades UI
            this.updateGradesUI(data);
        } catch (error) {
            console.error('Error loading grades:', error);
            this.showElement('grades-error');
        }
    }

    /**
     * Cargar horario
     */
    async loadSchedule() {
        try {
            const response = await SimpleAuth.authenticatedFetch('/api/students/schedule');
            const data = await response.json();

            // Update schedule UI
            this.updateScheduleUI(data);
        } catch (error) {
            console.error('Error loading schedule:', error);
            this.showElement('schedule-error');
        }
    }

    /**
     * Cargar tareas pendientes
     */
    async loadAssignments() {
        try {
            const response = await SimpleAuth.authenticatedFetch('/api/students/assignments');
            const data = await response.json();

            // Update assignments UI
            this.updateAssignmentsUI(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
            this.showElement('assignments-error');
        }
    }

    /**
     * Cargar notificaciones
     */
    async loadNotifications() {
        try {
            const response = await SimpleAuth.authenticatedFetch('/api/students/notifications');
            const data = await response.json();

            // Update notifications UI
            this.updateNotificationsUI(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    /**
     * Actualizar UI de perfil
     */
    updateProfileUI(profile) {
        const elements = {
            'student-name': profile.nombre + ' ' + (profile.apellido || ''),
            'student-email': profile.email,
            'student-matricula': profile.matricula || 'N/A',
            'student-grado': profile.grado || 'N/A',
            'student-grupo': profile.grupo || 'N/A'
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        // Update avatar if exists
        const avatar = document.getElementById('student-avatar');
        if (avatar && profile.avatar_url) {
            avatar.src = profile.avatar_url;
        }
    }

    /**
     * Actualizar UI de calificaciones
     */
    updateGradesUI(grades) {
        const container = document.getElementById('grades-container');
        if (!container) return;

        if (!grades || grades.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay calificaciones disponibles.</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-hover">';
        html += '<thead><tr><th>Materia</th><th>Parcial 1</th><th>Parcial 2</th><th>Parcial 3</th><th>Promedio</th></tr></thead>';
        html += '<tbody>';

        grades.forEach(grade => {
            html += `<tr>
                <td>${grade.materia}</td>
                <td>${grade.parcial1 || '-'}</td>
                <td>${grade.parcial2 || '-'}</td>
                <td>${grade.parcial3 || '-'}</td>
                <td><strong>${grade.promedio || '-'}</strong></td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    /**
     * Actualizar UI de horario
     */
    updateScheduleUI(schedule) {
        const container = document.getElementById('schedule-container');
        if (!container) return;

        if (!schedule || schedule.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay horario disponible.</p>';
            return;
        }

        let html = '<div class="row">';

        const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        days.forEach(day => {
            html += `<div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-header bg-primary text-white">${day}</div>
                    <div class="card-body">`;

            const daySchedule = schedule.filter(s => s.dia === day);
            if (daySchedule.length > 0) {
                html += '<ul class="list-unstyled">';
                daySchedule.forEach(clase => {
                    html += `<li><small>${clase.hora}</small> - ${clase.materia}</li>`;
                });
                html += '</ul>';
            } else {
                html += '<p class="text-muted small">Sin clases</p>';
            }

            html += `</div></div></div>`;
        });

        html += '</div>';
        container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    /**
     * Actualizar UI de tareas
     */
    updateAssignmentsUI(assignments) {
        const container = document.getElementById('assignments-container');
        if (!container) return;

        if (!assignments || assignments.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No hay tareas pendientes.</p>';
            return;
        }

        let html = '<div class="list-group">';

        assignments.forEach(task => {
            const dueDate = new Date(task.fecha_entrega);
            const isOverdue = dueDate < new Date();

            html += `<div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">${task.titulo}</h6>
                        <small class="text-muted">${task.materia}</small>
                    </div>
                    <span class="badge ${isOverdue ? 'bg-danger' : 'bg-primary'}">
                        ${dueDate.toLocaleDateString()}
                    </span>
                </div>
                ${task.descripcion ? `<p class="mb-1 mt-2 small">${task.descripcion}</p>` : ''}
            </div>`;
        });

        html += '</div>';
        container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    /**
     * Actualizar UI de notificaciones
     */
    updateNotificationsUI(notifications) {
        const container = document.getElementById('notifications-container');
        const badge = document.getElementById('notifications-badge');

        if (!notifications || notifications.length === 0) {
            if (container) {
                container.innerHTML = '<p class="text-muted text-center">No hay notificaciones.</p>';
            }
            return;
        }

        // Update badge
        const unread = notifications.filter(n => !n.leido).length;
        if (badge && unread > 0) {
            badge.textContent = unread;
            badge.classList.remove('d-none');
        }

        if (container) {
            let html = '<div class="list-group">';

            notifications.slice(0, 5).forEach(notif => {
                html += `<a href="#" class="list-group-item list-group-item-action ${notif.leido ? '' : 'list-group-item-primary'}">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>${notif.titulo}</strong>
                        <small>${new Date(notif.fecha).toLocaleDateString()}</small>
                    </div>
                    <small class="text-muted">${notif.mensaje}</small>
                </a>`;
            });

            html += '</div>';
            container.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
        }
    }

    /**
     * Helper to show error elements
     */
    showElement(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('d-none');
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new StudentDashboard();
});
