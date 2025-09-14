/**
 * CMS INTEGRATION - BACHILLERATO HÉROES DE LA PATRIA
 * Sistema de carga dinámica de contenido desde archivos JSON
 * Optimizado para arquitectura multi-página con Bootstrap 5
 */

// === CONFIGURATION ===
const CMS_CONFIG = {
    dataPath: './data/',
    fallbackData: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    retryDelay: 1000
};

// === CACHE SYSTEM ===
class DataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
    }

    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
    }

    get(key) {
        const timestamp = this.timestamps.get(key);
        if (!timestamp || Date.now() - timestamp > CMS_CONFIG.cacheTimeout) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }
}

// === MAIN CMS CLASS ===
class CMSIntegration {
    constructor() {
        this.cache = new DataCache();
        this.loadingStates = new Set();
        this.init();
    }

    async init() {
        try {
            // Load site configuration first
            await this.loadSiteConfig();
            
            // Load page-specific content
            await this.loadPageContent();
            
            //console.log('✅ CMS Integration initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing CMS:', error);
        }
    }

    // === CORE DATA LOADING ===
    async fetchData(filename, useCache = true) {
        if (useCache) {
            const cached = this.cache.get(filename);
            if (cached) return cached;
        }

        if (this.loadingStates.has(filename)) {
            // Return a promise that waits for the ongoing request
            return new Promise((resolve) => {
                const checkLoading = () => {
                    if (!this.loadingStates.has(filename)) {
                        const cached = this.cache.get(filename);
                        resolve(cached);
                    } else {
                        setTimeout(checkLoading, 100);
                    }
                };
                checkLoading();
            });
        }

        this.loadingStates.add(filename);

        try {
            const data = await this.fetchWithRetry(`${CMS_CONFIG.dataPath}${filename}`);
            this.cache.set(filename, data);
            return data;
        } finally {
            this.loadingStates.delete(filename);
        }
    }

