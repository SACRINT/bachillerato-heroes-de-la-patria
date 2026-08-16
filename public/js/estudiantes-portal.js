/**
 * 🎓 STUDENT PORTAL - BGE HEROES DE LA PATRIA
 * Portal del estudiante con calculadora, tareas, recursos PWA, constructor de horarios
 * Extraído de inline scripts para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: estudiantes.html
 */

// ===========================================================================
// CALCULADORA DE PROMEDIO
// ===========================================================================

function calculateAverage() {
    const grade1 = parseFloat(document.getElementById('grade1').value) || 0;
    const grade2 = parseFloat(document.getElementById('grade2').value) || 0;
    const grade3 = parseFloat(document.getElementById('grade3').value) || 0;

    const grades = [grade1, grade2, grade3].filter(g => g > 0);

    if (grades.length === 0) {
        showAlert('Por favor ingresa al menos una calificación válida', 'warning');
        return;
    }

    const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
    const resultDiv = document.getElementById('averageResult');

    resultDiv.innerHTML = `
        <strong>Promedio:</strong> ${average.toFixed(2)}<br>
        <small>Calculado con ${grades.length} calificación(es)</small>
    `;
    resultDiv.classList.remove('d-none');
}

// Función para mostrar "próximamente"
function showComingSoon(feature) {
    showAlert(`${feature} estará disponible próximamente. ¡Mantente atento a las actualizaciones!`, 'info');
}

// Función para mostrar modal de tareas
function showTasksModal() {
    const modalHtml = `
        <div class="modal fade" id="tasksModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-white">
                        <h5 class="modal-title"><i class="fas fa-tasks me-2"></i>Mis Tareas Pendientes</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="card border-left-warning">
                                    <div class="card-body">
                                        <h6 class="text-warning"><i class="fas fa-book me-2"></i>Matemáticas - Álgebra</h6>
                                        <p class="mb-2">Resolver ejercicios del capítulo 5 (páginas 85-92)</p>
                                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>Fecha límite: ${new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString()}</small>
                                        <div class="mt-2">
                                            <span class="badge bg-warning">Pendiente</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="card border-left-info">
                                    <div class="card-body">
                                        <h6 class="text-info"><i class="fas fa-flask me-2"></i>Química - Laboratorio</h6>
                                        <p class="mb-2">Reporte de práctica: Reacciones químicas</p>
                                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>Fecha límite: ${new Date(Date.now() + 5*24*60*60*1000).toLocaleDateString()}</small>
                                        <div class="mt-2">
                                            <span class="badge bg-info">En progreso</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="card border-left-primary">
                                    <div class="card-body">
                                        <h6 class="text-primary"><i class="fas fa-pen me-2"></i>Literatura - Ensayo</h6>
                                        <p class="mb-2">Ensayo sobre "El Realismo Mágico en América Latina"</p>
                                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>Fecha límite: ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}</small>
                                        <div class="mt-2">
                                            <span class="badge bg-primary">Asignada</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <a href="calendario.html" class="btn btn-warning">Ver Calendario Completo</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remover modal existente si existe
    const existingModal = document.getElementById('tasksModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar modal de forma segura
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(document.getElementById('tasksModal'));
            modal.show();
        } else {
            void 0;
            document.getElementById('tasksModal').style.display = 'block';
            document.getElementById('tasksModal').classList.add('show');
        }
    } catch (error) {
        console.error('❌ Error mostrando modal de tareas:', error);
    }
}

// Función para imprimir horario
function printSchedule() {
    window.print();
}

// ===========================================================================
// RECURSOS PWA
// ===========================================================================

let recursosData = [];
let currentFilter = 'all';

async function loadRecursosPWA() {
    try {
        const response = await fetch('data/recursos_pwa.json');
        recursosData = await response.json();
        renderRecursos(recursosData);
    } catch (error) {
        console.error('[ESTUDIANTES-PWA] Error cargando recursos PWA:', error);
        document.getElementById('recursos-pwa-container').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los recursos. Intenta recargar la página.
                </div>
            </div>
        `;
    }
}

