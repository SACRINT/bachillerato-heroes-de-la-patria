/**
 * STUDENT MODULE - Módulo de Gestión de Estudiantes
 *
 * Propósito: Gestionar operaciones CRUD de estudiantes
 * Comunicación: 100% via Event Bus (0 dependencias directas)
 *
 * Eventos Emitidos:
 *   - students.loaded
 *   - students.created
 *   - students.updated
 *   - students.deleted
 *   - students.error
 *
 * Eventos Escuchados:
 *   - dashboard.initialized
 *   - students.load
 *   - students.create
 *   - students.update
 *   - students.delete
 *
 * Versión: 1.0.0
 * Fecha: 21 Noviembre 2025
 * Parte de: SEMANA 1 - Refactorización Admin Dashboard
 */

class StudentModule {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.students = [];
        this.isLoading = false;
        this.apiEndpoint = '/api/students';

        console.log('[STUDENT-MODULE] 📚 Student Module creado');
    }

    /**
     * Inicializar módulo
     */
    async init() {
        console.log('[STUDENT-MODULE] 🚀 Inicializando...');

        // Suscribirse a eventos
        this.subscribeToEvents();

        // Cargar estudiantes inicialmente
        await this.loadStudents();

        console.log('[STUDENT-MODULE] ✅ Inicializado');
    }

    /**
     * Suscribirse a eventos del Event Bus
     */
    subscribeToEvents() {
        // Dashboard inicializado → Cargar estudiantes
        this.eventBus.on('dashboard.initialized', () => {
            console.log('[STUDENT-MODULE] 🔔 Dashboard inicializado, cargando estudiantes...');
            this.loadStudents();
        });

        // Solicitud de carga manual
        this.eventBus.on('students.load', () => {
            this.loadStudents();
        });

        // Crear estudiante
        this.eventBus.on('students.create', async (event) => {
            await this.createStudent(event.data);
        });

        // Actualizar estudiante
        this.eventBus.on('students.update', async (event) => {
            await this.updateStudent(event.data.id, event.data.updates);
        });

        // Eliminar estudiante
        this.eventBus.on('students.delete', async (event) => {
            await this.deleteStudent(event.data.id);
        });

        console.log('[STUDENT-MODULE] 🎧 Event listeners configurados');
    }

    /**
     * Cargar estudiantes desde API
     */
    async loadStudents() {
        if (this.isLoading) {
            console.warn('[STUDENT-MODULE] ⚠️ Ya hay una carga en progreso');
            return;
        }

        this.isLoading = true;

        try {
            console.log('[STUDENT-MODULE] 📥 Cargando estudiantes...');

            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.students = data.students || data || [];

            console.log(`[STUDENT-MODULE] ✅ ${this.students.length} estudiantes cargados`);

            // Emit evento de éxito
            this.eventBus.emit('students.loaded', {
                students: this.students,
                count: this.students.length
            });

        } catch (error) {
            console.error('[STUDENT-MODULE] ❌ Error cargando estudiantes:', error);

            // Emit evento de error
            this.eventBus.emit('students.error', {
                operation: 'load',
                error: error.message
            });

        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Crear estudiante
     */
    async createStudent(studentData) {
        try {
            console.log('[STUDENT-MODULE] 📝 Creando estudiante:', studentData.nombre);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(studentData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const newStudent = await response.json();

            // Agregar a lista local
            this.students.push(newStudent);

            console.log('[STUDENT-MODULE] ✅ Estudiante creado:', newStudent.id);

            // Emit evento de éxito
            this.eventBus.emit('students.created', {
                student: newStudent
            });

            return newStudent;

        } catch (error) {
            console.error('[STUDENT-MODULE] ❌ Error creando estudiante:', error);

            this.eventBus.emit('students.error', {
                operation: 'create',
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Actualizar estudiante
     */
    async updateStudent(studentId, updates) {
        try {
            console.log('[STUDENT-MODULE] 📝 Actualizando estudiante:', studentId);

            const response = await fetch(`${this.apiEndpoint}/${studentId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const updatedStudent = await response.json();

            // Actualizar en lista local
            const index = this.students.findIndex(s => s.id === studentId);
            if (index !== -1) {
                this.students[index] = updatedStudent;
            }

            console.log('[STUDENT-MODULE] ✅ Estudiante actualizado:', studentId);

            // Emit evento de éxito
            this.eventBus.emit('students.updated', {
                student: updatedStudent
            });

            return updatedStudent;

        } catch (error) {
            console.error('[STUDENT-MODULE] ❌ Error actualizando estudiante:', error);

            this.eventBus.emit('students.error', {
                operation: 'update',
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Eliminar estudiante
     */
    async deleteStudent(studentId) {
        try {
            console.log('[STUDENT-MODULE] 🗑️  Eliminando estudiante:', studentId);

            const response = await fetch(`${this.apiEndpoint}/${studentId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Remover de lista local
            this.students = this.students.filter(s => s.id !== studentId);

            console.log('[STUDENT-MODULE] ✅ Estudiante eliminado:', studentId);

            // Emit evento de éxito
            this.eventBus.emit('students.deleted', {
                id: studentId
            });

        } catch (error) {
            console.error('[STUDENT-MODULE] ❌ Error eliminando estudiante:', error);

            this.eventBus.emit('students.error', {
                operation: 'delete',
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Obtener headers de autenticación
     */
    getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('bge_auth_token') || 
                      sessionStorage.getItem('bge_auth_token') || 
                      localStorage.getItem('authToken') || 
                      sessionStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            return headers;
        }
        const secureSession = localStorage.getItem('secure_admin_session');
        if (secureSession) {
            try {
                const sessionData = JSON.parse(secureSession);
                if (sessionData.token) headers['Authorization'] = `Bearer ${sessionData.token}`;
            } catch (error) {}
        }
        return headers;
    }

    /**
     * Obtener estudiante por ID
     */
    getStudentById(id) {
        return this.students.find(s => s.id === id);
    }

    /**
     * Filtrar estudiantes
     */
    filterStudents(filters) {
        let filtered = [...this.students];

        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(s =>
                (s.nombre && s.nombre.toLowerCase().includes(search)) ||
                (s.email && s.email.toLowerCase().includes(search)) ||
                (s.matricula && s.matricula.toLowerCase().includes(search))
            );
        }

        if (filters.grado) {
            filtered = filtered.filter(s => s.grado === filters.grado);
        }

        if (filters.grupo) {
            filtered = filtered.filter(s => s.grupo === filters.grupo);
        }

        return filtered;
    }

    /**
     * Destruir módulo y limpiar recursos
     */
    destroy() {
        console.log('[STUDENT-MODULE] 🧹 Destruyendo módulo...');

        // Limpiar datos
        this.students = [];

        console.log('[STUDENT-MODULE] ✅ Módulo destruido');
    }
}

// Exponer globalmente
window.StudentModule = StudentModule;
