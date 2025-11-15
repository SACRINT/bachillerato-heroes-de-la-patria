/**
// Debug Logger - Logging condicional (GDPR compliant)
if (typeof debugLog === 'undefined') {
    var debugLog = {
        log: () => {},
        warn: () => {},
        error: () => {}
    };
}


 * 🎫 SISTEMA DE TICKETS DE SOPORTE - FRONTEND MANAGER
 * Sistema completo de gestión de tickets con SLA tracking
 * Fase 3 - Ciclo 23 - BGE 2025
 *
 * @description Manager JavaScript para el sistema de tickets de soporte
 * @version 1.0.0
 * @author Claude Code - BGE Team
 */

// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

import DOMPurify from 'isomorphic-dompurify';

const API_BASE = '/api/support-tickets';

// Estado global de la aplicación
const appState = {
    currentView: 'all',
    currentPage: 1,
    itemsPerPage: 10,
    tickets: [],
    departments: [],
    categories: [],
    filters: {
        status: null,
        priority: null,
        department: null,
        category: null,
        search: null
    },
    currentTicket: null,
    user: null
};

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializa el sistema de tickets
 */
async function initSupportTickets() {
    try {
        debugLog.log('APP', '🎫 Inicializando Sistema de Tickets de Soporte...');

        // Verificar autenticación
        await checkAuthentication();

        // Cargar datos iniciales
        await loadDepartments();
        await loadCategories();

        // Cargar vista inicial
        await loadTickets();

        // Inicializar event listeners
        initEventListeners();

        debugLog.log('APP', '✅ Sistema de Tickets inicializado correctamente');
    } catch (error) {
        debugLog.error('APP', '❌ Error al inicializar:', error);
        showError('Error al inicializar el sistema');
    }
}

/**
 * Verifica la autenticación del usuario
 */
async function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        throw new Error('No autenticado');
    }

    // Obtener información del usuario del token (decodificar JWT)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        appState.user = payload;
        debugLog.log('APP', '👤 Usuario autenticado:', appState.user.name);
    } catch (error) {
        debugLog.error('TOKEN', 'Error al decodificar token:', error);
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

/**
 * Inicializa todos los event listeners
 */
function initEventListeners() {
    // Botones principales
    document.getElementById('newTicketBtn')?.addEventListener('click', showNewTicketModal);
    document.getElementById('createTicketBtn')?.addEventListener('click', showNewTicketModal);
    document.getElementById('saveTicketBtn')?.addEventListener('click', handleSaveTicket);
    document.getElementById('statsBtn')?.addEventListener('click', toggleStatsView);

    // Formulario de nuevo ticket
    const newTicketForm = document.getElementById('newTicketForm');
    if (newTicketForm) {
        newTicketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSaveTicket();
        });
    }

    // Filtros de la sidebar
    document.querySelectorAll('.sidebar [data-view]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.getAttribute('data-view');
            changeView(view);
        });
    });

    // Cerrar sesión (si existe el botón)
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
}

// ============================================
// GESTIÓN DE VISTAS
// ============================================

/**
 * Cambia la vista actual
 * @param {string} view - Vista a mostrar (all, my, assigned, watching, open, progress, resolved, urgent, high)
 */
