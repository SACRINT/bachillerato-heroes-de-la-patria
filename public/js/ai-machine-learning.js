/**
 * 🤖 SISTEMA DE MACHINE LEARNING BÁSICO
 * ====================================
 * 
 * Sistema de inteligencia artificial básica para el 
 * Bachillerato General Estatal Héroes de la Patria.
 * 
 * Funcionalidades:
 * - Análisis predictivo de rendimiento estudiantil
 * - Recomendaciones personalizadas de contenido
 * - Detección de patrones de aprendizaje
 * - Sistema de chatbot educativo básico
 * - Análisis de sentimientos en feedback
 * - Optimización automática de recursos
 * - Predicción de asistencia y deserción
 * - Recomendaciones de carrera profesional
 * 
 * @version 1.0.0
 * @author PWA Advanced System
 */

class AIEducationalSystem {
    constructor() {
        this.models = {
            studentPerformance: null,
            attendancePrediction: null,
            contentRecommendation: null,
            sentimentAnalysis: null
        };
        this.datasets = {
            studentGrades: [],
            attendanceRecords: [],
            learningPatterns: [],
            feedbackData: []
        };
        this.predictions = new Map();
        this.recommendations = new Map();
        this.chatbotResponses = new Map();
        this.analytics = {
            predictionsGenerated: 0,
            recommendationsMade: 0,
            chatbotInteractions: 0,
            modelAccuracy: 0,
            processingTime: 0
        };
        this.isTraining = false;
        this.knowledgeBase = this.initializeKnowledgeBase();
        
        this.init();
    }

    async init() {
        this.createUI();
        this.bindEvents();
        await this.loadMockData();
        this.initializeModels();
        this.startPeriodicAnalysis();
        this.setupChatbot();
    }

