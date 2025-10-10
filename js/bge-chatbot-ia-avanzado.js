/**
 * BGE CHATBOT IA AVANZADO - FASE 3
 * Sistema de chatbot educativo inteligente con IA real
 * Integración con APIs de IA externa (OpenAI/Claude)
 *
 * Versión: 3.0 - IA Avanzada
 * Fecha: 25 Septiembre 2025
 * Estado: Fase 3 - IA Real Implementada
 */

class BGEChatbotIAAvanzado {
    constructor() {
        this.apiEndpoint = '/api/chatbot-ia';
        this.isInitialized = false;
        this.conversationHistory = [];
        this.currentContext = {
            userType: 'guest', // guest, student, teacher, admin
            sessionId: this.generateSessionId(),
            timestamp: Date.now()
        };

        // Configuración de IA
        this.aiConfig = {
            model: 'claude-3-sonnet', // Fallback a 'gpt-4' si no está disponible
            maxTokens: 1500,
            temperature: 0.7,
            contextWindow: 10, // Últimos 10 mensajes para contexto
            responseTimeout: 15000 // 15 segundos timeout
        };

        // Estado del sistema
        this.systemStatus = {
            apiConnected: false,
            responseTime: 0,
            totalQueries: 0,
            successRate: 0,
            lastError: null
        };

        this.init();
    }

