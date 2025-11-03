/**
 * 👨‍👩‍👧‍👦 SISTEMA DE CHAT PADRES-DOCENTES EN TIEMPO REAL
 * Chat bidireccional con notificaciones push y citas virtuales
 */

class ParentTeacherChat {
    constructor() {
        this.socket = null;
        this.currentUser = null;
        this.conversations = new Map();
        this.currentConversation = null;
        this.apiBase = 'http://localhost:8000/api/parent-teacher';

        this.init();
    }

    async init() {
        try {
            await this.loadUserSession();
            this.initializeWebSocket();
            this.initializeUI();
            this.setupEventListeners();
            await this.loadConversations();

            console.log('💬 [CHAT] Sistema de comunicación padres-docentes inicializado');
        } catch (error) {
            console.error('❌ [CHAT] Error inicializando:', error);
            this.showError('Error al inicializar el sistema de chat');
        }
    }

    async loadUserSession() {
        // Verificar si hay una sesión activa
        const token = localStorage.getItem('auth_token');
        if (!token) {
            throw new Error('No hay sesión activa');
        }

        // Obtener datos del usuario
        this.currentUser = {
            id: localStorage.getItem('user_id') || 'user_' + Date.now(),
            name: localStorage.getItem('user_name') || 'Usuario',
            type: localStorage.getItem('user_type') || 'parent', // 'parent' o 'teacher'
            token: token
        };
    }

