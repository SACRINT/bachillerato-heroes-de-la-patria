/**
 * 🎓 AI TUTOR ALPHA SERVICE - Semana 10: Sistema de Tutoría IA (Fase Alpha)
 * 
 * Este servicio implementa:
 * - Tutoría socrática para Matemáticas e Historia
 * - Generación de quizzes personalizados
 * - Persistencia del estado de aprendizaje
 * - Detección de riesgo emocional
 * - Límites de uso diario
 * - Sugerencias de temas basadas en calificaciones
 * - Ajuste de tono según edad
 * - Preguntas de seguimiento
 * 
 * @author AI Architect Agent
 * @date Diciembre 2025
 * @version 1.0.0 (Alpha)
 */

const { executeQuery } = require('../../config/database');
const devLogger = require('../../utils/devLogger');

// Intentar cargar OpenAI si está disponible
let openai = null;
try {
    const OpenAI = require('openai');
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your')) {
        openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
} catch (e) {
    devLogger.warn('AI_TUTOR', 'OpenAI no disponible, usando modo demo');
}

class AITutorAlphaService {
    constructor() {
        // Configuración de materias soportadas
        this.subjects = {
            matematicas: {
                name: 'Matemáticas',
                topics: ['Álgebra', 'Geometría', 'Trigonometría', 'Cálculo'],
                supportsLatex: true
            },
            historia: {
                name: 'Historia de México',
                topics: ['Época Prehispánica', 'Colonia', 'Independencia', 'Revolución', 'México Moderno'],
                supportsLatex: false
            },
            fisica: {
                name: 'Física',
                topics: ['Cinemática', 'Dinámica', 'Energía', 'Ondas'],
                supportsLatex: true
            },
            quimica: {
                name: 'Química',
                topics: ['Estructura Atómica', 'Enlaces', 'Reacciones', 'Estequiometría'],
                supportsLatex: true
            }
        };

        // Límites de uso diario por rol
        this.dailyLimits = {
            student: 50,      // 50 interacciones por día
            teacher: 200,     // 200 para docentes
            admin: 1000       // Sin límite práctico para admins
        };

        // Patrones de detección de riesgo
        this.riskPatterns = {
            frustration: [
                /no entiendo nada/i,
                /esto es imposible/i,
                /me rindo/i,
                /odio (esta materia|las matemáticas|la escuela)/i,
                /ya no puedo más/i,
                /quiero dejar la escuela/i
            ],
            emotional: [
                /me siento (triste|solo|mal)/i,
                /nadie me entiende/i,
                /necesito ayuda (real|de verdad)/i,
                /no quiero (vivir|seguir)/i,
                /me quiero (morir|hacer daño)/i
            ],
            examCheating: [
                /resuelve este examen/i,
                /son 20 preguntas/i,
                /tengo que entregar en 5 minutos/i,
                /responde rápido que es para calificar/i
            ]
        };

        // Cache de sesiones activas
        this.activeSessions = new Map();
    }

    // =====================================================
    // TAREA 1: Alcance Pedagógico (Materias Piloto)
    // =====================================================

    getSubjectPrompt(subjectId) {
        const subject = this.subjects[subjectId];
        if (!subject) return this.getGeneralPrompt();

        const basePrompt = `
Eres "HéroeTutor", el tutor virtual de ${subject.name} del Bachillerato Héroes de la Patria.

OBJETIVO PRINCIPAL: Guiar al estudiante usando el método socrático. NO des respuestas directas.

METODOLOGÍA SOCRÁTICA:
1. Responde preguntas con preguntas guía
2. Divide problemas complejos en pasos pequeños
3. Refuerza positivamente cada avance del estudiante
4. Si el estudiante se frustra, cambia el enfoque

TEMAS SOPORTADOS EN ${subject.name.toUpperCase()}:
${subject.topics.map(t => `- ${t}`).join('\n')}
`;

        if (subject.supportsLatex) {
            return basePrompt + `
FORMATO DE FÓRMULAS:
- Usa LaTeX para expresiones matemáticas
- Fórmulas inline: $expresión$
- Fórmulas en bloque: $$expresión$$
- Ejemplo: "La ecuación cuadrática es $ax^2 + bx + c = 0$"
`;
        }

        return basePrompt + `
FORMATO:
- Usa Markdown para estructura
- Utiliza listas y negritas para conceptos clave
- Incluye líneas de tiempo cuando sea relevante
`;
    }

