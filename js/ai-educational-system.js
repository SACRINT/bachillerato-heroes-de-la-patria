/**
 * 🧠 AI EDUCATIONAL SYSTEM - FASE 5
 * Sistema de Inteligencia Artificial Educativa para BGE Héroes de la Patria
 * Chatbot inteligente, recomendaciones personalizadas y tutor virtual
 */

class AIEducationalSystem {
    constructor() {
        this.knowledgeBase = new Map();
        this.studentProfiles = new Map();
        this.conversationHistory = [];
        this.currentContext = null;
        this.learningPatterns = new Map();
        this.subjects = new Map();

        this.config = {
            enablePersonalization: true,
            enableVoiceInteraction: false,
            enableProgressTracking: true,
            maxHistoryLength: 100,
            confidenceThreshold: 0.7
        };

        this.init();
    }

    async init() {
        await this.initializeKnowledgeBase();
        this.setupSubjectAreas();
        this.initializeStudentProfiling();
        this.setupConversationEngine();
        this.loadPersonalizationData();

        console.log('🧠 AI Educational System inicializado');
    }

    async initializeKnowledgeBase() {
        // Base de conocimiento específica para bachillerato
        this.knowledgeBase.set('matematicas', {
            topics: ['algebra', 'geometria', 'trigonometria', 'calculo', 'estadistica'],
            difficulty: ['basico', 'intermedio', 'avanzado'],
            examples: new Map(),
            formulas: new Map()
        });

        this.knowledgeBase.set('fisica', {
            topics: ['mecanica', 'termodinamica', 'electricidad', 'optica', 'ondas'],
            difficulty: ['basico', 'intermedio', 'avanzado'],
            examples: new Map(),
            formulas: new Map()
        });

        this.knowledgeBase.set('quimica', {
            topics: ['atomos', 'enlaces', 'reacciones', 'organica', 'equilibrio'],
            difficulty: ['basico', 'intermedio', 'avanzado'],
            examples: new Map(),
            formulas: new Map()
        });

        this.knowledgeBase.set('biologia', {
            topics: ['celulas', 'genetica', 'evolucion', 'ecologia', 'anatomia'],
            difficulty: ['basico', 'intermedio', 'avanzado'],
            examples: new Map(),
            diagrams: new Map()
        });

        this.knowledgeBase.set('historia', {
            topics: ['mexico', 'mundial', 'contemporanea', 'revolucion', 'independencia'],
            periods: ['prehispanico', 'colonial', 'independiente', 'moderno', 'contemporaneo'],
            events: new Map(),
            characters: new Map()
        });

        // Cargar contenido específico
        await this.loadSubjectContent();
    }

    async loadSubjectContent() {
        try {
            // Cargar contenido de matemáticas
            const mathFormulas = {
                'ecuacion_cuadratica': {
                    formula: 'ax² + bx + c = 0',
                    solution: 'x = (-b ± √(b² - 4ac)) / 2a',
                    explanation: 'Para resolver una ecuación cuadrática, usamos la fórmula general donde a, b y c son los coeficientes.',
                    examples: [
                        'x² - 5x + 6 = 0',
                        '2x² + 7x - 4 = 0'
                    ]
                },
                'teorema_pitagoras': {
                    formula: 'a² + b² = c²',
                    explanation: 'En un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos.',
                    examples: [
                        'Un triángulo con catetos de 3 y 4 tiene hipotenusa de 5',
                        'Calcula la hipotenusa si los catetos son 5 y 12'
                    ]
                }
            };

            this.knowledgeBase.get('matematicas').formulas = new Map(Object.entries(mathFormulas));

            // Cargar contenido de física
            const physicsFormulas = {
                'segunda_ley_newton': {
                    formula: 'F = ma',
                    explanation: 'La fuerza es igual a la masa por la aceleración. Es fundamental en mecánica.',
                    units: 'F en Newtons, m en kg, a en m/s²',
                    examples: [
                        'Un objeto de 10 kg con aceleración de 2 m/s² recibe una fuerza de 20 N'
                    ]
                },
                'energia_cinetica': {
                    formula: 'Ec = ½mv²',
                    explanation: 'La energía cinética depende de la masa y la velocidad al cuadrado.',
                    units: 'Ec en Joules, m en kg, v en m/s'
                }
            };

            this.knowledgeBase.get('fisica').formulas = new Map(Object.entries(physicsFormulas));

            console.log('📚 Contenido académico cargado exitosamente');

        } catch (error) {
            console.warn('⚠️ Error cargando contenido:', error);
        }
    }

