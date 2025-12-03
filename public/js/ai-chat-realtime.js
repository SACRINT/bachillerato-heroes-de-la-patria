/**
 * 💬 CHAT IA EN TIEMPO REAL BGE
 * Sistema de conversación inteligente integrado con gamificación
 */

class AIChatRealtime {
    constructor() {
        this.currentUser = null;
        this.isOpen = false;
        this.conversationHistory = [];
        this.availablePrompts = [];
        this.chatContainer = null;
        this.typingIndicator = false;
        this.responseDelay = 1500; // Simular tiempo de respuesta realista
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadConversationHistory();
        this.loadAvailablePrompts();
        this.createChatUI();
        this.setupKeyboardShortcuts();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadConversationHistory() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_chat_${this.currentUser.email}`);
        if (saved) {
            this.conversationHistory = JSON.parse(saved);
        }
    }

    loadAvailablePrompts() {
        if (!this.currentUser) return;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        if (progress) {
            const userData = JSON.parse(progress);
            this.availablePrompts = userData.unlockedPrompts || ['basic-summary'];
        } else {
            this.availablePrompts = ['basic-summary'];
        }
    }

    createChatUI() {
        // Botón flotante para abrir chat
        const chatButton = document.createElement('div');
        chatButton.id = 'aiChatButton';
        chatButton.className = 'position-fixed';
        chatButton.style.cssText = `
            bottom: 30px;
            right: 30px;
            z-index: 1000;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            animation: pulse 2s infinite;
        `;

        chatButton.innerHTML = DOMPurify.sanitize(`
            <i class="fas fa-robot text-white" style="font-size: 1.5rem;"></i>
        `);

        chatButton.onclick = () => this.toggleChat();

        // Hover effects
        chatButton.onmouseenter = () => {
            chatButton.style.transform = 'scale(1.1)';
            chatButton.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
        };

        chatButton.onmouseleave = () => {
            chatButton.style.transform = 'scale(1)';
            chatButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        };

        document.body.appendChild(chatButton);

        // Crear container del chat (inicialmente oculto)
        this.createChatContainer();

        // Agregar estilos CSS
        this.addChatStyles();
    }

    createChatContainer() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'aiChatContainer';
        chatContainer.className = 'position-fixed';
        chatContainer.style.cssText = `
            bottom: 100px;
            right: 30px;
            width: 350px;
            height: 500px;
            z-index: 1001;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.1);
        `;

        chatContainer.innerHTML = DOMPurify.sanitize(this.generateChatHTML());
        document.body.appendChild(chatContainer);

        this.chatContainer = chatContainer;
        this.setupChatEvents();
    }

    generateChatHTML() {
        return `
            <!-- Header del chat -->
            <div class="chat-header p-3 text-white" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        <div class="me-2">
                            <i class="fas fa-robot" style="font-size: 1.2rem;"></i>
                        </div>
                        <div>
                            <h6 class="mb-0">IA BGE Assistant</h6>
                            <small class="opacity-75">Tu tutor personal</small>
                        </div>
                    </div>
                    <button class="btn btn-sm text-white" onclick="aiChatRealtime.toggleChat()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Área de mensajes -->
            <div id="chatMessages" class="flex-grow-1 p-3 overflow-auto" style="height: 350px; background: #f8f9fa;">
                ${this.generateWelcomeMessage()}
                ${this.renderConversationHistory()}
            </div>

            <!-- Indicador de escritura -->
            <div id="typingIndicator" class="px-3 py-2 d-none">
                <div class="d-flex align-items-center text-muted">
                    <div class="typing-animation me-2">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <small>IA está escribiendo...</small>
                </div>
            </div>

