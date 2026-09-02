/**
 * 📄 PAGE SECTIONS LOADER v2.1.0 - Carga secciones de páginas desde la API
 * 
 * Uso: Incluir este script en cada página HTML que quiera cargar contenido dinámico.
 * 
 * Funcionamiento:
 * 1. Detecta la página actual por el nombre del archivo
 * 2. Hace fetch a /api/page-sections/public/{page_slug}
 * 3. Renderiza las secciones en los contenedores con data-section-key
 * 4. Soporta items anidados para secciones con listas
 * 5. Soporta templates especializados via data-section-template
 * 6. NO destruye innerHTML si el contenedor ya tiene hijos con data-section-*
 * 
 * Templates disponibles:
 * - timeline: Para líneas de tiempo (eventos con año/descripción)
 * - valores-grid: Para grid de valores (cards con icono + título + descripción)
 * - infraestructura: Para instalaciones (cards con imagen overlay)
 * - staff-cards: Para personal/equipo (cards con foto + nombre + posición)
 * - generic-card: Template por defecto (cards simples)
 * 
 * @version 2.1.0
 * @changelog
 * - v2.1.0: Eliminado mision-vision (secciones separadas), protegido innerHTML existente
 * - v2.0.0: Agregados templates especializados para diferentes tipos de contenido
 * - v1.0.0: Versión inicial con template genérico
 */

