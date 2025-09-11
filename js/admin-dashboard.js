// Dashboard Administrativo Integrado con API
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.academicChart = null;
        this.dashboardData = {};
        this.refreshInterval = null;
        
        this.init();
    }

    async init() {
        // Verificar si hay usuario autenticado
        await this.checkAuthentication();
        
        // Configurar interfaz inicial
        this.setupInterface();
        
        // Si está autenticado y es admin, cargar dashboard
        if (this.isLoggedIn && this.isAdmin()) {
            await this.loadDashboardData();
            this.showDashboard();
            this.displayPendingRegistrations();
            this.startAutoRefresh();
        } else {
            this.showLoginPrompt();
        }
    }

    async checkAuthentication() {
        if (window.authInterface && window.authInterface.isAuthenticated()) {
            this.currentUser = window.authInterface.getCurrentUser();
            this.isLoggedIn = true;
            console.log('👤 Usuario detectado:', this.currentUser);
        }
    }

    isAdmin() {
        return this.currentUser && 
               ['administrativo', 'directivo'].includes(this.currentUser.tipo_usuario);
    }

    // ============================================
    // CARGA DE DATOS DESDE API
    // ============================================

    async loadDashboardData() {
        try {
            console.log('📊 Cargando datos del dashboard...');
            
            // Cargar solicitudes de registro pendientes
            await this.loadPendingRegistrations();
            
            // Cargar datos principales en paralelo
            const [analytics, students, teachers] = await Promise.all([
                this.loadAnalytics(),
                this.loadStudentsData(),
                this.loadTeachersData()
            ]);

            this.dashboardData = {
                analytics: analytics,
                students: students,
                teachers: teachers,
                lastUpdate: new Date().toISOString()
            };

            console.log('✅ Datos del dashboard cargados:', this.dashboardData);

        } catch (error) {
            console.error('❌ Error cargando dashboard:', error);
            this.showErrorState();
        }
    }

    async loadAnalytics() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/analytics/dashboard');
            
            if (response.success) {
                return response.data;
            }
            
            throw new Error('Error en respuesta de analytics');
        } catch (error) {
            console.warn('📊 Analytics API no disponible, usando datos demo');
            return this.getDemoAnalytics();
        }
    }

    async loadStudentsData() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/students?limit=10');
            
            if (response.success) {
                return response.data;
            }
            
            throw new Error('Error en respuesta de estudiantes');
        } catch (error) {
            console.warn('👥 Students API no disponible, usando datos demo');
            return this.getDemoStudents();
        }
    }

    async loadTeachersData() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/teachers?limit=10');
            
            if (response.success) {
                return response.data;
            }
            
            throw new Error('Error en respuesta de docentes');
        } catch (error) {
            console.warn('👨‍🏫 Teachers API no disponible, usando datos demo');
            return this.getDemoTeachers();
        }
    }

    // ============================================
    // DATOS DEMO DE RESPALDO
    // ============================================

    getDemoAnalytics() {
        return {
            students: {
                total_estudiantes: 1247,
                estudiantes_activos: 1180,
                egresados: 67,
                suspendidos: 0,
                especialidades_activas: 3
            },
            teachers: {
                total_docentes: 68,
                docentes_base: 45,
                docentes_contrato: 18,
                docentes_honorarios: 5,
                promedio_experiencia: 8.5
            },
            academic: {
                materias_activas: 42,
                cursos_disponibles: 18,
                inscripciones_totales: 8546,
                promedio_general: 8.4
            },
            chatbot: {
                total_mensajes: 3245,
                conversaciones_unicas: 876,
                satisfaccion_promedio: 4.3,
                mensajes_semana: 245
            }
        };
    }

    getDemoStudents() {
                totalTeachers: 68,
                totalSubjects: 42,
                generalAverage: 8.4
            },
            students: [
                {
                    id: '20230001',
                    name: 'Ana María González Pérez',
                    semester: '3°',
                    average: 8.5,
                    status: 'Activo',
                    riskLevel: 'Bajo'
                },
                {
                    id: '20230002',
                    name: 'Carlos Eduardo Martínez López',
                    semester: '5°',
                    average: 7.2,
                    status: 'Activo',
                    riskLevel: 'Medio'
                },
                {
                    id: '20230003',
                    name: 'María José Hernández García',
                    semester: '1°',
                    average: 9.1,
                    status: 'Activo',
                    riskLevel: 'Bajo'
                },
                {
                    id: '20230004',
                    name: 'Diego Alejandro Ramírez Torres',
                    semester: '3°',
                    average: 5.8,
                    status: 'En Riesgo',
                    riskLevel: 'Alto'
                },
                {
                    id: '20230005',
                    name: 'Fernanda Isabel Morales Cruz',
                    semester: '5°',
                    average: 8.9,
                    status: 'Activo',
                    riskLevel: 'Bajo'
                }
            ],
            teachers: [
                {
                    id: 'DOC001',
                    name: 'Lic. Roberto Mendoza',
                    specialty: 'Matemáticas',
                    subjects: ['Matemáticas I', 'Matemáticas III', 'Cálculo'],
                    workload: 25,
                    status: 'Activo'
                },
                {
                    id: 'DOC002',
                    name: 'Ing. María Elena Torres',
                    specialty: 'Física',
                    subjects: ['Física I', 'Física III'],
                    workload: 20,
                    status: 'Activo'
                },
                {
                    id: 'DOC003',
                    name: 'Q.F.B. Ana Luisa Ramírez',
                    specialty: 'Química',
                    subjects: ['Química I', 'Química III', 'Bioquímica'],
                    workload: 22,
                    status: 'Activo'
                },
                {
                    id: 'DOC004',
                    name: 'Lic. Patricia Morales',
                    specialty: 'Español',
                    subjects: ['Español I', 'Español III', 'Literatura'],
                    workload: 18,
                    status: 'Activo'
                }
            ],
            finances: {
                monthlyIncome: 2847500,
                pendingPayments: 157500,
                collectionRate: 94.5
            }
        };

        this.initializeSystem();
    }

    initializeSystem() {
        // Verificar si hay una sesión activa
        const savedSession = localStorage.getItem('adminSession');
        if (savedSession) {
            this.currentSession = JSON.parse(savedSession);
            if (this.currentSession.expires > Date.now()) {
                this.isLoggedIn = true;
                this.showAdminPanel();
            } else {
                localStorage.removeItem('adminSession');
            }
        }
    }

    loginAdmin() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const role = document.getElementById('adminRole').value;

        if (username === this.adminCredentials.username && 
            password === this.adminCredentials.password && 
            role === this.adminCredentials.role) {
            
            // Crear sesión
            this.currentSession = {
                username: username,
                role: role,
                name: this.adminCredentials.name,
                loginTime: Date.now(),
                expires: Date.now() + (8 * 60 * 60 * 1000) // 8 horas
            };

            localStorage.setItem('adminSession', JSON.stringify(this.currentSession));
            this.isLoggedIn = true;

            // Cerrar modal y mostrar panel
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            loginModal.hide();

            this.showAdminPanel();
            this.showSuccessToast('Acceso administrativo exitoso');
        } else {
            this.showErrorToast('Credenciales administrativas incorrectas');
        }
    }

    logoutAdmin() {
        localStorage.removeItem('adminSession');
        this.currentSession = null;
        this.isLoggedIn = false;
        this.hideAdminPanel();
        this.destroyCharts();
        this.showSuccessToast('Sesión administrativa cerrada');
    }

    showAdminPanel() {
        // Ocultar hero section (CORRECTO - debe mantenerse oculto)
        document.getElementById('hero').style.display = 'none';
        
        // Agregar padding-top al body para compensar el navbar fixed
        document.body.style.paddingTop = '90px';
        document.body.style.transition = 'padding-top 0.3s ease';
        
        // Mostrar panel administrativo
        const adminPanel = document.getElementById('adminPanel');
        adminPanel.classList.remove('d-none');
        
        // Configurar información del usuario
        this.setupAdminInfo();
        
        // Cargar datos
        this.loadDashboardData();
        
        // Crear gráficos
        this.createAcademicChart();
        
        // Scroll suave al panel administrativo después de un delay
        setTimeout(() => {
            // Scroll a la primera sección visible, no al panel admin
            const firstVisibleSection = document.querySelector('section:not(#hero)');
            if (firstVisibleSection) {
                const sectionTop = firstVisibleSection.offsetTop - 100; // 100px de margen para el navbar
                window.scrollTo({ 
                    top: Math.max(0, sectionTop), 
                    behavior: 'smooth' 
                });
            }
        }, 400);
    }

    hideAdminPanel() {
        // Mostrar hero section (CORRECTO - debe mostrarse al cerrar sesión)
        const heroSection = document.getElementById('hero');
        heroSection.style.display = '';  // Remover display inline
        heroSection.style.visibility = 'visible';
        heroSection.style.opacity = '1';
        
        // Remover padding-top del body
        document.body.style.paddingTop = '';
        document.body.style.transition = '';
        
        // Ocultar panel administrativo
        document.getElementById('adminPanel').classList.add('d-none');
        
        // Scroll al inicio con un pequeño delay para asegurar que el hero sea visible
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
    }

    setupAdminInfo() {
        document.getElementById('adminName').textContent = this.currentSession.name;
        document.getElementById('adminRole').textContent = this.capitalizeRole(this.currentSession.role);
    }

    capitalizeRole(role) {
        const roles = {
            'director': 'Director',
            'subdirector': 'Subdirector',
            'coordinador': 'Coordinador Académico',
            'secretaria': 'Secretaria Académica'
        };
        return roles[role] || role;
    }

    loadDashboardData() {
        // Cargar estadísticas generales
        const stats = this.dashboardData.statistics;
        document.getElementById('totalStudents').textContent = stats.totalStudents.toLocaleString();
        document.getElementById('totalTeachers').textContent = stats.totalTeachers;
        document.getElementById('totalSubjects').textContent = stats.totalSubjects;
        document.getElementById('generalAverage').textContent = stats.generalAverage;

        // Cargar tablas
        this.loadStudentsTable();
        this.loadTeachersTable();
    }

    loadStudentsTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.dashboardData.students.forEach(student => {
            const row = document.createElement('tr');
            
            const statusBadge = this.getStudentStatusBadge(student.status);
            const riskBadge = this.getRiskLevelBadge(student.riskLevel);
            
            row.innerHTML = `
                <td><strong>${student.id}</strong></td>
                <td>${student.name}</td>
                <td class="text-center">
                    <span class="badge bg-info">${student.semester}</span>
                </td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(student.average)}">
                        ${student.average}
                    </span>
                </td>
                <td class="text-center">
                    ${statusBadge}
                    ${riskBadge}
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="viewStudent('${student.id}')" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="editStudent('${student.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="contactStudent('${student.id}')" title="Contactar">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    loadTeachersTable() {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.dashboardData.teachers.forEach(teacher => {
            const row = document.createElement('tr');
            
            const statusBadge = teacher.status === 'Activo' ? 
                '<span class="badge bg-success">Activo</span>' : 
                '<span class="badge bg-secondary">Inactivo</span>';
            
            row.innerHTML = `
                <td><strong>${teacher.name}</strong></td>
                <td>${teacher.specialty}</td>
                <td>
                    <small>${teacher.subjects.join(', ')}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${teacher.workload}h</span>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="viewTeacher('${teacher.id}')" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="editTeacher('${teacher.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="assignSubjects('${teacher.id}')" title="Asignar Materias">
                            <i class="fas fa-book"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    getStudentStatusBadge(status) {
        switch (status) {
            case 'Activo':
                return '<span class="badge bg-success">Activo</span>';
            case 'En Riesgo':
                return '<span class="badge bg-danger">En Riesgo</span>';
            case 'Suspendido':
                return '<span class="badge bg-warning">Suspendido</span>';
            default:
                return '<span class="badge bg-secondary">Inactivo</span>';
        }
    }

    getRiskLevelBadge(riskLevel) {
        switch (riskLevel) {
            case 'Alto':
                return '<span class="badge bg-danger ms-1">Alto Riesgo</span>';
            case 'Medio':
                return '<span class="badge bg-warning ms-1">Riesgo Medio</span>';
            case 'Bajo':
                return '<span class="badge bg-success ms-1">Bajo Riesgo</span>';
            default:
                return '';
        }
    }

    getGradeColorClass(grade) {
        if (grade >= 9) return 'bg-success';
        if (grade >= 8) return 'bg-primary';
        if (grade >= 7) return 'bg-info';
        if (grade >= 6) return 'bg-warning';
        return 'bg-danger';
    }

    createAcademicChart() {
        const ctx = document.getElementById('academicChart');
        if (!ctx) return;

        // Verificar que Chart.js esté disponible
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js no está disponible, ocultando gráfico');
            ctx.parentElement.innerHTML = '<p class="text-muted text-center">Gráfico no disponible</p>';
            return;
        }

        this.destroyCharts();

        // Datos simulados de evolución académica
        const months = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
        const firstSemesterData = [8.2, 8.4, 8.6, 8.5, 8.7, 8.7];
        const thirdSemesterData = [7.8, 8.0, 8.2, 8.3, 8.4, 8.4];
        const fifthSemesterData = [7.9, 8.1, 8.0, 8.2, 8.3, 8.2];

        this.academicChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: '1° Semestre',
                        data: firstSemesterData,
                        borderColor: '#198754',
                        backgroundColor: '#19875420',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: '3° Semestre',
                        data: thirdSemesterData,
                        borderColor: '#0d6efd',
                        backgroundColor: '#0d6efd20',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: '5° Semestre',
                        data: fifthSemesterData,
                        borderColor: '#0dcaf0',
                        backgroundColor: '#0dcaf020',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 6,
                        max: 10,
                        ticks: {
                            stepSize: 0.5
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    destroyCharts() {
        if (this.academicChart) {
            this.academicChart.destroy();
            this.academicChart = null;
        }
    }

    // ============================================
    // GESTIÓN DE SOLICITUDES DE REGISTRO
    // ============================================

    async loadPendingRegistrations() {
        try {
            // Intentar cargar desde API primero
            if (window.apiClient) {
                const response = await window.apiClient.request('/admin/pending-registrations');
                if (response.success) {
                    this.dashboardData.pendingRegistrations = response.data;
                    return;
                }
            }

            // Fallback: cargar desde localStorage
            const localRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
            this.dashboardData.pendingRegistrations = localRegistrations;
            
            console.log(`📋 ${localRegistrations.length} solicitudes pendientes encontradas`);
        } catch (error) {
            console.warn('⚠️ Error cargando solicitudes:', error);
            this.dashboardData.pendingRegistrations = [];
        }
    }

    displayPendingRegistrations() {
        const container = document.getElementById('pending-registrations-container');
        if (!container) return;

        const registrations = this.dashboardData.pendingRegistrations || [];
        
        if (registrations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay solicitudes pendientes</p>
                </div>
            `;
            return;
        }

        const html = registrations.map(registration => `
            <div class="card mb-3" data-registration-id="${registration.email}">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-user me-2"></i>
                        ${registration.nombre} ${registration.apellido_paterno}
                    </h6>
                    <span class="badge bg-warning">Pendiente</span>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Email:</strong> ${registration.email}</p>
                            <p class="mb-1"><strong>Teléfono:</strong> ${registration.telefono}</p>
                            <p class="mb-1"><strong>Tipo:</strong> ${this.formatUserType(registration.tipo_usuario)}</p>
                            ${registration.matricula ? `<p class="mb-1"><strong>Matrícula:</strong> ${registration.matricula}</p>` : ''}
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Fecha:</strong> ${new Date(registration.fecha_solicitud).toLocaleDateString('es-MX')}</p>
                            <p class="mb-1"><strong>Motivo:</strong></p>
                            <small class="text-muted">${registration.motivo}</small>
                        </div>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                        <button class="btn btn-success btn-sm" onclick="adminDashboard.approveRegistration('${registration.email}')">
                            <i class="fas fa-check me-1"></i>
                            Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="adminDashboard.rejectRegistration('${registration.email}')">
                            <i class="fas fa-times me-1"></i>
                            Rechazar
                        </button>
                        <button class="btn btn-info btn-sm" onclick="adminDashboard.viewRegistrationDetails('${registration.email}')">
                            <i class="fas fa-eye me-1"></i>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    formatUserType(tipo) {
        const types = {
            'estudiante': '👨‍🎓 Estudiante',
            'padre_familia': '👨‍👩‍👧‍👦 Padre de Familia',
            'docente': '👨‍🏫 Docente',
            'administrativo': '🏛️ Personal Administrativo'
        };
        return types[tipo] || tipo;
    }

    async approveRegistration(email) {
        if (!confirm('¿Estás seguro de aprobar esta solicitud?')) return;

        try {
            // Intentar aprobar via API
            if (window.apiClient) {
                const response = await window.apiClient.request('/admin/approve-registration', {
                    method: 'POST',
                    body: { email }
                });

                if (response.success) {
                    this.showToast('success', '✅ Solicitud aprobada', 'Se ha enviado email al usuario');
                    this.removeRegistrationFromLocal(email);
                    this.displayPendingRegistrations();
                    return;
                }
            }

            // Fallback: proceso local
            this.removeRegistrationFromLocal(email);
            this.showToast('success', '✅ Solicitud marcada como aprobada', 'Contacta al usuario manualmente');
            this.displayPendingRegistrations();

        } catch (error) {
            console.error('Error aprobando registro:', error);
            this.showToast('danger', '❌ Error', 'No se pudo aprobar la solicitud');
        }
    }

    async rejectRegistration(email) {
        const reason = prompt('Motivo del rechazo (opcional):');
        if (reason === null) return; // Usuario canceló

        try {
            // Intentar rechazar via API
            if (window.apiClient) {
                const response = await window.apiClient.request('/admin/reject-registration', {
                    method: 'POST',
                    body: { email, reason }
                });

                if (response.success) {
                    this.showToast('info', '📧 Solicitud rechazada', 'Se ha enviado email al usuario');
                    this.removeRegistrationFromLocal(email);
                    this.displayPendingRegistrations();
                    return;
                }
            }

            // Fallback: proceso local
            this.removeRegistrationFromLocal(email);
            this.showToast('info', '📝 Solicitud marcada como rechazada', 'Contacta al usuario manualmente');
            this.displayPendingRegistrations();

        } catch (error) {
            console.error('Error rechazando registro:', error);
            this.showToast('danger', '❌ Error', 'No se pudo rechazar la solicitud');
        }
    }

    removeRegistrationFromLocal(email) {
        const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        const filtered = registrations.filter(r => r.email !== email);
        localStorage.setItem('pending_registrations', JSON.stringify(filtered));
        this.dashboardData.pendingRegistrations = filtered;
    }

    showToast(type, title, message) {
        // Reutilizar método de authInterface si está disponible
        if (window.authInterface && window.authInterface.showToast) {
            window.authInterface.showToast(type, title, message);
        } else {
            console.log(`${title}: ${message}`);
        }
    }

    refreshDashboard() {
        this.showLoadingToast('Actualizando dashboard...');
        
        setTimeout(() => {
            this.loadDashboardData();
            this.createAcademicChart();
            this.showSuccessToast('Dashboard actualizado correctamente');
        }, 1500);
    }

    // Funciones de gestión
    viewStudent(studentId) {
        const student = this.dashboardData.students.find(s => s.id === studentId);
        if (!student) return;

        this.showInfoModal('Detalles del Estudiante', `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información Personal</h6>
                    <p><strong>Matrícula:</strong> ${student.id}</p>
                    <p><strong>Nombre:</strong> ${student.name}</p>
                    <p><strong>Semestre:</strong> ${student.semester}</p>
                </div>
                <div class="col-md-6">
                    <h6>Rendimiento Académico</h6>
                    <p><strong>Promedio:</strong> ${student.average}</p>
                    <p><strong>Estado:</strong> ${student.status}</p>
                    <p><strong>Nivel de Riesgo:</strong> ${student.riskLevel}</p>
                </div>
            </div>
        `);
    }

    editStudent(studentId) {
        this.showSuccessToast(`Función de edición para estudiante ${studentId} (En desarrollo)`);
    }

    contactStudent(studentId) {
        this.showSuccessToast(`Función de contacto para estudiante ${studentId} (En desarrollo)`);
    }

    addStudent() {
        this.showSuccessToast('Función de agregar estudiante (En desarrollo)');
    }

    exportStudents() {
        // Simular exportación
        this.showLoadingToast('Generando exportación...');
        
        setTimeout(() => {
            const csvData = 'Matrícula,Nombre,Semestre,Promedio,Estado\n' +
                this.dashboardData.students.map(s => 
                    `${s.id},${s.name},${s.semester},${s.average},${s.status}`
                ).join('\n');
            
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estudiantes_${new Date().toISOString().split('T')[0]}.csv`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccessToast('Exportación completada');
        }, 2000);
    }

    viewTeacher(teacherId) {
        const teacher = this.dashboardData.teachers.find(t => t.id === teacherId);
        if (!teacher) return;

        this.showInfoModal('Detalles del Docente', `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información Personal</h6>
                    <p><strong>ID:</strong> ${teacher.id}</p>
                    <p><strong>Nombre:</strong> ${teacher.name}</p>
                    <p><strong>Especialidad:</strong> ${teacher.specialty}</p>
                </div>
                <div class="col-md-6">
                    <h6>Carga Académica</h6>
                    <p><strong>Materias:</strong></p>
                    <ul>
                        ${teacher.subjects.map(subject => `<li>${subject}</li>`).join('')}
                    </ul>
                    <p><strong>Horas Semanales:</strong> ${teacher.workload}</p>
                </div>
            </div>
        `);
    }

    editTeacher(teacherId) {
        this.showSuccessToast(`Función de edición para docente ${teacherId} (En desarrollo)`);
    }

    assignSubjects(teacherId) {
        this.showSuccessToast(`Función de asignación de materias para ${teacherId} (En desarrollo)`);
    }

    addTeacher() {
        this.showSuccessToast('Función de agregar docente (En desarrollo)');
    }

    generateReport(type) {
        this.showLoadingToast(`Generando reporte ${type}...`);
        
        setTimeout(() => {
            // Simular generación de reporte
            const reportName = this.getReportName(type);
            const blob = new Blob([`Reporte ${reportName} generado el ${new Date().toLocaleDateString()}`], 
                { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            document.body.appendChild(a);
            a.click();
            
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccessToast(`Reporte ${reportName} generado correctamente`);
        }, 2500);
    }

    getReportName(type) {
        const names = {
            'academic': 'de Calificaciones',
            'attendance': 'de Asistencia',
            'performance': 'de Rendimiento',
            'payments': 'de Pagos',
            'income': 'de Ingresos',
            'pending': 'de Pagos Vencidos'
        };
        return names[type] || 'General';
    }

    showInfoModal(title, content) {
        const modalHTML = `
            <div class="modal fade" id="dynamicModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${content}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const existingModal = document.getElementById('dynamicModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('dynamicModal'));
        modal.show();
    }

    // Funciones de toast
    showSuccessToast(message) {
        this.showToast(message, 'success');
    }

    showErrorToast(message) {
        this.showToast(message, 'danger');
    }

    showLoadingToast(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        const toastElement = document.createElement('div');
        toastElement.className = `toast align-items-center text-bg-${type} border-0`;
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastElement);
        
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Funciones globales para los event handlers
let adminDashboard;

function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

function showInfoModal() {
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    infoModal.show();
}

function loginAdmin() {
    adminDashboard.loginAdmin();
}

function logoutAdmin() {
    adminDashboard.logoutAdmin();
}

function refreshDashboard() {
    adminDashboard.refreshDashboard();
}

function viewStudent(studentId) {
    adminDashboard.viewStudent(studentId);
}

function editStudent(studentId) {
    adminDashboard.editStudent(studentId);
}

function contactStudent(studentId) {
    adminDashboard.contactStudent(studentId);
}

function addStudent() {
    adminDashboard.addStudent();
}

function exportStudents() {
    adminDashboard.exportStudents();
}

function viewTeacher(teacherId) {
    adminDashboard.viewTeacher(teacherId);
}

function editTeacher(teacherId) {
    adminDashboard.editTeacher(teacherId);
}

function assignSubjects(teacherId) {
    adminDashboard.assignSubjects(teacherId);
}

function addTeacher() {
    adminDashboard.addTeacher();
}

function generateReport(type) {
    adminDashboard.generateReport(type);
}

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        console.error('Chart.js no está disponible. Los gráficos no funcionarán.');
        // Intentar cargar Chart.js dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js';
        script.onload = function() {
            console.log('Chart.js cargado dinámicamente');
            adminDashboard = new AdminDashboard();
        };
        script.onerror = function() {
            console.error('No se pudo cargar Chart.js. Dashboard funcionará sin gráficos.');
            adminDashboard = new AdminDashboard();
        };
        document.head.appendChild(script);
    } else {
        console.log('Chart.js disponible, inicializando dashboard');
        adminDashboard = new AdminDashboard();
    }
});

// Estilos adicionales
const adminStyle = document.createElement('style');
adminStyle.textContent = `
    .feature-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    .stat-card {
        transition: all 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-3px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    #academicChart {
        height: 300px !important;
    }
    
    .table th {
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .table td {
        vertical-align: middle;
        font-size: 0.9rem;
    }
    
    .btn-group-sm .btn {
        padding: 0.25rem 0.4rem;
        font-size: 0.8rem;
    }
    
    .nav-pills .nav-link {
        font-size: 0.9rem;
        padding: 0.6rem 1rem;
    }
    
    /* Dark mode support */
    .dark-mode .card {
        background-color: #2d3748;
        border-color: #4a5568;
    }
    
    .dark-mode .table {
        color: #f7fafc;
    }
    
    .dark-mode .table-primary th,
    .dark-mode .table-success th,
    .dark-mode .table-info th {
        background-color: #4a5568;
        border-color: #718096;
        color: #f7fafc;
    }
    
    .dark-mode .modal-content {
        background-color: #2d3748;
        color: #f7fafc;
    }
    
    .dark-mode .form-control,
    .dark-mode .form-select {
        background-color: #4a5568;
        border-color: #718096;
        color: #f7fafc;
    }
    
    .dark-mode .nav-pills .nav-link {
        color: #a0aec0;
    }
    
    .dark-mode .nav-pills .nav-link.active {
        background-color: #3182ce;
    }
`;
document.head.appendChild(adminStyle);