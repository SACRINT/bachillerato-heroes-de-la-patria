/**
 * 🎓 LANGGRAPH TUTOR ESCOLAR SERVICE
 * Fase 6 - Backend Inteligente: Objetivo 3
 * Tutoría Escolar Autónoma y Socrática gobernada por Máquina de Estados / LangGraph StateGraph.
 * Integra pgvector en Neon PostgreSQL, memoria de checkpoints y pedagogía activa.
 */

const { Pool } = require('pg');
const { semanticSearchService } = require('./semantic-search.service.js');

// Catálogo curricular oficial del BGE "Héroes de la Patria"
const CURRICULAR_SUBJECTS = {
    matematicas: {
        id: "matematicas",
        name: "Matemáticas y Razonamiento Lógico",
        icon: "fa-calculator",
        color: "#2563eb",
        topics: [
            "Álgebra y Ecuaciones Lineales/Cuadráticas",
            "Sistemas de Ecuaciones y Matrices",
            "Geometría Euclidiana y Trigonometría",
            "Funciones y Gráficas",
            "Cálculo Diferencial e Integral",
            "Probabilidad y Estadística Descriptiva"
        ]
    },
    fisica: {
        id: "fisica",
        name: "Física y Ciencias Experimentales",
        icon: "fa-atom",
        color: "#7c3aed",
        topics: [
            "Cinemática (MRU, MRUA, Tiro Parabólico)",
            "Dinámica y Leyes de Newton",
            "Trabajo, Potencia y Energía Mecánica",
            "Termodinámica y Calorimetría",
            "Electrostática y Circuitos Eléctricos",
            "Ondas y Óptica"
        ]
    },
    quimica: {
        id: "quimica",
        name: "Química General e Inorgánica",
        icon: "fa-flask",
        color: "#059669",
        topics: [
            "Estructura Atómica y Configuración Electrónica",
            "Tabla Periódica y Propiedades Periódicas",
            "Enlaces Químicos (Iónico, Covalente, Metálico)",
            "Nomenclatura Química y Tipos de Reacciones",
            "Estequiometría y Leyes Ponderales",
            "Disoluciones y Ácido-Base (pH)"
        ]
    },
    biologia: {
        id: "biologia",
        name: "Biología y Ciencias de la Salud",
        icon: "fa-dna",
        color: "#16a34a",
        topics: [
            "La Célula (Estructura y Organelos)",
            "Metabolismo Celular (Fotosíntesis y Respiración)",
            "Genética Mendeliana y Biología Molecular",
            "Evolución y Adaptación",
            "Biodiversidad y Ecología",
            "Anatomía y Fisiología Humana"
        ]
    },
    historia: {
        id: "historia",
        name: "Historia y Ciencias Sociales",
        icon: "fa-landmark",
        color: "#d97706",
        topics: [
            "México Prehispánico y Conquista",
            "Época Colonial y Virreinato",
            "Guerra de Independencia de México",
            "Reforma y Porfiriato",
            "Revolución Mexicana y Constitución de 1917",
            "México Contemporáneo e Historia Universal"
        ]
    },
    lenguaje: {
        id: "lenguaje",
        name: "Lengua y Comunicación",
        icon: "fa-feather",
        color: "#ea580c",
        topics: [
            "Comprensión Lectora y Niveles de Lectura",
            "Reglas Ortográficas y Acentuación",
            "Tipos de Textos (Argumentativo, Científico, Narrativo)",
            "Redacción de Ensayos y Reseñas",
            "Figuras Retóricas y Literatura",
            "Comunicación Oral y Argumentación"
        ]
    },
    normatividad: {
        id: "normatividad",
        name: "Reglamento y Trámites Escolares BGE",
        icon: "fa-graduation-cap",
        color: "#0d9488",
        topics: [
            "Reglamento Escolar y Asistencias",
            "Justificación Oficial de Faltas Médicas",
            "Beca Benito Juárez y Apoyos Económicos",
            "Seguro Facultativo de Salud IMSS",
            "Servicio Social y Prácticas Escolares (480h)",
            "Buzón Digital de Quejas y Sugerencias"
        ]
    }
};

