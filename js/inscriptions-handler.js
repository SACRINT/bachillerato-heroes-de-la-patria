/**
 * 📝 GESTOR DE INSCRIPCIONES CON SOLICITUD-APROBACIÓN
 * Maneja inscripciones de estudiantes logueados y no logueados
 */

console.log('📝 [INSCRIPTIONS HANDLER] Cargando gestor de inscripciones...');

// Variable global para almacenar datos temporales
window.currentActivityData = null;

/**
 * Mostrar modal de inscripción
 * @param {string} activityName - Nombre de la actividad
 * @param {string} activityId - ID de la actividad (opcional)
 */
function showActivityRegistration(activityName, activityId = null) {
    console.log('📅 Mostrando modal de inscripción para:', activityName);

    // Guardar datos de actividad
    window.currentActivityData = {
        name: activityName,
        id: activityId || `ACT-${Date.now()}`
    };

    // Verificar si el usuario está logueado
    const session = JSON.parse(localStorage.getItem('studentSession') || '{}');
    const isLoggedIn = session && session.student && session.student.id;

    console.log('🔍 Estado de sesión:', isLoggedIn ? 'Logueado' : 'No logueado');

    if (isLoggedIn) {
        // Usuario logueado → Modal de confirmación simple
        showConfirmationModal(activityName);
    } else {
        // Usuario NO logueado → Modal con formulario de datos
        showRegistrationFormModal(activityName);
    }
}

/**
 * Modal de confirmación para usuarios logueados
 */
function showConfirmationModal(activityName) {
    const modalHTML = `
    <div class="modal fade" id="activityModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-warning text-white">
                    <h5 class="modal-title">📝 Solicitud de Inscripción</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="fas fa-paper-plane fa-3x text-warning mb-3"></i>
                        <h4>¿Enviar solicitud de inscripción para:</h4>
                        <h5 class="text-primary">${activityName}</h5>
                    </div>
                    <div class="alert alert-warning">
                        <i class="fas fa-clock me-2"></i>
                        <strong>⏳ Tu solicitud será revisada</strong><br>
                        El administrador revisará tu solicitud y recibirás un email cuando sea aprobada o rechazada.
                    </div>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Guarda el email de confirmación como comprobante de tu solicitud.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-warning" onclick="confirmActivityRegistration()">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Solicitud
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    // Remover modal anterior si existe
    const oldModal = document.getElementById('activityModal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar modal
    const modalElement = document.getElementById('activityModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Modal con formulario para usuarios NO logueados
 */
function showRegistrationFormModal(activityName) {
    const modalHTML = `
    <div class="modal fade" id="activityModal" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">📝 Solicitud de Inscripción</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Para inscribirte a <strong>${activityName}</strong>, por favor completa tus datos:
                    </div>

                    <form id="inscriptionForm">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Nombre Completo <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="studentName" required
                                       placeholder="Ej: Juan Pérez García">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Email <span class="text-danger">*</span></label>
                                <input type="email" class="form-control" id="studentEmail" required
                                       placeholder="tu.email@ejemplo.com">
                            </div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">Teléfono/WhatsApp <span class="text-danger">*</span></label>
                                <input type="tel" class="form-control" id="studentPhone" required
                                       placeholder="5551234567">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Matrícula (si eres estudiante)</label>
                                <input type="text" class="form-control" id="studentId"
                                       placeholder="Ej: 2025-A-123">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Grupo/Grado (si eres estudiante)</label>
                            <input type="text" class="form-control" id="studentGroup"
                                   placeholder="Ej: 3° A">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">¿Por qué quieres participar en esta actividad?</label>
                            <textarea class="form-control" id="additionalInfo" rows="3"
                                      placeholder="Cuéntanos brevemente tu motivación..."></textarea>
                        </div>

                        <div class="alert alert-warning">
                            <i class="fas fa-clock me-2"></i>
                            <strong>⏳ Tu solicitud será revisada</strong><br>
                            El administrador revisará tu solicitud y recibirás un email cuando sea aprobada o rechazada.
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="confirmActivityRegistration()">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Solicitud
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    // Remover modal anterior si existe
    const oldModal = document.getElementById('activityModal');
    if (oldModal) oldModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar modal
    const modalElement = document.getElementById('activityModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

/**
 * Confirmar inscripción (usuarios logueados Y no logueados)
 */
async function confirmActivityRegistration() {
    console.log('📤 Confirmando inscripción...');

    // Verificar si el usuario está logueado
    const session = JSON.parse(localStorage.getItem('studentSession') || '{}');
    const isLoggedIn = session && session.student && session.student.id;

    let inscriptionData = {};

    if (isLoggedIn) {
        // Usuario logueado: Usar datos de la sesión
        inscriptionData = {
            activityId: window.currentActivityData.id,
            activityName: window.currentActivityData.name,
            studentId: session.student.id,
            studentName: session.student.name || 'Estudiante',
            studentEmail: session.student.email || 'No proporcionado',
            studentGroup: session.student.group || 'No especificado',
            emergencyContact: session.student.phone || 'No proporcionado',
            additionalInfo: 'Inscripción desde portal estudiantil (usuario logueado)'
        };
    } else {
        // Usuario NO logueado: Obtener datos del formulario
        const form = document.getElementById('inscriptionForm');

        // Validar formulario
        if (!form || !form.checkValidity()) {
            if (form) form.reportValidity();
            return;
        }

        const name = document.getElementById('studentName').value.trim();
        const email = document.getElementById('studentEmail').value.trim();
        const phone = document.getElementById('studentPhone').value.trim();
        const matricula = document.getElementById('studentId').value.trim() || 'Externo';
        const group = document.getElementById('studentGroup').value.trim() || 'No especificado';
        const additionalInfo = document.getElementById('additionalInfo').value.trim();

        // Validaciones básicas
        if (!name || !email || !phone) {
            showNotification('❌ Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('❌ Por favor ingresa un email válido', 'error');
            return;
        }

        inscriptionData = {
            activityId: window.currentActivityData.id,
            activityName: window.currentActivityData.name,
            studentId: matricula,
            studentName: name,
            studentEmail: email,
            studentGroup: group,
            emergencyContact: phone,
            additionalInfo: additionalInfo || 'Solicitud de usuario no registrado'
        };
    }

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
    if (modal) modal.hide();

    // Mostrar loader
    showNotification('📤 Enviando solicitud de inscripción...', 'info');

    try {
        // Enviar solicitud al backend
        const response = await fetch('/api/inscriptions/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inscriptionData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`✅ ${data.message}`, 'success');

            // Mostrar información adicional
            setTimeout(() => {
                showNotification('📧 Revisa tu correo electrónico para más información', 'info');
            }, 2500);
        } else {
            showNotification(`❌ ${data.message}`, 'error');
        }

    } catch (error) {
        console.error('❌ Error en inscripción:', error);
        showNotification('❌ Error al procesar la inscripción. Por favor intenta nuevamente.', 'error');
    }
}

/**
 * Mostrar notificación en pantalla
 */
function showNotification(message, type = 'info') {
    // Crear contenedor si no existe
    let container = document.getElementById('notificationsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // Determinar color según tipo
    const colors = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `toast align-items-center text-white ${colors[type] || colors.info} border-0`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${icons[type] || icons.info} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    container.appendChild(notification);

    // Mostrar toast
    const toast = new bootstrap.Toast(notification, { delay: 5000 });
    toast.show();

    // Eliminar del DOM después de ocultar
    notification.addEventListener('hidden.bs.toast', () => {
        notification.remove();
    });
}

console.log('✅ [INSCRIPTIONS HANDLER] Gestor cargado correctamente');
