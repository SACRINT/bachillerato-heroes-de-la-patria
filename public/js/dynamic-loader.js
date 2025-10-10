/**
 * SISTEMA DE CARGA DINÁMICA DE CONTENIDO
 * Carga contenido desde archivos JSON separados a las páginas web
 */

class DynamicContentLoader {
    constructor() {
        console.log('🔄 [LOADER] Inicializando cargador de contenido dinámico...');
        this.apiBase = 'data/';
        this.cache = new Map();
        this.init();
    }

    async init() {
        // Detectar qué página estamos cargando y cargar contenido apropiado
        const path = window.location.pathname;

        if (path.includes('index.html') || path.endsWith('/')) {
            await this.loadHomepageContent();
        } else if (path.includes('comunidad.html')) {
            await this.loadCommunityContent();
        } else if (path.includes('calendario.html')) {
            await this.loadCalendarContent();
        }

        console.log('✅ [LOADER] Contenido dinámico cargado');
    }

    // ==========================================
    // CARGA DE DATOS DESDE JSON
    // ==========================================

    async fetchData(endpoint) {
        if (this.cache.has(endpoint)) {
            return this.cache.get(endpoint);
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.cache.set(endpoint, data);
            return data;
        } catch (error) {
            console.error(`❌ [LOADER] Error cargando ${endpoint}:`, error);
            return null;
        }
    }

