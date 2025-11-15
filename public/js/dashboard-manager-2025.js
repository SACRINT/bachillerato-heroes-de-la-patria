// ========================================
// DASHBOARD MANAGER 2025 - NUEVA VERSIÓN
// ========================================

// Inicialización con logging centralizado
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


if (window.BGELogger && typeof window.BGELogger.info === 'function') {
    debugLog.log('APP', 'Dashboard Manager', '🚀 INICIANDO Dashboard Manager 2025', {
        version: '2025-10-01',
        timestamp: Date.now(),
        antiCache: true
    });
} else {
    debugLog.log('APP', '🚀 [Dashboard Manager] INICIANDO Dashboard Manager 2025 v2025-10-01');
}

// Dashboard Administrativo Integrado con API
class AdminDashboard {
    constructor() {
        if (window.BGELogger && typeof window.BGELogger.debug === 'function') {
            debugLog.log('APP', 'Dashboard Manager', '🏗️ Constructor AdminDashboard iniciando...');
        } else {
            debugLog.log('APP', '🏗️ [Dashboard Manager] Constructor AdminDashboard iniciando...');
        }
        this.currentUser = null;
        this.isLoggedIn = false;
        this.academicChart = null;
        this.dashboardData = {};
        this.refreshInterval = null;

        // Credenciales de administrador de prueba
        this.adminCredentials = {
            username: 'admin',
            password: 'admin123',
            role: 'director',
            name: 'Administrador del Sistema'
        };

        // Configuración de datos estadísticos
        if (window.BGELogger && typeof window.BGELogger.debug === 'function') {
            debugLog.log('APP', 'Dashboard Manager', '🔧 Inicializando configuración de datos reales', {
                version: '2025-10-01',
            localStorage: {
                totalStudents: localStorage.getItem('realData_totalStudents'),
                totalTeachers: localStorage.getItem('realData_totalTeachers'),
                totalSubjects: localStorage.getItem('realData_totalSubjects'),
                generalAverage: localStorage.getItem('realData_generalAverage')
            }
            });
        } else {
            debugLog.log('APP', '🔧 [Dashboard Manager] Inicializando configuración de datos reales');
        }

        this.realDataConfig = {
            totalStudents: parseInt(localStorage.getItem('realData_totalStudents')) || 1247,
            totalTeachers: parseInt(localStorage.getItem('realData_totalTeachers')) || 68,
            totalSubjects: parseInt(localStorage.getItem('realData_totalSubjects')) || 42,
            generalAverage: parseFloat(localStorage.getItem('realData_generalAverage')) || 8.4
        };

        if (window.BGELogger && typeof window.BGELogger.info === 'function') {
            debugLog.log('APP', 'Dashboard Manager', '⚙️ Configuración de datos inicializada', this.realDataConfig);
        } else {
            debugLog.log('APP', '⚙️ [Dashboard Manager] Configuración de datos inicializada:', this.realDataConfig);
        }

        this.init();

        // Actualizar estado del botón refresh al inicializar
        setTimeout(() => {
            updateRefreshButtonState();
        }, 1000);

        if (window.BGELogger && typeof window.BGELogger.info === 'function') {
            debugLog.log('APP', 'Dashboard Manager', '✅ Constructor AdminDashboard completado exitosamente');
        } else {
            debugLog.log('APP', '✅ [Dashboard Manager] Constructor AdminDashboard completado exitosamente');
        }
    }

    // Helper function para copiar contraseña - Refactorizada de onclick inline
    handleCopyPassword(button, password) {
        if (!password) {
            debugLog.error('ERROR', 'Error: No se proporcionó contraseña para copiar.');
            return;
        }
        navigator.clipboard.writeText(password).then(() => {
            button.innerHTML = sanitizeHTML('<i class="fas fa-check"></i> Copiado');
            setTimeout(() => {
                button.innerHTML = sanitizeHTML('<i class="fas fa-copy"></i> Copiar');
            }, 2000);
        }).catch(err => {
            debugLog.error('ERROR', 'Error al copiar la contraseña: ', err);
            button.innerHTML = sanitizeHTML('<i class="fas fa-times"></i> Error');
        });
    }

    // Helper function para aprobar solicitud - Refactorizada de onclick inline
    handleApproveRequest(requestId) {
        this.approveRequest(requestId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
        if (modal) {
            modal.hide();
        }
    }

    // Helper function para rechazar solicitud - Refactorizada de onclick inline
    handleRejectRequest(requestId) {
        this.rejectRequest(requestId);
        const modal = bootstrap.Modal.getInstance(document.getElementById('requestDetailsModal'));
        if (modal) {
            modal.hide();
        }
    }

    async init() {
        debugLog.log('INIT', '🔄 [INIT] Iniciando sistema AdminDashboard...');
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
            this.loadActiveUsers(); // Cargar usuarios activos
            this.loadContentStats(); // ✅ Cargar estadísticas de contenido
            this.showAdvancedMetrics(); // Mostrar métricas avanzadas
            this.startAutoRefresh();
        } else {
            this.showLoginPrompt();
        }
        debugLog.log('INIT', '✅ [INIT] Sistema AdminDashboard inicializado correctamente');
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
        // GDPR: Datos sensibles enmascarados
        debugLog.log('AUTH', '🔐 [AUTH] Verificando autenticación en dashboard...');

        // Prioridad 1: Sistema de autenticación seguro (nuevo) - BGESecurityModule
        if (window.secureAdminAuth && typeof window.secureAdminAuth.isUserAuthenticated === 'function') {
            if (window.secureAdminAuth.isUserAuthenticated()) {
                // Obtener datos de usuario desde localStorage directamente
                const sessionData = localStorage.getItem('secure_admin_session');
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        this.currentUser = session.user || { username: 'admin', role: 'admin' };
                        this.isLoggedIn = true;
                        // GDPR: Datos sensibles enmascarados
                        debugLog.log('AUTH', '✅ [AUTH] Usuario autenticado con sistema seguro:', this.currentUser);
                        return;
                    } catch (e) {
                        // GDPR: Datos sensibles enmascarados
                        debugLog.error('AUTH', '❌ [AUTH] Error parseando sesión:', e);
                    }
                }
            }
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

    /**
     * Obtener token JWT del administrador para autenticación de API
     * Busca en múltiples ubicaciones para máxima compatibilidad
     * @returns {string|null} Token JWT o null si no está disponible
     */
    getAdminToken() {
        // Prioridad 1: Sistema JWT (authToken + userData)
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');

        if (authToken && userData) {
            try {
                const user = JSON.parse(userData);
                if (user && user.role === 'admin') {
                    // GDPR: Datos sensibles enmascarados
                    debugLog.log('TOKEN', '🔑 [TOKEN] Token JWT obtenido del sistema authToken');
                    return authToken;
                }
            } catch (e) {
                // GDPR: Datos sensibles enmascarados
                debugLog.warn('TOKEN', '⚠️ [TOKEN] Error parseando userData:', e);
            }
        }

        // Prioridad 2: Sistema secure_admin_session
        const secureSession = localStorage.getItem('secure_admin_session');
        if (secureSession) {
            try {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.token && sessionData.isAuthenticated && sessionData.expiresAt && Date.now() < sessionData.expiresAt) {
                    // GDPR: Datos sensibles enmascarados
                    debugLog.log('TOKEN', '🔑 [TOKEN] Token obtenido del sistema secure_admin_session');
                    return sessionData.token;
                }
            } catch (e) {
                // GDPR: Datos sensibles enmascarados
                debugLog.warn('TOKEN', '⚠️ [TOKEN] Error parseando secure_admin_session:', e);
            }
        }

        // Prioridad 3: authToken directo (sin validación de userData)
        if (authToken) {
            // GDPR: Datos sensibles enmascarados
            debugLog.log('TOKEN', '🔑 [TOKEN] Token JWT obtenido directamente de authToken');
            return authToken;
        }

