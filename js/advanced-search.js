/**
 * 🔍 SISTEMA DE BÚSQUEDA AVANZADO
 * Motor de búsqueda inteligente con múltiples fuentes y AI
 */

class AdvancedSearch {
    constructor() {
        this.searchIndex = new Map();
        this.searchHistory = [];
        this.searchSuggestions = [];
        this.searchFilters = new Set();
        this.isIndexing = false;
        this.minQueryLength = 2;
        this.maxResults = 50;
        this.debounceTimeout = null;
        
        this.init();
    }

    async init() {
        await this.buildSearchIndex();
        this.setupSearchInterface();
        this.loadSearchHistory();
        this.initVoiceSearch();
        //console.log('🔍 Advanced Search inicializado');
    }

    // ============================================
    // CONSTRUCCIÓN DEL ÍNDICE DE BÚSQUEDA
    // ============================================

    async buildSearchIndex() {
        this.isIndexing = true;
        //console.log('🔨 Construyendo índice de búsqueda...');
        
        await Promise.all([
            this.indexStaticContent(),
            this.indexDynamicContent(),
            this.indexAPIContent()
        ]);
        
        this.isIndexing = false;
        //console.log(`✅ Índice construido: ${this.searchIndex.size} elementos`);
    }

    async indexStaticContent() {
        // Contenido estático de las páginas
        const staticContent = [
            // Páginas principales
            { 
                id: 'home', 
                title: 'Inicio', 
                content: 'Bachillerato General Estatal Héroes de la Patria educación calidad formación integral',
                url: 'index.html', 
                type: 'page',
                category: 'principal',
                weight: 10 
            },
            { 
                id: 'about', 
                title: 'Conócenos', 
                content: 'historia misión visión valores organigrama director infraestructura institucional',
                url: 'conocenos.html', 
                type: 'page',
                category: 'institucional',
                weight: 9 
            },
            { 
                id: 'education', 
                title: 'Oferta Educativa', 
                content: 'plan estudios materias competencias capacitación trabajo perfil egreso admisión',
                url: 'oferta-educativa.html', 
                type: 'page',
                category: 'académico',
                weight: 9 
            },
            { 
                id: 'services', 
                title: 'Servicios', 
                content: 'biblioteca laboratorios becas orientación servicios escolares trámites',
                url: 'servicios.html', 
                type: 'page',
                category: 'servicios',
                weight: 8 
            },
            { 
                id: 'students', 
                title: 'Portal Estudiantes', 
                content: 'recursos académicos horarios actividades extracurriculares calculadora promedio',
                url: 'estudiantes.html', 
                type: 'page',
                category: 'académico',
                weight: 8 
            },
            { 
                id: 'parents', 
                title: 'Portal Padres', 
                content: 'seguimiento académico comunicación docentes progreso hijos familia',
                url: 'padres.html', 
                type: 'page',
                category: 'familia',
                weight: 7 
            },
            { 
                id: 'grades', 
                title: 'Calificaciones', 
                content: 'consulta calificaciones reportes académicos boletas evaluación notas',
                url: 'calificaciones.html', 
                type: 'page',
                category: 'académico',
                weight: 7 
            },
            { 
                id: 'appointments', 
                title: 'Sistema de Citas', 
                content: 'agenda citas online departamentos orientación dirección servicios',
                url: 'citas.html', 
                type: 'feature',
                category: 'servicios',
                weight: 6 
            },
            { 
                id: 'payments', 
                title: 'Sistema de Pagos', 
                content: 'pagos colegiaturas inscripciones online tarjeta transferencia seguro',
                url: 'pagos.html', 
                type: 'feature',
                category: 'servicios',
                weight: 6 
            },
            { 
                id: 'downloads', 
                title: 'Centro de Descargas', 
                content: 'documentos formatos reglamentos recursos PDF oficiales descargar',
                url: 'descargas.html', 
                type: 'feature',
                category: 'servicios',
                weight: 5 
            },
            { 
                id: 'community', 
                title: 'Comunidad', 
                content: 'noticias eventos actividades participación comunidad escolar',
                url: 'comunidad.html', 
                type: 'page',
                category: 'social',
                weight: 5 
            },
            { 
                id: 'graduates', 
                title: 'Egresados', 
                content: 'testimonios egresados éxito profesional logros trayectoria',
                url: 'egresados.html', 
                type: 'page',
                category: 'social',
                weight: 4 
            },
            { 
                id: 'jobs', 
                title: 'Bolsa de Trabajo', 
                content: 'empleo oportunidades laborales trabajos vacantes empresas',
                url: 'bolsa-trabajo.html', 
                type: 'feature',
                category: 'servicios',
                weight: 4 
            },
            { 
                id: 'calendar', 
                title: 'Calendario Escolar', 
                content: 'calendario escolar eventos fechas importantes actividades programación',
                url: 'calendario.html', 
                type: 'feature',
                category: 'académico',
                weight: 6 
            },
            { 
                id: 'contact', 
                title: 'Contacto', 
                content: 'contacto dirección teléfono email ubicación horarios atención',
                url: 'contacto.html', 
                type: 'page',
                category: 'información',
                weight: 7 
            }
        ];

        staticContent.forEach(item => {
            this.addToIndex(item);
        });
    }

