// Buscador interno del sitio web
class SiteSearch {
    constructor() {
        this.searchInput = document.getElementById('siteSearch');
        this.searchResults = document.getElementById('searchResults');
        
        // Check if search elements exist
        if (!this.searchInput || !this.searchResults) {
            // Búsqueda no disponible en esta página - esto es normal
            return;
        }
        
        this.searchLoading = this.searchResults.querySelector('.search-loading');
        this.searchContent = this.searchResults.querySelector('.search-content');
        this.searchIndex = [];
        this.debounceTimer = null;

        this.initializeSearch();
        this.bindEvents();
    }

    initializeSearch() {
        // Base de datos de búsqueda con contenido del sitio
        this.searchIndex = [
            // Páginas principales
            {
                title: "Inicio",
                description: "Página principal del Bachillerato General Estatal Héroes de la Patria",
                url: "index.html",
                keywords: ["inicio", "home", "principal", "bachillerato", "heroes", "patria"],
                category: "Página"
            },
            {
                title: "Conócenos - Historia",
                description: "Historia institucional desde 1996 hasta la actualidad",
                url: "conocenos.html#historia",
                keywords: ["historia", "fundación", "1996", "trayectoria", "años", "institucional"],
                category: "Información"
            },
            {
                title: "Conócenos - Misión y Visión",
                description: "Misión, visión y valores institucionales",
                url: "conocenos.html#mision-vision",
                keywords: ["misión", "visión", "valores", "objetivo", "meta", "propósito"],
                category: "Información"
            },
            {
                title: "Conócenos - Mensaje del Director",
                description: "Mensaje oficial del Ing. Samuel Cruz Interial",
                url: "conocenos.html#mensaje-director",
                keywords: ["director", "samuel", "cruz", "mensaje", "bienvenida"],
                category: "Información"
            },
            {
                title: "Conócenos - Organigrama",
                description: "Estructura organizacional y jerarquías administrativas de la institución",
                url: "conocenos.html#organigrama",
                keywords: ["organigrama", "estructura", "organizacional", "jerarquías", "administrativas", "organización"],
                category: "Información"
            },
            
            // Oferta Educativa
            {
                title: "Oferta Educativa",
                description: "Plan de estudios del Bachillerato General Estatal",
                url: "oferta-educativa.html",
                keywords: ["plan", "estudios", "materias", "semestres", "académico", "educativa"],
                category: "Académico"
            },
            {
                title: "Modelo Educativo",
                description: "Enfoque por competencias y pilares educativos",
                url: "oferta-educativa.html#modelo-educativo",
                keywords: ["modelo", "competencias", "educativo", "pilares", "metodología"],
                category: "Académico"
            },

            // Servicios
            {
                title: "Sistema de Citas Online",
                description: "Agenda citas con diferentes departamentos de manera rápida y sencilla",
                url: "citas.html",
                keywords: ["citas", "agenda", "reservas", "online", "departamentos", "orientación", "servicios", "dirección"],
                category: "Servicios"
            },
            {
                title: "Sistema de Pagos en Línea",
                description: "Realiza pagos de colegiaturas, inscripciones y servicios escolares de forma segura",
                url: "pagos.html",
                keywords: ["pagos", "colegiaturas", "inscripciones", "online", "seguro", "tarjeta", "transferencia", "servicios"],
                category: "Servicios"
            },
            {
                title: "Centro de Descargas",
                description: "Portal de documentos oficiales, formatos, reglamentos y recursos educativos",
                url: "descargas.html",
                keywords: ["descargas", "documentos", "formatos", "reglamentos", "recursos", "educativos", "PDF", "oficiales"],
                category: "Servicios"
            },
            {
                title: "Servicios - Trámites Escolares",
                description: "Certificados, constancias y documentos oficiales",
                url: "servicios.html#servicios-principales",
                keywords: ["trámites", "certificados", "constancias", "documentos", "escolares"],
                category: "Servicios"
            },
            {
                title: "Servicios - Laboratorios",
                description: "Laboratorio de ciencias, cómputo y talleres especializados",
                url: "servicios.html#laboratorios",
                keywords: ["laboratorios", "ciencias", "cómputo", "talleres", "equipos"],
                category: "Servicios"
            },
            {
                title: "Servicios - Biblioteca",
                description: "Acervo bibliográfico y recursos digitales",
                url: "servicios.html#biblioteca",
                keywords: ["biblioteca", "libros", "acervo", "estudio", "préstamos"],
                category: "Servicios"
            },
            {
                title: "Servicios - Becas y Apoyos",
                description: "Información sobre becas y programas de apoyo",
                url: "servicios.html#becas",
                keywords: ["becas", "apoyos", "económico", "aprovechamiento", "programas"],
                category: "Servicios"
            },

            // Comunidad
            {
                title: "Comunidad - Noticias",
                description: "Noticias y eventos recientes de la institución",
                url: "comunidad.html#noticias",
                keywords: ["noticias", "eventos", "actividades", "comunidad", "actualizaciones"],
                category: "Comunidad"
            },
            {
                title: "Comunidad - Vida Estudiantil",
                description: "Actividades extracurriculares y vida en el plantel",
                url: "comunidad.html#vida-estudiantil",
                keywords: ["vida", "estudiantil", "actividades", "deportes", "cultura"],
                category: "Comunidad"
            },

            // Egresados
            {
                title: "Bolsa de Trabajo",
                description: "Portal de empleos exclusivo para egresados del BGE Héroes de la Patria",
                url: "bolsa-trabajo.html",
                keywords: ["bolsa", "trabajo", "empleos", "oportunidades", "laboral", "egresados", "CV", "postular"],
                category: "Egresados"
            },
            {
                title: "Egresados - Testimonios",
                description: "Experiencias y testimonios de nuestros egresados",
                url: "egresados.html#testimonios-egresados",
                keywords: ["egresados", "testimonios", "experiencias", "graduados", "éxito"],
                category: "Egresados"
            },
            {
                title: "Egresados - Actualizar Datos",
                description: "Formulario para mantener actualizada la información de egresados",
                url: "egresados.html#actualizar-datos",
                keywords: ["actualizar", "datos", "formulario", "información", "egresados"],
                category: "Egresados"
            },

            // Transparencia
            {
                title: "Transparencia - Normatividad",
                description: "Reglamentos, lineamientos y normativa institucional",
                url: "normatividad.html",
                keywords: ["normatividad", "reglamentos", "lineamientos", "normas", "legal"],
                category: "Transparencia"
            },

            // Contacto
            {
                title: "Contacto y Ayuda",
                description: "Información de contacto y formularios de ayuda",
                url: "contacto.html",
                keywords: ["contacto", "ayuda", "dirección", "teléfono", "email", "ubicación"],
                category: "Contacto"
            },

            // Portal del Estudiante
            {
                title: "Portal del Estudiante",
                description: "Acceso a recursos académicos, horarios, calificaciones y actividades estudiantiles",
                url: "estudiantes.html",
                keywords: ["estudiantes", "portal", "calificaciones", "horarios", "tareas", "recursos", "académico"],
                category: "Estudiantes"
            },
            {
                title: "Portal de Padres de Familia",
                description: "Portal exclusivo para padres con acceso a calificaciones, comunicación docente y eventos",
                url: "padres.html",
                keywords: ["padres", "familia", "portal", "calificaciones", "comunicación", "docentes", "eventos", "seguimiento"],
                category: "Padres"
            },
            {
                title: "Calculadora de Promedio",
                description: "Herramienta para calcular promedios académicos",
                url: "estudiantes.html#calculadora",
                keywords: ["promedio", "calificaciones", "calculator", "notas", "matemáticas"],
                category: "Estudiantes"
            },
            {
                title: "Técnicas de Estudio",
                description: "Consejos y métodos para mejorar el rendimiento académico",
                url: "estudiantes.html#tecnicas",
                keywords: ["estudio", "técnicas", "aprendizaje", "métodos", "consejos", "rendimiento"],
                category: "Estudiantes"
            },
            {
                title: "Plataforma de Calificaciones",
                description: "Consulta calificaciones, seguimiento académico y reportes de evaluación en tiempo real",
                url: "calificaciones.html",
                keywords: ["calificaciones", "notas", "académico", "reportes", "evaluación", "boletas", "seguimiento"],
                category: "Estudiantes"
            },

            // Calendario Escolar
            {
                title: "Calendario Escolar Interactivo",
                description: "Calendario interactivo con fechas importantes, evaluaciones, vacaciones y eventos del ciclo escolar",
                url: "calendario.html",
                keywords: ["calendario", "escolar", "fechas", "importantes", "evaluaciones", "vacaciones", "eventos", "interactivo"],
                category: "Información"
            },

            // Información específica
            {
                title: "Horarios de Atención",
                description: "Horarios de servicios administrativos y académicos",
                url: "servicios.html#horarios",
                keywords: ["horarios", "atención", "servicios", "administrativo", "8:00", "1:30"],
                category: "Información"
            },
            {
                title: "Requisitos y Procedimientos",
                description: "Requisitos para inscripción, becas y servicios",
                url: "servicios.html#requisitos",
                keywords: ["requisitos", "procedimientos", "inscripción", "documentos", "trámites"],
                category: "Información"
            },
            {
                title: "Dashboard Administrativo",
                description: "Panel de control integral para la gestión académica y administrativa",
                url: "admin-dashboard.html",
                keywords: ["administración", "dashboard", "gestión", "control", "académico", "reportes", "estadísticas"],
                category: "Administración"
            },
            
            // FAQ y Ayuda
            {
                title: "Preguntas Frecuentes",
                description: "Respuestas a las preguntas más comunes sobre trámites, horarios y servicios",
                url: "index.html#faq",
                keywords: ["faq", "preguntas", "frecuentes", "ayuda", "dudas", "respuestas"],
                category: "Ayuda"
            },
            {
                title: "Quejas y Sugerencias",
                description: "Formulario para enviar quejas, sugerencias y comentarios",
                url: "index.html#quejas-sugerencias",
                keywords: ["quejas", "sugerencias", "comentarios", "formulario", "buzón"],
                category: "Contacto"
            },
            
            // Información específica de requisitos y procesos
            {
                title: "Proceso de Inscripción",
                description: "Pasos y requisitos para inscribirse al bachillerato",
                url: "oferta-educativa.html#proceso-admision",
                keywords: ["inscripción", "admisión", "proceso", "requisitos", "nuevo", "ingreso"],
                category: "Admisión"
            },
            {
                title: "Perfil de Egreso",
                description: "Competencias y habilidades que desarrollarán los estudiantes",
                url: "oferta-educativa.html#perfil-egreso",
                keywords: ["perfil", "egreso", "competencias", "habilidades", "graduado"],
                category: "Académico"
            },
            {
                title: "Capacitación para el Trabajo",
                description: "Talleres y capacitación técnica especializada",
                url: "oferta-educativa.html#capacitacion-trabajo",
                keywords: ["capacitación", "trabajo", "talleres", "técnica", "especializada"],
                category: "Académico"
            },
            
            // Información de ubicación y contacto
            {
                title: "Ubicación y Dirección",
                description: "Coronel Tito Hernández, Puebla - Cómo llegar al plantel",
                url: "contacto.html#ubicacion",
                keywords: ["ubicación", "dirección", "coronel", "tito", "hernández", "puebla", "cómo", "llegar"],
                category: "Contacto"
            },
            {
                title: "Horarios de Atención",
                description: "Lunes a Viernes de 8:00 AM a 1:30 PM",
                url: "contacto.html#horarios",
                keywords: ["horarios", "atención", "8:00", "1:30", "lunes", "viernes", "servicio"],
                category: "Información"
            },
            
            // Información técnica y documentos
            {
                title: "Reglamento Escolar",
                description: "Normatividad, derechos y obligaciones de estudiantes",
                url: "normatividad.html#reglamento",
                keywords: ["reglamento", "normatividad", "derechos", "obligaciones", "estudiantes"],
                category: "Transparencia"
            },
            {
                title: "Manual de Convivencia",
                description: "Lineamientos para la sana convivencia escolar",
                url: "normatividad.html#convivencia",
                keywords: ["manual", "convivencia", "lineamientos", "sana", "escolar"],
                category: "Transparencia"
            },
            
            // Herramientas y recursos
            {
                title: "Chatbot de Ayuda",
                description: "Asistente virtual para resolver dudas rápidamente",
                url: "#chatbot",
                keywords: ["chatbot", "asistente", "virtual", "ayuda", "dudas", "automático"],
                category: "Herramientas"
            },
            
            // Información académica específica
            {
                title: "Materias del Plan de Estudios",
                description: "Lista completa de materias por semestre y área",
                url: "oferta-educativa.html#plan-estudios",
                keywords: ["materias", "asignaturas", "plan", "estudios", "semestre", "área", "académico", "curricular"],
                category: "Académico"
            },
            {
                title: "Infraestructura del Plantel",
                description: "Instalaciones, aulas, laboratorios y espacios disponibles",
                url: "conocenos.html#infraestructura",
                keywords: ["infraestructura", "instalaciones", "aulas", "laboratorios", "espacios", "plantel", "edificios"],
                category: "Información"
            },
            {
                title: "Video Institucional",
                description: "Conoce nuestra institución a través de nuestro video oficial",
                url: "conocenos.html#video-institucional",
                keywords: ["video", "institucional", "oficial", "presentación", "multimedia"],
                category: "Información"
            },
            
            // ========== SECCIONES ESPECÍFICAS DE CADA PÁGINA ==========
            
            // INDEX.HTML - Secciones principales
            {
                title: "Bienvenida - Mensaje Inicial",
                description: "Mensaje de bienvenida en la página principal",
                url: "index.html#bienvenida",
                keywords: ["bienvenida", "mensaje", "inicial", "principal", "saludo"],
                category: "Inicio"
            },
            {
                title: "Noticias Recientes",
                description: "Últimas noticias y comunicados de la institución",
                url: "index.html#noticias-recientes",
                keywords: ["noticias", "recientes", "comunicados", "últimas", "avisos", "actualizaciones"],
                category: "Noticias"
            },
            {
                title: "Próximos Eventos",
                description: "Calendario de eventos y actividades próximas",
                url: "index.html#proximos-eventos",
                keywords: ["eventos", "próximos", "calendario", "actividades", "fechas"],
                category: "Eventos"
            },
            {
                title: "Testimonios de Egresados",
                description: "Experiencias y testimonios de nuestros graduados",
                url: "index.html#testimonios",
                keywords: ["testimonios", "egresados", "experiencias", "graduados", "éxito"],
                category: "Testimonios"
            },
            {
                title: "Calendario Escolar",
                description: "Fechas importantes del ciclo escolar actual",
                url: "index.html#calendario-escolar",
                keywords: ["calendario", "escolar", "fechas", "importantes", "ciclo"],
                category: "Calendario"
            },
            {
                title: "Mapa del Sitio",
                description: "Navegación completa de todas las páginas del sitio",
                url: "index.html#mapa-sitio",
                keywords: ["mapa", "sitio", "navegación", "páginas", "índice"],
                category: "Navegación"
            },
            
            // ESTUDIANTES.HTML - Secciones específicas
            {
                title: "Portal del Estudiante - Recursos Académicos",
                description: "Herramientas y recursos para el aprendizaje",
                url: "estudiantes.html#recursos-academicos",
                keywords: ["recursos", "académicos", "herramientas", "aprendizaje", "estudiante"],
                category: "Estudiantes"
            },
            {
                title: "Horarios de Clase",
                description: "Consulta tus horarios de clases por semestre",
                url: "estudiantes.html#horarios",
                keywords: ["horarios", "clase", "semestre", "consulta", "programación"],
                category: "Estudiantes"
            },
            {
                title: "Actividades Extracurriculares",
                description: "Deportes, cultura y actividades complementarias",
                url: "estudiantes.html#actividades-extracurriculares",
                keywords: ["actividades", "extracurriculares", "deportes", "cultura", "complementarias"],
                category: "Estudiantes"
            },
            {
                title: "Guía de Supervivencia Académica",
                description: "Tips y consejos para tener éxito en el bachillerato",
                url: "estudiantes.html#guia-supervivencia",
                keywords: ["guía", "supervivencia", "académica", "tips", "consejos", "éxito"],
                category: "Estudiantes"
            },
            
            // PADRES.HTML - Secciones específicas  
            {
                title: "Portal de Padres - Seguimiento Académico",
                description: "Herramientas para dar seguimiento al progreso de sus hijos",
                url: "padres.html#seguimiento-academico",
                keywords: ["seguimiento", "académico", "progreso", "hijos", "padres"],
                category: "Padres"
            },
            {
                title: "Comunicación con Docentes",
                description: "Canales directos de comunicación con los maestros",
                url: "padres.html#comunicacion-docentes",
                keywords: ["comunicación", "docentes", "maestros", "contacto", "diálogo"],
                category: "Padres"
            },
            {
                title: "Eventos y Reuniones",
                description: "Calendarios de juntas y eventos para padres de familia",
                url: "padres.html#eventos-reuniones",
                keywords: ["eventos", "reuniones", "juntas", "padres", "familia"],
                category: "Padres"
            },
            
            // SERVICIOS.HTML - Secciones detalladas
            {
                title: "Servicios Principales",
                description: "Principales servicios ofrecidos por la institución",
                url: "servicios.html#servicios-principales",
                keywords: ["servicios", "principales", "ofrecidos", "institución"],
                category: "Servicios"
            },
            {
                title: "Laboratorio de Ciencias",
                description: "Laboratorio equipado para prácticas de física, química y biología",
                url: "servicios.html#laboratorio-ciencias",
                keywords: ["laboratorio", "ciencias", "física", "química", "biología", "prácticas"],
                category: "Servicios"
            },
            {
                title: "Centro de Cómputo",
                description: "Aulas de informática y tecnología educativa",
                url: "servicios.html#centro-computo",
                keywords: ["centro", "cómputo", "informática", "tecnología", "educativa"],
                category: "Servicios"
            },
            
            // CONVOCATORIAS.HTML
            {
                title: "Convocatorias Vigentes",
                description: "Convocatorias actuales para becas, concursos y programas",
                url: "convocatorias.html#vigentes",
                keywords: ["convocatorias", "vigentes", "becas", "concursos", "programas"],
                category: "Convocatorias"
            },
            {
                title: "Convocatorias de Nuevo Ingreso",
                description: "Procesos de admisión para estudiantes de nuevo ingreso",
                url: "convocatorias.html#nuevo-ingreso",
                keywords: ["nuevo", "ingreso", "admisión", "estudiantes", "proceso"],
                category: "Admisión"
            },
            
            // TRANSPARENCIA.HTML
            {
                title: "Transparencia y Rendición de Cuentas",
                description: "Información pública institucional y rendición de cuentas",
                url: "transparencia.html#rendicion-cuentas",
                keywords: ["transparencia", "rendición", "cuentas", "pública", "información"],
                category: "Transparencia"
            },
            {
                title: "Información Financiera",
                description: "Estados financieros y presupuestos institucionales",
                url: "transparencia.html#informacion-financiera",
                keywords: ["información", "financiera", "estados", "presupuestos", "institucionales"],
                category: "Transparencia"
            },
            
            // TÉRMINOS Y CONDICIONES LEGALES
            {
                title: "Términos y Condiciones",
                description: "Normas de uso y condiciones legales para el acceso y utilización del sitio web",
                url: "terminos.html",
                keywords: ["términos", "condiciones", "uso", "sitio", "web", "legal", "normas", "acceso"],
                category: "Legal"
            },
            {
                title: "Información General - Términos",
                description: "Información general sobre los términos y condiciones del sitio web",
                url: "terminos.html#informacion-general",
                keywords: ["información", "general", "términos", "actualización", "enero", "2024"],
                category: "Legal"
            },
            {
                title: "Definiciones Legales",
                description: "Definiciones de términos clave: La Institución, El Sitio Web, Usuario",
                url: "terminos.html#definiciones",
                keywords: ["definiciones", "institución", "sitio", "web", "usuario", "términos", "clave"],
                category: "Legal"
            },
            {
                title: "Aceptación de Términos",
                description: "Condiciones de aceptación y aplicabilidad de los términos de uso",
                url: "terminos.html#aceptacion-terminos",
                keywords: ["aceptación", "términos", "condiciones", "aplicables", "visitantes", "usuarios"],
                category: "Legal"
            },
            {
                title: "Uso Permitido del Sitio",
                description: "Usos permitidos y prohibidos del sitio web institucional",
                url: "terminos.html#uso-permitido",
                keywords: ["uso", "permitido", "prohibido", "consulta", "inscripción", "servicios", "educativos"],
                category: "Legal"
            },
            {
                title: "Propiedad Intelectual",
                description: "Derechos de autor y propiedad intelectual del contenido del sitio web",
                url: "terminos.html#propiedad-intelectual",
                keywords: ["propiedad", "intelectual", "derechos", "autor", "logotipo", "contenido", "educativo"],
                category: "Legal"
            },
            {
                title: "Responsabilidades del Usuario",
                description: "Compromisos y responsabilidades de los usuarios del sitio web",
                url: "terminos.html#responsabilidades-usuario",
                keywords: ["responsabilidades", "usuario", "compromisos", "información", "veraz", "credenciales"],
                category: "Legal"
            },
            {
                title: "Limitación de Responsabilidad",
                description: "Descargo de responsabilidad y limitaciones de la institución",
                url: "terminos.html#limitacion-responsabilidad",
                keywords: ["limitación", "responsabilidad", "descargo", "disponibilidad", "enlaces", "externos"],
                category: "Legal"
            },
            {
                title: "Modificaciones a los Términos",
                description: "Política de cambios y modificaciones a los términos y condiciones",
                url: "terminos.html#modificaciones-terminos",
                keywords: ["modificaciones", "cambios", "términos", "actualización", "vigencia", "inmediata"],
                category: "Legal"
            },
            {
                title: "Ley Aplicable y Jurisdicción",
                description: "Marco legal y jurisdicción aplicable a los términos y condiciones",
                url: "terminos.html#ley-aplicable-jurisdiccion",
                keywords: ["ley", "aplicable", "jurisdicción", "méxico", "puebla", "tribunales", "competentes"],
                category: "Legal"
            },
            {
                title: "Contacto Legal",
                description: "Información de contacto para consultas legales sobre términos y condiciones",
                url: "terminos.html#contacto-legal",
                keywords: ["contacto", "legal", "consultas", "email", "teléfono", "dirección", "términos"],
                category: "Legal"
            },
            {
                title: "Política de Privacidad",
                description: "Manejo y protección de datos personales",
                url: "privacidad.html",
                keywords: ["privacidad", "datos", "personales", "protección", "manejo"],
                category: "Legal"
            },
            
            // INFORMACIÓN ESPECÍFICA POR INTERESES
            {
                title: "Actividades Deportivas",
                description: "Deportes, competencias y actividad física en el plantel",
                url: "comunidad.html#deportes",
                keywords: ["deportes", "competencias", "actividad", "física", "plantel"],
                category: "Deportes"
            },
            {
                title: "Actividades Culturales",
                description: "Arte, música, teatro y expresión cultural",
                url: "comunidad.html#cultura",
                keywords: ["arte", "música", "teatro", "expresión", "cultural", "cultura"],
                category: "Cultura"
            },
            {
                title: "Orientación Vocacional",
                description: "Apoyo para elección de carrera y orientación profesional",
                url: "servicios.html#orientacion-vocacional",
                keywords: ["orientación", "vocacional", "carrera", "profesional", "apoyo"],
                category: "Servicios"
            },
            
            // INFORMACIÓN DE CONTACTO ESPECÍFICA
            {
                title: "Directorio Telefónico",
                description: "Números de teléfono de todas las áreas administrativas",
                url: "contacto.html#directorio",
                keywords: ["directorio", "telefónico", "números", "teléfono", "administrativas"],
                category: "Contacto"
            },
            {
                title: "Mapa de Ubicación",
                description: "Ubicación exacta del plantel y cómo llegar",
                url: "contacto.html#mapa",
                keywords: ["mapa", "ubicación", "plantel", "llegar", "dirección"],
                category: "Contacto"
            }
        ];
    }

