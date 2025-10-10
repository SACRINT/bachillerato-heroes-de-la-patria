/**
 * CMS MANAGER - Sistema de Gestión de Contenido
 * Maneja la creación, edición y eliminación de noticias, eventos, avisos y comunicados
 */

class CMSManager {
    constructor() {
        console.log('🎛️ [CMS] Inicializando sistema de gestión de contenido...');
        this.apiBase = 'http://localhost:3002/api/cms/';
        this.uploadBase = 'http://localhost:3002/api/uploads/';
        this.calendarBase = 'http://localhost:3002/api/calendar/';
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
    // FUNCIONES DE DATOS
    // ==========================================

    async loadData(type) {
        try {
            const response = await fetch(`${this.apiBase}content?type=${type}`);
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error(`❌ [CMS] Error cargando ${type}:`, error);
            return [];
        }
    }

    async saveData(type, data) {
        try {
            const response = await fetch(`${this.apiBase}content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ type, ...data })
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Error al guardar');
            }

            console.log(`💾 [CMS] Datos guardados: ${type}`);
            return result.data;
        } catch (error) {
            console.error(`❌ [CMS] Error guardando ${type}:`, error);
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

        const noticiaData = {
            title: document.getElementById('noticiaTitulo').value,
            content: document.getElementById('noticiaContenido').value,
            image_url: document.getElementById('noticiaImagen').value || 'images/default.jpg',
            status: document.getElementById('noticiaActivo').checked ? 'published' : 'draft',
            priority: document.getElementById('noticiaDestacado').checked ? 'high' : 'normal',
            publish_date: document.getElementById('noticiaFecha').value,
            metadata: {
                resumen: document.getElementById('noticiaResumen').value,
                autor: document.getElementById('noticiaAutor').value,
                categoria: document.getElementById('noticiaCategoria').value,
                tags: document.getElementById('noticiaTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            }
        };

        try {
            const savedData = await this.saveData('noticia', noticiaData);
            this.showNotification('Noticia guardada exitosamente', 'success');
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

    async loadNoticiasExistentes() {
        const container = document.getElementById('noticiasContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando noticias...</p>
            </div>
        `;

        try {
            const noticias = await this.loadData('noticia');

            if (noticias.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay noticias creadas aún</p>
                    </div>
                `;
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
                const metadata = noticia.metadata || {};
                html += `
                    <tr>
                        <td>
                            <strong>${noticia.title}</strong>
                            ${noticia.priority === 'high' ? '<span class="badge bg-warning ms-2">Destacada</span>' : ''}
                        </td>
                        <td><span class="badge bg-secondary">${metadata.categoria || 'General'}</span></td>
                        <td>${this.formatDate(noticia.publish_date || noticia.created_at)}</td>
                        <td>
                            <span class="badge ${noticia.status === 'published' ? 'bg-success' : 'bg-danger'}">
                                ${noticia.status === 'published' ? 'Publicada' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-primary" onclick="editNoticia('${noticia.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteNoticia('${noticia.id}')">
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

            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando noticias:', error);
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando noticias: ${error.message}</p>
                </div>
            `;
        }
    }

    // ==========================================
    // GESTIÓN DE EVENTOS
    // ==========================================

    async handleEventoSubmit(e) {
        e.preventDefault();

        // Crear evento usando la API de calendar
        const eventoData = {
            title: document.getElementById('eventoTitulo').value,
            description: document.getElementById('eventoDescripcion').value,
            start_date: `${document.getElementById('eventoFecha').value}T${document.getElementById('eventoHora').value || '00:00'}`,
            end_date: `${document.getElementById('eventoFecha').value}T${document.getElementById('eventoHora').value || '23:59'}`,
            location: document.getElementById('eventoLugar').value,
            category: document.getElementById('eventoCategoria').value,
            max_attendees: document.getElementById('eventoCupo').value ? parseInt(document.getElementById('eventoCupo').value) : null,
            registration_required: document.getElementById('eventoInscripcion').checked,
            status: document.getElementById('eventoActivo').checked ? 'published' : 'draft',
            priority: document.getElementById('eventoDestacado').checked ? 'high' : 'normal',
            metadata: {
                organizador: document.getElementById('eventoOrganizador').value,
                contacto: document.getElementById('eventoContacto').value,
                imagen: document.getElementById('eventoImagen').value || 'images/default.jpg'
            }
        };

        try {
            const response = await fetch(`${this.calendarBase}events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify(eventoData)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Error al guardar');
            }

            this.showNotification('Evento guardado exitosamente', 'success');
            this.clearEventoForm();
            this.loadEventosExistentes();

        } catch (error) {
            console.error('Error guardando evento:', error);
            this.showNotification(`Error al guardar el evento: ${error.message}`, 'error');
        }
    }

    async loadEventosExistentes() {
        const container = document.getElementById('eventosContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando eventos...</p>
            </div>
        `;

        try {
            const response = await fetch(`${this.calendarBase}events`);
            const result = await response.json();
            const eventos = result.success ? result.data : [];

            if (eventos.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-calendar-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay eventos creados aún</p>
                    </div>
                `;
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
                const metadata = evento.metadata || {};
                const startDate = new Date(evento.start_date);
                html += `
                    <tr>
                        <td>
                            <strong>${evento.title}</strong><br>
                            <small class="text-muted">${evento.category || 'General'}</small>
                            ${evento.priority === 'high' ? '<span class="badge bg-warning ms-2">Destacado</span>' : ''}
                        </td>
                        <td>
                            ${this.formatDate(evento.start_date)}<br>
                            <small class="text-muted">${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small>
                        </td>
                        <td>${evento.location || 'No especificado'}</td>
                        <td>
                            <span class="badge ${evento.status === 'published' ? 'bg-success' : 'bg-danger'}">
                                ${evento.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-success" onclick="editEvento('${evento.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteEvento('${evento.id}')">
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

            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando eventos:', error);
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando eventos: ${error.message}</p>
                </div>
            `;
        }
    }

    // ==========================================
    // GESTIÓN DE AVISOS
    // ==========================================

    async handleAvisoSubmit(e) {
        e.preventDefault();

        const avisoData = {
            title: document.getElementById('avisoTitulo').value,
            content: document.getElementById('avisoContenido').value,
            image_url: document.getElementById('avisoImagen').value || 'images/default.jpg',
            status: document.getElementById('avisoActivo').checked ? 'published' : 'draft',
            priority: document.getElementById('avisoPrioridad').value,
            publish_date: document.getElementById('avisoFechaInicio').value,
            expire_date: document.getElementById('avisoFechaFin').value || null,
            metadata: {
                tipo: document.getElementById('avisoTipo').value,
                dirigidoA: document.getElementById('avisoDirigidoA').value,
                contacto: document.getElementById('avisoContacto').value
            }
        };

        try {
            const savedData = await this.saveData('aviso', avisoData);
            this.showNotification('Aviso guardado exitosamente', 'success');
            this.clearAvisoForm();
            this.loadAvisosExistentes();
        } catch (error) {
            console.error('Error guardando aviso:', error);
            this.showNotification(`Error al guardar el aviso: ${error.message}`, 'error');
        }
    }

    async loadAvisosExistentes() {
        const container = document.getElementById('avisosContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-warning" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando avisos...</p>
            </div>
        `;

        try {
            const avisos = await this.loadData('aviso');

            if (avisos.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-exclamation-triangle fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay avisos creados aún</p>
                    </div>
                `;
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tipo</th>
                            <th>Prioridad</th>
                            <th>Vigencia</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            avisos.forEach(aviso => {
                const metadata = aviso.metadata || {};
                const prioridadClass = aviso.priority === 'high' ? 'danger' : aviso.priority === 'medium' ? 'warning' : 'secondary';
                html += `
                    <tr>
                        <td><strong>${aviso.title}</strong></td>
                        <td><span class="badge bg-info">${metadata.tipo || 'General'}</span></td>
                        <td><span class="badge bg-${prioridadClass}">${aviso.priority || 'normal'}</span></td>
                        <td>
                            ${this.formatDate(aviso.publish_date)}
                            ${aviso.expire_date ? ' - ' + this.formatDate(aviso.expire_date) : ''}
                        </td>
                        <td>
                            <span class="badge ${aviso.status === 'published' ? 'bg-success' : 'bg-danger'}">
                                ${aviso.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-warning" onclick="editAviso('${aviso.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteAviso('${aviso.id}')">
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

            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando avisos:', error);
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando avisos: ${error.message}</p>
                </div>
            `;
        }
    }

    // ==========================================
    // GESTIÓN DE COMUNICADOS
    // ==========================================

    async handleComunicadoSubmit(e) {
        e.preventDefault();

        // Recopilar destinatarios seleccionados
        const destinatarios = [];
        document.querySelectorAll('input[id^="dest_"]:checked').forEach(checkbox => {
            destinatarios.push(checkbox.value);
        });

        const comunicadoData = {
            title: document.getElementById('comunicadoTitulo').value,
            content: document.getElementById('comunicadoContenido').value,
            image_url: document.getElementById('comunicadoImagen').value || 'images/default.jpg',
            status: document.getElementById('comunicadoActivo').checked ? 'published' : 'draft',
            priority: document.getElementById('comunicadoPrioridad').value,
            publish_date: document.getElementById('comunicadoFecha').value,
            expire_date: document.getElementById('comunicadoVigencia').value !== 'permanente' ?
                new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : null,
            metadata: {
                emisor: document.getElementById('comunicadoEmisor').value,
                tipo: document.getElementById('comunicadoTipo').value,
                destinatarios: destinatarios,
                vigencia: document.getElementById('comunicadoVigencia').value || 'permanente'
            }
        };

        try {
            const savedData = await this.saveData('comunicado', comunicadoData);
            this.showNotification('Comunicado guardado exitosamente', 'success');
            this.clearComunicadoForm();
            this.loadComunicadosExistentes();
        } catch (error) {
            console.error('Error guardando comunicado:', error);
            this.showNotification(`Error al guardar el comunicado: ${error.message}`, 'error');
        }
    }

    async loadComunicadosExistentes() {
        const container = document.getElementById('comunicadosContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-info" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Cargando comunicados...</p>
            </div>
        `;

        try {
            const comunicados = await this.loadData('comunicado');

            if (comunicados.length === 0) {
                container.innerHTML = `
                    <div class="text-center p-4">
                        <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay comunicados creados aún</p>
                    </div>
                `;
                return;
            }

            let html = `
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Emisor</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            comunicados.forEach(comunicado => {
                const metadata = comunicado.metadata || {};
                const prioridadClass = comunicado.priority === 'high' ? 'danger' : comunicado.priority === 'medium' ? 'warning' : 'secondary';
                html += `
                    <tr>
                        <td><strong>${comunicado.title}</strong></td>
                        <td>${metadata.emisor || 'Sistema'}</td>
                        <td>
                            <span class="badge bg-info">${metadata.tipo || 'General'}</span>
                            <span class="badge bg-${prioridadClass} ms-1">${comunicado.priority || 'normal'}</span>
                        </td>
                        <td>${this.formatDate(comunicado.publish_date)}</td>
                        <td>
                            <span class="badge ${comunicado.status === 'published' ? 'bg-success' : 'bg-danger'}">
                                ${comunicado.status === 'published' ? 'Publicado' : 'Borrador'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm btn-outline-info" onclick="editComunicado('${comunicado.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteComunicado('${comunicado.id}')">
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

            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando comunicados:', error);
            container.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <p class="text-danger">Error cargando comunicados: ${error.message}</p>
                </div>
            `;
        }
    }

    // ==========================================
    // FUNCIONES DE ELIMINACIÓN
    // ==========================================

    async deleteContent(type, id) {
        try {
            const response = await fetch(`${this.apiBase}content/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Error al eliminar');
            }

            this.showNotification(`${type} eliminado exitosamente`, 'success');
            return true;
        } catch (error) {
            console.error(`Error eliminando ${type}:`, error);
            this.showNotification(`Error al eliminar ${type}: ${error.message}`, 'error');
            return false;
        }
    }

    async deleteEvent(id) {
        try {
            const response = await fetch(`${this.calendarBase}events/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Error al eliminar');
            }

            this.showNotification('Evento eliminado exitosamente', 'success');
            return true;
        } catch (error) {
            console.error('Error eliminando evento:', error);
            this.showNotification(`Error al eliminar evento: ${error.message}`, 'error');
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

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

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
function editNoticia(id) {
    console.log('🖊️ Editando noticia:', id);
    // TODO: Implementar edición
}

function editEvento(id) {
    console.log('🖊️ Editando evento:', id);
    // TODO: Implementar edición
}

function editAviso(id) {
    console.log('🖊️ Editando aviso:', id);
    // TODO: Implementar edición
}

function editComunicado(id) {
    console.log('🖊️ Editando comunicado:', id);
    // TODO: Implementar edición
}

// Funciones de eliminación
async function deleteNoticia(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteContent('noticia', id);
            if (success) {
                window.cmsManager.loadNoticiasExistentes();
            }
        }
    }
}

async function deleteEvento(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteEvent(id);
            if (success) {
                window.cmsManager.loadEventosExistentes();
            }
        }
    }
}

async function deleteAviso(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este aviso?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteContent('aviso', id);
            if (success) {
                window.cmsManager.loadAvisosExistentes();
            }
        }
    }
}

async function deleteComunicado(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este comunicado?')) {
        if (window.cmsManager) {
            const success = await window.cmsManager.deleteContent('comunicado', id);
            if (success) {
                window.cmsManager.loadComunicadosExistentes();
            }
        }
    }
}

console.log('📝 [CMS] cms-manager.js cargado exitosamente');