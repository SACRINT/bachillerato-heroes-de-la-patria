/**
 * 🧠 BIBLIOTECA MAESTRA DE PROMPTS IA POR NIVELES
 * Sistema de prompts progresivos para cada tipo de usuario
 * Diseñados por ingenieros de prompts especializados
 */

class AIPromptsLibrary {
    constructor() {
        this.promptsDatabase = this.initializePromptsDatabase();
        this.contextPrompts = this.initializeContextPrompts();
    }

    /**
     * 📚 Base de datos completa de prompts por rol y nivel
     */
    initializePromptsDatabase() {
        return {
            // ========================================
            // ESTUDIANTES - 50 NIVELES PROGRESIVOS
            // ========================================
            student: {
                // NIVEL BÁSICO (1-10) - Inmediatos
                1: {
                    id: 'student_summary_basic',
                    name: 'Resumen Básico',
                    description: 'Crea resúmenes simples y claros',
                    category: 'writing',
                    xpReward: 10,
                    prompt: `Eres un asistente experto en crear resúmenes educativos para estudiantes de bachillerato.

INSTRUCCIONES:
- Crea un resumen claro y fácil de entender del siguiente texto
- Usa máximo 200 palabras
- Divide en 3-5 puntos principales
- Usa lenguaje simple y directo
- Incluye los conceptos más importantes

FORMATO DE SALIDA:
📝 RESUMEN:
• Punto principal 1
• Punto principal 2
• Punto principal 3

💡 CONCEPTO CLAVE:
[El concepto más importante explicado en 1 oración]

Texto a resumir: {input_text}`
                },

                2: {
                    id: 'student_vocabulary_builder',
                    name: 'Constructor de Vocabulario',
                    description: 'Identifica y explica palabras difíciles',
                    category: 'learning',
                    xpReward: 10,
                    prompt: `Eres un tutor experto en construcción de vocabulario académico.

TAREA:
- Identifica las 5-8 palabras más importantes o difíciles del texto
- Proporciona definición simple y ejemplo de uso
- Relaciona con conocimientos previos del estudiante

FORMATO:
🔤 VOCABULARIO CLAVE:

1. **[PALABRA]**
   - Significado: [definición simple]
   - Ejemplo: [oración de ejemplo]
   - Relación: [cómo se conecta con lo que ya sabes]

Texto para analizar: {input_text}`
                },

                5: {
                    id: 'student_concept_map',
                    name: 'Mapa Conceptual',
                    description: 'Organiza ideas en mapas visuales',
                    category: 'organization',
                    xpReward: 15,
                    prompt: `Eres un especialista en organización visual del conocimiento.

OBJETIVO:
- Crear un mapa conceptual del tema proporcionado
- Mostrar conexiones entre conceptos principales
- Usar estructura jerárquica clara

FORMATO:
🧠 MAPA CONCEPTUAL: {topic}

CONCEPTO CENTRAL: {topic}
├── Subtema 1
│   ├── Detalle 1.1
│   └── Detalle 1.2
├── Subtema 2
│   ├── Detalle 2.1
│   └── Detalle 2.2
└── Subtema 3
    ├── Detalle 3.1
    └── Detalle 3.2

🔗 CONEXIONES IMPORTANTES:
• [Relación entre conceptos]

Tema: {topic}
Información adicional: {additional_info}`
                },

                // NIVEL INTERMEDIO (11-25)
                15: {
                    id: 'student_essay_writer',
                    name: 'Escritor de Ensayos',
                    description: 'Genera ensayos argumentativos estructurados',
                    category: 'writing',
                    xpReward: 50,
                    prompt: `Eres un experto en redacción académica para bachillerato.

TAREA:
- Escribir un ensayo argumentativo de 500-700 palabras
- Estructura clara: introducción, desarrollo, conclusión
- Incluir argumentos sólidos y ejemplos
- Usar conectores apropiados

ESTRUCTURA:
📝 ENSAYO: "{topic}"

INTRODUCCIÓN (1 párrafo):
- Hook/gancho inicial
- Contexto del tema
- Tesis clara y específica

DESARROLLO (3 párrafos):
Párrafo 1: Argumento principal + evidencia
Párrafo 2: Argumento secundario + ejemplo
Párrafo 3: Contraargumento y refutación

CONCLUSIÓN (1 párrafo):
- Resumen de argumentos
- Reafirmación de tesis
- Reflexión final

CRITERIOS DE CALIDAD:
✅ Coherencia y cohesión
✅ Argumentos bien fundamentados
✅ Lenguaje académico apropiado
✅ Correcta ortografía y gramática

Tema del ensayo: {topic}
Enfoque específico: {focus}
Fuentes sugeridas: {sources}`
                },

                // NIVEL AVANZADO (26-40)
                30: {
                    id: 'student_research_methodology',
                    name: 'Metodología de Investigación',
                    description: 'Diseña investigaciones académicas completas',
                    category: 'research',
                    xpReward: 100,
                    prompt: `Eres un investigador académico especializado en metodología científica para estudiantes avanzados.

OBJETIVO:
- Diseñar una investigación completa y rigurosa
- Aplicar metodología científica apropiada
- Incluir todos los componentes necesarios

🔬 PROYECTO DE INVESTIGACIÓN

1. PLANTEAMIENTO DEL PROBLEMA:
   - Problema de investigación específico
   - Justificación e importancia
   - Objetivos general y específicos

2. MARCO TEÓRICO:
   - Conceptos fundamentales
   - Antecedentes relevantes
   - Hipótesis o preguntas de investigación

3. METODOLOGÍA:
   - Tipo de investigación (cualitativa/cuantitativa/mixta)
   - Población y muestra
   - Técnicas e instrumentos de recolección
   - Plan de análisis de datos

4. CRONOGRAMA:
   - Fases de la investigación
   - Tiempo estimado para cada etapa

5. RECURSOS NECESARIOS:
   - Materiales
   - Tecnológicos
   - Humanos

6. BIBLIOGRAFÍA BÁSICA:
   - 5-8 fuentes académicas relevantes

Tema de investigación: {research_topic}
Área de estudio: {study_area}
Recursos disponibles: {available_resources}`
                },

                // NIVEL MAESTRO (41-50)
                45: {
                    id: 'student_academic_publication',
                    name: 'Artículo Académico',
                    description: 'Redacta artículos para publicación estudiantil',
                    category: 'advanced_writing',
                    xpReward: 200,
                    prompt: `Eres un académico senior especializado en publicaciones científicas estudiantiles.

TAREA:
- Redactar un artículo académico completo
- Seguir estándares de publicación científica
- Incluir metodología rigurosa y análisis crítico

📄 ARTÍCULO ACADÉMICO

TÍTULO: [Específico y descriptivo]

RESUMEN (250 palabras):
- Objetivo de la investigación
- Metodología empleada
- Principales resultados
- Conclusiones relevantes
Palabras clave: [5-7 términos]

1. INTRODUCCIÓN
   - Contextualización del problema
   - Revisión de literatura
   - Objetivos e hipótesis

2. METODOLOGÍA
   - Diseño de investigación
   - Participantes/materiales
   - Procedimientos
   - Análisis de datos

3. RESULTADOS
   - Presentación sistemática de hallazgos
   - Tablas y figuras (descripciones)
   - Análisis estadístico si aplica

4. DISCUSIÓN
   - Interpretación de resultados
   - Comparación con estudios previos
   - Limitaciones del estudio
   - Implicaciones práticas

5. CONCLUSIONES
   - Síntesis de hallazgos principales
   - Contribución al conocimiento
   - Recomendaciones futuras

REFERENCIAS BIBLIOGRÁFICAS
[Formato APA 7ª edición]

Tema del artículo: {article_topic}
Metodología preferida: {methodology}
Audiencia objetivo: {target_audience}`
                }
            },

            // ========================================
            // DOCENTES - 40 NIVELES PROFESIONALES
            // ========================================
            teacher: {
                10: {
                    id: 'teacher_lesson_planner',
                    name: 'Planificador Didáctico Básico',
                    description: 'Crea planeaciones didácticas estructuradas',
                    category: 'planning',
                    xpReward: 25,
                    prompt: `Eres un especialista en diseño instruccional y planeación didáctica.

TAREA:
- Crear una planeación didáctica completa y efectiva
- Aplicar principios pedagógicos modernos
- Incluir actividades variadas y evaluación

📋 PLANEACIÓN DIDÁCTICA

DATOS GENERALES:
• Asignatura: {subject}
• Grado: {grade}
• Bloque/Unidad: {unit}
• Tiempo: {duration}
• Fecha: {date}

COMPETENCIAS A DESARROLLAR:
• Genéricas: [2-3 competencias]
• Disciplinares: [1-2 competencias específicas]

APRENDIZAJES ESPERADOS:
1. [Lo que el estudiante sabrá hacer al final]
2. [Habilidad específica a desarrollar]
3. [Actitud o valor a fortalecer]

SECUENCIA DIDÁCTICA:

🟢 INICIO (15 min):
- Actividad de activación de conocimientos previos
- Presentación del objetivo de la sesión
- Estrategia de motivación

🟡 DESARROLLO (60 min):
- Actividad principal de aprendizaje
- Ejercicios de práctica guiada
- Trabajo colaborativo/individual
- Recursos y materiales necesarios

🔴 CIERRE (15 min):
- Síntesis de aprendizajes
- Evaluación formativa
- Tarea o actividad de refuerzo

EVALUACIÓN:
• Diagnóstica: [Cómo identificar conocimientos previos]
• Formativa: [Durante el proceso de enseñanza]
• Sumativa: [Al final del tema/bloque]

RECURSOS NECESARIOS:
• Materiales: [Lista específica]
• Tecnológicos: [Herramientas digitales]
• Espacios: [Aula, laboratorio, etc.]

DIFERENCIACIÓN:
• Para estudiantes avanzados: [Actividades de extensión]
• Para estudiantes con dificultades: [Apoyos adicionales]

Tema de la clase: {topic}
Contenidos específicos: {content}
Características del grupo: {group_characteristics}`
                },

                25: {
                    id: 'teacher_assessment_creator',
                    name: 'Creador de Evaluaciones Avanzadas',
                    description: 'Diseña instrumentos de evaluación innovadores',
                    category: 'assessment',
                    xpReward: 60,
                    prompt: `Eres un experto en evaluación educativa y psicometría aplicada.

OBJETIVO:
- Crear instrumentos de evaluación válidos y confiables
- Incluir diferentes tipos de reactivos y niveles cognitivos
- Proporcionar rúbricas claras y objetivas

📊 INSTRUMENTO DE EVALUACIÓN

INFORMACIÓN GENERAL:
• Asignatura: {subject}
• Tema/Unidad: {topic}
• Tipo de evaluación: {assessment_type}
• Duración: {duration}
• Valor: {points} puntos

TABLA DE ESPECIFICACIONES:
| Contenido | Conocimiento | Comprensión | Aplicación | Análisis | TOTAL |
|-----------|-------------|------------|------------|----------|--------|
| Tema 1    | 20%         | 15%        | 10%        | 5%       | 50%    |
| Tema 2    | 15%         | 20%        | 10%        | 5%       | 50%    |
| TOTAL     | 35%         | 35%        | 20%        | 10%      | 100%   |

REACTIVOS:

SECCIÓN A: CONOCIMIENTO (35 puntos)
[10 reactivos de opción múltiple]
1. {question_format}
   a) [opción]
   b) [opción] ✓
   c) [opción]
   d) [opción]

SECCIÓN B: COMPRENSIÓN (35 puntos)
[5 preguntas abiertas cortas]
1. {comprehension_question}
   Respuesta esperada: [criterios específicos]

SECCIÓN C: APLICACIÓN (20 puntos)
[2 problemas prácticos]
1. {practical_problem}
   Solución: [pasos y procedimiento]

SECCIÓN D: ANÁLISIS (10 puntos)
[1 pregunta de análisis crítico]
1. {analysis_question}

RÚBRICA DE EVALUACIÓN:
| Criterio | Excelente (4) | Bueno (3) | Satisfactorio (2) | Insuficiente (1) |
|----------|---------------|-----------|-------------------|------------------|
| [Criterio 1] | [Descriptor] | [Descriptor] | [Descriptor] | [Descriptor] |

CLAVE DE RESPUESTAS:
[Respuestas correctas y justificaciones]

INSTRUCCIONES PARA EL ESTUDIANTE:
• Lee cuidadosamente cada pregunta
• Administra tu tiempo eficientemente
• Revisa tus respuestas antes de entregar

Contenidos a evaluar: {content_areas}
Nivel de dificultad: {difficulty_level}
Competencias específicas: {competencies}`
                }
            },

            // ========================================
            // PADRES - 25 NIVELES DE INVOLUCRAMIENTO
            // ========================================
            parent: {
                5: {
                    id: 'parent_homework_helper',
                    name: 'Asistente de Tareas',
                    description: 'Guía para apoyar sin resolver por el estudiante',
                    category: 'support',
                    xpReward: 15,
                    prompt: `Eres un especialista en acompañamiento familiar del aprendizaje.

PRINCIPIO FUNDAMENTAL:
- NUNCA hacer la tarea por tu hijo
- Guiar con preguntas que lo lleven a la respuesta
- Fomentar autonomía y pensamiento crítico

👨‍👩‍👧‍👦 GUÍA DE APOYO FAMILIAR

SITUACIÓN:
Tema de la tarea: {homework_topic}
Materia: {subject}
Dificultad que presenta: {difficulty}

ESTRATEGIA DE ACOMPAÑAMIENTO:

1. COMPRENSIÓN DEL PROBLEMA:
   Pregunta guía: "¿Puedes explicarme con tus palabras qué te están pidiendo?"

   Si no comprende:
   - "Leamos juntos el ejercicio paso a paso"
   - "¿Qué palabras clave identificas?"
   - "¿Hay algo similar que hayamos visto antes?"

2. BÚSQUEDA DE SOLUCIONES:
   Pregunta guía: "¿Qué estrategias podrías usar para resolver esto?"

   Apoyos sin dar respuestas:
   - "¿Qué información tienes disponible?"
   - "¿Dónde podrías buscar ayuda adicional?"
   - "¿Recuerdas cómo resolvimos algo parecido?"

3. PROCESO DE TRABAJO:
   - Mantén un ambiente tranquilo y libre de distracciones
   - Toma descansos cada 25-30 minutos
   - Celebra el esfuerzo, no solo los resultados

4. VERIFICACIÓN Y REFLEXIÓN:
   Preguntas finales:
   - "¿Cómo verificarías si tu respuesta es correcta?"
   - "¿Qué aprendiste con este ejercicio?"
   - "¿Qué harías diferente la próxima vez?"

SEÑALES DE ALERTA:
🚫 NO hagas esto:
- Dar respuestas directas
- Resolver ejercicios por él/ella
- Mostrar frustración o impaciencia
- Comparar con otros estudiantes

✅ SÍ haz esto:
- Hacer preguntas que generen reflexión
- Proporcionar pistas sutiles
- Validar el esfuerzo realizado
- Contactar al docente si persisten las dificultades

RECURSOS DE APOYO:
• Videos educativos recomendados: [links]
• Plataformas de consulta: [recursos]
• Contacto con docente: [cuando sea necesario]

Información específica de la tarea: {homework_details}
Edad del estudiante: {student_age}
Estilo de aprendizaje observado: {learning_style}`
                },

                15: {
                    id: 'parent_progress_tracker',
                    name: 'Monitor de Progreso Académico',
                    description: 'Sistema de seguimiento del desarrollo académico',
                    category: 'monitoring',
                    xpReward: 30,
                    prompt: `Eres un especialista en seguimiento del desarrollo académico familiar.

OBJETIVO:
- Crear un sistema de monitoreo efectivo del progreso académico
- Identificar fortalezas y áreas de mejora
- Establecer estrategias de apoyo específicas

📈 SISTEMA DE MONITOREO ACADÉMICO

PERFIL DEL ESTUDIANTE:
• Nombre: {student_name}
• Grado: {grade}
• Período a evaluar: {period}

ANÁLISIS POR MATERIAS:

🔵 FORTALEZAS IDENTIFICADAS:
| Materia | Calificación | Habilidades destacadas | Comentario docente |
|---------|--------------|----------------------|-------------------|
| {subject1} | {grade1} | {strengths1} | {teacher_comment1} |

🟡 ÁREAS DE OPORTUNIDAD:
| Materia | Dificultades | Causas posibles | Estrategias sugeridas |
|---------|--------------|----------------|---------------------|
| {subject2} | {challenges2} | {causes2} | {strategies2} |

ANÁLISIS DE TENDENCIAS:
📊 Progreso mensual:
• Septiembre: [promedio y observaciones]
• Octubre: [promedio y observaciones]
• Noviembre: [promedio y observaciones]

DESARROLLO INTEGRAL:

🧠 HABILIDADES COGNITIVAS:
• Comprensión lectora: {reading_level}
• Razonamiento matemático: {math_reasoning}
• Pensamiento crítico: {critical_thinking}
• Creatividad: {creativity_level}

💪 HABILIDADES SOCIOEMOCIONALES:
• Autoestima académica: {self_esteem}
• Motivación para el aprendizaje: {motivation}
• Relaciones interpersonales: {social_skills}
• Autorregulación: {self_regulation}

PLAN DE ACCIÓN FAMILIAR:

🎯 OBJETIVOS A CORTO PLAZO (1-2 meses):
1. [Objetivo específico y medible]
2. [Objetivo específico y medible]

🚀 ESTRATEGIAS DE APOYO:
• En casa: [actividades específicas]
• Comunicación con escuela: [frecuencia y forma]
• Recursos adicionales: [tutorías, materiales, etc.]

📅 CRONOGRAMA DE SEGUIMIENTO:
• Revisión semanal: [qué revisar]
• Reuniones con docentes: [cuándo y propósito]
• Evaluación mensual: [indicadores a medir]

INDICADORES DE ÉXITO:
✅ Mejora en calificaciones
✅ Mayor autonomía en el estudio
✅ Actitud positiva hacia el aprendizaje
✅ Mejor organización del tiempo

RECURSOS RECOMENDADOS:
• Aplicaciones educativas: [lista específica]
• Libros de apoyo: [por materia]
• Actividades extracurriculares: [opciones]

Datos específicos del estudiante: {student_data}
Metas familiares: {family_goals}
Recursos disponibles: {available_resources}`
                }
            },

            // ========================================
            // ADMINISTRATIVOS - 30 NIVELES EJECUTIVOS
            // ========================================
            admin: {
                20: {
                    id: 'admin_official_document',
                    name: 'Redactor de Oficios Institucionales',
                    description: 'Crea documentos oficiales profesionales',
                    category: 'communication',
                    xpReward: 40,
                    prompt: `Eres un especialista en comunicación institucional y redacción oficial.

OBJETIVO:
- Redactar documentos oficiales claros, precisos y profesionales
- Seguir protocolo institucional y normas administrativas
- Mantener tono formal y respetuoso

📄 DOCUMENTO OFICIAL

MEMBRETE INSTITUCIONAL:
[Bachillerato General Estatal "Héroes de la Patria"]
[Dirección, teléfono, email]

DATOS DEL DOCUMENTO:
• Tipo: {document_type}
• Número: {document_number}
• Fecha: {date}
• Asunto: {subject}

DESTINATARIO:
{recipient_name}
{recipient_position}
{recipient_institution}
{recipient_address}

CUERPO DEL DOCUMENTO:

SALUDO PROTOCOLAR:
[Fórmula de cortesía apropiada según el destinatario]

ANTECEDENTES/CONTEXTO:
[Situación que origina la comunicación]

EXPOSICIÓN:
[Desarrollo del asunto con claridad y precisión]

PETICIÓN/SOLICITUD:
[Lo que se solicita o informa de manera específica]

CIERRE:
[Fórmula de cortesía final]
[Expresión de gratitud si corresponde]
[Disposición para colaboración]

DESPEDIDA PROTOCOLAR:
"Sin otro particular, le reitero mi consideración más distinguida."

FIRMA:
{sender_name}
{sender_position}
Bachillerato General Estatal "Héroes de la Patria"

ANEXOS (si aplica):
• [Lista de documentos adjuntos]

c.c.p. [Copias a otras instancias si corresponde]

CRITERIOS DE CALIDAD:
✅ Lenguaje formal y respetuoso
✅ Información precisa y completa
✅ Estructura lógica y clara
✅ Ortografía y gramática impecables
✅ Formato institucional correcto

Propósito del documento: {purpose}
Información específica: {specific_info}
Nivel de formalidad requerido: {formality_level}`
                },

                30: {
                    id: 'admin_strategic_plan',
                    name: 'Plan Estratégico Institucional',
                    description: 'Desarrolla planes estratégicos integrales',
                    category: 'planning',
                    xpReward: 100,
                    prompt: `Eres un consultor en planeación estratégica educativa con 20+ años de experiencia.

OBJETIVO:
- Crear un plan estratégico integral y viable
- Incluir análisis situacional profundo
- Establecer metas claras y estrategias específicas

🎯 PLAN ESTRATÉGICO INSTITUCIONAL
Período: {planning_period}

RESUMEN EJECUTIVO:
[Síntesis de la situación actual, visión propuesta y estrategias principales]

1. ANÁLISIS SITUACIONAL:

📊 ANÁLISIS EXTERNO:
OPORTUNIDADES:
• [Factor externo positivo 1]
• [Factor externo positivo 2]
• [Factor externo positivo 3]

AMENAZAS:
• [Factor externo desafiante 1]
• [Factor externo desafiante 2]
• [Factor externo desafiante 3]

🏢 ANÁLISIS INTERNO:
FORTALEZAS:
• [Capacidad interna destacada 1]
• [Capacidad interna destacada 2]
• [Capacidad interna destacada 3]

DEBILIDADES:
• [Limitación interna 1]
• [Limitación interna 2]
• [Limitación interna 3]

2. DIRECCIONAMIENTO ESTRATÉGICO:

🎯 MISIÓN: (Razón de ser)
[Descripción clara del propósito institucional]

🔮 VISIÓN: (Futuro deseado)
[Imagen aspiracional de la institución en {vision_year}]

💎 VALORES INSTITUCIONALES:
• [Valor 1]: [Definición práctica]
• [Valor 2]: [Definición práctica]
• [Valor 3]: [Definición práctica]

3. OBJETIVOS ESTRATÉGICOS:

🎯 EJE 1: EXCELENCIA ACADÉMICA
Objetivo: [Objetivo específico y medible]
Estrategias:
• [Estrategia específica 1]
• [Estrategia específica 2]
Indicadores: [Métricas de seguimiento]

🎯 EJE 2: DESARROLLO INTEGRAL
Objetivo: [Objetivo específico y medible]
Estrategias:
• [Estrategia específica 1]
• [Estrategia específica 2]
Indicadores: [Métricas de seguimiento]

🎯 EJE 3: INNOVACIÓN EDUCATIVA
Objetivo: [Objetivo específico y medible]
Estrategias:
• [Estrategia específica 1]
• [Estrategia específica 2]
Indicadores: [Métricas de seguimiento]

4. PLAN OPERATIVO:

📅 CRONOGRAMA MAESTRO:
| Año | Prioridades | Proyectos clave | Presupuesto |
|-----|-------------|----------------|-------------|
| {year1} | [Prioridades] | [Proyectos] | [Monto] |
| {year2} | [Prioridades] | [Proyectos] | [Monto] |

5. SISTEMA DE SEGUIMIENTO:

📊 INDICADORES CLAVE (KPIs):
• Académicos: [Métricas específicas]
• Administrativos: [Métricas operativas]
• Financieros: [Métricas económicas]
• Satisfacción: [Métricas de percepción]

📈 METODOLOGÍA DE EVALUACIÓN:
• Revisión mensual: [Aspectos operativos]
• Evaluación trimestral: [Indicadores clave]
• Revisión anual: [Ajustes estratégicos]

6. GESTIÓN DE RIESGOS:

⚠️ RIESGOS IDENTIFICADOS:
| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| [Riesgo 1] | [Alta/Media/Baja] | [Alto/Medio/Bajo] | [Estrategia] |

7. RECURSOS NECESARIOS:

💰 PRESUPUESTO ESTIMADO:
• Inversión en infraestructura: ${amount}
• Desarrollo de personal: ${amount}
• Tecnología educativa: ${amount}
• Marketing institucional: ${amount}

👥 RECURSOS HUMANOS:
• Nuevas contrataciones: [Perfiles requeridos]
• Capacitación: [Programas necesarios]
• Desarrollo organizacional: [Iniciativas]

Contexto institucional: {institutional_context}
Prioridades específicas: {priorities}
Recursos disponibles: ${available_budget}`
                }
            }
        };
    }

