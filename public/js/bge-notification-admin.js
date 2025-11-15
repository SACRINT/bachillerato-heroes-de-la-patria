/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🔔 PANEL DE ADMINISTRACIÓN DE NOTIFICACIONES BGE
 * Bachillerato General Estatal "Héroes de la Patria"
 *
 * Panel completo para que administradores envíen:
 * - Comunicados oficiales
 * - Recordatorios académicos
 * - Alertas de emergencia
 * - Notificaciones programadas
 */

import DOMPurify from 'isomorphic-dompurify';

class BGENotificationAdmin {
    constructor() {
        this.currentUser = null;
        this.notificationHistory = [];
        this.scheduledNotifications = [];
        this.recipients = {
            students: [],
            parents: [],
            teachers: [],
            all: []
        };

        debugLog.log('APP', '🔧 Iniciando Panel de Administración de Notificaciones BGE');
        this.init();
    }

    async init() {
        await this.loadUserSession();
        await this.loadRecipients();
        await this.loadNotificationHistory();
        this.createAdminInterface();
        this.setupEventListeners();

        debugLog.log('APP', '✅ Panel de administración BGE inicializado');
    }

    async loadUserSession() {
        // Verificar que el usuario tenga permisos de administrador
        const user = JSON.parse(localStorage.getItem('bge_admin_user') || '{}');

        if (!user.email || !user.role || !['admin', 'director', 'coordinador'].includes(user.role)) {
            debugLog.warn('APP', '⚠️ Usuario sin permisos de administración');
            this.showAccessDenied();
            return;
        }

        this.currentUser = user;
        // GDPR: Datos sensibles enmascarados
        debugLog.log('APP', `👤 Usuario admin: ${user.name} (${user.role})`);
    }

    async loadRecipients() {
        // En producción, cargar desde base de datos
        try {
            // Simular carga de base de datos
            this.recipients = {
                students: await this.fetchRecipients('students'),
                parents: await this.fetchRecipients('parents'),
                teachers: await this.fetchRecipients('teachers'),
                all: await this.fetchRecipients('all')
            };

            debugLog.log('APP', '📋 Destinatarios cargados:', {
                estudiantes: this.recipients.students.length,
                padres: this.recipients.parents.length,
                maestros: this.recipients.teachers.length,
                total: this.recipients.all.length
            });

        } catch (error) {
            debugLog.error('ERROR', '❌ Error cargando destinatarios:', error);
            this.recipients = this.getDemoRecipients();
        }
    }

    async fetchRecipients(type) {
        // Simular llamada a API
        return new Promise((resolve) => {
            setTimeout(() => {
                const demoData = this.getDemoRecipients();
                resolve(demoData[type] || []);
            }, 500);
        });
    }

    getDemoRecipients() {
        return {
            students: [
                { id: 1, name: 'Ana García', email: 'ana@estudiante.bge.edu.mx', grade: '1A' },
                { id: 2, name: 'Carlos López', email: 'carlos@estudiante.bge.edu.mx', grade: '2B' },
                { id: 3, name: 'María Rodríguez', email: 'maria@estudiante.bge.edu.mx', grade: '3C' }
            ],
            parents: [
                { id: 1, name: 'Sr. García', email: 'padre.ana@gmail.com', student: 'Ana García' },
                { id: 2, name: 'Sra. López', email: 'madre.carlos@hotmail.com', student: 'Carlos López' }
            ],
            teachers: [
                { id: 1, name: 'Prof. Martínez', email: 'martinez@bge.edu.mx', subject: 'Matemáticas' },
                { id: 2, name: 'Prof. Hernández', email: 'hernandez@bge.edu.mx', subject: 'Historia' }
            ],
            all: []
        };
    }

    loadNotificationHistory() {
        const saved = localStorage.getItem('bge_notification_history');
        if (saved) {
            this.notificationHistory = JSON.parse(saved);
        }
    }

    saveNotificationHistory() {
        localStorage.setItem('bge_notification_history', JSON.stringify(this.notificationHistory));
    }

