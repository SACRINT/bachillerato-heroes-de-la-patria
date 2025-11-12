/**
 * PARENTS PORTAL MANAGER
 * window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')
 * Fecha: 19 de Octubre, 2025
 *
 * Gestor completo del Portal de Padres
 */

class ParentsPortalManager {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/parents';
        this.token = localStorage.getItem('parentToken');
        this.parentData = null;
        this.students = [];

        this.init();
    }

    async init() {
        // Si hay token, cargar dashboard
        if (this.token) {
            await this.loadDashboard();
        } else {
            this.showLogin();
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Toggle forms
        document.getElementById('showRegisterLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        });

        document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });

        // Logout
        document.getElementById('logoutLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const response = await fetch(`${this.apiEndpoint}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorDiv.textContent = data.error || 'Error al iniciar sesión';
                errorDiv.style.display = 'block';
                return;
            }

            // Guardar token y datos
            this.token = data.data.token;
            this.parentData = data.data.parent;
            localStorage.setItem('parentToken', this.token);
            localStorage.setItem('parentData', JSON.stringify(this.parentData));

            // Cargar dashboard
            await this.loadDashboard();

        } catch (error) {
            console.error('Error en login:', error);
            errorDiv.textContent = 'Error de conexión. Intente nuevamente';
            errorDiv.style.display = 'block';
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const formData = {
            nombre: document.getElementById('regNombre').value,
            apellido_paterno: document.getElementById('regApellidoP').value,
            apellido_materno: document.getElementById('regApellidoM').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            telefono: document.getElementById('regTelefono').value,
            parentesco: document.getElementById('regParentesco').value
        };

        try {
            const response = await fetch(`${this.apiEndpoint}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Error en el registro');
                return;
            }

            alert(data.message);
            // Volver a login
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';

        } catch (error) {
            console.error('Error en registro:', error);
            alert('Error de conexión');
        }
    }

    async loadDashboard() {
        try {
            const response = await fetch(`${this.apiEndpoint}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    return;
                }
                throw new Error('Error al cargar dashboard');
            }

            const data = await response.json();

            // Guardar datos
            this.students = data.data.students;
            const summary = data.data.summary;

            // Mostrar dashboard
            this.showDashboard();

            // Actualizar UI
            document.getElementById('parentName').textContent = this.parentData?.nombre || 'Padre de Familia';
            document.getElementById('totalStudents').textContent = summary.total_students;
            document.getElementById('unreadNotifications').textContent = summary.unread_notifications;
            document.getElementById('unreadMessages').textContent = summary.unread_messages;
            document.getElementById('pendingPayments').textContent = summary.pending_payments.count;

            // Mostrar badge de notificaciones
            if (summary.unread_notifications > 0) {
                const badge = document.getElementById('notificationsBadge');
                badge.textContent = summary.unread_notifications;
                badge.style.display = 'inline';
            }

            // Renderizar estudiantes
            this.renderStudents();

        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            alert('Error al cargar información');
        }
    }

    renderStudents() {
        const container = document.getElementById('studentsList');
        container.innerHTML = sanitizeHTML('');

        this.students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'col-md-6 col-lg-4 mb-3';
            card.innerHTML = sanitizeHTML(`
                <div class="card student-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${student.nombre_completo}</h5>
                        <p class="card-text">
                            <strong>Matrícula:</strong> ${student.matricula}<br>
                            <strong>Grado:</strong> ${student.grado}° ${student.grupo}<br>
                            <strong>Turno:</strong> ${student.turno}<br>
                            <strong>Especialidad:</strong> ${student.especialidad || 'N/A'}
                        </p>
                        <button class="btn btn-primary btn-sm" onclick="parentsPortal.viewStudent(${student.id})">
                            Ver Detalles
                        </button>
                    </div>
                </div>
            `);
            container.appendChild(card);
        });
    }

    async viewStudent(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        // Actualizar título del modal
        document.getElementById('studentModalTitle').textContent = student.nombre_completo;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('studentModal'));
        modal.show();

        // Cargar calificaciones por defecto
        await this.loadGrades(studentId);
    }

    async loadGrades(studentId) {
        const container = document.getElementById('gradesContent');
        container.innerHTML = sanitizeHTML('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

        try {
            const response = await fetch(`${this.apiEndpoint}/students/${studentId}/grades`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar calificaciones');

            const data = await response.json();
            const grades = data.data.grades;
            const summary = data.data.summary;

            let html = `
                <div class="alert alert-info">
                    <strong>Promedio General:</strong> ${summary.promedio_general}
                    <br>
                    <strong>Total de Materias:</strong> ${summary.total_materias}
                </div>

                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Profesor</th>
                                <th>Periodo</th>
                                <th>Calificación</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            grades.forEach(grade => {
                const badgeClass = grade.calificacion >= 8 ? 'bg-success' : grade.calificacion >= 6 ? 'bg-warning' : 'bg-danger';
                html += `
                    <tr>
                        <td>${grade.materia}</td>
                        <td>${grade.profesor || 'N/A'}</td>
                        <td>${grade.periodo}</td>
                        <td>
                            <span class="badge ${badgeClass} grade-badge">
                                ${grade.calificacion}
                            </span>
                        </td>
                        <td>${grade.observaciones || '-'}</td>
                    </tr>
                `;
            });

            html += `
                        </tbody>
                    </table>
                </div>
            `;

            container.innerHTML = sanitizeHTML(html);

        } catch (error) {
            console.error('Error al cargar calificaciones:', error);
            container.innerHTML = sanitizeHTML('<div class="alert alert-danger">Error al cargar calificaciones</div>');
        }
    }

    async loadAttendance(studentId) {
        const container = document.getElementById('attendanceContent');
        container.innerHTML = sanitizeHTML('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

        try {
            const response = await fetch(`${this.apiEndpoint}/students/${studentId}/attendance`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar asistencia');

            const data = await response.json();
            const attendance = data.data.attendance;
            const stats = data.data.stats_monthly;

            let html = `
                <div class="row mb-3">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h4 class="text-success">${stats.asistencias}</h4>
                                <p>Asistencias</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h4 class="text-danger">${stats.faltas}</h4>
                                <p>Faltas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h4 class="text-warning">${stats.retardos}</h4>
                                <p>Retardos</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h4 class="text-info">${stats.justificadas}</h4>
                                <p>Justificadas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Materia</th>
                            <th>Justificación</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            attendance.forEach(record => {
                const statusClass = record.tipo === 'asistencia' ? 'attendance-present' :
                                  record.tipo === 'falta' ? 'attendance-absent' : 'attendance-late';

                html += `
                    <tr>
                        <td>${new Date(record.fecha).toLocaleDateString()}</td>
                        <td>
                            <span class="attendance-indicator ${statusClass}"></span>
                            ${record.tipo}
                        </td>
                        <td>${record.materia || 'General'}</td>
                        <td>${record.justificada ? '✓ ' + (record.motivo_justificacion || 'Justificada') : '-'}</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = sanitizeHTML(html);

        } catch (error) {
            console.error('Error al cargar asistencia:', error);
            container.innerHTML = sanitizeHTML('<div class="alert alert-danger">Error al cargar asistencia</div>');
        }
    }

    async loadPayments(studentId) {
        const container = document.getElementById('paymentsContent');
        container.innerHTML = sanitizeHTML('<div class="text-center"><div class="spinner-border" role="status"></div></div>');

        try {
            const response = await fetch(`${this.apiEndpoint}/students/${studentId}/payments`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar pagos');

            const data = await response.json();
            const payments = data.data.payments;
            const summary = data.data.summary;

            let html = `
                <div class="alert alert-warning">
                    <strong>Pagos Pendientes:</strong> ${summary.pendientes}
                    (Total: $${summary.total_pendiente.toFixed(2)})<br>
                    <strong>Pagos Realizados:</strong> ${summary.pagados}
                    (Total: $${summary.total_pagado.toFixed(2)})
                </div>

                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th>Monto</th>
                            <th>Fecha Límite</th>
                            <th>Estado</th>
                            <th>Fecha Pago</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            payments.forEach(payment => {
                html += `
                    <tr>
                        <td>
                            <strong>${payment.concepto}</strong>
                            ${payment.descripcion ? `<br><small class="text-muted">${payment.descripcion}</small>` : ''}
                        </td>
                        <td>$${payment.monto.toFixed(2)}</td>
                        <td>${new Date(payment.fecha_limite).toLocaleDateString()}</td>
                        <td>
                            <span class="payment-status ${payment.estatus}">
                                ${payment.estatus}
                            </span>
                        </td>
                        <td>${payment.fecha_pago ? new Date(payment.fecha_pago).toLocaleDateString() : '-'}</td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = sanitizeHTML(html);

        } catch (error) {
            console.error('Error al cargar pagos:', error);
            container.innerHTML = sanitizeHTML('<div class="alert alert-danger">Error al cargar pagos</div>');
        }
    }

    showLogin() {
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('dashboardScreen').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboardScreen').style.display = 'block';
    }

    logout() {
        this.token = null;
        this.parentData = null;
        this.students = [];
        localStorage.removeItem('parentToken');
        localStorage.removeItem('parentData');
        this.showLogin();
    }
}

// Hacer disponible globalmente
window.ParentsPortalManager = ParentsPortalManager;