    setupSubjectAreas() {
        // Configurar áreas de especialización del chatbot
        this.subjects.set('matematicas', {
            name: 'Matemáticas',
            icon: '🔢',
            color: '#FF6B6B',
            prompts: [
                '¿Necesitas ayuda con álgebra?',
                '¿Quieres resolver ecuaciones?',
                '¿Te ayudo con geometría?'
            ]
        });

        this.subjects.set('ciencias', {
            name: 'Ciencias',
            icon: '🔬',
            color: '#4ECDC4',
            prompts: [
                '¿Dudas de física o química?',
                '¿Necesitas explicaciones de biología?',
                '¿Te ayudo con experimentos?'
            ]
        });

        this.subjects.set('humanidades', {
            name: 'Humanidades',
            icon: '📚',
            color: '#45B7D1',
            prompts: [
                '¿Preguntas de historia?',
                '¿Ayuda con literatura?',
                '¿Filosofía o ética?'
            ]
        });

        this.subjects.set('orientacion', {
            name: 'Orientación Vocacional',
            icon: '🎯',
            color: '#96CEB4',
            prompts: [
                '¿Qué carrera estudiar?',
                '¿Universidades recomendadas?',
                '¿Becas disponibles?'
            ]
        });
    }

    initializeStudentProfiling() {
        // Sistema de perfilado de estudiantes
        this.studentProfiles.set('default', {
            name: 'Estudiante',
            grade: 'bachillerato',
            interests: [],
            strengths: [],
            difficulties: [],
            learningStyle: 'visual', // visual, auditivo, kinestésico
            progress: new Map(),
            lastInteraction: null
        });
    }

    setupConversationEngine() {
        // Motor de conversación inteligente
        this.conversationPatterns = new Map();

        // Patrones de saludo
        this.conversationPatterns.set('greetings', {
            patterns: [
                /^(hola|hi|hello|buenas|buenos días|buenas tardes|buenas noches)/i,
                /^(¿qué tal|cómo estás|qué hay)/i
            ],
            responses: [
                '¡Hola! Soy tu asistente de estudios de Héroes de la Patria. ¿En qué materia puedo ayudarte hoy?',
                '¡Buenos días! ¿Tienes alguna duda académica? Estoy aquí para ayudarte.',
                '¡Hola! ¿Qué tema quieres estudiar hoy? Puedo ayudarte con matemáticas, ciencias, historia y más.'
            ]
        });

        // Patrones de matemáticas
        this.conversationPatterns.set('mathematics', {
            patterns: [
                /^(matemáticas|mates|álgebra|geometría|cálculo|ecuación)/i,
                /^(resolver|calcular|demostrar|fórmula)/i,
                /\b(x|ecuación|función|derivada|integral)\b/i
            ],
            responses: [
                '¡Perfecto! Me encantan las matemáticas. ¿Qué tipo de problema necesitas resolver?',
                'Matemáticas es mi fuerte. ¿Es álgebra, geometría, o algún otro tema específico?',
                'Te puedo ayudar paso a paso. ¿Puedes escribir el problema que necesitas resolver?'
            ]
        });

        // Patrones de ciencias
        this.conversationPatterns.set('sciences', {
            patterns: [
                /^(física|química|biología|ciencias)/i,
                /\b(experimento|ley|teoría|átomo|célula|fuerza)\b/i,
                /\b(reacción|elemento|organismo|evolución)\b/i
            ],
            responses: [
                '¡Las ciencias son fascinantes! ¿Es física, química o biología?',
                'Te puedo explicar conceptos científicos de manera sencilla. ¿Qué tema te interesa?',
                '¿Necesitas ayuda con algún experimento o concepto científico específico?'
            ]
        });

        // Patrones de orientación vocacional
        this.conversationPatterns.set('career_guidance', {
            patterns: [
                /^(carrera|universidad|futuro|qué estudiar)/i,
                /\b(becas|admisión|examen|UNAM|IPN)\b/i,
                /\b(orientación|vocacional|profesión)\b/i
            ],
            responses: [
                'La orientación vocacional es muy importante. ¿Qué áreas te interesan más?',
                '¿Ya tienes algunas carreras en mente o necesitas explorar opciones?',
                'Te puedo ayudar a descubrir tus intereses y las mejores universidades para ti.'
            ]
        });
    }

