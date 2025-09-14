// Sistema dinámico de noticias para Bachillerato Héroes de la Patria
class NewsManager {
    constructor() {
        this.newsContainer = document.getElementById('noticiasContainer');
        this.currentFilter = 'all';
        this.currentPage = 1;
        this.newsPerPage = 6;
        this.allNews = [];
        this.filteredNews = [];
        
        this.initializeNews();
        this.setupEventListeners();
    }

    initializeNews() {
        // Base de datos de noticias (en una implementación real, esto vendría de una API o CMS)
        this.allNews = [
            {
                id: 1,
                title: "Proyecto CTIM Destacado en Feria Estatal",
                excerpt: "Nuestro equipo estudiantil obtuvo el primer lugar en la Feria Estatal de Ciencias con su innovador proyecto sobre energías renovables.",
                content: `El proyecto titulado "Sistema de Captación de Energía Solar para Escuelas Rurales" fue desarrollado por estudiantes de sexto semestre bajo la supervisión de nuestros docentes especializados. La propuesta incluye un diseño sustentable y de bajo costo que puede implementarse en comunidades con recursos limitados.

Felicitamos a todo el equipo participante y a los docentes que los acompañaron en este proceso. Este reconocimiento reafirma nuestro compromiso con una educación de calidad que prepara a nuestros estudiantes para los desafíos del futuro.

El proyecto será presentado próximamente en el Congreso Nacional de Jóvenes Investigadores, representando al estado de Puebla.`,
                date: "2025-01-15",
                category: "logros",
                featured: true,
                image: "images/noticias/proyecto-ctim.webp",
                badges: ["Destacado", "Logros Académicos"]
            },
            {
                id: 2,
                title: "Proceso de Inscripciones 2025",
                excerpt: "Inician las inscripciones para el ciclo escolar 2025. Conoce los requisitos, fechas importantes y el proceso de selección.",
                content: `El proceso de inscripciones para el ciclo escolar 2025-2026 ha iniciado oficialmente. Los aspirantes pueden registrarse en línea o acudir directamente a nuestras instalaciones.

**Fechas importantes:**
- Pre-registro en línea: Del 1 al 28 de febrero
- Examen de admisión: 15 y 16 de marzo
- Publicación de resultados: 30 de marzo
- Inscripciones: Del 1 al 15 de abril

Los requisitos incluyen certificado de secundaria, acta de nacimiento, CURP y comprobante de domicilio. Para más información, consulta nuestra página de servicios escolares.`,
                date: "2024-12-15",
                category: "avisos",
                featured: false,
                image: "images/noticias/inscripciones-2025.webp",
                badges: ["Importante", "Inscripciones"]
            },
            {
                id: 3,
                title: "Festival Cultural de Primavera",
                excerpt: "Celebramos la diversidad cultural con presentaciones de danza, música y teatro de nuestros estudiantes.",
                content: `El Festival Cultural de Primavera 2025 será un evento especial donde nuestros estudiantes mostrarán sus talentos artísticos. El evento incluye:

**Programación:**
- Danza folklórica mexicana
- Presentaciones musicales
- Obras teatrales estudiantiles
- Exposición de artes plásticas
- Concursos literarios

La entrada es gratuita y toda la comunidad está invitada. Los fondos recaudados se destinarán al mejoramiento de nuestros espacios culturales.`,
                date: "2025-01-20",
                category: "eventos",
                featured: false,
                image: "images/noticias/festival-cultural.webp",
                badges: ["Próximo", "Cultura"]
            },
            {
                id: 4,
                title: "Nuevas Becas Disponibles",
                excerpt: "Abrimos convocatoria para becas de excelencia académica y apoyo socioeconómico para el semestre actual.",
                content: `Se encuentra abierta la convocatoria para diferentes tipos de becas que apoyan a nuestros estudiantes:

**Tipos de becas:**
- Beca de Excelencia Académica (promedio 9.5+)
- Beca de Apoyo Socioeconómico
- Beca Deportiva y Cultural
- Beca de Liderazgo Estudiantil

Los estudiantes interesados pueden acudir a la oficina de servicios escolares para obtener más información sobre requisitos y proceso de aplicación. La fecha límite es el 15 de febrero.`,
                date: "2025-01-10",
                category: "avisos",
                featured: false,
                image: "images/noticias/becas-2025.webp",
                badges: ["Oportunidad", "Becas"]
            },
            {
                id: 5,
                title: "Torneo Interescolar de Matemáticas",
                excerpt: "Nuestros estudiantes participarán en el torneo regional representando al plantel con orgullo.",
                content: `Un grupo selecto de nuestros mejores estudiantes en matemáticas participará en el Torneo Regional Interescolar que se realizará en la ciudad de Puebla.

**Detalles del evento:**
- Fecha: 25 y 26 de enero de 2025
- Participantes: 8 estudiantes seleccionados
- Categorías: Álgebra, Geometría, y Cálculo
- Modalidad: Individual y por equipos

Deseamos el mayor éxito a nuestros representantes. Este torneo es una excelente oportunidad para demostrar el nivel académico de nuestra institución.`,
                date: "2025-01-08",
                category: "eventos",
                featured: false,
                image: "images/noticias/torneo-matematicas.webp",
                badges: ["Competencia", "Académico"]
            },
            {
                id: 6,
                title: "Ceremonia de Honores a la Bandera",
                excerpt: "Celebramos mensualmente nuestros valores cívicos con la participación de toda la comunidad estudiantil.",
                content: `Cada mes realizamos nuestra ceremonia cívica donde honramos a nuestros símbolos patrios y reconocemos a estudiantes destacados.

**Reconocimientos del mes:**
- Mejor promedio por grupo
- Estudiante más colaborativo
- Mejor proyecto de investigación
- Participación en actividades extracurriculares

La ceremonia se realiza en el patio principal con la participación de nuestra escolta y banda de guerra. Es un momento importante para fortalecer los valores cívicos y el orgullo institucional.`,
                date: "2025-01-05",
                category: "actividades",
                featured: false,
                image: "images/noticias/honores-bandera.webp",
                badges: ["Cívico", "Mensual"]
            },
            {
                id: 7,
                title: "Graduación Generación 2024",
                excerpt: "Celebramos el logro de nuestros egresados en una emotiva ceremonia de graduación.",
                content: `La Generación 2024 culminó exitosamente sus estudios de bachillerato en una emotiva ceremonia donde 156 estudiantes recibieron su certificado de estudios.

**Estadísticas de la generación:**
- 156 estudiantes graduados
- Promedio general: 8.7
- 23 estudiantes con mención honorífica
- 95% continuará estudios superiores

Felicitamos a todos nuestros egresados y sus familias por este importante logro. Les deseamos el mayor éxito en su próxima etapa educativa y profesional.`,
                date: "2024-07-15",
                category: "graduaciones",
                featured: false,
                image: "images/noticias/graduacion-2024.webp",
                badges: ["Graduación", "Logro"]
            },
            {
                id: 8,
                title: "Simulacro Nacional 2025",
                excerpt: "Participamos en el simulacro nacional de sismo fortaleciendo nuestra cultura de prevención.",
                content: `Como parte del programa nacional de protección civil, realizamos exitosamente el simulacro de evacuación con la participación de toda la comunidad educativa.

**Resultados del simulacro:**
- Tiempo de evacuación: 2 minutos 15 segundos
- Participación: 100% de la comunidad
- Puntos de reunión activados correctamente
- Brigadas de emergencia operativas

Este ejercicio refuerza nuestro compromiso con la seguridad y nos permite mejorar continuamente nuestros protocolos de emergencia.`,
                date: "2024-09-19",
                category: "actividades",
                featured: false,
                image: "images/noticias/simulacro-2025.webp",
                badges: ["Seguridad", "Prevención"]
            }
        ];

        this.filteredNews = [...this.allNews];
        this.renderNews();
        this.createFilterButtons();
    }

