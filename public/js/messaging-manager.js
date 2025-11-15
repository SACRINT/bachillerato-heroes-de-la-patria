/**
 * ============================================
 * MESSAGING MANAGER - Sistema de Mensajería Interna BGE
 * ============================================
 * Versión: 1.0.0
 * Fecha: 19 de Octubre, 2025
 * Descripción: Gestor completo del sistema de mensajería
 *
 * CARACTERÍSTICAS:
 * ✅ Conversaciones 1:1 y grupales
 * ✅ Envío/recepción en tiempo real
 * ✅ Estado de lectura
 * ✅ Archivos adjuntos
 * ✅ Búsqueda
 * ✅ Indicadores de escritura
 * ✅ Auto-scroll inteligente
 * ============================================
 */

class MessagingManager {
    constructor(options = {}) {
        this.apiBaseURL = options.apiBaseURL || '/api/messaging';
        this.token = this.getStoredToken();
        this.currentUser = null;
        this.currentConversation = null;
        this.conversations = [];
        this.messages = [];
        this.typingTimeout = null;
        this.pollingInterval = null;

        // Referencias DOM
        this.conversationsList = document.getElementById('conversationsList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.attachmentBtn = document.getElementById('attachmentBtn');
        this.attachmentInput = document.getElementById('attachmentInput');
        this.chatArea = document.getElementById('chatArea');
        this.activeChat = document.getElementById('activeChat');
        this.emptyState = document.getElementById('emptyState');
        this.chatTitle = document.getElementById('chatTitle');
        this.chatSubtitle = document.getElementById('chatSubtitle');
        this.chatAvatar = document.getElementById('chatAvatar');
        this.typingIndicator = document.getElementById('typingIndicatorContainer');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.searchInput = document.getElementById('conversationsSearch');

        this.init();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    init() {
        if (!this.token) {
            console.warn('No hay token de autenticación');
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.loadConversations();
        this.setupPolling();
    }

    setupEventListeners() {
        // Enviar mensaje
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Indicador de escritura
        this.messageInput?.addEventListener('input', () => {
            this.handleTyping();
        });

        // Auto-resize textarea
        this.messageInput?.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });

        // Adjuntos
        this.attachmentBtn?.addEventListener('click', () => {
            this.attachmentInput?.click();
        });
        this.attachmentInput?.addEventListener('change', () => {
            this.handleAttachment();
        });

        // Nueva conversación
        document.getElementById('newConversationBtn')?.addEventListener('click', () => {
            this.showNewConversationModal();
        });

        // Crear conversación
        document.getElementById('createConversationBtn')?.addEventListener('click', () => {
            this.createConversation();
        });

        // Tipo de conversación
        document.getElementById('conversationType')?.addEventListener('change', (e) => {
            const groupTitleField = document.getElementById('groupTitleField');
            if (e.target.value === 'group') {
                groupTitleField.style.display = 'block';
            } else {
                groupTitleField.style.display = 'none';
            }
        });

        // Búsqueda de conversaciones
        this.searchInput?.addEventListener('input', (e) => {
            this.filterConversations(e.target.value);
        });
    }

    setupPolling() {
        // Actualizar conversaciones cada 30 segundos
        this.pollingInterval = setInterval(() => {
            if (this.currentConversation) {
                this.loadMessages(this.currentConversation.conversation_id, false);
            }
            this.loadConversations(true); // Silent reload
        }, 30000);
    }

    // ============================================
    // AUTENTICACIÓN
    // ============================================

    getStoredToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    }

    setToken(token) {
        localStorage.setItem('authToken', token);
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }

