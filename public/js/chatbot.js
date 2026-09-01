/**
 * 🤖 CHATBOT INTELIGENTE DE CLASE MUNDIAL 🌟
 * Bachillerato General Estatal "Héroes de la Patria"
 * Sistema avanzado de respuestas con IA, formato profesional e integración con base de datos
 * Versión 2.0 - Integración con Backend API
 */

if (typeof window.BGE_CHATBOT_LOADED === 'undefined') {
    window.BGE_CHATBOT_LOADED = true;

    // 🔧 Configuración de API Backend
    const API_CONFIG = {
        // Auto-detectar baseURL según el entorno
        get baseUrl() {
            const hostname = window.location.hostname;
            // Producción: Vercel o cualquier dominio remoto
            if (hostname.includes('vercel.app') ||
                (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
                return `${window.location.protocol}//${window.location.host}/api`;
            }
            // Desarrollo: localhost
            return '/api';
        },
        endpoints: {
            search: '/ai/chatbot/search', // Actualizado a nueva ruta
            message: '/ai/chatbot/message', // Actualizado a nueva ruta
            analytics: '/ai/chatbot/analytics/daily',
            aiChat: '/ai-gateway/v1/process' // MIGRACIÓN: Ahora usa el Orquestador
        },
        timeout: 20000 // Aumentar timeout para LLM (20s)
    };

    // 📱 Generador único de sesión
    const CHAT_SESSION = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: Date.now(),
        messageCount: 0
    };

    // Verificar si ya está cargado para evitar declaraciones duplicadas
    if (typeof KNOWLEDGE_DATABASE !== 'undefined') {
        void 0;
    } else {

        // 📚 BASE DE CONOCIMIENTO EXPANDIDA Y COMPLETA
        const KNOWLEDGE_DATABASE = {
            // === INFORMACIÓN BÁSICA ===
            'horarios': {
                keywords: ['horario', 'hora', 'tiempo', 'cuando', 'abre', 'cierra', 'atencion', 'clases', 'entrada', 'salida', 'schedule'],
                response: {
                    title: '🕐 Horarios Institucionales',
                    content: [
                        {
                            subtitle: '🏫 Apertura de Escuela',
                            text: 'La institución <strong>abre sus puertas a las 8:00 AM</strong> para estudiantes y público en general.'
                        },
                        {
                            subtitle: '📚 Horario Escolar (Único)',
                            text: 'Lunes a Viernes de 8:00 AM a 1:30 PM (Turno Matutino solamente).'
                        },
                        {
                            subtitle: '🏢 Atención Administrativa',
                            text: 'Lunes a Viernes de 8:00 AM a 1:30 PM para trámites, constancias e inscripciones.'
                        },
                        {
                            subtitle: '📅 Calendario',
                            text: 'Sábados, domingos y días festivos oficiales: Cerrado.'
                        }
                    ],
                    footer: `CCT: ${window.getTenantValue ? window.getTenantValue('cct', '21EBHXXXXX') : '21EBHXXXXX'} | Horario de atención presencial: 08:00 - 13:30 hrs.`
                }
            },

            'ubicacion': {
                keywords: ['ubicacion', 'direccion', 'donde', 'lugar', 'ubicado', 'como llegar', 'domicilio', 'mapa', 'address', 'location'],
                response: {
                    title: '📍 Nuestra Ubicación',
                    content: [
                        {
                            subtitle: '🏠 Dirección Completa',
                            text: window.getTenantValue ? window.getTenantValue('direccion', 'Dirección del plantel, Puebla') : 'Dirección del plantel, Puebla'
                        },
                        {
                            subtitle: '🗺️ Cómo llegar',
                            text: 'Encuentra nuestro mapa interactivo en la sección de contacto de nuestra página web.'
                        },
                        {
                            subtitle: '🚌 Transporte',
                            text: 'Accesible por transporte público.'
                        }
                    ],
                    footer: '¿Necesitas direcciones específicas? ¡Contáctanos!'
                }
            },

            'contacto': {
                keywords: ['telefono', 'contacto', 'comunicar', 'llamar', 'correo', 'email', 'escribir', 'facebook', 'redes'],
                response: {
                    title: '📞 Información de Contacto',
                    content: [
                        {
                            subtitle: '📧 Email Oficial',
                            text: window.getTenantValue ? window.getTenantValue('email_institucional', 'contacto@ejemplo.edu.mx') : 'contacto@ejemplo.edu.mx'
                        },
                        {
                            subtitle: '📱 Redes Sociales',
                            text: 'Consulta nuestras redes sociales oficiales en la parte inferior de la página.'
                        },
                        {
                            subtitle: '🕐 Horario de Respuesta',
                            text: 'Lunes a Viernes: 8:00 AM - 1:30 PM'
                        },
                        {
                            subtitle: '💬 Otras Opciones',
                            text: 'También puedes usar nuestros formularios de contacto en línea o visitarnos personalmente.'
                        }
                    ],
                    footer: 'Estamos aquí para apoyarte en tu proceso educativo.'
                }
            },

            // === ADMISIONES E INSCRIPCIONES ===
            'admisiones': {
                keywords: ['admision', 'inscripcion', 'matricula', 'registro', 'ingreso', 'inscribir', 'cuando', 'proceso', 'requisitos', 'papeles', 'costo', 'nuevo ingreso'],
                response: {
                    title: '📝 Proceso Completo de Inscripción',
                    content: [
                        {
                            subtitle: '📅 Período Oficial',
                            text: 'El período principal es en <strong>Agosto</strong>, pero puedes solicitar información durante todo el año escolar de 8:00 AM a 1:30 PM.'
                        },
                        {
                            subtitle: '📋 Requisitos de Documentación (Original y 2 copias)',
                            text: '• <strong>Certificado de Secundaria</strong> (Original y legalizado)<br>• <strong>Acta de Nacimiento</strong> (Reciente y legible)<br>• <strong>CURP</strong> (Formato actualizado con QR)<br>• <strong>NIA</strong> (Número de Identificación de Alumno)<br>• <strong>6 Fotografías</strong> (Infantil, B/N, papel mate, fondo blanco)<br>• <strong>Comprobante de Domicilio</strong> (Luz o teléfono)'
                        },
                        {
                            subtitle: '💰 Costos y Beneficios',
                            text: 'Somos una institución pública. Los costos de recuperación son mínimos y <strong>todos los estudiantes reciben la Beca Benito Juárez</strong> automáticamente al estar inscritos.'
                        },
                        {
                            subtitle: '🎯 Sin Examen de Admisión',
                            text: 'En el BGE "Héroes de la Patria" creemos en la oportunidad para todos. No aplicamos examen de selección; tu ingreso es directo con documentación completa.'
                        }
                    ],
                    footer: 'Visítanos en C. Manuel Ávila Camacho #7 para iniciar tu trámite.'
                }
            },

            'requisitos': {
                keywords: ['requisito', 'documento', 'necesito', 'papeles', 'tramite', 'inscripcion', 'documentacion'],
                response: {
                    title: '📋 Requisitos de Inscripción',
                    content: [
                        {
                            subtitle: '✅ Documentos Obligatorios',
                            text: '• Certificado de Secundaria (original)<br>• Acta de Nacimiento (original)<br>• CURP actualizada<br>• 6 fotografías tamaño infantil<br>• Comprobante de domicilio reciente'
                        },
                        {
                            subtitle: '📄 Documentos Adicionales (según caso)',
                            text: '• <strong>Cambios del mismo subsistema:</strong> Kardex<br>• <strong>Otros subsistemas:</strong> Certificado parcial + equivalencia SEP<br>• <strong>De otro estado:</strong> Legalización de documentos'
                        },
                        {
                            subtitle: '💡 Tips Importantes',
                            text: 'Asegúrate de que todos los documentos estén en buen estado y sean legibles.'
                        }
                    ],
                    footer: 'Para dudas específicas sobre tu situación, visítanos en Control Escolar.'
                }
            },

            // === OFERTA EDUCATIVA COMPLETA ===
            'carreras': {
                keywords: ['carrera', 'especialidad', 'programa', 'estudios', 'capacitacion', 'formacion', 'que ofrecen', 'opciones', 'laborales'],
                response: {
                    title: '🎓 Nuestra Oferta Educativa',
                    content: [
                        {
                            subtitle: '🏫 Bachillerato General',
                            text: 'Formación académica completa que te prepara para la universidad y el mundo laboral.'
                        },
                        {
                            subtitle: '🎨 Comunicación Gráfica',
                            text: '• Diseño gráfico y digital<br>• Fotografía y medios audiovisuales<br>• Sublimado y vectorización<br>• Composición, color y tipografía<br>• Herramientas profesionales Adobe'
                        },
                        {
                            subtitle: '🍳 Preparación de Alimentos Artesanales',
                            text: '• Cocina tradicional mexicana<br>• Higiene y seguridad alimentaria<br>• Conservas y fermentados<br>• Panadería y repostería<br>• Emprendimiento gastronómico'
                        },
                        {
                            subtitle: '🔧 Instalaciones Residenciales',
                            text: '• Electricidad básica y avanzada<br>• Plomería e instalaciones hidráulicas<br>• Instalaciones sanitarias<br>• Mantenimiento del hogar<br>• Proyectos sustentables'
                        }
                    ],
                    footer: 'Todas nuestras especialidades incluyen prácticas profesionales reales.'
                }
            },

            'plan_estudios': {
                keywords: ['plan', 'materias', 'asignaturas', 'curriculum', 'semestres', 'que estudian', 'malla curricular'],
                response: {
                    title: '📚 Plan de Estudios - 6 Semestres',
                    content: [
                        {
                            subtitle: '🎯 Currículum Fundamental (1° - 6° semestre)',
                            text: '• <strong>Lengua y Comunicación:</strong> Lectura, escritura y expresión oral<br>• <strong>Pensamiento Matemático:</strong> Álgebra, geometría, cálculo<br>• <strong>Conciencia Histórica:</strong> Historia de México y universal<br>• <strong>Cultura Digital:</strong> Tecnologías e informática<br>• <strong>Ciencias Naturales:</strong> Física, química, biología<br>• <strong>Ciencias Sociales:</strong> Geografía, sociología<br>• <strong>Humanidades:</strong> Filosofía, ética, estética'
                        },
                        {
                            subtitle: '🔧 Currículum Laboral (3° - 6° semestre)',
                            text: '• Especialización en el área elegida<br>• Prácticas profesionales supervisadas<br>• Desarrollo de proyectos CTIM<br>• Vinculación con el sector productivo'
                        },
                        {
                            subtitle: '🌟 Currículum Ampliado',
                            text: '• Responsabilidad Social y Ciudadana<br>• Educación para la Salud<br>• Actividades Artísticas y Culturales<br>• Educación Física y Deportiva'
                        }
                    ],
                    footer: 'Nuestro plan de estudios está actualizado según los lineamientos de la SEP 2023.'
                }
            },

            // === SERVICIOS DIGITALES Y PLATAFORMAS ===
            'plataformas': {
                keywords: ['plataforma', 'sicep', 'sistema', 'digital', 'online', 'portal', 'estudiantes', 'padres'],
                response: {
                    title: '💻 Nuestras Plataformas Digitales',
                    content: [
                        {
                            subtitle: '🎓 Portal Estudiantes',
                            text: 'Acceso a calificaciones, horarios, avisos y recursos académicos.'
                        },
                        {
                            subtitle: '👨‍👩‍👧‍👦 Portal Padres',
                            text: 'Seguimiento del progreso académico y comunicación directa con la institución.'
                        },
                        {
                            subtitle: '📱 App Estudiantil',
                            text: 'Aplicación móvil para consultas rápidas y notificaciones importantes.'
                        },
                        {
                            subtitle: '💳 Sistema de Pagos',
                            text: 'Aunque la educación es gratuita, para trámites especiales y materiales.'
                        },
                        {
                            subtitle: '🤖 Asistente Virtual',
                            text: '¡Soy yo! Tu chatbot inteligente disponible 24/7.'
                        }
                    ],
                    footer: 'La tecnología al servicio de tu educación.'
                }
            },

            'boleta': {
                keywords: ['boleta', 'calificaciones', 'sicep', 'notas', 'como descargar', 'consultar notas'],
                response: {
                    title: '📊 Consultar Boleta de Calificaciones',
                    content: [
                        {
                            subtitle: '🔗 Portal SICEP',
                            text: 'Ingresa a: <a href="http://sisep.seppue.gob.mx/sicepconsulta/" target="_blank">sisep.seppue.gob.mx/sicepconsulta/</a>'
                        },
                        {
                            subtitle: '📝 Datos Necesarios',
                            text: '• Tu CURP (18 caracteres)<br>• NIA (Número de Identificación del Alumno)<br>• Si no recuerdas tu NIA, pregunta en Control Escolar'
                        },
                        {
                            subtitle: '❓ Problemas de Acceso',
                            text: 'Si tienes dificultades para ingresar al sistema, solicita ayuda en Control Escolar del plantel.'
                        },
                        {
                            subtitle: '📧 Soporte Técnico',
                            text: 'Email: 21ebh0200x.sep@gmail.com'
                        }
                    ],
                    footer: 'Tu información académica está protegida y es confidencial.'
                }
            },

            // === BECAS Y COSTOS ===
            'becas': {
                keywords: ['beca', 'apoyo', 'descuento', 'ayuda', 'economico', 'benito juarez', 'beca universal'],
                response: {
                    title: '🏆 Becas y Apoyos Disponibles',
                    content: [
                        {
                            subtitle: '💰 Beca Universal Benito Juárez',
                            text: '<strong>¡AUTOMÁTICA para TODOS!</strong><br>• Se asigna automáticamente al inscribirte<br>• Depósitos bimestrales directos<br>• Sin trámite adicional requerido<br>• Consultas: <a href="https://gob.mx/becasbenitojuarez" target="_blank">gob.mx/becasbenitojuarez</a>'
                        },
                        {
                            subtitle: '🎯 Becas Institucionales',
                            text: '• Para estudiantes de excelencia académica<br>• Apoyo para estudiantes en situación vulnerable<br>• Reconocimientos por participación destacada<br>• Consulta disponibilidad en Control Escolar'
                        },
                        {
                            subtitle: '📚 Programas de Apoyo',
                            text: '• Asesorías académicas gratuitas<br>• Talleres de regularización<br>• Apoyo psicopedagógico<br>• Orientación vocacional'
                        }
                    ],
                    footer: 'La educación de calidad debe ser accesible para todos.'
                }
            },

            'costos': {
                keywords: ['costo', 'precio', 'cuanto', 'pagar', 'mensualidad', 'cuota', 'gratis', 'gratuito', 'dinero'],
                response: {
                    title: '💰 Información de Costos',
                    content: [
                        {
                            subtitle: '🎉 Educación GRATUITA',
                            text: '<strong>¡La educación pública es 100% GRATUITA!</strong><br>No pagas colegiaturas ni mensualidades.'
                        },
                        {
                            subtitle: '📝 Gastos Mínimos',
                            text: '• Materiales escolares básicos (cuadernos, lápices)<br>• Uniforme escolar (sencillo y económico)<br>• Gastos menores de laboratorio y talleres<br>• Materiales específicos para tu especialidad'
                        },
                        {
                            subtitle: '💡 Beneficio Extra',
                            text: 'Recibes la Beca Benito Juárez automáticamente, que te ayuda con gastos personales.'
                        },
                        {
                            subtitle: '📞 Información Detallada',
                            text: 'Para costos específicos de materiales por especialidad, contacta Control Escolar.'
                        }
                    ],
                    footer: 'Educación pública de calidad sin barreras económicas.'
                }
            },

            // === PERSONAL Y ORGANIZACIÓN ===
            'director': {
                keywords: ['director', 'samuel', 'cruz', 'responsable', 'quien', 'quienes', 'quien dirige', 'lider', 'autoridad'],
                response: {
                    title: '👨‍💼 Nuestro Director',
                    content: [
                        {
                            subtitle: '🎯 Ing. Samuel Cruz Interial',
                            text: '<strong>Director General</strong><br>• Más de 23 años de experiencia en educación<br>• 7 años en liderazgo educativo<br>• Ingeniero en Electrónica y Comunicaciones<br>• Especialista en gestión educativa'
                        },
                        {
                            subtitle: '📧 Contacto Directo',
                            text: '21ebh0200x.sep@gmail.com'
                        },
                        {
                            subtitle: '💭 Filosofía Educativa',
                            text: '<em>"Formando líderes con propósito y preparando estudiantes integrales para los desafíos del siglo XXI"</em>'
                        },
                        {
                            subtitle: '🎯 Visión de Liderazgo',
                            text: 'Comprometido con la excelencia educativa y el desarrollo integral de cada estudiante.'
                        }
                    ],
                    footer: 'Un líder educativo comprometido con tu formación integral.'
                }
            },

            'docentes': {
                keywords: ['maestro', 'profesor', 'docente', 'personal', 'quien enseña', 'staff', 'profesores', 'plantilla'],
                response: {
                    title: '👩‍🏫 Nuestro Equipo Docente',
                    content: [
                        {
                            subtitle: '🌟 Profesores Destacados',
                            text: '• <strong>Lic. Humberta Flores Martínez</strong><br>&nbsp;&nbsp;Pedagogía - UV, 27 años de experiencia<br><br>• <strong>Ing. José Alain Rosales García</strong><br>&nbsp;&nbsp;Químico - UV, 16 años de experiencia<br><br>• <strong>Lic. Roselia Estrada Lechuga</strong><br>&nbsp;&nbsp;Pedagogía - ICEST, 22 años de experiencia<br><br>• <strong>Ing. Tulia Villadiego Blanco</strong><br>&nbsp;&nbsp;Sistemas - UANL, 25 años de experiencia'
                        },
                        {
                            subtitle: '📊 Estadísticas del Equipo',
                            text: '• <strong>Total:</strong> 12 docentes especializados<br>• <strong>Experiencia promedio:</strong> 23+ años<br>• <strong>Formación:</strong> Universitaria con especialización<br>• <strong>Actualización:</strong> Constante capacitación SEP'
                        },
                        {
                            subtitle: '🎯 Especialidades',
                            text: 'Nuestros docentes cubren todas las áreas del currículum y las especialidades laborales con experiencia profesional.'
                        }
                    ],
                    footer: 'Un equipo comprometido con tu éxito académico y personal.'
                }
            },

            // === HISTORIA Y FILOSOFÍA INSTITUCIONAL ===
            'historia': {
                keywords: ['historia', 'fundacion', 'origen', 'cuando se fundo', 'inicio', 'antecedentes'],
                response: {
                    title: '📜 Nuestra Historia Institucional',
                    content: [
                        {
                            subtitle: '🗓️ Fundación (1996-1997)',
                            text: 'Nuestro bachillerato fue fundado por un grupo visionario de maestros del Bachillerato "Juan Rulfo" que soñaban con crear una institución pública oficial de calidad.'
                        },
                        {
                            subtitle: '👥 Fundadores Pioneros',
                            text: '• <strong>Profesora Hercilia Aburto Nadales</strong><br>• <strong>Profesor Toribio Bautista Hernández</strong><br>• <strong>Profesor Hidelgardo Montiel Aparicio</strong><br>• <strong>Profesor Moisés Flores Vásquez</strong>'
                        },
                        {
                            subtitle: '🎓 Primera Generación (1997)',
                            text: 'Iniciamos con 70 estudiantes valientes que confiaron en este nuevo proyecto educativo.'
                        },
                        {
                            subtitle: '🌍 Impacto Regional',
                            text: 'Servimos principalmente a la comunidad de María Andrea y comunidades circunvecinas, democratizando el acceso a la educación media superior.'
                        }
                    ],
                    footer: '28 años formando generaciones de estudiantes exitosos.'
                }
            },

            'mision': {
                keywords: ['mision', 'objetivo', 'proposito', 'para que', 'que hacemos'],
                response: {
                    title: '🎯 Nuestra Misión Institucional',
                    content: [
                        {
                            subtitle: '🌟 Declaración de Misión',
                            text: '<em>"Somos una institución educativa de nivel medio superior formadora de estudiantes integrales, analíticos, reflexivos y críticos con los conocimientos, habilidades y valores necesarios para poderse integrar al sector productivo o continuar sus estudios a nivel superior."</em>'
                        },
                        {
                            subtitle: '🎓 Enfoque Educativo',
                            text: '• <strong>Formación integral:</strong> Desarrollo académico, personal y social<br>• <strong>Pensamiento crítico:</strong> Capacidad de análisis y reflexión<br>• <strong>Competencias laborales:</strong> Preparación para el trabajo<br>• <strong>Preparación universitaria:</strong> Base sólida para educación superior'
                        },
                        {
                            subtitle: '💪 Compromiso Social',
                            text: 'Formar ciudadanos responsables, éticos y comprometidos con el desarrollo de su comunidad.'
                        }
                    ],
                    footer: 'Cada día trabajamos para cumplir nuestra misión contigo.'
                }
            },

            'vision': {
                keywords: ['vision', 'futuro', 'hacia donde', 'meta', 'aspiracion'],
                response: {
                    title: '🌟 Nuestra Visión 2030',
                    content: [
                        {
                            subtitle: '🚀 Declaración de Visión',
                            text: '<em>"Ser una institución educativa de excelencia que logre la formación de seres humanos integrales con valores y aprendizajes significativos contextualizados que permitan contribuir al desarrollo regional, estatal y nacional de nuestro país."</em>'
                        },
                        {
                            subtitle: '🏆 Aspiraciones',
                            text: '• <strong>Excelencia educativa:</strong> Reconocimiento como institución líder<br>• <strong>Impacto social:</strong> Graduados que transformen su entorno<br>• <strong>Innovación pedagógica:</strong> Metodologías de vanguardia<br>• <strong>Desarrollo integral:</strong> Estudiantes competentes y éticos'
                        },
                        {
                            subtitle: '🌍 Alcance de Impacto',
                            text: 'Contribuir al desarrollo sostenible desde lo local hasta lo nacional, formando ciudadanos del siglo XXI.'
                        }
                    ],
                    footer: 'Construyendo juntos el futuro de la educación en nuestra región.'
                }
            },

            'valores': {
                keywords: ['valores', 'principios', 'que promueven', 'filosofia', 'etica'],
                response: {
                    title: '⭐ Nuestros Valores Fundamentales',
                    content: [
                        {
                            subtitle: '💪 Compromiso',
                            text: 'Dedicación absoluta con la educación de calidad y el éxito de nuestros estudiantes.'
                        },
                        {
                            subtitle: '🤝 Respeto',
                            text: 'Valoración y reconocimiento de la diversidad, dignidad y derechos de todas las personas.'
                        },
                        {
                            subtitle: '⚖️ Responsabilidad',
                            text: 'Asumir las consecuencias de nuestras acciones y cumplir con nuestros deberes.'
                        },
                        {
                            subtitle: '💎 Honestidad',
                            text: 'Transparencia y sinceridad en todas nuestras relaciones y procesos.'
                        },
                        {
                            subtitle: '🛡️ Lealtad',
                            text: 'Fidelidad y compromiso con nuestra comunidad educativa y sus principios.'
                        },
                        {
                            subtitle: '🤗 Confianza',
                            text: 'Base sólida para todas nuestras interacciones y relaciones institucionales.'
                        }
                    ],
                    footer: 'Estos valores guían cada una de nuestras acciones y decisiones.'
                }
            },

            // === SERVICIOS Y ACTIVIDADES ===
            'talleres': {
                keywords: ['taller', 'extracurricular', 'actividades', 'que hay', 'deportes', 'arte', 'clubes'],
                response: {
                    title: '🎭 Actividades Extracurriculares',
                    content: [
                        {
                            subtitle: '🎨 Arte y Cultura',
                            text: '• <strong>Ballet Folklórico:</strong> Danza tradicional mexicana<br>• <strong>Danza Contemporánea:</strong> Expresión artística moderna<br>• <strong>Banda de Guerra:</strong> Marchas y ceremonias cívicas<br>• <strong>Bastoneras:</strong> Coreografías con bastones<br>• <strong>Artes Plásticas:</strong> Pintura, dibujo y escultura'
                        },
                        {
                            subtitle: '⚽ Deportes',
                            text: '• <strong>Fútbol:</strong> Equipos varonil y femenil<br>• <strong>Básquetbol:</strong> Torneos internos y externos<br>• <strong>Voleibol:</strong> Competencias regionales'
                        },
                        {
                            subtitle: '🤖 Clubes Académicos',
                            text: '• <strong>Robótica:</strong> Programación y construcción de robots<br>• <strong>Debate:</strong> Oratoria y argumentación<br>• <strong>Ciencia:</strong> Experimentos e investigación'
                        },
                        {
                            subtitle: '🏆 Participaciones',
                            text: '• Ferias académicas estatales y regionales<br>• Concursos de ciencia y tecnología<br>• Proyectos CTIM (Ciencia, Tecnología, Ingeniería, Matemáticas)<br>• Programa de Escuelas de Calidad (PEC)'
                        }
                    ],
                    footer: '¡Desarrolla todo tu potencial más allá del aula!'
                }
            },

            'uniforme': {
                keywords: ['uniforme', 'ropa', 'vestimenta', 'como vestirse', 'vestido'],
                response: {
                    title: '👔 Uniforme Escolar',
                    content: [
                        {
                            subtitle: '👨 Uniforme Masculino',
                            text: '<strong>🏃 Deportivo:</strong><br>• Playera blanca con logo institucional<br>• Pantalón azul mezclilla<br>• Tenis blancos o negros<br><br><strong>👔 Gala:</strong><br>• Camisa blanca con logo institucional<br>• Pantalón gris Oxford<br>• Zapatos negros formales'
                        },
                        {
                            subtitle: '👩 Uniforme Femenino',
                            text: '<strong>🏃 Deportivo:</strong><br>• Playera blanca con logo institucional<br>• Pantalón azul mezclilla<br>• Tenis blancos o negros<br><br><strong>👗 Gala:</strong><br>• Blusa blanca con logo institucional<br>• Falda gris Oxford<br>• Zapatos negros formales'
                        },
                        {
                            subtitle: '💡 Información Práctica',
                            text: 'El uniforme puede mandarse hacer en cualquier lugar o confeccionarse en casa. Solo debe cumplir con las especificaciones de color y llevar el logo institucional.'
                        }
                    ],
                    footer: 'Un uniforme digno que refleja nuestro orgullo institucional.'
                }
            },

            // === INFORMACIÓN ACADÉMICA AVANZADA ===
            'certificado': {
                keywords: ['certificado', 'titulo', 'diploma', 'como tramitar', 'graduacion', 'egreso'],
                response: {
                    title: '🎓 Certificado de Bachillerato',
                    content: [
                        {
                            subtitle: '📋 Requisitos para Tramitar',
                            text: '• Identificación oficial vigente<br>• Comprobante de liberación de todas las materias<br>• 6 fotografías tamaño infantil (blanco y negro, papel mate)<br>• Pago de derechos correspondientes<br>• No tener adeudos con la institución'
                        },
                        {
                            subtitle: '⏱️ Tiempo de Entrega',
                            text: '<strong>30 días hábiles</strong> a partir de la fecha de entrega completa de documentos.'
                        },
                        {
                            subtitle: '📞 Proceso de Seguimiento',
                            text: 'Acude a Control Escolar para iniciar el trámite y recibir información sobre el estatus de tu certificado.'
                        },
                        {
                            subtitle: '💡 Consejo Important',
                            text: 'Inicia el trámite con tiempo suficiente si necesitas tu certificado para inscribirte a la universidad.'
                        }
                    ],
                    footer: 'Tu certificado es el respaldo oficial de tu formación académica.'
                }
            },

            'cambio_escuela': {
                keywords: ['cambio', 'transferencia', 'kardex', 'cambiar de escuela', 'traslado'],
                response: {
                    title: '🔄 Cambio de Escuela',
                    content: [
                        {
                            subtitle: '📄 Mismo Subsistema (BGE)',
                            text: '• Solicita tu <strong>Kardex</strong> en Control Escolar<br>• Debes estar al corriente en todas las materias<br>• El trámite es directo sin intermediarios<br>• Tiempo de procesamiento: 5-10 días hábiles'
                        },
                        {
                            subtitle: '📄 Otro Subsistema',
                            text: '• <strong>Certificado parcial</strong> es obligatorio<br>• Solicita <strong>equivalencia de estudios</strong> en la SEP<br>• Proceso más largo (30-45 días)<br>• Algunos trámites requieren gestión en la capital del estado'
                        },
                        {
                            subtitle: '📄 Otro Estado',
                            text: '• <strong>Legalización</strong> de certificado necesaria<br>• Apostille si es requerido por el estado destino<br>• Verificación de equivalencias entre estados<br>• Tiempo estimado: 45-60 días'
                        },
                        {
                            subtitle: '💡 Recomendación',
                            text: 'Inicia el trámite con al menos 2 meses de anticipación a la fecha que necesites el documento.'
                        }
                    ],
                    footer: 'Tu movilidad estudiantil es nuestro compromiso.'
                }
            },

            // === REGLAMENTO Y POLÍTICAS ===
            'reprobacion': {
                keywords: ['reprobar', 'repruebo', 'materia', 'extraordinario', 'recuperar', 'segunda oportunidad'],
                response: {
                    title: '📚 Si Repruebas una Materia',
                    content: [
                        {
                            subtitle: '✅ Opciones de Recuperación',
                            text: '• <strong>Exámenes Extraordinarios:</strong> En períodos establecidos por calendario escolar<br>• <strong>Proyectos Prácticos:</strong> Trabajos especiales para regularización<br>• <strong>Asesorías Gratuitas:</strong> Apoyo personalizado con profesores<br>• <strong>Cursos de Regularización:</strong> Refuerzo en áreas específicas'
                        },
                        {
                            subtitle: '📅 Fechas Importantes',
                            text: 'Consulta el calendario escolar oficial para conocer las fechas exactas de exámenes extraordinarios. Generalmente son 3 períodos por año.'
                        },
                        {
                            subtitle: '👨‍🏫 Apoyo Académico',
                            text: 'Las asesorías con profesores son <strong>completamente gratuitas</strong> y están diseñadas para asegurar tu éxito académico.'
                        },
                        {
                            subtitle: '📧 ¿Necesitas ayuda?',
                            text: 'Contacta inmediatamente a tu consejero académico o a Control Escolar: 21ebh0200x.sep@gmail.com'
                        }
                    ],
                    footer: 'No te rindas, estamos aquí para apoyarte en tu éxito académico.'
                }
            },

            'reinscripcion': {
                keywords: ['reinscripcion', 'cada año', 'anual', 'proceso', 'renovacion'],
                response: {
                    title: '📝 Proceso de Reinscripción',
                    content: [
                        {
                            subtitle: '📅 Período (Agosto)',
                            text: 'La reinscripción se realiza durante el mes de agosto de cada año escolar.'
                        },
                        {
                            subtitle: '📋 Documentos Requeridos',
                            text: '• <strong>CRAD:</strong> Cédula de Registro y Actualización de Datos<br>• Actualización de información personal y familiar<br>• Comprobante de domicilio actualizado<br>• CURP vigente'
                        },
                        {
                            subtitle: '🔄 Proceso Simplificado',
                            text: 'Para estudiantes regulares, el proceso es ágil y directo. Solo actualización de datos personales en Control Escolar.'
                        },
                        {
                            subtitle: '⚠️ Casos Especiales',
                            text: 'Si tienes materias reprobadas o situaciones especiales, el proceso puede requerir pasos adicionales.'
                        }
                    ],
                    footer: 'Mantén actualizados tus datos para un proceso sin complicaciones.'
                }
            },

            // === CONVENIOS Y OPORTUNIDADES ===
            'universidades': {
                keywords: ['universidad', 'convenio', 'superior', 'continuar', 'despues', 'carrera universitaria'],
                response: {
                    title: '🏛️ Convenios Universitarios',
                    content: [
                        {
                            subtitle: '✅ Beneficios para Nuestros Estudiantes',
                            text: '• <strong>Acceso a laboratorios:</strong> Uso de instalaciones universitarias especializadas<br>• <strong>Talleres universitarios:</strong> Experiencia práctica en ambiente universitario<br>• <strong>Descuentos especiales:</strong> En inscripciones ITSVC y UTXJ<br>• <strong>Programas preferenciales:</strong> Para alumnos de excelencia académica'
                        },
                        {
                            subtitle: '🎯 Oportunidades Especiales',
                            text: '• <strong>Prácticas profesionales:</strong> En empresas e instituciones aliadas<br>• <strong>Proyectos colaborativos:</strong> Con estudiantes universitarios<br>• <strong>Mentorías académicas:</strong> Por parte de profesores universitarios<br>• <strong>Ferias vocacionales:</strong> Orientación para tu futuro profesional'
                        },
                        {
                            subtitle: '🏆 Para Estudiantes Destacados',
                            text: 'Los alumnos con promedio sobresaliente tienen oportunidades adicionales y programas especiales de apoyo para su transición universitaria.'
                        },
                        {
                            subtitle: '📧 Más Información',
                            text: 'Consulta con tu consejero académico sobre oportunidades específicas: 21ebh0200x.sep@gmail.com'
                        }
                    ],
                    footer: 'Tu bachillerato es el puente hacia tu futuro universitario.'
                }
            },

            // === RAZONES PARA ELEGIR LA ESCUELA ===
            'porque_elegir': {
                keywords: ['porque elegir', 'ventajas', 'beneficios', 'que ofrece', 'por que', 'razones'],
                response: {
                    title: '🌟 ¿Por Qué Elegir "Héroes de la Patria"?',
                    content: [
                        {
                            subtitle: '🎯 Educación Práctica y Moderna',
                            text: 'No solo teoría: desarrollas habilidades reales para el trabajo y la vida, con tecnología de vanguardia y metodologías innovadoras.'
                        },
                        {
                            subtitle: '🤝 Inclusión Total',
                            text: 'Sin barreras económicas, sociales o culturales. Todos tienen derecho a una educación de calidad.'
                        },
                        {
                            subtitle: '🏆 Proyectos Reconocidos',
                            text: 'Participamos en proyectos CTIM ganadores, ferias científicas y tenemos fuerte vinculación con la comunidad.'
                        },
                        {
                            subtitle: '💪 Formación Integral',
                            text: 'Desarrollas competencias académicas, laborales y personales, además de valores sólidos para la vida.'
                        },
                        {
                            subtitle: '💰 Beca Automática',
                            text: 'Todos nuestros estudiantes reciben la Beca Benito Juárez sin trámites adicionales.'
                        },
                        {
                            subtitle: '👨‍🏫 Personal Experimentado',
                            text: 'Profesores con más de 23 años de experiencia promedio, comprometidos con tu éxito.'
                        },
                        {
                            subtitle: '💻 Tecnología Responsable',
                            text: 'Usamos la tecnología como herramienta de crecimiento personal y académico, no como distractor.'
                        }
                    ],
                    footer: '¡Únete a nuestra familia educativa y transforma tu futuro!'
                }
            },

            // === SERVICIOS ADICIONALES ===
            'biblioteca': {
                keywords: ['biblioteca', 'libros', 'recursos', 'estudio', 'investigacion'],
                response: {
                    title: '📚 Centro de Recursos Académicos',
                    content: [
                        {
                            subtitle: '📖 Colección Bibliográfica',
                            text: 'Amplio acervo de libros especializados por materia y área de estudio, constantemente actualizado.'
                        },
                        {
                            subtitle: '💻 Recursos Digitales',
                            text: 'Acceso a bases de datos educativas, enciclopedias digitales y plataformas de investigación en línea.'
                        },
                        {
                            subtitle: '🔬 Apoyo a la Investigación',
                            text: 'Orientación especializada para proyectos escolares, investigaciones y trabajos académicos.'
                        },
                        {
                            subtitle: '🏠 Espacios de Estudio',
                            text: 'Áreas silenciosas y colaborativas diseñadas para diferentes tipos de aprendizaje y trabajo en equipo.'
                        }
                    ],
                    footer: 'Tu centro de recursos para el éxito académico.'
                }
            },

            'laboratorios': {
                keywords: ['laboratorio', 'ciencias', 'experimentos', 'practica', 'computo'],
                response: {
                    title: '🔬 Nuestros Laboratorios',
                    content: [
                        {
                            subtitle: '🧪 Laboratorio de Ciencias',
                            text: 'Equipado para prácticas de química, física y biología con materiales modernos y medidas de seguridad.'
                        },
                        {
                            subtitle: '💻 Centro de Cómputo',
                            text: 'Computadoras actualizadas con software especializado para todas las áreas académicas y laborales.'
                        },
                        {
                            subtitle: '🔧 Talleres Especializados',
                            text: 'Espacios equipados para cada especialidad: diseño gráfico, cocina profesional, instalaciones eléctricas.'
                        },
                        {
                            subtitle: '🛡️ Normas de Seguridad',
                            text: 'Todos nuestros espacios cumplen con las normas oficiales de seguridad y están supervisados por personal capacitado.'
                        }
                    ],
                    footer: 'Aprende haciendo en nuestros espacios especializados.'
                }
            }
        };

        // 🎨 FUNCIÓN PARA FORMATEAR RESPUESTAS PROFESIONALES
        function formatResponse(responseData) {
            if (typeof responseData === 'string') {
                // Para respuestas simples de texto plano
                return `<div class="response-simple">${responseData}</div>`;
            }

            let html = `<div class="response-professional">`;

            // Título principal
            if (responseData.title) {
                html += `<div class="response-title">${responseData.title}</div>`;
            }

            // Contenido estructurado
            if (responseData.content && Array.isArray(responseData.content)) {
                html += `<div class="response-content">`;
                responseData.content.forEach(item => {
                    html += `<div class="response-section">`;
                    if (item.subtitle) {
                        html += `<div class="response-subtitle">${item.subtitle}</div>`;
                    }
                    if (item.text) {
                        html += `<div class="response-text">${item.text}</div>`;
                    }
                    html += `</div>`;
                });
                html += `</div>`;
            }

            // Footer/conclusión
            if (responseData.footer) {
                html += `<div class="response-footer">${responseData.footer}</div>`;
            }

            html += `</div>`;
            return html;
        }

        // 🧠 SISTEMA DE IA MEJORADO PARA RESPUESTAS
        // 🌐 INTEGRACIÓN CON BASE DE DATOS
        let currentSessionId = null;
        let isAPIConnected = false;

        // Inicializar sesión del chatbot
        function initializeChatSession() {
            if (!currentSessionId) {
                currentSessionId = window.apiClient ? window.apiClient.generateSessionId() :
                    'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }

            // Verificar conexión API al inicializar
            if (window.apiClient) {
                window.apiClient.checkConnection().then(connected => {
                    isAPIConnected = connected;
                    //void 0;
                });
            }
        }

        // 🌐 FUNCIONES DE INTEGRACIÓN CON BACKEND API

        /**
         * Buscar información en el backend
         */
        async function searchBackendAPI(query, userType = 'visitante') {
            try {
                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.search}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query,
                        user_type: userType,
                        limit: 5
                    }),
                    signal: AbortSignal.timeout(API_CONFIG.timeout)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                void 0;

                return data;
            } catch (error) {
                void 0;
                return null;
            }
        }

        /**
         * Registrar mensaje en el backend
         */
        async function logMessageToAPI(message, senderType, intent = null) {
            try {
                const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.message}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        session_id: CHAT_SESSION.id,
                        message: message,
                        sender_type: senderType,
                        intent: intent,
                        user_type: 'visitante'
                    }),
                    signal: AbortSignal.timeout(API_CONFIG.timeout)
                });

                if (response.ok) {
                    CHAT_SESSION.messageCount++;
                    void 0;
                }
            } catch (error) {
                void 0;
            }
        }

        /**
         * Formatear respuesta de la base de datos
         */
        function formatDatabaseResponse(dbResult) {
            try {
                let contenido = dbResult.contenido;

                // Si el contenido es JSON string, parsearlo
                if (typeof contenido === 'string' && contenido.startsWith('{')) {
                    contenido = JSON.parse(contenido);
                }

                const response = {
                    title: `🔍 ${dbResult.titulo}`,
                    content: [],
                    footer: `Información actualizada: ${new Date(dbResult.updated_at).toLocaleDateString()}`
                };

                // Formatear contenido estructurado
                if (typeof contenido === 'object') {
                    for (const [key, value] of Object.entries(contenido)) {
                        if (Array.isArray(value)) {
                            response.content.push({
                                subtitle: key.charAt(0).toUpperCase() + key.slice(1),
                                text: value.map(item => `• ${item}`).join('<br>')
                            });
                        } else if (typeof value === 'object') {
                            let text = '';
                            for (const [subKey, subValue] of Object.entries(value)) {
                                text += `<strong>${subKey}:</strong> ${subValue}<br>`;
                            }
                            response.content.push({
                                subtitle: key.charAt(0).toUpperCase() + key.slice(1),
                                text: text
                            });
                        } else {
                            response.content.push({
                                subtitle: key.charAt(0).toUpperCase() + key.slice(1),
                                text: value
                            });
                        }
                    }
                } else {
                    response.content.push({
                        subtitle: 'Información',
                        text: contenido
                    });
                }

                return formatResponse(response);
            } catch (error) {
                console.error('Error formateando respuesta DB:', error);
                return formatResponse({
                    title: dbResult.titulo,
                    content: [{ text: dbResult.contenido }],
                    footer: 'Información de la base de datos'
                });
            }
        }

        // Función principal de procesamiento de mensajes (mejorada con API y AI)
        async function processMessage(message) {
            const startTime = Date.now();

            // Registrar mensaje del usuario en el backend (opcional, fire & forget)
            logMessageToAPI(message, 'user').catch(console.warn);

            // FASE 1: Intentar buscar a través del Orquestador de IA (Estandarizado Ene 2026)
            void 0;
            try {
                let data;

                // Intentar usar el APIClient global si está disponible
                if (window.apiClient && typeof window.apiClient.processAIRequest === 'function') {
                    data = await window.apiClient.processAIRequest('GENERAL_CHAT', {
                        message: message,
                        history: [] // Se puede implementar historial real si se desea
                    });
                } else {
                    // Fallback manual si apiClient no está listo
                    const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.aiChat}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            intent: 'GENERAL_CHAT',
                            payload: {
                                message: message,
                                history: []
                            }
                        }),
                        signal: AbortSignal.timeout(API_CONFIG.timeout)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    data = await response.json();
                }

                if (data && data.success) {
                    // Extraer respuesta según formato del Orquestador
                    const aiContent = data.data ? data.data.response : (data.response || null);

                    if (aiContent) {
                        void 0;

                        // Formatear respuesta Markdown/Texto a HTML bonito
                        let formattedContent = aiContent
                            .replace(/\n\n/g, '<br><br>') // Párrafos
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Negritas
                            .replace(/- /g, '• '); // Listas

                        // Añadir fuentes o metadatos si existen
                        const provider = data.data?.provider || 'IA';

                        // Registrar la respuesta del bot para analíticos (opcional)
                        logMessageToAPI(formattedContent, 'bot', 'ai_orchestrator_response').catch(console.warn);

                        return formatResponse({
                            title: data.data.title || '🤖 Asistente Virtual BGE',
                            content: data.data.content || [{ text: formattedContent }],
                            footer: data.data.metadata?.model ? `IA: ${data.data.metadata.model} | BGE Orquestador` : `IA: ${provider} | BGE Orquestador`
                        });
                    }
                } else if (data && data.success === false) {
                    void 0;
                } else {
                    void 0;
                }
            } catch (error) {
                void 0;
            }

            // FASE 2: Fallback a base de conocimiento local (Si falla la IA o no hay internet)
            void 0;
            const localResponse = processMessageLocal(message);

            // Registrar respuesta del bot
            logMessageToAPI(localResponse, 'bot', 'local_fallback').catch(console.warn);

            return localResponse;
        }

        // Formatear respuesta de la base de datos (versión 2)
        function formatDatabaseResponseV2(dbResult) {
            try {
                const content = typeof dbResult.contenido === 'string' ?
                    JSON.parse(dbResult.contenido) : dbResult.contenido;

                return `
            <div class="response-container">
                <div class="response-header">
                    <h3 class="response-title">💡 ${dbResult.titulo}</h3>
                    <span class="response-category">${dbResult.categoria}</span>
                </div>
                <div class="response-content">
                    ${formatResponseContent(content)}
                </div>
                <div class="response-footer">
                    <small>📅 Actualizado: ${formatDate(dbResult.updated_at)} | 🔄 Información dinámica</small>
                </div>
            </div>
        `;
            } catch (error) {
                void 0;
                return `
            <div class="response-container">
                <div class="response-header">
                    <h3 class="response-title">💡 ${dbResult.titulo}</h3>
                </div>
                <div class="response-content">
                    <p>${dbResult.contenido}</p>
                </div>
            </div>
        `;
            }
        }

        // Función de procesamiento local (original mejorada)
        function processMessageLocal(message) {
            const lowerMessage = message.toLowerCase();

            // Normalizar texto (quitar acentos, etc.)
            const normalizedMessage = lowerMessage
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');

            // Buscar en la base de conocimiento con algoritmo mejorado
            let bestMatch = null;
            let bestScore = 0;

            for (const [topic, data] of Object.entries(KNOWLEDGE_DATABASE)) {
                let score = 0;
                const matchedKeywords = [];

                // Contar coincidencias de palabras clave con diferentes pesos
                for (const keyword of data.keywords) {
                    const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                    // Coincidencia exacta (peso máximo)
                    if (normalizedMessage.includes(normalizedKeyword) || lowerMessage.includes(keyword)) {
                        score += 5;
                        matchedKeywords.push(keyword);
                    }
                    // Coincidencia parcial con límites de palabra
                    else if (normalizedMessage.includes(normalizedKeyword.substring(0, Math.min(normalizedKeyword.length, 4)))) {
                        score += 2;
                        matchedKeywords.push(keyword);
                    }
                }

                // Bonificación por múltiples coincidencias
                if (matchedKeywords.length > 1) {
                    score += matchedKeywords.length * 2;
                }

                // Actualizar mejor coincidencia
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = data;
                }
            }

            // Retornar mejor coincidencia si el puntaje es suficientemente alto
            if (bestMatch && bestScore >= 1) {
                return formatResponse(bestMatch.response);
            }

            // Respuestas de saludo mejoradas
            if (/\b(hola|buenos|buenas|hi|hello|saludo|que tal)\b/.test(lowerMessage)) {
                const greetings = [
                    {
                        title: '👋 ¡Hola! Bienvenido/a',
                        content: [
                            { text: 'Soy el asistente virtual del Bachillerato General Estatal "Héroes de la Patria". Estoy aquí para ayudarte con toda la información que necesites.' }
                        ],
                        footer: '¿En qué puedo ayudarte hoy? Pregúntame sobre admisiones, carreras, horarios, o cualquier cosa del bachillerato.'
                    },
                    {
                        title: '🌅 ¡Buenos días!',
                        content: [
                            { text: 'Me da mucho gusto saludarte. Tengo toda la información actualizada sobre nuestro bachillerato y estoy listo para resolver tus dudas.' }
                        ],
                        footer: '¿Qué te gustaría saber sobre "Héroes de la Patria"?'
                    },
                    {
                        title: '😊 ¡Qué tal!',
                        content: [
                            { text: 'Bienvenido/a a nuestro sistema de asistencia virtual. Puedo ayudarte con información sobre admisiones, carreras, becas, horarios y mucho más.' }
                        ],
                        footer: 'Solo pregúntame lo que necesites saber.'
                    }
                ];
                return formatResponse(greetings[Math.floor(Math.random() * greetings.length)]);
            }

            // Respuestas de agradecimiento
            if (/\b(gracias|thank you|gracias|muchas gracias)\b/.test(lowerMessage)) {
                const thanks = [
                    {
                        title: '😊 ¡De nada!',
                        content: [
                            { text: 'Me alegra poder ayudarte. Si tienes más preguntas sobre nuestro bachillerato, no dudes en hacerlas.' }
                        ],
                        footer: '¡Estoy aquí para apoyarte en tu proceso educativo!'
                    },
                    {
                        title: '🤗 ¡Un placer ayudarte!',
                        content: [
                            { text: 'Para eso estoy aquí. Si necesitas más información sobre "Héroes de la Patria", solo pregúntame.' }
                        ],
                        footer: 'Tu éxito educativo es nuestra prioridad.'
                    }
                ];
                return formatResponse(thanks[Math.floor(Math.random() * thanks.length)]);
            }

            // Respuesta por defecto mejorada con sugerencias inteligentes
            const defaultResponse = {
                title: '🤔 No encontré información específica',
                content: [
                    {
                        subtitle: '💡 Sugerencias de temas',
                        text: 'Puedo ayudarte con información sobre:<br><br>• <strong>Admisiones:</strong> proceso, requisitos, fechas<br>• <strong>Carreras:</strong> especialidades laborales disponibles<br>• <strong>Becas:</strong> Benito Juárez y apoyos institucionales<br>• <strong>Horarios:</strong> clases y atención administrativa<br>• <strong>Personal:</strong> director y docentes<br>• <strong>Historia:</strong> fundación y filosofía institucional'
                    },
                    {
                        subtitle: '📞 Contacto Directo',
                        text: 'Para consultas muy específicas: <strong>21ebh0200x.sep@gmail.com</strong>'
                    }
                ],
                footer: 'Intenta reformular tu pregunta o usa palabras clave como "admisiones", "carreras", "becas", etc.'
            };

            return formatResponse(defaultResponse);
        }

        // 🎯 VARIABLES DE CONTROL DEL CHATBOT
        let chatbotOpen = false;

        // 🔄 FUNCIÓN PARA ALTERNAR VISIBILIDAD
        function toggleChatbot() {
            const container = document.getElementById('chatbotContainer');
            const toggle = document.getElementById('chatbotToggle');

            if (!container || !toggle) {
                //void 0;
                return;
            }

            chatbotOpen = !chatbotOpen;

            if (chatbotOpen) {
                container.style.display = 'flex';
                toggle.innerHTML = DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-times"></i>', 'simple'));

                // Limpiar mensajes anteriores si es necesario
                const messagesContainer = document.getElementById('chatbotMessages');
                if (messagesContainer && messagesContainer.children.length === 0) {
                    // Mensaje de bienvenida profesional solo si no hay mensajes
                    setTimeout(() => {
                        const welcomeMessage = {
                            title: '🎓 Asistente Virtual BGE',
                            content: [
                                {
                                    subtitle: '¡Hola! Soy tu asistente inteligente',
                                    text: 'Puedo ayudarte con información sobre admisiones, carreras, becas, horarios, y todo lo relacionado con nuestro bachillerato.'
                                }
                            ],
                            footer: '¿En qué puedo ayudarte hoy?'
                        };

                        addMessage('bot', formatResponse(welcomeMessage));
                    }, 500);
                }

            } else {
                container.style.display = 'none';
                toggle.innerHTML = DOMPurify.sanitize(sanitizeHTML('<i class="fas fa-comments"></i>', 'simple'));
            }
        }

        // Exponer la función globalmente
        window.toggleChatbot = toggleChatbot;
        window.sendMessage = sendMessage;

        // ✉️ FUNCIÓN PARA AGREGAR MENSAJES CON ANIMACIÓN
        function addMessage(sender, message) {
            const messagesContainer = document.getElementById('chatbotMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `chatbot-message ${sender}`;

            // Usar innerHTML para renderizar HTML formateado
            messageDiv.innerHTML = DOMPurify.sanitize(sanitizeHTML(message, 'ugc'));

            // Animación de entrada
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';

            messagesContainer.appendChild(messageDiv);

            // Animar entrada
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.4s ease';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 50);

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // ⌨️ FUNCIÓN PARA ENVIAR MENSAJE
        // 💬 FUNCIÓN PRINCIPAL DE ENVÍO DE MENSAJES (ASÍNCRONA)
        async function sendMessage() {
            const input = document.getElementById('chatbotInput');
            const message = input.value.trim();

            if (message) {
                // Agregar mensaje del usuario
                addMessage('user', message);
                input.value = '';

                // Mostrar indicador de escritura
                showTypingIndicator();

                try {
                    // Procesar mensaje con API o respuestas locales
                    const response = await processMessage(message);

                    // Simular tiempo mínimo de procesamiento para mejor UX
                    const minProcessingTime = 800;
                    const processingTime = Date.now() - (window.lastMessageTime || Date.now());
                    const delay = Math.max(0, minProcessingTime - processingTime);

                    setTimeout(() => {
                        hideTypingIndicator();
                        addMessage('bot', response);

                        // Mostrar opciones de feedback si la API está conectada
                        if (isAPIConnected) {
                            addFeedbackButtons(message);
                        }
                    }, delay);

                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                    hideTypingIndicator();

                    const errorResponse = `
                <div class="response-container error">
                    <div class="response-header">
                        <h3 class="response-title">⚠️ Error de Conexión</h3>
                    </div>
                    <div class="response-content">
                        <p>Disculpa, hubo un problema procesando tu mensaje. Por favor intenta de nuevo.</p>
                        <p><small>Modo offline activo - usando respuestas locales</small></p>
                    </div>
                </div>
            `;

                    addMessage('bot', errorResponse);
                }

                window.lastMessageTime = Date.now();
            }
        }

        // 🤖 FUNCIONES AUXILIARES PARA INTEGRACIÓN AI

        // Formatear respuesta del sistema AI educativo
        function formatAIResponse(aiResponse) {
            const response = {
                title: `🤖 ${aiResponse.subject ? `${aiResponse.subject} -` : ''} Asistente IA`,
                content: [
                    {
                        subtitle: '💡 Respuesta Inteligente',
                        text: aiResponse.response
                    }
                ],
                footer: `Confianza: ${Math.round((aiResponse.confidence || 0.8) * 100)}% | Categoría: ${aiResponse.category || 'General'}`
            };

            if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
                response.content.push({
                    subtitle: '📚 Recomendaciones Personalizadas',
                    text: aiResponse.recommendations.map(rec => `• ${rec}`).join('<br>')
                });
            }

            if (aiResponse.relatedTopics && aiResponse.relatedTopics.length > 0) {
                response.content.push({
                    subtitle: '🔗 Temas Relacionados',
                    text: aiResponse.relatedTopics.join(', ')
                });
            }

            return formatResponse(response);
        }

        // Obtener ID de usuario actual
        function getCurrentUserId() {
            // Intentar obtener del sistema de autenticación
            if (window.currentUser && window.currentUser.id) {
                return window.currentUser.id;
            }

            // Intentar obtener del localStorage
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const user = JSON.parse(userData);
                    return user.id || user.google_id || user.email;
                } catch (error) {
                    void 0;
                }
            }

            // Generar ID temporal para sesión anónima
            let sessionId = localStorage.getItem('chatbot_session_id');
            if (!sessionId) {
                sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('chatbot_session_id', sessionId);
            }

            return sessionId;
        }

        // 🛠️ FUNCIONES AUXILIARES PARA INTEGRACIÓN API

        // Formatear fecha para mostrar
        function formatDate(dateString) {
            if (!dateString) return 'Fecha no disponible';

            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return 'Fecha no disponible';
            }
        }

        // Formatear contenido de respuesta estructurado
        function formatResponseContent(content) {
            if (typeof content === 'string') {
                return `<p>${content}</p>`;
            }

            if (Array.isArray(content)) {
                return content.map(item => {
                    if (typeof item === 'object' && item.subtitle && item.text) {
                        return `
                    <div class="content-section">
                        <h4 class="content-subtitle">${item.subtitle}</h4>
                        <p class="content-text">${item.text}</p>
                    </div>
                `;
                    }
                    return `<p>${item}</p>`;
                }).join('');
            }

            if (typeof content === 'object') {
                return Object.keys(content).map(key => {
                    return `
                <div class="content-section">
                    <h4 class="content-subtitle">${key}</h4>
                    <p class="content-text">${content[key]}</p>
                </div>
            `;
                }).join('');
            }

            return `<p>${content}</p>`;
        }

        // Agregar botones de feedback
        function addFeedbackButtons(originalMessage) {
            const messagesContainer = document.getElementById('chatbotMessages');
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-container';
            feedbackDiv.innerHTML = sanitizeHTML(`
        <div class="feedback-question">
            <small>¿Te fue útil esta respuesta?</small>
        </div>
        <div class="feedback-buttons">
            <button class="feedback-btn positive" data-action="submit-feedback" data-param-1="5, '${originalMessage}'">
                👍 Sí
            </button>
            <button class="feedback-btn negative" data-action="submit-feedback" data-param-1="2, '${originalMessage}'">
                👎 No
            </button>
        </div>
    `);

            messagesContainer.appendChild(feedbackDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Enviar feedback del usuario
        async function submitFeedback(rating, originalMessage) {
            if (window.apiClient && isAPIConnected) {
                try {
                    await window.apiClient.submitFeedback(currentSessionId, rating, originalMessage);

                    // Reemplazar botones con mensaje de agradecimiento
                    const feedbackContainers = document.querySelectorAll('.feedback-container');
                    const lastFeedback = feedbackContainers[feedbackContainers.length - 1];

                    if (lastFeedback) {
                        lastFeedback.innerHTML = sanitizeHTML(`
                    <div class="feedback-thanks">
                        <small>✅ ¡Gracias por tu feedback!</small>
                    </div>
                `);
                    }

                } catch (error) {
                    void 0;
                }
            }
        }

        // 👨‍💻 INDICADORES DE ESCRITURA
        function showTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            const messagesContainer = document.getElementById('chatbotMessages');

            if (indicator) {
                indicator.style.display = 'flex';
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        function hideTypingIndicator() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }

        function injectChatbotWidget() {
            if (document.getElementById('chatbotToggle') && document.getElementById('chatbotContainer')) {
                return;
            }

            // Crear boton flotante
            const toggleBtn = document.createElement('button');
            toggleBtn.id = 'chatbotToggle';
            toggleBtn.className = 'chatbot-toggle';
            toggleBtn.setAttribute('aria-label', 'Abrir asistente virtual');
            toggleBtn.setAttribute('title', 'Asistente Virtual BGE');
            toggleBtn.innerHTML = '<i class="fas fa-comments"></i>';

            // Crear contenedor del chatbot
            const chatContainer = document.createElement('div');
            chatContainer.id = 'chatbotContainer';
            chatContainer.className = 'chatbot-container';
            chatContainer.style.display = 'none';
            chatContainer.innerHTML = '<div class="chatbot-header"><div class="chatbot-header-content"><div class="chatbot-avatar">🎓</div><div class="chatbot-title-wrapper"><h4 class="chatbot-title">Asistente Virtual BGE</h4><span class="chatbot-status online">En linea</span></div></div><button class="chatbot-close" id="chatbotCloseBtn" aria-label="Cerrar chat"><i class="fas fa-times"></i></button></div><div class="chatbot-messages" id="chatbotMessages"></div><div class="chatbot-input-area"><div class="typing-indicator" id="typingIndicator" style="display: none;"><span></span><span></span><span></span></div><div class="chatbot-input-wrapper"><input type="text" id="chatbotInput" placeholder="Escribe tu pregunta..." autocomplete="off" maxlength="500"><button id="chatbotSendBtn" class="chatbot-send-btn" aria-label="Enviar mensaje"><i class="fas fa-paper-plane"></i></button></div></div><div class="chatbot-footer"><small>BGE Heroes de la Patria | Disponible 24/7</small></div>';

            document.body.appendChild(toggleBtn);
            document.body.appendChild(chatContainer);

            // Event listeners
            toggleBtn.addEventListener('click', toggleChatbot);
            document.getElementById('chatbotCloseBtn').addEventListener('click', toggleChatbot);
            document.getElementById('chatbotSendBtn').addEventListener('click', sendMessage);

            // Estilos del widget
            if (!document.getElementById('chatbot-widget-styles')) {
                const widgetStyles = document.createElement('style');
                widgetStyles.id = 'chatbot-widget-styles';
                widgetStyles.textContent = '.chatbot-toggle{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#1976D2 0%,#42A5F5 100%);color:white;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(25,118,210,0.4);z-index:10000;font-size:24px;display:flex;align-items:center;justify-content:center;transition:all 0.3s ease}.chatbot-toggle:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(25,118,210,0.5)}.chatbot-container{position:fixed;bottom:150px;right:50px;width:370px;height:520px;background:white;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);z-index:10001;display:flex;flex-direction:column;overflow:hidden}.chatbot-header{background:linear-gradient(135deg,#0D47A1 0%,#1976D2 100%);color:white;padding:16px;display:flex;justify-content:space-between;align-items:center}.chatbot-header-content{display:flex;align-items:center;gap:12px}.chatbot-avatar{font-size:28px}.chatbot-title-wrapper{display:flex;flex-direction:column}.chatbot-title{margin:0;font-size:16px;font-weight:600}.chatbot-status{font-size:12px;opacity:0.9}.chatbot-status.online::before{content:"";display:inline-block;width:8px;height:8px;background:#4CAF50;border-radius:50%;margin-right:6px}.chatbot-close{background:rgba(255,255,255,0.1);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center}.chatbot-close:hover{background:rgba(255,255,255,0.2)}.chatbot-messages{flex:1;overflow-y:auto;padding:16px;background:#f8f9fa;display:flex;flex-direction:column;gap:12px}.chatbot-input-area{padding:12px 16px;background:white;border-top:1px solid #eee}.chatbot-input-wrapper{display:flex;gap:8px}#chatbotInput{flex:1;border:1px solid #ddd;border-radius:24px;padding:12px 20px;font-size:14px;outline:none}#chatbotInput:focus{border-color:#1976D2}.chatbot-send-btn{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1976D2 0%,#42A5F5 100%);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}.chatbot-footer{padding:8px 16px;background:#f5f5f5;text-align:center;color:#666;border-top:1px solid #eee}.typing-indicator{display:flex;gap:4px;padding:8px 0}.typing-indicator span{width:8px;height:8px;background:#1976D2;border-radius:50%;animation:bounce 1.4s infinite ease-in-out}.typing-indicator span:nth-child(1){animation-delay:-0.32s}.typing-indicator span:nth-child(2){animation-delay:-0.16s}@keyframes bounce{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}@media(max-width:480px){.chatbot-container{width:calc(100vw - 40px);height:calc(100vh - 120px);bottom:80px}}body.dark-mode .chatbot-container{background:#2d2d2d}body.dark-mode .chatbot-messages{background:#1a1a1a}body.dark-mode .chatbot-message.bot{background:#3d3d3d;color:#eee}body.dark-mode .chatbot-input-area{background:#2d2d2d;border-top-color:#444}body.dark-mode #chatbotInput{background:#3d3d3d;border-color:#555;color:#eee}body.dark-mode .chatbot-footer{background:#2d2d2d;border-top-color:#444;color:#aaa}';
                document.head.appendChild(widgetStyles);
            }
        }

        // INICIALIZACION DEL CHATBOT
        document.addEventListener('DOMContentLoaded', function () {
            // PRIMERO: Inyectar el widget HTML si no existe
            injectChatbotWidget();
            // Inicializar sesión del chatbot y conexión API
            initializeChatSession();

            // Event listener para el botón toggle
            const chatToggle = document.getElementById('chatbotToggle');
            if (chatToggle) {
                chatToggle.addEventListener('click', toggleChatbot);
                //void 0;
            } else {
                //void 0;
            }

            // Event listener para Enter en el input
            const chatInput = document.getElementById('chatbotInput');
            if (chatInput) {
                chatInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });
                //void 0;
            } else {
                //void 0;
            }

            // Asegurar que el contenedor esté oculto inicialmente
            const container = document.getElementById('chatbotContainer');
            if (container) {
                container.style.display = 'none';
                //void 0;
            }

            // Event listeners para botones externos con data-action
            document.addEventListener('click', function (e) {
                const target = e.target.closest('[data-action="toggle-chatbot"]');
                if (target) {
                    e.preventDefault();
                    toggleChatbot();
                }
            });

            
        });

        // Agregar estilos CSS para las respuestas profesionales
        const professionalStyles = document.createElement('style');
        professionalStyles.textContent = `
    /* 🎨 ESTILOS PROFESIONALES PARA RESPUESTAS DEL CHATBOT */
    .response-professional {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        color: #2c3e50;
        width: 100%;
    }
    
    .response-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #1976D2;
        margin-bottom: 15px;
        padding: 8px 12px;
        background: linear-gradient(135deg, #e3f2fd, #f8f9fa);
        border-left: 4px solid #1976D2;
        border-radius: 6px;
    }
    
    .response-content {
        margin-bottom: 12px;
    }
    
    .response-section {
        margin-bottom: 12px;
        padding: 4px 0;
    }
    
    .response-subtitle {
        font-weight: 600;
        color: #1565C0;
        margin-bottom: 8px;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    
    .response-text {
        color: #37474f;
        font-size: 0.9rem;
        line-height: 1.5;
        margin-left: 4px;
        padding: 4px 0;
    }
    
    /* 🌙 MODO OSCURO - Colores adaptados */
    [data-theme="dark"] .response-text,
    body.dark-mode .response-text {
        color: #ffffff !important;
    }
    
    [data-theme="dark"] .response-professional,
    body.dark-mode .response-professional {
        color: #ffffff !important;
    }
    
    [data-theme="dark"] .response-simple,
    body.dark-mode .response-simple {
        color: #ffffff !important;
    }
    
    [data-theme="dark"] .response-subtitle,
    body.dark-mode .response-subtitle {
        color: #ffd700 !important;
    }
    
    [data-theme="dark"] .response-text strong {
        color: #64b5f6 !important;
    }
    
    [data-theme="dark"] .response-text a {
        color: #64b5f6 !important;
    }
    
    [data-theme="dark"] .chatbot-message.bot {
        background: #424242 !important;
        border: 1px solid #616161 !important;
        color: #ffffff !important;
    }
    
    [data-theme="dark"] .response-title,
    body.dark-mode .response-title {
        color: #ffd700 !important;
        background: linear-gradient(135deg, #37474f, #424242) !important;
        border-left: 4px solid #ffd700 !important;
    }
    
    [data-theme="dark"] .response-footer {
        color: #a5d6a7 !important;
        border-left: 3px solid #66bb6a !important;
    }
    
    /* Estilos específicos adicionales para mejor contraste */
    [data-theme="dark"] .response-subtitle,
    [data-theme="dark"] .subtitle,
    body.dark-mode .response-subtitle,
    body.dark-mode .subtitle {
        color: #ffd700 !important;
        font-weight: 600 !important;
    }
    
    [data-theme="dark"] .response-text,
    [data-theme="dark"] .text,
    body.dark-mode .response-text,
    body.dark-mode .text {
        color: #ffffff !important;
    }
    
    /* Contenedor principal de respuestas */
    [data-theme="dark"] .response-professional,
    body.dark-mode .response-professional {
        color: #ffffff !important;
    }
    
    /* Secciones de contenido */
    [data-theme="dark"] .response-section,
    body.dark-mode .response-section {
        color: #ffffff !important;
    }
    
    [data-theme="dark"] .response-content,
    body.dark-mode .response-content {
        color: #ffffff !important;
    }
    
    .response-text strong {
        color: #1976D2;
        font-weight: 600;
    }
    
    .response-text a {
        color: #1976D2;
        text-decoration: none;
        font-weight: 500;
    }
    
    .response-text a:hover {
        text-decoration: underline;
    }
    
    .response-footer {
        margin-top: 16px;
        padding: 10px 12px;
        background: linear-gradient(135deg, #f0f4ff, #e8f5e8);
        border-radius: 6px;
        font-size: 0.85rem;
        color: #2e7d32;
        font-style: italic;
        border-left: 3px solid #4caf50;
    }
    
    .response-simple {
        color: #37474f;
        font-size: 0.9rem;
        line-height: 1.6;
    }
    
    /* Mejoras para el contenedor del chatbot */
    .chatbot-message.bot {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 16px;
        margin-bottom: 12px;
        border-radius: 12px;
        width: 100%;
        max-width: 100%;
    }
    
    .chatbot-message.user {
        background: linear-gradient(135deg, #1976D2, #1565C0);
        color: white;
        border-radius: 12px;
        padding: 12px 16px;
        max-width: 85%;
        margin-left: auto;
        margin-bottom: 12px;
    }
    
    /* Indicador de escritura */
    .typing-indicator {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: #666;
        font-size: 0.85rem;
    }
    
    .typing-dots {
        display: flex;
        gap: 3px;
    }
    
    .typing-dots div {
        width: 6px;
        height: 6px;
        background: #1976D2;
        border-radius: 50%;
        animation: typingPulse 1.4s infinite both;
    }
    
    .typing-dots div:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-dots div:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typingPulse {
        0%, 60%, 100% {
            transform: scale(1);
            opacity: 0.5;
        }
        30% {
            transform: scale(1.2);
            opacity: 1;
        }
    }
    
    /* Estilos para integración con base de datos */
    .response-category {
        background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
        color: #1565C0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        margin-left: 8px;
    }
    
    .content-section {
        margin-bottom: 12px;
    }
    
    .content-subtitle {
        color: #1976D2;
        font-size: 0.9rem;
        font-weight: 600;
        margin: 8px 0 4px 0;
    }
    
    .content-text {
        margin: 0 0 8px 0;
        line-height: 1.5;
    }
    
    .response-footer {
        margin-top: 12px;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
        color: #666;
        font-size: 0.8rem;
    }
    
    .response-container.error {
        border-left: 4px solid #f44336;
        background-color: #ffebee;
    }
    
    .response-container.error .response-title {
        color: #d32f2f;
    }
    
    /* Botones de feedback */
    .feedback-container {
        margin: 8px 0;
        padding: 8px 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    }
    
    .feedback-question {
        margin-bottom: 6px;
        color: #666;
    }
    
    .feedback-buttons {
        display: flex;
        gap: 8px;
    }
    
    .feedback-btn {
        padding: 4px 12px;
        border: 1px solid #ddd;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s ease;
    }
    
    .feedback-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .feedback-btn.positive:hover {
        background: #e8f5e8;
        border-color: #4caf50;
        color: #2e7d32;
    }
    
    .feedback-btn.negative:hover {
        background: #ffebee;
        border-color: #f44336;
        color: #d32f2f;
    }
    
    .feedback-thanks {
        color: #4caf50;
        font-weight: 500;
        text-align: center;
        padding: 4px 0;
    }
`;

        document.head.appendChild(professionalStyles);

    } // Fin del bloque else de verificación de carga duplicada

} // Fin del bloque else principal de window.BGE_CHATBOT_LOADED