// Calendario Escolar Interactivo - BGE Héroes de la Patria
class InteractiveCalendar {
    constructor() {
        this.currentDate = new Date();
        this.currentView = 'month';
        this.eventFilter = '';
        this.events = [];
        this.reminders = this.loadReminders();
        
        this.initializeCalendar();
    }
    
    async initializeCalendar() {
        // Cargar eventos de forma asíncrona
        this.events = await this.loadEvents();
        this.renderCalendar();
        this.setupEventListeners();
        this.updateCurrentMonthDisplay();
    }

    async loadEvents() {
        // Cargar eventos desde el archivo JSON de la PWA
        try {
            const response = await fetch('data/eventos_calendario_pwa.json');
            const pwaEvents = await response.json();
            
            // Convertir eventos PWA al formato del calendario
            const convertedEvents = pwaEvents.map(event => ({
                id: event.id,
                title: event.title,
                date: event.start.split('T')[0], // Extraer solo la fecha
                endDate: event.end ? event.end.split('T')[0] : event.start.split('T')[0],
                type: this.mapCategoryToType(event.category),
                description: `${event.title}${event.location ? ` - ${event.location}` : ''}${event.attendees ? ` | Participantes: ${event.attendees.join(', ')}` : ''}`,
                color: this.mapColorFromPWA(event.bgColor),
                important: event.state === 'Confirmado'
            }));
            
            // Combinar con eventos estáticos existentes (si los hay)
            const staticEvents = [
            // Eventos académicos
            {
                id: 'inicio-clases',
                title: 'Inicio de Clases',
                date: '2024-08-26',
                endDate: '2024-08-26',
                type: 'academic',
                description: 'Comienzo oficial del ciclo escolar 2024-2025. Horario: 7:00 AM - 2:00 PM',
                color: 'info',
                important: true
            },
            {
                id: 'fin-ciclo',
                title: 'Fin del Ciclo Escolar',
                date: '2025-07-11',
                endDate: '2025-07-11',
                type: 'academic',
                description: 'Último día de clases del ciclo escolar 2024-2025',
                color: 'success',
                important: true
            },

            // Evaluaciones
            {
                id: 'evaluaciones-1er-parcial',
                title: '1er Período de Evaluaciones',
                date: '2024-09-30',
                endDate: '2024-10-04',
                type: 'evaluation',
                description: 'Primera ronda de exámenes parciales. Favor de revisar horarios específicos.',
                color: 'warning',
                important: true
            },
            {
                id: 'resultados-1er-parcial',
                title: 'Entrega de Resultados 1er Parcial',
                date: '2024-10-11',
                endDate: '2024-10-11',
                type: 'academic',
                description: 'Publicación de calificaciones del primer período',
                color: 'info'
            },
            {
                id: 'evaluaciones-2do-parcial',
                title: '2do Período de Evaluaciones',
                date: '2024-11-25',
                endDate: '2024-11-29',
                type: 'evaluation',
                description: 'Segunda ronda de exámenes parciales',
                color: 'warning',
                important: true
            },
            {
                id: 'resultados-2do-parcial',
                title: 'Entrega de Resultados 2do Parcial',
                date: '2024-12-06',
                endDate: '2024-12-06',
                type: 'academic',
                description: 'Publicación de calificaciones del segundo período',
                color: 'info'
            },
            {
                id: 'evaluaciones-3er-parcial',
                title: '3er Período de Evaluaciones',
                date: '2025-02-24',
                endDate: '2025-02-28',
                type: 'evaluation',
                description: 'Tercera ronda de exámenes parciales',
                color: 'warning',
                important: true
            },
            {
                id: 'resultados-3er-parcial',
                title: 'Entrega de Resultados 3er Parcial',
                date: '2025-03-07',
                endDate: '2025-03-07',
                type: 'academic',
                description: 'Publicación de calificaciones del tercer período',
                color: 'info'
            },

            // Vacaciones y recesos
            {
                id: 'vacaciones-invierno',
                title: 'Vacaciones de Invierno',
                date: '2024-12-23',
                endDate: '2025-01-03',
                type: 'holiday',
                description: '12 días naturales de vacaciones navideñas',
                color: 'success',
                important: true
            },
            {
                id: 'vacaciones-primavera',
                title: 'Vacaciones de Primavera',
                date: '2025-04-14',
                endDate: '2025-04-25',
                type: 'holiday',
                description: '12 días naturales de vacaciones de primavera',
                color: 'success',
                important: true
            },

            // Fechas cívicas
            {
                id: 'independencia',
                title: 'Día de la Independencia',
                date: '2024-09-16',
                endDate: '2024-09-16',
                type: 'civic',
                description: 'Conmemoración del Grito de Independencia - Suspensión de labores',
                color: 'danger',
                important: true
            },
            {
                id: 'revolucion',
                title: 'Día de la Revolución Mexicana',
                date: '2024-11-20',
                endDate: '2024-11-20',
                type: 'civic',
                description: 'Conmemoración de la Revolución Mexicana - Suspensión de labores',
                color: 'danger',
                important: true
            },
            {
                id: 'natalicio-juarez',
                title: 'Natalicio de Benito Juárez',
                date: '2025-03-21',
                endDate: '2025-03-21',
                type: 'civic',
                description: 'Conmemoración del natalicio de Benito Juárez - Suspensión de labores',
                color: 'danger'
            },
            {
                id: 'dia-trabajo',
                title: 'Día del Trabajo',
                date: '2025-05-01',
                endDate: '2025-05-01',
                type: 'civic',
                description: 'Día Internacional del Trabajo - Suspensión de labores',
                color: 'danger'
            },
            {
                id: 'batalla-puebla',
                title: 'Batalla de Puebla',
                date: '2025-05-05',
                endDate: '2025-05-05',
                type: 'civic',
                description: 'Conmemoración de la Batalla de Puebla - Suspensión de labores',
                color: 'danger'
            },

            // Eventos culturales
            {
                id: 'dia-muertos',
                title: 'Día de los Muertos',
                date: '2024-11-02',
                endDate: '2024-11-02',
                type: 'cultural',
                description: 'Celebración tradicional mexicana - Actividades culturales en el plantel',
                color: 'secondary'
            },
            {
                id: 'posadas-navidenas',
                title: 'Posadas Navideñas',
                date: '2024-12-16',
                endDate: '2024-12-20',
                type: 'cultural',
                description: 'Celebración navideña escolar con toda la comunidad estudiantil',
                color: 'secondary'
            },
            {
                id: 'dia-primavera',
                title: 'Festival de Primavera',
                date: '2025-03-20',
                endDate: '2025-03-21',
                type: 'cultural',
                description: 'Festival cultural y artístico de primavera',
                color: 'secondary'
            },

            // Eventos deportivos
            {
                id: 'torneo-futbol',
                title: 'Torneo Intergrupos de Fútbol',
                date: '2024-10-14',
                endDate: '2024-10-25',
                type: 'sports',
                description: 'Competencia deportiva entre grupos del bachillerato',
                color: 'dark'
            },
            {
                id: 'olimpiada-conocimiento',
                title: 'Olimpiada del Conocimiento',
                date: '2025-04-07',
                endDate: '2025-04-11',
                type: 'academic',
                description: 'Competencia académica interescolar',
                color: 'info'
            },
            {
                id: 'graduacion',
                title: 'Ceremonia de Graduación',
                date: '2025-07-15',
                endDate: '2025-07-15',
                type: 'academic',
                description: 'Ceremonia de graduación de la generación 2022-2025',
                color: 'success',
                important: true
            }
        ];
            
            // Combinar eventos PWA con eventos estáticos
            return [...convertedEvents, ...staticEvents];
            
        } catch (error) {
            console.warn('Error cargando eventos PWA, usando eventos estáticos:', error);
            // Fallback a eventos estáticos si falla la carga
            return staticEvents;
        }
    }
    