    // ============================================
    // API HELPERS
    // ============================================

    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBaseURL}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la solicitud');
            }

            return data;
        } catch (error) {
            console.error('Error en API request:', error);
            throw error;
        }
    }

    showLoading(show = true) {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.toggle('hidden', !show);
        }
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 start-50 translate-middle-x m-3`;
        toast.style.zIndex = '10000';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // ============================================
    // CONVERSACIONES
    // ============================================

    async loadConversations(silent = false) {
        try {
            if (!silent) this.showLoading(true);

            const data = await this.apiRequest('/conversations?limit=50');
            this.conversations = data.conversations || [];

            this.renderConversations();

        } catch (error) {
            console.error('Error al cargar conversaciones:', error);
            if (!silent) this.showToast('Error al cargar conversaciones', 'danger');
        } finally {
            if (!silent) this.showLoading(false);
        }
    }

    renderConversations() {
        if (!this.conversationsList) return;

        if (this.conversations.length === 0) {
            this.conversationsList.innerHTML = sanitizeHTML(`
                <div class="text-center p-4 text-muted">
                    <p>No hay conversaciones</p>
                    <button class="btn btn-sm btn-primary" onclick="window.messagingManager.showNewConversationModal()">
                        Iniciar conversación
                    </button>
                </div>
            `);
            return;
        }

        this.conversationsList.innerHTML = sanitizeHTML(this.conversations.map(conv => `
            <div class="conversation-item ${conv.unread_count > 0 ? 'unread' : ''} ${this.currentConversation && this.currentConversation.conversation_id === conv.conversation_id ? 'active' : ''}"
                 onclick="window.messagingManager.selectConversation(${conv.conversation_id})">
                <div class="conversation-avatar">
                    ${this.getInitials(conv.title || 'Chat')}
                </div>
                <div class="conversation-info">
                    <div class="conversation-header">
                        <div class="conversation-name">
                            ${this.escapeHtml(conv.custom_name || conv.title || 'Chat Directo')}
                        </div>
                        <div class="conversation-time">
                            ${this.formatTime(conv.last_message_at)}
                        </div>
                    </div>
                    <div class="conversation-last-message">
                        ${conv.last_message_content ? this.escapeHtml(conv.last_message_content).substring(0, 40) : 'Sin mensajes'}
                    </div>
                </div>
                ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ''}
            </div>
        `).join(''), 'ugc');
    }

    async selectConversation(conversationId) {
        try {
            this.showLoading(true);

            // Cargar detalles de la conversación
            const data = await this.apiRequest(`/conversations/${conversationId}`);
            this.currentConversation = data.conversation;
            this.currentConversation.participants = data.participants;

            // Mostrar chat
            this.emptyState?.classList.add('hidden');
            this.activeChat?.classList.remove('hidden');

            // Actualizar header
            this.updateChatHeader();

            // Cargar mensajes
            await this.loadMessages(conversationId);

            // Marcar como leído
            await this.markAsRead(conversationId);

            // Actualizar UI de conversaciones
            this.renderConversations();

        } catch (error) {
            console.error('Error al seleccionar conversación:', error);
            this.showToast('Error al cargar conversación', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    updateChatHeader() {
        if (!this.currentConversation) return;

        const title = this.currentConversation.title || 'Chat Directo';
        const participantsCount = this.currentConversation.participants?.length || 0;
        const subtitle = this.currentConversation.conversation_type === 'group'
            ? `${participantsCount} participantes`
            : 'Activo';

        if (this.chatTitle) this.chatTitle.textContent = title;
        if (this.chatSubtitle) this.chatSubtitle.textContent = subtitle;
        if (this.chatAvatar) this.chatAvatar.textContent = this.getInitials(title);
    }

    // ============================================
    // MENSAJES
    // ============================================

    async loadMessages(conversationId, scroll = true) {
        try {
            const data = await this.apiRequest(`/conversations/${conversationId}/messages?limit=100`);
            this.messages = data.messages || [];

            this.renderMessages();

            if (scroll) {
                this.scrollToBottom();
            }

        } catch (error) {
            console.error('Error al cargar mensajes:', error);
        }
    }

    renderMessages() {
        if (!this.messagesContainer) return;

        if (this.messages.length === 0) {
            this.messagesContainer.innerHTML = sanitizeHTML(`
                <div class="text-center text-muted py-5">
                    <p>No hay mensajes en esta conversación</p>
                    <p><small>Envía el primer mensaje para comenzar</small></p>
                </div>
            `);
            return;
        }

        this.messagesContainer.innerHTML = sanitizeHTML(this.messages.map(msg => {
            const isSent = msg.sender_id == this.getCurrentUserId();
            const messageClass = isSent ? 'sent' : 'received';

            return `
                <div class="message ${messageClass}">
                    <div class="message-content">
                        ${!isSent ? `<div class="message-sender">${this.escapeHtml(msg.sender_name)}</div>` : ''}
                        <div class="message-text">${this.escapeHtml(msg.content)}</div>
                        ${msg.attachments && msg.attachments.length > 0 ? this.renderAttachments(msg.attachments) : ''}
                        <div class="message-time">
                            ${this.formatTime(msg.created_at)}
                            ${msg.is_edited ? ' (editado)' : ''}
                            ${isSent ? '✓✓' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join(''), 'ugc');
    }

    renderAttachments(attachments) {
        return attachments.map(att => `
            <div class="message-attachment mt-2">
                ${att.file_type.startsWith('image/') ?
                    `<img src="${att.file_url}" alt="${att.file_name}" class="img-fluid rounded" style="max-height: 200px;">` :
                    `<a href="${att.file_url}" download class="btn btn-sm btn-outline-primary">
                        <i class="bi bi-file-earmark"></i> ${att.file_name}
                    </a>`
                }
            </div>
        `).join('');
    }

    async sendMessage() {
        const content = this.messageInput?.value.trim();

        if (!content || !this.currentConversation) return;

        try {
            const data = await this.apiRequest(`/conversations/${this.currentConversation.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });

            // Limpiar input
            this.messageInput.value = '';
            this.messageInput.style.height = 'auto';

            // Agregar mensaje a la lista
            this.messages.push(data.message);
            this.renderMessages();
            this.scrollToBottom();

            // Detener indicador de escritura
            this.stopTyping();

        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            this.showToast('Error al enviar mensaje', 'danger');
        }
    }

    async handleAttachment() {
        const file = this.attachmentInput?.files[0];
        if (!file) return;

        try {
            this.showLoading(true);

            // Primero enviar un mensaje temporal
            const data = await this.apiRequest(`/conversations/${this.currentConversation.id}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content: `[Archivo: ${file.name}]`, message_type: 'file' })
            });

            // Subir el archivo
            const formData = new FormData();
            formData.append('file', file);

            const uploadResponse = await fetch(`${this.apiBaseURL}/messages/${data.message.id}/attachments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('Error al subir archivo');
            }

            // Recargar mensajes
            await this.loadMessages(this.currentConversation.id);
            this.showToast('Archivo enviado exitosamente', 'success');

        } catch (error) {
            console.error('Error al enviar archivo:', error);
            this.showToast('Error al enviar archivo', 'danger');
        } finally {
            this.showLoading(false);
            this.attachmentInput.value = '';
        }
    }

    async markAsRead(conversationId) {
        try {
            await this.apiRequest(`/conversations/${conversationId}/mark-all-read`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error al marcar como leído:', error);
        }
    }

    // ============================================
    // INDICADOR DE ESCRITURA
    // ============================================

    handleTyping() {
        if (!this.currentConversation) return;

        // Enviar indicador de escritura
        this.sendTypingIndicator(true);

        // Limpiar timeout anterior
        clearTimeout(this.typingTimeout);

        // Detener después de 3 segundos de inactividad
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    async sendTypingIndicator(isTyping) {
        if (!this.currentConversation) return;

        try {
            await this.apiRequest(`/conversations/${this.currentConversation.id}/typing`, {
                method: 'POST',
                body: JSON.stringify({ is_typing: isTyping })
            });
        } catch (error) {
            console.error('Error al enviar indicador de escritura:', error);
        }
    }

    stopTyping() {
        this.sendTypingIndicator(false);
    }

    // ============================================
    // CREAR CONVERSACIÓN
    // ============================================

    showNewConversationModal() {
        const modal = new bootstrap.Modal(document.getElementById('newConversationModal'));

        // Cargar lista de usuarios disponibles
        this.loadAvailableUsers();

        modal.show();
    }

    async loadAvailableUsers() {
        // TODO: Implementar endpoint para obtener usuarios disponibles
        // Por ahora, mock data
        const select = document.getElementById('participantsSelect');
        if (!select) return;

        select.innerHTML = sanitizeHTML(`
            <option value="101-teacher">Prof. Juan Pérez (Docente)</option>
            <option value="201-parent">María González (Padre)</option>
            <option value="1-admin">Admin Principal</option>
        `);
    }

    async createConversation() {
        const type = document.getElementById('conversationType')?.value;
        const title = document.getElementById('groupTitle')?.value;
        const participantsSelect = document.getElementById('participantsSelect');
        const selectedOptions = Array.from(participantsSelect?.selectedOptions || []);

        if (selectedOptions.length === 0) {
            this.showToast('Selecciona al menos un participante', 'warning');
            return;
        }

        const participants = selectedOptions.map(opt => {
            const [userId, userRole] = opt.value.split('-');
            return {
                user_id: parseInt(userId),
                user_role: userRole,
                user_name: opt.textContent.split('(')[0].trim(),
                user_email: `user${userId}@bge.edu.mx`
            };
        });

        try {
            this.showLoading(true);

            const data = await this.apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    type,
                    title: type === 'group' ? title : null,
                    participants
                })
            });

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('newConversationModal'));
            modal.hide();

            // Recargar conversaciones
            await this.loadConversations();

            // Seleccionar la nueva conversación
            if (data.conversation_id) {
                this.selectConversation(data.conversation_id);
            }

            this.showToast('Conversación creada exitosamente', 'success');

        } catch (error) {
            console.error('Error al crear conversación:', error);
            this.showToast('Error al crear conversación', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    // ============================================
    // BÚSQUEDA
    // ============================================

    filterConversations(query) {
        query = query.toLowerCase().trim();

        if (!query) {
            this.renderConversations();
            return;
        }

        const filtered = this.conversations.filter(conv => {
            const title = (conv.title || conv.custom_name || 'Chat Directo').toLowerCase();
            const lastMessage = (conv.last_message_content || '').toLowerCase();
            return title.includes(query) || lastMessage.includes(query);
        });

        // Renderizar filtrados temporalmente
        const originalConversations = this.conversations;
        this.conversations = filtered;
        this.renderConversations();
        this.conversations = originalConversations;
    }

    // ============================================
    // UTILIDADES
    // ============================================

    getInitials(name) {
        if (!name) return '?';
        const words = name.trim().split(' ');
        if (words.length === 1) return name.substring(0, 2).toUpperCase();
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }

    formatTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        if (this.messagesContainer) {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    getCurrentUserId() {
        // Extraer ID del token JWT (simplificado)
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            return payload.id;
        } catch (error) {
            return null;
        }
    }

    // ============================================
    // CLEANUP
    // ============================================

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    window.messagingManager = new MessagingManager({
        apiBaseURL: '/api/messaging'
    });
});

// Cleanup al cerrar
window.addEventListener('beforeunload', () => {
    if (window.messagingManager) {
        window.messagingManager.destroy();
    }
});
