
// Parent Portal Authentication Logic

document.addEventListener('DOMContentLoaded', () => {
    // === FIRST TIME ACTIVATION ===
    const activationForm = document.getElementById('accountActivationForm');

    if (activationForm) {
        activationForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = activationForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Basic validation
            const p1 = document.getElementById('newPassword').value;
            const p2 = document.getElementById('confirmPassword').value;

            if (p1 !== p2) {
                alert('Las contraseñas no coinciden');
                return;
            }
            if (p1.length < 8) {
                alert('La contraseña debe tener al menos 8 caracteres');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

                const formData = new FormData(activationForm);
                const data = Object.fromEntries(formData.entries());

                // Clean data
                delete data.confirmPassword;

                const response = await fetch('/api/parents/auth/first-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    // Auto login
                    localStorage.setItem('token', result.data.token);
                    localStorage.setItem('user', JSON.stringify(result.data.parent));

                    alert('¡Cuenta activada con éxito! Bienvenido al portal.');
                    window.location.reload(); // Reload to show logged-in state
                } else {
                    alert('Error: ' + (result.error || result.message));
                }

            } catch (error) {
                console.error('Activation error:', error);
                alert('Error de conexión al activar cuenta');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // === LOGIN EXISTING USER ===
    // Note: Assuming existing login logic exists elsewhere, or we add it here if missing.
    // The prompt says "First-login flow" is the priority.
});