            <!-- Input área -->
            <div class="chat-input p-3 border-top">
                <div class="d-flex align-items-center">
                    <input type="text" id="chatInput" class="form-control me-2" placeholder="Escribe tu pregunta..."
                           style="border-radius: 20px; border: 1px solid #ddd;">
                    <button id="sendButton" class="btn btn-primary rounded-circle" style="width: 40px; height: 40px;">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <div class="d-flex flex-wrap gap-1">
                        ${this.generateQuickPrompts()}
                    </div>
                </div>
            </div>
        `;
    }

    generateWelcomeMessage() {
        if (!this.currentUser) {
            return `
                <div class="message-bubble ai-message mb-3">
                    <div class="message-content">
                        <p class="mb-1">🔒 <strong>Inicia sesión para acceder al chat IA</strong></p>
                        <small class="text-muted">Necesitas estar autenticado para usar el asistente IA personalizado.</small>
                    </div>
                </div>
            `;
        }

        const userName = this.currentUser.name.split(' ')[0];
        const userLevel = this.getUserLevel();

        return `
            <div class="message-bubble ai-message mb-3">
                <div class="message-avatar">🤖</div>
                <div class="message-content">
                    <p class="mb-1">¡Hola ${userName}! 👋</p>
                    <p class="mb-1">Soy tu asistente IA de BGE. Estás en <strong>Nivel ${userLevel}</strong> con acceso a <strong>${this.availablePrompts.length} prompts</strong>.</p>
                    <small class="text-muted">Pregúntame sobre cualquier materia, pide ayuda con tareas, o usa los prompts rápidos de abajo.</small>
                </div>
            </div>
        `;
    }

    renderConversationHistory() {
        return this.conversationHistory.map(msg => {
            const isUser = msg.type === 'user';
            return `
                <div class="message-bubble ${isUser ? 'user-message' : 'ai-message'} mb-3">
                    ${!isUser ? '<div class="message-avatar">🤖</div>' : ''}
                    <div class="message-content">
                        <p class="mb-1">${msg.content}</p>
                        <small class="text-muted">${new Date(msg.timestamp).toLocaleTimeString()}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateQuickPrompts() {
        const quickPrompts = [
            { text: '📚 Resumir texto', action: 'resume' },
            { text: '❓ Explicar concepto', action: 'explain' },
            { text: '🧮 Resolver problema', action: 'solve' },
            { text: '📝 Ayuda con tarea', action: 'homework' }
        ];

        return quickPrompts.map(prompt => `
            <button class="btn btn-outline-primary btn-sm" onclick="aiChatRealtime.useQuickPrompt('${prompt.action}')">
                ${prompt.text}
            </button>
        `).join('');
    }

    addChatStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .message-bubble {
                display: flex;
                align-items: flex-start;
                animation: slideIn 0.3s ease;
            }

            .user-message {
                justify-content: flex-end;
            }

