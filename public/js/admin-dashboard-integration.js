/**
 * Admin Dashboard Integration
 * Conecta admin-dashboard.html con /api/admin/dashboard-summary
 */

class AdminDashboard {
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

        // Check if user is admin
        const user = SimpleAuth.getUser();
        if (user.role !== 'admin' && user.role !== 'coordinator') {
            alert('No tienes permisos para acceder a esta página');
            window.location.href = '/estudiantes.html';
            return;
        }

        // Load dashboard data
        await this.loadDashboardSummary();
    }

    /**
     * Cargar resumen completo del dashboard
     */
    async loadDashboardSummary() {
        try {
            const response = await SimpleAuth.authenticatedFetch('/api/admin/dashboard-summary');
            const data = await response.json();

            // Update all KPIs
            this.updateKPIs(data);

        } catch (error) {
            console.error('Error loading dashboard summary:', error);
            this.showError('Error al cargar datos del dashboard');
        }
    }

    /**
     * Actualizar KPIs en el dashboard
     */
    updateKPIs(data) {
        // Total students
        this.updateElement('total-students', data.total_students || 0);

        // Total teachers
        this.updateElement('total-teachers', data.total_teachers || 0);

        // Total inscriptions
        this.updateElement('total-inscriptions', data.total_inscriptions || 0);

        // Total income
        if (data.total_income) {
            this.updateElement('total-income', `$${data.total_income.toLocaleString('es-MX')}`);
        }

        // Average grade
        if (data.average_grade) {
            this.updateElement('average-grade', data.average_grade.toFixed(1));
        }

        // Attendance rate
        if (data.attendance_rate) {
            this.updateElement('attendance-rate', data.attendance_rate.toFixed(1) + '%');
        }

        // Recent activities
        if (data.recent_activities) {
            this.updateActivityFeed(data.recent_activities);
        }

        // Charts data
        if (data.students_by_grade) {
            this.renderStudentsByGradeChart(data.students_by_grade);
        }
    }

    /**
     * Update element content
     */
    updateElement(id, value) {
        const el = document.getElementById(id);
        if (el) {
            // Animate counter if it's a number
            if (typeof value === 'number' || !isNaN(value)) {
                this.animateCounter(el, value);
            } else {
                el.textContent = value;
            }
        }
    }

    /**
     * Animate counter
     */
    animateCounter(element, target) {
        const start = 0;
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);
            const current = Math.floor(progress * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };

        animate();
    }

    /**
     * Update activity feed
     */
    updateActivityFeed(activities) {
        const container = document.getElementById('activity-feed');
        if (!container) return;

        let html = '<div class="list-group">';

        activities.slice(0, 10).forEach(activity => {
            html += `<div class="list-group-item">
                <div class="d-flex justify-content-between">
                    <small class="text-muted">${new Date(activity.timestamp).toLocaleString('es-MX')}</small>
                </div>
                <p class="mb-0">${activity.description}</p>
            </div>`;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render students by grade chart
     */
    renderStudentsByGradeChart(data) {
        const canvas = document.getElementById('students-chart');
        if (!canvas || !window.Chart) return;

        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: data.map(d => d.grado),
                datasets: [{
                    label: 'Estudiantes',
                    data: data.map(d => d.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const container = document.querySelector('.container-fluid') || document.body;
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.prepend(alert);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});
