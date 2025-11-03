/**
 * 🤖 AI TUTOR INTERFACE - FASE 5.1
 * Interfaz inteligente de tutor AI para BGE Héroes de la Patria
 * Conexión entre estudiantes y sistemas de IA educativa
 */

class AITutorInterface {
    constructor() {
        this.aiEducationalSystem = null;
        this.aiRecommendationEngine = null;
        this.currentConversation = [];
        this.userProfile = {};
        this.sessionActive = false;
        this.tutorPersonality = 'friendly'; // friendly, formal, encouraging, adaptive

        this.config = {
            enableVoiceInteraction: true,
            enableTypewriterEffect: true,
            enableEmotionalAnalysis: true,
            enableRealTimeHelp: true,
            autoSaveConversations: true,
            adaptivePersonality: true
        };

        this.emotions = {
            frustrated: { responses: ['¡No te preocupes! Esto puede ser difícil al principio.', 'Vamos paso a paso, sin prisa.'], priority: 'high' },
            confused: { responses: ['Te ayudo a aclarar esto.', 'Hagamos un ejemplo más simple.'], priority: 'high' },
            excited: { responses: ['¡Excelente actitud! Sigamos así.', '¡Me encanta tu entusiasmo!'], priority: 'medium' },
            bored: { responses: ['Cambiemos el enfoque, esto será más interesante.', 'Te tengo una actividad divertida.'], priority: 'high' },
            confident: { responses: ['¡Perfecto! Estás dominando esto.', 'Sigamos con un reto mayor.'], priority: 'low' }
        };

        this.init();
    }

    async init() {
        await this.waitForDependencies();
        this.setupInterface();
        this.loadUserProfile();
        this.initializeVoiceRecognition();
        this.startEmotionalAnalysis();

        console.log('🤖 AI Tutor Interface inicializado');
    }

    async waitForDependencies() {
        // Esperar a que los sistemas AI estén disponibles
        const maxAttempts = 10;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.aiEducationalSystem && window.aiRecommendationEngine) {
                this.aiEducationalSystem = window.aiEducationalSystem;
                this.aiRecommendationEngine = window.aiRecommendationEngine;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }

