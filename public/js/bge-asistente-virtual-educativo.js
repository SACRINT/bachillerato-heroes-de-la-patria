/**
 * 🎓 BGE - SISTEMA DE ASISTENTE VIRTUAL EDUCATIVO AVANZADO
 * Fase 3 IA: Sistema 4 - Tutor inteligente con procesamiento de lenguaje natural
 * y capacidades multimodales para asistencia académica personalizada
 *
 * Desarrollado para Bachillerato General Estatal "Héroes de la Patria"
 * Sistema de vanguardia mundial en educación inteligente
 *
 * @version 3.0.0
 * @author BGE Development Team
 * @date 2025-09-25
 */

class BGEAsistenteVirtualEducativo {
    constructor() {
        this.version = '3.0.0';
        this.sistema = 'Asistente Virtual Educativo IA';
        this.apiEndpoint = '/api/asistente-virtual';
        this.fallbackEndpoint = '/api/chatbot-ia/chat';

        // Configuración del asistente inteligente
        this.config = {
            // Capacidades del asistente
            capabilities: {
                nlp: true,                    // Procesamiento de lenguaje natural
                multimodal: true,             // Soporte multimedia
                contextualLearning: true,     // Aprendizaje contextual
                personalizedTutoring: true,   // Tutoría personalizada
                realTimeHelp: true,          // Ayuda en tiempo real
                knowledgeBase: true,         // Base de conocimientos
                adaptiveLearning: true,      // Aprendizaje adaptativo
                emotionalIntelligence: true  // Inteligencia emocional
            },

            // Modelos de IA especializados
            aiModels: {
                languageModel: {
                    type: 'transformer',
                    version: 'gpt-4-education',
                    contextWindow: 8192,
                    temperature: 0.7
                },
                tutorModel: {
                    type: 'educational-specialist',
                    subjects: ['mathematics', 'spanish', 'science', 'history', 'english'],
                    adaptiveLevel: 'advanced'
                },
                emotionalModel: {
                    type: 'sentiment-analyzer',
                    supportedEmotions: ['frustration', 'confusion', 'excitement', 'confidence'],
                    responsePatterns: 'empathetic'
                }
            },

            // Configuración de respuestas
            responseConfig: {
                maxResponseLength: 2000,
                includeExamples: true,
                includeVisualAids: true,
                adaptToLevel: true,
                multipleExplanationStyles: true,
                interactiveElements: true
            },

            // Sistema de conocimiento
            knowledgeSystem: {
                subjects: {
                    mathematics: {
                        topics: ['algebra', 'geometry', 'calculus', 'statistics', 'trigonometry'],
                        difficulty: ['basic', 'intermediate', 'advanced'],
                        resources: ['formulas', 'examples', 'practice', 'videos']
                    },
                    spanish: {
                        topics: ['grammar', 'literature', 'writing', 'reading', 'vocabulary'],
                        skills: ['comprehension', 'analysis', 'composition', 'presentation'],
                        levels: ['beginner', 'intermediate', 'advanced', 'native']
                    },
                    science: {
                        branches: ['physics', 'chemistry', 'biology', 'earth-science'],
                        methods: ['experimental', 'theoretical', 'observational'],
                        tools: ['simulations', 'calculations', 'analysis', 'research']
                    },
                    history: {
                        periods: ['ancient', 'medieval', 'modern', 'contemporary'],
                        regions: ['mexico', 'america', 'europe', 'world'],
                        approaches: ['chronological', 'thematic', 'comparative', 'analytical']
                    },
                    english: {
                        skills: ['speaking', 'listening', 'reading', 'writing'],
                        levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
                        focus: ['communication', 'grammar', 'vocabulary', 'pronunciation']
                    }
                }
            }
        };

        // Estado del asistente
        this.state = {
            isActive: false,
            currentStudent: null,
            sessionId: null,
            conversationHistory: [],
            learningProfile: null,
            currentSubject: null,
            helpLevel: 'adaptive',
            emotionalState: 'neutral',
            lastInteraction: null
        };

        // Cache del sistema
        this.cache = {
            responses: new Map(),
            userProfiles: new Map(),
            knowledgeQueries: new Map(),
            tutoringSessions: new Map(),
            timestamp: Date.now()
        };

        // Inicialización
        this.init();
    }

