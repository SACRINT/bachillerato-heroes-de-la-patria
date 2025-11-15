/**
 * 📚 PORTAL DE ESTUDIANTES - BGE HÉROES DE LA PATRIA
 * Sistema completo de gestión estudiantil
 * Funcionalidades: Tareas, Recursos, Actividades, Calificaciones
 */

// Prevenir carga múltiple
if (typeof window.BGE_STUDENT_PORTAL_LOADED !== 'undefined') {
    console.log('📚 [STUDENT PORTAL] Ya está cargado, evitando duplicación');
} else {
    window.BGE_STUDENT_PORTAL_LOADED = true;

console.log('📚 [STUDENT PORTAL] Inicializando portal de estudiantes...');

// === GESTIÓN DE TAREAS ===
function showTasksModal() {
    console.log('📝 Mostrando modal de tareas');
    try {
        const modalElement = document.getElementById('tasksModal') || createTasksModal();
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.warn('⚠️ Bootstrap no disponible, mostrando modal con fallback');
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
        }
        loadTasks();
    } catch (error) {
        console.error('❌ Error mostrando modal de tareas:', error);
    }
}

function createTasksModal() {
    const modalHTML = `
    <div class="modal fade" id="tasksModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title">📝 Mis Tareas</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="tasksContent">Cargando tareas...</div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalHTML));
    return document.getElementById('tasksModal');
}

function loadTasks() {
    const demoTasks = [
        {
            id: 1,
            subject: 'Matemáticas III',
            title: 'Resolver ejercicios de derivadas',
            dueDate: '2025-09-30',
            status: 'pending',
            priority: 'high'
        },
        {
            id: 2,
            subject: 'Física III',
            title: 'Investigación sobre ondas electromagnéticas',
            dueDate: '2025-10-05',
            status: 'in_progress',
            priority: 'medium'
        },
        {
            id: 3,
            subject: 'Química III',
            title: 'Práctica de laboratorio #4',
            dueDate: '2025-10-02',
            status: 'completed',
            priority: 'high'
        }
    ];

    const tasksHTML = demoTasks.map(task => {
        const statusClass = {
            'pending': 'warning',
            'in_progress': 'info',
            'completed': 'success'
        }[task.status];

        const priorityColor = {
            'high': 'danger',
            'medium': 'warning',
            'low': 'secondary'
        }[task.priority];

        return `
        <div class="card mb-3 border-${statusClass}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">${task.title}</h6>
                        <p class="text-muted mb-1"><i class="fas fa-book me-1"></i>${task.subject}</p>
                        <p class="text-muted mb-0"><i class="fas fa-calendar me-1"></i>Fecha límite: ${task.dueDate}</p>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${priorityColor}">${task.priority.toUpperCase()}</span>
                        <br>
                        <span class="badge bg-${statusClass} mt-1">${task.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');

    document.getElementById('tasksContent').innerHTML = sanitizeHTML(tasksHTML, 'ugc');
}

// === FILTROS DE RECURSOS ===
function filterResources(category) {
    console.log('🔍 Filtrando recursos por:', category);

    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    const resources = document.querySelectorAll('.resource-item');
    resources.forEach(resource => {
        if (category === 'all' || resource.dataset.category === category) {
            resource.style.display = 'block';
            setTimeout(() => {
                resource.style.opacity = '1';
                resource.style.transform = 'translateY(0)';
            }, 100);
        } else {
            resource.style.opacity = '0';
            resource.style.transform = 'translateY(10px)';
            setTimeout(() => {
                resource.style.display = 'none';
            }, 300);
        }
    });

    showNotification(`Mostrando recursos de: ${category === 'all' ? 'Todas las categorías' : category}`, 'info');
}

// === CALCULADORA DE PROMEDIO ===
function calculateAverage() {
    console.log('📊 Calculando promedio de calificaciones');

    const grades = document.querySelectorAll('.grade-input');
    let total = 0;
    let count = 0;

    grades.forEach(input => {
        const value = parseFloat(input.value);
        if (!isNaN(value) && value >= 0 && value <= 10) {
            total += value;
            count++;
        }
    });

    if (count === 0) {
        showNotification('Por favor ingresa al menos una calificación válida', 'warning');
        return;
    }

    const average = (total / count).toFixed(2);
    const resultElement = document.getElementById('averageResult');

    if (resultElement) {
        resultElement.innerHTML = sanitizeHTML(`
            <div class="alert alert-success text-center">
                <h4><i class="fas fa-chart-line me-2"></i>Tu promedio actual es: <strong>${average}</strong></h4>
                <p class="mb-0">Basado en ${count} calificación${count > 1 ? 'es' : ''}</p>
            </div>
        `);
    }

    showNotification(`Promedio calculado: ${average}`, 'success');
}

// === REGISTRO DE ACTIVIDADES ===
// ❌ DESHABILITADO: Ahora se maneja en inscriptions-handler.js
/*
function showActivityRegistration(activityName) {
    console.log('📅 Registrando para actividad:', activityName);

    try {
        const modalElement = document.getElementById('activityModal') || createActivityModal();
        document.getElementById('activityName').textContent = activityName;

        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.warn('⚠️ Bootstrap no disponible, mostrando modal con fallback');
            modalElement.style.display = 'block';
            modalElement.classList.add('show');
        }
    } catch (error) {
        console.error('❌ Error mostrando modal de actividad:', error);
    }
}
*/

// ❌ DESHABILITADO: Ahora se maneja en inscriptions-handler.js
/*
function createActivityModal() {
    const modalHTML = `
    <div class="modal fade" id="activityModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-success text-white">
                    <h5 class="modal-title">🎯 Registro de Actividad</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <i class="fas fa-paper-plane fa-3x text-warning mb-3"></i>
                        <h4>¿Enviar solicitud de inscripción para:</h4>
                        <h5 id="activityName" class="text-primary"></h5>
                    </div>
                    <div class="alert alert-warning">
                        <i class="fas fa-clock me-2"></i>
                        <strong>⏳ Tu solicitud será revisada</strong><br>
                        El administrador revisará tu solicitud y recibirás un email cuando sea aprobada o rechazada.
                    </div>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        Guarda el email de confirmación como comprobante de tu solicitud.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-warning" data-action="confirm-activity-registration">
                        <i class="fas fa-paper-plane me-2"></i>Enviar Solicitud
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalHTML));
    return document.getElementById('activityModal');
}

// ❌ DESHABILITADO: Ahora se maneja en inscriptions-handler.js
/*
async function confirmActivityRegistration() {
    const activityName = document.getElementById('activityName').textContent;

    // Cerrar modal de confirmación
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('activityModal'));
            if (modal) modal.hide();
        } else {
            document.getElementById('activityModal').style.display = 'none';
            document.getElementById('activityModal').classList.remove('show');
        }
    } catch (error) {
        console.warn('⚠️ Error cerrando modal:', error);
    }

    // Mostrar loader
    showNotification('Enviando solicitud de inscripción...', 'info');

    try {
        // ⚠️ IMPORTANTE: Aquí debes obtener el ID de la actividad
        // Por ahora, voy a simular que lo obtenemos desde data-activity-id del botón
        const activityId = document.querySelector(`[onclick*="${activityName}"]`)?.dataset?.activityId || 'ACT-001';

        // Obtener datos del estudiante desde la sesión
        const session = JSON.parse(localStorage.getItem('studentSession') || '{}');

        if (!session.student) {
            showNotification('❌ Debes iniciar sesión primero', 'error');
            return;
        }

        // Enviar solicitud de inscripción al backend
        const response = await fetch('/api/inscriptions/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activityId: activityId,
                studentId: session.student.id || 'ST-TEMP',
                emergencyContact: session.student.phone || 'No proporcionado',
                additionalInfo: `Inscripción desde portal estudiantil`
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`✅ ${data.message}`, 'success');

            // Mostrar información adicional
            setTimeout(() => {
                showNotification('📧 Revisa tu correo para más información', 'info');
            }, 2000);
        } else {
            showNotification(`❌ ${data.message}`, 'error');
        }

    } catch (error) {
        console.error('❌ Error en inscripción:', error);
        showNotification('❌ Error al procesar la inscripción. Intenta nuevamente.', 'error');
    }
}
*/

// === SISTEMA DE NOTIFICACIONES ===
function showNotification(message, type = 'info') {
    // Crear contenedor de notificaciones si no existe
    let container = document.getElementById('notificationsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show shadow`;
    notification.innerHTML = sanitizeHTML(`
        <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info'}-circle me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `);

    container.appendChild(notification);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ [STUDENT PORTAL] Portal de estudiantes inicializado correctamente');

    // Agregar estilos para transiciones
    const style = document.createElement('style');
    style.textContent = `
        .resource-item {
            transition: all 0.3s ease;
        }
        .grade-input {
            max-width: 80px;
        }
    `;
    document.head.appendChild(style);

    // Inicializar tooltips si Bootstrap está disponible
    if (typeof bootstrap !== 'undefined') {
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }
});

} // Fin del check de carga múltiple