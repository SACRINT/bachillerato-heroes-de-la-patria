/**
 * 💡 SISTEMA DE TIPS INTELIGENTES PERSONALIZADOS
 * Tips adaptativos basados en rol de usuario y comportamiento
 */

class SmartTipsSystem {
    constructor() {
        this.currentUser = null;
        this.tipsDatabase = this.initializeTipsDatabase();
        this.displayInterval = 45000; // 45 segundos entre tips
        this.tipHistory = [];
        this.init();
    }

    init() {
        this.loadUserSession();
        if (this.currentUser) {
            this.startTipsRotation();
        }

        // Escuchar cambios de sesión
        this.setupSessionListener();
    }

    loadUserSession() {
        const savedUser = localStorage.getItem('bge_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
    }

    setupSessionListener() {
        // Escuchar cuando el usuario haga login
        window.addEventListener('storage', (e) => {
            if (e.key === 'bge_user') {
                this.loadUserSession();
                if (this.currentUser) {
                    this.startTipsRotation();
                }
            }
        });
    }

    initializeTipsDatabase() {
        return {
            student: {
                academic: [
                    {
                        icon: '🧠',
                        title: 'Neurociencia del Aprendizaje BGE',
                        tip: 'Tu cerebro retiene 40% más información si estudias en sesiones de 25 minutos con descansos de 5 minutos. ¡Perfectecto para las materias de BGE!',
                        action: 'Usa la técnica Pomodoro en tu próxima sesión de Matemáticas o Física.'
                    },
                    {
                        icon: '⏰',
                        title: 'Timing Óptimo',
                        tip: 'Las matemáticas se aprenden mejor entre 10-12 AM cuando tu corteza prefrontal está más activa.',
                        action: 'Programa tus materias más difíciles en las mañanas.'
                    },
                    {
                        icon: '🎵',
                        title: 'Música y Concentración',
                        tip: 'Música instrumental a 60-70 BPM mejora tu concentración en un 13%.',
                        action: 'Prueba playlists de "focus music" en Spotify.'
                    },
                    {
                        icon: '🔄',
                        title: 'Repaso Espaciado',
                        tip: 'Revisar apuntes después de 1 día, 3 días y 7 días aumenta retención al 90%.',
                        action: 'Programa recordatorios para repasar tus apuntes de hoy.'
                    },
                    {
                        icon: '💡',
                        title: 'Método Feynman',
                        tip: 'Si puedes explicar un concepto con palabras simples, realmente lo entiendes.',
                        action: 'Explica tu última lección a un amigo o familiar.'
                    }
                ],
                lifestyle: [
                    {
                        icon: '💧',
                        title: 'Hidratación Cerebral',
                        tip: 'Tu cerebro necesita 2% más agua que el resto del cuerpo. Deshidratación = -12% rendimiento.',
                        action: 'Toma un vaso de agua ahora mismo.'
                    },
                    {
                        icon: '😴',
                        title: 'Sueño y Memoria',
                        tip: 'Durante el sueño REM, tu cerebro consolida lo aprendido. 7-9 horas son esenciales.',
                        action: 'Establece una hora fija para dormir.'
                    },
                    {
                        icon: '🏃‍♂️',
                        title: 'Ejercicio = Inteligencia',
                        tip: '20 minutos de ejercicio aumentan tu capacidad de aprendizaje por 2-3 horas.',
                        action: 'Camina 10 minutos antes de tu próxima clase.'
                    }
                ],
                motivation: [
                    {
                        icon: '🎯',
                        title: 'Metas SMART',
                        tip: 'Metas específicas aumentan probabilidad de éxito en 42%.',
                        action: 'Define una meta específica para esta semana.'
                    },
                    {
                        icon: '🏆',
                        title: 'Recompensas Inmediatas',
                        tip: 'Tu cerebro necesita dopamina para mantener motivación. Prémiate por logros pequeños.',
                        action: 'Date una recompensa por completar tu tarea de hoy.'
                    }
                ]
            },

            teacher: {
                pedagogy: [
                    {
                        icon: '👥',
                        title: 'Tamaño Óptimo de Grupo',
                        tip: 'Grupos de 4 estudiantes optimizan aprendizaje colaborativo y participación individual.',
                        action: 'Organiza tu próxima actividad grupal en equipos de 4.'
                    },
                    {
                        icon: '⏱️',
                        title: 'Atención Sostenida',
                        tip: 'La atención de estudiantes de bachillerato dura máximo 15-20 minutos consecutivos.',
                        action: 'Cambia de actividad cada 15 minutos en tu próxima clase.'
                    },
                    {
                        icon: '🎨',
                        title: 'Estilos de Aprendizaje',
                        tip: '65% son visuales, 30% auditivos, 5% kinestésicos. Incorpora los 3 en cada lección.',
                        action: 'Agrega un elemento visual a tu próxima explicación.'
                    },
                    {
                        icon: '❓',
                        title: 'Técnica Socrática',
                        tip: 'Hacer preguntas aumenta retención 40% vs. solo explicar.',
                        action: 'Prepara 3 preguntas clave para tu próximo tema.'
                    }
                ],
                technology: [
                    {
                        icon: '📱',
                        title: 'Tecnología Efectiva',
                        tip: 'Herramientas digitales mejoran engagement solo si tienen propósito pedagógico claro.',
                        action: 'Define el objetivo pedagógico antes de usar tecnología.'
                    },
                    {
                        icon: '🎮',
                        title: 'Gamificación',
                        tip: 'Elementos de juego aumentan motivación 89% cuando se usan correctamente.',
                        action: 'Agrega un elemento de competencia sana a tu clase.'
                    }
                ],
                wellbeing: [
                    {
                        icon: '🧘',
                        title: 'Mindfulness Docente',
                        tip: '5 minutos de meditación antes de clase mejoran tu paciencia y claridad mental.',
                        action: 'Respira profundo 5 veces antes de entrar al aula.'
                    }
                ]
            },

            parent: {
                support: [
                    {
                        icon: '💬',
                        title: 'Comunicación Efectiva',
                        tip: 'Preguntar "¿Qué fue lo más interesante hoy?" genera 3x más conversación que "¿Cómo te fue?"',
                        action: 'Cambia tu pregunta diaria por algo más específico.'
                    },
                    {
                        icon: '🏠',
                        title: 'Ambiente de Estudio',
                        tip: 'Un espacio dedicado al estudio mejora concentración 25% vs. estudiar en cualquier lugar.',
                        action: 'Ayuda a tu hijo a organizar su espacio de estudio.'
                    },
                    {
                        icon: '📵',
                        title: 'Tecnología Balanceada',
                        tip: 'Dispositivos fuera del alcance durante estudio mejoran rendimiento 23%.',
                        action: 'Establece una "zona libre de teléfonos" para estudiar.'
                    },
                    {
                        icon: '⏰',
                        title: 'Rutinas Consistentes',
                        tip: 'Rutinas de estudio consistentes crean hábitos automáticos en 21-66 días.',
                        action: 'Ayuda a establecer horarios fijos de estudio.'
                    }
                ],
                motivation: [
                    {
                        icon: '🎉',
                        title: 'Celebrar Proceso',
                        tip: 'Reconocer esfuerzo (no solo resultados) desarrolla mentalidad de crecimiento.',
                        action: 'Felicita a tu hijo por intentar algo difícil, independientemente del resultado.'
                    },
                    {
                        icon: '🎯',
                        title: 'Metas Familiares',
                        tip: 'Metas educativas familiares aumentan motivación estudiantil 34%.',
                        action: 'Define una meta educativa familiar para este mes.'
                    }
                ]
            },

            admin: {
                leadership: [
                    {
                        icon: '📊',
                        title: 'Decisiones Basadas en Datos',
                        tip: 'Instituciones que usan datos para decisiones mejoran resultados 19% anualmente.',
                        action: 'Solicita métricas específicas antes de tu próxima decisión importante.'
                    },
                    {
                        icon: '🤝',
                        title: 'Comunicación Institucional',
                        tip: 'Comunicados de 150 palabras tienen 89% más engagement que largos.',
                        action: 'Mantén tu próximo comunicado bajo 150 palabras.'
                    },
                    {
                        icon: '⏰',
                        title: 'Timing de Reuniones',
                        tip: 'Reuniones los martes 10-11 AM tienen mejor recepción y productividad.',
                        action: 'Programa decisiones importantes para martes por la mañana.'
                    }
                ],
                innovation: [
                    {
                        icon: '🚀',
                        title: 'Adopción de Tecnología',
                        tip: 'Implementar nuevas tecnologías requiere 6 meses de capacitación para adopción completa.',
                        action: 'Planifica capacitación continua para nuevas herramientas.'
                    }
                ]
            }
        };
    }

    startTipsRotation() {
        if (!this.currentUser) return;

        // Mostrar primer tip inmediatamente
        setTimeout(() => {
            this.showRandomTip();
        }, 3000);

        // Rotar tips cada 45 segundos
        setInterval(() => {
            this.showRandomTip();
        }, this.displayInterval);
    }

    showRandomTip() {
        if (!this.currentUser) return;

        const userRole = this.currentUser.role || 'student';
        const rolesTips = this.tipsDatabase[userRole];

        if (!rolesTips) return;

        // Obtener todas las categorías del rol
        const categories = Object.keys(rolesTips);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryTips = rolesTips[randomCategory];

        // Evitar repetir tips recientes
        const availableTips = categoryTips.filter(tip =>
            !this.tipHistory.includes(tip.title)
        );

        if (availableTips.length === 0) {
            // Si se agotaron los tips, reiniciar historial
            this.tipHistory = [];
            return this.showRandomTip();
        }

        const randomTip = availableTips[Math.floor(Math.random() * availableTips.length)];

        this.displayTip(randomTip);
        this.tipHistory.push(randomTip.title);

        // Mantener solo últimos 10 tips en historial
        if (this.tipHistory.length > 10) {
            this.tipHistory = this.tipHistory.slice(-10);
        }
    }

    displayTip(tip) {
        // Crear container de tip si no existe
        let tipContainer = document.getElementById('smartTipContainer');

        if (!tipContainer) {
            tipContainer = document.createElement('div');
            tipContainer.id = 'smartTipContainer';
            tipContainer.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                max-width: 350px;
                z-index: 1050;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                transform: translateY(100px);
                opacity: 0;
                transition: all 0.5s ease;
                cursor: pointer;
            `;

            document.body.appendChild(tipContainer);
        }

        // Contenido del tip
        tipContainer.innerHTML = `
            <div class="d-flex align-items-start">
                <div class="me-3" style="font-size: 1.5rem;">${tip.icon}</div>
                <div class="flex-grow-1">
                    <h6 class="mb-1 fw-bold">${tip.title}</h6>
                    <p class="mb-2 small" style="line-height: 1.3;">${tip.tip}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <small style="opacity: 0.8;">💡 ${tip.action}</small>
                        <button class="btn btn-sm btn-light ms-2" onclick="smartTipsSystem.closeTip()" style="opacity: 0.9;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Mostrar con animación
        setTimeout(() => {
            tipContainer.style.transform = 'translateY(0)';
            tipContainer.style.opacity = '1';
        }, 100);

        // Auto ocultar después de 15 segundos
        setTimeout(() => {
            this.closeTip();
        }, 15000);

        // Cerrar al hacer click
        tipContainer.onclick = () => this.closeTip();
    }

    closeTip() {
        const tipContainer = document.getElementById('smartTipContainer');
        if (tipContainer) {
            tipContainer.style.transform = 'translateY(100px)';
            tipContainer.style.opacity = '0';

            setTimeout(() => {
                if (tipContainer.parentNode) {
                    tipContainer.remove();
                }
            }, 500);
        }
    }

    // Método para obtener tips específicos por categoría
    getTipsByCategory(category) {
        if (!this.currentUser) return [];

        const userRole = this.currentUser.role || 'student';
        const rolesTips = this.tipsDatabase[userRole];

        if (!rolesTips || !rolesTips[category]) return [];

        return rolesTips[category];
    }

    // Método para obtener tip específico para una situación
    getContextualTip(context) {
        const contextMap = {
            'studying': 'academic',
            'teaching': 'pedagogy',
            'break_time': 'lifestyle',
            'motivation_low': 'motivation',
            'before_exam': 'academic'
        };

        const category = contextMap[context] || 'academic';
        const tips = this.getTipsByCategory(category);

        if (tips.length === 0) return null;

        return tips[Math.floor(Math.random() * tips.length)];
    }
}

// Inicializar sistema globalmente
document.addEventListener('DOMContentLoaded', function() {
    window.smartTipsSystem = new SmartTipsSystem();
});

// Función global para cerrar tips
function closeSmartTip() {
    if (window.smartTipsSystem) {
        window.smartTipsSystem.closeTip();
    }
}