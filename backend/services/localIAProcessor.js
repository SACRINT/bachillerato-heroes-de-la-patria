/**
 * 🤖 LOCAL IA PROCESSOR - PROCESADOR DE IA LOCAL
 * Sistema de IA local como fallback independiente para BGE Héroes de la Patria
 * Funciona sin APIs externas, usando algoritmos de procesamiento de lenguaje natural
 *
 * Versión: 3.0 - Fase 3 IA Avanzada
 * Fecha: 26 Septiembre 2025
 */

const devLogger = require('../utils/devLogger');

class LocalIAProcessor {
    constructor() {
        this.knowledgeBase = new Map();
        this.responseTemplates = new Map();
        this.contextPatterns = new Map();
        this.intentClassifier = new Map();

        this.init();
    }

    init() {
        devLogger.log('🧠 Inicializando LocalIAProcessor...');

        this.loadKnowledgeBase();
        this.setupResponseTemplates();
        this.setupIntentClassifier();
        this.setupContextPatterns();

        devLogger.log('✅ LocalIAProcessor inicializado correctamente');
    }

    /**
     * CARGAR BASE DE CONOCIMIENTO LOCAL
     */
    loadKnowledgeBase() {
        // Base de conocimiento educativo específico de BGE
        this.knowledgeBase.set('admision', {
            keywords: ['admision', 'inscripcion', 'ingresar', 'inscribir', 'requisitos', 'registro'],
            responses: [
                'Para inscribirte al Bachillerato General Estatal "Héroes de la Patria", necesitas presentar tu certificado de secundaria, acta de nacimiento, CURP, y fotografías tamaño infantil.',
                'El proceso de admisión incluye una evaluación diagnóstica y entrega de documentos. Las inscripciones están abiertas durante febrero y marzo.',
                'Los requisitos de admisión incluyen haber concluido la educación secundaria y aprobar el examen de ingreso.'
            ],
            context: 'informacion_institucional'
        });

        this.knowledgeBase.set('plan_estudios', {
            keywords: ['plan', 'estudios', 'materias', 'asignaturas', 'curriculum', 'semestres'],
            responses: [
                'Nuestro plan de estudios incluye materias básicas como Matemáticas, Español, Ciencias Naturales, Ciencias Sociales, y materias optativas especializadas.',
                'El bachillerato se cursa en 6 semestres (3 años) con un enfoque en formación integral y preparación universitaria.',
                'Ofrecemos especialidades en Ciencias Físico-Matemáticas, Químico-Biológicas, y Económico-Administrativas.'
            ],
            context: 'informacion_academica'
        });

        this.knowledgeBase.set('horarios', {
            keywords: ['horarios', 'clases', 'turnos', 'horario', 'hora', 'tiempo'],
            responses: [
                'Tenemos turno matutino de 7:00 AM a 1:30 PM y turno vespertino de 2:00 PM a 8:30 PM.',
                'Las clases son de lunes a viernes. Los horarios se publican al inicio de cada semestre.',
                'Cada clase tiene duración de 50 minutos con 10 minutos de receso entre períodos.'
            ],
            context: 'logistica'
        });

        this.knowledgeBase.set('servicios', {
            keywords: ['servicios', 'biblioteca', 'laboratorio', 'deportes', 'cafeteria', 'transporte'],
            responses: [
                'Contamos con biblioteca, laboratorios de ciencias, sala de cómputo, canchas deportivas, y cafetería escolar.',
                'Ofrecemos servicios de orientación vocacional, apoyo psicopedagógico, y actividades extracurriculares.',
                'Tenemos convenios de transporte escolar y becas académicas para estudiantes destacados.'
            ],
            context: 'servicios_escolares'
        });

        this.knowledgeBase.set('contacto', {
            keywords: ['contacto', 'telefono', 'direccion', 'ubicacion', 'email', 'correo'],
            responses: [
                'Nos ubicamos en Puebla, México. Puedes contactarnos a través de nuestra página web o visitarnos directamente.',
                'Para más información, puedes comunicarte con nosotros o agendar una cita con el departamento de admisiones.',
                'Estamos disponibles de lunes a viernes en horario de oficina para resolver tus dudas.'
            ],
            context: 'contacto_institucional'
        });

        // Temas académicos específicos
        this.knowledgeBase.set('matematicas', {
            keywords: ['matematicas', 'algebra', 'geometria', 'calculo', 'trigonometria', 'ecuaciones'],
            responses: [
                'En matemáticas trabajamos desde álgebra básica hasta cálculo diferencial, preparándote para estudios universitarios.',
                'Las matemáticas son fundamentales en nuestro plan de estudios, con enfoque en resolución de problemas y pensamiento lógico.',
                'Ofrecemos asesorías adicionales en matemáticas para estudiantes que necesiten refuerzo académico.'
            ],
            context: 'materia_academica'
        });

        this.knowledgeBase.set('ciencias', {
            keywords: ['ciencias', 'fisica', 'quimica', 'biologia', 'laboratorio', 'experimentos'],
            responses: [
                'Nuestros laboratorios de ciencias están equipados para experimentos de física, química y biología.',
                'Las ciencias naturales incluyen prácticas de laboratorio y proyectos de investigación estudiantil.',
                'Fomentamos el método científico y la experimentación como base del aprendizaje en ciencias.'
            ],
            context: 'materia_academica'
        });

        this.knowledgeBase.set('orientacion_vocacional', {
            keywords: ['carrera', 'universidad', 'futuro', 'orientacion', 'vocacional', 'profesion'],
            responses: [
                'Nuestro departamento de orientación vocacional te ayuda a descubrir tus intereses y aptitudes profesionales.',
                'Organizamos ferias universitarias y pláticas con profesionistas para orientar tu elección de carrera.',
                'Ofrecemos test vocacionales y asesoría personalizada para tu proyecto de vida universitario.'
            ],
            context: 'orientacion_estudiantil'
        });

        devLogger.log(`📚 Base de conocimiento cargada: ${this.knowledgeBase.size} temas`);
    }

