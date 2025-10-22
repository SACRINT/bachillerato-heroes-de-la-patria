/**
 * 🎓 CLIENTE DE AUTENTICACIÓN DE ESTUDIANTES
 * Gestiona login, logout y sesión de estudiantes
 */

class StudentAuth {
    constructor() {
        this.baseURL = '/api/students-auth';
        this.student = null;
        this.isAuthenticated = false;
    }

    /**
     * 🔐 Login de estudiante
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include', // Importante para cookies de sesión
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.student = data.student;
                this.isAuthenticated = true;

                // Guardar en localStorage como respaldo
                localStorage.setItem('student', JSON.stringify(data.student));

                console.log('✅ Login exitoso:', this.student.name);
                return { success: true, student: this.student };
            } else {
                console.error('❌ Login fallido:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Error en login:', error);
            return {
                success: false,
                message: 'Error de conexión. Por favor intenta nuevamente.'
            };
        }
    }

    /**
     * 👋 Logout de estudiante
     */
    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await response.json();

            this.student = null;
            this.isAuthenticated = false;
            localStorage.removeItem('student');

            console.log('👋 Logout exitoso');
            return { success: true };
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Limpiar de todas formas
            this.student = null;
            this.isAuthenticated = false;
            localStorage.removeItem('student');
            return { success: false, message: error.message };
        }
    }

    /**
     * 🔍 Verificar sesión activa
     */
    async checkSession() {
        try {
            const response = await fetch(`${this.baseURL}/check`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success && data.isAuthenticated) {
                this.student = data.student;
                this.isAuthenticated = true;

                // Actualizar localStorage
                localStorage.setItem('student', JSON.stringify(data.student));

                return { success: true, student: this.student };
            } else {
                this.student = null;
                this.isAuthenticated = false;
                localStorage.removeItem('student');
                return { success: false };
            }
        } catch (error) {
            console.error('❌ Error verificando sesión:', error);

            // Intentar recuperar de localStorage como fallback
            const savedStudent = localStorage.getItem('student');
            if (savedStudent) {
                try {
                    this.student = JSON.parse(savedStudent);
                    this.isAuthenticated = true;
                    return { success: true, student: this.student };
                } catch (e) {
                    console.error('❌ Error recuperando sesión de localStorage:', e);
                }
            }

            return { success: false };
        }
    }

    /**
     * 👤 Obtener estudiante actual
     */
    getStudent() {
        return this.student;
    }

    /**
     * ✅ Verificar si está autenticado
     */
    isLoggedIn() {
        return this.isAuthenticated && this.student !== null;
    }

    /**
     * 📊 Obtener datos del estudiante
     */
    getStudentData() {
        if (!this.isLoggedIn()) {
            return null;
        }
        return {
            id: this.student.id,
            name: this.student.name,
            email: this.student.email,
            group: this.student.group
        };
    }

    /**
     * 🔄 Actualizar sesión desde localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedStudent = localStorage.getItem('student');
            if (savedStudent) {
                this.student = JSON.parse(savedStudent);
                this.isAuthenticated = true;
                return true;
            }
        } catch (error) {
            console.error('❌ Error cargando sesión desde localStorage:', error);
        }
        return false;
    }
}

// Instancia global
const studentAuth = new StudentAuth();

// Verificar sesión al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Verificando sesión de estudiante...');
    const result = await studentAuth.checkSession();

    if (result.success) {
        console.log('✅ Sesión activa:', studentAuth.getStudent().name);

        // Actualizar UI si existe elemento de bienvenida
        updateStudentUI();
    } else {
        console.log('ℹ️ No hay sesión activa');
    }
});

/**
 * 🎨 Actualizar UI con datos del estudiante
 */
function updateStudentUI() {
    if (!studentAuth.isLoggedIn()) return;

    const student = studentAuth.getStudent();

    // Actualizar nombre en navbar si existe
    const studentNameElement = document.getElementById('student-name');
    if (studentNameElement) {
        studentNameElement.textContent = student.name;
    }

    // Actualizar grupo si existe
    const studentGroupElement = document.getElementById('student-group');
    if (studentGroupElement) {
        studentGroupElement.textContent = student.group;
    }

    // Mostrar/ocultar elementos según estado de login
    const loginElements = document.querySelectorAll('[data-show-when="not-logged-in"]');
    loginElements.forEach(el => el.style.display = 'none');

    const loggedInElements = document.querySelectorAll('[data-show-when="logged-in"]');
    loggedInElements.forEach(el => el.style.display = 'block');
}

