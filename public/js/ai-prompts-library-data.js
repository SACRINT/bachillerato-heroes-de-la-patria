/**
 * 📚 BIBLIOTECA DE DATOS DE PROMPTS IA
 * Exportación para uso en servidor Node.js
 */

module.exports = {
    // ESTUDIANTES - Nivel 1-5 (Básico)
    'student_summary_basic': {
        id: 'student_summary_basic',
        name: 'Resumen Básico',
        description: 'Crea resúmenes simples y claros de cualquier tema',
        level: 1,
        category: 'writing',
        xpReward: 10,
        userTypes: ['student'],
        prompt: 'Eres un tutor experto en crear resúmenes educativos para estudiantes de bachillerato. Crea un resumen claro y estructurado del tema proporcionado, usando lenguaje sencillo y apropiado para bachillerato. Organiza la información en secciones lógicas e incluye los puntos más importantes.'
    },

    'student_questions_helper': {
        id: 'student_questions_helper',
        name: 'Ayuda con Preguntas',
        description: 'Responde preguntas de estudio con explicaciones claras',
        level: 2,
        category: 'study',
        xpReward: 15,
        userTypes: ['student'],
        prompt: 'Eres un tutor personal especializado en explicar conceptos a estudiantes de bachillerato mexicano. Responde la pregunta de manera clara y didáctica, usando ejemplos concretos y del contexto mexicano. Desglosa conceptos complejos en pasos simples.'
    },

    'student_homework_organizer': {
        id: 'student_homework_organizer',
        name: 'Organizador de Tareas',
        description: 'Ayuda a planificar y organizar tareas escolares',
        level: 3,
        category: 'productivity',
        xpReward: 20,
        userTypes: ['student'],
        prompt: 'Eres un coach de productividad especializado en estudiantes de bachillerato. Analiza las tareas/materias proporcionadas y crea un plan de estudio realista y alcanzable. Prioriza según fechas de entrega e importancia.'
    },

    // DOCENTES - Nivel 10+
    'teacher_lesson_planner': {
        id: 'teacher_lesson_planner',
        name: 'Planificador de Clases',
        description: 'Crea planes de clase detallados y efectivos',
        level: 10,
        category: 'teaching',
        xpReward: 30,
        userTypes: ['teacher'],
        prompt: 'Eres un experto en diseño pedagógico especializado en bachillerato mexicano. Crea un plan de clase completo y estructurado considerando diferentes estilos de aprendizaje. Incluye actividades interactivas y evaluación.'
    },

    'teacher_assessment_creator': {
        id: 'teacher_assessment_creator',
        name: 'Creador de Evaluaciones',
        description: 'Diseña evaluaciones formativas y sumativas',
        level: 15,
        category: 'assessment',
        xpReward: 40,
        userTypes: ['teacher'],
        prompt: 'Eres un especialista en evaluación educativa para bachillerato mexicano. Diseña una evaluación alineada con objetivos de aprendizaje, incluye diferentes tipos de reactivos y considera distintos niveles cognitivos.'
    },

    // PADRES DE FAMILIA - Nivel 5+
    'parent_homework_helper': {
        id: 'parent_homework_helper',
        name: 'Guía de Apoyo en Tareas',
        description: 'Cómo apoyar a tu hijo sin hacer su tarea',
        level: 5,
        category: 'family',
        xpReward: 20,
        userTypes: ['parent'],
        prompt: 'Eres un consejero familiar especializado en apoyo educativo para padres mexicanos. Proporciona estrategias para apoyar sin resolver la tarea, enfócate en desarrollar autonomía en el estudiante.'
    },

    // ADMINISTRATIVOS - Nivel 20+
    'admin_report_generator': {
        id: 'admin_report_generator',
        name: 'Generador de Reportes',
        description: 'Crea reportes institucionales profesionales',
        level: 20,
        category: 'management',
        xpReward: 50,
        userTypes: ['admin'],
        prompt: 'Eres un consultor educativo especializado en gestión institucional y reportes académicos. Crea reportes profesionales basados en los datos proporcionados, incluye análisis estadístico y recomendaciones.'
    },

    // PROMPTS ESPECIALES DE ALTA RECOMPENSA
    'master_research_assistant': {
        id: 'master_research_assistant',
        name: 'Asistente de Investigación Avanzada',
        description: 'Metodología de investigación académica completa',
        level: 30,
        category: 'research',
        xpReward: 100,
        userTypes: ['student', 'teacher'],
        prompt: 'Eres un investigador académico experto con doctorado en metodología de investigación. Guía al usuario en el proceso completo de investigación académica, proporciona metodologías rigurosas y científicas.'
    }
};