    /**
     * CONFIGURAR PLANTILLAS DE RESPUESTA
     */
    setupResponseTemplates() {
        this.responseTemplates.set('saludo', [
            '¡Hola! Soy el asistente virtual del Bachillerato General Estatal "Héroes de la Patria". ¿En qué puedo ayudarte?',
            '¡Buenos días! Estoy aquí para ayudarte con información sobre nuestra institución. ¿Qué te gustaría saber?',
            '¡Hola! ¿Tienes alguna pregunta sobre el bachillerato o nuestros servicios educativos?'
        ]);

        this.responseTemplates.set('despedida', [
            '¡Gracias por contactarnos! Esperamos verte pronto en Héroes de la Patria. ¡Que tengas un excelente día!',
            'Ha sido un placer ayudarte. Si tienes más preguntas, no dudes en contactarnos. ¡Hasta pronto!',
            '¡Excelente! Espero haber resuelto tus dudas. Te esperamos en Héroes de la Patria.'
        ]);

        this.responseTemplates.set('no_entendido', [
            'Disculpa, no estoy seguro de entender tu pregunta. ¿Podrías reformularla?',
            'Lo siento, esa información no está en mi base de datos. ¿Te puedo ayudar con algo más sobre el bachillerato?',
            'No tengo información específica sobre eso, pero puedo ayudarte con admisiones, plan de estudios, horarios o servicios.'
        ]);

        this.responseTemplates.set('ayuda_general', [
            'Puedo ayudarte con información sobre:\n• Proceso de admisión\n• Plan de estudios\n• Horarios y turnos\n• Servicios escolares\n• Orientación vocacional\n\n¿Qué te interesa saber?',
            'Estoy aquí para ayudarte con cualquier duda sobre Héroes de la Patria. Pregúntame sobre admisiones, materias, horarios o servicios.',
            'Mi especialidad es brindarte información educativa sobre nuestro bachillerato. ¿En qué área específica te puedo ayudar?'
        ]);

        devLogger.log(`📝 Plantillas de respuesta configuradas: ${this.responseTemplates.size} tipos`);
    }

