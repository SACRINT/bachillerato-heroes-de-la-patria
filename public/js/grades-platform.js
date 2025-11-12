// Plataforma de Calificaciones
class GradePlatform {
    constructor() {
        this.currentSession = null;
        this.currentUser = null;
        this.userType = null; // 'student' or 'parent'
        this.isLoggedIn = false;
        this.subjectChart = null;
        
        // Datos demo del estudiante
        this.studentData = {
            student: {
                id: '20230001',
                name: 'Ana María González Pérez',
                password: 'estudiante123',
                semester: '3°',
                group: 'A'
            },
            parent: {
                email: 'padre@demo.com',
                password: 'padre123',
                name: 'Carlos González López'
            },
            subjects: [
                {
                    id: 'MAT301',
                    name: 'Matemáticas III',
                    teacher: 'Lic. Roberto Mendoza',
                    credits: 5,
                    parcial1: { evaluacionParcial: 8.5, evaluacionContinua: 9.0, promedio: 8.7 },
                    parcial2: { evaluacionParcial: 9.0, evaluacionContinua: 8.8, promedio: 8.9 },
                    parcial3: { evaluacionParcial: 8.8, evaluacionContinua: 9.2, promedio: 9.0 },
                    final: { evaluacionFinal: 9.1, calificacionFinal: 8.9 }
                },
                {
                    id: 'FIS301',
                    name: 'Física III',
                    teacher: 'Ing. María Elena Torres',
                    credits: 4,
                    parcial1: { evaluacionParcial: 7.8, evaluacionContinua: 8.2, promedio: 8.0 },
                    parcial2: { evaluacionParcial: 8.2, evaluacionContinua: 8.0, promedio: 8.1 },
                    parcial3: { evaluacionParcial: 8.5, evaluacionContinua: 8.3, promedio: 8.4 },
                    final: { evaluacionFinal: 8.6, calificacionFinal: 8.3 }
                },
                {
                    id: 'QUIM301',
                    name: 'Química III',
                    teacher: 'Q.F.B. Ana Luisa Ramírez',
                    credits: 4,
                    parcial1: { evaluacionParcial: 9.2, evaluacionContinua: 9.5, promedio: 9.3 },
                    parcial2: { evaluacionParcial: 9.0, evaluacionContinua: 9.3, promedio: 9.1 },
                    parcial3: { evaluacionParcial: 9.4, evaluacionContinua: 9.6, promedio: 9.5 },
                    final: { evaluacionFinal: 9.7, calificacionFinal: 9.4 }
                },
                {
                    id: 'BIO301',
                    name: 'Biología III',
                    teacher: 'Biol. Jorge Arturo Vásquez',
                    credits: 4,
                    parcial1: { evaluacionParcial: 8.0, evaluacionContinua: 8.5, promedio: 8.2 },
                    parcial2: { evaluacionParcial: 8.3, evaluacionContinua: 8.7, promedio: 8.5 },
                    parcial3: { evaluacionParcial: 8.8, evaluacionContinua: 9.0, promedio: 8.9 },
                    final: { evaluacionFinal: 9.0, calificacionFinal: 8.6 }
                },
                {
                    id: 'ESP301',
                    name: 'Español III',
                    teacher: 'Lic. Patricia Morales',
                    credits: 3,
                    parcial1: { evaluacionParcial: 9.5, evaluacionContinua: 9.8, promedio: 9.6 },
                    parcial2: { evaluacionParcial: 9.3, evaluacionContinua: 9.5, promedio: 9.4 },
                    parcial3: { evaluacionParcial: 9.7, evaluacionContinua: 9.9, promedio: 9.8 },
                    final: { evaluacionFinal: 9.8, calificacionFinal: 9.6 }
                },
                {
                    id: 'ING301',
                    name: 'Inglés III',
                    teacher: 'Lic. Michael Johnson',
                    credits: 3,
                    parcial1: { evaluacionParcial: 8.8, evaluacionContinua: 9.0, promedio: 8.9 },
                    parcial2: { evaluacionParcial: 9.1, evaluacionContinua: 8.9, promedio: 9.0 },
                    parcial3: { evaluacionParcial: 9.3, evaluacionContinua: 9.2, promedio: 9.2 },
                    final: { evaluacionFinal: 9.4, calificacionFinal: 9.1 }
                },
                {
                    id: 'HIST301',
                    name: 'Historia de México III',
                    teacher: 'Lic. Eduardo Hernández',
                    credits: 3,
                    parcial1: { evaluacionParcial: 7.5, evaluacionContinua: 8.0, promedio: 7.7 },
                    parcial2: { evaluacionParcial: 7.8, evaluacionContinua: 8.2, promedio: 8.0 },
                    parcial3: { evaluacionParcial: 8.0, evaluacionContinua: 8.5, promedio: 8.2 },
                    final: { evaluacionFinal: 8.3, calificacionFinal: 8.1 }
                },
                {
                    id: 'ED_FIS301',
                    name: 'Educación Física III',
                    teacher: 'Prof. Carlos Ruiz',
                    credits: 2,
                    parcial1: { evaluacionParcial: 5.5, evaluacionContinua: 6.0, promedio: 5.7 },
                    parcial2: { evaluacionParcial: 6.0, evaluacionContinua: 6.5, promedio: 6.2 },
                    parcial3: { evaluacionParcial: 6.3, evaluacionContinua: 6.8, promedio: 6.5 },
                    final: { evaluacionFinal: 6.8, calificacionFinal: 6.4 }
                }
            ],
            attendance: {
                totalClasses: 120,
                attendedClasses: 110,
                percentage: 91.7
            },
            schedule: [
                { day: 'Lunes', time: '07:00-07:50', subject: 'Matemáticas III', room: 'Aula 15' },
                { day: 'Lunes', time: '07:50-08:40', subject: 'Física III', room: 'Lab. Física' },
                { day: 'Lunes', time: '08:40-09:30', subject: 'Química III', room: 'Lab. Química' },
                { day: 'Lunes', time: '09:50-10:40', subject: 'Biología III', room: 'Aula 12' },
                { day: 'Lunes', time: '10:40-11:30', subject: 'Español III', room: 'Aula 8' },
                { day: 'Lunes', time: '11:30-12:20', subject: 'Inglés III', room: 'Aula 3' }
            ]
        };

        this.initializeSystem();
    }

