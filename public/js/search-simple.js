// Sistema de búsqueda simple y robusto
(function() {
    'use strict';
    
    // Base de datos de búsqueda expandida y completa
    const searchDatabase = [
        // ========== PÁGINAS PRINCIPALES ==========
        { title: "Inicio", desc: "Página principal del Bachillerato General Estatal Héroes de la Patria", url: "index.html", keywords: "inicio home principal bachillerato heroes patria bienvenida" },
        
        // CONÓCENOS - Secciones completas
        { title: "Conócenos", desc: "Información institucional completa", url: "conocenos.html", keywords: "conocenos acerca sobre institución información" },
        { title: "Historia Institucional", desc: "Historia desde 1996 hasta la actualidad", url: "conocenos.html#historia", keywords: "historia fundación 1996 trayectoria institucional años evolución" },
        { title: "Misión y Visión", desc: "Misión, visión y valores institucionales", url: "conocenos.html#mision-vision", keywords: "misión visión valores objetivo meta propósito filosofía" },
        { title: "Organigrama", desc: "Estructura organizacional y jerarquías administrativas", url: "conocenos.html#organigrama", keywords: "organigrama estructura organizacional jerarquías administrativas organización personal" },
        { title: "Mensaje del Director", desc: "Mensaje oficial del Ing. Samuel Cruz Interial", url: "conocenos.html#mensaje-director", keywords: "director samuel cruz interial mensaje bienvenida líder" },
        { title: "Infraestructura", desc: "Instalaciones, aulas, laboratorios y espacios del plantel", url: "conocenos.html#infraestructura", keywords: "infraestructura instalaciones aulas laboratorios espacios edificios plantel" },
        { title: "Video Institucional", desc: "Video oficial de presentación de la institución", url: "conocenos.html#video-institucional", keywords: "video institucional multimedia presentación oficial" },
        
        // OFERTA EDUCATIVA - Completa
        { title: "Oferta Educativa", desc: "Plan de estudios completo del Bachillerato General", url: "oferta-educativa.html", keywords: "oferta educativa plan estudios materias semestres académico" },
        { title: "Modelo Educativo", desc: "Enfoque educativo por competencias y pilares", url: "oferta-educativa.html#modelo-educativo", keywords: "modelo competencias educativo pilares metodología enfoque" },
        { title: "Plan de Estudios", desc: "Materias por semestre y áreas de conocimiento", url: "oferta-educativa.html#plan-estudios", keywords: "plan estudios materias asignaturas semestre áreas curricular" },
        { title: "Capacitación para el Trabajo", desc: "Talleres y capacitación técnica especializada", url: "oferta-educativa.html#capacitacion-trabajo", keywords: "capacitación trabajo talleres técnica especializada oficios" },
        { title: "Perfil de Egreso", desc: "Competencias y habilidades que desarrollarán los estudiantes", url: "oferta-educativa.html#perfil-egreso", keywords: "perfil egreso competencias habilidades graduado características" },
        { title: "Proceso de Admisión", desc: "Requisitos y pasos para inscribirse al bachillerato", url: "oferta-educativa.html#proceso-admision", keywords: "admisión inscripción proceso requisitos nuevo ingreso trámites" },
        
        // SERVICIOS - Expandido
        { title: "Servicios", desc: "Servicios institucionales y escolares", url: "servicios.html", keywords: "servicios institucionales escolares ofrecidos disponibles" },
        { title: "Sistema de Citas Online", desc: "Agenda citas con diferentes departamentos", url: "citas.html", keywords: "citas agenda reservas online departamentos orientación dirección servicios" },
        { title: "Sistema de Pagos", desc: "Pagos de colegiaturas y servicios en línea", url: "pagos.html", keywords: "pagos colegiaturas inscripciones online seguro tarjeta transferencia" },
        { title: "Centro de Descargas", desc: "Documentos oficiales, formatos y recursos", url: "descargas.html", keywords: "descargas documentos formatos reglamentos recursos PDF oficiales" },
        { title: "Servicios Escolares", desc: "Trámites, certificados y constancias", url: "servicios.html#servicios-principales", keywords: "servicios escolares trámites certificados constancias documentos oficiales" },
        { title: "Biblioteca", desc: "Acervo bibliográfico y recursos digitales", url: "servicios.html#biblioteca", keywords: "biblioteca libros acervo estudio préstamos recursos digitales" },
        { title: "Laboratorios", desc: "Laboratorio de ciencias, cómputo y talleres", url: "servicios.html#laboratorios", keywords: "laboratorios ciencias cómputo talleres equipos prácticas" },
        { title: "Becas y Apoyos", desc: "Programas de becas y apoyo económico", url: "servicios.html#becas", keywords: "becas apoyos económico aprovechamiento programas ayuda financiera" },
        { title: "Orientación Vocacional", desc: "Apoyo para elección de carrera profesional", url: "servicios.html#orientacion-vocacional", keywords: "orientación vocacional carrera profesional apoyo elección" },
        
        // PORTALES ACADÉMICOS
        { title: "Portal del Estudiante", desc: "Recursos académicos, horarios y herramientas estudiantiles", url: "estudiantes.html", keywords: "estudiantes portal académico recursos horarios herramientas" },
        { title: "Recursos Académicos", desc: "Materiales y herramientas de aprendizaje", url: "estudiantes.html#recursos-academicos", keywords: "recursos académicos materiales aprendizaje herramientas" },
        { title: "Horarios de Clase", desc: "Consulta de horarios por semestre y grupo", url: "estudiantes.html#horarios", keywords: "horarios clase semestre grupo consulta programación" },
        { title: "Actividades Extracurriculares", desc: "Deportes, cultura y actividades complementarias", url: "estudiantes.html#actividades-extracurriculares", keywords: "actividades extracurriculares deportes cultura complementarias" },
        { title: "Calculadora de Promedio", desc: "Herramienta para calcular promedios académicos", url: "estudiantes.html#calculadora", keywords: "calculadora promedio calificaciones notas matemáticas" },
        { title: "Técnicas de Estudio", desc: "Consejos y métodos para mejorar el rendimiento", url: "estudiantes.html#tecnicas", keywords: "técnicas estudio aprendizaje métodos consejos rendimiento" },
        
        { title: "Portal de Padres", desc: "Seguimiento académico y comunicación", url: "padres.html", keywords: "padres familia portal seguimiento comunicación académico" },
        { title: "Seguimiento Académico", desc: "Herramientas para dar seguimiento al progreso", url: "padres.html#seguimiento-academico", keywords: "seguimiento académico progreso hijos padres" },
        { title: "Comunicación con Docentes", desc: "Canales directos con los maestros", url: "padres.html#comunicacion-docentes", keywords: "comunicación docentes maestros contacto diálogo" },
        
        { title: "Plataforma de Calificaciones", desc: "Consulta de calificaciones y reportes académicos", url: "calificaciones.html", keywords: "calificaciones notas académico reportes evaluación boletas seguimiento" },
        
        { title: "Portal de Egresados", desc: "Servicios exclusivos para graduados", url: "egresados.html", keywords: "egresados graduados portal servicios exclusivos" },
        { title: "Bolsa de Trabajo", desc: "Portal de empleos exclusivo para egresados", url: "bolsa-trabajo.html", keywords: "bolsa trabajo empleos oportunidades laboral egresados CV postular" },
        { title: "Testimonios de Egresados", desc: "Experiencias y casos de éxito", url: "egresados.html#testimonios-egresados", keywords: "testimonios egresados experiencias éxito casos graduados" },
        
        // COMUNIDAD Y EVENTOS
        { title: "Comunidad", desc: "Vida estudiantil, noticias y actividades", url: "comunidad.html", keywords: "comunidad vida estudiantil noticias actividades eventos" },
        { title: "Noticias", desc: "Noticias y comunicados recientes", url: "comunidad.html#noticias", keywords: "noticias comunicados recientes avisos actualizaciones" },
        { title: "Noticias Recientes", desc: "Últimas noticias de la institución", url: "index.html#noticias-recientes", keywords: "noticias recientes últimas comunicados avisos" },
        { title: "Eventos", desc: "Eventos y actividades institucionales", url: "comunidad.html#eventos", keywords: "eventos actividades calendario próximos fechas" },
        { title: "Próximos Eventos", desc: "Calendario de eventos próximos", url: "index.html#proximos-eventos", keywords: "próximos eventos calendario actividades fechas" },
        { title: "Galería", desc: "Galería fotográfica de eventos y actividades", url: "comunidad.html#galeria", keywords: "galería fotos imágenes eventos actividades fotografías" },
        { title: "Testimonios", desc: "Testimonios de la comunidad educativa", url: "comunidad.html#testimonios", keywords: "testimonios experiencias comunidad educativa" },
        { title: "Vida Estudiantil", desc: "Actividades y experiencias estudiantiles", url: "comunidad.html#vida-estudiantil", keywords: "vida estudiantil experiencias actividades cultura" },
        
        // ACTIVIDADES ESPECÍFICAS
        { title: "Actividades Deportivas", desc: "Deportes y competencias", url: "comunidad.html#deportes", keywords: "deportes actividades físicas competencias equipos" },
        { title: "Actividades Culturales", desc: "Arte, música, teatro y cultura", url: "comunidad.html#cultura", keywords: "cultura arte música teatro expresión cultural" },
        
        // INFORMACIÓN INSTITUCIONAL
        { title: "Transparencia", desc: "Información pública y rendición de cuentas", url: "transparencia.html", keywords: "transparencia rendición cuentas pública información financiera" },
        { title: "Información Financiera", desc: "Estados financieros y presupuestos", url: "transparencia.html#informacion-financiera", keywords: "información financiera estados presupuestos institucionales" },
        { title: "Normatividad", desc: "Reglamentos, lineamientos y normativa legal", url: "normatividad.html", keywords: "normatividad reglamentos lineamientos normas legal reglamento" },
        { title: "Reglamento Escolar", desc: "Reglamento interno de la institución", url: "normatividad.html#reglamento", keywords: "reglamento escolar interno normas estudiantes" },
        { title: "Manual de Convivencia", desc: "Lineamientos para la sana convivencia", url: "normatividad.html#convivencia", keywords: "manual convivencia lineamientos sana escolar" },
        
        { title: "Calendario Escolar", desc: "Fechas importantes del ciclo escolar", url: "calendario.html", keywords: "calendario escolar fechas importantes evaluaciones eventos vacaciones" },
        { title: "Convocatorias", desc: "Convocatorias vigentes y procesos", url: "convocatorias.html", keywords: "convocatorias vigentes becas concursos programas nuevo ingreso" },
        { title: "Sitios de Interés", desc: "Enlaces externos de utilidad", url: "sitios-interes.html", keywords: "sitios interés enlaces externos utilidad recursos" },
        
        // CONTACTO Y UBICACIÓN
        { title: "Contacto", desc: "Información de contacto y ubicación", url: "contacto.html", keywords: "contacto ayuda dirección teléfono email ubicación" },
        { title: "Ubicación", desc: "Dirección y ubicación del plantel", url: "contacto.html#ubicacion", keywords: "ubicación dirección plantel coronel tito hernández puebla" },
        { title: "Directorio Telefónico", desc: "Números telefónicos de departamentos", url: "contacto.html#directorio", keywords: "directorio telefónico números teléfono departamentos" },
        { title: "Horarios de Atención", desc: "Lunes a Viernes de 8:00 AM a 1:30 PM", url: "contacto.html#horarios", keywords: "horarios atención servicios 8:00 1:30 lunes viernes" },
        { title: "Mapa de Ubicación", desc: "Mapa interactivo de ubicación", url: "contacto.html#mapa", keywords: "mapa ubicación interactivo llegar dirección" },
        
        // DASHBOARD ADMINISTRATIVO
        { title: "Dashboard Administrativo", desc: "Panel de control integral para administradores", url: "admin-dashboard.html", keywords: "administración dashboard gestión control académico reportes estadísticas admin" },
        { title: "Gestión de Estudiantes", desc: "Administración de expedientes estudiantiles", url: "admin-dashboard.html#estudiantes", keywords: "gestión estudiantes expedientes matrículas administración" },
        { title: "Gestión de Docentes", desc: "Administración del personal académico", url: "admin-dashboard.html#docentes", keywords: "gestión docentes personal académico administración maestros" },
        { title: "Reportes Estadísticos", desc: "Generación de reportes institucionales", url: "admin-dashboard.html#reportes", keywords: "reportes estadísticos generación institucionales datos" },
        
        // AYUDA Y SOPORTE
        { title: "Preguntas Frecuentes", desc: "Respuestas a las dudas más comunes", url: "index.html#faq", keywords: "faq preguntas frecuentes ayuda dudas respuestas" },
        { title: "Quejas y Sugerencias", desc: "Formulario para comentarios y sugerencias", url: "index.html#quejas-sugerencias", keywords: "quejas sugerencias comentarios formulario buzón" },
        { title: "Mapa del Sitio", desc: "Navegación completa del sitio web", url: "index.html#mapa-sitio", keywords: "mapa sitio navegación páginas índice" },
        
        // HERRAMIENTAS
        { title: "Chatbot", desc: "Asistente virtual para resolver dudas", url: "#chatbot", keywords: "chatbot asistente virtual ayuda dudas automático" },
        
        // LEGALES
        { title: "Términos y Condiciones", desc: "Términos de uso del sitio web", url: "terminos.html", keywords: "términos condiciones uso sitio web legal" },
        { title: "Política de Privacidad", desc: "Manejo y protección de datos personales", url: "privacidad.html", keywords: "privacidad datos personales protección manejo" }
    ];
    
    let searchTimer = null;
    
    // Función principal de búsqueda
    function performSearch(query) {
        if (!query || query.length < 2) return [];
        
        const terms = query.toLowerCase().split(' ').filter(t => t.length > 0);
        const results = [];
        
        searchDatabase.forEach(item => {
            let score = 0;
            const searchText = (item.title + ' ' + item.desc + ' ' + item.keywords).toLowerCase();
            
            terms.forEach(term => {
                if (item.title.toLowerCase().includes(term)) score += 10;
                if (item.desc.toLowerCase().includes(term)) score += 5;
                if (item.keywords.includes(term)) score += 3;
            });
            
            if (score > 0) {
                results.push({ ...item, score });
            }
        });
        
        return results.sort((a, b) => b.score - a.score).slice(0, 8);
    }
    
    // Crear HTML de resultados
    function createResultsHTML(results, query) {
        if (!results.length) {
            return `<div class="search-no-results">
                <i class="fas fa-search"></i>
                <div>No se encontraron resultados para "<strong>${query}</strong>"</div>
                <small>Intenta con otros términos</small>
            </div>`;
        }
        
        return results.map(result => `
            <div class="search-result-item" data-url="${result.url}">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-desc">${result.desc}</div>
                <div class="search-result-url">${result.url}</div>
            </div>
        `).join('');
    }
    
    // Manejar clic en resultado
    function handleResultClick(event) {
        const item = event.target.closest('.search-result-item');
        if (!item) return;
        
        const url = item.getAttribute('data-url');
        if (url === '#chatbot') {
            // Activar chatbot
            const chatbotToggle = document.getElementById('chatbotToggle');
            if (chatbotToggle) chatbotToggle.click();
        } else if (url) {
            window.location.href = url;
        }
        
        // Limpiar búsqueda
        clearSearch();
    }
    
    // Limpiar búsqueda
    function clearSearch() {
        const input = document.getElementById('siteSearch');
        const results = document.getElementById('searchResults');
        
        if (input) input.value = '';
        if (results) results.classList.add('d-none');
        
        if (searchTimer) {
            clearTimeout(searchTimer);
            searchTimer = null;
        }
    }
    
    // Mostrar resultados
    function showResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        const resultsContent = resultsContainer?.querySelector('.search-content');
        
        if (!resultsContainer || !resultsContent) return;
        
        resultsContent.innerHTML = DOMPurify.sanitize(createResultsHTML(results, query));
        resultsContainer.classList.remove('d-none');
        
        // Agregar listeners a los resultados
        resultsContent.addEventListener('click', handleResultClick);
    }
    
    // Inicializar búsqueda
    function initSearch() {
        const input = document.getElementById('siteSearch');
        const results = document.getElementById('searchResults');
        
        if (!input || !results) {
            // Reintentar en 500ms
            setTimeout(initSearch, 500);
            return;
        }
        
        //void 0;
        
        // Event listener para input
        input.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            if (searchTimer) clearTimeout(searchTimer);
            
            if (query.length < 2) {
                results.classList.add('d-none');
                return;
            }
            
            searchTimer = setTimeout(() => {
                const searchResults = performSearch(query);
                showResults(searchResults, query);
            }, 300);
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) {
                results.classList.add('d-none');
            }
        });
        
        // ESC para cerrar
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearSearch();
                input.blur();
            }
        });
    }
    
    // Estilos CSS adicionales
    const style = document.createElement('style');
    style.textContent = `
        .search-no-results {
            padding: 2rem;
            text-align: center;
            color: #6c757d;
        }
        
        .search-no-results i {
            font-size: 2rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .search-result-item {
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .search-result-item:hover {
            background-color: #f8f9fa;
        }
        
        .search-result-item:last-child {
            border-bottom: none;
        }
        
        .search-result-title {
            font-weight: 600;
            color: #007bff;
            margin-bottom: 4px;
        }
        
        .search-result-desc {
            font-size: 0.875rem;
            color: #6c757d;
            margin-bottom: 4px;
        }
        
        .search-result-url {
            font-size: 0.75rem;
            color: #28a745;
        }
        
        /* Dark mode */
        .dark-mode .search-result-item {
            border-color: #404040;
        }
        
        .dark-mode .search-result-item:hover {
            background-color: #404040;
        }
        
        .dark-mode .search-result-desc {
            color: #a0aec0;
        }
        
        .dark-mode .search-no-results {
            color: #a0aec0;
        }
    `;
    document.head.appendChild(style);
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
    
    // Reinicializar cada 2 segundos si no está funcionando
    setInterval(() => {
        const input = document.getElementById('siteSearch');
        if (input && !input.dataset.searchInitialized) {
            input.dataset.searchInitialized = 'true';
            initSearch();
        }
    }, 2000);
    
    // Exponer función global para reinicialización manual
    window.initSimpleSearch = initSearch;
    
})();