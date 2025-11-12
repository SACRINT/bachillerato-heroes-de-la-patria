/**
 * 📅 GESTOR DE CITAS
 * Sistema para la gestión de solicitudes de citas con control de disponibilidad
 */

class CitasManager {
    constructor() {
        this.citas = [];
        this.filteredCitas = [];
        this.apiBaseUrl = '/api';
        this.motivosDisponibles = [
            'Asesoría Académica',
            'Inscripción',
            'Orientación Vocacional',
            'Asuntos Administrativos',
            'Reunión de Padres',
            'Disciplina',
            'Bienestar Estudiantil',
            'Otro'
        ];
        this.tiposPersona = ['estudiante', 'padre', 'madre', 'tutor', 'docente', 'administrativo', 'externo'];
        console.log('✅ [CitasManager] Módulo inicializado');
    }

    async init() {
        console.log('🚀 [CitasManager] Iniciando módulo de citas...');
        await this.loadCitas();
        this.setupEventListeners();
        this.renderTable();
    }

    async loadCitas() {
        const loadingEl = document.getElementById('citasTable');
        if (loadingEl) loadingEl.innerHTML = sanitizeHTML(`<tr><td colspan="7" class="text-center py-4">
            <div class="spinner-border text-info" role="status"><span class="visually-hidden">Cargando...</span></div>
            <p class="mt-2 text-muted">Cargando solicitudes de citas...</p></td></tr>`);

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request('/api/citas/list');

            if (result.success) {
                this.citas = result.data || [];
                this.filteredCitas = [...this.citas];
                console.log(`✅ [CitasManager] ${this.citas.length} citas cargadas`);
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('❌ [CitasManager] Error al cargar citas:', error);
            this.showAlert(`Error al cargar citas: ${error.message}`, 'danger');
            this.citas = [];
            this.filteredCitas = [];
        }
        this.renderTable();
        this.updateStats();
    }

    renderTable() {
        const tbody = document.getElementById('citasTable');
        if (!tbody) return;

        tbody.innerHTML = sanitizeHTML('');
        if (this.filteredCitas.length === 0) {
            tbody.innerHTML = sanitizeHTML(`<tr><td colspan="7" class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i><p>No hay solicitudes de citas</p></td></tr>`);
            return;
        }

        this.filteredCitas.forEach(cita => {
            tbody.appendChild(this.createTableRow(cita));
        });
    }