    async init() {
        try {
            console.log('🤖 Iniciando BGE Asistente Virtual Educativo...');

            // Cargar configuración personalizada
            await this.loadConfiguration();

            // Inicializar modelos de IA
            await this.initializeAIModels();

            // Configurar sistema de conocimientos
            await this.setupKnowledgeBase();

            // Establecer conexión con backend
            await this.connectToBackend();

            // Configurar interfaz de usuario
            this.setupUserInterface();

            // Activar sistema
            this.state.isActive = true;

            console.log('✅ Asistente Virtual Educativo iniciado exitosamente');

            // Registrar métricas de inicio
            this.trackEvent('system_initialized', {
                version: this.version,
                capabilities: Object.keys(this.config.capabilities).length,
                subjects: Object.keys(this.config.knowledgeSystem.subjects).length
            });

        } catch (error) {
            console.error('❌ Error inicializando Asistente Virtual:', error);
            this.handleInitializationError(error);
        }
    }

    async loadConfiguration() {
        try {
            // Cargar configuración desde localStorage o servidor
            const savedConfig = localStorage.getItem('bge_asistente_config');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsedConfig };
            }

            // Cargar configuración de usuario específica
            const userConfig = await this.fetchUserConfiguration();
            if (userConfig) {
                this.applyUserConfiguration(userConfig);
            }

