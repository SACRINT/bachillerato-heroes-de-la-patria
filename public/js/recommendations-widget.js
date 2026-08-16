/**
 * 🎯 RECOMMENDATIONS WIDGET - FRONTEND CLIENT
 * SEMANA 19 - Machine Learning Recommendation Engine
 *
 * Cliente JavaScript para sistema de recomendaciones personalizadas
 *
 * Uso:
 * const widget = new RecommendationsWidget();
 * await widget.loadRecommendations('courses', containerElement);
 *
 * Fecha: 17 Noviembre 2025
 * Estado: ✅ PRODUCTION-READY
 */

class RecommendationsWidget {
  constructor(options = {}) {
    this.apiBaseUrl = options.apiBaseUrl || '/api/recommendations';
    this.limit = options.limit || 10;
    this.theme = options.theme || 'light';
    this.language = options.language || 'es';

    // Cache de recomendaciones
    this.cache = {
      courses: null,
      materials: null,
      activities: null,
      resources: null
    };

    // Tiempo de vida del cache (5 minutos)
    this.cacheLifetime = 5 * 60 * 1000;
    this.cacheTimestamps = {};
  }

  // ===========================================================================
  // CARGAR RECOMENDACIONES
  // ===========================================================================

  /**
   * Carga recomendaciones personalizadas para el usuario actual
   * @param {string} type - Tipo: 'courses', 'materials', 'activities', 'resources'
   * @param {number} limit - Cantidad de recomendaciones (default: 10)
   * @returns {Promise<Array>} Array de recomendaciones
   */
  async loadRecommendations(type, limit = this.limit) {
    try {
      // Verificar cache
      if (this.isCacheValid(type)) {
        void 0;
        return this.cache[type];
      }

      const response = await fetch(`${this.apiBaseUrl}/${type}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Guardar en cache
      this.cache[type] = data.recommendations;
      this.cacheTimestamps[type] = Date.now();

      void 0;

      return data.recommendations;

    } catch (error) {
      console.error(`[RECOMMENDATIONS] Error loading ${type}:`, error);

      // Fallback: Cargar items populares
      return await this.loadPopularItems(type, limit);
    }
  }

  /**
   * Carga items populares (fallback cuando falla ML)
   * @param {string} type - Tipo de item
   * @param {number} limit - Cantidad
   * @returns {Promise<Array>} Items populares
   */
  async loadPopularItems(type, limit = this.limit) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/popular/${type}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      void 0;

      return data.popular;

    } catch (error) {
      console.error(`[RECOMMENDATIONS] Error loading popular ${type}:`, error);
      return [];
    }
  }

  /**
   * Carga items similares a uno específico
   * @param {string} type - Tipo de item
   * @param {number} itemId - ID del item
   * @param {number} limit - Cantidad
   * @returns {Promise<Array>} Items similares
   */
  async loadSimilarItems(type, itemId, limit = 5) {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/similar/${type}/${itemId}?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.similar_items;

    } catch (error) {
      console.error(`[RECOMMENDATIONS] Error loading similar items:`, error);
      return [];
    }
  }

  // ===========================================================================
  // TRACKING DE INTERACCIONES
  // ===========================================================================

  /**
   * Registra una interacción del usuario con un item
   * @param {string} type - Tipo de item
   * @param {number} itemId - ID del item
   * @param {string} interactionType - 'view', 'click', 'enroll', 'rate', 'bookmark', 'complete'
   * @param {number} rating - Rating opcional (0-5)
   * @returns {Promise<boolean>} Éxito
   */
  async trackInteraction(type, itemId, interactionType, rating = null) {
    try {
      const payload = {
        item_type: type,
        item_id: itemId,
        interaction_type: interactionType
      };

      if (rating !== null) {
        payload.rating = rating;
      }

      const response = await fetch(`${this.apiBaseUrl}/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      void 0;

      // Invalidar cache para forzar recarga
      this.invalidateCache(type);

      return true;

    } catch (error) {
      console.error('[RECOMMENDATIONS] Error tracking interaction:', error);
      return false;
    }
  }

  /**
   * Registra una vista automáticamente
   * @param {string} type - Tipo
   * @param {number} itemId - ID
   */
  async trackView(type, itemId) {
    return await this.trackInteraction(type, itemId, 'view');
  }

  /**
   * Registra un click
   * @param {string} type - Tipo
   * @param {number} itemId - ID
   */
  async trackClick(type, itemId) {
    return await this.trackInteraction(type, itemId, 'click');
  }

  /**
   * Registra una inscripción/enrollment
   * @param {string} type - Tipo
   * @param {number} itemId - ID
   */
  async trackEnroll(type, itemId) {
    return await this.trackInteraction(type, itemId, 'enroll');
  }

  /**
   * Registra un rating
   * @param {string} type - Tipo
   * @param {number} itemId - ID
   * @param {number} rating - Rating 0-5
   */
  async trackRating(type, itemId, rating) {
    return await this.trackInteraction(type, itemId, 'rate', rating);
  }

  // ===========================================================================
  // RENDERIZADO DE UI
  // ===========================================================================

  /**
   * Renderiza widget de recomendaciones en el DOM
   * @param {string} type - Tipo de recomendaciones
   * @param {HTMLElement} container - Contenedor DOM
   * @param {object} options - Opciones de renderizado
   */
  async renderRecommendations(type, container, options = {}) {
    const {
      title = this.getDefaultTitle(type),
      layout = 'grid', // 'grid', 'list', 'carousel'
      showDescription = true,
      showRating = true,
      showEnrollButton = true,
      limit = this.limit
    } = options;

    try {
      // Mostrar loading
      container.innerHTML = this.getLoadingHTML();

      // Cargar recomendaciones
      const recommendations = await this.loadRecommendations(type, limit);

      if (recommendations.length === 0) {
        container.innerHTML = this.getEmptyStateHTML(type);
        return;
      }

      // Renderizar según layout
      let html = `<div class="recommendations-widget" data-type="${type}">`;
      html += `<h3 class="recommendations-title">${title}</h3>`;

      if (layout === 'grid') {
        html += this.renderGrid(recommendations, type, { showDescription, showRating, showEnrollButton });
      } else if (layout === 'list') {
        html += this.renderList(recommendations, type, { showDescription, showRating, showEnrollButton });
      } else if (layout === 'carousel') {
        html += this.renderCarousel(recommendations, type, { showDescription, showRating, showEnrollButton });
      }

      html += `</div>`;

      container.innerHTML = html;

      // Agregar event listeners
      this.attachEventListeners(container, type);

    } catch (error) {
      console.error('[RECOMMENDATIONS] Error rendering:', error);
      container.innerHTML = this.getErrorHTML();
    }
  }

  /**
   * Renderiza recomendaciones en layout de grid (cards)
   */
  renderGrid(recommendations, type, options) {
    const { showDescription, showRating, showEnrollButton } = options;

    let html = '<div class="recommendations-grid row">';

    recommendations.forEach(item => {
      const {
        id,
        nombre,
        titulo,
        descripcion,
        categoria,
        tipo,
        tags,
        calificacion_promedio,
        visualizaciones,
        inscritos,
        score
      } = item;

      const title = nombre || titulo || 'Sin título';
      const desc = descripcion || '';
      const rating = calificacion_promedio || 0;
      const tagsArray = Array.isArray(tags) ? tags : (tags ? JSON.parse(tags) : []);

      html += `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card recommendation-card h-100" data-item-id="${id}">
            <div class="card-header bg-primary text-white">
              <h5 class="card-title mb-0">${this.escapeHTML(title)}</h5>
              ${categoria || tipo ? `<small>${this.escapeHTML(categoria || tipo)}</small>` : ''}
            </div>
            <div class="card-body">
              ${showDescription && desc ? `
                <p class="card-text">${this.escapeHTML(desc.substring(0, 150))}${desc.length > 150 ? '...' : ''}</p>
              ` : ''}

              ${showRating && rating > 0 ? `
                <div class="rating mb-2">
                  ${this.renderStars(rating)}
                  <span class="text-muted ms-2">${rating.toFixed(1)}/5.0</span>
                </div>
              ` : ''}

              ${tagsArray.length > 0 ? `
                <div class="tags mb-2">
                  ${tagsArray.slice(0, 3).map(tag => `
                    <span class="badge bg-secondary me-1">${this.escapeHTML(tag)}</span>
                  `).join('')}
                </div>
              ` : ''}

              <div class="stats text-muted small">
                ${visualizaciones ? `<i class="bi bi-eye"></i> ${visualizaciones} vistas` : ''}
                ${inscritos ? ` <i class="bi bi-people"></i> ${inscritos} inscritos` : ''}
              </div>

              ${score ? `
                <div class="recommendation-score mt-2">
                  <small class="text-success">
                    <i class="bi bi-stars"></i> ${(score * 100).toFixed(0)}% match
                  </small>
                </div>
              ` : ''}
            </div>
            <div class="card-footer">
              ${showEnrollButton ? `
                <button class="btn btn-primary btn-sm btn-enroll" data-item-id="${id}">
                  <i class="bi bi-plus-circle"></i> Ver Detalles
                </button>
              ` : ''}
              <button class="btn btn-outline-secondary btn-sm btn-similar" data-item-id="${id}">
                <i class="bi bi-search"></i> Similar
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Renderiza recomendaciones en layout de lista
   */
  renderList(recommendations, type, options) {
    const { showDescription, showRating } = options;

    let html = '<div class="recommendations-list list-group">';

    recommendations.forEach(item => {
      const {
        id,
        nombre,
        titulo,
        descripcion,
        categoria,
        tipo,
        calificacion_promedio,
        score
      } = item;

      const title = nombre || titulo || 'Sin título';
      const desc = descripcion || '';
      const rating = calificacion_promedio || 0;

      html += `
        <div class="list-group-item recommendation-list-item" data-item-id="${id}">
          <div class="d-flex w-100 justify-content-between">
            <h5 class="mb-1">${this.escapeHTML(title)}</h5>
            ${score ? `<small class="text-success">${(score * 100).toFixed(0)}% match</small>` : ''}
          </div>
          ${showDescription && desc ? `
            <p class="mb-1">${this.escapeHTML(desc.substring(0, 200))}${desc.length > 200 ? '...' : ''}</p>
          ` : ''}
          <small class="text-muted">${this.escapeHTML(categoria || tipo || '')}</small>
          ${showRating && rating > 0 ? `
            <div class="rating-inline mt-1">
              ${this.renderStars(rating)}
              <span class="ms-2">${rating.toFixed(1)}/5.0</span>
            </div>
          ` : ''}
          <button class="btn btn-sm btn-primary mt-2 btn-enroll" data-item-id="${id}">
            Ver Detalles
          </button>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * Renderiza recomendaciones en carousel
   */
  renderCarousel(recommendations, type, options) {
    const carouselId = `carousel-${type}-${Date.now()}`;

    let html = `
      <div id="${carouselId}" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
    `;

    recommendations.forEach((item, index) => {
      const {
        id,
        nombre,
        titulo,
        descripcion,
        calificacion_promedio
      } = item;

      const title = nombre || titulo || 'Sin título';
      const desc = descripcion || '';
      const rating = calificacion_promedio || 0;

      html += `
        <div class="carousel-item ${index === 0 ? 'active' : ''}" data-item-id="${id}">
          <div class="card">
            <div class="card-body text-center">
              <h4>${this.escapeHTML(title)}</h4>
              <p>${this.escapeHTML(desc.substring(0, 250))}</p>
              ${rating > 0 ? `<div class="rating">${this.renderStars(rating)} ${rating.toFixed(1)}/5.0</div>` : ''}
              <button class="btn btn-primary mt-3 btn-enroll" data-item-id="${id}">
                Ver Detalles
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
          <span class="carousel-control-prev-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Anterior</span>
        </button>
        <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
          <span class="carousel-control-next-icon" aria-hidden="true"></span>
          <span class="visually-hidden">Siguiente</span>
        </button>
      </div>
    `;

    return html;
  }

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  /**
   * Adjunta event listeners a elementos del widget
   */
  attachEventListeners(container, type) {
    // Botones de "Ver Detalles" / "Inscribirse"
    const enrollButtons = container.querySelectorAll('.btn-enroll');
    enrollButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const itemId = parseInt(btn.dataset.itemId);

        // Track click
        await this.trackClick(type, itemId);

        // Redirigir o abrir modal
        this.handleEnroll(type, itemId);
      });
    });

    // Botones de "Similar"
    const similarButtons = container.querySelectorAll('.btn-similar');
    similarButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const itemId = parseInt(btn.dataset.itemId);

        // Cargar items similares
        this.showSimilarItems(type, itemId);
      });
    });

    // Track views automáticamente cuando card entra en viewport
    const cards = container.querySelectorAll('.recommendation-card, .recommendation-list-item');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const itemId = parseInt(entry.target.dataset.itemId);
          this.trackView(type, itemId);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    cards.forEach(card => observer.observe(card));
  }

  /**
   * Maneja acción de inscripción/detalles
   */
  handleEnroll(type, itemId) {
    // Aquí puedes:
    // 1. Redirigir a página de detalles
    // 2. Abrir modal con más información
    // 3. Iniciar proceso de inscripción

    void 0;

    // Ejemplo: Redirigir a página específica
    const urls = {
      courses: `/curso-detalles.html?id=${itemId}`,
      materials: `/material-detalles.html?id=${itemId}`,
      activities: `/actividad-detalles.html?id=${itemId}`,
      resources: `/recurso-detalles.html?id=${itemId}`
    };

    if (urls[type]) {
      window.location.href = urls[type];
    }
  }

  /**
   * Muestra items similares en modal
   */
  async showSimilarItems(type, itemId) {
    try {
      const similarItems = await this.loadSimilarItems(type, itemId, 5);

      if (similarItems.length === 0) {
        alert('No se encontraron items similares');
        return;
      }

      // Crear modal dinámicamente
      const modalHTML = `
        <div class="modal fade" id="similarItemsModal" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Items Similares</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="list-group">
                  ${similarItems.map(item => `
                    <a href="#" class="list-group-item list-group-item-action" data-item-id="${item.id}">
                      <h6>${this.escapeHTML(item.nombre || item.titulo)}</h6>
                      <p class="mb-1 small">${this.escapeHTML((item.descripcion || '').substring(0, 100))}</p>
                      ${item.similarity_score ? `<small class="text-success">${(item.similarity_score * 100).toFixed(0)}% similar</small>` : ''}
                    </a>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Insertar modal en DOM
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('similarItemsModal'));
      modal.show();

      // Limpiar al cerrar
      document.getElementById('similarItemsModal').addEventListener('hidden.bs.modal', () => {
        modalContainer.remove();
      });

    } catch (error) {
      console.error('[RECOMMENDATIONS] Error showing similar items:', error);
      alert('Error al cargar items similares');
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  /**
   * Renderiza estrellas de rating
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = (rating % 1) >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    let html = '';
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="bi bi-star-fill text-warning"></i>';
    }
    if (halfStar) {
      html += '<i class="bi bi-star-half text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="bi bi-star text-warning"></i>';
    }

    return html;
  }

  /**
   * Obtiene título por defecto según tipo
   */
  getDefaultTitle(type) {
    const titles = {
      courses: '📚 Cursos Recomendados Para Ti',
      materials: '📖 Materiales de Estudio Sugeridos',
      activities: '🎯 Actividades que te Pueden Interesar',
      resources: '🔧 Recursos Académicos Recomendados'
    };

    return titles[type] || 'Recomendaciones';
  }

  /**
   * HTML de loading state
   */
  getLoadingHTML() {
    return `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando recomendaciones...</span>
        </div>
        <p class="mt-3">Personalizando recomendaciones...</p>
      </div>
    `;
  }

  /**
   * HTML de estado vacío
   */
  getEmptyStateHTML(type) {
    return `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle fs-1"></i>
        <h5 class="mt-3">No hay recomendaciones disponibles</h5>
        <p>Aún no tenemos suficiente información para generar recomendaciones personalizadas.</p>
        <p class="small text-muted">Interactúa más con el contenido para mejorar tus recomendaciones.</p>
      </div>
    `;
  }

  /**
   * HTML de error
   */
  getErrorHTML() {
    return `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i>
        Error al cargar recomendaciones. Por favor, intenta de nuevo más tarde.
      </div>
    `;
  }

  /**
   * Escapa HTML para prevenir XSS
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Obtiene token de autenticación
   */
  getAuthToken() {
    return sessionStorage.getItem('token') || localStorage.getItem('token') || '';
  }

  /**
   * Verifica si el cache es válido
   */
  isCacheValid(type) {
    if (!this.cache[type] || !this.cacheTimestamps[type]) {
      return false;
    }

    const now = Date.now();
    const cacheAge = now - this.cacheTimestamps[type];

    return cacheAge < this.cacheLifetime;
  }

  /**
   * Invalida cache de un tipo específico
   */
  invalidateCache(type) {
    this.cache[type] = null;
    this.cacheTimestamps[type] = null;
    void 0;
  }

  /**
   * Invalida todo el cache
   */
  invalidateAllCache() {
    this.cache = {
      courses: null,
      materials: null,
      activities: null,
      resources: null
    };
    this.cacheTimestamps = {};
    void 0;
  }
}

// =============================================================================
// EXPORT
// =============================================================================

// Exponer globalmente
window.RecommendationsWidget = RecommendationsWidget;

// Crear instancia global
window.recommendationsWidget = new RecommendationsWidget();

void 0;