    /**
     * CONFIGURAR CLASIFICADOR DE INTENCIONES
     */
    setupIntentClassifier() {
        this.intentClassifier.set('saludo', {
            patterns: [
                /^(hola|hi|hello|buenas|buenos|buen)/i,
                /^(que tal|como estas|saludos)/i
            ],
            confidence: 0.9
        });

        this.intentClassifier.set('despedida', {
            patterns: [
                /^(adios|hasta luego|bye|nos vemos|gracias|chau)/i,
                /^(me voy|ya me voy|hasta pronto)/i
            ],
            confidence: 0.9
        });

        this.intentClassifier.set('pregunta_informacion', {
            patterns: [
                /^(que|cual|como|cuando|donde|por que|cuanto)/i,
                /^(me puedes|puedes|podrias|necesito|quiero saber)/i,
                /^(info|informacion|detalles|datos)/i
            ],
            confidence: 0.8
        });

        this.intentClassifier.set('ayuda', {
            patterns: [
                /^(ayuda|help|socorro|no entiendo)/i,
                /^(que puedes hacer|como funciona)/i
            ],
            confidence: 0.8
        });

        devLogger.log(`🎯 Clasificador de intenciones configurado: ${this.intentClassifier.size} intenciones`);
    }

    /**
     * CONFIGURAR PATRONES DE CONTEXTO
     */
    setupContextPatterns() {
        this.contextPatterns.set('temporal_urgente', {
            keywords: ['urgente', 'rapido', 'inmediato', 'ya', 'ahora'],
            modifier: 'urgencia'
        });

        this.contextPatterns.set('temporal_futuro', {
            keywords: ['proximamente', 'siguiente', 'futuro', 'despues', 'luego'],
            modifier: 'planificacion'
        });

        this.contextPatterns.set('emocional_positivo', {
            keywords: ['gracias', 'excelente', 'perfecto', 'genial', 'increible'],
            modifier: 'satisfaccion'
        });

        this.contextPatterns.set('emocional_negativo', {
            keywords: ['problema', 'dificil', 'no puedo', 'complicado', 'mal'],
            modifier: 'preocupacion'
        });

        devLogger.log(`🎭 Patrones de contexto configurados: ${this.contextPatterns.size} patrones`);
    }

    /**
     * PROCESAR MENSAJE PRINCIPAL
     */
    async process(params) {
        const startTime = Date.now();
        const { message, context, conversationHistory, systemPrompt } = params;

        try {
            // 1. Análisis de intención
            const intent = this.classifyIntent(message);

            // 2. Análisis de contexto
            const contextAnalysis = this.analyzeContext(message, context);

            // 3. Búsqueda en base de conocimiento
            const knowledgeMatch = this.searchKnowledgeBase(message);

            // 4. Generar respuesta
            const response = this.generateResponse(intent, knowledgeMatch, contextAnalysis, message);

            // 5. Análisis de confianza
            const confidence = this.calculateConfidence(intent, knowledgeMatch, contextAnalysis);

            const processingTime = Date.now() - startTime;

            devLogger.log(`🧠 LocalIA procesó: "${message.substring(0, 30)}..." en ${processingTime}ms (confianza: ${(confidence * 100).toFixed(1)}%)`);

            return {
                text: response,
                confidence: confidence,
                intent: intent.name,
                processingTime: processingTime,
                contextModifiers: contextAnalysis.modifiers,
                knowledgeSource: knowledgeMatch?.source || 'template',
                isLocal: true
            };

        } catch (error) {
            devLogger.error('Error en LocalIAProcessor:', error);
            return this.generateErrorResponse(message);
        }
    }