    async loadNoticias(limit = null) {
        const data = await this.fetchData('noticias.json');
        if (!data) return [];

        let noticias = data.noticias.filter(n => n.activo);

        if (limit) {
            noticias = noticias.slice(0, limit);
        }

        return noticias.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    async loadEventos(limit = null) {
        const data = await this.fetchData('eventos.json');
        if (!data) return [];

        let eventos = data.eventos ? data.eventos.filter(e => e.activo) : [];

        if (limit) {
            eventos = eventos.slice(0, limit);
        }

        return eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }

    async loadAvisos(limit = null) {
        const data = await this.fetchData('avisos.json');
        if (!data) return [];

        let avisos = data.avisos ? data.avisos.filter(a => a.activo) : [];

        // Filtrar avisos vigentes
        const now = new Date();
        avisos = avisos.filter(aviso => {
            const fechaInicio = new Date(aviso.fechaInicio);
            const fechaFin = aviso.fechaFin ? new Date(aviso.fechaFin) : null;

            return fechaInicio <= now && (!fechaFin || fechaFin >= now);
        });

        if (limit) {
            avisos = avisos.slice(0, limit);
        }

        return avisos.sort((a, b) => {
            // Ordenar por prioridad y luego por fecha
            const prioridadOrder = { 'alta': 3, 'media': 2, 'baja': 1 };
            const prioridadDiff = prioridadOrder[b.prioridad] - prioridadOrder[a.prioridad];
            if (prioridadDiff !== 0) return prioridadDiff;
            return new Date(b.fechaInicio) - new Date(a.fechaInicio);
        });
    }

    async loadComunicados(limit = null) {
        const data = await this.fetchData('comunicados.json');
        if (!data) return [];

        let comunicados = data.comunicados ? data.comunicados.filter(c => c.activo) : [];

        if (limit) {
            comunicados = comunicados.slice(0, limit);
        }

        return comunicados.sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision));
    }

    // ==========================================
    // RENDERIZADO EN INDEX.HTML
    // ==========================================

    async loadHomepageContent() {
        console.log('🏠 [LOADER] Cargando contenido de página principal...');

        // Cargar noticias recientes (máximo 3)
        const noticias = await this.loadNoticias(3);
        this.renderRecentNews(noticias);

        // Cargar próximos eventos (máximo 3)
        const eventos = await this.loadEventos(3);
        this.renderUpcomingEvents(eventos);
    }

    renderRecentNews(noticias) {
        const container = document.getElementById('recent-news');
        if (!container) {
            console.warn('⚠️ [LOADER] Contenedor recent-news no encontrado');
            return;
        }

        if (noticias.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No hay noticias disponibles en este momento.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        noticias.forEach(noticia => {
            const fechaFormateada = this.formatDate(noticia.fecha);
            const imagenSrc = noticia.imagen || 'images/default-news.jpg';

            html += `
                <div class="col-lg-4 col-md-6">
                    <article class="card h-100 border-0 shadow-sm news-card" data-id="${noticia.id}">
                        <div class="card-img-top position-relative overflow-hidden" style="height: 200px;">
                            <img src="${imagenSrc}"
                                 alt="${noticia.titulo}"
                                 class="w-100 h-100 object-fit-cover"
                                 onerror="this.src='images/default.jpg'"
                                 loading="lazy">
                            ${noticia.destacado ? '<span class="badge bg-warning position-absolute top-0 end-0 m-2">Destacada</span>' : ''}
                            <div class="card-overlay position-absolute bottom-0 start-0 end-0 p-3 text-white">
                                <span class="badge bg-primary">${noticia.categoria}</span>
                            </div>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${noticia.titulo}</h5>
                            <p class="card-text text-muted flex-grow-1">${noticia.resumen || noticia.contenido.substring(0, 150) + '...'}</p>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar me-1"></i>${fechaFormateada}
                                    </small>
                                    <small class="text-muted">
                                        <i class="fas fa-user me-1"></i>${noticia.autor}
                                    </small>
                                </div>
                                <button class="btn btn-primary btn-sm mt-2 w-100" onclick="showNoticiaModal('${noticia.id}')">
                                    Leer más <i class="fas fa-arrow-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log(`📰 [LOADER] ${noticias.length} noticias cargadas en homepage`);
    }

    renderUpcomingEvents(eventos) {
        // Buscar contenedor de eventos próximos
        let container = document.getElementById('upcoming-events');

        // Si no existe, crear sección de eventos después de noticias
        if (!container) {
            const newsSection = document.querySelector('#recent-news').closest('section');
            const eventsSection = document.createElement('section');
            eventsSection.className = 'py-5 bg-light';
            eventsSection.innerHTML = `
                <div class="container">
                    <div class="row mb-5">
                        <div class="col-lg-8 mx-auto text-center">
                            <h2 class="fw-bold text-primary mb-3">Próximos Eventos</h2>
                            <p class="lead text-muted">No te pierdas las actividades programadas</p>
                        </div>
                    </div>
                    <div class="row g-4" id="upcoming-events">
                    </div>
                    <div class="row mt-4">
                        <div class="col-12 text-center">
                            <a href="calendario.html" class="btn btn-outline-primary">
                                Ver calendario completo <i class="fas fa-arrow-right ms-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;

            newsSection.parentNode.insertBefore(eventsSection, newsSection.nextSibling);
            container = document.getElementById('upcoming-events');
        }

        if (eventos.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        <i class="fas fa-calendar-times me-2"></i>
                        No hay eventos próximos programados.
                    </div>
                </div>
            `;
            return;
        }

        let html = '';
        eventos.forEach(evento => {
            const fechaFormateada = this.formatDate(evento.fecha);

            html += `
                <div class="col-lg-4 col-md-6">
                    <div class="card h-100 border-0 shadow-sm event-card" data-id="${evento.id}">
                        <div class="card-body">
                            <div class="d-flex align-items-start mb-3">
                                <div class="badge bg-success me-3 p-2">
                                    <i class="fas fa-calendar-alt fa-lg"></i>
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="card-title mb-1">${evento.titulo}</h5>
                                    <p class="text-muted small mb-0">${evento.categoria}</p>
                                </div>
                            </div>

                            <p class="card-text">${evento.descripcion.substring(0, 120)}...</p>

                            <div class="mt-auto">
                                <div class="row g-2 text-sm">
                                    <div class="col-6">
                                        <i class="fas fa-calendar text-primary me-1"></i>
                                        <small>${fechaFormateada}</small>
                                    </div>
                                    <div class="col-6">
                                        <i class="fas fa-clock text-primary me-1"></i>
                                        <small>${evento.hora}</small>
                                    </div>
                                    <div class="col-12">
                                        <i class="fas fa-map-marker-alt text-primary me-1"></i>
                                        <small>${evento.lugar}</small>
                                    </div>
                                </div>
                                <button class="btn btn-outline-success btn-sm mt-3 w-100" onclick="showEventoModal('${evento.id}')">
                                    Ver detalles <i class="fas fa-info-circle ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        console.log(`📅 [LOADER] ${eventos.length} eventos cargados en homepage`);
    }

    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatDateTime(dateString, timeString) {
        const date = this.formatDate(dateString);
        return `${date} a las ${timeString}`;
    }

    // ==========================================
    // MODALES DE DETALLES
    // ==========================================

    async showNoticiaDetails(id) {
        const noticias = await this.loadNoticias();
        const noticia = noticias.find(n => n.id === id);

        if (!noticia) return;

        // Crear modal dinámico
        this.createDetailModal({
            title: noticia.titulo,
            content: noticia.contenido,
            author: noticia.autor,
            date: this.formatDate(noticia.fecha),
            image: noticia.imagen,
            category: noticia.categoria,
            tags: noticia.tags
        });
    }

    createDetailModal({ title, content, author, date, image, category, tags }) {
        const modalId = 'dynamicDetailModal';
        let modal = document.getElementById(modalId);

        if (modal) {
            modal.remove();
        }

        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); border-bottom: none; color: white;">
                            <h5 class="modal-title" style="color: white; font-weight: 600;">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
                                    style="background: transparent; border: none; opacity: 1; filter: none; color: white; width: 32px; height: 32px; position: relative; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center;"
                                    onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">×</button>
                        </div>
                        <div class="modal-body">
                            ${image ? `<img src="${image}" class="img-fluid mb-3 rounded" alt="${title}">` : ''}
                            <div class="mb-3">
                                <span class="badge bg-primary me-2">${category}</span>
                                <small class="text-muted">
                                    <i class="fas fa-user me-1"></i>${author} •
                                    <i class="fas fa-calendar me-1"></i>${date}
                                </small>
                            </div>
                            <div class="content">
                                ${content}
                            </div>
                            ${tags ? `<div class="mt-3">
                                ${tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
                            </div>` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalInstance = new bootstrap.Modal(document.getElementById(modalId));
        modalInstance.show();
    }
}

// ==========================================
// FUNCIONES GLOBALES PARA CALLBACKS
// ==========================================

async function showNoticiaModal(id) {
    if (window.dynamicLoader) {
        await window.dynamicLoader.showNoticiaDetails(id);
    }
}

async function showEventoModal(id) {
    console.log('📅 Mostrar detalles del evento:', id);

    try {
        // Obtener datos del evento
        const data = await window.dynamicLoader.fetchData('eventos.json');
        if (!data) {
            showAlert('Error al cargar los datos del evento', 'error');
            return;
        }

        const evento = data.eventos.find(e => e.id === id);
        if (!evento) {
            showAlert('Evento no encontrado', 'error');
            return;
        }

        // Formatear fecha y hora
        const fechaFormateada = new Date(evento.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Crear modal dinámico
        const modalHTML = `
            <div class="modal fade" id="eventoModal" tabindex="-1" aria-labelledby="eventoModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-success">
                            <h5 class="modal-title text-white fw-bold" id="eventoModalLabel">
                                <i class="fas fa-calendar-alt me-2"></i>${evento.titulo}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div class="row g-3">
                                <!-- Información Principal - Lado Izquierdo -->
                                <div class="col-md-8">
                                    <div class="mb-3">
                                        <h6 class="text-primary mb-2 fw-bold">
                                            <i class="fas fa-info-circle me-2"></i>Descripción del Evento
                                        </h6>
                                        <p class="text-muted mb-0">${evento.descripcion}</p>
                                    </div>

                                    ${evento.requisitos && evento.requisitos.length > 0 ? `
                                    <div class="mt-3">
                                        <h6 class="text-primary mb-2 fw-bold">
                                            <i class="fas fa-list-check me-2"></i>Requisitos
                                        </h6>
                                        <div class="row g-2">
                                            ${evento.requisitos.map(req => `
                                                <div class="col-12">
                                                    <div class="d-flex align-items-start">
                                                        <i class="fas fa-check text-success me-2 mt-1 flex-shrink-0"></i>
                                                        <span class="text-muted small">${req}</span>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>

                                <!-- Detalles Compactos - Lado Derecho -->
                                <div class="col-md-4">
                                    <div class="bg-light rounded p-3 h-100">
                                        <h6 class="text-success mb-3 fw-bold text-center">
                                            <i class="fas fa-clipboard-list me-1"></i>Detalles
                                        </h6>

                                        <div class="row g-2">
                                            <div class="col-12 mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-calendar text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Fecha</div>
                                                        <div class="text-muted" style="font-size: 0.8rem;">${fechaFormateada}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12 mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-clock text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Hora</div>
                                                        <div class="text-muted" style="font-size: 0.8rem;">${evento.hora}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12 mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-map-marker-alt text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Lugar</div>
                                                        <div class="text-muted" style="font-size: 0.8rem;">${evento.lugar}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="col-12 mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-users text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Organizador</div>
                                                        <div class="text-muted" style="font-size: 0.8rem;">${evento.organizador}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            ${evento.cupoMaximo ? `
                                            <div class="col-12 mb-2">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-user-friends text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Cupo</div>
                                                        <div class="text-muted" style="font-size: 0.8rem;">${evento.cupoMaximo} personas</div>
                                                    </div>
                                                </div>
                                            </div>
                                            ` : ''}

                                            <div class="col-12">
                                                <div class="d-flex align-items-center">
                                                    <i class="fas fa-tag text-primary me-2"></i>
                                                    <div class="flex-grow-1">
                                                        <div class="fw-semibold small">Categoría</div>
                                                        <span class="badge bg-success small">${evento.categoria}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            ${evento.inscripcionRequerida ? `
                            <button type="button" class="btn btn-success" onclick="inscribirseEvento('${evento.id}')">
                                <i class="fas fa-user-plus me-2"></i>Inscribirse
                            </button>
                            ` : ''}
                            ${evento.contacto ? `
                            <a href="mailto:${evento.contacto}" class="btn btn-primary">
                                <i class="fas fa-envelope me-2"></i>Contactar
                            </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si existe
        const existingModal = document.getElementById('eventoModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('eventoModal'));
        modal.show();

    } catch (error) {
        console.error('Error al mostrar evento:', error);
        showAlert('Error al cargar los detalles del evento', 'error');
    }
}

// Función para inscribirse a un evento
function inscribirseEvento(eventoId) {
    // Simular proceso de inscripción
    showAlert('¡Inscripción registrada exitosamente! Recibirás más información por correo electrónico.', 'success');

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('eventoModal'));
    if (modal) {
        modal.hide();
    }
}

// Función auxiliar para mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    window.dynamicLoader = new DynamicContentLoader();
});

console.log('📝 [LOADER] dynamic-loader.js cargado exitosamente');