    /**
     * 🧠 Prompts de contexto para diferentes situaciones
     */
    initializeContextPrompts() {
        return {
            // Prompts que se activan según el contexto del usuario
            time_based: {
                morning: "Buenos días. Comencemos este día de aprendizaje con energía...",
                afternoon: "Buenas tardes. Continuemos fortaleciendo tus conocimientos...",
                evening: "Buenas noches. Es momento de consolidar lo aprendido hoy..."
            },

            mood_based: {
                struggling: "Comprendo que esto puede ser desafiante. Vamos paso a paso...",
                confident: "Excelente actitud. Aprovechemos este momento de confianza...",
                curious: "Me gusta tu curiosidad. Exploremos más profundamente..."
            },

            performance_based: {
                low_performance: "Todos tenemos ritmos diferentes. Busquemos estrategias que funcionen para ti...",
                average_performance: "Vas por buen camino. Identifiquemos oportunidades de mejora...",
                high_performance: "¡Excelente trabajo! Desafiemos tu potencial con conceptos más avanzados..."
            }
        };
    }

    /**
     * 🔍 Obtener prompt por ID
     */
    getPromptById(userType, level, promptId) {
        const userPrompts = this.promptsDatabase[userType];
        if (!userPrompts) return null;

        const levelPrompts = userPrompts[level];
        if (!levelPrompts) return null;

        return levelPrompts;
    }

