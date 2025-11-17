/**
 * 🤖 AI CHATBOT WIDGET - GPT-4 POWERED
 * SEMANA 18 - Frontend Chat Interface
 *
 * Widget flotante de chat con GPT-4, animaciones, typing indicators,
 * message history, multi-language support y responsive design.
 *
 * Uso:
 * <script src="/public/js/ai-chatbot-widget.js"></script>
 * <script>
 *   const chatbot = new AIChatbotWidget({
 *     position: 'bottom-right', // o 'bottom-left'
 *     theme: 'light', // o 'dark'
 *     language: 'es', // o 'en'
 *     apiBaseUrl: '/api/ai-chatbot'
 *   });
 *   chatbot.init();
 * </script>
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

class AIChatbotWidget {
  constructor(options = {}) {
    // Configuración
    this.config = {
      position: options.position || 'bottom-right',
      theme: options.theme || 'light',
      language: options.language || 'es',
      apiBaseUrl: options.apiBaseUrl || '/api/ai-chatbot',
      showWelcomeMessage: options.showWelcomeMessage !== false,
      enableSoundEffects: options.enableSoundEffects || false,
      maxHistoryMessages: options.maxHistoryMessages || 50
    };

    // Estado
    this.state = {
      isOpen: false,
      isTyping: false,
      isConnected: true,
      messages: [],
      sessionId: this.generateSessionId(),
      userId: null
    };

    // Referencias DOM
    this.elements = {};

    // Mensajes de bienvenida por idioma
    this.welcomeMessages = {
      es: {
        title: '¡Hola! 👋',
        message: 'Soy tu asistente virtual del Bachillerato Héroes de la Patria. ¿En qué puedo ayudarte hoy?',
        placeholder: 'Escribe tu mensaje...'
      },
      en: {
        title: 'Hello! 👋',
        message: 'I\'m your virtual assistant from Bachillerato Héroes de la Patria. How can I help you today?',
        placeholder: 'Type your message...'
      }
    };
  }

  // ===========================================================================
  // INICIALIZACIÓN
  // ===========================================================================

  init() {
    console.log('[AI-CHATBOT] Initializing widget...');

    // Crear elementos DOM
    this.createWidget();

    // Event listeners
    this.attachEventListeners();

    // Cargar historial si usuario está autenticado
    this.loadChatHistory();

    // Mostrar mensaje de bienvenida
    if (this.config.showWelcomeMessage) {
      this.showWelcomeMessage();
    }

    // Check health
    this.checkHealth();

    console.log('[AI-CHATBOT] Widget initialized successfully');
  }

  /**
   * Crea estructura HTML del widget
   */
  createWidget() {
    const lang = this.welcomeMessages[this.config.language];

    const widgetHTML = `
      <!-- Botón flotante -->
      <div id="ai-chatbot-toggle" class="ai-chatbot-toggle ${this.config.position}">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15c4.418 0 8-1.79 8-4 0-1.873-1.73-3.46-4.293-3.912-.264-1.055-.968-1.979-1.965-2.609C9.597 3.93 8.82 3.5 8 3.5c-.82 0-1.597.43-2.242.98-.997.629-1.701 1.553-1.965 2.608C1.23 7.54 0 9.127 0 11c0 2.21 3.582 4 8 4zm0-1c-3.866 0-7-1.343-7-3 0-1.06 1.008-2.021 2.569-2.647l.36-.145.074-.36c.264-1.254 1.433-2.098 2.597-2.098 1.164 0 2.333.844 2.597 2.098l.074.36.36.145C13.992 8.979 15 9.94 15 11c0 1.657-3.134 3-7 3z"/>
          <path d="M6 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm4 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
        </svg>
        <span class="ai-chatbot-notification-badge" style="display: none;">1</span>
      </div>

      <!-- Ventana de chat -->
      <div id="ai-chatbot-container" class="ai-chatbot-container ${this.config.position} ${this.config.theme}" style="display: none;">
        <!-- Header -->
        <div class="ai-chatbot-header">
          <div class="ai-chatbot-header-left">
            <div class="ai-chatbot-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15c4.418 0 8-1.79 8-4 0-1.873-1.73-3.46-4.293-3.912-.264-1.055-.968-1.979-1.965-2.609C9.597 3.93 8.82 3.5 8 3.5c-.82 0-1.597.43-2.242.98-.997.629-1.701 1.553-1.965 2.608C1.23 7.54 0 9.127 0 11c0 2.21 3.582 4 8 4zm0-1c-3.866 0-7-1.343-7-3 0-1.06 1.008-2.021 2.569-2.647l.36-.145.074-.36c.264-1.254 1.433-2.098 2.597-2.098 1.164 0 2.333.844 2.597 2.098l.074.36.36.145C13.992 8.979 15 9.94 15 11c0 1.657-3.134 3-7 3z"/>
                <path d="M6 10.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm4 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z"/>
              </svg>
            </div>
            <div class="ai-chatbot-header-info">
              <div class="ai-chatbot-title">Asistente Virtual</div>
              <div class="ai-chatbot-status">
                <span class="ai-chatbot-status-dot"></span>
                <span class="ai-chatbot-status-text">En línea</span>
              </div>
            </div>
          </div>
          <div class="ai-chatbot-header-right">
            <button class="ai-chatbot-header-btn" id="ai-chatbot-minimize" title="Minimizar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="ai-chatbot-messages" id="ai-chatbot-messages">
          <!-- Mensajes se cargan aquí dinámicamente -->
        </div>

        <!-- Typing Indicator -->
        <div class="ai-chatbot-typing-indicator" id="ai-chatbot-typing" style="display: none;">
          <div class="ai-chatbot-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span class="ai-chatbot-typing-text">El asistente está escribiendo...</span>
        </div>

        <!-- Input Area -->
        <div class="ai-chatbot-input-area">
          <div class="ai-chatbot-input-wrapper">
            <textarea
              id="ai-chatbot-input"
              class="ai-chatbot-input"
              placeholder="${lang.placeholder}"
              rows="1"
              maxlength="1000"
            ></textarea>
            <button id="ai-chatbot-send" class="ai-chatbot-send-btn" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
              </svg>
            </button>
          </div>
          <div class="ai-chatbot-input-footer">
            <small class="ai-chatbot-powered-by">
              Powered by GPT-4 Turbo 🤖
            </small>
          </div>
        </div>
      </div>
    `;

    // Insertar en el DOM
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    // Guardar referencias
    this.elements = {
      toggle: document.getElementById('ai-chatbot-toggle'),
      container: document.getElementById('ai-chatbot-container'),
      messages: document.getElementById('ai-chatbot-messages'),
      input: document.getElementById('ai-chatbot-input'),
      sendBtn: document.getElementById('ai-chatbot-send'),
      typing: document.getElementById('ai-chatbot-typing'),
      minimize: document.getElementById('ai-chatbot-minimize')
    };

    // Inyectar estilos CSS
    this.injectStyles();
  }

  /**
   * Inyecta estilos CSS dinámicamente
   */
  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ========== CHATBOT WIDGET STYLES ========== */

      .ai-chatbot-toggle {
        position: fixed;
        bottom: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        z-index: 9998;
      }

      .ai-chatbot-toggle.bottom-right {
        right: 20px;
      }

      .ai-chatbot-toggle.bottom-left {
        left: 20px;
      }

      .ai-chatbot-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }

      .ai-chatbot-notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        border: 2px solid white;
      }

      .ai-chatbot-container {
        position: fixed;
        bottom: 100px;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        animation: slideInUp 0.3s ease-out;
      }

      .ai-chatbot-container.bottom-right {
        right: 20px;
      }

      .ai-chatbot-container.bottom-left {
        left: 20px;
      }

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Dark Theme */
      .ai-chatbot-container.dark {
        background: #1a1a2e;
        color: #eee;
      }

      .ai-chatbot-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .ai-chatbot-header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ai-chatbot-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ai-chatbot-title {
        font-weight: 600;
        font-size: 16px;
      }

      .ai-chatbot-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        opacity: 0.9;
      }

      .ai-chatbot-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #2ecc71;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .ai-chatbot-header-btn {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        padding: 6px;
        border-radius: 6px;
        transition: background 0.2s;
      }

      .ai-chatbot-header-btn:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .ai-chatbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-chatbot-container.dark .ai-chatbot-messages {
        background: #16213e;
      }

      .ai-chatbot-message {
        display: flex;
        gap: 10px;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .ai-chatbot-message.user {
        justify-content: flex-end;
      }

      .ai-chatbot-message-bubble {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 16px;
        word-wrap: break-word;
        line-height: 1.5;
      }

      .ai-chatbot-message.bot .ai-chatbot-message-bubble {
        background: white;
        color: #333;
        border-bottom-left-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .ai-chatbot-container.dark .ai-chatbot-message.bot .ai-chatbot-message-bubble {
        background: #0f3460;
        color: #eee;
      }

      .ai-chatbot-message.user .ai-chatbot-message-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 4px;
      }

      .ai-chatbot-message-time {
        font-size: 11px;
        opacity: 0.6;
        margin-top: 4px;
      }

      .ai-chatbot-typing-indicator {
        padding: 12px 20px;
        background: white;
        border-top: 1px solid #e9ecef;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .ai-chatbot-container.dark .ai-chatbot-typing-indicator {
        background: #0f3460;
        border-top-color: #1a1a2e;
      }

      .ai-chatbot-typing-dots {
        display: flex;
        gap: 4px;
      }

      .ai-chatbot-typing-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #667eea;
        animation: typingBounce 1.4s ease-in-out infinite;
      }

      .ai-chatbot-typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .ai-chatbot-typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typingBounce {
        0%, 60%, 100% {
          transform: translateY(0);
        }
        30% {
          transform: translateY(-8px);
        }
      }

      .ai-chatbot-typing-text {
        font-size: 13px;
        color: #6c757d;
      }

      .ai-chatbot-input-area {
        padding: 16px 20px;
        background: white;
        border-top: 1px solid #e9ecef;
      }

      .ai-chatbot-container.dark .ai-chatbot-input-area {
        background: #0f3460;
        border-top-color: #1a1a2e;
      }

      .ai-chatbot-input-wrapper {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }

      .ai-chatbot-input {
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #dee2e6;
        border-radius: 20px;
        font-size: 14px;
        font-family: inherit;
        resize: none;
        max-height: 100px;
        overflow-y: auto;
      }

      .ai-chatbot-container.dark .ai-chatbot-input {
        background: #16213e;
        color: #eee;
        border-color: #1a1a2e;
      }

      .ai-chatbot-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .ai-chatbot-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }

      .ai-chatbot-send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .ai-chatbot-send-btn:not(:disabled):hover {
        transform: scale(1.1);
      }

      .ai-chatbot-input-footer {
        margin-top: 8px;
        text-align: center;
      }

      .ai-chatbot-powered-by {
        font-size: 11px;
        color: #6c757d;
      }

      /* Responsive */
      @media (max-width: 480px) {
        .ai-chatbot-container {
          width: calc(100vw - 40px);
          height: calc(100vh - 140px);
        }
      }
    `;

    document.head.appendChild(style);
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  attachEventListeners() {
    // Toggle chat window
    this.elements.toggle.addEventListener('click', () => this.toggleChat());

    // Minimize
    this.elements.minimize.addEventListener('click', () => this.toggleChat());

    // Send message on button click
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

    // Send message on Enter (Shift+Enter for new line)
    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Enable/disable send button based on input
    this.elements.input.addEventListener('input', () => {
      const hasText = this.elements.input.value.trim().length > 0;
      this.elements.sendBtn.disabled = !hasText;

      // Auto-resize textarea
      this.elements.input.style.height = 'auto';
      this.elements.input.style.height = this.elements.input.scrollHeight + 'px';
    });
  }

  // ===========================================================================
  // UI INTERACTIONS
  // ===========================================================================

  toggleChat() {
    this.state.isOpen = !this.state.isOpen;

    if (this.state.isOpen) {
      this.elements.container.style.display = 'flex';
      this.elements.input.focus();
      this.scrollToBottom();
    } else {
      this.elements.container.style.display = 'none';
    }
  }

  showWelcomeMessage() {
    const lang = this.welcomeMessages[this.config.language];

    setTimeout(() => {
      this.addMessage({
        role: 'assistant',
        content: lang.message,
        timestamp: new Date()
      });
    }, 500);
  }

  addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chatbot-message ${message.role === 'user' ? 'user' : 'bot'}`;

    const bubble = document.createElement('div');
    bubble.className = 'ai-chatbot-message-bubble';
    bubble.textContent = message.content;

    const time = document.createElement('div');
    time.className = 'ai-chatbot-message-time';
    time.textContent = this.formatTime(message.timestamp);

    bubble.appendChild(time);
    messageDiv.appendChild(bubble);

    this.elements.messages.appendChild(messageDiv);
    this.scrollToBottom();

    // Guardar en estado
    this.state.messages.push(message);

    // Limitar historial
    if (this.state.messages.length > this.config.maxHistoryMessages) {
      this.state.messages.shift();
    }
  }

  showTypingIndicator() {
    this.state.isTyping = true;
    this.elements.typing.style.display = 'flex';
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.state.isTyping = false;
    this.elements.typing.style.display = 'none';
  }

  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  // ===========================================================================
  // API COMMUNICATION
  // ===========================================================================

  async sendMessage() {
    const messageText = this.elements.input.value.trim();

    if (!messageText) return;

    // Agregar mensaje del usuario al UI
    this.addMessage({
      role: 'user',
      content: messageText,
      timestamp: new Date()
    });

    // Limpiar input
    this.elements.input.value = '';
    this.elements.input.style.height = 'auto';
    this.elements.sendBtn.disabled = true;

    // Mostrar typing indicator
    this.showTypingIndicator();

    try {
      // Llamar a API
      const response = await fetch(`${this.config.apiBaseUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          message: messageText,
          language: this.config.language,
          includeContext: true
        })
      });

      const data = await response.json();

      // Ocultar typing indicator
      this.hideTypingIndicator();

      if (data.success) {
        // Agregar respuesta del asistente
        this.addMessage({
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        });
      } else {
        // Error del servidor
        this.addMessage({
          role: 'assistant',
          content: data.message || data.fallback || 'Lo siento, ocurrió un error. Intenta nuevamente.',
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('[AI-CHATBOT] Error sending message:', error);

      this.hideTypingIndicator();

      this.addMessage({
        role: 'assistant',
        content: 'Lo siento, no pude conectarme con el servidor. Verifica tu conexión a internet.',
        timestamp: new Date()
      });
    }
  }

  async loadChatHistory() {
    try {
      const token = this.getAuthToken();

      if (!token) {
        console.log('[AI-CHATBOT] No auth token - skipping history load');
        return;
      }

      const response = await fetch(`${this.config.apiBaseUrl}/history?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Renderizar historial
        if (data.history && data.history.length > 0) {
          data.history.forEach(msg => {
            this.addMessage({
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at || Date.now())
            });
          });
        }
      }

    } catch (error) {
      console.error('[AI-CHATBOT] Error loading history:', error);
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/health`);
      const data = await response.json();

      this.state.isConnected = data.status === 'healthy';

      if (!this.state.isConnected) {
        console.warn('[AI-CHATBOT] Service unhealthy:', data);
      }

    } catch (error) {
      console.error('[AI-CHATBOT] Health check failed:', error);
      this.state.isConnected = false;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  getAuthToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  }

  formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// =============================================================================
// EXPORT & AUTO-INIT
// =============================================================================

window.AIChatbotWidget = AIChatbotWidget;

// Auto-init si se incluye data-auto-init="true"
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[src*="ai-chatbot-widget.js"]');

  if (script && script.dataset.autoInit === 'true') {
    window.aiChatbot = new AIChatbotWidget({
      position: script.dataset.position || 'bottom-right',
      theme: script.dataset.theme || 'light',
      language: script.dataset.language || 'es'
    });

    window.aiChatbot.init();

    console.log('[AI-CHATBOT] Auto-initialized from script tag');
  }
});