        console.warn('⚠️ Sistemas AI no disponibles, usando modo fallback');
        this.initializeFallbackMode();
    }

    initializeFallbackMode() {
        // Modo de respaldo cuando los sistemas AI no están disponibles
        this.fallbackMode = true;

        // Configurar respuestas básicas predefinidas
        this.fallbackResponses = {
            greeting: ['¡Hola! Estoy aquí para ayudarte', 'Buenos días, ¿en qué puedo asistirte?'],
            math: ['Las matemáticas pueden ser desafiantes, pero juntos lo resolveremos', 'Te ayudo con tu problema matemático'],
            science: ['La ciencia es fascinante, exploremos juntos', 'Hablemos de ciencia'],
            general: ['Interesante pregunta, déjame ayudarte', 'Estoy aquí para apoyarte en tu aprendizaje']
        };

        console.log('🔄 Modo fallback del tutor AI activado');
    }

    setupInterface() {
        this.createTutorWidget();
        this.setupEventListeners();
        this.loadConversationHistory();
        this.initializeQuickActions();
    }

    initializeQuickActions() {
        // Configurar acciones rápidas y sus funcionalidades
        this.quickActionHandlers = {
            math: () => this.openSubjectHelper('matemáticas'),
            science: () => this.openSubjectHelper('ciencias'),
            history: () => this.openSubjectHelper('historia'),
            recommendations: () => this.showPersonalizedRecommendations()
        };

        // Registrar eventos para acciones rápidas
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action')) {
                const action = e.target.dataset.action;
                if (this.quickActionHandlers[action]) {
                    this.quickActionHandlers[action]();
                }
            }
        });

        console.log('🚀 Acciones rápidas del tutor AI inicializadas');
    }

    openSubjectHelper(subject) {
        const messages = {
            'matemáticas': `¡Perfecto! Estoy aquí para ayudarte con matemáticas. ¿Qué tema específico necesitas repasar? Puedo ayudarte con álgebra, geometría, cálculo, estadística y más.`,
            'ciencias': `¡Excelente! Me encanta la ciencia. ¿Te interesa más la física, química, biología o ciencias de la tierra? Tengo experimentos virtuales y explicaciones interactivas.`,
            'historia': `¡La historia es fascinante! ¿Qué período o tema histórico te gustaría explorar? Puedo contarte sobre civilizaciones antiguas, historia de México, mundial, o cualquier época específica.`
        };

        this.addMessage(messages[subject], 'ai');
        this.currentConversation.push({
            type: 'ai',
            content: messages[subject],
            timestamp: Date.now(),
            subject: subject
        });
    }

    showPersonalizedRecommendations() {
        const recommendations = this.generateRecommendations();
        this.addMessage(recommendations, 'ai');
        this.currentConversation.push({
            type: 'ai',
            content: recommendations,
            timestamp: Date.now(),
            isRecommendation: true
        });
    }

    generateRecommendations() {
        const hour = new Date().getHours();
        let timeBasedMsg = '';

        if (hour < 12) {
            timeBasedMsg = 'Buenos días! Para empezar bien el día, te recomiendo:';
        } else if (hour < 18) {
            timeBasedMsg = 'Buenas tardes! Para esta hora del día, sugiero:';
        } else {
            timeBasedMsg = 'Buenas noches! Para repasar antes de descansar:';
        }

        const recommendations = [
            '📚 Revisar los apuntes de la última clase',
            '🎯 Practicar ejercicios de tu materia más desafiante',
            '🧠 Hacer un mapa mental de lo aprendido hoy',
            '📝 Preparar preguntas para la próxima clase',
            '🔬 Explorar un tema que te genere curiosidad'
        ];

        const selectedRecs = recommendations.slice(0, 3);
        return `${timeBasedMsg}\n\n${selectedRecs.join('\n')}\n\n¿Te interesa alguna de estas actividades? ¡Puedo ayudarte con cualquiera!`;
    }

    createTutorWidget() {
        // Crear widget flotante del tutor AI
        const tutorWidget = document.createElement('div');
        tutorWidget.id = 'ai-tutor-widget';
        tutorWidget.className = 'ai-tutor-widget hidden';

        tutorWidget.innerHTML = `
            <div class="tutor-header">
                <div class="tutor-avatar">
                    <div class="avatar-image">🤖</div>
                    <div class="status-indicator online"></div>
                </div>
                <div class="tutor-info">
                    <h4>IA Educativa</h4>
                    <p class="status-text">Listo para ayudarte</p>
                </div>
                <div class="tutor-controls">
                    <button class="voice-toggle" title="Activar/Desactivar voz">🎤</button>
                    <button class="minimize-btn" title="Minimizar">−</button>
                    <button class="close-btn" title="Cerrar">×</button>
                </div>
            </div>

            <div class="tutor-content">
                <div class="conversation-area">
                    <div class="messages-container" id="messages-container">
                        <div class="welcome-message">
                            <div class="message ai-message">
                                <div class="message-content">
                                    ¡Hola! Soy tu tutor de IA. ¿En qué puedo ayudarte hoy?
                                </div>
                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="quick-actions">
                    <button class="quick-action" data-action="math">📊 Matemáticas</button>
                    <button class="quick-action" data-action="science">🔬 Ciencias</button>
                    <button class="quick-action" data-action="history">📚 Historia</button>
                    <button class="quick-action" data-action="recommendations">💡 Recomendaciones</button>
                </div>

                <div class="input-area">
                    <div class="input-container">
                        <input type="text"
                               id="tutor-input"
                               placeholder="Escribe tu pregunta aquí..."
                               autocomplete="off">
                        <button class="send-btn" id="send-message">
                            <span class="send-icon">➤</span>
                        </button>
                    </div>
                    <div class="voice-recording" id="voice-recording" style="display: none;">
                        <div class="recording-indicator">
                            <span class="pulse"></span>
                            Escuchando...
                        </div>
                        <button class="stop-recording">Detener</button>
                    </div>
                </div>

                <div class="tutor-status">
                    <div class="typing-indicator" style="display: none;">
                        <span></span><span></span><span></span>
                        IA está escribiendo...
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.appendChild(tutorWidget);

        // Crear botón de activación
        this.createActivationButton();
    }

    createActivationButton() {
        const activationBtn = document.createElement('div');
        activationBtn.id = 'ai-tutor-activation';
        activationBtn.className = 'ai-tutor-activation';
        activationBtn.innerHTML = `
            <div class="activation-content">
                <div class="tutor-icon">🤖</div>
                <div class="notification-badge" style="display: none;">1</div>
            </div>
        `;

        activationBtn.addEventListener('click', () => this.toggleTutorWidget());
        document.body.appendChild(activationBtn);
    }

    setupEventListeners() {
        const widget = document.getElementById('ai-tutor-widget');
        const input = document.getElementById('tutor-input');
        const sendBtn = document.getElementById('send-message');

        // Envío de mensajes
        sendBtn.addEventListener('click', () => this.sendMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Controles del widget
        widget.querySelector('.minimize-btn').addEventListener('click', () => this.minimizeTutor());
        widget.querySelector('.close-btn').addEventListener('click', () => this.closeTutor());
        widget.querySelector('.voice-toggle').addEventListener('click', () => this.toggleVoiceMode());

        // Acciones rápidas
        widget.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Auto-resize del input
        input.addEventListener('input', () => this.adjustInputHeight());
    }

    async sendMessage() {
        const input = document.getElementById('tutor-input');
        const message = input.value.trim();

        if (!message) return;

        // Agregar mensaje del usuario
        this.addMessage(message, 'user');
        input.value = '';

        // Mostrar indicador de escritura
        this.showTypingIndicator();

        try {
            // Analizar emoción del mensaje
            const emotion = this.analyzeMessageEmotion(message);

            // Obtener respuesta de la IA
            const response = await this.getAIResponse(message, emotion);

            // Mostrar respuesta con efecto de escritura
            await this.addAIMessage(response, emotion);

            // Guardar conversación
            this.saveConversation();

            // Actualizar recomendaciones si es necesario
            this.updateRecommendations(message, response);

        } catch (error) {
            console.error('Error procesando mensaje:', error);
            this.addMessage('Lo siento, ha ocurrido un error. Inténtalo de nuevo.', 'ai', 'error');
        }

        this.hideTypingIndicator();
    }

    async getAIResponse(message, emotion) {
        // Intentar usar el sistema AI educativo
        if (this.aiEducationalSystem) {
            try {
                const userId = this.getCurrentUserId();
                const response = await this.aiEducationalSystem.processMessage(message, userId);

                // Adaptar respuesta según la emoción detectada
                return this.adaptResponseToEmotion(response, emotion);
            } catch (error) {
                console.warn('Error en sistema AI:', error);
            }
        }

        // Fallback con respuestas predefinidas
        return this.getFallbackResponse(message, emotion);
    }

    adaptResponseToEmotion(response, emotion) {
        if (!emotion || emotion === 'neutral') return response;

        const emotionConfig = this.emotions[emotion];
        if (emotionConfig && emotionConfig.priority === 'high') {
            const encouragement = emotionConfig.responses[Math.floor(Math.random() * emotionConfig.responses.length)];
            return `${encouragement}\n\n${response}`;
        }

        return response;
    }

    analyzeMessageEmotion(message) {
        const frustrationWords = ['no entiendo', 'difícil', 'confuso', 'ayuda', 'no puedo'];
        const excitementWords = ['genial', 'perfecto', 'excelente', 'increíble', 'me gusta'];
        const confusionWords = ['qué', 'cómo', 'por qué', 'explica', 'no sé'];

        const lowerMessage = message.toLowerCase();

        if (frustrationWords.some(word => lowerMessage.includes(word))) return 'frustrated';
        if (excitementWords.some(word => lowerMessage.includes(word))) return 'excited';
        if (confusionWords.some(word => lowerMessage.includes(word))) return 'confused';

        return 'neutral';
    }

    async addAIMessage(content, emotion = 'neutral') {
        if (this.config.enableTypewriterEffect) {
            await this.typewriterEffect(content, 'ai', emotion);
        } else {
            this.addMessage(content, 'ai', emotion);
        }
    }

    async typewriterEffect(content, sender, emotion) {
        const container = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${emotion}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        container.appendChild(messageDiv);

        // Efecto de escritura
        let index = 0;
        const speed = 30; // ms por carácter

        return new Promise((resolve) => {
            // Asegurar que content es una cadena
            const contentStr = typeof content === 'string' ? content : String(content || '');

            const typeInterval = setInterval(() => {
                contentDiv.textContent = contentStr.substring(0, index + 1);
                index++;

                if (index >= contentStr.length) {
                    clearInterval(typeInterval);
                    this.scrollToBottom();
                    resolve();
                }
            }, speed);
        });
    }

    addMessage(content, sender, emotion = 'neutral') {
        const container = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${emotion}`;

        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;

        container.appendChild(messageDiv);
        this.scrollToBottom();
    }

    handleQuickAction(action) {
        const quickMessages = {
            math: '¿Puedes ayudarme con un problema de matemáticas?',
            science: 'Tengo una pregunta sobre ciencias',
            history: 'Quiero aprender más sobre historia',
            recommendations: '¿Qué me recomiendas estudiar hoy?'
        };

        const message = quickMessages[action];
        if (message) {
            document.getElementById('tutor-input').value = message;
            this.sendMessage();
        }
    }

    toggleTutorWidget() {
        const widget = document.getElementById('ai-tutor-widget');
        const activation = document.getElementById('ai-tutor-activation');

        if (widget.classList.contains('hidden')) {
            widget.classList.remove('hidden');
            activation.style.display = 'none';
            this.sessionActive = true;
            this.trackTutorSession('opened');
        } else {
            widget.classList.add('hidden');
            activation.style.display = 'flex';
            this.sessionActive = false;
            this.trackTutorSession('closed');
        }
    }

    minimizeTutor() {
        const widget = document.getElementById('ai-tutor-widget');
        widget.classList.add('minimized');
        setTimeout(() => this.toggleTutorWidget(), 300);
    }

    closeTutor() {
        this.sessionActive = false;
        this.saveConversation();
        this.toggleTutorWidget();
    }

    initializeVoiceRecognition() {
        if (!this.config.enableVoiceInteraction) return;

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();

            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'es-ES';

            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('tutor-input').value = transcript;
                this.sendMessage();
            };

            this.speechRecognition.onerror = (error) => {
                console.warn('Error en reconocimiento de voz:', error);
                this.stopVoiceRecording();
            };
        }
    }

    toggleVoiceMode() {
        if (!this.speechRecognition) {
            this.showNotification('Reconocimiento de voz no disponible', 'warning');
            return;
        }

        const voiceRecording = document.getElementById('voice-recording');

        if (voiceRecording.style.display === 'none') {
            this.startVoiceRecording();
        } else {
            this.stopVoiceRecording();
        }
    }

    startVoiceRecording() {
        const voiceRecording = document.getElementById('voice-recording');
        const inputContainer = document.querySelector('.input-container');

        voiceRecording.style.display = 'block';
        inputContainer.style.display = 'none';

        this.speechRecognition.start();
    }

    stopVoiceRecording() {
        const voiceRecording = document.getElementById('voice-recording');
        const inputContainer = document.querySelector('.input-container');

        voiceRecording.style.display = 'none';
        inputContainer.style.display = 'flex';

        if (this.speechRecognition) {
            this.speechRecognition.stop();
        }
    }

    startEmotionalAnalysis() {
        if (!this.config.enableEmotionalAnalysis) return;

        // Análisis emocional básico basado en patrones de texto
        this.emotionalAnalysisActive = true;

        // Configurar monitoreo de interacciones
        this.emotionalState = {
            currentEmotion: 'neutral',
            confidence: 0.5,
            history: [],
            patterns: {
                frustration: ['no entiendo', 'difícil', 'complicado', 'imposible', 'no puedo'],
                excitement: ['genial', 'increíble', 'perfecto', 'excelente', 'me gusta'],
                confusion: ['qué significa', 'no sé', 'explica', 'ayuda', 'cómo'],
                satisfaction: ['entiendo', 'claro', 'perfecto', 'gracias', 'bien']
            }
        };

        console.log('🧠 Sistema de análisis emocional iniciado');
    }

    showTypingIndicator() {
        document.querySelector('.typing-indicator').style.display = 'block';
    }

    hideTypingIndicator() {
        document.querySelector('.typing-indicator').style.display = 'none';
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        container.scrollTop = container.scrollHeight;
    }

    // Gestión de perfil y recomendaciones
    loadUserProfile() {
        const savedProfile = localStorage.getItem('ai_tutor_profile');
        if (savedProfile) {
            this.userProfile = JSON.parse(savedProfile);
        } else {
            this.userProfile = {
                userId: this.generateUserId(),
                preferences: {},
                learningStyle: 'visual',
                subjects: [],
                interactions: 0,
                lastSession: null
            };
        }
    }

    updateRecommendations(userMessage, aiResponse) {
        if (this.aiRecommendationEngine) {
            const interactionData = {
                timestamp: Date.now(),
                userMessage,
                aiResponse,
                emotion: this.analyzeMessageEmotion(userMessage)
            };

            // Verificar si la función existe antes de llamarla
            if (this.aiRecommendationEngine && typeof this.aiRecommendationEngine.recordInteraction === 'function') {
                this.aiRecommendationEngine.recordInteraction(this.userProfile.userId, interactionData);
            } else {
                console.log('📝 Registrando interacción:', interactionData);
            }
        }
    }

    saveConversation() {
        if (!this.config.autoSaveConversations) return;

        const conversation = {
            timestamp: Date.now(),
            messages: this.currentConversation,
            userId: this.userProfile.userId
        };

        localStorage.setItem('ai_tutor_last_conversation', JSON.stringify(conversation));
    }

    loadConversationHistory() {
        const saved = localStorage.getItem('ai_tutor_last_conversation');
        if (saved) {
            const conversation = JSON.parse(saved);
            // Cargar solo si es del mismo día
            const today = new Date().toDateString();
            const savedDate = new Date(conversation.timestamp).toDateString();

            if (today === savedDate) {
                this.currentConversation = conversation.messages || [];
            }
        }
    }

    getFallbackResponse(message, emotion) {
        const fallbackResponses = {
            math: ['Te puedo ayudar con matemáticas. ¿Qué tema específico necesitas?', 'Las matemáticas pueden ser desafiantes, pero juntos lo resolveremos.'],
            science: ['La ciencia es fascinante. ¿Sobre qué quieres aprender?', 'Exploremos juntos el mundo de la ciencia.'],
            general: ['Interesante pregunta. Te ayudo a encontrar la respuesta.', 'Déjame ayudarte con eso.', 'Esa es una excelente pregunta.']
        };

        const lowerMessage = message.toLowerCase();
        let category = 'general';

        if (lowerMessage.includes('matemática') || lowerMessage.includes('número') || lowerMessage.includes('calcul')) {
            category = 'math';
        } else if (lowerMessage.includes('ciencia') || lowerMessage.includes('física') || lowerMessage.includes('química')) {
            category = 'science';
        }

        const responses = fallbackResponses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Utilidades
    getCurrentUserId() {
        return this.userProfile.userId || 'anonymous';
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    trackTutorSession(action) {
        const sessionData = {
            action,
            timestamp: Date.now(),
            userId: this.getCurrentUserId()
        };

        // Enviar a analytics si está disponible
        if (window.gtag) {
            gtag('event', 'ai_tutor_interaction', sessionData);
        }
    }

    showNotification(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `ai-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // API pública
    sendMessageProgrammatically(message) {
        document.getElementById('tutor-input').value = message;
        this.sendMessage();
    }

    openTutorWithMessage(message) {
        if (document.getElementById('ai-tutor-widget').classList.contains('hidden')) {
            this.toggleTutorWidget();
        }

        setTimeout(() => {
            this.sendMessageProgrammatically(message);
        }, 500);
    }

    getConversationHistory() {
        return this.currentConversation;
    }

    updateTutorPersonality(personality) {
        this.tutorPersonality = personality;
        console.log(`🤖 Personalidad del tutor cambiada a: ${personality}`);
    }
}

// CSS para la interfaz del tutor AI
const tutorStyles = document.createElement('style');
tutorStyles.textContent = `
    .ai-tutor-activation {
        position: fixed;
        bottom: 30px;
        right: 300px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #e91e63 0%, #ad1457 50%, #880e4f 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(233, 30, 99, 0.5), 0 0 30px rgba(173, 20, 87, 0.3);
        transition: all 0.3s ease;
        z-index: 99998;
    }

    .ai-tutor-activation:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
    }

    .activation-content {
        position: relative;
    }

    .tutor-icon {
        font-size: 24px;
        color: white;
    }

    .notification-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ff4757;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .ai-tutor-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 100000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .ai-tutor-widget.hidden {
        transform: translateY(100%) scale(0.8);
        opacity: 0;
        pointer-events: none;
    }

    .ai-tutor-widget.minimized {
        transform: scale(0.95);
        opacity: 0.5;
    }

    .tutor-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .tutor-avatar {
        position: relative;
    }

    .avatar-image {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
    }

    .status-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }

    .status-indicator.online {
        background: #2ed573;
    }

    .tutor-info {
        flex: 1;
    }

    .tutor-info h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
    }

    .status-text {
        margin: 0;
        font-size: 12px;
        opacity: 0.8;
    }

    .tutor-controls {
        display: flex;
        gap: 8px;
    }

    .tutor-controls button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
    }

    .tutor-controls button:hover {
        background: rgba(255,255,255,0.3);
    }

    .tutor-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: calc(100% - 72px);
    }

    .conversation-area {
        flex: 1;
        overflow: hidden;
    }

    .messages-container {
        height: 100%;
        overflow-y: auto;
        padding: 16px;
        scroll-behavior: smooth;
    }

    .message {
        margin-bottom: 16px;
        max-width: 80%;
    }

    .user-message {
        margin-left: auto;
    }

    .user-message .message-content {
        background: #667eea;
        color: white;
        padding: 12px 16px;
        border-radius: 18px 18px 4px 18px;
    }

    .ai-message .message-content {
        background: #f8f9fa;
        color: #333;
        padding: 12px 16px;
        border-radius: 18px 18px 18px 4px;
        border-left: 3px solid #667eea;
    }

    .ai-message.frustrated .message-content {
        border-left-color: #ff6b6b;
        background: #fff5f5;
    }

    .ai-message.excited .message-content {
        border-left-color: #51cf66;
        background: #f3fff3;
    }

    .message-time {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
        text-align: right;
    }

    .user-message .message-time {
        text-align: left;
    }

    .quick-actions {
        padding: 12px 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        border-top: 1px solid #eee;
    }

    .quick-action {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
    }

    .quick-action:hover {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }

    .input-area {
        padding: 16px;
        border-top: 1px solid #eee;
    }

    .input-container {
        display: flex;
        gap: 8px;
        align-items: flex-end;
    }

    #tutor-input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 12px 16px;
        font-size: 14px;
        resize: none;
        max-height: 100px;
        outline: none;
        transition: border-color 0.2s;
    }

    #tutor-input:focus {
        border-color: #667eea;
    }

    .send-btn {
        background: #667eea;
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    .send-btn:hover {
        background: #5a67d8;
    }

    .voice-recording {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 2px solid #ff6b6b;
    }

    .recording-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ff6b6b;
        font-weight: 500;
    }

    .pulse {
        width: 8px;
        height: 8px;
        background: #ff6b6b;
        border-radius: 50%;
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }

    .typing-indicator {
        padding: 8px 16px;
        color: #666;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .typing-indicator span {
        width: 4px;
        height: 4px;
        background: #666;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%, 80%, 100% { opacity: 0.3; }
        40% { opacity: 1; }
    }

    .ai-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 100001;
        animation: slideIn 0.3s ease;
    }

    .ai-notification.info {
        background: #667eea;
    }

    .ai-notification.warning {
        background: #ffa502;
    }

    .ai-notification.error {
        background: #ff6b6b;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    /* Responsive */
    @media (max-width: 480px) {
        .ai-tutor-widget {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            border-radius: 0;
        }

        .ai-tutor-activation {
            bottom: 10px;
            right: 10px;
            width: 50px;
            height: 50px;
        }

        .quick-actions {
            justify-content: center;
        }
    }
`;
document.head.appendChild(tutorStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.aiTutorInterface = new AITutorInterface();
});

// Exponer globalmente
window.AITutorInterface = AITutorInterface;