/**
 * ADMIN TENANT CMS - Gestión de Contenido del Director
 * CRUD completo para las 6 secciones: Personal, Timeline, Galería,
 * Testimonios, Instalaciones, Imágenes del Hero
 */

class AdminTenantCMS {
    constructor() {
        this.apiBase = '/api/tenant-cms';
        this.currentSection = 'staff';
        this.sections = {
            staff: { name: 'Personal', icon: 'fa-users', endpoint: 'staff', color: 'primary' },
            timeline: { name: 'Línea del Tiempo', icon: 'fa-clock', endpoint: 'timeline', color: 'success' },
            gallery: { name: 'Galería', icon: 'fa-images', endpoint: 'gallery', color: 'info' },
            testimonials: { name: 'Testimonios', icon: 'fa-quote-right', endpoint: 'testimonials', color: 'warning' },
            installations: { name: 'Instalaciones', icon: 'fa-building', endpoint: 'installations', color: 'danger' },
            hero: { name: 'Imágenes Hero', icon: 'fa-image', endpoint: 'hero', color: 'secondary' }
        };
        this.pagination = {};
        Object.keys(this.sections).forEach(s => {
            this.pagination[s] = { page: 1, limit: 10, total: 0 };
        });

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.loadSection('staff');
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-cms-action]');
            if (!btn) return;

            const action = btn.dataset.cmsAction;
            const section = btn.dataset.cmsSection || this.currentSection;
            const id = btn.dataset.cmsId;

