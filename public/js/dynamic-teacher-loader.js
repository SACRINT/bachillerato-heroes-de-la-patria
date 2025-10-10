/**
 * 👩‍🏫 DYNAMIC TEACHER LOADER - BGE HEROES DE LA PATRIA
 * Sistema de gestión dinámica de docentes desde JSON
 */

class DynamicTeacherLoader {
    constructor() {
        this.teachersFile = '/data/docentes.json';
        this.teachers = {};
        this.currentEditingId = null;
        console.log('👩‍🏫 Dynamic Teacher Loader inicializado');
    }

    /**
     * Cargar docentes desde JSON
     */
    async loadTeachers() {
        try {
            console.log('📡 Cargando docentes desde:', this.teachersFile);
            const response = await fetch(this.teachersFile);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.teachers = await response.json();
            console.log('✅ Docentes cargados:', this.teachers);

            // Actualizar la interfaz
            this.updateTeachersTable();
            this.updateTeachersStats();

            return this.teachers;
        } catch (error) {
            console.error('❌ Error cargando docentes:', error);

            // Cargar datos por defecto
            this.loadDefaultTeachers();
            return this.teachers;
        }
    }

    /**
     * Cargar docentes por defecto
     */
    loadDefaultTeachers() {
        console.log('📋 Cargando docentes por defecto...');

        this.teachers = {
            docentes: [],
            estadisticas: {
                totalDocentes: 0,
                docentesActivos: 0,
                docentesInactivos: 0,
                promedioExperiencia: 0,
                promedioSalario: 0
            },
            materias: [],
            configuracion: {
                ultimaActualizacion: new Date().toISOString(),
                version: "1.0",
                nextId: 1
            }
        };

        this.updateTeachersTable();
        this.updateTeachersStats();
    }

    /**
     * Actualizar tabla de docentes
     */
    updateTeachersTable() {
        try {
            console.log('🔄 Actualizando tabla de docentes...');

            const tableBody = document.querySelector('#teachersTable tbody');
            if (!tableBody) {
                console.log('⚠️ Tabla de docentes no encontrada');
                return;
            }

            // Limpiar tabla
            tableBody.innerHTML = '';

            // Agregar filas de docentes
            this.teachers.docentes?.forEach(teacher => {
                const row = this.createTeacherRow(teacher);
                tableBody.appendChild(row);
            });

            console.log('✅ Tabla de docentes actualizada');
        } catch (error) {
            console.error('❌ Error actualizando tabla de docentes:', error);
        }
    }

