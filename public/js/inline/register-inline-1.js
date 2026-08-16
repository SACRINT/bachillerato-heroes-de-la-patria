// Toggle password visibility
        document.getElementById('toggle-password').addEventListener('click', function () {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });

        // Password strength checker
        document.getElementById('password').addEventListener('input', function () {
            const password = this.value;
            const strengthBar = document.getElementById('password-strength-bar');
            const strengthText = document.getElementById('password-strength-text');

            let strength = 0;
            let text = '';
            let color = '';

            if (password.length >= 8) strength++;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
            if (password.match(/\d/)) strength++;
            if (password.match(/[^a-zA-Z\d]/)) strength++;

            switch (strength) {
                case 0:
                case 1:
                    text = 'Débil';
                    color = '#dc3545';
                    break;
                case 2:
                    text = 'Media';
                    color = '#ffc107';
                    break;
                case 3:
                    text = 'Fuerte';
                    color = '#28a745';
                    break;
                case 4:
                    text = 'Muy Fuerte';
                    color = '#20c997';
                    break;
            }

            strengthBar.style.width = (strength * 25) + '%';
            strengthBar.style.backgroundColor = color;
            strengthText.textContent = password.length > 0 ? `Fortaleza: ${text}` : '';
        });

        // Show alert function
        function showAlert(message, type = 'danger') {
            const alertContainer = document.getElementById('alert-container');
            alertContainer.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Handle register form submission
        document.getElementById('register-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const originalText = submitBtn.innerHTML;

            // Get form data
            const formData = new FormData(this);
            const userData = Object.fromEntries(formData);

            // Validate passwords match
            if (userData.password !== userData.password_confirm) {
                showAlert('Las contraseñas no coinciden', 'danger');
                return;
            }

            // Remove password confirm
            delete userData.password_confirm;

            try {
                // Show loading
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando cuenta...';

                // Call register
                const result = await SimpleAuth.register(userData);

                // Success!
                showAlert('¡Cuenta creada exitosamente! Redirigiendo...', 'success');

                // Redirect after 1.5 seconds
                setTimeout(() => {
                    window.location.href = '/estudiantes.html';
                }, 1500);

            } catch (error) {
                // Show error
                showAlert(error.message || 'Error al crear cuenta. Intenta nuevamente.', 'danger');

                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });

        // If already logged in, redirect
        if (SimpleAuth.isAuthenticated()) {
            window.location.href = '/estudiantes.html';
        }
