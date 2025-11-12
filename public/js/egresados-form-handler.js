/**
 * 🎓 HANDLER ESPECÍFICO PARA FORMULARIO DE EGRESADOS
 * Adapta los nombres de campos del HTML a la API de egresados
 */

(function() {
    'use strict';

    // Esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('actualizarDatosForm');

        if (!form) {
            console.log('ℹ️  Formulario de egresados no encontrado en esta página');
            return;
        }

        console.log('✅ Handler de formulario egresados inicializado');

        // Marcar formulario como manejado por este handler específico
        form.setAttribute('data-handled-by', 'egresados-form-handler');

        // Interceptar el envío del formulario
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();  // IMPORTANTE: Prevenir que professional-forms.js también procese este evento

            console.log('📝 Formulario egresados enviado');

            // Obtener botón de envío PRIMERO
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Validación HTML5
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                console.warn('⚠️ Formulario inválido');
                return;
            }

            // Recopilar datos del formulario
            const formData = new FormData(form);

            // Mapear campos del formulario HTML a nombres de API
            // Estos datos se enviarán al flujo de aprobación en pendientes_aprobacion
            const mappedData = {
                nombre_completo: formData.get('name'),
                email: formData.get('email'),
                generacion: formData.get('generacion'),
                telefono: formData.get('telefono') || null,
                ciudad: formData.get('ciudad') || null,
                carrera_tecnica: formData.get('carrera'),  // CAMPO OBLIGATORIO
                anio_egreso: formData.get('anio-egreso') ? parseInt(formData.get('anio-egreso')) : null,  // CAMPO OBLIGATORIO
                experiencia_laboral: formData.get('trabajo') || null,
                disponibilidad: 'inmediata',  // Valor por defecto
                linkedin_url: formData.get('linkedin') || null,
                portafolio_url: formData.get('portafolio') || null,
                estado: formData.get('estado') || null
            };

            // Validar campos obligatorios ANTES de enviar
            if (!mappedData.nombre_completo || !mappedData.email || !mappedData.anio_egreso || !mappedData.carrera_tecnica) {
                console.error('❌ Validación fallida - Campos faltantes:', mappedData);
                showErrorMessage('Por favor completa: Nombre Completo, Email, Año de Egreso y Carrera Técnica.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = sanitizeHTML(originalText);
                return;
            }

            console.log('📤 Datos mapeados:', mappedData);

            // Deshabilitar botón de envío
            submitBtn.disabled = true;
            submitBtn.innerHTML = sanitizeHTML('<i class="fas fa-spinner fa-spin me-2"></i>Enviando...');

            try {
                // Enviar a la API - usa /create para flujo de aprobación
                const response = await fetch('/api/egresados/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mappedData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log('✅ Egresado registrado exitosamente:', result);

                    // Mostrar mensaje de éxito
                    showSuccessMessage(result.updated ? 'actualizado' : 'registrado');

                    // Limpiar formulario
                    form.reset();
                    form.classList.remove('was-validated');
                } else {
                    console.error('❌ Error en respuesta:', result);
                    // Usar 'message' porque es lo que retorna el servidor
                    showErrorMessage(result.message || result.error || 'Error al procesar la solicitud');
                }
            } catch (error) {
                console.error('❌ Error al enviar formulario:', error);
                showErrorMessage('Error de conexión. Por favor, intenta nuevamente.');
            } finally {
                // Rehabilitar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = sanitizeHTML(originalText);
            }
        });

        function showSuccessMessage(action) {
            const message = action === 'actualizado'
                ? '¡Gracias! Tus datos han sido actualizados exitosamente.'
                : '¡Gracias! Te has registrado exitosamente en nuestra base de datos de egresados.';

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: message,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#28a745'
                });
            } else {
                alert(message);
            }
        }

        function showErrorMessage(errorMsg) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonText: 'Aceptar',
                    confirmButtonColor: '#dc3545'
                });
            } else {
                alert('Error: ' + errorMsg);
            }
        }
    });
})();
