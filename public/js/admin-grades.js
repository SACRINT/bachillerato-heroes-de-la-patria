/**
 * 🎓 ADMIN GRADES CONTROLLER
 * Controlador para la interfaz de captura de calificaciones (Docentes/Admin)
 * @date 2025-12-06
 */

(function () {
    'use strict';

    // State
    const state = {
        periods: [],
        subjects: [],
        currentSubjectId: null,
        currentPeriodId: null,
        students: [],
        grades: {}, // Mapa de calificaciones locales para control de cambios
        isDirty: false,
        userRole: null
    };

    // DOM Elements
    const elements = {
        periodSelect: document.getElementById('periodSelect'),
        subjectSelect: document.getElementById('subjectSelect'),
        gradesGrid: document.getElementById('gradesGrid'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        saveStatus: document.getElementById('saveStatus'),
        searchInput: document.getElementById('searchStudent'),
        refreshBtn: document.getElementById('refreshBtn')
    };

    /**
     * Inicialización del módulo
     */
    async function init() {
        void 0;
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        try {
            showLoading(true);
            await Promise.all([loadPeriods(), loadSubjects()]);
            setupEventListeners();
            showLoading(false);
        } catch (error) {
            console.error('Error inicializando:', error);
            showToast('Error al cargar datos iniciales.', 'error');
            showLoading(false);
        }
    }

    /**
     * Cargar Periodos de Evaluación
     */
    async function loadPeriods() {
        try {
            const response = await fetch('/api/grades/periods', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            const data = await response.json();
            if (data.success) {
                state.periods = data.data;
                renderPeriodSelect();
                elements.periodSelect.disabled = false;
            }
        } catch (error) {
            console.error('Error loading periods:', error);
        }
    }

    /**
     * Cargar Materias del Docente
     */
    async function loadSubjects() {
        try {
            const response = await fetch('/api/grades/teacher/subjects', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            const data = await response.json();
            if (data.success) {
                state.subjects = data.data;
                renderSubjectSelect();
                elements.subjectSelect.disabled = false;
            } else {
                showToast('No se encontraron materias asignadas.', 'warning');
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    /**
     * Renderizar Selectores
     */
    function renderPeriodSelect() {
        elements.periodSelect.innerHTML = '<option value="">Seleccione Periodo...</option>';
        state.periods.forEach(p => {
            const isActive = p.estado === 'activo';
            const option = document.createElement('option');
            option.value = p.id;
            const statusIcon = isActive ? '🟢' : '🔒';
            option.textContent = `${statusIcon} ${p.nombre} (${p.codigo})`;
            elements.periodSelect.appendChild(option);
        });
    }

    function renderSubjectSelect() {
        elements.subjectSelect.innerHTML = '<option value="">Seleccione Materia...</option>';
        state.subjects.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.nombre} (${s.total_estudiantes || 0} alumnos) - ${s.codigo || ''}`;
            elements.subjectSelect.appendChild(option);
        });
    }

    /**
     * Cargar Datos (Estudiantes + Calificaciones)
     */
    async function loadData() {
        const materiaId = elements.subjectSelect.value;
        const periodoId = elements.periodSelect.value;

        if (!materiaId || !periodoId) {
            showToast('Seleccione Materia y Periodo', 'warning');
            return;
        }

        state.currentSubjectId = parseInt(materiaId);
        state.currentPeriodId = parseInt(periodoId);

        showLoading(true);
        elements.gradesGrid.innerHTML = '';
        elements.refreshBtn.disabled = true;

        try {
            // Cargar estudiantes y calificaciones en paralelo
            const [studentsRes, gradesRes] = await Promise.all([
                fetch(`/api/grades/subject/${materiaId}/students`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                }),
                fetch(`/api/grades/batch?materiaId=${materiaId}&periodoId=${periodoId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                })
            ]);

            const studentsData = await studentsRes.json();
            const gradesData = await gradesRes.json();

            if (studentsData.success) {
                state.students = studentsData.data;

                // Mapear calificaciones existentes
                state.grades = {};
                if (gradesData.success && Array.isArray(gradesData.data)) {
                    gradesData.data.forEach(g => {
                        state.grades[g.estudiante_id] = g;
                    });
                }

                renderGradesGrid();
            } else {
                throw new Error(studentsData.message || 'Error cargando estudiantes');
            }

        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Error al cargar datos del grupo', 'error');
            elements.gradesGrid.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        } finally {
            showLoading(false);
            elements.refreshBtn.disabled = false;
        }
    }

    /**
     * Renderizar Grid de Calificaciones
     */
    function renderGradesGrid() {
        if (!state.students.length) {
            elements.gradesGrid.innerHTML = '<div class="alert alert-info">No hay estudiantes inscritos en este grupo.</div>';
            return;
        }

        let html = `
            <table class="table table-hover table-bordered align-middle table-striped">
                <thead class="table-light sticky-top" style="top: 0; z-index: 5;">
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 15%">Matrícula</th>
                        <th style="width: 35%">Nombre del Estudiante</th>
                        <th style="width: 15%" class="text-center">Calificación</th>
                        <th style="width: 15%" class="text-center">Faltas</th>
                        <th style="width: 10%" class="text-center">Estado</th>
                        <th style="width: 5%" class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        state.students.forEach((student, index) => {
            const existingGrade = state.grades[student.estudiante_id] || {};
            const gradeVal = existingGrade.calificacion !== undefined ? existingGrade.calificacion : '';
            const faultsVal = existingGrade.observaciones ? (existingGrade.observaciones.match(/Faltas: (\d+)/) || [])[1] || '' : '';

            // Determinar status visual
            let statusBadge = '<span class="badge bg-secondary status-badge"><i class="fas fa-minus"></i></span>';
            if (gradeVal !== '') {
                statusBadge = '<span class="badge bg-success status-badge"><i class="fas fa-check"></i></span>';
            }

            html += `
                <tr data-student-id="${student.estudiante_id}">
                    <td>${index + 1}</td>
                    <td class="font-monospace">${student.matricula || 'N/A'}</td>
                    <td class="fw-bold text-primary">
                        ${student.apellido_paterno} ${student.apellido_materno} ${student.nombre}
                    </td>
                    <td>
                        <input type="number" 
                               class="form-control form-control-sm text-center grade-input fw-bold" 
                               min="0" max="10" step="0.1"
                               data-student-id="${student.estudiante_id}"
                               value="${gradeVal}"
                               placeholder="-">
                    </td>
                    <td>
                         <input type="number" 
                               class="form-control form-control-sm text-center faults-input" 
                               min="0" max="100"
                               data-student-id="${student.estudiante_id}"
                               value="${faultsVal}"
                               placeholder="0">
                    </td>
                    <td class="text-center status-cell">
                        ${statusBadge}
                    </td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-danger btn-pdf" 
                                data-student-id="${student.estudiante_id}" 
                                title="Descargar Boleta">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        elements.gradesGrid.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));

        // Listeners for inputs
        document.querySelectorAll('.grade-input').forEach(input => {
            input.addEventListener('change', handleGradeChange);
            input.addEventListener('keydown', handleNavigation);
            input.addEventListener('focus', (e) => e.target.select());
        });

        document.querySelectorAll('.faults-input').forEach(input => {
            input.addEventListener('change', handleGradeChange); // Guardar también al cambiar faltas
        });

        document.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', handleDownloadPDF);
        });
    }

    /**
     * Descargar Boleta PDF
     */
    async function handleDownloadPDF(e) {
        const btn = e.currentTarget;
        const studentId = btn.dataset.studentId;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Ciclo escolar hardcoded por ahora, o venir del state
            const cycle = '2024-2025';

            // Realizar fetch al endpoint que devuelve BLOB
            const response = await fetch(`/api/grades/student/${studentId}/pdf?cicloEscolar=${cycle}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `boleta_${studentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                showToast('Boleta descargada correctamente.', 'success');
            } else {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al generar PDF');
            }

        } catch (error) {
            console.error('Download error:', error);
            showToast(`Error al descargar la boleta: ${error.message}`, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-file-pdf"></i>';
        }
    }

    /**
     * Manejar cambio en input de calificación
     */
    async function handleGradeChange(e) {
        const input = e.target;
        const row = input.closest('tr');
        const studentId = row.dataset.studentId;

        const gradeInput = row.querySelector('.grade-input');
        const faultsInput = row.querySelector('.faults-input');
        const statusBadge = row.querySelector('.status-badge');

        const val = parseFloat(gradeInput.value);
        const faults = parseInt(faultsInput.value) || 0;

        if (gradeInput.value !== '' && (isNaN(val) || val < 0 || val > 10)) {
            gradeInput.classList.add('is-invalid');
            showToast('Calificación inválida (0-10)', 'warning');
            return;
        }
        gradeInput.classList.remove('is-invalid');

        // Si el campo está vacío, no guardamos (o podríamos borrar, pero por seguridad mejor no)
        if (gradeInput.value === '') return;

        // UI Optimista
        statusBadge.className = 'badge bg-warning status-badge';
        statusBadge.innerHTML = '<i class="fas fa-sync fa-spin"></i>';

        try {
            const payload = {
                estudianteId: parseInt(studentId),
                materiaId: state.currentSubjectId,
                periodoEvaluacionId: state.currentPeriodId,
                calificacion: val,
                observaciones: `Faltas: ${faults}` // Guardamos faltas en observaciones por ahora
            };

            const response = await fetch('/api/grades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(payload)
            });

            const res = await response.json();

            if (res.success) {
                statusBadge.className = 'badge bg-success status-badge';
                statusBadge.innerHTML = '<i class="fas fa-check"></i>';
                row.classList.add('table-success');
                setTimeout(() => row.classList.remove('table-success'), 1000);

                // Actualizar cache local
                state.grades[studentId] = {
                    ...state.grades[studentId],
                    calificacion: val,
                    observaciones: payload.observaciones
                };

            } else {
                throw new Error(res.message);
            }
        } catch (error) {
            console.error('Error saving grade:', error);
            statusBadge.className = 'badge bg-danger status-badge';
            statusBadge.innerHTML = '<i class="fas fa-times"></i>';
            showToast(`Error al guardar: ${error.message}`, 'error');
        }
    }

    /**
     * Navegación con teclado (Enter, Flechas)
     */
    function handleNavigation(e) {
        if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            const currentInput = e.target;
            const currentRow = currentInput.closest('tr');
            let targetRow;

            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                targetRow = currentRow.nextElementSibling;
            } else {
                targetRow = currentRow.previousElementSibling;
            }

            if (targetRow) {
                const nextInput = targetRow.querySelector('.grade-input');
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        }
    }

    /**
     * Event Listeners Globales
     */
    function setupEventListeners() {
        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', loadData);
            // Habilitar botón solo cuando se seleccionen ambos
            const checkEnable = () => {
                elements.refreshBtn.disabled = !(elements.periodSelect.value && elements.subjectSelect.value);
            };
            elements.periodSelect.addEventListener('change', checkEnable);
            elements.subjectSelect.addEventListener('change', checkEnable);
        }

        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const rows = elements.gradesGrid.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(term) ? '' : 'none';
                });
            });
        }
    }

    // Utils
    function showLoading(show) {
        if (elements.loadingSpinner) {
            elements.loadingSpinner.style.display = show ? 'block' : 'none';
        }
    }

    function showToast(msg, type = 'info') {
        if (window.BGE && window.BGE.UI && window.BGE.UI.Toast) {
            window.BGE.UI.Toast.show(msg, type);
        } else {
            void 0;
            // Fallback
            const container = document.getElementById('toast-container') || createToastContainer();
            const toastId = 'toast-' + Date.now();
            const bgClass = type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warning text-dark' : 'bg-success';

            const toastHtml = `
                <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">${msg}</div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="document.getElementById('${toastId}').remove()"></button>
                    </div>
                </div>`;

            const temp = document.createElement('div');
            temp.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(toastHtml) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(toastHtml) : toastHtml));
            container.appendChild(temp.firstElementChild);
            setTimeout(() => {
                const el = document.getElementById(toastId);
                if (el) el.remove();
            }, 3000);
        }
    }

    function createToastContainer() {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        div.style.zIndex = '1100';
        document.body.appendChild(div);
        return div;
    }

    // Init onload
    document.addEventListener('DOMContentLoaded', init);

})();