class LangGraphTutorService {
    constructor() {
        this.pool = null;
    }

    /**
     * Obtener o inicializar conexión a base de datos Neon PostgreSQL
     */
    getPool() {
        if (!this.pool) {
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                console.warn('[LANGGRAPH-TUTOR] Falta DATABASE_URL; operando en memoria temporal');
                return null;
            }
            this.pool = new Pool({
                connectionString,
                ssl: { rejectUnauthorized: false },
                max: 5,
                idleTimeoutMillis: 30000
            });
        }
        return this.pool;
    }

    /**
     * Obtener el catálogo de asignaturas disponibles
     */
    getSubjects() {
        return Object.values(CURRICULAR_SUBJECTS);
    }

    /**
     * Cargar o crear el estado de una sesión de tutoría (LangGraph State)
     */
    async getOrCreateSessionState(sessionId, subjectKey = 'matematicas', userId = null) {
        const pool = this.getPool();
        const validSubject = CURRICULAR_SUBJECTS[subjectKey] ? subjectKey : 'matematicas';

        if (pool) {
            try {
                const res = await pool.query(
                    'SELECT state FROM tutor_graph_checkpoints WHERE session_id = $1 LIMIT 1',
                    [sessionId]
                );
                if (res.rows.length > 0 && res.rows[0].state) {
                    const loadedState = res.rows[0].state;
                    // Asegurar consistencia de la materia si fue cambiada
                    if (subjectKey && CURRICULAR_SUBJECTS[subjectKey] && loadedState.subject !== subjectKey) {
                        loadedState.subject = subjectKey;
                    }
                    return loadedState;
                }
            } catch (err) {
                console.warn('[LANGGRAPH-TUTOR] Error cargando checkpoint de Neon, creando estado nuevo:', err.message);
            }
        }

        // Estado inicial del Grafo pedagógico
        return {
            session_id: sessionId,
            user_id: userId || 'anon_student',
            subject: validSubject,
            topic: CURRICULAR_SUBJECTS[validSubject].topics[0],
            messages: [],
            cognitive_state: 'saludo',
            bloom_level: 'comprender',
            pedagogical_strategy: 'socratico',
            rag_context: [],
            active_challenge: null,
            evaluation_feedback: null,
            step_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    /**
     * Guardar el checkpoint del grafo en Neon DB
     */
    async saveCheckpoint(state) {
        const pool = this.getPool();
        if (!pool) return false;

        try {
            state.updated_at = new Date().toISOString();
            await pool.query(`
                INSERT INTO tutor_graph_checkpoints (session_id, user_id, subject, state, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (session_id) 
                DO UPDATE SET 
                    subject = EXCLUDED.subject,
                    user_id = EXCLUDED.user_id,
                    state = EXCLUDED.state,
                    updated_at = NOW();
            `, [state.session_id, state.user_id, state.subject, JSON.stringify(state)]);
            return true;
        } catch (err) {
            console.error('[LANGGRAPH-TUTOR] Error guardando checkpoint en Neon:', err.message);
            return false;
        }
    }

    // =========================================================================
    // NODOS DEL GRAFO DE ESTADOS (LANGGRAPH STATEGRAPH NODES)
    // =========================================================================

    /**
     * NODO 1: DIAGNÓSTICO COGNITIVO
     * Clasifica la intención, el nivel de pensamiento (Taxonomía de Bloom)
     * y detecta si el estudiante intenta obtener la respuesta directa de su tarea.
     */
    diagnoseNode(state, userMessage) {
        const text = userMessage.toLowerCase().trim();
        let cognitiveState = 'duda_conceptual';
        let bloomLevel = 'comprender';

        // 1. Detección de intento de trampa / solicitud de respuesta de examen o tarea
        const directAnswerTriggers = [
            'dame la respuesta', 'haz mi tarea', 'resuelve esto', 'cuanto da', 
            'cual es el resultado', 'hazmelo', 'pasa la respuesta', 'dime la respuesta exacta'
        ];
        const isAskingDirectSolution = directAnswerTriggers.some(t => text.includes(t)) || 
            /^(\d+[\+\-\*\/x\^]|\bcalcula\b|\bresuelve\b)/i.test(text);

        // 2. Detección de respuesta a un reto socrático previo
        const hasActiveChallenge = Boolean(state.active_challenge);

        // 3. Detección de consultas normativas o institucionales
        const normativeTriggers = [
            'justificante', 'falta', 'medico', 'beca', 'benito juarez', 'imss', 
            'seguro', 'servicio social', 'reglamento', 'calificacion', 'tramite', 'buzon'
        ];
        const isNormative = normativeTriggers.some(t => text.includes(t));

        if (isNormative || state.subject === 'normatividad') {
            cognitiveState = 'consulta_normativa';
            bloomLevel = 'recordar';
        } else if (hasActiveChallenge) {
            cognitiveState = 'respuesta_a_reto';
            bloomLevel = 'aplicar';
        } else if (isAskingDirectSolution) {
            cognitiveState = 'solicitud_respuesta_directa'; // Requiere desvío socrático
            bloomLevel = 'aplicar';
        } else if (text.includes('¿por qué') || text.includes('explica') || text.includes('no entiendo')) {
            cognitiveState = 'duda_conceptual';
            bloomLevel = 'analizar';
        } else if (text.includes('ejemplo') || text.includes('practicar') || text.includes('ejercicio')) {
            cognitiveState = 'practica_activa';
            bloomLevel = 'aplicar';
        }

        // Actualizar estado del grafo
        state.cognitive_state = cognitiveState;
        state.bloom_level = bloomLevel;
        state.step_count = (state.step_count || 0) + 1;

        return state;
    }

    /**
     * NODO 2: RECUPERADOR RAG PGVECTOR
     * Consulta la base de conocimientos vectorizada en Neon PostgreSQL
     * si la duda involucra trámites o normativa escolar.
     */
    async ragNode(state, userMessage) {
        if (state.cognitive_state === 'consulta_normativa' || state.subject === 'normatividad') {
            try {
                const searchResults = await semanticSearchService.search(userMessage, 1, {
                    limit: 3,
                    minScore: 0.15
                });
                state.rag_context = Array.isArray(searchResults) ? searchResults : (searchResults.results || []);
            } catch (err) {
                console.warn('[LANGGRAPH-TUTOR] RAG pgvector fallback:', err.message);
                state.rag_context = [];
            }
        } else {
            state.rag_context = [];
        }
        return state;
    }

    /**
     * NODO 3: FORMULADOR DE ESTRATEGIA PEDAGÓGICA
     * Determina la regla de intervención pedagógica activa.
     */
    strategyNode(state) {
        switch (state.cognitive_state) {
            case 'solicitud_respuesta_directa':
                // Principio socrático: NO dar el resultado final, formular una pregunta guía
                state.pedagogical_strategy = 'socratico_estricto';
                break;
            case 'respuesta_a_reto':
                state.pedagogical_strategy = 'evaluacion_formativa';
                break;
            case 'consulta_normativa':
                state.pedagogical_strategy = 'orientacion_institucional';
                break;
            case 'practica_activa':
                state.pedagogical_strategy = 'scaffolding_ejercicios';
                break;
            default:
                state.pedagogical_strategy = 'analogia_conceptual';
                break;
        }
        return state;
    }

    /**
     * NODO 4: EVALUADOR FORMATIVO
     * Evalúa los intentos del alumno si respondió a un micro-reto socrático.
     */
    evaluatorNode(state, userMessage) {
        if (state.cognitive_state !== 'respuesta_a_reto' || !state.active_challenge) {
            state.evaluation_feedback = null;
            return state;
        }

        const challenge = state.active_challenge;
        const answer = userMessage.toLowerCase().trim();
        const expected = (challenge.expected_concept || '').toLowerCase();
        
        // Verificación de coincidencia clave o cálculo
        const isMatch = expected && (
            answer.includes(expected) || 
            (challenge.expected_keywords && challenge.expected_keywords.some(k => answer.includes(k)))
        );

        if (isMatch) {
            state.evaluation_feedback = {
                status: 'correcto',
                message: '¡Excelente deducción! Has captado con precisión la idea central.',
                praise: '🌟 ¡Gran trabajo de razonamiento!'
            };
        } else {
            state.evaluation_feedback = {
                status: 'intento_valioso',
                message: 'Buen intento. Estás muy cerca, pero analicemos juntos un detalle clave.',
                hint: challenge.hints && challenge.hints[0] ? challenge.hints[0] : 'Revisa la regla fundamental.'
            };
        }

        return state;
    }

    /**
     * NODO 5: GENERADOR SOCRÁTICO (LLM + MOTOR HEURÍSTICO PEDAGÓGICO)
     * Sintetiza la respuesta final con pistas y micro-reto pedagógico.
     */
    async generatorNode(state, userMessage) {
        const subjectMeta = CURRICULAR_SUBJECTS[state.subject] || CURRICULAR_SUBJECTS.matematicas;
        
        // 1. Prioridad: Llamada a LLM si OpenAI está configurado
        if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('CHANGE_ME')) {
            try {
                const llmResponse = await this.callLLM(state, userMessage, subjectMeta);
                if (llmResponse) {
                    state.active_challenge = llmResponse.challenge || null;
                    return {
                        response: llmResponse.text,
                        challenge: llmResponse.challenge,
                        strategy: state.pedagogical_strategy,
                        bloomLevel: state.bloom_level
                    };
                }
            } catch (err) {
                console.warn('[LANGGRAPH-TUTOR] Error en llamada a LLM, activando generador pedagógico determinista:', err.message);
            }
        }

        // 2. Motor Heurístico Pedagógico Socrático (Garantía de Resiliencia y Cero Fails)
        return this.generateHeuristicSocraticResponse(state, userMessage, subjectMeta);
    }

    /**
     * Generador Heurístico Pedagógico Socrático Contextual
     */
    generateHeuristicSocraticResponse(state, userMessage, subjectMeta) {
        const text = userMessage.trim();
        let replyText = '';
        let newChallenge = null;

        // Caso A: Consulta Normativa Escolar con RAG
        if (state.cognitive_state === 'consulta_normativa') {
            if (state.rag_context && state.rag_context.length > 0) {
                const topDoc = state.rag_context[0];
                replyText = `### 📋 Procedimiento Oficial BGE: ${topDoc.title}\n\n` +
                    `${topDoc.content}\n\n` +
                    `> 💡 **Nota importante del Orientador:** Si tienes dudas adicionales o requieres el sello oficial, el trámite se formaliza en la Dirección o Control Escolar del plantel.`;
                newChallenge = {
                    question: "¿Tienes a la mano la documentación mencionada o requieres los horarios de atención?",
                    options: ["Ya tengo la documentación", "Necesito los horarios de oficina", "Tengo otra duda"]
                };
            } else {
                replyText = `Respecto a los trámites del Bachillerato General Estatal, puedes consultar directamente los módulos oficiales en el portal o acudir a Control Escolar con tu credencial de estudiante y folio.\n\n¿Deseas que revisemos el reglamento de asistencias, becas o servicio social?`;
            }
        }

        // Caso B: Solicitud de Respuesta Directa (Regla Anti-Trampa Socrática)
        else if (state.pedagogical_strategy === 'socratico_estricto') {
            replyText = `Comprendo que buscas resolver este ejercicio rápidamente, pero mi misión como tu **Tutor Socrático** es ayudarte a dominar el método para que lo resuelvas con total confianza en tus evaluaciones.\n\n` +
                `🔎 **Paso 1: Descompongamos el problema.**\n` +
                `Observa con atención lo que se nos pide en: *"${text}"*.\n\n` +
                `Antes de calcular el valor final, identifiquemos los componentes. ¿Qué tipo de operación u operación inversa crees que debemos aplicar primero?`;

            newChallenge = {
                question: "¿Cuál es el primer paso metodológico?",
                hints: ["Recuerda aislar la incógnita o agrupar términos semejantes.", "Aplica la operación inversa en ambos miembros."],
                expected_concept: "despejar",
                expected_keywords: ["despejar", "aislar", "restar", "sumar", "dividir", "operacion"]
            };
        }

        // Caso C: Evaluación de la respuesta a un reto anterior
        else if (state.cognitive_state === 'respuesta_a_reto' && state.evaluation_feedback) {
            const fb = state.evaluation_feedback;
            if (fb.status === 'correcto') {
                replyText = `${fb.praise}\n\n` +
                    `${fb.message}\n\n` +
                    `Ahora que dominamos este concepto, avancemos al siguiente nivel:\n` +
                    `¿Cómo aplicarías este mismo principio si cambiamos las condiciones o variables?`;

                newChallenge = {
                    question: "Plantea cómo comprobarías que tu resultado es verdadero y consistente.",
                    hints: ["Sustituye el valor obtenido en la ecuación o fórmula original."],
                    expected_concept: "sustituir",
                    expected_keywords: ["sustituir", "comprobar", "verificar", "remplazar"]
                };
            } else {
                replyText = `**${fb.message}**\n\n` +
                    `💡 **Pista orientadora:** ${fb.hint}\n\n` +
                    `Intentémoslo juntos una vez más con un paso más sencillo: ¿Qué ocurre si resolvemos solo la primera parte de la operación?`;

                newChallenge = state.active_challenge; // Mantiene el reto con ayuda
            }
        }

        // Caso D: Duda Conceptual o Práctica General
        else {
            replyText = `### 💡 Guía Pedagógica: ${subjectMeta.name}\n\n` +
                `Excelente tema para profundizar en **${subjectMeta.name}**.\n\n` +
                `Para comprender este concepto de manera clara y natural:\n` +
                `1. **La idea fundamental:** Todo principio en esta disciplina conecta una causa con un efecto demostrable.\n` +
                `2. **Analogía práctica:** Imagina este proceso como un sistema en equilibrio donde cada variable cumple una función específica.\n\n` +
                `Para asegurarnos de que todo quedó claro, te planteo un breve micro-reto reflexivo:`;

            newChallenge = {
                question: `En tus propias palabras, ¿cuál es el propósito principal de este concepto en ${subjectMeta.name}?`,
                hints: ["Piensa en cómo afecta al resultado final o a un fenómeno de la vida real."],
                expected_concept: "explicacion",
                expected_keywords: ["equilibrio", "funcion", "cambio", "proceso", "relacion"]
            };
        }

        state.active_challenge = newChallenge;

        return {
            response: replyText,
            challenge: newChallenge,
            strategy: state.pedagogical_strategy,
            bloomLevel: state.bloom_level
        };
    }

    /**
     * Llamada a OpenAI GPT-4o-mini / 3.5 con System Prompt Socrático Estricto
     */
    async callLLM(state, userMessage, subjectMeta) {
        const ragContextText = state.rag_context && state.rag_context.length > 0 
            ? `\nCONOCIMIENTO NORMATIVO DEL BGE DISPONIBLE:\n${state.rag_context.map(d => `- ${d.title}: ${d.content}`).join('\n')}` 
            : '';

        const systemPrompt = `Eres el Tutor IA Escolar del Bachillerato General Estatal "Héroes de la Patria".
Tu disciplina actual es: ${subjectMeta.name}.
Estrategia asignada por el Grafo de Estados: ${state.pedagogical_strategy}.
Nivel Bloom asignado: ${state.bloom_level}.
${ragContextText}

REGLAS PEDAGÓGICAS INMUTABLES:
1. PRINCIPIO SOCRÁTICO ESTRICTO: JAMÁS des la respuesta directa o final a tareas, exámenes o ejercicios de cálculo.
2. Si el alumno pide "dame la respuesta" o pone un ejercicio matemático/físico, elógialo por practicar, explica el concepto y dale el PRIMER PASO o una pista guiada con una pregunta reflexiva.
3. Si el alumno tiene dudas sobre reglamentos, justificación de faltas o becas del BGE, proporciona la información institucional exacta y clara.
4. Responde en formato Markdown rico (títulos, negritas, listas ordenadas, bloques de cita).
5. Incluye SIEMPRE al final un micro-reto pedagógico o pregunta reflexiva para que el estudiante responda.

Devuelve tu respuesta en formato JSON estrictamente válido:
{
  "text": "Tu explicación socrática guiada en Markdown",
  "challenge": {
    "question": "Pregunta o reto reflexivo planteado al estudiante",
    "hints": ["Pista 1", "Pista 2"],
    "expected_concept": "concepto clave esperado"
  }
}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...state.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
        ];

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages,
                response_format: { type: 'json_object' },
                temperature: 0.6
            })
        });

        if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
        const data = await res.json();
        return JSON.parse(data.choices[0].message.content);
    }

    /**
     * =========================================================================
     * EJECUTOR PRINCIPAL DEL GRAFO (LANGGRAPH EXECUTION PIPELINE)
     * =========================================================================
     */
    async executeGraph(sessionId, userMessage, subjectKey = 'matematicas', userId = null) {
        // 1. Cargar Estado
        let state = await this.getOrCreateSessionState(sessionId, subjectKey, userId);

        // Registrar mensaje de usuario en el historial
        state.messages.push({
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString()
        });

        // 2. Nodo Diagnóstico
        state = this.diagnoseNode(state, userMessage);

        // 3. Nodo RAG (pgvector Neon)
        state = await this.ragNode(state, userMessage);

        // 4. Nodo Estrategia Pedagógica
        state = this.strategyNode(state);

        // 5. Nodo Evaluador Formativo
        state = this.evaluatorNode(state, userMessage);

        // 6. Nodo Generador Socrático
        const generatorResult = await this.generatorNode(state, userMessage);

        // Registrar respuesta del asistente en el historial
        state.messages.push({
            role: 'assistant',
            content: generatorResult.response,
            challenge: generatorResult.challenge,
            strategy: generatorResult.strategy,
            timestamp: new Date().toISOString()
        });

        // 7. Nodo Checkpointer (Persistir estado del grafo en Neon DB)
        await this.saveCheckpoint(state);

        return {
            sessionId: state.session_id,
            subject: state.subject,
            cognitiveState: state.cognitive_state,
            strategy: state.pedagogical_strategy,
            bloomLevel: state.bloom_level,
            ragSourcesCount: state.rag_context ? state.rag_context.length : 0,
            evaluation: state.evaluation_feedback,
            response: generatorResult.response,
            challenge: generatorResult.challenge,
            messagesCount: state.messages.length
        };
    }

    /**
     * Reiniciar una sesión de tutoría
     */
    async resetSession(sessionId, subjectKey = 'matematicas') {
        const pool = this.getPool();
        const validSubject = CURRICULAR_SUBJECTS[subjectKey] ? subjectKey : 'matematicas';
        const newState = {
            session_id: sessionId,
            subject: validSubject,
            topic: CURRICULAR_SUBJECTS[validSubject].topics[0],
            messages: [],
            cognitive_state: 'saludo',
            bloom_level: 'comprender',
            pedagogical_strategy: 'socratico',
            rag_context: [],
            active_challenge: null,
            evaluation_feedback: null,
            step_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        if (pool) {
            try {
                await pool.query(
                    'DELETE FROM tutor_graph_checkpoints WHERE session_id = $1',
                    [sessionId]
                );
            } catch (err) {
                console.warn('[LANGGRAPH-TUTOR] Error reiniciando sesión en Neon:', err.message);
            }
        }

        return newState;
    }
}

module.exports = new LangGraphTutorService();