    /**
     * INICIALIZACIÓN DEL SISTEMA IA
     */
    async init() {
        console.log('🤖 BGE Chatbot IA Avanzado - Inicializando...');

        try {
            // Verificar conexión con API
            await this.checkAPIConnection();

            // Configurar elementos DOM
            this.setupDOM();

            // Inicializar contexto de usuario
            await this.initializeUserContext();

            // Cargar historial si existe
            this.loadConversationHistory();

            // Configurar event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ BGE Chatbot IA - Sistema inicializado correctamente');

            // Mensaje de bienvenida inteligente
            await this.sendWelcomeMessage();

        } catch (error) {
            console.error('❌ Error inicializando Chatbot IA:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * VERIFICAR CONEXIÓN CON API DE IA
     */
    async checkAPIConnection() {
        try {
            const startTime = Date.now();

            const response = await fetch(`${this.apiEndpoint}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            this.systemStatus.responseTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                this.systemStatus.apiConnected = true;
                this.aiConfig.model = data.availableModel || this.aiConfig.model;
                console.log(`🔌 API IA conectada - Modelo: ${this.aiConfig.model}`);
            } else {
                throw new Error(`API health check failed: ${response.status}`);
            }

        } catch (error) {
            console.warn('⚠️ API IA no disponible, usando modo fallback');
            this.systemStatus.apiConnected = false;
            this.systemStatus.lastError = error.message;
        }
    }

    /**
     * CONFIGURAR ELEMENTOS DOM
     */
    setupDOM() {
        // Crear contenedor principal si no existe
        if (!document.getElementById('chatbot-ia-container')) {
            const container = document.createElement('div');
            container.id = 'chatbot-ia-container';
            container.innerHTML = this.getChatbotHTML();
            document.body.appendChild(container);
        }

        // Referencias a elementos
        this.chatContainer = document.getElementById('chatbot-ia-messages');
        this.inputField = document.getElementById('chatbot-ia-input');
        this.sendButton = document.getElementById('chatbot-ia-send');
        this.statusIndicator = document.getElementById('chatbot-ia-status');

        // Aplicar estilos si no existen
        this.injectStyles();
    }

    /**
     * INICIALIZAR CONTEXTO DE USUARIO
     */
    async initializeUserContext() {
        try {
            // Detectar tipo de usuario por URL o sesión
            const currentPath = window.location.pathname;

            if (currentPath.includes('admin')) {
                this.currentContext.userType = 'admin';
            } else if (currentPath.includes('docentes') || currentPath.includes('teacher')) {
                this.currentContext.userType = 'teacher';
            } else if (currentPath.includes('estudiantes') || currentPath.includes('calificaciones')) {
                this.currentContext.userType = 'student';
            }

            // Obtener información adicional del contexto
            this.currentContext.currentPage = document.title;
            this.currentContext.userAgent = navigator.userAgent;
            this.currentContext.language = navigator.language || 'es-MX';

            console.log('👤 Contexto de usuario inicializado:', this.currentContext.userType);

        } catch (error) {
            console.warn('⚠️ Error inicializando contexto:', error);
        }
    }

    /**
     * CONFIGURAR EVENT LISTENERS
     */
    setupEventListeners() {
        // Botón enviar
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        // Enter en campo de texto
        if (this.inputField) {
            this.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize del textarea
            this.inputField.addEventListener('input', () => {
                this.autoResizeTextarea();
            });
        }

        // Botón de toggle del chat
        const toggleButton = document.getElementById('chatbot-ia-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleChat());
        }

        // Cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeChat();
            }
        });
    }

    /**
     * ENVIAR MENSAJE PRINCIPAL
     */
    async sendMessage() {
        const message = this.inputField?.value?.trim();

        if (!message) {
            return;
        }

        try {
            // Limpiar input
            this.inputField.value = '';
            this.autoResizeTextarea();

            // Mostrar mensaje del usuario
            this.addMessageToChat('user', message);

            // Mostrar indicador de escritura
            this.showTypingIndicator();

            // Procesar con IA
            const response = await this.processWithIA(message);

            // Ocultar indicador de escritura
            this.hideTypingIndicator();

            // Mostrar respuesta
            this.addMessageToChat('assistant', response);

            // Actualizar estadísticas
            this.updateSystemStats(true);

            // Guardar en historial
            this.saveToHistory(message, response);

        } catch (error) {
            console.error('❌ Error enviando mensaje:', error);
            this.hideTypingIndicator();
            this.showErrorMessage(error);
            this.updateSystemStats(false);
        }
    }

    /**
     * PROCESAR MENSAJE CON IA
     */
    async processWithIA(message) {
        // Si la API está disponible, usar IA real
        if (this.systemStatus.apiConnected) {
            return await this.processWithExternalIA(message);
        } else {
            // Fallback a sistema local inteligente
            return await this.processWithLocalIA(message);
        }
    }

    /**
     * PROCESAR CON IA EXTERNA (OpenAI/Claude)
     */
    async processWithExternalIA(message) {
        try {
            const payload = {
                message: message,
                context: this.currentContext,
                conversationHistory: this.getRecentHistory(),
                systemPrompt: this.getSystemPrompt(),
                config: {
                    model: this.aiConfig.model,
                    maxTokens: this.aiConfig.maxTokens,
                    temperature: this.aiConfig.temperature
                }
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.aiConfig.responseTimeout);

            const response = await fetch(`${this.apiEndpoint}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            // Validar respuesta
            if (!data.response) {
                throw new Error('Respuesta IA inválida');
            }

            // Procesar respuesta para contexto educativo
            return this.processEducationalResponse(data.response);

        } catch (error) {
            console.warn('⚠️ Error con IA externa, usando fallback:', error.message);

            // Si falla la IA externa, usar local
            return await this.processWithLocalIA(message);
        }
    }

    /**
     * PROCESAR CON IA LOCAL (FALLBACK)
     */
    async processWithLocalIA(message) {
        // Análisis de intención
        const intent = this.analyzeIntent(message);

        // Base de conocimiento BGE
        const knowledge = this.getBGEKnowledgeBase();

        // Búsqueda semántica básica
        const relevantInfo = this.findRelevantInfo(message, knowledge);

        // Generar respuesta contextual
        return this.generateContextualResponse(intent, relevantInfo, message);
    }

    /**
     * ANÁLISIS DE INTENCIÓN
     */
    analyzeIntent(message) {
        const normalizedMessage = message.toLowerCase();

        // Patrones de intención
        const intentPatterns = {
            admission: ['inscripción', 'admisión', 'ingreso', 'requisitos', 'cómo entrar'],
            academic: ['calificaciones', 'materias', 'horarios', 'clases', 'profesores'],
            administrative: ['trámites', 'documentos', 'certificados', 'constancias'],
            facilities: ['instalaciones', 'laboratorios', 'biblioteca', 'cafetería'],
            events: ['eventos', 'actividades', 'festival', 'concurso'],
            contact: ['contacto', 'teléfono', 'dirección', 'ubicación'],
            help: ['ayuda', 'no entiendo', 'explicar', 'cómo funciona'],
            greeting: ['hola', 'buenos días', 'buenas tardes', 'saludos']
        };

        // Detectar intención
        for (const [intent, patterns] of Object.entries(intentPatterns)) {
            if (patterns.some(pattern => normalizedMessage.includes(pattern))) {
                return intent;
            }
        }

        return 'general';
    }

    /**
     * BASE DE CONOCIMIENTO BGE
     */
    getBGEKnowledgeBase() {
        return {
            admission: {
                requirements: [
                    'Certificado de educación secundaria',
                    'Acta de nacimiento',
                    'CURP',
                    'Comprobante de domicilio',
                    'Fotografías tamaño infantil'
                ],
                process: 'La inscripción se realiza en febrero para el ciclo escolar siguiente.',
                contact: 'Informes en la oficina de control escolar.'
            },
            academic: {
                schedule: 'Horario de clases de 7:00 AM a 1:30 PM',
                subjects: ['Matemáticas', 'Español', 'Historia', 'Biología', 'Química', 'Física', 'Inglés'],
                system: 'Sistema por semestres, 6 semestres en total'
            },
            facilities: {
                laboratories: ['Laboratorio de Química', 'Laboratorio de Física', 'Laboratorio de Biología'],
                library: 'Biblioteca con más de 2000 volúmenes',
                sports: 'Cancha de basquetbol y área deportiva'
            },
            contact: {
                phone: '222-123-4567',
                address: 'Av. Héroes de la Patria #123, Puebla, Pue.',
                email: 'info@heroespatria.edu.mx',
                hours: 'Lunes a Viernes de 7:00 AM a 3:00 PM'
            }
        };
    }

    /**
     * BUSCAR INFORMACIÓN RELEVANTE
     */
    findRelevantInfo(message, knowledge) {
        const relevantSections = [];
        const messageWords = message.toLowerCase().split(' ');

        for (const [section, data] of Object.entries(knowledge)) {
            const sectionText = JSON.stringify(data).toLowerCase();

            const relevanceScore = messageWords.filter(word =>
                word.length > 3 && sectionText.includes(word)
            ).length;

            if (relevanceScore > 0) {
                relevantSections.push({
                    section,
                    data,
                    score: relevanceScore
                });
            }
        }

        return relevantSections.sort((a, b) => b.score - a.score);
    }

    /**
     * GENERAR RESPUESTA CONTEXTUAL
     */
    generateContextualResponse(intent, relevantInfo, originalMessage) {
        let response = '';

        // Respuestas por intención
        switch (intent) {
            case 'greeting':
                response = `¡Hola! Soy el asistente virtual del Bachillerato Héroes de la Patria. ¿En qué puedo ayudarte hoy?`;
                break;

            case 'admission':
                if (relevantInfo.length > 0) {
                    const admissionData = relevantInfo[0].data;
                    response = `Para la admisión al BGE Héroes de la Patria necesitas:\n\n`;
                    response += admissionData.requirements?.map(req => `• ${req}`).join('\n');
                    response += `\n\n${admissionData.process}\n${admissionData.contact}`;
                }
                break;

            case 'academic':
                response = `Información académica del BGE:\n\n`;
                if (relevantInfo.length > 0) {
                    const academicData = relevantInfo[0].data;
                    response += `📚 **Materias principales:**\n${academicData.subjects?.join(', ')}\n\n`;
                    response += `⏰ **Horario:** ${academicData.schedule}\n\n`;
                    response += `🎓 **Sistema:** ${academicData.system}`;
                }
                break;

            case 'contact':
                const contactData = relevantInfo.find(info => info.section === 'contact')?.data;
                if (contactData) {
                    response = `📞 **Información de contacto:**\n\n`;
                    response += `Teléfono: ${contactData.phone}\n`;
                    response += `Dirección: ${contactData.address}\n`;
                    response += `Email: ${contactData.email}\n`;
                    response += `Horarios: ${contactData.hours}`;
                }
                break;

            case 'help':
                response = `¡Estoy aquí para ayudarte! Puedo proporcionarte información sobre:\n\n`;
                response += `• Proceso de inscripción y admisión\n`;
                response += `• Plan de estudios y materias\n`;
                response += `• Instalaciones y servicios\n`;
                response += `• Información de contacto\n`;
                response += `• Eventos y actividades\n\n`;
                response += `¿Sobre qué tema te gustaría saber más?`;
                break;

            default:
                // Respuesta general basada en información relevante
                if (relevantInfo.length > 0) {
                    const topResult = relevantInfo[0];
                    response = `Basándose en tu consulta, aquí tienes información relevante:\n\n`;
                    response += this.formatInfoResponse(topResult);
                } else {
                    response = `Lo siento, no tengo información específica sobre "${originalMessage}". `;
                    response += `¿Podrías reformular tu pregunta o preguntarme sobre admisiones, materias, instalaciones o contacto?`;
                }
        }

        // Agregar contexto del usuario si es relevante
        if (this.currentContext.userType !== 'guest') {
            response += this.addUserContextInfo();
        }

        return response;
    }

    /**
     * FORMATEAR RESPUESTA DE INFORMACIÓN
     */
    formatInfoResponse(infoResult) {
        const { section, data } = infoResult;
        let formatted = `**${section.toUpperCase()}:**\n\n`;

        if (typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value)) {
                    formatted += `${key}: ${value.join(', ')}\n`;
                } else {
                    formatted += `${key}: ${value}\n`;
                }
            }
        }

        return formatted;
    }

    /**
     * PROCESAR RESPUESTA EDUCATIVA
     */
    processEducationalResponse(response) {
        // Agregar elementos educativos y de la institución
        let processedResponse = response;

        // Agregar emojis educativos apropiados
        const educationalEmojis = {
            'estudiantes': '👨‍🎓👩‍🎓',
            'materias': '📚',
            'laboratorio': '🧪',
            'biblioteca': '📖',
            'deportes': '⚽',
            'inscripción': '📝',
            'certificado': '🎓'
        };

        for (const [keyword, emoji] of Object.entries(educationalEmojis)) {
            if (processedResponse.toLowerCase().includes(keyword)) {
                processedResponse = processedResponse.replace(
                    new RegExp(keyword, 'gi'),
                    `${emoji} ${keyword}`
                );
                break; // Solo un emoji por respuesta
            }
        }

        // Agregar llamada a la acción si es apropiado
        if (processedResponse.includes('inscripción') || processedResponse.includes('admisión')) {
            processedResponse += '\n\n💡 **¿Te interesa formar parte de nuestra comunidad educativa? Contáctanos para más información.**';
        }

        return processedResponse;
    }

    /**
     * AGREGAR MENSAJE AL CHAT
     */
    addMessageToChat(sender, message) {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message ${sender}`;

        const timestamp = new Date().toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message)}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        this.chatContainer.appendChild(messageElement);

        // Scroll hacia abajo
        this.scrollToBottom();

        // Animar entrada
        setTimeout(() => {
            messageElement.classList.add('visible');
        }, 100);
    }

    /**
     * FORMATEAR MENSAJE
     */
    formatMessage(message) {
        // Convertir markdown básico a HTML
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '&bull;');
    }

    /**
     * MOSTRAR/OCULTAR INDICADOR DE ESCRITURA
     */
    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'chatbot-typing-indicator';
        indicator.className = 'chatbot-message assistant typing';
        indicator.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;

        this.chatContainer?.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('chatbot-typing-indicator');
        indicator?.remove();
    }

    /**
     * UTILIDADES DEL SISTEMA
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getRecentHistory() {
        return this.conversationHistory.slice(-this.aiConfig.contextWindow);
    }

    getSystemPrompt() {
        return `Eres un asistente educativo inteligente del Bachillerato General Estatal "Héroes de la Patria" en Puebla, México.

CONTEXTO INSTITUCIONAL:
- Institución educativa de nivel medio superior
- Enfoque en formación integral de estudiantes
- Valores: excelencia académica, responsabilidad, patriotismo

TU PERSONALIDAD:
- Amigable pero profesional
- Conocedor de temas educativos
- Orientado a ayudar a estudiantes y familias
- Usa un lenguaje claro y accesible

INSTRUCCIONES:
- Responde siempre en español
- Mantén un tono educativo y motivacional
- Proporciona información precisa sobre la institución
- Si no sabes algo, admítelo y ofrece alternativas
- Incluye llamadas a la acción cuando sea apropiado

CONTEXTO ACTUAL DEL USUARIO:
- Tipo: ${this.currentContext.userType}
- Página actual: ${this.currentContext.currentPage}
- Sesión: ${this.currentContext.sessionId}`;
    }

    saveToHistory(userMessage, assistantResponse) {
        this.conversationHistory.push({
            timestamp: Date.now(),
            user: userMessage,
            assistant: assistantResponse,
            context: { ...this.currentContext }
        });

        // Mantener solo las últimas 50 interacciones
        if (this.conversationHistory.length > 50) {
            this.conversationHistory = this.conversationHistory.slice(-50);
        }

        // Guardar en localStorage
        try {
            localStorage.setItem('bge-chatbot-history', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.warn('No se pudo guardar el historial:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('bge-chatbot-history');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('No se pudo cargar el historial:', error);
            this.conversationHistory = [];
        }
    }

    updateSystemStats(success) {
        this.systemStatus.totalQueries++;

        if (success) {
            this.systemStatus.successRate =
                ((this.systemStatus.successRate * (this.systemStatus.totalQueries - 1)) + 1) /
                this.systemStatus.totalQueries;
        } else {
            this.systemStatus.successRate =
                (this.systemStatus.successRate * (this.systemStatus.totalQueries - 1)) /
                this.systemStatus.totalQueries;
        }

        // Actualizar indicador visual
        this.updateStatusIndicator();
    }

    updateStatusIndicator() {
        if (!this.statusIndicator) return;

        const isOnline = this.systemStatus.apiConnected;
        const responseTime = this.systemStatus.responseTime;

        this.statusIndicator.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        this.statusIndicator.title = `Estado: ${isOnline ? 'Conectado' : 'Offline'} | Respuesta: ${responseTime}ms`;
    }

    /**
     * MENSAJE DE BIENVENIDA INTELIGENTE
     */
    async sendWelcomeMessage() {
        const welcomeMessages = {
            guest: '¡Hola! 👋 Soy tu asistente virtual del BGE Héroes de la Patria. ¿En qué puedo ayudarte hoy?',
            student: '¡Hola estudiante! 👨‍🎓 ¿Necesitas ayuda con tus materias, horarios o alguna consulta académica?',
            teacher: '¡Hola profesor(a)! 👨‍🏫 ¿Cómo puedo asistirte con información institucional o recursos educativos?',
            admin: '¡Hola! 👋 Sistema de IA educativa activo. ¿Necesitas reportes, estadísticas o información del sistema?'
        };

        const message = welcomeMessages[this.currentContext.userType] || welcomeMessages.guest;

        // Esperar un poco para simular naturalidad
        setTimeout(() => {
            this.addMessageToChat('assistant', message);
        }, 1000);
    }

    /**
     * MANEJO DE ERRORES
     */
    handleInitializationError(error) {
        console.error('Error de inicialización:', error);

        // Mostrar mensaje de error al usuario
        this.showSystemMessage(`
            ⚠️ **Sistema de IA temporalmente no disponible**

            Estoy funcionando en modo básico. Puedo ayudarte con:
            • Información general de la institución
            • Procesos de admisión
            • Contacto y ubicación

            Intenta recargar la página en unos minutos.
        `, 'error');
    }

    showSystemMessage(message, type = 'info') {
        this.addMessageToChat('system', `🤖 **SISTEMA:** ${message}`);
    }

    showErrorMessage(error) {
        const errorMessage = `
            ❌ **Lo siento, hubo un problema procesando tu mensaje**

            Error: ${error.message || 'Error desconocido'}

            Por favor intenta:
            • Reformular tu pregunta
            • Recargar la página
            • Contactar soporte si persiste el problema
        `;

        this.addMessageToChat('assistant', errorMessage);
    }

    /**
     * CONTROL DE INTERFAZ
     */
    toggleChat() {
        const container = document.getElementById('chatbot-ia-container');
        if (container) {
            container.classList.toggle('open');
        }
    }

    closeChat() {
        const container = document.getElementById('chatbot-ia-container');
        if (container) {
            container.classList.remove('open');
        }
    }

    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }

    autoResizeTextarea() {
        if (this.inputField) {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
        }
    }

    /**
     * HTML Y ESTILOS DEL CHATBOT
     */
    getChatbotHTML() {
        return `
            <div class="chatbot-ia-widget">
                <div class="chatbot-toggle" id="chatbot-ia-toggle">
                    <span class="chatbot-icon">🤖</span>
                    <span class="notification-badge" id="chatbot-notification">1</span>
                </div>

                <div class="chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            <span class="chatbot-avatar">🎓</span>
                            <div>
                                <h3>Asistente BGE IA</h3>
                                <span class="status-indicator" id="chatbot-ia-status"></span>
                            </div>
                        </div>
                        <button class="chatbot-close" onclick="window.bgeChatbotIA?.closeChat()">✕</button>
                    </div>

                    <div class="chatbot-messages" id="chatbot-ia-messages">
                        <!-- Los mensajes se insertan aquí dinámicamente -->
                    </div>

                    <div class="chatbot-input-area">
                        <textarea
                            id="chatbot-ia-input"
                            placeholder="Escribe tu pregunta sobre el BGE..."
                            maxlength="500"
                        ></textarea>
                        <button id="chatbot-ia-send" class="send-button">
                            <span>Enviar</span>
                        </button>
                    </div>

                    <div class="chatbot-footer">
                        <span class="powered-by">Powered by IA BGE Héroes de la Patria</span>
                    </div>
                </div>
            </div>
        `;
    }

    injectStyles() {
        if (document.getElementById('chatbot-ia-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'chatbot-ia-styles';
        styles.textContent = `
            /* BGE CHATBOT IA AVANZADO STYLES */
            .chatbot-ia-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .chatbot-toggle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #1976D2, #42A5F5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
                transition: all 0.3s ease;
                position: relative;
            }

            .chatbot-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
            }

