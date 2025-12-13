import { User } from './types';

export class UIManager {
    private modalId = 'unified-auth-modal';

    createModalHTML(): string {
        return `
        <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg overflow-hidden">
                    <div class="modal-header border-0 bg-light">
                        <h5 class="modal-title fw-bold text-primary" id="authModalLabel">
                            <i class="fas fa-shield-alt me-2"></i>Acceso Seguro
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <!-- Alerta dinámica -->
                        <div id="auth-alert" class="alert d-none" role="alert"></div>

                        <!-- Login Form -->
                        <form id="unified-login-form" class="needs-validation" novalidate>
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label fw-semibold">Correo Electrónico</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white text-muted"><i class="fas fa-envelope"></i></span>
                                    <input type="email" class="form-control" id="loginEmail" placeholder="usuario@ejemplo.com" required autocomplete="email">
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label fw-semibold">Contraseña</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white text-muted"><i class="fas fa-lock"></i></span>
                                    <input type="password" class="form-control" id="loginPassword" placeholder="******" required autocomplete="current-password">
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="rememberMe">
                                    <label class="form-check-label text-muted small" for="rememberMe">
                                        Recordarme
                                    </label>
                                </div>
                                <a href="#" id="forgot-password-link" class="text-decoration-none small text-primary">¿Olvidaste tu contraseña?</a>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 py-2 fw-bold shadow-sm" id="manual-login-btn">
                                <span class="normal-text">Iniciar Sesión</span>
                                <span class="loading-text d-none">
                                    <span class="spinner-border spinner-border-sm me-2"></span> Entrando...
                                </span>
                            </button>
                        </form>

                        <div class="text-center my-3 position-relative">
                            <hr class="text-muted opacity-25">
                            <span class="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small">O continúa con</span>
                        </div>

                        <div class="d-grid gap-2">
                            <button id="google-signin-btn" class="btn btn-outline-dark py-2 d-flex align-items-center justify-content-center gap-2 transition-hover">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18">
                                <span>Google</span>
                            </button>
                            
                            <button id="biometric-login-btn" class="btn btn-outline-secondary py-2 d-flex align-items-center justify-content-center gap-2 transition-hover" style="display: none;">
                                <i class="fas fa-fingerprint text-success"></i>
                                <span>Biometría</span>
                            </button>
                        </div>
                         
                         <div class="mt-2 text-center" id="biometric-status-text"></div>
                    </div>
                    <div class="modal-footer bg-light border-0 justify-content-center py-3">
                        <p class="mb-0 small text-muted">¿No tienes cuenta? <a href="#" id="register-link" class="text-primary text-decoration-none fw-bold">Regístrate aquí</a></p>
                    </div>
                </div>
            </div>
        </div>`;
    }

    injectModal(): void {
        const existingModal = document.getElementById(this.modalId);
        if (!existingModal) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.createModalHTML();
            document.body.appendChild(tempDiv.firstElementChild as Node);
        }
    }

    showModal(): void {
        this.injectModal();
        // Usar Bootstrap modal si está disponible
        const modalEl = document.getElementById(this.modalId);
        if (modalEl && (window as any).bootstrap) {
            const modal = new (window as any).bootstrap.Modal(modalEl);
            modal.show();
        } else if (modalEl) {
            // Fallback básico
            modalEl.classList.add('show');
            modalEl.style.display = 'block';
            document.body.classList.add('modal-open');

            // Backdrop fallback
            if (!document.querySelector('.modal-backdrop')) {
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);
            }
        }
    }

    hideModal(): void {
        const modalEl = document.getElementById(this.modalId);
        if (modalEl) {
            // Intento cerrar via bootstrap instance si existe
            const bsModal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
            if (bsModal) {
                bsModal.hide();
            } else {
                // Fallback
                modalEl.classList.remove('show');
                modalEl.style.display = 'none';
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
    }

    showAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
        const alertEl = document.getElementById('auth-alert');
        if (alertEl) {
            alertEl.className = `alert alert-${type} fade show`;
            alertEl.innerHTML = message;
            alertEl.classList.remove('d-none');
        } else {
            // Fallback global toast
            const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
            // Implement simple toast logic if needed
            alert(message); // Fallback extremo
        }
    }

    private createToastContainer(): Element {
        const div = document.createElement('div');
        div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(div);
        return div;
    }

    updateAuthUI(user: User | null, isAuthenticated: boolean): void {
        // Elementos del DOM
        const loginButtons = document.getElementById('loginButtons');
        const userMenu = document.getElementById('userMenu');
        const userMenuName = document.getElementById('userMenuName');
        const userMenuRole = document.getElementById('userMenuRole');

        // Items de menú por rol
        const adminItems = document.getElementById('adminMenuItems');
        const teacherItems = document.getElementById('teacherMenuItems');
        const studentItems = document.getElementById('studentMenuItems');

        if (isAuthenticated && user) {
            if (loginButtons) loginButtons.classList.add('d-none');
            if (userMenu) userMenu.classList.remove('d-none');

            if (userMenuName) userMenuName.textContent = user.nombre || user.email.split('@')[0];

            const role = user.role || 'usuario';
            if (userMenuRole) userMenuRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);

            // Mostrar items según rol
            if (adminItems) adminItems.classList.toggle('d-none', !['admin', 'administrator'].includes(role));
            if (teacherItems) teacherItems.classList.toggle('d-none', !['docente', 'teacher'].includes(role));
            if (studentItems) studentItems.classList.toggle('d-none', !['estudiante', 'student'].includes(role));

            // Dashboard link
            const adminSection = document.getElementById('adminOnlySection');
            if (adminSection) adminSection.classList.toggle('d-none', !['admin', 'administrator'].includes(role));

        } else {
            if (loginButtons) loginButtons.classList.remove('d-none');
            if (userMenu) userMenu.classList.add('d-none');

            // Ocultar sección admin
            const adminSection = document.getElementById('adminOnlySection');
            if (adminSection) adminSection.classList.add('d-none');
        }
    }
}