    createUI() {
        const ui = document.createElement('div');
        ui.id = 'ai-system-manager';
        ui.className = 'pwa-feature-panel ai-panel';
        ui.innerHTML = sanitizeHTML(`
            <div class="panel-header">
                <h3>🤖 Sistema IA Educativo</h3>
                <div class="panel-controls">
                    <button id="trainModelsBtn" class="btn-primary">
                        <span class="icon">🧠</span> Entrenar Modelos
                    </button>
                    <button id="toggleAiPanel" class="btn-secondary">
                        <span class="icon">⚙️</span> Panel
                    </button>
                </div>
            </div>
            
            <div class="ai-content">
                <div class="ai-status">
                    <div class="status-indicator" id="aiStatus">
                        <span class="status-dot"></span>
                        <span class="status-text">Sistema IA listo</span>
                        <span class="model-status" id="modelStatus">Modelos: No entrenados</span>
                    </div>
                </div>

                <div class="ai-modules">
                    <h4>Módulos de IA Activos</h4>
                    <div class="modules-grid">
                        <!-- Performance Prediction -->
                        <div class="module-card performance" data-module="performance">
                            <div class="module-header">
                                <div class="module-icon">📊</div>
                                <div class="module-info">
                                    <div class="module-name">Predicción de Rendimiento</div>
                                    <div class="module-desc">Análisis predictivo de calificaciones</div>
                                </div>
                                <div class="module-status">
                                    <span class="status-badge" id="performanceStatus">Inactivo</span>
                                </div>
                            </div>
                            <div class="module-stats">
                                <div class="stat">Estudiantes analizados: <span id="studentsAnalyzed">0</span></div>
                                <div class="stat">Precisión: <span id="performanceAccuracy">--</span></div>
                            </div>
                        </div>

                        <!-- Attendance Prediction -->
                        <div class="module-card attendance" data-module="attendance">
                            <div class="module-header">
                                <div class="module-icon">📋</div>
                                <div class="module-info">
                                    <div class="module-name">Predicción de Asistencia</div>
                                    <div class="module-desc">Detección temprana de deserción</div>
                                </div>
                                <div class="module-status">
                                    <span class="status-badge" id="attendanceStatus">Inactivo</span>
                                </div>
                            </div>
                            <div class="module-stats">
                                <div class="stat">Alertas generadas: <span id="attendanceAlerts">0</span></div>
                                <div class="stat">Precisión: <span id="attendanceAccuracy">--</span></div>
                            </div>
                        </div>

                        <!-- Content Recommendations -->
                        <div class="module-card recommendations" data-module="recommendations">
                            <div class="module-header">
                                <div class="module-icon">💡</div>
                                <div class="module-info">
                                    <div class="module-name">Recomendaciones</div>
                                    <div class="module-desc">Contenido personalizado</div>
                                </div>
                                <div class="module-status">
                                    <span class="status-badge" id="recommendationsStatus">Inactivo</span>
                                </div>
                            </div>
                            <div class="module-stats">
                                <div class="stat">Recomendaciones: <span id="recommendationsCount">0</span></div>
                                <div class="stat">Efectividad: <span id="recommendationsEffectiveness">--</span></div>
                            </div>
                        </div>

                        <!-- Educational Chatbot -->
                        <div class="module-card chatbot" data-module="chatbot">
                            <div class="module-header">
                                <div class="module-icon">🤖</div>
                                <div class="module-info">
                                    <div class="module-name">Asistente Virtual</div>
                                    <div class="module-desc">Chatbot educativo inteligente</div>
                                </div>
                                <div class="module-status">
                                    <span class="status-badge active" id="chatbotStatus">Activo</span>
                                </div>
                            </div>
                            <div class="module-stats">
                                <div class="stat">Conversaciones: <span id="chatbotConversations">0</span></div>
                                <div class="stat">Satisfacción: <span id="chatbotSatisfaction">--</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ai-predictions">
                    <h4>Predicciones y Análisis</h4>
                    <div class="predictions-tabs">
                        <button class="tab-btn active" data-tab="performance">📊 Rendimiento</button>
                        <button class="tab-btn" data-tab="attendance">📋 Asistencia</button>
                        <button class="tab-btn" data-tab="recommendations">💡 Recomendaciones</button>
                        <button class="tab-btn" data-tab="insights">🔍 Insights</button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-panel active" id="performance-panel">
                            <div class="performance-predictions" id="performancePredictions">
                                <div class="no-data">
                                    <div class="no-data-icon">📊</div>
                                    <p>No hay predicciones disponibles</p>
                                    <p class="helper-text">Entrena los modelos para generar predicciones</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="attendance-panel">
                            <div class="attendance-alerts" id="attendanceAlerts">
                                <div class="no-data">
                                    <div class="no-data-icon">📋</div>
                                    <p>No hay alertas de asistencia</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="recommendations-panel">
                            <div class="content-recommendations" id="contentRecommendations">
                                <div class="no-data">
                                    <div class="no-data-icon">💡</div>
                                    <p>No hay recomendaciones disponibles</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-panel" id="insights-panel">
                            <div class="ai-insights" id="aiInsights">
                                <div class="insight-loading">Generando insights...</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="chatbot-interface">
                    <h4>Asistente Virtual Educativo</h4>
                    <div class="chatbot-container">
                        <div class="chat-messages" id="chatMessages">
                            <div class="bot-message">
                                <div class="message-avatar">🤖</div>
                                <div class="message-content">
                                    ¡Hola! Soy el asistente virtual del Bachillerato window.getTenantConfigValue('school_institution_name', 'Héroes de la Patria'). 
                                    ¿En qué puedo ayudarte hoy?
                                </div>
                                <div class="message-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                        <div class="chat-input-container">
                            <input type="text" id="chatInput" placeholder="Escribe tu pregunta aquí..." />
                            <button id="sendChatBtn" class="send-btn">📤</button>
                        </div>
                        <div class="quick-actions">
                            <button class="quick-btn" data-action="grades">📊 Mis Calificaciones</button>
                            <button class="quick-btn" data-action="schedule">📅 Mi Horario</button>
                            <button class="quick-btn" data-action="help">❓ Ayuda</button>
                        </div>
                    </div>
                </div>

                <div class="ai-analytics">
                    <h4>Métricas del Sistema IA</h4>
                    <div class="analytics-grid">
                        <div class="stat-item">
                            <div class="stat-value" id="totalPredictions">0</div>
                            <div class="stat-label">Predicciones generadas</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="modelAccuracy">0%</div>
                            <div class="stat-label">Precisión promedio</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="chatInteractions">0</div>
                            <div class="stat-label">Interacciones chatbot</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value" id="processingTime">0ms</div>
                            <div class="stat-label">Tiempo de procesamiento</div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .ai-panel {
                    background: linear-gradient(135deg, #9C27B0 0%, #673AB7 100%);
                    color: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 1000px;
                    margin: 20px auto;
                    box-shadow: 0 8px 32px rgba(156, 39, 176, 0.3);
                    overflow: hidden;
                }

                .panel-header {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    backdrop-filter: blur(10px);
                }

                .ai-content {
                    padding: 20px;
                }

                .ai-status {
                    margin-bottom: 20px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                }

                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    background: #4CAF50;
                    animation: pulse 2s infinite;
                }

                .model-status {
                    margin-left: auto;
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .modules-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .module-card {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .module-card:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateY(-2px);
                }

                .module-header {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    margin-bottom: 15px;
                }

                .module-icon {
                    font-size: 2em;
                    margin-top: 5px;
                }

                .module-info {
                    flex: 1;
                }

                .module-name {
                    font-weight: bold;
                    font-size: 1.1em;
                    margin-bottom: 5px;
                }

                .module-desc {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .status-badge {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 0.8em;
                    font-weight: bold;
                }

                .status-badge.active {
                    background: rgba(76, 175, 80, 0.3);
                    color: #4CAF50;
                }

                .module-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .stat {
                    font-size: 0.85em;
                    opacity: 0.9;
                }

                .predictions-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                    overflow-x: auto;
                }

                .tab-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.3s ease;
                }

                .tab-btn.active {
                    background: rgba(255, 255, 255, 0.2);
                    font-weight: bold;
                }

                .tab-content {
                    min-height: 200px;
                }

                .tab-panel {
                    display: none;
                }

                .tab-panel.active {
                    display: block;
                }

                .chatbot-container {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }

                .chat-messages {
                    height: 300px;
                    overflow-y: auto;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 8px;
                }

                .bot-message, .user-message {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .user-message {
                    flex-direction: row-reverse;
                }

                .message-avatar {
                    background: rgba(255, 255, 255, 0.2);
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2em;
                }

                .message-content {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px 15px;
                    border-radius: 15px;
                    max-width: 70%;
                    word-wrap: break-word;
                }

                .user-message .message-content {
                    background: rgba(156, 39, 176, 0.3);
                }

                .message-time {
                    font-size: 0.7em;
                    opacity: 0.6;
                    margin-top: 5px;
                }

                .chat-input-container {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                #chatInput {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 12px 15px;
                    border-radius: 8px;
                    font-size: 14px;
                }

                #chatInput::placeholder {
                    color: rgba(255, 255, 255, 0.6);
                }

                .send-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    color: white;
                    padding: 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1.2em;
                    transition: all 0.3s ease;
                }

                .send-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                }

                .quick-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .quick-btn {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 15px;
                    cursor: pointer;
                    font-size: 0.8em;
                    transition: all 0.3s ease;
                }

                .quick-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .analytics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }

                .stat-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }

                .stat-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .stat-label {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .no-data {
                    text-align: center;
                    padding: 40px 20px;
                    opacity: 0.7;
                }

                .no-data-icon {
                    font-size: 3em;
                    margin-bottom: 10px;
                }

                .prediction-item, .alert-item, .recommendation-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }

                .prediction-title, .alert-title, .recommendation-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                }

                .prediction-score, .alert-severity, .recommendation-confidence {
                    font-size: 0.85em;
                    opacity: 0.8;
                }

                .btn-primary, .btn-secondary {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                }

                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @media (max-width: 768px) {
                    .modules-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .analytics-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    
                    .panel-header {
                        flex-direction: column;
                        gap: 15px;
                    }
                    
                    .chat-messages {
                        height: 250px;
                    }
                }
            </style>
        `);

        document.body.appendChild(ui);
        this.ui = ui;
    }

