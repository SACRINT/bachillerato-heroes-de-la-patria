/**
 * GOOGLE CLASSROOM INTEGRATION - Sistema completo de integración con Google Classroom
 *
 * Este módulo permite la sincronización bidireccional entre el sistema BGE
 * y Google Classroom, incluyendo:
 * - Autenticación con Google API
 * - Sincronización de cursos y estudiantes
 * - Gestión de tareas y calificaciones
 * - Dashboard unificado profesor/estudiante
 */

class GoogleClassroomIntegration {
    constructor() {
        this.apiLoaded = false;
        this.signedIn = false;
        this.user = null;
        this.courses = [];
        this.assignments = [];

        // Configuración de Google API
        this.clientId = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
        this.apiKey = process.env.GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY';
        this.discoveryDocs = ['https://classroom.googleapis.com/$discovery/rest?version=v1'];
        this.scopes = [
            'https://www.googleapis.com/auth/classroom.courses',
            'https://www.googleapis.com/auth/classroom.coursework.students',
            'https://www.googleapis.com/auth/classroom.rosters',
            'https://www.googleapis.com/auth/classroom.profile.emails'
        ].join(' ');

        console.log('🎓 [GOOGLE-CLASSROOM] Inicializando integración...');

        this.init();
    }

    async init() {
        try {
            // Cargar Google API
            await this.loadGoogleAPI();

            // Configurar cliente
            await this.initializeGoogleAPI();

            console.log('✅ [GOOGLE-CLASSROOM] Integración inicializada correctamente');

            // Verificar si hay sesión activa
            this.checkSignInStatus();

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error durante inicialización:', error);
            this.showFallbackUI();
        }
    }

    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            // Verificar si ya está cargada
            if (window.gapi && window.gapi.load) {
                resolve();
                return;
            }

