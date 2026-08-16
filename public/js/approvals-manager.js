/**
 * 📋 APPROVALS MANAGER
 * Gestión de solicitudes pendientes de aprobación
 * Fecha: 17 Octubre 2025
 */

// NOTA: DOMPurify se asume disponible globalmente desde script anterior
// O usar: const DOMPurify = window.DOMPurify || { sanitize: (str) => str };

// Variable global para almacenar las solicitudes
let pendingApprovals = [];
let filteredApprovals = [];

/**
 * Cargar solicitudes pendientes desde /api/pendientes-aprobacion
 */
async function loadPendingApprovals() {
    try {
        const response = await fetch('/api/pendientes-aprobacion?limit=100');

        if (!response.ok) {
            showApprovalsError(`Error del servidor: ${response.status}`);
            return;
        }

        const result = await response.json();

        if (result && result.success) {
            // Transformar datos de la nueva API al formato esperado
            pendingApprovals = Array.isArray(result.data) ? result.data.map(item => {
                let parsedData;
                try {
                    parsedData = typeof item.datos_json === 'string'
                        ? JSON.parse(item.datos_json)
                        : item.datos_json;
                } catch (e) {
                    parsedData = item.datos_json || {};
                }

                return {
                    id: parseInt(item.id, 10),
                    form_type: item.tipo_solicitud,
                    data: parsedData,
                    verification_email: item.email_usuario,
                    email_verified: item.email_confirmado !== undefined ? item.email_confirmado : true,
                    created_at: item.fecha_solicitud,
                    estado: item.estado
                };
            }) : [];

            filteredApprovals = [...pendingApprovals];

            // Actualizar contador en el badge
            updateApprovalsBadge(pendingApprovals.length);

            // Renderizar lista
            renderApprovalsList();

        } else {
            const errorMsg = result?.error || 'Error desconocido al cargar solicitudes';
            showApprovalsError(errorMsg);
        }

    } catch (error) {
        showApprovalsError('Error de conexión con el servidor: ' + error.message);
    }
}

/**
 * Actualizar badge con cantidad de solicitudes pendientes
 */
function updateApprovalsBadge(count) {
    const badge = document.getElementById('approvals-count');
    if (badge) {
        badge.textContent = count;
        badge.className = count > 0 ? 'badge bg-warning ms-1' : 'badge bg-secondary ms-1';
    }

    const totalSpan = document.getElementById('total-pending-approvals');
    if (totalSpan) {
        totalSpan.textContent = count;
    }
}

/**
 * Renderizar lista de solicitudes
 */
