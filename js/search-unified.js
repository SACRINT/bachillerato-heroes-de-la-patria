/**
 * SISTEMA DE BÚSQUEDA UNIFICADO - BACHILLERATO HÉROES DE LA PATRIA
 * Consolida funcionalidad de search.js y search-simple.js
 * Compatible con todas las páginas existentes
 */

(function() {
    'use strict';
    
    // Base de datos de búsqueda consolidada y completa
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
        { title: "Plataforma de Calificaciones", desc: "Consulta calificaciones y seguimiento académico", url: "calificaciones.html", keywords: "calificaciones notas académico estudiantes seguimiento boletas evaluación" },
        { title: "Centro de Descargas", desc: "Documentos, formularios y recursos descargables", url: "descargas.html", keywords: "descargas documentos formularios recursos pdf archivos" },
        
        // PORTALES ACADÉMICOS
        { title: "Portal Estudiantes", desc: "Acceso exclusivo para estudiantes del bachillerato", url: "estudiantes.html", keywords: "estudiantes portal acceso exclusivo académico recursos" },
        { title: "Portal Padres", desc: "Información y servicios para padres de familia", url: "padres.html", keywords: "padres familia portal información servicios comunicación" },
        { title: "Portal Egresados", desc: "Red de egresados y seguimiento profesional", url: "egresados.html", keywords: "egresados graduados red profesional seguimiento contactos" },
        { title: "Bolsa de Trabajo", desc: "Oportunidades laborales para egresados", url: "bolsa-trabajo.html", keywords: "empleo trabajo oportunidades laborales egresados cv currículum" },
        
        // COMUNIDAD
        { title: "Comunidad", desc: "Noticias, eventos y vida escolar", url: "comunidad.html", keywords: "comunidad noticias eventos vida escolar actividades" },
        { title: "Calendario Escolar", desc: "Fechas importantes y calendario académico", url: "calendario.html", keywords: "calendario escolar fechas importantes académico eventos ciclo" },
        { title: "Convocatorias", desc: "Convocatorias activas e inscripciones", url: "convocatorias.html", keywords: "convocatorias inscripciones admisión nuevo ingreso" },
        
        // INFORMACIÓN INSTITUCIONAL
        { title: "Transparencia", desc: "Información pública y transparencia institucional", url: "transparencia.html", keywords: "transparencia pública información institucional gobierno" },
        { title: "Normatividad", desc: "Reglamentos y normatividad institucional", url: "normatividad.html", keywords: "normatividad reglamentos normas institucional disciplina" },
        { title: "Sitios de Interés", desc: "Enlaces útiles y recursos externos", url: "sitios-interes.html", keywords: "sitios interés enlaces útiles recursos externos universidades" },
        
        // CONTACTO
        { title: "Contacto", desc: "Información de contacto y ubicación", url: "contacto.html", keywords: "contacto teléfono dirección ubicación mapa comunicación" },
        { title: "Dashboard Admin", desc: "Panel de control administrativo", url: "admin-dashboard.html", keywords: "admin administración panel control dashboard gestión" }
    ];

    // Clase unificada de búsqueda que mantiene compatibilidad
    class UnifiedSearch {
        constructor() {
            this.searchInput = document.getElementById('siteSearch');
            this.searchResults = document.getElementById('searchResults');
            
            // Verificar si existen elementos de búsqueda
            if (!this.searchInput || !this.searchResults) {
                return; // Búsqueda no disponible en esta página
            }
            
            this.searchLoading = this.searchResults.querySelector('.search-loading');
            this.searchContent = this.searchResults.querySelector('.search-content');
            this.searchIndex = searchDatabase;
            this.debounceTimer = null;
            this.isSearchVisible = false;

            this.init();
        }

        init() {
            this.setupEventListeners();
            this.setupClickOutside();
        }

        setupEventListeners() {
            // Input de búsqueda
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.performSearch(e.target.value.trim());
                }, 300);
            });

            // Focus y blur
            this.searchInput.addEventListener('focus', () => {
                if (this.searchInput.value.trim()) {
                    this.showResults();
                }
            });

            // Teclas especiales
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideResults();
                    this.searchInput.blur();
                }
            });
        }

        setupClickOutside() {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    this.hideResults();
                }
            });
        }

        performSearch(query) {
            if (!query || query.length < 2) {
                this.hideResults();
                return;
            }

            this.showLoading();

            // Simular delay de búsqueda para mejor UX
            setTimeout(() => {
                const results = this.searchInDatabase(query);
                this.displayResults(results, query);
            }, 100);
        }

        searchInDatabase(query) {
            const normalizedQuery = this.normalizeString(query);
            const queryWords = normalizedQuery.split(' ').filter(word => word.length > 1);

            return this.searchIndex
                .map(item => {
                    let score = 0;
                    const normalizedTitle = this.normalizeString(item.title);
                    const normalizedDesc = this.normalizeString(item.desc);
                    const normalizedKeywords = this.normalizeString(item.keywords);

                    // Coincidencia exacta en título (peso mayor)
                    if (normalizedTitle.includes(normalizedQuery)) {
                        score += normalizedTitle === normalizedQuery ? 100 : 50;
                    }

                    // Coincidencia en palabras del título
                    queryWords.forEach(word => {
                        if (normalizedTitle.includes(word)) {
                            score += 20;
                        }
                        if (normalizedDesc.includes(word)) {
                            score += 10;
                        }
                        if (normalizedKeywords.includes(word)) {
                            score += 15;
                        }
                    });

                    return { ...item, score };
                })
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 8); // Máximo 8 resultados
        }

        normalizeString(str) {
            return str.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                .replace(/[^\w\s]/g, ' ') // Reemplazar puntuación con espacios
                .replace(/\s+/g, ' ') // Múltiples espacios a uno
                .trim();
        }

        displayResults(results, query) {
            this.hideLoading();

            if (results.length === 0) {
                this.showNoResults(query);
                return;
            }

            const resultsHTML = results
                .map(item => this.createResultItem(item, query))
                .join('');

            this.searchContent.innerHTML = resultsHTML;
            this.showResults();

            // Agregar event listeners a los resultados
            this.searchContent.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = item.dataset.url;
                    if (url) {
                        window.location.href = url;
                    }
                });
            });
        }

        createResultItem(item, query) {
            const highlightedTitle = this.highlightText(item.title, query);
            const highlightedDesc = this.highlightText(item.desc, query);

            return `
                <div class="search-item" data-url="${item.url}">
                    <div class="search-item-title">${highlightedTitle}</div>
                    <div class="search-item-description">${highlightedDesc}</div>
                    <div class="search-item-url">${item.url}</div>
                </div>
            `;
        }

        highlightText(text, query) {
            const words = query.toLowerCase().split(' ').filter(word => word.length > 1);
            let highlightedText = text;

            words.forEach(word => {
                const regex = new RegExp(`(${word})`, 'gi');
                highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
            });

            return highlightedText;
        }

        showResults() {
            this.searchResults.classList.remove('d-none');
            this.isSearchVisible = true;
        }

        hideResults() {
            this.searchResults.classList.add('d-none');
            this.isSearchVisible = false;
        }

        showLoading() {
            if (this.searchLoading) {
                this.searchLoading.classList.remove('d-none');
            }
            this.searchContent.innerHTML = '';
            this.showResults();
        }

        hideLoading() {
            if (this.searchLoading) {
                this.searchLoading.classList.add('d-none');
            }
        }

        showNoResults(query) {
            this.searchContent.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search text-muted mb-2"></i>
                    <div>No se encontraron resultados para "<strong>${query}</strong>"</div>
                    <small class="text-muted">Intenta con otras palabras clave</small>
                </div>
            `;
            this.showResults();
        }
    }

    // Función de inicialización que mantiene compatibilidad
    function initializeSearch() {
        // Compatibilidad con ambos enfoques
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                new UnifiedSearch();
            });
        } else {
            new UnifiedSearch();
        }
    }

    // Exportar para compatibilidad
    window.SiteSearch = UnifiedSearch;
    window.initializeSearch = initializeSearch;

    // Auto-inicializar
    initializeSearch();

})();