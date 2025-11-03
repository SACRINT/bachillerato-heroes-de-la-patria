// Sistema de búsqueda unificado y avanzado - BGE Héroes de la Patria
(function() {
    'use strict';

    // Configuración del sistema de búsqueda
    const SEARCH_CONFIG = {
        minQueryLength: 2,
        maxResults: 10,
        searchDelay: 300,
        retryInterval: 500,
        maxRetries: 5
    };

    // Base de datos de búsqueda expandida y categorizada
    const unifiedSearchDatabase = [
        // ========== PÁGINAS PRINCIPALES ==========
        {
            id: 'home',
            title: "Inicio",
            desc: "Página principal del Bachillerato General Estatal Héroes de la Patria",
            url: "index.html",
            keywords: "inicio home principal bachillerato heroes patria bienvenida",
            category: "principal",
            priority: 10
        },

        // ========== CONÓCENOS - Secciones completas ==========
        {
            id: 'conocenos',
            title: "Conócenos",
            desc: "Información institucional completa",
            url: "conocenos.html",
            keywords: "conocenos acerca sobre institución información",
            category: "institucional",
            priority: 9
        },
        {
            id: 'historia',
            title: "Historia Institucional",
            desc: "Historia desde 1996 hasta la actualidad",
            url: "conocenos.html#historia",
            keywords: "historia fundación 1996 trayectoria institucional años evolución origen",
            category: "institucional",
            priority: 8
        },
        {
            id: 'mision-vision',
            title: "Misión y Visión",
            desc: "Misión, visión y valores institucionales",
            url: "conocenos.html#mision-vision",
            keywords: "misión visión valores objetivo meta propósito filosofía principios",
            category: "institucional",
            priority: 8
        },
        {
            id: 'organigrama',
            title: "Organigrama",
            desc: "Estructura organizacional y jerarquías administrativas",
            url: "conocenos.html#organigrama",
            keywords: "organigrama estructura organizacional jerarquías administrativas organización personal directivos",
            category: "institucional",
            priority: 7
        },
        {
            id: 'mensaje-director',
            title: "Mensaje del Director",
            desc: "Mensaje oficial del Ing. Samuel Cruz Interial",
            url: "conocenos.html#mensaje-director",
            keywords: "director samuel cruz interial mensaje bienvenida líder autoridades",
            category: "institucional",
            priority: 7
        },
        {
            id: 'infraestructura',
            title: "Infraestructura",
            desc: "Instalaciones, aulas, laboratorios y espacios del plantel",
            url: "conocenos.html#infraestructura",
            keywords: "infraestructura instalaciones aulas laboratorios espacios edificios plantel facilities",
            category: "institucional",
            priority: 7
        },

        // ========== OFERTA EDUCATIVA ==========
        {
            id: 'oferta-educativa',
            title: "Oferta Educativa",
            desc: "Plan de estudios completo del Bachillerato General",
            url: "oferta-educativa.html",
            keywords: "oferta educativa plan estudios materias semestres académico curriculum",
            category: "academico",
            priority: 9
        },
        {
            id: 'modelo-educativo',
            title: "Modelo Educativo",
            desc: "Enfoque educativo por competencias y pilares",
            url: "oferta-educativa.html#modelo-educativo",
            keywords: "modelo competencias educativo pilares metodología enfoque pedagogía",
            category: "academico",
            priority: 8
        },
        {
            id: 'plan-estudios',
            title: "Plan de Estudios",
            desc: "Materias por semestre y áreas de conocimiento",
            url: "oferta-educativa.html#plan-estudios",
            keywords: "plan estudios materias asignaturas semestre áreas curricular mapa",
            category: "academico",
            priority: 8
        },
        {
            id: 'capacitacion-trabajo',
            title: "Capacitación para el Trabajo",
            desc: "Talleres y capacitación técnica especializada",
            url: "oferta-educativa.html#capacitacion-trabajo",
            keywords: "capacitación trabajo talleres técnica especializada oficios habilidades",
            category: "academico",
            priority: 7
        },
        {
            id: 'perfil-egreso',
            title: "Perfil de Egreso",
            desc: "Competencias y habilidades que desarrollarán los estudiantes",
            url: "oferta-educativa.html#perfil-egreso",
            keywords: "perfil egreso competencias habilidades graduado características logros",
            category: "academico",
            priority: 7
        },
        {
            id: 'proceso-admision',
            title: "Proceso de Admisión",
            desc: "Requisitos y pasos para inscribirse al bachillerato",
            url: "oferta-educativa.html#proceso-admision",
            keywords: "admisión inscripción proceso requisitos nuevo ingreso trámites registro",
            category: "servicios",
            priority: 8
        },

        // ========== SERVICIOS ==========
        {
            id: 'servicios',
            title: "Servicios",
            desc: "Servicios institucionales y escolares",
            url: "servicios.html",
            keywords: "servicios institucionales escolares ofrecidos disponibles atención",
            category: "servicios",
            priority: 8
        },
        {
            id: 'citas-online',
            title: "Sistema de Citas Online",
            desc: "Agenda citas con diferentes departamentos",
            url: "citas.html",
            keywords: "citas agenda reservas online departamentos orientación dirección servicios appointment",
            category: "servicios",
            priority: 8
        },
        {
            id: 'pagos',
            title: "Sistema de Pagos",
            desc: "Pagos de colegiaturas y servicios en línea",
            url: "pagos.html",
            keywords: "pagos colegiaturas inscripciones online seguro tarjeta transferencia mensualidades",
            category: "servicios",
            priority: 8
        },
        {
            id: 'descargas',
            title: "Centro de Descargas",
            desc: "Documentos oficiales, formatos y recursos",
            url: "descargas.html",
            keywords: "descargas documentos formatos reglamentos recursos PDF oficiales archivos",
            category: "servicios",
            priority: 7
        },

        // ========== PORTALES ACADÉMICOS ==========
        {
            id: 'estudiantes',
            title: "Portal del Estudiante",
            desc: "Recursos académicos, horarios y herramientas estudiantiles",
            url: "estudiantes.html",
            keywords: "estudiantes portal académico recursos horarios herramientas alumnos",
            category: "portales",
            priority: 9
        },
        {
            id: 'padres',
            title: "Portal de Padres",
            desc: "Seguimiento académico y comunicación familiar",
            url: "padres.html",
            keywords: "padres familia portal seguimiento comunicación académico tutores",
            category: "portales",
            priority: 8
        },
        {
            id: 'calificaciones',
            title: "Plataforma de Calificaciones",
            desc: "Consulta de calificaciones y reportes académicos",
            url: "calificaciones.html",
            keywords: "calificaciones notas académico reportes evaluación boletas seguimiento grades",
            category: "portales",
            priority: 9
        },
        {
            id: 'egresados',
            title: "Portal de Egresados",
            desc: "Servicios exclusivos para graduados",
            url: "egresados.html",
            keywords: "egresados graduados portal servicios exclusivos alumni",
            category: "portales",
            priority: 7
        },
        {
            id: 'bolsa-trabajo',
            title: "Bolsa de Trabajo",
            desc: "Portal de empleos exclusivo para egresados",
            url: "bolsa-trabajo.html",
            keywords: "bolsa trabajo empleos oportunidades laboral egresados CV postular jobs",
            category: "servicios",
            priority: 7
        },

        // ========== COMUNIDAD Y EVENTOS ==========
        {
            id: 'comunidad',
            title: "Comunidad",
            desc: "Vida estudiantil, noticias y actividades comunitarias",
            url: "comunidad.html",
            keywords: "comunidad vida estudiantil noticias actividades eventos participación",
            category: "comunidad",
            priority: 8
        },
        {
            id: 'calendario',
            title: "Calendario Escolar",
            desc: "Fechas importantes y eventos del ciclo escolar",
            url: "calendario.html",
            keywords: "calendario escolar fechas importantes evaluaciones eventos vacaciones períodos",
            category: "academico",
            priority: 8
        },
        {
            id: 'convocatorias',
            title: "Convocatorias",
            desc: "Convocatorias vigentes y procesos institucionales",
            url: "convocatorias.html",
            keywords: "convocatorias vigentes becas concursos programas nuevo ingreso oportunidades",
            category: "servicios",
            priority: 7
        },

        // ========== CONTACTO Y UBICACIÓN ==========
        {
            id: 'contacto',
            title: "Contacto",
            desc: "Información de contacto, ubicación y horarios",
            url: "contacto.html",
            keywords: "contacto ayuda dirección teléfono email ubicación informes comunicación",
            category: "contacto",
            priority: 8
        },

        // ========== DASHBOARD ADMINISTRATIVO ==========
        {
            id: 'admin-dashboard',
            title: "Dashboard Administrativo",
            desc: "Panel de control integral para administradores",
            url: "admin-dashboard.html",
            keywords: "administración dashboard gestión control académico reportes estadísticas admin panel",
            category: "admin",
            priority: 6
        },

        // ========== HERRAMIENTAS ESPECIALES ==========
        {
            id: 'chatbot',
            title: "Chatbot Inteligente",
            desc: "Asistente virtual para resolver dudas las 24 horas",
            url: "#chatbot",
            keywords: "chatbot asistente virtual ayuda dudas automático inteligencia artificial AI",
            category: "herramientas",
            priority: 7
        }
    ];

    // Variables globales del sistema
    let searchTimer = null;
    let retryCount = 0;
    let searchHistory = [];
    let isInitialized = false;

    // ========== FUNCIONES CORE DE BÚSQUEDA ==========

    /**
     * Función principal de búsqueda unificada
     * @param {string} query - Término de búsqueda
     * @returns {Array} Resultados ordenados por relevancia
     */
    function performUnifiedSearch(query) {
        if (!query || query.length < SEARCH_CONFIG.minQueryLength) return [];

        // Normalizar query
        const normalizedQuery = query.toLowerCase().trim();
        const terms = normalizedQuery.split(' ').filter(term => term.length > 0);

        // Buscar en base de datos
        const results = [];

        unifiedSearchDatabase.forEach(item => {
            const score = calculateRelevanceScore(item, terms, normalizedQuery);

            if (score > 0) {
                results.push({
                    ...item,
                    score,
                    highlightedTitle: highlightText(item.title, terms),
                    highlightedDesc: highlightText(item.desc, terms)
                });
            }
        });

        // Ordenar por score y prioridad
        return results
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.priority - a.priority;
            })
            .slice(0, SEARCH_CONFIG.maxResults);
    }

    /**
     * Calcula el score de relevancia para un elemento
     * @param {Object} item - Elemento de la base de datos
     * @param {Array} terms - Términos de búsqueda
     * @param {string} fullQuery - Query completa
     * @returns {number} Score de relevancia
     */
    function calculateRelevanceScore(item, terms, fullQuery) {
        let score = 0;
        const searchText = `${item.title} ${item.desc} ${item.keywords}`.toLowerCase();

        // Coincidencia exacta en título (máxima prioridad)
        if (item.title.toLowerCase().includes(fullQuery)) {
            score += 50;
        }

        // Coincidencia exacta en descripción
        if (item.desc.toLowerCase().includes(fullQuery)) {
            score += 30;
        }

        // Búsqueda por términos individuales
        terms.forEach(term => {
            // Título
            if (item.title.toLowerCase().includes(term)) {
                score += item.title.toLowerCase() === term ? 25 : 15;
            }

            // Descripción
            if (item.desc.toLowerCase().includes(term)) {
                score += 10;
            }

            // Keywords
            if (item.keywords.includes(term)) {
                score += 8;
            }

            // ID del elemento
            if (item.id.includes(term)) {
                score += 12;
            }

            // Categoría
            if (item.category.includes(term)) {
                score += 5;
            }
        });

        // Bonus por prioridad del elemento
        score += item.priority || 0;

        return score;
    }

    /**
     * Resalta los términos de búsqueda en el texto
     * @param {string} text - Texto original
     * @param {Array} terms - Términos a resaltar
     * @returns {string} Texto con términos resaltados
     */
    function highlightText(text, terms) {
        let highlightedText = text;

        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });

        return highlightedText;
    }

    // ========== FUNCIONES DE UI ==========

    /**
     * Crea el HTML de los resultados de búsqueda
     * @param {Array} results - Resultados de búsqueda
     * @param {string} query - Query de búsqueda
     * @returns {string} HTML de resultados
     */
    function createUnifiedResultsHTML(results, query) {
        if (!results.length) {
            return `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    <div>No se encontraron resultados para "<strong>${query}</strong>"</div>
                    <small>Intenta con términos diferentes o más específicos</small>
                    <div class="search-suggestions">
                        <strong>Sugerencias:</strong>
                        <span class="suggestion-tag" onclick="window.searchUnified('estudiantes')">estudiantes</span>
                        <span class="suggestion-tag" onclick="window.searchUnified('calificaciones')">calificaciones</span>
                        <span class="suggestion-tag" onclick="window.searchUnified('servicios')">servicios</span>
                        <span class="suggestion-tag" onclick="window.searchUnified('contacto')">contacto</span>
                    </div>
                </div>
            `;
        }

        // Agrupar por categorías
        const categorizedResults = groupResultsByCategory(results);
        let html = '';

        Object.entries(categorizedResults).forEach(([category, items]) => {
            const categoryName = getCategoryDisplayName(category);
            html += `
                <div class="search-category">
                    <div class="search-category-header">
                        <i class="${getCategoryIcon(category)}"></i>
                        ${categoryName}
                    </div>
                    <div class="search-category-items">
                        ${items.map(createResultItemHTML).join('')}
                    </div>
                </div>
            `;
        });

        return html;
    }

    /**
     * Agrupa resultados por categoría
     * @param {Array} results - Resultados de búsqueda
     * @returns {Object} Resultados agrupados por categoría
     */
    function groupResultsByCategory(results) {
        return results.reduce((groups, item) => {
            const category = item.category || 'otros';
            if (!groups[category]) groups[category] = [];
            groups[category].push(item);
            return groups;
        }, {});
    }

    /**
     * Crea el HTML para un elemento de resultado
     * @param {Object} result - Resultado individual
     * @returns {string} HTML del elemento
     */
    function createResultItemHTML(result) {
        return `
            <div class="search-result-item" data-url="${result.url}" data-id="${result.id}">
                <div class="search-result-content">
                    <div class="search-result-title">${result.highlightedTitle || result.title}</div>
                    <div class="search-result-desc">${result.highlightedDesc || result.desc}</div>
                    <div class="search-result-meta">
                        <span class="search-result-url">${result.url}</span>
                        <span class="search-result-score" title="Relevancia: ${result.score}">
                            ${getRelevanceStars(result.score)}
                        </span>
                    </div>
                </div>
                <div class="search-result-action">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }

    // ========== FUNCIONES AUXILIARES ==========

    /**
     * Obtiene el nombre de display para una categoría
     * @param {string} category - Categoría
     * @returns {string} Nombre de display
     */
    function getCategoryDisplayName(category) {
        const categoryNames = {
            'principal': 'Páginas Principales',
            'institucional': 'Información Institucional',
            'academico': 'Académico',
            'servicios': 'Servicios',
            'portales': 'Portales Estudiantiles',
            'comunidad': 'Comunidad',
            'contacto': 'Contacto',
            'admin': 'Administración',
            'herramientas': 'Herramientas',
            'otros': 'Otros'
        };
        return categoryNames[category] || 'Otros';
    }

    /**
     * Obtiene el icono para una categoría
     * @param {string} category - Categoría
     * @returns {string} Clase CSS del icono
     */
    function getCategoryIcon(category) {
        const categoryIcons = {
            'principal': 'fas fa-home',
            'institucional': 'fas fa-building',
            'academico': 'fas fa-graduation-cap',
            'servicios': 'fas fa-concierge-bell',
            'portales': 'fas fa-portal-enter',
            'comunidad': 'fas fa-users',
            'contacto': 'fas fa-phone',
            'admin': 'fas fa-cogs',
            'herramientas': 'fas fa-tools',
            'otros': 'fas fa-folder'
        };
        return categoryIcons[category] || 'fas fa-file';
    }

    /**
     * Genera estrellas de relevancia
     * @param {number} score - Score de relevancia
     * @returns {string} HTML de estrellas
     */
    function getRelevanceStars(score) {
        const stars = Math.min(5, Math.max(1, Math.ceil(score / 10)));
        return '★'.repeat(stars);
    }

    // ========== MANEJO DE EVENTOS ==========

    /**
     * Maneja el clic en un resultado de búsqueda
     * @param {Event} event - Evento de clic
     */
    function handleUnifiedResultClick(event) {
        const item = event.target.closest('.search-result-item');
        if (!item) return;

        const url = item.getAttribute('data-url');
        const id = item.getAttribute('data-id');

        // Registrar en historial
        addToSearchHistory(id);

        // Navegación especial para elementos específicos
        if (url === '#chatbot') {
            activateChatbot();
        } else if (url && url.startsWith('http')) {
            window.open(url, '_blank');
        } else if (url) {
            window.location.href = url;
        }

        // Limpiar búsqueda
        clearUnifiedSearch();

        // Analytics (si existe)
        if (window.gtag) {
            window.gtag('event', 'search_result_click', {
                'search_term': getCurrentQuery(),
                'result_id': id,
                'result_url': url
            });
        }
    }

    /**
     * Activa el chatbot
     */
    function activateChatbot() {
        const chatbotToggle = document.getElementById('chatbotToggle') ||
                            document.querySelector('.chatbot-toggle') ||
                            document.querySelector('[data-chatbot]');

        if (chatbotToggle) {
            chatbotToggle.click();
        } else {
            // Fallback: mostrar mensaje
            alert('El chatbot se activará en breve. Si no se abre automáticamente, busca el botón de chat en la esquina inferior derecha.');
        }
    }

    /**
     * Limpia la búsqueda
     */
    function clearUnifiedSearch() {
        const input = document.getElementById('siteSearch');
        const results = document.getElementById('searchResults');

        if (input) input.value = '';
        if (results) results.classList.add('d-none');

        if (searchTimer) {
            clearTimeout(searchTimer);
            searchTimer = null;
        }
    }

    /**
     * Muestra los resultados de búsqueda
     * @param {Array} results - Resultados
     * @param {string} query - Query de búsqueda
     */
    function showUnifiedResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        const resultsContent = resultsContainer?.querySelector('.search-content');

        if (!resultsContainer || !resultsContent) {
            console.warn('🔍 Contenedores de búsqueda no encontrados');
            return;
        }

        resultsContent.innerHTML = createUnifiedResultsHTML(results, query);
        resultsContainer.classList.remove('d-none');

        // Agregar event listeners
        resultsContent.removeEventListener('click', handleUnifiedResultClick);
        resultsContent.addEventListener('click', handleUnifiedResultClick);

        // Actualizar contador de resultados
        updateResultsCounter(results.length);
    }

    // ========== HISTORIAL Y ANALYTICS ==========

    /**
     * Agrega un elemento al historial de búsqueda
     * @param {string} id - ID del elemento
     */
    function addToSearchHistory(id) {
        const timestamp = new Date().toISOString();
        searchHistory.push({ id, timestamp });

        // Mantener solo los últimos 50 elementos
        if (searchHistory.length > 50) {
            searchHistory = searchHistory.slice(-50);
        }

        // Guardar en localStorage si está disponible
        try {
            localStorage.setItem('bge_search_history', JSON.stringify(searchHistory));
        } catch (e) {
            console.warn('No se pudo guardar el historial de búsqueda');
        }
    }

    /**
     * Obtiene el query actual
     * @returns {string} Query actual
     */
    function getCurrentQuery() {
        const input = document.getElementById('siteSearch');
        return input ? input.value.trim() : '';
    }

    /**
     * Actualiza el contador de resultados
     * @param {number} count - Número de resultados
     */
    function updateResultsCounter(count) {
        const counter = document.querySelector('.search-results-counter');
        if (counter) {
            counter.textContent = `${count} resultado${count !== 1 ? 's' : ''}`;
        }
    }

    // ========== INICIALIZACIÓN ==========

    /**
     * Inicializa el sistema de búsqueda unificado
     */
    function initUnifiedSearch() {
        const input = document.getElementById('siteSearch');
        const results = document.getElementById('searchResults');

        if (!input || !results) {
            if (retryCount < SEARCH_CONFIG.maxRetries) {
                retryCount++;
                setTimeout(initUnifiedSearch, SEARCH_CONFIG.retryInterval);
                return;
            } else {
                console.error('🔍 No se pudieron encontrar los elementos de búsqueda después de', SEARCH_CONFIG.maxRetries, 'intentos');
                return;
            }
        }

        if (isInitialized) return;

        console.log('🔍 Inicializando sistema de búsqueda unificado BGE...');

        // Event listener para input
        input.addEventListener('input', function(e) {
            const query = e.target.value.trim();

            if (searchTimer) clearTimeout(searchTimer);

            if (query.length < SEARCH_CONFIG.minQueryLength) {
                results.classList.add('d-none');
                return;
            }

            searchTimer = setTimeout(() => {
                const searchResults = performUnifiedSearch(query);
                showUnifiedResults(searchResults, query);

                // Analytics
                if (window.gtag && searchResults.length > 0) {
                    window.gtag('event', 'search', {
                        'search_term': query,
                        'results_count': searchResults.length
                    });
                }
            }, SEARCH_CONFIG.searchDelay);
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                results.classList.add('d-none');
            }
        });

        // Manejo de teclado
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearUnifiedSearch();
                input.blur();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const firstResult = results.querySelector('.search-result-item');
                if (firstResult) {
                    firstResult.click();
                }
            }
        });

        // Marcar como inicializado
        input.dataset.searchInitialized = 'true';
        isInitialized = true;
        retryCount = 0;

        // Cargar historial si existe
        try {
            const savedHistory = localStorage.getItem('bge_search_history');
            if (savedHistory) {
                searchHistory = JSON.parse(savedHistory);
            }
        } catch (e) {
            console.warn('No se pudo cargar el historial de búsqueda');
        }

        console.log('✅ Sistema de búsqueda unificado BGE iniciado correctamente');
    }

    // ========== ESTILOS CSS MEJORADOS ==========

    const unifiedStyles = document.createElement('style');
    unifiedStyles.textContent = `
        /* Estilos para el sistema de búsqueda unificado */
        .search-category {
            margin-bottom: 1rem;
        }

        .search-category-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            font-weight: 600;
            font-size: 0.875rem;
            border-radius: 0.25rem 0.25rem 0 0;
        }

        .search-category-items {
            border: 1px solid #dee2e6;
            border-top: none;
            border-radius: 0 0 0.25rem 0.25rem;
        }

        .search-result-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
        }

        .search-result-item:hover {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            transform: translateX(2px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .search-result-item:last-child {
            border-bottom: none;
        }

        .search-result-content {
            flex: 1;
        }

        .search-result-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 0.25rem;
            font-size: 1rem;
        }

        .search-result-title mark {
            background: #fff3cd;
            color: #856404;
            padding: 0.1rem 0.2rem;
            border-radius: 0.2rem;
        }

        .search-result-desc {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 0.5rem;
            line-height: 1.4;
        }

        .search-result-desc mark {
            background: #d1ecf1;
            color: #0c5460;
            padding: 0.1rem 0.2rem;
            border-radius: 0.2rem;
        }

        .search-result-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.75rem;
        }

        .search-result-url {
            color: #28a745;
            font-family: monospace;
        }

        .search-result-score {
            color: #ffc107;
            font-weight: bold;
        }

        .search-result-action {
            color: #6c757d;
            font-size: 1.2rem;
            margin-left: 1rem;
            transition: all 0.2s ease;
        }

        .search-result-item:hover .search-result-action {
            color: #007bff;
            transform: translateX(3px);
        }

        .search-no-results {
            padding: 3rem 2rem;
            text-align: center;
            color: #6c757d;
        }

        .search-no-results i {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
            color: #dee2e6;
        }

        .search-suggestions {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
        }

        .suggestion-tag {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            margin: 0.25rem;
            background: #e9ecef;
            border-radius: 1rem;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .suggestion-tag:hover {
            background: #007bff;
            color: white;
            transform: translateY(-1px);
        }

        /* Dark mode support */
        .dark-mode .search-category-header {
            background: linear-gradient(135deg, #0056b3, #003d82);
        }

        .dark-mode .search-result-item {
            background: #2d3748;
            border-color: #4a5568;
            color: #e2e8f0;
        }

        .dark-mode .search-result-item:hover {
            background: linear-gradient(135deg, #4a5568, #2d3748);
        }

        .dark-mode .search-result-title {
            color: #63b3ed;
        }

        .dark-mode .search-result-desc {
            color: #a0aec0;
        }

        .dark-mode .search-result-url {
            color: #68d391;
        }

        .dark-mode .search-no-results {
            color: #a0aec0;
        }

        .dark-mode .suggestion-tag {
            background: #4a5568;
            color: #e2e8f0;
        }

        .dark-mode .suggestion-tag:hover {
            background: #63b3ed;
            color: #1a202c;
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .search-result-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .search-result-action {
                align-self: flex-end;
                margin: 0;
            }

            .search-result-meta {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.25rem;
            }
        }

        /* Animaciones */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(1rem);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .search-category {
            animation: fadeInUp 0.3s ease-out;
        }
    `;
    document.head.appendChild(unifiedStyles);

    // ========== API PÚBLICA ==========

    // Exponer funciones globales
    window.searchUnified = function(query) {
        const input = document.getElementById('siteSearch');
        if (input) {
            input.value = query;
            input.dispatchEvent(new Event('input'));
            input.focus();
        }
    };

    window.initUnifiedSearch = initUnifiedSearch;
    window.clearUnifiedSearch = clearUnifiedSearch;

    // ========== INICIALIZACIÓN AUTOMÁTICA ==========

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUnifiedSearch);
    } else {
        initUnifiedSearch();
    }

    // Verificación periódica de inicialización
    const initChecker = setInterval(() => {
        if (!isInitialized) {
            initUnifiedSearch();
        } else {
            clearInterval(initChecker);
        }
    }, 2000);

    console.log('🚀 Sistema de búsqueda unificado BGE cargado');

})();