    async processMessage(message, studentId = 'default') {
        try {
            // Analizar el mensaje
            const analysis = this.analyzeMessage(message);

            // Obtener perfil del estudiante
            const profile = this.getStudentProfile(studentId);

            // Generar respuesta inteligente
            const response = await this.generateResponse(analysis, profile);

            // Actualizar historial
            this.updateConversationHistory(message, response, studentId);

            // Aprender del patrón
            this.learnFromInteraction(analysis, studentId);

            return response;

        } catch (error) {
            console.error('Error procesando mensaje:', error);
            return this.getErrorResponse();
        }
    }

    analyzeMessage(message) {
        const analysis = {
            intent: 'unknown',
            subject: null,
            difficulty: 'intermedio',
            keywords: [],
            sentiment: 'neutral',
            needsExplanation: false,
            needsExample: false
        };

        // Detectar intención
        for (const [intent, pattern] of this.conversationPatterns) {
            for (const regex of pattern.patterns) {
                if (regex.test(message)) {
                    analysis.intent = intent;
                    break;
                }
            }
            if (analysis.intent !== 'unknown') break;
        }

        // Detectar materia específica
        if (message.match(/matemáticas|álgebra|geometría|cálculo/i)) {
            analysis.subject = 'matematicas';
        } else if (message.match(/física|fuerza|energía|movimiento/i)) {
            analysis.subject = 'fisica';
        } else if (message.match(/química|átomo|reacción|elemento/i)) {
            analysis.subject = 'quimica';
        } else if (message.match(/biología|célula|ADN|evolución/i)) {
            analysis.subject = 'biologia';
        } else if (message.match(/historia|méxico|revolución/i)) {
            analysis.subject = 'historia';
        }

        // Detectar necesidades específicas
        if (message.match(/explica|explicar|qué es|cómo/i)) {
            analysis.needsExplanation = true;
        }
        if (message.match(/ejemplo|demostrar|mostrar/i)) {
            analysis.needsExample = true;
        }

        // Extraer palabras clave
        analysis.keywords = this.extractKeywords(message);

        return analysis;
    }

    extractKeywords(message) {
        // Palabras importantes para el contexto educativo
        const educationalKeywords = [
            'ecuación', 'fórmula', 'teorema', 'ley', 'principio',
            'célula', 'átomo', 'energía', 'fuerza', 'velocidad',
            'historia', 'revolución', 'independencia', 'cultura',
            'carrera', 'universidad', 'examen', 'beca'
        ];

        const words = message.toLowerCase().split(/\s+/);
        return words.filter(word =>
            educationalKeywords.includes(word) ||
            word.length > 4
        ).slice(0, 5);
    }

    async generateResponse(analysis, profile) {
        let response = '';

        switch (analysis.intent) {
            case 'greetings':
                response = this.generateGreeting(profile);
                break;

            case 'mathematics':
                response = await this.generateMathResponse(analysis, profile);
                break;

            case 'sciences':
                response = await this.generateScienceResponse(analysis, profile);
                break;

            case 'career_guidance':
                response = await this.generateCareerResponse(analysis, profile);
                break;

            default:
                response = await this.generateGeneralResponse(analysis, profile);
        }

        // Personalizar respuesta
        response = this.personalizeResponse(response, profile);

        return {
            text: response,
            suggestions: this.generateSuggestions(analysis),
            resources: this.getRelevantResources(analysis),
            followUp: this.generateFollowUp(analysis)
        };
    }

