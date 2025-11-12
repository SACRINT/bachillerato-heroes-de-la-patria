/**
 * 📚 GENERADOR AUTOMÁTICO DE CONTENIDO EDUCATIVO IA
 * Sistema que crea material didáctico personalizado para BGE
 */

class ContentGeneratorAI {
    constructor() {
        this.currentUser = null;
        this.generatedContent = [];
        this.templates = this.initializeTemplates();
        this.contentTypes = this.initializeContentTypes();
        this.difficultyLevels = ['Básico', 'Intermedio', 'Avanzado', 'Experto'];
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.loadUserSession();
        this.loadGeneratedContent();
        this.createGeneratorUI();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    loadGeneratedContent() {
        if (!this.currentUser) return;

        const saved = localStorage.getItem(`bge_generated_content_${this.currentUser.email}`);
        if (saved) {
            this.generatedContent = JSON.parse(saved);
        }
    }

    initializeContentTypes() {
        return {
            exercises: {
                name: 'Ejercicios Prácticos',
                icon: '📝',
                description: 'Problemas y ejercicios adaptativos',
                estimatedTime: '10-30 min'
            },
            summaries: {
                name: 'Resúmenes Interactivos',
                icon: '📋',
                description: 'Síntesis de temas complejos',
                estimatedTime: '5-15 min'
            },
            quizzes: {
                name: 'Evaluaciones Dinámicas',
                icon: '❓',
                description: 'Cuestionarios adaptativos',
                estimatedTime: '15-25 min'
            },
            flashcards: {
                name: 'Tarjetas de Estudio',
                icon: '🗃️',
                description: 'Memorización inteligente',
                estimatedTime: '10-20 min'
            },
            mindmaps: {
                name: 'Mapas Mentales',
                icon: '🧠',
                description: 'Visualización de conceptos',
                estimatedTime: '15-30 min'
            },
            experiments: {
                name: 'Experimentos Virtuales',
                icon: '🧪',
                description: 'Laboratorios simulados',
                estimatedTime: '20-45 min'
            },
            essays: {
                name: 'Ensayos Guiados',
                icon: '✍️',
                description: 'Redacción estructurada',
                estimatedTime: '30-60 min'
            },
            presentations: {
                name: 'Presentaciones IA',
                icon: '📊',
                description: 'Diapositivas automáticas',
                estimatedTime: '20-40 min'
            }
        };
    }

    initializeTemplates() {
        return {
            mathematics: {
                exercises: this.getMathExerciseTemplates(),
                summaries: this.getMathSummaryTemplates(),
                quizzes: this.getMathQuizTemplates()
            },
            physics: {
                exercises: this.getPhysicsExerciseTemplates(),
                experiments: this.getPhysicsExperimentTemplates(),
                summaries: this.getPhysicsSummaryTemplates()
            },
            chemistry: {
                exercises: this.getChemistryExerciseTemplates(),
                experiments: this.getChemistryExperimentTemplates(),
                quizzes: this.getChemistryQuizTemplates()
            },
            biology: {
                summaries: this.getBiologySummaryTemplates(),
                mindmaps: this.getBiologyMindmapTemplates(),
                quizzes: this.getBiologyQuizTemplates()
            }
        };
    }

    createGeneratorUI() {
        if (!this.currentUser) return;

        this.createContentGeneratorButton();
    }

    createContentGeneratorButton() {
        const button = document.createElement('div');
        button.id = 'contentGeneratorButton';
        button.className = 'position-fixed';
        button.style.cssText = `
            bottom: 210px;
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
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        `;

        button.innerHTML = sanitizeHTML(`
            <i class="fas fa-magic text-white" style="font-size: 1.3rem);"></i>
        `;

        button.onclick = () => this.showContentGeneratorModal();

        // Hover effects
        button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
            button.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
        };

        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
        };

        document.body.appendChild(button);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.style.cssText = `
            position: absolute;
            right: 70px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        tooltip.textContent = 'Generador IA';
        button.appendChild(tooltip);

        button.onmouseenter = () => {
            button.style.transform = 'scale(1.1)';
            tooltip.style.opacity = '1';
        };

        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
            tooltip.style.opacity = '0';
        };
    }

    showContentGeneratorModal() {
        if (!this.currentUser) {
            alert('🔒 Debes iniciar sesión para usar el generador de contenido IA.');
            return;
        }

        this.createContentGeneratorModal();
    }

    createContentGeneratorModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'contentGeneratorModal';
        modal.setAttribute('tabindex', '-1');

        modal.innerHTML = sanitizeHTML(`
            <div class="modal-dialog modal-xl">
                <div class="modal-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)); border-radius: 15px;">
                    <div class="modal-header border-0 text-white">
                        <h5 class="modal-title fw-bold">📚 Generador de Contenido IA - ${this.currentUser.name}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-white" style="max-height: 75vh; overflow-y: auto;">
                        ${this.generateContentGeneratorInterface()}
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente
        const existing = document.getElementById('contentGeneratorModal');
        if (existing) existing.remove();

        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    generateContentGeneratorInterface() {
        return `
            <div class="container-fluid">
                <!-- Header Stats -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.generatedContent.length}</h3>
                            <small class="opacity-75">Contenidos Generados</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getUserLevel()}</h3>
                            <small class="opacity-75">Tu Nivel IA</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getAvailableTemplates()}</h3>
                            <small class="opacity-75">Templates Desbloqueados</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <h3 class="mb-1">${this.getTotalUsageTime()}</h3>
                            <small class="opacity-75">Tiempo Ahorrado</small>
                        </div>
                    </div>
                </div>

                <!-- Navegación -->
                <nav class="navbar navbar-expand navbar-dark mb-4" style="background: rgba(255,255,255,0.1); border-radius: 10px;">
                    <div class="container-fluid">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link active" href="#generator" onclick="contentGeneratorAI.showGeneratorSection('generator')">
                                    ✨ Generar Contenido
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#library" onclick="contentGeneratorAI.showGeneratorSection('library')">
                                    📚 Mi Biblioteca
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" href="#templates" onclick="contentGeneratorAI.showGeneratorSection('templates')">
                                    🎨 Templates
                                </a>
                            </li>
                        </ul>
                        <button class="btn btn-warning btn-sm" onclick="contentGeneratorAI.generateQuickContent()">
                            ⚡ Generación Rápida
                        </button>
                    </div>
                </nav>

                <!-- Secciones -->
                <div id="generator-section" class="content-section">
                    ${this.generateCreatorInterface()}
                </div>

                <div id="library-section" class="content-section d-none">
                    ${this.generateLibraryInterface()}
                </div>

                <div id="templates-section" class="content-section d-none">
                    ${this.generateTemplatesInterface()}
                </div>
            </div>
        `;
    }

    generateCreatorInterface() {
        return `
            <div class="row">
                <!-- Panel de Configuración -->
                <div class="col-lg-4 mb-4">
                    <div class="card bg-white bg-opacity-15 border-0">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">⚙️ Configuración del Contenido</h6>

                            <div class="mb-3">
                                <label class="form-label small">📚 Materia</label>
                                <select class="form-select" id="contentSubject" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                                    <option value="mathematics">Matemáticas</option>
                                    <option value="physics">Física</option>
                                    <option value="chemistry">Química</option>
                                    <option value="biology">Biología</option>
                                    <option value="spanish">Español</option>
                                    <option value="english">Inglés</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small">📝 Tipo de Contenido</label>
                                <select class="form-select" id="contentType" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                                    ${Object.entries(this.contentTypes).map(([key, type]) =>
                                        `<option value="${key}">${type.icon} ${type.name}</option>`
                                    ).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small">📊 Nivel de Dificultad</label>
                                <select class="form-select" id="difficultyLevel" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                                    ${this.difficultyLevels.map(level =>
                                        `<option value="${level}">${level}</option>`
                                    ).join('')}
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small">🎯 Tema/Concepto</label>
                                <input type="text" class="form-control" id="contentTopic"
                                       placeholder="Ej: Ecuaciones cuadráticas, Leyes de Newton..."
                                       style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                            </div>

                            <div class="mb-3">
                                <label class="form-label small">⏱️ Duración Estimada</label>
                                <select class="form-select" id="contentDuration" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                                    <option value="short">Corto (10-15 min)</option>
                                    <option value="medium">Medio (20-30 min)</option>
                                    <option value="long">Largo (45-60 min)</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label small">🎨 Estilo de Aprendizaje</label>
                                <select class="form-select" id="learningStyle" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white;">
                                    <option value="visual">Visual (gráficos, diagramas)</option>
                                    <option value="auditory">Auditivo (explicaciones, audio)</option>
                                    <option value="kinesthetic">Kinestésico (práctica, interactivo)</option>
                                    <option value="mixed">Mixto (todos los estilos)</option>
                                </select>
                            </div>

                            <button class="btn btn-warning w-100" onclick="contentGeneratorAI.generateContent()" id="generateBtn">
                                <i class="fas fa-magic me-2"></i>
                                Generar Contenido IA
                            </button>

                            <div class="mt-3 d-none" id="generationProgress">
                                <div class="progress mb-2" style="height: 6px;">
                                    <div class="progress-bar bg-warning progress-bar-animated" style="width: 0%" id="progressBar"></div>
                                </div>
                                <small class="opacity-75" id="progressText">Iniciando generación...</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel de Vista Previa -->
                <div class="col-lg-8 mb-4">
                    <div class="card bg-white bg-opacity-15 border-0 h-100">
                        <div class="card-body">
                            <h6 class="text-warning mb-3">👁️ Vista Previa del Contenido</h6>

                            <div id="contentPreview" class="border rounded p-4" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2) !important; min-height: 400px;">
                                <div class="text-center py-5">
                                    <i class="fas fa-magic mb-3" style="font-size: 3rem; opacity: 0.5;"></i>
                                    <h5 class="opacity-75">Contenido IA Listo para Generar</h5>
                                    <p class="opacity-50">Configura los parámetros y haz clic en "Generar Contenido IA" para crear material educativo personalizado.</p>

                                    <div class="row mt-4">
                                        <div class="col-md-4">
                                            <div class="text-center mb-3">
                                                <i class="fas fa-brain mb-2" style="font-size: 2rem; color: #FFD700;"></i>
                                                <h6>IA Adaptativa</h6>
                                                <small class="opacity-75">Se ajusta a tu nivel</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center mb-3">
                                                <i class="fas fa-rocket mb-2" style="font-size: 2rem; color: #FF6B6B;"></i>
                                                <h6>Generación Rápida</h6>
                                                <small class="opacity-75">En segundos, no horas</small>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="text-center mb-3">
                                                <i class="fas fa-star mb-2" style="font-size: 2rem; color: #4ECDC4;"></i>
                                                <h6>Calidad Premium</h6>
                                                <small class="opacity-75">Contenido profesional</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-3 d-flex gap-2 d-none" id="contentActions">
                                <button class="btn btn-success btn-sm" onclick="contentGeneratorAI.saveContent()">
                                    💾 Guardar en Biblioteca
                                </button>
                                <button class="btn btn-info btn-sm" onclick="contentGeneratorAI.shareContent()">
                                    📤 Compartir
                                </button>
                                <button class="btn btn-outline-light btn-sm" onclick="contentGeneratorAI.editContent()">
                                    ✏️ Editar
                                </button>
                                <button class="btn btn-warning btn-sm" onclick="contentGeneratorAI.regenerateContent()">
                                    🔄 Regenerar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateLibraryInterface() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">📚 Mi Biblioteca de Contenido IA</h6>

                    ${this.generatedContent.length === 0 ? `
                        <div class="text-center py-5">
                            <i class="fas fa-book-open mb-3" style="font-size: 3rem; opacity: 0.5;"></i>
                            <h5 class="opacity-75">Tu biblioteca está vacía</h5>
                            <p class="opacity-50">Genera tu primer contenido IA para empezar a construir tu biblioteca personal.</p>
                            <button class="btn btn-warning" onclick="contentGeneratorAI.showGeneratorSection('generator')">
                                ✨ Crear Primer Contenido
                            </button>
                        </div>
                    ` : `
                        <div class="row">
                            ${this.generatedContent.map(content => this.generateContentCard(content)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    generateTemplatesInterface() {
        return `
            <div class="row">
                <div class="col-12">
                    <h6 class="mb-3">🎨 Templates Disponibles</h6>

                    <div class="row">
                        ${Object.entries(this.contentTypes).map(([key, type]) => `
                            <div class="col-lg-4 col-md-6 mb-3">
                                <div class="card bg-white bg-opacity-15 border-0 h-100">
                                    <div class="card-body text-center">
                                        <div style="font-size: 3rem;">${type.icon}</div>
                                        <h6 class="text-warning mt-2">${type.name}</h6>
                                        <p class="small opacity-75">${type.description}</p>
                                        <div class="mb-3">
                                            <small class="badge bg-info">${type.estimatedTime}</small>
                                        </div>
                                        <button class="btn btn-outline-light btn-sm" onclick="contentGeneratorAI.useTemplate('${key}')">
                                            🚀 Usar Template
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    generateContentCard(content) {
        return `
            <div class="col-lg-4 col-md-6 mb-3">
                <div class="card bg-white bg-opacity-15 border-0 h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="card-title text-warning mb-0">${content.title}</h6>
                            <span class="badge bg-${this.getSubjectColor(content.subject)}">${content.subject}</span>
                        </div>

                        <p class="card-text small mb-3">${content.description}</p>

                        <div class="mb-3">
                            <small class="d-block mb-1">📊 Dificultad: ${content.difficulty}</small>
                            <small class="d-block mb-1">⏱️ Duración: ${content.duration}</small>
                            <small class="d-block opacity-75">📅 Creado: ${this.formatDate(content.createdAt)}</small>
                        </div>

                        <div class="d-flex gap-2">
                            <button class="btn btn-warning btn-sm flex-grow-1" onclick="contentGeneratorAI.openContent('${content.id}')">
                                📖 Abrir
                            </button>
                            <button class="btn btn-outline-light btn-sm" onclick="contentGeneratorAI.deleteContent('${content.id}')">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showGeneratorSection(sectionName) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Mostrar sección seleccionada
        document.getElementById(`${sectionName}-section`).classList.remove('d-none');

        // Actualizar navbar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    }

    generateContent() {
        if (this.isGenerating) return;

        const subject = document.getElementById('contentSubject').value;
        const type = document.getElementById('contentType').value;
        const difficulty = document.getElementById('difficultyLevel').value;
        const topic = document.getElementById('contentTopic').value;
        const duration = document.getElementById('contentDuration').value;
        const style = document.getElementById('learningStyle').value;

        if (!topic.trim()) {
            alert('📝 Por favor, especifica un tema o concepto para generar el contenido.');
            return;
        }

        this.isGenerating = true;
        this.showGenerationProgress();

        // Simular proceso de generación IA
        this.simulateGeneration().then(() => {
            const generatedContent = this.createGeneratedContent(subject, type, difficulty, topic, duration, style);
            this.displayGeneratedContent(generatedContent);
            this.hideGenerationProgress();
            this.isGenerating = false;
        });
    }

    async simulateGeneration() {
        const steps = [
            'Analizando parámetros de entrada...',
            'Seleccionando algoritmos IA apropiados...',
            'Generando estructura del contenido...',
            'Creando ejercicios adaptativos...',
            'Optimizando para estilo de aprendizaje...',
            'Aplicando pedagogía BGE...',
            'Finalizando contenido personalizado...'
        ];

        for (let i = 0; i < steps.length; i++) {
            await this.delay(800);
            const progress = ((i + 1) / steps.length) * 100;
            document.getElementById('progressBar').style.width = `${progress}%`;
            document.getElementById('progressText').textContent = steps[i];
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    createGeneratedContent(subject, type, difficulty, topic, duration, style) {
        const contentTypeInfo = this.contentTypes[type];

        const content = {
            id: this.generateContentId(),
            title: `${contentTypeInfo.name}: ${topic}`,
            subject,
            type,
            difficulty,
            topic,
            duration,
            style,
            description: this.generateContentDescription(subject, type, topic, difficulty),
            htmlContent: this.generateHTMLContent(subject, type, topic, difficulty, style),
            createdAt: Date.now(),
            usageCount: 0,
            rating: 0
        };

        return content;
    }

    generateContentDescription(subject, type, topic, difficulty) {
        const descriptions = {
            exercises: `Ejercicios prácticos de ${topic} con nivel ${difficulty}`,
            summaries: `Resumen interactivo sobre ${topic} adaptado para ${difficulty}`,
            quizzes: `Evaluación dinámica de ${topic} con dificultad ${difficulty}`,
            flashcards: `Tarjetas de estudio para memorizar conceptos de ${topic}`,
            mindmaps: `Mapa mental visual de ${topic} nivel ${difficulty}`,
            experiments: `Experimento virtual sobre ${topic} con simulación avanzada`,
            essays: `Ensayo guiado sobre ${topic} con estructura profesional`,
            presentations: `Presentación automática de ${topic} con IA`
        };

        return descriptions[type] || `Contenido educativo sobre ${topic}`;
    }

    generateHTMLContent(subject, type, topic, difficulty, style) {
        // Simulación de contenido generado por IA
        const templates = {
            exercises: this.generateExerciseContent(subject, topic, difficulty),
            summaries: this.generateSummaryContent(subject, topic, difficulty),
            quizzes: this.generateQuizContent(subject, topic, difficulty),
            flashcards: this.generateFlashcardContent(subject, topic, difficulty),
            mindmaps: this.generateMindmapContent(subject, topic, difficulty),
            experiments: this.generateExperimentContent(subject, topic, difficulty)
        };

        return templates[type] || this.generateGenericContent(subject, topic, difficulty);
    }

    generateExerciseContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">📝 Ejercicios: ${topic}</h4>
                    <span class="badge bg-info">Nivel ${difficulty}</span>
                </div>

                <div class="exercise-set">
                    <div class="exercise-item mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6>Ejercicio 1:</h6>
                        <p>Resuelve la siguiente ecuación considerando ${topic}:</p>
                        <div class="equation-box p-2 mb-3" style="background: rgba(255,255,255,0.2); border-radius: 5px; font-family: monospace;">
                            2x² + 5x - 3 = 0
                        </div>
                        <small class="text-muted">💡 Tip: Utiliza la fórmula cuadrática para resolver paso a paso.</small>
                    </div>

                    <div class="exercise-item mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6>Ejercicio 2:</h6>
                        <p>Analiza el siguiente problema aplicando los conceptos de ${topic}:</p>
                        <div class="problem-statement p-2 mb-3" style="background: rgba(255,255,255,0.2); border-radius: 5px;">
                            Un proyectil es lanzado con velocidad inicial de 30 m/s a 45°...
                        </div>
                        <small class="text-muted">🎯 Objetivo: Encontrar la altura máxima y el alcance.</small>
                    </div>
                </div>

                <div class="ai-insights mt-4 p-3" style="background: rgba(102, 126, 234, 0.2); border-radius: 8px;">
                    <h6><i class="fas fa-robot me-2"></i>Insights IA:</h6>
                    <p class="small mb-0">Estos ejercicios están optimizados para tu nivel ${difficulty} y se enfocan en los aspectos más importantes de ${topic}. La IA ha detectado que este tipo de problemas mejora tu comprensión en un 35%.</p>
                </div>
            </div>
        `;
    }

    generateSummaryContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">📋 Resumen: ${topic}</h4>
                    <span class="badge bg-success">Nivel ${difficulty}</span>
                </div>

                <div class="summary-sections">
                    <div class="key-concepts mb-4">
                        <h6 class="text-info">🔑 Conceptos Clave</h6>
                        <ul class="concept-list">
                            <li class="mb-2">
                                <strong>Definición:</strong> ${topic} es un concepto fundamental que...
                            </li>
                            <li class="mb-2">
                                <strong>Aplicaciones:</strong> Se utiliza principalmente en...
                            </li>
                            <li class="mb-2">
                                <strong>Fórmulas:</strong> Las ecuaciones principales incluyen...
                            </li>
                        </ul>
                    </div>

                    <div class="visual-aids mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6 class="text-success">📊 Representación Visual</h6>
                        <div class="diagram-placeholder text-center p-4" style="background: rgba(255,255,255,0.2); border-radius: 5px;">
                            <i class="fas fa-chart-line" style="font-size: 3rem; opacity: 0.5;"></i>
                            <p class="mt-2 mb-0">Diagrama interactivo de ${topic}</p>
                        </div>
                    </div>

                    <div class="memory-aids p-3" style="background: rgba(40, 167, 69, 0.2); border-radius: 8px;">
                        <h6 class="text-warning">🧠 Ayudas Mnemotécnicas</h6>
                        <p class="mb-2">Para recordar ${topic}, utiliza el acrónimo: <strong>M.A.T.E.</strong></p>
                        <ul class="small">
                            <li><strong>M</strong>etodología clara</li>
                            <li><strong>A</strong>plicación práctica</li>
                            <li><strong>T</strong>eoría fundamentada</li>
                            <li><strong>E</strong>jemplos relevantes</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    generateQuizContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">❓ Evaluación: ${topic}</h4>
                    <span class="badge bg-danger">Nivel ${difficulty}</span>
                </div>

                <div class="quiz-questions">
                    <div class="question-item mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6>Pregunta 1 de 5</h6>
                        <p class="question-text mb-3">¿Cuál es la principal característica de ${topic}?</p>
                        <div class="options">
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="q1" id="q1a">
                                <label class="form-check-label" for="q1a">Opción A: Es un concepto básico</label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="q1" id="q1b">
                                <label class="form-check-label" for="q1b">Opción B: Tiene aplicaciones múltiples</label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="radio" name="q1" id="q1c">
                                <label class="form-check-label" for="q1c">Opción C: Requiere cálculos complejos</label>
                            </div>
                        </div>
                    </div>

                    <div class="adaptive-feedback p-3" style="background: rgba(255, 193, 7, 0.2); border-radius: 8px;">
                        <h6><i class="fas fa-brain me-2"></i>IA Adaptativa Activada</h6>
                        <p class="small mb-0">Las siguientes preguntas se ajustarán automáticamente según tus respuestas. La IA analiza tu patrón de aprendizaje para optimizar la evaluación.</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateFlashcardContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">🗃️ Flashcards: ${topic}</h4>
                    <span class="badge bg-info">Nivel ${difficulty}</span>
                </div>

                <div class="flashcard-deck">
                    <div class="flashcard mb-3" style="perspective: 1000px;">
                        <div class="flashcard-inner p-4 text-center" style="background: rgba(255,255,255,0.2); border-radius: 12px; min-height: 200px; position: relative;">
                            <div class="flashcard-front">
                                <h5 class="mb-3">📚 Concepto</h5>
                                <h4 class="text-warning">${topic}</h4>
                                <small class="text-muted">Haz clic para ver la definición</small>
                            </div>
                        </div>
                    </div>

                    <div class="spaced-repetition-info p-3" style="background: rgba(17, 153, 142, 0.2); border-radius: 8px;">
                        <h6><i class="fas fa-calendar-alt me-2"></i>Sistema de Repetición Espaciada</h6>
                        <p class="small mb-2">La IA programa automáticamente las revisiones para maximizar la retención:</p>
                        <ul class="small mb-0">
                            <li>Primera revisión: 1 día</li>
                            <li>Segunda revisión: 3 días</li>
                            <li>Tercera revisión: 7 días</li>
                            <li>Revisiones subsecuentes: 15, 30, 60 días</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    generateMindmapContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">🧠 Mapa Mental: ${topic}</h4>
                    <span class="badge bg-primary">Nivel ${difficulty}</span>
                </div>

                <div class="mindmap-container text-center p-4" style="background: rgba(255,255,255,0.1); border-radius: 12px;">
                    <div class="central-concept mb-4">
                        <div class="concept-node p-3 d-inline-block" style="background: #FFD700; color: #333; border-radius: 50px; font-weight: bold;">
                            ${topic}
                        </div>
                    </div>

                    <div class="branches row">
                        <div class="col-md-4 mb-3">
                            <div class="branch-node p-2" style="background: rgba(255, 107, 107, 0.8); border-radius: 20px;">
                                <h6>Definición</h6>
                                <small>Conceptos básicos</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="branch-node p-2" style="background: rgba(78, 205, 196, 0.8); border-radius: 20px;">
                                <h6>Aplicaciones</h6>
                                <small>Usos prácticos</small>
                            </div>
                        </div>
                        <div class="col-md-4 mb-3">
                            <div class="branch-node p-2" style="background: rgba(102, 126, 234, 0.8); border-radius: 20px;">
                                <h6>Ejemplos</h6>
                                <small>Casos reales</small>
                            </div>
                        </div>
                    </div>

                    <div class="interactive-note mt-4 p-3" style="background: rgba(255,255,255,0.2); border-radius: 8px;">
                        <p class="small mb-0"><i class="fas fa-magic me-2"></i>Mapa mental generado por IA con conexiones optimizadas para tu estilo de aprendizaje ${difficulty}.</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateExperimentContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">🧪 Experimento Virtual: ${topic}</h4>
                    <span class="badge bg-success">Nivel ${difficulty}</span>
                </div>

                <div class="virtual-lab">
                    <div class="experiment-setup mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6 class="text-info">🔬 Configuración del Experimento</h6>
                        <p>Objetivo: Demostrar los principios de ${topic} a través de simulación interactiva.</p>

                        <div class="lab-equipment row mt-3">
                            <div class="col-md-4 text-center">
                                <i class="fas fa-flask" style="font-size: 2rem; color: #FFD700;"></i>
                                <p class="small mt-1">Materiales virtuales</p>
                            </div>
                            <div class="col-md-4 text-center">
                                <i class="fas fa-thermometer-half" style="font-size: 2rem; color: #FF6B6B;"></i>
                                <p class="small mt-1">Sensores digitales</p>
                            </div>
                            <div class="col-md-4 text-center">
                                <i class="fas fa-chart-line" style="font-size: 2rem; color: #4ECDC4;"></i>
                                <p class="small mt-1">Análisis en tiempo real</p>
                            </div>
                        </div>
                    </div>

                    <div class="simulation-controls mb-4 p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <h6 class="text-success">🎮 Controles de Simulación</h6>
                        <div class="d-flex gap-2 flex-wrap">
                            <button class="btn btn-success btn-sm">▶️ Iniciar</button>
                            <button class="btn btn-warning btn-sm">⏸️ Pausar</button>
                            <button class="btn btn-info btn-sm">🔄 Reiniciar</button>
                            <button class="btn btn-secondary btn-sm">📊 Datos</button>
                        </div>
                    </div>

                    <div class="ai-predictions p-3" style="background: rgba(102, 126, 234, 0.2); border-radius: 8px;">
                        <h6><i class="fas fa-crystal-ball me-2"></i>Predicciones IA</h6>
                        <p class="small mb-0">Basado en los parámetros actuales, la IA predice que el resultado será consistente con la teoría de ${topic} con 94% de precisión.</p>
                    </div>
                </div>
            </div>
        `;
    }

    generateGenericContent(subject, topic, difficulty) {
        return `
            <div class="ai-generated-content">
                <div class="content-header mb-4">
                    <h4 class="text-warning">📚 Contenido IA: ${topic}</h4>
                    <span class="badge bg-secondary">Nivel ${difficulty}</span>
                </div>

                <div class="generic-content p-3" style="background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <p>Contenido educativo personalizado sobre <strong>${topic}</strong> generado específicamente para tu nivel de ${difficulty}.</p>

                    <div class="ai-badge mt-3 p-2" style="background: rgba(102, 126, 234, 0.3); border-radius: 5px;">
                        <small><i class="fas fa-robot me-1"></i>Generado por IA BGE • Adaptado a tu perfil de aprendizaje</small>
                    </div>
                </div>
            </div>
        `;
    }

    displayGeneratedContent(content) {
        const preview = document.getElementById('contentPreview');
        preview.innerHTML = sanitizeHTML(content.htmlContent);

        // Mostrar acciones
        document.getElementById('contentActions').classList.remove('d-none');

        // Guardar contenido temporal para las acciones
        this.currentGeneratedContent = content;

        // Tracking
        if (window.analyticsSystem) {
            window.analyticsSystem.trackEvent('content_generated', {
                subject: content.subject,
                type: content.type,
                difficulty: content.difficulty,
                topic: content.topic
            });
        }
    }

    showGenerationProgress() {
        document.getElementById('generateBtn').disabled = true;
        document.getElementById('generateBtn').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generando...';
        document.getElementById('generationProgress').classList.remove('d-none');
    }

    hideGenerationProgress() {
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('generateBtn').innerHTML = '<i class="fas fa-magic me-2"></i>Generar Contenido IA';
        document.getElementById('generationProgress').classList.add('d-none');
    }

    saveContent() {
        if (!this.currentGeneratedContent) return;

        this.generatedContent.push(this.currentGeneratedContent);
        this.saveGeneratedContent();

        alert('💾 Contenido guardado exitosamente en tu biblioteca.');

        // Actualizar interfaz
        this.showGeneratorSection('library');
    }

    shareContent() {
        if (!this.currentGeneratedContent) return;

        const shareData = {
            title: this.currentGeneratedContent.title,
            text: this.currentGeneratedContent.description,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback para navegadores sin Web Share API
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            alert('📤 Enlace copiado al portapapeles.');
        }
    }

    // Métodos auxiliares
    getUserLevel() {
        if (!this.currentUser) return 1;

        const progress = localStorage.getItem(`bge_progress_${this.currentUser.email}`);
        return progress ? JSON.parse(progress).level || 1 : 1;
    }

    getAvailableTemplates() {
        const userLevel = this.getUserLevel();
        return Math.min(Object.keys(this.contentTypes).length, Math.floor(userLevel / 2) + 3);
    }

    getTotalUsageTime() {
        return `${this.generatedContent.length * 45}min`;
    }

    getSubjectColor(subject) {
        const colors = {
            mathematics: 'primary',
            physics: 'success',
            chemistry: 'warning',
            biology: 'info',
            spanish: 'danger',
            english: 'secondary'
        };
        return colors[subject] || 'light';
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    generateContentId() {
        return 'content_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    saveGeneratedContent() {
        if (!this.currentUser) return;

        localStorage.setItem(
            `bge_generated_content_${this.currentUser.email}`,
            JSON.stringify(this.generatedContent)
        );
    }

    // Métodos de template (simplificados para ejemplo)
    getMathExerciseTemplates() {
        return ['ecuaciones', 'funciones', 'geometría', 'cálculo'];
    }

    getMathSummaryTemplates() {
        return ['álgebra', 'trigonometría', 'estadística'];
    }

    getMathQuizTemplates() {
        return ['evaluación básica', 'evaluación avanzada'];
    }

    getPhysicsExerciseTemplates() {
        return ['mecánica', 'termodinámica', 'electromagnetismo'];
    }

    getPhysicsExperimentTemplates() {
        return ['laboratorio virtual', 'simulaciones'];
    }

    getPhysicsSummaryTemplates() {
        return ['leyes fundamentales', 'aplicaciones'];
    }

    getChemistryExerciseTemplates() {
        return ['reacciones', 'estequiometría', 'química orgánica'];
    }

    getChemistryExperimentTemplates() {
        return ['experimentos virtuales', 'síntesis'];
    }

    getChemistryQuizTemplates() {
        return ['tabla periódica', 'enlace químico'];
    }

    getBiologySummaryTemplates() {
        return ['célula', 'genética', 'evolución'];
    }

    getBiologyMindmapTemplates() {
        return ['ecosistemas', 'anatomía', 'fisiología'];
    }

    getBiologyQuizTemplates() {
        return ['biodiversidad', 'sistema nervioso'];
    }
}

// Funciones globales
function openContentGenerator() {
    if (window.contentGeneratorAI) {
        window.contentGeneratorAI.showContentGeneratorModal();
    }
}

function generateQuickContent() {
    alert('⚡ Generación Rápida:\n\nFuncionalidad que creará contenido automáticamente basado en:\n• Tu historial de estudio\n• Materias con menor progreso\n• Recomendaciones IA personalizadas\n\n¡Próximamente disponible!');
}

// Inicializar generador de contenido
document.addEventListener('DOMContentLoaded', function() {
    window.contentGeneratorAI = new ContentGeneratorAI();
});