/**
 * 📝 Mostrar modal de login
 */
function showStudentLoginModal() {
    // Si ya está logueado, no mostrar modal
    if (studentAuth.isLoggedIn()) {
        alert(`Ya has iniciado sesión como ${studentAuth.getStudent().name}`);
        return;
    }

    const modalHTML = `
        <div class="modal fade" id="studentLoginModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-user-graduate me-2"></i>
                            Iniciar Sesión - Estudiantes
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div id="login-alert-container"></div>

                        <form id="studentLoginForm">
                            <div class="mb-3">
                                <label for="studentEmail" class="form-label">
                                    <i class="fas fa-envelope me-2"></i>Correo Electrónico
                                </label>
                                <input type="email" class="form-control" id="studentEmail"
                                       placeholder="tu.correo@estudiante.com" required>
                                <div class="form-text">Usa tu correo institucional de estudiante</div>
                            </div>

                            <div class="mb-3">
                                <label for="studentPassword" class="form-label">
                                    <i class="fas fa-lock me-2"></i>Contraseña
                                </label>
                                <input type="password" class="form-control" id="studentPassword"
                                       placeholder="Tu contraseña" required>
                            </div>

                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Usuarios Demo:</strong><br>
                                <small>
                                    • juan.perez@estudiante.com - demo123<br>
                                    • maria.lopez@estudiante.com - demo123<br>
                                    • carlos.hernandez@estudiante.com - demo123
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="handleStudentLogin(event)">
                            <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('studentLoginModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('studentLoginModal'));
    modal.show();

    // Focus en email
    setTimeout(() => {
        document.getElementById('studentEmail').focus();
    }, 500);

    // Enter key para submit
    document.getElementById('studentLoginForm').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleStudentLogin();
        }
    });
}

/**
 * 🔐 Manejar login desde el modal
 */
async function handleStudentLogin(event) {
    const email = document.getElementById('studentEmail').value.trim();
    const password = document.getElementById('studentPassword').value;

    if (!email || !password) {
        showLoginAlert('Por favor completa todos los campos', 'warning');
        return;
    }

    // Mostrar loading
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Iniciando sesión...';

    try {
        const result = await studentAuth.login(email, password);

        if (result.success) {
            showLoginAlert(`¡Bienvenido, ${result.student.name}!`, 'success');

            // Cerrar modal después de 1 segundo
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('studentLoginModal'));
                modal.hide();

                // Actualizar UI
                updateStudentUI();

                // Recargar página o actualizar contenido
                location.reload();
            }, 1000);
        } else {
            showLoginAlert(result.message || 'Credenciales incorrectas', 'danger');
            button.disabled = false;
            button.innerHTML = originalText;
        }
    } catch (error) {
        showLoginAlert('Error al iniciar sesión. Intenta nuevamente.', 'danger');
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * 🚪 Logout de estudiante
 */
async function handleStudentLogout() {
    if (!confirm('¿Estás seguro que deseas cerrar sesión?')) {
        return;
    }

    const result = await studentAuth.logout();

    if (result.success) {
        alert('Sesión cerrada exitosamente');
        location.reload();
    } else {
        alert('Error al cerrar sesión');
    }
}

/**
 * 📢 Mostrar alerta en modal de login
 */
function showLoginAlert(message, type) {
    const container = document.getElementById('login-alert-container');
    if (!container) return;

    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    container.innerHTML = alertHTML;

    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
        const alert = container.querySelector('.alert');
        if (alert) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }
    }, 5000);
}

// Exportar para uso global
window.studentAuth = studentAuth;
window.showStudentLoginModal = showStudentLoginModal;
window.handleStudentLogin = handleStudentLogin;
window.handleStudentLogout = handleStudentLogout;