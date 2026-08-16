// Obtener token de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // Estados del DOM
        const loadingState = document.getElementById('loading-state');
        const successState = document.getElementById('success-state');
        const errorState = document.getElementById('error-state');
        const noTokenState = document.getElementById('no-token-state');

        // Función para mostrar estado
        function showState(state) {
            loadingState.classList.add('d-none');
            successState.classList.add('d-none');
            errorState.classList.add('d-none');
            noTokenState.classList.add('d-none');
            state.classList.remove('d-none');
        }

        // Función para verificar email
        async function verifyEmail() {
            if (!token) {
                showState(noTokenState);
                return;
            }

            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (data.success) {
                    document.getElementById('success-message').textContent = data.message;
                    showState(successState);
                } else {
                    document.getElementById('error-message').textContent = data.message || 'No se pudo verificar el email.';
                    showState(errorState);
                }
            } catch (error) {
                console.error('Error verificando email:', error);
                document.getElementById('error-message').textContent = 'Error de conexión. Por favor intenta de nuevo.';
                showState(errorState);
            }
        }

        // Función para reenviar verificación
        async function resendVerification() {
            const email = prompt('Ingresa tu email para reenviar la verificación:');

            if (!email) return;

            try {
                const response = await fetch('/api/auth/resend-verification', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (data.success) {
                    alert('Si el email existe y no está verificado, recibirás un nuevo enlace de verificación.');
                } else {
                    alert(data.message || 'Error al reenviar verificación.');
                }
            } catch (error) {
                console.error('Error reenviando verificación:', error);
                alert('Error de conexión. Por favor intenta de nuevo.');
            }
        }

        // Ejecutar verificación al cargar
        document.addEventListener('DOMContentLoaded', () => {
            verifyEmail();

            // Attach event listener to resend button
            const resendBtn = document.getElementById('resend-verification-btn');
            if (resendBtn) {
                resendBtn.addEventListener('click', resendVerification);
            }
        });
