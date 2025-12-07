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
        searchInput: document.getElementById('searchStudent')
    };

    /**
     * Inicialización del módulo
     */
    async function init() {
        console.log('🚀 Inicializando Sistema de Captura de Calificaciones...');

        // Verificar Auth (Usando el módulo de seguridad existente o check manual)
        // Asumimos que secureAdminAuth o similar ya corrió, pero verificamos token.
        const token = localStorage.getItem('authToken'); // O cookie
        if (!token) {
            window.location.href = '/login.html'; // O mostrar modal
            return;
        }

        try {
            showLoading(true);
            await Promise.all([loadPeriods(), loadSubjects()]);
            setupEventListeners();
            showLoading(false);
        } catch (error) {
            console.error('Error inicializando:', error);
            showToast('Error al cargar datos iniciales. Verifique su conexión.', 'error');
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
            const isActive = p.estado === 'activo'; // TODO: validar fechas
            const option = document.createElement('option');
            option.value = p.id;
            // Emoji para estado
            const statusIcon = isActive ? '🟢' : '🔒';
            option.textContent = `${statusIcon} ${p.nombre} (${p.codigo})`;
            if (!isActive) option.disabled = true; // O permitir ver histórico
            elements.periodSelect.appendChild(option);
        });
    }

    function renderSubjectSelect() {
        elements.subjectSelect.innerHTML = '<option value="">Seleccione Materia...</option>';
        state.subjects.forEach(s => {
            const option = document.createElement('option');
            option.value = s.id;
            option.textContent = `${s.nombre} (${s.total_estudiantes || 0} alumnos)`;
            elements.subjectSelect.appendChild(option);
        });
    }

    /**
     * Cargar Estudiantes de la materia seleccionada
     */
    async function loadStudents(materiaId) {
        if (!materiaId) return;

        showLoading(true);
        state.currentSubjectId = materiaId;
        elements.gradesGrid.innerHTML = ''; // Limpiar

        try {
            const response = await fetch(`/api/grades/subject/${materiaId}/students`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            const data = await response.json();
            if (data.success) {
                state.students = data.data;
                renderGradesGrid(); // TODO: Necesitamos también las calificaciones EXISTENTES
                // Por ahora renderizamos lista vacía o fetch calificaciones existentes aquí?
                // Lo ideal: fetch grades del grupo para este periodo.
                // Pendiente: Endpoint GET /api/grades/subject/:id/period/:periodId

                // NOTA: Para simplicidad, podríamos asumir que al cargar estudiantes, si ya hay notas, 
                // deberíamos cargarlas. 
                // SOLUCIÓN RAPIDA: Usar el endpoint de boleta por estudiante es muy lento (N requests).
                // NECESITAMOS: GET /api/grades/batch?materiaId=X&periodoId=Y

                // Si no existe, podemos iterar (lento) o implementar endpoint batch.
                // Implementaremos visualización limpia primero.
            }
        } catch (error) {
            console.error('Error loading students:', error);
            showToast('Error al cargar lista de estudiantes', 'error');
        } finally {
            showLoading(false);
        }
    }

    /**
     * Renderizar Grid de Calificaciones (Excel-like)
     */
    function renderGradesGrid() {
        if (!state.currentSubjectId || !state.currentPeriodId) {
            elements.gradesGrid.innerHTML = '<div class="alert alert-info">Seleccione una materia y un periodo para comenzar la captura.</div>';
            return;
        }

        let html = `
            <table class="table table-hover table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 15%">Matrícula</th>
                        <th style="width: 40%">Nombre del Estudiante</th>
                        <th style="width: 15%" class="text-center">Calificación</th>
                        <th style="width: 15%" class="text-center">Faltas</th>
                        <th style="width: 10%" class="text-center">Estado</th>
                        <th style="width: 5%" class="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

        state.students.forEach((student, index) => {
            // TODO: Buscar calificación existente en state.existingGrades (si tuvieramos batch load)
            const gradeVal = ''; // student.grade; 
            const faultsVal = ''; // student.faults;

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
                        <span class="badge bg-secondary status-badge"><i class="fas fa-minus"></i></span>
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
        elements.gradesGrid.innerHTML = html;

        // Re-attach listeners for inputs
        document.querySelectorAll('.grade-input').forEach(input => {
            input.addEventListener('change', handleGradeChange);
            input.addEventListener('keydown', handleNavigation); // Excel navigation
        });

        // PDF listeners
        document.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', handleDownloadPDF);
        });
    }

    /**
     * Descargar Boleta PDF
     */
    async function handleDownloadPDF(e) {
        const btn = e.currentTarget; // btn es button, target puede ser icono
        const studentId = btn.dataset.studentId;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const response = await fetch(`/api/reports/boleta/${studentId}?ciclo=2025-2026`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (!response.ok) throw new Error('Error generando PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `boleta_${studentId}_2025-2026.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            showToast('Boleta descargada exitosamente', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Error al descargar la boleta', 'error');
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
        const studentId = input.dataset.studentId;
        const val = parseFloat(input.value);
        const row = input.closest('tr');
        const statusBadge = row.querySelector('.status-badge');

        if (isNaN(val) || val < 0 || val > 10) {
            input.classList.add('is-invalid');
            showToast('Calificación inválida (0-10)', 'warning');
            return;
        }
        input.classList.remove('is-invalid');

        // UI Optimista
        statusBadge.className = 'badge bg-warning status-badge';
        statusBadge.innerHTML = '<i class="fas fa-sync fa-spin"></i>';

        // Guardar
        try {
            const payload = {
                estudianteId: parseInt(studentId),
                materiaId: state.currentSubjectId,
                periodoEvaluacionId: state.currentPeriodId,
                calificacion: val,
                // TODO: Faltas
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
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const currentInput = e.target;
            const currentRow = currentInput.closest('tr');
            const nextRow = currentRow.nextElementSibling;
            if (nextRow) {
                const nextInput = nextRow.querySelector('.grade-input');
                if (nextInput) nextInput.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const currentInput = e.target;
            const currentRow = currentInput.closest('tr');
            const prevRow = currentRow.previousElementSibling;
            if (prevRow) {
                const prevInput = prevRow.querySelector('.grade-input');
                if (prevInput) prevInput.focus();
            }
        }
    }

    /**
     * Event Listeners Globales
     */
    function setupEventListeners() {
        elements.periodSelect.addEventListener('change', (e) => {
            state.currentPeriodId = parseInt(e.target.value);
            renderGradesGrid(); // Si ya hay materia, recargar grid
        });

        elements.subjectSelect.addEventListener('change', (e) => {
            const materiaId = parseInt(e.target.value);
            loadStudents(materiaId);
        });

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
        // Usar sistema de notificaciones global si existe, o alert fallback
        if (window.BGE && window.BGE.UI && window.BGE.UI.Toast) {
            window.BGE.UI.Toast.show(msg, type);
        } else {
            console.log(`[TOAST ${type}] ${msg}`);
            // Fallback simple visual
            const toastContainer = document.getElementById('toast-container') || createToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : 'success'} border-0 show`;
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">${msg}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>`;
            toastContainer.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
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
