// Portal de Padres - BGE Héroes de la Patria
class ParentPortal {
    constructor() {
        this.currentSession = null;
        this.studentData = null;
        this.isLoggedIn = false;
        
        this.initializePortal();
    }

    initializePortal() {
        this.checkExistingSession();
        this.setupEventListeners();
        this.loadSampleData();
    }

    checkExistingSession() {
        const savedSession = localStorage.getItem('parent_session');
        if (savedSession) {
            try {
                this.currentSession = JSON.parse(savedSession);
                // Verificar si la sesión no ha expirado (24 horas)
                const sessionTime = new Date(this.currentSession.loginTime);
                const now = new Date();
                const hoursDiff = (now - sessionTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 24) {
                    this.loginSuccess(this.currentSession.studentData);
                } else {
                    localStorage.removeItem('parent_session');
                }
            } catch (error) {
                localStorage.removeItem('parent_session');
            }
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

    loadSampleData() {
        // Datos de muestra para demostración
        this.sampleStudentData = {
            id: 'BGE-2024-156',
            name: 'Ana García Mendoza',
            grade: '5° Semestre',
            group: 'A',
            shift: 'Matutino',
            tutor: 'Prof. María Rodríguez',
            currentAverage: 8.7,
            attendance: 95,
            pendingTasks: 3,
            subjects: [
                {
                    id: 'mat5',
                    name: 'Matemáticas V',
                    teacher: 'Prof. Carlos Hernández',
                    grades: [
                        { type: 'Examen', grade: 9.2, date: '2024-09-15', weight: 40 },
                        { type: 'Proyecto', grade: 8.5, date: '2024-09-10', weight: 30 },
                        { type: 'Participación', grade: 8.8, date: '2024-09-05', weight: 20 },
                        { type: 'Tareas', grade: 9.0, date: '2024-09-01', weight: 10 }
                    ],
                    average: 8.9,
                    attendance: 96
                },
                {
                    id: 'fis5',
                    name: 'Física V',
                    teacher: 'Prof. Laura Martínez',
                    grades: [
                        { type: 'Laboratorio', grade: 8.7, date: '2024-09-12', weight: 35 },
                        { type: 'Examen', grade: 8.3, date: '2024-09-08', weight: 40 },
                        { type: 'Investigación', grade: 9.1, date: '2024-09-03', weight: 25 }
                    ],
                    average: 8.6,
                    attendance: 94
                },
                {
                    id: 'qui5',
                    name: 'Química V',
                    teacher: 'Prof. Roberto Sánchez',
                    grades: [
                        { type: 'Práctica', grade: 8.9, date: '2024-09-14', weight: 30 },
                        { type: 'Examen', grade: 8.1, date: '2024-09-09', weight: 45 },
                        { type: 'Reporte', grade: 8.6, date: '2024-09-04', weight: 25 }
                    ],
                    average: 8.4,
                    attendance: 97
                },
                {
                    id: 'lit5',
                    name: 'Literatura Universal',
                    teacher: 'Prof. Ana Jiménez',
                    grades: [
                        { type: 'Ensayo', grade: 9.3, date: '2024-09-13', weight: 40 },
                        { type: 'Exposición', grade: 8.8, date: '2024-09-07', weight: 30 },
                        { type: 'Análisis', grade: 9.0, date: '2024-09-02', weight: 30 }
                    ],
                    average: 9.1,
                    attendance: 98
                },
                {
                    id: 'his5',
                    name: 'Historia de México II',
                    teacher: 'Prof. Miguel Torres',
                    grades: [
                        { type: 'Examen', grade: 8.4, date: '2024-09-11', weight: 50 },
                        { type: 'Investigación', grade: 8.9, date: '2024-09-06', weight: 30 },
                        { type: 'Participación', grade: 8.7, date: '2024-09-01', weight: 20 }
                    ],
                    average: 8.6,
                    attendance: 93
                }
            ],
            upcomingEvents: [
                {
                    title: 'Examen de Matemáticas V',
                    date: '2024-09-20',
                    type: 'exam',
                    subject: 'Matemáticas V'
                },
                {
                    title: 'Entrega de Proyecto Física',
                    date: '2024-09-22',
                    type: 'assignment',
                    subject: 'Física V'
                },
                {
                    title: 'Junta de Padres de Familia',
                    date: '2024-09-25',
                    type: 'meeting',
                    subject: 'General'
                },
                {
                    title: 'Festival de Otoño',
                    date: '2024-09-28',
                    type: 'event',
                    subject: 'Actividades Culturales'
                }
            ],
            announcements: [
                {
                    title: 'Cambio de Horario Temporal',
                    content: 'Debido a trabajos de mantenimiento, las clases del turno matutino terminarán a las 1:00 PM esta semana.',
                    date: '2024-09-16',
                    priority: 'high',
                    type: 'schedule'
                },
                {
                    title: 'Periodo de Evaluaciones',
                    content: 'Las evaluaciones del segundo parcial se realizarán del 25 de noviembre al 29 de noviembre.',
                    date: '2024-09-15',
                    priority: 'medium',
                    type: 'academic'
                },
                {
                    title: 'Recordatorio: Pago de Colegiaturas',
                    content: 'Recuerda que el pago de colegiaturas vence el día 5 de cada mes.',
                    date: '2024-09-14',
                    priority: 'medium',
                    type: 'payment'
                }
            ]
        };
    }

    processLogin() {
        const email = document.getElementById('parentEmail').value;
        const studentId = document.getElementById('studentId').value;
        const password = document.getElementById('accessPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validación básica
        if (!email || !studentId || !password) {
            this.showAlert('Por favor completa todos los campos', 'error');
            return;
        }

        // Simular autenticación (en producción sería una llamada al servidor)
        this.showAlert('Verificando credenciales...', 'info');
        
        setTimeout(() => {
            if (this.authenticateParent(email, studentId, password)) {
                this.loginSuccess(this.sampleStudentData, rememberMe);
            } else {
                this.showAlert('Credenciales incorrectas. Verifica tus datos.', 'error');
            }
        }, 1500);
    }

    authenticateParent(email, studentId, password) {
        // Simulación de autenticación
        // En producción, esto sería una llamada segura al servidor
        
        // Credenciales de demostración
        const validCredentials = [
            {
                email: 'padre@ejemplo.com',
                studentId: 'BGE-2024-156',
                password: 'demo123'
            },
            {
                email: 'demo@padres.com',
                studentId: 'BGE-2024-001',
                password: 'padres2024'
            }
        ];

        return validCredentials.some(cred => 
            cred.email === email && 
            cred.studentId === studentId && 
            cred.password === password
        );
    }

    loginSuccess(studentData, rememberMe = false) {
        this.isLoggedIn = true;
        this.studentData = studentData;

        // Guardar sesión si se solicita
        if (rememberMe) {
            this.currentSession = {
                studentData: studentData,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('parent_session', JSON.stringify(this.currentSession));
        }

        // Ocultar sección de login y mostrar dashboard
        document.getElementById('loginSection').classList.add('d-none');
        document.getElementById('parentDashboard').classList.remove('d-none');

        // Cargar datos en el dashboard
        this.loadDashboard();
        this.showAlert('Bienvenido al Portal de Padres', 'success');
    }

    loadDashboard() {
        if (!this.studentData) return;

        // Actualizar información del estudiante
        document.getElementById('studentName').textContent = this.studentData.name;
        document.getElementById('displayStudentId').textContent = this.studentData.id;
        document.getElementById('studentGrade').textContent = this.studentData.grade;
        document.getElementById('studentGroup').textContent = this.studentData.group;
        document.getElementById('tutorName').textContent = this.studentData.tutor;
        document.getElementById('studentShift').textContent = this.studentData.shift;
        document.getElementById('currentAverage').textContent = this.studentData.currentAverage;

        // Cargar calificaciones recientes
        this.loadRecentGrades();
        
        // Cargar eventos próximos
        this.loadUpcomingEvents();
        
        // Cargar comunicados
        this.loadAnnouncements();
    }

    loadRecentGrades() {
        const container = document.getElementById('recentGrades');
        if (!container || !this.studentData.subjects) return;

        let recentGrades = [];
        
        // Obtener las calificaciones más recientes de todas las materias
        this.studentData.subjects.forEach(subject => {
            if (subject.grades && subject.grades.length > 0) {
                const latestGrade = subject.grades.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                recentGrades.push({
                    ...latestGrade,
                    subject: subject.name
                });
            }
        });

        // Ordenar por fecha descendente
        recentGrades = recentGrades.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

        const html = recentGrades.map(grade => {
            const gradeColor = this.getGradeColor(grade.grade);
            const formattedDate = new Date(grade.date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });

            return `
                <tr>
                    <td><strong>${grade.subject}</strong></td>
                    <td>${grade.type}</td>
                    <td class="text-center">
                        <span class="badge bg-${gradeColor} fs-6">${grade.grade}</span>
                    </td>
                    <td><small class="text-muted">${formattedDate}</small></td>
                </tr>
            `;
        }).join('');

        container.innerHTML = html;
    }

    loadUpcomingEvents() {
        const container = document.getElementById('upcomingEvents');
        if (!container || !this.studentData.upcomingEvents) return;

        const html = this.studentData.upcomingEvents.map(event => {
            const eventDate = new Date(event.date);
            const formattedDate = eventDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });

            const iconClass = this.getEventIcon(event.type);
            const colorClass = this.getEventColor(event.type);

            return `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">
                                <i class="${iconClass} text-${colorClass} me-2"></i>
                                ${event.title}
                            </div>
                            <small class="text-muted">${event.subject}</small>
                        </div>
                        <small class="text-${colorClass} fw-bold">${formattedDate}</small>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    loadAnnouncements() {
        const container = document.getElementById('announcements');
        if (!container || !this.studentData.announcements) return;

        const html = this.studentData.announcements.map(announcement => {
            const announcementDate = new Date(announcement.date);
            const formattedDate = announcementDate.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });

            const priorityColor = this.getPriorityColor(announcement.priority);

            return `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">${announcement.title}</div>
                            <p class="mb-1 small">${announcement.content}</p>
                        </div>
                        <span class="badge bg-${priorityColor} rounded-pill">${formattedDate}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
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
            this.isLoggedIn = false;
            this.studentData = null;
            this.currentSession = null;
            
            localStorage.removeItem('parent_session');
            
            // Mostrar sección de login y ocultar dashboard
            document.getElementById('loginSection').classList.remove('d-none');
            document.getElementById('parentDashboard').classList.add('d-none');
            
            // Limpiar formulario
            document.getElementById('parentLoginForm').reset();
            
            this.showAlert('Sesión cerrada exitosamente', 'info');
        }
    }

    showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
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
    
    document.getElementById('mainPanel').innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-chart-line text-primary me-2"></i>Calificaciones Detalladas</h4>
            <button class="btn btn-outline-secondary" onclick="loadMainDashboard()">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        ${gradesHTML}
    `;
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
    
    document.getElementById('mainPanel').innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-calendar-check text-success me-2"></i>Control de Asistencias</h4>
            <button class="btn btn-outline-secondary" onclick="loadMainDashboard()">
                <i class="fas fa-arrow-left me-2"></i>Regresar
            </button>
        </div>
        ${attendanceHTML}
    `;
}

function showCommunication() {
    const communicationHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-comments text-info me-2"></i>Centro de Comunicación</h4>
            <button class="btn btn-outline-secondary" onclick="loadMainDashboard()">
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
    
    document.getElementById('mainPanel').innerHTML = communicationHTML;
}

function showSchedule() {
    const scheduleHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h4><i class="fas fa-clock text-warning me-2"></i>Horarios y Calendario</h4>
            <button class="btn btn-outline-secondary" onclick="loadMainDashboard()">
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
    
    document.getElementById('mainPanel').innerHTML = scheduleHTML;
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
document.head.insertAdjacentHTML('beforeend', parentPortalStyles);

// Inicializar el portal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('parentLoginForm')) {
        window.parentPortal = new ParentPortal();
    }
});