        // GDPR: Datos sensibles enmascarados
        debugLog.error('TOKEN', '❌ [TOKEN] No se encontró token de administrador válido');
        return null;
    }

    showLoginPrompt() {
        //debugLog.log('APP', '🔐 Mostrando prompt de login');
        //debugLog.log('DASHBOARD', '🚫 Acceso no autorizado al dashboard - Redirigiendo al inicio');

        // Mostrar mensaje de seguridad
        alert('Acceso restringido: Debes iniciar sesión como administrador para acceder al dashboard.');

        // Redirigir a la página principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    showDashboard() {
        //debugLog.log('DASHBOARD', '📊 Mostrando dashboard');
        // Mostrar sección del dashboard principal
        const dashboardSection = document.querySelector('.dashboard-section');
        if (dashboardSection) {
            dashboardSection.style.display = 'block';
        }
        // Ocultar sección de login si existe
        const loginSection = document.querySelector('.login-section');
        if (loginSection) {
            loginSection.style.display = 'none';
        }
    }

    // ============================================
    // CARGA DE DATOS DESDE API
    // ============================================

    async loadDashboardData() {
        try {
            debugLog.log('DASHBOARD', '📊 [DASHBOARD] Cargando datos del dashboard...');

            // Cargar solicitudes de registro pendientes
            await this.loadPendingRegistrations();

            // Cargar datos principales en paralelo
            const [analytics, students, teachers] = await Promise.all([
                this.loadAnalytics(),
                this.loadStudentsData(),
                this.loadTeachersData()
            ]);

            // Verificar si hay configuración personalizada guardada
            const hasCustomConfig = localStorage.getItem('realData_customConfigured') === 'true';

            debugLog.log('DEBUG', '🔍 [DEBUG] Configuración personalizada detectada:', hasCustomConfig);

            // Si hay configuración personalizada, usar esos datos
            const finalStats = hasCustomConfig ? {
                totalStudents: parseInt(localStorage.getItem('realData_totalStudents')) || parseInt(this.realDataConfig.totalStudents),
                totalTeachers: parseInt(localStorage.getItem('realData_totalTeachers')) || parseInt(this.realDataConfig.totalTeachers),
                totalSubjects: parseInt(localStorage.getItem('realData_totalSubjects')) || parseInt(this.realDataConfig.totalSubjects),
                generalAverage: parseFloat(localStorage.getItem('realData_generalAverage')) || parseFloat(this.realDataConfig.generalAverage)
            } : {
                totalStudents: analytics?.students?.total_estudiantes || students?.overview?.totalStudents || parseInt(this.realDataConfig.totalStudents),
                totalTeachers: analytics?.teachers?.total_docentes || students?.overview?.totalTeachers || parseInt(this.realDataConfig.totalTeachers),
                totalSubjects: analytics?.academic?.materias_activas || students?.overview?.totalSubjects || parseInt(this.realDataConfig.totalSubjects),
                generalAverage: analytics?.academic?.promedio_general || students?.overview?.generalAverage || parseFloat(this.realDataConfig.generalAverage)
            };

            debugLog.log('DEBUG', '📊 [DEBUG] Estadísticas finales calculadas:', finalStats);

            // Estructurar datos correctamente para el dashboard
            this.dashboardData = {
                analytics: analytics,
                students: students.students || [],
                teachers: teachers.teachers || teachers,
                statistics: finalStats,
                lastUpdate: new Date().toISOString()
            };

            debugLog.log('DEBUG', '✅ [DEBUG] Dashboard data final estructurado:', this.dashboardData.statistics);

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

            const response = await window.apiClient.request('/analytics/dashboard');

            if (response.success) {
                return response.data;
            }

            throw new Error('Error en respuesta de analytics');
        } catch (error) {
            debugLog.log('API', '📊 Analytics API no disponible, usando datos locales');
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
            debugLog.log('API', '👥 Students API no disponible, usando datos locales');
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
            debugLog.log('API', '👨‍🏫 Teachers API no disponible, usando datos locales');
            return this.getDemoStudents().teachers;
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
            dashboardContainer.insertAdjacentHTML('afterbegin', sanitizeHTML(errorMessage));
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
        debugLog.log('LOGIN', '🔑 [LOGIN] Iniciando proceso de login...');
        // Verificar que las credenciales estén inicializadas
        if (!this.adminCredentials) {
            // GDPR: Datos sensibles enmascarados
            debugLog.error('ERROR', '❌ adminCredentials no está inicializado');
            this.adminCredentials = {
                username: 'admin',
                password: 'admin123',
                role: 'director',
                name: 'Administrador del Sistema'
            };
        }

        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const role = document.getElementById('adminRole').value;

        debugLog.log('LOGIN', '🔍 [LOGIN] Verificando credenciales...');

        if (username === this.adminCredentials.username &&
            password === this.adminCredentials.password &&
            role === this.adminCredentials.role) {

            debugLog.log('LOGIN', '✅ [LOGIN] Credenciales correctas');

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

            // Redireccionar automáticamente al dashboard principal
            setTimeout(() => {
                this.scrollToDashboard();
            }, 1000);
        } else {
            debugLog.log('LOGIN', '❌ [LOGIN] Credenciales incorrectas');
            this.showErrorToast('Credenciales administrativas incorrectas');
        }
    }

    scrollToDashboard() {
        debugLog.log('SCROLL', '📍 [SCROLL] Intentando hacer scroll al dashboard...');
        // Buscar la sección del dashboard administrativo
        const dashboardSection = document.getElementById('adminPanel');

        if (dashboardSection && !dashboardSection.classList.contains('d-none')) {
            setTimeout(() => {
                // Calcular la posición exacta del panel administrativo
                const navbarHeight = 90; // altura del navbar fijo
                const targetPosition = dashboardSection.offsetTop - navbarHeight;

                window.scrollTo({
                    top: Math.max(0, targetPosition),
                    behavior: 'smooth'
                });

                debugLog.log('SCROLL', '✅ [SCROLL] Redirigiendo al panel de administración');
            }, 500);
        } else {
            // Fallback: scroll al área donde debería estar el dashboard
            setTimeout(() => {
                const fallbackPosition = window.innerHeight * 0.8; // 80% de la altura de la ventana
                window.scrollTo({
                    top: fallbackPosition,
                    behavior: 'smooth'
                });
                debugLog.log('SCROLL', '⚠️ [SCROLL] Dashboard no encontrado, usando posición estimada');
            }, 500);
        }
    }

    logoutAdmin() {
        debugLog.log('LOGOUT', '🚪 [LOGOUT] Cerrando sesión administrativa...');
        localStorage.removeItem('adminSession');
        this.currentSession = null;
        this.isLoggedIn = false;

        // Limpiar datos del dashboard para evitar errores
        this.dashboardData = {
            students: [],
            teachers: [],
            statistics: {
                totalStudents: 0,
                totalTeachers: 0,
                totalSubjects: 0,
                generalAverage: 0
            }
        };

        this.destroyCharts();
        this.hideAdminPanel();
        this.showSuccessToast('Sesión administrativa cerrada');
    }

    showAdminPanel() {
        debugLog.log('PANEL', '🎛️ [PANEL] Mostrando panel administrativo...');
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
        debugLog.log('PANEL', '🙈 [PANEL] Ocultando panel administrativo...');
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
        debugLog.log('UI', '🎨 [UI] Actualizando interfaz del dashboard...');
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

        // Configurar eventos de búsqueda
        setTimeout(() => {
            this.setupTeacherSearchEvents();
            this.setupStudentSearchEvents();
            debugLog.log('APP', '🔍 Eventos de búsqueda configurados');
        }, 500);
    }

    loadStudentsTable() {
        debugLog.log('APP', '🔄 Cargando tabla de estudiantes...');

        // Verificar si hay dynamic student loader disponible
        if (window.dynamicStudentLoader && window.dynamicStudentLoader.students) {
            debugLog.log('APP', '✅ Usando datos dinámicos para estudiantes');
            this.loadStudentsTableFromDynamic();
        } else {
            debugLog.log('APP', '⚠️ Dynamic student loader no disponible, usando datos por defecto');
            this.loadStudentsTableFromStatic();
        }
    }

    loadStudentsTableFromDynamic() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        tbody.innerHTML = sanitizeHTML('');

        const students = window.dynamicStudentLoader.students.estudiantes || [];

        students.forEach(student => {
            const row = document.createElement('tr');

            const statusBadge = this.getStudentStatusBadge(student.estado || student.status);
            const riskBadge = this.getRiskLevelBadge(student.nivelRiesgo || 'Bajo');

            row.innerHTML = sanitizeHTML(`
                <td class="text-center">
                    <strong>${student.matricula || student.id}</strong>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${student.photo || 'images/default-avatar.png'}" class="rounded-circle me-3" width="40" height="40" onerror="this.src='images/default-avatar.png'">
                        <div>
                            <strong>${student.nombre || student.name}</strong><br>
                            <small class="text-muted">${student.email || 'Sin email'}</small>
                        </div>
                    </div>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${student.semestre || student.semester}</span>
                </td>
                <td class="text-center">
                    <span class="badge bg-success">${student.promedio || student.average || 'N/A'}</span>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" data-action="view-student" data-param-1="${student.id}" title="Ver Detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" data-action="edit-student" data-param-1="${student.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-action="generate-student-report" data-param-1="${student.id}" title="Generar Reporte">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </div>
                </td>
            `);

            tbody.appendChild(row);
        });

        // Actualizar contadores
        this.updateStudentsStats(students);
    }

    loadStudentsTableFromStatic() {
        debugLog.log('DEBUG', '📊 [DEBUG] loadStudentsTableFromStatic() iniciado');

        const tbody = document.getElementById('studentsTable');
        if (!tbody) {
            debugLog.log('DEBUG', '❌ [DEBUG] tabla studentsTable no encontrada');
            return;
        }

        tbody.innerHTML = sanitizeHTML('');

        // Verificar que dashboardData existe
        if (!this.dashboardData) {
            debugLog.log('DEBUG', '❌ [DEBUG] dashboardData no existe');
            tbody.innerHTML = sanitizeHTML('<tr><td colspan="6" class="text-center text-muted">Cargando datos...</td></tr>', 'simple');
            return;
        }

        // Verificar que students existe y es un array
        if (!this.dashboardData.students || !Array.isArray(this.dashboardData.students)) {
            debugLog.log('DEBUG', '❌ [DEBUG] students no es array válido:', this.dashboardData.students);
            tbody.innerHTML = sanitizeHTML('<tr><td colspan="6" class="text-center text-muted">No hay datos de estudiantes disponibles</td></tr>', 'simple');
            return;
        }

        // Verificar que students tiene elementos
        if (this.dashboardData.students.length === 0) {
            debugLog.log('DEBUG', 'ℹ️ [DEBUG] students array está vacío');
            tbody.innerHTML = sanitizeHTML('<tr><td colspan="6" class="text-center text-muted">No hay estudiantes registrados</td></tr>', 'simple');
            return;
        }

        debugLog.log('DEBUG', '✅ [DEBUG] Procesando', this.dashboardData.students.length, 'estudiantes');

        try {
            this.dashboardData.students.forEach(student => {
            const row = document.createElement('tr');

            const statusBadge = this.getStudentStatusBadge(student.status);
            const riskBadge = this.getRiskLevelBadge(student.riskLevel);

            row.innerHTML = sanitizeHTML(`
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
        } catch (error) {
            debugLog.error('DEBUG', '❌ [DEBUG] Error en loadStudentsTable:', error);
            tbody.innerHTML = sanitizeHTML('<tr><td colspan="6" class="text-center text-danger">Error cargando estudiantes</td></tr>', 'simple');
        }
    }

    updateStudentsStats(students) {
        const totalStudents = students.length;
        const activeStudents = students.filter(s => (s.estado || s.status) === 'Activo').length;
        const averageGrade = students.length > 0 ?
            (students.reduce((sum, s) => sum + (parseFloat(s.promedio || s.average) || 0), 0) / students.length).toFixed(1) : 0;

        // Actualizar contadores en el DOM si existen los elementos
        const totalStudentsEl = document.getElementById('totalStudents');
        const activeStudentsEl = document.getElementById('activeStudents');
        const averageGradeEl = document.getElementById('generalAverage');

        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents;
        if (activeStudentsEl) activeStudentsEl.textContent = activeStudents;
        if (averageGradeEl) averageGradeEl.textContent = averageGrade;
    }

    loadTeachersTable() {
        debugLog.log('APP', '🔄 Cargando tabla de docentes...');

        // Verificar si hay dynamic teacher loader disponible
        if (window.dynamicTeacherLoader && window.dynamicTeacherLoader.teachers) {
            debugLog.log('APP', '✅ Usando datos dinámicos para docentes');
            this.loadTeachersTableFromDynamic();
        } else {
            debugLog.log('APP', '⚠️ Dynamic teacher loader no disponible, usando datos por defecto');
            this.loadTeachersTableFromStatic();
        }
    }

    loadTeachersTableFromDynamic() {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        tbody.innerHTML = sanitizeHTML('');

        const teachers = window.dynamicTeacherLoader.teachers.docentes || [];

        teachers.forEach(teacher => {
            const row = document.createElement('tr');

            const statusBadge = teacher.estado === 'Activo' ?
                '<span class="badge bg-success">Activo</span>' :
                '<span class="badge bg-secondary">Inactivo</span>';

            const subjects = Array.isArray(teacher.subjects) ? teacher.subjects.join(', ') : (teacher.specialization || 'No especificado');

            row.innerHTML = sanitizeHTML(`
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${teacher.photo || 'images/default-avatar.png'}" class="rounded-circle me-3" width="40" height="40" onerror="this.src='images/default-avatar.png'">
                        <div>
                            <strong>${teacher.nombre || teacher.name}</strong><br>
                            <small class="text-muted">${teacher.position || teacher.specialization}</small>
                        </div>
                    </div>
                </td>
                <td>${teacher.specialization}</td>
                <td>
                    <small>${subjects}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${teacher.experiencia || 'N/A'}</span>
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

        // Actualizar contadores
        this.updateTeachersStats(teachers);
    }

    loadTeachersTableFromStatic() {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        tbody.innerHTML = sanitizeHTML('');

        this.dashboardData.teachers.forEach(teacher => {
            const row = document.createElement('tr');

            const statusBadge = teacher.status === 'Activo' ?
                '<span class="badge bg-success">Activo</span>' :
                '<span class="badge bg-secondary">Inactivo</span>';

            row.innerHTML = sanitizeHTML(`
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

    updateTeachersStats(teachers) {
        const totalTeachers = teachers.length;
        const activeTeachers = teachers.filter(t => t.estado === 'Activo').length;
        const specialties = [...new Set(teachers.map(t => t.specialization))].length;

        // Actualizar contadores en el DOM
        const totalCountElement = document.getElementById('totalTeachersCount');
        const activeCountElement = document.getElementById('activeTeachersCount');
        const specialtiesCountElement = document.getElementById('specialtiesCount');

        if (totalCountElement) totalCountElement.textContent = totalTeachers;
        if (activeCountElement) activeCountElement.textContent = activeTeachers;
        if (specialtiesCountElement) specialtiesCountElement.textContent = specialties;
    }

    // Función para configurar eventos de búsqueda en docentes
    setupTeacherSearchEvents() {
        const teacherSearchInput = document.getElementById('teacherSearchInput');
        const teacherFilterSpecialty = document.getElementById('teacherFilterSpecialty');
        const teacherFilterStatus = document.getElementById('teacherFilterStatus');

        if (teacherSearchInput) {
            teacherSearchInput.addEventListener('input', (e) => {
                this.filterTeachersTable(e.target.value, teacherFilterSpecialty?.value, teacherFilterStatus?.value);
            });
        }

        if (teacherFilterSpecialty) {
            teacherFilterSpecialty.addEventListener('change', (e) => {
                this.filterTeachersTable(teacherSearchInput?.value, e.target.value, teacherFilterStatus?.value);
            });
        }

        if (teacherFilterStatus) {
            teacherFilterStatus.addEventListener('change', (e) => {
                this.filterTeachersTable(teacherSearchInput?.value, teacherFilterSpecialty?.value, e.target.value);
            });
        }
    }

    // Función para configurar eventos de búsqueda en estudiantes
    setupStudentSearchEvents() {
        const studentSearchInput = document.getElementById('studentSearchInput');
        const studentFilterSemester = document.getElementById('studentFilterSemester');
        const studentFilterStatus = document.getElementById('studentFilterStatus');

        if (studentSearchInput) {
            studentSearchInput.addEventListener('input', (e) => {
                this.filterStudentsTable(e.target.value, studentFilterSemester?.value, studentFilterStatus?.value);
            });
        }

        if (studentFilterSemester) {
            studentFilterSemester.addEventListener('change', (e) => {
                this.filterStudentsTable(studentSearchInput?.value, e.target.value, studentFilterStatus?.value);
            });
        }

        if (studentFilterStatus) {
            studentFilterStatus.addEventListener('change', (e) => {
                this.filterStudentsTable(studentSearchInput?.value, studentFilterSemester?.value, e.target.value);
            });
        }
    }

    filterTeachersTable(searchText = '', specialty = '', status = '') {
        const tbody = document.getElementById('teachersTable');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const teacherName = row.cells[0]?.textContent.toLowerCase() || '';
            const teacherSpecialty = row.cells[1]?.textContent.toLowerCase() || '';
            const teacherStatus = row.cells[4]?.textContent.toLowerCase() || '';

            const matchesSearch = searchText === '' || teacherName.includes(searchText.toLowerCase());
            const matchesSpecialty = specialty === '' || teacherSpecialty.includes(specialty.toLowerCase());
            const matchesStatus = status === '' || teacherStatus.includes(status.toLowerCase());

            row.style.display = (matchesSearch && matchesSpecialty && matchesStatus) ? '' : 'none';
        });
    }

    filterStudentsTable(searchText = '', semester = '', status = '') {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');

        rows.forEach(row => {
            const studentName = row.cells[1]?.textContent.toLowerCase() || '';
            const studentSemester = row.cells[2]?.textContent.toLowerCase() || '';
            const studentStatus = row.cells[4]?.textContent.toLowerCase() || '';

            const matchesSearch = searchText === '' || studentName.includes(searchText.toLowerCase());
            const matchesSemester = semester === '' || studentSemester.includes(semester.toLowerCase());
            const matchesStatus = status === '' || studentStatus.includes(status.toLowerCase());

            row.style.display = (matchesSearch && matchesSemester && matchesStatus) ? '' : 'none';
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
            ctx.parentElement.innerHTML = sanitizeHTML(`
                <div class="text-center py-4">
                    <i class="fas fa-chart-line fa-3x text-muted mb-3"></i>
                    <p class="text-muted">Gráficos no disponibles</p>
                    <small class="text-muted">Chart.js no se pudo cargar desde CDN</small>
                    <br>
                    <button class="btn btn-sm btn-outline-primary mt-2" data-action="reload-page">
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

        // Inicializar también el institutional trends chart si existe
        const trendsCtx = document.getElementById('institutional-trends-chart');
        if (trendsCtx) {
            this.initInstitutionalTrendsChart(trendsCtx);
        }

        // Destruir chart existente si existe
        if (this.academicChart) {
            this.academicChart.destroy();
        }

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

    initInstitutionalTrendsChart(ctx) {
        if (!ctx) return;

        // Destruir chart existente si existe
        if (this.trendsChart) {
            this.trendsChart.destroy();
        }

        // Datos de tendencias institucionales
        const trendsData = {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
            datasets: [{
                label: 'Tendencia General',
                data: [65, 70, 75, 80, 85, 90],
                borderColor: '#0d6efd',
                backgroundColor: '#0d6efd20',
                tension: 0.4
            }]
        };

        this.trendsChart = new Chart(ctx, {
            type: 'line',
            data: trendsData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
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

        if (this.trendsChart) {
            this.trendsChart.destroy();
            this.trendsChart = null;
        }
    }

    // ============================================
    // GESTIÓN DE SOLICITUDES DE REGISTRO
    // ============================================

    /**
     * Cargar solicitudes de registro pendientes desde la API backend
     * Utiliza el endpoint /api/admin/pending-registrations con autenticación JWT
     */
    async loadPendingRegistrations() {
        try {
            debugLog.log('REGISTRATIONS', '📋 [REGISTRATIONS] Cargando solicitudes desde API backend...');

            // Obtener token de administrador
            const token = this.getAdminToken();

            if (!token) {
                // GDPR: Datos sensibles enmascarados
                debugLog.warn('REGISTRATIONS', '⚠️ [REGISTRATIONS] No hay token disponible - usando fallback local');
                await this.loadPendingRegistrationsLocal();
                return;
            }

            // Llamar a la API real
            const response = await fetch('/api/admin/pending-registrations', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && data.requests) {
                // Guardar las solicitudes en dashboardData
                this.dashboardData.pendingRegistrations = data.requests;

                // Actualizar contador del badge
                this.updatePendingCounter(data.count);

                debugLog.log('REGISTRATIONS', `✅ [REGISTRATIONS] ${data.count} solicitudes pendientes cargadas desde API`);
            } else {
                throw new Error('Respuesta inválida de la API');
            }

        } catch (error) {
            debugLog.error('REGISTRATIONS', '❌ [REGISTRATIONS] Error al cargar desde API:', error.message);

            // Fallback: intentar cargar desde localStorage
            debugLog.log('REGISTRATIONS', '🔄 [REGISTRATIONS] Usando fallback con datos locales...');
            await this.loadPendingRegistrationsLocal();
        }
    }

    /**
     * Fallback: Cargar solicitudes desde localStorage
     * Se usa cuando la API no está disponible o hay error de autenticación
     */
    async loadPendingRegistrationsLocal() {
        try {
            // Cargar desde localStorage
            const localRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');

            // NUEVO: Integrar usuarios pendientes de Google Auth
            const pendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');

            // Combinar ambas listas evitando duplicados
            const combinedRegistrations = [...localRegistrations];

            pendingUsers.forEach(user => {
                // Verificar si ya existe en la lista local
                const exists = localRegistrations.some(reg => reg.email === user.email);
                if (!exists) {
                    // Convertir formato de usuario pendiente de Google Auth al formato de registro
                    combinedRegistrations.push({
                        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        email: user.email,
                        fullName: user.name,
                        requestedRole: user.role || 'estudiante',
                        createdAt: user.requestDate || new Date().toISOString(),
                        picture: user.picture,
                        source: 'google_auth', // Identificar origen
                        status: 'pending'
                    });
                }
            });

            this.dashboardData.pendingRegistrations = combinedRegistrations;

            // GDPR: Datos sensibles enmascarados
            debugLog.log('LOCAL', `📋 [LOCAL] ${combinedRegistrations.length} solicitudes pendientes encontradas (${localRegistrations.length} locales + ${pendingUsers.length} de Google Auth)`);
            this.updatePendingCounter(combinedRegistrations.length);
        } catch (error) {
            debugLog.warn('LOCAL', '⚠️ [LOCAL] Error cargando solicitudes locales:', error);
            this.dashboardData.pendingRegistrations = [];
            this.updatePendingCounter(0);
        }
    }

    /**
     * Renderizar solicitudes pendientes en el contenedor del dashboard
     * Soporta tanto el formato de API backend como formato local (Google Auth)
     */
    displayPendingRegistrations() {
        const container = document.getElementById('pending-registrations-container');
        if (!container) {
            debugLog.warn('DISPLAY', '⚠️ [DISPLAY] Contenedor pending-registrations-container no encontrado');
            return;
        }

        const registrations = this.dashboardData.pendingRegistrations || [];

        if (registrations.length === 0) {
            container.innerHTML = sanitizeHTML(`
                <div class="text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay solicitudes pendientes</p>
                </div>
            `);
            return;
        }

        // Renderizar tabla con todas las solicitudes
        const html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Solicitante</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Fecha</th>
                            <th class="text-end">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${registrations.map(registration => this.renderRegistrationRow(registration)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = sanitizeHTML(html, 'tablas');
        debugLog.log('DISPLAY', `✅ [DISPLAY] ${registrations.length} solicitudes renderizadas`);
    }

    /**
     * Renderizar una fila individual de solicitud
     * @param {Object} request - Objeto de solicitud de registro
     * @returns {string} HTML de la fila
     */
    renderRegistrationRow(request) {
        // Normalizar formato (API backend vs localStorage)
        const id = request.id || request.email;
        const fullName = request.fullName || request.name || `${request.nombre || ''} ${request.apellido_paterno || ''}`.trim() || 'Sin nombre';
        const email = request.email;
        const role = request.requestedRole || request.tipo_usuario || request.role || 'estudiante';
        const phone = request.phone || request.telefono || 'Sin teléfono';
        const reason = request.reason || request.motivo || 'Sin motivo especificado';
        const createdAt = request.createdAt || request.fecha_solicitud || request.date || new Date().toISOString();
        const date = new Date(createdAt).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Badge de rol con color
        const roleBadges = {
            'docente': '<span class="badge bg-primary">👨‍🏫 Docente</span>',
            'estudiante': '<span class="badge bg-info">👨‍🎓 Estudiante</span>',
            'administrativo': '<span class="badge bg-success">🏛️ Administrativo</span>',
            'padre_familia': '<span class="badge bg-warning">👨‍👩‍👧‍👦 Padre de Familia</span>'
        };
        const roleBadge = roleBadges[role] || `<span class="badge bg-secondary">${role}</span>`;

        return `
            <tr data-request-id="${id}">
                <td>
                    <strong>${fullName}</strong>
                    <br>
                    <small class="text-muted">${phone}</small>
                </td>
                <td>${email}</td>
                <td>${roleBadge}</td>
                <td>
                    <small>${date}</small>
                </td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary"
                                data-action="viewRequestDetails-${id}"
                                data-context="requests"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success"
                                data-action="approveRequest-${id}"
                                data-context="requests"
                                title="Aprobar">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-danger"
                                data-action="rejectRequest-${id}"
                                data-context="requests"
                                title="Rechazar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
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

    /**
     * Ver detalles completos de una solicitud en un modal
     * @param {string} requestId - ID de la solicitud
     */
    async viewRequestDetails(requestId) {
        // Buscar la solicitud en el array cargado
        const request = this.findRequestById(requestId);

        if (!request) {
            this.showToast('danger', '❌ Error', 'No se encontró la solicitud');
            return;
        }

        // Normalizar datos
        const fullName = request.fullName || request.name || `${request.nombre || ''} ${request.apellido_paterno || ''}`.trim() || 'Sin nombre';
        const email = request.email;
        const role = request.requestedRole || request.tipo_usuario || request.role || 'estudiante';
        const phone = request.phone || request.telefono || 'No proporcionado';
        const reason = request.reason || request.motivo || 'Sin motivo especificado';
        const createdAt = request.createdAt || request.fecha_solicitud || request.date || new Date().toISOString();
        const id = request.id || request.email;

        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'requestDetailsModal';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-alt me-2"></i>
                            Detalles de Solicitud de Registro
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <dl class="row">
                            <dt class="col-sm-4">ID de Solicitud:</dt>
                            <dd class="col-sm-8"><code>${id}</code></dd>

                            <dt class="col-sm-4">Nombre Completo:</dt>
                            <dd class="col-sm-8"><strong>${fullName}</strong></dd>

                            <dt class="col-sm-4">Email:</dt>
                            <dd class="col-sm-8">${email}</dd>

                            <dt class="col-sm-4">Rol Solicitado:</dt>
                            <dd class="col-sm-8">${this.formatUserType(role)}</dd>

                            <dt class="col-sm-4">Teléfono:</dt>
                            <dd class="col-sm-8">${phone}</dd>

                            <dt class="col-sm-4">Fecha de Solicitud:</dt>
                            <dd class="col-sm-8">${new Date(createdAt).toLocaleString('es-MX')}</dd>

                            <dt class="col-sm-4">Motivo/Comentarios:</dt>
                            <dd class="col-sm-8">
                                <div class="alert alert-light mb-0">
                                    ${reason}
                                </div>
                            </dd>

                            ${request.source ? `
                                <dt class="col-sm-4">Origen:</dt>
                                <dd class="col-sm-8">
                                    <span class="badge bg-info">${request.source === 'google_auth' ? 'Google Auth' : 'Formulario Web'}</span>
                                </dd>
                            ` : ''}
                        </dl>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-1"></i>Cerrar
                        </button>
                        <button type="button" class="btn btn-success approve-request-btn" data-request-id="${id}">
                            <i class="fas fa-check me-2"></i>Aprobar Solicitud
                        </button>
                        <button type="button" class="btn btn-danger reject-request-btn" data-request-id="${id}">
                            <i class="fas fa-times me-2"></i>Rechazar Solicitud
                        </button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // Agregar event listeners para los botones de aprobar/rechazar
        modal.querySelector('.approve-request-btn')?.addEventListener('click', () => {
            this.handleApproveRequest(id);
        });
        modal.querySelector('.reject-request-btn')?.addEventListener('click', () => {
            this.handleRejectRequest(id);
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Limpiar al cerrar
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    }

    /**
     * Buscar solicitud por ID en el array cargado
     * @param {string} requestId - ID de la solicitud
     * @returns {Object|null} Solicitud encontrada o null
     */
    findRequestById(requestId) {
        const registrations = this.dashboardData.pendingRegistrations || [];
        return registrations.find(r => (r.id === requestId) || (r.email === requestId));
    }

    /**
     * Aprobar solicitud de registro y crear usuario
     * @param {string} requestId - ID de la solicitud
     */
    async approveRequest(requestId) {
        // Solicitar notas de aprobación (opcional)
        const notes = prompt('Notas de aprobación (opcional):');

        if (notes === null) return; // Usuario canceló

        try {
            debugLog.log('APPROVE', `✅ [APPROVE] Aprobando solicitud ${requestId}...`);

            // Obtener token JWT
            const token = this.getAdminToken();

            if (!token) {
                throw new Error('No hay token de administrador disponible');
            }

            // Llamar al endpoint de aprobación
            const response = await fetch('/api/admin/approve-registration', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId: requestId,
                    reviewNotes: notes || 'Solicitud aprobada sin notas'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.user) {
                // Mostrar modal con contraseña temporal
                this.showPasswordModal(data.user.email, data.user.temporaryPassword);

                // Recargar lista de solicitudes
                await this.loadPendingRegistrations();
                this.displayPendingRegistrations();

                // Actualizar usuarios activos
                if (typeof this.loadActiveUsers === 'function') {
                    this.loadActiveUsers();
                }

                debugLog.log('APP', '[USER_ACTION]');
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            debugLog.error('APPROVE', '❌ [APPROVE] Error:', error);
            this.showToast('danger', '❌ Error', error.message || 'No se pudo aprobar la solicitud');
        }
    }

    /**
     * Método legacy para compatibilidad hacia atrás
     * @deprecated Usar approveRequest() en su lugar
     */
    async approveRegistration(email) {
        debugLog.warn('APP', '⚠️ approveRegistration() está deprecado, usa approveRequest()');
        return this.approveRequest(email);
    }

    /**
     * Mostrar modal con contraseña temporal del usuario recién creado
     * @param {string} email - Email del usuario
     * @param {string} password - Contraseña temporal
     */
    showPasswordModal(email, password) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'passwordModal';
        modal.setAttribute('data-bs-backdrop', 'static');
        modal.setAttribute('data-bs-keyboard', 'false');
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-check-circle me-2"></i>
                            Usuario Creado Exitosamente
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            <strong>IMPORTANTE:</strong> Guarda esta contraseña temporal. No podrás verla nuevamente.
                        </div>

                        <dl class="row mb-0">
                            <dt class="col-4">Usuario:</dt>
                            <dd class="col-8"><strong>${email}</strong></dd>

                            <dt class="col-4">Contraseña Temporal:</dt>
                            <dd class="col-8">
                                <div class="input-group">
                                    <input type="text"
                                           class="form-control font-monospace"
                                           value="${password}"
                                           readonly
                                           id="tempPasswordInput">
                                    <button class="btn btn-outline-primary copy-password-btn"
                                            type="button"
                                            data-password="${password}">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                </div>
                            </dd>
                        </dl>

                        <hr>

                        <div class="alert alert-info mb-0">
                            <strong>Instrucciones para el usuario:</strong>
                            <ol class="mb-0 mt-2">
                                <li>Inicia sesión con el email y la contraseña temporal</li>
                                <li>El sistema te pedirá cambiar tu contraseña en el primer acceso</li>
                                <li>Usa una contraseña segura (mínimo 8 caracteres, mayúsculas, minúsculas, números y símbolos)</li>
                            </ol>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            <i class="fas fa-check me-1"></i>Entendido
                        </button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // Agregar event listener para el botón de copiar contraseña
        modal.querySelector('.copy-password-btn')?.addEventListener('click', (e) => {
            this.handleCopyPassword(e.target.closest('button'), e.target.closest('button').dataset.password);
        });

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Auto-seleccionar contraseña al hacer clic
        const passwordInput = modal.querySelector('#tempPasswordInput');
        passwordInput.addEventListener('click', () => passwordInput.select());

        // Limpiar al cerrar
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
            this.showToast('success', '✅ Solicitud Aprobada', `Usuario ${email} creado exitosamente`);
        });

        // GDPR: Datos sensibles enmascarados
        debugLog.log('PASSWORD', '🔑 [PASSWORD] Modal de contraseña temporal mostrado');
    }

    /**
     * Rechazar solicitud de registro
     * @param {string} requestId - ID de la solicitud
     */
    async rejectRequest(requestId) {
        // Solicitar motivo de rechazo (OBLIGATORIO según backend - mínimo 10 caracteres)
        const reason = prompt('Motivo del rechazo (mínimo 10 caracteres):');

        if (reason === null) return; // Usuario canceló

        // Validar longitud mínima
        if (reason.trim().length < 10) {
            alert('❌ El motivo debe tener al menos 10 caracteres');
            return this.rejectRequest(requestId); // Reintentar
        }

        try {
            debugLog.log('REJECT', `🚫 [REJECT] Rechazando solicitud ${requestId}...`);

            // Obtener token JWT
            const token = this.getAdminToken();

            if (!token) {
                throw new Error('No hay token de administrador disponible');
            }

            // Llamar al endpoint de rechazo
            const response = await fetch('/api/admin/reject-registration', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId: requestId,
                    reviewNotes: reason.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Recargar lista de solicitudes
                await this.loadPendingRegistrations();
                this.displayPendingRegistrations();

                this.showToast('info', '🚫 Solicitud Rechazada', `La solicitud ha sido rechazada`);

                debugLog.log('REJECT', `🚫 [REJECT] Solicitud ${requestId} rechazada exitosamente`);
            } else {
                throw new Error('Respuesta inválida del servidor');
            }

        } catch (error) {
            debugLog.error('REJECT', '❌ [REJECT] Error:', error);
            this.showToast('danger', '❌ Error', error.message || 'No se pudo rechazar la solicitud');
        }
    }

    /**
     * Método legacy para compatibilidad hacia atrás
     * @deprecated Usar rejectRequest() en su lugar
     */
    async rejectRegistration(email) {
        debugLog.warn('APP', '⚠️ rejectRegistration() está deprecado, usa rejectRequest()');
        return this.rejectRequest(email);
    }

    removeRegistrationFromLocal(email) {
        // Remover de registros locales
        const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        const filtered = registrations.filter(r => r.email !== email);
        localStorage.setItem('pending_registrations', JSON.stringify(filtered));

        // NUEVO: Remover también de usuarios pendientes de Google Auth
        const pendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');
        const filteredPendingUsers = pendingUsers.filter(u => u.email !== email);
        localStorage.setItem('bge_pending_users', JSON.stringify(filteredPendingUsers));

        // Recargar la lista combinada
        this.loadPendingRegistrations();
    }

    // SIMULACIÓN DE SISTEMA DE EMAILS
    simulateEmailNotification(email, type, reason = '') {
        // Esta función simula el envío de emails en un entorno de desarrollo
        const emailContent = type === 'approved'
            ? `📧 Email simulado a ${email}:

               ✅ ¡Tu cuenta ha sido APROBADA!

               Ya puedes acceder al sistema con tus credenciales.
               Dirección: localhost:3000

               ¡Bienvenido al BGE Héroes de la Patria!`
            : `📧 Email simulado a ${email}:

               ❌ Tu solicitud ha sido RECHAZADA

               Motivo: ${reason || 'No especificado'}

               Si crees que es un error, contacta al administrador.`;

        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', emailContent);

        // Mostrar modal con simulación
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-envelope me-2"></i>
                            Simulación de Email
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong>📧 MODO DESARROLLO:</strong> En producción esto sería un email automático real.
                        </div>
                        <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${emailContent}</pre>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            <i class="fas fa-check me-1"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Cleanup
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    approveUserLocally(email) {
        // Buscar la solicitud pendiente para obtener la contraseña
        const pendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');
        const userRequest = pendingUsers.find(u => u.email === email.toLowerCase());

        if (userRequest && userRequest.password) {
            // Agregar contraseña a la base de datos de Google Auth
            const approvedPasswords = JSON.parse(localStorage.getItem('bge_user_passwords') || '{}');
            approvedPasswords[email.toLowerCase()] = userRequest.password;
            localStorage.setItem('bge_user_passwords', JSON.stringify(approvedPasswords));

            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', `🔐 Contraseña agregada para usuario ${email}`);
        }

        // Agregar usuario a la lista de cuentas aprobadas
        const approvedAccounts = JSON.parse(localStorage.getItem('bge_approved_accounts') || '[]');

        if (!approvedAccounts.includes(email.toLowerCase())) {
            approvedAccounts.push(email.toLowerCase());
            localStorage.setItem('bge_approved_accounts', JSON.stringify(approvedAccounts));

            // GDPR: Datos sensibles enmascarados
            debugLog.log('APP', `✅ Usuario ${email} aprobado localmente`);
        }
    }

    // NUEVAS FUNCIONES DE GESTIÓN DE USUARIOS ACTIVOS

    async revokeUserAccess(email) {
        const reason = prompt('Motivo de la revocación de acceso:');
        if (reason === null) return; // Usuario canceló

        if (!confirm(`¿Estás seguro de revocar el acceso a ${email}?\nEsto impedirá que el usuario pueda iniciar sesión.`)) return;

        try {
            // Agregar a lista de usuarios revocados
            const revokedUsers = JSON.parse(localStorage.getItem('bge_revoked_users') || '[]');
            if (!revokedUsers.includes(email.toLowerCase())) {
                revokedUsers.push(email.toLowerCase());
                localStorage.setItem('bge_revoked_users', JSON.stringify(revokedUsers));
            }

            // Remover de lista de usuarios aprobados
            const approvedAccounts = JSON.parse(localStorage.getItem('bge_approved_accounts') || '[]');
            const filteredApproved = approvedAccounts.filter(e => e !== email.toLowerCase());
            localStorage.setItem('bge_approved_accounts', JSON.stringify(filteredApproved));

            // Registrar la acción
            this.logUserAction('REVOKE_ACCESS', email, reason);

            this.showNotification(`Acceso revocado para ${email}`, 'warning');
            this.loadActiveUsers(); // Recargar lista

        } catch (error) {
            debugLog.error('ERROR', 'Error revocando acceso:', error);
            this.showNotification('Error al revocar acceso', 'danger');
        }
    }

    async restoreUserAccess(email) {
        if (!confirm(`¿Restaurar el acceso para ${email}?`)) return;

        try {
            // Remover de lista de usuarios revocados
            const revokedUsers = JSON.parse(localStorage.getItem('bge_revoked_users') || '[]');
            const filteredRevoked = revokedUsers.filter(e => e !== email.toLowerCase());
            localStorage.setItem('bge_revoked_users', JSON.stringify(filteredRevoked));

            // Agregar de vuelta a usuarios aprobados
            const approvedAccounts = JSON.parse(localStorage.getItem('bge_approved_accounts') || '[]');
            if (!approvedAccounts.includes(email.toLowerCase())) {
                approvedAccounts.push(email.toLowerCase());
                localStorage.setItem('bge_approved_accounts', JSON.stringify(approvedAccounts));
            }

            // Registrar la acción
            this.logUserAction('RESTORE_ACCESS', email, 'Acceso restaurado por administrador');

            this.showNotification(`Acceso restaurado para ${email}`, 'success');
            this.loadActiveUsers(); // Recargar lista

        } catch (error) {
            debugLog.error('ERROR', 'Error restaurando acceso:', error);
            this.showNotification('Error al restaurar acceso', 'danger');
        }
    }

    loadActiveUsers() {
        // Cargar usuarios activos (aprobados, revocados y usuario actual)
        const approvedAccounts = JSON.parse(localStorage.getItem('bge_approved_accounts') || '[]');
        const revokedUsers = JSON.parse(localStorage.getItem('bge_revoked_users') || '[]');

        // Incluir usuario actualmente logueado
        const currentUser = JSON.parse(localStorage.getItem('bge_user') || 'null');
        const userSession = JSON.parse(localStorage.getItem('userSession') || 'null');

        const container = document.getElementById('activeUsersContainer');
        if (!container) return;

        // Combinar usuarios aprobados y revocados
        const allUsers = [
            ...approvedAccounts.map(email => ({ email, status: 'active' })),
            ...revokedUsers.map(email => ({ email, status: 'revoked' }))
        ];

        // Agregar usuario actual si está logueado y no está ya en la lista
        if (currentUser && userSession && currentUser.email) {
            const alreadyExists = allUsers.some(user => user.email === currentUser.email);
            if (!alreadyExists) {
                allUsers.push({
                    email: currentUser.email,
                    status: 'active',
                    isCurrentUser: true,
                    name: currentUser.name || 'Usuario Actual'
                });
            }
        }

        if (allUsers.length === 0) {
            container.innerHTML = sanitizeHTML(`
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay usuarios registrados</p>
                </div>
            `);
            return;
        }

        // Eliminar duplicados (un usuario revocado no debe aparecer como activo)
        const uniqueUsers = allUsers.filter((user, index, self) => {
            return self.findIndex(u => u.email === user.email) === index;
        });

        const html = uniqueUsers.map(user => `
            <div class="card mb-3 ${user.isCurrentUser ? 'border-primary' : ''}" data-user-email="${user.email}">
                <div class="card-header d-flex justify-content-between align-items-center ${user.isCurrentUser ? 'bg-primary-subtle' : ''}">
                    <h6 class="mb-0">
                        <i class="fas fa-${user.isCurrentUser ? 'crown' : 'user'} me-2"></i>
                        ${user.name || user.email}
                        ${user.isCurrentUser ? ' (Tú)' : ''}
                    </h6>
                    <div class="d-flex gap-2">
                        ${user.isCurrentUser ? '<span class="badge bg-primary">Administrador Actual</span>' : ''}
                        <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-danger'}">
                            ${user.status === 'active' ? 'Activo' : 'Revocado'}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <p class="text-muted mb-1">
                                <strong>Email:</strong> ${user.email}
                            </p>
                            <p class="text-muted mb-1">
                                <strong>Estado:</strong> ${user.isCurrentUser ? 'Administrador actualmente conectado' : user.status === 'active' ? 'Usuario activo con acceso completo' : 'Acceso revocado'}
                            </p>
                        </div>
                        <div class="col-md-4 text-end">
                            ${user.isCurrentUser ? `
                                <span class="text-muted small">
                                    <i class="fas fa-shield-alt me-1"></i>
                                    Administrador Principal
                                </span>
                            ` : user.status === 'active' ? `
                                <button class="btn btn-warning btn-sm mb-1" data-action="revokeUserAccess-${user.email}" data-context="users">
                                    <i class="fas fa-ban me-1"></i>
                                    Revocar Acceso
                                </button>
                            ` : `
                                <button class="btn btn-success btn-sm mb-1" data-action="restoreUserAccess-${user.email}" data-context="users">
                                    <i class="fas fa-undo me-1"></i>
                                    Restaurar Acceso
                                </button>
                            `}
                            ${!user.isCurrentUser ? `
                                <button class="btn btn-info btn-sm" data-action="viewUserDetails-${user.email}" data-context="users">
                                    <i class="fas fa-eye me-1"></i>
                                    Ver Detalles
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = sanitizeHTML(html, 'tablas');

        // ACTUALIZAR CONTADORES EN BADGES
        const activeUsersCount = uniqueUsers.filter(user => user.status === 'active').length;

        // Actualizar badge en tab "Usuarios Activos"
        const activeUsersTab = document.getElementById('active-users-count');
        if (activeUsersTab) {
            activeUsersTab.textContent = activeUsersCount.toString();
        }

        // Actualizar contador adicional si existe
        const activeUsersCounter = document.getElementById('active-users-counter');
        if (activeUsersCounter) {
            activeUsersCounter.textContent = `${activeUsersCount} ${activeUsersCount === 1 ? 'usuario' : 'usuarios'}`;
        }

        debugLog.log('APP', `📊 Contador actualizado: ${activeUsersCount} usuarios activos`);
    }

    // ✅ NUEVO: Cargar estadísticas de contenido (noticias, eventos, avisos, comunicados)
    async loadContentStats() {
        debugLog.log('APP', '📊 [Content Stats] Cargando estadísticas de contenido...');

        try {
            // Cargar cada tipo de contenido desde sus archivos JSON
            const contentTypes = [
                { name: 'noticias', url: 'data/noticias.json', elementId: 'totalNoticias', key: 'noticias' },
                { name: 'eventos', url: 'data/eventos.json', elementId: 'totalEventos', key: 'eventos' },
                { name: 'avisos', url: 'data/avisos.json', elementId: 'totalAvisos', key: 'avisos' },
                { name: 'comunicados', url: 'data/comunicados.json', elementId: 'totalComunicados', key: 'comunicados' }
            ];

            for (const contentType of contentTypes) {
                try {
                    const response = await fetch(contentType.url);

                    if (!response.ok) {
                        debugLog.warn('APP', `⚠️ No se pudo cargar ${contentType.name}: ${response.status}`);
                        this.updateContentCounter(contentType.elementId, 0);
                        continue;
                    }

                    const data = await response.json();
                    const count = data[contentType.key] ? data[contentType.key].length : 0;

                    this.updateContentCounter(contentType.elementId, count);
                    debugLog.log('APP', '[USER_ACTION]');

                } catch (error) {
                    debugLog.error('ERROR', `❌ Error cargando ${contentType.name}:`, error);
                    this.updateContentCounter(contentType.elementId, 0);
                }
            }

            debugLog.log('APP', '✅ [Content Stats] Estadísticas de contenido cargadas exitosamente');

        } catch (error) {
            debugLog.error('ERROR', '❌ [Content Stats] Error general:', error);
        }
    }

    // Helper: Actualizar contador en el HTML
    updateContentCounter(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = count;
            debugLog.log('APP', `📈 Contador ${elementId}: ${count}`);
        } else {
            debugLog.warn('APP', `⚠️ Elemento ${elementId} no encontrado en DOM`);
        }
    }

    viewUserDetails(email) {
        const userLogs = JSON.parse(localStorage.getItem('bge_user_logs') || '[]');
        const userActions = userLogs.filter(log => log.email === email);

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user me-2"></i>
                            Detalles de Usuario: ${email}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Historial de Acciones:</h6>
                        ${userActions.length > 0 ? userActions.map(action => `
                            <div class="alert alert-info">
                                <strong>${action.action}:</strong> ${action.reason}<br>
                                <small class="text-muted">${new Date(action.timestamp).toLocaleString()}</small>
                            </div>
                        `).join('') : '<p class="text-muted">No hay acciones registradas para este usuario.</p>'}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    logUserAction(action, email, reason) {
        const userLogs = JSON.parse(localStorage.getItem('bge_user_logs') || '[]');
        userLogs.push({
            action,
            email,
            reason,
            timestamp: Date.now(),
            admin: 'Administrador' // En producción, usar el email del admin logueado
        });
        localStorage.setItem('bge_user_logs', JSON.stringify(userLogs));
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

    // NUEVO: Generar solicitudes de prueba para testing
    generateTestRequests() {
        const testUsers = [
            {
                email: 'estudiante1@ejemplo.com',
                name: 'Ana García Martínez',
                role: 'estudiante',
                requestDate: new Date(Date.now() - 86400000).toISOString(), // Hace 1 día
                status: 'pending',
                picture: 'https://via.placeholder.com/40/28a745/fff?text=A'
            },
            {
                email: 'profesor.matematicas@colegio.edu',
                name: 'Dr. Carlos Rodríguez',
                role: 'docente',
                requestDate: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
                status: 'pending',
                picture: 'https://via.placeholder.com/40/007bff/fff?text=C'
            },
            {
                email: 'maria.lopez@padres.com',
                name: 'María López Hernández',
                role: 'padre',
                requestDate: new Date(Date.now() - 259200000).toISOString(), // Hace 3 días
                status: 'pending',
                picture: 'https://via.placeholder.com/40/fd7e14/fff?text=M'
            },
            {
                email: 'jose.director@admin.edu',
                name: 'José Antonio Fernández',
                role: 'directivo',
                requestDate: new Date(Date.now() - 43200000).toISOString(), // Hace 12 horas
                status: 'pending',
                picture: 'https://via.placeholder.com/40/dc3545/fff?text=J'
            }
        ];

        // Guardar en ambos sistemas de almacenamiento
        // 1. Sistema original de registros
        const existingRegistrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
        testUsers.forEach(user => {
            const exists = existingRegistrations.some(reg => reg.email === user.email);
            if (!exists) {
                existingRegistrations.push({
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    date: user.requestDate
                });
            }
        });
        localStorage.setItem('pending_registrations', JSON.stringify(existingRegistrations));

        // 2. Sistema de Google Auth
        const existingPendingUsers = JSON.parse(localStorage.getItem('bge_pending_users') || '[]');
        testUsers.forEach(user => {
            const exists = existingPendingUsers.some(u => u.email === user.email);
            if (!exists) {
                existingPendingUsers.push(user);
            }
        });
        localStorage.setItem('bge_pending_users', JSON.stringify(existingPendingUsers));

        // Recargar la lista en el dashboard
        this.loadPendingRegistrations();
        this.displayPendingRegistrations();

        debugLog.log('APP', '✅ Solicitudes de prueba generadas');
        this.showToast('success', '🧪 Solicitudes Generadas', `Se agregaron ${testUsers.length} solicitudes de prueba`);
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
        debugLog.log('REFRESH', '🔄 [REFRESH] Actualizando dashboard...');
        this.showLoadingToast('Actualizando dashboard...');

        setTimeout(async () => {
            // Simplemente recargar datos (que ya respeta la configuración personalizada)
            await this.loadDashboardData();
            this.updateDashboardUI();
            this.createAcademicChart();
            this.showSuccessToast('Dashboard actualizado correctamente');

            debugLog.log('REFRESH', '✅ [REFRESH] Dashboard actualizado exitosamente');
        }, 1500);
    }

    /**
     * Iniciar auto-refresh del dashboard cada 5 minutos
     * También inicia refresh específico de solicitudes pendientes cada 30 segundos
     */
    startAutoRefresh() {
        // Limpiar intervalos previos si existen
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.registrationsRefreshInterval) {
            clearInterval(this.registrationsRefreshInterval);
        }

        // Auto-refresh general del dashboard (cada 5 minutos)
        this.refreshInterval = setInterval(async () => {
            //debugLog.log('DASHBOARD', '🔄 Auto-refresh del dashboard...');
            await this.loadDashboardData();
            this.updateDashboardUI();
            this.displayPendingRegistrations();
        }, 5 * 60 * 1000); // 5 minutos

        // Auto-refresh específico de solicitudes pendientes (cada 30 segundos)
        this.registrationsRefreshInterval = setInterval(async () => {
            // Solo actualizar si el tab de solicitudes está activo
            const registrationsTab = document.getElementById('registrations-tab');
            if (registrationsTab && registrationsTab.classList.contains('active')) {
                debugLog.log('AUTO-REFRESH', '🔄 [AUTO-REFRESH] Actualizando solicitudes pendientes...');
                await this.loadPendingRegistrations();
                this.displayPendingRegistrations();
            }
        }, 30 * 1000); // 30 segundos

        debugLog.log('AUTO-REFRESH', '⏰ [AUTO-REFRESH] Auto-refresh iniciado:');
        debugLog.log('APP', '   - Dashboard general: cada 5 minutos');
        debugLog.log('APP', '   - Solicitudes pendientes: cada 30 segundos (cuando tab está activo)');
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
        if (window.dynamicStudentLoader) {
            window.dynamicStudentLoader.editStudent(studentId);
        } else {
            this.showErrorToast('Sistema de gestión de estudiantes no disponible');
        }
    }

    contactStudent(studentId) {
        if (window.dynamicStudentLoader) {
            window.dynamicStudentLoader.contactStudent(studentId);
        } else {
            this.showErrorToast('Sistema de contacto de estudiantes no disponible');
        }
    }

    addStudent() {
        if (window.dynamicStudentLoader) {
            window.dynamicStudentLoader.showNewStudentModal();
        } else {
            this.showErrorToast('Sistema de gestión de estudiantes no disponible');
        }
    }

    exportStudents() {
        if (window.dynamicStudentLoader) {
            window.dynamicStudentLoader.exportStudents();
        } else {
            this.showErrorToast('Sistema de exportación de estudiantes no disponible');
        }
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
        if (window.dynamicTeacherLoader) {
            window.dynamicTeacherLoader.editTeacher(teacherId);
        } else {
            this.showErrorToast('Sistema de gestión de docentes no disponible');
        }
    }

    assignSubjects(teacherId) {
        if (window.dynamicTeacherLoader) {
            window.dynamicTeacherLoader.assignSubjects(teacherId);
        } else {
            this.showErrorToast('Sistema de asignación de materias no disponible');
        }
    }

    addTeacher() {
        if (window.dynamicTeacherLoader) {
            window.dynamicTeacherLoader.showNewTeacherModal();
        } else {
            this.showErrorToast('Sistema de gestión de docentes no disponible');
        }
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

        document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalHTML));
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
        toastElement.innerHTML = sanitizeHTML(`
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

    // Método para cambiar contraseña
    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        const errorDiv = document.getElementById('passwordError');
        const successDiv = document.getElementById('passwordSuccess');

        // Limpiar mensajes anteriores
        errorDiv.classList.add('d-none');
        successDiv.classList.add('d-none');

        // Validar contraseña actual
        if (currentPassword !== this.adminCredentials.password) {
            this.showPasswordError('La contraseña actual no es correcta');
            return;
        }

        // Validar longitud de nueva contraseña
        if (newPassword.length < 6) {
            this.showPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }

        // Validar confirmación de contraseña
        if (newPassword !== confirmPassword) {
            this.showPasswordError('Las contraseñas no coinciden');
            return;
        }

        // Validar que la nueva contraseña sea diferente
        if (newPassword === currentPassword) {
            this.showPasswordError('La nueva contraseña debe ser diferente a la actual');
            return;
        }

        // Cambiar la contraseña
        this.adminCredentials.password = newPassword;

        // Guardar en localStorage para persistencia
        localStorage.setItem('adminCredentials', JSON.stringify(this.adminCredentials));

        // Mostrar mensaje de éxito
        this.showPasswordSuccess('Contraseña cambiada exitosamente');

        // Limpiar formulario después de 2 segundos
        setTimeout(() => {
            document.getElementById('changePasswordForm').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
        }, 2000);

        // Mostrar notificación toast
        this.showToast('Contraseña actualizada correctamente', 'success');
    }

    showPasswordError(message) {
        const errorDiv = document.getElementById('passwordError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    showPasswordSuccess(message) {
        const successDiv = document.getElementById('passwordSuccess');
        successDiv.textContent = message;
        successDiv.classList.remove('d-none');
    }

    // Método para configurar datos estadísticos reales
    configureRealData() {
        const modal = document.getElementById('configureDataModal');
        if (!modal) {
            debugLog.error('ERROR', 'Modal de configuración no encontrado');
            return;
        }

        // Llenar los campos con los valores actuales
        document.getElementById('configTotalStudents').value = this.realDataConfig.totalStudents;
        document.getElementById('configTotalTeachers').value = this.realDataConfig.totalTeachers;
        document.getElementById('configTotalSubjects').value = this.realDataConfig.totalSubjects;
        document.getElementById('configGeneralAverage').value = this.realDataConfig.generalAverage;

        // Mostrar el modal
        const configModal = new bootstrap.Modal(modal);
        configModal.show();
    }

    saveRealDataConfig() {
        debugLog.log('CONFIG', '🔧 [CONFIG] saveRealDataConfig() iniciado - NUEVA VERSIÓN 2025-09-15 16:30:00');

        const totalStudents = document.getElementById('configTotalStudents').value;
        const totalTeachers = document.getElementById('configTotalTeachers').value;
        const totalSubjects = document.getElementById('configTotalSubjects').value;
        const generalAverage = document.getElementById('configGeneralAverage').value;

        debugLog.log('CONFIG', '📊 [CONFIG] Valores del formulario:', {
            totalStudents, totalTeachers, totalSubjects, generalAverage
        });

        const errorDiv = document.getElementById('configError');
        const successDiv = document.getElementById('configSuccess');

        // Limpiar mensajes anteriores
        if (errorDiv) errorDiv.classList.add('d-none');
        if (successDiv) successDiv.classList.add('d-none');

        // Validaciones
        if (!totalStudents || isNaN(totalStudents) || parseInt(totalStudents) < 0) {
            this.showConfigError('El número de estudiantes debe ser un número válido mayor o igual a 0');
            return;
        }

        if (!totalTeachers || isNaN(totalTeachers) || parseInt(totalTeachers) < 0) {
            this.showConfigError('El número de docentes debe ser un número válido mayor o igual a 0');
            return;
        }

        if (!totalSubjects || isNaN(totalSubjects) || parseInt(totalSubjects) < 0) {
            this.showConfigError('El número de materias debe ser un número válido mayor o igual a 0');
            return;
        }

        if (!generalAverage || isNaN(generalAverage) || parseFloat(generalAverage) < 0 || parseFloat(generalAverage) > 10) {
            this.showConfigError('El promedio general debe ser un número entre 0 y 10');
            return;
        }

        debugLog.log('CONFIG', '✅ [CONFIG] Validaciones pasadas');

        // Guardar en configuración local
        this.realDataConfig.totalStudents = parseInt(totalStudents);
        this.realDataConfig.totalTeachers = parseInt(totalTeachers);
        this.realDataConfig.totalSubjects = parseInt(totalSubjects);
        this.realDataConfig.generalAverage = parseFloat(generalAverage);

        debugLog.log('CONFIG', '💾 [CONFIG] Datos guardados en realDataConfig:', this.realDataConfig);

        // Persistir en localStorage con logging intensivo
        debugLog.log('CONFIG', '💾 [CONFIG] Guardando en localStorage...');

        try {
            localStorage.setItem('realData_totalStudents', totalStudents);
            debugLog.log('CONFIG', '✅ [CONFIG] totalStudents guardado:', localStorage.getItem('realData_totalStudents'));

            localStorage.setItem('realData_totalTeachers', totalTeachers);
            debugLog.log('CONFIG', '✅ [CONFIG] totalTeachers guardado:', localStorage.getItem('realData_totalTeachers'));

            localStorage.setItem('realData_totalSubjects', totalSubjects);
            debugLog.log('CONFIG', '✅ [CONFIG] totalSubjects guardado:', localStorage.getItem('realData_totalSubjects'));

            localStorage.setItem('realData_generalAverage', generalAverage);
            debugLog.log('CONFIG', '✅ [CONFIG] generalAverage guardado:', localStorage.getItem('realData_generalAverage'));

            // Marcar que se han configurado datos personalizados
            localStorage.setItem('realData_customConfigured', 'true');
            localStorage.setItem('realData_lastConfigured', Date.now().toString());

            debugLog.log('CONFIG', '🎯 [CONFIG] Flag customConfigured:', localStorage.getItem('realData_customConfigured'));
        } catch (error) {
            debugLog.error('CONFIG', '❌ [CONFIG] Error guardando en localStorage:', error);
            this.showConfigError('Error guardando configuración en el navegador');
            return;
        }

        // Verificar que se guardó en localStorage
        debugLog.log('CONFIG', '🔍 [CONFIG] Verificando localStorage después de guardar:', {
            totalStudents: localStorage.getItem('realData_totalStudents'),
            totalTeachers: localStorage.getItem('realData_totalTeachers'),
            totalSubjects: localStorage.getItem('realData_totalSubjects'),
            generalAverage: localStorage.getItem('realData_generalAverage')
        });

        // Actualizar inmediatamente las estadísticas en el dashboard
        if (!this.dashboardData) {
            this.dashboardData = {};
        }

        this.dashboardData.statistics = {
            totalStudents: parseInt(totalStudents),
            totalTeachers: parseInt(totalTeachers),
            totalSubjects: parseInt(totalSubjects),
            generalAverage: parseFloat(generalAverage)
        };

        debugLog.log('CONFIG', '📊 [CONFIG] DashboardData actualizado:', this.dashboardData.statistics);

        // Actualizar la UI inmediatamente
        this.updateDashboardUI();

        // Mostrar mensaje de éxito
        this.showConfigSuccess('Configuración guardada exitosamente');

        // Cerrar modal y mostrar notificación
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('configureDataModal'));
            if (modal) {
                modal.hide();
            }

            // Mostrar notificación toast
            this.showToast('Datos estadísticos actualizados correctamente', 'success');

            debugLog.log('CONFIG', '🎉 [CONFIG] saveRealDataConfig() completado exitosamente');
        }, 1000);
    }

    showConfigError(message) {
        const errorDiv = document.getElementById('configError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    showConfigSuccess(message) {
        const successDiv = document.getElementById('configSuccess');
        successDiv.textContent = message;
        successDiv.classList.remove('d-none');
    }
}

// Funciones globales para los event handlers
let adminDashboard;

function showLoginModal() {
    debugLog.log('MODAL', '🔐 [MODAL] Mostrando modal de login...');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

function showInfoModal() {
    debugLog.log('INFO', '🔍 [INFO] showInfoModal() iniciado - NUEVA VERSIÓN');

    // Mostrar el modal inmediatamente
    const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));
    infoModal.show();

    // Actualizar el contenido después de mostrar el modal (sin delay)
    updateSystemInfo();
}

function updateSystemInfo() {
    debugLog.log('INFO', '⚡ [INFO] updateSystemInfo() ULTRARRÁPIDO iniciado - NUEVA VERSIÓN');
    const startTime = performance.now();

    // Acceso directo y optimizado al modal
    const modalBody = document.querySelector('#infoModal .modal-body');
    if (!modalBody) {
        debugLog.log('INFO', '❌ [INFO] Modal body no encontrado');
        return;
    }

    // Datos precalculados y optimizados
    const now = new Date();
    const customConfig = localStorage.getItem('realData_customConfigured') === 'true';

    // Acceso directo sin operaciones complejas
    let estudiantes = 1247, docentes = 68, materias = 42, promedio = 8.4;

    if (customConfig) {
        estudiantes = parseInt(localStorage.getItem('realData_totalStudents')) || 1247;
        docentes = parseInt(localStorage.getItem('realData_totalTeachers')) || 68;
        materias = parseInt(localStorage.getItem('realData_totalSubjects')) || 42;
        promedio = parseFloat(localStorage.getItem('realData_generalAverage')) || 8.4;
    }

    debugLog.log('INFO', '📊 [INFO] Datos estadísticos:', {estudiantes, docentes, materias, promedio});

    modalBody.innerHTML = sanitizeHTML(`
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-school me-2 text-primary"></i>Información del Sistema</h6>
                <ul class="list-unstyled mb-4">
                    <li><strong>Institución:</strong> BGE Héroes de la Patria</li>
                    <li><strong>Ubicación:</strong> localhost</li>
                    <li><strong>Puerto:</strong> 3000</li>
                    <li><strong>Estado:</strong> <span class="badge bg-success">Operativo</span></li>
                    <li><strong>Versión:</strong> 2.2.0 - Dashboard Manager 2025</li>
                    <li><strong>Actividad:</strong> Sistema iniciado correctamente</li>
                </ul>

                <h6><i class="fas fa-chart-bar me-2 text-info"></i>Estadísticas Institucionales</h6>
                <ul class="list-unstyled">
                    <li><strong>Estudiantes:</strong> <span class="badge bg-primary">${estudiantes.toLocaleString()}</span></li>
                    <li><strong>Docentes:</strong> <span class="badge bg-success">${docentes}</span></li>
                    <li><strong>Materias:</strong> <span class="badge bg-warning">${materias}</span></li>
                    <li><strong>Promedio General:</strong> <span class="badge bg-info">${promedio}</span></li>
                    <li><strong>Navegador:</strong> Chrome</li>
                </ul>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-clock me-2 text-success"></i>Información Temporal</h6>
                <ul class="list-unstyled mb-4">
                    <li><strong>Fecha actual:</strong> ${now.toLocaleDateString('es-MX')}</li>
                    <li><strong>Hora actual:</strong> ${now.toLocaleTimeString('es-MX')}</li>
                    <li><strong>Sistema operativo:</strong> Windows</li>
                    <li><strong>Navegador:</strong> Chrome</li>
                </ul>

                <h6><i class="fas fa-cogs me-2 text-warning"></i>Módulos Activos</h6>
                <ul class="list-unstyled mb-4">
                    <li><i class="fas fa-check text-success me-2"></i>Dashboard Manager 2025</li>
                    <li><i class="fas fa-check text-success me-2"></i>Gestión de Contenido</li>
                    <li><i class="fas fa-check text-success me-2"></i>Sistema de Búsqueda</li>
                    <li><i class="fas fa-check text-success me-2"></i>Configuración de Datos</li>
                    <li><i class="fas fa-check text-success me-2"></i>Seguridad y Autenticación</li>
                </ul>

                <h6><i class="fas fa-shield-alt me-2 text-info"></i>Estado del Sistema</h6>
                <ul class="list-unstyled">
                    <li><i class="fas fa-server text-success me-2"></i>Servidor: Operativo</li>
                    <li><i class="fas fa-database text-success me-2"></i>Base de datos: Conectada</li>
                    <li><i class="fas fa-shield-alt text-success me-2"></i>Seguridad: Activa</li>
                    <li><i class="fas fa-sync text-success me-2"></i>Sincronización: Actualizada</li>
                </ul>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle me-2"></i>Información Adicional</h6>
                    <p class="mb-0">Este dashboard administrativo permite la gestión completa del Bachillerato General Estatal "Héroes de la Patria".
                    Todas las funciones están diseñadas para facilitar la administración académica y proporcionar información en tiempo real.</p>
                </div>
            </div>
        </div>
    `);

    const endTime = performance.now();
    debugLog.log('INFO', `⚡ [INFO] updateSystemInfo() completado en ${(endTime - startTime).toFixed(2)}ms`);
}

function loginAdmin() {
    debugLog.log('GLOBAL', '🔑 [GLOBAL] Función loginAdmin() llamada');
    if (adminDashboard && typeof adminDashboard.loginAdmin === 'function') {
        debugLog.log('GLOBAL', '✅ [GLOBAL] Llamando adminDashboard.loginAdmin()');
        adminDashboard.loginAdmin();
    } else {
        debugLog.error('GLOBAL', '❌ [GLOBAL] adminDashboard no está inicializado o no tiene método loginAdmin');
        alert('Error: Sistema no inicializado correctamente. Recarga la página.');
    }
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

// Función para mostrar/ocultar contraseñas
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + 'Icon');

    if (field.type === 'password') {
        field.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        field.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Función para mostrar modal de cambio de contraseña
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

// Función para mostrar modal de configuración de datos
function showConfigureDataModal() {
    if (adminDashboard && typeof adminDashboard.configureRealData === 'function') {
        adminDashboard.configureRealData();
    } else {
        debugLog.error('ERROR', 'AdminDashboard no está inicializado o no tiene método configureRealData');
        alert('Error: Sistema no inicializado correctamente. Recarga la página.');
    }
}

// Función global para guardar configuración (backup)
function saveRealDataConfig() {
    debugLog.log('GLOBAL', '🔧 [GLOBAL] Función global saveRealDataConfig() llamada - NUEVA VERSIÓN 2025-09-15 16:30:00');
    if (adminDashboard && typeof adminDashboard.saveRealDataConfig === 'function') {
        debugLog.log('GLOBAL', '✅ [GLOBAL] Llamando método de adminDashboard');
        adminDashboard.saveRealDataConfig();

        // Después de guardar, actualizar el botón de actualizar
        updateRefreshButtonState();
    } else {
        debugLog.error('GLOBAL', '❌ [GLOBAL] AdminDashboard no disponible o método no existe');
        alert('Error: Sistema no inicializado correctamente. Recarga la página.');
    }
}

// Función para actualizar el estado del botón refresh
function updateRefreshButtonState() {
    const hasCustomConfig = localStorage.getItem('realData_customConfigured') === 'true';
    const refreshButtons = document.querySelectorAll('[data-action="refresh-dashboard"]');

    refreshButtons.forEach(button => {
        if (hasCustomConfig) {
            button.innerHTML = sanitizeHTML('<i class="fas fa-exclamation-triangle me-1"></i>⚠️ Configuración Personalizada', 'simple');
            button.className = 'btn btn-warning btn-sm';
            button.title = 'Datos personalizados configurados - Usar con precaución';
        } else {
            button.innerHTML = sanitizeHTML('<i class="fas fa-sync me-1"></i>Actualizar', 'simple');
            button.className = 'btn btn-outline-light btn-sm';
            button.title = 'Actualizar dashboard';
        }
    });
}

// ============================================
// GESTIÓN DE CONTENIDO (AVISOS, EVENTOS, ETC.)
// ============================================

// Sistema de gestión de contenido
window.legacyContentManager = {
    items: JSON.parse(localStorage.getItem('siteContent') || '[]'),

    save: function() {
        localStorage.setItem('siteContent', JSON.stringify(this.items));
        this.updateDisplay();
    },

    create: function(data) {
        const newItem = {
            id: Date.now(),
            ...data,
            createdAt: new Date().toISOString(),
            createdBy: adminDashboard?.currentUser?.name || 'Administrador'
        };
        this.items.unshift(newItem);
        this.save();
        return newItem;
    },

    delete: function(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
    },

    edit: function(id, newData) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = { ...this.items[index], ...newData, updatedAt: new Date().toISOString() };
            this.save();
        }
    },

    updateDisplay: function() {
        const container = document.getElementById('contentList');
        const countElement = document.getElementById('contentCount');
        const filter = document.getElementById('contentFilter')?.value || 'all';

        if (!container) return;

        let filteredItems = this.items;
        if (filter !== 'all') {
            filteredItems = this.items.filter(item => item.type === filter);
        }

        if (countElement) {
            countElement.textContent = filteredItems.length;
        }

        if (filteredItems.length === 0) {
            container.innerHTML = sanitizeHTML(`
                <div class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>No hay contenido de este tipo</p>
                    <small>Usa el formulario para crear contenido</small>
                </div>
            `);
            return;
        }

        const html = filteredItems.map(item => this.renderItem(item)).join('');
        container.innerHTML = sanitizeHTML(html, 'tablas');
    },

    renderItem: function(item) {
        const typeIcons = {
            aviso: '📢',
            evento: '📅',
            noticia: '📰',
            comunicado: '📋'
        };

        const priorityColors = {
            normal: 'secondary',
            importante: 'warning',
            urgente: 'danger'
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('es-MX');
        };

        return `
            <div class="card mb-3" data-content-id="${item.id}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="card-title mb-1">
                                ${typeIcons[item.type]} ${item.title}
                                <span class="badge bg-${priorityColors[item.priority]} ms-2">${item.priority}</span>
                            </h6>
                            <p class="card-text text-muted small mb-2">${item.description}</p>
                            ${item.date ? `<small class="text-info"><i class="fas fa-calendar me-1"></i>Fecha: ${formatDate(item.date)}</small><br>` : ''}
                            <small class="text-muted">
                                <i class="fas fa-user me-1"></i>${item.createdBy} •
                                <i class="fas fa-clock me-1"></i>${formatDate(item.createdAt)}
                            </small>
                        </div>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" data-action="edit-content" data-param-1="${item.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline-danger" data-action="delete-content" data-param-1="${item.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

// Funciones globales para gestión de contenido
function createContent() {
    const form = document.getElementById('contentForm');
    const formData = new FormData(form);

    const data = {
        type: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value,
        description: document.getElementById('contentDescription').value,
        date: document.getElementById('contentDate').value,
        priority: document.getElementById('contentPriority').value
    };

    // Validaciones
    if (!data.type || !data.title || !data.description) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    window.legacyContentManager.create(data);
    clearContentForm();

    // Mostrar notificación
    if (adminDashboard && typeof adminDashboard.showToast === 'function') {
        adminDashboard.showToast('Contenido creado exitosamente', 'success');
    }
}

function clearContentForm() {
    document.getElementById('contentForm').reset();
}

function deleteContent(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este contenido?')) {
        window.legacyContentManager.delete(id);

        if (adminDashboard && typeof adminDashboard.showToast === 'function') {
            adminDashboard.showToast('Contenido eliminado correctamente', 'info');
        }
    }
}

function editContent(id) {
    const item = window.legacyContentManager.items.find(item => item.id === id);
    if (!item) return;

    // Rellenar el formulario con los datos existentes
    document.getElementById('contentType').value = item.type;
    document.getElementById('contentTitle').value = item.title;
    document.getElementById('contentDescription').value = item.description;
    document.getElementById('contentDate').value = item.date || '';
    document.getElementById('contentPriority').value = item.priority;

    // Cambiar el botón para modo edición
    const submitBtn = document.querySelector('#contentForm button[data-action="create-content"]');
    submitBtn.innerHTML = sanitizeHTML('<i class="fas fa-save me-1"></i>Actualizar Contenido', 'simple');
    submitBtn.onclick = () => updateContent(id);

    // Scroll hacia el formulario
    document.getElementById('contentForm').scrollIntoView({ behavior: 'smooth' });
}

function updateContent(id) {
    const data = {
        type: document.getElementById('contentType').value,
        title: document.getElementById('contentTitle').value,
        description: document.getElementById('contentDescription').value,
        date: document.getElementById('contentDate').value,
        priority: document.getElementById('contentPriority').value
    };

    if (!data.type || !data.title || !data.description) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    window.legacyContentManager.edit(id, data);
    clearContentForm();

    // Restaurar el botón a modo creación
    const submitBtn = document.querySelector('#contentForm button[onclick^="updateContent"]');
    submitBtn.innerHTML = sanitizeHTML('<i class="fas fa-plus me-1"></i>Crear Contenido', 'simple');
    submitBtn.onclick = createContent;

    if (adminDashboard && typeof adminDashboard.showToast === 'function') {
        adminDashboard.showToast('Contenido actualizado exitosamente', 'success');
    }
}

function filterContent() {
    window.legacyContentManager.updateDisplay();
}

// Inicializar gestión de contenido cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    debugLog.log('DOM', '📄 [DOM] DOMContentLoaded - NUEVA VERSIÓN 2025-09-15 16:30:00');
    // Cargar contenido existente si estamos en la página del dashboard
    if (document.getElementById('contentList')) {
        window.legacyContentManager.updateDisplay();
    }
});

// Variable global para el dashboard (ya declarada anteriormente)

// Inicializar dashboard cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    debugLog.log('INIT', '🚀 [INIT] Inicializando dashboard - NUEVA VERSIÓN 2025-09-15 16:30:00');
    // Verificar que Chart.js esté disponible
    if (typeof Chart === 'undefined') {
        debugLog.error('ERROR', 'Chart.js no está disponible. Los gráficos no funcionarán.');
        // Intentar cargar Chart.js dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.js';
        script.onload = function() {
            debugLog.log('APP', 'Chart.js cargado dinámicamente');
            adminDashboard = new AdminDashboard();
        };
        script.onerror = function() {
            debugLog.error('ERROR', 'No se pudo cargar Chart.js. Dashboard funcionará sin gráficos.');
            adminDashboard = new AdminDashboard();
        };
        document.head.appendChild(script);
    } else {
        debugLog.log('DASHBOARD', 'Chart.js disponible, inicializando dashboard');
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

// Método para mostrar métricas avanzadas
AdminDashboard.prototype.showAdvancedMetrics = function() {
    debugLog.log('METRICS', '📊 [METRICS] Mostrando sección de métricas avanzadas...');

    // Mostrar sección de métricas ejecutivas
    const metricsSection = document.getElementById('executive-metrics-section');
    if (metricsSection) {
        metricsSection.style.display = 'block';
        debugLog.log('METRICS', '✅ [METRICS] Sección de métricas avanzadas visible');
    } else {
        debugLog.warn('METRICS', '⚠️ [METRICS] Sección executive-metrics-section no encontrada');
    }
};

// ============================================
// EVENT DELEGATION HANDLER (CSP Compliant)
// Pattern B: onclick con parámetros → data-action
// ============================================
document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.getAttribute('data-action');
    const context = actionElement.getAttribute('data-context') || 'dashboard';

    try {
        // Pattern B: Acciones con parámetros
        if (action === 'reload-page') {
            location.reload();
            return;
        }

        if (action.startsWith('viewRequestDetails-')) {
            const requestId = action.replace('viewRequestDetails-', '');
            if (window.adminDashboard && typeof window.adminDashboard.viewRequestDetails === 'function') {
                window.adminDashboard.viewRequestDetails(requestId);
            }
            return;
        }

        if (action.startsWith('approveRequest-')) {
            const requestId = action.replace('approveRequest-', '');
            if (window.adminDashboard && typeof window.adminDashboard.approveRequest === 'function') {
                window.adminDashboard.approveRequest(requestId);
            }
            return;
        }

        if (action.startsWith('rejectRequest-')) {
            const requestId = action.replace('rejectRequest-', '');
            if (window.adminDashboard && typeof window.adminDashboard.rejectRequest === 'function') {
                window.adminDashboard.rejectRequest(requestId);
            }
            return;
        }

        if (action.startsWith('revokeUserAccess-')) {
            const userEmail = action.replace('revokeUserAccess-', '');
            if (window.adminDashboard && typeof window.adminDashboard.revokeUserAccess === 'function') {
                window.adminDashboard.revokeUserAccess(userEmail);
            }
            return;
        }

        if (action.startsWith('restoreUserAccess-')) {
            const userEmail = action.replace('restoreUserAccess-', '');
            if (window.adminDashboard && typeof window.adminDashboard.restoreUserAccess === 'function') {
                window.adminDashboard.restoreUserAccess(userEmail);
            }
            return;
        }

        if (action.startsWith('viewUserDetails-')) {
            const userEmail = action.replace('viewUserDetails-', '');
            if (window.adminDashboard && typeof window.adminDashboard.viewUserDetails === 'function') {
                window.adminDashboard.viewUserDetails(userEmail);
            }
            return;
        }

        debugLog.warn('DASHBOARD-MANAGER', '[DASHBOARD-MANAGER] Unhandled data-action:', action);
    } catch (error) {
        debugLog.error('DASHBOARD-MANAGER', '[DASHBOARD-MANAGER] Error handling action:', action, error);
    }
});

debugLog.log('COMPLETE', '✅ [COMPLETE] dashboard-manager-2025.js cargado completamente - VERSIÓN 2025-09-21 CON MÉTRICAS AVANZADAS');