    createTableRow(cita) {
        const tr = document.createElement('tr');
        const estadoClass = this.getEstadoClass(cita.estado);
        const fechaFormato = new Date(cita.fecha_solicitada).toLocaleDateString('es-ES');
        const horaFormato = cita.hora_solicitada.substring(0, 5);

        tr.innerHTML = sanitizeHTML(`
            <td><strong>${this.escapeHtml(cita.nombre_completo)}</strong></td>
            <td>${this.escapeHtml(cita.email)}</td>
            <td>${this.escapeHtml(cita.motivo)}</td>
            <td>${fechaFormato} ${horaFormato}</td>
            <td><span class="badge bg-${estadoClass}">${cita.estado}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    ${cita.estado === 'pendiente' ? `
                        <button class="btn btn-outline-success" onclick="citasManager.approveCita(${cita.id})">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="citasManager.showRejectModal(${cita.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline-primary" onclick="citasManager.showCitaDetails(${cita.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        `);
        return tr;
    }

    getEstadoClass(estado) {
        const estadoMap = {
            'pendiente': 'warning',
            'aprobada': 'success',
            'rechazada': 'danger',
            'cancelada': 'secondary',
            'completada': 'info'
        };
        return estadoMap[estado] || 'secondary';
    }

    setupEventListeners() {
        const searchInput = document.getElementById('citasSearchInput');
        if (searchInput) searchInput.addEventListener('input', () => this.applyFilters());

        const statusFilter = document.getElementById('citasStatusFilter');
        if (statusFilter) statusFilter.addEventListener('change', () => this.applyFilters());

        const motivoFilter = document.getElementById('citasMotivosFilter');
        if (motivoFilter) motivoFilter.addEventListener('change', () => this.applyFilters());
    }

    applyFilters() {
        const search = document.getElementById('citasSearchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('citasStatusFilter')?.value || '';
        const motivoFilter = document.getElementById('citasMotivosFilter')?.value || '';

        this.filteredCitas = this.citas.filter(c => {
            const matchSearch = !search || c.nombre_completo.toLowerCase().includes(search) || c.email.toLowerCase().includes(search);
            const matchStatus = !statusFilter || c.estado === statusFilter;
            const matchMotivo = !motivoFilter || c.motivo === motivoFilter;
            return matchSearch && matchStatus && matchMotivo;
        });
        this.renderTable();
    }

    updateStats() {
        const totalCitasCount = document.getElementById('totalCitasCount');
        if (totalCitasCount) totalCitasCount.textContent = this.citas.length;

        const pendientesCount = document.getElementById('citasPendientesCount');
        if (pendientesCount) {
            const pendientes = this.citas.filter(c => c.estado === 'pendiente').length;
            pendientesCount.textContent = pendientes;
        }

        const aprobadosCount = document.getElementById('citasAprobadosCount');
        if (aprobadosCount) {
            const aprobadas = this.citas.filter(c => c.estado === 'aprobada').length;
            aprobadosCount.textContent = aprobadas;
        }
    }

    async showCitaDetails(citaId) {
        const cita = this.citas.find(c => c.id === citaId);
        if (!cita) {
            this.showAlert('Cita no encontrada.', 'danger');
            return;
        }

        const fechaFormato = new Date(cita.fecha_solicitada).toLocaleDateString('es-ES');
        const horaFormato = cita.hora_solicitada.substring(0, 5);

        const modalHtml = `
            <div class="modal fade" id="citaDetailsModal" tabindex="-1" aria-labelledby="citaDetailsModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-info text-white">
                            <h5 class="modal-title" id="citaDetailsModalLabel"><i class="fas fa-calendar-check me-2"></i>Detalles de Cita</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Nombre:</strong> ${this.escapeHtml(cita.nombre_completo)}<br>
                                    <strong>Email:</strong> ${this.escapeHtml(cita.email)}<br>
                                    <strong>Teléfono:</strong> ${cita.telefono || 'N/A'}<br>
                                </div>
                                <div class="col-md-6">
                                    <strong>Tipo de Persona:</strong> ${cita.tipo_persona}<br>
                                    <strong>Estado:</strong> <span class="badge bg-${this.getEstadoClass(cita.estado)}">${cita.estado}</span><br>
                                    <strong>Motivo:</strong> ${this.escapeHtml(cita.motivo)}<br>
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Fecha Solicitada:</strong> ${fechaFormato} a las ${horaFormato}
                            </div>
                            <div class="mb-3">
                                <strong>Descripción:</strong>
                                <p>${cita.descripcion ? this.escapeHtml(cita.descripcion) : 'Sin descripción'}</p>
                            </div>
                            ${cita.notas_admin ? `
                                <div class="mb-3 p-3 bg-light border rounded">
                                    <strong>Notas del Administrador:</strong>
                                    <p>${this.escapeHtml(cita.notas_admin)}</p>
                                </div>
                            ` : ''}
                            ${cita.motivo_rechazo ? `
                                <div class="mb-3 p-3 bg-danger bg-opacity-10 border border-danger rounded">
                                    <strong class="text-danger">Motivo del Rechazo:</strong>
                                    <p>${this.escapeHtml(cita.motivo_rechazo)}</p>
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

        const existingModal = document.getElementById('citaDetailsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('citaDetailsModal'));
        modal.show();
    }

    async approveCita(citaId) {
        if (!confirm('¿Deseas aprobar esta cita?')) return;

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/citas/${citaId}/approve`, {
                method: 'PUT',
                body: {}
            });

            if (result.success) {
                this.showAlert('Cita aprobada exitosamente.', 'success');
                this.loadCitas();
            } else {
                throw new Error(result.message || 'Error al aprobar cita.');
            }
        } catch (error) {
            console.error('Error aprobando cita:', error);
            this.showAlert(`Error al aprobar cita: ${error.message}`, 'danger');
        }
    }

    async showRejectModal(citaId) {
        const modalHtml = `
            <div class="modal fade" id="rejectCitaModal" tabindex="-1" aria-labelledby="rejectCitaModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title" id="rejectCitaModalLabel"><i class="fas fa-ban me-2"></i>Rechazar Cita</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="rejectForm">
                                <input type="hidden" id="citaIdToReject" value="${citaId}">
                                <div class="mb-3">
                                    <label for="motivoRechazo" class="form-label">Motivo del Rechazo *</label>
                                    <textarea class="form-control" id="motivoRechazo" rows="4" placeholder="Explica por qué se rechaza esta cita..." required></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" onclick="citasManager.rejectCita()">Rechazar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('rejectCitaModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('rejectCitaModal'));
        modal.show();
    }

    async rejectCita() {
        const citaId = parseInt(document.getElementById('citaIdToReject').value);
        const motivoRechazo = document.getElementById('motivoRechazo').value;

        if (!motivoRechazo) {
            this.showAlert('Por favor, completa el motivo del rechazo.', 'warning');
            return;
        }

        try {
            if (!window.apiClient) {
                throw new Error('API Client no disponible');
            }

            const result = await window.apiClient.request(`/api/citas/${citaId}/reject`, {
                method: 'PUT',
                body: { motivo_rechazo: motivoRechazo }
            });

            if (result.success) {
                this.showAlert('Cita rechazada exitosamente.', 'success');
                bootstrap.Modal.getInstance(document.getElementById('rejectCitaModal')).hide();
                this.loadCitas();
            } else {
                throw new Error(result.message || 'Error al rechazar cita.');
            }
        } catch (error) {
            console.error('Error rechazando cita:', error);
            this.showAlert(`Error al rechazar cita: ${error.message}`, 'danger');
        }
    }

    showAlert(message, type) {
        if (window.adminDashboard && typeof window.adminDashboard.showAlert === 'function') {
            window.adminDashboard.showAlert(message, type);
        } else {
            console.error(`[CitasManager] ${type?.toUpperCase()}: ${message}`);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Global instance
window.citasManager = new CitasManager();

// Global functions for onclick handlers
window.showCreateCitaModal = () => alert('Crear nueva cita desde portal público');
window.reloadCitas = () => window.citasManager.loadCitas();
window.clearCitasFilters = () => {
    document.getElementById('citasSearchInput').value = '';
    document.getElementById('citasStatusFilter').value = '';
    document.getElementById('citasMotivosFilter').value = '';
    window.citasManager.applyFilters();
};
