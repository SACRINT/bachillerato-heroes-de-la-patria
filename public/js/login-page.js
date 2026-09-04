/**
 * 🔐 Login Page Handler
 * Handles authentication form submission, password toggling, and role-based redirects.
 * Extracted from inline script for strict CSP compliance.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Toggle password visibility
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function () {
            const passwordInput = document.getElementById('password');
            const icon = this.querySelector('i');

            if (passwordInput && icon) {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    }

    // Show alert function
    function showAlert(message, type = 'danger') {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        const safeMessage = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(message) : message;
        const iconClass = type === 'success' ? 'check-circle' : 'exclamation-circle';
        
        alertContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${iconClass} me-2"></i>
                ${safeMessage}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    }

    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const originalText = submitBtn ? submitBtn.innerHTML : 'Iniciar Sesión';

            // Get form data
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const email = emailInput ? emailInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            try {
                // Show loading
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';
                }

                // Call login
                if (typeof SimpleAuth === 'undefined') {
                    throw new Error('El módulo de autenticación no está disponible. Por favor recarga la página.');
                }
                const result = await SimpleAuth.login(email, password);

                // Success!
                showAlert('¡Inicio de sesión exitoso! Redirigiendo...', 'success');

                // Redirect according to user role
                setTimeout(() => {
                    const role = result.user?.role;
                    let defaultDestination = 'estudiantes.html';
                    if (role === 'admin' || role === 'superadmin' || role === 'director') {
                        defaultDestination = 'admin-dashboard.html';
                    } else if (role === 'docente' || role === 'profesor') {
                        defaultDestination = 'docentes.html';
                    } else if (role === 'padre_familia' || role === 'padre') {
                        defaultDestination = 'padres.html';
                    }

                    const urlParams = new URLSearchParams(window.location.search);
                    const queryRedirect = urlParams.get('redirect');
                    const redirectTo = sessionStorage.getItem('redirect_after_login') || queryRedirect || defaultDestination;
                    sessionStorage.removeItem('redirect_after_login');
                    window.location.href = redirectTo;
                }, 800);

            } catch (error) {
                // Show error
                showAlert(error.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'danger');

                // Reset button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    // If already logged in, redirect
    if (typeof SimpleAuth !== 'undefined' && SimpleAuth.isAuthenticated()) {
        const user = SimpleAuth.getCurrentUser();
        if (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'director') {
            window.location.href = 'admin-dashboard.html';
        } else if (user?.role === 'docente' || user?.role === 'profesor') {
            window.location.href = 'docentes.html';
        } else if (user?.role === 'padre_familia' || user?.role === 'padre') {
            window.location.href = 'padres.html';
        } else {
            window.location.href = 'estudiantes.html';
        }
    }
});