            .user-message .message-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 10px 15px;
                border-radius: 20px 20px 5px 20px;
                max-width: 80%;
            }

            .ai-message {
                justify-content: flex-start;
            }

            .ai-message .message-content {
                background: white;
                color: #333;
                padding: 10px 15px;
                border-radius: 20px 20px 20px 5px;
                max-width: 80%;
                border: 1px solid #e9ecef;
                margin-left: 10px;
            }

            .message-avatar {
                width: 30px;
                height: 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                flex-shrink: 0;
            }

            .typing-animation {
                display: flex;
                align-items: center;
            }

            .typing-animation span {
                width: 4px;
                height: 4px;
                background: #007bff;
                border-radius: 50%;
                margin: 0 1px;
                animation: typing 1.4s infinite;
            }

            .typing-animation span:nth-child(2) {
                animation-delay: 0.2s;
            }

            .typing-animation span:nth-child(3) {
                animation-delay: 0.4s;
            }

            @keyframes typing {
                0%, 60%, 100% {
                    transform: translateY(0);
                }
                30% {
                    transform: translateY(-10px);
                }
            }

            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            #chatMessages {
                scroll-behavior: smooth;
            }

            #chatInput:focus {
                outline: none;
                border-color: #667eea !important;
                box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25) !important;
            }
        `;

        document.head.appendChild(styles);
    }

    setupChatEvents() {
        const input = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');

        // Enviar mensaje con Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Enviar con botón
        sendButton.addEventListener('click', () => this.sendMessage());

        // Auto-resize del chat container
        window.addEventListener('resize', () => this.adjustChatPosition());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + / para abrir/cerrar chat
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                this.toggleChat();
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.openChat();
        } else {
            this.closeChat();
        }
    }

    openChat() {
        if (!this.currentUser) {
            alert('🔒 Debes iniciar sesión para usar el chat IA.');
            return;
        }

        this.chatContainer.style.display = 'flex';
        this.chatContainer.style.animation = 'slideInUp 0.3s ease';

        // Focus en el input
        setTimeout(() => {
            document.getElementById('chatInput').focus();
        }, 300);

        // Scroll al final de los mensajes
        this.scrollToBottom();

        // Tracking
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('chat_opened', {
                userLevel: this.getUserLevel(),
                availablePrompts: this.availablePrompts.length
            });
        }
    }

    closeChat() {
        this.chatContainer.style.animation = 'slideOutDown 0.3s ease';

        setTimeout(() => {
            this.chatContainer.style.display = 'none';
        }, 300);
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (!message) return;

        // Agregar mensaje del usuario
        this.addMessage('user', message);
        input.value = '';

        // Mostrar indicador de escritura
        this.showTypingIndicator();

        // Simular respuesta de IA con delay realista
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateAIResponse(message);
            this.addMessage('ai', response);

            // Otorgar XP por usar chat
            this.awardChatXP();
        }, this.responseDelay);
    }

    addMessage(type, content) {
        const timestamp = new Date().toISOString();

        // Agregar a historial
        this.conversationHistory.push({
            type,
            content,
            timestamp
        });

        // Renderizar mensaje
        const messagesContainer = document.getElementById('chatMessages');
        const isUser = type === 'user';

        const messageHTML = `
            <div class="message-bubble ${isUser ? 'user-message' : 'ai-message'} mb-3">
                ${!isUser ? '<div class="message-avatar">🤖</div>' : ''}
                <div class="message-content">
                    <p class="mb-1">${content}</p>
                    <small class="text-muted">${new Date(timestamp).toLocaleTimeString()}</small>
                </div>
            </div>
        `;

        messagesContainer.insertAdjacentHTML('beforeend', DOMPurify.sanitize( DOMPurify.sanitize(messageHTML)));
        this.scrollToBottom();

        // Guardar historial
        this.saveConversationHistory();

        // Tracking
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('chat_message_sent', {
                type,
                messageLength: content.length
            });
        }
    }

    generateAIResponse(userMessage) {
        const message = userMessage.toLowerCase();

        // Respuestas contextuales inteligentes
        if (message.includes('matemáticas') || message.includes('matematicas')) {
            return this.getMathResponse(userMessage);
        }

        if (message.includes('física') || message.includes('fisica')) {
            return this.getPhysicsResponse(userMessage);
        }

        if (message.includes('química') || message.includes('quimica')) {
            return this.getChemistryResponse(userMessage);
        }

        if (message.includes('biología') || message.includes('biologia')) {
            return this.getBiologyResponse(userMessage);
        }

        if (message.includes('tarea') || message.includes('homework')) {
            return this.getHomeworkResponse(userMessage);
        }

        if (message.includes('examen') || message.includes('test')) {
            return this.getExamResponse(userMessage);
        }

        if (message.includes('nivel') || message.includes('progreso')) {
            return this.getProgressResponse();
        }

        // Respuesta general inteligente
        return this.getGeneralResponse(userMessage);
    }

    getMathResponse(message) {
        const responses = [
            `🧮 Para resolver problemas de matemáticas, te recomiendo seguir estos pasos:\n\n1. Lee el problema cuidadosamente\n2. Identifica qué te piden encontrar\n3. Escribe las fórmulas relevantes\n4. Sustituye los valores\n5. Calcula paso a paso\n\n¿En qué tema específico necesitas ayuda?`,

            `📐 En matemáticas de BGE, es importante dominar:\n\n• Álgebra: ecuaciones y sistemas\n• Geometría: áreas y volúmenes\n• Trigonometría: funciones básicas\n• Cálculo: límites y derivadas\n\n¿Cuál te está causando más dificultad?`,

            `💡 Tip de matemáticas: Siempre verifica tu respuesta sustituyendo en la ecuación original. ¿Necesitas ayuda con algún ejercicio específico?`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    getPhysicsResponse(message) {
        return `⚛️ En física, recuerda estos principios fundamentales:\n\n• Siempre identifica las fuerzas actuantes\n• Usa las unidades correctas (SI)\n• Dibuja diagramas de cuerpo libre\n• Aplica las leyes de Newton\n\n¿Estás trabajando con cinemática, dinámica, o energía?`;
    }

    getChemistryResponse(message) {
        return `🧪 Para química, te sugiero:\n\n• Memoriza gradualmente la tabla periódica\n• Practica balanceo de ecuaciones\n• Entiende conceptos de mol y estequiometría\n• Usa modelos moleculares para visualizar\n\n¿Necesitas ayuda con reacciones químicas o cálculos?`;
    }

    getBiologyResponse(message) {
        return `🧬 En biología es clave:\n\n• Usar mapas conceptuales\n• Relacionar estructura con función\n• Estudiar con diagramas\n• Conectar con ejemplos reales\n\n¿Estás viendo célula, genética, o sistemas del cuerpo?`;
    }

    getHomeworkResponse(message) {
        return `📝 Para hacer tareas efectivamente:\n\n1. Organiza tu espacio de estudio\n2. Elimina distracciones\n3. Usa la técnica Pomodoro (25min estudio + 5min descanso)\n4. Haz pausas activas\n\n¿En qué materia necesitas ayuda específica?`;
    }

    getExamResponse(message) {
        return `📚 Para prepararte para exámenes:\n\n• Estudia 1 semana antes (no el día anterior)\n• Haz resúmenes y mapas mentales\n• Practica con exámenes anteriores\n• Duerme bien la noche previa\n• Llega temprano y con materiales\n\n¿Qué examen tienes próximamente?`;
    }

    getProgressResponse() {
        const userLevel = this.getUserLevel();
        const coins = this.getUserCoins();

        return `🎯 Tu progreso actual en BGE:\n\n• Nivel: ${userLevel}\n• IA Coins: ${coins}\n• Prompts desbloqueadoss: ${this.availablePrompts.length}\n\n¡Sigue así! Cada vez que usas el chat IA ganas XP. ¿Qué objetivo quieres alcanzar próximamente?`;
    }

    getGeneralResponse(message) {
        const responses = [
            `Interesante pregunta. Como tu asistente IA de BGE, estoy aquí para ayudarte con cualquier materia. ¿Podrías ser más específico sobre lo que necesitas?`,

            `🤔 Entiendo tu consulta. Para darte la mejor ayuda posible, ¿podrías decirme de qué materia es tu pregunta?`,

            `¡Excelente que uses el chat IA! Estoy programado para ayudarte con matemáticas, física, química, biología y más. ¿En qué puedo apoyarte específicamente?`,

            `Como estudiante de BGE nivel ${this.getUserLevel()}, tienes acceso a ${this.availablePrompts.length} prompts especializados. ¿Quieres que te ayude con algún tema en particular?`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    useQuickPrompt(action) {
        const prompts = {
            resume: '📚 ¿Podrías ayudarme a resumir este texto?',
            explain: '❓ ¿Puedes explicarme este concepto?',
            solve: '🧮 ¿Me ayudas a resolver este problema?',
            homework: '📝 Necesito ayuda con mi tarea'
        };

        const input = document.getElementById('chatInput');
        input.value = prompts[action] || '';
        input.focus();
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').classList.remove('d-none');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('d-none');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    saveConversationHistory() {
        if (!this.currentUser) return;

        // Mantener solo últimos 50 mensajes
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }

        localStorage.setItem(
            `bge_chat_${this.currentUser.email}`,
            JSON.stringify(this.conversationHistory)
        );
    }

    awardChatXP() {
        if (!this.currentUser) return;

        const xpReward = 5; // 5 XP por usar chat
        const progressKey = `bge_progress_${this.currentUser.email}`;
        const currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');

        currentProgress.xp = (currentProgress.xp || 0) + xpReward;
        currentProgress.level = Math.floor(currentProgress.xp / 500) + 1;

        localStorage.setItem(progressKey, JSON.stringify(currentProgress));

        // Actualizar UI si existe
        const levelEl = document.getElementById('userLevel');
        if (levelEl) levelEl.textContent = `Nivel ${currentProgress.level}`;
    }

    getUserLevel() {
        if (!this.currentUser) return 1;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).level || 1 : 1;
    }

    getUserCoins() {
        if (!this.currentUser) return 0;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).coins || 0 : 0;
    }

    adjustChatPosition() {
        if (window.innerWidth <= 768) {
            // Móvil: chat fullscreen
            this.chatContainer.style.width = '100vw';
            this.chatContainer.style.height = '100vh';
            this.chatContainer.style.right = '0';
            this.chatContainer.style.bottom = '0';
            this.chatContainer.style.borderRadius = '0';
        } else {
            // Desktop: chat flotante
            this.chatContainer.style.width = '350px';
            this.chatContainer.style.height = '500px';
            this.chatContainer.style.right = '30px';
            this.chatContainer.style.bottom = '100px';
            this.chatContainer.style.borderRadius = '20px';
        }
    }

    clearHistory() {
        this.conversationHistory = [];
        this.saveConversationHistory();

        // Recargar mensajes
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = DOMPurify.sanitize(this.generateWelcomeMessage());

        alert('🗑️ Historial de chat eliminado');
    }
}

// Funciones globales
function openAIChat() {
    if (window.aiChatRealtime) {
        window.aiChatRealtime.openChat();
    }
}

function clearChatHistory() {
    if (window.aiChatRealtime) {
        if (confirm('¿Estás seguro de que quieres eliminar todo el historial del chat?')) {
            window.aiChatRealtime.clearHistory();
        }
    }
}

// Inicializar chat IA
document.addEventListener('DOMContentLoaded', function() {
    window.aiChatRealtime = new AIChatRealtime();
});