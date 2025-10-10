/**
 * 📅 SISTEMA INTEGRADO DE CALENDARIO ACADÉMICO - FASE B
 * Calendario académico completo con integración backend API
 * Sistema de gestión de eventos escolares con CRUD completo
 */

class IntegratedCalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.eventFilter = '';
        this.events = [];
        this.userRole = null;
        this.authToken = null;
        this.config = {
            apiBase: '/api/calendar',
            refreshInterval: 30000,
            itemsPerPage: 20,
            supportedTypes: ['academico', 'administrativo', 'cultural', 'deportivo', 'social', 'emergencia'],
            colorMapping: {
                'academico': 'primary',
                'administrativo': 'secondary',
                'cultural': 'info',
                'deportivo': 'success',
                'social': 'warning',
                'emergencia': 'danger'
            }
        };

        this.init();
    }

    async init() {
        try {
            await this.loadUserAuth();
            await this.loadEvents();
            this.renderCalendar();
            this.setupEventListeners();
            this.updateCurrentMonthDisplay();
            this.setupAutoRefresh();
            console.log('✅ Calendario integrado inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando calendario:', error);
            this.showAlert('Error cargando calendario. Modo sin conexión.', 'warning');
            this.fallbackMode();
        }
    }

    // ============================================
    // AUTENTICACIÓN Y CONFIGURACIÓN
    // ============================================

    async loadUserAuth() {
        // Obtener información de autenticación
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('userData');

        if (token && user) {
            this.authToken = token;
            this.userRole = JSON.parse(user).rol || 'estudiante';
        }

        // Configurar headers para requests
        this.requestHeaders = {
            'Content-Type': 'application/json',
            ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        };
    }

    // ============================================
    // GESTIÓN DE EVENTOS
    // ============================================

    async loadEvents() {
        try {
            const startDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
            const endDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 2, 0);

            const params = new URLSearchParams({
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                view: this.currentView,
                limit: 100
            });

            if (this.eventFilter) {
                params.append('type', this.eventFilter);
            }

            const response = await fetch(`${this.config.apiBase}/events?${params}`, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.events = data.data || [];

            // Procesar eventos para normalizar formato
            this.events = this.events.map(event => this.normalizeEvent(event));

            console.log(`✅ Cargados ${this.events.length} eventos del calendario`);
            return this.events;

        } catch (error) {
            console.error('Error cargando eventos:', error);
            // Fallback a eventos locales si hay error
            await this.loadFallbackEvents();
            throw error;
        }
    }

    normalizeEvent(event) {
        return {
            id: event.id,
            title: event.title || event.titulo,
            description: event.description || event.descripcion,
            start_date: event.start_date || event.fecha,
            end_date: event.end_date || event.fecha_fin,
            all_day: event.all_day || event.todo_el_dia || false,
            location: event.location || event.ubicacion,
            type: event.type || event.tipo,
            priority: event.priority || event.prioridad || 'media',
            is_public: event.is_public !== false,
            status: event.status || 'programado',
            color: this.config.colorMapping[event.type] || 'primary',
            created_at: event.created_at,
            current_attendees: event.current_attendees || 0,
            max_attendees: event.max_attendees
        };
    }

    async loadFallbackEvents() {
        // Eventos estáticos de fallback para cuando no hay conexión
        this.events = [
            {
                id: 'inicio-clases-2024',
                title: 'Inicio del Ciclo Escolar 2024-2025',
                description: 'Comienzo oficial del nuevo ciclo escolar',
                start_date: '2024-08-26',
                end_date: '2024-08-26',
                type: 'academico',
                priority: 'alta',
                color: 'primary',
                status: 'programado'
            },
            {
                id: 'evaluaciones-1er-parcial',
                title: 'Evaluaciones Primer Parcial',
                description: 'Período de evaluaciones del primer parcial',
                start_date: '2024-09-30',
                end_date: '2024-10-04',
                type: 'academico',
                priority: 'alta',
                color: 'warning',
                status: 'programado'
            }
            // Más eventos de fallback...
        ];
    }

    // ============================================
    // CRUD DE EVENTOS (SOLO ADMIN/DOCENTES)
    // ============================================

    async createEvent(eventData) {
        if (!this.canManageEvents()) {
            throw new Error('No tienes permisos para crear eventos');
        }

        try {
            const response = await fetch(`${this.config.apiBase}/events`, {
                method: 'POST',
                headers: this.requestHeaders,
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error creando evento');
            }

            const result = await response.json();
            this.showAlert('Evento creado correctamente', 'success');
            await this.loadEvents();
            this.renderCurrentView();

            return result.data;

        } catch (error) {
            console.error('Error creando evento:', error);
            this.showAlert(error.message || 'Error creando evento', 'error');
            throw error;
        }
    }

    async updateEvent(eventId, updateData) {
        if (!this.canManageEvents()) {
            throw new Error('No tienes permisos para editar eventos');
        }

        try {
            const response = await fetch(`${this.config.apiBase}/events/${eventId}`, {
                method: 'PUT',
                headers: this.requestHeaders,
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error actualizando evento');
            }

            const result = await response.json();
            this.showAlert('Evento actualizado correctamente', 'success');
            await this.loadEvents();
            this.renderCurrentView();

            return result.data;

        } catch (error) {
            console.error('Error actualizando evento:', error);
            this.showAlert(error.message || 'Error actualizando evento', 'error');
            throw error;
        }
    }

    async deleteEvent(eventId) {
        if (!this.canManageEvents()) {
            throw new Error('No tienes permisos para eliminar eventos');
        }

        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) {
            return;
        }

        try {
            const response = await fetch(`${this.config.apiBase}/events/${eventId}`, {
                method: 'DELETE',
                headers: this.requestHeaders
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error eliminando evento');
            }

            this.showAlert('Evento eliminado correctamente', 'success');
            await this.loadEvents();
            this.renderCurrentView();

        } catch (error) {
            console.error('Error eliminando evento:', error);
            this.showAlert(error.message || 'Error eliminando evento', 'error');
            throw error;
        }
    }

    canManageEvents() {
        return ['admin', 'director', 'coordinador', 'docente'].includes(this.userRole);
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    setupEventListeners() {
        // Navegación de calendario
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const todayBtn = document.getElementById('todayBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.updateCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.updateCalendar();
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.updateCalendar();
            });
        }

        // Cambio de vista
        const monthViewBtn = document.getElementById('monthViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        const weekViewBtn = document.getElementById('weekViewBtn');

        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', () => this.switchView('month'));
        }

        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.switchView('list'));
        }

        if (weekViewBtn) {
            weekViewBtn.addEventListener('click', () => this.switchView('week'));
        }

        // Filtros
        const eventFilter = document.getElementById('eventFilter');
        if (eventFilter) {
            eventFilter.addEventListener('change', (e) => {
                this.eventFilter = e.target.value;
                this.updateCalendar();
            });
        }

        // Botón crear evento (solo para usuarios autorizados)
        const createEventBtn = document.getElementById('createEventBtn');
        if (createEventBtn && this.canManageEvents()) {
            createEventBtn.addEventListener('click', () => this.showCreateEventModal());
        } else if (createEventBtn) {
            createEventBtn.style.display = 'none';
        }

        // Búsqueda de eventos
        const searchInput = document.getElementById('eventSearch');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchEvents(e.target.value);
            }, 300));
        }
    }

    async updateCalendar() {
        try {
            await this.loadEvents();
            this.renderCurrentView();
            this.updateCurrentMonthDisplay();
        } catch (error) {
            console.error('Error actualizando calendario:', error);
            this.showAlert('Error actualizando calendario', 'warning');
        }
    }

    renderCurrentView() {
        switch (this.currentView) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'list':
                this.renderListView();
                break;
            default:
                this.renderMonthView();
        }
    }

    switchView(view) {
        this.currentView = view;

        // Actualizar botones de vista
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeBtn = document.getElementById(`${view}ViewBtn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Mostrar/ocultar contenedores de vista
        document.querySelectorAll('.calendar-view-container').forEach(container => {
            container.classList.add('d-none');
        });

        const viewContainer = document.getElementById(`${view}View`);
        if (viewContainer) {
            viewContainer.classList.remove('d-none');
        }

        this.renderCurrentView();
    }

    renderMonthView() {
        const container = document.getElementById('monthViewContainer');
        if (!container) return;

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();

        // Calcular días a mostrar (incluir días de meses anteriores/posteriores)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = `
            <div class="calendar-grid-integrated">
                <div class="calendar-header-integrated">
                    ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day =>
                        `<div class="weekday-integrated">${day}</div>`
                    ).join('')}
                </div>
                <div class="calendar-body-integrated">
        `;

        const currentDate = new Date(startDate);

        // Generar 6 semanas
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const dayEvents = this.getEventsForDate(currentDate);

                const dayClasses = ['calendar-day-integrated'];
                if (!isCurrentMonth) dayClasses.push('other-month');
                if (isToday) dayClasses.push('today');
                if (dayEvents.length > 0) dayClasses.push('has-events');

                let eventsHtml = '';
                if (dayEvents.length > 0 && isCurrentMonth) {
                    const maxShow = 3;
                    dayEvents.slice(0, maxShow).forEach(event => {
                        eventsHtml += `
                            <div class="event-indicator-integrated bg-${event.color}"
                                 title="${event.title}"
                                 onclick="calendar.showEventDetails('${event.id}')">
                                ${event.title}
                            </div>
                        `;
                    });

                    if (dayEvents.length > maxShow) {
                        eventsHtml += `<div class="more-events-integrated">+${dayEvents.length - maxShow} más</div>`;
                    }
                }

                html += `
                    <div class="${dayClasses.join(' ')}"
                         data-date="${currentDate.toISOString().split('T')[0]}"
                         ${isCurrentMonth ? `onclick="calendar.onDateClick('${currentDate.toISOString().split('T')[0]}')"` : ''}>
                        <div class="day-number-integrated">${currentDate.getDate()}</div>
                        <div class="day-events-integrated">${eventsHtml}</div>
                    </div>
                `;

                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        html += '</div></div>';
        container.innerHTML = html;
    }

    renderWeekView() {
        const container = document.getElementById('weekViewContainer');
        if (!container) return;

        const startOfWeek = new Date(this.currentDate);
        startOfWeek.setDate(this.currentDate.getDate() - this.currentDate.getDay());

        let html = `
            <div class="week-view-integrated">
                <div class="week-header-integrated">
                    <div class="time-column-integrated">Hora</div>
        `;

        // Headers de días de la semana
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            const dayName = day.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNumber = day.getDate();
            const isToday = day.toDateString() === new Date().toDateString();

            html += `
                <div class="day-column-header-integrated ${isToday ? 'today' : ''}">
                    <div class="day-name">${dayName}</div>
                    <div class="day-number">${dayNumber}</div>
                </div>
            `;
        }

        html += '</div><div class="week-body-integrated">';

        // Horas del día (7 AM - 8 PM para eventos escolares)
        for (let hour = 7; hour <= 20; hour++) {
            html += `
                <div class="hour-row-integrated">
                    <div class="time-slot-integrated">${hour.toString().padStart(2, '0')}:00</div>
            `;

            // Columnas de días para esta hora
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + dayOffset);

                const dayEvents = this.getEventsForDate(day);
                const hourEvents = dayEvents.filter(event => {
                    if (event.all_day) return hour === 8; // Mostrar eventos de todo el día a las 8 AM
                    const eventHour = new Date(event.start_date).getHours();
                    return eventHour === hour;
                });

                let eventsHtml = '';
                hourEvents.forEach(event => {
                    eventsHtml += `
                        <div class="week-event-integrated bg-${event.color}"
                             onclick="calendar.showEventDetails('${event.id}')">
                            ${event.title}
                        </div>
                    `;
                });

                html += `<div class="day-time-slot-integrated">${eventsHtml}</div>`;
            }

            html += '</div>';
        }

        html += '</div></div>';
        container.innerHTML = html;
    }

    renderListView() {
        const container = document.getElementById('listViewContainer');
        if (!container) return;

        const filteredEvents = this.filterEvents(this.events);

        if (filteredEvents.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay eventos para mostrar</h5>
                    <p class="text-muted">Prueba cambiar el filtro o crear un nuevo evento</p>
                </div>
            `;
            return;
        }

        // Agrupar eventos por fecha
        const eventsByDate = {};
        filteredEvents.forEach(event => {
            const dateKey = event.start_date.split('T')[0];
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });

        let html = '<div class="events-list-integrated">';

        Object.keys(eventsByDate)
            .sort()
            .slice(0, 50) // Límite de eventos para performance
            .forEach(dateKey => {
                const date = new Date(dateKey);
                const dateDisplay = date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                html += `
                    <div class="date-group-integrated mb-4">
                        <h5 class="date-header-integrated">${dateDisplay}</h5>
                        <div class="events-for-date">
                `;

                eventsByDate[dateKey].forEach(event => {
                    const startTime = event.all_day ? 'Todo el día' :
                                    new Date(event.start_date).toLocaleTimeString('es-ES', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });

                    html += `
                        <div class="event-item-integrated card mb-2"
                             onclick="calendar.showEventDetails('${event.id}')">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center">
                                    <div class="event-time-integrated me-3">
                                        <small class="text-muted">${startTime}</small>
                                    </div>
                                    <div class="event-content-integrated flex-grow-1">
                                        <h6 class="mb-1">${event.title}</h6>
                                        <p class="mb-0 text-muted small">${event.description || ''}</p>
                                        ${event.location ? `<small class="text-muted"><i class="fas fa-map-marker-alt me-1"></i>${event.location}</small>` : ''}
                                    </div>
                                    <div class="event-meta-integrated">
                                        <span class="badge bg-${event.color}">${this.getEventTypeLabel(event.type)}</span>
                                        ${event.priority === 'alta' || event.priority === 'urgente' ?
                                            '<i class="fas fa-exclamation-triangle text-warning ms-2"></i>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });

                html += '</div></div>';
            });

        html += '</div>';
        container.innerHTML = html;
    }

    updateCurrentMonthDisplay() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        const monthYear = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        const displayElement = document.getElementById('currentMonthYear');
        if (displayElement) {
            displayElement.textContent = monthYear;
        }
    }

    // ============================================
    // UTILIDADES Y HELPERS
    // ============================================

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.filterEvents(this.events.filter(event => {
            const eventStart = event.start_date.split('T')[0];
            const eventEnd = event.end_date ? event.end_date.split('T')[0] : eventStart;
            return dateStr >= eventStart && dateStr <= eventEnd;
        }));
    }

    filterEvents(events) {
        if (!this.eventFilter) return events;
        return events.filter(event => event.type === this.eventFilter);
    }

    searchEvents(query) {
        if (!query.trim()) {
            this.renderCurrentView();
            return;
        }

        const filteredEvents = this.events.filter(event =>
            event.title.toLowerCase().includes(query.toLowerCase()) ||
            event.description?.toLowerCase().includes(query.toLowerCase()) ||
            event.location?.toLowerCase().includes(query.toLowerCase())
        );

        // Actualizar vista con eventos filtrados
        const originalEvents = this.events;
        this.events = filteredEvents;
        this.renderCurrentView();
        this.events = originalEvents;
    }

    getEventTypeLabel(type) {
        const labels = {
            'academico': 'Académico',
            'administrativo': 'Administrativo',
            'cultural': 'Cultural',
            'deportivo': 'Deportivo',
            'social': 'Social',
            'emergencia': 'Emergencia'
        };
        return labels[type] || 'Evento';
    }

    onDateClick(dateStr) {
        if (this.canManageEvents()) {
            this.showCreateEventModal(dateStr);
        } else {
            const dayEvents = this.events.filter(event =>
                event.start_date.split('T')[0] === dateStr
            );
            if (dayEvents.length > 0) {
                this.showDayEventsModal(dateStr, dayEvents);
            }
        }
    }

    async showEventDetails(eventId) {
        try {
            const event = this.events.find(e => e.id.toString() === eventId.toString());
            if (!event) {
                this.showAlert('Evento no encontrado', 'error');
                return;
            }

            const startDate = new Date(event.start_date);
            const endDate = event.end_date ? new Date(event.end_date) : null;

            const formatDate = (date) => {
                return date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: event.all_day ? undefined : '2-digit',
                    minute: event.all_day ? undefined : '2-digit'
                });
            };

            const dateDisplay = endDate && endDate.getTime() !== startDate.getTime() ?
                `Del ${formatDate(startDate)} al ${formatDate(endDate)}` :
                formatDate(startDate);

            const modalBody = `
                <div class="event-details-integrated">
                    <div class="event-header-integrated mb-3">
                        <span class="badge bg-${event.color} fs-6 mb-2">
                            ${this.getEventTypeLabel(event.type)}
                        </span>
                        ${event.priority === 'alta' || event.priority === 'urgente' ?
                            '<i class="fas fa-exclamation-triangle text-warning ms-2"></i>' : ''}
                    </div>
                    <div class="event-info-integrated">
                        <div class="mb-3">
                            <h6><i class="fas fa-calendar text-primary me-2"></i>Fecha y hora:</h6>
                            <p class="ms-4">${dateDisplay}</p>
                        </div>
                        ${event.description ? `
                            <div class="mb-3">
                                <h6><i class="fas fa-info-circle text-primary me-2"></i>Descripción:</h6>
                                <p class="ms-4">${event.description}</p>
                            </div>
                        ` : ''}
                        ${event.location ? `
                            <div class="mb-3">
                                <h6><i class="fas fa-map-marker-alt text-primary me-2"></i>Ubicación:</h6>
                                <p class="ms-4">${event.location}</p>
                            </div>
                        ` : ''}
                        ${event.max_attendees ? `
                            <div class="mb-3">
                                <h6><i class="fas fa-users text-primary me-2"></i>Asistencia:</h6>
                                <p class="ms-4">${event.current_attendees || 0} / ${event.max_attendees} participantes</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="event-actions-integrated mt-4">
                        ${this.canManageEvents() ? `
                            <button class="btn btn-outline-primary btn-sm me-2"
                                    onclick="calendar.editEvent('${event.id}')">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                            <button class="btn btn-outline-danger btn-sm"
                                    onclick="calendar.deleteEvent('${event.id}')">
                                <i class="fas fa-trash me-1"></i>Eliminar
                            </button>
                        ` : ''}
                        ${event.max_attendees && this.authToken ? `
                            <button class="btn btn-outline-success btn-sm"
                                    onclick="calendar.registerAttendance('${event.id}')">
                                <i class="fas fa-user-check me-1"></i>Asistir
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;

            this.showModal('Detalles del Evento', event.title, modalBody);

        } catch (error) {
            console.error('Error mostrando detalles:', error);
            this.showAlert('Error cargando detalles del evento', 'error');
        }
    }

    // ============================================
    // GESTIÓN DE ASISTENCIA
    // ============================================

    async registerAttendance(eventId) {
        if (!this.authToken) {
            this.showAlert('Debes iniciar sesión para registrarte', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.config.apiBase}/events/${eventId}/attend`, {
                method: 'POST',
                headers: this.requestHeaders
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error registrando asistencia');
            }

            const result = await response.json();
            this.showAlert('Asistencia registrada correctamente', 'success');
            await this.loadEvents();
            this.renderCurrentView();

        } catch (error) {
            console.error('Error registrando asistencia:', error);
            this.showAlert(error.message || 'Error registrando asistencia', 'error');
        }
    }

    // ============================================
    // AUTO-REFRESH Y UTILIDADES
    // ============================================

    setupAutoRefresh() {
        setInterval(async () => {
            try {
                await this.loadEvents();
                this.renderCurrentView();
            } catch (error) {
                // Silenciar errores de auto-refresh para no molestar al usuario
                console.warn('Auto-refresh falló:', error.message);
            }
        }, this.config.refreshInterval);
    }

    fallbackMode() {
        console.log('⚠️ Calendario en modo fallback (sin conexión)');
        this.loadFallbackEvents();
        this.renderCurrentView();
    }

    showAlert(message, type = 'info') {
        // Crear alerta toast
        const alertId = `alert-${Date.now()}`;
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1060; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    showModal(title, subtitle, body) {
        // Mostrar modal genérico
        const modal = document.getElementById('eventModal') || this.createModal();
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');

        if (modalTitle) modalTitle.innerHTML = `<i class="fas fa-calendar-day me-2"></i>${title}`;
        if (modalBody) modalBody.innerHTML = body;

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'eventModal';
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        return modal;
    }
}

// ============================================
// FUNCIONES GLOBALES Y UTILIDADES
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Estilos CSS integrados
const integratedCalendarStyles = `
<style>
.calendar-grid-integrated {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
    background: white;
}

.calendar-header-integrated {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
}

.weekday-integrated {
    padding: 1rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.9rem;
    color: #495057;
    border-right: 1px solid #dee2e6;
}

.calendar-body-integrated {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-gap: 0;
}

.calendar-day-integrated {
    min-height: 120px;
    padding: 0.5rem;
    border-right: 1px solid #dee2e6;
    border-bottom: 1px solid #dee2e6;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
}

.calendar-day-integrated:hover {
    background-color: #f8f9fa;
    transform: scale(1.02);
}

.calendar-day-integrated.other-month {
    color: #adb5bd;
    background-color: #f8f9fa;
}

.calendar-day-integrated.today {
    background-color: #e3f2fd;
    border: 2px solid #1976d2;
}

.calendar-day-integrated.has-events {
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
}

.day-number-integrated {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #495057;
}

.calendar-day-integrated.today .day-number-integrated {
    background-color: #1976d2;
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.5rem;
}

.event-indicator-integrated {
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 3px;
    color: white;
    margin-bottom: 2px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.2s ease;
    font-weight: 500;
}

.event-indicator-integrated:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.more-events-integrated {
    font-size: 0.6rem;
    color: #6c757d;
    font-weight: 600;
    margin-top: 2px;
    text-align: center;
    padding: 1px 4px;
    background: #e9ecef;
    border-radius: 2px;
}

.events-list-integrated {
    max-height: 600px;
    overflow-y: auto;
}

.date-group-integrated {
    border-left: 4px solid #1976d2;
    padding-left: 1rem;
    margin-bottom: 2rem;
}

.date-header-integrated {
    color: #1976d2;
    font-weight: 600;
    margin-bottom: 1rem;
    text-transform: capitalize;
}

.event-item-integrated {
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid #dee2e6;
}

.event-item-integrated:hover {
    transform: translateX(8px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: #1976d2;
}

.week-view-integrated {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
    background: white;
}

.week-header-integrated {
    display: grid;
    grid-template-columns: 100px repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;
}

.time-column-integrated {
    padding: 1rem;
    text-align: center;
    font-weight: 600;
    border-right: 1px solid #dee2e6;
}

.day-column-header-integrated {
    padding: 1rem;
    text-align: center;
    border-right: 1px solid #dee2e6;
    transition: background-color 0.2s ease;
}

.day-column-header-integrated.today {
    background-color: #e3f2fd;
    color: #1976d2;
    font-weight: 600;
}

.week-body-integrated {
    max-height: 500px;
    overflow-y: auto;
}

.hour-row-integrated {
    display: grid;
    grid-template-columns: 100px repeat(7, 1fr);
    border-bottom: 1px solid #f0f0f0;
    min-height: 60px;
}

.time-slot-integrated {
    padding: 0.5rem;
    text-align: center;
    font-size: 0.85rem;
    color: #6c757d;
    border-right: 1px solid #dee2e6;
    background-color: #f8f9fa;
}

.day-time-slot-integrated {
    padding: 0.25rem;
    border-right: 1px solid #f0f0f0;
    position: relative;
}

.week-event-integrated {
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 0.7rem;
    color: white;
    cursor: pointer;
    margin-bottom: 1px;
    transition: all 0.2s ease;
}

.week-event-integrated:hover {
    transform: scale(1.05);
}

/* Responsive design */
@media (max-width: 768px) {
    .calendar-day-integrated {
        min-height: 80px;
        padding: 0.25rem;
    }

    .weekday-integrated {
        padding: 0.5rem;
        font-size: 0.8rem;
    }

    .day-number-integrated {
        font-size: 0.9rem;
    }

    .event-indicator-integrated {
        font-size: 0.6rem;
        padding: 1px 3px;
    }

    .week-view-integrated {
        display: none; /* Ocultar vista semanal en móvil */
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .calendar-grid-integrated {
        background-color: #2d3748;
        border-color: #4a5568;
    }

    .calendar-header-integrated {
        background-color: #4a5568;
    }

    .weekday-integrated {
        color: #f7fafc;
        border-color: #4a5568;
    }

    .calendar-day-integrated {
        background-color: #2d3748;
        border-color: #4a5568;
        color: #f7fafc;
    }

    .calendar-day-integrated:hover {
        background-color: #4a5568;
    }

    .event-item-integrated {
        background-color: #2d3748;
        border-color: #4a5568;
        color: #f7fafc;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', integratedCalendarStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si existe el contenedor del calendario
    if (document.getElementById('integratedCalendar') ||
        document.getElementById('monthViewContainer') ||
        document.querySelector('[data-calendar="integrated"]')) {

        window.calendar = new IntegratedCalendarManager();
        console.log('✅ Calendario integrado inicializado automáticamente');
    }
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegratedCalendarManager;
}