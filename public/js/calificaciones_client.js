
/**
 * 🎓 Módulo Cliente de Calificaciones
 * Maneja la interacción con la API de calificaciones para estudiantes y padres.
 */

document.addEventListener('DOMContentLoaded', () => {
    initializeGradesSystem();
});

let currentUser = null;
let currentStudentId = null;
let authToken = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('student_auth_token') || localStorage.getItem('parent_auth_token') || localStorage.getItem('authToken');

function getCurrentSchoolCycle() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function initializeGradesSystem() {
    setupEventListeners();
    checkActiveSession();
}

function setupEventListeners() {
    const btnLoginStudent = document.querySelector('button[data-action="loginAsStudent"]');
    if (btnLoginStudent) btnLoginStudent.addEventListener('click', handleStudentLogin);

    const btnLoginParent = document.querySelector('button[data-action="loginAsParent"]');
    if (btnLoginParent) btnLoginParent.addEventListener('click', handleParentLogin);

    const btnLogout = document.querySelector('button[data-action="logoutGradeSystem"]');
    if (btnLogout) btnLogout.addEventListener('click', logout);

    document.querySelectorAll('[data-action="showLoginModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        });
    });

    document.querySelectorAll('[data-action="generateReport"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const type = e.currentTarget.dataset.reportType;
            if (type !== 'boleta') {
                showAlert(`Generación de reporte tipo '${type}' en construcción.`, 'info');
                return;
            }

            if (!currentStudentId) {
                showAlert('No se ha identificado al estudiante.', 'danger');
                return;
            }

            const btn = e.currentTarget;
            const originalText = btn.innerHTML;

            try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando...';

                // Usamos el ciclo escolar dinámico
                const cycle = getCurrentSchoolCycle();
                const response = await fetch(`/api/grades/student/${currentStudentId}/pdf?cicloEscolar=${cycle}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `boleta_${currentStudentId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                    showAlert('Boleta descargada correctamente.', 'success');
                } else {
                    const errData = await response.json();
                    throw new Error(errData.message || 'Error al generar PDF');
                }

            } catch (error) {
                console.error('Download error:', error);
                showAlert(`Error al descargar la boleta: ${error.message}`, 'danger');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    });

    document.querySelectorAll('[data-action="showReportModal"]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!currentStudentId) {
                // If not logged in, maybe show login modal? 
                // But the card is public. So let's just prompt login.
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
                return;
            }
            const modal = new bootstrap.Modal(document.getElementById('reportModal'));
            modal.show();
            // Pre-fill student ID if available
            const inputId = document.getElementById('reportStudentId');
            if (inputId && currentStudentId) {
                // We might need the matricula string, but currentStudentId is likely the internal ID
                // For now let's leave it blank or try to fill it
                // inputId.value = ... 
            }
        });
    });

    document.querySelectorAll('[data-action="generate-report"]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const typeSelect = document.getElementById('reportType');
            const type = typeSelect ? typeSelect.value : '';

            if (type !== 'boleta') {
                showAlert(`Generación de reporte tipo '${type}' en construcción. Seleccione 'Boleta de Calificaciones'.`, 'info');
                return;
            }

            if (!currentStudentId) {
                showAlert('No se ha identificado al estudiante.', 'danger');
                return;
            }

            // Trigger the same download logic
            // Ideally we refactor 'downloadPDF' into a shared function
            downloadPDF(e.currentTarget);
        });
    });

    // Helper function for download to reuse logic
    async function downloadPDF(btn) {
        const originalText = btn.innerHTML;
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando...';

            const cycle = getCurrentSchoolCycle();
            const response = await fetch(`/api/grades/student/${currentStudentId}/pdf?cicloEscolar=${cycle}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `boleta_${currentStudentId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                showAlert('Boleta descargada correctamente.', 'success');

                // Hide modal if open
                const modalEl = document.getElementById('reportModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                if (modal) modal.hide();

            } else {
                const errData = await response.json();
                throw new Error(errData.message || 'Error al generar PDF');
            }

        } catch (error) {
            console.error('Download error:', error);
            showAlert(`Error al descargar la boleta: ${error.message}`, 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

async function checkActiveSession() {
    authToken = localStorage.getItem('bge_auth_token') || localStorage.getItem('auth_token') || localStorage.getItem('student_auth_token') || localStorage.getItem('parent_auth_token') || localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('auth_user') || localStorage.getItem('bge_user_data') || localStorage.getItem('userData');
    if (authToken && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            if (currentUser.role === 'estudiante' || currentUser.matricula) {
                currentStudentId = currentUser.id || currentUser.matricula;
                await loadGradesPanel();
            } else if (currentUser.role === 'padre' || currentUser.role === 'padre_familia' || currentUser.role === 'parent') {
                await loadParentDashboard();
            }
        } catch (e) { }
    }
}

// ==========================================
// LOGIN HANDLERS
// ==========================================

async function handleStudentLogin() {
    const matricula = document.getElementById('studentId').value;
    const password = document.getElementById('studentPassword').value;

    if (!matricula || !password) {
        showAlert('Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: matricula, password: password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = { ...data.user, role: 'estudiante' };
            authToken = data.token || (data.tokens && data.tokens.accessToken) || data.accessToken;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('auth_token', authToken);
            localStorage.setItem('bge_auth_token', authToken);
            localStorage.setItem('student_auth_token', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            localStorage.setItem('auth_user', JSON.stringify(currentUser));
            currentStudentId = data.user.id || matricula;

            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAlert(`Bienvenido(a), ${currentUser.nombre || currentUser.username}`, 'success');
            await loadGradesPanel();
        } else {
            showAlert(data.message || data.error || 'Credenciales incorrectas', 'danger');
        }
    } catch (error) {
        console.error('Error login estudiante:', error);
        showAlert('Error de conexión', 'danger');
    }
}

async function handleParentLogin() {
    const email = document.getElementById('parentEmail').value;
    const password = document.getElementById('parentPassword').value;

    if (!email || !password) {
        showAlert('Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/parents/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = { ...data.data.parent, role: 'padre' };
            authToken = data.data.token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));

            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAlert(`Bienvenido, ${currentUser.nombre}`, 'success');
            await loadParentDashboard();
        } else {
            showAlert(data.error || 'Credenciales incorrectas', 'danger');
        }
    } catch (error) {
        console.error('Error login padre:', error);
        showAlert('Error de conexión', 'danger');
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    authToken = null;
    currentUser = null;
    currentStudentId = null;

    document.getElementById('gradesPanel').classList.add('d-none');
    document.getElementById('studentId').value = '';
    document.getElementById('studentPassword').value = '';
    document.getElementById('parentEmail').value = '';
    document.getElementById('parentPassword').value = '';

    showAlert('Sesión cerrada correctamente', 'info');
}

// ==========================================
// DASHBOARD & DATA LOADING
// ==========================================

async function loadParentDashboard() {
    try {
        const response = await fetch('/api/parents/dashboard', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (data.success && data.data.students.length > 0) {
            const student = data.data.students[0];
            currentStudentId = student.id;
            showAlert(`Cargando información de: ${student.nombre_completo}`, 'info');
            await loadGradesForStudent(currentStudentId, true);
        } else {
            showAlert('No se encontraron estudiantes asociados.', 'warning');
        }
    } catch (error) {
        console.error('Error cargando dashboard padre:', error);
    }
}

async function loadGradesPanel() {
    await loadGradesForStudent(currentStudentId, false);
}

async function loadGradesForStudent(studentId, isParentView) {
    const panel = document.getElementById('gradesPanel');
    panel.classList.remove('d-none');
    panel.scrollIntoView({ behavior: 'smooth' });

    document.getElementById('studentNameDisplay').textContent = isParentView ? 'Estudiante' : (currentUser.nombre || 'Estudiante');
    document.getElementById('userTypeDisplay').textContent = isParentView ? 'Vista Tutor' : 'Alumno';
    document.getElementById('studentIdDisplay').textContent = studentId;

    try {
        const cycle = getCurrentSchoolCycle();
        const endpoint = isParentView
            ? `/api/parents/students/${studentId}/grades`
            : `/api/grades/student/${studentId}?cicloEscolar=${cycle}`;

        const response = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        const result = await response.json();

        if (result.success) {
            const gradesData = result.data;
            let boleta = [];
            let stats = {};

            if (isParentView) {
                boleta = gradesData.grades || [];
                stats = gradesData.summary || {};
            } else {
                boleta = gradesData.boleta || [];
                stats = {
                    promedio_general: gradesData.promedio_general,
                    total_materias: gradesData.materias_cursadas
                };
            }

            renderGradesTables(boleta);
            renderStats(stats);
            renderChart(boleta);
        } else {
            showAlert('No se pudieron cargar las calificaciones.', 'warning');
        }

    } catch (error) {
        console.error('Error fetching grades:', error);
        showAlert('Error al obtener datos académicos', 'danger');
    }
}

// ==========================================
// RENDERERS
// ==========================================

function renderStats(stats) {
    document.getElementById('generalAverage').textContent = stats.promedio_general || '-';
    document.getElementById('totalSubjects').textContent = stats.total_materias || '-';
    document.getElementById('passedSubjects').textContent = stats.materias_aprobadas || '-';
    document.getElementById('riskSubjects').textContent = stats.materias_reprobadas || '-';
}

function renderGradesTables(boleta) {
    ['parcial1', 'parcial2', 'parcial3', 'final'].forEach(p => {
        document.getElementById(`gradesTable${capitalize(p)}`).innerHTML = '';
    });

    if (!boleta || boleta.length === 0) {
        document.getElementById('gradesTableParcial1').innerHTML = '<tr><td colspan="6" class="text-center">No hay calificaciones registradas</td></tr>';
        return;
    }

    boleta.forEach(materia => {
        const parciales = materia.parciales || {};

        const p1Val = parciales['Parcial 1'] || parciales['1'] || parciales['Primer Parcial'];
        const p2Val = parciales['Parcial 2'] || parciales['2'] || parciales['Segundo Parcial'];
        const p3Val = parciales['Parcial 3'] || parciales['3'] || parciales['Tercer Parcial'];

        if (p1Val !== undefined) appendRow('gradesTableParcial1', materia, { calificacion: p1Val });
        if (p2Val !== undefined) appendRow('gradesTableParcial2', materia, { calificacion: p2Val });
        if (p3Val !== undefined) appendRow('gradesTableParcial3', materia, { calificacion: p3Val });

        if (materia.promedio_final) {
            const tbody = document.getElementById('gradesTableFinal');
            const row = document.createElement('tr');
            const prom = parseFloat(materia.promedio_final);
            row.innerHTML = `
                <td>${materia.materia}</td>
                <td>-</td>
                <td>${materia.promedio_final}</td>
                <td>-</td>
                <td class="fw-bold">${materia.promedio_final}</td>
                <td class="${prom >= 6 ? 'text-success' : 'text-danger'}">
                    ${prom >= 6 ? 'Aprobado' : 'Reprobado'}
                </td>
             `;
            tbody.appendChild(row);
        }
    });
}

function appendRow(tableId, materia, califData) {
    const tbody = document.getElementById(tableId);
    const row = document.createElement('tr');

    const calif = parseFloat(califData.calificacion);
    const estadoClass = calif >= 6 ? 'text-success' : 'text-danger';
    const estadoTexto = calif >= 6 ? 'Aprobado' : 'Reprobado';

    row.innerHTML = `
        <td>${materia.materia}</td>
        <td>${materia.docente || '-'}</td>
        <td>${calif || '-'}</td>
        <td>-</td>
        <td class="fw-bold">${calif || '-'}</td>
        <td class="${estadoClass}"><i class="fas fa-circle small me-1"></i>${estadoTexto}</td>
    `;
    tbody.appendChild(row);
}

function renderChart(boleta) {
    const ctx = document.getElementById('subjectChart');
    if (!ctx) return;

    if (window.gradesChart instanceof Chart) window.gradesChart.destroy();

    const labels = boleta.map(m => m.materia);
    const data = boleta.map(m => {
        if (m.promedio_final && m.promedio_final !== '-') return parseFloat(m.promedio_final);
        const vals = Object.values(m.parciales || {});
        return vals.length > 0 ? parseFloat(vals[0]) : 0;
    });

    window.gradesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio por Materia',
                data: data,
                backgroundColor: 'rgba(25, 118, 210, 0.6)',
                borderColor: 'rgba(25, 118, 210, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 10 } }
        }
    });
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function showAlert(message, type) {
    const alertContainer = document.querySelector('.alert-container') || createAlertContainer();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.className = 'alert-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = 1050;
    document.body.appendChild(container);
    return container;
}