    setupEventListeners() {
        // Buscador de noticias
        const searchInput = document.getElementById('newsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchNews(e.target.value);
            });
        }

        // Botón "Cargar más"
        const loadMoreBtn = document.getElementById('loadMoreNews');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMore();
            });
        }
    }

    createFilterButtons() {
        const filterContainer = document.getElementById('newsFilters');
        if (!filterContainer) return;

        const categories = [
            { key: 'all', label: 'Todas', icon: 'fas fa-th-large' },
            { key: 'logros', label: 'Logros', icon: 'fas fa-trophy' },
            { key: 'avisos', label: 'Avisos', icon: 'fas fa-bullhorn' },
            { key: 'eventos', label: 'Eventos', icon: 'fas fa-calendar' },
            { key: 'actividades', label: 'Actividades', icon: 'fas fa-users' },
            { key: 'graduaciones', label: 'Graduaciones', icon: 'fas fa-graduation-cap' }
        ];

        const buttonsHTML = categories.map(cat => `
            <button class="btn ${cat.key === 'all' ? 'btn-primary' : 'btn-outline-primary'} btn-sm me-2 mb-2 filter-btn" 
                    data-filter="${cat.key}">
                <i class="${cat.icon} me-1"></i>
                ${cat.label}
            </button>
        `).join('');

        filterContainer.innerHTML = buttonsHTML;

        // Event listeners para filtros
        filterContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.filterNews(e.target.dataset.filter);
                
                // Actualizar botones activos
                filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('btn-primary');
                    btn.classList.add('btn-outline-primary');
                });
                e.target.classList.remove('btn-outline-primary');
                e.target.classList.add('btn-primary');
            }
        });
    }

    filterNews(category) {
        this.currentFilter = category;
        this.currentPage = 1;
        
        if (category === 'all') {
            this.filteredNews = [...this.allNews];
        } else {
            this.filteredNews = this.allNews.filter(news => news.category === category);
        }
        
        this.renderNews();
    }

    searchNews(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredNews = [...this.allNews];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredNews = this.allNews.filter(news => 
                news.title.toLowerCase().includes(term) ||
                news.excerpt.toLowerCase().includes(term) ||
                news.content.toLowerCase().includes(term) ||
                news.badges.some(badge => badge.toLowerCase().includes(term))
            );
        }
        
        this.currentPage = 1;
        this.renderNews();
    }

    renderNews() {
        const newsToShow = this.filteredNews.slice(0, this.currentPage * this.newsPerPage);
        
        if (newsToShow.length === 0) {
            this.newsContainer.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No se encontraron noticias que coincidan con los criterios de búsqueda.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        
        newsToShow.forEach((news, index) => {
            if (news.featured && index === 0) {
                html += this.createFeaturedNewsHTML(news);
            } else {
                html += this.createRegularNewsHTML(news);
            }
        });

        this.newsContainer.innerHTML = html;
        
        // Mostrar/ocultar botón "Cargar más"
        const loadMoreBtn = document.getElementById('loadMoreNews');
        if (loadMoreBtn) {
            if (newsToShow.length < this.filteredNews.length) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.innerHTML = `
                    <i class="fas fa-plus me-2"></i>
                    Cargar más noticias (${this.filteredNews.length - newsToShow.length} restantes)
                `;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    createFeaturedNewsHTML(news) {
        const formattedDate = this.formatDate(news.date);
        const badges = news.badges.map(badge => `
            <span class="badge bg-success-subtle text-success me-1 mb-1">${badge}</span>
        `).join('');

        return `
            <div class="col-12 news-item featured-news" data-id="${news.id}">
                <div class="card border-0 shadow-sm">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-lg-8">
                                <div class="d-flex align-items-start">
                                    <div class="news-badge bg-success text-white me-3">
                                        <i class="fas fa-star" aria-hidden="true"></i>
                                    </div>
                                    <div>
                                        <h3 class="card-title text-primary mb-2">${news.title}</h3>
                                        <p class="card-meta text-muted mb-3">
                                            <i class="fas fa-calendar-alt me-2" aria-hidden="true"></i>
                                            ${formattedDate}
                                            <span class="mx-2">•</span>
                                            <i class="fas fa-tag me-2" aria-hidden="true"></i>
                                            ${this.getCategoryName(news.category)}
                                        </p>
                                        <div class="mb-2">${badges}</div>
                                        <p class="card-text">${news.excerpt}</p>
                                        <div class="collapse" id="noticiaCompleta${news.id}">
                                            <div class="mt-3 news-content">
                                                ${this.formatContent(news.content)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-4 text-center">
                                <img src="${news.image}" alt="${news.title}" class="img-fluid rounded shadow-sm" 
                                     onerror="this.src='images/galeria/placeholder_actividad.webp'">
                            </div>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-outline-primary btn-sm" type="button" 
                                    data-bs-toggle="collapse" data-bs-target="#noticiaCompleta${news.id}" 
                                    aria-expanded="false" onclick="this.querySelector('i').classList.toggle('fa-chevron-down'); this.querySelector('i').classList.toggle('fa-chevron-up');">
                                <i class="fas fa-chevron-down me-2" aria-hidden="true"></i>
                                <span class="toggle-text">Leer más</span>
                            </button>
                            <button class="btn btn-outline-success btn-sm ms-2" onclick="newsManager.shareNews(${news.id})">
                                <i class="fas fa-share-alt me-2"></i>
                                Compartir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createRegularNewsHTML(news) {
        const formattedDate = this.formatDate(news.date);
        const badges = news.badges.slice(0, 2).map(badge => `
            <span class="badge bg-primary-subtle text-primary me-1 mb-1">${badge}</span>
        `).join('');

        const categoryColors = {
            'logros': 'success',
            'avisos': 'warning',
            'eventos': 'info',
            'actividades': 'primary',
            'graduaciones': 'secondary'
        };

        const badgeColor = categoryColors[news.category] || 'primary';

        return `
            <div class="col-lg-6 news-item" data-id="${news.id}">
                <div class="card h-100 border-0 shadow-sm hover-lift">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="news-badge bg-${badgeColor} text-white me-3">
                                <i class="fas fa-${this.getCategoryIcon(news.category)}" aria-hidden="true"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h4 class="card-title">${news.title}</h4>
                                <p class="card-meta text-muted">
                                    <i class="fas fa-calendar-alt me-2" aria-hidden="true"></i>
                                    ${formattedDate}
                                </p>
                            </div>
                        </div>
                        <div class="mb-2">${badges}</div>
                        <p class="card-text">${news.excerpt}</p>
                        <div class="mt-auto">
                            <button class="btn btn-outline-primary btn-sm" onclick="newsManager.showNewsModal(${news.id})">
                                <i class="fas fa-eye me-2" aria-hidden="true"></i>
                                Leer más
                            </button>
                            <button class="btn btn-outline-success btn-sm ms-1" onclick="newsManager.shareNews(${news.id})">
                                <i class="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    formatContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    getCategoryName(category) {
        const names = {
            'logros': 'Logros Académicos',
            'avisos': 'Avisos Importantes',
            'eventos': 'Eventos',
            'actividades': 'Actividades',
            'graduaciones': 'Graduaciones'
        };
        return names[category] || 'General';
    }

    getCategoryIcon(category) {
        const icons = {
            'logros': 'trophy',
            'avisos': 'bullhorn',
            'eventos': 'calendar',
            'actividades': 'users',
            'graduaciones': 'graduation-cap'
        };
        return icons[category] || 'newspaper';
    }

    loadMore() {
        this.currentPage++;
        this.renderNews();
    }

    showNewsModal(newsId) {
        const news = this.allNews.find(n => n.id === newsId);
        if (!news) return;

        const modal = this.createNewsModal(news);
        document.body.appendChild(modal);
        
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    createNewsModal(news) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.tabIndex = -1;
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${news.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <p class="text-muted mb-3">
                                    <i class="fas fa-calendar-alt me-2"></i>
                                    ${this.formatDate(news.date)}
                                    <span class="mx-2">•</span>
                                    <i class="fas fa-tag me-2"></i>
                                    ${this.getCategoryName(news.category)}
                                </p>
                                <div class="news-content">
                                    ${this.formatContent(news.content)}
                                </div>
                            </div>
                            <div class="col-md-4">
                                <img src="${news.image}" alt="${news.title}" class="img-fluid rounded" 
                                     onerror="this.src='images/galeria/placeholder_actividad.webp'">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" onclick="newsManager.shareNews(${news.id})">
                            <i class="fas fa-share-alt me-2"></i>
                            Compartir
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    shareNews(newsId) {
        const news = this.allNews.find(n => n.id === newsId);
        if (!news) return;

        const shareData = {
            title: `${news.title} - BGE Héroes de la Patria`,
            text: news.excerpt,
            url: `${window.location.origin}${window.location.pathname}#noticia-${newsId}`
        };

        if (navigator.share && navigator.canShare(shareData)) {
            navigator.share(shareData)
                .then(() => //console.log('Noticia compartida exitosamente'))
                .catch((error) => //console.log('Error al compartir:', error));
        } else {
            this.fallbackShare(shareData);
        }
    }

    fallbackShare(shareData) {
        const textToCopy = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
        
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                this.showToast('Información de la noticia copiada al portapapeles', 'success');
            });
        } else {
            // Fallback para navegadores más antiguos
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showToast('Información de la noticia copiada al portapapeles', 'success');
            } catch (err) {
                this.showToast('No se pudo copiar la información', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    showToast(message, type) {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        const bootstrapToast = new bootstrap.Toast(toast);
        bootstrapToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => toast.remove());
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1100';
        document.body.appendChild(container);
        return container;
    }
}

// Inicializar el gestor de noticias cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.newsManager = new NewsManager();
});