    /**
     * 📋 Obtener prompts disponibles por nivel y tipo
     */
    getAvailablePrompts(userType, currentLevel) {
        const userPrompts = this.promptsDatabase[userType];
        if (!userPrompts) return [];

        const available = [];
        for (let level = 1; level <= currentLevel; level++) {
            if (userPrompts[level]) {
                available.push({
                    level,
                    ...userPrompts[level]
                });
            }
        }

        return available;
    }

    /**
     * 🎯 Obtener próximos prompts desbloqueables
     */
    getUpcomingPrompts(userType, currentLevel) {
        const userPrompts = this.promptsDatabase[userType];
        if (!userPrompts) return [];

        const upcoming = [];
        for (let level = currentLevel + 1; level <= Math.min(currentLevel + 5, 50); level++) {
            if (userPrompts[level]) {
                upcoming.push({
                    level,
                    ...userPrompts[level]
                });
            }
        }

        return upcoming;
    }

    /**
     * 🔥 Ejecutar prompt con contexto personalizado
     */
    executePrompt(promptData, userInput, userContext = {}) {
        let prompt = promptData.prompt;

        // Reemplazar variables en el prompt
        Object.keys(userInput).forEach(key => {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), userInput[key]);
        });

        // Agregar contexto personalizado si está disponible
        if (userContext.mood) {
            const moodPrompt = this.contextPrompts.mood_based[userContext.mood];
            if (moodPrompt) {
                prompt = moodPrompt + "\n\n" + prompt;
            }
        }

        return {
            processedPrompt: prompt,
            metadata: {
                id: promptData.id,
                name: promptData.name,
                category: promptData.category,
                xpReward: promptData.xpReward,
                executedAt: new Date().toISOString()
            }
        };
    }
}

// Instancia global
window.aiPromptsLibrary = new AIPromptsLibrary();

// Hacer disponible para otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPromptsLibrary;
}