            .chatbot-icon {
                font-size: 24px;
                color: white;
            }

            .notification-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #f44336;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
            }

            .chatbot-window {
                position: absolute;
                bottom: 70px;
                right: 0;
                width: 380px;
                height: 500px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
                display: flex;
                flex-direction: column;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
                overflow: hidden;
            }

            .chatbot-ia-container.open .chatbot-window {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: all;
            }

            .chatbot-header {
                background: linear-gradient(135deg, #1976D2, #42A5F5);
                color: white;
                padding: 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .chatbot-title {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .chatbot-avatar {
                font-size: 24px;
            }

            .chatbot-title h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .status-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4CAF50;
                display: inline-block;
                margin-left: 8px;
            }

            .status-indicator.offline {
                background: #f44336;
            }

            .chatbot-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .chatbot-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .chatbot-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                scroll-behavior: smooth;
                background: #f8f9fa;
            }

            .chatbot-message {
                margin-bottom: 16px;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
            }

            .chatbot-message.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .chatbot-message.user {
                display: flex;
                justify-content: flex-end;
            }

            .chatbot-message.assistant,
            .chatbot-message.system {
                display: flex;
                justify-content: flex-start;
            }

            .message-content {
                max-width: 80%;
                padding: 12px 16px;
                border-radius: 18px;
                position: relative;
            }

            .chatbot-message.user .message-content {
                background: #1976D2;
                color: white;
                border-bottom-right-radius: 6px;
            }

            .chatbot-message.assistant .message-content,
            .chatbot-message.system .message-content {
                background: white;
                color: #333;
                border: 1px solid #e0e0e0;
                border-bottom-left-radius: 6px;
            }

            .message-text {
                font-size: 14px;
                line-height: 1.4;
                word-wrap: break-word;
            }

            .message-time {
                font-size: 11px;
                opacity: 0.7;
                margin-top: 4px;
                text-align: right;
            }

            .chatbot-message.assistant .message-time {
                text-align: left;
            }

            /* Typing indicator */
            .typing-dots {
                display: flex;
                gap: 4px;
                align-items: center;
                padding: 8px 0;
            }

            .typing-dots span {
                width: 6px;
                height: 6px;
                background: #666;
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }

            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

            @keyframes typing {
                0%, 80%, 100% {
                    transform: scale(0.8);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .chatbot-input-area {
                padding: 16px;
                background: white;
                border-top: 1px solid #e0e0e0;
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            #chatbot-ia-input {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 20px;
                padding: 10px 16px;
                font-size: 14px;
                font-family: inherit;
                resize: none;
                outline: none;
                max-height: 120px;
                min-height: 40px;
                transition: border-color 0.2s;
            }

            #chatbot-ia-input:focus {
                border-color: #1976D2;
            }

            .send-button {
                background: #1976D2;
                color: white;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                font-size: 0;
            }

            .send-button:hover {
                background: #1565C0;
                transform: scale(1.05);
            }

            .send-button::before {
                content: "▶";
                font-size: 14px;
            }

            .chatbot-footer {
                padding: 8px 16px;
                background: #f5f5f5;
                border-top: 1px solid #e0e0e0;
                text-align: center;
            }

            .powered-by {
                font-size: 11px;
                color: #666;
            }

            /* Responsive design */
            @media (max-width: 480px) {
                .chatbot-window {
                    width: calc(100vw - 40px);
                    height: calc(100vh - 100px);
                    bottom: 70px;
                    right: 20px;
                }
            }

            /* Scrollbar styling */
            .chatbot-messages::-webkit-scrollbar {
                width: 6px;
            }

            .chatbot-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .chatbot-messages::-webkit-scrollbar-thumb {
                background: #ddd;
                border-radius: 3px;
            }

            .chatbot-messages::-webkit-scrollbar-thumb:hover {
                background: #bbb;
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * API PÚBLICA
     */
    getSystemStats() {
        return { ...this.systemStatus };
    }

    clearHistory() {
        this.conversationHistory = [];
        localStorage.removeItem('bge-chatbot-history');

        if (this.chatContainer) {
            this.chatContainer.innerHTML = '';
        }

        this.sendWelcomeMessage();
    }

    setUserContext(userType, additionalContext = {}) {
        this.currentContext.userType = userType;
        Object.assign(this.currentContext, additionalContext);

        console.log('👤 Contexto actualizado:', this.currentContext);
    }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si no existe ya una instancia
    if (!window.bgeCharBotIA) {
        window.bgeCharBotIA = new BGEChatbotIAAvanzado();
    }
});

// Exportar para uso global
window.BGEChatbotIAAvanzado = BGEChatbotIAAvanzado;