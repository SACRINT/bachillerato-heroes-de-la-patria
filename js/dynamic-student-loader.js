/**
 * 🎓 DYNAMIC STUDENT LOADER - BGE HEROES DE LA PATRIA
 * Sistema de gestión dinámica de estudiantes desde JSON
 */

class DynamicStudentLoader {
    constructor() {
        this.studentsFile = '/data/estudiantes.json';
        this.students = {};
        this.currentEditingId = null;
        console.log('🎓 Dynamic Student Loader inicializado');
    }

    /**
     * Cargar estudiantes desde JSON
     */
    async loadStudents() {
        try {
            console.log('📡 Cargando estudiantes desde:', this.studentsFile);
            const response = await fetch(this.studentsFile);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.students = await response.json();
            console.log('✅ Estudiantes cargados:', this.students);

            // Actualizar la interfaz
            this.updateStudentsTable();
            this.updateStudentsStats();

            return this.students;
        } catch (error) {
            console.error('❌ Error cargando estudiantes:', error);

            // Cargar datos por defecto
            this.loadDefaultStudents();
            return this.students;
        }
    }

    /**
     * Cargar estudiantes por defecto
     */
    loadDefaultStudents() {
        console.log('📋 Cargando estudiantes por defecto...');

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
            console.log('🔄 Actualizando tabla de estudiantes...');

            const tableBody = document.querySelector('#studentsTable tbody');
            if (!tableBody) {
                console.log('⚠️ Tabla de estudiantes no encontrada');
                return;
            }

            // Limpiar tabla
            tableBody.innerHTML = '';

            // Agregar filas de estudiantes
            this.students.estudiantes?.forEach(student => {
                const row = this.createStudentRow(student);
                tableBody.appendChild(row);
            });

            console.log('✅ Tabla de estudiantes actualizada');
        } catch (error) {
            console.error('❌ Error actualizando tabla de estudiantes:', error);
        }
    }

    /**
     * Crear fila de estudiante
     */
    createStudentRow(student) {
        const row = document.createElement('tr');
        
        // Determinar color del badge según estado y nivel de riesgo
        let estadoBadge = 'bg-success';
        let riesgoBadge = 'bg-success';
        
        if (student.estado === 'En Riesgo') {
            estadoBadge = 'bg-danger';
        } else if (student.estado === 'Inactivo') {
            estadoBadge = 'bg-secondary';
        }
        
        if (student.nivelRiesgo === 'Alto Riesgo') {
            riesgoBadge = 'bg-danger';
        } else if (student.nivelRiesgo === 'Medio Riesgo') {
            riesgoBadge = 'bg-warning';
        }

        row.innerHTML = `
            <td><strong>${student.matricula}</strong></td>
            <td>
                <strong>${student.nombre}</strong><br>
                <small class="text-muted">${student.email}</small>
            </td>
            <td>
                <span class="badge bg-info">${student.semestre}</span>
            </td>
            <td>
                <span class="badge ${student.promedio >= 8.0 ? 'bg-success' : student.promedio >= 7.0 ? 'bg-warning' : 'bg-danger'}">
                    ${student.promedio}
                </span>
            </td>
            <td>
                <span class="badge ${estadoBadge}">${student.estado}</span><br>
                <small><span class="badge ${riesgoBadge} mt-1">${student.nivelRiesgo}</span></small>
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
        `;
        return row;
    }

    /**
     * Actualizar estadísticas de estudiantes
     */
    updateStudentsStats() {
        try {
            console.log('🔄 Actualizando estadísticas de estudiantes...');

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

            console.log('✅ Estadísticas de estudiantes actualizadas');
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    }

    /**
     * Editar estudiante
     */
    editStudent(studentId) {
        console.log('✏️ Editando estudiante:', studentId);
        
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
        modal.innerHTML = `
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
        `;
        return modal;
    }

    /**
     * Guardar cambios del estudiante
     */
    async saveStudentChanges() {
        try {
            console.log('💾 Guardando cambios del estudiante...');

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
        console.log('📧 Contactando estudiante:', studentId);
        
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
        modal.innerHTML = `
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
        `;
        
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
        console.log('🎓 Creando nuevo estudiante...');
        
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
        modal.innerHTML = `
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
        `;
        return modal;
    }

    /**
     * Guardar nuevo estudiante
     */
    async saveNewStudent() {
        try {
            console.log('🎓 Guardando nuevo estudiante...');

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

            console.log('🗑️ Eliminando estudiante:', studentId);

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
            console.log('📊 Exportando estudiantes...');
            
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
            console.log('💾 Guardando datos de estudiantes...');

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
                    console.log('✅ Datos de estudiantes guardados en servidor');
                } else {
                    console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
                }
            } catch (serverError) {
                console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
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
        alertDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            <strong>¡Éxito!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

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
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-circle me-2"></i>
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

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
        console.log('🚀 Inicializando Dynamic Student Loader...');

        // Cargar estudiantes al inicio
        await this.loadStudents();

        // Configurar eventos
        this.setupEvents();

        // Configurar filtros
        this.setupFilters();

        console.log('✅ Dynamic Student Loader inicializado correctamente');
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

        // Recarga automática cada 30 segundos
        setInterval(async () => {
            console.log('🔄 Recarga automática de estudiantes...');
            await this.loadStudents();
        }, 30000);

        // Recargar cuando la ventana gana el foco
        window.addEventListener('focus', async () => {
            console.log('🔄 Página enfocada, recargando estudiantes...');
            await this.loadStudents();
        });
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando Dynamic Student Loader...');

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

console.log('🎓 dynamic-student-loader.js cargado correctamente');