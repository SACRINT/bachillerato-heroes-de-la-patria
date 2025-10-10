/**
 * 📅 SISTEMA DE CITAS Y REUNIONES VIRTUALES
 * Integración completa con el chat padres-docentes para videoconferencias
 */

class VirtualAppointments {
    constructor() {
        this.appointments = new Map();
        this.currentUser = null;
        this.apiBase = 'http://localhost:8000/api/parent-teacher';
        this.socket = null;
        this.calendar = null;

        this.init();
    }

    async init() {
        try {
            await this.loadUserSession();
            this.initializeCalendar();
            this.setupEventListeners();
            await this.loadAppointments();

            console.log('📅 [APPOINTMENTS] Sistema de citas virtuales inicializado');
        } catch (error) {
            console.error('❌ [APPOINTMENTS] Error inicializando:', error);
            this.showError('Error al inicializar el sistema de citas');
        }
    }

    async loadUserSession() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        this.currentUser = {
            id: localStorage.getItem('user_id') || 'user_' + Date.now(),
            name: localStorage.getItem('user_name') || 'Usuario',
            type: localStorage.getItem('user_type') || 'parent',
            token: token
        };
    }

    initializeCalendar() {
        this.createCalendarUI();
    }

    createCalendarUI() {
        if (document.getElementById('virtual-appointments-container')) return;

        const appointmentsHTML = `
            <div id="virtual-appointments-container" class="appointments-container" style="display: none;">
                <div class="appointments-header">
                    <div class="appointments-title">
                        <h2><i class="fas fa-calendar-alt"></i> Citas y Reuniones Virtuales</h2>
                        <p>Programa reuniones con ${this.currentUser.type === 'parent' ? 'docentes' : 'padres de familia'}</p>
                    </div>
                    <div class="appointments-actions">
                        <button id="new-appointment-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Nueva Cita
                        </button>
                        <button id="calendar-view-btn" class="btn btn-secondary">
                            <i class="fas fa-calendar"></i> Vista Calendario
                        </button>
                        <button id="close-appointments-btn" class="btn btn-ghost">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="appointments-body">
                    <div class="appointments-sidebar">
                        <div class="appointments-filters">
                            <h4>Filtros</h4>
                            <div class="filter-group">
                                <label>Estado:</label>
                                <select id="status-filter">
                                    <option value="">Todos</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="confirmed">Confirmada</option>
                                    <option value="completed">Completada</option>
                                    <option value="cancelled">Cancelada</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Tipo:</label>
                                <select id="type-filter">
                                    <option value="">Todos</option>
                                    <option value="virtual">Virtual</option>
                                    <option value="presential">Presencial</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>Fecha:</label>
                                <input type="date" id="date-filter">
                            </div>
                        </div>

                        <div class="quick-stats">
                            <h4>Estadísticas</h4>
                            <div class="stat-item">
                                <span class="stat-number" id="pending-count">0</span>
                                <span class="stat-label">Pendientes</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="today-count">0</span>
                                <span class="stat-label">Hoy</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="week-count">0</span>
                                <span class="stat-label">Esta semana</span>
                            </div>
                        </div>
                    </div>

                    <div class="appointments-main">
                        <div class="appointments-toolbar">
                            <div class="view-controls">
                                <button class="view-btn active" data-view="list">
                                    <i class="fas fa-list"></i> Lista
                                </button>
                                <button class="view-btn" data-view="calendar">
                                    <i class="fas fa-calendar"></i> Calendario
                                </button>
                                <button class="view-btn" data-view="timeline">
                                    <i class="fas fa-clock"></i> Timeline
                                </button>
                            </div>
                            <div class="search-appointments">
                                <input type="text" id="search-appointments" placeholder="Buscar citas...">
                                <button class="search-btn">
                                    <i class="fas fa-search"></i>
                                </button>
                            </div>
                        </div>

                        <div id="appointments-list" class="appointments-list">
                            <div class="loading-appointments">
                                <i class="fas fa-spinner fa-spin"></i>
                                Cargando citas...
                            </div>
                        </div>

                        <div id="appointments-calendar" class="appointments-calendar" style="display: none;">
                            <div class="calendar-header">
                                <button id="prev-month" class="calendar-nav">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <h3 id="current-month">Septiembre 2025</h3>
                                <button id="next-month" class="calendar-nav">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                            <div id="calendar-grid" class="calendar-grid">
                                <!-- Calendario se genera dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal para nueva cita -->
                <div id="appointment-form-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="appointment-modal-title">Nueva Cita</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <form id="appointment-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Con:</label>
                                        <select id="appointment-participant" required>
                                            <option value="">Seleccionar...</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Estudiante (si aplica):</label>
                                        <select id="appointment-student">
                                            <option value="">Seleccionar...</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Fecha:</label>
                                        <input type="date" id="appointment-date"
                                               min="${new Date().toISOString().split('T')[0]}" required>
                                    </div>
                                    <div class="form-group">
                                        <label>Hora:</label>
                                        <select id="appointment-time" required>
                                            <option value="">Seleccionar hora...</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Duración:</label>
                                        <select id="appointment-duration">
                                            <option value="30">30 minutos</option>
                                            <option value="45">45 minutos</option>
                                            <option value="60" selected>60 minutos</option>
                                            <option value="90">90 minutos</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Tipo de reunión:</label>
                                        <select id="appointment-type" required>
                                            <option value="virtual">Virtual (Videoconferencia)</option>
                                            <option value="presential">Presencial</option>
                                            <option value="phone">Llamada telefónica</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label>Asunto:</label>
                                    <input type="text" id="appointment-subject"
                                           placeholder="Tema de la reunión" required>
                                </div>

                                <div class="form-group">
                                    <label>Descripción:</label>
                                    <textarea id="appointment-description" rows="3"
                                             placeholder="Detalles adicionales, agenda, documentos a revisar..."></textarea>
                                </div>

                                <div class="form-group" id="virtual-meeting-options" style="display: none;">
                                    <label>Plataforma de videoconferencia:</label>
                                    <select id="meeting-platform">
                                        <option value="system">Sistema integrado</option>
                                        <option value="zoom">Zoom</option>
                                        <option value="meet">Google Meet</option>
                                        <option value="teams">Microsoft Teams</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label>Prioridad:</label>
                                    <select id="appointment-priority">
                                        <option value="normal">Normal</option>
                                        <option value="high">Alta</option>
                                        <option value="urgent">Urgente</option>
                                    </select>
                                </div>

                                <div class="form-group">
                                    <div class="form-checkbox">
                                        <input type="checkbox" id="send-reminder">
                                        <label for="send-reminder">Enviar recordatorio automático</label>
                                    </div>
                                </div>

                                <div class="form-group" id="reminder-options" style="display: none;">
                                    <label>Recordar:</label>
                                    <div class="checkbox-group">
                                        <div class="form-checkbox">
                                            <input type="checkbox" id="reminder-1h" checked>
                                            <label for="reminder-1h">1 hora antes</label>
                                        </div>
                                        <div class="form-checkbox">
                                            <input type="checkbox" id="reminder-1d">
                                            <label for="reminder-1d">1 día antes</label>
                                        </div>
                                        <div class="form-checkbox">
                                            <input type="checkbox" id="reminder-email">
                                            <label for="reminder-email">Por email también</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" id="cancel-appointment-btn" class="btn btn-secondary">
                                Cancelar
                            </button>
                            <button type="submit" id="save-appointment-btn" class="btn btn-primary">
                                <i class="fas fa-save"></i> Agendar Cita
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Modal para detalles de cita -->
                <div id="appointment-details-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Detalles de la Cita</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div id="appointment-details-content">
                                <!-- Contenido se carga dinámicamente -->
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="edit-appointment-btn" class="btn btn-secondary">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button id="cancel-appointment-action-btn" class="btn btn-danger">
                                <i class="fas fa-times"></i> Cancelar Cita
                            </button>
                            <button id="join-meeting-btn" class="btn btn-primary" style="display: none;">
                                <i class="fas fa-video"></i> Unirse a Reunión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', appointmentsHTML);
        this.setupAppointmentEventListeners();
    }

    setupEventListeners() {
        // Los event listeners principales se configuran después de crear la UI
    }

    setupAppointmentEventListeners() {
        // Botones principales
        document.getElementById('close-appointments-btn')?.addEventListener('click', () => this.close());
        document.getElementById('new-appointment-btn')?.addEventListener('click', () => this.showAppointmentForm());

        // Filtros
        document.getElementById('status-filter')?.addEventListener('change', () => this.filterAppointments());
        document.getElementById('type-filter')?.addEventListener('change', () => this.filterAppointments());
        document.getElementById('date-filter')?.addEventListener('change', () => this.filterAppointments());

        // Vistas
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('.view-btn').dataset.view;
                this.switchView(view);
            });
        });

        // Búsqueda
        document.getElementById('search-appointments')?.addEventListener('input', (e) => {
            this.searchAppointments(e.target.value);
        });

        // Formulario de cita
        document.getElementById('appointment-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAppointment();
        });

        // Cambio de tipo de reunión
        document.getElementById('appointment-type')?.addEventListener('change', (e) => {
            this.toggleVirtualMeetingOptions(e.target.value === 'virtual');
        });

        // Recordatorios
        document.getElementById('send-reminder')?.addEventListener('change', (e) => {
            document.getElementById('reminder-options').style.display = e.target.checked ? 'block' : 'none';
        });

        // Fecha de cita
        document.getElementById('appointment-date')?.addEventListener('change', () => {
            this.loadAvailableTimeSlots();
        });

        // Modales
        this.setupModalListeners();

        // Calendario
        document.getElementById('prev-month')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('next-month')?.addEventListener('click', () => this.changeMonth(1));
    }

    setupModalListeners() {
        // Cerrar modales
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Botones de acción
        document.getElementById('cancel-appointment-btn')?.addEventListener('click', () => {
            document.getElementById('appointment-form-modal').style.display = 'none';
        });

        document.getElementById('edit-appointment-btn')?.addEventListener('click', () => {
            this.editCurrentAppointment();
        });

        document.getElementById('join-meeting-btn')?.addEventListener('click', () => {
            this.joinVirtualMeeting();
        });
    }

    async loadAppointments() {
        try {
            const response = await fetch(`${this.apiBase}/appointments`, {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayAppointments(data.appointments || []);
            this.updateStats(data.appointments || []);

        } catch (error) {
            console.error('❌ [APPOINTMENTS] Error cargando citas:', error);
            this.displayAppointments([]);
        }
    }

    displayAppointments(appointments) {
        const container = document.getElementById('appointments-list');
        if (!container) return;

        if (appointments.length === 0) {
            container.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-times fa-3x"></i>
                    <h3>No tienes citas programadas</h3>
                    <p>Programa tu primera reunión haciendo clic en "Nueva Cita"</p>
                    <button class="btn btn-primary" onclick="virtualAppointments.showAppointmentForm()">
                        <i class="fas fa-plus"></i> Agendar Primera Cita
                    </button>
                </div>
            `;
            return;
        }

        const appointmentsHTML = appointments.map(appointment => this.createAppointmentHTML(appointment)).join('');
        container.innerHTML = appointmentsHTML;

        // Guardar en el mapa
        appointments.forEach(appointment => {
            this.appointments.set(appointment.id, appointment);
        });
    }

    createAppointmentHTML(appointment) {
        const statusClass = this.getStatusClass(appointment.status);
        const statusIcon = this.getStatusIcon(appointment.status);
        const timeUntil = this.getTimeUntil(appointment.scheduled_datetime);

        return `
            <div class="appointment-item ${statusClass}" data-appointment-id="${appointment.id}"
                 onclick="virtualAppointments.showAppointmentDetails('${appointment.id}')">
                <div class="appointment-header">
                    <div class="appointment-status">
                        <i class="fas ${statusIcon}"></i>
                        <span>${this.getStatusLabel(appointment.status)}</span>
                    </div>
                    <div class="appointment-time">
                        <i class="fas fa-clock"></i>
                        ${timeUntil}
                    </div>
                </div>
                <div class="appointment-info">
                    <h4 class="appointment-subject">${appointment.subject}</h4>
                    <div class="appointment-participant">
                        <img src="${appointment.participant_avatar || 'https://via.placeholder.com/32'}"
                             alt="${appointment.participant_name}" class="participant-avatar">
                        <span>${appointment.participant_name}</span>
                        ${appointment.student_name ? `<span class="student-info">• ${appointment.student_name}</span>` : ''}
                    </div>
                    <div class="appointment-details">
                        <span class="appointment-date">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(appointment.scheduled_datetime)}
                        </span>
                        <span class="appointment-type">
                            <i class="fas ${appointment.type === 'virtual' ? 'fa-video' : 'fa-map-marker-alt'}"></i>
                            ${this.getTypeLabel(appointment.type)}
                        </span>
                        ${appointment.priority === 'high' || appointment.priority === 'urgent' ?
                            `<span class="priority-badge priority-${appointment.priority}">
                                <i class="fas fa-exclamation-triangle"></i>
                                ${appointment.priority === 'urgent' ? 'Urgente' : 'Alta prioridad'}
                            </span>` : ''}
                    </div>
                </div>
                ${appointment.status === 'confirmed' && appointment.type === 'virtual' ?
                    `<div class="appointment-actions">
                        <button class="btn-join-meeting" onclick="event.stopPropagation(); virtualAppointments.joinMeeting('${appointment.id}')">
                            <i class="fas fa-video"></i> Unirse
                        </button>
                    </div>` : ''}
            </div>
        `;
    }

    showAppointmentForm(appointmentId = null) {
        const modal = document.getElementById('appointment-form-modal');
        const title = document.getElementById('appointment-modal-title');

        if (appointmentId) {
            title.textContent = 'Editar Cita';
            this.loadAppointmentForEdit(appointmentId);
        } else {
            title.textContent = 'Nueva Cita';
            this.resetAppointmentForm();
        }

        this.loadParticipants();
        this.loadStudents();
        this.loadAvailableTimeSlots();

        modal.style.display = 'block';
    }

    async loadParticipants() {
        const select = document.getElementById('appointment-participant');
        if (!select) return;

        try {
            // Simular carga de participantes disponibles
            const participants = await this.getAvailableParticipants();

            select.innerHTML = '<option value="">Seleccionar...</option>' +
                participants.map(p => `<option value="${p.id}">${p.name} - ${p.role}</option>`).join('');

        } catch (error) {
            console.error('Error cargando participantes:', error);
        }
    }

    async loadStudents() {
        if (this.currentUser.type !== 'parent') return;

        const select = document.getElementById('appointment-student');
        if (!select) return;

        try {
            const students = await this.getUserStudents();

            select.innerHTML = '<option value="">Seleccionar...</option>' +
                students.map(s => `<option value="${s.id}">${s.name} - ${s.grade}</option>`).join('');

        } catch (error) {
            console.error('Error cargando estudiantes:', error);
        }
    }

    async loadAvailableTimeSlots() {
        const dateInput = document.getElementById('appointment-date');
        const timeSelect = document.getElementById('appointment-time');

        if (!dateInput.value || !timeSelect) return;

        try {
            const availableSlots = await this.getAvailableTimeSlots(dateInput.value);

            timeSelect.innerHTML = '<option value="">Seleccionar hora...</option>' +
                availableSlots.map(slot => `<option value="${slot}">${this.formatTimeSlot(slot)}</option>`).join('');

        } catch (error) {
            console.error('Error cargando horarios:', error);
            this.generateDefaultTimeSlots();
        }
    }

    generateDefaultTimeSlots() {
        const timeSelect = document.getElementById('appointment-time');
        if (!timeSelect) return;

        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }

        timeSelect.innerHTML = '<option value="">Seleccionar hora...</option>' +
            slots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
    }

    toggleVirtualMeetingOptions(show) {
        const options = document.getElementById('virtual-meeting-options');
        if (options) {
            options.style.display = show ? 'block' : 'none';
        }
    }

    async saveAppointment() {
        try {
            const formData = this.getAppointmentFormData();
            const isEdit = formData.id;

            const response = await fetch(`${this.apiBase}/appointments${isEdit ? `/${formData.id}` : ''}`, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            document.getElementById('appointment-form-modal').style.display = 'none';
            await this.loadAppointments();

            this.showSuccess(isEdit ? 'Cita actualizada exitosamente' : 'Cita agendada exitosamente');

        } catch (error) {
            console.error('❌ [APPOINTMENTS] Error guardando cita:', error);
            this.showError('Error al guardar la cita');
        }
    }

    getAppointmentFormData() {
        return {
            id: document.getElementById('appointment-id')?.value || null,
            participant_id: document.getElementById('appointment-participant').value,
            student_id: document.getElementById('appointment-student').value,
            scheduled_datetime: `${document.getElementById('appointment-date').value}T${document.getElementById('appointment-time').value}`,
            duration: parseInt(document.getElementById('appointment-duration').value),
            type: document.getElementById('appointment-type').value,
            subject: document.getElementById('appointment-subject').value,
            description: document.getElementById('appointment-description').value,
            meeting_platform: document.getElementById('meeting-platform').value,
            priority: document.getElementById('appointment-priority').value,
            send_reminder: document.getElementById('send-reminder').checked,
            reminder_options: {
                one_hour: document.getElementById('reminder-1h')?.checked || false,
                one_day: document.getElementById('reminder-1d')?.checked || false,
                email: document.getElementById('reminder-email')?.checked || false
            }
        };
    }

    resetAppointmentForm() {
        document.getElementById('appointment-form').reset();
        document.getElementById('appointment-date').min = new Date().toISOString().split('T')[0];
        document.getElementById('virtual-meeting-options').style.display = 'none';
        document.getElementById('reminder-options').style.display = 'none';
    }

    // Métodos auxiliares
    getStatusClass(status) {
        const classes = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return classes[status] || 'status-pending';
    }

    getStatusIcon(status) {
        const icons = {
            'pending': 'fa-clock',
            'confirmed': 'fa-check-circle',
            'completed': 'fa-check-double',
            'cancelled': 'fa-times-circle'
        };
        return icons[status] || 'fa-clock';
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmada',
            'completed': 'Completada',
            'cancelled': 'Cancelada'
        };
        return labels[status] || 'Pendiente';
    }

    getTypeLabel(type) {
        const labels = {
            'virtual': 'Virtual',
            'presential': 'Presencial',
            'phone': 'Teléfono'
        };
        return labels[type] || 'Virtual';
    }

    formatDate(datetime) {
        const date = new Date(datetime);
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatTimeSlot(time) {
        return time;
    }

    getTimeUntil(datetime) {
        const now = new Date();
        const appointmentDate = new Date(datetime);
        const diff = appointmentDate - now;

        if (diff < 0) return 'Pasada';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `En ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `En ${hours} hora${hours > 1 ? 's' : ''}`;
        return 'Muy pronto';
    }

    updateStats(appointments) {
        const pending = appointments.filter(a => a.status === 'pending').length;
        const today = appointments.filter(a => this.isToday(a.scheduled_datetime)).length;
        const thisWeek = appointments.filter(a => this.isThisWeek(a.scheduled_datetime)).length;

        document.getElementById('pending-count').textContent = pending;
        document.getElementById('today-count').textContent = today;
        document.getElementById('week-count').textContent = thisWeek;
    }

    isToday(datetime) {
        const date = new Date(datetime);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isThisWeek(datetime) {
        const date = new Date(datetime);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return date >= weekStart && date <= weekEnd;
    }

    // Métodos de datos mock para desarrollo
    async getAvailableParticipants() {
        return [
            { id: 'teacher_001', name: 'Prof. Carlos Méndez', role: 'Matemáticas' },
            { id: 'teacher_002', name: 'Prof. Ana García', role: 'Español' },
            { id: 'teacher_003', name: 'Prof. Miguel Torres', role: 'Ciencias' }
        ];
    }

    async getUserStudents() {
        return [
            { id: 'student_001', name: 'Juan Pérez', grade: '3° Semestre' },
            { id: 'student_002', name: 'María González', grade: '5° Semestre' }
        ];
    }

    async getAvailableTimeSlots(date) {
        // Simular horarios ocupados y disponibles
        const allSlots = [];
        for (let hour = 8; hour <= 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                allSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }
        }

        // Filtrar algunos horarios como ocupados
        const occupiedSlots = ['10:00', '14:30', '16:00'];
        return allSlots.filter(slot => !occupiedSlots.includes(slot));
    }

    switchView(view) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');

        document.getElementById('appointments-list').style.display = view === 'list' ? 'block' : 'none';
        document.getElementById('appointments-calendar').style.display = view === 'calendar' ? 'block' : 'none';

        if (view === 'calendar') {
            this.renderCalendar();
        }
    }

    renderCalendar() {
        // Implementar renderizado del calendario
        console.log('📅 Renderizando vista de calendario...');
    }

    showSuccess(message) {
        console.log('✅ [APPOINTMENTS]', message);
    }

    showError(message) {
        console.error('❌ [APPOINTMENTS]', message);
    }

    show() {
        document.getElementById('virtual-appointments-container').style.display = 'block';
    }

    close() {
        document.getElementById('virtual-appointments-container').style.display = 'none';
    }
}

// Inicializar el sistema de citas
let virtualAppointments;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('auth_token')) {
        virtualAppointments = new VirtualAppointments();
    }
});

// Función global para mostrar el sistema de citas
window.showVirtualAppointments = () => {
    if (!virtualAppointments) {
        virtualAppointments = new VirtualAppointments();
    }
    virtualAppointments.show();
};