    async indexDynamicContent() {
        // Contenido dinámico desde la base de datos
        if (window.apiClient && window.cacheManager) {
            try {
                // Buscar contenido en caché o API
                const cachedContent = await window.cacheManager.get('search_dynamic_content');
                
                if (cachedContent) {
                    this.indexContentArray(cachedContent);
                } else {
                    // Cargar desde API
                    const categories = await window.apiClient.request('/information/categories');
                    if (categories && categories.success) {
                        const dynamicContent = categories.categories.map(cat => ({
                            id: `dynamic_${cat.categoria}`,
                            title: cat.categoria,
                            content: `${cat.categoria} información dinámica actualizada`,
                            url: `#search=${cat.categoria}`,
                            type: 'dynamic',
                            category: 'información',
                            weight: 5,
                            lastUpdated: cat.last_updated
                        }));
                        
                        this.indexContentArray(dynamicContent);
                        
                        // Cachear para siguiente búsqueda
                        await window.cacheManager.set('search_dynamic_content', dynamicContent, {
                            storage: 'localStorage',
                            ttl: 60 * 60 * 1000 // 1 hora
                        });
                    }
                }
            } catch (error) {
                console.warn('Error indexando contenido dinámico:', error);
            }
        }
    }

    async indexAPIContent() {
        // Contenido específico de funcionalidades
        const apiContent = [
            {
                id: 'chatbot',
                title: 'Chatbot Asistente',
                content: 'chatbot asistente virtual ayuda consultas respuestas automáticas inteligente',
                url: '#chatbot',
                type: 'feature',
                category: 'herramientas',
                weight: 8
            },
            {
                id: 'login',
                title: 'Iniciar Sesión',
                content: 'login acceso cuenta usuario contraseña autenticación sesión',
                url: '#login',
                type: 'feature',
                category: 'cuenta',
                weight: 6
            },
            {
                id: 'dashboard',
                title: 'Dashboard Administrativo',
                content: 'dashboard administración panel control gestión estadísticas',
                url: 'admin-dashboard.html',
                type: 'feature',
                category: 'admin',
                weight: 5,
                requireAuth: true
            }
        ];

        apiContent.forEach(item => {
            this.addToIndex(item);
        });
    }

    indexContentArray(contentArray) {
        contentArray.forEach(item => this.addToIndex(item));
    }

