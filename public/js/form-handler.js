/**
 * Form Handler - Maneja envío de formularios al backend
 */

class FormHandler {
    static API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

    /**
     * Enviar formulario genérico
     */
    static async submitForm(formElement, endpoint, options = {}) {
        const {
            method = 'POST',
            authenticated = false,
            successMessage = '¡Formulario enviado exitosamente!',
            errorMessage = 'Error al enviar formulario.',
            onSuccess = null,
            onError = null,
            transform = null
        } = options;

        try {
            // Get form data
            const formData = new FormData(formElement);
            let data = Object.fromEntries(formData);

            // Transform data if needed
            if (transform && typeof transform === 'function') {
                data = transform(data);
            }

            // Prepare headers
            const headers = {
                'Content-Type': 'application/json'
            };

            // Add auth token if needed
            if (authenticated && window.SimpleAuth) {
                const token = SimpleAuth.getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            // Make request
            const response = await fetch(`${this.API_BASE}${endpoint}`, {
                method,
                headers,
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || errorMessage);
            }

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result);
            } else {
                this.showSuccess(formElement, successMessage);
                formElement.reset();
            }

            return result;

        } catch (error) {
            console.error('Form submission error:', error);

            // Call error callback if provided
            if (onError) {
                onError(error);
            } else {
                this.showError(formElement, error.message || errorMessage);
            }

            throw error;
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    static showSuccess(formElement, message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show mt-3';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert after form
        formElement.parentNode.insertBefore(alert, formElement.nextSibling);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);

        // Scroll to message
        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Mostrar mensaje de error
     */
    static showError(formElement, message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Insert after form
        formElement.parentNode.insertBefore(alert, formElement.nextSibling);

        // Auto-dismiss after 7 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 7000);

        // Scroll to message
        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Validar email
     */
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validar teléfono (México)
     */
    static isValidPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 10;
    }

    /**
     * Set loading state on submit button
     */
    static setButtonLoading(button, loading = true) {
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }
}

// Exponer globalmente
window.FormHandler = FormHandler;
