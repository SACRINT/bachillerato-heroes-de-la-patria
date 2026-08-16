/**
 * 🎓 DYNAMIC STUDENT LOADER - BGE HEROES DE LA PATRIA
 * Sistema de gestión dinámica de estudiantes desde API
 */

class DynamicStudentLoader {
    constructor() {
        this.studentsFile = '/api/students';
        this.students = {};
        this.currentEditingId = null;

        // Usar la instancia global de APIClient
        this.apiClient = window.apiClient || new APIClient();
    }

    /**
     * Cargar estudiantes desde API (usando APIClient con auth automática)
     */
    async loadStudents() {
        try {
            const response = await this.apiClient.get(this.studentsFile);

            let estudiantesArray = [];

            if (response && response.data && response.data.students && Array.isArray(response.data.students)) {
                estudiantesArray = response.data.students;
            } else if (response && response.data && Array.isArray(response.data)) {
                estudiantesArray = response.data;
            } else if (response && response.students && Array.isArray(response.students)) {
                estudiantesArray = response.students;
            } else if (Array.isArray(response)) {
                estudiantesArray = response;
            }

            // Crear estructura esperada por el resto del código
            this.students = {
                estudiantes: estudiantesArray,
                estadisticas: {
                    totalEstudiantes: estudiantesArray.length,
                    estudiantesActivos: estudiantesArray.filter(e => e.status_academico === 'regular' || e.estado === 'Activo').length,
                    estudiantesEnRiesgo: estudiantesArray.filter(e => e.status_academico === 'baja' || e.estado === 'En Riesgo').length,
                    promedioGeneral: 0
                }
            };

            // Actualizar la interfaz
            this.updateStudentsTable();
            this.updateStudentsStats();

            return this.students;
        } catch (error) {
            this.loadDefaultStudents();
            return this.students;
        }
    }

    /**
     * Cargar estudiantes por defecto
     */
    loadDefaultStudents() {
        this.students = {
            estudiantes: [],
            estadisticas: {
                totalEstudiantes: 0,
                estudiantesActivos: 0,
                estudiantesEnRiesgo: 0,
                promedioGeneral: 0
            },
            especialidades: [],
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                nextId: "20240001"
            }
        };

