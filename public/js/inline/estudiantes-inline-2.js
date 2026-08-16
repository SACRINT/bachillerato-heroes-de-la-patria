// ============================================
        // FUNCIONES PARA GESTIÓN DEL DASHBOARD ESTUDIANTIL
        // ============================================

        // Función para mostrar el modal de login desde el botón
        function showStudentLogin() {
            console.log('🔓 Abriendo modal de login estudiantil...');
            if (window.studentDashboard) {
                window.studentDashboard.showLoginModal();
            } else if (typeof StudentDashboard !== 'undefined') {
                // Crear instancia si no existe
                window.studentDashboard = new StudentDashboard();
                if (window.studentDashboard.showLoginModal) {
                    window.studentDashboard.showLoginModal();
                }
            }
        }

        // Función para ocultar el prompt de login
        function hideLoginPrompt() {
            const loginPrompt = document.getElementById('loginPrompt');
            if (loginPrompt) {
                loginPrompt.style.display = 'none';
            }
        }

        // Función para mostrar el prompt de login
        function showLoginPrompt() {
            const loginPrompt = document.getElementById('loginPrompt');
            if (loginPrompt) {
                loginPrompt.style.display = 'block';
            }
        }

        // Función para verificar estado de autenticación al cargar
        function checkStudentAuthStatus() {
            const authToken = localStorage.getItem('student_auth_token') || localStorage.getItem('bge_auth_token');
            if (authToken) {
                // Usuario ya logueado, ocultar prompt
                hideLoginPrompt();
                console.log('✅ Usuario ya autenticado');
            } else {
                // Mostrar prompt de login
                showLoginPrompt();
                console.log('ℹ️ Usuario no autenticado, mostrando prompt');
            }
        }

        // Inicializar verificación de autenticación cuando se carga la página
        document.addEventListener('DOMContentLoaded', function () {
            // Instanciar StudentDashboard si está disponible
            if (typeof StudentDashboard !== 'undefined' && !window.studentDashboard) {
                window.studentDashboard = new StudentDashboard();
            }
            // Verificar estado de autenticación después de un breve delay
            setTimeout(checkStudentAuthStatus, 300);
        });
