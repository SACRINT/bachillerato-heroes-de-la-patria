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
                            <button type="button" class="btn btn-success" data-action="download-confirmation" data-appointment-id="${appointment.id}">
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
            if (confirm('Â¿Estás seguro de que deseas cancelar tu cita?')) {
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
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
            `;

            document.body.appendChild(alertDiv);

            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            }, 5000);
        }

        // Indicadores de pasos
        const stepStyles = `
            <style>
            .step-indicator {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background-color: #1976d2;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            .step-number {
                width: 60px;
                height: 60px;
                font-size: 1.5rem;
                font-size: 0.875rem;
            }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', stepStyles);

        // Dark mode functionality - CORREGIDO V2
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;

        if (darkModeToggle && typeof window.setUnifiedTheme !== 'function' && typeof window.applyUnifiedTheme !== 'function') {
            // Limpiar cualquier contenido de texto del botón
            const cleanToggleButton = () => {
                // Remover cualquier nodo de texto
                const textNodes = [...darkModeToggle.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
                textNodes.forEach(node => node.remove());
            };

            // Check for saved dark mode preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                body.classList.add('dark-mode');
                updateDarkModeIcon(true);
            }

            darkModeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                cleanToggleButton(); // Limpiar antes de cada toggle
                body.classList.toggle('dark-mode');

                if (body.classList.contains('dark-mode')) {
                    localStorage.setItem('darkMode', 'enabled');
                    updateDarkModeIcon(true);
                } else {
                    localStorage.setItem('darkMode', 'disabled');
                    updateDarkModeIcon(false);
                }
            });

            // Limpiar al cargar la página
            cleanToggleButton();
        }

        function updateDarkModeIcon(isDark) {
            if (darkModeToggle) {
                let icon = darkModeToggle.querySelector('i');

                // Si no existe el icono, crearlo
                if (!icon) {
                    icon = document.createElement('i');
                    darkModeToggle.innerHTML = ''; // Limpiar completamente
                    darkModeToggle.appendChild(icon);
                }

                if (isDark) {
                    icon.className = 'fas fa-sun';
                    darkModeToggle.setAttribute('aria-label', 'Activar modo claro');
                } else {
                    icon.className = 'fas fa-moon';
                    darkModeToggle.setAttribute('aria-label', 'Activar modo oscuro');
                }
            }
        }