function renderApprovalsList() {
    const container = document.getElementById('approvals-list');
    if (!container) return;

    if (filteredApprovals.length === 0) {
        container.innerHTML = DOMPurify.sanitize(`
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5>No hay solicitudes pendientes</h5>
                <p class="text-muted">Todas las solicitudes han sido procesadas.</p>
            </div>
        `);
        return;
    }

    let html = '';

    filteredApprovals.forEach(approval => {
        const formTypeLabel = getFormTypeLabel(approval.form_type);
        const formTypeIcon = getFormTypeIcon(approval.form_type);
        const formTypeBadge = getFormTypeBadge(approval.form_type);

        html += `
            <div class="card mb-3 approval-card" data-approval-id="${approval.id}">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <div>
                        <i class="${formTypeIcon} me-2"></i>
                        <strong>${formTypeLabel}</strong>
                        <span class="badge ${formTypeBadge} ms-2">${approval.form_type}</span>
                    </div>
                    <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>
                        ${formatDate(approval.created_at)}
                    </small>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            ${renderApprovalData(approval)}
                        </div>
                        <div class="col-md-4">
                            <div class="d-grid gap-2">
                                <button class="btn btn-success" data-action="approve-submission" data-param-1="event">
                                    <i class="fas fa-check me-2"></i>Aprobar
                                </button>
                                <button class="btn btn-danger" data-action="reject-submission" data-param-1="event">
                                    <i class="fas fa-times me-2"></i>Rechazar
                                </button>
                                <button class="btn btn-sm btn-outline-primary" data-action="view-full-data" data-param-1="${approval.id}">
                                    <i class="fas fa-eye me-2"></i>Ver Detalles Completos
                                </button>
                            </div>

                            <div class="mt-3">
                                <small class="text-muted">
                                    <i class="fas fa-envelope me-1"></i>
                                    ${approval.verification_email}
                                </small>
                                <br>
                                ${getEstadoStatus(approval.estado)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = DOMPurify.sanitize( DOMPurify.sanitize(html, 'ugc'));
}

/**
 * Renderizar datos del formulario según tipo
 */
function renderApprovalData(approval) {
    const data = approval.data;
    let html = '<dl class="row mb-0">';

    if (approval.form_type === 'bolsa_trabajo') {
        html += `
            <dt class="col-sm-4">Nombre:</dt>
            <dd class="col-sm-8">${data.name || data.nombre || 'No especificado'}</dd>

            <dt class="col-sm-4">Email:</dt>
            <dd class="col-sm-8">${data.email || 'No especificado'}</dd>

            <dt class="col-sm-4">Teléfono:</dt>
            <dd class="col-sm-8">${data.phone || data.telefono || 'No especificado'}</dd>

            <dt class="col-sm-4">Año de Egreso:</dt>
            <dd class="col-sm-8">${data.graduationYear || data.ano_egreso || 'No especificado'}</dd>

            <dt class="col-sm-4">Área de Interés:</dt>
            <dd class="col-sm-8">${data.subject || data.area_interes || 'No especificado'}</dd>

            <dt class="col-sm-4">Resumen Profesional:</dt>
            <dd class="col-sm-8">${data.message || data.resumen || 'No especificado'}</dd>

            <dt class="col-sm-4">Habilidades:</dt>
            <dd class="col-sm-8">${data.skills || 'No especificadas'}</dd>
        `;

    } else if (approval.form_type === 'egresados') {
        html += `
            <dt class="col-sm-4">Nombre:</dt>
            <dd class="col-sm-8">${data.name || data.nombre_completo || 'No especificado'}</dd>

            <dt class="col-sm-4">Email:</dt>
            <dd class="col-sm-8">${data.email || 'No especificado'}</dd>

            <dt class="col-sm-4">Teléfono:</dt>
            <dd class="col-sm-8">${data.phone || data.telefono || 'No especificado'}</dd>

            <dt class="col-sm-4">Generación:</dt>
            <dd class="col-sm-8">${data.graduationYear || data.generacion || 'No especificado'}</dd>

            <dt class="col-sm-4">Ocupación Actual:</dt>
            <dd class="col-sm-8">${data.currentJob || data.ocupacion_actual || 'No especificado'}</dd>

            <dt class="col-sm-4">Empresa:</dt>
            <dd class="col-sm-8">${data.company || data.empresa || 'No especificado'}</dd>
        `;
    }

    html += '</dl>';
    return html;
}

/**
 * Obtener etiqueta de tipo de formulario
 */
function getFormTypeLabel(formType) {
    const labels = {
        'bolsa_trabajo': 'Bolsa de Trabajo',
        'egresados': 'Actualización de Egresados'
    };
    return labels[formType] || formType;
}

/**
 * Obtener icono de tipo de formulario
 */
function getFormTypeIcon(formType) {
    const icons = {
        'bolsa_trabajo': 'fas fa-briefcase',
        'egresados': 'fas fa-user-graduate'
    };
    return icons[formType] || 'fas fa-file';
}

/**
 * Obtener badge de tipo de formulario
 */
function getFormTypeBadge(formType) {
    const badges = {
        'bolsa_trabajo': 'bg-primary',
        'egresados': 'bg-info'
    };
    return badges[formType] || 'bg-secondary';
}

/**
 * 🎯 Mostrar estado de confirmación de email
 * - pendiente_confirmacion: Rojo/Naranja - esperando confirmación de email
 * - pendiente: Amarillo - email confirmado, esperando aprobación admin
 */
function getEstadoStatus(estado) {
    if (estado === 'pendiente_confirmacion') {
        return `<small class="text-danger">
                    <i class="fas fa-exclamation-circle me-1"></i>
                    ⏳ Pendiente: Email sin confirmar
                </small>`;
    } else if (estado === 'pendiente') {
        return `<small class="text-success">
                    <i class="fas fa-check-circle me-1"></i>
                    ✅ Email Confirmado - Esperando Aprobación
                </small>`;
    } else if (estado === 'aprobado') {
        return `<small class="text-success">
                    <i class="fas fa-thumbs-up me-1"></i>
                    ✅ Aprobado
                </small>`;
    } else if (estado === 'rechazado') {
        return `<small class="text-danger">
                    <i class="fas fa-thumbs-down me-1"></i>
                    ❌ Rechazado
                </small>`;
    } else {
        return `<small class="text-muted">${estado}</small>`;
    }
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    } else if (hours < 24) {
        return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
        const days = Math.floor(hours / 24);
        return `Hace ${days} día${days !== 1 ? 's' : ''}`;
    }
}

/**
 * Filtrar aprobaciones
 */
function filterApprovals() {
    const formTypeFilter = document.getElementById('filter-form-type').value;

    filteredApprovals = pendingApprovals.filter(approval => {
        if (formTypeFilter && approval.form_type !== formTypeFilter) {
            return false;
        }
        return true;
    });

    void 0;
    renderApprovalsList();
}

/**
 * Aprobar solicitud - Usa el nuevo endpoint /api/pendientes-aprobacion/aprobar/:id
 */
async function approveSubmission(eventOrId) {
    // Extraer el ID del evento o parámetro
    let id;
    if (typeof eventOrId === 'object' && eventOrId.target) {
        // Es un evento (nuevo método robusto)
        const card = eventOrId.target.closest('[data-approval-id]');
        if (!card) {
            console.error('❌ No se encontró el elemento con data-approval-id');
            return;
        }
        id = parseInt(card.getAttribute('data-approval-id'), 10);
        void 0;
    } else {
        // Es un ID directo (compatibilidad hacia atrás)
        id = eventOrId;
    }

    if (!confirm('¿Estás seguro de que deseas aprobar esta solicitud?')) {
        return;
    }

    const approval = pendingApprovals.find(a => a.id === id);
    if (!approval) {
        console.error(`❌ Solicitud ${id} no encontrada en la lista local`);
        console.error(`   Tipo de ID buscado: ${typeof id} (${id})`);
        console.error(`   Array pendingApprovals:`, pendingApprovals);
        console.error(`   IDs disponibles:`, pendingApprovals.map(a => `${a.id} (${typeof a.id})`));
        console.error(`   Comparación detallada:`);
        pendingApprovals.forEach(a => {
            console.error(`     - a.id=${a.id} (${typeof a.id}) === id=${id} (${typeof id}) ? ${a.id === id}`);
        });
        showNotification(`Error: Solicitud ${id} no encontrada. Intenta recargar la página.`, 'error');
        return;
    }

    void 0;
    void 0;
    void 0;

    try {
        const requestBody = {
            admin_id: 1,
            admin_notas: 'Aprobado desde el panel administrativo'
        };

        void 0;
        void 0;

        const response = await fetch(`/api/pendientes-aprobacion/aprobar/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        void 0;
        void 0;
        void 0;

        // Verificar si la respuesta HTTP es correcta
        if (!response.ok) {
            void 0;
        }

        const result = await response.json();
        void 0;

        if (result && result.success) {
            void 0;
            void 0;

            // Mostrar notificación
            showNotification('✅ Solicitud aprobada exitosamente. Se movió a la tabla definitiva.', 'success');

            // Eliminar de la lista
            const initialLength = pendingApprovals.length;
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            filteredApprovals = filteredApprovals.filter(a => a.id !== id);

            void 0;

            // Actualizar badge y lista
            updateApprovalsBadge(pendingApprovals.length);
            renderApprovalsList();

        } else {
            const errorMsg = result?.error || result?.message || 'Error desconocido';
            console.error('❌ [APROBAR] El servidor retornó error:', errorMsg);
            console.error('   Respuesta completa:', result);
            showNotification('Error al aprobar la solicitud: ' + errorMsg, 'error');
        }

    } catch (error) {
        console.error('❌ [APROBAR] Error de conexión o parsing:', error);
        console.error('   Tipo de error:', error.name);
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
        showNotification('Error de conexión con el servidor: ' + error.message, 'error');
    }
}

/**
 * Rechazar solicitud - Usa el nuevo endpoint /api/pendientes-aprobacion/rechazar/:id
 */
async function rejectSubmission(eventOrId) {
    // Extraer el ID del evento o parámetro
    let id;
    if (typeof eventOrId === 'object' && eventOrId.target) {
        // Es un evento (nuevo método robusto)
        const card = eventOrId.target.closest('[data-approval-id]');
        if (!card) {
            console.error('❌ No se encontró el elemento con data-approval-id');
            return;
        }
        id = parseInt(card.getAttribute('data-approval-id'), 10);
        void 0;
    } else {
        // Es un ID directo (compatibilidad hacia atrás)
        id = eventOrId;
    }

    const reason = prompt('¿Por qué deseas rechazar esta solicitud?\n\nEsta razón se guardará en la base de datos:');

    if (!reason) {
        return; // Usuario canceló
    }

    void 0;
    void 0;

    try {
        const response = await fetch(`/api/pendientes-aprobacion/rechazar/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_id: 1,
                admin_notas: reason
            })
        });

        void 0;

        const result = await response.json();
        void 0;

        if (result.success) {
            void 0;

            // Mostrar notificación
            showNotification('❌ Solicitud rechazada y eliminada de la base de datos.', 'warning');

            // Eliminar de la lista
            const initialLength = pendingApprovals.length;
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            filteredApprovals = filteredApprovals.filter(a => a.id !== id);

            void 0;

            // Actualizar badge y lista
            updateApprovalsBadge(pendingApprovals.length);
            renderApprovalsList();

        } else {
            const errorMsg = result?.error || result?.message || 'Error desconocido';
            console.error('❌ [RECHAZAR] Error al rechazar:', errorMsg);
            showNotification('Error al rechazar la solicitud: ' + errorMsg, 'error');
        }

    } catch (error) {
        console.error('❌ [RECHAZAR] Error de conexión:', error);
        showNotification('Error de conexión con el servidor', 'error');
    }
}

/**
 * Ver datos completos
 */
function viewFullData(id) {
    const approval = pendingApprovals.find(a => a.id === id);
    if (!approval) return;

    const dataJson = JSON.stringify(approval.data, null, 2);

    const modal = `
        <div class="modal fade" id="dataModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Datos Completos - Solicitud #${id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <pre class="bg-light p-3 rounded"><code>${dataJson}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal anterior si existe
    const oldModal = document.getElementById('dataModal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize( DOMPurify.sanitize(modal)));

    const modalElement = document.getElementById('dataModal');
    const bsModal = new bootstrap.Modal(modalElement);
    bsModal.show();

    // Limpiar al cerrar
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
}

/**
 * Refrescar lista de aprobaciones
 */
function refreshApprovals() {
    loadPendingApprovals();
}

/**
 * Mostrar error en la lista
 */
function showApprovalsError(message) {
    const container = document.getElementById('approvals-list');
    if (!container) return;

    container.innerHTML = DOMPurify.sanitize(`
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button class="btn btn-sm btn-outline-danger ms-3" data-action="load-pending-approvals">
                <i class="fas fa-sync-alt me-1"></i>Reintentar
            </button>
        </div>
    `);
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info') {
    // Crear contenedor si no existe
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const colors = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${colors[type] || colors.info} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = DOMPurify.sanitize(`
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `);

    container.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Auto-cargar al cambiar a la pestaña de aprobaciones
document.addEventListener('DOMContentLoaded', () => {
    const approvalsTab = document.getElementById('approvals-tab');
    if (approvalsTab) {
        approvalsTab.addEventListener('shown.bs.tab', () => {
            
            loadPendingApprovals();
        });
    }

    // Cargar estadísticas iniciales para el badge
    loadPendingApprovals();
});


