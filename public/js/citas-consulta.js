/**
 * 📅 APPOINTMENT CONSULTATION - BGE HEROES DE LA PATRIA
 * Sistema de consulta de citas con detalles completos
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: citas.html
 */

function consultarCita() {
    const appointmentId = document.getElementById('appointmentId').value.trim();

    if (!appointmentId) {
        showAlert('Por favor ingresa el ID de tu cita', 'warning');
        return;
    }

    if (window.appointmentSystem) {
        const appointment = window.appointmentSystem.appointments.find(a => a.id === appointmentId);

        if (appointment) {
            const dept = window.appointmentSystem.departments.find(d => d.id === appointment.department);
            showAppointmentDetails(appointment, dept);
        } else {
            showAlert('No se encontró una cita con ese ID. Verifica que sea correcto.', 'error');
        }
    } else {
        showAlert('Sistema no disponible en este momento', 'error');
    }
}

function showAppointmentDetails(appointment, dept) {
    const statusColor = {
        'confirmed': 'success',
        'cancelled': 'danger',
        'completed': 'info'
    };

    const statusText = {
        'confirmed': 'Confirmada',
        'cancelled': 'Cancelada',
        'completed': 'Completada'
    };

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-info text-white">
                    <h5 class="modal-title">
                        <i class="fas fa-info-circle me-2"></i>
                        Detalles de tu Cita
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="appointment-status mb-3">
                        <span class="badge bg-${statusColor[appointment.status]} fs-6">
                            Estado: ${statusText[appointment.status]}
                        </span>
                    </div>
                    <div class="appointment-details">
                        <div class="row mb-2">
                            <div class="col-4"><strong>ID:</strong></div>
                            <div class="col-8"><code>${appointment.id}</code></div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Departamento:</strong></div>
                            <div class="col-8">${dept.name}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Fecha:</strong></div>
                            <div class="col-8">${new Date(appointment.date).toLocaleDateString('es-ES')}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Hora:</strong></div>
                            <div class="col-8">${appointment.time}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Nombre:</strong></div>
                            <div class="col-8">${appointment.name}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Teléfono:</strong></div>
                            <div class="col-8">${appointment.phone}</div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-4"><strong>Motivo:</strong></div>
                            <div class="col-8">${appointment.reason}</div>
                        </div>
                    </div>
                    ${appointment.status === 'confirmed' ? `
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Recordatorio:</strong> Llega 10 minutos antes de tu cita.
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${appointment.status === 'confirmed' ? `
                    <button type="button" class="btn btn-danger" data-action="cancelar-cita" data-param-1="${appointment.id}">
                        <i class="fas fa-times me-2"></i>Cancelar Cita
                    </button>
                    ` : ''}
                    <button type="button" class="btn btn-success" data-action="download-confirmation" data-param-1="${appointment.id}">
                        <i class="fas fa-download me-2"></i>Descargar
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();

    modal.addEventListener('hidden.bs.modal', () => modal.remove());
}

function cancelarCita(appointmentId) {
    if (confirm('¿Estás seguro de que deseas cancelar tu cita?')) {
        if (window.appointmentSystem.cancelAppointment(appointmentId)) {
            showAlert('Tu cita ha sido cancelada exitosamente', 'success');
            bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
        } else {
            showAlert('Error al cancelar la cita', 'error');
        }
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
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