    /**
     * CLASIFICAR INTENCIÓN DEL MENSAJE
     */
    classifyIntent(message) {
        const normalizedMessage = message.toLowerCase().trim();
        let bestMatch = { name: 'pregunta_informacion', confidence: 0.5 };

        for (const [intentName, intentData] of this.intentClassifier) {
            for (const pattern of intentData.patterns) {
                if (pattern.test(normalizedMessage)) {
                    if (intentData.confidence > bestMatch.confidence) {
                        bestMatch = {
                            name: intentName,
                            confidence: intentData.confidence
                        };
                    }
                }
            }
        }

        return bestMatch;
    }

    /**
     * ANALIZAR CONTEXTO DEL MENSAJE
     */
    analyzeContext(message, context) {
        const normalizedMessage = message.toLowerCase();
        const modifiers = [];
        const contextElements = [];

        // Buscar patrones de contexto
        for (const [patternName, patternData] of this.contextPatterns) {
            for (const keyword of patternData.keywords) {
                if (normalizedMessage.includes(keyword)) {
                    modifiers.push(patternData.modifier);
                    break;
                }
            }
        }

        // Analizar contexto proporcionado
        if (context) {
            contextElements.push({
                userType: context.userType || 'visitante',
                currentPage: context.currentPage || 'sitio_web',
                sessionId: context.sessionId || 'nueva_sesion'
            });
        }

        return {
            modifiers: modifiers,
            elements: contextElements,
            messageLength: message.length,
            complexity: this.assessComplexity(message)
        };
    }

    /**
     * BUSCAR EN BASE DE CONOCIMIENTO
     */
    searchKnowledgeBase(message) {
        const normalizedMessage = message.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;

        for (const [topic, topicData] of this.knowledgeBase) {
            let score = 0;

            // Calcular score basado en keywords encontradas
            for (const keyword of topicData.keywords) {
                if (normalizedMessage.includes(keyword)) {
                    score += 1;
                }
            }

            // Normalizar score por cantidad de keywords
            const normalizedScore = score / topicData.keywords.length;

            if (normalizedScore > bestScore && normalizedScore > 0.3) {
                bestScore = normalizedScore;
                bestMatch = {
                    topic: topic,
                    data: topicData,
                    score: normalizedScore,
                    source: 'knowledge_base'
                };
            }
        }

        return bestMatch;
    }

    /**
     * GENERAR RESPUESTA
     */
    generateResponse(intent, knowledgeMatch, contextAnalysis, originalMessage) {
        let response = '';

        // 1. Responder según intención identificada
        if (intent.name === 'saludo') {
            response = this.getRandomTemplate('saludo');
        } else if (intent.name === 'despedida') {
            response = this.getRandomTemplate('despedida');
        } else if (intent.name === 'ayuda') {
            response = this.getRandomTemplate('ayuda_general');
        } else if (knowledgeMatch && knowledgeMatch.score > 0.5) {
            // Usar conocimiento específico encontrado
            response = this.getRandomResponse(knowledgeMatch.data.responses);

            // Agregar contexto adicional si es relevante
            if (contextAnalysis.modifiers.includes('urgencia')) {
                response += '\n\n⚡ *Para atención inmediata, puedes visitarnos directamente o llamar a nuestras oficinas.*';
            }

            if (contextAnalysis.modifiers.includes('planificacion')) {
                response += '\n\n📅 *Te recomendamos planificar con tiempo y revisar nuestras fechas importantes.*';
            }
        } else {
            // Respuesta genérica cuando no hay match claro
            response = this.getRandomTemplate('no_entendido');
            response += '\n\n' + this.getRandomTemplate('ayuda_general');
        }

        // 2. Personalizar respuesta según contexto
        response = this.personalizeResponse(response, contextAnalysis);

        return response;
    }