    initializeSystem() {
        // Verificar si hay una sesión activa
        const savedSession = localStorage.getItem('gradeSession');
        if (savedSession) {
            this.currentSession = JSON.parse(savedSession);
            if (this.currentSession.expires > Date.now()) {
                this.isLoggedIn = true;
                this.userType = this.currentSession.userType;
                this.showGradePanel();
            } else {
                localStorage.removeItem('gradeSession');
            }
        }
    }

    // Funciones de autenticación
    loginAsStudent() {
        const studentId = document.getElementById('studentId').value;
        const password = document.getElementById('studentPassword').value;

        if (studentId === this.studentData.student.id && password === this.studentData.student.password) {
            this.createSession('student');
            this.showSuccessToast('Acceso como estudiante exitoso');
        } else {
            this.showErrorToast('Credenciales de estudiante incorrectas');
        }
    }

    loginAsParent() {
        const email = document.getElementById('parentEmail').value;
        const studentId = document.getElementById('parentStudentId').value;
        const password = document.getElementById('parentPassword').value;

        if (email === this.studentData.parent.email && 
            studentId === this.studentData.student.id && 
            password === this.studentData.parent.password) {
            this.createSession('parent');
            this.showSuccessToast('Acceso como padre de familia exitoso');
        } else {
            this.showErrorToast('Credenciales de padre de familia incorrectas');
        }
    }

    createSession(userType) {
        this.currentSession = {
            studentId: this.studentData.student.id,
            userType: userType,
            loginTime: Date.now(),
            expires: Date.now() + (4 * 60 * 60 * 1000) // 4 horas
        };

        localStorage.setItem('gradeSession', JSON.stringify(this.currentSession));
        this.isLoggedIn = true;
        this.userType = userType;

        // Cerrar modal y mostrar panel
        const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
        loginModal.hide();

        this.showGradePanel();
    }

    logoutGradeSystem() {
        localStorage.removeItem('gradeSession');
        this.currentSession = null;
        this.isLoggedIn = false;
        this.userType = null;
        this.hideGradePanel();
        this.destroyChart();
        this.showSuccessToast('Sesión cerrada correctamente');
    }