    bindEvents() {
        // Crear referencias para poder remover los listeners
        this.handleInput = (e) => {
            const query = e.target.value.trim();
            
            // Limpiar timer anterior
            if (this.debounceTimer) {
                clearTimeout(this.debounceTimer);
            }

            if (query.length < 2) {
                this.hideResults();
                return;
            }

            // Debounce la búsqueda
            this.debounceTimer = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        };

        this.handleFocus = () => {
            const query = this.searchInput.value.trim();
            if (query.length >= 2) {
                this.performSearch(query);
            }
        };

        this.documentClickListener = (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        };

        this.handleKeydown = (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
                this.searchInput.blur();
            }
        };

        // Agregar los event listeners
        this.searchInput.addEventListener('input', this.handleInput);
        this.searchInput.addEventListener('focus', this.handleFocus);
        document.addEventListener('click', this.documentClickListener);
        this.searchInput.addEventListener('keydown', this.handleKeydown);
    }

    performSearch(query) {
        this.showLoading();

        // Simular delay de búsqueda para mostrar loading
        setTimeout(() => {
            const results = this.search(query);
            this.displayResults(results, query);
        }, 200);
    }

    search(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        const results = [];

        this.searchIndex.forEach(item => {
            let score = 0;
            const titleLower = item.title.toLowerCase();
            const descriptionLower = item.description.toLowerCase();
            const keywordsLower = item.keywords.join(' ').toLowerCase();

            searchTerms.forEach(term => {
                // Puntuación por coincidencias en título (peso mayor)
                if (titleLower.includes(term)) {
                    score += titleLower.startsWith(term) ? 10 : 5;
                }

                // Puntuación por coincidencias en descripción
                if (descriptionLower.includes(term)) {
                    score += 3;
                }

                // Puntuación por coincidencias en keywords
                if (keywordsLower.includes(term)) {
                    score += 2;
                }
            });

            if (score > 0) {
                results.push({
                    ...item,
                    score: score,
                    highlightedTitle: this.highlightText(item.title, searchTerms),
                    highlightedDescription: this.highlightText(item.description, searchTerms)
                });
            }
        });

        // Ordenar por score (mayor a menor)
        return results.sort((a, b) => b.score - a.score).slice(0, 8);
    }

    highlightText(text, terms) {
        let highlightedText = text;
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        return highlightedText;
    }

    showLoading() {
        this.searchResults.classList.remove('d-none');
        this.searchLoading.classList.remove('d-none');
        this.searchContent.innerHTML = '';
    }

    displayResults(results, query) {
        this.searchLoading.classList.add('d-none');

        if (results.length === 0) {
            this.searchContent.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search mb-2"></i>
                    <div>No se encontraron resultados para "<strong>${query}</strong>"</div>
                    <small>Intenta con otros términos de búsqueda</small>
                </div>
            `;
        } else {
            const resultsHtml = results.map((result, index) => {
                if (result.url === '#chatbot') {
                    return `
                        <div class="search-item" data-action="chatbot">
                            <div class="search-item-title">${result.highlightedTitle}</div>
                            <div class="search-item-description">${result.highlightedDescription}</div>
                            <div class="search-item-url">Herramienta Interactiva • ${result.category}</div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="search-item" data-url="${result.url}">
                            <div class="search-item-title">${result.highlightedTitle}</div>
                            <div class="search-item-description">${result.highlightedDescription}</div>
                            <div class="search-item-url">${result.url} • ${result.category}</div>
                        </div>
                    `;
                }
            }).join('');

            this.searchContent.innerHTML = resultsHtml;
            
            // Agregar event listeners a los resultados
            this.attachResultListeners();
        }

        this.searchResults.classList.remove('d-none');
    }

    hideResults() {
        this.searchResults.classList.add('d-none');
    }

    attachResultListeners() {
        const searchItems = this.searchContent.querySelectorAll('.search-item');
        
        searchItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const action = item.getAttribute('data-action');
                const url = item.getAttribute('data-url');
                
                // Limpiar la búsqueda
                this.clearSearch();
                
                if (action === 'chatbot') {
                    this.openChatbot();
                } else if (url) {
                    // Navegar a la URL
                    window.location.href = url;
                }
            });
        });
    }

    clearSearch() {
        this.searchInput.value = '';
        this.hideResults();
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    openChatbot() {
        this.hideResults();
        this.searchInput.value = '';
        
        // Activar el chatbot
        if (typeof toggleChatbot === 'function') {
            toggleChatbot();
        } else {
            // Fallback - buscar el botón del chatbot y hacer clic
            const chatbotToggle = document.getElementById('chatbotToggle');
            if (chatbotToggle) {
                chatbotToggle.click();
            }
        }
    }

    destroy() {
        // Limpiar todos los event listeners y referencias
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.handleInput);
            this.searchInput.removeEventListener('focus', this.handleFocus);
            this.searchInput.removeEventListener('keydown', this.handleKeydown);
        }
        
        if (this.documentClickListener) {
            document.removeEventListener('click', this.documentClickListener);
        }
        
        // Limpiar timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        // Ocultar resultados
        this.hideResults();
        
        //console.log('🔍 Buscador destruido correctamente');
    }
}

// Variable global para acceder al buscador
let siteSearch;

// Función para inicializar el buscador después de que se carguen los partials
function initSiteSearch() {
    // Verificar si los elementos ya existen antes de intentar inicializar
    const searchInput = document.getElementById('siteSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        //console.log('🔍 Elementos de búsqueda encontrados, inicializando...');
        
        // Si ya existe una instancia, destruirla primero
        if (siteSearch && typeof siteSearch.destroy === 'function') {
            siteSearch.destroy();
        }
        
        siteSearch = new SiteSearch();
        return true;
    } else {
        //console.log('🔍 Elementos de búsqueda no encontrados aún, reintentando...');
        return false;
    }
}

// Función para intentar inicializar con reintentos
function tryInitSiteSearch(maxAttempts = 10, delay = 200) {
    let attempts = 0;
    
    const attempt = () => {
        attempts++;
        if (initSiteSearch()) {
            //console.log(`🔍 Búsqueda inicializada exitosamente en intento ${attempts}`);
            return;
        }
        
        if (attempts < maxAttempts) {
            setTimeout(attempt, delay);
        } else {
            //console.log('🔍 No se pudieron encontrar los elementos de búsqueda después de', maxAttempts, 'intentos');
        }
    };
    
    attempt();
}

// Inicializar el buscador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Usar la función con reintentos
    tryInitSiteSearch();
    
    // Configurar el observer para reinicialización automática
    setupSearchObserver();
});

// Función para reinicializar automáticamente el buscador
function reinitializeSearch() {
    //console.log('🔍 Reinicializando sistema de búsqueda...');
    
    // Usar la función con reintentos
    tryInitSiteSearch(5, 100);
}

// Observar cambios en el DOM para reinicializar cuando sea necesario
let searchObserver;
function setupSearchObserver() {
    if (searchObserver) {
        searchObserver.disconnect();
    }
    
    searchObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                // Si se añadieron nodos que podrían contener el buscador
                const addedNodes = Array.from(mutation.addedNodes);
                const hasSearchElements = addedNodes.some(node => 
                    node.nodeType === 1 && 
                    (node.id === 'siteSearch' || 
                     node.id === 'searchResults' || 
                     node.querySelector && (
                         node.querySelector('#siteSearch') || 
                         node.querySelector('#searchResults')
                     ))
                );
                
                if (hasSearchElements) {
                    //console.log('🔍 Elementos de búsqueda detectados en DOM, reinicializando...');
                    setTimeout(reinitializeSearch, 100);
                }
            }
        });
    });
    
    // Observar cambios en el body
    searchObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Exponer funciones globalmente para que puedan ser llamadas desde script.js
window.initSiteSearch = initSiteSearch;
window.tryInitSiteSearch = tryInitSiteSearch;
window.reinitializeSearch = reinitializeSearch;

// Estilos adicionales para el highlight
const searchStyle = document.createElement('style');
searchStyle.textContent = `
    mark {
        background-color: #fff3cd;
        color: #856404;
        padding: 1px 2px;
        border-radius: 2px;
    }
    
    .dark-mode mark {
        background-color: #664d03;
        color: #fff3cd;
    }
`;
document.head.appendChild(searchStyle);