    initializeWebSocket() {
        try {
            // Conectar al WebSocket del backend
            this.socket = new WebSocket('ws://localhost:8000');

            this.socket.onopen = () => {
                console.log('🌐 [WEBSOCKET] Conectado al servidor');
                // Autenticar el WebSocket
                this.socket.send(JSON.stringify({
                    type: 'auth',
                    token: this.currentUser.token,
                    userId: this.currentUser.id
                }));
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('❌ [WEBSOCKET] Error procesando mensaje:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('⚠️ [WEBSOCKET] Conexión cerrada, intentando reconectar...');
                setTimeout(() => this.initializeWebSocket(), 3000);
            };

            this.socket.onerror = (error) => {
                console.error('❌ [WEBSOCKET] Error de conexión:', error);
            };
        } catch (error) {
            console.error('❌ [WEBSOCKET] Error inicializando WebSocket:', error);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_message':
                this.handleNewMessage(data.message);
                break;
            case 'message_read':
                this.handleMessageRead(data);
                break;
            case 'typing':
                this.handleTypingIndicator(data);
                break;
            case 'appointment_notification':
                this.handleAppointmentNotification(data);
                break;
            default:
                console.log('📨 [WEBSOCKET] Mensaje recibido:', data);
        }
    }

    initializeUI() {
        // Crear la estructura del chat si no existe
        if (!document.getElementById('parent-teacher-chat')) {
            this.createChatUI();
        }

        this.updateUserInfo();
    }

    createChatUI() {
        const chatHTML = `
            <div id="parent-teacher-chat" class="chat-container" style="display: none;">
                <div class="chat-header">
                    <div class="chat-user-info">
                        <img id="chat-user-avatar" src="https://via.placeholder.com/40" alt="Avatar" class="user-avatar">
                        <div class="user-details">
                            <span id="chat-user-name">${this.currentUser.name}</span>
                            <span id="chat-user-type" class="user-type">${this.getUserTypeLabel()}</span>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button id="new-conversation-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Nueva Conversación
                        </button>
                        <button id="schedule-appointment-btn" class="btn btn-secondary">
                            <i class="fas fa-calendar"></i> Agendar Cita
                        </button>
                        <button id="close-chat-btn" class="btn btn-ghost">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="chat-body">
                    <div class="conversations-sidebar">
                        <div class="conversations-header">
                            <h3>Conversaciones</h3>
                            <div class="search-conversations">
                                <input type="text" id="search-conversations" placeholder="Buscar conversaciones...">
                            </div>
                        </div>
                        <div id="conversations-list" class="conversations-list">
                            <div class="loading-conversations">
                                <i class="fas fa-spinner fa-spin"></i>
                                Cargando conversaciones...
                            </div>
                        </div>
                    </div>

                    <div class="chat-main">
                        <div id="chat-welcome" class="chat-welcome">
                            <div class="welcome-content">
                                <i class="fas fa-comments fa-3x"></i>
                                <h3>Sistema de Comunicación Padres-Docentes</h3>
                                <p>Selecciona una conversación o inicia una nueva para comenzar.</p>
                            </div>
                        </div>

                        <div id="chat-conversation" class="chat-conversation" style="display: none;">
                            <div class="conversation-header">
                                <div class="conversation-info">
                                    <img id="conversation-avatar" src="" alt="Avatar" class="conversation-avatar">
                                    <div class="conversation-details">
                                        <h4 id="conversation-name"></h4>
                                        <span id="conversation-status" class="conversation-status"></span>
                                    </div>
                                </div>
                                <div class="conversation-actions">
                                    <button id="conversation-info-btn" class="btn btn-ghost">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                    <button id="video-call-btn" class="btn btn-ghost">
                                        <i class="fas fa-video"></i>
                                    </button>
                                </div>
                            </div>

                            <div id="messages-container" class="messages-container">
                                <!-- Los mensajes se cargarán aquí -->
                            </div>

                            <div id="typing-indicator" class="typing-indicator" style="display: none;">
                                <div class="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span id="typing-user"></span> está escribiendo...
                            </div>

                            <div class="message-input-container">
                                <div class="message-attachments" id="message-attachments" style="display: none;">
                                    <!-- Archivos adjuntos -->
                                </div>
                                <div class="message-input-wrapper">
                                    <button id="attach-file-btn" class="btn btn-ghost">
                                        <i class="fas fa-paperclip"></i>
                                    </button>
                                    <textarea id="message-input"
                                             placeholder="Escribe tu mensaje..."
                                             rows="1"></textarea>
                                    <button id="send-message-btn" class="btn btn-primary" disabled>
                                        <i class="fas fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal para nueva conversación -->
                <div id="new-conversation-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Nueva Conversación</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Buscar ${this.currentUser.type === 'parent' ? 'docente' : 'padre de familia'}:</label>
                                <input type="text" id="search-recipients" placeholder="Nombre o materia...">
                                <div id="recipients-list" class="recipients-list"></div>
                            </div>
                            <div class="form-group">
                                <label>Asunto:</label>
                                <input type="text" id="conversation-subject" placeholder="Asunto de la conversación">
                            </div>
                            <div class="form-group">
                                <label>Mensaje inicial:</label>
                                <textarea id="initial-message" rows="3" placeholder="Mensaje inicial..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel-conversation-btn" class="btn btn-secondary">Cancelar</button>
                            <button id="create-conversation-btn" class="btn btn-primary">Crear Conversación</button>
                        </div>
                    </div>
                </div>

                <!-- Modal para agendar cita -->
                <div id="appointment-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Agendar Cita</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Con:</label>
                                <select id="appointment-recipient">
                                    <option value="">Seleccionar...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Fecha:</label>
                                <input type="date" id="appointment-date" min="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Hora:</label>
                                <input type="time" id="appointment-time">
                            </div>
                            <div class="form-group">
                                <label>Modalidad:</label>
                                <select id="appointment-type">
                                    <option value="virtual">Virtual (Videoconferencia)</option>
                                    <option value="presencial">Presencial</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Asunto:</label>
                                <input type="text" id="appointment-subject" placeholder="Asunto de la cita">
                            </div>
                            <div class="form-group">
                                <label>Descripción:</label>
                                <textarea id="appointment-description" rows="3" placeholder="Detalles adicionales..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel-appointment-btn" class="btn btn-secondary">Cancelar</button>
                            <button id="schedule-appointment-confirm-btn" class="btn btn-primary">Agendar Cita</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    setupEventListeners() {
        // Botones principales
        document.getElementById('close-chat-btn')?.addEventListener('click', () => this.closeChat());
        document.getElementById('new-conversation-btn')?.addEventListener('click', () => this.showNewConversationModal());
        document.getElementById('schedule-appointment-btn')?.addEventListener('click', () => this.showAppointmentModal());

        // Input de mensajes
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-message-btn');

        messageInput?.addEventListener('input', (e) => {
            this.handleMessageInput(e);
            this.sendTypingIndicator();
        });

        messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        sendButton?.addEventListener('click', () => this.sendMessage());

        // Búsqueda de conversaciones
        document.getElementById('search-conversations')?.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });

        // Modales
        this.setupModalListeners();
    }

    setupModalListeners() {
        // Modal de nueva conversación
        document.getElementById('create-conversation-btn')?.addEventListener('click', () => this.createNewConversation());
        document.getElementById('cancel-conversation-btn')?.addEventListener('click', () => this.hideNewConversationModal());

        // Modal de citas
        document.getElementById('schedule-appointment-confirm-btn')?.addEventListener('click', () => this.scheduleAppointment());
        document.getElementById('cancel-appointment-btn')?.addEventListener('click', () => this.hideAppointmentModal());

        // Cerrar modales con X
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Búsqueda de destinatarios
        document.getElementById('search-recipients')?.addEventListener('input', (e) => {
            this.searchRecipients(e.target.value);
        });
    }

    getUserTypeLabel() {
        return this.currentUser.type === 'parent' ? 'Padre de Familia' : 'Docente';
    }

    updateUserInfo() {
        const nameElement = document.getElementById('chat-user-name');
        const typeElement = document.getElementById('chat-user-type');

        if (nameElement) nameElement.textContent = this.currentUser.name;
        if (typeElement) typeElement.textContent = this.getUserTypeLabel();
    }

    async loadConversations() {
        try {
            const response = await fetch(`${this.apiBase}/conversations`, {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayConversations(data.conversations || []);

        } catch (error) {
            console.error('❌ [CHAT] Error cargando conversaciones:', error);
            this.displayConversations([]);
        }
    }

    displayConversations(conversations) {
        const container = document.getElementById('conversations-list');
        if (!container) return;

        if (conversations.length === 0) {
            container.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-inbox"></i>
                    <p>No tienes conversaciones aún.</p>
                    <button class="btn btn-primary" onclick="parentTeacherChat.showNewConversationModal()">
                        Iniciar Conversación
                    </button>
                </div>
            `;
            return;
        }

        const conversationsHTML = conversations.map(conv => `
            <div class="conversation-item ${conv.unread_count > 0 ? 'unread' : ''}"
                 data-conversation-id="${conv.id}"
                 onclick="parentTeacherChat.selectConversation('${conv.id}')">
                <div class="conversation-avatar-wrapper">
                    <img src="${conv.participant_avatar || 'https://via.placeholder.com/40'}"
                         alt="${conv.participant_name}" class="conversation-item-avatar">
                    ${conv.is_online ? '<div class="online-indicator"></div>' : ''}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <span class="conversation-name">${conv.participant_name}</span>
                        <span class="conversation-time">${this.formatTime(conv.last_message_time)}</span>
                    </div>
                    <div class="conversation-preview">
                        <span class="last-message">${conv.last_message || 'Sin mensajes'}</span>
                        ${conv.unread_count > 0 ? `<span class="unread-badge">${conv.unread_count}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = conversationsHTML;

        // Guardar conversaciones en el mapa
        conversations.forEach(conv => {
            this.conversations.set(conv.id, conv);
        });
    }

    async selectConversation(conversationId) {
        try {
            this.currentConversation = this.conversations.get(conversationId);
            if (!this.currentConversation) {
                throw new Error('Conversación no encontrada');
            }

            // Mostrar la conversación
            document.getElementById('chat-welcome').style.display = 'none';
            document.getElementById('chat-conversation').style.display = 'flex';

            // Actualizar header de conversación
            this.updateConversationHeader();

            // Cargar mensajes
            await this.loadMessages(conversationId);

            // Marcar como activa
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-conversation-id="${conversationId}"]`)?.classList.add('active');

            // Marcar mensajes como leídos
            this.markMessagesAsRead(conversationId);

        } catch (error) {
            console.error('❌ [CHAT] Error seleccionando conversación:', error);
            this.showError('Error al cargar la conversación');
        }
    }

    updateConversationHeader() {
        if (!this.currentConversation) return;

        document.getElementById('conversation-avatar').src =
            this.currentConversation.participant_avatar || 'https://via.placeholder.com/40';
        document.getElementById('conversation-name').textContent =
            this.currentConversation.participant_name;
        document.getElementById('conversation-status').textContent =
            this.currentConversation.is_online ? 'En línea' : 'Desconectado';
    }

    async loadMessages(conversationId) {
        try {
            const response = await fetch(`${this.apiBase}/conversations/${conversationId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayMessages(data.messages || []);

        } catch (error) {
            console.error('❌ [CHAT] Error cargando mensajes:', error);
            this.displayMessages([]);
        }
    }

    displayMessages(messages) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="no-messages">
                    <p>No hay mensajes en esta conversación.</p>
                </div>
            `;
            return;
        }

        const messagesHTML = messages.map(message => this.createMessageHTML(message)).join('');
        container.innerHTML = messagesHTML;

        // Scroll al final
        container.scrollTop = container.scrollHeight;
    }

    createMessageHTML(message) {
        const isOwn = message.sender_id === this.currentUser.id;
        const messageClass = isOwn ? 'message own' : 'message';

        return `
            <div class="${messageClass}" data-message-id="${message.id}">
                <div class="message-content">
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    ${message.attachments && message.attachments.length > 0 ?
                        this.createAttachmentsHTML(message.attachments) : ''}
                    <div class="message-meta">
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                        ${isOwn ? `<span class="message-status ${message.read ? 'read' : 'sent'}">
                            <i class="fas fa-check${message.read ? '-double' : ''}"></i>
                        </span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    createAttachmentsHTML(attachments) {
        return `
            <div class="message-attachments">
                ${attachments.map(att => `
                    <div class="attachment">
                        <i class="fas fa-${this.getFileIcon(att.type)}"></i>
                        <a href="${att.url}" target="_blank">${att.name}</a>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();

        if (!content || !this.currentConversation) return;

        try {
            const messageData = {
                conversation_id: this.currentConversation.id,
                content: content,
                message_type: 'text'
            };

            const response = await fetch(`${this.apiBase}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentUser.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Limpiar input
            input.value = '';
            this.updateSendButton();

            // El mensaje se añadirá via WebSocket

        } catch (error) {
            console.error('❌ [CHAT] Error enviando mensaje:', error);
            this.showError('Error al enviar el mensaje');
        }
    }

    handleNewMessage(message) {
        // Si es de la conversación actual, añadir al chat
        if (this.currentConversation && message.conversation_id === this.currentConversation.id) {
            this.addMessageToChat(message);
        }

        // Actualizar lista de conversaciones
        this.updateConversationPreview(message);

        // Mostrar notificación si no es propio mensaje
        if (message.sender_id !== this.currentUser.id) {
            this.showNotification(message);
        }
    }

    addMessageToChat(message) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        const messageHTML = this.createMessageHTML(message);
        container.insertAdjacentHTML('beforeend', messageHTML);
        container.scrollTop = container.scrollHeight;
    }

    updateConversationPreview(message) {
        const convElement = document.querySelector(`[data-conversation-id="${message.conversation_id}"]`);
        if (convElement) {
            const preview = convElement.querySelector('.last-message');
            const timeElement = convElement.querySelector('.conversation-time');

            if (preview) preview.textContent = message.content.substring(0, 50) + '...';
            if (timeElement) timeElement.textContent = this.formatTime(message.timestamp);

            // Mover conversación al inicio
            convElement.parentNode.insertBefore(convElement, convElement.parentNode.firstChild);
        }
    }

    showNotification(message) {
        if (Notification.permission === 'granted') {
            new Notification(`Nuevo mensaje de ${message.sender_name}`, {
                body: message.content.substring(0, 100),
                icon: '/images/notification-icon.png'
            });
        }
    }

    handleMessageInput(e) {
        const button = document.getElementById('send-message-btn');
        const hasContent = e.target.value.trim().length > 0;

        button.disabled = !hasContent;
        button.classList.toggle('active', hasContent);
    }

    updateSendButton() {
        const input = document.getElementById('message-input');
        const button = document.getElementById('send-message-btn');
        const hasContent = input.value.trim().length > 0;

        button.disabled = !hasContent;
        button.classList.toggle('active', hasContent);
    }

    sendTypingIndicator() {
        if (this.socket && this.currentConversation) {
            this.socket.send(JSON.stringify({
                type: 'typing',
                conversation_id: this.currentConversation.id,
                user_id: this.currentUser.id,
                user_name: this.currentUser.name
            }));
        }
    }

    handleTypingIndicator(data) {
        const indicator = document.getElementById('typing-indicator');
        const userName = document.getElementById('typing-user');

        if (data.user_id !== this.currentUser.id && this.currentConversation &&
            data.conversation_id === this.currentConversation.id) {

            userName.textContent = data.user_name;
            indicator.style.display = 'block';

            // Ocultar después de 3 segundos
            clearTimeout(this.typingTimeout);
            this.typingTimeout = setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    showNewConversationModal() {
        document.getElementById('new-conversation-modal').style.display = 'block';
        this.loadRecipients();
    }

    hideNewConversationModal() {
        document.getElementById('new-conversation-modal').style.display = 'none';
        this.clearNewConversationForm();
    }

    showAppointmentModal() {
        document.getElementById('appointment-modal').style.display = 'block';
        this.loadAppointmentRecipients();
    }

    hideAppointmentModal() {
        document.getElementById('appointment-modal').style.display = 'none';
        this.clearAppointmentForm();
    }

    async loadRecipients() {
        // Implementar carga de destinatarios disponibles
        console.log('🔍 [CHAT] Cargando destinatarios...');
    }

    async loadAppointmentRecipients() {
        // Implementar carga de personas para citas
        console.log('📅 [CHAT] Cargando destinatarios para citas...');
    }

    clearNewConversationForm() {
        document.getElementById('search-recipients').value = '';
        document.getElementById('conversation-subject').value = '';
        document.getElementById('initial-message').value = '';
        document.getElementById('recipients-list').innerHTML = '';
    }

    clearAppointmentForm() {
        document.getElementById('appointment-recipient').value = '';
        document.getElementById('appointment-date').value = '';
        document.getElementById('appointment-time').value = '';
        document.getElementById('appointment-type').value = 'virtual';
        document.getElementById('appointment-subject').value = '';
        document.getElementById('appointment-description').value = '';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        }
    }

    formatMessageContent(content) {
        // Formatear enlaces, menciones, etc.
        return content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener">$1</a>'
        );
    }

    getFileIcon(type) {
        const icons = {
            'image': 'image',
            'video': 'video',
            'audio': 'volume-up',
            'pdf': 'file-pdf',
            'doc': 'file-word',
            'excel': 'file-excel',
            'zip': 'file-archive'
        };
        return icons[type] || 'file';
    }

    showError(message) {
        console.error('❌ [CHAT]', message);
        // Implementar sistema de notificaciones toast
    }

    show() {
        document.getElementById('parent-teacher-chat').style.display = 'block';
    }

    closeChat() {
        document.getElementById('parent-teacher-chat').style.display = 'none';
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Inicializar el sistema de chat
let parentTeacherChat;

document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si hay sesión activa
    if (localStorage.getItem('auth_token')) {
        parentTeacherChat = new ParentTeacherChat();
    }
});

// Función global para mostrar el chat
window.showParentTeacherChat = () => {
    if (!parentTeacherChat) {
        parentTeacherChat = new ParentTeacherChat();
    }
    parentTeacherChat.show();
};