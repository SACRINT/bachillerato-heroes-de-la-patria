/**
 * 🎨 UI HELPERS PARA FORMULARIOS (GLOBAL)
 * Versión globalizada para compatibilidad con scripts tradicionales
 * Fecha: 17 Noviembre 2025
 */

(function(window) {
    'use strict';

    // Objeto global con todas las funciones de UI
    window.FormUIHelpers = {
        /**
         * Muestra estado de carga en botón de submit
         */
        showLoadingState(form, message = 'Enviando...') {
            const submitButton = form.querySelector('button[type="submit"]');
            if (!submitButton) return;

            // Guardar texto original si no existe
            if (!submitButton.dataset.originalText) {
                submitButton.dataset.originalText = submitButton.textContent;
            }

            submitButton.disabled = true;

            // Usar DOMPurify si está disponible
            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                submitButton.innerHTML = DOMPurify.sanitize(`
                    <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                    ${message}
                `);
            } else {
                // Fallback sin DOMPurify
                submitButton.textContent = `⏳ ${message}`;
            }
        },

        /**
         * Actualiza mensaje de estado de carga
         */
        updateLoadingState(form, message) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (!submitButton) return;

            const spinner = submitButton.querySelector('.spinner-border');
            if (spinner) {
                if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                    submitButton.innerHTML = DOMPurify.sanitize(`
                        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                        ${message}
                    `);
                } else {
                    submitButton.textContent = `⏳ ${message}`;
                }
            }
        },

        /**
         * Oculta estado de carga y restaura botón de submit
         */
        hideLoadingState(form) {
            const submitButton = form.querySelector('button[type="submit"]');
            if (!submitButton) return;

            submitButton.disabled = false;

            const originalText = submitButton.dataset.originalText || 'Enviar Mensaje';

            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                submitButton.innerHTML = DOMPurify.sanitize(originalText, 'simple');
            } else {
                submitButton.textContent = originalText;
            }
        },

        /**
         * Muestra alerta de éxito en el formulario
         */
        showSuccess(form, message = null) {
            // Buscar o crear contenedor de éxito
            let successAlert = form.querySelector('.alert-success');
            if (!successAlert) {
                successAlert = document.createElement('div');
                successAlert.className = 'alert alert-success';
                form.appendChild(successAlert);
            }

            const defaultMessage = message || '¡Operación completada exitosamente!';
            const detailMessage = 'La información ha sido procesada correctamente.';

            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                successAlert.innerHTML = DOMPurify.sanitize(`
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle fa-lg me-3 text-success"></i>
                        <div>
                            <strong>${defaultMessage}</strong><br>
                            <small>${detailMessage}</small>
                        </div>
                    </div>
                `);
            } else {
                successAlert.textContent = `✅ ${defaultMessage} ${detailMessage}`;
            }

            successAlert.style.display = 'block';
            successAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Ocultar errores
            const errorAlert = form.querySelector('.alert-danger');
            if (errorAlert) {
                errorAlert.style.display = 'none';
            }
        },

        /**
         * Muestra alerta de error en el formulario
         */
        showError(form, message) {
            // Buscar o crear contenedor de error
            let errorAlert = form.querySelector('.alert-danger');
            if (!errorAlert) {
                errorAlert = document.createElement('div');
                errorAlert.className = 'alert alert-danger';
                form.appendChild(errorAlert);
            }

            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                errorAlert.innerHTML = DOMPurify.sanitize(`
                    <div class="d-flex align-items-center">
                        <i class="fas fa-exclamation-triangle fa-lg me-3 text-danger"></i>
                        <div>
                            <strong>Error al enviar mensaje</strong><br>
                            <small>${message}</small>
                        </div>
                    </div>
                `);
            } else {
                errorAlert.textContent = `❌ Error: ${message}`;
            }

            errorAlert.style.display = 'block';
            errorAlert.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Ocultar éxito
            const successAlert = form.querySelector('.alert-success');
            if (successAlert) {
                successAlert.style.display = 'none';
            }
        },

        /**
         * Resetea el formulario y limpia alertas
         */
        resetForm(form) {
            form.reset();
            form.classList.remove('was-validated');

            // Limpiar alertas
            form.querySelectorAll('.alert').forEach(alert => {
                alert.style.display = 'none';
            });
        },

        /**
         * Muestra popup de verificación de email (modal profesional)
         */
        showVerificationPopup(result) {
            // Eliminar popups anteriores si existen
            const existingPopups = document.querySelectorAll('.verification-popup-overlay');
            existingPopups.forEach(p => p.remove());

            // Crear popup elegante
            const popup = document.createElement('div');
            popup.className = 'verification-popup-overlay';

            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                popup.innerHTML = DOMPurify.sanitize(`
                    <div class="verification-popup">
                        <div class="popup-header">
                            <div class="popup-icon">📧</div>
                            <h3>¡Mensaje Enviado!</h3>
                            <button class="popup-close" data-action="close-popup" data-context="verification-popup">×</button>
                        </div>
                        <div class="popup-content">
                            <p><strong>Tu mensaje ha sido enviado exitosamente.</strong></p>
                            <p>📮 Hemos enviado un enlace de confirmación a tu correo electrónico.</p>
                            <p>✅ Por favor revisa tu bandeja de entrada y haz clic en el enlace para completar el envío.</p>
                            <div class="popup-steps">
                                <div class="step">
                                    <span class="step-number">1</span>
                                    <span>Revisa tu email</span>
                                </div>
                                <div class="step">
                                    <span class="step-number">2</span>
                                    <span>Haz clic en "Confirmar mensaje"</span>
                                </div>
                                <div class="step">
                                    <span class="step-number">3</span>
                                    <span>¡Listo! Tu mensaje llegará a nosotros</span>
                                </div>
                            </div>
                        </div>
                        <div class="popup-footer">
                            <button class="btn-primary" data-action="close-popup" data-context="verification-popup">
                                Entendido
                            </button>
                        </div>
                    </div>
                `);
            } else {
                // Fallback simple sin HTML
                popup.textContent = '✅ Mensaje enviado. Revisa tu email para confirmar.';
                popup.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                    z-index: 999999;
                `;
            }

            // Estilos del popup overlay
            if (!popup.textContent) {
                popup.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease;
                `;
            }

            // Agregar estilos CSS del popup
            this.addVerificationPopupStyles();

            document.body.appendChild(popup);

            // Auto-cerrar después de 15 segundos
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 15000);
        },

        /**
         * Agrega estilos CSS para el popup de verificación
         */
        addVerificationPopupStyles() {
            if (document.querySelector('#verification-popup-styles')) return;

            const styles = document.createElement('style');
            styles.id = 'verification-popup-styles';
            styles.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .verification-popup {
                    background: white;
                    border-radius: 15px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s ease;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }

                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .popup-header {
                    background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 15px 15px 0 0;
                    text-align: center;
                    position: relative;
                }

                .popup-icon {
                    font-size: 48px;
                    margin-bottom: 10px;
                }

                .popup-header h3 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }

                .popup-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.3s;
                }

                .popup-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .popup-content {
                    padding: 25px;
                    text-align: center;
                }

                .popup-content p {
                    margin: 10px 0;
                    color: #555;
                    line-height: 1.6;
                }

                .popup-steps {
                    margin: 20px 0;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .step {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    text-align: left;
                }

                .step-number {
                    background: #3498db;
                    color: white;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    margin-right: 15px;
                }

                .popup-footer {
                    padding: 20px;
                    text-align: center;
                    border-top: 1px solid #eee;
                    border-radius: 0 0 15px 15px;
                }

                .popup-footer .btn-primary {
                    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
                    border: none;
                    color: white;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.3s;
                }

                .popup-footer .btn-primary:hover {
                    transform: translateY(-2px);
                }
            `;

            document.head.appendChild(styles);
        },

        /**
         * Agrega badge de seguridad al formulario
         */
        addSecurityBadge(form) {
            // Verificar si ya existe
            if (form.querySelector('.security-badge')) return;

            const securityBadge = document.createElement('div');
            securityBadge.className = 'security-badge mb-3';

            const badgeHTML = `
                <small class="text-muted d-flex align-items-center">
                    <i class="fas fa-shield-alt text-success me-2"></i>
                    <span>Formulario protegido contra spam • Verificación de email incluida</span>
                </small>
            `;

            if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                securityBadge.innerHTML = DOMPurify.sanitize(badgeHTML);
            } else {
                securityBadge.textContent = '🛡️ Formulario protegido contra spam • Verificación de email incluida';
                securityBadge.className = 'security-badge mb-3 text-muted';
            }

            form.insertBefore(securityBadge, form.firstChild);
        },

        /**
         * Muestra modal de advertencia con pregunta de confirmación
         */
        async showConfirmDialog(warning) {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'modal fade';

                if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                    modal.innerHTML = DOMPurify.sanitize(`
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header bg-warning text-dark">
                                    <h5 class="modal-title">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        Verificar Email
                                    </h5>
                                </div>
                                <div class="modal-body">
                                    <p><strong>Advertencia:</strong> ${warning}</p>
                                    <p>¿Estás seguro de que tu email es correcto? Un email incorrecto significa que no podremos contactarte.</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-action="cancel">
                                        Corregir Email
                                    </button>
                                    <button type="button" class="btn btn-warning" data-action="proceed">
                                        Continuar de Todos Modos
                                    </button>
                                </div>
                            </div>
                        </div>
                    `);
                } else {
                    // Fallback: usar confirm() nativo
                    const confirmed = confirm(`⚠️ ${warning}\n\n¿Estás seguro de que tu email es correcto?`);
                    resolve(confirmed);
                    return;
                }

                document.body.appendChild(modal);

                // Usar Bootstrap Modal si está disponible
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();

                    modal.addEventListener('click', (e) => {
                        const action = e.target.dataset.action;
                        if (action) {
                            bsModal.hide();
                            modal.remove();
                            resolve(action === 'proceed');
                        }
                    });
                } else {
                    // Fallback sin Bootstrap
                    const confirmed = confirm(`⚠️ ${warning}\n\n¿Estás seguro de que tu email es correcto?`);
                    modal.remove();
                    resolve(confirmed);
                }
            });
        },

        /**
         * Agrega campo honeypot invisible al formulario (anti-spam)
         */
        addHoneypot(form, fieldName = '_gotcha') {
            // Verificar si ya existe
            if (form.querySelector(`input[name="${fieldName}"]`)) return;

            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = fieldName;
            honeypot.style.cssText = 'position:absolute;left:-9999px;top:-9999px;visibility:hidden;';
            honeypot.tabIndex = -1;
            honeypot.autocomplete = 'off';

            form.appendChild(honeypot);
        }
    };

    if (typeof debugLog !== 'undefined') {
        debugLog.log('UI-HELPERS', '✅ FormUIHelpers globalizados cargados');
    }

})(window);
