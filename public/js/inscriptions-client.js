/**
 * 📝 CLIENTE DE INSCRIPCIONES
 * Gestiona inscripciones a actividades estudiantiles
 */

class InscriptionsClient {
    constructor() {
        this.baseURL = '/api/inscriptions';
    }

    /**
     * 📝 Registrar nueva inscripción
     */
    async register(activityData) {
        try {
            // Validar que el estudiante esté logueado
            if (!window.studentAuth || !window.studentAuth.isLoggedIn()) {
                return {
                    success: false,
                    message: 'Debes iniciar sesión para inscribirte'
                };
            }

            const student = window.studentAuth.getStudent();

            // Preparar datos de inscripción
            const inscriptionData = {
                activityName: activityData.activityName,
                studentId: student.id,
                studentName: student.name,
                studentEmail: activityData.studentEmail || student.email,
                studentGroup: student.group,
                emergencyContact: activityData.emergencyContact,
                additionalInfo: activityData.additionalInfo || ''
            };

            console.log('📝 Enviando inscripción:', inscriptionData);

            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(inscriptionData)
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Inscripción exitosa:', data.inscription.inscriptionId);
                return {
                    success: true,
                    inscription: data.inscription,
                    capacity: data.capacity
                };
            } else {
                console.error('❌ Error en inscripción:', data.message);
                return {
                    success: false,
                    message: data.message,
                    capacity: data.capacity
                };
            }
        } catch (error) {
            console.error('❌ Error registrando inscripción:', error);
            return {
                success: false,
                message: 'Error de conexión. Por favor intenta nuevamente.'
            };
        }
    }

    /**
     * 📊 Obtener actividades con estadísticas
     */
    async getActivities() {
        try {
            const response = await fetch(`${this.baseURL}/activities`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    activities: data.activities
                };
            } else {
                return {
                    success: false,
                    message: 'Error al obtener actividades'
                };
            }
        } catch (error) {
            console.error('❌ Error obteniendo actividades:', error);
            return {
                success: false,
                message: 'Error de conexión'
            };
        }
    }

    /**
     * 🔍 Verificar si un estudiante ya está inscrito
     */
    async checkRegistration(studentId, activityId) {
        try {
            const response = await fetch(`${this.baseURL}/check/${studentId}/${activityId}`, {
                credentials: 'include'
            });

            const data = await response.json();

            return {
                success: true,
                isRegistered: data.isRegistered,
                inscription: data.inscription
            };
        } catch (error) {
            console.error('❌ Error verificando inscripción:', error);
            return {
                success: false,
                message: 'Error al verificar inscripción'
            };
        }
    }

    /**
     * 📋 Obtener lista de inscritos (requiere permisos admin)
     */
    async getInscriptions(activityId = null) {
        try {
            let url = `${this.baseURL}/list`;
            if (activityId) {
                url += `?activityId=${activityId}`;
            }

            const response = await fetch(url, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    inscriptions: data.inscriptions,
                    total: data.total
                };
            } else {
                return {
                    success: false,
                    message: 'Error al obtener inscripciones'
                };
            }
        } catch (error) {
            console.error('❌ Error obteniendo inscripciones:', error);
            return {
                success: false,
                message: 'Error de conexión'
            };
        }
    }
}

// Instancia global
const inscriptionsClient = new InscriptionsClient();

/**
 * 📝 Función mejorada para mostrar modal de inscripción
 * Integrada con autenticación y backend real
 */
