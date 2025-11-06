/**
 * 📧 MANEJADOR DE CONFIRMACIÓN DE EMAIL - EGRESADOS
 * Detecta cuando el usuario hace clic en el enlace de confirmación de email
 * y llama al endpoint de confirmación en el backend
 *
 * Fecha: 5 Noviembre 2025
 */

(function() {
    'use strict';

    console.log('📧 [EGRESADOS EMAIL CONFIRMATION] Script cargado');

    /**
     * Obtener token de confirmación de la URL
     * Busca en:
     * - Hash: #confirm-email?token=...
     * - Query string: ?token=...
     */
    function getConfirmationToken() {
        const hash = window.location.hash;
        const search = window.location.search;

        let token = null;

        // Buscar en hash (#confirm-email?token=...)
        if (hash.includes('confirm-email')) {
            const hashParams = new URLSearchParams(hash.split('?')[1] || '');
            token = hashParams.get('token');
        }

        // Buscar en query string (?token=...)
        if (!token) {
            const searchParams = new URLSearchParams(search);
            token = searchParams.get('token');
        }

        return token;
    }


    /**
     * Mostrar modal con mensaje de estado
     */
    function showConfirmationStatus(message, isSuccess = true) {
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.id = 'email-confirmation-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        const icon = isSuccess
            ? '<span style="font-size: 48px; margin-bottom: 20px; display: block;">✅</span>'
            : '<span style="font-size: 48px; margin-bottom: 20px; display: block;">❌</span>';

        const title = isSuccess
            ? '¡Email Confirmado Exitosamente!'
            : 'Error al Confirmar Email';

        const color = isSuccess ? '#4CAF50' : '#f44336';

        modal.innerHTML = `
            ${icon}
            <h2 style="color: ${color}; margin: 0 0 15px 0; font-size: 24px;">
                ${title}
            </h2>
            <p style="color: #666; margin: 0 0 20px 0; font-size: 16px;">
                ${message}
            </p>
            <p style="color: #999; font-size: 14px; margin: 0;">
                Serás redirigido en 3 segundos...
            </p>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Redirigir después de 3 segundos
        setTimeout(() => {
            window.location.hash = '';
            window.location.href = window.location.pathname;
        }, 3000);
    }

    /**
     * Confirmar email con token
     */
    async function confirmEmail(token) {
        console.log(`📧 [EGRESADOS EMAIL CONFIRMATION] Confirmando email con token: ${token.substring(0, 8)}...`);

        // Mostrar estado inicial
        showConfirmationStatus('Confirmando tu email...', true);

        try {
            const response = await fetch(`/api/egresados/confirm/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            // Intentar parsear como JSON primero
            let data;
            try {
                data = await response.json();
            } catch (e) {
                // Si no es JSON válido, asumir que es HTML de error
                data = { success: false, error: 'Respuesta inválida del servidor' };
            }

            console.log(`📧 [EGRESADOS EMAIL CONFIRMATION] Respuesta del servidor:`, data);

            if (response.ok && (data.success || response.status === 200)) {
                console.log(`✅ [EGRESADOS EMAIL CONFIRMATION] Email confirmado exitosamente`);
                showConfirmationStatus(
                    '✓ Tu email ha sido confirmado exitosamente. Tu solicitud ha sido enviada a revisión del administrador. Te notificaremos cuando sea revisada.',
                    true
                );
            } else {
                console.error(`❌ [EGRESADOS EMAIL CONFIRMATION] Error:`, data.error);
                showConfirmationStatus(
                    data.error || 'Hubo un error al confirmar tu email. Por favor intenta nuevamente.',
                    false
                );
            }

        } catch (error) {
            console.error(`❌ [EGRESADOS EMAIL CONFIRMATION] Error de red:`, error);
            showConfirmationStatus(
                'Error de conexión. Por favor verifica tu conexión a internet e intenta nuevamente.',
                false
            );
        }
    }

    /**
     * Inicializar cuando el DOM esté listo
     */
    function init() {
        // Solo ejecutar si estamos en egresados.html
        if (!window.location.pathname.includes('egresados')) {
            console.log('📧 [EGRESADOS EMAIL CONFIRMATION] No estamos en egresados.html, saliendo');
            return;
        }

        const token = getConfirmationToken();

        if (token) {
            console.log(`📧 [EGRESADOS EMAIL CONFIRMATION] Token encontrado: ${token.substring(0, 8)}...`);
            confirmEmail(token);
        } else {
            console.log('📧 [EGRESADOS EMAIL CONFIRMATION] No se encontró token de confirmación en la URL');
        }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Escuchar cambios en el hash (cuando usuario hace clic en enlace de confirmación)
    window.addEventListener('hashchange', init);

})();