function changeView(view) {
    appState.currentView = view;
    appState.currentPage = 1;

    // Actualizar UI
    document.querySelectorAll('.sidebar [data-view]').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.sidebar [data-view="${view}"]`)?.classList.add('active');

    // Configurar filtros según la vista
    resetFilters();

    switch(view) {
        case 'all':
            // Sin filtros adicionales
            updateTitle('Todos los Tickets');
            break;
        case 'my':
            // Tickets creados por mí
            appState.filters.createdBy = appState.user.id;
            updateTitle('Mis Tickets');
            break;
        case 'assigned':
            // Tickets asignados a mí
            appState.filters.assignedTo = appState.user.id;
            updateTitle('Asignados a Mí');
            break;
        case 'watching':
            // Tickets que estoy siguiendo
            appState.filters.watching = true;
            updateTitle('Siguiendo');
            break;
        case 'open':
            appState.filters.status = 'open';
            updateTitle('Tickets Abiertos');
            break;
        case 'progress':
            appState.filters.status = 'in_progress';
            updateTitle('En Progreso');
            break;
        case 'resolved':
            appState.filters.status = 'resolved';
            updateTitle('Resueltos');
            break;
        case 'urgent':
            appState.filters.priority = 'urgent';
            updateTitle('Urgentes');
            break;
        case 'high':
            appState.filters.priority = 'high';
            updateTitle('Prioridad Alta');
            break;
    }

    // Recargar tickets con los nuevos filtros
    loadTickets();
}

/**
 * Resetea todos los filtros
 */
function resetFilters() {
    appState.filters = {
        status: null,
        priority: null,
        department: null,
        category: null,
        search: null,
        createdBy: null,
        assignedTo: null,
        watching: null
    };
}

/**
 * Actualiza el título del contenido
 */
function updateTitle(title, subtitle = 'Gestiona y da seguimiento a tickets de soporte') {
    const titleEl = document.getElementById('contentTitle');
    const subtitleEl = document.getElementById('contentSubtitle');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
}

/**
 * Alterna la vista de estadísticas
 */
async function toggleStatsView() {
    const statsGrid = document.getElementById('statsGrid');
    const ticketsList = document.getElementById('ticketsList');

    if (statsGrid.classList.contains('hidden')) {
        // Mostrar estadísticas
        await loadStats();
        statsGrid.classList.remove('hidden');
        ticketsList.classList.add('hidden');
        updateTitle('Estadísticas de Soporte', 'Métricas y rendimiento del sistema');
    } else {
        // Ocultar estadísticas
        statsGrid.classList.add('hidden');
        ticketsList.classList.remove('hidden');
        updateTitle('Todos los Tickets');
    }
}

// ============================================
// CARGAR DATOS
// ============================================

/**
 * Carga los departamentos de soporte
 */
async function loadDepartments() {
    try {
        const data = await apiRequest('GET', `${API_BASE}/departments`);
        appState.departments = data.departments || [];

        // Poblar select de departamentos en el modal
        const select = document.getElementById('ticketDepartment');
        if (select) {
            select.innerHTML = '<option value="">Seleccione departamento</option>';
            appState.departments.forEach(dept => {
                select.innerHTML += `<option value="${dept.id}">${dept.name}</option>`;
            });
        }

        debugLog.log('APP', `✅ ${appState.departments.length} departamentos cargados`);
    } catch (error) {
        debugLog.error('APP', 'Error al cargar departamentos:', error);
        showError('Error al cargar departamentos');
    }
}

/**
 * Carga las categorías de tickets
 */
async function loadCategories() {
    try {
        const data = await apiRequest('GET', `${API_BASE}/categories`);
        appState.categories = data.categories || [];

        // Poblar select de categorías en el modal
        const select = document.getElementById('ticketCategory');
        if (select) {
            select.innerHTML = '<option value="">Seleccione categoría</option>';
            appState.categories.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        }

        debugLog.log('APP', `✅ ${appState.categories.length} categorías cargadas`);
    } catch (error) {
        debugLog.error('APP', 'Error al cargar categorías:', error);
        showError('Error al cargar categorías');
    }
}

/**
 * Carga los tickets según filtros actuales
 */
async function loadTickets() {
    try {
        showLoading(true);

        // Construir parámetros de query
        const params = new URLSearchParams();
        params.append('page', appState.currentPage);
        params.append('limit', appState.itemsPerPage);

        // Agregar filtros activos
        Object.entries(appState.filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                params.append(key, value);
            }
        });

        const data = await apiRequest('GET', `${API_BASE}/tickets?${params.toString()}`);

        appState.tickets = data.tickets || [];

        // Actualizar UI
        renderTickets(appState.tickets);
        renderPagination(data.pagination);
        updateBadgeCounts(data.counts);

        debugLog.log('TICKET', `✅ ${appState.tickets.length} tickets cargados`);
    } catch (error) {
        debugLog.error('TICKET', 'Error al cargar tickets:', error);
        showError('Error al cargar los tickets');
    } finally {
        showLoading(false);
    }
}

/**
 * Carga las estadísticas
 */
async function loadStats() {
    try {
        const data = await apiRequest('GET', `${API_BASE}/my-stats`);
        const stats = data.stats || {};

        // Actualizar valores en la UI
        document.getElementById('stat-created').textContent = stats.tickets_created || 0;
        document.getElementById('stat-assigned').textContent = stats.tickets_assigned || 0;
        document.getElementById('stat-watching').textContent = stats.tickets_watching || 0;

        debugLog.log('APP', '✅ Estadísticas cargadas');
    } catch (error) {
        debugLog.error('APP', 'Error al cargar estadísticas:', error);
        showError('Error al cargar estadísticas');
    }
}

// ============================================
// RENDERIZADO
// ============================================

/**
 * Renderiza la lista de tickets
 * @param {Array} tickets - Array de tickets a renderizar
 */
function renderTickets(tickets) {
    const container = document.getElementById('ticketsList');
    const emptyState = document.getElementById('emptyState');

    if (!tickets || tickets.length === 0) {
        container.innerHTML = DOMPurify.sanitize('');
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');

    container.innerHTML = DOMPurify.sanitize(tickets.map(ticket => `
        <div class="ticket-card" data-action="show-ticket-detail" data-param-1="${ticket.ticket_number}">
            <div class="ticket-header">
                <div>
                    <span class="ticket-number">${ticket.ticket_number}</span>
                    <span class="badge bg-${getPriorityColor(ticket.priority)}">${getPriorityLabel(ticket.priority)}</span>
                    <span class="badge bg-${getStatusColor(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                </div>
                <div class="ticket-meta">
                    <i class="bi bi-clock"></i>
                    <span>${formatDate(ticket.created_at)}</span>
                </div>
            </div>

            <h5 class="ticket-title">${escapeHtml(ticket.subject)}</h5>

            <p class="ticket-description">${truncateText(escapeHtml(ticket.description), 150)}</p>

            <div class="ticket-footer">
                <div class="ticket-info">
                    <span class="badge badge-outline">${ticket.department_name || 'Sin departamento'}</span>
                    <span class="badge badge-outline">${ticket.category_name || 'Sin categoría'}</span>
                </div>
                <div class="ticket-actions">
                    ${ticket.assigned_to ? `
                        <span class="text-muted">
                            <i class="bi bi-person"></i>
                            ${ticket.assigned_agent_name}
                        </span>
                    ` : '<span class="text-muted">Sin asignar</span>'}

                    ${ticket.comments_count > 0 ? `
                        <span class="text-muted">
                            <i class="bi bi-chat"></i>
                            ${ticket.comments_count}
                        </span>
                    ` : ''}

                    ${ticket.attachments_count > 0 ? `
                        <span class="text-muted">
                            <i class="bi bi-paperclip"></i>
                            ${ticket.attachments_count}
                        </span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join(''));
}

/**
 * Renderiza la paginación
 * @param {Object} pagination - Objeto de paginación
 */
function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    if (!container || !pagination) return;

    const { currentPage, totalPages } = pagination;

    if (totalPages <= 1) {
        container.innerHTML = DOMPurify.sanitize('');
        return;
    }

    let html = '';

    // Botón anterior
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">
                <i class="bi bi-chevron-left"></i>
            </a>
        </li>
    `;

    // Páginas
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }

    // Botón siguiente
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">
                <i class="bi bi-chevron-right"></i>
            </a>
        </li>
    `;

    container.innerHTML = html;
}

/**
 * Actualiza los contadores de badges en la sidebar
 * @param {Object} counts - Objeto con los contadores
 */
function updateBadgeCounts(counts) {
    if (!counts) return;

    document.getElementById('badge-all').textContent = counts.all || 0;
    document.getElementById('badge-my').textContent = counts.my || 0;
    document.getElementById('badge-assigned').textContent = counts.assigned || 0;
    document.getElementById('badge-watching').textContent = counts.watching || 0;
    document.getElementById('badge-open').textContent = counts.open || 0;
    document.getElementById('badge-progress').textContent = counts.in_progress || 0;
    document.getElementById('badge-resolved').textContent = counts.resolved || 0;
    document.getElementById('badge-urgent').textContent = counts.urgent || 0;
    document.getElementById('badge-high').textContent = counts.high || 0;
}

// ============================================
// MODAL DE NUEVO TICKET
// ============================================

/**
 * Muestra el modal de nuevo ticket
 */
function showNewTicketModal() {
    const modal = new bootstrap.Modal(document.getElementById('newTicketModal'));

    // Limpiar formulario
    document.getElementById('newTicketForm').reset();

    modal.show();
}

/**
 * Guarda un nuevo ticket
 */
async function handleSaveTicket() {
    try {
        const form = document.getElementById('newTicketForm');

        // Validar formulario
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData();
        formData.append('subject', document.getElementById('ticketSubject').value);
        formData.append('description', document.getElementById('ticketDescription').value);
        formData.append('department_id', document.getElementById('ticketDepartment').value);
        formData.append('category_id', document.getElementById('ticketCategory').value);
        formData.append('priority', document.getElementById('ticketPriority').value);

        // Agregar archivos adjuntos
        const filesInput = document.getElementById('ticketAttachments');
        if (filesInput.files.length > 0) {
            for (let i = 0; i < filesInput.files.length; i++) {
                formData.append('attachments', filesInput.files[i]);
            }
        }

        showLoading(true);

        const data = await apiRequest('POST', `${API_BASE}/tickets`, formData);

        showSuccess('Ticket creado exitosamente');

        // Cerrar modal
        bootstrap.Modal.getInstance(document.getElementById('newTicketModal')).hide();

        // Recargar tickets
        await loadTickets();

        // Mostrar detalle del ticket nuevo
        if (data.ticket) {
            showTicketDetail(data.ticket.ticket_number);
        }

    } catch (error) {
        debugLog.error('TICKET', 'Error al crear ticket:', error);
        showError(error.message || 'Error al crear el ticket');
    } finally {
        showLoading(false);
    }
}

// ============================================
// MODAL DE DETALLE DE TICKET
// ============================================

/**
 * Muestra el detalle completo de un ticket
 * @param {string} ticketNumber - Número del ticket a mostrar
 */
async function showTicketDetail(ticketNumber) {
    try {
        showLoading(true);

        const data = await apiRequest('GET', `${API_BASE}/tickets/${ticketNumber}`);
        const ticket = data.ticket;

        if (!ticket) {
            showError('Ticket no encontrado');
            return;
        }

        appState.currentTicket = ticket;

        // Renderizar detalle en el modal
        renderTicketDetail(ticket);

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('ticketDetailModal'));
        modal.show();

    } catch (error) {
        debugLog.error('TICKET', 'Error al cargar detalle del ticket:', error);
        showError('Error al cargar el detalle del ticket');
    } finally {
        showLoading(false);
    }
}

/**
 * Renderiza el detalle completo de un ticket
 * @param {Object} ticket - Objeto del ticket
 */
function renderTicketDetail(ticket) {
    const container = document.getElementById('ticketDetailBody');
    if (!container) return;

    container.innerHTML = DOMPurify.sanitize(`
        <div class="ticket-detail">
            <!-- Header del ticket -->
            <div class="ticket-detail-header">
                <div>
                    <h3>${escapeHtml(ticket.subject)}</h3>
                    <div class="ticket-meta">
                        <span class="ticket-number">${ticket.ticket_number}</span>
                        <span class="badge bg-${getPriorityColor(ticket.priority)}">${getPriorityLabel(ticket.priority)}</span>
                        <span class="badge bg-${getStatusColor(ticket.status)}">${getStatusLabel(ticket.status)}</span>
                    </div>
                </div>
                <div class="ticket-actions">
                    ${renderTicketActions(ticket)}
                </div>
            </div>

            <!-- Información del ticket -->
            <div class="ticket-detail-info">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Creado por:</strong> ${ticket.creator_name}</p>
                        <p><strong>Departamento:</strong> ${ticket.department_name || 'No asignado'}</p>
                        <p><strong>Categoría:</strong> ${ticket.category_name || 'No asignada'}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Asignado a:</strong> ${ticket.assigned_agent_name || 'Sin asignar'}</p>
                        <p><strong>Fecha de creación:</strong> ${formatDate(ticket.created_at)}</p>
                        <p><strong>Última actualización:</strong> ${formatDate(ticket.updated_at)}</p>
                    </div>
                </div>
            </div>

            <!-- Descripción -->
            <div class="ticket-description">
                <h5>Descripción</h5>
                <p>${escapeHtml(ticket.description)}</p>
            </div>

            <!-- Archivos adjuntos -->
            ${ticket.attachments && ticket.attachments.length > 0 ? `
                <div class="ticket-attachments">
                    <h5>Archivos adjuntos (${ticket.attachments.length})</h5>
                    <div class="attachments-list">
                        ${ticket.attachments.map(att => `
                            <div class="attachment-item">
                                <i class="bi bi-file-earmark"></i>
                                <a href="${att.file_path}" target="_blank">${att.file_name}</a>
                                <span class="text-muted">${formatFileSize(att.file_size)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Comentarios -->
            <div class="ticket-comments">
                <h5>Comentarios (${ticket.comments?.length || 0})</h5>
                <div id="commentsList">
                    ${renderComments(ticket.comments || [])}
                </div>

                <!-- Formulario de nuevo comentario -->
                <div class="new-comment-form mt-4">
                    <textarea
                        class="form-control"
                        id="newCommentText"
                        rows="3"
                        placeholder="Escribe un comentario..."></textarea>
                    <button
                        class="btn btn-primary mt-2"
                        data-action="handle-add-comment" data-param-1="${ticket.ticket_number}">
                        <i class="bi bi-send"></i> Enviar comentario
                    </button>
                </div>
            </div>

            <!-- Historial -->
            ${ticket.history && ticket.history.length > 0 ? `
                <div class="ticket-history mt-4">
                    <h5>Historial de cambios</h5>
                    <div class="history-list">
                        ${ticket.history.map(h => `
                            <div class="history-item">
                                <div class="history-icon">
                                    <i class="bi bi-circle-fill"></i>
                                </div>
                                <div class="history-content">
                                    <p class="mb-0">${h.change_description}</p>
                                    <small class="text-muted">
                                        ${h.changed_by_name} - ${formatDate(h.changed_at)}
                                    </small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `);
}

/**
 * Renderiza los botones de acciones del ticket
 * @param {Object} ticket - Objeto del ticket
 */
function renderTicketActions(ticket) {
    const isCreator = ticket.created_by === appState.user.id;
    const isAssigned = ticket.assigned_to === appState.user.id;
    const canModify = isCreator || isAssigned || appState.user.role === 'admin';

    let actions = '';

    if (ticket.status === 'open' && canModify) {
        actions += `
            <button class="btn btn-sm btn-primary" data-action="handle-assign-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-person-plus"></i> Asignar
            </button>
        `;
    }

    if (ticket.status === 'in_progress' && canModify) {
        actions += `
            <button class="btn btn-sm btn-success" data-action="handle-resolve-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-check-circle"></i> Resolver
            </button>
        `;
    }

    if (ticket.status === 'resolved' && canModify) {
        actions += `
            <button class="btn btn-sm btn-secondary" data-action="handle-close-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-x-circle"></i> Cerrar
            </button>
            <button class="btn btn-sm btn-warning" data-action="handle-reopen-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-arrow-counterclockwise"></i> Reabrir
            </button>
        `;
    }

    if (ticket.status === 'closed' && canModify) {
        actions += `
            <button class="btn btn-sm btn-warning" data-action="handle-reopen-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-arrow-counterclockwise"></i> Reabrir
            </button>
        `;
    }

    // Botón de seguir/dejar de seguir
    if (ticket.is_watching) {
        actions += `
            <button class="btn btn-sm btn-outline-secondary" data-action="handle-unwatch-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-eye-slash"></i> Dejar de seguir
            </button>
        `;
    } else {
        actions += `
            <button class="btn btn-sm btn-outline-primary" data-action="handle-watch-ticket" data-param-1="${ticket.ticket_number}">
                <i class="bi bi-eye"></i> Seguir
            </button>
        `;
    }

    return actions;
}

/**
 * Renderiza la lista de comentarios
 * @param {Array} comments - Array de comentarios
 */
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="text-muted">No hay comentarios aún.</p>';
    }

    return comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <strong>${comment.commenter_name}</strong>
                <span class="text-muted">${formatDate(comment.created_at)}</span>
            </div>
            <div class="comment-body">
                ${escapeHtml(comment.comment_text)}
            </div>
        </div>
    `).join('');
}

// ============================================
// ACCIONES DE TICKETS
// ============================================

/**
 * Asigna un ticket a un agente
 * @param {string} ticketNumber - Número del ticket
 */
async function handleAssignTicket(ticketNumber) {
    try {
        const assigned_to = appState.user.id; // Por ahora asignar al usuario actual

        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/assign`, {
            assigned_to
        });

        showSuccess('Ticket asignado exitosamente');

        // Recargar detalle
        await showTicketDetail(ticketNumber);

    } catch (error) {
        debugLog.error('TICKET', 'Error al asignar ticket:', error);
        showError('Error al asignar el ticket');
    }
}

/**
 * Marca un ticket como resuelto
 * @param {string} ticketNumber - Número del ticket
 */
async function handleResolveTicket(ticketNumber) {
    try {
        const resolution = prompt('Describe cómo se resolvió el ticket:');
        if (!resolution) return;

        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/resolve`, {
            resolution
        });

        showSuccess('Ticket resuelto exitosamente');

        // Recargar detalle
        await showTicketDetail(ticketNumber);
        await loadTickets();

    } catch (error) {
        debugLog.error('TICKET', 'Error al resolver ticket:', error);
        showError('Error al resolver el ticket');
    }
}

/**
 * Cierra un ticket
 * @param {string} ticketNumber - Número del ticket
 */
async function handleCloseTicket(ticketNumber) {
    try {
        if (!confirm('¿Estás seguro de cerrar este ticket?')) return;

        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/close`, {});

        showSuccess('Ticket cerrado exitosamente');

        // Recargar detalle
        await showTicketDetail(ticketNumber);
        await loadTickets();

    } catch (error) {
        debugLog.error('TICKET', 'Error al cerrar ticket:', error);
        showError('Error al cerrar el ticket');
    }
}

/**
 * Reabre un ticket
 * @param {string} ticketNumber - Número del ticket
 */
async function handleReopenTicket(ticketNumber) {
    try {
        const reason = prompt('¿Por qué deseas reabrir este ticket?');
        if (!reason) return;

        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/reopen`, {
            reason
        });

        showSuccess('Ticket reabierto exitosamente');

        // Recargar detalle
        await showTicketDetail(ticketNumber);
        await loadTickets();

    } catch (error) {
        debugLog.error('TICKET', 'Error al reabrir ticket:', error);
        showError('Error al reabrir el ticket');
    }
}

