/**
 * 🎛️ TENANT CMS LOADER - Carga contenido del CMS del director
 * 
 * Reemplaza contenido hardcodeado con datos dinámicos de:
 * - Personal del plantel
 * - Línea del tiempo
 * - Galería de imágenes
 * - Testimonios
 * - Instalaciones
 * - Imágenes del hero
 * 
 * Se conecta a: GET /api/tenant-cms/public/:section?tenant_id=X
 */

(function() {
    'use strict';

    const CMS_BASE = '/api/tenant-cms/public';
    const CACHE_KEY = 'tenant_cms_cache';
    const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

    // ============================================
    // UTILIDADES
    // ============================================

    function getTenantId() {
        return window.TENANT_CONFIG?.id || 
               window.tenantConfig?.id || 
               new URLSearchParams(window.location.search).get('tenant_id') || 
               1;
    }

    function getCached(section) {
        try {
            const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
            const entry = cache[section];
            if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
                return entry.data;
            }
        } catch (e) {}
        return null;
    }

    function setCache(section, data) {
        try {
            const cache = JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}');
            cache[section] = { data, timestamp: Date.now() };
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (e) {}
    }

    async function fetchCMS(section) {
        const cached = getCached(section);
        if (cached) return cached;

        try {
            const tenantId = getTenantId();
            const response = await fetch(`${CMS_BASE}/${section}?tenant_id=${tenantId}`);
            if (!response.ok) return null;
            const result = await response.json();
            if (result.success && result.data) {
                setCache(section, result.data);
                return result.data;
            }
        } catch (e) {
            console.warn(`[CMS-LOADER] Error cargando ${section}:`, e.message);
        }
        return null;
    }

    // ============================================
    // RENDERIZADORES
    // ============================================

    function renderStaff(staff) {
        if (!staff || staff.length === 0) return;

        const director = staff.find(s => s.position?.toLowerCase().includes('director'));
        const docentes = staff.filter(s => !s.position?.toLowerCase().includes('director'));

        // Actualizar sección del Director
        const directorSection = document.querySelector('.director-photo');
        if (directorSection && director) {
            const img = directorSection.querySelector('img');
            if (img && director.photo_url) {
                img.src = director.photo_url;
                img.alt = `Foto del Director, ${director.full_name}`;
            }
            const nameEl = directorSection.closest('.row')?.querySelector('h4');
            if (nameEl) nameEl.textContent = director.full_name;
            const positionEl = directorSection.closest('.row')?.querySelector('.text-primary');
            if (positionEl && director.position) positionEl.textContent = director.position;
            const messageEl = document.querySelector('.director-message blockquote');
            if (messageEl && director.bio) {
                messageEl.innerHTML = `<p>"${director.bio}"</p>
                    <footer class="blockquote-footer mt-3">
                        <cite title="Director General">${director.full_name}</cite>
                    </footer>`;
            }
        }

        // Renderizar organigrama
        const orgContainer = document.getElementById('organigramaCards');
        if (orgContainer && docentes.length > 0) {
            const docentesHTML = docentes.map(person => `
                <div class="col-xl-2 col-lg-3 col-md-4 col-6">
                    <div class="card border-0 shadow-sm text-center h-100 org-card" data-person-id="${person.id}">
                        <div class="card-body p-3">
                            <div class="team-photo mb-2">
                                <img src="${person.photo_url || '/images/placeholder/teacher-placeholder.webp'}" 
                                     alt="Foto de ${person.full_name}"
                                     class="img-fluid rounded-circle shadow w-h-70px object-fit-cover"
                                     loading="lazy">
                            </div>
                            <h6 class="fw-bold text-primary mb-1 fs-0-8rem">${person.full_name}</h6>
                            <small class="text-muted d-block">${person.position || 'Docente'}</small>
                        </div>
                    </div>
                </div>
            `).join('');

            // Mantener la tarjeta del director si existe
            const directorCard = orgContainer.querySelector('[data-person-id="dir"]');
            const docentesSection = orgContainer.querySelector('.row.g-3.mb-4');
            if (docentesSection) {
                docentesSection.innerHTML = docentesHTML;
            }
        }
    }

    function renderTimeline(events) {
        if (!events || events.length === 0) return;

        const timelineContainer = document.querySelector('.history-timeline');
        if (!timelineContainer) return;

        const colors = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
        const timelineHTML = events.map((event, i) => `
            <div class="timeline-item mb-4">
                <div class="d-flex">
                    <div class="timeline-year ${colors[i % colors.length]} text-white rounded px-3 py-2 me-3">
                        <strong>${event.year}</strong>
                    </div>
                    <div>
                        <h5 class="fw-bold text-dark">${event.title}</h5>
                        <p class="text-muted mb-2">${event.description || ''}</p>
                        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="img-fluid rounded mt-2" style="max-height:150px">` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        timelineContainer.innerHTML = timelineHTML;
    }

    function renderInstallations(installations) {
        if (!installations || installations.length === 0) return;

        const container = document.querySelector('#instalaciones .row.g-4');
        if (!container) return;

        const html = installations.map(inst => `
            <div class="col-md-4">
                <div class="card border-0 shadow-sm h-100">
                    <img src="${inst.image_url || '/images/placeholder/teacher-placeholder.webp'}" 
                         class="card-img-top" alt="${inst.name}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title fw-bold">${inst.name}</h5>
                        <p class="card-text">${inst.description || ''}</p>
                        ${inst.capacity ? `<small class="text-muted"><i class="fas fa-users me-1"></i>${inst.capacity}</small>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    function renderGallery(images) {
        if (!images || images.length === 0) return;

        const container = document.querySelector('#galeria .row.g-4, .gallery-grid');
        if (!container) return;

        const html = images.map(img => `
            <div class="col-md-4 col-6">
                <a href="${img.image_url}" class="gallery-item" data-lightbox="gallery">
                    <img src="${img.thumbnail_url || img.image_url}" alt="${img.title || 'Galería'}" 
                         class="img-fluid rounded shadow-sm" loading="lazy">
                    ${img.title ? `<div class="gallery-overlay"><span>${img.title}</span></div>` : ''}
                </a>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    function renderTestimonials(testimonials) {
        if (!testimonials || testimonials.length === 0) return;

        const container = document.querySelector('#testimonios .row, .testimonials-container');
        if (!container) return;

        const html = testimonials.map(t => `
            <div class="col-md-6 col-lg-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-center mb-3">
                            <img src="${t.photo_url || '/images/placeholder/avatar-placeholder.webp'}" 
                                 alt="${t.person_name}" class="rounded-circle me-3" width="50" height="50">
                            <div>
                                <h6 class="fw-bold mb-0">${t.person_name}</h6>
                                <small class="text-muted">${t.occupation || ''} ${t.graduation_year ? '| Generación ' + t.graduation_year : ''}</small>
                            </div>
                        </div>
                        <p class="mb-2">"${t.testimonial}"</p>
                        <div class="text-warning">
                            ${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    function renderHeroImages(images) {
        if (!images || images.length === 0) return;

        const carousel = document.querySelector('#heroCarousel, .hero-carousel');
        if (!carousel) return;

        const indicators = carousel.querySelector('.carousel-indicators');
        const inner = carousel.querySelector('.carousel-inner');
        if (!indicators || !inner) return;

        indicators.innerHTML = images.map((_, i) => 
            `<button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${i}" ${i === 0 ? 'class="active"' : ''}></button>`
        ).join('');

        inner.innerHTML = images.map((img, i) => `
            <div class="carousel-item ${i === 0 ? 'active' : ''}">
                <img src="${img.image_url}" class="d-block w-100" alt="${img.title || 'Imagen del plantel'}">
                ${img.title ? `<div class="carousel-caption d-none d-md-block">
                    <h3>${img.title}</h3>
                    ${img.subtitle ? `<p>${img.subtitle}</p>` : ''}
                </div>` : ''}
            </div>
        `).join('');
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async function loadCMSContent() {
        // Detectar qué secciones existen en la página
        const sections = [];

        if (document.querySelector('.director-photo') || document.getElementById('organigramaCards')) {
            sections.push({ name: 'staff', render: renderStaff });
        }
        if (document.querySelector('.history-timeline')) {
            sections.push({ name: 'timeline', render: renderTimeline });
        }
        if (document.querySelector('#instalaciones')) {
            sections.push({ name: 'installations', render: renderInstallations });
        }
        if (document.querySelector('#galeria') || document.querySelector('.gallery-grid')) {
            sections.push({ name: 'gallery', render: renderGallery });
        }
        if (document.querySelector('#testimonios') || document.querySelector('.testimonials-container')) {
            sections.push({ name: 'testimonials', render: renderTestimonials });
        }
        if (document.querySelector('#heroCarousel') || document.querySelector('.hero-carousel')) {
            sections.push({ name: 'hero', render: renderHeroImages });
        }

        if (sections.length === 0) return;

        // Cargar y renderizar cada sección en paralelo
        const promises = sections.map(async (section) => {
            const data = await fetchCMS(section.name);
            if (data && data.length > 0) {
                section.render(data);
            }
        });

        await Promise.allSettled(promises);
    }

    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCMSContent);
    } else {
        loadCMSContent();
    }

    // Exponer para recarga manual
    window.reloadTenantCMS = loadCMSContent;

})();