    generateGreeting(profile) {
        const greetings = [
            `¡Hola${profile.name !== 'Estudiante' ? ', ' + profile.name : ''}! 🎓 Soy tu asistente educativo de Héroes de la Patria.`,
            `¡Buenos días${profile.name !== 'Estudiante' ? ', ' + profile.name : ''}! ¿En qué materia puedo ayudarte hoy?`,
            `¡Hola! Estoy aquí para ayudarte con tus estudios. ¿Qué tema te interesa?`
        ];

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    async generateMathResponse(analysis, profile) {
        if (analysis.keywords.includes('ecuación')) {
            return this.explainMathConcept('ecuacion_cuadratica');
        } else if (analysis.keywords.includes('triángulo')) {
            return this.explainMathConcept('teorema_pitagoras');
        }

        return '🔢 ¡Perfecto! Las matemáticas son fundamentales. ¿Podrías ser más específico sobre el tema que necesitas? Por ejemplo: álgebra, geometría, trigonometría, o algún problema en particular.';
    }

    async generateScienceResponse(analysis, profile) {
        if (analysis.subject === 'fisica') {
            return '🔬 ¡La física es fascinante! Te puedo ayudar con mecánica, termodinámica, electricidad y más. ¿Hay algún concepto específico que te gustaría entender mejor?';
        } else if (analysis.subject === 'quimica') {
            return '⚗️ ¡La química explica el mundo a nivel molecular! ¿Te interesa estructura atómica, enlaces químicos, reacciones, o algún tema específico?';
        } else if (analysis.subject === 'biologia') {
            return '🧬 ¡La biología estudia la vida en todas sus formas! ¿Quieres aprender sobre células, genética, evolución, o ecosistemas?';
        }

        return '🔬 Las ciencias son increíbles. ¿Te refieres a física, química, o biología? Puedo explicarte conceptos de cualquiera de estas materias.';
    }

    async generateCareerResponse(analysis, profile) {
        return `🎯 La orientación vocacional es muy importante en tu etapa.

**Algunas preguntas que te pueden ayudar:**
• ¿Qué materias disfrutas más?
• ¿Te gustan más las ciencias o las humanidades?
• ¿Prefieres trabajar con personas, datos, o crear cosas?

**Recursos disponibles:**
• Test de orientación vocacional
• Información sobre universidades
• Becas y financiamiento
• Perfil de carreras populares

¿Te gustaría empezar con algún tema específico?`;
    }

    async generateGeneralResponse(analysis, profile) {
        if (analysis.keywords.length > 0) {
            return `Veo que mencionas: ${analysis.keywords.join(', ')}.

¿Podrías darme más contexto? Por ejemplo:
• ¿Es para una tarea específica?
• ¿Necesitas una explicación teórica?
• ¿Quieres ver ejemplos prácticos?

Puedo ayudarte con matemáticas 🔢, ciencias 🔬, historia 📚, y orientación vocacional 🎯.`;
        }

        return `Te puedo ayudar con muchos temas académicos:

**📚 Materias principales:**
• Matemáticas (álgebra, geometría, cálculo)
• Ciencias (física, química, biología)
• Historia y ciencias sociales
• Orientación vocacional

**🎯 ¿Cómo puedo ayudarte?**
• Explicar conceptos difíciles
• Resolver problemas paso a paso
• Recomendar recursos de estudio
• Orientación sobre carreras

¿Qué tema te interesa más?`;
    }

    explainMathConcept(conceptId) {
        const concept = this.knowledgeBase.get('matematicas').formulas.get(conceptId);

        if (!concept) {
            return 'Lo siento, no tengo información sobre ese concepto específico.';
        }

        return `📐 **${conceptId.replace('_', ' ').toUpperCase()}**

**Fórmula:** ${concept.formula}
${concept.solution ? `**Solución:** ${concept.solution}` : ''}

**Explicación:** ${concept.explanation}

**Ejemplos:**
${concept.examples.map(ex => `• ${ex}`).join('\n')}

¿Te gustaría que resuelva un problema específico o necesitas más ejemplos?`;
    }

    generateSuggestions(analysis) {
        const suggestions = [];

        if (analysis.subject === 'matematicas') {
            suggestions.push('Ver más fórmulas de matemáticas', 'Resolver un problema paso a paso', 'Explicar conceptos básicos');
        } else if (analysis.subject === 'fisica') {
            suggestions.push('Leyes de Newton', 'Energía y trabajo', 'Experimentos virtuales');
        } else {
            suggestions.push('Elegir una materia', 'Ver recursos de estudio', 'Orientación vocacional');
        }

        return suggestions;
    }

    getRelevantResources(analysis) {
        const resources = [];

        if (analysis.subject) {
            resources.push({
                type: 'video',
                title: `Videos educativos de ${analysis.subject}`,
                url: `#recursos-${analysis.subject}`
            });

            resources.push({
                type: 'document',
                title: `Guía de estudio de ${analysis.subject}`,
                url: `#guias-${analysis.subject}`
            });
        }

        return resources;
    }

    generateFollowUp(analysis) {
        const followUps = [
            '¿Te quedó claro o necesitas que explique algo más?',
            '¿Hay algún otro tema que te gustaría estudiar?',
            '¿Quieres que te recomiende más recursos sobre este tema?'
        ];

        return followUps[Math.floor(Math.random() * followUps.length)];
    }

    personalizeResponse(response, profile) {
        // Personalizar basado en el estilo de aprendizaje
        if (profile.learningStyle === 'visual') {
            response += '\n\n📊 *Tip: Como aprendes mejor con elementos visuales, te recomiendo usar diagramas y gráficos.*';
        } else if (profile.learningStyle === 'auditivo') {
            response += '\n\n🎧 *Tip: Como aprendes mejor escuchando, te sugiero leer en voz alta o buscar podcasts educativos.*';
        }

        return response;
    }

    getStudentProfile(studentId) {
        return this.studentProfiles.get(studentId) || this.studentProfiles.get('default');
    }

    updateConversationHistory(message, response, studentId) {
        this.conversationHistory.push({
            timestamp: new Date(),
            studentId,
            message,
            response: response.text,
            intent: response.intent || 'unknown'
        });

        // Mantener solo los últimos mensajes
        if (this.conversationHistory.length > this.config.maxHistoryLength) {
            this.conversationHistory.shift();
        }
    }

    learnFromInteraction(analysis, studentId) {
        // Aprender patrones de uso para mejorar respuestas
        const pattern = {
            timestamp: new Date(),
            intent: analysis.intent,
            subject: analysis.subject,
            keywords: analysis.keywords
        };

        if (!this.learningPatterns.has(studentId)) {
            this.learningPatterns.set(studentId, []);
        }

        this.learningPatterns.get(studentId).push(pattern);
    }

    loadPersonalizationData() {
        // Cargar datos de personalización desde localStorage
        try {
            const saved = localStorage.getItem('aiEducationalData');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.profiles) {
                    this.studentProfiles = new Map(data.profiles);
                }
            }
        } catch (error) {
            console.warn('Error cargando datos de personalización:', error);
        }
    }

    savePersonalizationData() {
        // Guardar datos de personalización
        try {
            const data = {
                profiles: Array.from(this.studentProfiles.entries()),
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('aiEducationalData', JSON.stringify(data));
        } catch (error) {
            console.warn('Error guardando datos de personalización:', error);
        }
    }

    getErrorResponse() {
        return {
            text: 'Lo siento, tuve un problema procesando tu mensaje. ¿Podrías reformularlo? Estoy aquí para ayudarte con tus estudios.',
            suggestions: ['Matematicas', 'Ciencias', 'Historia', 'Orientación vocacional'],
            resources: [],
            followUp: '¿En qué materia necesitas ayuda?'
        };
    }

    // API pública
    async chat(message, studentId = 'default') {
        return await this.processMessage(message, studentId);
    }

    getAvailableSubjects() {
        return Array.from(this.subjects.entries()).map(([key, subject]) => ({
            id: key,
            name: subject.name,
            icon: subject.icon,
            color: subject.color
        }));
    }

    updateStudentProfile(studentId, updates) {
        const profile = this.getStudentProfile(studentId);
        Object.assign(profile, updates);
        this.studentProfiles.set(studentId, profile);
        this.savePersonalizationData();
    }

    getStudentProgress(studentId) {
        const profile = this.getStudentProfile(studentId);
        return {
            totalInteractions: this.conversationHistory.filter(h => h.studentId === studentId).length,
            subjects: Array.from(profile.progress.entries()),
            lastInteraction: profile.lastInteraction,
            strengths: profile.strengths,
            difficulties: profile.difficulties
        };
    }
}

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.aiEducationalSystem = new AIEducationalSystem();
});

// Exponer globalmente
window.AIEducationalSystem = AIEducationalSystem;