            // Cargar Google API dinámicamente
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                console.log('📚 [GOOGLE-CLASSROOM] Google API cargada');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Google API'));
            };

            document.head.appendChild(script);
        });
    }

    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.apiKey,
                        clientId: this.clientId,
                        discoveryDocs: this.discoveryDocs,
                        scope: this.scopes
                    });

                    this.apiLoaded = true;
                    console.log('🔐 [GOOGLE-CLASSROOM] Cliente Google API inicializado');

                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    checkSignInStatus() {
        if (!this.apiLoaded) return;

        const authInstance = gapi.auth2.getAuthInstance();
        this.signedIn = authInstance.isSignedIn.get();

        if (this.signedIn) {
            this.user = authInstance.currentUser.get();
            this.onSignInSuccess();
        } else {
            this.showSignInButton();
        }
    }

    async signIn() {
        if (!this.apiLoaded) {
            console.error('❌ [GOOGLE-CLASSROOM] Google API no está cargada');
            return false;
        }

        try {
            console.log('🔐 [GOOGLE-CLASSROOM] Iniciando proceso de autenticación...');

            const authInstance = gapi.auth2.getAuthInstance();
            const user = await authInstance.signIn();

            this.user = user;
            this.signedIn = true;

            console.log('✅ [GOOGLE-CLASSROOM] Autenticación exitosa');

            await this.onSignInSuccess();
            return true;

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error durante autenticación:', error);
            this.showAuthError(error);
            return false;
        }
    }

    async signOut() {
        if (!this.apiLoaded) return;

        try {
            const authInstance = gapi.auth2.getAuthInstance();
            await authInstance.signOut();

            this.signedIn = false;
            this.user = null;
            this.courses = [];
            this.assignments = [];

            console.log('👋 [GOOGLE-CLASSROOM] Sesión cerrada');

            this.showSignInButton();

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error al cerrar sesión:', error);
        }
    }

    async onSignInSuccess() {
        console.log('🎉 [GOOGLE-CLASSROOM] Usuario autenticado:', this.user.getBasicProfile().getName());

        // Obtener datos del usuario
        await this.loadUserProfile();

        // Cargar cursos
        await this.loadCourses();

        // Actualizar interfaz
        this.updateUI();

        // Sincronizar con sistema BGE
        await this.syncWithBGESystem();
    }

    async loadUserProfile() {
        const profile = this.user.getBasicProfile();

        const userInfo = {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            imageUrl: profile.getImageUrl(),
            role: 'teacher' // Se determinará automáticamente
        };

        console.log('👤 [GOOGLE-CLASSROOM] Perfil cargado:', userInfo);

        // Determinar rol (profesor o estudiante)
        await this.determineUserRole(userInfo);

        return userInfo;
    }

    async determineUserRole(userInfo) {
        try {
            // Intentar listar cursos como profesor
            const teacherCourses = await gapi.client.classroom.courses.list({
                teacherId: userInfo.id
            });

            if (teacherCourses.result.courses && teacherCourses.result.courses.length > 0) {
                userInfo.role = 'teacher';
                console.log('👨‍🏫 [GOOGLE-CLASSROOM] Usuario identificado como PROFESOR');
            } else {
                // Intentar como estudiante
                const studentCourses = await gapi.client.classroom.courses.list();
                userInfo.role = 'student';
                console.log('👨‍🎓 [GOOGLE-CLASSROOM] Usuario identificado como ESTUDIANTE');
            }

        } catch (error) {
            console.warn('⚠️ [GOOGLE-CLASSROOM] No se pudo determinar rol, asumiendo estudiante');
            userInfo.role = 'student';
        }

        this.userRole = userInfo.role;
    }

    async loadCourses() {
        if (!this.signedIn) return [];

        try {
            console.log('📚 [GOOGLE-CLASSROOM] Cargando cursos...');

            let response;

            if (this.userRole === 'teacher') {
                // Cargar cursos como profesor
                response = await gapi.client.classroom.courses.list({
                    teacherId: 'me',
                    courseStates: ['ACTIVE']
                });
            } else {
                // Cargar cursos como estudiante
                response = await gapi.client.classroom.courses.list({
                    studentId: 'me',
                    courseStates: ['ACTIVE']
                });
            }

            this.courses = response.result.courses || [];

            console.log(`📚 [GOOGLE-CLASSROOM] ${this.courses.length} cursos cargados`);

            // Cargar detalles adicionales para cada curso
            for (const course of this.courses) {
                await this.loadCourseDetails(course.id);
            }

            return this.courses;

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error cargando cursos:', error);
            return [];
        }
    }

    async loadCourseDetails(courseId) {
        try {
            // Cargar estudiantes del curso
            const studentsResponse = await gapi.client.classroom.courses.students.list({
                courseId: courseId
            });

            // Cargar tareas del curso
            const assignmentsResponse = await gapi.client.classroom.courses.courseWork.list({
                courseId: courseId
            });

            const course = this.courses.find(c => c.id === courseId);
            if (course) {
                course.students = studentsResponse.result.students || [];
                course.assignments = assignmentsResponse.result.courseWork || [];
            }

        } catch (error) {
            console.warn(`⚠️ [GOOGLE-CLASSROOM] Error cargando detalles del curso ${courseId}:`, error);
        }
    }

    async loadAssignments(courseId) {
        if (!this.signedIn) return [];

        try {
            console.log(`📝 [GOOGLE-CLASSROOM] Cargando tareas del curso ${courseId}...`);

            const response = await gapi.client.classroom.courses.courseWork.list({
                courseId: courseId,
                orderBy: 'dueDate desc'
            });

            const assignments = response.result.courseWork || [];

            // Cargar calificaciones si es profesor
            if (this.userRole === 'teacher') {
                for (const assignment of assignments) {
                    await this.loadAssignmentGrades(courseId, assignment.id);
                }
            }

            console.log(`📝 [GOOGLE-CLASSROOM] ${assignments.length} tareas cargadas`);

            return assignments;

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error cargando tareas:', error);
            return [];
        }
    }

    async loadAssignmentGrades(courseId, assignmentId) {
        try {
            const response = await gapi.client.classroom.courses.courseWork.studentSubmissions.list({
                courseId: courseId,
                courseWorkId: assignmentId
            });

            return response.result.studentSubmissions || [];

        } catch (error) {
            console.warn('⚠️ [GOOGLE-CLASSROOM] Error cargando calificaciones:', error);
            return [];
        }
    }

    async createAssignment(courseId, assignmentData) {
        if (!this.signedIn || this.userRole !== 'teacher') {
            console.error('❌ [GOOGLE-CLASSROOM] Solo los profesores pueden crear tareas');
            return null;
        }

        try {
            console.log('📝 [GOOGLE-CLASSROOM] Creando nueva tarea...');

            const response = await gapi.client.classroom.courses.courseWork.create({
                courseId: courseId,
                resource: {
                    title: assignmentData.title,
                    description: assignmentData.description,
                    materials: assignmentData.materials || [],
                    state: 'PUBLISHED',
                    workType: 'ASSIGNMENT',
                    dueDate: assignmentData.dueDate,
                    maxPoints: assignmentData.maxPoints || 100
                }
            });

            console.log('✅ [GOOGLE-CLASSROOM] Tarea creada exitosamente');

            return response.result;

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error creando tarea:', error);
            return null;
        }
    }

    async submitAssignment(courseId, assignmentId, submissionData) {
        if (!this.signedIn) {
            console.error('❌ [GOOGLE-CLASSROOM] Usuario no autenticado');
            return null;
        }

        try {
            console.log('📤 [GOOGLE-CLASSROOM] Enviando tarea...');

            const response = await gapi.client.classroom.courses.courseWork.studentSubmissions.patch({
                courseId: courseId,
                courseWorkId: assignmentId,
                id: submissionData.submissionId,
                updateMask: 'assignedGrade,draftGrade',
                resource: submissionData
            });

            console.log('✅ [GOOGLE-CLASSROOM] Tarea enviada exitosamente');

            return response.result;

        } catch (error) {
            console.error('❌ [GOOGLE-CLASSROOM] Error enviando tarea:', error);
            return null;
        }
    }

    async syncWithBGESystem() {
        console.log('🔄 [GOOGLE-CLASSROOM] Sincronizando con sistema BGE...');

        try {
            // Enviar datos a backend BGE
            const syncData = {
                user: this.user ? this.user.getBasicProfile() : null,
                courses: this.courses,
                timestamp: new Date().toISOString()
            };

            const response = await fetch('/api/google-classroom/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(syncData)
            });

            if (response.ok) {
                console.log('✅ [GOOGLE-CLASSROOM] Sincronización con BGE completada');
            } else {
                console.warn('⚠️ [GOOGLE-CLASSROOM] Sincronización con BGE falló - modo offline');
                this.enableOfflineMode();
            }

        } catch (error) {
            console.warn('⚠️ [GOOGLE-CLASSROOM] Error de sincronización, activando modo offline:', error);
            this.enableOfflineMode();
        }
    }

    enableOfflineMode() {
        console.log('📴 [GOOGLE-CLASSROOM] Modo offline activado');

        // Guardar datos localmente
        const offlineData = {
            user: this.user ? this.user.getBasicProfile() : null,
            courses: this.courses,
            lastSync: new Date().toISOString()
        };

        localStorage.setItem('bge-classroom-offline', JSON.stringify(offlineData));

        // Mostrar indicador de modo offline
        this.showOfflineIndicator();
    }

    // Métodos de interfaz de usuario
    showSignInButton() {
        const container = document.getElementById('google-classroom-auth') ||
                         document.querySelector('.google-classroom-container');

        if (container) {
            container.innerHTML = `
                <div class="google-signin-container text-center p-4">
                    <h5><i class="fab fa-google-classroom"></i> Conectar con Google Classroom</h5>
                    <p class="text-muted">Conecta tu cuenta de Google para sincronizar cursos y tareas</p>
                    <button class="btn btn-danger" onclick="googleClassroom.signIn()">
                        <i class="fab fa-google"></i> Iniciar sesión con Google
                    </button>
                </div>
            `;
        }
    }

    updateUI() {
        const container = document.getElementById('google-classroom-auth') ||
                         document.querySelector('.google-classroom-container');

        if (container) {
            const profile = this.user.getBasicProfile();

            container.innerHTML = `
                <div class="google-classroom-dashboard">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="d-flex align-items-center">
                            <img src="${profile.getImageUrl()}" alt="Profile" class="rounded-circle me-2" style="width: 40px; height: 40px;">
                            <div>
                                <strong>${profile.getName()}</strong>
                                <small class="text-muted d-block">${profile.getEmail()}</small>
                            </div>
                        </div>
                        <button class="btn btn-outline-secondary btn-sm" onclick="googleClassroom.signOut()">
                            Cerrar sesión
                        </button>
                    </div>

                    <div class="courses-section">
                        <h6><i class="fas fa-book"></i> Mis Cursos (${this.courses.length})</h6>
                        <div class="row" id="courses-grid">
                            ${this.renderCoursesGrid()}
                        </div>
                    </div>
                </div>
            `;
        }

        // Actualizar otros elementos de la UI
        this.updateNavigationMenu();
        this.updateDashboardStats();
    }

    renderCoursesGrid() {
        if (this.courses.length === 0) {
            return '<div class="col-12"><p class="text-muted text-center">No hay cursos disponibles</p></div>';
        }

        return this.courses.map(course => `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card h-100 course-card" data-course-id="${course.id}">
                    <div class="card-body">
                        <h6 class="card-title">${course.name}</h6>
                        <p class="card-text text-muted small">${course.description || 'Sin descripción'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                ${course.students ? course.students.length : 0} estudiantes
                            </small>
                            <button class="btn btn-primary btn-sm" onclick="googleClassroom.viewCourse('${course.id}')">
                                Ver curso
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewCourse(courseId) {
        const course = this.courses.find(c => c.id === courseId);
        if (!course) return;

        console.log(`📚 [GOOGLE-CLASSROOM] Visualizando curso: ${course.name}`);

        // Abrir modal del curso o navegar a página dedicada
        this.showCourseModal(course);
    }

    showCourseModal(course) {
        const modalHtml = `
            <div class="modal fade" id="courseModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${course.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6>Información del Curso</h6>
                                    <p>${course.description || 'Sin descripción disponible'}</p>
                                    <p><strong>Estudiantes:</strong> ${course.students ? course.students.length : 0}</p>
                                    <p><strong>Tareas:</strong> ${course.assignments ? course.assignments.length : 0}</p>
                                </div>
                                <div class="col-md-6">
                                    <h6>Tareas Recientes</h6>
                                    <div id="course-assignments">
                                        ${this.renderCourseAssignments(course.assignments || [])}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.open('${course.alternateLink}', '_blank')">
                                Abrir en Google Classroom
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el DOM
        const existingModal = document.getElementById('courseModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('courseModal'));
        modal.show();
    }

    renderCourseAssignments(assignments) {
        if (assignments.length === 0) {
            return '<p class="text-muted">No hay tareas disponibles</p>';
        }

        return assignments.slice(0, 5).map(assignment => `
            <div class="mb-2 p-2 border rounded">
                <strong>${assignment.title}</strong>
                <small class="text-muted d-block">
                    ${assignment.dueDate ? new Date(assignment.dueDate.year, assignment.dueDate.month-1, assignment.dueDate.day).toLocaleDateString() : 'Sin fecha límite'}
                </small>
            </div>
        `).join('');
    }

    showAuthError(error) {
        const container = document.getElementById('google-classroom-auth') ||
                         document.querySelector('.google-classroom-container');

        if (container) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <h6><i class="fas fa-exclamation-triangle"></i> Error de Autenticación</h6>
                    <p>No se pudo conectar con Google Classroom. ${error.error || error.message || 'Error desconocido'}</p>
                    <button class="btn btn-primary btn-sm" onclick="googleClassroom.signIn()">
                        Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }

    showFallbackUI() {
        const container = document.getElementById('google-classroom-auth') ||
                         document.querySelector('.google-classroom-container');

        if (container) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <h6><i class="fas fa-info-circle"></i> Integración Google Classroom</h6>
                    <p>La integración con Google Classroom no está disponible en este momento.
                       Las funciones básicas del sistema BGE siguen funcionando normalmente.</p>
                </div>
            `;
        }
    }

    showOfflineIndicator() {
        // Agregar indicador visual de modo offline
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'alert alert-warning position-fixed bottom-0 end-0 m-3';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash"></i> Modo offline - Los datos se sincronizarán cuando se restablezca la conexión
        `;

        document.body.appendChild(indicator);

        // Remover después de 5 segundos
        setTimeout(() => {
            const existingIndicator = document.getElementById('offline-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }
        }, 5000);
    }

    updateNavigationMenu() {
        // Agregar enlace a Google Classroom en el menú de navegación
        const navMenu = document.querySelector('.navbar-nav') || document.querySelector('nav ul');
        if (navMenu && !document.getElementById('classroom-nav-item')) {
            const classroomItem = document.createElement('li');
            classroomItem.id = 'classroom-nav-item';
            classroomItem.className = 'nav-item';
            classroomItem.innerHTML = `
                <a class="nav-link" href="#" onclick="googleClassroom.showDashboard()">
                    <i class="fab fa-google-classroom"></i> Classroom
                </a>
            `;

            navMenu.appendChild(classroomItem);
        }
    }

    updateDashboardStats() {
        // Actualizar estadísticas en el dashboard principal
        const statsContainer = document.querySelector('.dashboard-stats') ||
                              document.querySelector('.stats-cards');

        if (statsContainer && this.courses.length > 0) {
            const totalAssignments = this.courses.reduce((total, course) =>
                total + (course.assignments ? course.assignments.length : 0), 0);

            const classroomStats = document.createElement('div');
            classroomStats.className = 'col-md-6 col-lg-3';
            classroomStats.innerHTML = `
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h5 class="card-title">Google Classroom</h5>
                                <h3>${this.courses.length} cursos</h3>
                                <p class="card-text">${totalAssignments} tareas totales</p>
                            </div>
                            <div class="align-self-center">
                                <i class="fab fa-google-classroom fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            statsContainer.appendChild(classroomStats);
        }
    }

    showDashboard() {
        // Mostrar dashboard completo de Google Classroom
        console.log('📊 [GOOGLE-CLASSROOM] Mostrando dashboard');

        // Navegar a página dedicada o mostrar modal con dashboard completo
        // Por ahora, simplemente hacer scroll al contenedor principal
        const container = document.getElementById('google-classroom-auth') ||
                         document.querySelector('.google-classroom-container');

        if (container) {
            container.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Método público para diagnóstico
    getStatus() {
        return {
            apiLoaded: this.apiLoaded,
            signedIn: this.signedIn,
            userRole: this.userRole,
            coursesCount: this.courses.length,
            user: this.user ? this.user.getBasicProfile().getName() : null
        };
    }
}

// Inicialización automática
let googleClassroom;

function initGoogleClassroom() {
    if (!googleClassroom) {
        googleClassroom = new GoogleClassroomIntegration();
        window.googleClassroom = googleClassroom; // Exponer globalmente
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGoogleClassroom);
} else {
    initGoogleClassroom();
}

console.log('✅ [GOOGLE-CLASSROOM] Sistema de integración cargado');

// Exponer clase para uso global
window.GoogleClassroomIntegration = GoogleClassroomIntegration;