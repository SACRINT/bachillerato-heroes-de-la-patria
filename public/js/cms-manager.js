/**
 * CMS MANAGER - Sistema de Gestión de Contenido
 * Maneja la creación, edición y eliminación de noticias, eventos, avisos y comunicados
 */

class CMSManager {
    constructor() {
        console.log('🎛️ [CMS] Inicializando sistema de gestión de contenido...');
        // Endpoints PostgreSQL unificados
        this.apiBase = '/api/';

        // Estado de paginación
        this.pagination = {
            noticias: { page: 1, limit: 20, total: 0 },
            eventos: { page: 1, limit: 20, total: 0 },
            avisos: { page: 1, limit: 20, total: 0 },
            comunicados: { page: 1, limit: 20, total: 0 }
        };

        // Instancias de PaginationManager
        this.paginationManagers = {};

        this.init();
    }

    init() {
        this.initializeEventListeners();
        console.log('✅ [CMS] Sistema CMS iniciado correctamente');
    }

    // ==========================================
    // INICIALIZACIÓN DE EVENT LISTENERS
    // ==========================================

    initializeEventListeners() {
        // Formulario de noticias
        const noticiaForm = document.getElementById('noticiaForm');
        if (noticiaForm) {
            noticiaForm.addEventListener('submit', (e) => this.handleNoticiaSubmit(e));
        }

        // Formulario de eventos
        const eventoForm = document.getElementById('eventoForm');
        if (eventoForm) {
            eventoForm.addEventListener('submit', (e) => this.handleEventoSubmit(e));
        }

        // Formulario de avisos
        const avisoForm = document.getElementById('avisoForm');
        if (avisoForm) {
            avisoForm.addEventListener('submit', (e) => this.handleAvisoSubmit(e));
        }

        // Formulario de comunicados
        const comunicadoForm = document.getElementById('comunicadoForm');
        if (comunicadoForm) {
            comunicadoForm.addEventListener('submit', (e) => this.handleComunicadoSubmit(e));
        }

        // Event listeners para cargar contenido cuando se abren modales
        const noticiasModal = document.getElementById('noticiasModal');
        if (noticiasModal) {
            noticiasModal.addEventListener('shown.bs.modal', () => this.loadNoticiasExistentes());
        }

        const eventosModal = document.getElementById('eventosModal');
        if (eventosModal) {
            eventosModal.addEventListener('shown.bs.modal', () => this.loadEventosExistentes());
        }

        const avisosModal = document.getElementById('avisosModal');
        if (avisosModal) {
            avisosModal.addEventListener('shown.bs.modal', () => this.loadAvisosExistentes());
        }

        const comunicadosModal = document.getElementById('comunicadosModal');
        if (comunicadosModal) {
            comunicadosModal.addEventListener('shown.bs.modal', () => this.loadComunicadosExistentes());
        }
    }

    // ==========================================
    // FUNCIONES DE DATOS - PostgreSQL
    // ==========================================

