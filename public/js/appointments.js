// Sistema de citas en línea para Bachillerato window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria')

// Helper para Bootstrap seguro
// NOTA: DOMPurify se asume disponible globalmente desde script anterior
// O usar: const DOMPurify = window.DOMPurify || { sanitize: (str) => str };

// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    // Fallback si debug-logger.js no está cargado
    var debugLog = {
        log: () => { },
        warn: () => { },
        error: () => { }
    };
}


class BootstrapHelper {
    static isAvailable() {
        return typeof bootstrap !== 'undefined' && bootstrap.Modal;
    }

    // ✅ FIX: Función dedicada para limpiar todos los backdrops y restaurar el body
    static cleanupAllModals() {
        // Remover todas las clases modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';

        // Remover TODOS los backdrops (puede haber múltiples)
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());

        // Ocultar todos los modales y remover clase 'show'
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        });
    }

    static showModal(element) {
        try {
            if (this.isAvailable()) {
                const modal = new bootstrap.Modal(element);
                modal.show();
                return modal;
            } else {
                // Fallback sin Bootstrap
                element.style.display = 'block';
                element.classList.add('show');
                document.body.classList.add('modal-open');

                // Crear backdrop manualmente
                const backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop fade show';
                document.body.appendChild(backdrop);

                return {
                    hide: () => this.hideModal(element)
                };
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error mostrando modal:', error);
            // Fallback de emergencia
            element.style.display = 'block';
            return { hide: () => { element.style.display = 'none'; } };
        }
    }

    static hideModal(element) {
        try {
            if (this.isAvailable()) {
                const instance = bootstrap.Modal.getInstance(element);
                if (instance) {
                    instance.hide();
                    // No forzar limpieza automática aquí, dejar que el evento hidden.bs.modal lo maneje
                    // para permitir transiciones entre modales sin cerrar el nuevo.
                } else {
                    // No hay instancia, hacer limpieza manual solo si es seguro
                    this.cleanupAllModals();
                }
            } else {
                // Fallback sin Bootstrap
                element.style.display = 'none';
                element.classList.remove('show');
                this.cleanupAllModals();
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error ocultando modal:', error);
            element.style.display = 'none';
            // Forzar limpieza en caso de error
            this.cleanupAllModals();
        }
    }
}

class AppointmentSystem {
    constructor() {
        this.appointments = this.loadAppointments();
        this.departments = this.getDepartments();
        this.timeSlots = this.generateTimeSlots();
        this.selectedDate = null;
        this.selectedTime = null;
        this.selectedDepartment = null;
        this.isTransitioning = false; // Flag para controlar transiciones entre modales

        // Inicializar sistema de forma segura
        try {
            this.initializeSystem();
        } catch (error) {
            debugLog.error('ERROR', '❌ Error inicializando sistema de citas:', error);
            // Intentar inicialización básica
            setTimeout(() => {
                try {
                    this.renderDepartments();
                } catch (e) {
                    debugLog.error('ERROR', '❌ Error en inicialización de emergencia:', e);
                }
            }, 1000);
        }
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
                maxDaily: 33, // 11 slots * 3
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
                maxDaily: 33, // 11 slots * 3
                schedule: {
                    monday: ['08:00', '13:00'],
                    tuesday: ['08:00', '13:00'],
                    wednesday: ['08:00', '13:00'],
                    thursday: ['08:00', '13:00'],
                    friday: ['08:00', '13:00']
                }
            },
            {
                id: 'direccion',
                name: 'Dirección',
                description: 'Reuniones con el director del plantel',
                icon: 'fas fa-user-tie',
                color: 'warning',
                duration: 45,
                maxDaily: 27, // 9 slots * 3
                schedule: {
                    monday: ['09:00', '13:00'],
                    tuesday: ['09:00', '13:00'],
                    wednesday: ['09:00', '13:00'],
                    thursday: ['09:00', '13:00'],
                    friday: ['09:00', '13:00']
                }
            },
            {
                id: 'becas',
                name: 'Información de Becas',
                description: 'Asesoría sobre becas y apoyos económicos',
                icon: 'fas fa-hand-holding-usd',
                color: 'info',
                duration: 25,
                maxDaily: 27, // 9 slots * 3
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
                maxDaily: 33, // 11 slots * 3
                schedule: {
                    monday: ['08:00', '13:00'],
                    tuesday: ['08:00', '13:00'],
                    wednesday: ['08:00', '13:00'],
                    thursday: ['08:00', '13:00'],
                    friday: ['08:00', '13:00']
                }
            },
            {
                id: 'administracion',
                name: 'Administración',
                description: 'Pagos, becas, asuntos financieros',
                icon: 'fas fa-calculator',
                color: 'warning',
                duration: 15,
                maxDaily: 27, // 9 slots * 3
                schedule: {
                    monday: ['08:30', '12:30'],
                    tuesday: ['08:30', '12:30'],
                    wednesday: ['08:30', '12:30'],
                    thursday: ['08:30', '12:30'],
                    friday: ['08:30', '12:30']
                }
            },
            {
                id: 'trabajo-social',
                name: 'Trabajo Social',
                description: 'Apoyo social, becas, programas de asistencia',
                icon: 'fas fa-hands-helping',
                color: 'dark',
                duration: 30,
                maxDaily: 33, // 11 slots * 3
                schedule: {
                    monday: ['08:00', '13:00'],
                    tuesday: ['08:00', '13:00'],
                    wednesday: ['08:00', '13:00'],
                    thursday: ['08:00', '13:00'],
                    friday: ['08:00', '13:00']
                }
            },
            {
                id: 'nuevo-ingreso',
                name: 'Nuevo Ingreso',
                description: 'Proceso de admisión, requisitos, información',
                icon: 'fas fa-user-plus',
                color: 'danger',
                duration: 40,
                maxDaily: 21, // 7 slots * 3
                schedule: {
                    monday: ['09:00', '12:00'],
                    tuesday: ['09:00', '12:00'],
                    wednesday: ['09:00', '12:00'],
                    thursday: ['09:00', '12:00'],
                    friday: ['09:00', '12:00']
                }
            }
        ];
    }

    generateTimeSlots() {
        const slots = [];
        // Actualizado a las 13 hrs como máximo (incluyendo 13:00)
        for (let hour = 8; hour <= 13; hour++) {
            for (const minute of [0, 30]) {
                // Si es la 13, solo permitimos 13:00, no 13:30
                if (hour === 13 && minute > 0) break;
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

    setupEventListeners() {
        // 1. Delegación para selección de departamento
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-appointment, .dept-selector');
            if (btn) {
                e.preventDefault();
                const deptId = btn.getAttribute('data-department');
                if (deptId) {
                    this.selectedDepartment = deptId;
                    this.showCalendarModal();
                }
            }
        });

        // 2. Formulario de Cita - Manejo exclusivo
        const form = document.getElementById('appointmentForm');
        if (form) {
            // Remover listeners previos clonando el nodo (opcional pero seguro)
            // const newForm = form.cloneNode(true);
            // form.parentNode.replaceChild(newForm, form);
            // form = newForm; 
            // Better: just add listener with stopImmediatePropagation

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                await this.prepareAppointmentData();
            });
        }

        // ✅ FIX: Asegurar limpieza de backdrops cuando CUALQUIER modal se cierra
        const modalsToWatch = ['calendarModal', 'appointmentFormModal', 'confirmationModal'];
        modalsToWatch.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('hidden.bs.modal', () => {
                    // FIX: Si estamos en una transición controlada, NO limpiar nada
                    if (this.isTransitioning) return;

                    // FIX: Solo limpiar backdrops si NO hay otros modales mostrándose
                    const openModals = document.querySelectorAll('.modal.show');
                    if (openModals.length === 0) {
                        setTimeout(() => BootstrapHelper.cleanupAllModals(), 100);
                    }
                });
            }
        });

        // 3. Botón Consultar Cita
        const consultarBtn = document.getElementById('consultarCitaBtn');
        if (consultarBtn) {
            consultarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window.consultarCita === 'function') {
                    window.consultarCita();
                }
            });
        }
    }

    showCalendarModal() {
        const modalEl = document.getElementById('calendarModal');
        if (modalEl && this.selectedDepartment) {
            const dept = this.departments.find(d => d.id === this.selectedDepartment);
            const titleEl = document.getElementById('modalDepartmentName');
            if (titleEl && dept) titleEl.textContent = dept.name;

            // Resetear estado
            this.selectedDate = null;
            this.selectedTime = null;

            // Renderizar calendario actualizado
            this.renderCalendar();

            // Limpiar contenedor de horarios
            const slotsContainer = document.getElementById('timeSlotsContainer');
            if (slotsContainer) slotsContainer.innerHTML = '<p class="text-muted">Primero selecciona una fecha disponible</p>';

            BootstrapHelper.showModal(modalEl);
        }
    }

    showAppointmentForm() {
        const modalEl = document.getElementById('appointmentFormModal');
        if (modalEl && this.selectedDepartment && this.selectedDate && this.selectedTime) {
            // Llenar resumen
            const dept = this.departments.find(d => d.id === this.selectedDepartment);

            const deptEl = document.getElementById('appointmentDept');
            const dateEl = document.getElementById('appointmentDate');
            const timeEl = document.getElementById('appointmentTime');

            if (deptEl) deptEl.textContent = dept ? dept.name : this.selectedDepartment;
            if (dateEl) dateEl.textContent = this.selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            if (timeEl) timeEl.textContent = this.selectedTime;

            // MODO SEGURO: Usar flag global para evitar que el cleanup se active
            this.isTransitioning = true;

            // Ocultar calendario antes de mostrar el form
            const calendarModal = document.getElementById('calendarModal');
            if (calendarModal) BootstrapHelper.hideModal(calendarModal);

            // Mostrar formulario
            // Pequeño delay para asegurar que la animación de cierre no interfiera
            setTimeout(() => {
                BootstrapHelper.showModal(modalEl);

                // Resetear flag después de que el nuevo modal esté seguro
                setTimeout(() => {
                    this.isTransitioning = false;
                }, 500);
            }, 50);
        }
    }

    renderDepartments() {
        const container = document.getElementById('departmentsContainer');
        if (!container) {
            debugLog.warn('APP', '⚠️ Contenedor de departamentos no encontrado. La página puede no estar completamente cargada.');
            return;
        }

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
                        <button class="btn btn-${dept.color} btn-appointment dept-selector" 
                                data-department="${dept.id}"
                                data-action="selectDepartment"
                                data-context="appointment-system">
                            <i class="fas fa-calendar-plus me-2"></i>
                            Agendar Cita
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // ✅ FIX: Permitir data-department en DOMPurify para que los botones funcionen
        container.innerHTML = DOMPurify.sanitize(html, {
            ADD_ATTR: ['data-department', 'data-action', 'data-context', 'data-time']
        });
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

        if (!calendarContainer) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const today = new Date();

        // Actualizar el título del mes
        const monthYear = document.getElementById('currentMonthYear');
        if (monthYear) {
            monthYear.textContent = this.currentMonth.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
        }

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

                // Verificar disponibilidad por horario del departamento
                const hasSchedule = this.isDayAvailable(current);
                const isAvailable = hasSchedule && !isPast && !isWeekend;

                const classes = ['calendar-day'];

                // Lógica de estados estricta para el diseño solicitado
                if (!isCurrentMonth) {
                    classes.push('other-month'); // Gris claro/transparente
                } else if (isPast) {
                    classes.push('day-past'); // Gris (solicitado)
                } else if (isWeekend) {
                    classes.push('day-weekend'); // Gris/Deshabilitado
                } else if (isAvailable) {
                    classes.push('day-available'); // Verde claro (solicitado)
                } else {
                    // Es futuro, es día de semana, pero NO está disponible
                    classes.push('day-unavailable'); // Rojo (solicitado)
                }

                if (isToday) classes.push('today');

                // Selección activa
                if (this.selectedDate && current.toDateString() === this.selectedDate.toDateString()) {
                    classes.push('selected');
                }

                calendarHTML += `
                    <div class="${classes.join(' ')}"
                         data-date="${current.toISOString().split('T')[0]}"
                         ${isAvailable ? 'data-action="selectDate" data-context="calendar-date"' : ''}>
                        <div class="day-number">${current.getDate()}</div>
                    </div>
                `;

                current.setDate(current.getDate() + 1);
            }
        }

        calendarHTML += '</div></div>';
        calendarContainer.innerHTML = DOMPurify.sanitize(calendarHTML);

        // Actualizar el título después de renderizar
        const monthYearAfter = document.getElementById('currentMonthYear');
        if (monthYearAfter) {
            monthYearAfter.textContent = this.currentMonth.toLocaleDateString('es-ES', {
                month: 'long',
                year: 'numeric'
            });
        }

        this.setupCalendarNavigation();

        // 🚀 FETCH: Consultar disponibilidad real del mes
        this.updateCalendarAvailability();
    }

    async updateCalendarAvailability() {
        if (!this.selectedDepartment) return;

        const dept = this.departments.find(d => d.id === this.selectedDepartment);
        if (!dept) return;

        const year = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth() + 1; // 1-based

        try {
            const response = await fetch(`/api/citas-improved/month-availability?year=${year}&month=${month}&departamento=${this.selectedDepartment}`);
            const data = await response.json();

            if (data.success && data.availability) {
                // Iterar disponibilidad y marcar días llenos
                Object.keys(data.availability).forEach(dateStr => {
                    const count = data.availability[dateStr];
                    // Un día está lleno si supera el maxDaily
                    const limit = dept.maxDaily || 10;

                    if (count >= limit) {
                        // Encontrar elemento en el calendario
                        const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
                        if (dayEl && dayEl.classList.contains('day-available')) {
                            dayEl.classList.remove('day-available', 'btn-outline-primary');
                            dayEl.classList.add('day-unavailable');
                            dayEl.removeAttribute('data-action'); // Deshabilitar click
                            dayEl.style.cursor = 'not-allowed';
                            dayEl.title = 'Día completo';

                            // Remover la clase 'day-available' es clave para que no sea verde
                        }
                    }
                });
            }
        } catch (e) {
            console.error('Error fetching calendar availability', e);
        }
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

    async renderAvailableTimeSlots() {
        const container = document.getElementById('timeSlotsContainer');
        if (!container || !this.selectedDate || !this.selectedDepartment) return;

        const dept = this.departments.find(d => d.id === this.selectedDepartment);
        const dateISO = this.selectedDate.toISOString().split('T')[0];

        container.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2 text-muted">Verificando disponibilidad...</p></div>';

        try {
            const response = await fetch(`/api/citas-improved/available-slots?fecha=${dateISO}&departamento=${this.selectedDepartment}`);
            const data = await response.json();

            if (!data.success) {
                container.innerHTML = '<div class="alert alert-warning">No se pudo verificar la disponibilidad. Intenta más tarde.</div>';
                return;
            }

            if (data.horarios.length === 0) {
                container.innerHTML = '<div class="alert alert-warning">No hay horarios disponibles para esta fecha. Por favor selecciona otro día.</div>';
                return;
            }

            // Filtrar horarios según el horario específico del departamento para ese día
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayName = dayNames[this.selectedDate.getDay()];
            const schedule = dept.schedule[dayName];

            let horariosFiltrados = [];

            if (schedule && schedule.length === 2) {
                const [startStr, endStr] = schedule;
                horariosFiltrados = data.horarios.filter(slot => {
                    // Comparación lexicográfica funciona para formato HH:MM
                    return slot.hora >= startStr && slot.hora <= endStr;
                });
            } else {
                // Fallback genérico si no hay horario específico (no debería pasar si está validado)
                horariosFiltrados = data.horarios.filter(slot => {
                    const hour = parseInt(slot.hora.split(':')[0]);
                    return hour <= 13;
                });
            }

            if (horariosFiltrados.length === 0) {
                container.innerHTML = `<div class="alert alert-warning">No hay horarios disponibles dentro del horario de atención (${schedule ? schedule.join(' - ') : 'N/A'}).</div>`;
                return;
            }

            const slotsHTML = horariosFiltrados.map(slot => {
                // Un slot está lleno si no hay disponibles
                const isFull = slot.disponibles === 0;

                // Clases: Si lleno 'btn-outline-secondary disabled...', Si libre 'btn-outline-primary'
                const btnClass = isFull
                    ? 'btn-outline-secondary disabled time-slot-disabled'
                    : 'btn-outline-primary time-slot';

                const disabledAttr = isFull ? 'disabled' : '';
                const action = isFull ? '' : `data-action="selectTimeSlot-${slot.hora}"`;

                // Estilo explícito para asegurar Gris vs Azul/Verde
                const style = isFull
                    ? 'background-color: #f1f5f9; border-color: #e2e8f0; color: #94a3b8; cursor: not-allowed;'
                    : '';

                return `
                <button type="button" class="btn ${btnClass} me-2 mb-2"
                        data-time="${slot.hora}"
                        ${action} data-context="time-slots" ${disabledAttr}
                        style="${style}">
                    ${slot.hora}
                </button>
            `}).join('');

            container.innerHTML = DOMPurify.sanitize(`
                <h6 class="mb-3">Horarios disponibles:</h6>
                <div class="time-slots-grid">${slotsHTML}</div>
            `);

        } catch (error) {
            console.error('Error fetching slots:', error);
            container.innerHTML = '<div class="alert alert-danger">Error de conexión. Intenta nuevamente.</div>';
        }
    }

    // Método auxiliar eliminado: getAvailableSlots, timeToMinutes, minutesToTime, isSlotBooked 
    // (Ya no son necesarios porque el backend maneja la lógica)

    selectTimeSlot(time) {
        // Limpiar selección anterior
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Seleccionar nuevo horario
        // Buscamos el botón por su atributo data-time en lugar de usar el evento global inseguro
        const target = document.querySelector(`.time-slot[data-time="${time}"]`);

        if (target) {
            target.classList.add('selected');
            this.selectedTime = time;
            // Mostrar formulario de datos
            this.showAppointmentForm();
        } else {
            debugLog.warn('APP', '⚠️ No se encontró el elemento del horario seleccionado:', time);
        }
    }

    async prepareAppointmentData() {
        const form = document.getElementById('appointmentForm');
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : 'Confirmar';

        // Validaciones básicas
        if (!formData.get('nombre') || !formData.get('email') || !formData.get('telefono') || !formData.get('reason')) {
            // showAlert es global en main.js o similar
            if (typeof showAlert === 'function') {
                showAlert('Por favor completa todos los campos obligatorios', 'warning');
            } else {
                alert('Por favor completa todos los campos obligatorios');
            }
            return false;
        }

        const dept = this.departments.find(d => d.id === this.selectedDepartment);
        const dateISO = this.selectedDate.toISOString().split('T')[0];

        // Preparar payload para /api/citas-improved/create
        const appointmentData = {
            nombre_completo: formData.get('nombre'),
            email: formData.get('email'),
            telefono: formData.get('telefono'),
            tipo_persona: 'externo', // Default, podría venir del form si se agrega campo
            motivo: formData.get('reason'), // Mapeado a 'motivo'
            descripcion: null,
            fecha_solicitada: dateISO,
            hora_solicitada: this.selectedTime,
            departamento: this.selectedDepartment
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Agendando...';
        }

        try {
            // Usar el nuevo endpoint "Real"
            const response = await fetch('/api/citas-improved/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            const result = await response.json();

            if (result.success) {
                // Guardar para mostrar la confirmación (usando datos retornados si existen, o locales)
                window._pendingAppointment = {
                    id: result.cita ? result.cita.id : 'CITA-PENDING', // ID real del backend
                    department: this.selectedDepartment,
                    date: dateISO,
                    time: this.selectedTime,
                    name: appointmentData.nombre_completo,
                    email: appointmentData.email,
                    phone: appointmentData.telefono
                };

                this.finalizeAppointment();
            } else {
                // ✅ FIX: Cerrar TODOS los modales y limpiar backdrops ANTES de mostrar error
                BootstrapHelper.cleanupAllModals();

                // Pequeño delay para permitir que la limpieza visual se complete
                setTimeout(() => {
                    if (typeof showAlert === 'function') {
                        showAlert(result.message || 'Error al agendar la cita. Por favor intenta de nuevo.', 'error');
                    } else {
                        alert(result.message || 'Error al agendar la cita.');
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error sending appointment:', error);

            // ✅ FIX: Cerrar TODOS los modales y limpiar backdrops ANTES de mostrar error
            BootstrapHelper.cleanupAllModals();

            // Pequeño delay para permitir que la limpieza visual se complete
            setTimeout(() => {
                if (typeof showAlert === 'function') {
                    showAlert('Error de conexión. Por favor verifica tu internet e intenta de nuevo.', 'error');
                } else {
                    alert('Error de conexión.');
                }
            }, 100);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(originalText) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(originalText) : originalText));
            }
        }

        // Retornar false para prevenir sumbit tradicional del form HTML si lo hubiera
        return false;
    }

    finalizeAppointment() {
        const appointment = window._pendingAppointment;
        if (!appointment) return;

        // Actualizar estado
        appointment.status = 'confirmed';

        // Guardar cita en localStorage
        this.appointments.push(appointment);
        this.saveAppointments();

        // Mostrar confirmación
        this.showConfirmation(appointment);

        // Cerrar modales de forma segura
        try {
            const appointmentModal = document.getElementById('appointmentFormModal');
            const calendarModal = document.getElementById('calendarModal');

            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                const appointmentModalInstance = bootstrap.Modal.getInstance(appointmentModal);
                const calendarModalInstance = bootstrap.Modal.getInstance(calendarModal);

                if (appointmentModalInstance) appointmentModalInstance.hide();
                if (calendarModalInstance) calendarModalInstance.hide();
            } else {
                // Fallback para cerrar modales sin Bootstrap
                if (appointmentModal) appointmentModal.style.display = 'none';
                if (calendarModal) calendarModal.style.display = 'none';

                // Remover backdrop si existe
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());

                // Restaurar scroll del body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        } catch (error) {
            debugLog.warn('ERROR', '⚠️ Error cerrando modales:', error);
            // Forzar cierre de modales
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
                modal.classList.remove('show');
            });

            // Limpiar backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());

            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }

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
                            <button type="button" class="btn btn-success" data-action="downloadConfirmation-${appointment.id}" data-context="appointment-confirmation">
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
        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(DOMPurify.sanitize(confirmationHTML)));
        const modal = BootstrapHelper.showModal(document.getElementById('confirmationModal'));

        // Remover modal al cerrar
        document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', function () {
            this.remove();
            setTimeout(() => BootstrapHelper.cleanupAllModals(), 100);
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
        alertDiv.innerHTML = DOMPurify.sanitize(`
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

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

    // Función para obtener todas las citas (para administradores)
    getAllAppointments() {
        return this.appointments;
    }

    // Función para obtener estadísticas de citas
    getAppointmentStats() {
        const total = this.appointments.length;
        const today = new Date().toDateString();
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

        const todayCitas = this.appointments.filter(apt =>
            new Date(apt.date).toDateString() === today
        ).length;

        const tomorrowCitas = this.appointments.filter(apt =>
            new Date(apt.date).toDateString() === tomorrow
        ).length;

        const byDepartment = {};
        this.appointments.forEach(apt => {
            byDepartment[apt.department] = (byDepartment[apt.department] || 0) + 1;
        });

        return {
            total,
            today: todayCitas,
            tomorrow: tomorrowCitas,
            byDepartment
        };
    }

    // Función para ver todas las citas en formato tabla
    showAllAppointments() {
        const appointments = this.getAllAppointments();
        if (appointments.length === 0) {
            alert('No hay citas programadas en el sistema.');
            return;
        }

        // Crear ventana de visualización
        let html = `
            <div class="modal fade" id="appointmentsViewModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-alt me-2"></i>
                                Todas las Citas Programadas (${appointments.length})
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <input type="text" class="form-control" id="searchAppointments" placeholder="Buscar por nombre, email o departamento...">
                                </div>
                                <div class="col-md-6">
                                    <select class="form-select" id="filterDepartment">
                                        <option value="">Todos los departamentos</option>
                                        ${this.departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="table-responsive">
                                <table class="table table-striped table-hover" id="appointmentsTable">
                                    <thead class="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>Fecha</th>
                                            <th>Hora</th>
                                            <th>Departamento</th>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Teléfono</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody id="appointmentsTableBody">
                                        ${this.generateAppointmentsTableRows(appointments)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" data-action="exportAppointments" data-context="admin-exports">
                                <i class="fas fa-download me-1"></i>Exportar CSV
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Añadir modal al DOM si no existe
        let existingModal = document.getElementById('appointmentsViewModal');
        if (existingModal) {
            existingModal.remove();
        }
        document.body.insertAdjacentHTML('beforeend', DOMPurify.sanitize(DOMPurify.sanitize(html)));

        // Mostrar modal
        const modal = BootstrapHelper.showModal(document.getElementById('appointmentsViewModal'));

        // Configurar búsqueda y filtros
        this.setupAppointmentsSearch();
    }

    generateAppointmentsTableRows(appointments) {
        return appointments.map(apt => {
            const dept = this.departments.find(d => d.id === apt.department);
            const status = this.getAppointmentStatus(apt);
            const statusClass = status.includes('Completada') ? 'success' :
                status.includes('Hoy') ? 'warning' : 'primary';

            return `
                <tr>
                    <td><code>${apt.id}</code></td>
                    <td>${this.formatDate(apt.date)}</td>
                    <td>${apt.time}</td>
                    <td><span class="badge bg-${dept?.color || 'secondary'}">${dept?.name || apt.department}</span></td>
                    <td>${apt.fullName}</td>
                    <td><a href="mailto:${apt.email}">${apt.email}</a></td>
                    <td><a href="tel:${apt.phone}">${apt.phone}</a></td>
                    <td><span class="badge bg-${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" data-action="viewAppointmentDetails-${apt.id}" data-context="appointment-actions">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-action="cancelAppointment-${apt.id}" data-context="appointment-actions">
                            <i class="fas fa-times"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getAppointmentStatus(appointment) {
        const aptDate = new Date(appointment.date);
        const today = new Date();
        const todayStr = today.toDateString();

        if (aptDate.toDateString() === todayStr) {
            return 'Hoy';
        } else if (aptDate < today) {
            return 'Completada';
        } else {
            return 'Programada';
        }
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    setupAppointmentsSearch() {
        const searchInput = document.getElementById('searchAppointments');
        const filterSelect = document.getElementById('filterDepartment');

        const filterAppointments = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const selectedDept = filterSelect.value;

            let filteredAppointments = this.appointments;

            if (searchTerm) {
                filteredAppointments = filteredAppointments.filter(apt =>
                    apt.fullName.toLowerCase().includes(searchTerm) ||
                    apt.email.toLowerCase().includes(searchTerm) ||
                    apt.department.toLowerCase().includes(searchTerm)
                );
            }

            if (selectedDept) {
                filteredAppointments = filteredAppointments.filter(apt =>
                    apt.department === selectedDept
                );
            }

            document.getElementById('appointmentsTableBody').innerHTML =
                (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(this.generateAppointmentsTableRows(filteredAppointments)) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(this.generateAppointmentsTableRows(filteredAppointments)) : this.generateAppointmentsTableRows(filteredAppointments)));
        };

        searchInput.addEventListener('input', filterAppointments);
        filterSelect.addEventListener('change', filterAppointments);
    }

    viewAppointmentDetails(appointmentId) {
        const appointment = this.appointments.find(apt => apt.id === appointmentId);
        if (!appointment) return;

        const dept = this.departments.find(d => d.id === appointment.department);

        alert(`Detalles de la Cita:

ID: ${appointment.id}
Fecha: ${this.formatDate(appointment.date)}
Hora: ${appointment.time}
Duración: ${appointment.duration} minutos
Departamento: ${dept?.name || appointment.department}
Nombre: ${appointment.fullName}
Email: ${appointment.email}
Teléfono: ${appointment.phone}
Motivo: ${appointment.reason || 'No especificado'}
Estado: ${this.getAppointmentStatus(appointment)}
        `);
    }

    cancelAppointment(appointmentId) {
        if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) return;

        this.appointments = this.appointments.filter(apt => apt.id !== appointmentId);
        this.saveAppointments();

        // Actualizar tabla
        if (document.getElementById('appointmentsViewModal')) {
            document.getElementById('appointmentsTableBody').innerHTML =
                (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(this.generateAppointmentsTableRows(this.appointments)) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(this.generateAppointmentsTableRows(this.appointments)) : this.generateAppointmentsTableRows(this.appointments)));
        }

        alert('Cita cancelada exitosamente.');
    }

    exportAppointments() {
        if (this.appointments.length === 0) {
            alert('No hay citas para exportar.');
            return;
        }

        const csv = this.appointmentsToCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `citas_bge_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    appointmentsToCSV() {
        const headers = ['ID', 'Fecha', 'Hora', 'Departamento', 'Nombre', 'Email', 'Teléfono', 'Motivo', 'Estado'];
        const rows = this.appointments.map(apt => {
            const dept = this.departments.find(d => d.id === apt.department);
            return [
                apt.id,
                apt.date,
                apt.time,
                dept?.name || apt.department,
                apt.fullName,
                apt.email,
                apt.phone,
                apt.reason || '',
                this.getAppointmentStatus(apt)
            ];
        });

        return [headers, ...rows].map(row =>
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
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

// Función global para seleccionar departamento
function selectDepartment(departmentId) {
    if (!window.appointmentSystem) {
        window.appointmentSystem = new AppointmentSystem();
    }

    // Mapeo solo para los 3 botones que no funcionan
    const mapping = {
        'administracion': 'direccion',
        'trabajo-social': 'servicios',
        'nuevo-ingreso': 'inscripciones'
    };

    const finalId = mapping[departmentId] || departmentId;
    window.appointmentSystem.selectedDepartment = finalId;
    window.appointmentSystem.showCalendarModal();
}

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', DOMPurify.sanitize(DOMPurify.sanitize(appointmentStyles)));

// Inicializar el sistema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar si existe el contenedor dinámico O los botones estáticos de citas.html
    const hasDynamicContainer = document.getElementById('departmentsContainer');
    const hasStaticButtons = document.querySelectorAll('.dept-selector[data-action="selectDepartment"]').length > 0;
    const hasCitasSection = document.getElementById('departamentos-servicios');

    if (hasDynamicContainer || hasStaticButtons || hasCitasSection) {
        
        window.appointmentSystem = new AppointmentSystem();
        
    }
});

// ============================================
// EVENT DELEGATION HANDLER (CSP Compliant)
// Pattern B: onclick con parámetros → data-action
// ============================================
document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    // PREVENIR COMPORTAMIENTO POR DEFECTO DEL BROWSER PARA EVITAR RELOADS
    e.preventDefault();

    const action = actionElement.getAttribute('data-action');
    const context = actionElement.getAttribute('data-context') || 'appointment-system';

    try {
        // Pattern B: Acciones del sistema de citas
        if (action === 'selectDepartment') {
            const deptId = actionElement.getAttribute('data-department');
            if (window.appointmentSystem && deptId) {
                
                window.appointmentSystem.selectedDepartment = deptId;
                window.appointmentSystem.showCalendarModal();
            } else {
                console.error('[APPOINTMENTS] System not ready or invalid department');
            }
            return;
        }

        if (action === 'selectDate') {
            if (window.appointmentSystem && typeof window.appointmentSystem.selectDate === 'function') {
                window.appointmentSystem.selectDate(actionElement);
            }
            return;
        }

        if (action.startsWith('selectTimeSlot-')) {
            const slot = action.replace('selectTimeSlot-', '');
            if (window.appointmentSystem && typeof window.appointmentSystem.selectTimeSlot === 'function') {
                window.appointmentSystem.selectTimeSlot(slot);
            }
            return;
        }

        if (action.startsWith('downloadConfirmation-')) {
            const appointmentId = action.replace('downloadConfirmation-', '');
            if (window.appointmentSystem && typeof window.appointmentSystem.downloadConfirmation === 'function') {
                window.appointmentSystem.downloadConfirmation(appointmentId);
            }
            return;
        }

        if (action === 'exportAppointments') {
            if (window.appointmentSystem && typeof window.appointmentSystem.exportAppointments === 'function') {
                window.appointmentSystem.exportAppointments();
            }
            return;
        }

        if (action.startsWith('viewAppointmentDetails-')) {
            const appointmentId = action.replace('viewAppointmentDetails-', '');
            if (window.appointmentSystem && typeof window.appointmentSystem.viewAppointmentDetails === 'function') {
                window.appointmentSystem.viewAppointmentDetails(appointmentId);
            }
            return;
        }

        if (action.startsWith('cancelAppointment-')) {
            const appointmentId = action.replace('cancelAppointment-', '');
            if (window.appointmentSystem && typeof window.appointmentSystem.cancelAppointment === 'function') {
                window.appointmentSystem.cancelAppointment(appointmentId);
            }
            return;
        }

        debugLog.warn('APPOINTMENT-SYSTEM', '[APPOINTMENT-SYSTEM] Unhandled data-action:', action);
    } catch (error) {
        debugLog.error('APPOINTMENT-SYSTEM', '[APPOINTMENT-SYSTEM] Error handling action:', action, error);
    }
});