/**
 * IMAGE GALLERY - Sistema de Galería de Imágenes Avanzado
 * window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')
 * Fecha: 19 de Octubre, 2025
 */

class ImageGallery {
    constructor(options = {}) {
        this.container = options.container || '.gallery-container';
        this.apiEndpoint = options.apiEndpoint || '/api/gallery';
        this.uploadEndpoint = options.uploadEndpoint || '/api/upload';
        this.categories = [];
        this.images = [];
        this.currentCategory = 'all';
        this.currentPage = 1;
        this.imagesPerPage = 12;
        this.lightboxOpen = false;
        this.currentImageIndex = 0;

        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadImages();
        this.render();
        this.attachEventListeners();
        this.createLightbox();
    }

    async loadCategories() {
        try {
            const response = await fetch(`${this.apiEndpoint}/categories`);
            if (response.ok) {
                this.categories = await response.json();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [
                { id: 'eventos', name: 'Eventos' },
                { id: 'instalaciones', name: 'Instalaciones' },
                { id: 'actividades', name: 'Actividades' },
                { id: 'graduaciones', name: 'Graduaciones' }
            ];
        }
    }

    async loadImages(category = 'all', page = 1) {
        try {
            const url = `${this.apiEndpoint}?category=${category}&page=${page}&limit=${this.imagesPerPage}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                this.images = data.images || [];
                this.totalPages = data.totalPages || 1;
            }
        } catch (error) {
            console.error('Error loading images:', error);
            // Imágenes de ejemplo si falla la carga
            this.images = this.generatePlaceholderImages();
        }
    }

    generatePlaceholderImages() {
        const placeholders = [];
        for (let i = 1; i <= 12; i++) {
            placeholders.push({
                id: i,
                url: `https://picsum.photos/400/300?random=${i}`,
                thumbnail: `https://picsum.photos/200/150?random=${i}`,
                title: `Imagen ${i}`,
                category: this.categories[i % this.categories.length]?.id || 'eventos',
                date: new Date(2025, 0, i).toISOString()
            });
        }
        return placeholders;
    }

    render() {
        const container = document.querySelector(this.container);
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="gallery-header">
                <h2>Galería de Imágenes</h2>
                ${this.renderUploadButton()}
            </div>

            <div class="gallery-filters">
                ${this.renderCategoryFilters()}
                ${this.renderSearch()}
            </div>

            <div class="gallery-grid" id="gallery-grid">
                ${this.renderImages()}
            </div>

            <div class="gallery-pagination">
                ${this.renderPagination()}
            </div>
        `);
    }

    renderUploadButton() {
        return `
            <button class="btn btn-primary" id="upload-btn">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                Subir Imágenes
            </button>
        `;
    }

    renderCategoryFilters() {
        return `
            <div class="category-filters">
                <button class="filter-btn ${this.currentCategory === 'all' ? 'active' : ''}"
                        data-category="all">
                    Todas
                </button>
                ${this.categories.map(cat => `
                    <button class="filter-btn ${this.currentCategory === cat.id ? 'active' : ''}"
                            data-category="${cat.id}">
                        ${cat.name}
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderSearch() {
        return `
            <div class="gallery-search">
                <input type="text"
                       class="form-control"
                       id="gallery-search"
                       placeholder="Buscar imágenes...">
            </div>
        `;
    }

    renderImages() {
        if (this.images.length === 0) {
            return `
                <div class="gallery-empty">
                    <p>No hay imágenes disponibles</p>
                </div>
            `;
        }

        return this.images.map((image, index) => `
            <div class="gallery-item" data-index="${index}">
                <img src="${image.thumbnail || image.url}"
                     alt="${image.title}"
                     loading="lazy">
                <div class="gallery-item-overlay">
                    <h4>${image.title}</h4>
                    <span class="gallery-item-date">${new Date(image.date).toLocaleDateString('es-MX')}</span>
                </div>
            </div>
        `).join('');
    }

    renderPagination() {
        if (this.totalPages <= 1) return '';

        let html = '<div class="pagination">';

        // Previous button
        html += `
            <button class="page-btn"
                    data-page="${this.currentPage - 1}"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                Anterior
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= this.totalPages; i++) {
            html += `
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}"
                        data-page="${i}">
                    ${i}
                </button>
            `;
        }

        // Next button
        html += `
            <button class="page-btn"
                    data-page="${this.currentPage + 1}"
                    ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                Siguiente
            </button>
        `;

        html += '</div>';
        return html;
    }

    createLightbox() {
        // Remove existing lightbox if any
        const existing = document.getElementById('image-lightbox');
        if (existing) existing.remove();

        const lightbox = document.createElement('div');
        lightbox.id = 'image-lightbox';
        lightbox.className = 'lightbox';
        lightbox.innerHTML = sanitizeHTML(`
            <div class="lightbox-content">
                <button class="lightbox-close">&times);</button>
                <button class="lightbox-prev">&#10094;</button>
                <button class="lightbox-next">&#10095;</button>
                <img src="" alt="" id="lightbox-image">
                <div class="lightbox-caption"></div>
            </div>
        `;

        document.body.appendChild(lightbox);
    }

    attachEventListeners() {
        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                this.currentCategory = e.target.dataset.category;
                this.currentPage = 1;
                await this.loadImages(this.currentCategory, this.currentPage);
                this.render();
                this.attachEventListeners();
            });
        });

        // Gallery items (open lightbox)
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.currentImageIndex = parseInt(e.currentTarget.dataset.index);
                this.openLightbox();
            });
        });

        // Pagination
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (e.target.disabled) return;
                this.currentPage = parseInt(e.target.dataset.page);
                await this.loadImages(this.currentCategory, this.currentPage);
                this.render();
                this.attachEventListeners();
            });
        });

        // Search
        const searchInput = document.getElementById('gallery-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchImages(e.target.value);
                }, 300);
            });
        }

        // Upload button
        const uploadBtn = document.getElementById('upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.showUploadModal());
        }

        // Lightbox controls
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox) {
            lightbox.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
            lightbox.querySelector('.lightbox-prev').addEventListener('click', () => this.prevImage());
            lightbox.querySelector('.lightbox-next').addEventListener('click', () => this.nextImage());

            // Close on background click
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) this.closeLightbox();
            });

            // Keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (!this.lightboxOpen) return;
                if (e.key === 'Escape') this.closeLightbox();
                if (e.key === 'ArrowLeft') this.prevImage();
                if (e.key === 'ArrowRight') this.nextImage();
            });
        }
    }

    openLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        const image = this.images[this.currentImageIndex];

        lightbox.querySelector('#lightbox-image').src = image.url;
        lightbox.querySelector('.lightbox-caption').textContent = image.title;

        lightbox.classList.add('active');
        this.lightboxOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        const lightbox = document.getElementById('image-lightbox');
        lightbox.classList.remove('active');
        this.lightboxOpen = false;
        document.body.style.overflow = '';
    }

    prevImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.updateLightboxImage();
    }

    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        this.updateLightboxImage();
    }

    updateLightboxImage() {
        const image = this.images[this.currentImageIndex];
        const lightbox = document.getElementById('image-lightbox');

        lightbox.querySelector('#lightbox-image').src = image.url;
        lightbox.querySelector('.lightbox-caption').textContent = image.title;
    }

    async searchImages(query) {
        // Filter images locally or fetch from server
        if (query.trim() === '') {
            await this.loadImages(this.currentCategory, this.currentPage);
        } else {
            this.images = this.images.filter(img =>
                img.title.toLowerCase().includes(query.toLowerCase())
            );
        }

        document.getElementById('gallery-grid').innerHTML = this.renderImages();
        this.attachEventListeners();
    }

    showUploadModal() {
        // Implementar modal de upload
        alert('Funcionalidad de subida de imágenes próximamente');
    }
}

// Auto-inicializar si existe el contenedor
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const container = document.querySelector('.gallery-container');
        if (container) {
            window.imageGallery = new ImageGallery();
        }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageGallery;
}
