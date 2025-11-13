/**
 * POLLS MANAGER - Sistema de Encuestas y Votaciones
 * window.getTenantConfigValue('school_name', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'window.getTenantConfigValue('school_short_form', 'BGE Héroes')')')')')') de la Patria')
 * Fecha: 19 de Octubre, 2025
 *
 * Funcionalidades:
 * - Crear y gestionar encuestas
 * - Sistema de votación en tiempo real
 * - Visualización de resultados con Chart.js
 * - Filtros y búsqueda de encuestas
 * - Exportación de resultados
 */

class PollsManager {
    constructor(config = {}) {
        this.containerId = config.containerId || 'polls-container';
        this.apiEndpoint = config.apiEndpoint || '/api/polls';
        this.mode = config.mode || 'public'; // 'public' | 'admin'
        this.currentPoll = null;
        this.categories = [];
        this.polls = [];
        this.currentFilter = {
            category: 'all',
            status: 'active',
            search: ''
        };

        this.init();
    }

    /**
     * Inicialización
     */
    async init() {
        await this.loadCategories();
        await this.loadPolls();
        this.render();
        this.attachEventListeners();
    }

    /**
     * Cargar categorías
     */
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiEndpoint}/categories/list`);
            const data = await response.json();

            if (data.success) {
                this.categories = data.data;
            }
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        }
    }

    /**
     * Cargar encuestas
     */
    async loadPolls() {
        try {
            const params = new URLSearchParams({
                status: this.currentFilter.status,
                limit: 20,
                offset: 0
            });

            if (this.currentFilter.category !== 'all') {
                params.append('category', this.currentFilter.category);
            }

            if (this.currentFilter.search) {
                params.append('search', this.currentFilter.search);
            }

            const response = await fetch(`${this.apiEndpoint}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.polls = data.data;
            }
        } catch (error) {
            console.error('Error al cargar encuestas:', error);
            this.showNotification('Error al cargar las encuestas', 'error');
        }
    }

    /**
     * Renderizar interfaz principal
     */
    render() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Contenedor no encontrado:', this.containerId);
            return;
        }

        let html = '';

        if (this.mode === 'admin') {
            html += this.renderAdminHeader();
        }

        html += this.renderFilters();
        html += this.renderPollsList();

        container.innerHTML = html;
    }

    /**
     * Renderizar encabezado de administración
     */
    renderAdminHeader() {
        return `
            <div class="polls-admin-header">
                <h2>Gestión de Encuestas</h2>
                <button class="btn btn-primary" id="create-poll-btn">
                    <i class="fas fa-plus"></i> Nueva Encuesta
                </button>
            </div>
        `;
    }

    /**
     * Renderizar filtros
     */
    renderFilters() {
        return `
            <div class="polls-filters">
                <div class="filter-group">
                    <label>Categoría:</label>
                    <select id="poll-category-filter">
                        <option value="all">Todas las categorías</option>
                        ${this.categories.map(cat => `
                            <option value="${cat.slug}" ${this.currentFilter.category === cat.slug ? 'selected' : ''}>
                                ${cat.icon} ${cat.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                ${this.mode === 'admin' ? `
                    <div class="filter-group">
                        <label>Estado:</label>
                        <select id="poll-status-filter">
                            <option value="all">Todos</option>
                            <option value="draft">Borrador</option>
                            <option value="active" ${this.currentFilter.status === 'active' ? 'selected' : ''}>Activas</option>
                            <option value="closed">Cerradas</option>
                            <option value="archived">Archivadas</option>
                        </select>
                    </div>
                ` : ''}

                <div class="filter-group filter-search">
                    <label>Buscar:</label>
                    <input
                        type="text"
                        id="poll-search-input"
                        placeholder="Buscar encuestas..."
                        value="${this.currentFilter.search}"
                    >
                </div>
            </div>
        `;
    }

    /**
     * Renderizar lista de encuestas
     */
    renderPollsList() {
        if (this.polls.length === 0) {
            return `
                <div class="polls-empty">
                    <p>No hay encuestas disponibles</p>
                </div>
            `;
        }

        return `
            <div class="polls-grid">
                ${this.polls.map(poll => this.renderPollCard(poll)).join('')}
            </div>
        `;
    }

    /**
     * Renderizar tarjeta de encuesta
     */
    renderPollCard(poll) {
        const statusBadge = this.getStatusBadge(poll.computed_status || poll.status);
        const canVote = poll.computed_status === 'active' && !poll.user_has_voted;

        return `
            <div class="poll-card" data-poll-id="${poll.id}" style="border-left: 4px solid ${poll.color}">
                ${poll.image_url ? `
                    <div class="poll-card-image">
                        <img src="${poll.image_url}" alt="${poll.title}">
                    </div>
                ` : ''}

                <div class="poll-card-header">
                    <h3>${poll.title}</h3>
                    ${statusBadge}
                    ${poll.featured ? '<span class="poll-featured-badge">⭐ Destacada</span>' : ''}
                </div>

                <div class="poll-card-body">
                    ${poll.description ? `<p class="poll-description">${poll.description}</p>` : ''}

                    <div class="poll-meta">
                        <span><i class="fas fa-poll"></i> ${poll.options_count} opciones</span>
                        <span><i class="fas fa-users"></i> ${poll.total_participants || 0} participantes</span>
                        <span><i class="fas fa-chart-bar"></i> ${poll.total_votes || 0} votos</span>
                    </div>

                    ${poll.categories ? `
                        <div class="poll-categories">
                            ${poll.categories.split(', ').map(cat => `
                                <span class="poll-category-tag">${cat}</span>
                            `).join('')}
                        </div>
                    ` : ''}

                    ${poll.ends_at ? `
                        <div class="poll-deadline">
                            <i class="fas fa-clock"></i>
                            Finaliza: ${this.formatDate(poll.ends_at)}
                        </div>
                    ` : ''}
                </div>

                <div class="poll-card-actions">
                    ${canVote ? `
                        <button class="btn btn-primary poll-vote-btn" data-poll-id="${poll.id}">
                            <i class="fas fa-vote-yea"></i> Votar
                        </button>
                    ` : ''}

                    ${poll.user_has_voted || poll.show_results_before_voting || poll.computed_status === 'closed' ? `
                        <button class="btn btn-secondary poll-results-btn" data-poll-id="${poll.id}">
                            <i class="fas fa-chart-pie"></i> Ver Resultados
                        </button>
                    ` : ''}

                    ${this.mode === 'admin' ? `
                        <button class="btn btn-secondary poll-edit-btn" data-poll-id="${poll.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn btn-danger poll-delete-btn" data-poll-id="${poll.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Obtener badge de estado
     */
    getStatusBadge(status) {
        const badges = {
            draft: '<span class="poll-status-badge status-draft">Borrador</span>',
            active: '<span class="poll-status-badge status-active">Activa</span>',
            scheduled: '<span class="poll-status-badge status-scheduled">Programada</span>',
            expired: '<span class="poll-status-badge status-expired">Finalizada</span>',
            closed: '<span class="poll-status-badge status-closed">Cerrada</span>',
            archived: '<span class="poll-status-badge status-archived">Archivada</span>'
        };

        return badges[status] || '';
    }

    /**
     * Mostrar modal de votación
     */
    async showVotingModal(pollId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${pollId}`);
            const data = await response.json();

            if (!data.success) {
                this.showNotification('Error al cargar la encuesta', 'error');
                return;
            }

            const poll = data.data;
            this.currentPoll = poll;

            const modal = document.createElement('div');
            modal.className = 'modal poll-modal';
            modal.innerHTML = sanitizeHTML(`
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${poll.title}</h2>
                        <button class="modal-close">&times;</button>
                    </div>

                    <div class="modal-body">
                        ${poll.description ? `<p class="poll-modal-description">${poll.description}</p>` : ''}

                        <form id="poll-vote-form">
                            ${this.renderVotingOptions(poll)}

                            <div class="poll-vote-actions">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-check"></i> Enviar Voto
                                </button>
                                <button type="button" class="btn btn-secondary modal-close-btn">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `);

            document.body.appendChild(modal);

            // Event listeners del modal
            modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
            modal.querySelector('.modal-close-btn').addEventListener('click', () => this.closeModal(modal));
            modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal(modal));

            modal.querySelector('#poll-vote-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitVote(poll, modal);
            });

            // Mostrar modal con animación
            setTimeout(() => modal.classList.add('active'), 10);

        } catch (error) {
            console.error('Error al mostrar modal de votación:', error);
            this.showNotification('Error al cargar la encuesta', 'error');
        }
    }

    /**
     * Renderizar opciones de votación
     */
    renderVotingOptions(poll) {
        const inputType = poll.type === 'multiple_choice' ? 'checkbox' : 'radio';
        const inputName = 'poll-option';

        if (poll.type === 'rating') {
            return `
                <div class="poll-rating-input">
                    <label>Califica del 1 al 10:</label>
                    <div class="rating-stars">
                        ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                            <input type="radio" id="rating-${num}" name="rating" value="${num}" required>
                            <label for="rating-${num}">${num}</label>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (poll.type === 'open_ended') {
            return `
                <div class="poll-open-input">
                    <label>Tu respuesta:</label>
                    <textarea
                        name="open-text"
                        rows="5"
                        maxlength="1000"
                        placeholder="Escribe tu respuesta aquí..."
                        required
                    ></textarea>
                    <div class="char-counter">
                        <span class="current">0</span> / 1000 caracteres
                    </div>
                </div>
            `;
        }

        return `
            <div class="poll-options-list">
                ${poll.options.map(option => `
                    <div class="poll-option">
                        <input
                            type="${inputType}"
                            id="option-${option.id}"
                            name="${inputName}"
                            value="${option.id}"
                            ${poll.type === 'single_choice' ? 'required' : ''}
                        >
                        <label for="option-${option.id}">
                            ${option.image_url ? `<img src="${option.image_url}" alt="${option.text}">` : ''}
                            <span class="option-text">${option.text}</span>
                            ${option.description ? `<span class="option-description">${option.description}</span>` : ''}
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Enviar voto
     */
    async submitVote(poll, modal) {
        try {
            let voteData = {};

            if (poll.type === 'rating') {
                const ratingInput = modal.querySelector('input[name="rating"]:checked');
                if (!ratingInput) {
                    this.showNotification('Por favor selecciona una calificación', 'warning');
                    return;
                }
                voteData.rating_value = parseInt(ratingInput.value);

            } else if (poll.type === 'open_ended') {
                const textInput = modal.querySelector('textarea[name="open-text"]');
                if (!textInput.value.trim()) {
                    this.showNotification('Por favor escribe una respuesta', 'warning');
                    return;
                }
                voteData.open_text = textInput.value.trim();

            } else if (poll.type === 'multiple_choice') {
                const checkedOptions = modal.querySelectorAll('input[name="poll-option"]:checked');
                if (checkedOptions.length === 0) {
                    this.showNotification('Por favor selecciona al menos una opción', 'warning');
                    return;
                }
                voteData.option_ids = Array.from(checkedOptions).map(input => parseInt(input.value));

            } else { // single_choice
                const selectedOption = modal.querySelector('input[name="poll-option"]:checked');
                if (!selectedOption) {
                    this.showNotification('Por favor selecciona una opción', 'warning');
                    return;
                }
                voteData.option_id = parseInt(selectedOption.value);
            }

            const response = await fetch(`${this.apiEndpoint}/${poll.id}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(voteData)
            });

            const data = await response.json();

            if (!data.success) {
                this.showNotification(data.error || 'Error al enviar el voto', 'error');
                return;
            }

            this.showNotification('¡Voto registrado exitosamente!', 'success');
            this.closeModal(modal);

            // Mostrar resultados
            setTimeout(() => {
                this.showResultsModal(poll.id);
            }, 500);

            // Recargar encuestas
            await this.loadPolls();
            this.render();

        } catch (error) {
            console.error('Error al enviar voto:', error);
            this.showNotification('Error al enviar el voto', 'error');
        }
    }

    /**
     * Mostrar modal de resultados
     */
    async showResultsModal(pollId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${pollId}/results`);
            const data = await response.json();

            if (!data.success) {
                this.showNotification('Error al cargar los resultados', 'error');
                return;
            }

            const { poll, options, statistics } = data.data;

            const modal = document.createElement('div');
            modal.className = 'modal poll-results-modal';
            modal.innerHTML = sanitizeHTML(`
                <div class="modal-overlay"></div>
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h2>${poll.title} - Resultados</h2>
                        <button class="modal-close">&times;</button>
                    </div>

                    <div class="modal-body">
                        <div class="poll-results-summary">
                            <div class="result-stat">
                                <div class="stat-value">${statistics.total_votes || 0}</div>
                                <div class="stat-label">Total de Votos</div>
                            </div>
                            <div class="result-stat">
                                <div class="stat-value">${statistics.unique_voters || 0}</div>
                                <div class="stat-label">Participantes</div>
                            </div>
                            ${statistics.average_rating ? `
                                <div class="result-stat">
                                    <div class="stat-value">${parseFloat(statistics.average_rating).toFixed(1)}</div>
                                    <div class="stat-label">Calificación Promedio</div>
                                </div>
                            ` : ''}
                        </div>

                        <div class="poll-results-chart">
                            <canvas id="poll-results-canvas"></canvas>
                        </div>

                        <div class="poll-results-list">
                            ${options.map(option => `
                                <div class="result-option">
                                    <div class="result-option-header">
                                        <span class="result-option-text">${option.text}</span>
                                        <span class="result-option-percentage">${option.percentage}%</span>
                                    </div>
                                    <div class="result-option-bar">
                                        <div class="result-option-fill" style="width: ${option.percentage}%"></div>
                                    </div>
                                    <div class="result-option-votes">${option.votes_count} votos</div>
                                </div>
                            `).join('')}
                        </div>

                        ${this.mode === 'admin' ? `
                            <div class="poll-results-actions">
                                <button class="btn btn-secondary" id="export-csv-btn">
                                    <i class="fas fa-file-csv"></i> Exportar CSV
                                </button>
                                <button class="btn btn-secondary" id="export-json-btn">
                                    <i class="fas fa-file-code"></i> Exportar JSON
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `);

            document.body.appendChild(modal);

            // Event listeners
            modal.querySelector('.modal-close').addEventListener('click', () => this.closeModal(modal));
            modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeModal(modal));

            if (this.mode === 'admin') {
                modal.querySelector('#export-csv-btn').addEventListener('click', () => {
                    window.location.href = `${this.apiEndpoint}/${pollId}/export?format=csv`;
                });
                modal.querySelector('#export-json-btn').addEventListener('click', () => {
                    window.location.href = `${this.apiEndpoint}/${pollId}/export?format=json`;
                });
            }

            // Renderizar gráfica con Chart.js
            setTimeout(() => {
                this.renderResultsChart(options, poll.type);
            }, 100);

            // Mostrar modal
            setTimeout(() => modal.classList.add('active'), 10);

        } catch (error) {
            console.error('Error al mostrar resultados:', error);
            this.showNotification('Error al cargar los resultados', 'error');
        }
    }

    /**
     * Renderizar gráfica de resultados con Chart.js
     */
    renderResultsChart(options, pollType) {
        const canvas = document.getElementById('poll-results-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const chartData = {
            labels: options.map(opt => opt.text),
            datasets: [{
                label: 'Votos',
                data: options.map(opt => opt.votes_count),
                backgroundColor: [
                    '#3498db',
                    '#e74c3c',
                    '#2ecc71',
                    '#f39c12',
                    '#9b59b6',
                    '#1abc9c',
                    '#34495e',
                    '#e67e22',
                    '#95a5a6'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };

        new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const option = options[context.dataIndex];
                                return `${option.text}: ${option.votes_count} votos (${option.percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Cerrar modal
     */
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Filtro de categoría
        const categoryFilter = document.getElementById('poll-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', async (e) => {
                this.currentFilter.category = e.target.value;
                await this.loadPolls();
                this.render();
            });
        }

        // Filtro de estado
        const statusFilter = document.getElementById('poll-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', async (e) => {
                this.currentFilter.status = e.target.value;
                await this.loadPolls();
                this.render();
            });
        }

        // Búsqueda
        const searchInput = document.getElementById('poll-search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(async () => {
                    this.currentFilter.search = e.target.value;
                    await this.loadPolls();
                    this.render();
                }, 500);
            });
        }

        // Botones de votar
        document.querySelectorAll('.poll-vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pollId = e.currentTarget.getAttribute('data-poll-id');
                this.showVotingModal(pollId);
            });
        });

        // Botones de resultados
        document.querySelectorAll('.poll-results-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pollId = e.currentTarget.getAttribute('data-poll-id');
                this.showResultsModal(pollId);
            });
        });

        // Botones de administración
        if (this.mode === 'admin') {
            const createBtn = document.getElementById('create-poll-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => this.showCreatePollModal());
            }

            document.querySelectorAll('.poll-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const pollId = e.currentTarget.getAttribute('data-poll-id');
                    this.showEditPollModal(pollId);
                });
            });

            document.querySelectorAll('.poll-delete-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const pollId = e.currentTarget.getAttribute('data-poll-id');
                    if (confirm('¿Estás seguro de que quieres eliminar esta encuesta?')) {
                        await this.deletePoll(pollId);
                    }
                });
            });
        }
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Formatear fecha
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Eliminar encuesta
     */
    async deletePoll(pollId) {
        try {
            const response = await fetch(`${this.apiEndpoint}/${pollId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Encuesta eliminada exitosamente', 'success');
                await this.loadPolls();
                this.render();
            } else {
                this.showNotification(data.error || 'Error al eliminar la encuesta', 'error');
            }

        } catch (error) {
            console.error('Error al eliminar encuesta:', error);
            this.showNotification('Error al eliminar la encuesta', 'error');
        }
    }

    // Métodos showCreatePollModal y showEditPollModal se implementarían aquí
    // Por brevedad, se omiten en este ejemplo
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PollsManager;
}