    createAdminInterface() {
        // Verificar si ya existe la interfaz
        if (document.getElementById('bge-notification-admin')) {
            return;
        }

        const adminPanel = document.createElement('div');
        adminPanel.id = 'bge-notification-admin';
        adminPanel.className = 'notification-admin-panel';

        adminPanel.innerHTML = DOMPurify.sanitize(`
            <div class="admin-header">
                <h2>🔔 Panel de Notificaciones BGE</h2>
                <div class="admin-user-info">
                    <span>👤 ${this.currentUser?.name || 'Administrador'}</span>
                    <span class="role-badge">${this.currentUser?.role || 'admin'}</span>
                </div>
            </div>

            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="compose">📝 Enviar</button>
                <button class="tab-btn" data-tab="scheduled">⏰ Programadas</button>
                <button class="tab-btn" data-tab="history">📊 Historial</button>
                <button class="tab-btn" data-tab="recipients">👥 Destinatarios</button>
                <button class="tab-btn" data-tab="settings">⚙️ Configuración</button>
            </div>

            <div class="admin-content">
                ${this.createComposeTab()}
                ${this.createScheduledTab()}
                ${this.createHistoryTab()}
                ${this.createRecipientsTab()}
                ${this.createSettingsTab()}
            </div>
        `);

        // Agregar estilos
        this.addAdminStyles();

        // Insertar en el DOM
        const targetContainer = document.getElementById('notification-admin-container') || document.body;
        targetContainer.appendChild(adminPanel);

        // Configurar tabs
        this.setupTabs();
    }