    /**
     * PERSONALIZAR RESPUESTA
     */
    personalizeResponse(response, contextAnalysis) {
        let personalizedResponse = response;

        // Agregar elementos contextuales
        if (contextAnalysis.modifiers.includes('satisfaccion')) {
            personalizedResponse += '\n\n😊 *¡Me alegra poder ayudarte!*';
        }

        if (contextAnalysis.modifiers.includes('preocupacion')) {
            personalizedResponse += '\n\n💭 *No te preocupes, estamos aquí para apoyarte en todo el proceso.*';
        }

        // Agregar información de contacto si es relevante
        if (personalizedResponse.includes('contacto') || personalizedResponse.includes('más información')) {
            personalizedResponse += '\n\n📞 *¿Necesitas hablar directamente con nosotros? Agenda una cita o visítanos.*';
        }

        return personalizedResponse;
    }

    /**
     * CALCULAR CONFIANZA DE LA RESPUESTA
     */
    calculateConfidence(intent, knowledgeMatch, contextAnalysis) {
        let confidence = 0.3; // Base mínima

        // Sumar confianza por intención
        confidence += intent.confidence * 0.4;

        // Sumar confianza por match de conocimiento
        if (knowledgeMatch) {
            confidence += knowledgeMatch.score * 0.4;
        }

        // Sumar confianza por contexto
        confidence += Math.min(contextAnalysis.modifiers.length * 0.1, 0.2);

        return Math.min(confidence, 0.95); // Máximo 95%
    }

    /**
     * EVALUAR COMPLEJIDAD DEL MENSAJE
     */
    assessComplexity(message) {
        const words = message.split(/\s+/).length;
        const questions = (message.match(/\?/g) || []).length;
        const complexity = words + (questions * 2);

        if (complexity < 5) return 'simple';
        if (complexity < 15) return 'media';
        return 'compleja';
    }

    /**
     * OBTENER PLANTILLA ALEATORIA
     */
    getRandomTemplate(templateType) {
        const templates = this.responseTemplates.get(templateType) || ['Información no disponible.'];
        return templates[Math.floor(Math.random() * templates.length)];
    }

    /**
     * OBTENER RESPUESTA ALEATORIA
     */
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * GENERAR RESPUESTA DE ERROR
     */
    generateErrorResponse(message) {
        return {
            text: 'Lo siento, tuve un problema procesando tu mensaje. Por favor, intenta reformular tu pregunta.',
            confidence: 0.1,
            intent: 'error',
            processingTime: 0,
            contextModifiers: [],
            knowledgeSource: 'error_fallback',
            isLocal: true,
            error: true
        };
    }

    /**
     * OBTENER ESTADÍSTICAS DEL PROCESADOR
     */
    getStats() {
        return {
            knowledgeBaseSize: this.knowledgeBase.size,
            responseTemplates: this.responseTemplates.size,
            intentClassifier: this.intentClassifier.size,
            contextPatterns: this.contextPatterns.size,
            version: '3.0.0',
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * AGREGAR NUEVO CONOCIMIENTO
     */
    addKnowledge(topic, data) {
        this.knowledgeBase.set(topic, data);
        devLogger.log(`📚 Nuevo conocimiento agregado: ${topic}`);
    }

    /**
     * ACTUALIZAR PLANTILLA DE RESPUESTA
     */
    updateTemplate(templateType, responses) {
        this.responseTemplates.set(templateType, responses);
        devLogger.log(`📝 Plantilla actualizada: ${templateType}`);
    }
}

// Singleton
let localIAProcessorInstance = null;

function getLocalIAProcessor() {
    if (!localIAProcessorInstance) {
        localIAProcessorInstance = new LocalIAProcessor();
    }
    return localIAProcessorInstance;
}

module.exports = {
    LocalIAProcessor,
    getLocalIAProcessor
};