            switch (action) {
                case 'selectSection': this.loadSection(section); break;
                case 'create': this.showCreateForm(section); break;
                case 'edit': this.showEditForm(section, id); break;
                case 'delete': this.deleteItem(section, id); break;
                case 'prevPage': this.changePage(section, -1); break;
                case 'nextPage': this.changePage(section, 1); break;
                case 'saveNew': this.saveNew(section); break;
                case 'saveEdit': this.saveEdit(section, id); break;
                case 'cancelForm': this.cancelForm(); break;
            }
        });

        const form = document.getElementById('tenantCmsForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const section = form.dataset.section;
                const id = form.dataset.editId;
                if (id) {
                    this.saveEdit(section, id);
                } else {
                    this.saveNew(section);
                }
            });
        }
    }

    getToken() {
        return localStorage.getItem('authToken') || '';
    }

    async fetchAPI(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                }
            };
            if (data) options.body = JSON.stringify(data);

            const response = await fetch(`${this.apiBase}/${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Error ${response.status}`);
            }
            return result;
        } catch (error) {
            console.error(`[AdminTenantCMS] Error API ${endpoint}:`, error);
            throw error;
        }
    }

    async loadStats() {
        try {
            const result = await this.fetchAPI('stats');
            if (result.success) {
                const stats = result.data;
                Object.keys(this.sections).forEach(key => {
                    const el = document.getElementById(`tenantCms-${key}-count`);
                    if (el) {
                        const countKey = key === 'staff' ? 'staff' :
                                         key === 'installations' ? 'installations' :
                                         key === 'hero' ? 'hero' : key;
                        el.textContent = stats[countKey]?.total || 0;
                    }
                });
            }
        } catch (error) {
            console.error('[AdminTenantCMS] Error cargando stats:', error);
        }
    }

    async loadSection(section) {
        this.currentSection = section;
        const sectionInfo = this.sections[section];

        document.querySelectorAll('.tenant-cms-section-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cmsSection === section);
        });

        const container = document.getElementById('tenantCmsList');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-${sectionInfo.color}" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando ${sectionInfo.name}...</p>
            </div>`;

        try {
            const pag = this.pagination[section];
            const result = await this.fetchAPI(`${sectionInfo.endpoint}?page=${pag.page}&limit=${pag.limit}`);

            if (result.success) {
                const items = result.data || [];
                pag.total = result.pagination?.total || items.length;
                this.renderList(section, items);
            } else {
                container.innerHTML = `<div class="alert alert-warning">No se pudieron cargar los datos.</div>`;
            }
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    }

    renderList(section, items) {
        const container = document.getElementById('tenantCmsList');
        const sectionInfo = this.sections[section];

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="${sectionInfo.icon} fa-3x mb-3 opacity-50"></i>
                    <p>No hay elementos en esta sección.</p>
                    <button class="btn btn-sm btn-${sectionInfo.color}" data-cms-action="create" data-cms-section="${section}">
                        <i class="fas fa-plus me-1"></i>Agregar primero
                    </button>
                </div>`;
            return;
        }

        let tableHTML = `
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>${this.getTableHeaders(section)}</tr>
                </thead>
                <tbody>`;

        items.forEach(item => {
            tableHTML += `<tr>${this.getTableRow(section, item)}</tr>`;
        });

        tableHTML += `</tbody></table>`;

        const pag = this.pagination[section];
        const totalPages = Math.ceil(pag.total / pag.limit);

        tableHTML += `
            <div class="d-flex justify-content-between align-items-center mt-3">
                <small class="text-muted">Mostrando ${items.length} de ${pag.total} elementos</small>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" ${pag.page <= 1 ? 'disabled' : ''}
                        data-cms-action="prevPage" data-cms-section="${section}">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="btn btn-outline-secondary disabled">Página ${pag.page} de ${totalPages || 1}</span>
                    <button class="btn btn-outline-secondary" ${pag.page >= totalPages ? 'disabled' : ''}
                        data-cms-action="nextPage" data-cms-section="${section}">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>`;

        container.innerHTML = tableHTML;
    }

    getTableHeaders(section) {
        const headers = {
            staff: '<th>Nombre</th><th>Puesto</th><th>Departamento</th><th>Estado</th><th>Acciones</th>',
            timeline: '<th>Año</th><th>Título</th><th>Descripción</th><th>Estado</th><th>Acciones</th>',
            gallery: '<th>Título</th><th>Categoría</th><th>Álbum</th><th>Estado</th><th>Acciones</th>',
            testimonials: '<th>Nombre</th><th>Año Grad.</th><th>Ocupación</th><th>Rating</th><th>Acciones</th>',
            installations: '<th>Nombre</th><th>Capacidad</th><th>Estado</th><th>Acciones</th>',
            hero: '<th>Título</th><th>Subtítulo</th><th>Enlace</th><th>Estado</th><th>Acciones</th>'
        };
        return headers[section] || '';
    }

    getTableRow(section, item) {
        const editBtn = `<button class="btn btn-sm btn-outline-primary me-1" data-cms-action="edit" data-cms-section="${section}" data-cms-id="${item.id}">
            <i class="fas fa-edit"></i></button>`;
        const delBtn = `<button class="btn btn-sm btn-outline-danger" data-cms-action="delete" data-cms-section="${section}" data-cms-id="${item.id}">
            <i class="fas fa-trash"></i></button>`;
        const badge = item.is_active !== false
            ? '<span class="badge bg-success">Activo</span>'
            : '<span class="badge bg-secondary">Inactivo</span>';

        switch (section) {
            case 'staff':
                return `<td><strong>${this.esc(item.full_name)}</strong></td>
                    <td>${this.esc(item.position || '-')}</td>
                    <td>${this.esc(item.department || '-')}</td>
                    <td>${badge}</td><td>${editBtn}${delBtn}</td>`;
            case 'timeline':
                return `<td><strong>${this.esc(item.year || '-')}</strong></td>
                    <td>${this.esc(item.title)}</td>
                    <td>${this.esc((item.description || '').substring(0, 60))}${(item.description || '').length > 60 ? '...' : ''}</td>
                    <td>${badge}</td><td>${editBtn}${delBtn}</td>`;
            case 'gallery':
                return `<td><strong>${this.esc(item.title)}</strong></td>
                    <td>${this.esc(item.category || '-')}</td>
                    <td>${this.esc(item.album || '-')}</td>
                    <td>${badge}</td><td>${editBtn}${delBtn}</td>`;
            case 'testimonials':
                return `<td><strong>${this.esc(item.full_name)}</strong></td>
                    <td>${this.esc(item.graduation_year || '-')}</td>
                    <td>${this.esc(item.occupation || '-')}</td>
                    <td>${'★'.repeat(item.rating || 0)}${'☆'.repeat(5 - (item.rating || 0))}</td>
                    <td>${editBtn}${delBtn}</td>`;
            case 'installations':
                return `<td><strong>${this.esc(item.name)}</strong></td>
                    <td>${this.esc(item.capacity || '-')}</td>
                    <td>${badge}</td><td>${editBtn}${delBtn}</td>`;
            case 'hero':
                return `<td><strong>${this.esc(item.title)}</strong></td>
                    <td>${this.esc(item.subtitle || '-')}</td>
                    <td>${this.esc(item.link || '-')}</td>
                    <td>${badge}</td><td>${editBtn}${delBtn}</td>`;
            default:
                return '';
        }
    }

    esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showCreateForm(section) {
        const sectionInfo = this.sections[section];
        const formContainer = document.getElementById('tenantCmsFormContainer');
        if (!formContainer) return;

        formContainer.innerHTML = this.getFormHTML(section);
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    showEditForm(section, id) {
        const formContainer = document.getElementById('tenantCmsFormContainer');
        if (!formContainer) return;

        this.fetchAPI(`${this.sections[section].endpoint}/${id}`).then(result => {
            if (result.success && result.data) {
                formContainer.innerHTML = this.getFormHTML(section, result.data);
                formContainer.style.display = 'block';
                formContainer.scrollIntoView({ behavior: 'smooth' });
            }
        }).catch(err => {
            alert('Error cargando elemento: ' + err.message);
        });
    }

    getFormHTML(section, item = null) {
        const isEdit = !!item;
        const title = isEdit ? `Editar ${this.sections[section].name}` : `Nuevo(a) ${this.sections[section].name}`;

        let fields = '';
        switch (section) {
            case 'staff':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre completo *</label>
                            <input type="text" class="form-control" name="full_name" value="${this.esc(item?.full_name || '')}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Puesto</label>
                            <input type="text" class="form-control" name="position" value="${this.esc(item?.position || '')}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Departamento</label>
                            <input type="text" class="form-control" name="department" value="${this.esc(item?.department || '')}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">URL Foto</label>
                            <input type="url" class="form-control" name="photo_url" value="${this.esc(item?.photo_url || '')}" placeholder="https://...">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" name="email" value="${this.esc(item?.email || '')}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Teléfono</label>
                            <input type="tel" class="form-control" name="phone" value="${this.esc(item?.phone || '')}">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Biografía</label>
                            <textarea class="form-control" name="bio" rows="3">${this.esc(item?.bio || '')}</textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Orden</label>
                            <input type="number" class="form-control" name="sort_order" value="${item?.sort_order || 0}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'timeline':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Año *</label>
                            <input type="number" class="form-control" name="year" value="${item?.year || ''}" min="1900" max="2099" required>
                        </div>
                        <div class="col-md-8">
                            <label class="form-label">Título *</label>
                            <input type="text" class="form-control" name="title" value="${this.esc(item?.title || '')}" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Descripción *</label>
                            <textarea class="form-control" name="description" rows="3" required>${this.esc(item?.description || '')}</textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">URL Imagen</label>
                            <input type="url" class="form-control" name="image_url" value="${this.esc(item?.image_url || '')}" placeholder="https://...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Orden</label>
                            <input type="number" class="form-control" name="sort_order" value="${item?.sort_order || 0}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'gallery':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Título *</label>
                            <input type="text" class="form-control" name="title" value="${this.esc(item?.title || '')}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Categoría</label>
                            <select class="form-select" name="category">
                                <option value="">Seleccionar...</option>
                                ${['Instalaciones','Eventos','Actividades','Académico','Deportivo','Cultural'].map(c =>
                                    `<option value="${c}" ${item?.category === c ? 'selected' : ''}>${c}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">URL Imagen *</label>
                            <input type="url" class="form-control" name="image_url" value="${this.esc(item?.image_url || '')}" placeholder="https://..." required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Descripción</label>
                            <input type="text" class="form-control" name="description" value="${this.esc(item?.description || '')}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Álbum</label>
                            <input type="text" class="form-control" name="album" value="${this.esc(item?.album || '')}" placeholder="Ej: Campus 2026">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Orden</label>
                            <input type="number" class="form-control" name="sort_order" value="${item?.sort_order || 0}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'testimonials':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre completo *</label>
                            <input type="text" class="form-control" name="full_name" value="${this.esc(item?.full_name || '')}" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Año graduación</label>
                            <input type="number" class="form-control" name="graduation_year" value="${item?.graduation_year || ''}" min="1990" max="2099">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Rating (1-5)</label>
                            <input type="number" class="form-control" name="rating" value="${item?.rating || 5}" min="1" max="5">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Ocupación actual</label>
                            <input type="text" class="form-control" name="occupation" value="${this.esc(item?.occupation || '')}">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">URL Foto</label>
                            <input type="url" class="form-control" name="photo_url" value="${this.esc(item?.photo_url || '')}" placeholder="https://...">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Testimonio *</label>
                            <textarea class="form-control" name="testimonial_text" rows="4" required>${this.esc(item?.testimonial_text || '')}</textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'installations':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre *</label>
                            <input type="text" class="form-control" name="name" value="${this.esc(item?.name || '')}" required>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Capacidad</label>
                            <input type="text" class="form-control" name="capacity" value="${this.esc(item?.capacity || '')}" placeholder="Ej: 40 personas">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" name="type">
                                <option value="">Seleccionar...</option>
                                ${['Aula','Laboratorio','Auditorio','Cancha','Biblioteca','Taller','Otro'].map(t =>
                                    `<option value="${t}" ${item?.type === t ? 'selected' : ''}>${t}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-control" name="description" rows="2">${this.esc(item?.description || '')}</textarea>
                        </div>
                        <div class="col-12">
                            <label class="form-label">URL Imagen</label>
                            <input type="url" class="form-control" name="image_url" value="${this.esc(item?.image_url || '')}" placeholder="https://...">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Equipamiento</label>
                            <input type="text" class="form-control" name="equipment" value="${this.esc(item?.equipment || '')}" placeholder="Ej: Proyector, internet">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Orden</label>
                            <input type="number" class="form-control" name="sort_order" value="${item?.sort_order || 0}">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;

            case 'hero':
                fields = `
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Título *</label>
                            <input type="text" class="form-control" name="title" value="${this.esc(item?.title || '')}" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Subtítulo</label>
                            <input type="text" class="form-control" name="subtitle" value="${this.esc(item?.subtitle || '')}">
                        </div>
                        <div class="col-12">
                            <label class="form-label">URL Imagen *</label>
                            <input type="url" class="form-control" name="image_url" value="${this.esc(item?.image_url || '')}" placeholder="https://..." required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Enlace (botón)</label>
                            <input type="url" class="form-control" name="link" value="${this.esc(item?.link || '')}" placeholder="https://...">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Texto del botón</label>
                            <input type="text" class="form-control" name="button_text" value="${this.esc(item?.button_text || '')}" placeholder="Ver más">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Orden</label>
                            <input type="number" class="form-control" name="sort_order" value="${item?.sort_order || 0}">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Activo</label>
                            <select class="form-select" name="is_active">
                                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Sí</option>
                                <option value="false" ${item?.is_active === false ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>`;
                break;
        }

        return `
            <div class="card border-primary">
                <div class="card-header bg-primary text-white d-flex justify-content-between">
                    <h6 class="mb-0"><i class="fas fa-${isEdit ? 'edit' : 'plus'} me-2"></i>${title}</h6>
                    <button class="btn btn-sm btn-outline-light" data-cms-action="cancelForm">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="card-body">
                    <form id="tenantCmsForm" data-section="${section}" data-edit-id="${item?.id || ''}">
                        ${fields}
                        <div class="mt-3 d-flex gap-2">
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save me-1"></i>${isEdit ? 'Actualizar' : 'Guardar'}
                            </button>
                            <button type="button" class="btn btn-secondary" data-cms-action="cancelForm">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>`;
    }

    cancelForm() {
        const formContainer = document.getElementById('tenantCmsFormContainer');
        if (formContainer) {
            formContainer.innerHTML = '';
            formContainer.style.display = 'none';
        }
    }

    async saveNew(section) {
        const form = document.getElementById('tenantCmsForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.is_active) data.is_active = data.is_active === 'true';
        if (data.year) data.year = parseInt(data.year);
        if (data.rating) data.rating = parseInt(data.rating);
        if (data.sort_order) data.sort_order = parseInt(data.sort_order);

        try {
            const result = await this.fetchAPI(this.sections[section].endpoint, 'POST', data);
            if (result.success) {
                this.cancelForm();
                this.loadSection(section);
                this.loadStats();
                this.showToast(`${this.sections[section].name} creado exitosamente`);
            }
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        }
    }

    async saveEdit(section, id) {
        const form = document.getElementById('tenantCmsForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        if (data.is_active) data.is_active = data.is_active === 'true';
        if (data.year) data.year = parseInt(data.year);
        if (data.rating) data.rating = parseInt(data.rating);
        if (data.sort_order) data.sort_order = parseInt(data.sort_order);

        try {
            const result = await this.fetchAPI(`${this.sections[section].endpoint}/${id}`, 'PUT', data);
            if (result.success) {
                this.cancelForm();
                this.loadSection(section);
                this.loadStats();
                this.showToast(`${this.sections[section].name} actualizado exitosamente`);
            }
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
        }
    }

    async deleteItem(section, id) {
        if (!confirm(`¿Estás seguro de eliminar este elemento de ${this.sections[section].name}?`)) return;

        try {
            const result = await this.fetchAPI(`${this.sections[section].endpoint}/${id}`, 'DELETE');
            if (result.success) {
                this.loadSection(section);
                this.loadStats();
                this.showToast('Elemento eliminado');
            }
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }

    changePage(section, delta) {
        const pag = this.pagination[section];
        pag.page = Math.max(1, pag.page + delta);
        this.loadSection(section);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'alert alert-success alert-dismissible fade show position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tenantCmsList')) {
        window.adminTenantCMS = new AdminTenantCMS();
    }
});