    createComposeTab() {
        return `
            <div class="tab-content active" data-tab="compose">
                <div class="compose-section">
                    <div class="notification-type-selector">
                        <h3>Tipo de Notificación</h3>
                        <div class="type-buttons">
                            <button class="type-btn" data-type="COMUNICADO_OFICIAL">📢 Comunicado Oficial</button>
                            <button class="type-btn" data-type="RECORDATORIO_EXAMEN">📝 Recordatorio Examen</button>
                            <button class="type-btn" data-type="EMERGENCIA_ESCOLAR">🚨 Emergencia</button>
                            <button class="type-btn" data-type="EVENTO_PROXIMO">🎉 Evento</button>
                            <button class="type-btn" data-type="INSCRIPCIONES_ABIERTAS">📝 Inscripciones</button>
                            <button class="type-btn" data-type="CALIFICACIONES_DISPONIBLES">📊 Calificaciones</button>
                        </div>
                    </div>

                    <div class="compose-form" id="compose-form">
                        <div class="form-group">
                            <label for="notification-title">Título</label>
                            <input type="text" id="notification-title" class="form-control" placeholder="Título de la notificación">
                        </div>

                        <div class="form-group">
                            <label for="notification-message">Mensaje</label>
                            <textarea id="notification-message" class="form-control" rows="4" placeholder="Contenido del mensaje"></textarea>
                        </div>

                        <div class="form-group">
                            <label for="notification-recipients">Destinatarios</label>
                            <select id="notification-recipients" class="form-control">
                                <option value="all">Todos</option>
                                <option value="students">Solo Estudiantes</option>
                                <option value="parents">Solo Padres</option>
                                <option value="teachers">Solo Maestros</option>
                                <option value="custom">Selección Personalizada</option>
                            </select>
                        </div>

                        <div class="form-group" id="custom-recipients" style="display: none;">
                            <label>Seleccionar Destinatarios</label>
                            <div class="recipients-list">
                                <!-- Se llena dinámicamente -->
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Configuración Adicional</label>
                            <div class="additional-config">
                                <label><input type="checkbox" id="high-priority"> Alta Prioridad</label>
                                <label><input type="checkbox" id="require-interaction"> Requiere Interacción</label>
                                <label><input type="checkbox" id="bypass-quiet-hours"> Ignorar Horarios Silenciosos</label>
                            </div>
                        </div>

                        <div class="form-group schedule-group">
                            <label><input type="checkbox" id="schedule-notification"> Programar Envío</label>
                            <div id="schedule-controls" style="display: none;">
                                <input type="datetime-local" id="schedule-datetime" class="form-control">
                            </div>
                        </div>

                        <div class="form-actions">
                            <button id="send-notification" class="btn btn-primary">📤 Enviar Ahora</button>
                            <button id="preview-notification" class="btn btn-secondary">👁️ Vista Previa</button>
                            <button id="save-draft" class="btn btn-outline-secondary">💾 Guardar Borrador</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createScheduledTab() {
        return `
            <div class="tab-content" data-tab="scheduled">
                <div class="scheduled-section">
                    <div class="section-header">
                        <h3>⏰ Notificaciones Programadas</h3>
                        <button id="add-scheduled" class="btn btn-primary">➕ Nueva Programación</button>
                    </div>
                    <div id="scheduled-list" class="scheduled-list">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    createHistoryTab() {
        return `
            <div class="tab-content" data-tab="history">
                <div class="history-section">
                    <div class="section-header">
                        <h3>📊 Historial de Notificaciones</h3>
                        <div class="history-filters">
                            <select id="history-filter-type" class="form-control">
                                <option value="">Todos los tipos</option>
                                <option value="COMUNICADO_OFICIAL">Comunicados</option>
                                <option value="EMERGENCIA_ESCOLAR">Emergencias</option>
                                <option value="EVENTO_PROXIMO">Eventos</option>
                            </select>
                            <input type="date" id="history-filter-date" class="form-control">
                            <button id="export-history" class="btn btn-secondary">📥 Exportar</button>
                        </div>
                    </div>
                    <div id="history-list" class="history-list">
                        <!-- Se llena dinámicamente -->
                    </div>
                </div>
            </div>
        `;
    }

    createRecipientsTab() {
        return `
            <div class="tab-content" data-tab="recipients">
                <div class="recipients-section">
                    <div class="section-header">
                        <h3>👥 Gestión de Destinatarios</h3>
                        <button id="sync-recipients" class="btn btn-primary">🔄 Sincronizar</button>
                    </div>

                    <div class="recipients-stats">
                        <div class="stat-card">
                            <h4>Estudiantes</h4>
                            <span class="stat-number" id="students-count">${this.recipients.students.length}</span>
                        </div>
                        <div class="stat-card">
                            <h4>Padres</h4>
                            <span class="stat-number" id="parents-count">${this.recipients.parents.length}</span>
                        </div>
                        <div class="stat-card">
                            <h4>Maestros</h4>
                            <span class="stat-number" id="teachers-count">${this.recipients.teachers.length}</span>
                        </div>
                    </div>

                    <div class="recipients-list-container">
                        <div class="recipients-tabs">
                            <button class="recipients-tab-btn active" data-group="students">Estudiantes</button>
                            <button class="recipients-tab-btn" data-group="parents">Padres</button>
                            <button class="recipients-tab-btn" data-group="teachers">Maestros</button>
                        </div>
                        <div id="recipients-display" class="recipients-display">
                            <!-- Se llena dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createSettingsTab() {
        return `
            <div class="tab-content" data-tab="settings">
                <div class="settings-section">
                    <h3>⚙️ Configuración del Sistema</h3>

                    <div class="settings-group">
                        <h4>Configuración por Defecto</h4>
                        <label><input type="checkbox" id="default-high-priority"> Alta prioridad por defecto</label>
                        <label><input type="checkbox" id="default-require-interaction"> Requiere interacción por defecto</label>
                        <label><input type="checkbox" id="auto-schedule-reminders"> Auto-programar recordatorios</label>
                    </div>

                    <div class="settings-group">
                        <h4>Límites y Restricciones</h4>
                        <div class="form-group">
                            <label>Máximo de notificaciones por día:</label>
                            <input type="number" id="max-notifications-day" class="form-control" value="10">
                        </div>
                        <div class="form-group">
                            <label>Horario restringido (desde):</label>
                            <input type="time" id="restricted-start" class="form-control" value="22:00">
                        </div>
                        <div class="form-group">
                            <label>Horario restringido (hasta):</label>
                            <input type="time" id="restricted-end" class="form-control" value="07:00">
                        </div>
                    </div>

                    <div class="settings-group">
                        <h4>Plantillas de Notificación</h4>
                        <button id="manage-templates" class="btn btn-secondary">📝 Gestionar Plantillas</button>
                        <button id="import-templates" class="btn btn-secondary">📥 Importar</button>
                        <button id="export-templates" class="btn btn-secondary">📤 Exportar</button>
                    </div>

                    <div class="settings-actions">
                        <button id="save-settings" class="btn btn-primary">💾 Guardar Configuración</button>
                        <button id="reset-settings" class="btn btn-danger">🔄 Restaurar por Defecto</button>
                    </div>
                </div>
            </div>
        `;
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;

                // Remover clase active de todos
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Agregar clase active al seleccionado
                button.classList.add('active');
                const targetContent = document.querySelector(`[data-tab="${targetTab}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Cargar contenido específico del tab
                this.loadTabContent(targetTab);
            });
        });
    }

    loadTabContent(tab) {
        switch (tab) {
            case 'scheduled':
                this.loadScheduledNotifications();
                break;
            case 'history':
                this.loadNotificationHistoryDisplay();
                break;
            case 'recipients':
                this.loadRecipientsDisplay();
                break;
        }
    }

    setupEventListeners() {
        // Botón de enviar notificación
        document.getElementById('send-notification')?.addEventListener('click', () => {
            this.sendNotification();
        });

        // Vista previa
        document.getElementById('preview-notification')?.addEventListener('click', () => {
            this.previewNotification();
        });

        // Selector de tipo de notificación
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.updateFormForType(btn.dataset.type);
            });
        });

        // Selector de destinatarios
        document.getElementById('notification-recipients')?.addEventListener('change', (e) => {
            const customDiv = document.getElementById('custom-recipients');
            if (e.target.value === 'custom') {
                customDiv.style.display = 'block';
                this.loadCustomRecipients();
            } else {
                customDiv.style.display = 'none';
            }
        });

        // Programación
        document.getElementById('schedule-notification')?.addEventListener('change', (e) => {
            const controls = document.getElementById('schedule-controls');
            controls.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    updateFormForType(type) {
        const titleInput = document.getElementById('notification-title');
        const messageTextarea = document.getElementById('notification-message');

        // Plantillas por tipo
        const templates = {
            'COMUNICADO_OFICIAL': {
                title: 'Comunicado Oficial - BGE Héroes',
                message: 'Estimada comunidad educativa:\n\n[Mensaje del comunicado]\n\nAtentamente,\nDirección BGE Héroes de la Patria'
            },
            'RECORDATORIO_EXAMEN': {
                title: 'Recordatorio: Examen de [Materia]',
                message: 'Recordamos que el examen de [Materia] se realizará el [Fecha] a las [Hora] en el aula [Aula].\n\nTemas a evaluar:\n- [Tema 1]\n- [Tema 2]'
            },
            'EMERGENCIA_ESCOLAR': {
                title: '🚨 ALERTA ESCOLAR - BGE',
                message: 'ATENCIÓN: [Descripción de la emergencia]\n\nInstrucciones:\n1. [Instrucción 1]\n2. [Instrucción 2]\n\nContacto de emergencia: [Teléfono]'
            },
            'EVENTO_PROXIMO': {
                title: 'Próximo Evento: [Nombre del Evento]',
                message: 'Te invitamos al evento: [Nombre]\n\nFecha: [Fecha]\nHora: [Hora]\nLugar: [Lugar]\n\n[Descripción del evento]'
            },
            'INSCRIPCIONES_ABIERTAS': {
                title: 'Inscripciones Abiertas - [Curso/Programa]',
                message: 'Se encuentran abiertas las inscripciones para [Curso/Programa].\n\nFecha límite: [Fecha]\nCupos disponibles: [Número]\nRequisitos: [Lista de requisitos]'
            },
            'CALIFICACIONES_DISPONIBLES': {
                title: 'Calificaciones Disponibles',
                message: 'Ya están disponibles las calificaciones del periodo [Periodo].\n\nMaterias evaluadas:\n- [Materia 1]\n- [Materia 2]\n\nConsúltalas en el portal estudiantil.'
            }
        };

        const template = templates[type];
        if (template) {
            titleInput.value = template.title;
            messageTextarea.value = template.message;
        }

        // Configurar opciones específicas del tipo
        this.setTypeSpecificOptions(type);
    }

    setTypeSpecificOptions(type) {
        const highPriority = document.getElementById('high-priority');
        const requireInteraction = document.getElementById('require-interaction');
        const bypassQuietHours = document.getElementById('bypass-quiet-hours');

        // Configurar según el tipo
        switch (type) {
            case 'EMERGENCIA_ESCOLAR':
                highPriority.checked = true;
                requireInteraction.checked = true;
                bypassQuietHours.checked = true;
                break;
            case 'COMUNICADO_OFICIAL':
            case 'INSCRIPCIONES_ABIERTAS':
                highPriority.checked = true;
                break;
            case 'RECORDATORIO_EXAMEN':
                highPriority.checked = true;
                requireInteraction.checked = false;
                break;
            default:
                highPriority.checked = false;
                requireInteraction.checked = false;
                bypassQuietHours.checked = false;
        }
    }

    async sendNotification() {
        const formData = this.getFormData();

        if (!this.validateForm(formData)) {
            return;
        }

        try {
            this.showLoadingState();

            // Preparar notificación
            const notification = {
                type: formData.type,
                title: formData.title,
                body: formData.message,
                payload: {
                    id: Date.now(),
                    sender: this.currentUser.name,
                    senderRole: this.currentUser.role,
                    priority: formData.highPriority ? 'high' : 'normal',
                    recipients: formData.recipients,
                    timestamp: new Date().toISOString()
                }
            };

            // Configurar opciones
            if (formData.requireInteraction) {
                notification.payload.requireInteraction = true;
            }

            if (formData.bypassQuietHours) {
                notification.payload.bypassQuietHours = true;
            }

            // Enviar o programar
            if (formData.scheduled) {
                await this.scheduleNotification(notification, formData.scheduleDate);
            } else {
                await this.sendNotificationNow(notification);
            }

            // Guardar en historial
            this.addToHistory(notification);

            // Resetear formulario
            this.resetForm();

            this.showSuccessMessage('Notificación enviada exitosamente');

        } catch (error) {
            debugLog.error('ERROR', '❌ Error enviando notificación:', error);
            this.showErrorMessage('Error enviando notificación: ' + error.message);
        } finally {
            this.hideLoadingState();
        }
    }

    getFormData() {
        const selectedType = document.querySelector('.type-btn.selected');

        return {
            type: selectedType?.dataset.type || 'COMUNICADO_OFICIAL',
            title: document.getElementById('notification-title').value.trim(),
            message: document.getElementById('notification-message').value.trim(),
            recipients: document.getElementById('notification-recipients').value,
            highPriority: document.getElementById('high-priority').checked,
            requireInteraction: document.getElementById('require-interaction').checked,
            bypassQuietHours: document.getElementById('bypass-quiet-hours').checked,
            scheduled: document.getElementById('schedule-notification').checked,
            scheduleDate: document.getElementById('schedule-datetime').value
        };
    }

    validateForm(data) {
        const errors = [];

        if (!data.title) {
            errors.push('El título es obligatorio');
        }

        if (!data.message) {
            errors.push('El mensaje es obligatorio');
        }

        if (data.scheduled && !data.scheduleDate) {
            errors.push('Debe especificar fecha y hora para notificación programada');
        }

        if (data.scheduled && new Date(data.scheduleDate) <= new Date()) {
            errors.push('La fecha programada debe ser futura');
        }

        if (errors.length > 0) {
            this.showErrorMessage('Errores en el formulario:\n' + errors.join('\n'));
            return false;
        }

        return true;
    }

    async sendNotificationNow(notification) {
        // Simular envío (en producción usar API real)
        debugLog.log('NOTIFICATION', '📤 Enviando notificación:', notification);

        // Si existe el sistema de notificaciones global, usarlo
        if (window.bgeNotifications) {
            switch (notification.type) {
                case 'COMUNICADO_OFICIAL':
                    await window.bgeNotifications.sendComunicadoOficial(notification.payload);
                    break;
                case 'EMERGENCIA_ESCOLAR':
                    await window.bgeNotifications.sendEmergenciaEscolar(notification.payload);
                    break;
                case 'EVENTO_PROXIMO':
                    await window.bgeNotifications.sendEventoProximo(notification.payload);
                    break;
                default:
                    await window.bgeNotifications.sendEducationalNotification(notification);
            }
        }

        // Simular envío al servidor
        await this.sendToServer(notification);
    }

    async sendToServer(notification) {
        // Simular llamada al servidor
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% éxito
                    resolve({ success: true, id: Date.now() });
                } else {
                    reject(new Error('Error de conexión al servidor'));
                }
            }, 1000);
        });
    }

    async scheduleNotification(notification, scheduleDate) {
        const scheduledNotification = {
            ...notification,
            scheduledFor: new Date(scheduleDate).toISOString(),
            status: 'programada'
        };

        this.scheduledNotifications.push(scheduledNotification);
        this.saveScheduledNotifications();

        debugLog.log('APP', '⏰ Notificación programada para:', scheduleDate);
    }

    addToHistory(notification) {
        const historyEntry = {
            ...notification,
            sentAt: new Date().toISOString(),
            status: 'enviada',
            id: Date.now()
        };

        this.notificationHistory.unshift(historyEntry);

        // Mantener solo las últimas 500 notificaciones
        if (this.notificationHistory.length > 500) {
            this.notificationHistory = this.notificationHistory.slice(0, 500);
        }

        this.saveNotificationHistory();
    }

    previewNotification() {
        const formData = this.getFormData();

        if (!formData.title || !formData.message) {
            this.showErrorMessage('Complete título y mensaje para ver la vista previa');
            return;
        }

        // Crear vista previa modal
        const modal = document.createElement('div');
        modal.className = 'preview-modal';
        modal.innerHTML = DOMPurify.sanitize(`
            <div class="preview-content">
                <div class="preview-header">
                    <h3>👁️ Vista Previa de Notificación</h3>
                    <button data-action="close-preview-modal" data-context="preview-modal" class="close-btn">&times;</button>
                </div>
                <div class="preview-notification">
                    <div class="notification-icon">🔔</div>
                    <div class="notification-content">
                        <div class="notification-title">${formData.title}</div>
                        <div class="notification-body">${formData.message}</div>
                        <div class="notification-meta">
                            BGE Héroes de la Patria • ahora
                        </div>
                    </div>
                </div>
                <div class="preview-details">
                    <p><strong>Tipo:</strong> ${formData.type}</p>
                    <p><strong>Destinatarios:</strong> ${formData.recipients}</p>
                    <p><strong>Prioridad:</strong> ${formData.highPriority ? 'Alta' : 'Normal'}</p>
                    ${formData.scheduled ? `<p><strong>Programada para:</strong> ${new Date(formData.scheduleDate).toLocaleString()}</p>` : ''}
                </div>
            </div>
        `);

        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(modal);
    }

    resetForm() {
        document.getElementById('notification-title').value = '';
        document.getElementById('notification-message').value = '';
        document.getElementById('notification-recipients').value = 'all';
        document.getElementById('high-priority').checked = false;
        document.getElementById('require-interaction').checked = false;
        document.getElementById('bypass-quiet-hours').checked = false;
        document.getElementById('schedule-notification').checked = false;
        document.getElementById('schedule-controls').style.display = 'none';

        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('selected'));
    }

    saveScheduledNotifications() {
        localStorage.setItem('bge_scheduled_notifications_admin', JSON.stringify(this.scheduledNotifications));
    }

    loadScheduledNotifications() {
        const container = document.getElementById('scheduled-list');
        if (!container) return;

        if (this.scheduledNotifications.length === 0) {
            container.innerHTML = DOMPurify.sanitize('<p class="no-items">No hay notificaciones programadas</p>', 'simple');
            return;
        }

        container.innerHTML = DOMPurify.sanitize(this.scheduledNotifications.map(notif => `
            <div class="scheduled-item">
                <div class="scheduled-info">
                    <h4>${notif.title}</h4>
                    <p>${notif.body}</p>
                    <small>Programada para: ${new Date(notif.scheduledFor).toLocaleString()}</small>
                </div>
                <div class="scheduled-actions">
                    <button data-action="editScheduled-${notif.id}" data-context="scheduled-notifications" class="btn btn-sm btn-secondary">✏️ Editar</button>
                    <button data-action="deleteScheduled-${notif.id}" data-context="scheduled-notifications" class="btn btn-sm btn-danger">🗑️ Eliminar</button>
                </div>
            </div>
        `).join(''));
    }

    loadNotificationHistoryDisplay() {
        const container = document.getElementById('history-list');
        if (!container) return;

        if (this.notificationHistory.length === 0) {
            container.innerHTML = DOMPurify.sanitize('<p class="no-items">No hay historial de notificaciones</p>', 'simple');
            return;
        }

        container.innerHTML = DOMPurify.sanitize(this.notificationHistory.map(notif => `
            <div class="history-item">
                <div class="history-info">
                    <h4>${notif.title}</h4>
                    <p>${notif.body}</p>
                    <div class="history-meta">
                        <span>📅 ${new Date(notif.sentAt).toLocaleString()}</span>
                        <span>👤 ${notif.payload?.sender || 'Sistema'}</span>
                        <span>📊 ${notif.payload?.priority || 'normal'}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button data-action="resendNotification-${notif.id}" data-context="notification-history" class="btn btn-sm btn-primary">🔄 Reenviar</button>
                    <button data-action="viewDetails-${notif.id}" data-context="notification-history" class="btn btn-sm btn-secondary">👁️ Detalles</button>
                </div>
            </div>
        `).join(''));
    }

    addAdminStyles() {
        if (document.getElementById('bge-admin-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'bge-admin-styles';
        styles.textContent = `
            .notification-admin-panel {
                max-width: 1200px;
                margin: 2rem auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                overflow: hidden;
            }

            .admin-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .admin-tabs {
                display: flex;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
            }

            .tab-btn {
                padding: 1rem 1.5rem;
                border: none;
                background: transparent;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .tab-btn.active {
                background: white;
                border-bottom: 3px solid #667eea;
            }

            .admin-content {
                padding: 2rem;
            }

            .tab-content {
                display: none;
            }

            .tab-content.active {
                display: block;
            }

            .type-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .type-btn {
                padding: 1rem;
                border: 2px solid #dee2e6;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .type-btn:hover {
                border-color: #667eea;
            }

            .type-btn.selected {
                border-color: #667eea;
                background: #f0f3ff;
            }

            .form-group {
                margin-bottom: 1.5rem;
            }

            .form-control {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 1rem;
            }

            .form-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .btn-primary {
                background: #667eea;
                color: white;
            }

            .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .btn-danger {
                background: #dc3545;
                color: white;
            }

            .recipients-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .stat-card {
                background: #f8f9fa;
                padding: 1.5rem;
                border-radius: 8px;
                text-align: center;
            }

            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                color: #667eea;
            }

            .no-items {
                text-align: center;
                padding: 3rem;
                color: #6c757d;
                font-style: italic;
            }
        `;

        document.head.appendChild(styles);
    }

    showAccessDenied() {
        const denied = document.createElement('div');
        denied.innerHTML = DOMPurify.sanitize(`
            <div style="text-align: center; padding: 3rem; color: #dc3545;">
                <h2>🚫 Acceso Denegado</h2>
                <p>No tienes permisos para acceder al panel de administración de notificaciones.</p>
                <p>Contacta al administrador del sistema si crees que esto es un error.</p>
            </div>
        `);
        document.body.appendChild(denied);
    }

    showSuccessMessage(message) {
        this.showToast(message, 'success');
    }

    showErrorMessage(message) {
        this.showToast(message, 'error');
    }

    showLoadingState() {
        const button = document.getElementById('send-notification');
        if (button) {
            button.disabled = true;
            button.innerHTML = DOMPurify.sanitize('⏳ Enviando...');
        }
    }

    hideLoadingState() {
        const button = document.getElementById('send-notification');
        if (button) {
            button.disabled = false;
            button.innerHTML = DOMPurify.sanitize('📤 Enviar Ahora');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBGENotificationAdmin);
} else {
    initializeBGENotificationAdmin();
}

function initializeBGENotificationAdmin() {
    // Solo inicializar si estamos en página de administración
    if (window.location.pathname.includes('admin') || document.getElementById('notification-admin-container')) {
        window.bgeNotificationAdmin = new BGENotificationAdmin();
    }
}

// ============================================
// EVENT DELEGATION HANDLER (CSP Compliant)
// Pattern B: onclick con parámetros → data-action
// ============================================
document.addEventListener('click', (e) => {
    const actionElement = e.target.closest('[data-action]');
    if (!actionElement) return;

    const action = actionElement.getAttribute('data-action');
    const context = actionElement.getAttribute('data-context') || 'bge-notification-admin';

    try {
        // Pattern B: Cerrar modal de vista previa
        if (action === 'close-preview-modal') {
            const modal = actionElement.closest('.preview-modal');
            if (modal) {
                modal.remove();
            }
            return;
        }

        // Pattern B: Acciones de notificaciones programadas
        if (action.startsWith('editScheduled-')) {
            const notifId = action.replace('editScheduled-', '');
            if (window.bgeNotificationAdmin && typeof window.bgeNotificationAdmin.editScheduled === 'function') {
                window.bgeNotificationAdmin.editScheduled(notifId);
            }
            return;
        }

        if (action.startsWith('deleteScheduled-')) {
            const notifId = action.replace('deleteScheduled-', '');
            if (window.bgeNotificationAdmin && typeof window.bgeNotificationAdmin.deleteScheduled === 'function') {
                window.bgeNotificationAdmin.deleteScheduled(notifId);
            }
            return;
        }

        // Pattern B: Acciones de historial de notificaciones
        if (action.startsWith('resendNotification-')) {
            const notifId = action.replace('resendNotification-', '');
            if (window.bgeNotificationAdmin && typeof window.bgeNotificationAdmin.resendNotification === 'function') {
                window.bgeNotificationAdmin.resendNotification(notifId);
            }
            return;
        }

        if (action.startsWith('viewDetails-')) {
            const notifId = action.replace('viewDetails-', '');
            if (window.bgeNotificationAdmin && typeof window.bgeNotificationAdmin.viewDetails === 'function') {
                window.bgeNotificationAdmin.viewDetails(notifId);
            }
            return;
        }

        debugLog.warn('BGE-NOTIFICATION-ADMIN', '[BGE-NOTIFICATION-ADMIN] Unhandled data-action:', action);
    } catch (error) {
        debugLog.error('BGE-NOTIFICATION-ADMIN', '[BGE-NOTIFICATION-ADMIN] Error handling action:', action, error);
    }
});

debugLog.log('APP', '🔧 Panel de Administración de Notificaciones BGE cargado');