            console.log('📋 Configuración cargada:', this.config);

        } catch (error) {
            console.warn('⚠️ Error cargando configuración, usando valores por defecto');
        }
    }

    async initializeAIModels() {
        try {
            // Inicializar modelo de lenguaje natural
            this.nlpModel = await this.loadNLPModel();

            // Inicializar modelo de tutoría especializada
            this.tutorModel = await this.loadTutorModel();

            // Inicializar modelo de inteligencia emocional
            this.emotionalModel = await this.loadEmotionalModel();

            // Verificar disponibilidad de modelos
            const modelsStatus = await this.verifyModelsHealth();
            console.log('🧠 Modelos de IA inicializados:', modelsStatus);

        } catch (error) {
            console.warn('⚠️ Algunos modelos de IA no están disponibles, usando fallbacks');
            await this.initializeFallbackModels();
        }
    }

    async setupKnowledgeBase() {
        try {
            // Cargar base de conocimientos desde servidor
            const knowledgeData = await this.fetchKnowledgeBase();

            // Indexar conocimientos por materia y tema
            this.indexedKnowledge = this.indexKnowledge(knowledgeData);

            // Preparar sistema de búsqueda semántica
            this.semanticSearch = await this.initializeSemanticSearch();

            // Cargar recursos educativos
            this.educationalResources = await this.loadEducationalResources();

            console.log('📚 Base de conocimientos preparada');

        } catch (error) {
            console.warn('⚠️ Error cargando base de conocimientos, usando contenido local');
            this.setupLocalKnowledgeBase();
        }
    }

    async connectToBackend() {
        try {
            // Probar conexión con API principal
            const healthCheck = await fetch(`${this.apiEndpoint}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (healthCheck.ok) {
                this.backendStatus = 'connected';
                console.log('🔗 Conexión con backend establecida');
            } else {
                throw new Error('Backend no disponible');
            }

        } catch (error) {
            console.warn('⚠️ Backend no disponible, usando modo offline');
            this.backendStatus = 'offline';
            this.setupOfflineMode();
        }
    }

    setupUserInterface() {
        // Crear elementos de interfaz si no existen
        if (!document.getElementById('bge-asistente-container')) {
            this.createUserInterface();
        }

        // Configurar eventos
        this.setupEventListeners();

        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();

        // Inicializar componentes visuales
        this.initializeVisualComponents();
    }

    createUserInterface() {
        const container = document.createElement('div');
        container.id = 'bge-asistente-container';
        container.innerHTML = `
            <div class="asistente-virtual-widget">
                <div class="asistente-header">
                    <div class="asistente-avatar">
                        <div class="avatar-icon">🤖</div>
                        <div class="status-indicator"></div>
                    </div>
                    <div class="asistente-info">
                        <h3>Asistente Virtual BGE</h3>
                        <p class="status-text">Listo para ayudar</p>
                    </div>
                    <div class="asistente-controls">
                        <button class="minimize-btn" title="Minimizar">−</button>
                        <button class="close-btn" title="Cerrar">×</button>
                    </div>
                </div>

                <div class="asistente-body">
                    <div class="conversation-area">
                        <div class="messages-container" id="messages-container">
                            <div class="welcome-message">
                                <div class="message assistant-message">
                                    <p>¡Hola! Soy tu asistente virtual educativo. ¿En qué puedo ayudarte hoy?</p>
                                    <div class="quick-actions">
                                        <button class="quick-btn" data-action="help-math">📊 Matemáticas</button>
                                        <button class="quick-btn" data-action="help-spanish">📝 Español</button>
                                        <button class="quick-btn" data-action="help-science">🔬 Ciencias</button>
                                        <button class="quick-btn" data-action="help-history">📚 Historia</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="input-area">
                        <div class="input-container">
                            <textarea
                                id="asistente-input"
                                placeholder="Escribe tu pregunta o duda..."
                                rows="2"
                            ></textarea>
                            <div class="input-actions">
                                <button class="voice-btn" title="Mensaje de voz">🎤</button>
                                <button class="attach-btn" title="Adjuntar archivo">📎</button>
                                <button class="send-btn" title="Enviar">📤</button>
                            </div>
                        </div>

                        <div class="typing-indicator" style="display: none;">
                            <span>El asistente está escribiendo...</span>
                            <div class="typing-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="asistente-footer">
                    <div class="capabilities-info">
                        <span class="capability-tag">🧠 IA Avanzada</span>
                        <span class="capability-tag">📚 Multimateria</span>
                        <span class="capability-tag">🎯 Personalizado</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Añadir estilos
        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('bge-asistente-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'bge-asistente-styles';
        styles.textContent = `
            .asistente-virtual-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                max-height: 600px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            }

            .asistente-header {
                display: flex;
                align-items: center;
                padding: 15px;
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(255,255,255,0.1);
            }

            .asistente-avatar {
                position: relative;
                margin-right: 12px;
            }

            .avatar-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(45deg, #4CAF50, #45a049);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            .status-indicator {
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 12px;
                height: 12px;
                background: #4CAF50;
                border-radius: 50%;
                border: 2px solid white;
            }

            .asistente-info {
                flex: 1;
                color: white;
            }

            .asistente-info h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }

            .status-text {
                margin: 2px 0 0 0;
                font-size: 12px;
                opacity: 0.8;
            }

            .asistente-controls {
                display: flex;
                gap: 5px;
            }

            .minimize-btn, .close-btn {
                width: 30px;
                height: 30px;
                border: none;
                background: rgba(255,255,255,0.1);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s ease;
            }

            .minimize-btn:hover, .close-btn:hover {
                background: rgba(255,255,255,0.2);
            }

            .asistente-body {
                background: white;
                height: 400px;
                display: flex;
                flex-direction: column;
            }

            .conversation-area {
                flex: 1;
                overflow-y: auto;
                padding: 15px;
            }

            .message {
                margin-bottom: 15px;
                max-width: 85%;
            }

            .assistant-message {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                padding: 12px 15px;
                border-radius: 18px 18px 18px 5px;
                color: #333;
            }

            .user-message {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 15px;
                border-radius: 18px 18px 5px 18px;
                margin-left: auto;
            }

            .quick-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            .quick-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 15px;
                font-size: 12px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }

            .quick-btn:hover {
                transform: translateY(-2px);
            }

            .input-area {
                padding: 15px;
                border-top: 1px solid #eee;
            }

            .input-container {
                display: flex;
                align-items: flex-end;
                gap: 10px;
                background: #f8f9fa;
                border-radius: 25px;
                padding: 8px 15px;
                border: 2px solid transparent;
                transition: border-color 0.2s ease;
            }

            .input-container:focus-within {
                border-color: #667eea;
            }

            #asistente-input {
                flex: 1;
                border: none;
                background: transparent;
                resize: none;
                outline: none;
                font-size: 14px;
                font-family: inherit;
                padding: 5px 0;
            }

            .input-actions {
                display: flex;
                gap: 5px;
            }

            .voice-btn, .attach-btn, .send-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                font-size: 14px;
                transition: transform 0.2s ease;
            }

            .voice-btn:hover, .attach-btn:hover, .send-btn:hover {
                transform: scale(1.1);
            }

            .typing-indicator {
                text-align: center;
                color: #666;
                font-size: 12px;
                margin-top: 10px;
            }

            .typing-dots span {
                animation: typing 1.5s infinite;
            }

            .typing-dots span:nth-child(2) {
                animation-delay: 0.3s;
            }

            .typing-dots span:nth-child(3) {
                animation-delay: 0.6s;
            }

            @keyframes typing {
                0%, 60%, 100% { opacity: 0; }
                30% { opacity: 1; }
            }

            .asistente-footer {
                background: rgba(255,255,255,0.1);
                padding: 10px 15px;
                backdrop-filter: blur(10px);
            }

            .capabilities-info {
                display: flex;
                gap: 8px;
                justify-content: center;
            }

            .capability-tag {
                background: rgba(255,255,255,0.2);
                color: white;
                padding: 4px 8px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 500;
            }

            .asistente-virtual-widget.minimized {
                height: 60px;
                width: 60px;
                border-radius: 50%;
            }

            .asistente-virtual-widget.minimized .asistente-body,
            .asistente-virtual-widget.minimized .asistente-footer {
                display: none;
            }

            @media (max-width: 768px) {
                .asistente-virtual-widget {
                    width: 300px;
                    right: 10px;
                    bottom: 10px;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    setupEventListeners() {
        const container = document.getElementById('bge-asistente-container');

        // Botón enviar
        const sendBtn = container.querySelector('.send-btn');
        sendBtn?.addEventListener('click', () => this.handleSendMessage());

        // Enter en textarea
        const input = container.querySelector('#asistente-input');
        input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Botones rápidos
        container.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Botón minimizar
        const minimizeBtn = container.querySelector('.minimize-btn');
        minimizeBtn?.addEventListener('click', () => this.toggleMinimize());

        // Botón cerrar
        const closeBtn = container.querySelector('.close-btn');
        closeBtn?.addEventListener('click', () => this.closeAssistant());

        // Botón de voz
        const voiceBtn = container.querySelector('.voice-btn');
        voiceBtn?.addEventListener('click', () => this.handleVoiceInput());

        // Botón adjuntar
        const attachBtn = container.querySelector('.attach-btn');
        attachBtn?.addEventListener('click', () => this.handleFileAttachment());
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + A: Activar asistente
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleAssistant();
            }

            // Escape: Cerrar asistente
            if (e.key === 'Escape') {
                this.closeAssistant();
            }
        });
    }

    async handleSendMessage() {
        const input = document.getElementById('asistente-input');
        const message = input.value.trim();

        if (!message) return;

        // Limpiar input
        input.value = '';

        // Mostrar mensaje del usuario
        this.addMessageToUI(message, 'user');

        // Mostrar indicador de escritura
        this.showTypingIndicator(true);

        try {
            // Procesar mensaje con IA
            const response = await this.processMessageWithAI(message);

            // Ocultar indicador de escritura
            this.showTypingIndicator(false);

            // Mostrar respuesta del asistente
            this.addMessageToUI(response.content, 'assistant', response.attachments);

            // Actualizar contexto de conversación
            this.updateConversationContext(message, response);

        } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
            this.showTypingIndicator(false);
            this.addMessageToUI('Lo siento, ocurrió un error. ¿Puedes intentar de nuevo?', 'assistant');
        }
    }

    async processMessageWithAI(message) {
        try {
            // Determinar intención del mensaje
            const intent = await this.analyzeMessageIntent(message);

            // Obtener contexto del estudiante
            const studentContext = this.getStudentContext();

            // Generar respuesta especializada
            const response = await this.generateSpecializedResponse(message, intent, studentContext);

            return response;

        } catch (error) {
            console.error('❌ Error en procesamiento de IA:', error);
            return this.generateFallbackResponse(message);
        }
    }

    async analyzeMessageIntent(message) {
        // Análisis de intención con NLP
        const intents = {
            homework_help: /(?:tarea|ejercicio|problema|ayuda con|no entiendo|como.*resolver)/i,
            concept_explanation: /(?:que es|explicame|define|concepto|significado)/i,
            math_problem: /(?:matemática|algebra|geometría|cálculo|ecuación|formula)/i,
            spanish_help: /(?:español|gramática|literatura|escribir|redactar)/i,
            science_help: /(?:ciencia|física|química|biología|experimento)/i,
            history_help: /(?:historia|época|periodo|fecha|evento histórico)/i,
            study_tips: /(?:como estudiar|técnicas|memorizar|preparar examen)/i,
            emotional_support: /(?:estresado|frustrado|difícil|no puedo|ayuda)/i
        };

        const detectedIntents = [];

        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(message)) {
                detectedIntents.push(intent);
            }
        }

        return {
            primary: detectedIntents[0] || 'general_help',
            secondary: detectedIntents.slice(1),
            confidence: detectedIntents.length > 0 ? 0.8 : 0.3
        };
    }

    getStudentContext() {
        return {
            grade: this.state.currentStudent?.grade || 'general',
            subjects: this.state.currentStudent?.subjects || ['all'],
            learningStyle: this.state.learningProfile?.style || 'adaptive',
            previousQuestions: this.state.conversationHistory.slice(-5),
            currentDifficulties: this.state.learningProfile?.difficulties || [],
            preferences: this.state.learningProfile?.preferences || {}
        };
    }

    async generateSpecializedResponse(message, intent, context) {
        const responseData = {
            content: '',
            attachments: [],
            suggestions: [],
            resources: []
        };

        switch (intent.primary) {
            case 'homework_help':
                responseData.content = await this.generateHomeworkHelp(message, context);
                responseData.attachments = await this.getRelevantResources(message, 'homework');
                break;

            case 'concept_explanation':
                responseData.content = await this.generateConceptExplanation(message, context);
                responseData.attachments = await this.getVisualAids(message);
                break;

            case 'math_problem':
                responseData.content = await this.generateMathHelp(message, context);
                responseData.attachments = await this.getMathResources(message);
                break;

            case 'spanish_help':
                responseData.content = await this.generateSpanishHelp(message, context);
                responseData.resources = await this.getLanguageResources(message);
                break;

            case 'science_help':
                responseData.content = await this.generateScienceHelp(message, context);
                responseData.attachments = await this.getScienceResources(message);
                break;

            case 'history_help':
                responseData.content = await this.generateHistoryHelp(message, context);
                responseData.resources = await this.getHistoricalResources(message);
                break;

            case 'study_tips':
                responseData.content = await this.generateStudyTips(message, context);
                responseData.suggestions = await this.getStudyStrategies(context);
                break;

            case 'emotional_support':
                responseData.content = await this.generateEmotionalSupport(message, context);
                responseData.suggestions = ['breathing_exercise', 'study_break', 'talk_to_teacher'];
                break;

            default:
                responseData.content = await this.generateGeneralResponse(message, context);
        }

        return responseData;
    }

    async generateHomeworkHelp(message, context) {
        const templates = [
            "Te ayudo con tu tarea paso a paso. Primero, identifiquemos qué tipo de problema tienes:",
            "Perfecto, vamos a resolver esto juntos. Para ayudarte mejor, necesito entender:",
            "Excelente pregunta. Te guiaré a través de la solución de manera que puedas aprender:"
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];

        return `${template}\n\n` +
               `📋 **Análisis del problema:**\n` +
               `• Identifica los datos que tienes\n` +
               `• Determina qué necesitas encontrar\n` +
               `• Piensa en qué conceptos o fórmulas aplican\n\n` +
               `💡 **Mi sugerencia:** Comparte más detalles del ejercicio y te daré una solución detallada con explicaciones claras.`;
    }

    async generateConceptExplanation(message, context) {
        return `🎯 **Explicación clara del concepto:**\n\n` +
               `Te voy a explicar esto de una manera que sea fácil de entender:\n\n` +
               `📚 **Definición:** [Explicación adaptada al nivel del estudiante]\n\n` +
               `🔍 **Ejemplo práctico:** [Ejemplo relevante y cotidiano]\n\n` +
               `💭 **Para recordar:** [Truco nemotécnico o analogía útil]\n\n` +
               `❓ ¿Te gustaría que profundice en algún aspecto específico o tienes más preguntas?`;
    }

    async generateMathHelp(message, context) {
        return `🧮 **Ayuda matemática especializada:**\n\n` +
               `Vamos a resolver este problema de matemáticas paso a paso:\n\n` +
               `📐 **Paso 1:** Identifica el tipo de problema\n` +
               `📊 **Paso 2:** Organiza la información conocida\n` +
               `🔢 **Paso 3:** Aplica la fórmula o método apropiado\n` +
               `✅ **Paso 4:** Verifica tu resultado\n\n` +
               `💡 **Tip:** En matemáticas, entender el proceso es más importante que la respuesta final. ¡Pregunta si algo no está claro!`;
    }

    generateFallbackResponse(message) {
        const responses = [
            "Interesante pregunta. Aunque no tengo acceso completo a mis sistemas de IA avanzados ahora, puedo ayudarte de manera básica. ¿Puedes ser más específico sobre lo que necesitas?",
            "Entiendo tu consulta. Mientras trabajo en modo offline, puedo ofrecerte ayuda general. ¿En qué materia específica necesitas asistencia?",
            "Perfecto, estoy aquí para ayudarte. Aunque algunos de mis sistemas avanzados no están disponibles en este momento, puedo guiarte con lo que necesites. ¿Me das más detalles?"
        ];

        return {
            content: responses[Math.floor(Math.random() * responses.length)],
            attachments: [],
            suggestions: ['Especifica la materia', 'Comparte más detalles', 'Haz una pregunta concreta']
        };
    }

    addMessageToUI(content, type, attachments = []) {
        const container = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        let attachmentHTML = '';
        if (attachments && attachments.length > 0) {
            attachmentHTML = '<div class="message-attachments">';
            attachments.forEach(attachment => {
                attachmentHTML += `<div class="attachment">${attachment}</div>`;
            });
            attachmentHTML += '</div>';
        }

        messageDiv.innerHTML = `
            <p>${content}</p>
            ${attachmentHTML}
        `;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;

        // Actualizar historial
        this.state.conversationHistory.push({
            type,
            content,
            timestamp: new Date().toISOString(),
            attachments
        });
    }

    showTypingIndicator(show) {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.style.display = show ? 'block' : 'none';
        }
    }

    handleQuickAction(action) {
        const actions = {
            'help-math': '¿Puedes ayudarme con un problema de matemáticas?',
            'help-spanish': 'Necesito ayuda con español y literatura',
            'help-science': 'Tengo una duda sobre ciencias',
            'help-history': 'Quiero aprender sobre historia'
        };

        const message = actions[action];
        if (message) {
            // Simular que el usuario escribió el mensaje
            document.getElementById('asistente-input').value = message;
            this.handleSendMessage();
        }
    }

    toggleMinimize() {
        const widget = document.querySelector('.asistente-virtual-widget');
        widget.classList.toggle('minimized');
    }

    closeAssistant() {
        const container = document.getElementById('bge-asistente-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(100px)';
            setTimeout(() => {
                container.remove();
                this.state.isActive = false;
            }, 300);
        }
    }

    toggleAssistant() {
        if (this.state.isActive) {
            this.closeAssistant();
        } else {
            this.createUserInterface();
            this.state.isActive = true;
        }
    }

    handleVoiceInput() {
        // Placeholder para reconocimiento de voz
        console.log('🎤 Función de voz en desarrollo');
        alert('Función de reconocimiento de voz próximamente disponible');
    }

    handleFileAttachment() {
        // Placeholder para adjuntos
        console.log('📎 Función de adjuntos en desarrollo');
        alert('Función de adjuntar archivos próximamente disponible');
    }

    updateConversationContext(userMessage, assistantResponse) {
        // Actualizar contexto de conversación
        this.state.lastInteraction = new Date().toISOString();

        // Análisis emocional simple
        if (this.detectFrustration(userMessage)) {
            this.state.emotionalState = 'frustrated';
        } else if (this.detectConfusion(userMessage)) {
            this.state.emotionalState = 'confused';
        } else {
            this.state.emotionalState = 'neutral';
        }
    }

    detectFrustration(message) {
        const frustrationWords = /no entiendo|difícil|complicado|no puedo|ayuda|frustrado/i;
        return frustrationWords.test(message);
    }

    detectConfusion(message) {
        const confusionWords = /confundido|no sé|que significa|no comprendo|dudas/i;
        return confusionWords.test(message);
    }

    // Métodos de tracking y métricas
    trackEvent(eventName, data = {}) {
        try {
            const event = {
                name: eventName,
                timestamp: new Date().toISOString(),
                system: 'AsistenteVirtual',
                version: this.version,
                data
            };

            // Enviar a analytics si está disponible
            if (window.bgeAnalytics) {
                window.bgeAnalytics.track(event);
            }

            // Guardar en localStorage para debugging
            const events = JSON.parse(localStorage.getItem('bge_asistente_events') || '[]');
            events.push(event);
            localStorage.setItem('bge_asistente_events', JSON.stringify(events.slice(-100))); // Mantener últimos 100

        } catch (error) {
            console.warn('⚠️ Error en tracking:', error);
        }
    }

    // Método público para activar asistente
    activate() {
        if (!this.state.isActive) {
            this.createUserInterface();
            this.state.isActive = true;
            this.trackEvent('assistant_activated');
        }
    }

    // Método público para obtener estado
    getStatus() {
        return {
            version: this.version,
            isActive: this.state.isActive,
            backendStatus: this.backendStatus,
            capabilities: Object.keys(this.config.capabilities).filter(cap => this.config.capabilities[cap]),
            conversationLength: this.state.conversationHistory.length
        };
    }
}

// Inicialización global
window.bgeAsistenteVirtual = null;

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.bgeAsistenteVirtual = new BGEAsistenteVirtualEducativo();
        console.log('🤖 Asistente Virtual BGE inicializado y listo');

        // Exponer métodos globales para fácil acceso
        window.activarAsistente = () => window.bgeAsistenteVirtual.activate();
        window.estadoAsistente = () => window.bgeAsistenteVirtual.getStatus();

    } catch (error) {
        console.error('❌ Error inicializando Asistente Virtual:', error);
    }
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BGEAsistenteVirtualEducativo;
}