    async fetchAPI(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            const result = await response.json();

            if (!result.success && !response.ok) {
                throw new Error(result.error || result.message || `Error ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error(`❌ [CMS] Error en API ${endpoint}:`, error);
            throw error;
        }
    }

    // ==========================================
    // AUTENTICACIÓN
    // ==========================================

    getAuthToken() {
        return localStorage.getItem('authToken') || 'demo-token';
    }

    // ==========================================
    // GESTIÓN DE NOTICIAS
    // ==========================================

    async handleNoticiaSubmit(e) {
        e.preventDefault();

        // Detectar modo edición
        const id = document.getElementById('noticiaId').value;
        const isEditMode = id && id !== '';

        // Mapear campos del frontend al schema PostgreSQL
        const noticiaData = {
            titulo: document.getElementById('noticiaTitulo').value,
            contenido: document.getElementById('noticiaContenido').value,
            resumen: document.getElementById('noticiaResumen').value,
            imagen_url: document.getElementById('noticiaImagen').value || null,
            categoria: document.getElementById('noticiaCategoria').value || 'General',
            etiquetas: document.getElementById('noticiaTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            estado: document.getElementById('noticiaActivo').checked ? 'publicada' : 'borrador',
            autor: document.getElementById('noticiaAutor').value || 'Administrador',
            destacada: document.getElementById('noticiaDestacado').checked || false
        };

        try {
            let result;
            if (isEditMode) {
                // Modo edición - usar PUT
                result = await this.fetchAPI(`noticias/${id}`, 'PUT', noticiaData);
                this.showNotification('Noticia actualizada exitosamente', 'success');
            } else {
                // Modo creación - usar POST
                result = await this.fetchAPI('noticias', 'POST', noticiaData);
                this.showNotification('Noticia creada exitosamente', 'success');
            }

            this.clearNoticiaForm();
            this.loadNoticiasExistentes();

            // Actualizar estadísticas
            if (window.statsCounter) {
                window.statsCounter.refresh();
            }

        } catch (error) {
            console.error('Error guardando noticia:', error);
            this.showNotification(`Error al guardar la noticia: ${error.message}`, 'error');
        }
    }

    async loadNoticiasExistentes(page = 1) {
        const container = document.getElementById('noticiasContainer');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando noticias...</p>
            </div>
        `);

        try {
            const limit = this.pagination.noticias.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(`noticias?limit=${limit}&offset=${offset}`);
            const noticias = result.data || [];
            const total = result.total || noticias.length;

            if (noticias.length === 0) {
                container.innerHTML = sanitizeHTML(`
                    <div class="text-center p-4">
                        <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay noticias creadas aún</p>
                    </div>
                `);
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            noticias.forEach(noticia => {
                html += `
                    <tr>
                        <td>
                            <strong>${noticia.titulo}</strong>
                            ${noticia.destacada ? '<span class="badge bg-warning ms-2">Destacada</span>' : ''}
                        </td>
                        <td><span class="badge bg-secondary">${noticia.categoria || 'General'}</span></td>
                        <td>${this.formatDate(noticia.fecha_creacion)}</td>
                        <td>
                            <span class="badge ${noticia.estado === 'publicada' ? 'bg-success' : 'bg-danger'}">
                                ${noticia.estado === 'publicada' ? 'Publicada' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" data-action="edit-noticia" data-param-1="${noticia.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-noticia" data-param-1="${noticia.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = DOMPurify.sanitize(sanitizeHTML(html, 'ugc'));

            // Actualizar paginación
            this.pagination.noticias.total = total;
            this.pagination.noticias.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.noticias) {
                this.paginationManagers.noticias = new PaginationManager({
                    containerId: 'noticiasPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadNoticiasExistentes(newPage)
                });
                window.paginationManagers['noticiasPaginationContainer'] = this.paginationManagers.noticias;
            } else {
                this.paginationManagers.noticias.updateTotalItems(total);
                this.paginationManagers.noticias.currentPage = page;
            }

            this.paginationManagers.noticias.render();

        } catch (error) {
            console.error('Error cargando noticias:', error);
            container.innerHTML = sanitizeHTML(`
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando noticias: ${error.message}</p>
                </div>
            `);
        }
    }

    // ==========================================
    // GESTIÓN DE EVENTOS
    // ==========================================

    async handleEventoSubmit(e) {
        e.preventDefault();

        // Detectar modo edición
        const id = document.getElementById('eventoId').value;
        const isEditMode = id && id !== '';

        // Mapear campos del frontend al schema PostgreSQL
        const eventoData = {
            titulo: document.getElementById('eventoTitulo').value,
            descripcion: document.getElementById('eventoDescripcion').value,
            imagen_url: document.getElementById('eventoImagen').value || null,
            fecha_inicio: `${document.getElementById('eventoFecha').value}T${document.getElementById('eventoHora').value || '00:00'}:00`,
            ubicacion: document.getElementById('eventoLugar').value,
            modalidad: document.getElementById('eventoModalidad').value || 'presencial',
            categoria: document.getElementById('eventoCategoria').value,
            capacidad_maxima: document.getElementById('eventoCupo').value ? parseInt(document.getElementById('eventoCupo').value) : null,
            requiere_inscripcion: document.getElementById('eventoInscripcion').checked,
            estado: document.getElementById('eventoActivo').checked ? 'publicado' : 'borrador',
            destacado: document.getElementById('eventoDestacado').checked || false,
            organizador: document.getElementById('eventoOrganizador').value,
            contacto_email: document.getElementById('eventoContacto').value || null
        };

        try {
            let result;
            if (isEditMode) {
                // Modo edición - usar PUT
                result = await this.fetchAPI(`eventos/${id}`, 'PUT', eventoData);
                this.showNotification('Evento actualizado exitosamente', 'success');
            } else {
                // Modo creación - usar POST
                result = await this.fetchAPI('eventos', 'POST', eventoData);
                this.showNotification('Evento creado exitosamente', 'success');
            }

            this.clearEventoForm();
            this.loadEventosExistentes();

        } catch (error) {
            console.error('Error guardando evento:', error);
            this.showNotification(`Error al guardar el evento: ${error.message}`, 'error');
        }
    }

    async loadEventosExistentes(page = 1) {
        const container = document.getElementById('eventosContainer');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="text-center p-4">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando eventos...</p>
            </div>
        `);

        try {
            const limit = this.pagination.eventos.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(`eventos?limit=${limit}&offset=${offset}`);
            const eventos = result.data || [];
            const total = result.total || eventos.length;

            if (eventos.length === 0) {
                container.innerHTML = sanitizeHTML(`
                    <div class="text-center p-4">
                        <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay eventos creados aún</p>
                    </div>
                `);
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Fecha/Hora</th>
                            <th>Lugar</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            eventos.forEach(evento => {
                const startDate = new Date(evento.fecha_inicio);
                html += `
                    <tr>
                        <td>
                            <strong>${evento.titulo}</strong><br>
                            <small class="text-muted">${evento.categoria || 'General'}</small>
                            ${evento.destacado ? '<span class="badge bg-warning ms-2">Destacado</span>' : ''}
                        </td>
                        <td>
                            ${this.formatDate(evento.fecha_inicio)}<br>
                            <small class="text-muted">${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
                        </td>
                        <td>${evento.ubicacion || 'No especificado'}</td>
                        <td>
                            <span class="badge ${evento.estado === 'publicado' ? 'bg-success' : 'bg-danger'}">
                                ${evento.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-success" data-action="edit-evento" data-param-1="${evento.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-evento" data-param-1="${evento.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = DOMPurify.sanitize(sanitizeHTML(html, 'ugc'));

            // Actualizar paginación
            this.pagination.eventos.total = total;
            this.pagination.eventos.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.eventos) {
                this.paginationManagers.eventos = new PaginationManager({
                    containerId: 'eventosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadEventosExistentes(newPage)
                });
                window.paginationManagers['eventosPaginationContainer'] = this.paginationManagers.eventos;
            } else {
                this.paginationManagers.eventos.updateTotalItems(total);
                this.paginationManagers.eventos.currentPage = page;
            }

            this.paginationManagers.eventos.render();

        } catch (error) {
            console.error('Error cargando eventos:', error);
            container.innerHTML = sanitizeHTML(`
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando eventos: ${error.message}</p>
                </div>
            `);
        }
    }

    // ==========================================
    // GESTIÓN DE AVISOS
    // ==========================================

    async handleAvisoSubmit(e) {
        e.preventDefault();

        // Detectar modo edición
        const id = document.getElementById('avisoId').value;
        const isEditMode = id && id !== '';

        // Mapear campos del frontend al schema PostgreSQL
        const avisoData = {
            titulo: document.getElementById('avisoTitulo').value,
            contenido: document.getElementById('avisoContenido').value,
            imagen_url: document.getElementById('avisoImagen').value || null,
            estado: document.getElementById('avisoActivo').checked ? 'publicada' : 'borrador',
            categoria: document.getElementById('avisoTipo').value || 'General',
            autor: 'Administrador'
        };

        try {
            let result;
            if (isEditMode) {
                // Modo edición - usar PUT
                result = await this.fetchAPI(`avisos/${id}`, 'PUT', avisoData);
                this.showNotification('Aviso actualizado exitosamente', 'success');
            } else {
                // Modo creación - usar POST
                result = await this.fetchAPI('avisos', 'POST', avisoData);
                this.showNotification('Aviso creado exitosamente', 'success');
            }

            this.clearAvisoForm();
            this.loadAvisosExistentes();
        } catch (error) {
            console.error('Error guardando aviso:', error);
            this.showNotification(`Error al guardar el aviso: ${error.message}`, 'error');
        }
    }

    async loadAvisosExistentes(page = 1) {
        const container = document.getElementById('avisosContainer');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="text-center p-4">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando avisos...</p>
            </div>
        `);

        try {
            const limit = this.pagination.avisos.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(`avisos?limit=${limit}&offset=${offset}`);
            const avisos = result.data || [];
            const total = result.total || avisos.length;

            if (avisos.length === 0) {
                container.innerHTML = sanitizeHTML(`
                    <div class="text-center p-4">
                        <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay avisos creados aún</p>
                    </div>
                `);
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            avisos.forEach(aviso => {
                html += `
                    <tr>
                        <td>
                            <strong>${aviso.titulo}</strong>
                            ${aviso.destacada ? '<span class="badge bg-warning ms-2">Destacado</span>' : ''}
                        </td>
                        <td><span class="badge bg-info">${aviso.categoria || 'General'}</span></td>
                        <td>${this.formatDate(aviso.fecha_creacion)}</td>
                        <td>
                            <span class="badge ${aviso.estado === 'publicada' ? 'bg-success' : 'bg-danger'}">
                                ${aviso.estado === 'publicada' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-warning" data-action="edit-aviso" data-param-1="${aviso.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-aviso" data-param-1="${aviso.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = DOMPurify.sanitize(sanitizeHTML(html, 'ugc'));


            // Actualizar paginación
            this.pagination.avisos.total = total;
            this.pagination.avisos.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.avisos) {
                this.paginationManagers.avisos = new PaginationManager({
                    containerId: 'avisosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadAvisosExistentes(newPage)
                });
                window.paginationManagers['avisosPaginationContainer'] = this.paginationManagers.avisos;
            } else {
                this.paginationManagers.avisos.updateTotalItems(total);
                this.paginationManagers.avisos.currentPage = page;
            }

            this.paginationManagers.avisos.render();

        } catch (error) {
            console.error('Error cargando avisos:', error);
            container.innerHTML = sanitizeHTML(`
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando avisos: ${error.message}</p>
                </div>
            `);
        }
    }

    // ==========================================
    // GESTIÓN DE COMUNICADOS
    // ==========================================

    async handleComunicadoSubmit(e) {
        e.preventDefault();

        // Detectar modo edición
        const id = document.getElementById('comunicadoId').value;
        const isEditMode = id && id !== '';

        // Mapear campos del frontend al schema PostgreSQL
        const comunicadoData = {
            titulo: document.getElementById('comunicadoTitulo').value,
            contenido: document.getElementById('comunicadoContenido').value,
            imagen_url: document.getElementById('comunicadoImagen').value || null,
            estado: document.getElementById('comunicadoActivo').checked ? 'publicada' : 'borrador',
            categoria: document.getElementById('comunicadoTipo').value || 'General',
            autor: document.getElementById('comunicadoEmisor').value || 'Administrador'
        };

        try {
            let result;
            if (isEditMode) {
                // Modo edición - usar PUT
                result = await this.fetchAPI(`comunicados/${id}`, 'PUT', comunicadoData);
                this.showNotification('Comunicado actualizado exitosamente', 'success');
            } else {
                // Modo creación - usar POST
                result = await this.fetchAPI('comunicados', 'POST', comunicadoData);
                this.showNotification('Comunicado creado exitosamente', 'success');
            }

            this.clearComunicadoForm();
            this.loadComunicadosExistentes();
        } catch (error) {
            console.error('Error guardando comunicado:', error);
            this.showNotification(`Error al guardar el comunicado: ${error.message}`, 'error');
        }
    }

    async loadComunicadosExistentes(page = 1) {
        const container = document.getElementById('comunicadosContainer');
        if (!container) return;

        container.innerHTML = sanitizeHTML(`
            <div class="text-center p-4">
                <div class="spinner-border text-info" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando comunicados...</p>
            </div>
        `);

        try {
            const limit = this.pagination.comunicados.limit;
            const offset = (page - 1) * limit;
            const result = await this.fetchAPI(`comunicados?limit=${limit}&offset=${offset}`);
            const comunicados = result.data || [];
            const total = result.total || comunicados.length;

            if (comunicados.length === 0) {
                container.innerHTML = sanitizeHTML(`
                    <div class="text-center p-4">
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay comunicados creados aún</p>
                    </div>
                `);
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Autor</th>
                            <th>Categoría</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            comunicados.forEach(comunicado => {
                html += `
                    <tr>
                        <td>
                            <strong>${comunicado.titulo}</strong>
                            ${comunicado.destacada ? '<span class="badge bg-warning ms-2">Destacado</span>' : ''}
                        </td>
                        <td>${comunicado.autor || 'Sistema'}</td>
                        <td><span class="badge bg-info">${comunicado.categoria || 'General'}</span></td>
                        <td>${this.formatDate(comunicado.fecha_creacion)}</td>
                        <td>
                            <span class="badge ${comunicado.estado === 'publicada' ? 'bg-success' : 'bg-danger'}">
                                ${comunicado.estado === 'publicada' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-info" data-action="edit-comunicado" data-param-1="${comunicado.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" data-action="delete-comunicado" data-param-1="${comunicado.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
            `;

            container.innerHTML = DOMPurify.sanitize(sanitizeHTML(html, 'ugc'));


            // Actualizar paginación
            this.pagination.comunicados.total = total;
            this.pagination.comunicados.page = page;

            // Inicializar o actualizar PaginationManager
            if (!this.paginationManagers.comunicados) {
                this.paginationManagers.comunicados = new PaginationManager({
                    containerId: 'comunicadosPaginationContainer',
                    itemsPerPage: limit,
                    totalItems: total,
                    currentPage: page,
                    onPageChange: (newPage) => this.loadComunicadosExistentes(newPage)
                });
                window.paginationManagers['comunicadosPaginationContainer'] = this.paginationManagers.comunicados;
            } else {
                this.paginationManagers.comunicados.updateTotalItems(total);
                this.paginationManagers.comunicados.currentPage = page;
            }

            this.paginationManagers.comunicados.render();

        } catch (error) {
            console.error('Error cargando comunicados:', error);
            container.innerHTML = sanitizeHTML(`
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando comunicados: ${error.message}</p>
                </div>
            `);
        }
    }

    // ==========================================
    // FUNCIONES DE EDICIÓN
    // ==========================================

    async editNoticia(id) {
        try {
            // Obtener datos de la noticia
            const result = await this.fetchAPI(`noticias/${id}`);
            const noticia = result.data;

            // Llenar formulario
            document.getElementById('noticiaId').value = noticia.id;
            document.getElementById('noticiaTitulo').value = noticia.titulo;
            document.getElementById('noticiaResumen').value = noticia.resumen || '';
            document.getElementById('noticiaContenido').value = noticia.contenido;
            document.getElementById('noticiaAutor').value = noticia.autor;
            document.getElementById('noticiaCategoria').value = noticia.categoria || 'General';
            document.getElementById('noticiaImagen').value = noticia.imagen_url || '';
            document.getElementById('noticiaTags').value = noticia.etiquetas ? noticia.etiquetas.join(', ') : '';
            document.getElementById('noticiaDestacado').checked = noticia.destacada || false;
            document.getElementById('noticiaActivo').checked = noticia.estado === 'publicada';

            // Cambiar botón y título del modal
            const submitBtn = document.querySelector('#noticiaForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Noticia';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-warning');
            }

            // Cerrar modal de lista y abrir modal de formulario
            const listModal = bootstrap.Modal.getInstance(document.getElementById('noticiasModal'));
            if (listModal) listModal.hide();

            const formModal = new bootstrap.Modal(document.getElementById('createNoticiaModal'));
            formModal.show();

        } catch (error) {
            console.error('Error cargando noticia:', error);
            this.showNotification('Error cargando noticia para editar', 'error');
        }
    }

    async editEvento(id) {
        try {
            const result = await this.fetchAPI(`eventos/${id}`);
            const evento = result.data;

            // Llenar formulario
            document.getElementById('eventoId').value = evento.id;
            document.getElementById('eventoTitulo').value = evento.titulo;
            document.getElementById('eventoDescripcion').value = evento.descripcion;
            document.getElementById('eventoImagen').value = evento.imagen_url || '';

            // Formatear fecha para input
            if (evento.fecha_inicio) {
                const fecha = new Date(evento.fecha_inicio);
                document.getElementById('eventoFecha').value = fecha.toISOString().split('T')[0];
                document.getElementById('eventoHora').value = fecha.toISOString().split('T')[1].substring(0, 5);
            }

            document.getElementById('eventoLugar').value = evento.ubicacion || '';
            document.getElementById('eventoCategoria').value = evento.categoria || 'General';
            document.getElementById('eventoCupo').value = evento.capacidad_maxima || '';
            document.getElementById('eventoInscripcion').checked = evento.requiere_inscripcion || false;
            document.getElementById('eventoActivo').checked = evento.estado === 'publicado';
            document.getElementById('eventoDestacado').checked = evento.destacado || false;
            document.getElementById('eventoOrganizador').value = evento.organizador || '';
            document.getElementById('eventoContacto').value = evento.contacto_email || '';

            // Cambiar botón
            const submitBtn = document.querySelector('#eventoForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Evento';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-warning');
            }

            // Cambiar modales
            const listModal = bootstrap.Modal.getInstance(document.getElementById('eventosModal'));
            if (listModal) listModal.hide();

            const formModal = new bootstrap.Modal(document.getElementById('createEventoModal'));
            formModal.show();

        } catch (error) {
            console.error('Error cargando evento:', error);
            this.showNotification('Error cargando evento para editar', 'error');
        }
    }

    async editAviso(id) {
        try {
            const result = await this.fetchAPI(`avisos/${id}`);
            const aviso = result.data;

            // Llenar formulario
            document.getElementById('avisoId').value = aviso.id;
            document.getElementById('avisoTitulo').value = aviso.titulo;
            document.getElementById('avisoContenido').value = aviso.contenido;
            document.getElementById('avisoImagen').value = aviso.imagen_url || '';
            document.getElementById('avisoTipo').value = aviso.categoria || 'General';
            document.getElementById('avisoActivo').checked = aviso.estado === 'publicada';

            // Cambiar botón
            const submitBtn = document.querySelector('#avisoForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Aviso';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-warning');
            }

            // Cambiar modales
            const listModal = bootstrap.Modal.getInstance(document.getElementById('avisosModal'));
            if (listModal) listModal.hide();

            const formModal = new bootstrap.Modal(document.getElementById('createAvisoModal'));
            formModal.show();

        } catch (error) {
            console.error('Error cargando aviso:', error);
            this.showNotification('Error cargando aviso para editar', 'error');
        }
    }

    async editComunicado(id) {
        try {
            const result = await this.fetchAPI(`comunicados/${id}`);
            const comunicado = result.data;

            // Llenar formulario
            document.getElementById('comunicadoId').value = comunicado.id;
            document.getElementById('comunicadoTitulo').value = comunicado.titulo;
            document.getElementById('comunicadoContenido').value = comunicado.contenido;
            document.getElementById('comunicadoImagen').value = comunicado.imagen_url || '';
            document.getElementById('comunicadoTipo').value = comunicado.categoria || 'General';
            document.getElementById('comunicadoEmisor').value = comunicado.autor || '';
            document.getElementById('comunicadoActivo').checked = comunicado.estado === 'publicada';

            // Cambiar botón
            const submitBtn = document.querySelector('#comunicadoForm button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Actualizar Comunicado';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-warning');
            }

            // Cambiar modales
            const listModal = bootstrap.Modal.getInstance(document.getElementById('comunicadosModal'));
            if (listModal) listModal.hide();

            const formModal = new bootstrap.Modal(document.getElementById('createComunicadoModal'));
            formModal.show();

        } catch (error) {
            console.error('Error cargando comunicado:', error);
            this.showNotification('Error cargando comunicado para editar', 'error');
        }
    }

    // ==========================================
    // FUNCIONES DE ELIMINACIÓN
    // ==========================================

    async deleteNoticia(id) {
        try {
            await this.fetchAPI(`noticias/${id}`, 'DELETE');
            this.showNotification('Noticia archivada exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error archivando noticia:', error);
            this.showNotification(`Error al archivar noticia: ${error.message}`, 'error');
            return false;
        }
    }

    async deleteEvento(id) {
        try {
            await this.fetchAPI(`eventos/${id}`, 'DELETE');
            this.showNotification('Evento archivado exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error archivando evento:', error);
            this.showNotification(`Error al archivar evento: ${error.message}`, 'error');
            return false;
        }
    }

    async deleteAviso(id) {
        try {
            await this.fetchAPI(`avisos/${id}`, 'DELETE');
            this.showNotification('Aviso archivado exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error archivando aviso:', error);
            this.showNotification(`Error al archivar aviso: ${error.message}`, 'error');
            return false;
        }
    }

    async deleteComunicado(id) {
        try {
            await this.fetchAPI(`comunicados/${id}`, 'DELETE');
            this.showNotification('Comunicado archivado exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error archivando comunicado:', error);
            this.showNotification(`Error al archivar comunicado: ${error.message}`, 'error');
            return false;
        }
    }

    // ==========================================
    // FUNCIONES DE UTILIDAD
    // ==========================================

    generateId(prefix) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();

        const toastId = `toast-${Date.now()}`;
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';

        const toastHTML = `
            <div class="toast ${bgClass} text-white" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body">
                    <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info'} me-2"></i>
                    ${message}
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', DOMPurify.sanitize(sanitizeHTML(toastHTML)));

        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();

        setTimeout(() => {
            toastElement.remove();
        }, 4000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    // ==========================================
    // FUNCIONES DE LIMPIEZA DE FORMULARIOS
    // ==========================================

    clearNoticiaForm() {
        document.getElementById('noticiaForm').reset();
        document.getElementById('noticiaId').value = '';
        document.getElementById('noticiaActivo').checked = true;
    }

    clearEventoForm() {
        document.getElementById('eventoForm').reset();
        document.getElementById('eventoId').value = '';
        document.getElementById('eventoActivo').checked = true;
    }

    clearAvisoForm() {
        document.getElementById('avisoForm').reset();
        document.getElementById('avisoId').value = '';
        document.getElementById('avisoActivo').checked = true;
    }

    clearComunicadoForm() {
        document.getElementById('comunicadoForm').reset();
        document.getElementById('comunicadoId').value = '';
        document.getElementById('comunicadoActivo').checked = true;
        // Limpiar checkboxes de destinatarios
        document.querySelectorAll('input[id^="dest_"]').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
}

// ==========================================
// FUNCIONES GLOBALES
// ==========================================

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.cmsManager = new CMSManager();
});

// Funciones de refresh para botones
function refreshNoticiasList() {
    if (window.cmsManager) {
        window.cmsManager.loadNoticiasExistentes();
    }
}

function refreshEventosList() {
    if (window.cmsManager) {
        window.cmsManager.loadEventosExistentes();
    }
}

function refreshAvisosList() {
    if (window.cmsManager) {
        window.cmsManager.loadAvisosExistentes();
    }
}

function refreshComunicadosList() {
    if (window.cmsManager) {
        window.cmsManager.loadComunicadosExistentes();
    }
}

// Funciones de limpieza para botones
function clearNoticiaForm() {
    if (window.cmsManager) {
        window.cmsManager.clearNoticiaForm();
    }
}

function clearEventoForm() {
    if (window.cmsManager) {
        window.cmsManager.clearEventoForm();
    }
}

function clearAvisoForm() {
    if (window.cmsManager) {
        window.cmsManager.clearAvisoForm();
    }
}

function clearComunicadoForm() {
    if (window.cmsManager) {
        window.cmsManager.clearComunicadoForm();
    }
}

// Funciones de edición (placeholders para futuras implementaciones)
async function editNoticia(id) {
    console.log('🖊️ Editando noticia:', id);
    if (window.cmsManager) {
        await window.cmsManager.editNoticia(id);
    }
}

async function editEvento(id) {
    console.log('🖊️ Editando evento:', id);
    if (window.cmsManager) {
        await window.cmsManager.editEvento(id);
    }
}

async function editAviso(id) {
    console.log('🖊️ Editando aviso:', id);
    if (window.cmsManager) {
        await window.cmsManager.editAviso(id);
    }
}

async function editComunicado(id) {
    console.log('🖊️ Editando comunicado:', id);
    if (window.cmsManager) {
        await window.cmsManager.editComunicado(id);
    }
}

// Funciones de eliminación
async function deleteNoticia(id) {
    if (confirm('¿Estás seguro de que deseas archivar esta noticia?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteNoticia(id);
            if (success) {
                window.cmsManager.loadNoticiasExistentes();
            }
        }
    }
}

async function deleteEvento(id) {
    if (confirm('¿Estás seguro de que deseas archivar este evento?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteEvento(id);
            if (success) {
                window.cmsManager.loadEventosExistentes();
            }
        }
    }
}

async function deleteAviso(id) {
    if (confirm('¿Estás seguro de que deseas archivar este aviso?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteAviso(id);
            if (success) {
                window.cmsManager.loadAvisosExistentes();
            }
        }
    }
}

async function deleteComunicado(id) {
    if (confirm('¿Estás seguro de que deseas archivar este comunicado?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteComunicado(id);
            if (success) {
                window.cmsManager.loadComunicadosExistentes();
            }
        }
    }
}