/**
 * Contact Form Integration
 * Conecta el formulario de contacto con /api/contact/send
 */

document.addEventListener('DOMContentLoaded', function () {
    const contactForm = document.querySelector('#contact-form, form[name="contact"], form.contact-form');

    if (!contactForm) {
        void 0;
        return;
    }

    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');

        if (submitBtn) {
            FormHandler.setButtonLoading(submitBtn, true);
        }

        try {
            await FormHandler.submitForm(this, '/api/contact/send', {
                successMessage: '¡Mensaje enviado exitosamente! Nos pondremos en contacto pronto.',
                errorMessage: 'Error al enviar mensaje. Por favor intenta nuevamente.'
            });
        } finally {
            if (submitBtn) {
                FormHandler.setButtonLoading(submitBtn, false);
            }
        }
    });
});
