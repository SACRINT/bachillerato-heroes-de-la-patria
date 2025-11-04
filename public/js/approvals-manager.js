/**
 * 📋 APPROVALS MANAGER
 * Gestión de solicitudes pendientes de aprobación
 * Fecha: 17 Octubre 2025
 */

console.log('📋 [APPROVALS MANAGER] Cargando sistema de aprobaciones...');

// Variable global para almacenar las solicitudes
let pendingApprovals = [];
let filteredApprovals = [];

/**
 * Cargar solicitudes pendientes desde /api/pendientes-aprobacion
 */
async function loadPendingApprovals() {
    console.log('📋 Cargando solicitudes pendientes...');

    try {
        // Filtrar por: estado='pendiente' (todos los registros pendientes sin importar confirmación)
        // ✅ ACTUALIZADO: Remover filtro email_confirmado=true para mostrar TODOS los pendientes
        const response = await fetch('/api/pendientes-aprobacion?estado=pendiente&limit=100');

        // Verificar status HTTP
        if (!response.ok) {
            console.error('❌ Error HTTP:', response.status, response.statusText);
            showApprovalsError(`Error del servidor: ${response.status}`);
            return;
        }

        const result = await response.json();

        if (result && result.success) {
            console.log('DEBUG: API result:', result);
            console.log(`DEBUG: Total en BD: ${result.total}, Registros recibidos: ${result.data ? result.data.length : 0}`);

            // Transformar datos de la nueva API al formato esperado
            pendingApprovals = Array.isArray(result.data) ? result.data.map(item => ({
                id: item.id,
                form_type: item.tipo_solicitud,
                data: item.datos_json,
                verification_email: item.email_usuario,
                email_verified: item.email_confirmado !== undefined ? item.email_confirmado : true, // Verificar si existe la columna
                created_at: item.fecha_solicitud,
                estado: item.estado // Incluir estado para debugging
            })) : [];

            console.log('DEBUG: pendingApprovals after assignment:', pendingApprovals);
            filteredApprovals = [...pendingApprovals];

            console.log(`✅ Cargadas ${pendingApprovals.length} solicitudes pendientes (Total en BD: ${result.total})`);

            // Actualizar contador en el badge
            updateApprovalsBadge(pendingApprovals.length);

            // Renderizar lista
            renderApprovalsList();

        } else {
            const errorMsg = result?.error || 'Error desconocido al cargar solicitudes';
            console.error('❌ Error al cargar solicitudes:', errorMsg);
            showApprovalsError(errorMsg);
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error);
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
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h5>No hay solicitudes pendientes</h5>
                <p class="text-muted">Todas las solicitudes han sido procesadas.</p>
            </div>
        `;
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
                                <button class="btn btn-success" onclick="approveSubmission(event)">
                                    <i class="fas fa-check me-2"></i>Aprobar
                                </button>
                                <button class="btn btn-danger" onclick="rejectSubmission(event)">
                                    <i class="fas fa-times me-2"></i>Rechazar
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewFullData(${approval.id})">
                                    <i class="fas fa-eye me-2"></i>Ver Detalles Completos
                                </button>
                            </div>

                            <div class="mt-3">
                                <small class="text-muted">
                                    <i class="fas fa-envelope me-1"></i>
                                    ${approval.verification_email}
                                </small>
                                <br>
                                <small class="${approval.email_verified ? 'text-success' : 'text-warning'}">
                                    <i class="fas ${approval.email_verified ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i>
                                    ${approval.email_verified ? 'Email Verificado' : 'Email No Verificado'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
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

            <dt class="col-sm-4">Puesto Deseado:</dt>
            <dd class="col-sm-8">${data.position || data.puesto_deseado || 'No especificado'}</dd>

            <dt class="col-sm-4">Experiencia:</dt>
            <dd class="col-sm-8">${data.experience || data.nivel_experiencia || 'No especificado'}</dd>

            <dt class="col-sm-4">Disponibilidad:</dt>
            <dd class="col-sm-8">${data.availability || data.disponibilidad || 'No especificado'}</dd>
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

    console.log(`📋 Filtradas ${filteredApprovals.length} de ${pendingApprovals.length} solicitudes`);
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
        console.log(`🔍 [APROBAR] ID extraído del elemento HTML: ${id}`);
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
        console.error(`   Array pendingApprovals:`, pendingApprovals);
        console.error(`   IDs disponibles:`, pendingApprovals.map(a => a.id));
        showNotification(`Error: Solicitud ${id} no encontrada. Intenta recargar la página.`, 'error');
        return;
    }

    console.log(`✅ [APROBAR] Iniciando aprobación de solicitud ${id}`);
    console.log(`   Tipo de solicitud: ${approval.form_type}`);
    console.log(`   Email: ${approval.verification_email}`);

    try {
        const requestBody = {
            admin_id: 1,
            admin_notas: 'Aprobado desde el panel administrativo'
        };

        console.log(`📤 [APROBAR] Enviando POST a /api/pendientes-aprobacion/aprobar/${id}`);
        console.log(`   Body:`, JSON.stringify(requestBody));

        const response = await fetch(`/api/pendientes-aprobacion/aprobar/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`📥 [APROBAR] Respuesta HTTP recibida`);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   OK: ${response.ok}`);

        // Verificar si la respuesta HTTP es correcta
        if (!response.ok) {
            console.warn(`⚠️ [APROBAR] Status HTTP no es OK (${response.status})`);
        }

        const result = await response.json();
        console.log(`📊 [APROBAR] JSON parseado:`, result);

        if (result && result.success) {
            console.log('✅ [APROBAR] Solicitud aprobada exitosamente en el servidor');
            console.log(`   Respuesta del servidor:`, result.message);

            // Mostrar notificación
            showNotification('✅ Solicitud aprobada exitosamente. Se movió a la tabla definitiva.', 'success');

            // Eliminar de la lista
            const initialLength = pendingApprovals.length;
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            filteredApprovals = filteredApprovals.filter(a => a.id !== id);

            console.log(`✅ [APROBAR] Eliminado del array local: ${initialLength} → ${pendingApprovals.length} solicitudes`);

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
        console.log(`🔍 [RECHAZAR] ID extraído del elemento HTML: ${id}`);
    } else {
        // Es un ID directo (compatibilidad hacia atrás)
        id = eventOrId;
    }

    const reason = prompt('¿Por qué deseas rechazar esta solicitud?\n\nEsta razón se guardará en la base de datos:');

    if (!reason) {
        return; // Usuario canceló
    }

    console.log(`❌ [RECHAZAR] Rechazando solicitud ${id}...`);
    console.log(`   Razón: ${reason}`);

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

        console.log(`📥 [RECHAZAR] Respuesta HTTP recibida: ${response.status}`);

        const result = await response.json();
        console.log(`📊 [RECHAZAR] Respuesta del servidor:`, result);

        if (result.success) {
            console.log('✅ [RECHAZAR] Solicitud rechazada exitosamente');

            // Mostrar notificación
            showNotification('❌ Solicitud rechazada y eliminada de la base de datos.', 'warning');

            // Eliminar de la lista
            const initialLength = pendingApprovals.length;
            pendingApprovals = pendingApprovals.filter(a => a.id !== id);
            filteredApprovals = filteredApprovals.filter(a => a.id !== id);

            console.log(`✅ [RECHAZAR] Eliminado del array local: ${initialLength} → ${pendingApprovals.length} solicitudes`);

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

    document.body.insertAdjacentHTML('beforeend', modal);

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

    container.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="loadPendingApprovals()">
                <i class="fas fa-sync-alt me-1"></i>Reintentar
            </button>
        </div>
    `;
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
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

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
            console.log('📋 Pestaña de aprobaciones activada');
            loadPendingApprovals();
        });
    }

    // Cargar estadísticas iniciales para el badge
    loadPendingApprovals();
});

console.log('✅ [APPROVALS MANAGER] Sistema cargado correctamente');