    addToIndex(item) {
        // Tokenizar contenido
        const tokens = this.tokenize(`${item.title} ${item.content}`);
        
        // Crear entrada de índice
        const indexEntry = {
            ...item,
            tokens: tokens,
            searchableText: `${item.title} ${item.content}`.toLowerCase(),
            indexedAt: Date.now()
        };

        this.searchIndex.set(item.id, indexEntry);
        
        // Actualizar filtros disponibles
        this.searchFilters.add(item.category);
        this.searchFilters.add(item.type);
    }

    tokenize(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remover acentos
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length >= 2);
    }

    // ============================================
    // BÚSQUEDA INTELIGENTE
    // ============================================

    async search(query, options = {}) {
        const {
            category = null,
            type = null,
            limit = this.maxResults,
            fuzzy = true,
            includeContent = false
        } = options;

        if (query.length < this.minQueryLength) {
            return {
                results: [],
                suggestions: this.getSearchSuggestions(query),
                totalResults: 0,
                searchTime: 0
            };
        }

        const startTime = performance.now();
        
        // Tokenizar query
        const queryTokens = this.tokenize(query);
        const results = [];

        // Buscar en índice
        for (const [id, item] of this.searchIndex.entries()) {
            // Filtros
            if (category && item.category !== category) continue;
            if (type && item.type !== type) continue;
            if (item.requireAuth && !this.isAuthenticated()) continue;

            // Calcular relevancia
            const relevance = this.calculateRelevance(queryTokens, item, query);
            
            if (relevance > 0) {
                results.push({
                    ...item,
                    relevance,
                    matchedTokens: this.getMatchedTokens(queryTokens, item.tokens),
                    snippet: includeContent ? this.generateSnippet(query, item) : null
                });
            }
        }

        // Ordenar por relevancia y peso
        results.sort((a, b) => {
            const scoreA = a.relevance * a.weight;
            const scoreB = b.relevance * b.weight;
            return scoreB - scoreA;
        });

        // Limitar resultados
        const limitedResults = results.slice(0, limit);
        const searchTime = performance.now() - startTime;

        // Guardar en historial
        this.addToHistory(query, limitedResults.length);

        return {
            results: limitedResults,
            suggestions: fuzzy ? this.getFuzzySuggestions(query, results) : [],
            totalResults: results.length,
            searchTime: searchTime,
            filters: {
                availableCategories: [...new Set(results.map(r => r.category))],
                availableTypes: [...new Set(results.map(r => r.type))]
            }
        };
    }

    calculateRelevance(queryTokens, item, originalQuery) {
        let score = 0;
        const itemTokens = item.tokens;
        const title = item.title.toLowerCase();
        const content = item.searchableText;

        // Coincidencia exacta en título (peso alto)
        if (title.includes(originalQuery.toLowerCase())) {
            score += 100;
        }

        // Coincidencia de tokens
        queryTokens.forEach(queryToken => {
            // Coincidencia exacta en tokens
            if (itemTokens.includes(queryToken)) {
                score += 10;
            }
            
            // Coincidencia parcial (fuzzy)
            itemTokens.forEach(itemToken => {
                if (itemToken.includes(queryToken) && itemToken !== queryToken) {
                    score += 5;
                }
            });
            
            // Coincidencia en título (peso medio)
            if (title.includes(queryToken)) {
                score += 15;
            }
            
            // Coincidencia en contenido
            if (content.includes(queryToken)) {
                score += 3;
            }
        });

        // Bonus por múltiples coincidencias
        const matchedTokens = queryTokens.filter(qt => 
            itemTokens.some(it => it.includes(qt))
        );
        
        if (matchedTokens.length > 1) {
            score += matchedTokens.length * 5;
        }

        // Penalización por edad (para contenido dinámico)
        if (item.lastUpdated) {
            const ageInDays = (Date.now() - new Date(item.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
            if (ageInDays > 30) {
                score *= 0.9; // Reducir relevancia de contenido viejo
            }
        }

        return score;
    }

    getMatchedTokens(queryTokens, itemTokens) {
        return queryTokens.filter(qt => 
            itemTokens.some(it => it.includes(qt))
        );
    }

    generateSnippet(query, item, maxLength = 150) {
        const content = item.content;
        const queryLower = query.toLowerCase();
        const contentLower = content.toLowerCase();
        
        const index = contentLower.indexOf(queryLower);
        if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + query.length + 50);
            const snippet = content.substring(start, end);
            
            return start > 0 ? '...' + snippet + '...' : snippet + '...';
        }
        
        return content.substring(0, maxLength) + '...';
    }

    // ============================================
    // SUGERENCIAS Y AUTOCOMPLETADO
    // ============================================

    getSearchSuggestions(partial) {
        if (partial.length < 1) return [];

        const suggestions = [];
        const partialLower = partial.toLowerCase();

        // Buscar en títulos
        for (const item of this.searchIndex.values()) {
            if (item.title.toLowerCase().includes(partialLower)) {
                suggestions.push({
                    text: item.title,
                    type: 'title',
                    category: item.category
                });
            }
        }

        // Buscar en historial
        this.searchHistory
            .filter(h => h.query.toLowerCase().includes(partialLower))
            .forEach(h => {
                suggestions.push({
                    text: h.query,
                    type: 'history',
                    frequency: h.frequency
                });
            });

        // Remover duplicados y limitar
        const uniqueSuggestions = suggestions
            .filter((s, i, arr) => arr.findIndex(a => a.text === s.text) === i)
            .slice(0, 8);

        return uniqueSuggestions;
    }

    getFuzzySuggestions(query, results) {
        if (results.length > 0) return [];

        // Sugerencias basadas en errores comunes
        const fuzzySuggestions = [];
        const queryLower = query.toLowerCase();

        // Correcciones ortográficas simples
        const corrections = {
            'bachillerato': ['bachiller', 'bachilleato', 'bachilerato'],
            'estudiantes': ['estudiante', 'estudiant'],
            'servicios': ['servicio', 'servicios'],
            'calificaciones': ['calificacion', 'calificar', 'notas'],
            'horarios': ['horario', 'hora', 'tiempo']
        };

        Object.keys(corrections).forEach(correct => {
            corrections[correct].forEach(incorrect => {
                if (queryLower.includes(incorrect)) {
                    fuzzySuggestions.push(`¿Quisiste decir "${correct}"?`);
                }
            });
        });

        return fuzzySuggestions.slice(0, 3);
    }

    // ============================================
    // BÚSQUEDA POR VOZ
    // ============================================

    initVoiceSearch() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'es-ES';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.performVoiceSearch(transcript);
            };

            this.recognition.onerror = (event) => {
                console.warn('Error de reconocimiento de voz:', event.error);
            };
        }
    }

    async performVoiceSearch(query) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = query;
            await this.performSearch(query);
        }
    }

    startVoiceSearch() {
        if (this.recognition) {
            this.recognition.start();
        }
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    setupSearchInterface() {
        this.createSearchModal();
        this.attachSearchListeners();
        this.setupKeyboardShortcuts();
    }

    createSearchModal() {
        const modalHTML = `
            <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <div class="w-100">
                                <div class="search-input-container">
                                    <div class="input-group">
                                        <input type="text" class="form-control form-control-lg border-0" 
                                               id="advancedSearchInput" 
                                               placeholder="Buscar en el sitio..."
                                               autocomplete="off">
                                        <button class="btn btn-outline-secondary" type="button" id="voiceSearchBtn" title="Búsqueda por voz">
                                            <i class="fas fa-microphone"></i>
                                        </button>
                                    </div>
                                    <div class="search-filters mt-2" id="searchFilters" style="display: none;">
                                        <div class="d-flex flex-wrap gap-2">
                                            <button class="btn btn-sm btn-outline-primary filter-btn" data-filter="all">Todos</button>
                                            <button class="btn btn-sm btn-outline-secondary filter-btn" data-filter="académico">Académico</button>
                                            <button class="btn btn-sm btn-outline-secondary filter-btn" data-filter="servicios">Servicios</button>
                                            <button class="btn btn-sm btn-outline-secondary filter-btn" data-filter="institucional">Institucional</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body pt-2">
                            <div id="searchResults">
                                <div class="search-placeholder text-center text-muted py-5">
                                    <i class="fas fa-search fa-3x mb-3"></i>
                                    <h5>Busca cualquier cosa en nuestro sitio</h5>
                                    <p>Encuentra páginas, servicios, información académica y más</p>
                                    <div class="search-shortcuts">
                                        <small class="text-muted">
                                            Atajos: <kbd>Ctrl</kbd> + <kbd>K</kbd> para abrir búsqueda
                                        </small>
                                    </div>
                                </div>
                            </div>
                            <div id="searchSuggestions" class="mt-3" style="display: none;"></div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <div class="w-100 d-flex justify-content-between align-items-center">
                                <small class="text-muted" id="searchStats"></small>
                                <div class="search-powered-by">
                                    <small class="text-muted">
                                        <i class="fas fa-bolt me-1"></i>
                                        Búsqueda avanzada
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachSearchListeners() {
        const searchInput = document.getElementById('advancedSearchInput');
        const voiceBtn = document.getElementById('voiceSearchBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimeout);
                this.debounceTimeout = setTimeout(() => {
                    this.handleSearchInput(e.target.value);
                }, 300);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.startVoiceSearch();
            });
        }

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
                this.performSearch(searchInput.value);
            });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K para abrir búsqueda
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }
            
            // Escape para cerrar
            if (e.key === 'Escape') {
                this.closeSearchModal();
            }
        });
    }

    async handleSearchInput(query) {
        if (query.length < this.minQueryLength) {
            this.showSuggestions(this.getSearchSuggestions(query));
            return;
        }

        await this.performSearch(query);
    }

    async performSearch(query) {
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter;
        const options = {};
        
        if (activeFilter && activeFilter !== 'all') {
            options.category = activeFilter;
        }

        const results = await this.search(query, options);
        this.displayResults(results, query);
    }

    displayResults(results, query) {
        const resultsContainer = document.getElementById('searchResults');
        const statsContainer = document.getElementById('searchStats');
        
        if (results.results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-no-results text-center py-4">
                    <i class="fas fa-search fa-2x text-muted mb-3"></i>
                    <h6>No se encontraron resultados para "${query}"</h6>
                    <p class="text-muted">Intenta con otros términos de búsqueda</p>
                    ${results.suggestions.length > 0 ? `
                        <div class="suggestions mt-3">
                            <small class="text-muted">Sugerencias:</small>
                            <div class="mt-2">
                                ${results.suggestions.map(s => `
                                    <button class="btn btn-sm btn-outline-primary me-1 mb-1" 
                                            onclick="window.advancedSearch.performSearch('${s}')">${s}</button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            const resultsHTML = results.results.map(result => `
                <div class="search-result-item mb-3 p-3 border rounded">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                <a href="${result.url}" class="text-decoration-none">
                                    ${this.highlightMatches(result.title, query)}
                                </a>
                                <span class="badge bg-secondary ms-2 small">${result.category}</span>
                            </h6>
                            ${result.snippet ? `<p class="text-muted small mb-1">${this.highlightMatches(result.snippet, query)}</p>` : ''}
                            <div class="search-result-meta">
                                <small class="text-muted">
                                    <i class="fas fa-link me-1"></i>${result.url}
                                    <span class="ms-3">
                                        <i class="fas fa-star me-1"></i>Relevancia: ${Math.round(result.relevance)}%
                                    </span>
                                </small>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="window.location.href='${result.url}'">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            resultsContainer.innerHTML = resultsHTML;
        }

        // Actualizar estadísticas
        statsContainer.textContent = `${results.totalResults} resultados en ${results.searchTime.toFixed(2)}ms`;
    }

    highlightMatches(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('searchSuggestions');
        
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const suggestionsHTML = suggestions.map(suggestion => `
            <button class="btn btn-sm btn-outline-secondary me-1 mb-1" 
                    onclick="window.advancedSearch.performSearch('${suggestion.text}')">
                <i class="fas fa-${suggestion.type === 'history' ? 'history' : 'search'} me-1"></i>
                ${suggestion.text}
            </button>
        `).join('');

        suggestionsContainer.innerHTML = `
            <div class="search-suggestions">
                <small class="text-muted">Sugerencias:</small>
                <div class="mt-2">${suggestionsHTML}</div>
            </div>
        `;
        suggestionsContainer.style.display = 'block';
    }

    setActiveFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-secondary');
        });
        
        const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('btn-outline-secondary');
            activeBtn.classList.add('active', 'btn-primary');
        }
    }

    openSearchModal() {
        const modal = new bootstrap.Modal(document.getElementById('searchModal'));
        modal.show();
        
        setTimeout(() => {
            document.getElementById('advancedSearchInput').focus();
        }, 500);
    }

    closeSearchModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
        if (modal) {
            modal.hide();
        }
    }

    // ============================================
    // HISTORIAL DE BÚSQUEDAS
    // ============================================

    addToHistory(query, resultCount) {
        const existing = this.searchHistory.find(h => h.query.toLowerCase() === query.toLowerCase());
        
        if (existing) {
            existing.frequency++;
            existing.lastSearched = Date.now();
            existing.lastResultCount = resultCount;
        } else {
            this.searchHistory.unshift({
                query,
                frequency: 1,
                firstSearched: Date.now(),
                lastSearched: Date.now(),
                lastResultCount: resultCount
            });
        }

        // Limitar historial a 50 elementos
        if (this.searchHistory.length > 50) {
            this.searchHistory.pop();
        }

        this.saveSearchHistory();
    }

    loadSearchHistory() {
        const stored = localStorage.getItem('search_history');
        if (stored) {
            try {
                this.searchHistory = JSON.parse(stored);
            } catch (error) {
                this.searchHistory = [];
            }
        }
    }

    saveSearchHistory() {
        localStorage.setItem('search_history', JSON.stringify(this.searchHistory));
    }

    clearSearchHistory() {
        this.searchHistory = [];
        localStorage.removeItem('search_history');
    }

    // ============================================
    // UTILIDADES
    // ============================================

    isAuthenticated() {
        return window.authInterface && window.authInterface.isAuthenticated();
    }

    async reindex() {
        //console.log('🔄 Reindexando contenido...');
        this.searchIndex.clear();
        await this.buildSearchIndex();
    }

    getSearchStats() {
        return {
            indexSize: this.searchIndex.size,
            historySize: this.searchHistory.length,
            availableFilters: [...this.searchFilters],
            mostSearched: this.searchHistory
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 10)
                .map(h => ({ query: h.query, frequency: h.frequency }))
        };
    }
}

// Inicializar búsqueda avanzada
document.addEventListener('DOMContentLoaded', () => {
    window.advancedSearch = new AdvancedSearch();
});

// Estilos adicionales para la búsqueda
const searchStyles = document.createElement('style');
searchStyles.textContent = `
    .search-input-container input {
        border-radius: 25px;
        padding: 12px 20px;
        font-size: 1.1rem;
    }
    
    .search-result-item {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .search-result-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .search-filters .filter-btn {
        transition: all 0.2s ease;
    }
    
    .search-filters .filter-btn.active {
        transform: scale(1.05);
    }
    
    mark {
        background-color: #fff3cd;
        padding: 1px 2px;
        border-radius: 2px;
    }
    
    .search-suggestions button {
        transition: all 0.2s ease;
    }
    
    .search-suggestions button:hover {
        transform: translateY(-1px);
    }
    
    .search-placeholder {
        opacity: 0.7;
    }
    
    kbd {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 0.875em;
        color: #495057;
    }
`;

document.head.appendChild(searchStyles);