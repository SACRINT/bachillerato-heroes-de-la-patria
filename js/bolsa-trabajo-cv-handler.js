/**
 * 🎓 HANDLER ESPECÍFICO PARA FORMULARIO DE CV (BOLSA DE TRABAJO)
 * Sistema profesional con confirmación de email y aprobación administrativa
 *
 * REEMPLAZA LA FUNCIONALIDAD DE professional-forms.js PARA ESTE FORMULARIO ESPECÍFICO
 */

(function() {
    'use strict';

    console.log('🎓 [BOLSA TRABAJO CV] Inicializando handler...');

    // Configuración
    const CONFIG = {
        apiEndpoint: '/api/bolsa-trabajo/cv',
        requiredFields: ['name', 'email', 'phone', 'graduationYear', 'subject', 'message'],
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        phoneRegex: /^[\d\s\-\+\(\)]{10,}$/
    };

    // Estado
    let formStartTime = 0;
    let formInteractions = {
        keystrokes: 0,
        mouseMovements: 0,
        fieldFocuses: 0
    };

    /**
     * Inicializar formulario
     */
    function initializeForm() {
        const form = document.querySelector('#cvUploadForm');

        if (!form) {
            console.warn('⚠️ [BOLSA TRABAJO CV] Formulario #cvUploadForm no encontrado');
            return;
        }

        console.log('✅ [BOLSA TRABAJO CV] Formulario encontrado, configurando...');

        // IMPORTANTE: Marcar este formulario como ya manejado para evitar que professional-forms.js lo procese
        form.setAttribute('data-handled-by', 'bolsa-trabajo-cv-handler');

        // Registrar tiempo de inicio
        formStartTime = Date.now();

        // Rastrear interacciones (anti-spam)
        setupInteractionTracking(form);

        // Configurar envío del formulario
        form.addEventListener('submit', handleFormSubmit);

        // Generar años de egreso dinámicamente
        populateGraduationYears();

        console.log('✅ [BOLSA TRABAJO CV] Handler configurado correctamente');
    }

    /**
     * Rastrear interacciones del usuario (anti-bot)
     */
    function setupInteractionTracking(form) {
        form.addEventListener('keydown', () => {
            formInteractions.keystrokes++;
        });

        form.addEventListener('mousemove', () => {
            formInteractions.mouseMovements++;
        });

        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('focus', () => {
                formInteractions.fieldFocuses++;
            });
        });
    }

    /**
     * Poblar dropdown de años de egreso
     */
    function populateGraduationYears() {
        const graduationYearSelect = document.getElementById('graduationYear');
        if (!graduationYearSelect) return;

        const currentYear = new Date().getFullYear();
        const startYear = 2000;

        // Limpiar opciones existentes (excepto la primera)
        graduationYearSelect.innerHTML = '<option value="">Seleccionar año...</option>';

        // Generar años desde actual hacia atrás
        for (let year = currentYear + 1; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            graduationYearSelect.appendChild(option);
        }
    }

    /**
     * Manejar envío del formulario
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();  // IMPORTANTE: Prevenir que professional-forms.js también procese este evento

        console.log('📝 [BOLSA TRABAJO CV] Procesando envío de formulario...');

        const form = e.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton?.innerHTML || '<i class="fas fa-save me-2"></i>Guardar Perfil';

        try {
            // 1. Validar checkbox de términos y condiciones
            const termsCheckbox = form.querySelector('#privacyConsent');
            if (!termsCheckbox || !termsCheckbox.checked) {
                showError('Debes aceptar el consentimiento para compartir tu información.');
                termsCheckbox?.focus();
                return;
            }

            // 2. Validar campos obligatorios
            const validation = validateFormFields(form);
            if (!validation.valid) {
                showError(validation.message);
                return;
            }

            // 3. Validaciones de seguridad anti-spam
            const securityCheck = performSecurityChecks();
            if (!securityCheck.passed) {
                showError(securityCheck.message);
                return;
            }

            // 4. Mostrar estado de carga
            showLoadingState(submitButton, 'Enviando perfil...');

            // 5. Preparar datos
            const formData = new FormData(form);
            const dataToSend = prepareFormData(formData);

            console.log('📤 [BOLSA TRABAJO CV] Enviando datos:', dataToSend);

            // 6. Enviar al backend
            const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();
            console.log('📥 [BOLSA TRABAJO CV] Respuesta del servidor:', result);

            if (response.ok && result.success) {
                // ✅ Éxito: Mostrar modal de confirmación
                showSuccessModal(result.data);
                form.reset();
                closeUploadModal();
            } else {
                // ❌ Error del servidor
                showError(result.message || 'Error al enviar el perfil. Intenta nuevamente.');
            }

        } catch (error) {
            console.error('❌ [BOLSA TRABAJO CV] Error procesando formulario:', error);
            showError('Error de conexión. Por favor verifica tu internet e intenta nuevamente.');
        } finally {
            hideLoadingState(submitButton, originalButtonText);
        }
    }

    /**
     * Validar campos del formulario
     */
    function validateFormFields(form) {
        const formData = new FormData(form);

        // Validar campos obligatorios
        for (const fieldName of CONFIG.requiredFields) {
            const value = formData.get(fieldName);
            if (!value || value.trim() === '') {
                return {
                    valid: false,
                    message: `El campo "${getFieldLabel(fieldName)}" es obligatorio.`
                };
            }
        }

        // Validar email
        const email = formData.get('email');
        if (!CONFIG.emailRegex.test(email)) {
            return {
                valid: false,
                message: 'Por favor ingresa un email válido.'
            };
        }

        // Validar teléfono
        const phone = formData.get('phone');
        if (!CONFIG.phoneRegex.test(phone)) {
            return {
                valid: false,
                message: 'Por favor ingresa un teléfono válido (mínimo 10 dígitos).'
            };
        }

        return { valid: true };
    }

    /**
     * Obtener etiqueta legible del campo
     */
    function getFieldLabel(fieldName) {
        const labels = {
            'name': 'Nombre completo',
            'email': 'Correo electrónico',
            'phone': 'Teléfono',
            'graduationYear': 'Año de egreso',
            'subject': 'Área de interés / Especialidad',
            'message': 'Resumen profesional'
        };
        return labels[fieldName] || fieldName;
    }

    /**
     * Verificaciones de seguridad anti-spam
     */
    function performSecurityChecks() {
        const timeSpent = Date.now() - formStartTime;

        // Verificar tiempo mínimo (evitar bots)
        if (timeSpent < 3000) {
            return {
                passed: false,
                message: 'Por favor, tómate tu tiempo para llenar el formulario.'
            };
        }

        // Verificar interacciones mínimas (detectar bots)
        // Threshold bajo (2 keystrokes) permite testing automatizado y usuarios normales
        if (formInteractions.keystrokes < 2) {
            return {
                passed: false,
                message: 'Actividad inusual detectada. Por favor completa el formulario manualmente.'
            };
        }

        // Verificar rate limiting (sesión)
        const sessionKey = 'bolsa_trabajo_cv_submissions';
        const submissions = JSON.parse(sessionStorage.getItem(sessionKey) || '[]');
        const now = Date.now();
        const recentSubmissions = submissions.filter(time => now - time < 3600000); // 1 hora

        // NOTA: Aumentado a 5 para testing. Reducir a 2 en producción.
        if (recentSubmissions.length >= 5) {
            return {
                passed: false,
                message: 'Demasiados intentos. Intenta nuevamente en una hora.'
            };
        }

        // Actualizar contador
        recentSubmissions.push(now);
        sessionStorage.setItem(sessionKey, JSON.stringify(recentSubmissions));

        return { passed: true };
    }

    /**
     * Preparar datos para envío
     */
    function prepareFormData(formData) {
        // Mapear campos del formulario HTML a campos del backend (PostgreSQL)
        return {
            // Datos personales
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),

            // Educación y profesión
            graduationYear: parseInt(formData.get('graduationYear')),
            subject: formData.get('subject'),

            // Experiencia
            message: formData.get('message'),
            skills: formData.get('skills') || null
        };
    }

    /**
     * Mostrar estado de carga en botón
     */
    function showLoadingState(button, message = 'Enviando...') {
        if (!button) return;
        button.disabled = true;
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ${message}
        `;
    }

    /**
     * Ocultar estado de carga
     */
    function hideLoadingState(button, originalText) {
        if (!button) return;
        button.disabled = false;
        button.innerHTML = originalText;
    }

    /**
     * Mostrar mensaje de error
     */
    function showError(message) {
        // Crear alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 80px; right: 20px; z-index: 999999; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle fa-lg me-3"></i>
                <div>
                    <strong>Error</strong><br>
                    <small>${message}</small>
                </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    /**
     * Mostrar modal de éxito con instrucciones
     */
    function showSuccessModal(data) {
        // Eliminar modales anteriores
        document.querySelectorAll('.cv-success-modal').forEach(m => m.remove());

        const modal = document.createElement('div');
        modal.className = 'modal fade cv-success-modal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>
                            ¡Perfil Profesional Creado!
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="text-center mb-4">
                            <div class="display-1 text-success mb-3">
                                <i class="fas fa-envelope-circle-check"></i>
                            </div>
                            <h4 class="text-success">¡Mensaje enviado exitosamente!</h4>
                        </div>

                        <div class="alert alert-info">
                            <h6 class="alert-heading">
                                <i class="fas fa-info-circle me-2"></i>
                                Importante: Confirma tu correo electrónico
                            </h6>
                            <p class="mb-0">
                                Hemos enviado un enlace de confirmación a <strong>${data.email}</strong>.
                                Por favor revisa tu bandeja de entrada y haz clic en el enlace para confirmar tu perfil.
                            </p>
                        </div>

                        <div class="card border-primary">
                            <div class="card-body">
                                <h6 class="card-title text-primary">
                                    <i class="fas fa-list-check me-2"></i>
                                    Próximos pasos:
                                </h6>
                                <ol class="mb-0">
                                    <li class="mb-2">
                                        <strong>Revisa tu email</strong> (incluyendo carpeta de spam)
                                    </li>
                                    <li class="mb-2">
                                        <strong>Haz clic en "Confirmar perfil"</strong> en el email que recibiste
                                    </li>
                                    <li class="mb-2">
                                        Una vez confirmado, tu perfil será <strong>revisado por nuestro equipo</strong>
                                    </li>
                                    <li class="mb-2">
                                        Verificaremos que fuiste alumno de <strong>window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')</strong>
                                    </li>
                                    <li class="mb-0">
                                        Recibirás un email cuando tu perfil sea <strong>aprobado</strong>
                                    </li>
                                </ol>
                            </div>
                        </div>

                        <div class="alert alert-warning mt-3">
                            <i class="fas fa-clock me-2"></i>
                            <strong>Tiempo de revisión:</strong> Normalmente procesamos los perfiles en 24-48 horas hábiles.
                        </div>

                        <div class="text-muted small mt-3">
                            <strong>ID de perfil:</strong> ${data.egresado_id || 'Generado'}<br>
                            <strong>Nombre:</strong> ${data.nombre || 'N/A'}
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                            <i class="fas fa-check me-2"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Limpiar al cerrar
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
    }

    /**
     * Cerrar modal de upload CV
     */
    function closeUploadModal() {
        const uploadModal = document.getElementById('uploadCVModal');
        if (uploadModal) {
            const bsModal = bootstrap.Modal.getInstance(uploadModal);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeForm);
    } else {
        initializeForm();
    }

    console.log('✅ [BOLSA TRABAJO CV] Script cargado');

})();