    // Mapear categorías PWA a tipos de calendario
    mapCategoryToType(category) {
        const mapping = {
            'time': 'academic',
            'allday': 'holiday',
            'milestone': 'evaluation',
            'task': 'cultural'
        };
        return mapping[category] || 'academic';
    }
    
    // Mapear colores PWA a colores Bootstrap
    mapColorFromPWA(bgColor) {
        const colorMapping = {
            '#D32F2F': 'danger',
            '#1976D2': 'primary', 
            '#FFC107': 'warning',
            '#388E3C': 'success',
            '#FF5722': 'danger',
            '#9C27B0': 'secondary',
            '#607D8B': 'secondary'
        };
        return colorMapping[bgColor] || 'info';
    }

    loadReminders() {
        const stored = localStorage.getItem('calendar_reminders');
        return stored ? JSON.parse(stored) : {
            evaluations: true,
            holidays: true,
            events: true,
            civic: false,
            anticipation: 3
        };
    }

    saveReminders() {
        localStorage.setItem('calendar_reminders', JSON.stringify(this.reminders));
    }

    setupEventListeners() {
        // Navegación de meses
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateCurrentMonthDisplay();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateCurrentMonthDisplay();
        });

        // Cambio de vista
        document.getElementById('monthViewBtn').addEventListener('click', () => {
            this.switchView('month');
        });

        document.getElementById('listViewBtn').addEventListener('click', () => {
            this.switchView('list');
        });

        // Filtros
        document.getElementById('eventFilter').addEventListener('change', (e) => {
            this.eventFilter = e.target.value;
            if (this.currentView === 'month') {
                this.renderCalendar();
            } else {
                this.renderEventsList();
            }
        });
    }

    updateCurrentMonthDisplay() {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const monthYear = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        document.getElementById('currentMonthYear').textContent = monthYear;
    }

    switchView(view) {
        this.currentView = view;
        
        // Actualizar botones
        document.getElementById('monthViewBtn').classList.toggle('active', view === 'month');
        document.getElementById('monthViewBtn').classList.toggle('btn-primary', view === 'month');
        document.getElementById('monthViewBtn').classList.toggle('btn-outline-primary', view !== 'month');
        
        document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
        document.getElementById('listViewBtn').classList.toggle('btn-primary', view === 'list');
        document.getElementById('listViewBtn').classList.toggle('btn-outline-primary', view !== 'list');

        // Mostrar/ocultar vistas
        document.getElementById('calendarView').classList.toggle('d-none', view !== 'month');
        document.getElementById('listView').classList.toggle('d-none', view !== 'list');

        // Renderizar contenido
        if (view === 'month') {
            this.renderCalendar();
        } else {
            this.renderEventsList();
        }
    }

    renderCalendar() {
        const calendarContainer = document.getElementById('interactiveCalendar');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Primer día del mes y último día
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const today = new Date();
        
        // Días para mostrar (incluyendo días del mes anterior/posterior)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        let calendarHTML = `
            <div class="calendar-grid">
                <div class="calendar-header">
                    <div class="weekday">Dom</div>
                    <div class="weekday">Lun</div>
                    <div class="weekday">Mar</div>
                    <div class="weekday">Mié</div>
                    <div class="weekday">Jue</div>
                    <div class="weekday">Vie</div>
                    <div class="weekday">Sáb</div>
                </div>
                <div class="calendar-body">
        `;

        const currentDate = new Date(startDate);
        
        // Generar 6 semanas
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const dayEvents = this.getEventsForDate(currentDate);
                const filteredEvents = this.filterEvents(dayEvents);
                
                let dayClasses = ['calendar-day'];
                if (!isCurrentMonth) dayClasses.push('other-month');
                if (isToday) dayClasses.push('today');
                if (filteredEvents.length > 0) dayClasses.push('has-events');
                
                let eventsHTML = '';
                if (filteredEvents.length > 0 && isCurrentMonth) {
                    const maxShow = 3;
                    filteredEvents.slice(0, maxShow).forEach(event => {
                        const isMultiDay = event.endDate !== event.date;
                        const isStart = currentDate.toISOString().split('T')[0] === event.date;
                        const isEnd = currentDate.toISOString().split('T')[0] === event.endDate;
                        
                        eventsHTML += `
                            <div class="event-indicator bg-${event.color} ${isMultiDay ? 'multi-day' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}" 
                                 data-event-id="${event.id}" 
                                 title="${event.title}"
                                 onclick="calendar.showEventDetails('${event.id}')">
                                ${event.title}
                            </div>
                        `;
                    });
                    
                    if (filteredEvents.length > maxShow) {
                        eventsHTML += `<div class="more-events">+${filteredEvents.length - maxShow} más</div>`;
                    }
                }
                
                calendarHTML += `
                    <div class="${dayClasses.join(' ')}" data-date="${currentDate.toISOString().split('T')[0]}">
                        <div class="day-number">${currentDate.getDate()}</div>
                        <div class="day-events">${eventsHTML}</div>
                    </div>
                `;
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        calendarHTML += '</div></div>';
        calendarContainer.innerHTML = calendarHTML;
    }

    renderEventsList() {
        const listContainer = document.getElementById('eventsList');
        const filteredEvents = this.filterEvents(this.events);
        
        // Agrupar eventos por mes
        const eventsByMonth = {};
        filteredEvents.forEach(event => {
            const eventDate = new Date(event.date);
            const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
            if (!eventsByMonth[monthKey]) {
                eventsByMonth[monthKey] = [];
            }
            eventsByMonth[monthKey].push(event);
        });
        
        // Ordenar por fecha
        Object.keys(eventsByMonth).forEach(monthKey => {
            eventsByMonth[monthKey].sort((a, b) => new Date(a.date) - new Date(b.date));
        });
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        let listHTML = '';
        
        // Generar lista por meses
        Object.keys(eventsByMonth)
            .sort()
            .forEach(monthKey => {
                const [year, month] = monthKey.split('-');
                const monthName = `${monthNames[parseInt(month)]} ${year}`;
                
                listHTML += `
                    <div class="month-section mb-4">
                        <h4 class="month-header bg-light p-3 rounded">${monthName}</h4>
                        <div class="events-list">
                `;
                
                eventsByMonth[monthKey].forEach(event => {
                    const eventDate = new Date(event.date);
                    const endDate = event.endDate ? new Date(event.endDate) : eventDate;
                    const isMultiDay = event.endDate && event.endDate !== event.date;
                    
                    const dateDisplay = isMultiDay 
                        ? `${eventDate.getDate()} - ${endDate.getDate()} ${monthNames[endDate.getMonth()]}`
                        : `${eventDate.getDate()} ${monthNames[eventDate.getMonth()]}`;
                    
                    listHTML += `
                        <div class="event-item card mb-2" onclick="calendar.showEventDetails('${event.id}')">
                            <div class="card-body p-3">
                                <div class="row align-items-center">
                                    <div class="col-2">
                                        <div class="event-date text-center">
                                            <div class="date-number h5 mb-0">${eventDate.getDate()}</div>
                                            <small class="text-muted">${monthNames[eventDate.getMonth()].substring(0, 3)}</small>
                                        </div>
                                    </div>
                                    <div class="col-8">
                                        <h6 class="event-title mb-1">${event.title}</h6>
                                        <p class="event-description mb-0 text-muted small">${event.description}</p>
                                    </div>
                                    <div class="col-2 text-end">
                                        <span class="badge bg-${event.color}">${this.getEventTypeLabel(event.type)}</span>
                                        ${event.important ? '<i class="fas fa-star text-warning ms-2"></i>' : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                listHTML += '</div></div>';
            });
        
        if (filteredEvents.length === 0) {
            listHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay eventos para mostrar</h5>
                    <p class="text-muted">Prueba cambiar el filtro o selecciona un período diferente</p>
                </div>
            `;
        }
        
        listContainer.innerHTML = listHTML;
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            if (event.endDate) {
                // Evento de múltiples días
                return dateStr >= event.date && dateStr <= event.endDate;
            } else {
                // Evento de un solo día
                return event.date === dateStr;
            }
        });
    }

    filterEvents(events) {
        if (!this.eventFilter) return events;
        return events.filter(event => event.type === this.eventFilter);
    }

    getEventTypeLabel(type) {
        const labels = {
            'academic': 'Académico',
            'holiday': 'Vacaciones',
            'evaluation': 'Evaluación',
            'cultural': 'Cultural',
            'sports': 'Deportivo',
            'civic': 'Cívico'
        };
        return labels[type] || 'Evento';
    }

    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        const startDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : startDate;
        const isMultiDay = event.endDate && event.endDate !== event.date;
        
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const formatDate = (date) => {
            return `${date.getDate()} de ${monthNames[date.getMonth()]} de ${date.getFullYear()}`;
        };
        
        const dateDisplay = isMultiDay 
            ? `Del ${formatDate(startDate)} al ${formatDate(endDate)}`
            : formatDate(startDate);
        
        const modalBody = `
            <div class="event-details">
                <div class="event-header mb-3">
                    <span class="badge bg-${event.color} fs-6 mb-2">${this.getEventTypeLabel(event.type)}</span>
                    ${event.important ? '<i class="fas fa-star text-warning ms-2" title="Evento importante"></i>' : ''}
                </div>
                <div class="event-info mb-3">
                    <h6><i class="fas fa-calendar text-primary me-2"></i>Fecha:</h6>
                    <p class="ms-4">${dateDisplay}</p>
                </div>
                <div class="event-description">
                    <h6><i class="fas fa-info-circle text-primary me-2"></i>Descripción:</h6>
                    <p class="ms-4">${event.description}</p>
                </div>
            </div>
        `;
        
        document.getElementById('eventModalBody').innerHTML = modalBody;
        document.getElementById('eventModalLabel').innerHTML = `
            <i class="fas fa-calendar-day me-2"></i>${event.title}
        `;
        
        // Guardar ID del evento actual para otras acciones
        this.currentEventId = eventId;
        
        const modal = new bootstrap.Modal(document.getElementById('eventModal'));
        modal.show();
    }
}

// Funciones globales
function downloadCalendar() {
    // Crear descarga del calendario escolar en PDF
    showAlert('Preparando descarga del calendario escolar...', 'info');

    // Generar PDF con los eventos del calendario
    const printWindow = window.open('', '_blank');
    const calendarContent = generateCalendarPDF();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Calendario Escolar 2024-2025 - BGE Héroes de la Patria</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { color: #1976D2; }
                .month { page-break-before: always; margin-bottom: 40px; }
                .month:first-child { page-break-before: auto; }
                .month-title { font-size: 24px; font-weight: bold; color: #1976D2; margin-bottom: 20px; }
                .events { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px; }
                .event { margin-bottom: 10px; padding: 8px; border-left: 4px solid #1976D2; }
                .event-date { font-weight: bold; color: #333; }
                .event-title { color: #666; margin-left: 10px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #1976D2; color: white; }
                .weekend { background-color: #f8f9fa; }
                .event-day { background-color: #e3f2fd; font-weight: bold; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${calendarContent}
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(() => window.close(), 1000);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();

    setTimeout(() => {
        showAlert('Calendario descargado exitosamente', 'success');
    }, 2000);
}

function generateCalendarPDF() {
    const now = new Date();
    const year = now.getFullYear();
    const schoolYear = `${year}-${year + 1}`;

    let content = `
        <div class="header">
            <h1 class="logo">📚 BGE Héroes de la Patria</h1>
            <h2>Calendario Escolar ${schoolYear}</h2>
            <p>Bachillerato General Estatal</p>
            <hr>
        </div>
    `;

    // Generar 12 meses de calendario
    for (let month = 0; month < 12; month++) {
        const date = new Date(year, month, 1);
        const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const monthEvents = window.calendar ? window.calendar.getEventsForMonth(year, month) : [];

        content += `
            <div class="month">
                <h3 class="month-title">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3>
                ${generateMonthGrid(year, month)}
                ${monthEvents.length > 0 ? `
                    <div class="events">
                        <h4>📅 Eventos del mes:</h4>
                        ${monthEvents.map(event => `
                            <div class="event">
                                <span class="event-date">${formatEventDate(event.date)}</span>
                                <span class="event-title">${event.title}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p><em>No hay eventos programados para este mes</em></p>'}
            </div>
        `;
    }

    return content;
}

function generateMonthGrid(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    let grid = `
        <table>
            <tr>
                <th>Dom</th><th>Lun</th><th>Mar</th><th>Mié</th>
                <th>Jue</th><th>Vie</th><th>Sáb</th>
            </tr>
    `;

    const current = new Date(startDate);
    while (current <= lastDay || current.getDay() !== 0) {
        grid += '<tr>';
        for (let day = 0; day < 7; day++) {
            const isCurrentMonth = current.getMonth() === month;
            const isWeekend = day === 0 || day === 6;
            const hasEvent = window.calendar ? window.calendar.hasEventOnDate(current) : false;

            const cellClass = !isCurrentMonth ? 'text-muted' :
                            isWeekend ? 'weekend' :
                            hasEvent ? 'event-day' : '';

            grid += `<td class="${cellClass}">${current.getDate()}</td>`;
            current.setDate(current.getDate() + 1);
        }
        grid += '</tr>';

        if (current > lastDay && current.getDay() === 0) break;
    }

    grid += '</table>';
    return grid;
}

function formatEventDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function exportToGoogle() {
    showAlert('Generando archivo de Google Calendar...', 'info');

    // Generar archivo .ics para importar a Google Calendar
    const events = window.calendar ? window.calendar.events : [];
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BGE Héroes de la Patria//Calendario Escolar//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Calendario Escolar BGE Héroes de la Patria
X-WR-TIMEZONE:America/Mexico_City
X-WR-CALDESC:Calendario oficial del Bachillerato General Estatal Héroes de la Patria
`;

    events.forEach(event => {
        const startDate = new Date(event.date);
        const endDate = new Date(event.endDate || event.date);

        // Formatear fechas para el archivo ICS
        const formatDateForICS = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icsContent += `
BEGIN:VEVENT
UID:${event.id}@heroesdelapatria.edu.mx
DTSTART:${formatDateForICS(startDate)}
DTEND:${formatDateForICS(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || event.title}
LOCATION:BGE Héroes de la Patria
CATEGORIES:${event.type.toUpperCase()}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT`;
    });

    icsContent += `
END:VCALENDAR`;

    // Crear y descargar el archivo
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'calendario-escolar-bge-heroes.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        showAlert('Archivo .ics generado. Ábrelo con Google Calendar para importar eventos.', 'success');
    }, 1000);
}