function renderRecursos(categorias) {
    const container = document.getElementById('recursos-pwa-container');
    let html = '';

    categorias.forEach((categoria, catIndex) => {
        if (currentFilter === 'all' || currentFilter === categoria.categoria) {
            html += `
                <div class="col-12 categoria-section" data-categoria="${categoria.categoria}">
                    <h4 class="category-title mb-3">
                        <i class="fas fa-folder-open text-primary me-2"></i>
                        ${categoria.categoria}
                    </h4>
                    <div class="row g-3">
            `;

            categoria.recursos.forEach((recurso, recIndex) => {
                const cardColors = ['primary', 'success', 'warning', 'info', 'danger', 'secondary'];
                const cardColor = cardColors[recIndex % cardColors.length];

                html += `
                    <div class="col-lg-6 col-xl-4">
                        <div class="card h-100 border-0 shadow-sm recurso-card" style="transition: transform 0.2s ease;">
                            <div class="card-header bg-${cardColor} text-white">
                                <h6 class="mb-0">
                                    <i class="${recurso.icono} me-2"></i>
                                    ${recurso.titulo}
                                </h6>
                            </div>
                            <div class="card-body">
                                <p class="card-text small">${recurso.descripcion}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge bg-light text-dark">${getResourceTypeLabel(recurso.tipo)}</span>
                                    <a href="${recurso.url}"
                                       target="_blank"
                                       class="btn btn-sm btn-${cardColor}"
                                       rel="noopener noreferrer">
                                        <i class="fas fa-external-link-alt me-1"></i>
                                        Acceder
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        }
    });

    if (html === '') {
        html = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay recursos disponibles para esta categoría.
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Agregar efectos hover a las tarjetas
    document.querySelectorAll('.recurso-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

function filterResources(categoria) {
    currentFilter = categoria;

    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    });

    event.target.classList.remove('btn-outline-primary');
    event.target.classList.add('active', 'btn-primary');

    // Re-renderizar recursos
    renderRecursos(recursosData);
}

function getResourceTypeLabel(tipo) {
    const labels = {
        'enlace_externo': 'Sitio Web',
        'pdf': 'Documento PDF',
        'video_externo': 'Videos',
        'herramienta': 'Herramienta'
    };
    return labels[tipo] || 'Recurso';
}

// Función para mostrar alertas
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ===========================================================================
// CONSTRUCTOR DE HORARIOS PWA
// ===========================================================================

let personalSchedule = {};
let currentEditingCell = null;

const horarioModulos = [
    '08:00-08:50',
    '08:50-09:40',
    '09:40-10:30',
    '10:30-11:00', // Receso
    '11:00-11:50',
    '11:50-12:40',
    '12:40-13:30'
];

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

function loadPersonalSchedule() {
    const stored = localStorage.getItem('personal_schedule_pwa');
    if (stored) {
        personalSchedule = JSON.parse(stored);
    }
    renderScheduleTable();
}

function savePersonalSchedule() {
    localStorage.setItem('personal_schedule_pwa', JSON.stringify(personalSchedule));
}

function renderScheduleTable() {
    const tbody = document.getElementById('scheduleTableBody');
    let html = '';

    horarioModulos.forEach((modulo, moduloIndex) => {
        html += '<tr>';

        if (modulo === '10:30-11:00') {
            // Fila de receso
            html += `<td class="fw-bold bg-warning text-dark">${modulo}</td>`;
            html += `<td colspan="5" class="text-center bg-warning-subtle">
                        <strong>RECESO</strong>
                     </td>`;
        } else {
            html += `<td class="fw-bold">${modulo}</td>`;

            diasSemana.forEach(dia => {
                const claseKey = `${dia}-${modulo}`;
                const clase = personalSchedule[claseKey];

                if (clase) {
                    html += `
                        <td class="schedule-cell ${clase.color} text-white"
                            style="cursor: pointer; min-height: 60px; position: relative;"
                            data-action="edit-class" data-param-1="'${dia}', '${modulo}'">
                            <strong>${clase.materia}</strong>
                            ${clase.profesor ? `<br><small>Prof. ${clase.profesor}</small>` : ''}
                            ${clase.aula ? `<br><small>${clase.aula}</small>` : ''}
                        </td>
                    `;
                } else {
                    html += `
                        <td class="schedule-cell empty-cell"
                            style="cursor: pointer; min-height: 60px; border: 2px dashed #dee2e6; text-align: center;"
                            data-action="edit-class" data-param-1="'${dia}', '${modulo}'">
                            <span class="text-muted">+</span>
                        </td>
                    `;
                }
            });
        }

        html += '</tr>';
    });

    tbody.innerHTML = html;
}

function addNewClass() {
    showAlert('Haz clic en cualquier celda vacía para añadir una nueva clase', 'info');
}

function editClass(dia, modulo) {
    if (modulo === '10:30-11:00') return; // No editar receso

    currentEditingCell = `${dia}-${modulo}`;
    const existingClass = personalSchedule[currentEditingCell];

    // Limpiar formulario
    document.getElementById('clase-id-pwa').value = currentEditingCell;
    document.getElementById('clase-dia-pwa-hidden').value = dia;
    document.getElementById('clase-hora-pwa-hidden').value = modulo;
    document.getElementById('clase-dia-pwa-display').value = dia;
    document.getElementById('clase-hora-pwa-display').value = modulo;

    if (existingClass) {
        // Editar clase existente
        document.getElementById('modal-clase-titulo').textContent = 'Editar Clase';
        document.getElementById('clase-materia-pwa').value = existingClass.materia;
        document.getElementById('clase-profesor-pwa').value = existingClass.profesor || '';
        document.getElementById('clase-aula-pwa').value = existingClass.aula || '';
        document.getElementById('clase-color-pwa').value = existingClass.color;
        document.getElementById('btn-eliminar-clase-modal-pwa').style.display = 'block';
    } else {
        // Nueva clase
        document.getElementById('modal-clase-titulo').textContent = 'Añadir Nueva Clase';
        document.getElementById('clase-materia-pwa').value = '';
        document.getElementById('clase-profesor-pwa').value = '';
        document.getElementById('clase-aula-pwa').value = '';
        document.getElementById('clase-color-pwa').value = 'bg-primary';
        document.getElementById('btn-eliminar-clase-modal-pwa').style.display = 'none';
    }

    // Mostrar modal de forma segura
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(document.getElementById('modal-clase-pwa'));
            modal.show();
        } else {
            void 0;
            document.getElementById('modal-clase-pwa').style.display = 'block';
            document.getElementById('modal-clase-pwa').classList.add('show');
        }
    } catch (error) {
        console.error('❌ Error mostrando modal de clase:', error);
    }
}

function deleteClass() {
    if (currentEditingCell && personalSchedule[currentEditingCell]) {
        delete personalSchedule[currentEditingCell];
        savePersonalSchedule();
        renderScheduleTable();

        try {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modal-clase-pwa'));
                if (modal) modal.hide();
            } else {
                document.getElementById('modal-clase-pwa').style.display = 'none';
                document.getElementById('modal-clase-pwa').classList.remove('show');
            }
        } catch (error) {
            void 0;
        }

        showAlert('Clase eliminada correctamente', 'success');
    }
}

function clearSchedule() {
    if (confirm('¿Estás seguro de que quieres eliminar todo el horario? Esta acción no se puede deshacer.')) {
        personalSchedule = {};
        savePersonalSchedule();
        renderScheduleTable();
        showAlert('Horario eliminado completamente', 'success');
    }
}

function loadSampleSchedule() {
    if (confirm('¿Quieres cargar un horario de ejemplo? Esto reemplazará tu horario actual.')) {
        personalSchedule = {
            'Lunes-08:00-08:50': {
                materia: 'Matemáticas I',
                profesor: 'Prof. García',
                aula: 'Aula 201',
                color: 'bg-primary'
            },
            'Martes-08:00-08:50': {
                materia: 'Química',
                profesor: 'Prof. López',
                aula: 'Lab. Ciencias',
                color: 'bg-success'
            },
            'Miércoles-08:00-08:50': {
                materia: 'Historia',
                profesor: 'Prof. Martínez',
                aula: 'Aula 105',
                color: 'bg-warning'
            },
            'Jueves-08:00-08:50': {
                materia: 'Inglés',
                profesor: 'Prof. Johnson',
                aula: 'Aula 301',
                color: 'bg-info'
            },
            'Viernes-08:00-08:50': {
                materia: 'Educación Física',
                profesor: 'Prof. Ramírez',
                aula: 'Cancha',
                color: 'bg-danger'
            }
        };
        savePersonalSchedule();
        renderScheduleTable();
        showAlert('Horario de ejemplo cargado correctamente', 'success');
    }
}

function exportSchedule() {
    const scheduleData = {
        horario: personalSchedule,
        generado: new Date().toLocaleString(),
        estudiante: 'Mi Horario Personal'
    };

    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = 'mi_horario_personal.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    showAlert('Horario exportado correctamente', 'success');
}

// ===========================================================================
// CONTACT MODAL
// ===========================================================================

function contactForRegistration() {
    const contactInfo = {
        telefono: '(33) 1234-5678',
        email: 'informes@bge-heroes-patria.edu.mx',
        whatsapp: '52-33-1234-5678'
    };

    const modalHtml = `
        <div class="modal fade" id="contactModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-phone me-2"></i>Contacta para Más Información
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    Para obtener más información o registrarte en este evento, puedes contactarnos a través de:
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-phone fa-2x text-primary mb-2"></i>
                                        <h6>Teléfono</h6>
                                        <p class="mb-2">${contactInfo.telefono}</p>
                                        <button class="btn btn-outline-primary btn-sm" data-action="call-phone" data-param-1="${contactInfo.telefono}">
                                            <i class="fas fa-phone me-1"></i>Llamar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card h-100">
                                    <div class="card-body text-center">
                                        <i class="fas fa-envelope fa-2x text-success mb-2"></i>
                                        <h6>Email</h6>
                                        <p class="mb-2">${contactInfo.email}</p>
                                        <button class="btn btn-outline-success btn-sm" data-action="send-email" data-param-1="${contactInfo.email}">
                                            <i class="fas fa-envelope me-1"></i>Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <i class="fab fa-whatsapp fa-2x text-success mb-2"></i>
                                        <h6>WhatsApp</h6>
                                        <p class="mb-2">Chat directo</p>
                                        <button class="btn btn-success btn-sm" data-action="open-whatsapp" data-param-1="${contactInfo.whatsapp}">
                                            <i class="fab fa-whatsapp me-1"></i>Chatear
                                        </button>
                                    </div>
                                </div>
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

    // Remover modal existente si existe
    const existingModal = document.getElementById('contactModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Mostrar el modal de forma segura
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const contactModal = new bootstrap.Modal(document.getElementById('contactModal'));
            contactModal.show();
        } else {
            void 0;
            document.getElementById('contactModal').style.display = 'block';
            document.getElementById('contactModal').classList.add('show');
        }
    } catch (error) {
        console.error('❌ Error mostrando modal de contacto:', error);
    }

    // Limpiar el modal después de cerrarlo
    document.getElementById('contactModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// ===========================================================================
// STUDENT DASHBOARD AUTH
// ===========================================================================

function showStudentLogin() {
    void 0;
    if (window.studentDashboard) {
        window.studentDashboard.showLoginModal();
    } else {
        // Crear instancia si no existe
        window.studentDashboard = new StudentDashboard();
    }
}

function hideLoginPrompt() {
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) {
        loginPrompt.style.display = 'none';
    }
}

function showLoginPrompt() {
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) {
        loginPrompt.style.display = 'block';
    }
}

function checkStudentAuthStatus() {
    const authToken = localStorage.getItem('student_auth_token');
    if (authToken) {
        // Usuario ya logueado, ocultar prompt
        hideLoginPrompt();
        void 0;
    } else {
        // Mostrar prompt de login
        showLoginPrompt();
        void 0;
    }
}

// ===========================================================================
// EVENT LISTENERS
// ===========================================================================

// Event listener para el formulario de clase
document.addEventListener('DOMContentLoaded', function() {
    const formClase = document.getElementById('form-clase-pwa');
    if (formClase) {
        formClase.addEventListener('submit', function(e) {
            e.preventDefault();

            const materia = document.getElementById('clase-materia-pwa').value;
            const profesor = document.getElementById('clase-profesor-pwa').value;
            const aula = document.getElementById('clase-aula-pwa').value;
            const color = document.getElementById('clase-color-pwa').value;

            if (currentEditingCell) {
                personalSchedule[currentEditingCell] = {
                    materia: materia,
                    profesor: profesor,
                    aula: aula,
                    color: color
                };

                savePersonalSchedule();
                renderScheduleTable();

                try {
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modal-clase-pwa'));
                        if (modal) modal.hide();
                    } else {
                        document.getElementById('modal-clase-pwa').style.display = 'none';
                        document.getElementById('modal-clase-pwa').classList.remove('show');
                    }
                } catch (error) {
                    void 0;
                }

                showAlert('Clase guardada correctamente', 'success');
            }
        });
    }

    // Cargar recursos PWA
    loadRecursosPWA();

    // Cargar horario personal
    loadPersonalSchedule();

    // Animaciones de hover para las tarjetas
    const cards = document.querySelectorAll('.quick-access-card, .hover-lift');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.transition = 'all 0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Verificar estado de autenticación después de un breve delay
    setTimeout(checkStudentAuthStatus, 500);
});
