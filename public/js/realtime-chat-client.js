/**
 * 🔌 REAL-TIME CHAT CLIENT
 * Cliente WebSocket para comunicación en tiempo real
 * Creado: 19 Enero 2026
 */

class RealtimeChatClient {
    constructor(options = {}) {
        this.serverUrl = options.serverUrl || window.location.origin;
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.currentConversation = null;
        this.messageHandlers = new Map();
        this.typingTimer = null;

        // Event callbacks
        this.onConnect = options.onConnect || (() => { });
        this.onDisconnect = options.onDisconnect || (() => { });
        this.onMessage = options.onMessage || (() => { });
        this.onTyping = options.onTyping || (() => { });
        this.onNotification = options.onNotification || (() => { });
        this.onPresenceUpdate = options.onPresenceUpdate || (() => { });
        this.onError = options.onError || (() => { });
    }

    /**
     * Connect to WebSocket server
     */
    async connect() {
        if (this.socket?.connected) {
            console.log('[RealtimeChat] Already connected');
            return;
        }

        const token = this.getAuthToken();
        if (!token) {
            console.warn('[RealtimeChat] No auth token available');
            this.onError({ message: 'No authentication token' });
            return;
        }

        try {
            // Dynamic import socket.io-client
            if (typeof io === 'undefined') {
                await this.loadSocketIO();
            }

            this.socket = io(this.serverUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectDelay
            });

            this.setupEventListeners();

        } catch (error) {
            console.error('[RealtimeChat] Connection error:', error);
            this.onError(error);
        }
    }

    /**
     * Load Socket.io client library dynamically
     */
    loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (typeof io !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.4/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Setup socket event listeners
     */
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('[RealtimeChat] ✅ Connected');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.onConnect();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[RealtimeChat] 🔌 Disconnected:', reason);
            this.connected = false;
            this.onDisconnect(reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[RealtimeChat] Connection error:', error);
            this.reconnectAttempts++;
            this.onError(error);
        });

        // Chat events
        this.socket.on('chat:message', (message) => {
            console.log('[RealtimeChat] 📩 New message:', message);
            this.onMessage(message);
            this.triggerMessageHandlers(message.conversation_id, message);
        });

        this.socket.on('chat:typing', (data) => {
            this.onTyping(data);
        });

        this.socket.on('chat:error', (error) => {
            console.error('[RealtimeChat] Chat error:', error);
            this.onError(error);
        });

        // Notification events
        this.socket.on('notification:new', (notification) => {
            console.log('[RealtimeChat] 🔔 New notification:', notification);
            this.onNotification(notification);
            this.showNotificationToast(notification);
        });

        this.socket.on('notification:read:confirmed', (data) => {
            console.log('[RealtimeChat] Notification marked as read:', data.id);
        });

        // Presence events
        this.socket.on('presence:update', (data) => {
            this.onPresenceUpdate(data);
        });
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    // === CHAT METHODS ===

    /**
     * Join a conversation
     */
    joinConversation(conversationId) {
        if (!this.socket || !this.connected) {
            console.warn('[RealtimeChat] Not connected');
            return;
        }

        this.currentConversation = conversationId;
        this.socket.emit('chat:join', conversationId);
        console.log('[RealtimeChat] Joined conversation:', conversationId);
    }

    /**
     * Leave current conversation
     */
    leaveConversation() {
        if (!this.socket || !this.currentConversation) return;

        this.socket.emit('chat:leave', this.currentConversation);
        this.currentConversation = null;
    }

    /**
     * Send a message
     */
    sendMessage(content, type = 'text', attachments = []) {
        if (!this.socket || !this.connected) {
            console.warn('[RealtimeChat] Not connected');
            return false;
        }

        if (!this.currentConversation) {
            console.warn('[RealtimeChat] No active conversation');
            return false;
        }

        const message = {
            conversation_id: this.currentConversation,
            content: content,
            type: type,
            attachments: attachments
        };

        this.socket.emit('chat:message', message);
        return true;
    }

    /**
     * Send typing indicator
     */
    sendTypingIndicator(isTyping = true) {
        if (!this.socket || !this.currentConversation) return;

        this.socket.emit('chat:typing', {
            conversationId: this.currentConversation,
            isTyping
        });

        // Auto-stop typing after 3 seconds
        if (isTyping) {
            clearTimeout(this.typingTimer);
            this.typingTimer = setTimeout(() => {
                this.sendTypingIndicator(false);
            }, 3000);
        }
    }

    /**
     * Register message handler for conversation
     */
    onMessageInConversation(conversationId, handler) {
        if (!this.messageHandlers.has(conversationId)) {
            this.messageHandlers.set(conversationId, []);
        }
        this.messageHandlers.get(conversationId).push(handler);
    }

    /**
     * Trigger message handlers
     */
    triggerMessageHandlers(conversationId, message) {
        const handlers = this.messageHandlers.get(conversationId) || [];
        handlers.forEach(handler => handler(message));
    }

    // === NOTIFICATION METHODS ===

    /**
     * Mark notification as read
     */
    markNotificationRead(notificationId) {
        if (!this.socket) return;
        this.socket.emit('notification:read', notificationId);
    }

    /**
     * Show notification toast
     */
    showNotificationToast(notification) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';

        const bgClass = {
            'info': 'bg-info',
            'success': 'bg-success',
            'warning': 'bg-warning',
            'error': 'bg-danger'
        }[notification.type] || 'bg-primary';

        toast.innerHTML = `
            <div class="toast-header ${bgClass} text-white">
                <i class="bi bi-bell me-2"></i>
                <strong class="me-auto">${this.escapeHtml(notification.title)}</strong>
                <small>Ahora</small>
                <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">
                ${this.escapeHtml(notification.message)}
                ${notification.action_url ? `<div class="mt-2"><a href="${notification.action_url}" class="btn btn-sm btn-primary">Ver más</a></div>` : ''}
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => toast.remove(), 5000);

        // Play notification sound
        this.playNotificationSound();
    }

    /**
     * Play notification sound
     */
    playNotificationSound() {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        } catch (e) {
            // Ignore audio errors
        }
    }

    // === PRESENCE METHODS ===

    /**
     * Update user status
     */
    setStatus(status) {
        if (!this.socket) return;
        this.socket.emit('presence:status', status);
    }

    // === UTILITY METHODS ===

    /**
     * Get auth token from storage
     */
    getAuthToken() {
        return localStorage.getItem('authToken') ||
            localStorage.getItem('token') ||
            localStorage.getItem('bge_auth_token') ||
            sessionStorage.getItem('authToken');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Check connection status
     */
    isConnected() {
        return this.connected && this.socket?.connected;
    }
}

// Global instance
window.RealtimeChatClient = RealtimeChatClient;

// Auto-initialize if on messaging page
document.addEventListener('DOMContentLoaded', () => {
    // Initialize only on pages that need real-time chat
    const chatContainer = document.querySelector('[data-realtime-chat]');
    if (chatContainer) {
        window.realtimeChat = new RealtimeChatClient({
            onConnect: () => {
                console.log('🟢 Chat connected');
                chatContainer.classList.add('chat-connected');
            },
            onDisconnect: () => {
                console.log('🔴 Chat disconnected');
                chatContainer.classList.remove('chat-connected');
            },
            onMessage: (msg) => {
                // Dispatch custom event for message handling
                document.dispatchEvent(new CustomEvent('realtime:message', { detail: msg }));
            },
            onNotification: (notif) => {
                document.dispatchEvent(new CustomEvent('realtime:notification', { detail: notif }));
            }
        });
        window.realtimeChat.connect();
    }
});
