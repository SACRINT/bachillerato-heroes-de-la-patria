/**
 * 📧 CONTACTO - EVENT HANDLERS (CSP-COMPLIANT)
 * Todos los handlers refactorizados de inline onclick/onsubmit a addEventListener
 *
 * Propósito: Eliminar 1 handler inline que viola CSP ENFORCE mode
 * Estándar: Content Security Policy (CSP) compliant
 * Fecha: 9 Noviembre 2025
 *
 * Nota: Este archivo debe cargarse DESPUÉS de contacto.html
 */

(function () {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventHandlers);
    } else {
        initializeEventHandlers();
    }

    function initializeEventHandlers() {
        console.log('[CONTACTO-EVENTS] Inicializando event handlers...');

        registerContactHandlers();
        registerFormHandler();

        console.log('[CONTACTO-EVENTS] ✅ Event handlers inicializados correctamente');
    }

    /**
     * Handlers para formulario de contacto y otros elementos
     */
    function registerContactHandlers() {
        // Buscar todos los elementos con atributos onclick para registro dinámico
        document.addEventListener('click', function (e) {
            if (e.target.closest('[onclick]')) {
                const elem = e.target.closest('[onclick]');
                const onclick = elem.getAttribute('onclick');

                // Procesar handlers genéricos que puedan existir
                if (onclick) {
                    console.log('[CONTACTO-EVENTS] Evento capturado:', onclick);
                    // e.preventDefault(); // Comentado para no romper enlaces legítimos
                }
            }
        });
    }

    /**
     * Manejo del formulario de contacto
     */
    function registerFormHandler() {
        const contactForm = document.getElementById('contactForm');

        if (contactForm) {
            console.log('[CONTACTO-EVENTS] Formulario de contacto encontrado. Registrando handler...');

            contactForm.addEventListener('submit', async function (e) {
                e.preventDefault();

                if (!contactForm.checkValidity()) {
                    e.stopPropagation();
                    contactForm.classList.add('was-validated');
                    return;
                }

                // Obtener botón submit para estado de carga
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Enviar';

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
                }

                try {
                    // Recopilar datos
                    const formData = new FormData(contactForm);
                    const data = Object.fromEntries(formData.entries());

                    // Enviar datos
                    const response = await fetch('/api/contact/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Mostrar éxito
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({
                                title: '¡Mensaje Enviado!',
                                text: result.message || 'Hemos recibido tu mensaje. Te contactaremos pronto.',
                                icon: 'success',
                                confirmButtonColor: '#1976D2'
                            });
                        } else {
                            alert(result.message || 'Mensaje enviado correctamente');
                        }

                        // Limpiar formulario
                        contactForm.reset();
                        contactForm.classList.remove('was-validated');
                    } else {
                        throw new Error(result.message || 'Error al enviar el mensaje');
                    }

                } catch (error) {
                    console.error('[CONTACTO-EVENTS] Error:', error);

                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            title: 'Error',
                            text: error.message || 'Hubo un problema al enviar tu mensaje. Por favor intenta nuevamente.',
                            icon: 'error',
                            confirmButtonColor: '#d33'
                        });
                    } else {
                        alert('Error: ' + (error.message || 'Hubo un problema al enviar tu mensaje'));
                    }
                } finally {
                    // Restaurar botón
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    }
                }
            });
        }
    }

    // ============================================
    // FUNCIONES DE NEGOCIO
    // ============================================

    // Placeholder para funciones que puedan ser llamadas desde contacto.html
    function handleContactSubmit(event) {
        console.log('[CONTACTO-EVENTS] Procesando envío del formulario de contacto...');
        if (window.handleContactSubmit) {
            window.handleContactSubmit(event);
        }
    }

    // Export para módulos
    window.contactoEvents = {
        handleContactSubmit
    };

})();