(function () {
    'use strict';

    const LOG_PREFIX = '[PageSections]';
    const API_BASE = '/api/page-sections/public';

    // ============================================
    // 1. DETECTAR PÁGINA ACTUAL
    // ============================================

    function getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        const slug = filename.replace('.html', '');

        // Normalizar: index → inicio (para que coincida con la BD)
        if (slug === 'index' || slug === '') {
            return 'inicio';
        }

        return slug;
    }

    // ============================================
    // 2. FETCH DE SECCIONES
    // ============================================

    async function fetchPageSections(pageSlug) {
        try {
            const response = await fetch(`${API_BASE}/${pageSlug}`);
            if (!response.ok) {
                console.warn(`${LOG_PREFIX} No se pudieron cargar secciones para: ${pageSlug}`);
                return null;
            }
            const result = await response.json();
            if (result.success && result.data) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.warn(`${LOG_PREFIX} Error cargando secciones:`, error.message);
            return null;
        }
    }

    // ============================================
    // 3. RENDERIZAR SECCIONES
    // ============================================

    function renderSections(pageData) {
        if (!pageData || !pageData.sections || pageData.sections.length === 0) {
            console.log(`${LOG_PREFIX} No hay secciones para renderizar`);
            return;
        }

        for (const section of pageData.sections) {
            const container = document.querySelector(`[data-section-key="${section.section_key}"]`);
            if (!container) {
                console.warn(`${LOG_PREFIX} Contenedor no encontrado: ${section.section_key}`);
                continue;
            }

            // Determinar template de la sección
            const templateType = container.getAttribute('data-section-template') || 'generic-card';

            // Verificar si el contenedor ya tiene hijos con data-section-* o layout estructurado
            const hasExistingChildren = container.querySelector('[data-section-title], [data-section-content], [data-section-items], .section-title, .container');
            
            if (!hasExistingChildren && templateType !== 'generic-card') {
                // Solo reemplazar innerHTML si el contenedor está vacío de elementos dinámicos
                const templateHTML = getSectionTemplate(container, section);
                container.innerHTML = templateHTML;
                console.log(`${LOG_PREFIX} 📦 Template aplicado: ${section.section_key} (${templateType})`);
            }

            // Renderizar contenido de la sección
            renderSectionContent(container, section);

            // Renderizar items si existen
            if (section.items && section.items.length > 0) {
                renderSectionItems(container, section.items, templateType);
            }

            console.log(`${LOG_PREFIX} ✅ Sección renderizada: ${section.section_key} (template: ${templateType})`);
        }
    }

    // ============================================
    // 4. RENDERIZAR CONTENIDO DE SECCIÓN
    // ============================================

    function renderSectionContent(container, section) {
        // Actualizar título si existe (soporta data-section-title y selectores estándar)
        const titleEl = container.querySelector('[data-section-title], .section-title, h2, h3');
        if (titleEl && section.section_title) {
            const icon = titleEl.querySelector('i');
            if (icon) {
                titleEl.innerHTML = `${icon.outerHTML} ${document.createTextNode(section.section_title).textContent}`;
            } else {
                titleEl.textContent = section.section_title;
            }
        }

        // Actualizar subtítulo si existe (soporta data-section-subtitle y selectores estándar)
        const subtitleEl = container.querySelector('[data-section-subtitle], .section-subtitle, p.lead');
        if (subtitleEl && section.section_subtitle) {
            subtitleEl.textContent = section.section_subtitle;
        }

        // Actualizar contenido principal si existe
        const contentEl = container.querySelector('[data-section-content]');
        if (contentEl && section.section_content) {
            contentEl.innerHTML = section.section_content;
        }

        // Actualizar imagen si existe
        const imgEl = container.querySelector('[data-section-image]');
        if (imgEl && section.section_image_url) {
            imgEl.src = section.section_image_url;
            imgEl.alt = section.section_title || '';
        }

        // Actualizar icono si existe
        const iconEl = container.querySelector('[data-section-icon]');
        if (iconEl && section.section_icon) {
            iconEl.className = `fas ${section.section_icon}`;
        }
    }

    // ============================================
    // 5. RENDERIZAR ITEMS DE SECCIÓN
    // ============================================

    function renderSectionItems(container, items, templateType) {
        const itemsContainer = container.querySelector('[data-section-items]');
        if (!itemsContainer) return;

        // Limpiar contenido placeholder
        itemsContainer.innerHTML = '';

        for (const item of items) {
            const itemEl = createItemElement(item, templateType);
            if (itemEl) {
                itemsContainer.appendChild(itemEl);
            }
        }
    }

    // ============================================
    // 6. CREAR ELEMENTO DE ITEM
    // ============================================

    function createItemElement(item, templateType) {
        const template = getItemTemplate(item, templateType);
        if (!template) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'section-item';
        wrapper.dataset.itemId = item.id;
        wrapper.innerHTML = template;

        // Actualizar contenido dinámico
        updateElementText(wrapper, '[data-item-title]', item.item_title);
        updateElementText(wrapper, '[data-item-content]', item.item_content);
        updateElementHTML(wrapper, '[data-item-content-html]', item.item_content);

        const imgEl = wrapper.querySelector('[data-item-image]');
        if (imgEl && item.item_image_url) {
            if (imgEl.tagName === 'IMG') {
                imgEl.src = item.item_image_url;
                imgEl.alt = item.item_title || '';
            } else {
                // Para contenedores div, crear imagen
                imgEl.innerHTML = `<img src="${item.item_image_url}" alt="${item.item_title || ''}" class="img-fluid" loading="lazy">`;
            }
        }

        const iconEl = wrapper.querySelector('[data-item-icon]');
        if (iconEl && item.item_icon) {
            iconEl.className = `fas ${item.item_icon}`;
        }

        const linkEl = wrapper.querySelector('[data-item-link]');
        if (linkEl && item.item_link) {
            linkEl.href = item.item_link;
        }

        return wrapper;
    }

    // ============================================
    // 7. TEMPLATES POR TIPO DE SECCIÓN
    // ============================================

    function getSectionTemplate(container, section) {
        const templateType = container.getAttribute('data-section-template') || 'generic-card';
        
        const templates = {
            'timeline': timelineTemplate,
            'valores-grid': valoresGridTemplate,
            'infraestructura': infraestructuraTemplate,
            'staff-cards': staffCardsTemplate,
            'generic-card': genericCardTemplate
        };

        return (templates[templateType] || templates['generic-card'])(section);
    }

    // Template: Línea del Tiempo
    function timelineTemplate(section) {
        return `
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto">
                        <div class="text-center mb-5">
                            <h2 data-section-title class="fw-bold text-primary mb-3"></h2>
                            <p data-section-subtitle class="lead text-muted"></p>
                        </div>
                    </div>
                </div>
                <div data-section-items class="row g-4"></div>
            </div>
        `;
    }

    // Template: Grid de Valores
    function valoresGridTemplate(section) {
        return `
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto text-center mb-5">
                        <h2 data-section-title class="fw-bold text-primary mb-3"></h2>
                        <p data-section-subtitle class="lead text-muted"></p>
                    </div>
                </div>
                <div data-section-items class="row g-4"></div>
            </div>
        `;
    }

    // Template: Infraestructura/Instalaciones
    function infraestructuraTemplate(section) {
        return `
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto text-center mb-5">
                        <h2 data-section-title class="fw-bold text-primary mb-3"></h2>
                        <p data-section-subtitle class="lead text-muted"></p>
                    </div>
                </div>
                <div data-section-items class="row g-4"></div>
            </div>
        `;
    }

    // Template: Tarjetas de Personal/Staff
    function staffCardsTemplate(section) {
        return `
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto text-center mb-5">
                        <h2 data-section-title class="fw-bold text-primary mb-3"></h2>
                        <p data-section-subtitle class="lead text-muted"></p>
                    </div>
                </div>
                <div data-section-items class="row g-4 justify-content-center"></div>
            </div>
        `;
    }

    // Template Genérico (card simple)
    function genericCardTemplate(section) {
        return `
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto text-center mb-5">
                        <h2 data-section-title class="fw-bold text-primary mb-3"></h2>
                        <p data-section-subtitle class="lead text-muted"></p>
                    </div>
                </div>
                <div data-section-items class="row g-4"></div>
                <div data-section-content class="row mt-4">
                    <div class="col-12">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body p-4">
                                <p class="card-text lead text-muted text-center"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // 8. TEMPLATES POR TIPO DE ITEM
    // ============================================

    function getItemTemplate(item, templateType) {
        const itemTemplates = {
            'timeline': timelineItemTemplate,
            'valores-grid': valoresItemTemplate,
            'infraestructura': infraestructuraItemTemplate,
            'staff-cards': staffItemTemplate,
            'generic-card': genericItemTemplate
        };

        return (itemTemplates[templateType] || itemTemplates['generic-card'])(item);
    }

    // Item Template: Timeline
    function timelineItemTemplate(item) {
        return `
            <div class="col-md-6">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body p-4">
                        <div class="d-flex align-items-start">
                            <div class="timeline-year bg-primary text-white rounded px-3 py-2 me-3">
                                <strong>${item.item_title || ''}</strong>
                            </div>
                            <div>
                                <div data-item-content-html class="text-muted">${item.item_content || ''}</div>
                                ${item.item_link ? `
                                    <a data-item-link href="${item.item_link}" class="btn btn-outline-primary btn-sm mt-2">
                                        Conocer más <i class="fas fa-arrow-right ms-1"></i>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Item Template: Valores
    function valoresItemTemplate(item) {
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm text-center">
                    <div class="card-body p-4">
                        <div class="value-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 value-icon-md">
                            <i data-item-icon class="fas fa-heart fa-2x"></i>
                        </div>
                        <h5 data-item-title class="card-title fw-bold text-dark">${item.item_title || ''}</h5>
                        <div data-item-content-html class="card-text text-muted">${item.item_content || ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Item Template: Infraestructura
    function infraestructuraItemTemplate(item) {
        return `
            <div class="col-lg-4 col-md-6">
                <div class="facility-card card border-0 shadow-sm overflow-hidden">
                    <div class="facility-image position-relative">
                        <div data-item-image class="bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                            <i data-item-icon class="fas fa-building fa-3x text-muted"></i>
                        </div>
                        <div class="facility-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                            <i class="fas fa-arrow-right fa-2x text-white"></i>
                        </div>
                    </div>
                    <div class="card-body p-4 text-center">
                        <h5 data-item-title class="card-title fw-bold">${item.item_title || ''}</h5>
                        <div data-item-content-html class="card-text text-muted">${item.item_content || ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Item Template: Staff/Personal
    function staffItemTemplate(item) {
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm text-center">
                    <div class="card-body p-4">
                        <div data-item-image class="avatar-avatar bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 100px; height: 100px;">
                            <i data-item-icon class="fas fa-user fa-3x"></i>
                        </div>
                        <h5 data-item-title class="card-title fw-bold text-dark">${item.item_title || ''}</h5>
                        <div data-item-content-html class="text-muted">${item.item_content || ''}</div>
                        ${item.item_link ? `
                            <a data-item-link href="${item.item_link}" class="btn btn-outline-primary btn-sm mt-3">
                                Ver perfil <i class="fas fa-arrow-right ms-1"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Item Template: Genérico (card simple)
    function genericItemTemplate(item) {
        return `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100 border-0 shadow-sm">
                    <div class="card-body p-4 text-center">
                        ${item.item_icon ? `
                            <div class="feature-icon bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                                <i data-item-icon class="fas ${item.item_icon} fa-2x"></i>
                            </div>
                        ` : ''}
                        <h5 data-item-title class="card-title fw-bold">${item.item_title || ''}</h5>
                        <div data-item-content-html class="card-text text-muted">${item.item_content || ''}</div>
                        ${item.item_link ? `
                            <a data-item-link href="${item.item_link}" class="btn btn-outline-primary btn-sm mt-3">
                                Conocer más <i class="fas fa-arrow-right ms-1"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // 9. UTILIDADES
    // ============================================

    function updateElementText(container, selector, text) {
        const el = container.querySelector(selector);
        if (el && text) {
            el.textContent = text;
        }
    }

    function updateElementHTML(container, selector, html) {
        const el = container.querySelector(selector);
        if (el && html) {
            el.innerHTML = html;
        }
    }

    // ============================================
    // 9. INICIALIZACIÓN
    // ============================================

    async function init() {
        const pageSlug = getCurrentPage();
        console.log(`${LOG_PREFIX} Cargando secciones para: ${pageSlug}`);

        const pageData = await fetchPageSections(pageSlug);
        if (pageData) {
            renderSections(pageData);
        }
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