function shareCalendar() {
    if (navigator.share) {
        navigator.share({
            title: 'Calendario Escolar BGE Héroes de la Patria',
            text: 'Consulta el calendario escolar del ciclo 2024-2025',
            url: window.location.href
        });
    } else {
        // Fallback para navegadores sin Web Share API
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showAlert('Enlace copiado al portapapeles', 'success');
        });
    }
}

function setReminders() {
    const modal = new bootstrap.Modal(document.getElementById('reminderModal'));
    modal.show();
}

function saveReminders() {
    if (!window.calendar) return;
    
    const reminders = {
        evaluations: document.getElementById('remindEvaluations').checked,
        holidays: document.getElementById('remindHolidays').checked,
        events: document.getElementById('remindEvents').checked,
        civic: document.getElementById('remindCivic').checked,
        anticipation: parseInt(document.getElementById('reminderTime').value)
    };
    
    window.calendar.reminders = reminders;
    window.calendar.saveReminders();
    
    showAlert('Recordatorios configurados correctamente', 'success');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('reminderModal'));
    modal.hide();
}

function addToPersonalCalendar() {
    if (!window.calendar || !window.calendar.currentEventId) return;
    
    const event = window.calendar.events.find(e => e.id === window.calendar.currentEventId);
    if (!event) return;
    
    // Crear evento para calendario personal (formato ICS)
    const startDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : startDate;
    
    const formatDateForCalendar = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BGE Héroes de la Patria//Calendario Escolar//ES
BEGIN:VEVENT
UID:${event.id}@heroesdelapatria.edu.mx
DTSTART:${formatDateForCalendar(startDate)}
DTEND:${formatDateForCalendar(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:Bachillerato General Estatal Héroes de la Patria
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('Evento descargado. Ábrelo con tu aplicación de calendario preferida.', 'success');
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

// Estilos CSS adicionales para el calendario
const calendarStyles = `
<style>
.calendar-grid {
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    overflow: hidden;
    background: white;
}

.calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
}

.weekday {
    padding: 1rem 0.5rem;
    text-align: center;
    font-weight: 600;
    font-size: 0.875rem;
    color: #495057;
    border-right: 1px solid #dee2e6;
}

.weekday:last-child {
    border-right: none;
}

.calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
    min-height: 120px;
    padding: 0.5rem;
    border-right: 1px solid #dee2e6;
    border-bottom: 1px solid #dee2e6;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.calendar-day:hover {
    background-color: #f8f9fa;
}

.calendar-day:last-child {
    border-right: none;
}

.calendar-day.other-month {
    color: #adb5bd;
    background-color: #f8f9fa;
}

.calendar-day.today {
    background-color: #e3f2fd;
}

.calendar-day.today .day-number {
    background-color: #1976d2;
    color: white;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.day-number {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.day-events {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.event-indicator {
    font-size: 0.6rem;
    padding: 1px 4px;
    border-radius: 2px;
    color: white;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: opacity 0.2s ease;
}

.event-indicator:hover {
    opacity: 0.8;
}

.event-indicator.multi-day {
    margin-left: -0.5rem;
    margin-right: -0.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border-radius: 0;
}

.event-indicator.multi-day.start {
    border-top-left-radius: 2px;
    border-bottom-left-radius: 2px;
    margin-left: 0;
    padding-left: 4px;
}

.event-indicator.multi-day.end {
    border-top-right-radius: 2px;
    border-bottom-right-radius: 2px;
    margin-right: 0;
    padding-right: 4px;
}

.more-events {
    font-size: 0.6rem;
    color: #6c757d;
    font-weight: 500;
    margin-top: 2px;
}

.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    display: inline-block;
}

.info-card {
    padding: 1.5rem;
    transition: transform 0.3s ease;
}

.info-card:hover {
    transform: translateY(-2px);
}

.info-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.event-item {
    cursor: pointer;
    transition: all 0.2s ease;
}

.event-item:hover {
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.month-header {
    border-left: 4px solid #1976d2;
}

.event-date {
    border-right: 1px solid #dee2e6;
}

@media (max-width: 768px) {
    .calendar-day {
        min-height: 80px;
        padding: 0.25rem;
    }
    
    .day-number {
        font-size: 0.875rem;
    }
    
    .event-indicator {
        font-size: 0.5rem;
        padding: 1px 2px;
    }
    
    .info-icon {
        width: 60px;
        height: 60px;
    }
    
    .calendar-controls {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch !important;
    }
    
    .view-controls {
        margin-left: 0 !important;
        justify-content: center;
    }
}

.dark-mode .calendar-grid {
    background-color: #2d3748;
    border-color: #4a5568;
}

.dark-mode .calendar-header {
    background-color: #4a5568;
    border-color: #4a5568;
}

.dark-mode .weekday {
    color: #f7fafc;
    border-color: #4a5568;
}

.dark-mode .calendar-day {
    border-color: #4a5568;
    color: #f7fafc;
}

.dark-mode .calendar-day:hover {
    background-color: #4a5568;
}

.dark-mode .calendar-day.other-month {
    color: #a0aec0;
    background-color: #2d3748;
}

.dark-mode .calendar-day.today {
    background-color: #2c5282;
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', calendarStyles);

// Inicializar el calendario cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('interactiveCalendar')) {
        window.calendar = new InteractiveCalendar();
    }
});