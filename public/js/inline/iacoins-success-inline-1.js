document.addEventListener('DOMContentLoaded', async () => {
            const params = new URLSearchParams(window.location.search);
            const sessionId = params.get('session_id');
            const isMock = params.get('mock') === 'true';

            if (!sessionId) {
                showError('No se encontró la sesión de pago');
                return;
            }

            try {
                // Para mock, procesar el pago primero
                if (isMock) {
                    const token = localStorage.getItem('token');
                    await fetch(`/api/stripe-webhooks/process-mock/${sessionId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                // Verificar estado del pago
                const res = await fetch(`/api/stripe-webhooks/verify/${sessionId}`);
                const data = await res.json();

                if (data.success) {
                    document.getElementById('coins-amount').textContent =
                        `${data.iacoins?.toLocaleString() || '???'} IACoins`;
                    showSuccess();
                } else {
                    showError(data.error || 'El pago no se completó');
                }
            } catch (err) {
                showError('Error verificando el pago');
            }
        });

        function showSuccess() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('success').style.display = 'block';
        }

        function showError(msg) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error-msg').textContent = msg;
            document.getElementById('error').style.display = 'block';
        }