        this.updateStudentsTable();
        this.updateStudentsStats();
    }

    /**
     * Actualizar tabla de estudiantes
     */
    updateStudentsTable() {
        try {
            

                        const tableBody = document.getElementById('studentsTable');
            if (!tableBody) {
                
                return;
            }

            // Limpiar tabla
            tableBody.innerHTML = DOMPurify.sanitize(sanitizeHTML(''));

            // Agregar filas de estudiantes
            this.students.estudiantes?.forEach(student => {
                const row = this.createStudentRow(student);
                tableBody.appendChild(row);
            });

            
        } catch (error) {
            console.error('❌ Error actualizando tabla de estudiantes:', error);
        }
    }

    /**
     * Crear fila de estudiante
     */
    createStudentRow(student) {
        const row = document.createElement('tr');

        // Construir nombre completo (usar nombre como campo principal)
        const nombreCompleto = student.nombre || 'Sin nombre';

        // Determinar estado (por ahora "Activo" como default si no existe status_academico)
        let estado = 'Activo';
        let estadoBadge = 'bg-success';
        if (student.status_academico === 'baja') {
            estado = 'En Riesgo';
            estadoBadge = 'bg-danger';
        } else if (student.status_academico === 'suspendido' || student.estado === 'Inactivo') {
            estado = 'Inactivo';
            estadoBadge = 'bg-secondary';
        }

        // Obtener promedio (usar 0 como default)
        const promedio = parseFloat(student.promedio) || 0;

        // Determinar nivel de riesgo según promedio
        let nivelRiesgo = 'Activo';
        let riesgoBadge = 'bg-success';
        if (promedio < 6.0 && promedio > 0) {
            nivelRiesgo = 'Alto Riesgo';
            riesgoBadge = 'bg-danger';
        } else if (promedio >= 6.0 && promedio < 7.5) {
            nivelRiesgo = 'Medio Riesgo';
            riesgoBadge = 'bg-warning';
        }

        // Email desde usuario_id si existe, sino placeholder
        const email = student.email || `estudiante${student.matricula}@bge.edu.mx`;

        // Semestre con valor por defecto
        const semestre = student.semestre || 'N/A';

        row.innerHTML = sanitizeHTML(`
            <td><strong>${student.matricula || 'Sin matrícula'}</strong></td>
            <td>
                <strong>${nombreCompleto}</strong><br>
                <small class="text-muted">${email}</small>
            </td>
            <td>
                <span class="badge bg-info">${semestre}°</span>
            </td>
            <td>
                <span class="badge ${promedio >= 8.0 ? 'bg-success' : promedio >= 7.0 ? 'bg-warning' : promedio > 0 ? 'bg-danger' : 'bg-secondary'}">
                    ${promedio > 0 ? promedio.toFixed(2) : 'S/P'}
                </span>
            </td>
            <td>
                <span class="badge ${estadoBadge}">${estado}</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button"
                            class="btn btn-outline-primary"
                            onclick="dynamicStudentLoader.editStudent('${student.id}')"
                            title="Editar información">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button"
                            class="btn btn-outline-info"
                            onclick="dynamicStudentLoader.contactStudent('${student.id}')"
                            title="Contactar">
                        <i class="fas fa-envelope"></i>
                    </button>
                    <button type="button"
                            class="btn btn-outline-danger"
                            onclick="dynamicStudentLoader.deleteStudent('${student.id}')"
                            title="Eliminar estudiante">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `);
        return row;
    }

    /**
     * Actualizar estadísticas de estudiantes
     */
    updateStudentsStats() {
        try {
            

            // Actualizar contadores en la interfaz
            const totalElement = document.getElementById('totalStudentsCount');
            const activeElement = document.getElementById('activeStudentsCount');
            const riskElement = document.getElementById('riskStudentsCount');
            const averageElement = document.getElementById('generalAverageDisplay');

            if (totalElement) {
                totalElement.textContent = this.students.estadisticas?.totalEstudiantes || this.students.estudiantes?.length || 0;
            }

            if (activeElement) {
                const active = this.students.estudiantes?.filter(s => s.estado === 'Activo').length || 0;
                activeElement.textContent = active;
            }

            if (riskElement) {
                const risk = this.students.estudiantes?.filter(s => s.estado === 'En Riesgo').length || 0;
                riskElement.textContent = risk;
            }

            if (averageElement) {
                averageElement.textContent = this.students.estadisticas?.promedioGeneral || '0.0';
            }

            
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    }

    /**
     * Editar estudiante
     */
    editStudent(studentId) {


        const student = this.students.estudiantes?.find(s => s.id === studentId);
        if (!student) {
            console.error('❌ Estudiante no encontrado:', studentId);
            return;
        }

        this.currentEditingId = studentId;
        this.showEditModal(student);
    }

    /**
     * Mostrar modal de edición
     */
    showEditModal(student) {
        // Crear modal si no existe
        let modal = document.getElementById('editStudentModal');
        if (!modal) {
            modal = this.createEditModal();
            document.body.appendChild(modal);
        }

        // Llenar formulario con datos del estudiante
        document.getElementById('editStudentName').value = student.nombre || '';
        document.getElementById('editStudentEmail').value = student.email || '';
        document.getElementById('editStudentPhone').value = student.telefono || '';
        document.getElementById('editStudentMatricula').value = student.matricula || '';
        document.getElementById('editStudentSemester').value = student.semestre || '';
        document.getElementById('editStudentSpecialty').value = student.especialidad || '';
        document.getElementById('editStudentAverage').value = student.promedio || '';
        document.getElementById('editStudentStatus').value = student.estado || 'Activo';
        document.getElementById('editStudentRisk').value = student.nivelRiesgo || 'Bajo Riesgo';
        document.getElementById('editStudentAddress').value = student.direccion || '';
        document.getElementById('editStudentBirthDate').value = student.fechaNacimiento || '';
        document.getElementById('editStudentGender').value = student.genero || '';

        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Crear modal de edición
     */
    createEditModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'editStudentModal';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-edit me-2"></i>Editar Información del Estudiante
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editStudentForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentName" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="editStudentName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentMatricula" class="form-label">Matrícula</label>
                                        <input type="text" class="form-control" id="editStudentMatricula" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="editStudentEmail" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentPhone" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="editStudentPhone">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editStudentSemester" class="form-label">Semestre</label>
                                        <select class="form-select" id="editStudentSemester">
                                            <option value="1°">1° Semestre</option>
                                            <option value="2°">2° Semestre</option>
                                            <option value="3°">3° Semestre</option>
                                            <option value="4°">4° Semestre</option>
                                            <option value="5°">5° Semestre</option>
                                            <option value="6°">6° Semestre</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editStudentAverage" class="form-label">Promedio</label>
                                        <input type="number" class="form-control" id="editStudentAverage" step="0.1" min="0" max="10">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editStudentGender" class="form-label">Género</label>
                                        <select class="form-select" id="editStudentGender">
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentSpecialty" class="form-label">Especialidad</label>
                                        <select class="form-select" id="editStudentSpecialty">
                                            <option value="Ciencias Físico-Matemáticas">Ciencias Físico-Matemáticas</option>
                                            <option value="Químico-Biológicas">Químico-Biológicas</option>
                                            <option value="Humanidades y Ciencias Sociales">Humanidades y Ciencias Sociales</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentBirthDate" class="form-label">Fecha de Nacimiento</label>
                                        <input type="date" class="form-control" id="editStudentBirthDate">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentStatus" class="form-label">Estado</label>
                                        <select class="form-select" id="editStudentStatus">
                                            <option value="Activo">Activo</option>
                                            <option value="En Riesgo">En Riesgo</option>
                                            <option value="Inactivo">Inactivo</option>
                                            <option value="Egresado">Egresado</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editStudentRisk" class="form-label">Nivel de Riesgo</label>
                                        <select class="form-select" id="editStudentRisk">
                                            <option value="Bajo Riesgo">Bajo Riesgo</option>
                                            <option value="Medio Riesgo">Medio Riesgo</option>
                                            <option value="Alto Riesgo">Alto Riesgo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="editStudentAddress" class="form-label">Dirección</label>
                                <textarea class="form-control" id="editStudentAddress" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicStudentLoader.saveStudentChanges()">
                            <i class="fas fa-save me-2"></i>Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        `);
        return modal;
    }

    /**
     * Guardar cambios del estudiante
     */
    async saveStudentChanges() {
        try {


            if (!this.currentEditingId) {
                console.error('❌ No hay estudiante seleccionado para editar');
                return;
            }

            // Obtener datos del formulario
            const formData = {
                nombre: document.getElementById('editStudentName').value,
                matricula: document.getElementById('editStudentMatricula').value,
                email: document.getElementById('editStudentEmail').value,
                telefono: document.getElementById('editStudentPhone').value,
                semestre: document.getElementById('editStudentSemester').value,
                especialidad: document.getElementById('editStudentSpecialty').value,
                promedio: parseFloat(document.getElementById('editStudentAverage').value) || 0,
                estado: document.getElementById('editStudentStatus').value,
                nivelRiesgo: document.getElementById('editStudentRisk').value,
                direccion: document.getElementById('editStudentAddress').value,
                fechaNacimiento: document.getElementById('editStudentBirthDate').value,
                genero: document.getElementById('editStudentGender').value
            };

            // Encontrar y actualizar el estudiante
            const studentIndex = this.students.estudiantes.findIndex(s => s.id === this.currentEditingId);
            if (studentIndex === -1) {
                console.error('❌ Estudiante no encontrado para actualizar');
                return;
            }

            // Actualizar datos
            this.students.estudiantes[studentIndex] = {
                ...this.students.estudiantes[studentIndex],
                ...formData
            };

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar en servidor/localStorage
            await this.saveStudentsData();

            // Actualizar interfaz
            this.updateStudentsTable();
            this.updateStudentsStats();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editStudentModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Información del estudiante actualizada correctamente');

            this.currentEditingId = null;

        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            this.showErrorMessage('Error al guardar los cambios');
        }
    }

    /**
     * Contactar estudiante
     */
    contactStudent(studentId) {


        const student = this.students.estudiantes?.find(s => s.id === studentId);
        if (!student) {
            console.error('❌ Estudiante no encontrado:', studentId);
            return;
        }

        // Crear modal de contacto
        this.showContactModal(student);
    }

    /**
     * Mostrar modal de contacto
     */
    showContactModal(student) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'contactStudentModal';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-envelope me-2"></i>Contactar Estudiante
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <h6>${student.nombre}</h6>
                            <p class="text-muted">${student.matricula} - ${student.semestre}</p>
                        </div>
                        <div class="d-grid gap-2">
                            <a href="mailto:${student.email}" class="btn btn-primary">
                                <i class="fas fa-envelope me-2"></i>Enviar Email
                            </a>
                            <a href="tel:${student.telefono}" class="btn btn-success">
                                <i class="fas fa-phone me-2"></i>Llamar Teléfono
                            </a>
                            <button class="btn btn-info" onclick="this.closest('.modal').querySelector('.btn-close').click()">
                                <i class="fas fa-sms me-2"></i>Enviar SMS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Remover modal cuando se cierre
        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * Mostrar modal para nuevo estudiante
     */
    showNewStudentModal() {


        // Crear modal si no existe
        let modal = document.getElementById('newStudentModal');
        if (!modal) {
            modal = this.createNewStudentModal();
            document.body.appendChild(modal);
        }

        // Limpiar formulario
        document.getElementById('newStudentForm').reset();

        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Crear modal para nuevo estudiante
     */
    createNewStudentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'newStudentModal';
        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>Agregar Nuevo Estudiante
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="newStudentForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newStudentName" class="form-label">Nombre Completo *</label>
                                        <input type="text" class="form-control" id="newStudentName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newStudentEmail" class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="newStudentEmail" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newStudentPhone" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="newStudentPhone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newStudentBirthDate" class="form-label">Fecha de Nacimiento</label>
                                        <input type="date" class="form-control" id="newStudentBirthDate">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newStudentSemester" class="form-label">Semestre *</label>
                                        <select class="form-select" id="newStudentSemester" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="1°">1° Semestre</option>
                                            <option value="2°">2° Semestre</option>
                                            <option value="3°">3° Semestre</option>
                                            <option value="4°">4° Semestre</option>
                                            <option value="5°">5° Semestre</option>
                                            <option value="6°">6° Semestre</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newStudentSpecialty" class="form-label">Especialidad *</label>
                                        <select class="form-select" id="newStudentSpecialty" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="Ciencias Físico-Matemáticas">Ciencias Físico-Matemáticas</option>
                                            <option value="Químico-Biológicas">Químico-Biológicas</option>
                                            <option value="Humanidades y Ciencias Sociales">Humanidades y Ciencias Sociales</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newStudentGender" class="form-label">Género</label>
                                        <select class="form-select" id="newStudentGender">
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="newStudentAddress" class="form-label">Dirección</label>
                                <textarea class="form-control" id="newStudentAddress" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicStudentLoader.saveNewStudent()">
                            <i class="fas fa-save me-2"></i>Crear Estudiante
                        </button>
                    </div>
                </div>
            </div>
        `);
        return modal;
    }

    /**
     * Guardar nuevo estudiante
     */
    async saveNewStudent() {
        try {


            // Validar formulario
            const form = document.getElementById('newStudentForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Generar nueva matrícula
            const currentYear = new Date().getFullYear();
            const existingIds = this.students.estudiantes?.map(s => parseInt(s.matricula?.substr(-3))) || [0];
            const nextNumber = Math.max(...existingIds) + 1;
            const newMatricula = `${currentYear}${nextNumber.toString().padStart(4, '0')}`;

            // Obtener datos del formulario
            const birthDate = document.getElementById('newStudentBirthDate').value;
            const age = birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 18;

            const newStudent = {
                id: newMatricula,
                matricula: newMatricula,
                nombre: document.getElementById('newStudentName').value,
                email: document.getElementById('newStudentEmail').value,
                telefono: document.getElementById('newStudentPhone').value || '',
                semestre: document.getElementById('newStudentSemester').value,
                especialidad: document.getElementById('newStudentSpecialty').value,
                fechaNacimiento: birthDate || '',
                edad: age,
                genero: document.getElementById('newStudentGender').value,
                direccion: document.getElementById('newStudentAddress').value || '',
                promedio: 0.0,
                estado: 'Activo',
                nivelRiesgo: 'Bajo Riesgo',
                fechaIngreso: new Date().toISOString().split('T')[0],
                tutor: 'Por asignar'
            };

            // Agregar a la lista
            if (!this.students.estudiantes) {
                this.students.estudiantes = [];
            }
            this.students.estudiantes.push(newStudent);

            // Actualizar configuración
            if (!this.students.configuracion) {
                this.students.configuracion = {};
            }
            this.students.configuracion.ultimaActualizacion = new Date().toISOString();

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar datos
            await this.saveStudentsData();

            // Actualizar interfaz
            this.updateStudentsTable();
            this.updateStudentsStats();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newStudentModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Nuevo estudiante creado correctamente');

        } catch (error) {
            console.error('❌ Error creando estudiante:', error);
            this.showErrorMessage('Error al crear el nuevo estudiante');
        }
    }

    /**
     * Eliminar estudiante
     */
    async deleteStudent(studentId) {
        try {
            const student = this.students.estudiantes?.find(s => s.id === studentId);
            if (!student) {
                console.error('❌ Estudiante no encontrado:', studentId);
                return;
            }

            // Confirmar eliminación
            if (!confirm(`¿Estás seguro de que deseas eliminar al estudiante ${student.nombre}?`)) {
                return;
            }



            // Eliminar de la lista
            this.students.estudiantes = this.students.estudiantes.filter(s => s.id !== studentId);

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar datos
            await this.saveStudentsData();

            // Actualizar interfaz
            this.updateStudentsTable();
            this.updateStudentsStats();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Estudiante eliminado correctamente');

        } catch (error) {
            console.error('❌ Error eliminando estudiante:', error);
            this.showErrorMessage('Error al eliminar el estudiante');
        }
    }

    /**
     * Exportar estudiantes
     */
    exportStudents() {
        try {


            // Crear datos para exportar
            const exportData = {
                fechaExportacion: new Date().toISOString(),
                totalEstudiantes: this.students.estudiantes?.length || 0,
                estudiantes: this.students.estudiantes || [],
                estadisticas: this.students.estadisticas || {}
            };

            // Crear y descargar archivo JSON
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `estudiantes_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            URL.revokeObjectURL(url);

            this.showSuccessMessage('Exportación completada exitosamente');

        } catch (error) {
            console.error('❌ Error exportando estudiantes:', error);
            this.showErrorMessage('Error al exportar los datos');
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStatistics() {
        if (!this.students.estudiantes) return;

        const estudiantes = this.students.estudiantes;
        const activos = estudiantes.filter(e => e.estado === 'Activo');
        const enRiesgo = estudiantes.filter(e => e.estado === 'En Riesgo');

        // Calcular promedio general
        const promedios = estudiantes.map(e => e.promedio || 0).filter(p => p > 0);
        const promedioGeneral = promedios.length > 0 ?
            (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : 0;

        // Contar especialidades
        const especialidades = {};
        estudiantes.forEach(e => {
            const esp = e.especialidad || 'Sin especialidad';
            especialidades[esp] = (especialidades[esp] || 0) + 1;
        });

        // Contar semestres
        const semestres = {};
        estudiantes.forEach(e => {
            const sem = e.semestre || 'Sin asignar';
            semestres[sem] = (semestres[sem] || 0) + 1;
        });

        // Contar niveles de riesgo
        const riesgos = {};
        estudiantes.forEach(e => {
            const riesgo = e.nivelRiesgo || 'Bajo Riesgo';
            riesgos[riesgo] = (riesgos[riesgo] || 0) + 1;
        });

        // Actualizar estadísticas
        this.students.estadisticas = {
            totalEstudiantes: estudiantes.length,
            estudiantesActivos: activos.length,
            estudiantesEnRiesgo: enRiesgo.length,
            promedioGeneral: parseFloat(promedioGeneral),
            especialidades: especialidades,
            semestreDistribucion: semestres,
            nivelRiesgo: riesgos
        };
    }

    /**
     * Guardar datos de estudiantes
     */
    async saveStudentsData() {
        try {


            // Actualizar configuración
            this.students.configuracion = {
                ...this.students.configuracion,
                ultimaActualizacion: new Date().toISOString(),
                version: '1.0'
            };

            // Guardar en localStorage como backup
            localStorage.setItem('studentsData', JSON.stringify(this.students));

            // Intentar guardar en servidor
            try {
                const response = await fetch('/api/save-students', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.students)
                });

                if (response.ok) {

                } else {

                }
            } catch (serverError) {

            }

            return true;
        } catch (error) {
            console.error('❌ Error guardando datos de estudiantes:', error);
            return false;
        }
    }

    /**
     * Mostrar mensaje de éxito
     */
    showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        alertDiv.innerHTML = sanitizeHTML(`
            <i class="fas fa-check-circle me-2"></i>
            <strong>¡Éxito!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * Mostrar mensaje de error
     */
    showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 350px;';
        alertDiv.innerHTML = sanitizeHTML(`
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 3000);
    }

    /**
     * Configurar filtros y búsqueda
     */
    setupFilters() {
        // Filtro de búsqueda
        const searchInput = document.getElementById('studentSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterStudents(e.target.value);
            });
        }

        // Filtro de semestre
        const semesterFilter = document.getElementById('studentFilterSemester');
        if (semesterFilter) {
            semesterFilter.addEventListener('change', (e) => {
                this.filterStudentsBySemester(e.target.value);
            });
        }

        // Filtro de estado
        const statusFilter = document.getElementById('studentFilterStatus');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterStudentsByStatus(e.target.value);
            });
        }
    }

    /**
     * Filtrar estudiantes por texto
     */
    filterStudents(searchText) {
        const rows = document.querySelectorAll('#studentsTable tbody tr');
        const search = searchText.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        });
    }

    /**
     * Filtrar estudiantes por semestre
     */
    filterStudentsBySemester(semester) {
        const rows = document.querySelectorAll('#studentsTable tbody tr');

        rows.forEach(row => {
            if (!semester) {
                row.style.display = '';
            } else {
                const semesterCell = row.cells[2]?.textContent || '';
                row.style.display = semesterCell.includes(semester) ? '' : 'none';
            }
        });
    }

    /**
     * Filtrar estudiantes por estado
     */
    filterStudentsByStatus(status) {
        const rows = document.querySelectorAll('#studentsTable tbody tr');

        rows.forEach(row => {
            if (!status) {
                row.style.display = '';
            } else {
                const statusCell = row.cells[4]?.textContent || '';
                row.style.display = statusCell.includes(status) ? '' : 'none';
            }
        });
    }

    /**
     * Inicializar el sistema
     */
    async init() {
        

        // Cargar estudiantes al inicio
        await this.loadStudents();

        // Configurar eventos
        this.setupEvents();

        // Configurar filtros
        this.setupFilters();

        
    }

    /**
     * Configurar eventos
     */
    setupEvents() {
        // Botón Nuevo Estudiante
        const newStudentBtn = document.getElementById('newStudentBtn');
        if (newStudentBtn) {
            newStudentBtn.addEventListener('click', () => this.showNewStudentModal());
        }

        // Botón Exportar
        const exportBtn = document.getElementById('exportStudentsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportStudents());
        }

        // Eventos manuales listos. Polling periódico desactivado para optimizar rendimiento y evitar saturación.
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    

    // Crear instancia global
    window.dynamicStudentLoader = new DynamicStudentLoader();

    // Inicializar después de un breve delay
    setTimeout(async () => {
        await window.dynamicStudentLoader.init();
    }, 600);
});

// Función global para recargar estudiantes
window.reloadStudents = async () => {
    if (window.dynamicStudentLoader) {
        await window.dynamicStudentLoader.loadStudents();
    }
};


