/**
 * Coordinator Grades Dashboard
 * Panel de validación y aprobación de calificaciones
 */

class CoordinatorGradesDashboard {
    constructor() {
        this.apiBase = '/api/grades-validation';
        this.currentView = 'pending';
        this.selectedGrades = new Set();
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPendingGrades();
        await this.loadAlerts();
        await this.loadStats();
    }

    setupEventListeners() {
        // Tabs navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });

        // Bulk actions
        document.getElementById('btn-approve-selected')?.addEventListener('click', () => {
            this.bulkValidate('aprobado');
        });

        document.getElementById('btn-reject-selected')?.addEventListener('click', () => {
            this.bulkValidate('rechazado');
        });

        // Filters
        document.getElementById('filter-periodo')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filter-materia')?.addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filter-severidad')?.addEventListener('change', () => {
            this.loadAlerts();
        });
    }

    async switchView(view) {
        this.currentView = view;

        // Update tabs UI
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`view-${view}`)?.classList.remove('hidden');

        // Load data
        switch (view) {
            case 'pending':
                await this.loadPendingGrades();
                break;
            case 'alerts':
                await this.loadAlerts();
                break;
            case 'reports':
                await this.loadReports();
                break;
            case 'audit':
                // Loaded on demand
                break;
        }
    }

    async loadPendingGrades() {
        try {
            this.showLoading('pending-grades-list');

            const response = await fetch(`${this.apiBase}/pending`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error('Error cargando calificaciones pendientes');

            const data = await response.json();
            this.renderPendingGrades(data.data || []);

        } catch (error) {
            console.error('Error:', error);
            this.showError('pending-grades-list', 'Error al cargar calificaciones pendientes');
        }
    }

    renderPendingGrades(grades) {
        const container = document.getElementById('pending-grades-list');
        if (!container) return;

        if (grades.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>¡Todas las calificaciones están validadas!</p>
                </div>`;
            return;
        }

        const html = `
            <div class="grades-table-container">
                <table class="grades-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all"></th>
                            <th>Matrícula</th>
                            <th>Estudiante</th>
                            <th>Materia</th>
                            <th>Docente</th>
                            <th>Calificación</th>
                            <th>Periodo</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${grades.map(grade => this.renderGradeRow(grade)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;

        // Setup checkbox handlers
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Individual checkboxes
        container.querySelectorAll('.grade-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                if (e.target.checked) {
                    this.selectedGrades.add(id);
                } else {
                    this.selectedGrades.delete(id);
                }
                this.updateBulkActionsUI();
            });
        });
    }

    renderGradeRow(grade) {
        const statusClass = grade.calificacion >= 6 ? 'approved' : 'failed';
        const date = new Date(grade.created_at).toLocaleDateString('es-MX');

        return `
            <tr data-grade-id="${grade.id}">
                <td><input type="checkbox" class="grade-checkbox" data-id="${grade.id}"></td>
                <td><strong>${grade.matricula}</strong></td>
                <td>${grade.estudiante_nombre}</td>
                <td>${grade.materia_nombre}</td>
                <td>${grade.docente_nombre}</td>
                <td><span class="badge badge-${statusClass}">${grade.calificacion}</span></td>
                <td>${grade.periodo || 'N/A'}</td>
                <td>${date}</td>
                <td class="actions">
                    <button class="btn-icon btn-approve" onclick="coordinatorDashboard.validateGrade(${grade.id}, 'aprobado')" title="Aprobar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon btn-reject" onclick="coordinatorDashboard.validateGrade(${grade.id}, 'rechazado')" title="Rechazar">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn-icon btn-info" onclick="coordinatorDashboard.showAuditHistory(${grade.id})" title="Historial">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    toggleSelectAll(checked) {
        document.querySelectorAll('.grade-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
            const id = parseInt(checkbox.dataset.id);
            if (checked) {
                this.selectedGrades.add(id);
            } else {
                this.selectedGrades.delete(id);
            }
        });
        this.updateBulkActionsUI();
    }

    updateBulkActionsUI() {
        const count = this.selectedGrades.size;
        const bulkActions = document.querySelector('.bulk-actions');
        if (bulkActions) {
            if (count > 0) {
                bulkActions.classList.add('active');
                bulkActions.querySelector('.selected-count').textContent = `${count} seleccionada${count > 1 ? 's' : ''}`;
            } else {
                bulkActions.classList.remove('active');
            }
        }
    }

    async validateGrade(gradeId, estado) {
        const comentarios = estado === 'rechazado'
            ? prompt('Comentarios del rechazo:')
            : null;

        if (estado === 'rechazado' && !comentarios) {
            alert('Debe proporcionar comentarios al rechazar una calificación');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ calificacion_id: gradeId, estado, comentarios })
            });

            if (!response.ok) throw new Error('Error al validar calificación');

            const data = await response.json();
            this.showNotification(data.message, 'success');
            await this.loadPendingGrades();
            await this.loadStats();

        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al validar calificación', 'error');
        }
    }

    async bulkValidate(estado) {
        if (this.selectedGrades.size === 0) {
            alert('Seleccione al menos una calificación');
            return;
        }

        const confirmMsg = `¿Confirma ${estado === 'aprobado' ? 'aprobar' : 'rechazar'} ${this.selectedGrades.size} calificaciones?`;
        if (!confirm(confirmMsg)) return;

        const comentarios = estado === 'rechazado'
            ? prompt('Comentarios del rechazo masivo:')
            : 'Aprobación masiva';

        try {
            const response = await fetch(`${this.apiBase}/bulk-validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    calificaciones: Array.from(this.selectedGrades),
                    estado,
                    comentarios
                })
            });

            if (!response.ok) throw new Error('Error en validación masiva');

            const data = await response.json();
            this.showNotification(data.message, 'success');

            this.selectedGrades.clear();
            await this.loadPendingGrades();
            await this.loadStats();

        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error en validación masiva', 'error');
        }
    }

    async loadAlerts() {
        try {
            const severidad = document.getElementById('filter-severidad')?.value || '';
            const url = severidad ? `${this.apiBase}/alerts?severidad=${severidad}` : `${this.apiBase}/alerts`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error('Error cargando alertas');

            const data = await response.json();
            this.renderAlerts(data.data || []);

        } catch (error) {
            console.error('Error:', error);
            this.showError('alerts-list', 'Error al cargar alertas');
        }
    }

    renderAlerts(alerts) {
        const container = document.getElementById('alerts-list');
        if (!container) return;

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shield-check"></i>
                    <p>No hay alertas activas</p>
                </div>`;
            return;
        }

        const html = alerts.map(alert => `
            <div class="alert-card severity-${alert.severidad}">
                <div class="alert-header">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <div class="alert-info">
                        <h4>${alert.estudiante_nombre} (${alert.matricula})</h4>
                        <p class="alert-type">${this.getAlertTypeLabel(alert.tipo_alerta)}</p>
                    </div>
                    <span class="severity-badge badge-${alert.severidad}">${alert.severidad.toUpperCase()}</span>
                </div>
                <div class="alert-body">
                    <p>${alert.mensaje}</p>
                    ${alert.data_adicional ? `
                        <div class="alert-data">
                            <pre>${JSON.stringify(JSON.parse(alert.data_adicional), null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="alert-actions">
                    <button class="btn btn-sm btn-primary" onclick="coordinatorDashboard.viewStudentDetails(${alert.estudiante_id})">
                        Ver Alumno
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="coordinatorDashboard.dismissAlert(${alert.id})">
                        Descartar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    getAlertTypeLabel(type) {
        const labels = {
            'bajo_promedio': '⚠️ Promedio Bajo',
            'reprobado': '❌ Materias Reprobadas',
            'ausentismo': '🚫 Ausentismo Alto',
            'irregular': '⚡ Situación Irregular'
        };
        return labels[type] || type;
    }

    async dismissAlert(alertId) {
        const motivo = prompt('Motivo del cierre de la alerta:');
        if (!motivo) return;

        try {
            const response = await fetch(`${this.apiBase}/alerts/dismiss/${alertId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ motivo })
            });

            if (!response.ok) throw new Error('Error al cerrar alerta');

            this.showNotification('Alerta cerrada exitosamente', 'success');
            await this.loadAlerts();

        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Error al cerrar alerta', 'error');
        }
    }

    async showAuditHistory(gradeId) {
        try {
            const response = await fetch(`${this.apiBase}/audit/${gradeId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error('Error cargando historial');

            const data = await response.json();
            this.renderAuditModal(data.data || []);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al cargar historial de auditoría');
        }
    }

    renderAuditModal(history) {
        const html = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Historial de Auditoría</h3>
                        <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="audit-timeline">
                            ${history.map(entry => `
                                <div class="audit-entry">
                                    <div class="audit-date">${new Date(entry.fecha_registro).toLocaleString('es-MX')}</div>
                                    <div class="audit-details">
                                        <strong>${entry.usuario_nombre}</strong> - ${entry.accion}
                                        ${entry.valor_anterior ? `<br>Cambio: ${entry.valor_anterior} → ${entry.valor_nuevo}` : ''}
                                        ${entry.comentarios ? `<br><em>${entry.comentarios}</em>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/pending`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) throw new Error('Error cargando estadísticas');

            const data = await response.json();
            const pending = data.total || 0;

            document.getElementById('stat-pending')?.textContent = pending;

        } catch (error) {
            console.error('Error:', error);
        }
    }

    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando...</div>';
        }
    }

    showError(container Id, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>`;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    viewStudentDetails(studentId) {
        window.location.href = `/estudiante-detalle.html?id=${studentId}`;
    }
}

// Initialize dashboard
let coordinatorDashboard;
document.addEventListener('DOMContentLoaded', () => {
    coordinatorDashboard = new CoordinatorGradesDashboard();
});
