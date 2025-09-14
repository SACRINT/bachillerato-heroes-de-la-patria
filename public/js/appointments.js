// Sistema de citas en línea para Bachillerato Héroes de la Patria
class AppointmentSystem {
    constructor() {
        this.appointments = this.loadAppointments();
        this.departments = this.getDepartments();
        this.timeSlots = this.generateTimeSlots();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDepartment = null;
        
        this.initializeSystem();
    }

    getDepartments() {
        return [
            {
                id: 'orientacion',
                name: 'Orientación Educativa',
                description: 'Apoyo psicopedagógico y orientación vocacional',
                icon: 'fas fa-user-md',
                color: 'success',
                duration: 30, // minutos
                maxDaily: 12,
                schedule: {
                    monday: ['08:00', '13:00'],
                    tuesday: ['08:00', '13:00'], 
                    wednesday: ['08:00', '13:00'],
                    thursday: ['08:00', '13:00'],
                    friday: ['08:00', '13:00']
                }
            },
            {
                id: 'servicios',
                name: 'Servicios Escolares',
                description: 'Trámites, certificados y documentos oficiales',
                icon: 'fas fa-clipboard-list',
                color: 'primary',
                duration: 20,
                maxDaily: 16,
                schedule: {
                    monday: ['08:00', '13:30'],
                    tuesday: ['08:00', '13:30'],
                    wednesday: ['08:00', '13:30'], 
                    thursday: ['08:00', '13:30'],
                    friday: ['08:00', '13:30']
                }
            },
            {
                id: 'direccion',
                name: 'Dirección',
                description: 'Reuniones con el director del plantel',
                icon: 'fas fa-user-tie',
                color: 'warning',
                duration: 45,
                maxDaily: 6,
                schedule: {
                    monday: ['09:00', '12:00'],
                    tuesday: ['09:00', '12:00'],
                    wednesday: ['09:00', '12:00'],
                    thursday: ['09:00', '12:00'],
                    friday: ['09:00', '11:00']
                }
            },
            {
                id: 'becas',
                name: 'Información de Becas',
                description: 'Asesoría sobre becas y apoyos económicos',
                icon: 'fas fa-hand-holding-usd',
                color: 'info',
                duration: 25,
                maxDaily: 10,
                schedule: {
                    monday: ['08:30', '12:30'],
                    tuesday: ['08:30', '12:30'],
                    wednesday: ['08:30', '12:30'],
                    thursday: ['08:30', '12:30'],
                    friday: ['08:30', '12:30']
                }
            },
            {
                id: 'inscripciones',
                name: 'Inscripciones',
                description: 'Proceso de inscripción y admisión',
                icon: 'fas fa-graduation-cap',
                color: 'secondary',
                duration: 30,
                maxDaily: 8,
                schedule: {
                    monday: ['08:00', '13:00'],
                    tuesday: ['08:00', '13:00'],
                    wednesday: ['08:00', '13:00'],
                    thursday: ['08:00', '13:00'],
                    friday: ['08:00', '13:00']
                }
            }
        ];
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = 8; hour <= 13; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 13 && minute === 30) break;
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    }

    loadAppointments() {
        const stored = localStorage.getItem('appointments_bge');
        return stored ? JSON.parse(stored) : [];
    }

    saveAppointments() {
        localStorage.setItem('appointments_bge', JSON.stringify(this.appointments));
    }

    initializeSystem() {
        this.renderDepartments();
        this.initializeCalendar();
        this.setupEventListeners();
    }

    renderDepartments() {
        const container = document.getElementById('departmentsContainer');
        if (!container) return;

        const html = this.departments.map(dept => `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card department-card h-100 border-0 shadow-sm" data-department="${dept.id}">
                    <div class="card-body text-center p-4">
                        <div class="department-icon bg-${dept.color} text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" 
                             style="width: 80px; height: 80px;">
                            <i class="${dept.icon} fa-2x"></i>
                        </div>
                        <h4 class="card-title text-${dept.color} mb-3">${dept.name}</h4>
                        <p class="card-text text-muted mb-3">${dept.description}</p>
                        <div class="appointment-info mb-3">
                            <small class="text-muted">
                                <i class="fas fa-clock me-2"></i>Duración: ${dept.duration} min<br>
                                <i class="fas fa-calendar me-2"></i>Lun-Vie: ${this.formatSchedule(dept.schedule)}
                            </small>
                        </div>
                        <button class="btn btn-${dept.color} btn-appointment" data-department="${dept.id}">
                            <i class="fas fa-calendar-plus me-2"></i>
                            Agendar Cita
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    formatSchedule(schedule) {
        const times = schedule.monday || ['08:00', '13:30'];
        return `${times[0]} - ${times[1]}`;
    }

    initializeCalendar() {
        const calendarContainer = document.getElementById('appointmentCalendar');
        if (!calendarContainer) return;

        // Inicializar con el mes actual
        this.currentMonth = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        const calendarContainer = document.getElementById('appointmentCalendar');
        const monthYear = document.getElementById('currentMonthYear');
        
        if (!calendarContainer || !monthYear) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const today = new Date();
        
        // Actualizar el título del mes
        monthYear.textContent = this.currentMonth.toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });

        // Generar días del calendario
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = `
            <div class="calendar-header d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-outline-primary btn-sm" id="prevMonth">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <h5 class="mb-0" id="currentMonthYear"></h5>
                <button class="btn btn-outline-primary btn-sm" id="nextMonth">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div class="weekday">Dom</div>
                    <div class="weekday">Lun</div>
                    <div class="weekday">Mar</div>
                    <div class="weekday">Mié</div>
                    <div class="weekday">Jue</div>
                    <div class="weekday">Vie</div>
                    <div class="weekday">Sáb</div>
                </div>
                <div class="calendar-days">
        `;

        // Generar días
        const current = new Date(startDate);
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = current.getMonth() === month;
                const isToday = current.toDateString() === today.toDateString();
                const isPast = current < today;
                const isWeekend = current.getDay() === 0 || current.getDay() === 6;
                const isAvailable = this.isDayAvailable(current) && !isPast && !isWeekend;
                
                let classes = ['calendar-day'];
                if (!isCurrentMonth) classes.push('other-month');
                if (isToday) classes.push('today');
                if (isPast || !isCurrentMonth) classes.push('disabled');
                if (isWeekend) classes.push('weekend');
                if (isAvailable) classes.push('available');
                if (this.selectedDate && current.toDateString() === this.selectedDate.toDateString()) {
                    classes.push('selected');
                }

                calendarHTML += `
                    <div class="${classes.join(' ')}" 
                         data-date="${current.toISOString().split('T')[0]}"
                         ${isAvailable ? 'onclick="appointmentSystem.selectDate(this)"' : ''}>
                        ${current.getDate()}
                    </div>
                `;

                current.setDate(current.getDate() + 1);
            }
        }

        calendarHTML += '</div></div>';
        calendarContainer.innerHTML = calendarHTML;

        // Actualizar el título después de renderizar
        document.getElementById('currentMonthYear').textContent = this.currentMonth.toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
        });

        this.setupCalendarNavigation();
    }

    isDayAvailable(date) {
        if (!this.selectedDepartment) return false;
        
        const dept = this.departments.find(d => d.id === this.selectedDepartment);
        if (!dept) return false;

        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];
        
        return dept.schedule[dayName] !== undefined;
    }

    setupCalendarNavigation() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        if (prevBtn) {
            prevBtn.onclick = () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
                this.renderCalendar();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
                this.renderCalendar();
            };
        }
    }

    selectDate(dayElement) {
        // Limpiar selección anterior
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Seleccionar nuevo día
        dayElement.classList.add('selected');
        this.selectedDate = new Date(dayElement.dataset.date + 'T00:00:00');
        
        // Generar horarios disponibles
        this.renderAvailableTimeSlots();
    }

    renderAvailableTimeSlots() {
        const container = document.getElementById('timeSlotsContainer');
        if (!container || !this.selectedDate || !this.selectedDepartment) return;

        const dept = this.departments.find(d => d.id === this.selectedDepartment);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[this.selectedDate.getDay()];
        const schedule = dept.schedule[dayName];

        if (!schedule) {
            container.innerHTML = '<p class="text-muted">No hay horarios disponibles para este día.</p>';
            return;
        }

        const [startTime, endTime] = schedule;
        const availableSlots = this.getAvailableSlots(this.selectedDate, startTime, endTime, dept.duration);

        if (availableSlots.length === 0) {
            container.innerHTML = '<div class="alert alert-warning">No hay horarios disponibles para esta fecha. Por favor selecciona otro día.</div>';
            return;
        }

        const slotsHTML = availableSlots.map(slot => `
            <button class="btn btn-outline-primary time-slot me-2 mb-2" 
                    data-time="${slot}" 
                    onclick="appointmentSystem.selectTimeSlot('${slot}')">
                ${slot}
            </button>
        `).join('');

        container.innerHTML = `
            <h6 class="mb-3">Horarios disponibles:</h6>
            <div class="time-slots-grid">${slotsHTML}</div>
        `;
    }

    getAvailableSlots(date, startTime, endTime, duration) {
        const slots = [];
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime);
        
        for (let time = start; time + duration <= end; time += duration) {
            const timeStr = this.minutesToTime(time);
            
            // Verificar si el slot no está ocupado
            if (!this.isSlotBooked(date, timeStr)) {
                slots.push(timeStr);
            }
        }

        return slots;
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    minutesToTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    isSlotBooked(date, time) {
        const dateStr = date.toISOString().split('T')[0];
        return this.appointments.some(apt => 
            apt.date === dateStr && 
            apt.time === time && 
            apt.department === this.selectedDepartment &&
            apt.status !== 'cancelled'
        );
    }

    selectTimeSlot(time) {
        // Limpiar selección anterior
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Seleccionar nuevo horario
        event.target.classList.add('selected');
        this.selectedTime = time;

        // Mostrar formulario de datos
        this.showAppointmentForm();
    }

    showAppointmentForm() {
        const modal = document.getElementById('appointmentFormModal');
        if (modal) {
            const dept = this.departments.find(d => d.id === this.selectedDepartment);
            
            // Actualizar información en el modal
            document.getElementById('appointmentDept').textContent = dept.name;
            document.getElementById('appointmentDate').textContent = this.selectedDate.toLocaleDateString('es-ES');
            document.getElementById('appointmentTime').textContent = this.selectedTime;

            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    setupEventListeners() {
        // Botones de agendar cita
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-appointment')) {
                this.selectedDepartment = e.target.dataset.department;
                this.showCalendarModal();
            }
        });

        // Formulario de cita
        const appointmentForm = document.getElementById('appointmentForm');
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processAppointment();
            });
        }

        // Botones de navegación del calendario
        this.setupCalendarNavigation();
    }

    showCalendarModal() {
        const modal = document.getElementById('calendarModal');
        if (modal) {
            const dept = this.departments.find(d => d.id === this.selectedDepartment);
            document.getElementById('modalDepartmentName').textContent = dept.name;
            
            this.renderCalendar();
            
            const bootstrapModal = new bootstrap.Modal(modal);
            bootstrapModal.show();
        }
    }

    processAppointment() {
        const form = document.getElementById('appointmentForm');
        const formData = new FormData(form);
        
        const appointment = {
            id: this.generateId(),
            department: this.selectedDepartment,
            date: this.selectedDate.toISOString().split('T')[0],
            time: this.selectedTime,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            reason: formData.get('reason'),
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // Validaciones básicas
        if (!appointment.name || !appointment.email || !appointment.phone) {
            this.showAlert('Por favor completa todos los campos obligatorios', 'error');
            return;
        }

        // Guardar cita
        this.appointments.push(appointment);
        this.saveAppointments();

        // Mostrar confirmación
        this.showConfirmation(appointment);
        
        // Cerrar modales
        bootstrap.Modal.getInstance(document.getElementById('appointmentFormModal')).hide();
        bootstrap.Modal.getInstance(document.getElementById('calendarModal')).hide();
        
        // Resetear selecciones
        this.resetSelections();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showConfirmation(appointment) {
        const dept = this.departments.find(d => d.id === appointment.department);
        const confirmationHTML = `
            <div class="modal fade" id="confirmationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-check-circle me-2"></i>
                                Cita Confirmada
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="fas fa-calendar-check text-success" style="font-size: 3rem;"></i>
                            </div>
                            <h6 class="text-center mb-4">¡Tu cita ha sido agendada exitosamente!</h6>
                            <div class="appointment-details">
                                <div class="row">
                                    <div class="col-4"><strong>Departamento:</strong></div>
                                    <div class="col-8">${dept.name}</div>
                                </div>
                                <div class="row">
                                    <div class="col-4"><strong>Fecha:</strong></div>
                                    <div class="col-8">${new Date(appointment.date).toLocaleDateString('es-ES')}</div>
                                </div>
                                <div class="row">
                                    <div class="col-4"><strong>Hora:</strong></div>
                                    <div class="col-8">${appointment.time}</div>
                                </div>
                                <div class="row">
                                    <div class="col-4"><strong>Duración:</strong></div>
                                    <div class="col-8">${dept.duration} minutos</div>
                                </div>
                                <div class="row">
                                    <div class="col-4"><strong>ID de cita:</strong></div>
                                    <div class="col-8"><code>${appointment.id}</code></div>
                                </div>
                            </div>
                            <div class="alert alert-info mt-3">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>Importante:</strong> Por favor llega 10 minutos antes de tu cita. Guarda el ID de tu cita para cualquier consulta.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" onclick="appointmentSystem.downloadConfirmation('${appointment.id}')">
                                <i class="fas fa-download me-2"></i>
                                Descargar Confirmación
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar y mostrar modal
        document.body.insertAdjacentHTML('beforeend', confirmationHTML);
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        modal.show();

        // Remover modal al cerrar
        document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    downloadConfirmation(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const dept = this.departments.find(d => d.id === appointment.department);
        const content = `
CONFIRMACIÓN DE CITA
Bachillerato General Estatal "Héroes de la Patria"

==================================================

Departamento: ${dept.name}
Fecha: ${new Date(appointment.date).toLocaleDateString('es-ES')}
Hora: ${appointment.time}
Duración: ${dept.duration} minutos

Datos del solicitante:
Nombre: ${appointment.name}
Teléfono: ${appointment.phone}
Email: ${appointment.email}

Motivo: ${appointment.reason}

ID de Cita: ${appointment.id}
Fecha de creación: ${new Date(appointment.createdAt).toLocaleString('es-ES')}

==================================================

IMPORTANTE:
- Llega 10 minutos antes de tu cita
- Trae una identificación oficial
- Si necesitas cancelar, contacta con 24 horas de anticipación
- Teléfono de contacto: (222) 123-4567

Bachillerato General Estatal "Héroes de la Patria"
Coronel Tito Hernández, Venustiano Carranza, Puebla
        `;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cita_${appointment.id}_${appointment.date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetSelections() {
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDepartment = null;
        
        // Limpiar formulario
        const form = document.getElementById('appointmentForm');
        if (form) form.reset();
    }

    showAlert(message, type) {
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

    // Método para consultar citas (para futuros usos)
    getAppointmentsByDate(date) {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
        return this.appointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled');
    }

    // Método para cancelar citas
    cancelAppointment(appointmentId) {
        const index = this.appointments.findIndex(apt => apt.id === appointmentId);
        if (index !== -1) {
            this.appointments[index].status = 'cancelled';
            this.saveAppointments();
            return true;
        }
        return false;
    }
}

// Estilos CSS adicionales para el calendario
const appointmentStyles = `
<style>
.calendar-grid {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
}

.calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.weekday {
    padding: 0.75rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.875rem;
    color: #495057;
    border-right: 1px solid #dee2e6;
}

.weekday:last-child {
    border-right: none;
}

.calendar-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
    padding: 1rem;
    text-align: center;
    border-right: 1px solid #dee2e6;
    border-bottom: 1px solid #dee2e6;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.calendar-day:last-child {
    border-right: none;
}

.calendar-day:hover:not(.disabled) {
    background-color: #e3f2fd;
}

.calendar-day.available {
    background-color: #f8f9fa;
    font-weight: 500;
}

.calendar-day.available:hover {
    background-color: #e3f2fd;
    color: #1976d2;
}

.calendar-day.selected {
    background-color: #1976d2;
    color: white;
    font-weight: bold;
}

.calendar-day.today {
    background-color: #fff3e0;
    color: #f57c00;
    font-weight: bold;
}

.calendar-day.disabled {
    color: #ced4da;
    cursor: not-allowed;
    background-color: #f8f9fa;
}

.calendar-day.other-month {
    color: #adb5bd;
}

.calendar-day.weekend {
    background-color: #ffeaa7;
    color: #636e72;
}

.time-slot {
    min-width: 80px;
    transition: all 0.2s ease;
}

.time-slot.selected {
    background-color: #1976d2;
    color: white;
    border-color: #1976d2;
}

.department-card {
    transition: all 0.3s ease;
    cursor: pointer;
}

.department-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15)!important;
}

.appointment-details .row {
    margin-bottom: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid #f8f9fa;
}

.appointment-details .row:last-child {
    border-bottom: none;
}

@media (max-width: 768px) {
    .calendar-day {
        padding: 0.5rem;
        min-height: 45px;
        font-size: 0.875rem;
    }
    
    .weekday {
        padding: 0.5rem;
        font-size: 0.75rem;
    }
    
    .time-slot {
        min-width: 70px;
        font-size: 0.875rem;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', appointmentStyles);

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('departmentsContainer')) {
        window.appointmentSystem = new AppointmentSystem();
    }
});