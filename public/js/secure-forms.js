/**
 * 🔐 SISTEMA DE FORMULARIOS SEGUROS
 * Manejo de formularios con verificación por email
 * Sistema híbrido de máxima seguridad
 */

class SecureFormHandler {
    constructor() {
        this.initializeForms();
    }

    /**
     * Inicializar todos los formularios seguros
     */
    initializeForms() {
        // Formularios que requieren verificación
        const secureFormIds = [
            'contactForm',
            'cvUploadForm',
            'appointmentForm',
            'actualizarDatosForm',
            'parentLoginForm'
        ];

        secureFormIds.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                this.setupSecureForm(form);
            }
        });

        // Formularios de newsletter (más simples)
        this.setupNewsletterForms();
    }

    /**
     * Configurar formulario con verificación completa
     */
    setupSecureForm(form) {
        // Prevenir envío normal
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSecureSubmit(form);
        });

        // Agregar indicadores de seguridad
        this.addSecurityIndicators(form);
    }

    /**
     * Configurar formularios de newsletter
     */
    setupNewsletterForms() {
        const newsletterForms = document.querySelectorAll('form[action="/api/contact/send"]:not([id])');

        newsletterForms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleNewsletterSubmit(form);
            });
        });
    }

    /**
     * Manejar envío seguro con verificación
     */
    async handleSecureSubmit(form) {
        try {
            // Mostrar estado de envío
            this.showLoadingState(form, 'Enviando mensaje...');

            // Recopilar datos del formulario
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Validar datos básicos
            if (!this.validateFormData(data)) {
                this.showError(form, 'Por favor completa todos los campos requeridos');
                return;
            }

            // Enviar a endpoint de verificación
            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showVerificationSuccess(form, result.message);
                form.reset();
            } else {
                this.showError(form, result.message || 'Error enviando mensaje');
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError(form, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoadingState(form);
        }
    }

    /**
     * Manejar envío de newsletter (más simple)
     */
    async handleNewsletterSubmit(form) {
        try {
            this.showLoadingState(form, 'Suscribiendo...');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch('/api/contact/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess(form, '¡Suscripción exitosa! Revisa tu email para confirmar.');
                form.reset();
            } else {
                this.showError(form, result.message || 'Error en suscripción');
            }

        } catch (error) {
            this.showError(form, 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.hideLoadingState(form);
        }
    }

    /**
     * Validar datos básicos del formulario
     */
    validateFormData(data) {
        // Validar email
        if (data.email && !this.isValidEmail(data.email)) {
            return false;
        }

        // Validar campos requeridos
        const requiredFields = ['email'];
        if (data.name || data.nombre_completo) {
            requiredFields.push(data.name ? 'name' : 'nombre_completo');
        }

        return requiredFields.every(field => data[field] && data[field].trim());
    }

    /**
     * Validar formato de email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Mostrar estado de carga
     */
    showLoadingState(form, message) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <i class="fas fa-spinner fa-spin me-2"></i>
                ${message}
            `;
        }
    }

    /**
     * Ocultar estado de carga
     */
    hideLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            // Restaurar texto original (debería guardarse antes)
            const originalText = submitBtn.dataset.originalText || 'Enviar';
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Mostrar éxito de verificación
     */
    showVerificationSuccess(form, message) {
        this.showAlert(form, message, 'success', `
            <div class="verification-notice">
                <h5><i class="fas fa-shield-alt text-success me-2"></i>Verificación requerida</h5>
                <p class="mb-2">${message}</p>
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Esto garantiza que solo personas reales puedan enviar mensajes.
                </small>
            </div>
        `);
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccess(form, message) {
        this.showAlert(form, message, 'success');
    }

    /**
     * Mostrar mensaje de error
     */
    showError(form, message) {
        this.showAlert(form, message, 'danger');
    }

    /**
     * Mostrar alerta genérica
     */
    showAlert(form, message, type, customHtml = null) {
        // Buscar contenedor de alertas o crear uno
        let alertContainer = form.querySelector('.alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.className = 'alert-container';
            form.appendChild(alertContainer);
        }

        // Crear alerta
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = customHtml || `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Limpiar alertas anteriores
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);

        // Auto-dismiss después de 10 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 10000);
    }

    /**
     * Agregar indicadores de seguridad
     */
    addSecurityIndicators(form) {
        // Agregar badge de seguridad
        const securityBadge = document.createElement('div');
        securityBadge.className = 'security-badge';
        securityBadge.innerHTML = `
            <small class="text-muted d-flex align-items-center justify-content-center mt-2">
                <i class="fas fa-shield-alt text-success me-1"></i>
                Formulario protegido con verificación por email
            </small>
        `;

        form.appendChild(securityBadge);

        // Guardar texto original de botón submit
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.dataset.originalText) {
            submitBtn.dataset.originalText = submitBtn.innerHTML;
        }
    }
}

// Agregar estilos CSS
const style = document.createElement('style');
style.textContent = `
    .security-badge {
        background: rgba(40, 167, 69, 0.1);
        border: 1px solid rgba(40, 167, 69, 0.2);
        border-radius: 5px;
        padding: 8px 12px;
        margin-top: 15px;
    }

    .verification-notice {
        background: rgba(40, 167, 69, 0.1);
        border-radius: 8px;
        padding: 15px;
    }

    .alert-container {
        margin-top: 15px;
    }

    .alert {
        border: none;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .alert-success {
        background: rgba(40, 167, 69, 0.1);
        color: #155724;
        border-left: 4px solid #28a745;
    }

    .alert-danger {
        background: rgba(220, 53, 69, 0.1);
        color: #721c24;
        border-left: 4px solid #dc3545;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SecureFormHandler();
    });
} else {
    new SecureFormHandler();
}