async function showActivityRegistration(activityName) {
    console.log(`🎯 Mostrando modal de inscripción para: ${activityName}`);

    // 1. Verificar si el estudiante está logueado
    if (!window.studentAuth || !window.studentAuth.isLoggedIn()) {
        // Mostrar mensaje y redirigir al login
        if (confirm('Debes iniciar sesión para inscribirte. ¿Deseas iniciar sesión ahora?')) {
            showStudentLoginModal();
        }
        return;
    }

    const student = window.studentAuth.getStudent();

    // 2. Verificar si ya está inscrito
    const activityId = activityName.toLowerCase().replace(/\s+/g, '-');
    const checkResult = await inscriptionsClient.checkRegistration(student.id, activityId);

    if (checkResult.isRegistered) {
        alert(`Ya estás inscrito en "${activityName}"\n\nFolio: ${checkResult.inscription.inscriptionId}`);
        return;
    }

    // 3. Crear modal con datos del estudiante
    const modalHtml = `
        <div class="modal fade" id="activityModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>Inscripción - ${activityName}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="inscription-alert-container"></div>

                        <form id="activityForm">
                            <!-- Sesión actual -->
                            <div class="alert alert-success">
                                <i class="fas fa-user-check me-2"></i>
                                <strong>Sesión activa:</strong> ${student.name} (${student.group})
                            </div>

                            <!-- Campos auto-completados (readonly) -->
                            <div class="mb-3">
                                <label for="studentName" class="form-label">
                                    <i class="fas fa-user me-2"></i>Nombre completo
                                </label>
                                <input type="text" class="form-control" id="studentName"
                                       value="${student.name}" readonly style="background-color: #e9ecef;">
                            </div>

                            <div class="mb-3">
                                <label for="studentGroup" class="form-label">
                                    <i class="fas fa-users me-2"></i>Grupo
                                </label>
                                <input type="text" class="form-control" id="studentGroup"
                                       value="${student.group}" readonly style="background-color: #e9ecef;">
                            </div>

                            <!-- Campos editables -->
                            <div class="mb-3">
                                <label for="studentEmail" class="form-label">
                                    <i class="fas fa-envelope me-2"></i>Email de contacto *
                                </label>
                                <input type="email" class="form-control" id="studentEmail"
                                       value="${student.email}" required>
                                <small class="form-text text-muted">Recibirás la confirmación aquí</small>
                            </div>

                            <div class="mb-3">
                                <label for="emergencyContact" class="form-label">
                                    <i class="fas fa-phone me-2"></i>Contacto de emergencia *
                                </label>
                                <input type="tel" class="form-control" id="emergencyContact"
                                       placeholder="222-123-4567" required>
                                <small class="form-text text-muted">Teléfono de padre/madre o tutor</small>
                            </div>

                            <div class="mb-3">
                                <label for="additionalInfo" class="form-label">
                                    <i class="fas fa-info-circle me-2"></i>Información adicional (opcional)
                                </label>
                                <textarea class="form-control" id="additionalInfo" rows="3"
                                          placeholder="Alergias, experiencia previa, etc."></textarea>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-clock me-2"></i>
                                Tu inscripción será confirmada por email dentro de 24 horas.
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" id="submitInscriptionBtn"
                                onclick="submitActivityRegistration('${activityName}')">
                            <i class="fas fa-check me-2"></i>Confirmar Inscripción
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si existe
    const existingModal = document.getElementById('activityModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    try {
        const modal = new bootstrap.Modal(document.getElementById('activityModal'));
        modal.show();

        // Focus en email
        setTimeout(() => {
            document.getElementById('studentEmail').focus();
        }, 500);
    } catch (error) {
        console.error('❌ Error mostrando modal:', error);
    }
}

/**
 * ✅ Enviar inscripción a actividad (conectado a backend real)
 */
async function submitActivityRegistration(activityName) {
    console.log(`📤 Enviando inscripción a: ${activityName}`);

    // Obtener datos del formulario
    const studentEmail = document.getElementById('studentEmail').value.trim();
    const emergencyContact = document.getElementById('emergencyContact').value.trim();
    const additionalInfo = document.getElementById('additionalInfo').value.trim();

    // Validar campos requeridos
    if (!studentEmail || !emergencyContact) {
        showInscriptionAlert('Por favor completa todos los campos requeridos', 'warning');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
        showInscriptionAlert('Por favor ingresa un email válido', 'warning');
        return;
    }

    // Deshabilitar botón y mostrar loading
    const button = document.getElementById('submitInscriptionBtn');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Procesando...';

    try {
        // Enviar inscripción al backend
        const result = await inscriptionsClient.register({
            activityName,
            studentEmail,
            emergencyContact,
            additionalInfo
        });

        if (result.success) {
            // Mostrar mensaje de éxito
            showInscriptionAlert(
                `¡Inscripción exitosa! <br>
                <strong>Folio:</strong> ${result.inscription.inscriptionId}<br>
                <strong>Actividad:</strong> ${result.inscription.activityName}<br>
                <strong>Cupos disponibles:</strong> ${result.capacity.available} de ${result.capacity.total}`,
                'success'
            );

            // Cerrar modal después de 3 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
                if (modal) modal.hide();
            }, 3000);

        } else {
            // Mostrar mensaje de error
            showInscriptionAlert(result.message, 'danger');

            // Re-habilitar botón
            button.disabled = false;
            button.innerHTML = originalText;
        }
    } catch (error) {
        console.error('❌ Error en inscripción:', error);
        showInscriptionAlert('Error al procesar la inscripción. Por favor intenta nuevamente.', 'danger');

        // Re-habilitar botón
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * 📢 Mostrar alerta en modal de inscripción
 */
function showInscriptionAlert(message, type) {
    const container = document.getElementById('inscription-alert-container');
    if (!container) return;

    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    container.innerHTML = alertHTML;

    // Auto-dismiss después de 10 segundos (excepto para éxito)
    if (type !== 'success') {
        setTimeout(() => {
            const alert = container.querySelector('.alert');
            if (alert) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 10000);
    }
}

// Exportar para uso global
window.inscriptionsClient = inscriptionsClient;
window.showActivityRegistration = showActivityRegistration;
window.submitActivityRegistration = submitActivityRegistration;