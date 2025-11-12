/**
 * EVENT CALENDAR - Calendario Interactivo de Eventos con FullCalendar
 * Sistema de visualización de eventos en formato calendario
 * Fecha: 18 de Octubre, 2025
 */

class EventCalendar {
    constructor(containerId) {
        this.containerId = containerId;
        this.calendar = null;
        this.currentFilters = {
            categoria: 'todas',
            modalidad: 'todas'
        };
    }

    /**
     * Inicializar el calendario
     */
    async init() {
        try {
            // Verificar que FullCalendar esté cargado
            if (typeof FullCalendar === 'undefined') {
                console.error('❌ FullCalendar no está cargado');
                return;
            }

            const calendarEl = document.getElementById(this.containerId);
            if (!calendarEl) {
                console.error(`❌ Contenedor ${this.containerId} no encontrado`);
                return;
            }

            // Configuración del calendario
            this.calendar = new FullCalendar.Calendar(calendarEl, {
                // Configuración básica
                initialView: 'dayGridMonth',
                locale: 'es',
                timeZone: 'America/Mexico_City',
                headerToolbar: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
                },
                buttonText: {
                    today: 'Hoy',
                    month: 'Mes',
                    week: 'Semana',
                    day: 'Día',
                    list: 'Lista'
                },

                // Altura del calendario
                height: 'auto',
                contentHeight: 600,

                // Configuración de eventos
                events: (info, successCallback, failureCallback) => {
                    this.fetchEvents(info, successCallback, failureCallback);
                },

                // Configuración de diseño
                dayMaxEvents: 3,
                navLinks: true,
                editable: false,
                selectable: true,
                selectMirror: true,
                weekends: true,
                nowIndicator: true,

                // Callbacks
                eventClick: (info) => this.handleEventClick(info),
                select: (info) => this.handleDateSelect(info),
                eventMouseEnter: (info) => this.handleEventHover(info),
                eventMouseLeave: (info) => this.handleEventLeave(info),

                // Configuración de día
                slotMinTime: '07:00:00',
                slotMaxTime: '22:00:00',
                allDaySlot: true,

                // Configuración de vista de lista
                listDayFormat: {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                },

                // Configuración de tooltips
                eventDidMount: (info) => {
                    this.addEventTooltip(info);
                }
            });

            this.calendar.render();
            console.log('✅ Calendario inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar calendario:', error);
        }
    }

    /**
     * Obtener eventos del servidor
     */
    async fetchEvents(info, successCallback, failureCallback) {
        try {
            const params = new URLSearchParams({
                start: info.startStr,
                end: info.endStr,
                categoria: this.currentFilters.categoria,
                modalidad: this.currentFilters.modalidad
            });

            const response = await fetch(`/api/calendar/events?${params}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            successCallback(data.events);
            console.log(`✅ ${data.events.length} eventos cargados`);
        } catch (error) {
            console.error('❌ Error al cargar eventos:', error);
            failureCallback(error);
        }
    }

    /**
     * Manejar click en evento
     */
    handleEventClick(info) {
        const event = info.event;
        const props = event.extendedProps;

        // Crear modal con detalles del evento
        const modalContent = `
            <div class="modal fade" id="eventDetailModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" style="background-color: ${event.backgroundColor}">
                            <h5 class="modal-title text-white">
                                <i class="fas fa-calendar-alt me-2"></i>${event.title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-muted mb-3">
                                        <i class="fas fa-info-circle me-2"></i>Información General
                                    </h6>
                                    <p><strong>Fecha Inicio:</strong> ${this.formatDate(event.start)}</p>
                                    <p><strong>Fecha Fin:</strong> ${event.end ? this.formatDate(event.end) : 'N/A'}</p>
                                    <p><strong>Categoría:</strong> <span class="badge bg-primary">${props.categoria || 'N/A'}</span></p>
                                    <p><strong>Modalidad:</strong> <span class="badge bg-info">${props.modalidad || 'N/A'}</span></p>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-muted mb-3">
                                        <i class="fas fa-map-marker-alt me-2"></i>Ubicación e Inscripciones
                                    </h6>
                                    <p><strong>Ubicación:</strong> ${props.ubicacion || 'Por definir'}</p>
                                    <p><strong>Cupo Máximo:</strong> ${props.cupoMaximo || 'Ilimitado'}</p>
                                    <p><strong>Inscritos:</strong> ${props.inscripciones || 0}/${props.cupoMaximo || '∞'}</p>
                                    ${props.destacado ? '<p><span class="badge bg-warning"><i class="fas fa-star me-1"></i>Destacado</span></p>' : ''}
                                </div>
                            </div>
                            ${props.description ? `
                                <div class="mt-3">
                                    <h6 class="text-muted">
                                        <i class="fas fa-align-left me-2"></i>Descripción
                                    </h6>
                                    <p>${props.description}</p>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="window.location.href='/eventos/${props.slug}'">
                                <i class="fas fa-eye me-2"></i>Ver Detalles Completos
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal anterior si existe
        const existingModal = document.getElementById('eventDetailModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar nuevo modal
        document.body.insertAdjacentHTML('beforeend', sanitizeHTML(modalContent));

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('eventDetailModal'));
        modal.show();

        // Limpiar cuando se cierre
        document.getElementById('eventDetailModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }

    /**
     * Manejar selección de fecha
     */
    handleDateSelect(info) {
        console.log('📅 Fecha seleccionada:', info.startStr, '-', info.endStr);
        // Aquí podrías agregar funcionalidad para crear eventos si es admin
    }

    /**
     * Agregar tooltip a evento
     */
    addEventTooltip(info) {
        const event = info.event;
        const props = event.extendedProps;

        // Crear tooltip con Bootstrap
        const tooltipContent = `
            <strong>${event.title}</strong><br>
            📅 ${this.formatDate(event.start)}<br>
            📍 ${props.ubicacion || 'Por definir'}<br>
            👥 ${props.inscripciones || 0}/${props.cupoMaximo || '∞'} inscritos
        `;

        // Usar Bootstrap tooltip
        const tooltip = new bootstrap.Tooltip(info.el, {
            title: tooltipContent,
            html: true,
            placement: 'top',
            trigger: 'hover',
            container: 'body'
        });
    }

    /**
     * Hover sobre evento
     */
    handleEventHover(info) {
        info.el.style.cursor = 'pointer';
        info.el.style.transform = 'scale(1.05)';
        info.el.style.transition = 'transform 0.2s';
    }

    /**
     * Leave de evento
     */
    handleEventLeave(info) {
        info.el.style.transform = 'scale(1)';
    }

    /**
     * Aplicar filtros
     */
    applyFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.calendar.refetchEvents();
        console.log('🔄 Filtros aplicados:', this.currentFilters);
    }

    /**
     * Cambiar vista del calendario
     */
    changeView(viewName) {
        this.calendar.changeView(viewName);
        console.log('👁️ Vista cambiada a:', viewName);
    }

    /**
     * Ir a fecha específica
     */
    goToDate(date) {
        this.calendar.gotoDate(date);
        console.log('📍 Navegando a fecha:', date);
    }

    /**
     * Ir a hoy
     */
    goToToday() {
        this.calendar.today();
        console.log('📅 Navegando a hoy');
    }

    /**
     * Actualizar eventos
     */
    refetch() {
        this.calendar.refetchEvents();
        console.log('🔄 Eventos actualizados');
    }

    /**
     * Formatear fecha
     */
    formatDate(date) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString('es-MX', options);
    }

    /**
     * Destruir calendario
     */
    destroy() {
        if (this.calendar) {
            this.calendar.destroy();
            this.calendar = null;
            console.log('🗑️ Calendario destruido');
        }
    }
}

// Variable global para el calendario
let globalEventCalendar = null;

// Inicializar cuando el DOM esté listo (solo si el contenedor existe)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const calendarContainer = document.getElementById('eventCalendarContainer');
        if (calendarContainer) {
            // Esperar a que FullCalendar se cargue
            const checkFullCalendar = setInterval(() => {
                if (typeof FullCalendar !== 'undefined') {
                    clearInterval(checkFullCalendar);
                    globalEventCalendar = new EventCalendar('eventCalendarContainer');
                    globalEventCalendar.init();
                }
            }, 100);

            // Timeout de 10 segundos
            setTimeout(() => clearInterval(checkFullCalendar), 10000);
        }
    });
} else {
    const calendarContainer = document.getElementById('eventCalendarContainer');
    if (calendarContainer && typeof FullCalendar !== 'undefined') {
        globalEventCalendar = new EventCalendar('eventCalendarContainer');
        globalEventCalendar.init();
    }
}