    async fetchWithRetry(url, attempts = CMS_CONFIG.retryAttempts) {
        for (let i = 0; i < attempts; i++) {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                return await response.json();
            } catch (error) {
                if (i === attempts - 1) throw error;
                await this.delay(CMS_CONFIG.retryDelay * (i + 1));
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === SITE CONFIGURATION ===
    async loadSiteConfig() {
        try {
            const config = await this.fetchData('config.json');
            this.updateSiteElements(config);
            //console.log('✅ Site configuration loaded');
        } catch (error) {
            console.warn('⚠️ Could not load site configuration:', error);
        }
    }

    updateSiteElements(config) {
        const mappings = {
            'institution-name': config.institution_name,
            'institution-cct': config.cct,
            'institution-address': config.address,
            'institution-phone': config.phone,
            'institution-email': config.email,
            'institution-schedule': config.schedule,
            'institution-mission': config.mission,
            'institution-vision': config.vision
        };

        Object.entries(mappings).forEach(([id, value]) => {
            this.updateElementById(id, value);
        });

        // Update values in arrays (like institution values)
        if (config.values && Array.isArray(config.values)) {
            this.updateValuesSection(config.values);
        }
    }

    updateValuesSection(values) {
        const valuesContainer = document.getElementById('institution-values');
        if (!valuesContainer) return;

        const valuesHTML = values.map(value => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100 border-0 shadow-sm text-center">
                    <div class="card-body p-4">
                        <div class="value-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                             style="width: 70px; height: 70px;">
                            <i class="${value.icon || 'fas fa-star'} fa-2x"></i>
                        </div>
                        <h5 class="card-title fw-bold text-dark">${value.name}</h5>
                        <p class="card-text text-muted">${value.description}</p>
                    </div>
                </div>
            </div>
        `).join('');

        valuesContainer.innerHTML = valuesHTML;
    }

    // === PAGE-SPECIFIC CONTENT ===
    async loadPageContent() {
        const currentPage = this.getCurrentPage();
        
        switch (currentPage) {
            case 'index.html':
            case '':
                await this.loadHomePageContent();
                break;
            case 'comunidad.html':
                await this.loadCommunityContent();
                break;
            case 'conocenos.html':
                await this.loadTeacherInfo();
                break;
            default:
                // Load common content for all pages
                await this.loadCommonContent();
        }
    }

    getCurrentPage() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    async loadHomePageContent() {
        try {
            await Promise.all([
                this.loadRecentNews(3), // Load only 3 recent news for homepage
                this.loadUpcomingEvents(3), // Load only 3 upcoming events
                this.loadTestimonios(2) // Load 2 testimonials for homepage
            ]);
        } catch (error) {
            console.warn('⚠️ Error loading homepage content:', error);
        }
    }

    async loadCommunityContent() {
        try {
            await Promise.all([
                this.loadRecentNews(), // Load all news for community page
                this.loadTestimonios(), // Load all testimonials
                this.loadUpcomingEvents()
            ]);
        } catch (error) {
            console.warn('⚠️ Error loading community content:', error);
        }
    }

    async loadCommonContent() {
        // Load content that appears on multiple pages
        try {
            await this.loadTestimonios(1); // Load 1 testimonial for sidebar/footer
        } catch (error) {
            console.warn('⚠️ Error loading common content:', error);
        }
    }

    // === SPECIFIC CONTENT LOADERS ===
    async loadRecentNews(limit = null) {
        try {
            const newsData = await this.fetchData('noticias.json');
            const container = document.getElementById('recent-news');
            
            if (!container || !newsData || !newsData.noticias) return;

            // Sort by date and limit if specified
            let noticias = [...newsData.noticias].sort((a, b) => new Date(b.date) - new Date(a.date));
            if (limit) noticias = noticias.slice(0, limit);

            const newsHTML = noticias.map((noticia, index) => `
                <div class="col-md-6 col-lg-4">
                    <article class="card h-100 border-0 shadow-sm hover-lift">
                        <div class="card-img-top position-relative overflow-hidden">
                            <picture>
                                <source srcset="${noticia.image?.replace('.jpg', '.webp') || noticia.image}" type="image/webp">
                                <img src="${noticia.image || 'images/galeria/placeholder_actividad.webp'}" 
                                     alt="${noticia.title}" 
                                     class="img-fluid w-100" 
                                     style="height: 200px; object-fit: cover;" 
                                     loading="lazy">
                            </picture>
                            <div class="position-absolute top-0 start-0 m-3">
                                <span class="badge bg-primary">${this.formatDate(noticia.date)}</span>
                            </div>
                        </div>
                        <div class="card-body d-flex flex-column">
                            <div class="mb-2">
                                <span class="badge bg-light text-dark">${noticia.category || 'Noticia'}</span>
                            </div>
                            <h5 class="card-title mb-3">${noticia.title}</h5>
                            <p class="card-text text-muted flex-grow-1">${noticia.summary || this.truncateText(noticia.content, 120)}</p>
                            <div class="mt-auto">
                                <button class="btn btn-outline-primary" onclick="window.location.href='comunidad.html#noticia-${index}'">
                                    Leer más <i class="fas fa-arrow-right ms-1"></i>
                                </button>
                            </div>
                        </div>
                    </article>
                </div>
            `).join('');

            container.innerHTML = newsHTML;
            this.initLazyImages(container);

        } catch (error) {
            console.warn('⚠️ Error loading news:', error);
        }
    }

    async loadUpcomingEvents(limit = null) {
        try {
            const eventsData = await this.fetchData('eventos_calendario_pwa.json');
            const container = document.getElementById('upcoming-events');
            
            if (!container || !eventsData || !eventsData.events) return;

            // Filter upcoming events and sort by date
            const now = new Date();
            let upcomingEvents = eventsData.events.filter(event => new Date(event.start) > now);
            upcomingEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
            
            if (limit) upcomingEvents = upcomingEvents.slice(0, limit);

            const eventsHTML = upcomingEvents.map(event => `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm hover-lift">
                        <div class="card-body text-center">
                            <div class="event-date bg-primary text-white rounded-circle d-inline-flex flex-column align-items-center justify-content-center mb-3" 
                                 style="width: 80px; height: 80px;">
                                <div class="fw-bold" style="font-size: 1.5rem;">${this.getEventDay(event.start)}</div>
                                <div style="font-size: 0.75rem;">${this.getEventMonth(event.start)}</div>
                            </div>
                            <h5 class="card-title">${event.title}</h5>
                            <p class="card-text text-muted">${event.description || 'Evento importante de nuestro calendario académico'}</p>
                            <div class="mt-3">
                                <small class="text-muted">
                                    <i class="fas fa-clock me-1"></i>
                                    ${this.formatEventTime(event.start)}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = eventsHTML;

        } catch (error) {
            console.warn('⚠️ Error loading events:', error);
        }
    }

    async loadTestimonios(limit = null) {
        try {
            const testimoniosData = await this.fetchData('testimonios.json');
            const container = document.getElementById('testimonios-container') || 
                            document.querySelector('.testimonios-section .row');
            
            if (!container || !testimoniosData || !testimoniosData.testimonios) return;

            let testimonios = testimoniosData.testimonios;
            if (limit) testimonios = testimonios.slice(0, limit);

            const testimoniosHTML = testimonios.map(testimonio => `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body text-center p-4">
                            <div class="testimonial-avatar mb-3">
                                <img src="${testimonio.foto || 'images/placeholder/avatar-placeholder.jpg'}" 
                                     alt="${testimonio.nombre}" 
                                     class="rounded-circle" 
                                     width="80" height="80" 
                                     loading="lazy">
                            </div>
                            <blockquote class="blockquote mb-3">
                                <p class="text-muted fst-italic">"${testimonio.testimonio}"</p>
                            </blockquote>
                            <div class="testimonial-author">
                                <h6 class="fw-bold mb-1">${testimonio.nombre}</h6>
                                <small class="text-muted">
                                    ${testimonio.generacion ? `Generación ${testimonio.generacion}` : 'Egresado'} • 
                                    ${testimonio.carrera_actual || 'Profesionista'}
                                </small>
                            </div>
                            ${testimonio.rating ? this.generateStarRating(testimonio.rating) : ''}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = testimoniosHTML;

        } catch (error) {
            console.warn('⚠️ Error loading testimonials:', error);
        }
    }

    async loadTeacherInfo() {
        try {
            const docentesData = await this.fetchData('docentes.json');
            const container = document.getElementById('docentes-grid');
            
            if (!container || !docentesData || !docentesData.docentes) return;

            const docentesHTML = docentesData.docentes.map(docente => `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 border-0 shadow-sm text-center">
                        <div class="card-body p-4">
                            <div class="teacher-avatar mb-3">
                                <img src="${docente.foto || 'images/placeholder/teacher-placeholder.jpg'}" 
                                     alt="${docente.nombre}" 
                                     class="rounded-circle" 
                                     width="100" height="100" 
                                     loading="lazy">
                            </div>
                            <h5 class="card-title">${docente.nombre}</h5>
                            <p class="text-primary fw-medium">${docente.cargo || 'Docente'}</p>
                            <p class="card-text text-muted small">${docente.materias?.join(', ') || 'Especialista en educación'}</p>
                            ${docente.email ? `
                                <div class="mt-3">
                                    <a href="mailto:${docente.email}" class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-envelope me-1"></i>Contactar
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

            container.innerHTML = docentesHTML;

        } catch (error) {
            console.warn('⚠️ Error loading teacher information:', error);
        }
    }

    // === UTILITY METHODS ===
    updateElementById(id, value) {
        const element = document.getElementById(id);
        if (element && value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.value = value;
            } else {
                element.textContent = value;
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    }

    formatEventTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', { 
            weekday: 'long',
            day: 'numeric', 
            month: 'long'
        });
    }

    getEventDay(dateString) {
        return new Date(dateString).getDate();
    }

    getEventMonth(dateString) {
        const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 
                       'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        return months[new Date(dateString).getMonth()];
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    generateStarRating(rating) {
        const stars = Array(5).fill(0).map((_, i) => {
            return i < rating ? '<i class="fas fa-star text-warning"></i>' : '<i class="far fa-star text-muted"></i>';
        }).join('');
        
        return `<div class="star-rating mt-2">${stars}</div>`;
    }

    initLazyImages(container) {
        const images = container.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.addEventListener('load', () => {
                img.style.opacity = '1';
            });
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
        });
    }

    // === PUBLIC METHODS ===
    async refreshContent() {
        this.cache.clear();
        await this.loadPageContent();
        //console.log('✅ Content refreshed');
    }

    async loadSpecificContent(contentType) {
        switch (contentType) {
            case 'news':
                await this.loadRecentNews();
                break;
            case 'events':
                await this.loadUpcomingEvents();
                break;
            case 'testimonials':
                await this.loadTestimonios();
                break;
            case 'teachers':
                await this.loadTeacherInfo();
                break;
            default:
                console.warn(`Unknown content type: ${contentType}`);
        }
    }
}

// === ERROR HANDLING ===
window.addEventListener('unhandledrejection', event => {
    console.warn('Unhandled promise rejection in CMS:', event.reason);
    event.preventDefault();
});

// === INITIALIZATION ===
let cmsInstance;

document.addEventListener('DOMContentLoaded', () => {
    cmsInstance = new CMSIntegration();
});

// === GLOBAL ACCESS ===
window.CMS = {
    refresh: () => cmsInstance?.refreshContent(),
    loadContent: (type) => cmsInstance?.loadSpecificContent(type),
    getInstance: () => cmsInstance
};