/**
 * Sigue un ticket
 * @param {string} ticketNumber - Número del ticket
 */
async function handleWatchTicket(ticketNumber) {
    try {
        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/watch`, {});

        showSuccess('Ahora estás siguiendo este ticket');

        // Recargar detalle
        await showTicketDetail(ticketNumber);

    } catch (error) {
        debugLog.error('TICKET', 'Error al seguir ticket:', error);
        showError('Error al seguir el ticket');
    }
}

/**
 * Deja de seguir un ticket
 * @param {string} ticketNumber - Número del ticket
 */
async function handleUnwatchTicket(ticketNumber) {
    try {
        await apiRequest('DELETE', `${API_BASE}/tickets/${ticketNumber}/watch`);

        showSuccess('Has dejado de seguir este ticket');

        // Recargar detalle
        await showTicketDetail(ticketNumber);

    } catch (error) {
        debugLog.error('TICKET', 'Error al dejar de seguir ticket:', error);
        showError('Error al dejar de seguir el ticket');
    }
}

/**
 * Agrega un comentario a un ticket
 * @param {string} ticketNumber - Número del ticket
 */
async function handleAddComment(ticketNumber) {
    try {
        const commentText = document.getElementById('newCommentText').value.trim();

        if (!commentText) {
            showError('El comentario no puede estar vacío');
            return;
        }

        await apiRequest('POST', `${API_BASE}/tickets/${ticketNumber}/comments`, {
            comment_text: commentText
        });

        showSuccess('Comentario agregado exitosamente');

        // Limpiar textarea
        document.getElementById('newCommentText').value = '';

        // Recargar detalle
        await showTicketDetail(ticketNumber);

    } catch (error) {
        debugLog.error('APP', 'Error al agregar comentario:', error);
        showError('Error al agregar el comentario');
    }
}

// ============================================
// PAGINACIÓN
// ============================================

/**
 * Cambia de página
 * @param {number} page - Número de página
 */
async function changePage(page) {
    appState.currentPage = page;
    await loadTickets();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// UTILIDADES DE API
// ============================================

/**
 * Realiza una petición a la API
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {string} url - URL del endpoint
 * @param {Object|FormData} data - Datos a enviar (opcional)
 * @returns {Promise} - Promesa con la respuesta
 */
async function apiRequest(method, url, data = null) {
    const token = localStorage.getItem('token');

    const options = {
        method,
        headers: {}
    };

    // Si no es FormData, agregar Content-Type y stringify
    if (data && !(data instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
    } else if (data instanceof FormData) {
        options.body = data;
    }

    // Agregar token de autenticación
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
        throw new Error(responseData.message || 'Error en la petición');
    }

    return responseData;
}

// ============================================
// UTILIDADES DE UI
// ============================================

/**
 * Muestra u oculta el spinner de carga
 * @param {boolean} show - true para mostrar, false para ocultar
 */
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

/**
 * Muestra un mensaje de éxito
 * @param {string} message - Mensaje a mostrar
 */
function showSuccess(message) {
    // Aquí puedes integrar tu sistema de notificaciones existente
    debugLog.log('MESSAGE', '✅ SUCCESS:', message);
    alert(message); // Temporal
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje a mostrar
 */
function showError(message) {
    // Aquí puedes integrar tu sistema de notificaciones existente
    debugLog.error('MESSAGE', '❌ ERROR:', message);
    alert(message); // Temporal
}

// ============================================
// UTILIDADES DE FORMATO
// ============================================

/**
 * Obtiene el color de badge según la prioridad
 * @param {string} priority - Prioridad del ticket
 * @returns {string} - Clase de color de Bootstrap
 */
function getPriorityColor(priority) {
    const colors = {
        low: 'secondary',
        medium: 'info',
        high: 'warning',
        urgent: 'danger'
    };
    return colors[priority] || 'secondary';
}

/**
 * Obtiene la etiqueta de prioridad
 * @param {string} priority - Prioridad del ticket
 * @returns {string} - Etiqueta en español
 */
function getPriorityLabel(priority) {
    const labels = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
}

/**
 * Obtiene el color de badge según el estado
 * @param {string} status - Estado del ticket
 * @returns {string} - Clase de color de Bootstrap
 */
function getStatusColor(status) {
    const colors = {
        open: 'primary',
        in_progress: 'warning',
        resolved: 'success',
        closed: 'secondary',
        cancelled: 'dark'
    };
    return colors[status] || 'secondary';
}

/**
 * Obtiene la etiqueta de estado
 * @param {string} status - Estado del ticket
 * @returns {string} - Etiqueta en español
 */
function getStatusLabel(status) {
    const labels = {
        open: 'Abierto',
        in_progress: 'En Progreso',
        resolved: 'Resuelto',
        closed: 'Cerrado',
        cancelled: 'Cancelado'
    };
    return labels[status] || status;
}

/**
 * Formatea una fecha
 * @param {string} dateString - Fecha en formato ISO
 * @returns {string} - Fecha formateada
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatea el tamaño de un archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
function formatFileSize(bytes) {
    if (!bytes) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Escapa caracteres HTML
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LOGOUT
// ============================================

/**
 * Cierra la sesión del usuario
 */
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// ============================================
// EXPONER FUNCIONES GLOBALES
// ============================================

// Exponer funciones que necesitan ser llamadas desde HTML
window.initSupportTickets = initSupportTickets;
window.showTicketDetail = showTicketDetail;
window.changePage = changePage;
window.handleAssignTicket = handleAssignTicket;
window.handleResolveTicket = handleResolveTicket;
window.handleCloseTicket = handleCloseTicket;
window.handleReopenTicket = handleReopenTicket;
window.handleWatchTicket = handleWatchTicket;
window.handleUnwatchTicket = handleUnwatchTicket;
window.handleAddComment = handleAddComment;

// ============================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    debugLog.log('APP', '🎫 Sistema de Tickets - DOM Ready');
    initSupportTickets();
});
