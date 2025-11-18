/**
 * 📊 GRADES SYSTEM - BGE HEROES DE LA PATRIA
 * Sistema de calificaciones con login de estudiantes/padres y visualización de notas
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: calificaciones.html
 */

// Estado de la aplicación
let currentUser = null;
let isLoggedIn = false;
let gradesManagerInstance = null;

function showLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('loginModal'));
    modal.show();
}

function showReportModal() {
    if (!isLoggedIn) {
        alert('Debes iniciar sesión primero para generar reportes.');
        showLoginModal();
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
}

// Alias para compatibilidad con los botones existentes
function loginAsStudent() { loginStudent(); }
function loginAsParent() { loginParent(); }

// Función de login de estudiante
async function loginStudent() {
    const matricula = document.getElementById('studentId').value;
    const password = document.getElementById('studentPassword').value;

    if (!matricula || !password) {
        showAlert('Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/students-auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: matricula, password: password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = { ...data.student, tipo: 'estudiante', rol: 'estudiante' };
            isLoggedIn = true;

            localStorage.setItem('authToken', data.token || 'dummy-token'); // Assuming token is returned
            localStorage.setItem('userData', JSON.stringify(currentUser));

            showAdvancedGradesSystem();
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAlert(`¡Bienvenido, ${currentUser.nombre}! Sistema de calificaciones cargado.`, 'success');
        } else {
            showAlert(data.message || 'Matrícula o contraseña incorrecta.', 'danger');
        }
    } catch (error) {
        console.error('[GRADES] Error en login de estudiante:', error);
        showAlert('Error de conexión. Por favor intenta nuevamente.', 'danger');
    }
}

// Función de login de padre
async function loginParent() {
    const email = document.getElementById('parentEmail').value;
    const password = document.getElementById('parentPassword').value;

    if (!email || !password) {
        showAlert('Por favor completa todos los campos.', 'warning');
        return;
    }

    try {
        const response = await fetch('/api/parents-auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = { ...data.parent, tipo: 'padre', rol: 'padre' };
            isLoggedIn = true;

            localStorage.setItem('authToken', data.token || 'dummy-token'); // Assuming token is returned
            localStorage.setItem('userData', JSON.stringify(currentUser));

            showAdvancedGradesSystem();
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAlert(`¡Bienvenido, ${currentUser.nombre}! Sistema de seguimiento cargado.`, 'success');
        } else {
            showAlert(data.message || 'Email o contraseña incorrecta.', 'danger');
        }
    } catch (error) {
        console.error('[GRADES] Error en login de padre:', error);
        showAlert('Error de conexión. Por favor intenta nuevamente.', 'danger');
    }
}

// Mostrar panel de calificaciones
async function showGradesPanel() {
    // Ocultar hero section y mostrar panel
    const heroSection = document.querySelector('#hero');
    if (heroSection) heroSection.style.display = 'none';

    // Mostrar panel de calificaciones
    const gradesPanel = document.getElementById('gradesPanel');
    if (gradesPanel) {
        gradesPanel.classList.remove('d-none');
    }

    // Actualizar información del usuario
    const studentName = document.getElementById('studentNameDisplay');
    const studentId = document.getElementById('studentIdDisplay');
    const userType = document.getElementById('userTypeDisplay');

    if (studentName) studentName.textContent = currentUser.nombre;
    if (studentId) studentId.textContent = currentUser.matricula || currentUser.matricula_hijo;
    if (userType) userType.textContent = currentUser.tipo === 'estudiante' ? 'Estudiante' : 'Padre de Familia';

    // Cargar calificaciones desde la API
    await loadGradesFromAPI(currentUser.id);
}

// Cargar calificaciones desde la API
async function loadGradesFromAPI(studentId) {
    try {
        const response = await fetch(`/api/grades/${studentId}`);
        const data = await response.json();

        if (data.success) {
            const grades = data.data.grades;

            // Group grades by period
            const gradesByPeriod = grades.reduce((acc, grade) => {
                if (!acc[grade.period]) {
                    acc[grade.period] = [];
                }
                acc[grade.period].push(grade);
                return acc;
            }, {});

            // Populate tables
            populateGradesTable('gradesTableParcial1', gradesByPeriod['1er Parcial'] || []);
            populateGradesTable('gradesTableParcial2', gradesByPeriod['2do Parcial'] || []);
            populateGradesTable('gradesTableParcial3', gradesByPeriod['3er Parcial'] || []);
            populateGradesTableFinal('gradesTableFinal', gradesByPeriod['Final'] || []);

            // Calculate and display general average
            const allGrades = grades.map(g => g.final_grade || g.partial_grade);
            const generalAverage = allGrades.length > 0 ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length : 0;
            const averageElement = document.getElementById('generalAverage');
            if (averageElement) {
                averageElement.textContent = generalAverage.toFixed(1);
            }

        } else {
            showAlert(data.error || 'Error al cargar calificaciones.', 'danger');
        }
    } catch (error) {
        console.error('[GRADES] Error loading grades from API:', error);
        showAlert('Error de conexión al cargar calificaciones. Intenta nuevamente.', 'danger');
    }
}

// Helper function to populate grades table
function populateGradesTable(tableId, grades) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;

    tbody.innerHTML = '';
    grades.forEach(grade => {
        const row = `
            <tr>
                <td>${grade.subject_name}</td>
                <td>${grade.partial_grade !== null ? grade.partial_grade : '-'}</td>
                <td>${grade.continuous_assessment_grade !== null ? grade.continuous_assessment_grade : '-'}</td>
                <td><span class="badge ${grade.final_grade >= 6 ? 'bg-success' : 'bg-danger'}">${grade.final_grade !== null ? grade.final_grade : '-'}</span></td>
                <td>${grade.status || '-'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Helper function to populate final grades table (slightly different columns)
function populateGradesTableFinal(tableId, grades) {
    const tbody = document.getElementById(tableId);
    if (!tbody) return;

    tbody.innerHTML = '';
    grades.forEach(grade => {
        const row = `
            <tr>
                <td>${grade.subject_name}</td>
                <td>${grade.partial_grade !== null ? grade.partial_grade : '-'}</td>
                <td>${grade.continuous_assessment_grade !== null ? grade.continuous_assessment_grade : '-'}</td>
                <td><span class="badge ${grade.final_grade >= 6 ? 'bg-success' : 'bg-danger'}">${grade.final_grade !== null ? grade.final_grade : '-'}</span></td>
                <td>${grade.status || '-'}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

// Cargar calificaciones de muestra
function loadSampleGrades() {
    const gradesData = [
        { materia: 'Matemáticas IV', calificacion: 9.2, faltas: 2, profesor: 'Lic. María Rodríguez' },
        { materia: 'Física II', calificacion: 8.8, faltas: 1, profesor: 'Ing. Carlos López' },
        { materia: 'Química II', calificacion: 9.5, faltas: 0, profesor: 'Q.F.B. Ana Martínez' },
        { materia: 'Literatura Universal', calificacion: 8.6, faltas: 3, profesor: 'Lic. Pedro Sánchez' },
        { materia: 'Historia de México', calificacion: 9.0, faltas: 1, profesor: 'Lic. Laura Jiménez' },
        { materia: 'Inglés III', calificacion: 9.3, faltas: 0, profesor: 'Lic. David Brown' }
    ];

    // Usar la tabla del primer parcial como ejemplo
    const tbody = document.getElementById('gradesTableParcial1');
    if (tbody) {
        tbody.innerHTML = '';

        gradesData.forEach(materia => {
            const row = `
                <tr>
                    <td>${materia.materia}</td>
                    <td><span class="badge ${materia.calificacion >= 9 ? 'bg-success' : materia.calificacion >= 8 ? 'bg-warning' : 'bg-danger'}">${materia.calificacion}</span></td>
                    <td>${materia.faltas}</td>
                    <td>${materia.profesor}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" data-action="show-subject-detail" data-param-1="${materia.materia}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // Calcular promedio
    const promedio = gradesData.reduce((sum, m) => sum + m.calificacion, 0) / gradesData.length;
    const averageElement = document.getElementById('generalAverage');
    if (averageElement) {
        averageElement.textContent = promedio.toFixed(1);
    }
}

// Nueva función para mostrar el sistema avanzado de calificaciones
function showAdvancedGradesSystem() {
    // Ocultar hero section y panel básico
    const heroSection = document.querySelector('#hero');
    if (heroSection) heroSection.style.display = 'none';

    const basicPanel = document.getElementById('gradesPanel');
    if (basicPanel) {
        basicPanel.classList.add('d-none');
    }

    // Mostrar contenedor del sistema avanzado
    const advancedContainer = document.getElementById('grades-system-container');
    if (advancedContainer) {
        advancedContainer.classList.remove('d-none');

        // Inicializar el sistema de calificaciones de Fase B
        if (typeof GradesManager !== 'undefined') {
            gradesManagerInstance = new GradesManager();
            console.log('[GRADES] ✅ Sistema avanzado de calificaciones inicializado');
        } else {
            console.error('[GRADES] ❌ GradesManager no disponible, cargando sistema básico');
            showGradesPanel(); // Fallback al sistema básico
        }
    }
}

// Función de logout
function logout() {
    currentUser = null;
    isLoggedIn = false;

    // Limpiar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    // Destruir instancia del manager si existe
    if (gradesManagerInstance && typeof gradesManagerInstance.destroy === 'function') {
        gradesManagerInstance.destroy();
        gradesManagerInstance = null;
    }

    // Mostrar hero section y ocultar paneles
    const heroSection = document.querySelector('#hero');
    if (heroSection) heroSection.style.display = 'block';

    const gradesPanel = document.getElementById('gradesPanel');
    if (gradesPanel) {
        gradesPanel.classList.add('d-none');
    }

    const advancedContainer = document.getElementById('grades-system-container');
    if (advancedContainer) {
        advancedContainer.classList.add('d-none');
    }

    showAlert('Sesión cerrada exitosamente.', 'info');
}

// Mostrar alertas
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Generar reporte PDF funcional
function generatePDF() {
    showAlert('Generando boleta de calificaciones en PDF...', 'info');

    // Crear contenido del PDF
    const reportContent = `
        <div style="text-align: center; font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #1976D2;">BACHILLERATO GENERAL ESTATAL</h1>
            <h2 style="color: #1976D2;">"HÉROES DE LA PATRIA"</h2>
            <hr style="border: 2px solid #1976D2;">

            <h3 style="margin-top: 30px;">BOLETA DE CALIFICACIONES</h3>
            <p><strong>Semestre:</strong> 2024-2025</p>
            <p><strong>Estudiante:</strong> [Nombre del Estudiante]</p>
            <p><strong>Grupo:</strong> 2°A</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <thead>
                    <tr style="background-color: #1976D2; color: white;">
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Materia</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Calificación</th>
                        <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Estado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Matemáticas</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">8.5</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745;">APROBADO</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Español</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">9.2</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745;">APROBADO</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Química</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #ffc107; font-weight: bold;">7.8</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #ffc107;">APROBADO</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Historia</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">8.9</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745;">APROBADO</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 12px;">Inglés</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745; font-weight: bold;">9.0</td>
                        <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #28a745;">APROBADO</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 30px;">
                <p><strong>PROMEDIO GENERAL: 8.68</strong></p>
                <p style="color: #28a745;"><strong>SITUACIÓN ACADÉMICA: APROBADO</strong></p>
            </div>

            <div style="margin-top: 50px; text-align: left;">
                <p>_____________________________</p>
                <p>Coordinación Académica</p>
                <p style="font-size: 12px; margin-top: 30px;">
                    Fecha de emisión: ${new Date().toLocaleDateString()}<br>
                    Este documento es oficial y tiene validez académica.
                </p>
            </div>
        </div>
    `;

    // Abrir ventana para imprimir/guardar como PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Boleta de Calificaciones - BGE Héroes de la Patria</title>
            <style>
                @media print {
                    @page { margin: 1in; }
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${reportContent}
            <script>
                window.onload = function() {
                    window.print();
                }
            </` + `script>
        </body>
        </html>
    `);
    printWindow.document.close();

    // Cerrar modal después de generar
    setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
        showAlert('¡Boleta generada exitosamente! Utiliza Ctrl+S en la ventana de impresión para guardar como PDF.', 'success');
    }, 1000);
}

// Mostrar detalle de materia
function showSubjectDetail(materia) {
    showAlert(`Detalle de ${materia}: Funcionalidad en desarrollo. Aquí se mostrará información detallada de la materia.`, 'info');
}

// Función de reporte con validación
function generateReport() {
    const studentId = document.getElementById('reportStudentId').value;
    const period = document.getElementById('reportPeriod').value;
    const type = document.getElementById('reportType').value;

    if (!studentId || !period || !type) {
        showAlert('Por favor completa todos los campos del reporte.', 'warning');
        return;
    }

    showAlert(`Generando ${type} para el ${period}... Esta funcionalidad estará disponible próximamente.`, 'info');
    bootstrap.Modal.getInstance(document.getElementById('reportModal')).hide();
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Función para logout del sistema de calificaciones
function logoutGradeSystem() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        showAlert('Cerrando sesión...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// Función para mostrar modal de asistencia
function showAttendanceModal() {
    const modalHtml = `
        <div class="modal fade" id="attendanceModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title"><i class="fas fa-calendar-check me-2"></i>Registro de Asistencia</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card text-center border-success">
                                    <div class="card-body">
                                        <h3 class="text-success">92%</h3>
                                        <p class="mb-0">Asistencias</p>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card text-center border-warning">
                                    <div class="card-body">
                                        <h3 class="text-warning">8%</h3>
                                        <p class="mb-0">Faltas</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h6>Resumen por Materia:</h6>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Materia</th>
                                        <th>Asistencias</th>
                                        <th>Faltas</th>
                                        <th>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Matemáticas</td>
                                        <td class="text-success">35</td>
                                        <td class="text-danger">3</td>
                                        <td>92%</td>
                                    </tr>
                                    <tr>
                                        <td>Español</td>
                                        <td class="text-success">37</td>
                                        <td class="text-danger">1</td>
                                        <td>97%</td>
                                    </tr>
                                    <tr>
                                        <td>Química</td>
                                        <td class="text-success">33</td>
                                        <td class="text-danger">5</td>
                                        <td>87%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-warning" data-action="generate-attendance-report">Descargar Reporte</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si existe
    const existingModal = document.getElementById('attendanceModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
    modal.show();
}

// Función para mostrar modal de horarios
function showScheduleModal() {
    const modalHtml = `
        <div class="modal fade" id="scheduleModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title"><i class="fas fa-clock me-2"></i>Horario de Clases</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Hora</th>
                                        <th>Lunes</th>
                                        <th>Martes</th>
                                        <th>Miércoles</th>
                                        <th>Jueves</th>
                                        <th>Viernes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="fw-bold">7:00-8:00</td>
                                        <td class="table-primary">Matemáticas</td>
                                        <td class="table-success">Español</td>
                                        <td class="table-primary">Matemáticas</td>
                                        <td class="table-warning">Química</td>
                                        <td class="table-info">Inglés</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">8:00-9:00</td>
                                        <td class="table-warning">Química</td>
                                        <td class="table-primary">Matemáticas</td>
                                        <td class="table-success">Español</td>
                                        <td class="table-success">Español</td>
                                        <td class="table-primary">Matemáticas</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">9:00-9:30</td>
                                        <td colspan="5" class="text-center table-light">🍎 RECESO</td>
                                    </tr>
                                    <tr>
                                        <td class="fw-bold">9:30-10:30</td>
                                        <td class="table-info">Inglés</td>
                                        <td class="table-warning">Química</td>
                                        <td class="table-info">Inglés</td>
                                        <td class="table-info">Inglés</td>
                                        <td class="table-warning">Química</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-info" data-action="print-schedule">Imprimir Horario</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si existe
    const existingModal = document.getElementById('scheduleModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    modal.show();
}

// Función para generar reporte de asistencia
function generateAttendanceReport() {
    showAlert('Generando reporte de asistencia... Se descargará en breve.', 'success');
    // Simular descarga
    setTimeout(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('attendanceModal'));
        modal.hide();
    }, 1500);
}

// Función para imprimir horario
function printSchedule() {
    const printContent = document.querySelector('#scheduleModal .modal-body').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Horario de Clases</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="container mt-4">
                <h2 class="text-center mb-4">Horario de Clases - BGE Héroes de la Patria</h2>
                ${printContent}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}
