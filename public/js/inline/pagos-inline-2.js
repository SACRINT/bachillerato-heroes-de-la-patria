// Estado de la aplicación de pagos
        let currentPaymentUser = null;
        let isPaymentLoggedIn = false;

        function showLoginModal() {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        }

        function showConsultModal() {
            if (!isPaymentLoggedIn) {
                showPaymentAlert('Debes iniciar sesión primero para consultar pagos.', 'warning');
                showLoginModal();
                return;
            }
            const modal = new bootstrap.Modal(document.getElementById('consultModal'));
            modal.show();
        }

        function showPaymentModal() {
            if (!isPaymentLoggedIn) {
                showPaymentAlert('Debes iniciar sesión primero para realizar pagos.', 'warning');
                showLoginModal();
                return;
            }
            const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
            modal.show();
        }

        // Función principal de login para compatibilidad
        async function loginPaymentSystem() {
            const email = document.getElementById('paymentEmail').value.trim();
            const studentId = document.getElementById('studentIdPayment').value.trim();
            const password = document.getElementById('paymentPassword').value;
            const loginIdentifier = studentId || email;

            if (!loginIdentifier || !password) {
                showPaymentAlert('Por favor completa los campos requeridos (matrícula/email y contraseña).', 'warning');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: loginIdentifier, password: password })
                });

                const data = await response.json();
                if (!response.ok || !data.success) {
                    throw new Error(data.message || data.error || 'Credenciales inválidas.');
                }

                const user = data.user || {};
                const token = data.token || (data.tokens && data.tokens.accessToken) || data.accessToken;
                if (token) {
                    localStorage.setItem('auth_token', token);
                    localStorage.setItem('bge_auth_token', token);
                }

                const userName = user.nombre ? `${user.nombre} ${user.apellido_paterno || ''}`.trim() : (user.username || 'Usuario');
                const isStudent = user.role === 'estudiante' || Boolean(studentId);

                const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
                const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

                currentPaymentUser = {
                    tipo: isStudent ? 'estudiante' : 'padre',
                    matricula: user.matricula || studentId || 'N/A',
                    nombre: userName,
                    email: user.email || email,
                    hijo: isStudent ? null : 'Estudiante Asignado',
                    adeudos: [
                        { concepto: `Colegiatura ${capitalizedMonth}`, monto: 1200, fecha_vencimiento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], estado: 'pendiente' },
                        { concepto: 'Servicios Escolares y Plataforma Digital', monto: 350, fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], estado: 'pendiente' }
                    ]
                };

                isPaymentLoggedIn = true;
                showPaymentPanel();
                const modalEl = document.getElementById('loginModal');
                if (modalEl) {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                }
                showPaymentAlert(`¡Bienvenido(a), ${userName}! Sistema de pagos activo.`, 'success');
                loadPaymentData();
            } catch (err) {
                console.error('Login error:', err);
                showPaymentAlert(err.message || 'Error al iniciar sesión. Verifica tus credenciales.', 'danger');
            }
        }

        // Auto-activar si ya existe sesión activa
        document.addEventListener('DOMContentLoaded', function () {
            const token = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token');
            const storedUser = localStorage.getItem('auth_user') || localStorage.getItem('bge_user_data');
            if (token && storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    const userName = user.nombre ? `${user.nombre} ${user.apellido_paterno || ''}`.trim() : (user.username || 'Usuario');
                    const isStudent = user.role === 'estudiante';
                    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
                    const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

                    currentPaymentUser = {
                        tipo: isStudent ? 'estudiante' : 'padre',
                        matricula: user.matricula || 'N/A',
                        nombre: userName,
                        email: user.email || '',
                        hijo: isStudent ? null : 'Estudiante Asignado',
                        adeudos: [
                            { concepto: `Colegiatura ${capitalizedMonth}`, monto: 1200, fecha_vencimiento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0], estado: 'pendiente' },
                            { concepto: 'Servicios Escolares y Plataforma Digital', monto: 350, fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], estado: 'pendiente' }
                        ]
                    };
                    isPaymentLoggedIn = true;
                    showPaymentPanel();
                    loadPaymentData();
                } catch (e) { }
            }
        });

        // Mostrar panel de pagos
        function showPaymentPanel() {
            const heroSection = document.querySelector('#hero');
            if (heroSection) heroSection.classList.remove('d-none');

            const paymentPanel = document.getElementById('paymentPanel');
            if (paymentPanel) {
                paymentPanel.classList.remove('d-none');
            }
        }

        // Cargar datos de pago
        function loadPaymentData() {
            // Actualizar información del usuario
            const userName = document.getElementById('studentName');

            if (userName) {
                userName.textContent = currentPaymentUser.tipo === 'estudiante' ?
                    currentPaymentUser.nombre :
                    `${currentPaymentUser.nombre} (Pagos de ${currentPaymentUser.hijo})`;
            }

            // Cargar adeudos en la tabla
            loadPendingPayments();

            // Actualizar estadísticas
            updatePaymentStats();
        }

        // Cargar pagos pendientes
        function loadPendingPayments() {
            const tbody = document.getElementById('pendingPaymentsTable');
            if (tbody && currentPaymentUser.adeudos) {
                tbody.innerHTML = '';

                currentPaymentUser.adeudos.forEach((pago, index) => {
                    const row = `
                        <tr>
                            <td>${pago.concepto}</td>
                            <td>$${pago.monto.toLocaleString()}</td>
                            <td>${pago.fecha_vencimiento}</td>
                            <td><span class="badge bg-warning">Pendiente</span></td>
                            <td>
                                <button class="btn btn-sm btn-success" data-action="payDebt(${index})">
                                    <i class="fas fa-credit-card"></i> Pagar
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }
        }

        // Actualizar estadísticas
        function updatePaymentStats() {
            if (currentPaymentUser.adeudos) {
                const totalDebt = currentPaymentUser.adeudos.reduce((sum, pago) => sum + pago.monto, 0);
                const pendingCount = currentPaymentUser.adeudos.length;

                const totalElement = document.getElementById('totalDebt');
                const countElement = document.getElementById('pendingCount');

                if (totalElement) totalElement.textContent = `$${totalDebt.toLocaleString()}`;
                if (countElement) countElement.textContent = pendingCount;
            }
        }

        // Pagar adeudo
        function payDebt(index) {
            const pago = currentPaymentUser.adeudos[index];
            const confirmPay = confirm(`¿Confirmas el pago de $${pago.monto.toLocaleString()} por concepto de "${pago.concepto}"?`);

            if (confirmPay) {
                // Simular procesamiento
                showPaymentAlert('Procesando pago...', 'info');

                setTimeout(() => {
                    // Remover el pago de la lista
                    currentPaymentUser.adeudos.splice(index, 1);
                    loadPendingPayments();
                    updatePaymentStats();
                    showPaymentAlert(`¡Pago exitoso! Se ha procesado el pago por $${pago.monto.toLocaleString()}.`, 'success');
                }, 2000);
            }
        }

        // Consultar historial
        function consultHistory() {
            showPaymentAlert('Mostrando historial de pagos... Esta funcionalidad estará disponible próximamente.', 'info');
            bootstrap.Modal.getInstance(document.getElementById('consultModal')).hide();
        }

        // Logout de pagos
        function logoutPayment() {
            currentPaymentUser = null;
            isPaymentLoggedIn = false;

            const heroSection = document.querySelector('#hero');
            if (heroSection) heroSection.classList.remove('d-none');

            const paymentPanel = document.getElementById('paymentPanel');
            if (paymentPanel) {
                paymentPanel.classList.add('d-none');
            }

            showPaymentAlert('Sesión cerrada exitosamente.', 'info');
        }

        // Sistema de alertas
        function showPaymentAlert(message, type) {
            const alertDiv = document.createElement('div');
            alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
            alertDiv.classList.add('payment-alert-custom');
            alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            `;
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }

        // Procesar pago con tarjeta
        function processCardPayment() {
            const cardNumber = document.getElementById('cardNumber').value;
            const cardName = document.getElementById('cardName').value;
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCVC = document.getElementById('cardCVC').value;

            if (!cardNumber || !cardName || !cardExpiry || !cardCVC) {
                showPaymentAlert('Por favor completa todos los campos de la tarjeta.', 'warning');
                return;
            }

            showPaymentAlert('Procesando pago con tarjeta... Esta funcionalidad estará disponible próximamente.', 'info');
            bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        }

        function scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
