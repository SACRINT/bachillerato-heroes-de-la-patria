/**
 * Inscriptions Form Integration
 * Conecta el formulario de inscripciones con /api/inscriptions/register
 */

document.addEventListener('DOMContentLoaded', function () {
    const inscriptionForm = document.querySelector('#inscription-form, form[name="inscription"], form.inscription-form');

    if (!inscriptionForm) {
        console.warn('Inscription form not found on this page');
        return;
    }

    inscriptionForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');

        if (submitBtn) {
            FormHandler.setButtonLoading(submitBtn, true);
        }

        try {
            const result = await FormHandler.submitForm(this, '/api/inscriptions/register', {
                successMessage: '¡Preinscripción completada! Recibirás un correo con los siguientes pasos.',
                errorMessage: 'Error al registrar inscripción. Por favor verifica tus datos.',
                authenticated: false,
                onSuccess: (data) => {
                    // Show success message
                    FormHandler.showSuccess(inscriptionForm,
                        `¡Preinscripción exitosa! Tu folio es: <strong>${data.folio || 'Pendiente'}</strong>`
                    );

                    // Clear form
                    inscriptionForm.reset();

                    // Optional: redirect after 3 seconds
                    setTimeout(() => {
                        window.location.href = '/confirmacion-inscripcion.html?folio=' + (data.folio || '');
                    }, 3000);
                }
            });
        } catch (error) {
            console.error('Inscription error:', error);
        } finally {
            if (submitBtn) {
                FormHandler.setButtonLoading(submitBtn, false);
            }
        }
    });
});