    showGradePanel() {
        // Ocultar hero section
        document.getElementById('hero').style.display = 'none';
        
        // Mostrar panel de calificaciones
        const gradePanel = document.getElementById('gradesPanel');
        gradePanel.classList.remove('d-none');
        
        // Configurar información del usuario
        this.setupUserInfo();
        
        // Cargar calificaciones
        this.loadGrades();
        
        // Crear gráficos
        this.createSubjectChart();
        
        // Scroll al panel
        gradePanel.scrollIntoView({ behavior: 'smooth' });
    }

    hideGradePanel() {
        // Mostrar hero section
        document.getElementById('hero').style.display = 'block';
        
        // Ocultar panel de calificaciones
        document.getElementById('gradesPanel').classList.add('d-none');
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setupUserInfo() {
        const studentName = this.userType === 'student' ? 
            this.studentData.student.name : 
            `${this.studentData.student.name} (${this.studentData.parent.name})`;
        
        document.getElementById('studentNameDisplay').textContent = studentName;
        document.getElementById('studentIdDisplay').textContent = this.studentData.student.id;
        document.getElementById('currentSemester').textContent = this.studentData.student.semester;
        document.getElementById('userTypeDisplay').textContent = 
            this.userType === 'student' ? 'Estudiante' : 'Padre de Familia';
        document.getElementById('userTypeDisplay').className = 
            `badge ms-2 ${this.userType === 'student' ? 'bg-primary' : 'bg-success'}`;

        // Calcular estadísticas
        this.calculateStatistics();
    }

    calculateStatistics() {
        const subjects = this.studentData.subjects;
        const finalGrades = subjects.map(subject => subject.final.calificacionFinal);
        
        const generalAverage = (finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length).toFixed(1);
        const passedSubjects = finalGrades.filter(grade => grade >= 6).length;
        const riskSubjects = finalGrades.filter(grade => grade < 6).length;

        document.getElementById('generalAverage').textContent = generalAverage;
        document.getElementById('totalSubjects').textContent = subjects.length;
        document.getElementById('passedSubjects').textContent = passedSubjects;
        document.getElementById('riskSubjects').textContent = riskSubjects;
    }

    loadGrades() {
        // Cargar calificaciones para cada período
        this.loadPeriodGrades('parcial1');
        this.loadPeriodGrades('parcial2');
        this.loadPeriodGrades('parcial3');
        this.loadFinalGrades();
    }

    loadPeriodGrades(period) {
        const tbody = document.getElementById(`gradesTable${period.charAt(0).toUpperCase() + period.slice(1)}`);
        tbody.innerHTML = '';

        this.studentData.subjects.forEach(subject => {
            const grades = subject[period];
            const row = document.createElement('tr');
            
            const statusBadge = this.getGradeStatusBadge(grades.promedio);
            
            row.innerHTML = `
                <td>
                    <strong>${subject.name}</strong>
                    <br><small class="text-muted">${subject.id}</small>
                </td>
                <td>${subject.teacher}</td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(grades.evaluacionParcial)}">
                        ${grades.evaluacionParcial.toFixed(1)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(grades.evaluacionContinua)}">
                        ${grades.evaluacionContinua.toFixed(1)}
                    </span>
                </td>
                <td class="text-center">
                    <strong class="${this.getGradeTextClass(grades.promedio)}">
                        ${grades.promedio.toFixed(1)}
                    </strong>
                </td>
                <td class="text-center">${statusBadge}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    loadFinalGrades() {
        const tbody = document.getElementById('gradesTableFinal');
        tbody.innerHTML = '';

        this.studentData.subjects.forEach(subject => {
            const row = document.createElement('tr');
            
            // Calcular promedio de parciales
            const parcialAvg = ((subject.parcial1.promedio + subject.parcial2.promedio + subject.parcial3.promedio) / 3);
            const statusBadge = this.getGradeStatusBadge(subject.final.calificacionFinal);
            
            row.innerHTML = `
                <td>
                    <strong>${subject.name}</strong>
                    <br><small class="text-muted">${subject.id}</small>
                </td>
                <td>${subject.teacher}</td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(parcialAvg)}">
                        ${parcialAvg.toFixed(1)}
                    </span>
                </td>
                <td class="text-center">
                    <span class="badge ${this.getGradeColorClass(subject.final.evaluacionFinal)}">
                        ${subject.final.evaluacionFinal.toFixed(1)}
                    </span>
                </td>
                <td class="text-center">
                    <strong class="${this.getGradeTextClass(subject.final.calificacionFinal)} fs-5">
                        ${subject.final.calificacionFinal.toFixed(1)}
                    </strong>
                </td>
                <td class="text-center">${statusBadge}</td>
            `;
            
            tbody.appendChild(row);
        });
    }

    getGradeColorClass(grade) {
        if (grade >= 9) return 'bg-success';
        if (grade >= 8) return 'bg-primary';
        if (grade >= 7) return 'bg-info';
        if (grade >= 6) return 'bg-warning';
        return 'bg-danger';
    }

    getGradeTextClass(grade) {
        if (grade >= 9) return 'text-success';
        if (grade >= 8) return 'text-primary';
        if (grade >= 7) return 'text-info';
        if (grade >= 6) return 'text-warning';
        return 'text-danger';
    }

    getGradeStatusBadge(grade) {
        if (grade >= 9) return '<span class="badge bg-success">Excelente</span>';
        if (grade >= 8) return '<span class="badge bg-primary">Muy Bueno</span>';
        if (grade >= 7) return '<span class="badge bg-info">Bueno</span>';
        if (grade >= 6) return '<span class="badge bg-warning">Suficiente</span>';
        return '<span class="badge bg-danger">No Suficiente</span>';
    }

    createSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;

        // Destruir gráfico existente si existe
        this.destroyChart();

        const subjects = this.studentData.subjects.map(s => s.name.replace(/\s+III?$/, ''));
        const parcial1Data = this.studentData.subjects.map(s => s.parcial1.promedio);
        const parcial2Data = this.studentData.subjects.map(s => s.parcial2.promedio);
        const parcial3Data = this.studentData.subjects.map(s => s.parcial3.promedio);
        const finalData = this.studentData.subjects.map(s => s.final.calificacionFinal);

        this.subjectChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: subjects,
                datasets: [
                    {
                        label: '1er Parcial',
                        data: parcial1Data,
                        borderColor: '#dc3545',
                        backgroundColor: '#dc354520',
                        tension: 0.4
                    },
                    {
                        label: '2do Parcial',
                        data: parcial2Data,
                        borderColor: '#fd7e14',
                        backgroundColor: '#fd7e1420',
                        tension: 0.4
                    },
                    {
                        label: '3er Parcial',
                        data: parcial3Data,
                        borderColor: '#ffc107',
                        backgroundColor: '#ffc10720',
                        tension: 0.4
                    },
                    {
                        label: 'Final',
                        data: finalData,
                        borderColor: '#198754',
                        backgroundColor: '#19875420',
                        tension: 0.4,
                        borderWidth: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 5,
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

    destroyChart() {
        if (this.subjectChart) {
            this.subjectChart.destroy();
            this.subjectChart = null;
        }
    }

    generateReport(type = null) {
        const reportType = type || document.getElementById('reportType')?.value || 'boleta';
        const studentId = this.studentData.student.id;
        const studentName = this.studentData.student.name;

        // Simular generación de reporte
        this.showLoadingToast('Generando reporte...');

        setTimeout(() => {
            this.downloadReport(reportType, studentId, studentName);
        }, 2000);
    }

    downloadReport(type, studentId, studentName) {
        // Simular descarga de PDF
        const reportData = this.generateReportData(type);
        
        // Crear blob simulado (en producción sería un PDF real)
        const blob = new Blob([reportData], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showSuccessToast(`Reporte ${type} descargado correctamente`);
    }

    generateReportData(type) {
        // Simular datos del reporte
        switch (type) {
            case 'boleta':
                return `BOLETA DE CALIFICACIONES
Estudiante: ${this.studentData.student.name}
Matrícula: ${this.studentData.student.id}
Semestre: ${this.studentData.student.semester}

${this.studentData.subjects.map(subject => 
    `${subject.name}: ${subject.final.calificacionFinal.toFixed(1)}`
).join('\n')}

Promedio General: ${this.calculateGeneralAverage()}`;
                
            case 'detallado':
                return `REPORTE ACADÉMICO DETALLADO
Estudiante: ${this.studentData.student.name}
Período: ${new Date().getFullYear()}

Calificaciones por parcial y materia...`;
                
            case 'historico':
                return `HISTORIAL ACADÉMICO
Estudiante: ${this.studentData.student.name}
Años cursados: 2022-2024

Historial completo de calificaciones...`;
                
            default:
                return 'Reporte generado correctamente';
        }
    }

    calculateGeneralAverage() {
        const finalGrades = this.studentData.subjects.map(s => s.final.calificacionFinal);
        return (finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length).toFixed(1);
    }

    showAttendanceModal() {
        const attendanceData = this.studentData.attendance;
        const modalHTML = `
            <div class="modal fade" id="attendanceModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-check me-2"></i>Registro de Asistencia
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card border-success">
                                        <div class="card-body text-center">
                                            <i class="fas fa-check-circle fa-3x text-success mb-2"></i>
                                            <h4 class="text-success">${attendanceData.attendedClasses}</h4>
                                            <p class="mb-0">Clases Asistidas</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card border-info">
                                        <div class="card-body text-center">
                                            <i class="fas fa-percentage fa-3x text-info mb-2"></i>
                                            <h4 class="text-info">${attendanceData.percentage}%</h4>
                                            <p class="mb-0">Porcentaje</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <div class="progress" style="height: 25px;">
                                        <div class="progress-bar bg-success" style="width: ${attendanceData.percentage}%">
                                            ${attendanceData.percentage}%
                                        </div>
                                    </div>
                                    <small class="text-muted">
                                        ${attendanceData.attendedClasses} de ${attendanceData.totalClasses} clases
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const existingModal = document.getElementById('attendanceModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
        modal.show();
    }

    showScheduleModal() {
        const scheduleHTML = this.studentData.schedule.map(item => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                    <strong>${item.subject}</strong><br>
                    <small class="text-muted">${item.room}</small>
                </div>
                <div class="text-end">
                    <span class="badge bg-primary">${item.time}</span>
                </div>
            </div>
        `).join('');

        const modalHTML = `
            <div class="modal fade" id="scheduleModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-clock me-2"></i>Horario de Clases - Lunes
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${scheduleHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal existente si existe
        const existingModal = document.getElementById('scheduleModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
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
        toastElement.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

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
}

// Funciones globales para los event handlers
let gradePlatform;

function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

function showReportModal() {
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

function loginAsStudent() {
    gradePlatform.loginAsStudent();
}

function loginAsParent() {
    gradePlatform.loginAsParent();
}

function logoutGradeSystem() {
    gradePlatform.logoutGradeSystem();
}

function generateReport(type = null) {
    gradePlatform.generateReport(type);
}

function showAttendanceModal() {
    gradePlatform.showAttendanceModal();
}

function showScheduleModal() {
    gradePlatform.showScheduleModal();
}

// Inicializar plataforma cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    gradePlatform = new GradePlatform();
});

// Estilos adicionales
const style = document.createElement('style');
style.textContent = `
    .feature-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }
    
    .feature-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    .grade-badge {
        font-size: 0.9rem;
        padding: 0.35em 0.6em;
    }
    
    #subjectChart {
        height: 300px !important;
    }
    
    .table th {
        font-weight: 600;
        font-size: 0.9rem;
    }
    
    .table td {
        vertical-align: middle;
    }
    
    /* Dark mode support */
    .dark-mode .card {
        background-color: #2d3748;
        border-color: #4a5568;
    }
    
    .dark-mode .table {
        color: #f7fafc;
    }
    
    .dark-mode .table-primary th {
        background-color: #4299e1;
        border-color: #3182ce;
    }
    
    .dark-mode .table-success th {
        background-color: #48bb78;
        border-color: #38a169;
    }
    
    .dark-mode .table-warning th {
        background-color: #ed8936;
        border-color: #dd6b20;
    }
    
    .dark-mode .table-info th {
        background-color: #4fd1c7;
        border-color: #38b2ac;
    }
    
    .dark-mode .modal-content {
        background-color: #2d3748;
        color: #f7fafc;
    }
    
    .dark-mode .form-control {
        background-color: #4a5568;
        border-color: #718096;
        color: #f7fafc;
    }
`;
document.head.appendChild(style);