// Portal de Padres - window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')
// Refactorizado: 11-ENE-2026 - Integración con API real
class ParentPortal {
    constructor() {
        this.apiEndpoint = '/api/parents';
        this.token = localStorage.getItem('parent_token');
        this.currentSession = null;
        this.studentData = null;
        this.students = []; // Lista de estudiantes del padre
        this.currentStudentId = null; // Estudiante actualmente seleccionado
        this.isLoggedIn = false;

        this.initializePortal();
    }

    initializePortal() {
        this.checkExistingSession();
        this.setupEventListeners();
    }

    checkExistingSession() {
        const savedToken = localStorage.getItem('parent_token');
        const savedData = localStorage.getItem('parent_data');

        if (savedToken && savedData) {
            try {
                this.token = savedToken;
                const parentData = JSON.parse(savedData);
                // Verificar token con el servidor
                this.verifyAndLoadDashboard(parentData);
            } catch (error) {
                console.error('Error restoring session:', error);
                this.clearSession();
            }
        }
    }

    clearSession() {
        localStorage.removeItem('parent_token');
        localStorage.removeItem('parent_data');
        this.token = null;
        this.isLoggedIn = false;
        this.students = [];
    }

    async verifyAndLoadDashboard(parentData) {
        try {
            const response = await fetch(`${this.apiEndpoint}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.students = data.data.students || [];
                this.currentStudentId = this.students[0]?.id || null;
                this.isLoggedIn = true;
                this.showDashboard(parentData);
            } else {
                this.clearSession();
            }
        } catch (error) {
            console.error('Error verifying session:', error);
            this.clearSession();
        }
    }

    setupEventListeners() {
        // Formulario de login
        const loginForm = document.getElementById('parentLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processLogin();
            });
        }

        // Formulario de recuperación
        const recoveryForm = document.getElementById('recoveryForm');
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPasswordRecovery();
            });
        }
    }



    async processLogin() {
        const email = document.getElementById('parentEmail')?.value;
        const password = document.getElementById('accessPassword')?.value;
        const rememberMe = document.getElementById('rememberMe')?.checked;

        // Validación básica
        if (!email || !password) {
            this.showAlert('Por favor completa los campos de email y contraseña', 'error');
            return;
        }

        this.showAlert('Verificando credenciales...', 'info');

        try {
            const response = await fetch(`${this.apiEndpoint}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Guardar token y datos
                this.token = data.data.token;
                localStorage.setItem('parent_token', this.token);
                localStorage.setItem('parent_data', JSON.stringify(data.data.parent));

                // Cargar dashboard
                await this.loadDashboard(data.data.parent, rememberMe);
            } else {
                this.showAlert(data.error || 'Credenciales incorrectas.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('Error de conexión. Intente nuevamente.', 'error');
        }
    }

    async loadDashboard(parentData, rememberMe = false) {
        try {
            const response = await fetch(`${this.apiEndpoint}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar dashboard');
            }

            const data = await response.json();
            this.students = data.data.students || [];
            this.currentStudentId = this.students[0]?.id || null;
            this.isLoggedIn = true;

            this.showDashboard(parentData);
            this.showAlert('¡Bienvenido al Portal de Padres!', 'success');

        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showAlert('Error al cargar el dashboard', 'error');
        }
    }

    showDashboard(parentData) {
        // Ocultar login, mostrar dashboard
        const loginSection = document.getElementById('loginSection');
        const dashboardSection = document.getElementById('parentDashboard');

        if (loginSection) loginSection.classList.add('d-none');
        if (dashboardSection) {
            dashboardSection.classList.remove('d-none');
            this.renderDashboardContent(parentData);
        }
    }

    renderDashboardContent(parentData) {
        const mainPanel = document.getElementById('mainPanel');
        if (!mainPanel) return;

        // Renderizar lista de estudiantes
        let studentsHTML = '';
        if (this.students.length > 0) {
            studentsHTML = this.students.map(student => `
                <div class="card mb-3 student-card" data-student-id="${student.id}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 class="mb-1">${student.nombre_completo || 'Estudiante'}</h5>
                                <small class="text-muted">
                                    ${student.grado || ''}° ${student.grupo || ''} - ${student.turno || ''}
                                </small>
                            </div>
                            <button class="btn btn-primary btn-sm" data-action="select-student" data-id="${student.id}">
                                <i class="fas fa-eye me-1"></i>Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            studentsHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay estudiantes vinculados a su cuenta.
                </div>
            `;
        }

        mainPanel.innerHTML = DOMPurify.sanitize(`
            <div class="welcome-header mb-4">
                <h3><i class="fas fa-user-circle text-primary me-2"></i>Bienvenido, ${parentData?.nombre || 'Padre de Familia'}</h3>
                <p class="text-muted">Seleccione un estudiante para ver su información académica</p>
            </div>
            <div class="row">
                <div class="col-12">
                    <h5 class="mb-3"><i class="fas fa-users me-2"></i>Mis Estudiantes</h5>
                    ${studentsHTML}
                </div>
            </div>
        `);

        // Agregar event listeners para seleccionar estudiante
        mainPanel.querySelectorAll('[data-action="select-student"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const studentId = e.target.closest('[data-id]').dataset.id;
                this.selectStudent(parseInt(studentId));
            });
        });
    }

    selectStudent(studentId) {
        this.currentStudentId = studentId;
        const student = this.students.find(s => s.id === studentId);
        if (student) {
            this.studentData = student;
            this.renderStudentDashboard(student);
        }
    }

    renderStudentDashboard(student) {
        const mainPanel = document.getElementById('mainPanel');
        if (!mainPanel) return;

        mainPanel.innerHTML = DOMPurify.sanitize(`
            <div class="student-info-header mb-4">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 class="mb-1">${student.nombre_completo || 'Estudiante'}</h4>
                        <p class="mb-0 text-muted">
                            <i class="fas fa-graduation-cap me-1"></i>
                            ${student.grado || ''}° ${student.grupo || ''} | ${student.turno || ''} | ${student.especialidad || ''}
                        </p>
                    </div>
                    <button class="btn btn-outline-secondary" data-action="back-to-list">
                        <i class="fas fa-arrow-left me-1"></i>Volver
                    </button>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-4">
                    <button class="btn btn-primary w-100 h-100 quick-action-btn" data-action="show-grades">
                        <i class="fas fa-chart-line fa-2x mb-2"></i><br>
                        <span>Calificaciones</span>
                    </button>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-success w-100 h-100 quick-action-btn" data-action="show-attendance">
                        <i class="fas fa-calendar-check fa-2x mb-2"></i><br>
                        <span>Asistencia</span>
                    </button>
                </div>
                <div class="col-md-4">
                    <button class="btn btn-info w-100 h-100 quick-action-btn" data-action="show-schedule">
                        <i class="fas fa-clock fa-2x mb-2"></i><br>
                        <span>Horario</span>
                    </button>
                </div>
            </div>
            <div id="studentContentPanel" class="mt-4"></div>
        `);

        // Event listeners
        mainPanel.querySelector('[data-action="back-to-list"]')?.addEventListener('click', () => {
            const parentData = JSON.parse(localStorage.getItem('parent_data') || '{}');
            this.renderDashboardContent(parentData);
        });

        mainPanel.querySelector('[data-action="show-grades"]')?.addEventListener('click', () => this.loadGradesFromAPI());
        mainPanel.querySelector('[data-action="show-attendance"]')?.addEventListener('click', () => this.loadAttendanceFromAPI());
        mainPanel.querySelector('[data-action="show-schedule"]')?.addEventListener('click', () => showSchedule());
    }

    async loadGradesFromAPI() {
        if (!this.currentStudentId) {
            this.showAlert('Seleccione un estudiante primero', 'warning');
            return;
        }

        const contentPanel = document.getElementById('studentContentPanel');
        if (!contentPanel) return;

        contentPanel.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando calificaciones...</p></div>';

        try {
            const response = await fetch(`${this.apiEndpoint}/students/${this.currentStudentId}/grades`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar calificaciones');
            }

            const data = await response.json();
            this.renderGrades(data.data, contentPanel);

        } catch (error) {
            console.error('Error loading grades:', error);
            contentPanel.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error al cargar calificaciones</div>';
        }
    }

    renderGrades(gradesData, container) {
        const grades = gradesData.grades || [];
        const summary = gradesData.summary || {};

        let html = `
            <div class="card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Calificaciones</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-info mb-3">
                        <strong>Promedio General:</strong> ${summary.promedio_general || 'N/A'}
                        <span class="ms-3"><strong>Materias:</strong> ${summary.total_materias || grades.length}</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Materia</th>
                                    <th>Profesor</th>
                                    <th>Periodo</th>
                                    <th>Calificación</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        if (grades.length > 0) {
            grades.forEach(grade => {
                const gradeValue = grade.calificacion || grade.promedio || 0;
                const badgeClass = gradeValue >= 8 ? 'bg-success' : gradeValue >= 6 ? 'bg-warning' : 'bg-danger';
                html += `
                    <tr>
                        <td>${grade.materia || grade.nombre_materia || 'N/A'}</td>
                        <td>${grade.profesor || 'N/A'}</td>
                        <td>${grade.periodo || 'Actual'}</td>
                        <td><span class="badge ${badgeClass}">${gradeValue}</span></td>
                    </tr>
                `;
            });
        } else {
            html += '<tr><td colspan="4" class="text-center">No hay calificaciones registradas</td></tr>';
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = DOMPurify.sanitize(html);
    }

    async loadAttendanceFromAPI() {
        if (!this.currentStudentId) {
            this.showAlert('Seleccione un estudiante primero', 'warning');
            return;
        }

        const contentPanel = document.getElementById('studentContentPanel');
        if (!contentPanel) return;

        contentPanel.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando asistencia...</p></div>';

        try {
            const response = await fetch(`${this.apiEndpoint}/students/${this.currentStudentId}/attendance`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar asistencia');
            }

            const data = await response.json();
            this.renderAttendance(data.data, contentPanel);

        } catch (error) {
            console.error('Error loading attendance:', error);
            contentPanel.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Error al cargar asistencia</div>';
        }
    }

    renderAttendance(attendanceData, container) {
        const attendance = attendanceData.attendance || [];
        const stats = attendanceData.stats_monthly || {};

        let html = `
            <div class="card">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0"><i class="fas fa-calendar-check me-2"></i>Asistencia</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-3 text-center">
                            <div class="h4 text-success">${stats.asistencias || 0}</div>
                            <small>Asistencias</small>
                        </div>
                        <div class="col-3 text-center">
                            <div class="h4 text-danger">${stats.faltas || 0}</div>
                            <small>Faltas</small>
                        </div>
                        <div class="col-3 text-center">
                            <div class="h4 text-warning">${stats.retardos || 0}</div>
                            <small>Retardos</small>
                        </div>
                        <div class="col-3 text-center">
                            <div class="h4 text-info">${stats.justificadas || 0}</div>
                            <small>Justificadas</small>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-sm">
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

        if (attendance.length > 0) {
            attendance.slice(0, 20).forEach(record => {
                const statusClass = record.tipo === 'asistencia' ? 'text-success' :
                    record.tipo === 'falta' ? 'text-danger' : 'text-warning';
                const fecha = new Date(record.fecha).toLocaleDateString('es-MX');
                html += `
                    <tr>
                        <td>${fecha}</td>
                        <td class="${statusClass}"><strong>${record.tipo || 'N/A'}</strong></td>
                        <td>${record.materia || 'General'}</td>
                        <td>${record.justificada ? '<i class="fas fa-check text-success"></i>' : '-'}</td>
                    </tr>
                `;
            });
        } else {
            html += '<tr><td colspan="4" class="text-center">No hay registros de asistencia</td></tr>';
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = DOMPurify.sanitize(html);
    }

    getGradeColor(grade) {
        if (grade >= 9) return 'success';
        if (grade >= 8) return 'primary';
        if (grade >= 7) return 'warning';
        return 'danger';
    }

    getEventIcon(type) {
        const icons = {
            'exam': 'fas fa-clipboard-check',
            'assignment': 'fas fa-tasks',
            'meeting': 'fas fa-users',
            'event': 'fas fa-star'
        };
        return icons[type] || 'fas fa-calendar';
    }

    getEventColor(type) {
        const colors = {
            'exam': 'warning',
            'assignment': 'info',
            'meeting': 'primary',
            'event': 'success'
        };
        return colors[type] || 'secondary';
    }

    getPriorityColor(priority) {
        const colors = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'info'
        };
        return colors[priority] || 'secondary';
    }

    processPasswordRecovery() {
        const email = document.getElementById('recoveryEmail').value;
        const studentId = document.getElementById('recoveryStudentId').value;

        if (!email || !studentId) {
            this.showAlert('Por favor completa todos los campos', 'error');
            return;
        }

        // Simular envío de recuperación
        this.showAlert('Enviando instrucciones...', 'info');

        setTimeout(() => {
            this.showAlert('Se han enviado las instrucciones de recuperación a tu correo electrónico', 'success');
            bootstrap.Modal.getInstance(document.getElementById('passwordRecoveryModal')).hide();
            document.getElementById('recoveryForm').reset();
        }, 2000);
    }

    parentLogout() {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            this.clearSession();
            this.studentData = null;
            this.students = [];
            this.currentStudentId = null;

            // Mostrar sección de login y ocultar dashboard
            const loginSection = document.getElementById('loginSection');
            const dashboard = document.getElementById('parentDashboard');

            if (loginSection) loginSection.classList.remove('d-none');
            if (dashboard) dashboard.classList.add('d-none');

            // Limpiar formulario
            const loginForm = document.getElementById('parentLoginForm');
            if (loginForm) loginForm.reset();

            this.showAlert('Sesión cerrada exitosamente', 'info');
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = sanitizeHTML(`
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Funciones globales para la interfaz
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

function showPasswordRecovery() {
    const modal = new bootstrap.Modal(document.getElementById('passwordRecoveryModal'));
    modal.show();
}

function showRegistrationHelp() {
    const modal = new bootstrap.Modal(document.getElementById('registrationHelpModal'));
    modal.show();
}

// Funciones del dashboard
function showGrades() {
    if (!window.parentPortal || !window.parentPortal.isLoggedIn) return;

    const studentData = window.parentPortal.studentData;
    let gradesHTML = '<div class="grades-detail">';

    studentData.subjects.forEach(subject => {
        const subjectAverage = subject.average;
        const averageColor = window.parentPortal.getGradeColor(subjectAverage);

        gradesHTML += `
            <div class="card mb-3">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${subject.name}</h6>
                    <span class="badge bg-${averageColor} fs-6">Promedio: ${subjectAverage}</span>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Evaluación</th>
                                    <th>Calificación</th>
                                    <th>Peso</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        subject.grades.forEach(grade => {
            const gradeColor = window.parentPortal.getGradeColor(grade.grade);
            const formattedDate = new Date(grade.date).toLocaleDateString('es-ES');

            gradesHTML += `
                <tr>
                    <td>${grade.type}</td>
                    <td><span class="badge bg-${gradeColor}">${grade.grade}</span></td>
                    <td>${grade.weight}%</td>
                    <td><small class="text-muted">${formattedDate}</small></td>
                </tr>
            `;
        });

        gradesHTML += `
                            </tbody>
                        </table>
                    </div>
                    <small class="text-muted">Docente: ${subject.teacher} | Asistencia: ${subject.attendance}%</small>
                </div>
            </div>
        `;
    });

    gradesHTML += '</div>';

    document.getElementById('mainPanel').innerHTML = sanitizeHTML(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-chart-line text-primary me-2"></i>Calificaciones Detalladas</h4>
            <button class="btn btn-outline-secondary" data-action="load-main-dashboard">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        ${gradesHTML}
    `, 'ugc');
}

function showAttendance() {
    if (!window.parentPortal || !window.parentPortal.isLoggedIn) return;

    const studentData = window.parentPortal.studentData;
    let attendanceHTML = '<div class="attendance-detail">';

    attendanceHTML += `
        <div class="row mb-4">
            <div class="col-md-4 text-center">
                <div class="card">
                    <div class="card-body">
                        <div class="h2 text-success">${studentData.attendance}%</div>
                        <p class="text-muted">Asistencia General</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-center">
                <div class="card">
                    <div class="card-body">
                        <div class="h2 text-info">2</div>
                        <p class="text-muted">Faltas Justificadas</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4 text-center">
                <div class="card">
                    <div class="card-body">
                        <div class="h2 text-warning">1</div>
                        <p class="text-muted">Retardos</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    studentData.subjects.forEach(subject => {
        const attendancePercentage = subject.attendance;
        const attendanceColor = attendancePercentage >= 95 ? 'success' : attendancePercentage >= 90 ? 'warning' : 'danger';

        attendanceHTML += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6 class="mb-1">${subject.name}</h6>
                            <small class="text-muted">${subject.teacher}</small>
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="progress" style="height: 20px;">
                                <div class="progress-bar bg-${attendanceColor}" role="progressbar" 
                                     style="width: ${attendancePercentage}%" 
                                     aria-valuenow="${attendancePercentage}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                    ${attendancePercentage}%
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 text-end">
                            <span class="badge bg-${attendanceColor} fs-6">${attendancePercentage}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    attendanceHTML += '</div>';

    document.getElementById('mainPanel').innerHTML = sanitizeHTML(`
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-calendar-check text-success me-2"></i>Control de Asistencias</h4>
            <button class="btn btn-outline-secondary" data-action="load-main-dashboard">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        ${attendanceHTML}
    `, 'ugc');
}

function showCommunication() {
    const communicationHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-comments text-info me-2"></i>Centro de Comunicación</h4>
            <button class="btn btn-outline-secondary" data-action="load-main-dashboard">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        
        <div class="row">
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="fas fa-users me-2"></i>Contactos</h6>
                    </div>
                    <div class="list-group list-group-flush">
                        <div class="list-group-item">
                            <div class="fw-bold">Prof. María Rodríguez</div>
                            <small class="text-muted">Tutor de Grupo</small>
                        </div>
                        <div class="list-group-item">
                            <div class="fw-bold">Prof. Carlos Hernández</div>
                            <small class="text-muted">Matemáticas V</small>
                        </div>
                        <div class="list-group-item">
                            <div class="fw-bold">Prof. Laura Martínez</div>
                            <small class="text-muted">Física V</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h6><i class="fas fa-envelope me-2"></i>Mensajes</h6>
                        <button class="btn btn-primary btn-sm">
                            <i class="fas fa-plus me-2"></i>Nuevo Mensaje
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="message-item p-3 mb-3 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>Prof. María Rodríguez</strong>
                                    <p class="mb-1">Estimado padre de familia, me da mucho gusto informarle que Ana ha mostrado un excelente progreso en sus estudios...</p>
                                </div>
                                <small class="text-muted">15 sep</small>
                            </div>
                        </div>
                        <div class="message-item p-3 mb-3 bg-light rounded">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <strong>Prof. Carlos Hernández</strong>
                                    <p class="mb-1">Recordatorio: El examen de Matemáticas V será el próximo viernes 20 de septiembre...</p>
                                </div>
                                <small class="text-muted">14 sep</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainPanel').innerHTML = sanitizeHTML(communicationHTML, 'ugc');
}

function showSchedule() {
    const scheduleHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-clock text-warning me-2"></i>Horarios y Calendario</h4>
            <button class="btn btn-outline-secondary" data-action="load-main-dashboard">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        
        <div class="row">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">
                        <h6><i class="fas fa-calendar-week me-2"></i>Horario de Clases - 5° Semestre Grupo A</h6>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered text-center">
                                <thead class="table-primary">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Lunes</th>
                                        <th>Martes</th>
                                        <th>Miércoles</th>
                                        <th>Jueves</th>
                                        <th>Viernes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="fw-bold">7:00-7:50</td>
                                        <td class="bg-light">Matemáticas V</td>
                                        <td class="bg-light">Física V</td>
                                        <td class="bg-light">Química V</td>
                                        <td class="bg-light">Literatura</td>
                                        <td class="bg-light">Historia</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">7:50-8:40</td>
                                        <td class="bg-light">Matemáticas V</td>
                                        <td class="bg-light">Física V</td>
                                        <td class="bg-light">Química V</td>
                                        <td class="bg-light">Literatura</td>
                                        <td class="bg-light">Historia</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">8:40-9:30</td>
                                        <td class="bg-info text-white">Laboratorio Química</td>
                                        <td class="bg-light">Inglés V</td>
                                        <td class="bg-light">Matemáticas V</td>
                                        <td class="bg-info text-white">Lab. Física</td>
                                        <td class="bg-light">Educación Física</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">9:30-10:20</td>
                                        <td class="bg-warning">RECESO</td>
                                        <td class="bg-warning">RECESO</td>
                                        <td class="bg-warning">RECESO</td>
                                        <td class="bg-warning">RECESO</td>
                                        <td class="bg-warning">RECESO</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">10:20-11:10</td>
                                        <td class="bg-light">Orientación</td>
                                        <td class="bg-light">Metodología</td>
                                        <td class="bg-light">Inglés V</td>
                                        <td class="bg-light">Informática</td>
                                        <td class="bg-light">Filosofía</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">11:10-12:00</td>
                                        <td class="bg-light">Actividades</td>
                                        <td class="bg-light">Metodología</td>
                                        <td class="bg-light">Inglés V</td>
                                        <td class="bg-light">Informática</td>
                                        <td class="bg-light">Filosofía</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card mb-3">
                    <div class="card-header">
                        <h6><i class="fas fa-info-circle me-2"></i>Información del Horario</h6>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li><strong>Turno:</strong> Matutino</li>
                            <li><strong>Horario:</strong> 7:00 AM - 12:00 PM</li>
                            <li><strong>Receso:</strong> 9:30 - 10:20 AM</li>
                            <li><strong>Total de materias:</strong> 10</li>
                        </ul>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h6><i class="fas fa-calendar-day me-2"></i>Próximas Actividades</h6>
                    </div>
                    <div class="card-body">
                        <div class="activity-item mb-2">
                            <div class="fw-bold">Examen Matemáticas</div>
                            <small class="text-muted">Viernes 20 Sep - 7:00 AM</small>
                        </div>
                        <div class="activity-item mb-2">
                            <div class="fw-bold">Práctica de Laboratorio</div>
                            <small class="text-muted">Lunes 23 Sep - 8:40 AM</small>
                        </div>
                        <div class="activity-item">
                            <div class="fw-bold">Junta de Padres</div>
                            <small class="text-muted">Miércoles 25 Sep - 6:00 PM</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('mainPanel').innerHTML = sanitizeHTML(scheduleHTML, 'ugc');
}

function loadMainDashboard() {
    if (!window.parentPortal || !window.parentPortal.isLoggedIn) return;

    // Restaurar el dashboard principal
    window.parentPortal.loadDashboard();
}

function downloadReport() {
    if (!window.parentPortal || !window.parentPortal.isLoggedIn) return;

    window.parentPortal.showAlert('Generando reporte académico...', 'info');

    setTimeout(() => {
        window.parentPortal.showAlert('Reporte descargado exitosamente', 'success');

        // Simular descarga
        const link = document.createElement('a');
        link.href = '#';
        link.download = `Reporte_Academico_${window.parentPortal.studentData.name.replace(/\s+/g, '_')}.pdf`;
        link.click();
    }, 2000);
}

function scheduleAppointment() {
    window.parentPortal.showAlert('Redirigiendo al sistema de citas...', 'info');
    setTimeout(() => {
        window.open('citas.html', '_blank');
    }, 1000);
}

function contactTeacher() {
    window.parentPortal.showAlert('Funcionalidad de mensajería próximamente disponible', 'info');
}

// Estilos CSS adicionales
const parentPortalStyles = `
<style>
.quick-action-btn {
    transition: all 0.3s ease;
    height: 120px;
}

.quick-action-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.student-info-header {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 2rem;
    border-radius: 0.5rem;
    border-left: 5px solid #28a745;
}

.student-avatar {
    flex-shrink: 0;
}

.academic-stat .stat-circle {
    width: 80px;
    height: 80px;
}

.feature-card {
    transition: all 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.login-container .card {
    backdrop-filter: blur(10px);
}

.message-item {
    transition: all 0.2s ease;
}

.message-item:hover {
    background-color: #e9ecef !important;
}

.activity-item {
    padding: 0.5rem;
    border-left: 3px solid #dee2e6;
    margin-left: 0.5rem;
}

.grades-detail .card,
.attendance-detail .card {
    border-left: 4px solid #007bff;
}

@media (max-width: 768px) {
    .student-info-header {
        padding: 1rem;
    }
    
    .student-info-header .row {
        flex-direction: column;
        text-align: center;
    }
    
    .quick-action-btn {
        height: 100px;
        margin-bottom: 1rem;
    }
    
    .academic-stat .stat-circle {
        width: 60px;
        height: 60px;
    }
}

.dark-mode .student-info-header {
    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
    color: #f9fafb;
}

.dark-mode .message-item {
    background-color: #374151 !important;
    color: #f9fafb;
}

.dark-mode .activity-item {
    border-left-color: #6b7280;
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(parentPortalStyles)));

// Inicializar el portal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('parentLoginForm')) {
        window.parentPortal = new ParentPortal();
    }
});