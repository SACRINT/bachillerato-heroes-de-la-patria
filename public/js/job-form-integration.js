/**
 * Job Board / Bolsa de Trabajo Form Integration
 * Conecta el formulario de bolsa de trabajo con /api/egresados
 */

document.addEventListener('DOMContentLoaded', function () {
    const jobForm = document.querySelector('#job-form, #bolsa-trabajo-form, form[name="job"], form.job-form');

    if (!jobForm) {
        void 0;
        return;
    }

    jobForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = this.querySelector('button[type="submit"]');

        if (submitBtn) {
            FormHandler.setButtonLoading(submitBtn, true);
        }

        try {
            await FormHandler.submitForm(this, '/api/egresados', {
                method: 'POST',
                successMessage: '¡CV registrado exitosamente! Te contactaremos cuando haya oportunidades.',
                errorMessage: 'Error al enviar CV. Por favor verifica tus datos.',
                authenticated: false
            });
        } finally {
            if (submitBtn) {
                FormHandler.setButtonLoading(submitBtn, false);
            }
        }
    });
});
