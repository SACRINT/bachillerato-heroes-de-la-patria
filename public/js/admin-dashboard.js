// Dashboard Administrativo Integrado con API
// NOTA: DOMPurify se asume disponible globalmente desde script anterior
// O usar: const DOMPurify = window.DOMPurify || { sanitize: (str) => str };

// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => { },
        warn: () => { },
        error: () => { }
    };
}


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
            this.updateDashboardUI();
            this.displayPendingRegistrations();
            this.startAutoRefresh();
        } else {
            this.showLoginPrompt();
        }
    }

    setupInterface() {
        // Configurar la interfaz inicial del dashboard
        //debugLog.log('DASHBOARD', '🔧 Configurando interfaz del dashboard');

        // Inicializar componentes de la interfaz si es necesario
        if (typeof this.initializeSystem === 'function') {
            this.initializeSystem();
        }
    }

    async checkAuthentication() {
        //debugLog.log('DASHBOARD', '🔐 Verificando autenticación en dashboard...');

        // Prioridad 1: Sistema de autenticación seguro (nuevo)
        if (window.secureAdminAuth && window.secureAdminAuth.isUserAuthenticated()) {
            this.currentUser = window.secureAdminAuth.getCurrentUser();
            this.isLoggedIn = true;
            //debugLog.log('APP', '✅ Usuario autenticado con sistema seguro:', this.currentUser);
            return;
        }

        // Prioridad 2: Verificar en localStorage del sistema seguro
        try {
            const secureSession = localStorage.getItem('secure_admin_session');
            if (secureSession) {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.token && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    this.currentUser = sessionData.user || { role: 'admin' };
                    this.isLoggedIn = true;
                    //debugLog.log('APP', '✅ Usuario autenticado via localStorage seguro');
                    return;
                }
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error verificando sesión segura:', error);
        }

        // ✅ NUEVO: Verificar autenticación moderna (bge_auth_*)
        try {
            const bgeToken = localStorage.getItem('bge_auth_token') || sessionStorage.getItem('bge_auth_token');
            const bgeUserStr = localStorage.getItem('bge_auth_user') || sessionStorage.getItem('bge_auth_user');

            if (bgeToken && bgeUserStr) {
                const bgeUser = JSON.parse(bgeUserStr);
                this.currentUser = bgeUser;
                this.isLoggedIn = true;
                //debugLog.log('APP', '✅ Usuario autenticado con sistema moderno (bge_auth_*)', this.currentUser);
                return;
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error verificando sesión moderna:', error);
        }

        // Fallback: Sistema viejo (mantener compatibilidad)
        if (window.authInterface && window.authInterface.isAuthenticated()) {
            this.currentUser = window.authInterface.getCurrentUser();
            this.isLoggedIn = true;
            //debugLog.log('APP', '✅ Usuario detectado con sistema viejo:', this.currentUser);
            return;
        }

        // No autenticado
        //debugLog.log('APP', '❌ Usuario no autenticado');
        this.isLoggedIn = false;
    }

    isAdmin() {
        // Sistema nuevo: verificar role 'admin'
        if (this.currentUser && this.currentUser.role === 'admin') {
            return true;
        }

        // Sistema viejo: verificar tipo_usuario
        if (this.currentUser &&
            ['administrativo', 'directivo'].includes(this.currentUser.tipo_usuario)) {
            return true;
        }

        // Si solo tenemos autenticación básica del sistema seguro, asumir admin
        if (this.isLoggedIn && (!this.currentUser || Object.keys(this.currentUser).length === 0)) {
            return true;
        }

        return false;
    }

    showLoginPrompt() {
        //debugLog.log('APP', '🔐 Mostrando prompt de login');
        //debugLog.log('DASHBOARD', '🚫 Acceso no autorizado al dashboard - Redirigiendo al inicio');

        // Mostrar mensaje de seguridad
        alert('Acceso restringido: Debes iniciar sesión como administrador para acceder al dashboard.');

        // DEBUG REDIRECT
        // window.location.href = 'index.html';
        const debugOverlay = document.createElement('div');
        debugOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);color:white;z-index:99999;padding:20px;overflow:auto;';
        debugOverlay.innerHTML = `
            <h2>⚠️ Acceso Denegado (Debug Mode)</h2>
            <p>El sistema intentó redirigirte a index.html.</p>
            <h3>Diagnóstico:</h3>
            <ul>
                <li><strong>isLoggedIn:</strong> ${this.isLoggedIn}</li>
                <li><strong>currentUser:</strong> ${JSON.stringify(this.currentUser, null, 2)}</li>
                <li><strong>Role Check:</strong> ${this.currentUser ? this.currentUser.role : 'N/A'} (Expected: 'admin')</li>
                <li><strong>bge_auth_token (LS):</strong> ${localStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING'}</li>
                <li><strong>bge_auth_token (SS):</strong> ${sessionStorage.getItem('bge_auth_token') ? 'PRESENT' : 'MISSING'}</li>
                <li><strong>secure_admin_session:</strong> ${localStorage.getItem('secure_admin_session') ? 'PRESENT' : 'MISSING'}</li>
            </ul>
            <button onclick="window.location.reload()" class="btn btn-primary">Recargar</button>
            <button onclick="window.location.href='index.html'" class="btn btn-danger">Ir a Inicio</button>
        `;
        document.body.appendChild(debugOverlay);
        console.warn('Redirect suppressed. Auth State:', {
            isLoggedIn: this.isLoggedIn,
            currentUser: this.currentUser,
            tokenLS: localStorage.getItem('bge_auth_token'),
            tokenSS: sessionStorage.getItem('bge_auth_token')
        });
    }

    showDashboard() {
        //debugLog.log('DASHBOARD', '📊 Mostrando dashboard');

        // 1. Ocultar secciones de 'Landing Page' (Hero y Módulos públicos)
        const heroSection = document.getElementById('hero');
        if (heroSection) heroSection.style.display = 'none';

        const modulosSection = document.getElementById('modulos-admin');
        if (modulosSection) modulosSection.style.display = 'none';

        const characteristicsSection = document.querySelector('section.py-5:not(.dashboard-section):not(#modulos-admin):not(#seguridad)');
        if (characteristicsSection && characteristicsSection.querySelector('.feature-card')) {
            characteristicsSection.style.display = 'none';
        }

        // 2. Mostrar secciones del Dashboard Integrado
        const dashboardSection = document.querySelector('.dashboard-section');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }

        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.classList.remove('d-none');
        }

        // Ocultar sección de login si existe
        const loginSection = document.querySelector('.login-section');
        if (loginSection) {
            loginSection.style.display = 'none';
        }

        // Ajustar padding del body para navbar fixed
        document.body.style.paddingTop = '90px';
    }

    showAlert(message, type = 'info') {
        // Buscar o crear contenedor de alertas
        let alertContainer = document.getElementById('admin-alert-container');

        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'admin-alert-container';
            alertContainer.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; max-width: 400px;';
            document.body.appendChild(alertContainer);
        }

        // Crear alerta
        const alertId = `alert-${Date.now()}`;
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = DOMPurify.sanitize(`
            <strong>${type === 'danger' ? 'Error' : type === 'success' ? 'Éxito' : 'Información'}:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `);

        alertContainer.appendChild(alertDiv);

        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            if (document.getElementById(alertId)) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
                bsAlert.close();
            }
        }, 5000);
    }

    // ============================================
    // CARGA DE DATOS DESDE API
    // ============================================

    async loadDashboardData() {
        try {
            //debugLog.log('DASHBOARD', '📊 Cargando datos del dashboard...');

            // Cargar solicitudes de registro pendientes
            await this.loadPendingRegistrations();

            // Cargar datos principales en paralelo
            const [analytics, students, teachers] = await Promise.all([
                this.loadAnalytics(),
                this.loadStudentsData(),
                this.loadTeachersData()
            ]);

            // Estructurar datos correctamente para el dashboard
            this.dashboardData = {
                analytics: analytics,
                students: students.students || [],
                teachers: teachers.teachers || teachers,
                statistics: {
                    totalStudents: analytics?.students?.total_estudiantes || students?.overview?.totalStudents || 1247,
                    totalTeachers: analytics?.teachers?.total_docentes || students?.overview?.totalTeachers || 68,
                    totalSubjects: analytics?.academic?.materias_activas || students?.overview?.totalSubjects || 42,
                    generalAverage: analytics?.academic?.promedio_general || students?.overview?.generalAverage || 8.4
                },
                lastUpdate: new Date().toISOString()
            };

            //debugLog.log('DASHBOARD', '✅ Datos del dashboard cargados:', this.dashboardData);

        } catch (error) {
            debugLog.error('DASHBOARD', '❌ Error cargando dashboard:', error);
            this.showErrorState(error);
        }
    }

    async loadAnalytics() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/api/analytics/dashboard');

            if (response.success) {
                return response.data;
            }

            throw new Error('Error en respuesta de analytics');
        } catch (error) {
            debugLog.warn('API', '📊 Analytics API no disponible, usando datos demo');
            return this.getDemoAnalytics();
        }
    }

    async loadStudentsData() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/api/admin/students?limit=10');

            if (response.success) {
                return response.data;
            }

            throw new Error('Error en respuesta de estudiantes');
        } catch (error) {
            debugLog.warn('API', '👥 Students API no disponible, usando datos demo');
            return this.getDemoStudents();
        }
    }

    async loadTeachersData() {
        try {
            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/api/admin/teachers?limit=10');

            if (response.success) {
                return response.data;
            }

            throw new Error('Error en respuesta de docentes');
        } catch (error) {
            debugLog.warn('API', '👨‍🏫 Teachers API no disponible, usando datos demo');
            return this.getDemoStudents().teachers;
        }
    }

    async loadActiveUsers() {
        try {
            debugLog.log('APP', '👥 [AdminDashboard] Cargando usuarios activos...');

            if (!window.apiClient) {
                throw new Error('API client no disponible');
            }

            const response = await window.apiClient.request('/api/dashboard/active-users');

            if (response.success) {
                debugLog.log('APP', `✅ [AdminDashboard] ${response.count} usuarios activos cargados`);
                this.renderActiveUsersTable(response.data);

                // Actualizar contador
                const counterEl = document.getElementById('active-users-counter');
                if (counterEl) {
                    counterEl.textContent = `${response.count} usuario${response.count !== 1 ? 's' : ''}`;
                }

                return response.data;
            }

            throw new Error('Error en respuesta de usuarios activos');
        } catch (error) {
            debugLog.error('ERROR', '❌ [AdminDashboard] Error cargando usuarios activos:', error);
            this.showAlert('Error al cargar usuarios activos', 'danger');
            this.renderActiveUsersTable([]);
            return [];
        }
    }

    renderActiveUsersTable(users) {
        const container = document.getElementById('activeUsersContainer');
        if (!container) {
            debugLog.warn('APP', '⚠️ Contenedor activeUsersContainer no encontrado');
            return;
        }

        if (users.length === 0) {
            container.innerHTML = DOMPurify.sanitize(`
                <div class="text-center text-muted py-5">
                    <i class="fas fa-user-slash fa-3x mb-3"></i>
                    <p class="lead">No hay usuarios activos en este momento</p>
                </div>
            `);
            return;
        }

        // Crear tabla
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead class="table-light">
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Última Actividad</th>
                            <th class="text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        users.forEach(user => {
            const roleBadge = this.getRoleBadge(user.role);
            const lastActivity = user.lastActivity ? new Date(user.lastActivity).toLocaleString('es-MX') : 'N/A';

            tableHTML += `
                <tr>
                    <td><strong>${user.username}</strong></td>
                    <td>${user.email}</td>
                    <td>${roleBadge}</td>
                    <td><small>${lastActivity}</small></td>
                    <td class="text-center">
                        <span class="badge bg-success">
                            <i class="fas fa-circle"></i> Activo
                        </span>
                    </td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(tableHTML, 'ugc'));
    }

    getRoleBadge(role) {
        const badges = {
            'admin': '<span class="badge bg-danger">Admin</span>',
            'teacher': '<span class="badge bg-primary">Docente</span>',
            'student': '<span class="badge bg-info">Estudiante</span>',
            'padre': '<span class="badge bg-warning">Padre</span>',
            'parent': '<span class="badge bg-warning">Padre</span>'
        };
        return badges[role] || '<span class="badge bg-secondary">N/A</span>';
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
        return {
            overview: {
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
    }

    /**
     * Mostrar estado de error cuando fallan las cargas
     */
    showErrorState(error) {
        debugLog.error('DASHBOARD', '❌ Error en el dashboard - Modo de prueba activado', error);

        // Mostrar mensaje de error amigable
        const errorMessage = `
            <div class="alert alert-warning" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Modo de Desarrollo:</strong> Usando datos de prueba. 
                Algunas funciones pueden estar limitadas.
                <br><small class="text-muted">Error: ${error?.message || 'Error desconocido'}</small>
            </div>
        `;

        // Buscar un contenedor para mostrar el mensaje
        const dashboardContainer = document.querySelector('.dashboard-section') ||
            document.querySelector('#adminPanel') ||
            document.body;

        if (dashboardContainer) {
            dashboardContainer.insertAdjacentHTML('afterbegin', DOMPurify.sanitize(DOMPurify.sanitize(errorMessage)));
        }
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

        // Actualizar UI con datos cargados
        this.updateDashboardUI();

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

    updateDashboardUI() {
        // Cargar estadísticas generales - usar los datos estructurados
        const stats = this.dashboardData.statistics;
        if (stats) {
            const totalStudentsEl = document.getElementById('totalStudents');
            const totalTeachersEl = document.getElementById('totalTeachers');
            const totalSubjectsEl = document.getElementById('totalSubjects');
            const generalAverageEl = document.getElementById('generalAverage');

            if (totalStudentsEl) totalStudentsEl.textContent = stats.totalStudents.toLocaleString();
            if (totalTeachersEl) totalTeachersEl.textContent = stats.totalTeachers;
            if (totalSubjectsEl) totalSubjectsEl.textContent = stats.totalSubjects;
            if (generalAverageEl) generalAverageEl.textContent = stats.generalAverage;
        }

        // Cargar tablas
        this.loadStudentsTable();
        this.loadTeachersTable();
    }

    loadStudentsTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        tbody.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(''));

        if (!this.dashboardData.students || this.dashboardData.students.length === 0) {
            debugLog.warn('APP', '⚠️ No hay estudiantes para mostrar');
            return;
        }

        this.dashboardData.students.forEach(student => {
            const row = document.createElement('tr');

            // Mapear campos del API: el API devuelve nombre, semestre, matricula
            const studentName = student.nombre || student.name || 'Sin nombre';
            const studentSemester = student.semestre || student.semester || 'N/A';
            const studentMatricula = student.matricula || student.id || 'N/A';
            const studentAverageRaw = student.promedio || student.average || 0;
            const studentAverage = Number(studentAverageRaw);
            const studentStatus = student.estado || student.status || 'Activo';
            const studentRiskLevel = studentAverage < 6.0 ? 'Alto Riesgo' : 'Normal';

            const statusBadge = this.getStudentStatusBadge(studentStatus);
            const riskBadge = this.getRiskLevelBadge(studentRiskLevel);

            row.innerHTML = DOMPurify.sanitize(`
                <td><strong>${studentMatricula}</strong></td>
                <td>${studentName}</td>
                <td class="text-center">
                    <span class="badge bg-info">${studentSemester}°</span>
                </td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(studentAverage)}">
                        ${!isNaN(studentAverage) && studentAverage > 0 ? studentAverage.toFixed(2) : 'N/A'}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${studentStatus === 'Activo' ? 'bg-success' : 'bg-danger'}">${studentStatus}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" data-action="view-student" data-param-1="${student.id}" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" data-action="edit-student" data-param-1="${student.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-action="contact-student" data-param-1="${student.id}" title="Contactar">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </div>
                </td>
            `);

            tbody.appendChild(row);
        });
    }

    loadTeachersTable() {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        tbody.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(''));

        this.dashboardData.teachers.forEach(teacher => {
            const row = document.createElement('tr');

            const statusBadge = teacher.status === 'Activo' ?
                '<span class="badge bg-success">Activo</span>' :
                '<span class="badge bg-secondary">Inactivo</span>';

            row.innerHTML = DOMPurify.sanitize(`
                <td><strong>${teacher.name}</strong></td>
                <td>${teacher.specialty}</td>
                <td>
                    <small>${(Array.isArray(teacher.subjects) && teacher.subjects.length > 0) ? teacher.subjects.join(', ') : 'N/A'}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${teacher.workload}h</span>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" data-action="view-teacher" data-param-1="${teacher.id}" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" data-action="edit-teacher" data-param-1="${teacher.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-info" data-action="assign-subjects" data-param-1="${teacher.id}" title="Asignar Materias">
                            <i class="fas fa-book"></i>
                        </button>
                    </div>
                </td>
            `);

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
            debugLog.warn('APP', '⚠️ Chart.js no está disponible, mostrando mensaje alternativo');
            ctx.parentElement.innerHTML = DOMPurify.sanitize(`
                <div class="text-center py-4">
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Gráficos no disponibles</p>
                    <small class="text-muted">Chart.js no se pudo cargar desde CDN</small>
                    <br>
                    <button class="btn btn-sm btn-outline-primary mt-2" data-action="reload-page" data-context="charts">
                        <i class="fas fa-refresh me-1"></i>Reintentar
                    </button>
                </div>
            `);
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
                const response = await window.apiClient.request('/api/admin/pending-registrations');
                if (response.success) {
                    this.dashboardData.pendingRegistrations = response.data;
                    return;
                }
            }

            // Fallback: cargar desde localStorage
            const localRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
            this.dashboardData.pendingRegistrations = localRegistrations;

            //debugLog.log('APP', `📋 ${localRegistrations.length} solicitudes pendientes encontradas`);
            this.updatePendingCounter(localRegistrations.length);
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error cargando solicitudes:', error);
            this.dashboardData.pendingRegistrations = [];
        }
    }

    displayPendingRegistrations() {
        const container = document.getElementById('pending-registrations-container');
        if (!container) return;

        const registrations = this.dashboardData.pendingRegistrations || [];

        if (registrations.length === 0) {
            container.innerHTML = DOMPurify.sanitize(`
                <div class="text-center py-4">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay solicitudes pendientes</p>
                </div>
            `);
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
                        <button class="btn btn-success btn-sm" data-action="approveRegistration-${registration.email}" data-context="registrations">
                            <i class="fas fa-check me-1"></i>
                            Aprobar
                        </button>
                        <button class="btn btn-danger btn-sm" data-action="rejectRegistration-${registration.email}" data-context="registrations">
                            <i class="fas fa-times me-1"></i>
                            Rechazar
                        </button>
                        <button class="btn btn-info btn-sm" data-action="viewRegistrationDetails-${registration.email}" data-context="registrations">
                            <i class="fas fa-eye me-1"></i>
                            Ver Detalles
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = DOMPurify.sanitize(DOMPurify.sanitize(html, 'ugc'));
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
                const response = await window.apiClient.request('/api/admin/approve-registration', {
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
            this.updatePendingCounter(this.dashboardData.pendingRegistrations.length);

        } catch (error) {
            debugLog.error('ERROR', 'Error aprobando registro:', error);
            this.showToast('danger', '❌ Error', 'No se pudo aprobar la solicitud');
        }
    }

    async rejectRegistration(email) {
        const reason = prompt('Motivo del rechazo (opcional):');
        if (reason === null) return; // Usuario canceló

        try {
            // Intentar rechazar via API
            if (window.apiClient) {
                const response = await window.apiClient.request('/api/admin/reject-registration', {
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
            this.updatePendingCounter(this.dashboardData.pendingRegistrations.length);

        } catch (error) {
            debugLog.error('ERROR', 'Error rechazando registro:', error);
            this.showToast('danger', '❌ Error', 'No se pudo rechazar la solicitud');
        }
    }

    removeRegistrationFromLocal(email) {
        const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        const filtered = registrations.filter(r => r.email !== email);
        localStorage.setItem('pending_registrations', JSON.stringify(filtered));
        this.dashboardData.pendingRegistrations = filtered;
    }

    updatePendingCounter(count) {
        const badge = document.getElementById('pending-count');
        const counter = document.getElementById('pending-counter');

        if (count > 0) {
            if (badge) {
                badge.textContent = count;
                badge.style.display = 'inline';
            }
            if (counter) {
                counter.textContent = `${count} pendientes`;
                counter.className = 'badge bg-warning me-2';
            }
        } else {
            if (badge) {
                badge.style.display = 'none';
            }
            if (counter) {
                counter.textContent = 'Sin solicitudes';
                counter.className = 'badge bg-success me-2';
            }
        }
    }

    showToast(type, title, message) {
        // Reutilizar método de authInterface si está disponible
        if (window.authInterface && window.authInterface.showToast) {
            window.authInterface.showToast(type, title, message);
        } else {
            //debugLog.log('APP', `${title}: ${message}`);
        }
    }

    refreshDashboard() {
        this.showLoadingToast('Actualizando dashboard...');

        setTimeout(async () => {
            await this.loadDashboardData();
            this.updateDashboardUI();
            this.createAcademicChart();
            this.showSuccessToast('Dashboard actualizado correctamente');
        }, 1500);
    }

    /**
     * Iniciar auto-refresh del dashboard cada 10 minutos (optimizado)
     * Solo se ejecuta si el tab está activo (Page Visibility API)
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        this.refreshInterval = setInterval(async () => {
            // Solo refrescar si el tab está visible/activo
            if (document.hidden) {
                //debugLog.log('APP', '⏸️  Auto-refresh pausado (tab no visible)');
                return;
            }

            //debugLog.log('DASHBOARD', '🔄 Auto-refresh del dashboard...');
            await this.loadDashboardData();
            this.updateDashboardUI();
            this.displayPendingRegistrations();
        }, 10 * 60 * 1000); // 10 minutos (aumentado de 5 para reducir requests)

        //debugLog.log('APP', '⏰ Auto-refresh iniciado (cada 10 minutos)');
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

        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(DOMPurify.sanitize(modalHTML)));
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
        toastElement.innerHTML = DOMPurify.sanitize(`
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `);

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
    //debugLog.log('APP', '🔑 Función loginAdmin() llamada');
    if (adminDashboard && typeof adminDashboard.loginAdmin === 'function') {
        //debugLog.log('APP', '✅ Llamando adminDashboard.loginAdmin()');
        adminDashboard.loginAdmin();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado o no tiene método loginAdmin');
        alert('Error: Sistema no inicializado correctamente. Recarga la página.');
    }
}

function logoutAdmin() {
    if (adminDashboard && typeof adminDashboard.logoutAdmin === 'function') {
        adminDashboard.logoutAdmin();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function refreshDashboard() {
    if (adminDashboard && typeof adminDashboard.refreshDashboard === 'function') {
        adminDashboard.refreshDashboard();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function viewStudent(studentId) {
    if (adminDashboard && typeof adminDashboard.viewStudent === 'function') {
        adminDashboard.viewStudent(studentId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function editStudent(studentId) {
    if (adminDashboard && typeof adminDashboard.editStudent === 'function') {
        adminDashboard.editStudent(studentId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function contactStudent(studentId) {
    if (adminDashboard && typeof adminDashboard.contactStudent === 'function') {
        adminDashboard.contactStudent(studentId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function addStudent() {
    if (adminDashboard && typeof adminDashboard.addStudent === 'function') {
        adminDashboard.addStudent();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function exportStudents() {
    if (adminDashboard && typeof adminDashboard.exportStudents === 'function') {
        adminDashboard.exportStudents();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function viewTeacher(teacherId) {
    if (adminDashboard && typeof adminDashboard.viewTeacher === 'function') {
        adminDashboard.viewTeacher(teacherId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function editTeacher(teacherId) {
    if (adminDashboard && typeof adminDashboard.editTeacher === 'function') {
        adminDashboard.editTeacher(teacherId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function assignSubjects(teacherId) {
    if (adminDashboard && typeof adminDashboard.assignSubjects === 'function') {
        adminDashboard.assignSubjects(teacherId);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function addTeacher() {
    if (adminDashboard && typeof adminDashboard.addTeacher === 'function') {
        adminDashboard.addTeacher();
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

function generateReport(type) {
    if (adminDashboard && typeof adminDashboard.generateReport === 'function') {
        adminDashboard.generateReport(type);
    } else {
        debugLog.error('ERROR', '❌ adminDashboard no está inicializado');
    }
}

// Variable global para el dashboard (ya declarada anteriormente)

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        debugLog.error('ERROR', 'Chart.js no está disponible. Los gráficos no funcionarán.');
        // Intentar cargar Chart.js dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js';
        script.onload = function () {
            //debugLog.log('APP', 'Chart.js cargado dinámicamente');
            window.adminDashboard = new AdminDashboard();
            // Inicializar módulo de solicitudes
            if (window.solicitudesManager && typeof window.solicitudesManager.init === 'function') {
                window.solicitudesManager.init();
                debugLog.log('DASHBOARD', '✅ [DASHBOARD] SolicitudesManager inicializado');
            }
        };
        script.onerror = function () {
            debugLog.error('ERROR', 'No se pudo cargar Chart.js. Dashboard funcionará sin gráficos.');
            window.adminDashboard = new AdminDashboard();
            // Inicializar módulo de solicitudes
            if (window.solicitudesManager && typeof window.solicitudesManager.init === 'function') {
                window.solicitudesManager.init();
                debugLog.log('DASHBOARD', '✅ [DASHBOARD] SolicitudesManager inicializado');
            }
        };
        document.head.appendChild(script);
    } else {
        //debugLog.log('DASHBOARD', 'Chart.js disponible, inicializando dashboard');
        window.adminDashboard = new AdminDashboard();
        // Inicializar módulo de solicitudes
        if (window.solicitudesManager && typeof window.solicitudesManager.init === 'function') {
            window.solicitudesManager.init();
            debugLog.log('DASHBOARD', '✅ [DASHBOARD] SolicitudesManager inicializado');
        }
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

// ============================================
// EVENT DELEGATION HANDLER (CSP Compliant)
// Pattern B: onclick con parámetros → data-action
// ============================================
document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.getAttribute('data-action');
    const context = actionElement.getAttribute('data-context') || 'admin-dashboard';

    try {
        // Pattern B: Acciones con parámetros
        if (action === 'reload-page') {
            location.reload();
            return;
        }

        if (action.startsWith('approveRegistration-')) {
            const email = action.replace('approveRegistration-', '');
            if (window.adminDashboard && typeof window.adminDashboard.approveRegistration === 'function') {
                window.adminDashboard.approveRegistration(email);
            }
            return;
        }

        if (action.startsWith('rejectRegistration-')) {
            const email = action.replace('rejectRegistration-', '');
            if (window.adminDashboard && typeof window.adminDashboard.rejectRegistration === 'function') {
                window.adminDashboard.rejectRegistration(email);
            }
            return;
        }

        if (action.startsWith('viewRegistrationDetails-')) {
            const email = action.replace('viewRegistrationDetails-', '');
            if (window.adminDashboard && typeof window.adminDashboard.viewRegistrationDetails === 'function') {
                window.adminDashboard.viewRegistrationDetails(email);
            }
            return;
        }

        debugLog.warn('ADMIN-DASHBOARD', '[ADMIN-DASHBOARD] Unhandled data-action:', action);
    } catch (error) {
        debugLog.error('ADMIN-DASHBOARD', '[ADMIN-DASHBOARD] Error handling action:', action, error);
    }
});
document.head.appendChild(adminStyle);
window.AdminDashboard = AdminDashboard;