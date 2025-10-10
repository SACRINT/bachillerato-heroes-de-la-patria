/**
 * 👨‍👩‍👧‍👦 SISTEMA DE COMUNICACIÓN PADRES-DOCENTES - FASE B
 * Plataforma completa de mensajería, citas y seguimiento académico
 * Integración completa con backend API
 */

class ParentTeacherCommunicationSystem {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.authToken = null;
        this.conversations = [];
        this.appointments = [];
        this.reports = [];
        this.currentConversation = null;
        this.socket = null;

        this.config = {
            apiBase: '/api/parent-teacher',
            refreshInterval: 30000,
            messagesPaginationLimit: 50,
            autoMarkAsRead: true,
            enableNotifications: true
        };

        this.init();
    }

    async init() {
        try {
            await this.loadUserAuth();
            await this.setupEventListeners();
            await this.loadInitialData();
            this.setupWebSocket();
            this.setupAutoRefresh();
            console.log('👨‍👩‍👧‍👦 Sistema de comunicación inicializado');
        } catch (error) {
            console.error('Error inicializando sistema de comunicación:', error);
            this.showAlert('Error cargando sistema de comunicación', 'error');
        }
    }

    // ============================================
    // AUTENTICACIÓN Y CONFIGURACIÓN
    // ============================================

    async loadUserAuth() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('userData');

        if (token && user) {
            this.authToken = token;
            this.currentUser = JSON.parse(user);
            this.userRole = this.currentUser.rol || 'estudiante';
        }

        this.requestHeaders = {
            'Content-Type': 'application/json',
            ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        };
    }

    async loadInitialData() {
        if (!this.authToken) {
            console.warn('Usuario no autenticado para comunicación');
            return;
        }

        try {
            await Promise.all([
                this.loadConversations(),
                this.loadAppointments(),
                this.loadReports(),
                this.loadStats()
            ]);

            this.renderDashboard();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showAlert('Error cargando datos', 'warning');
        }
    }

    // ============================================
    // GESTIÓN DE CONVERSACIONES
    // ============================================

    async loadConversations() {
        try {
            const response = await fetch(`${this.config.apiBase}/conversations`, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.conversations = result.data.conversations || [];

            console.log(`✅ Cargadas ${this.conversations.length} conversaciones`);
            return this.conversations;
        } catch (error) {
            console.error('Error cargando conversaciones:', error);
            this.conversations = [];
            throw error;
        }
    }

    async createConversation(data) {
        try {
            const response = await fetch(`${this.config.apiBase}/conversations`, {
                method: 'POST',
                headers: this.requestHeaders,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error creando conversación');
            }

            const result = await response.json();
            const newConversation = result.data;

            this.conversations.unshift(newConversation);
            this.renderConversationsList();
            this.showAlert('Conversación iniciada correctamente', 'success');

            return newConversation;
        } catch (error) {
            console.error('Error creando conversación:', error);
            this.showAlert(error.message, 'error');
            throw error;
        }
    }

    async sendMessage(conversationId, content, recipientId, recipientType) {
        try {
            const messageData = {
                conversation_id: conversationId,
                content: content.trim(),
                recipient_id: recipientId,
                recipient_type: recipientType
            };

            const response = await fetch(`${this.config.apiBase}/messages`, {
                method: 'POST',
                headers: this.requestHeaders,
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error enviando mensaje');
            }

            const result = await response.json();
            const newMessage = result.data;

            // Actualizar conversación actual si aplica
            if (conversationId === this.currentConversation?.id) {
                this.addMessageToCurrentConversation(newMessage);
            }

            // Actualizar lista de conversaciones
            await this.loadConversations();
            this.renderConversationsList();

            return newMessage;
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            this.showAlert(error.message || 'Error enviando mensaje', 'error');
            throw error;
        }
    }

    async loadConversationMessages(conversationId) {
        try {
            const response = await fetch(
                `${this.config.apiBase}/conversations/${conversationId}/messages?limit=${this.config.messagesPaginationLimit}`,
                { headers: this.requestHeaders }
            );

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return result.data.messages || [];
        } catch (error) {
            console.error('Error cargando mensajes:', error);
            this.showAlert('Error cargando mensajes', 'error');
            return [];
        }
    }

    // ============================================
    // GESTIÓN DE CITAS
    // ============================================

    async loadAppointments() {
        try {
            const response = await fetch(`${this.config.apiBase}/appointments`, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.appointments = result.data.appointments || [];

            console.log(`✅ Cargadas ${this.appointments.length} citas`);
            return this.appointments;
        } catch (error) {
            console.error('Error cargando citas:', error);
            this.appointments = [];
            throw error;
        }
    }

    async scheduleAppointment(appointmentData) {
        try {
            const response = await fetch(`${this.config.apiBase}/appointments`, {
                method: 'POST',
                headers: this.requestHeaders,
                body: JSON.stringify(appointmentData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error programando cita');
            }

            const result = await response.json();
            const newAppointment = result.data;

            this.appointments.unshift(newAppointment);
            this.renderAppointmentsList();
            this.showAlert('Cita programada correctamente', 'success');

            return newAppointment;
        } catch (error) {
            console.error('Error programando cita:', error);
            this.showAlert(error.message, 'error');
            throw error;
        }
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
            return;
        }

        try {
            const response = await fetch(`${this.config.apiBase}/appointments/${appointmentId}/cancel`, {
                method: 'POST',
                headers: this.requestHeaders
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error cancelando cita');
            }

            await this.loadAppointments();
            this.renderAppointmentsList();
            this.showAlert('Cita cancelada correctamente', 'success');
        } catch (error) {
            console.error('Error cancelando cita:', error);
            this.showAlert(error.message, 'error');
        }
    }

    // ============================================
    // GESTIÓN DE REPORTES ACADÉMICOS
    // ============================================

    async loadReports() {
        try {
            const response = await fetch(`${this.config.apiBase}/reports`, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.reports = result.data.reports || [];

            console.log(`✅ Cargados ${this.reports.length} reportes`);
            return this.reports;
        } catch (error) {
            console.error('Error cargando reportes:', error);
            this.reports = [];
            throw error;
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.config.apiBase}/stats`, {
                headers: this.requestHeaders
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.stats = result.data;
            return this.stats;
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            this.stats = {
                total_conversations: 0,
                active_conversations: 0,
                unread_messages: 0,
                upcoming_appointments: 0
            };
        }
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    setupEventListeners() {
        // Navegación entre secciones
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]')) {
                e.preventDefault();
                this.showSection(e.target.dataset.section);
            }

            if (e.target.matches('[data-conversation-id]')) {
                e.preventDefault();
                this.openConversation(e.target.dataset.conversationId);
            }

            if (e.target.matches('[data-action="new-conversation"]')) {
                e.preventDefault();
                this.showNewConversationModal();
            }

            if (e.target.matches('[data-action="new-appointment"]')) {
                e.preventDefault();
                this.showNewAppointmentModal();
            }

            if (e.target.matches('[data-action="cancel-appointment"]')) {
                e.preventDefault();
                this.cancelAppointment(e.target.dataset.appointmentId);
            }
        });

        // Envío de mensajes
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#messageForm')) {
                e.preventDefault();
                this.handleMessageSubmit(e.target);
            }

            if (e.target.matches('#newConversationForm')) {
                e.preventDefault();
                this.handleNewConversationSubmit(e.target);
            }

            if (e.target.matches('#newAppointmentForm')) {
                e.preventDefault();
                this.handleNewAppointmentSubmit(e.target);
            }
        });

        // Tecla Enter para enviar mensajes
        document.addEventListener('keydown', (e) => {
            if (e.target.matches('#messageInput') && e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.target.closest('form');
                if (form) {
                    this.handleMessageSubmit(form);
                }
            }
        });
    }

    renderDashboard() {
        const container = document.getElementById('communicationDashboard');
        if (!container) return;

        const html = `
            <div class="communication-system">
                <!-- Header con navegación -->
                <div class="communication-header">
                    <nav class="nav nav-pills">
                        <button class="nav-link active" data-section="conversations">
                            <i class="fas fa-comments me-2"></i>Conversaciones
                            ${this.stats?.unread_messages > 0 ? `<span class="badge bg-danger ms-2">${this.stats.unread_messages}</span>` : ''}
                        </button>
                        <button class="nav-link" data-section="appointments">
                            <i class="fas fa-calendar-check me-2"></i>Citas
                            ${this.stats?.upcoming_appointments > 0 ? `<span class="badge bg-warning text-dark ms-2">${this.stats.upcoming_appointments}</span>` : ''}
                        </button>
                        <button class="nav-link" data-section="reports">
                            <i class="fas fa-chart-line me-2"></i>Reportes
                        </button>
                        <button class="nav-link" data-section="stats">
                            <i class="fas fa-tachometer-alt me-2"></i>Resumen
                        </button>
                    </nav>

                    <div class="communication-actions">
                        <button class="btn btn-primary me-2" data-action="new-conversation">
                            <i class="fas fa-plus me-1"></i>Nueva Conversación
                        </button>
                        <button class="btn btn-outline-primary" data-action="new-appointment">
                            <i class="fas fa-calendar-plus me-1"></i>Agendar Cita
                        </button>
                    </div>
                </div>

                <!-- Contenido principal -->
                <div class="communication-content">
                    <div id="conversationsSection" class="section-content active">
                        ${this.renderConversationsSection()}
                    </div>

                    <div id="appointmentsSection" class="section-content">
                        ${this.renderAppointmentsSection()}
                    </div>

                    <div id="reportsSection" class="section-content">
                        ${this.renderReportsSection()}
                    </div>

                    <div id="statsSection" class="section-content">
                        ${this.renderStatsSection()}
                    </div>
                </div>
            </div>

            <!-- Modales -->
            ${this.renderModals()}
        `;

        container.innerHTML = html;
        this.bindEventHandlers();
    }

    renderConversationsSection() {
        return `
            <div class="row">
                <div class="col-lg-4">
                    <div class="conversations-list">
                        <h5 class="mb-3">Conversaciones</h5>
                        ${this.renderConversationsList()}
                    </div>
                </div>
                <div class="col-lg-8">
                    <div class="conversation-view">
                        ${this.currentConversation ? this.renderConversationView() : this.renderEmptyConversationView()}
                    </div>
                </div>
            </div>
        `;
    }

    renderConversationsList() {
        if (this.conversations.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay conversaciones</p>
                    <button class="btn btn-primary" data-action="new-conversation">
                        <i class="fas fa-plus me-1"></i>Iniciar Conversación
                    </button>
                </div>
            `;
        }

        return `
            <div class="list-group">
                ${this.conversations.map(conv => `
                    <div class="list-group-item list-group-item-action conversation-item ${conv.id === this.currentConversation?.id ? 'active' : ''}"
                         data-conversation-id="${conv.id}">
                        <div class="d-flex w-100 justify-content-between align-items-start">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${this.getConversationTitle(conv)}</h6>
                                <p class="mb-1 text-muted small">${conv.subject}</p>
                                ${conv.last_message ? `
                                    <small class="text-muted">
                                        ${conv.last_message.sender_type === 'parent' ? 'Padre:' : 'Docente:'}
                                        ${conv.last_message.content.substring(0, 50)}...
                                    </small>
                                ` : ''}
                            </div>
                            <div class="text-end">
                                ${conv.last_message ? `
                                    <small class="text-muted">
                                        ${this.formatDate(conv.last_message.timestamp)}
                                    </small>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderConversationView() {
        return `
            <div class="conversation-header bg-light p-3 border-bottom">
                <h5 class="mb-0">${this.getConversationTitle(this.currentConversation)}</h5>
                <small class="text-muted">${this.currentConversation.subject}</small>
            </div>

            <div class="messages-container" id="messagesContainer">
                <div class="messages-list p-3" id="messagesList">
                    <div class="text-center py-3">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p class="text-muted mt-2">Cargando mensajes...</p>
                    </div>
                </div>
            </div>

            <div class="message-input border-top p-3">
                <form id="messageForm">
                    <div class="input-group">
                        <textarea class="form-control" id="messageInput"
                                  placeholder="Escribe tu mensaje..." rows="2" required></textarea>
                        <button class="btn btn-primary" type="submit">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    renderEmptyConversationView() {
        return `
            <div class="text-center py-5">
                <i class="fas fa-comment-dots fa-4x text-muted mb-4"></i>
                <h4 class="text-muted">Selecciona una conversación</h4>
                <p class="text-muted">Elige una conversación de la lista para ver los mensajes</p>
            </div>
        `;
    }

    renderAppointmentsSection() {
        if (this.appointments.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-times fa-4x text-muted mb-4"></i>
                    <h4 class="text-muted">No tienes citas programadas</h4>
                    <p class="text-muted">Agenda una cita con un docente para hablar sobre el progreso académico</p>
                    <button class="btn btn-primary" data-action="new-appointment">
                        <i class="fas fa-calendar-plus me-1"></i>Agendar Primera Cita
                    </button>
                </div>
            `;
        }

        return `
            <div class="appointments-container">
                <h5 class="mb-4">Mis Citas</h5>
                <div class="row">
                    ${this.appointments.map(appointment => `
                        <div class="col-md-6 col-lg-4 mb-4">
                            <div class="card appointment-card ${appointment.status === 'cancelled' ? 'border-danger' : appointment.status === 'completed' ? 'border-success' : ''}">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-start mb-3">
                                        <h6 class="card-title mb-0">${appointment.teacher_name}</h6>
                                        <span class="badge bg-${this.getAppointmentStatusColor(appointment.status)}">
                                            ${this.getAppointmentStatusLabel(appointment.status)}
                                        </span>
                                    </div>

                                    <div class="appointment-details">
                                        <p class="mb-2"><strong>Estudiante:</strong> ${appointment.student_name}</p>
                                        <p class="mb-2"><strong>Materia:</strong> ${appointment.subject}</p>
                                        <p class="mb-2">
                                            <i class="fas fa-calendar me-2 text-primary"></i>
                                            ${this.formatDateTime(appointment.appointment_date)}
                                        </p>
                                        <p class="mb-2">
                                            <i class="fas fa-clock me-2 text-primary"></i>
                                            ${appointment.duration_minutes} minutos
                                        </p>
                                        <p class="mb-2">
                                            <i class="fas fa-${appointment.meeting_type === 'virtual' ? 'video' : 'map-marker-alt'} me-2 text-primary"></i>
                                            ${appointment.meeting_type === 'virtual' ? 'Virtual' : 'Presencial'}
                                        </p>

                                        ${appointment.agenda ? `
                                            <div class="mt-3">
                                                <strong>Agenda:</strong>
                                                <p class="small text-muted">${appointment.agenda}</p>
                                            </div>
                                        ` : ''}

                                        ${appointment.meeting_link && appointment.meeting_type === 'virtual' ? `
                                            <div class="mt-3">
                                                <a href="${appointment.meeting_link}" target="_blank" class="btn btn-sm btn-outline-primary">
                                                    <i class="fas fa-video me-1"></i>Unirse a la reunión
                                                </a>
                                            </div>
                                        ` : ''}

                                        ${appointment.status === 'scheduled' ? `
                                            <div class="mt-3">
                                                <button class="btn btn-sm btn-outline-danger"
                                                        data-action="cancel-appointment"
                                                        data-appointment-id="${appointment.id}">
                                                    <i class="fas fa-times me-1"></i>Cancelar
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderReportsSection() {
        if (this.reports.length === 0) {
            return `
                <div class="text-center py-5">
                    <i class="fas fa-file-alt fa-4x text-muted mb-4"></i>
                    <h4 class="text-muted">No hay reportes disponibles</h4>
                    <p class="text-muted">Los reportes académicos aparecerán aquí cuando los docentes los compartan</p>
                </div>
            `;
        }

        return `
            <div class="reports-container">
                <h5 class="mb-4">Reportes Académicos</h5>
                <div class="row">
                    ${this.reports.map(report => `
                        <div class="col-lg-6 mb-4">
                            <div class="card report-card">
                                <div class="card-header d-flex justify-content-between align-items-center">
                                    <h6 class="mb-0">${report.subject} - ${report.period}</h6>
                                    <span class="badge bg-info">${report.report_type}</span>
                                </div>
                                <div class="card-body">
                                    <p><strong>Estudiante:</strong> ${report.student_name}</p>
                                    <p><strong>Docente:</strong> ${report.teacher_name}</p>
                                    <p><strong>Fecha:</strong> ${this.formatDate(report.created_at)}</p>

                                    ${typeof report.content === 'object' ? `
                                        <div class="report-content">
                                            ${report.content.current_grade ? `<p><strong>Calificación actual:</strong> ${report.content.current_grade}</p>` : ''}
                                            ${report.content.attendance ? `<p><strong>Asistencia:</strong> ${report.content.attendance}</p>` : ''}
                                            ${report.content.behavior ? `<p><strong>Comportamiento:</strong> ${report.content.behavior}</p>` : ''}

                                            ${report.content.strengths && report.content.strengths.length > 0 ? `
                                                <div class="mb-3">
                                                    <strong>Fortalezas:</strong>
                                                    <ul class="small">
                                                        ${report.content.strengths.map(strength => `<li>${strength}</li>`).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}

                                            ${report.content.areas_improvement && report.content.areas_improvement.length > 0 ? `
                                                <div class="mb-3">
                                                    <strong>Áreas de mejora:</strong>
                                                    <ul class="small">
                                                        ${report.content.areas_improvement.map(area => `<li>${area}</li>`).join('')}
                                                    </ul>
                                                </div>
                                            ` : ''}

                                            ${report.content.recommendations ? `
                                                <div class="mb-3">
                                                    <strong>Recomendaciones:</strong>
                                                    <p class="small text-muted">${report.content.recommendations}</p>
                                                </div>
                                            ` : ''}
                                        </div>
                                    ` : `
                                        <div class="report-content">
                                            <p>${report.content}</p>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderStatsSection() {
        return `
            <div class="stats-container">
                <h5 class="mb-4">Resumen de Comunicación</h5>

                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center stats-card">
                            <div class="card-body">
                                <i class="fas fa-comments fa-2x text-primary mb-3"></i>
                                <h4 class="card-title">${this.stats?.total_conversations || 0}</h4>
                                <p class="card-text">Conversaciones Totales</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center stats-card">
                            <div class="card-body">
                                <i class="fas fa-envelope fa-2x text-warning mb-3"></i>
                                <h4 class="card-title">${this.stats?.unread_messages || 0}</h4>
                                <p class="card-text">Mensajes Sin Leer</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center stats-card">
                            <div class="card-body">
                                <i class="fas fa-calendar-check fa-2x text-success mb-3"></i>
                                <h4 class="card-title">${this.stats?.upcoming_appointments || 0}</h4>
                                <p class="card-text">Próximas Citas</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center stats-card">
                            <div class="card-body">
                                <i class="fas fa-chart-line fa-2x text-info mb-3"></i>
                                <h4 class="card-title">${this.reports?.length || 0}</h4>
                                <p class="card-text">Reportes Disponibles</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Conversaciones Recientes</h6>
                            </div>
                            <div class="card-body">
                                ${this.conversations.slice(0, 5).map(conv => `
                                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                        <div>
                                            <strong>${this.getConversationTitle(conv)}</strong>
                                            <br>
                                            <small class="text-muted">${conv.subject}</small>
                                        </div>
                                        <small class="text-muted">
                                            ${conv.last_message ? this.formatDate(conv.last_message.timestamp) : 'Sin mensajes'}
                                        </small>
                                    </div>
                                `).join('') || '<p class="text-muted">No hay conversaciones</p>'}
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Próximas Citas</h6>
                            </div>
                            <div class="card-body">
                                ${this.appointments.filter(apt => apt.status === 'scheduled').slice(0, 3).map(apt => `
                                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                        <div>
                                            <strong>${apt.teacher_name}</strong>
                                            <br>
                                            <small class="text-muted">${apt.subject}</small>
                                        </div>
                                        <small class="text-muted">
                                            ${this.formatDateTime(apt.appointment_date)}
                                        </small>
                                    </div>
                                `).join('') || '<p class="text-muted">No hay citas programadas</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderModals() {
        return `
            <!-- Modal Nueva Conversación -->
            <div class="modal fade" id="newConversationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Nueva Conversación</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="newConversationForm">
                            <div class="modal-body">
                                <div class="mb-3">
                                    <label class="form-label">Estudiante</label>
                                    <select class="form-select" name="student_id" required>
                                        <option value="">Seleccionar estudiante</option>
                                        <option value="est-001">Juan Pérez García</option>
                                        <option value="est-002">María López Sánchez</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Docente</label>
                                    <select class="form-select" name="teacher_id" required>
                                        <option value="">Seleccionar docente</option>
                                        <option value="prof-001">Prof. Ana López - Matemáticas</option>
                                        <option value="prof-002">Prof. Carlos Ruiz - Español</option>
                                        <option value="prof-003">Prof. Elena Martín - Ciencias</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Materia</label>
                                    <input type="text" class="form-control" name="subject" placeholder="Ej: Matemáticas, General">
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Iniciar Conversación</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Modal Nueva Cita -->
            <div class="modal fade" id="newAppointmentModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Agendar Nueva Cita</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form id="newAppointmentForm">
                            <div class="modal-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Estudiante</label>
                                            <select class="form-select" name="student_id" required>
                                                <option value="">Seleccionar estudiante</option>
                                                <option value="est-001">Juan Pérez García</option>
                                                <option value="est-002">María López Sánchez</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label class="form-label">Docente</label>
                                            <select class="form-select" name="teacher_id" required>
                                                <option value="">Seleccionar docente</option>
                                                <option value="prof-001">Prof. Ana López - Matemáticas</option>
                                                <option value="prof-002">Prof. Carlos Ruiz - Español</option>
                                                <option value="prof-003">Prof. Elena Martín - Ciencias</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-8">
                                        <div class="mb-3">
                                            <label class="form-label">Fecha y Hora</label>
                                            <input type="datetime-local" class="form-control" name="appointment_date" required>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="mb-3">
                                            <label class="form-label">Duración (minutos)</label>
                                            <select class="form-select" name="duration_minutes">
                                                <option value="30">30 minutos</option>
                                                <option value="45">45 minutos</option>
                                                <option value="60">60 minutos</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Tipo de Reunión</label>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="meeting_type" value="virtual" checked>
                                                <label class="form-check-label">
                                                    <i class="fas fa-video me-2"></i>Virtual (Google Meet)
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-check">
                                                <input class="form-check-input" type="radio" name="meeting_type" value="presencial">
                                                <label class="form-check-label">
                                                    <i class="fas fa-map-marker-alt me-2"></i>Presencial
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Agenda de la Reunión</label>
                                    <textarea class="form-control" name="agenda" rows="3"
                                              placeholder="Describe los temas que te gustaría tratar..."></textarea>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-primary">Agendar Cita</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    bindEventHandlers() {
        // Los event listeners ya están configurados en setupEventListeners()
        // Aquí podríamos agregar listeners específicos para elementos dinámicos
    }

    async handleMessageSubmit(form) {
        if (!this.currentConversation) return;

        const messageInput = form.querySelector('#messageInput');
        const content = messageInput.value.trim();

        if (!content) return;

        // Determinar destinatario basado en el rol del usuario
        let recipientId, recipientType;
        if (this.userRole === 'parent') {
            recipientId = this.currentConversation.teacher_id;
            recipientType = 'teacher';
        } else if (this.userRole === 'teacher') {
            recipientId = this.currentConversation.parent_id;
            recipientType = 'parent';
        }

        try {
            messageInput.disabled = true;
            await this.sendMessage(this.currentConversation.id, content, recipientId, recipientType);
            messageInput.value = '';
        } catch (error) {
            // Error ya manejado en sendMessage
        } finally {
            messageInput.disabled = false;
            messageInput.focus();
        }
    }

    async handleNewConversationSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await this.createConversation(data);
            bootstrap.Modal.getInstance(document.getElementById('newConversationModal')).hide();
            form.reset();
        } catch (error) {
            // Error ya manejado en createConversation
        }
    }

    async handleNewAppointmentSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            await this.scheduleAppointment(data);
            bootstrap.Modal.getInstance(document.getElementById('newAppointmentModal')).hide();
            form.reset();
        } catch (error) {
            // Error ya manejado en scheduleAppointment
        }
    }

    showSection(sectionName) {
        // Actualizar navegación
        document.querySelectorAll('.communication-header .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Mostrar sección
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}Section`).classList.add('active');
    }

    async openConversation(conversationId) {
        try {
            this.currentConversation = this.conversations.find(c => c.id === conversationId);

            if (!this.currentConversation) return;

            // Actualizar vista de conversación
            const conversationView = document.querySelector('.conversation-view');
            if (conversationView) {
                conversationView.innerHTML = this.renderConversationView();
            }

            // Cargar mensajes
            const messages = await this.loadConversationMessages(conversationId);
            this.renderMessages(messages);

            // Actualizar lista de conversaciones (marcar como activa)
            this.renderConversationsList();

        } catch (error) {
            console.error('Error abriendo conversación:', error);
        }
    }

    renderMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">No hay mensajes aún. ¡Inicia la conversación!</p>
                </div>
            `;
            return;
        }

        const messagesHtml = messages.reverse().map(msg => `
            <div class="message ${msg.sender_type === this.userRole ? 'message-sent' : 'message-received'}">
                <div class="message-content">
                    <div class="message-header">
                        <strong>${msg.sender_name}</strong>
                        <small class="text-muted ms-2">${this.formatDateTime(msg.timestamp)}</small>
                    </div>
                    <div class="message-text">${msg.content}</div>
                </div>
            </div>
        `).join('');

        messagesList.innerHTML = messagesHtml;
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    addMessageToCurrentConversation(message) {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        const messageHtml = `
            <div class="message ${message.sender_type === this.userRole ? 'message-sent' : 'message-received'}">
                <div class="message-content">
                    <div class="message-header">
                        <strong>${message.sender_name}</strong>
                        <small class="text-muted ms-2">${this.formatDateTime(message.timestamp)}</small>
                    </div>
                    <div class="message-text">${message.content}</div>
                </div>
            </div>
        `;

        messagesList.insertAdjacentHTML('beforeend', messageHtml);
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    showNewConversationModal() {
        const modal = new bootstrap.Modal(document.getElementById('newConversationModal'));
        modal.show();
    }

    showNewAppointmentModal() {
        const modal = new bootstrap.Modal(document.getElementById('newAppointmentModal'));

        // Establecer fecha mínima como mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);

        const dateInput = document.querySelector('#newAppointmentModal input[name="appointment_date"]');
        if (dateInput) {
            dateInput.min = tomorrow.toISOString().slice(0, 16);
            dateInput.value = tomorrow.toISOString().slice(0, 16);
        }

        modal.show();
    }

    // ============================================
    // UTILIDADES
    // ============================================

    getConversationTitle(conversation) {
        if (this.userRole === 'parent') {
            return `${conversation.teacher_name} - ${conversation.student_name}`;
        } else {
            return `${conversation.parent_name} - ${conversation.student_name}`;
        }
    }

    getAppointmentStatusColor(status) {
        const colors = {
            'scheduled': 'primary',
            'completed': 'success',
            'cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }

    getAppointmentStatusLabel(status) {
        const labels = {
            'scheduled': 'Programada',
            'completed': 'Completada',
            'cancelled': 'Cancelada'
        };
        return labels[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString) {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ============================================
    // WEBSOCKET Y AUTO-REFRESH
    // ============================================

    setupWebSocket() {
        try {
            // Placeholder para WebSocket
            console.log('WebSocket configuración pendiente');
        } catch (error) {
            console.log('WebSocket no disponible:', error.message);
        }
    }

    setupAutoRefresh() {
        setInterval(async () => {
            try {
                await this.loadStats();
                // Solo actualizar conversaciones si no hay una conversación activa
                if (!this.currentConversation) {
                    await this.loadConversations();
                    this.renderConversationsList();
                }
            } catch (error) {
                console.warn('Auto-refresh falló:', error.message);
            }
        }, this.config.refreshInterval);
    }

    showAlert(message, type = 'info') {
        const alertId = `alert-${Date.now()}`;
        const alertDiv = document.createElement('div');
        alertDiv.id = alertId;
        alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1070; max-width: 400px;';
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
}

// Estilos CSS específicos
const communicationStyles = `
<style>
.communication-system {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    overflow: hidden;
}

.communication-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 1.5rem;
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    flex-wrap: wrap;
    gap: 1rem;
}

.communication-header .nav-pills .nav-link {
    color: rgba(255,255,255,0.8);
    border: 1px solid rgba(255,255,255,0.3);
    margin-right: 0.5rem;
}

.communication-header .nav-pills .nav-link.active {
    background-color: rgba(255,255,255,0.2);
    color: white;
    border-color: rgba(255,255,255,0.5);
}

.communication-content {
    padding: 2rem;
}

.section-content {
    display: none;
}

.section-content.active {
    display: block;
}

.conversation-item {
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    border-bottom: 1px solid #eee;
}

.conversation-item:hover {
    background-color: #f8f9fa;
    transform: translateX(5px);
}

.conversation-item.active {
    background-color: #e3f2fd;
    border-left: 4px solid #1976d2;
}

.conversation-view {
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    overflow: hidden;
    height: 600px;
    display: flex;
    flex-direction: column;
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    background: #f8f9fa;
}

.message {
    margin-bottom: 1rem;
}

.message-sent {
    text-align: right;
}

.message-sent .message-content {
    display: inline-block;
    max-width: 70%;
    background: #1976d2;
    color: white;
    padding: 0.75rem;
    border-radius: 1rem 1rem 0.25rem 1rem;
}

.message-received .message-content {
    display: inline-block;
    max-width: 70%;
    background: white;
    border: 1px solid #dee2e6;
    padding: 0.75rem;
    border-radius: 1rem 1rem 1rem 0.25rem;
}

.message-header {
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}

.message-text {
    line-height: 1.5;
}

.appointment-card {
    transition: all 0.2s ease;
    height: 100%;
}

.appointment-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stats-card {
    transition: all 0.2s ease;
}

.stats-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.report-card {
    height: 100%;
}

@media (max-width: 768px) {
    .communication-header {
        flex-direction: column;
        align-items: stretch;
    }

    .communication-header .nav {
        margin-bottom: 1rem;
    }

    .conversation-view {
        height: 500px;
    }

    .message-content {
        max-width: 85% !important;
    }
}
</style>
`;

// Inyectar estilos
document.head.insertAdjacentHTML('beforeend', communicationStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('communicationDashboard') ||
        document.querySelector('[data-communication="parent-teacher"]')) {
        window.parentTeacherCommunication = new ParentTeacherCommunicationSystem();
    }
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParentTeacherCommunicationSystem;
}