    getGeneralPrompt() {
        return `
Eres "HéroeTutor", el asistente educativo del Bachillerato Héroes de la Patria.
Tu rol es ayudar a los estudiantes con sus dudas académicas usando el método socrático.
Guía al estudiante con preguntas en lugar de dar respuestas directas.
Si la pregunta está fuera de tu alcance, sugiere amablemente consultar con un profesor.
`;
    }

    // =====================================================
    // TAREA 3: Prompts Socráticos Avanzados
    // =====================================================

    getSocraticFollowUp(context) {
        const followUps = {
            stuck: [
                "¿Qué parte específicamente te confunde?",
                "Vamos paso a paso. ¿Cuál crees que es el primer paso?",
                "¿Puedes decirme con tus palabras qué entiendes del problema?"
            ],
            partialAnswer: [
                "¡Muy bien! Vas por buen camino. ¿Qué harías después?",
                "Excelente razonamiento. ¿Cómo aplicarías eso al siguiente paso?",
                "Correcto. Ahora, ¿qué conexión ves con lo que aprendiste antes?"
            ],
            wrongAnswer: [
                "Hmm, casi. ¿Qué pasaría si reconsideras este punto?",
                "Interesante enfoque. ¿Qué te hace pensar eso? Exploremos juntos.",
                "Veo tu lógica, pero hay un detalle. ¿Puedes verificar tu razonamiento?"
            ],
            correctAnswer: [
                "¡Excelente! ¿Puedes explicar por qué funciona de esa manera?",
                "¡Perfecto! ¿Cómo aplicarías esto a un problema similar?",
                "¡Muy bien! ¿Qué aprendiste de este ejercicio?"
            ]
        };

        const category = followUps[context] || followUps.partialAnswer;
        return category[Math.floor(Math.random() * category.length)];
    }

    // =====================================================
    // TAREA 5: Generación de Quizzes
    // =====================================================