    /**
     * Crear fila de docente
     */
    createTeacherRow(teacher) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <img src="${teacher.photo || 'images/default-teacher.jpg'}" 
                     alt="${teacher.nombre || teacher.name}" 
                     class="teacher-photo" 
                     style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            </td>
            <td>
                <strong>${teacher.nombre || teacher.name}</strong><br>
                <small class="text-muted">${teacher.email}</small>
            </td>
            <td><span class="badge bg-primary">${teacher.specialization}</span></td>
            <td>
                ${teacher.subjects?.map(subject => 
                    `<span class="badge bg-secondary me-1">${subject}</span>`
                ).join('') || ''}
            </td>
            <td>
                <span class="badge ${teacher.estado === 'Activo' ? 'bg-success' : 'bg-warning'}">
                    ${teacher.estado || 'Activo'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" 
                            class="btn btn-outline-primary" 
                            onclick="dynamicTeacherLoader.editTeacher(${teacher.id})" 
                            title="Editar información">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button type="button" 
                            class="btn btn-outline-secondary" 
                            onclick="dynamicTeacherLoader.assignSubjects(${teacher.id})" 
                            title="Asignar materias">
                        <i class="fas fa-book"></i> Materias
                    </button>
                    <button type="button" 
                            class="btn btn-outline-danger" 
                            onclick="dynamicTeacherLoader.deleteTeacher(${teacher.id})" 
                            title="Eliminar docente">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * Actualizar estadísticas de docentes
     */
    updateTeachersStats() {
        try {
            console.log('🔄 Actualizando estadísticas de docentes...');

            // Actualizar contadores
            const totalElement = document.getElementById('totalTeachersCount');
            const activeElement = document.getElementById('activeTeachersCount');
            const specialtiesElement = document.getElementById('specialtiesCount');

            if (totalElement) {
                totalElement.textContent = this.teachers.estadisticas?.totalDocentes || this.teachers.docentes?.length || 0;
            }

            if (activeElement) {
                const active = this.teachers.docentes?.filter(t => t.estado === 'Activo').length || 0;
                activeElement.textContent = active;
            }

            if (specialtiesElement) {
                const specialties = new Set(this.teachers.docentes?.map(t => t.specialization) || []);
                specialtiesElement.textContent = specialties.size;
            }

            console.log('✅ Estadísticas de docentes actualizadas');
        } catch (error) {
            console.error('❌ Error actualizando estadísticas:', error);
        }
    }

    /**
     * Editar docente
     */
    editTeacher(teacherId) {
        console.log('✏️ Editando docente:', teacherId);
        
        const teacher = this.teachers.docentes?.find(t => t.id === teacherId);
        if (!teacher) {
            console.error('❌ Docente no encontrado:', teacherId);
            return;
        }

        this.currentEditingId = teacherId;
        this.showEditModal(teacher);
    }

    /**
     * Mostrar modal de edición
     */
    showEditModal(teacher) {
        // Crear modal si no existe
        let modal = document.getElementById('editTeacherModal');
        if (!modal) {
            modal = this.createEditModal();
            document.body.appendChild(modal);
        }

        // Llenar formulario con datos del docente
        document.getElementById('editTeacherName').value = teacher.nombre || teacher.name || '';
        document.getElementById('editTeacherEmail').value = teacher.email || '';
        document.getElementById('editTeacherPhone').value = teacher.telefono || '';
        document.getElementById('editTeacherSpecialty').value = teacher.specialization || '';
        document.getElementById('editTeacherDegree').value = teacher.grado || '';
        document.getElementById('editTeacherExperience').value = teacher.experiencia || '';
        document.getElementById('editTeacherSalary').value = teacher.salario || '';
        document.getElementById('editTeacherSchedule').value = teacher.horario || '';
        document.getElementById('editTeacherStatus').value = teacher.estado || 'Activo';

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
        modal.id = 'editTeacherModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-edit me-2"></i>Editar Información del Docente
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editTeacherForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherName" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="editTeacherName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="editTeacherEmail" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherPhone" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="editTeacherPhone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherSpecialty" class="form-label">Especialidad</label>
                                        <input type="text" class="form-control" id="editTeacherSpecialty" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherDegree" class="form-label">Grado Académico</label>
                                        <input type="text" class="form-control" id="editTeacherDegree">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTeacherExperience" class="form-label">Experiencia</label>
                                        <input type="text" class="form-control" id="editTeacherExperience">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editTeacherSalary" class="form-label">Salario</label>
                                        <input type="number" class="form-control" id="editTeacherSalary">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editTeacherSchedule" class="form-label">Horario</label>
                                        <select class="form-select" id="editTeacherSchedule">
                                            <option value="Matutino">Matutino</option>
                                            <option value="Vespertino">Vespertino</option>
                                            <option value="Matutino y Vespertino">Ambos</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="editTeacherStatus" class="form-label">Estado</label>
                                        <select class="form-select" id="editTeacherStatus">
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                            <option value="Licencia">En Licencia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicTeacherLoader.saveTeacherChanges()">
                            <i class="fas fa-save me-2"></i>Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Guardar cambios del docente
     */
    async saveTeacherChanges() {
        try {
            console.log('💾 Guardando cambios del docente...');

            if (!this.currentEditingId) {
                console.error('❌ No hay docente seleccionado para editar');
                return;
            }

            // Obtener datos del formulario
            const formData = {
                nombre: document.getElementById('editTeacherName').value,
                email: document.getElementById('editTeacherEmail').value,
                telefono: document.getElementById('editTeacherPhone').value,
                specialization: document.getElementById('editTeacherSpecialty').value,
                grado: document.getElementById('editTeacherDegree').value,
                experiencia: document.getElementById('editTeacherExperience').value,
                salario: parseFloat(document.getElementById('editTeacherSalary').value) || 0,
                horario: document.getElementById('editTeacherSchedule').value,
                estado: document.getElementById('editTeacherStatus').value
            };

            // Encontrar y actualizar el docente
            const teacherIndex = this.teachers.docentes.findIndex(t => t.id === this.currentEditingId);
            if (teacherIndex === -1) {
                console.error('❌ Docente no encontrado para actualizar');
                return;
            }

            // Actualizar datos
            this.teachers.docentes[teacherIndex] = {
                ...this.teachers.docentes[teacherIndex],
                ...formData,
                name: formData.nombre // Mantener compatibilidad
            };

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar en servidor/localStorage
            await this.saveTeachersData();

            // Actualizar interfaz
            this.updateTeachersTable();
            this.updateTeachersStats();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTeacherModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Información del docente actualizada correctamente');

            this.currentEditingId = null;

        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            this.showErrorMessage('Error al guardar los cambios');
        }
    }

    /**
     * Asignar materias
     */
    assignSubjects(teacherId) {
        console.log('📚 Asignando materias al docente:', teacherId);
        
        const teacher = this.teachers.docentes?.find(t => t.id === teacherId);
        if (!teacher) {
            console.error('❌ Docente no encontrado:', teacherId);
            return;
        }

        this.currentEditingId = teacherId;
        this.showSubjectsModal(teacher);
    }

    /**
     * Mostrar modal de asignación de materias
     */
    showSubjectsModal(teacher) {
        // Crear modal si no existe
        let modal = document.getElementById('assignSubjectsModal');
        if (!modal) {
            modal = this.createSubjectsModal();
            document.body.appendChild(modal);
        }

        // Llenar modal con materias disponibles
        const subjectsContainer = document.getElementById('availableSubjects');
        subjectsContainer.innerHTML = '';

        this.teachers.materias?.forEach(subject => {
            const isAssigned = teacher.subjects?.includes(subject) || false;
            const checkbox = document.createElement('div');
            checkbox.className = 'form-check';
            checkbox.innerHTML = `
                <input class="form-check-input" type="checkbox" 
                       id="subject_${subject.replace(/\s+/g, '_')}" 
                       value="${subject}" 
                       ${isAssigned ? 'checked' : ''}>
                <label class="form-check-label" for="subject_${subject.replace(/\s+/g, '_')}">
                    ${subject}
                </label>
            `;
            subjectsContainer.appendChild(checkbox);
        });

        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Crear modal de asignación de materias
     */
    createSubjectsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'assignSubjectsModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-book me-2"></i>Asignar Materias
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted mb-3">Selecciona las materias que impartirá este docente:</p>
                        <div id="availableSubjects" class="row">
                            <!-- Materias se cargan dinámicamente -->
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicTeacherLoader.saveSubjectAssignment()">
                            <i class="fas fa-save me-2"></i>Guardar Asignación
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Guardar asignación de materias
     */
    async saveSubjectAssignment() {
        try {
            console.log('📚 Guardando asignación de materias...');

            if (!this.currentEditingId) {
                console.error('❌ No hay docente seleccionado');
                return;
            }

            // Obtener materias seleccionadas
            const checkboxes = document.querySelectorAll('#availableSubjects input[type="checkbox"]:checked');
            const selectedSubjects = Array.from(checkboxes).map(cb => cb.value);

            // Encontrar y actualizar el docente
            const teacherIndex = this.teachers.docentes.findIndex(t => t.id === this.currentEditingId);
            if (teacherIndex === -1) {
                console.error('❌ Docente no encontrado');
                return;
            }

            // Actualizar materias
            this.teachers.docentes[teacherIndex].subjects = selectedSubjects;

            // Guardar datos
            await this.saveTeachersData();

            // Actualizar interfaz
            this.updateTeachersTable();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('assignSubjectsModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Materias asignadas correctamente');

            this.currentEditingId = null;

        } catch (error) {
            console.error('❌ Error asignando materias:', error);
            this.showErrorMessage('Error al asignar materias');
        }
    }

    /**
     * Mostrar modal para nuevo docente
     */
    showNewTeacherModal() {
        console.log('👨‍🏫 Creando nuevo docente...');
        
        // Crear modal si no existe
        let modal = document.getElementById('newTeacherModal');
        if (!modal) {
            modal = this.createNewTeacherModal();
            document.body.appendChild(modal);
        }

        // Limpiar formulario
        document.getElementById('newTeacherForm').reset();

        // Mostrar modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Crear modal para nuevo docente
     */
    createNewTeacherModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'newTeacherModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-user-plus me-2"></i>Agregar Nuevo Docente
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="newTeacherForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherName" class="form-label">Nombre Completo *</label>
                                        <input type="text" class="form-control" id="newTeacherName" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherEmail" class="form-label">Email *</label>
                                        <input type="email" class="form-control" id="newTeacherEmail" required>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherPhone" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="newTeacherPhone">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherPosition" class="form-label">Posición *</label>
                                        <select class="form-select" id="newTeacherPosition" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="Docente">Docente</option>
                                            <option value="Coordinador">Coordinador</option>
                                            <option value="Subdirector">Subdirector</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherSpecialty" class="form-label">Especialidad *</label>
                                        <input type="text" class="form-control" id="newTeacherSpecialty" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherDegree" class="form-label">Grado Académico</label>
                                        <input type="text" class="form-control" id="newTeacherDegree">
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newTeacherExperience" class="form-label">Experiencia</label>
                                        <input type="text" class="form-control" id="newTeacherExperience" placeholder="ej: 5 años">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newTeacherSalary" class="form-label">Salario</label>
                                        <input type="number" class="form-control" id="newTeacherSalary">
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label for="newTeacherSchedule" class="form-label">Horario</label>
                                        <select class="form-select" id="newTeacherSchedule">
                                            <option value="Matutino">Matutino</option>
                                            <option value="Vespertino">Vespertino</option>
                                            <option value="Matutino y Vespertino">Ambos</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherCedula" class="form-label">Cédula Profesional</label>
                                        <input type="text" class="form-control" id="newTeacherCedula">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="newTeacherPhoto" class="form-label">URL de Foto</label>
                                        <input type="url" class="form-control" id="newTeacherPhoto" placeholder="https://...">
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="fas fa-times me-2"></i>Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="dynamicTeacherLoader.saveNewTeacher()">
                            <i class="fas fa-save me-2"></i>Crear Docente
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    /**
     * Guardar nuevo docente
     */
    async saveNewTeacher() {
        try {
            console.log('👨‍🏫 Guardando nuevo docente...');

            // Validar formulario
            const form = document.getElementById('newTeacherForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Obtener datos del formulario
            const newTeacher = {
                id: this.teachers.configuracion?.nextId || 1,
                name: document.getElementById('newTeacherName').value,
                nombre: document.getElementById('newTeacherName').value,
                email: document.getElementById('newTeacherEmail').value,
                telefono: document.getElementById('newTeacherPhone').value || '',
                position: document.getElementById('newTeacherPosition').value,
                specialization: document.getElementById('newTeacherSpecialty').value,
                grado: document.getElementById('newTeacherDegree').value || '',
                experiencia: document.getElementById('newTeacherExperience').value || '0 años',
                salario: parseFloat(document.getElementById('newTeacherSalary').value) || 0,
                horario: document.getElementById('newTeacherSchedule').value,
                cedula: document.getElementById('newTeacherCedula').value || '',
                photo: document.getElementById('newTeacherPhoto').value || 'images/default-teacher.jpg',
                subjects: [],
                estado: 'Activo',
                fechaIngreso: new Date().toISOString().split('T')[0]
            };

            // Agregar a la lista
            if (!this.teachers.docentes) {
                this.teachers.docentes = [];
            }
            this.teachers.docentes.push(newTeacher);

            // Actualizar configuración
            if (!this.teachers.configuracion) {
                this.teachers.configuracion = {};
            }
            this.teachers.configuracion.nextId = newTeacher.id + 1;
            this.teachers.configuracion.ultimaActualizacion = new Date().toISOString();

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar datos
            await this.saveTeachersData();

            // Actualizar interfaz
            this.updateTeachersTable();
            this.updateTeachersStats();

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newTeacherModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Nuevo docente creado correctamente');

        } catch (error) {
            console.error('❌ Error creando docente:', error);
            this.showErrorMessage('Error al crear el nuevo docente');
        }
    }

    /**
     * Eliminar docente
     */
    async deleteTeacher(teacherId) {
        try {
            const teacher = this.teachers.docentes?.find(t => t.id === teacherId);
            if (!teacher) {
                console.error('❌ Docente no encontrado:', teacherId);
                return;
            }

            // Confirmar eliminación
            if (!confirm(`¿Estás seguro de que deseas eliminar al docente ${teacher.nombre || teacher.name}?`)) {
                return;
            }

            console.log('🗑️ Eliminando docente:', teacherId);

            // Eliminar de la lista
            this.teachers.docentes = this.teachers.docentes.filter(t => t.id !== teacherId);

            // Actualizar estadísticas
            this.updateStatistics();

            // Guardar datos
            await this.saveTeachersData();

            // Actualizar interfaz
            this.updateTeachersTable();
            this.updateTeachersStats();

            // Mostrar mensaje de éxito
            this.showSuccessMessage('Docente eliminado correctamente');

        } catch (error) {
            console.error('❌ Error eliminando docente:', error);
            this.showErrorMessage('Error al eliminar el docente');
        }
    }

    /**
     * Actualizar estadísticas
     */
    updateStatistics() {
        if (!this.teachers.docentes) return;

        const docentes = this.teachers.docentes;
        const activos = docentes.filter(d => d.estado === 'Activo');
        
        // Calcular promedios
        const experiencias = docentes.map(d => {
            const exp = d.experiencia || '0 años';
            const años = parseInt(exp.match(/\d+/)?.[0] || '0');
            return años;
        });
        
        const salarios = docentes.map(d => d.salario || 0).filter(s => s > 0);
        
        // Contar especialidades
        const especialidades = {};
        docentes.forEach(d => {
            const esp = d.specialization || 'Sin especialidad';
            especialidades[esp] = (especialidades[esp] || 0) + 1;
        });

        // Actualizar estadísticas
        this.teachers.estadisticas = {
            totalDocentes: docentes.length,
            docentesActivos: activos.length,
            docentesInactivos: docentes.length - activos.length,
            promedioExperiencia: experiencias.length > 0 ? 
                (experiencias.reduce((a, b) => a + b, 0) / experiencias.length).toFixed(1) : 0,
            promedioSalario: salarios.length > 0 ? 
                Math.round(salarios.reduce((a, b) => a + b, 0) / salarios.length) : 0,
            especialidades: especialidades
        };
    }

    /**
     * Guardar datos de docentes
     */
    async saveTeachersData() {
        try {
            console.log('💾 Guardando datos de docentes...');

            // Actualizar configuración
            this.teachers.configuracion = {
                ...this.teachers.configuracion,
                ultimaActualizacion: new Date().toISOString(),
                version: '1.0'
            };

            // Guardar en localStorage como backup
            localStorage.setItem('teachersData', JSON.stringify(this.teachers));

            // Intentar guardar en servidor
            try {
                const response = await fetch('/api/save-teachers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(this.teachers)
                });

                if (response.ok) {
                    console.log('✅ Datos de docentes guardados en servidor');
                } else {
                    console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
                }
            } catch (serverError) {
                console.log('⚠️ Servidor no disponible, guardado solo en localStorage');
            }

            return true;
        } catch (error) {
            console.error('❌ Error guardando datos de docentes:', error);
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
     * Inicializar el sistema
     */
    async init() {
        console.log('🚀 Inicializando Dynamic Teacher Loader...');

        // Cargar docentes al inicio
        await this.loadTeachers();

        // Configurar eventos
        this.setupEvents();

        console.log('✅ Dynamic Teacher Loader inicializado correctamente');
    }

    /**
     * Configurar eventos
     */
    setupEvents() {
        // Botón Nuevo Docente
        const newTeacherBtn = document.getElementById('newTeacherBtn');
        if (newTeacherBtn) {
            newTeacherBtn.addEventListener('click', () => this.showNewTeacherModal());
        }

        // Recarga automática cada 30 segundos
        setInterval(async () => {
            console.log('🔄 Recarga automática de docentes...');
            await this.loadTeachers();
        }, 30000);

        // Recargar cuando la ventana gana el foco
        window.addEventListener('focus', async () => {
            console.log('🔄 Página enfocada, recargando docentes...');
            await this.loadTeachers();
        });
    }
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM cargado, inicializando Dynamic Teacher Loader...');

    // Crear instancia global
    window.dynamicTeacherLoader = new DynamicTeacherLoader();

    // Inicializar después de un breve delay
    setTimeout(async () => {
        await window.dynamicTeacherLoader.init();
    }, 500);
});

// Función global para recargar docentes
window.reloadTeachers = async () => {
    if (window.dynamicTeacherLoader) {
        await window.dynamicTeacherLoader.loadTeachers();
    }
};

console.log('👩‍🏫 dynamic-teacher-loader.js cargado correctamente');