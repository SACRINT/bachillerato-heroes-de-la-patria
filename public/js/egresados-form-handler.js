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

        // Interceptar el envío del formulario
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            console.log('📝 Formulario egresados enviado');

            // Validación HTML5
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                console.warn('⚠️ Formulario inválido');
                return;
            }

            // Recopilar datos del formulario
            const formData = new FormData(form);

            // Mapear campos del formulario HTML a nombres de API
            const mappedData = {
                nombre: formData.get('name'),
                email: formData.get('email'),
                generacion: formData.get('generacion'),
                telefono: formData.get('telefono') || null,
                ciudad: formData.get('ciudad') || null,
                ocupacion_actual: formData.get('trabajo') || null,
                universidad: formData.get('universidad') || null,
                carrera: formData.get('carrera') || null,
                estatus_estudios: formData.get('estatus-estudios') || null,
                anio_egreso: formData.get('anio-egreso') ? parseInt(formData.get('anio-egreso')) : null,
                historia_exito: formData.get('message') || null,
                autoriza_publicar: formData.get('publicar-historia') === 'on',
                verificado: true
            };

            console.log('📤 Datos mapeados:', mappedData);

            // Deshabilitar botón de envío
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';

            try {
                // Enviar a la API
                const response = await fetch('/api/egresados', {
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
                    showErrorMessage(result.error || 'Error al procesar la solicitud');
                }
            } catch (error) {
                console.error('❌ Error al enviar formulario:', error);
                showErrorMessage('Error de conexión. Por favor, intenta nuevamente.');
            } finally {
                // Rehabilitar botón
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
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