    async generateQuiz(subject, topic, difficulty = 'medium', questionCount = 5) {
        const difficultyLevels = {
            easy: 'nivel básico, conceptos fundamentales',
            medium: 'nivel intermedio, aplicación de conceptos',
            hard: 'nivel avanzado, análisis y síntesis'
        };

        const quizPrompt = `
Genera un quiz de ${questionCount} preguntas sobre ${topic} en ${this.subjects[subject]?.name || subject}.

NIVEL: ${difficultyLevels[difficulty] || difficultyLevels.medium}

FORMATO DE RESPUESTA (JSON):
{
    "title": "Quiz de [Tema]",
    "subject": "${subject}",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "questions": [
        {
            "id": 1,
            "question": "Texto de la pregunta",
            "options": ["A) opción 1", "B) opción 2", "C) opción 3", "D) opción 4"],
            "correctAnswer": "A",
            "explanation": "Explicación breve de por qué es correcta",
            "hint": "Pista para el estudiante"
        }
    ]
}

REGLAS:
- Cada pregunta debe tener 4 opciones (A, B, C, D)
- Incluye una explicación pedagógica para cada respuesta
- Incluye una pista que guíe sin revelar la respuesta
- Las opciones incorrectas deben ser plausibles (no absurdas)
`;

        if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: "Eres un generador de quizzes educativos. Responde SOLO con JSON válido." },
                        { role: "user", content: quizPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                });

                const content = completion.choices[0].message.content;
                // Extraer JSON del contenido
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (error) {
                devLogger.error('AI_TUTOR', 'Error generando quiz:', error.message);
            }
        }

        // Fallback: Quiz de demostración
        return this.getDemoQuiz(subject, topic, difficulty);
    }

    getDemoQuiz(subject, topic, difficulty) {
        return {
            title: `Quiz de ${topic} (Demo)`,
            subject,
            topic,
            difficulty,
            isDemoData: true,
            questions: [
                {
                    id: 1,
                    question: "Esta es una pregunta de ejemplo sobre " + topic,
                    options: ["A) Opción correcta", "B) Opción incorrecta", "C) Otra opción", "D) Última opción"],
                    correctAnswer: "A",
                    explanation: "Esta es la explicación de por qué A es correcta.",
                    hint: "Piensa en los conceptos básicos del tema."
                },
                {
                    id: 2,
                    question: "Segunda pregunta de demostración",
                    options: ["A) Primera", "B) Segunda correcta", "C) Tercera", "D) Cuarta"],
                    correctAnswer: "B",
                    explanation: "B es correcta porque...",
                    hint: "Recuerda las definiciones clave."
                }
            ],
            generatedAt: new Date().toISOString()
        };
    }

    // =====================================================
    // TAREA 6: Persistencia del Estado de Aprendizaje
    // =====================================================

    async saveLearningState(studentId, sessionData) {
        try {
            const query = `
                INSERT INTO tutor_sessions 
                (student_id, subject, topic, messages_count, quiz_score, session_data, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (student_id, created_at::date) 
                DO UPDATE SET 
                    messages_count = tutor_sessions.messages_count + EXCLUDED.messages_count,
                    session_data = EXCLUDED.session_data,
                    updated_at = NOW()
                RETURNING id
            `;

            const result = await executeQuery(query, [
                studentId,
                sessionData.subject,
                sessionData.topic,
                sessionData.messagesCount || 1,
                sessionData.quizScore || null,
                JSON.stringify(sessionData)
            ]);

            return result[0]?.id;
        } catch (error) {
            devLogger.warn('AI_TUTOR', 'Error guardando estado (tabla puede no existir):', error.message);
            // Guardar en memoria como fallback
            const key = `${studentId}_${new Date().toISOString().split('T')[0]}`;
            this.activeSessions.set(key, sessionData);
            return key;
        }
    }

    async getLearningProgress(studentId, subject = null) {
        try {
            let query = `
                SELECT 
                    subject,
                    COUNT(*) as total_sessions,
                    SUM(messages_count) as total_messages,
                    AVG(quiz_score) as avg_quiz_score,
                    MAX(created_at) as last_session
                FROM tutor_sessions
                WHERE student_id = $1
            `;
            const params = [studentId];

            if (subject) {
                query += ` AND subject = $2`;
                params.push(subject);
            }

            query += ` GROUP BY subject ORDER BY last_session DESC`;

            const rows = await executeQuery(query, params);
            return rows;
        } catch (error) {
            devLogger.warn('AI_TUTOR', 'Error obteniendo progreso:', error.message);
            return [];
        }
    }

    // =====================================================
    // TAREA 8: Límites de Uso Diario
    // =====================================================

    async checkDailyLimit(userId, userRole = 'student') {
        const limit = this.dailyLimits[userRole] || this.dailyLimits.student;

        try {
            const query = `
                SELECT COUNT(*) as count 
                FROM tutor_sessions 
                WHERE student_id = $1 
                AND created_at::date = CURRENT_DATE
            `;
            const result = await executeQuery(query, [userId]);
            const usedToday = parseInt(result[0]?.count || 0);

            return {
                allowed: usedToday < limit,
                used: usedToday,
                limit,
                remaining: Math.max(0, limit - usedToday),
                resetAt: this.getNextResetTime()
            };
        } catch (error) {
            // Si no hay tabla, permitir pero limitar en memoria
            const memKey = `limit_${userId}_${new Date().toISOString().split('T')[0]}`;
            const memCount = this.activeSessions.get(memKey) || 0;

            return {
                allowed: memCount < limit,
                used: memCount,
                limit,
                remaining: Math.max(0, limit - memCount),
                resetAt: this.getNextResetTime()
            };
        }
    }

    getNextResetTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString();
    }

    async incrementUsage(userId) {
        const memKey = `limit_${userId}_${new Date().toISOString().split('T')[0]}`;
        const current = this.activeSessions.get(memKey) || 0;
        this.activeSessions.set(memKey, current + 1);
    }

    // =====================================================
    // TAREA 9: Detección de Riesgo
    // =====================================================

    detectRisk(message) {
        const risks = [];

        // Verificar frustración
        for (const pattern of this.riskPatterns.frustration) {
            if (pattern.test(message)) {
                risks.push({
                    type: 'frustration',
                    severity: 'medium',
                    pattern: pattern.toString(),
                    action: 'suggest_break'
                });
                break;
            }
        }

        // Verificar riesgo emocional (PRIORIDAD ALTA)
        for (const pattern of this.riskPatterns.emotional) {
            if (pattern.test(message)) {
                risks.push({
                    type: 'emotional',
                    severity: 'high',
                    pattern: pattern.toString(),
                    action: 'refer_counselor'
                });
                break;
            }
        }

        // Verificar intento de trampa en examen
        for (const pattern of this.riskPatterns.examCheating) {
            if (pattern.test(message)) {
                risks.push({
                    type: 'exam_cheating',
                    severity: 'low',
                    pattern: pattern.toString(),
                    action: 'decline_politely'
                });
                break;
            }
        }

        return {
            hasRisk: risks.length > 0,
            risks,
            highestSeverity: risks.length > 0
                ? risks.reduce((max, r) =>
                    this.severityWeight(r.severity) > this.severityWeight(max.severity) ? r : max
                ).severity
                : null
        };
    }

    severityWeight(severity) {
        const weights = { low: 1, medium: 2, high: 3 };
        return weights[severity] || 0;
    }

    getRiskResponse(riskType) {
        const responses = {
            frustration: `
Parece que estás sintiendo algo de frustración, y eso es completamente normal cuando aprendemos algo nuevo. 

🌟 Te sugiero:
1. Tomar un pequeño descanso de 5 minutos
2. Volver con la mente fresca
3. Empezar por un problema más sencillo

¿Te gustaría que intentemos con algo más básico primero?
            `,
            emotional: `
Noto que podrías estar pasando por un momento difícil. 

💙 Quiero que sepas que no estás solo/a. Si necesitas hablar con alguien:
- **Orientador escolar:** Disponible en horario escolar
- **Línea de la Vida:** 800-911-2000 (gratuita, 24/7)

¿Hay algo específico en lo que pueda ayudarte, o prefieres hablar con un adulto de confianza?
            `,
            exam_cheating: `
Parece que esta podría ser una pregunta de evaluación. 

📚 Como tutor, puedo:
- Explicarte los conceptos detrás del problema
- Guiarte con ejercicios similares de práctica
- Ayudarte a entender la metodología

Pero no puedo resolver ejercicios de exámenes directamente. ¿Te gustaría que practiquemos el tema con otros ejemplos?
            `
        };

        return responses[riskType] || "¿En qué puedo ayudarte?";
    }

    // =====================================================
    // TAREA 10: Integración con Calificaciones
    // =====================================================

    async suggestTopics(studentId) {
        try {
            // Obtener materias con bajo rendimiento
            const query = `
                SELECT 
                    materia,
                    AVG(calificacion) as promedio
                FROM calificaciones
                WHERE estudiante_id = $1
                AND created_at > NOW() - INTERVAL '90 days'
                GROUP BY materia
                HAVING AVG(calificacion) < 8.0
                ORDER BY promedio ASC
                LIMIT 3
            `;
            const lowPerformance = await executeQuery(query, [studentId]);

            if (lowPerformance.length > 0) {
                return {
                    suggestions: lowPerformance.map(row => ({
                        subject: row.materia,
                        averageGrade: parseFloat(row.promedio).toFixed(2),
                        priority: row.promedio < 7.0 ? 'high' : 'medium',
                        message: `Te recomiendo reforzar ${row.materia} (promedio: ${parseFloat(row.promedio).toFixed(1)})`
                    })),
                    basedOn: 'calificaciones_recientes',
                    generatedAt: new Date().toISOString()
                };
            }
        } catch (error) {
            devLogger.warn('AI_TUTOR', 'Error obteniendo sugerencias:', error.message);
        }

        // Fallback con sugerencias generales
        return {
            suggestions: [
                {
                    subject: 'matematicas',
                    averageGrade: null,
                    priority: 'medium',
                    message: 'Practica álgebra para mantener habilidades frescas'
                },
                {
                    subject: 'historia',
                    averageGrade: null,
                    priority: 'low',
                    message: 'Revisa los temas recientes de historia'
                }
            ],
            basedOn: 'sugerencias_generales',
            generatedAt: new Date().toISOString()
        };
    }

    // =====================================================
    // TAREA 12: Ajuste de Tono según Edad
    // =====================================================

    getToneForAge(age) {
        if (age < 15) {
            return {
                style: 'friendly_simple',
                useEmojis: true,
                vocabulary: 'simple',
                encouragement: 'high',
                systemPromptAddition: `
IMPORTANTE - AJUSTE DE TONO PARA ESTUDIANTE JOVEN:
- Usa un lenguaje sencillo y amigable
- Incluye emojis ocasionales para mantener el interés 🌟
- Celebra cada pequeño logro
- Usa analogías con situaciones de su vida diaria
- Evita tecnicismos innecesarios
                `
            };
        } else if (age < 18) {
            return {
                style: 'balanced',
                useEmojis: false,
                vocabulary: 'standard',
                encouragement: 'moderate',
                systemPromptAddition: `
AJUSTE DE TONO PARA ADOLESCENTE:
- Mantén un tono respetuoso pero cercano
- Usa vocabulario académico apropiado
- Evita ser condescendiente
- Fomenta el pensamiento crítico
                `
            };
        } else {
            return {
                style: 'professional',
                useEmojis: false,
                vocabulary: 'advanced',
                encouragement: 'subtle',
                systemPromptAddition: `
AJUSTE DE TONO PARA ESTUDIANTE ADULTO:
- Tono profesional y directo
- Vocabulario técnico cuando sea apropiado
- Fomenta la autonomía en el aprendizaje
- Menos guía, más facilitación
                `
            };
        }
    }

    // =====================================================
    // TAREA 13: Preguntas de Seguimiento
    // =====================================================

    generateFollowUpQuestions(subject, topic, lastResponse) {
        const followUps = {
            matematicas: [
                `¿Puedes aplicar este método a un problema con números diferentes?`,
                `¿Qué pasaría si cambiamos el signo en la ecuación?`,
                `¿Cómo verificarías que tu respuesta es correcta?`,
                `¿Conoces otro método para resolver esto?`
            ],
            historia: [
                `¿Qué consecuencias tuvo este evento en la sociedad?`,
                `¿Puedes identificar causas y efectos de este acontecimiento?`,
                `¿Cómo se relaciona esto con eventos actuales?`,
                `¿Qué opinaban diferentes grupos sobre este suceso?`
            ],
            fisica: [
                `¿Qué unidades usarías para medir esto?`,
                `¿Cómo cambia el resultado si duplicamos la masa?`,
                `¿Puedes dibujar un diagrama de fuerzas?`,
                `¿Qué principio físico explica este fenómeno?`
            ],
            general: [
                `¿Tienes alguna otra duda sobre este tema?`,
                `¿Te gustaría practicar con más ejemplos?`,
                `¿Hay algo que no haya quedado claro?`,
                `¿Listo para pasar al siguiente nivel?`
            ]
        };

        const subjectFollowUps = followUps[subject] || followUps.general;

        // Seleccionar 2-3 preguntas aleatorias
        const shuffled = subjectFollowUps.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    }

    // =====================================================
    // MÉTODO PRINCIPAL: Procesar Interacción de Tutoría
    // =====================================================

    async processTutorMessage(params) {
        const {
            studentId,
            message,
            subject = 'general',
            history = [],
            studentAge = 16,
            userRole = 'student'
        } = params;

        // 1. Verificar límite diario
        const limitCheck = await this.checkDailyLimit(studentId, userRole);
        if (!limitCheck.allowed) {
            return {
                success: false,
                error: 'daily_limit_exceeded',
                message: `Has alcanzado el límite diario de ${limitCheck.limit} interacciones. Vuelve mañana.`,
                resetAt: limitCheck.resetAt
            };
        }

        // 2. Detectar riesgos en el mensaje
        const riskAssessment = this.detectRisk(message);
        if (riskAssessment.hasRisk && riskAssessment.highestSeverity !== 'low') {
            const riskType = riskAssessment.risks.find(r => r.severity === riskAssessment.highestSeverity).type;

            await this.incrementUsage(studentId);

            return {
                success: true,
                response: this.getRiskResponse(riskType),
                metadata: {
                    riskDetected: true,
                    riskType,
                    riskSeverity: riskAssessment.highestSeverity
                }
            };
        }

        // 3. Construir prompt con ajuste de tono
        const toneConfig = this.getToneForAge(studentAge);
        const subjectPrompt = this.getSubjectPrompt(subject);
        const fullSystemPrompt = subjectPrompt + '\n' + toneConfig.systemPromptAddition;

        // 4. Preparar mensajes para el LLM
        const messages = [
            { role: "system", content: fullSystemPrompt },
            ...history.slice(-6), // Últimos 6 mensajes de contexto
            { role: "user", content: message }
        ];

        // 5. Llamar al LLM (o usar fallback)
        let response;
        if (openai) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages,
                    temperature: 0.5,
                    max_tokens: 800
                });
                response = completion.choices[0].message.content;
            } catch (error) {
                devLogger.error('AI_TUTOR', 'Error con OpenAI:', error.message);
                response = this.getFallbackResponse(message, subject);
            }
        } else {
            response = this.getFallbackResponse(message, subject);
        }

        // 6. Generar preguntas de seguimiento
        const followUpQuestions = this.generateFollowUpQuestions(subject, null, response);

        // 7. Incrementar uso y guardar estado
        await this.incrementUsage(studentId);
        await this.saveLearningState(studentId, {
            subject,
            messagesCount: 1,
            lastMessage: message.substring(0, 100),
            timestamp: new Date().toISOString()
        });

        return {
            success: true,
            response,
            followUpQuestions,
            metadata: {
                subject,
                studentAge,
                toneStyle: toneConfig.style,
                usageRemaining: limitCheck.remaining - 1,
                isDemoMode: !openai
            }
        };
    }

    getFallbackResponse(message, subject) {
        const subjectName = this.subjects[subject]?.name || subject;

        return `
¡Hola! Soy HéroeTutor, tu asistente de ${subjectName}. 

Tu pregunta: "${message.substring(0, 50)}..."

🔍 Para ayudarte mejor usando el método socrático:
1. ¿Cuál es el concepto principal que estás estudiando?
2. ¿Qué parte específica te genera dudas?
3. ¿Has intentado algún enfoque y te has atascado?

*Nota: Estoy en modo de demostración. Para respuestas completas, el sistema necesita conectarse al servicio de IA.*

${this.getSocraticFollowUp('stuck')}
        `.trim();
    }
}

// Singleton
const aiTutorAlphaService = new AITutorAlphaService();

module.exports = aiTutorAlphaService;