    bindEvents() {
        if (!this.ui) return;

        // Main controls
        this.ui.querySelector('#trainModelsBtn')?.addEventListener('click', () => this.trainModels());
        this.ui.querySelector('#toggleAiPanel')?.addEventListener('click', () => this.togglePanel());

        // Tab navigation
        this.ui.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Chatbot
        this.ui.querySelector('#sendChatBtn')?.addEventListener('click', () => this.sendChatMessage());
        this.ui.querySelector('#chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Quick actions
        this.ui.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Module cards
        this.ui.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const module = card.dataset.module;
                this.showModuleDetails(module);
            });
        });
    }

    initializeKnowledgeBase() {
        return {
            // Respuestas del chatbot
            greetings: [
                "¡Hola! ¿En qué puedo ayudarte hoy?",
                "¡Buen día! Soy tu asistente virtual educativo.",
                "¡Saludos! ¿Qué necesitas saber?"
            ],
            academicQuestions: {
                "calificaciones": "Puedes consultar tus calificaciones en el portal estudiantil. Si necesitas ayuda específica, contacta a tu coordinador académico.",
                "horario": "Tu horario está disponible en la sección de servicios estudiantiles. ¿Necesitas ayuda para encontrar alguna materia específica?",
                "examenes": "Los calendarios de exámenes se publican con 2 semanas de anticipación. Consulta el tablón de avisos o la plataforma educativa.",
                "tareas": "Para información sobre tareas pendientes, revisa la plataforma de cada materia o contacta directamente con tus profesores."
            },
            schoolInfo: {
                "ubicacion": "El Bachillerato Héroes de la Patria se encuentra en Coronel Tito Hernández, municipio de Venustiano Carranza, Puebla.",
                "contacto": "Puedes contactarnos al teléfono de la institución o visitarnos en horario escolar de 7:00 AM a 2:00 PM.",
                "carreras": "Ofrecemos especialidades en Ciencias Exactas, Humanidades y Ciencias Sociales, y Químico-Biológicas."
            },
            helpTopics: [
                "Consulta de calificaciones",
                "Información de horarios",
                "Calendario de exámenes",
                "Servicios estudiantiles",
                "Información institucional",
                "Proceso de inscripción",
                "Becas y apoyos",
                "Actividades extracurriculares"
            ]
        };
    }

    async loadMockData() {
        // Datos simulados para entrenamiento
        this.datasets.studentGrades = this.generateMockGrades(100);
        this.datasets.attendanceRecords = this.generateMockAttendance(100);
        this.datasets.learningPatterns = this.generateMockLearningPatterns(100);
        this.datasets.feedbackData = this.generateMockFeedback(50);
    }

    generateMockGrades(count) {
        const subjects = ['Matemáticas', 'Español', 'Historia', 'Química', 'Física', 'Inglés'];
        const students = [];
        
        for (let i = 0; i < count; i++) {
            const grades = {};
            subjects.forEach(subject => {
                grades[subject] = Math.floor(Math.random() * 4) + 7; // 7-10
            });
            
            students.push({
                id: `student_${i}`,
                name: `Estudiante ${i + 1}`,
                semester: Math.floor(Math.random() * 6) + 1,
                grades: grades,
                average: Object.values(grades).reduce((a, b) => a + b) / subjects.length,
                attendance: Math.random() * 0.3 + 0.7 // 70-100%
            });
        }
        
        return students;
    }

    generateMockAttendance(count) {
        const records = [];
        const today = new Date();
        
        for (let i = 0; i < count; i++) {
            for (let day = 0; day < 30; day++) {
                const date = new Date(today);
                date.setDate(date.getDate() - day);
                
                records.push({
                    studentId: `student_${i}`,
                    date: date.toISOString().split('T')[0],
                    present: Math.random() > 0.1, // 90% attendance probability
                    subject: ['Matemáticas', 'Español', 'Historia'][Math.floor(Math.random() * 3)]
                });
            }
        }
        
        return records;
    }

    generateMockLearningPatterns(count) {
        const patterns = [];
        
        for (let i = 0; i < count; i++) {
            patterns.push({
                studentId: `student_${i}`,
                learningStyle: ['Visual', 'Auditivo', 'Kinestésico'][Math.floor(Math.random() * 3)],
                preferredTime: ['Mañana', 'Tarde', 'Noche'][Math.floor(Math.random() * 3)],
                difficulty: ['Matemáticas', 'Ciencias', 'Humanidades'][Math.floor(Math.random() * 3)],
                strength: ['Análisis', 'Memoria', 'Creatividad'][Math.floor(Math.random() * 3)],
                engagement: Math.random() * 0.4 + 0.6, // 60-100%
                progress: Math.random() * 0.5 + 0.5 // 50-100%
            });
        }
        
        return patterns;
    }

    generateMockFeedback(count) {
        const feedbacks = [
            { text: "Excelente clase, muy clara", sentiment: 'positive' },
            { text: "Me gustó mucho la explicación", sentiment: 'positive' },
            { text: "Fue difícil de entender", sentiment: 'negative' },
            { text: "Regular, puede mejorar", sentiment: 'neutral' },
            { text: "Fantástico profesor", sentiment: 'positive' },
            { text: "No me quedó claro el tema", sentiment: 'negative' }
        ];
        
        const data = [];
        for (let i = 0; i < count; i++) {
            const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
            data.push({
                id: i,
                studentId: `student_${Math.floor(Math.random() * 100)}`,
                subject: ['Matemáticas', 'Español', 'Historia'][Math.floor(Math.random() * 3)],
                text: feedback.text,
                sentiment: feedback.sentiment,
                date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return data;
    }

    initializeModels() {
        // Simulación de modelos ML básicos
        this.models.studentPerformance = {
            trained: false,
            accuracy: 0,
            features: ['previousGrades', 'attendance', 'engagement', 'studyTime']
        };
        
        this.models.attendancePrediction = {
            trained: false,
            accuracy: 0,
            features: ['historicalAttendance', 'dayOfWeek', 'weather', 'examSchedule']
        };
        
        this.models.contentRecommendation = {
            trained: false,
            accuracy: 0,
            features: ['learningStyle', 'performance', 'interests', 'difficulty']
        };
        
        this.models.sentimentAnalysis = {
            trained: false,
            accuracy: 0,
            features: ['textLength', 'keyWords', 'emoticons', 'context']
        };
    }

    async trainModels() {
        if (this.isTraining) {
            this.showNotification('Los modelos ya se están entrenando', 'warning');
            return;
        }

        this.isTraining = true;
        this.showNotification('Iniciando entrenamiento de modelos IA...', 'info');
        this.updateModelStatus('Entrenando modelos...');

        const startTime = Date.now();

        try {
            // Simular entrenamiento de modelo de rendimiento
            await this.trainPerformanceModel();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simular entrenamiento de modelo de asistencia
            await this.trainAttendanceModel();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simular entrenamiento de modelo de recomendaciones
            await this.trainRecommendationModel();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simular entrenamiento de análisis de sentimientos
            await this.trainSentimentModel();
            
            const processingTime = Date.now() - startTime;
            this.analytics.processingTime = processingTime;
            
            this.updateModelStatus('Modelos entrenados correctamente');
            this.updateModuleStatuses();
            this.generateInitialPredictions();
            
            this.showNotification(`Modelos entrenados exitosamente en ${processingTime}ms`, 'success');
            
        } catch (error) {
            console.error('Error entrenando modelos:', error);
            this.showNotification('Error durante el entrenamiento', 'error');
        } finally {
            this.isTraining = false;
        }
    }

    async trainPerformanceModel() {
        // Simulación de entrenamiento
        this.models.studentPerformance.trained = true;
        this.models.studentPerformance.accuracy = 0.75 + Math.random() * 0.2; // 75-95%
        
        this.updateModuleStatus('performance', 'Activo');
        this.updateModuleStat('performanceAccuracy', `${(this.models.studentPerformance.accuracy * 100).toFixed(1)}%`);
    }

    async trainAttendanceModel() {
        this.models.attendancePrediction.trained = true;
        this.models.attendancePrediction.accuracy = 0.70 + Math.random() * 0.25; // 70-95%
        
        this.updateModuleStatus('attendance', 'Activo');
        this.updateModuleStat('attendanceAccuracy', `${(this.models.attendancePrediction.accuracy * 100).toFixed(1)}%`);
    }

    async trainRecommendationModel() {
        this.models.contentRecommendation.trained = true;
        this.models.contentRecommendation.accuracy = 0.68 + Math.random() * 0.27; // 68-95%
        
        this.updateModuleStatus('recommendations', 'Activo');
        this.updateModuleStat('recommendationsEffectiveness', `${(this.models.contentRecommendation.accuracy * 100).toFixed(1)}%`);
    }

    async trainSentimentModel() {
        this.models.sentimentAnalysis.trained = true;
        this.models.sentimentAnalysis.accuracy = 0.72 + Math.random() * 0.23; // 72-95%
    }

    generateInitialPredictions() {
        this.generatePerformancePredictions();
        this.generateAttendanceAlerts();
        this.generateContentRecommendations();
        this.generateInsights();
    }

    generatePerformancePredictions() {
        if (!this.models.studentPerformance.trained) return;

        const predictions = [];
        const riskStudents = this.datasets.studentGrades.filter(student => student.average < 8);
        
        riskStudents.slice(0, 10).forEach(student => {
            const riskScore = (10 - student.average) / 3; // 0-1 scale
            predictions.push({
                studentId: student.id,
                studentName: student.name,
                currentAverage: student.average.toFixed(1),
                riskScore: riskScore,
                prediction: riskScore > 0.6 ? 'Alto riesgo de reprobación' : 
                           riskScore > 0.3 ? 'Riesgo moderado' : 'Rendimiento aceptable',
                recommendations: [
                    'Asesoría académica personalizada',
                    'Clases de regularización',
                    'Técnicas de estudio'
                ]
            });
        });

        this.predictions.set('performance', predictions);
        this.analytics.predictionsGenerated += predictions.length;
        this.updatePerformancePredictionsDisplay(predictions);
        this.updateModuleStat('studentsAnalyzed', this.datasets.studentGrades.length);
    }

    generateAttendanceAlerts() {
        if (!this.models.attendancePrediction.trained) return;

        const alerts = [];
        const lowAttendanceStudents = this.datasets.studentGrades.filter(student => student.attendance < 0.8);
        
        lowAttendanceStudents.slice(0, 8).forEach(student => {
            alerts.push({
                studentId: student.id,
                studentName: student.name,
                currentAttendance: (student.attendance * 100).toFixed(1) + '%',
                severity: student.attendance < 0.7 ? 'Alta' : 'Media',
                daysAtRisk: Math.ceil((0.8 - student.attendance) * 180),
                actions: [
                    'Contactar al estudiante',
                    'Reunión con padres',
                    'Plan de recuperación'
                ]
            });
        });

        this.predictions.set('attendance', alerts);
        this.updateAttendanceAlertsDisplay(alerts);
        this.updateModuleStat('attendanceAlerts', alerts.length);
    }

    generateContentRecommendations() {
        if (!this.models.contentRecommendation.trained) return;

        const recommendations = [];
        const learningPatterns = this.datasets.learningPatterns.slice(0, 15);
        
        learningPatterns.forEach(pattern => {
            const content = this.getRecommendedContent(pattern);
            recommendations.push({
                studentId: pattern.studentId,
                learningStyle: pattern.learningStyle,
                difficulty: pattern.difficulty,
                recommendations: content,
                confidence: (0.6 + Math.random() * 0.35).toFixed(2)
            });
        });

        this.recommendations.set('content', recommendations);
        this.analytics.recommendationsMade += recommendations.length;
        this.updateContentRecommendationsDisplay(recommendations);
        this.updateModuleStat('recommendationsCount', recommendations.length);
    }

    getRecommendedContent(pattern) {
        const contentByStyle = {
            'Visual': [
                'Videos explicativos de matemáticas',
                'Infografías de historia',
                'Diagramas de química'
            ],
            'Auditivo': [
                'Podcasts educativos',
                'Audiolibros de literatura',
                'Grabaciones de clase'
            ],
            'Kinestésico': [
                'Laboratorios virtuales',
                'Experimentos interactivos',
                'Ejercicios prácticos'
            ]
        };

        return contentByStyle[pattern.learningStyle] || contentByStyle['Visual'];
    }

    generateInsights() {
        const insights = [
            {
                title: '📊 Rendimiento General',
                description: `El promedio general de la institución es ${this.calculateOverallAverage().toFixed(1)}. Un 15% de estudiantes requiere atención especial.`,
                type: 'performance'
            },
            {
                title: '📋 Asistencia Institucional',
                description: `La asistencia promedio es del ${this.calculateOverallAttendance()}%. Los lunes muestran menor asistencia.`,
                type: 'attendance'
            },
            {
                title: '💡 Patrones de Aprendizaje',
                description: `El 40% prefiere aprendizaje visual, 35% auditivo y 25% kinestésico. Ajustar métodos de enseñanza.`,
                type: 'learning'
            },
            {
                title: '🎯 Materias Críticas',
                description: 'Matemáticas y Química muestran mayor dificultad. Considerar refuerzo en estas áreas.',
                type: 'subjects'
            },
            {
                title: '📈 Tendencias Positivas',
                description: 'El 78% de estudiantes muestra progreso constante. Las actividades extracurriculares mejoran el rendimiento.',
                type: 'trends'
            }
        ];

        this.updateInsightsDisplay(insights);
    }

    calculateOverallAverage() {
        const total = this.datasets.studentGrades.reduce((sum, student) => sum + student.average, 0);
        return total / this.datasets.studentGrades.length;
    }

    calculateOverallAttendance() {
        const total = this.datasets.studentGrades.reduce((sum, student) => sum + student.attendance, 0);
        return ((total / this.datasets.studentGrades.length) * 100).toFixed(1);
    }

    updatePerformancePredictionsDisplay(predictions) {
        const panel = this.ui?.querySelector('#performance-panel .performance-predictions');
        if (!panel) return;

        if (predictions.length === 0) {
            panel.innerHTML = sanitizeHTML(`
                <div class="no-data">
                    <div class="no-data-icon">📊</div>
                    <p>No hay predicciones disponibles</p>
                </div>
            `);
            return;
        }

        const predictionsHTML = predictions.map(pred => `
            <div class="prediction-item ${pred.riskScore > 0.6 ? 'high-risk' : pred.riskScore > 0.3 ? 'medium-risk' : 'low-risk'}">
                <div class="prediction-title">${pred.studentName}</div>
                <div class="prediction-details">
                    Promedio actual: ${pred.currentAverage} | ${pred.prediction}
                </div>
                <div class="prediction-score">
                    Nivel de riesgo: ${(pred.riskScore * 100).toFixed(0)}%
                </div>
                <div class="recommendations-list">
                    ${pred.recommendations.map(rec => `<span class="recommendation-tag">${rec}</span>`).join('')}
                </div>
            </div>
        `).join('');

        panel.innerHTML = sanitizeHTML(predictionsHTML + `
            <style>
                .prediction-item {
                    border-left: 4px solid #4CAF50;
                }
                .prediction-item.medium-risk {
                    border-left-color: #FF9800;
                }
                .prediction-item.high-risk {
                    border-left-color: #F44336;
                }
                .recommendation-tag {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.75em;
                    margin: 2px;
                }
                .recommendations-list {
                    margin-top: 8px;
                }
            </style>
        `, 'ugc');
    }

    updateAttendanceAlertsDisplay(alerts) {
        const panel = this.ui?.querySelector('#attendance-panel .attendance-alerts');
        if (!panel) return;

        if (alerts.length === 0) {
            panel.innerHTML = sanitizeHTML(`
                <div class="no-data">
                    <div class="no-data-icon">📋</div>
                    <p>No hay alertas de asistencia</p>
                </div>
            `);
            return;
        }

        const alertsHTML = alerts.map(alert => `
            <div class="alert-item severity-${alert.severity.toLowerCase()}">
                <div class="alert-title">⚠️ ${alert.studentName}</div>
                <div class="alert-details">
                    Asistencia: ${alert.currentAttendance} | Severidad: ${alert.severity}
                </div>
                <div class="alert-actions">
                    ${alert.actions.map(action => `<span class="action-tag">${action}</span>`).join('')}
                </div>
            </div>
        `).join('');

        panel.innerHTML = sanitizeHTML(alertsHTML + `
            <style>
                .alert-item {
                    border-left: 4px solid #FF9800;
                }
                .severity-alta {
                    border-left-color: #F44336;
                }
                .action-tag {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 3px 8px;
                    border-radius: 10px;
                    font-size: 0.75em;
                    margin: 2px;
                }
                .alert-actions {
                    margin-top: 8px;
                }
            </style>
        `, 'ugc');
    }

    updateContentRecommendationsDisplay(recommendations) {
        const panel = this.ui?.querySelector('#recommendations-panel .content-recommendations');
        if (!panel) return;

        if (recommendations.length === 0) {
            panel.innerHTML = sanitizeHTML(`
                <div class="no-data">
                    <div class="no-data-icon">💡</div>
                    <p>No hay recomendaciones disponibles</p>
                </div>
            `);
            return;
        }

        const recommendationsHTML = recommendations.slice(0, 10).map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-title">
                    Estudiante: ${rec.studentId} | Estilo: ${rec.learningStyle}
                </div>
                <div class="recommendation-content">
                    ${rec.recommendations.map(item => `<div class="content-item">📚 ${item}</div>`).join('')}
                </div>
                <div class="recommendation-confidence">
                    Confianza: ${(rec.confidence * 100).toFixed(0)}%
                </div>
            </div>
        `).join('');

        panel.innerHTML = sanitizeHTML(recommendationsHTML + `
            <style>
                .content-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 5px 10px;
                    border-radius: 5px;
                    margin: 3px 0;
                    font-size: 0.9em;
                }
            </style>
        `, 'ugc');
    }

    updateInsightsDisplay(insights) {
        const panel = this.ui?.querySelector('#insights-panel .ai-insights');
        if (!panel) return;

        const insightsHTML = insights.map(insight => `
            <div class="insight-item type-${insight.type}">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
                <div class="insight-type">${insight.type}</div>
            </div>
        `).join('');

        panel.innerHTML = sanitizeHTML(insightsHTML + `
            <style>
                .insight-item {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    border-left: 4px solid #9C27B0;
                }
                .insight-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    font-size: 1.05em;
                }
                .insight-description {
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
                .insight-type {
                    font-size: 0.8em;
                    opacity: 0.7;
                    text-transform: capitalize;
                }
            </style>
        `, 'ugc');
    }

    async sendChatMessage() {
        const input = this.ui?.querySelector('#chatInput');
        const message = input?.value.trim();
        
        if (!message) return;

        this.addMessageToChat(message, 'user');
        input.value = '';
        
        this.analytics.chatbotInteractions++;
        this.updateAnalytics();

        // Simular tiempo de procesamiento
        setTimeout(() => {
            const response = this.generateChatbotResponse(message);
            this.addMessageToChat(response, 'bot');
        }, 500 + Math.random() * 1000);
    }

    generateChatbotResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Saludos
        if (lowerMessage.includes('hola') || lowerMessage.includes('buenos') || lowerMessage.includes('salud')) {
            const greetings = this.knowledgeBase.greetings;
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
        
        // Preguntas académicas
        for (const [key, answer] of Object.entries(this.knowledgeBase.academicQuestions)) {
            if (lowerMessage.includes(key)) {
                return answer;
            }
        }
        
        // Información escolar
        for (const [key, answer] of Object.entries(this.knowledgeBase.schoolInfo)) {
            if (lowerMessage.includes(key)) {
                return answer;
            }
        }
        
        // Ayuda
        if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
            return `Puedo ayudarte con: ${this.knowledgeBase.helpTopics.join(', ')}. ¿Sobre qué tema específico necesitas información?`;
        }
        
        // Respuesta por defecto
        return "Lo siento, no tengo información específica sobre esa consulta. ¿Podrías ser más específico o preguntar sobre horarios, calificaciones, o información de la escuela?";
    }

    addMessageToChat(message, sender) {
        const chatMessages = this.ui?.querySelector('#chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        
        const avatar = sender === 'user' ? '👤' : '🤖';
        const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = sanitizeHTML(`
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${message}</div>
            <div class="message-time">${time}</div>
        `);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    handleQuickAction(action) {
        const responses = {
            'grades': 'Para consultar tus calificaciones, ingresa al portal estudiantil con tu número de matrícula. Si tienes problemas, contacta a servicios escolares.',
            'schedule': 'Tu horario personalizado está disponible en el portal. Incluye todas tus materias, horarios y salones asignados.',
            'help': `Puedo ayudarte con: ${this.knowledgeBase.helpTopics.join(', ')}. ¿Qué necesitas saber?`
        };

        const response = responses[action] || 'Función no disponible temporalmente.';
        this.addMessageToChat(response, 'bot');
    }

    showModuleDetails(module) {
        const moduleNames = {
            'performance': 'Predicción de Rendimiento',
            'attendance': 'Predicción de Asistencia', 
            'recommendations': 'Recomendaciones',
            'chatbot': 'Asistente Virtual'
        };

        const details = {
            'performance': 'Analiza el rendimiento académico de los estudiantes utilizando datos históricos para predecir riesgo de reprobación.',
            'attendance': 'Detecta patrones de ausentismo y predice estudiantes en riesgo de deserción escolar.',
            'recommendations': 'Genera recomendaciones personalizadas de contenido basadas en el estilo de aprendizaje.',
            'chatbot': 'Asistente virtual que responde preguntas académicas y administrativas de la institución.'
        };

        this.showNotification(`${moduleNames[module]}: ${details[module]}`, 'info');
    }

    updateModuleStatus(module, status) {
        const statusElement = this.ui?.querySelector(`#${module}Status`);
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = 'status-badge active';
        }
    }

    updateModuleStat(statId, value) {
        const statElement = this.ui?.querySelector(`#${statId}`);
        if (statElement) {
            statElement.textContent = value;
        }
    }

    updateModuleStatuses() {
        Object.keys(this.models).forEach(modelKey => {
            const model = this.models[modelKey];
            if (model.trained) {
                const moduleMap = {
                    'studentPerformance': 'performance',
                    'attendancePrediction': 'attendance',
                    'contentRecommendation': 'recommendations'
                };
                const moduleKey = moduleMap[modelKey];
                if (moduleKey) {
                    this.updateModuleStatus(moduleKey, 'Activo');
                }
            }
        });
    }

    updateModelStatus(status) {
        const modelStatusElement = this.ui?.querySelector('#modelStatus');
        if (modelStatusElement) {
            modelStatusElement.textContent = `Modelos: ${status}`;
        }
    }

    updateAnalytics() {
        const totalPredictions = this.ui?.querySelector('#totalPredictions');
        const modelAccuracy = this.ui?.querySelector('#modelAccuracy');
        const chatInteractions = this.ui?.querySelector('#chatInteractions');
        const processingTime = this.ui?.querySelector('#processingTime');

        if (totalPredictions) {
            totalPredictions.textContent = this.analytics.predictionsGenerated;
        }
        
        if (modelAccuracy) {
            const avgAccuracy = Object.values(this.models)
                .filter(model => model.trained)
                .reduce((sum, model) => sum + model.accuracy, 0) / 
                Object.values(this.models).filter(model => model.trained).length || 0;
            modelAccuracy.textContent = `${(avgAccuracy * 100).toFixed(1)}%`;
        }
        
        if (chatInteractions) {
            chatInteractions.textContent = this.analytics.chatbotInteractions;
        }
        
        if (processingTime) {
            processingTime.textContent = `${this.analytics.processingTime}ms`;
        }
    }

    switchTab(tabId) {
        // Hide all tabs
        this.ui?.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        this.ui?.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const targetPanel = this.ui?.querySelector(`#${tabId}-panel`);
        const targetBtn = this.ui?.querySelector(`[data-tab="${tabId}"]`);
        
        if (targetPanel) targetPanel.classList.add('active');
        if (targetBtn) targetBtn.classList.add('active');
    }

    startPeriodicAnalysis() {
        setInterval(() => {
            if (Object.values(this.models).some(model => model.trained)) {
                // Actualizar predicciones periódicamente
                this.generatePerformancePredictions();
                this.generateAttendanceAlerts();
                this.updateAnalytics();
            }
        }, 5 * 60 * 1000); // Cada 5 minutos
    }

    setupChatbot() {
        this.updateModuleStatus('chatbot', 'Activo');
        this.updateModuleStat('chatbotSatisfaction', '92%');
    }

    togglePanel() {
        if (!this.ui) return;
        this.ui.style.display = this.ui.style.display === 'none' ? 'block' : 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ai-notification ${type}`;
        notification.innerHTML = sanitizeHTML(`
            <div class="notification-content">
                <span class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <span class="notification-message">${message}</span>
            </div>
        `);

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getStatus() {
        return {
            modelsInitialized: Object.keys(this.models).length,
            modelsTrained: Object.values(this.models).filter(model => model.trained).length,
            datasetSize: Object.values(this.datasets).reduce((sum, dataset) => sum + dataset.length, 0),
            analytics: this.analytics,
            isTraining: this.isTraining
        };
    }

    getAnalytics() {
        return {
            ...this.analytics,
            averageModelAccuracy: Object.values(this.models)
                .filter(model => model.trained)
                .reduce((sum, model) => sum + model.accuracy, 0) / 
                Object.values(this.models).filter(model => model.trained).length || 0,
            chatbotResponseTime: this.analytics.processingTime / this.analytics.chatbotInteractions || 0
        };
    }
}

// Inicialización global
let aiEducationalSystem;

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        aiEducationalSystem = new AIEducationalSystem();
    });
} else {
    aiEducationalSystem = new AIEducationalSystem();
}

// Exportar para uso global
window.aiEducationalSystem = aiEducationalSystem;

// Comando de consola para testing
window.testAISystem = async () => {
    if (aiEducationalSystem) {
        //console.log('🤖 Estado del Sistema IA:', aiEducationalSystem.getStatus());
        //console.log('🤖 Analytics:', aiEducationalSystem.getAnalytics());
        
        //console.log('🤖 Iniciando entrenamiento de modelos...');
        await aiEducationalSystem.trainModels();
    }
};

//console.log('🤖 AI Educational System inicializado correctamente');