/**
 * 🎓 CONTENIDO PERSONALIZADO BGE - BACHILLERATO GENERAL EDUCATIVO
 * Tips, logros y contenido específico para la institución
 */

class BGECustomContent {
    constructor() {
        this.institutionName = "Bachillerato General Educativo Héroes de la Patria";
        this.bgeSubjects = this.initializeBGESubjects();
        this.bgeEvents = this.initializeBGEEvents();
        this.bgeTips = this.initializeBGETips();
    }

    initializeBGESubjects() {
        return {
            mathematics: {
                name: "Matemáticas",
                icon: "📐",
                tips: [
                    "Los ejercicios de álgebra se resuelven mejor paso a paso",
                    "Usa la calculadora científica para verificar tus cálculos",
                    "Las gráficas te ayudan a visualizar funciones complejas"
                ]
            },
            physics: {
                name: "Física",
                icon: "⚛️",
                tips: [
                    "Siempre identifica las fuerzas antes de resolver",
                    "Las unidades son clave en los problemas de física",
                    "Dibuja diagramas para entender mejor los problemas"
                ]
            },
            chemistry: {
                name: "Química",
                icon: "🧪",
                tips: [
                    "Balancea las ecuaciones químicas paso a paso",
                    "Memoriza la tabla periódica gradualmente",
                    "Practica con reacciones comunes primero"
                ]
            },
            biology: {
                name: "Biología",
                icon: "🧬",
                tips: [
                    "Usa mapas conceptuales para conectar ideas",
                    "Estudia con diagramas del cuerpo humano",
                    "Relaciona la teoría con ejemplos de la vida real"
                ]
            },
            spanish: {
                name: "Español",
                icon: "📚",
                tips: [
                    "Lee en voz alta para mejorar tu comprensión",
                    "Practica la ortografía escribiendo resúmenes",
                    "Analiza textos identificando ideas principales"
                ]
            },
            english: {
                name: "Inglés",
                icon: "🇬🇧",
                tips: [
                    "Practica listening con videos subtitulados",
                    "Usa flashcards para vocabulario nuevo",
                    "Conversa en inglés aunque cometas errores"
                ]
            },
            history: {
                name: "Historia",
                icon: "📜",
                tips: [
                    "Crea líneas de tiempo para eventos importantes",
                    "Conecta eventos pasados con la actualidad",
                    "Usa mapas para ubicar eventos históricos"
                ]
            },
            geography: {
                name: "Geografía",
                icon: "🌍",
                tips: [
                    "Estudia con mapas interactivos online",
                    "Relaciona clima con ubicación geográfica",
                    "Memoriza capitales por regiones"
                ]
            }
        };
    }

    initializeBGEEvents() {
        return {
            monthly: [
                {
                    title: "Festival Cultural BGE",
                    description: "Muestra tu talento en el evento cultural mensual",
                    reward: { coins: 100, xp: 200 }
                },
                {
                    title: "Olimpiada de Matemáticas",
                    description: "Compite en la olimpiada matemática escolar",
                    reward: { coins: 150, xp: 300 }
                }
            ],
            weekly: [
                {
                    title: "Debate Estudiantil",
                    description: "Participa en los debates semanales",
                    reward: { coins: 50, xp: 100 }
                }
            ]
        };
    }

