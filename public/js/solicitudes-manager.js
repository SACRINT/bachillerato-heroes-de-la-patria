/**
 * 📋 GESTOR DE SOLICITUDES
 * Sistema para la gestión de solicitudes de registro de nuevos usuarios
 */

// NOTA: DOMPurify se asume disponible globalmente desde script anterior
// O usar: const DOMPurify = window.DOMPurify || { sanitize: (str) => str };

class SolicitudesManager {
    constructor() {
        this.solicitudes = [];
        this.filteredSolicitudes = [];
        this.apiBaseUrl = '/api';
        console.log('✅ [SolicitudesManager] Módulo inicializado');
    }

    async init() {
        console.log('🚀 [SolicitudesManager] Iniciando módulo de solicitudes...');
        await this.loadSolicitudes();
        this.setupEventListeners();
        this.renderTable();
    }

    async loadSolicitudes() {
        const containerEl = document.getElementById('pending-registrations-container');
        if (containerEl) {
            containerEl.innerHTML = sanitizeHTML(`
                <div class="text-center py-4">
                    <div class="spinner-border text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
                    <p class="mt-2 text-muted">Cargando solicitudes...</p>
                </div>
            `);
        }

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request('/api/solicitudes');

            if (result.success) {
                this.solicitudes = result.data || [];
                this.filteredSolicitudes = [...this.solicitudes];
                console.log(`✅ [SolicitudesManager] ${this.solicitudes.length} solicitudes cargadas`);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ [SolicitudesManager] Error al cargar solicitudes:', error);
            this.showAlert(`Error al cargar solicitudes: ${error.message}`, 'danger');
            this.solicitudes = [];
            this.filteredSolicitudes = [];
        }
        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const containerEl = document.getElementById('pending-registrations-container');
        if (!containerEl) return;

        if (this.filteredSolicitudes.length === 0) {
            containerEl.innerHTML = sanitizeHTML(`
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Sin solicitudes pendientes</strong>
                    <p class="mb-0">No hay solicitudes de registro en este momento.</p>
                </div>
            `);
            return;
        }

        let html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th><i class="fas fa-user me-2"></i>Nombre</th>
                            <th><i class="fas fa-envelope me-2"></i>Email</th>
                            <th><i class="fas fa-id-badge me-2"></i>Usuario</th>
                            <th><i class="fas fa-calendar me-2"></i>Fecha</th>
                            <th><i class="fas fa-signal me-2"></i>Estado</th>
                            <th class="text-center"><i class="fas fa-cogs me-2"></i>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.filteredSolicitudes.forEach(solicitud => {
            html += this.createTableRow(solicitud);
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        containerEl.innerHTML = sanitizeHTML(html);
    }

    createTableRow(solicitud) {
        const fechaFormato = new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES');
        const status = solicitud.status || solicitud.estado || 'pendiente';
        const estadoClass = this.getEstadoClass(status);

        return `
            <tr>
                <td><strong>${this.escapeHtml(solicitud.nombre || solicitud.usuario_name || 'N/A')}</strong></td>
                <td>${this.escapeHtml(solicitud.email)}</td>
                <td>${this.escapeHtml(solicitud.username || solicitud.usuario || 'N/A')}</td>
                <td>${fechaFormato}</td>
                <td><span class="badge bg-${estadoClass}">${status}</span></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        ${status === 'pendiente' ? `
                            <button class="btn btn-outline-success" onclick="solicitudesManager.approveSolicitud(${solicitud.id})" title="Aprobar solicitud">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-outline-danger" onclick="solicitudesManager.rejectSolicitud(${solicitud.id})" title="Rechazar solicitud">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : `
                            <button class="btn btn-outline-warning" onclick="solicitudesManager.revokeSolicitud(${solicitud.id})" title="Revocar aprobación">
                                <i class="fas fa-undo"></i>
                            </button>
                        `}
                        <button class="btn btn-outline-primary" onclick="solicitudesManager.showSolicitudDetails(${solicitud.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-dark" onclick="solicitudesManager.deleteSolicitud(${solicitud.id})" title="Eliminar solicitud">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getEstadoClass(estado) {
        const estadoMap = {
            'pendiente': 'warning',
            'aprobada': 'success',
            'rechazada': 'danger',
            'cancelada': 'secondary',
            'revisada': 'info'
        };
        return estadoMap[estado] || 'secondary';
    }

    setupEventListeners() {
        // TODO: Agregar filtros si es necesario
    }

    updateStats() {
        // Actualizar contadores si existen
        const totalSolicitudesCount = document.getElementById('totalSolicitudesCount');
        if (totalSolicitudesCount) {
            totalSolicitudesCount.textContent = this.solicitudes.length;
        }

        const pendientesCount = document.getElementById('solicitudesPendientesCount');
        if (pendientesCount) {
            const pendientes = this.solicitudes.filter(s => (s.status || s.estado) === 'pendiente').length;
            pendientesCount.textContent = pendientes;
        }
    }

    async showSolicitudDetails(solicitudId) {
        const solicitud = this.solicitudes.find(s => s.id === solicitudId);
        if (!solicitud) {
            this.showAlert('Solicitud no encontrada.', 'danger');
            return;
        }

        const status = solicitud.status || solicitud.estado || 'pendiente';
        const fecha = solicitud.fecha_solicitud || solicitud.created_at;
        const fechaFormato = new Date(fecha).toLocaleDateString('es-ES');
        const horaFormato = new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        const modalHtml = `
            <div class="modal fade" id="solicitudDetailsModal" tabindex="-1" aria-labelledby="solicitudDetailsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="solicitudDetailsModalLabel"><i class="fas fa-file-alt me-2"></i>Detalles de Solicitud</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Nombre:</strong> ${this.escapeHtml(solicitud.nombre || solicitud.usuario_name || 'N/A')}<br>
                                    <strong>Email:</strong> ${this.escapeHtml(solicitud.email)}<br>
                                    <strong>Usuario:</strong> ${this.escapeHtml(solicitud.username || solicitud.usuario || 'N/A')}<br>
                                </div>
                                <div class="col-md-6">
                                    <strong>Estado:</strong> <span class="badge bg-${this.getEstadoClass(status)}">${status}</span><br>
                                    <strong>Fecha:</strong> ${fechaFormato} ${horaFormato}<br>
                                    <strong>ID:</strong> ${solicitud.id}<br>
                                </div>
                            </div>
                            ${solicitud.notas ? `
                                <div class="mb-3">
                                    <strong>Notas:</strong>
                                    <p>${this.escapeHtml(solicitud.notas)}</p>
                                </div>
                            ` : ''}
                            ${JSON.stringify(solicitud, null, 2) ? `
                                <div class="mb-3">
                                    <strong>Datos Adicionales:</strong>
                                    <pre style="max-height: 200px; overflow-y: auto;"><code>${this.escapeHtml(JSON.stringify(solicitud, null, 2))}</code></pre>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('solicitudDetailsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('solicitudDetailsModal'));
        modal.show();
    }

    async approveSolicitud(solicitudId) {
        if (!confirm('¿Deseas aprobar esta solicitud?')) return;

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/solicitudes/${solicitudId}/approve`, {
                method: 'PUT',
                body: {}
            });

            if (result.success) {
                this.showAlert('Solicitud aprobada exitosamente.', 'success');
                this.loadSolicitudes();
            } else {
                throw new Error(result.message || 'Error al aprobar solicitud.');
            }
        } catch (error) {
            console.error('Error aprobando solicitud:', error);
            this.showAlert(`Error al aprobar solicitud: ${error.message}`, 'danger');
        }
    }

    async rejectSolicitud(solicitudId) {
        const motivo = prompt('Ingresa el motivo del rechazo:');
        if (!motivo) return;

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/solicitudes/${solicitudId}/reject`, {
                method: 'PUT',
                body: { motivo }
            });

            if (result.success) {
                this.showAlert('Solicitud rechazada exitosamente.', 'success');
                this.loadSolicitudes();
            } else {
                throw new Error(result.message || 'Error al rechazar solicitud.');
            }
        } catch (error) {
            console.error('Error rechazando solicitud:', error);
            this.showAlert(`Error al rechazar solicitud: ${error.message}`, 'danger');
        }
    }

    async revokeSolicitud(solicitudId) {
        if (!confirm('¿Estás seguro de que quieres revocar la aprobación de esta solicitud?\n\nLa solicitud volverá a estado "pendiente".')) return;

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/solicitudes/${solicitudId}`, {
                method: 'PUT',
                body: { status: 'pendiente', notas_admin: 'Aprobación revocada por administrador' }
            });

            if (result.success) {
                this.showAlert('Aprobación revocada. Solicitud ahora está pendiente.', 'success');
                this.loadSolicitudes();
            } else {
                throw new Error(result.message || 'Error al revocar solicitud.');
            }
        } catch (error) {
            console.error('Error revocando solicitud:', error);
            this.showAlert(`Error al revocar solicitud: ${error.message}`, 'danger');
        }
    }

    async deleteSolicitud(solicitudId) {
        const solicitud = this.solicitudes.find(s => s.id === solicitudId);
        const nombre = solicitud ? solicitud.nombre : `Solicitud #${solicitudId}`;

        if (!confirm(`¿ELIMINAR PERMANENTEMENTE la solicitud de "${nombre}"?\n\nEsta acción NO se puede deshacer.`)) return;

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/solicitudes/${solicitudId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                this.showAlert(`Solicitud de "${nombre}" eliminada permanentemente.`, 'success');
                this.loadSolicitudes();
            } else {
                throw new Error(result.message || 'Error al eliminar solicitud.');
            }
        } catch (error) {
            console.error('Error eliminando solicitud:', error);
            this.showAlert(`Error al eliminar solicitud: ${error.message}`, 'danger');
        }
    }

    showAlert(message, type) {
        if (window.adminDashboard && typeof window.adminDashboard.showAlert === 'function') {
            window.adminDashboard.showAlert(message, type);
        } else {
            console.error(`[SolicitudesManager] ${type?.toUpperCase()}: ${message}`);
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Global instance
window.solicitudesManager = new SolicitudesManager();

// Global functions for onclick handlers
window.reloadSolicitudes = () => window.solicitudesManager.loadSolicitudes();
