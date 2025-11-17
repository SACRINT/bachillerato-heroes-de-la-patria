/**
 * 📚 BIBLIOTECA DIGITAL - FRONTEND MANAGER
 * Cliente JavaScript para gestión de biblioteca digital
 * Fase 3 - BGE 2025
 */

class DigitalLibraryManager {
    constructor(options = {}) {
        this.apiBaseURL = options.apiBaseURL || '/api/digital-library';
        this.token = this.getStoredToken();
        this.currentPage = 1;
        this.limit = 20;
        this.documents = [];
        this.categories = [];
        this.filters = {
            category_id: null,
            document_type: [],
            rating: [],
            sort_by: 'created_at',
            sort_order: 'DESC',
            search: ''
        };
        this.viewMode = 'grid'; // 'grid' or 'list'

        this.init();
    }

    /**
     * Inicializar manager
     */
    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.loadDocuments();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Search
        const searchBtn = document.getElementById('searchBtn');
        const globalSearch = document.getElementById('globalSearch');

        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        if (globalSearch) {
            globalSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        // View toggles
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');

        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => this.switchView('grid'));
        }

        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.switchView('list'));
        }

        // Sort
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.filters.sort_by = e.target.value;
                this.loadDocuments();
            });
        }

        // Filter checkboxes
        document.querySelectorAll('.filter-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleFilterChange(e);
            });
        });

        // Top actions
        const favoritesBtn = document.getElementById('favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => this.showFavorites());
        }

        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => this.showHistory());
        }

        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        // Upload modal
        const saveDocumentBtn = document.getElementById('saveDocumentBtn');
        if (saveDocumentBtn) {
            saveDocumentBtn.addEventListener('click', () => this.handleUploadDocument());
        }
    }

    /**
     * Cambiar vista (grid/list)
     */
    switchView(mode) {
        this.viewMode = mode;

        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        const documentsGrid = document.getElementById('documentsGrid');
        const documentsList = document.getElementById('documentsList');

        if (mode === 'grid') {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            documentsGrid.classList.add('active');
            documentsList.classList.remove('active');
        } else {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
            documentsGrid.classList.remove('active');
            documentsList.classList.add('active');
        }

        this.renderDocuments();
    }

    /**
     * Manejar cambios en filtros
     */
    handleFilterChange(event) {
        const checkbox = event.target;
        const filterItem = checkbox.closest('.filter-item');

        if (filterItem.dataset.type) {
            const type = filterItem.dataset.type;
            if (checkbox.checked) {
                if (!this.filters.document_type.includes(type)) {
                    this.filters.document_type.push(type);
                }
            } else {
                this.filters.document_type = this.filters.document_type.filter(t => t !== type);
            }
        }

        if (filterItem.dataset.rating) {
            const rating = parseInt(filterItem.dataset.rating);
            if (checkbox.checked) {
                if (!this.filters.rating.includes(rating)) {
                    this.filters.rating.push(rating);
                }
            } else {
                this.filters.rating = this.filters.rating.filter(r => r !== rating);
            }
        }

        this.currentPage = 1;
        this.loadDocuments();
    }

    /**
     * Manejar búsqueda
     */
    async handleSearch() {
        const searchInput = document.getElementById('globalSearch');
        const query = searchInput?.value.trim();

        if (!query) {
            this.filters.search = '';
            this.loadDocuments();
            return;
        }

        this.filters.search = query;
        this.showLoading();

        try {
            const response = await this.apiRequest('/search', {
                method: 'GET',
                params: {
                    q: query,
                    page: this.currentPage,
                    limit: this.limit
                }
            });

            this.documents = response.documents || [];
            this.renderDocuments();
            this.renderPagination(response.pagination);

            const contentTitle = document.getElementById('contentTitle');
            if (contentTitle) {
                contentTitle.textContent = `Resultados para "${query}"`;
            }
        } catch (error) {
            this.showToast('Error al buscar documentos', 'error');
            console.error('Error en búsqueda:', error);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Cargar categorías
     */
    async loadCategories() {
        try {
            const response = await this.apiRequest('/categories');
            this.categories = response.categories || [];
            this.renderCategories();

            // Llenar select de categorías en modal de subida
            const docCategory = document.getElementById('docCategory');
            if (docCategory) {
                docCategory.innerHTML = '<option value="">Seleccionar...</option>' +
                    this.categories.map(cat =>
                        `<option value="${cat.id}">${cat.name}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    /**
     * Renderizar categorías en sidebar
     */
    renderCategories() {
        const container = document.getElementById('categoriesFilter');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = DOMPurify.sanitize('<p class="text-muted small">No hay categorías</p>');
            return;
        }

        container.innerHTML = this.categories.map(cat => `
            <div class="filter-item" data-category="${cat.id}">
                <input type="checkbox" id="cat-${cat.id}">
                <label for="cat-${cat.id}">${cat.icon ? cat.icon + ' ' : ''}${cat.name}</label>
                <span class="badge bg-secondary">${cat.document_count || 0}</span>
            </div>
        `).join('');

        // Agregar event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const categoryId = e.target.closest('.filter-item').dataset.category;
                this.filters.category_id = e.target.checked ? categoryId : null;
                this.currentPage = 1;
                this.loadDocuments();
            });
        });
    }

    /**
     * Cargar documentos
     */
    async loadDocuments() {
        if (this.filters.search) {
            return this.handleSearch();
        }

        this.showLoading();

        try {
            const params = {
                page: this.currentPage,
                limit: this.limit,
                sort_by: this.filters.sort_by,
                sort_order: this.filters.sort_order
            };

            if (this.filters.category_id) {
                params.category_id = this.filters.category_id;
            }

            if (this.filters.document_type.length > 0) {
                params.document_type = this.filters.document_type[0]; // API solo acepta uno
            }

            params.is_published = 'true';

            const response = await this.apiRequest('/documents', {
                method: 'GET',
                params: params
            });

            this.documents = response.documents || [];
            this.renderDocuments();
            this.renderPagination(response.pagination);
        } catch (error) {
            this.showToast('Error al cargar documentos', 'error');
            console.error('Error al cargar documentos:', error);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Renderizar documentos (grid o lista)
     */
    renderDocuments() {
        if (this.viewMode === 'grid') {
            this.renderDocumentsGrid();
        } else {
            this.renderDocumentsList();
        }

        // Mostrar/ocultar empty state
        const emptyState = document.getElementById('emptyState');
        const documentsGrid = document.getElementById('documentsGrid');
        const documentsList = document.getElementById('documentsList');

        if (this.documents.length === 0) {
            emptyState?.classList.remove('hidden');
            documentsGrid?.classList.add('hidden');
            documentsList?.classList.add('hidden');
        } else {
            emptyState?.classList.add('hidden');
            if (this.viewMode === 'grid') {
                documentsGrid?.classList.remove('hidden');
            } else {
                documentsList?.classList.remove('hidden');
            }
        }
    }

    /**
     * Renderizar documentos en grid
     */
    renderDocumentsGrid() {
        const container = document.getElementById('documentsGrid');
        if (!container) return;

        container.innerHTML = this.documents.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="card-icon">
                    ${this.getDocumentIcon(doc.document_type)}
                </div>
                <div class="card-body">
                    <h5 class="card-title">${this.escapeHtml(doc.title)}</h5>
                    <div class="card-meta">
                        <span><i class="bi bi-folder"></i> ${this.escapeHtml(doc.category_name || 'Sin categoría')}</span>
                        <span><i class="bi bi-calendar"></i> ${this.formatDate(doc.created_at)}</span>
                    </div>
                    ${doc.description ? `<p class="card-text text-muted small">${this.escapeHtml(doc.description.substring(0, 100))}${doc.description.length > 100 ? '...' : ''}</p>` : ''}
                    ${this.renderRating(doc.avg_rating)}
                    <div class="card-stats">
                        <span title="Descargas">
                            <i class="bi bi-download"></i> ${doc.total_downloads || 0}
                        </span>
                        <span title="Vistas">
                            <i class="bi bi-eye"></i> ${doc.total_views || 0}
                        </span>
                        <span title="Versión">
                            <i class="bi bi-file-earmark"></i> v${doc.current_version_number || '1.0'}
                        </span>
                    </div>
                    ${doc.tags && doc.tags.length > 0 ? `
                        <div class="document-tags">
                            ${doc.tags.slice(0, 3).map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="card-actions">
                        <button class="btn btn-sm btn-primary" onclick="libraryManager.viewDocument(${doc.id})">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-success" onclick="libraryManager.downloadDocument(${doc.id})">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="libraryManager.toggleFavorite(${doc.id})">
                            <i class="bi ${doc.is_favorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Renderizar documentos en lista
     */
    renderDocumentsList() {
        const container = document.getElementById('documentsList');
        if (!container) return;

        container.innerHTML = this.documents.map(doc => `
            <div class="document-list-item" data-id="${doc.id}">
                <div class="list-icon">
                    ${this.getDocumentIcon(doc.document_type)}
                </div>
                <div class="list-content">
                    <h4 class="list-title">${this.escapeHtml(doc.title)}</h4>
                    ${doc.description ? `<p class="list-description">${this.escapeHtml(doc.description.substring(0, 200))}${doc.description.length > 200 ? '...' : ''}</p>` : ''}
                    <div class="list-meta">
                        <span><i class="bi bi-folder"></i> ${this.escapeHtml(doc.category_name || 'Sin categoría')}</span>
                        <span><i class="bi bi-calendar"></i> ${this.formatDate(doc.created_at)}</span>
                        <span><i class="bi bi-download"></i> ${doc.total_downloads || 0} descargas</span>
                        <span><i class="bi bi-eye"></i> ${doc.total_views || 0} vistas</span>
                        <span>${this.renderRating(doc.avg_rating)}</span>
                    </div>
                    ${doc.tags && doc.tags.length > 0 ? `
                        <div class="document-tags">
                            ${doc.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="list-actions">
                    <button class="btn btn-primary mb-2" onclick="libraryManager.viewDocument(${doc.id})">
                        <i class="bi bi-eye"></i> Ver Detalles
                    </button>
                    <button class="btn btn-success mb-2" onclick="libraryManager.downloadDocument(${doc.id})">
                        <i class="bi bi-download"></i> Descargar
                    </button>
                    <button class="btn btn-outline-danger" onclick="libraryManager.toggleFavorite(${doc.id})">
                        <i class="bi ${doc.is_favorite ? 'bi-heart-fill' : 'bi-heart'}"></i> Favorito
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Ver detalles del documento
     */
    async viewDocument(documentId) {
        try {
            const response = await this.apiRequest(`/documents/${documentId}`);
            const doc = response.document;

            const modalBody = document.getElementById('documentDetailBody');
            if (!modalBody) return;

            modalBody.innerHTML = sanitizeHTML(`
                <div class="document-detail-header">
                    <div class="document-detail-icon">
                        ${this.getDocumentIcon(doc.document_type)}
                    </div>
                    <div class="document-detail-info">
                        <h3>${this.escapeHtml(doc.title)}</h3>
                        <p class="text-muted">${this.escapeHtml(doc.description || '')}</p>
                        <div class="d-flex gap-2 mt-3">
                            <span class="badge bg-primary">${this.escapeHtml(doc.category_name || 'Sin categoría')}</span>
                            <span class="badge bg-secondary">${this.escapeHtml(doc.document_type)}</span>
                            <span class="badge bg-info">v${doc.current_version_number || '1.0'}</span>
                        </div>
                        ${doc.tags && doc.tags.length > 0 ? `
                            <div class="document-tags mt-3">
                                ${doc.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="document-detail-stats">
                    <div class="stat-box">
                        <div class="stat-value">${doc.total_downloads || 0}</div>
                        <div class="stat-label">Descargas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${doc.total_views || 0}</div>
                        <div class="stat-label">Vistas</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${doc.avg_rating ? doc.avg_rating.toFixed(1) : 'N/A'}</div>
                        <div class="stat-label">Calificación</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${doc.total_versions || 1}</div>
                        <div class="stat-label">Versiones</div>
                    </div>
                </div>

                <div class="mb-4">
                    <h5>Información del Archivo</h5>
                    <table class="table">
                        <tr>
                            <th width="200">Archivo:</th>
                            <td>${this.escapeHtml(doc.file_name || 'N/A')}</td>
                        </tr>
                        <tr>
                            <th>Tamaño:</th>
                            <td>${this.formatFileSize(doc.file_size)}</td>
                        </tr>
                        <tr>
                            <th>Autor:</th>
                            <td>${this.escapeHtml(doc.author_name || 'N/A')}</td>
                        </tr>
                        <tr>
                            <th>Fecha de publicación:</th>
                            <td>${this.formatDate(doc.created_at)}</td>
                        </tr>
                        <tr>
                            <th>Última actualización:</th>
                            <td>${this.formatDate(doc.updated_at)}</td>
                        </tr>
                    </table>
                </div>

                <div class="d-flex gap-2 mb-4">
                    <button class="btn btn-success" onclick="libraryManager.downloadDocument(${doc.id})">
                        <i class="bi bi-download"></i> Descargar Documento
                    </button>
                    <button class="btn btn-outline-danger" onclick="libraryManager.toggleFavorite(${doc.id})">
                        <i class="bi ${doc.is_favorite ? 'bi-heart-fill' : 'bi-heart'}"></i>
                        ${doc.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    </button>
                </div>

                <div class="mb-4">
                    <h5>Calificar Documento</h5>
                    <div class="d-flex gap-2 align-items-center">
                        <div class="rating-stars" style="font-size: 1.5rem; cursor: pointer;" id="ratingStars-${doc.id}">
                            ${this.renderInteractiveRating(doc.user_rating || 0, doc.id)}
                        </div>
                        <span class="text-muted ms-2">
                            ${doc.user_rating ? `Tu calificación: ${doc.user_rating}` : 'Califica este documento'}
                        </span>
                    </div>
                </div>

                <div id="commentsSection-${doc.id}">
                    <h5>Comentarios</h5>
                    <div id="commentsList-${doc.id}">
                        <div class="text-center py-3">
                            <div class="spinner-border spinner-border-sm" role="status"></div>
                            <span class="ms-2">Cargando comentarios...</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        <textarea class="form-control" id="newComment-${doc.id}" rows="3"
                                  placeholder="Escribe un comentario..."></textarea>
                        <button class="btn btn-primary mt-2" onclick="libraryManager.postComment(${doc.id})">
                            <i class="bi bi-send"></i> Publicar Comentario
                        </button>
                    </div>
                </div>
            `);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('documentDetailModal'));
            modal.show();

            // Cargar comentarios
            this.loadComments(doc.id);

            // Setup rating interaction
            this.setupRatingInteraction(doc.id);
        } catch (error) {
            this.showToast('Error al cargar detalles del documento', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Descargar documento
     */
    async downloadDocument(documentId) {
        try {
            const response = await fetch(`${this.apiBaseURL}/documents/${documentId}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al descargar documento');
            }

            // Obtener nombre del archivo desde header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = 'documento.pdf';
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?(.+)"?/);
                if (match) filename = match[1];
            }

            // Descargar archivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showToast('Documento descargado exitosamente', 'success');
        } catch (error) {
            this.showToast('Error al descargar documento', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Toggle favorito
     */
    async toggleFavorite(documentId) {
        try {
            const doc = this.documents.find(d => d.id === documentId);
            const isFavorite = doc?.is_favorite || false;

            if (isFavorite) {
                await this.apiRequest(`/documents/${documentId}/favorite`, { method: 'DELETE' });
                this.showToast('Eliminado de favoritos', 'success');
            } else {
                await this.apiRequest(`/documents/${documentId}/favorite`, { method: 'POST' });
                this.showToast('Agregado a favoritos', 'success');
            }

            // Recargar documentos
            await this.loadDocuments();
        } catch (error) {
            this.showToast('Error al actualizar favoritos', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Configurar interacción de rating
     */
    setupRatingInteraction(documentId) {
        const container = document.getElementById(`ratingStars-${documentId}`);
        if (!container) return;

        const stars = container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                this.rateDocument(documentId, index + 1);
            });

            star.addEventListener('mouseenter', () => {
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.remove('bi-star');
                    stars[i].classList.add('bi-star-fill');
                }
            });

            star.addEventListener('mouseleave', () => {
                stars.forEach(s => {
                    s.classList.remove('bi-star-fill');
                    s.classList.add('bi-star');
                });
                // Restaurar rating actual
                const currentRating = parseInt(container.dataset.rating || 0);
                for (let i = 0; i < currentRating; i++) {
                    stars[i].classList.remove('bi-star');
                    stars[i].classList.add('bi-star-fill');
                }
            });
        });
    }

    /**
     * Calificar documento
     */
    async rateDocument(documentId, rating) {
        try {
            await this.apiRequest(`/documents/${documentId}/rating`, {
                method: 'POST',
                body: JSON.stringify({ rating })
            });

            this.showToast(`Calificaste con ${rating} estrellas`, 'success');

            // Actualizar vista
            const container = document.getElementById(`ratingStars-${documentId}`);
            if (container) {
                container.dataset.rating = rating;
            }
        } catch (error) {
            this.showToast('Error al calificar documento', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Cargar comentarios
     */
    async loadComments(documentId) {
        try {
            const response = await this.apiRequest(`/documents/${documentId}/comments`);
            const comments = response.comments || [];

            const container = document.getElementById(`commentsList-${documentId}`);
            if (!container) return;

            if (comments.length === 0) {
                container.innerHTML = DOMPurify.sanitize('<p class="text-muted text-center py-3">No hay comentarios aún</p>');
                return;
            }

            container.innerHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-header">
                        <span class="comment-author">
                            <i class="bi bi-person-circle"></i> ${this.escapeHtml(comment.user_name)}
                        </span>
                        <span class="comment-date">${this.formatDate(comment.created_at)}</span>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="comment-replies">
                            ${comment.replies.map(reply => `
                                <div class="comment comment-reply">
                                    <div class="comment-header">
                                        <span class="comment-author">
                                            <i class="bi bi-person-circle"></i> ${this.escapeHtml(reply.user_name)}
                                        </span>
                                        <span class="comment-date">${this.formatDate(reply.created_at)}</span>
                                    </div>
                                    <div class="comment-content">${this.escapeHtml(reply.content)}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        }
    }

    /**
     * Publicar comentario
     */
    async postComment(documentId) {
        const textarea = document.getElementById(`newComment-${documentId}`);
        if (!textarea) return;

        const content = textarea.value.trim();
        if (!content) {
            this.showToast('Escribe un comentario', 'warning');
            return;
        }

        try {
            await this.apiRequest(`/documents/${documentId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content })
            });

            textarea.value = '';
            this.showToast('Comentario publicado', 'success');

            // Recargar comentarios
            await this.loadComments(documentId);
        } catch (error) {
            this.showToast('Error al publicar comentario', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Mostrar favoritos
     */
    async showFavorites() {
        try {
            const response = await this.apiRequest('/favorites');
            this.documents = response.favorites || [];
            this.renderDocuments();

            const contentTitle = document.getElementById('contentTitle');
            if (contentTitle) {
                contentTitle.textContent = 'Mis Favoritos';
            }

            const contentSubtitle = document.getElementById('contentSubtitle');
            if (contentSubtitle) {
                contentSubtitle.textContent = 'Documentos que has marcado como favoritos';
            }
        } catch (error) {
            this.showToast('Error al cargar favoritos', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Mostrar historial
     */
    async showHistory() {
        try {
            const response = await this.apiRequest('/history');
            const history = response.history || [];

            const contentTitle = document.getElementById('contentTitle');
            if (contentTitle) {
                contentTitle.textContent = 'Historial de Descargas';
            }

            // Crear vista especial para historial
            const documentsGrid = document.getElementById('documentsGrid');
            const documentsList = document.getElementById('documentsList');

            documentsGrid.classList.add('hidden');
            documentsList.classList.remove('hidden');
            documentsList.classList.add('active');

            documentsList.innerHTML = history.map(item => `
                <div class="document-list-item">
                    <div class="list-icon">
                        ${this.getDocumentIcon(item.document_type)}
                    </div>
                    <div class="list-content">
                        <h4 class="list-title">${this.escapeHtml(item.title)}</h4>
                        <div class="list-meta">
                            <span><i class="bi bi-file-earmark"></i> ${this.escapeHtml(item.file_name)}</span>
                            <span><i class="bi bi-tag"></i> Versión ${item.version_number}</span>
                            <span><i class="bi bi-calendar"></i> Descargado: ${this.formatDate(item.downloaded_at)}</span>
                        </div>
                    </div>
                    <div class="list-actions">
                        <button class="btn btn-success" onclick="libraryManager.downloadDocument(${item.document_id})">
                            <i class="bi bi-download"></i> Descargar de nuevo
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            this.showToast('Error al cargar historial', 'error');
            console.error('Error:', error);
        }
    }

    /**
     * Mostrar modal de subida
     */
    showUploadModal() {
        const modal = new bootstrap.Modal(document.getElementById('uploadDocumentModal'));
        modal.show();
    }

    /**
     * Manejar subida de documento
     */
    async handleUploadDocument() {
        const form = document.getElementById('uploadDocumentForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const title = document.getElementById('docTitle').value;
        const description = document.getElementById('docDescription').value;
        const category_id = document.getElementById('docCategory').value;
        const document_type = document.getElementById('docType').value;
        const file = document.getElementById('docFile').files[0];
        const tags = document.getElementById('docTags').value;
        const is_published = document.getElementById('docPublished').checked;

        if (!file) {
            this.showToast('Selecciona un archivo', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('slug', this.slugify(title));
        formData.append('description', description);
        formData.append('category_id', category_id);
        formData.append('document_type', document_type);
        formData.append('file', file);
        formData.append('is_published', is_published);

        if (tags) {
            formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim())));
        }

        try {
            const saveBtn = document.getElementById('saveDocumentBtn');
            saveBtn.disabled = true;
            saveBtn.innerHTML = DOMPurify.sanitize('<i class="bi bi-hourglass-split"></i> Subiendo...');

            const response = await fetch(`${this.apiBaseURL}/documents`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al subir documento');
            }

            this.showToast('Documento subido exitosamente', 'success');

            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('uploadDocumentModal')).hide();

            // Limpiar formulario
            form.reset();

            // Recargar documentos
            await this.loadDocuments();
        } catch (error) {
            this.showToast(error.message || 'Error al subir documento', 'error');
            console.error('Error:', error);
        } finally {
            const saveBtn = document.getElementById('saveDocumentBtn');
            saveBtn.disabled = false;
            saveBtn.innerHTML = DOMPurify.sanitize('<i class="bi bi-upload"></i> Subir Documento');
        }
    }

    /**
     * Renderizar paginación
     */
    renderPagination(pagination) {
        const container = document.getElementById('pagination');
        if (!container || !pagination) return;

        const { page, totalPages } = pagination;

        if (totalPages <= 1) {
            container.innerHTML = DOMPurify.sanitize(sanitizeHTML(''));
            return;
        }

        let html = '';

        // Previous
        html += `
            <li class="page-item ${page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="libraryManager.goToPage(${page - 1}); return false;">
                    <i class="bi bi-chevron-left"></i>
                </a>
            </li>
        `;

        // Pages
        const maxPages = 5;
        let startPage = Math.max(1, page - Math.floor(maxPages / 2));
        let endPage = Math.min(totalPages, startPage + maxPages - 1);

        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        if (startPage > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="libraryManager.goToPage(1); return false;">1</a></li>`;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="libraryManager.goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `<li class="page-item"><a class="page-link" href="#" onclick="libraryManager.goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
        }

        // Next
        html += `
            <li class="page-item ${page === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="libraryManager.goToPage(${page + 1}); return false;">
                    <i class="bi bi-chevron-right"></i>
                </a>
            </li>
        `;

        container.innerHTML = DOMPurify.sanitize(html);
    }

    /**
     * Ir a página
     */
    goToPage(page) {
        this.currentPage = page;
        this.loadDocuments();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Obtener icono según tipo de documento
     */
    getDocumentIcon(type) {
        const icons = {
            'reglamento': '<i class="bi bi-file-earmark-text"></i>',
            'manual': '<i class="bi bi-book"></i>',
            'recurso': '<i class="bi bi-file-earmark-pdf"></i>',
            'formulario': '<i class="bi bi-file-earmark-check"></i>',
            'otro': '<i class="bi bi-file-earmark"></i>'
        };
        return icons[type] || icons['otro'];
    }

    /**
     * Renderizar rating stars
     */
    renderRating(rating) {
        if (!rating || rating === 0) {
            return '<div class="rating-stars text-muted"><small>Sin calificación</small></div>';
        }

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '<div class="rating-stars">';
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="bi bi-star-fill"></i>';
        }
        if (hasHalfStar) {
            html += '<i class="bi bi-star-half"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '<i class="bi bi-star"></i>';
        }
        html += ` <span class="text-muted small">(${rating.toFixed(1)})</span></div>`;

        return html;
    }

    /**
     * Renderizar rating interactivo
     */
    renderInteractiveRating(currentRating, documentId) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            html += `<i class="bi ${i <= currentRating ? 'bi-star-fill' : 'bi-star'} star" data-rating="${i}"></i>`;
        }
        return html;
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `Hace ${diffMinutes} min`;
            }
            return `Hace ${diffHours}h`;
        } else if (diffDays === 1) {
            return 'Ayer';
        } else if (diffDays < 7) {
            return `Hace ${diffDays} días`;
        }

        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Formatear tamaño de archivo
     */
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return 'N/A';

        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    /**
     * Escapar HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Slugify texto
     */
    slugify(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Mostrar loading
     */
    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        const grid = document.getElementById('documentsGrid');
        const list = document.getElementById('documentsList');
        const empty = document.getElementById('emptyState');

        spinner?.classList.remove('hidden');
        grid?.classList.add('hidden');
        list?.classList.add('hidden');
        empty?.classList.add('hidden');
    }

    /**
     * Ocultar loading
     */
    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        spinner?.classList.add('hidden');
    }

    /**
     * Mostrar toast/notificación
     */
    showToast(message, type = 'info') {
        // Crear elemento de toast
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = sanitizeHTML(`
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `);

        document.body.appendChild(toast);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    /**
     * Request a la API
     */
    async apiRequest(endpoint, options = {}) {
        const url = new URL(`${this.apiBaseURL}${endpoint}`, window.location.origin);

        if (options.params) {
            Object.keys(options.params).forEach(key => {
                if (options.params[key] !== null && options.params[key] !== undefined) {
                    url.searchParams.append(key, options.params[key]);
                }
            });
        }

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            ...(options.body && { 'Content-Type': 'application/json' })
        };

        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: headers,
            body: options.body
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
            throw new Error(error.error || 'Error en la solicitud');
        }

        return response.json();
    }

    /**
     * Obtener token almacenado
     */
    getStoredToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    /**
     * Guardar token
     */
    setToken(token) {
        localStorage.setItem('auth_token', token);
    }
}

// Instancia global
let libraryManager;

// Auto-inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    libraryManager = new DigitalLibraryManager({
        apiBaseURL: '/api/digital-library'
    });
});