    initializeBGETips() {
        return {
            student: {
                bge_specific: [
                    {
                        icon: '🎓',
                        title: 'Excelencia BGE',
                        tip: 'En BGE valoramos el esfuerzo tanto como los resultados. Tu dedicación cuenta.',
                        action: 'Participa activamente en clase hoy.'
                    },
                    {
                        icon: '🏫',
                        title: 'Comunidad BGE',
                        tip: 'Somos una familia BGE. Ayuda a tus compañeros cuando puedas.',
                        action: 'Forma un grupo de estudio con 2-3 compañeros.'
                    },
                    {
                        icon: '🌟',
                        title: 'Valores BGE',
                        tip: 'Responsabilidad, respeto y solidaridad son nuestros pilares fundamentales.',
                        action: 'Practica uno de estos valores hoy.'
                    },
                    {
                        icon: '📈',
                        title: 'Progreso BGE',
                        tip: 'Tu avance en BGE se mide por tu crecimiento personal, no solo por las calificaciones.',
                        action: 'Reflexiona sobre tu progreso de esta semana.'
                    },
                    {
                        icon: '🎯',
                        title: 'Metas BGE',
                        tip: 'Cada semestre en BGE es una oportunidad para superarte.',
                        action: 'Define una meta específica para este mes.'
                    }
                ],
                exam_prep: [
                    {
                        icon: '📝',
                        title: 'Preparación BGE',
                        tip: 'Los exámenes en BGE evalúan comprensión, no memorización.',
                        action: 'Estudia conceptos, no solo datos.'
                    },
                    {
                        icon: '⏰',
                        title: 'Planificación BGE',
                        tip: 'Distribuye tu tiempo de estudio entre todas las materias BGE.',
                        action: 'Crea un cronograma de estudio semanal.'
                    }
                ]
            },
            teacher: {
                bge_pedagogy: [
                    {
                        icon: '👨‍🏫',
                        title: 'Metodología BGE',
                        tip: 'En BGE promovemos el aprendizaje activo y participativo.',
                        action: 'Incluye una actividad interactiva en tu próxima clase.'
                    },
                    {
                        icon: '📊',
                        title: 'Evaluación BGE',
                        tip: 'Evalúa el proceso de aprendizaje, no solo el resultado final.',
                        action: 'Implementa evaluación formativa en tu materia.'
                    }
                ]
            },
            parent: {
                bge_support: [
                    {
                        icon: '👨‍👩‍👧‍👦',
                        title: 'Apoyo Familiar BGE',
                        tip: 'Tu participación en la educación BGE de tu hijo es fundamental.',
                        action: 'Pregunta específicamente sobre sus materias favoritas.'
                    },
                    {
                        icon: '🏠',
                        title: 'Ambiente BGE',
                        tip: 'Crea un ambiente de estudio que refleje los valores BGE en casa.',
                        action: 'Designa un espacio específico para las tareas BGE.'
                    }
                ]
            }
        };
    }

    getBGETipBySubject(subject) {
        const subjectData = this.bgeSubjects[subject];
        if (!subjectData) return null;

        const tips = subjectData.tips;
        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        return {
            icon: subjectData.icon,
            title: `${subjectData.name} BGE`,
            tip: randomTip,
            action: `Aplica este consejo en tu próxima clase de ${subjectData.name}.`
        };
    }

    getBGEEventReward(eventType) {
        const events = eventType === 'monthly' ? this.bgeEvents.monthly : this.bgeEvents.weekly;
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        return randomEvent;
    }

    getMotivationalBGEQuote() {
        const quotes = [
            "En BGE, tu potencial no tiene límites",
            "Héroes de la Patria, héroes del conocimiento",
            "BGE: Formando líderes del mañana",
            "Tu éxito en BGE inspira a otros",
            "BGE te prepara para conquistar tus sueños"
        ];

        return quotes[Math.floor(Math.random() * quotes.length)];
    }

    integrateWithSmartTips() {
        // Integración con el sistema de tips existente
        if (window.smartTipsSystem) {
            const originalTips = window.smartTipsSystem.tipsDatabase;

            // Agregar tips específicos de BGE
            Object.keys(this.bgeTips).forEach(role => {
                if (originalTips[role]) {
                    Object.keys(this.bgeTips[role]).forEach(category => {
                        if (!originalTips[role][category]) {
                            originalTips[role][category] = [];
                        }
                        originalTips[role][category].push(...this.bgeTips[role][category]);
                    });
                }
            });
        }
    }
}

// Inicializar contenido BGE
document.addEventListener('DOMContentLoaded', function() {
    window.bgeCustomContent = new BGECustomContent();

    // Integrar con sistemas existentes
    setTimeout(() => {
        if (window.bgeCustomContent) {
            window.bgeCustomContent.integrateWithSmartTips();
        }
    }, 1000);
});

// Función global para obtener quote motivacional
function getBGEQuote() {
    if (window.bgeCustomContent) {
        return window.bgeCustomContent.getMotivationalBGEQuote();
    }
    return "BGE: Excelencia en educación";
}