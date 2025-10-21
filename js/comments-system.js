/**
 * COMMENTS SYSTEM - Sistema de Comentarios para Noticias
 * BGE Héroes de la Patria
 * Fecha: 19 de Octubre, 2025
 */

class CommentsSystem {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/comments';
        this.newsId = options.newsId;
        this.container = options.container;
        this.userId = localStorage.getItem('userId');
        this.userName = localStorage.getItem('userName') || 'Usuario';

        this.comments = [];
        this.sortOrder = 'newest'; // 'newest', 'oldest', 'popular'
        this.editingCommentId = null;

        if (this.container && this.newsId) {
            this.init();
        }
    }

    async init() {
        await this.loadComments();
        this.render();
        this.attachEventListeners();
        console.log(`✅ Sistema de comentarios inicializado para noticia ${this.newsId}`);
    }

    /**
     * Cargar comentarios del servidor
     */
    async loadComments() {
        try {
            const response = await fetch(`${this.apiEndpoint}?newsId=${this.newsId}&sort=${this.sortOrder}`);

            if (response.ok) {
                this.comments = await response.json();
            } else {
                console.error('Error cargando comentarios');
                this.comments = [];
            }
        } catch (error) {
            console.error('Error cargando comentarios:', error);
            this.comments = [];
        }
    }

    /**
     * Renderizar sistema de comentarios
     */
    render() {
        const container = typeof this.container === 'string'
            ? document.querySelector(this.container)
            : this.container;

        if (!container) {
            console.error('Contenedor de comentarios no encontrado');
            return;
        }

        container.innerHTML = `
            <div class="comments-system">
                <div class="comments-header">
                    <h3>Comentarios (${this.comments.length})</h3>
                    ${this.renderSortOptions()}
                </div>

                ${this.userId ? this.renderCommentForm() : this.renderLoginPrompt()}

                <div class="comments-list" id="comments-list">
                    ${this.renderComments()}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Renderizar opciones de ordenamiento
     */
    renderSortOptions() {
        return `
            <div class="comments-sort">
                <label>Ordenar por:</label>
                <select id="comment-sort" class="form-control">
                    <option value="newest" ${this.sortOrder === 'newest' ? 'selected' : ''}>
                        Más recientes
                    </option>
                    <option value="oldest" ${this.sortOrder === 'oldest' ? 'selected' : ''}>
                        Más antiguos
                    </option>
                    <option value="popular" ${this.sortOrder === 'popular' ? 'selected' : ''}>
                        Más populares
                    </option>
                </select>
            </div>
        `;
    }

    /**
     * Renderizar formulario de comentario
     */
    renderCommentForm() {
        return `
            <div class="comment-form-container">
                <form id="comment-form" class="comment-form">
                    <div class="user-avatar">
                        ${this.getAvatarHTML(this.userName)}
                    </div>
                    <div class="comment-input-wrapper">
                        <textarea
                            id="comment-input"
                            class="form-control"
                            placeholder="Escribe tu comentario..."
                            rows="3"
                            maxlength="1000"
                            required
                        ></textarea>
                        <div class="comment-form-actions">
                            <span class="char-count">
                                <span id="char-count">0</span>/1000
                            </span>
                            <button type="submit" class="btn btn-primary">
                                ${this.editingCommentId ? 'Actualizar' : 'Publicar'} Comentario
                            </button>
                            ${this.editingCommentId ? `
                                <button type="button" class="btn btn-secondary" id="cancel-edit">
                                    Cancelar
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Renderizar prompt de login
     */
    renderLoginPrompt() {
        return `
            <div class="comments-login-prompt">
                <p>Debes <a href="/login">iniciar sesión</a> para comentar</p>
            </div>
        `;
    }

    /**
     * Renderizar lista de comentarios
     */
    renderComments() {
        if (this.comments.length === 0) {
            return `
                <div class="no-comments">
                    <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
                </div>
            `;
        }

        return this.comments.map(comment => this.renderComment(comment)).join('');
    }

    /**
     * Renderizar un comentario individual
     */
    renderComment(comment) {
        const isAuthor = this.userId && this.userId === comment.user_id;
        const isEdited = comment.edited_at && comment.edited_at !== comment.created_at;

        return `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-avatar">
                    ${this.getAvatarHTML(comment.user_name)}
                </div>

                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.user_name}</span>
                        <span class="comment-time">
                            ${this.formatTime(comment.created_at)}
                            ${isEdited ? '<span class="edited-badge">(editado)</span>' : ''}
                        </span>
                    </div>

                    <div class="comment-text">
                        ${this.escapeHtml(comment.content)}
                    </div>

                    <div class="comment-actions">
                        <button class="comment-action-btn like-btn ${comment.user_liked ? 'liked' : ''}"
                                data-comment-id="${comment.id}">
                            <span class="like-icon">${comment.user_liked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${comment.likes || 0}</span>
                        </button>

                        <button class="comment-action-btn reply-btn"
                                data-comment-id="${comment.id}">
                            💬 Responder
                        </button>

                        ${isAuthor ? `
                            <button class="comment-action-btn edit-btn"
                                    data-comment-id="${comment.id}">
                                ✏️ Editar
                            </button>
                            <button class="comment-action-btn delete-btn"
                                    data-comment-id="${comment.id}">
                                🗑️ Eliminar
                            </button>
                        ` : ''}
                    </div>

                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="comment-replies">
                            ${comment.replies.map(reply => this.renderReply(reply)).join('')}
                        </div>
                    ` : ''}

                    <div class="reply-form-container" id="reply-form-${comment.id}" style="display: none;">
                        ${this.renderReplyForm(comment.id)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renderizar respuesta a comentario
     */
    renderReply(reply) {
        const isAuthor = this.userId && this.userId === reply.user_id;

        return `
            <div class="comment-reply" data-comment-id="${reply.id}">
                <div class="comment-avatar small">
                    ${this.getAvatarHTML(reply.user_name)}
                </div>
                <div class="reply-content">
                    <span class="reply-author">${reply.user_name}</span>
                    <span class="reply-text">${this.escapeHtml(reply.content)}</span>
                    <span class="reply-time">${this.formatTime(reply.created_at)}</span>
                    ${isAuthor ? `
                        <button class="delete-reply-btn" data-reply-id="${reply.id}">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderizar formulario de respuesta
     */
    renderReplyForm(parentId) {
        return `
            <form class="reply-form" data-parent-id="${parentId}">
                <textarea
                    class="form-control reply-input"
                    placeholder="Escribe tu respuesta..."
                    rows="2"
                    maxlength="500"
                    required
                ></textarea>
                <div class="reply-actions">
                    <button type="submit" class="btn btn-sm btn-primary">Responder</button>
                    <button type="button" class="btn btn-sm btn-secondary cancel-reply">Cancelar</button>
                </div>
            </form>
        `;
    }

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Formulario principal
        const form = document.getElementById('comment-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));

            const input = document.getElementById('comment-input');
            if (input) {
                input.addEventListener('input', this.updateCharCount);
            }

            const cancelBtn = document.getElementById('cancel-edit');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.cancelEdit());
            }
        }

        // Ordenamiento
        const sortSelect = document.getElementById('comment-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e));
        }

        // Botones de acciones
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleLike(e));
        });

        document.querySelectorAll('.reply-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleReplyClick(e));
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEdit(e));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDelete(e));
        });

        // Formularios de respuesta
        document.querySelectorAll('.reply-form').forEach(form => {
            form.addEventListener('submit', (e) => this.handleReplySubmit(e));
        });

        document.querySelectorAll('.cancel-reply').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const form = e.target.closest('.reply-form-container');
                if (form) form.style.display = 'none';
            });
        });
    }

    /**
     * Manejar envío de comentario
     */
    async handleSubmit(e) {
        e.preventDefault();

        const input = document.getElementById('comment-input');
        const content = input.value.trim();

        if (!content) return;

        try {
            const method = this.editingCommentId ? 'PUT' : 'POST';
            const url = this.editingCommentId
                ? `${this.apiEndpoint}/${this.editingCommentId}`
                : this.apiEndpoint;

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    newsId: this.newsId,
                    content,
                    userId: this.userId
                })
            });

            if (response.ok) {
                input.value = '';
                this.editingCommentId = null;
                await this.loadComments();
                this.render();

                this.showNotification('✅ Comentario publicado exitosamente');
            } else {
                this.showNotification('❌ Error al publicar comentario', 'error');
            }
        } catch (error) {
            console.error('Error publicando comentario:', error);
            this.showNotification('❌ Error al publicar comentario', 'error');
        }
    }

    /**
     * Manejar clic en like
     */
    async handleLike(e) {
        const commentId = e.currentTarget.dataset.commentId;

        try {
            const response = await fetch(`${this.apiEndpoint}/${commentId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                await this.loadComments();
                this.render();
            }
        } catch (error) {
            console.error('Error en like:', error);
        }
    }

    /**
     * Manejar clic en responder
     */
    handleReplyClick(e) {
        const commentId = e.currentTarget.dataset.commentId;
        const replyForm = document.getElementById(`reply-form-${commentId}`);

        if (replyForm) {
            replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Manejar envío de respuesta
     */
    async handleReplySubmit(e) {
        e.preventDefault();

        const form = e.target;
        const parentId = form.dataset.parentId;
        const input = form.querySelector('.reply-input');
        const content = input.value.trim();

        if (!content) return;

        try {
            const response = await fetch(`${this.apiEndpoint}/${parentId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    content,
                    userId: this.userId
                })
            });

            if (response.ok) {
                input.value = '';
                form.closest('.reply-form-container').style.display = 'none';
                await this.loadComments();
                this.render();
                this.showNotification('✅ Respuesta publicada');
            }
        } catch (error) {
            console.error('Error publicando respuesta:', error);
            this.showNotification('❌ Error al publicar respuesta', 'error');
        }
    }

    /**
     * Manejar edición de comentario
     */
    async handleEdit(e) {
        const commentId = parseInt(e.currentTarget.dataset.commentId);
        const comment = this.comments.find(c => c.id === commentId);

        if (comment) {
            this.editingCommentId = commentId;
            const input = document.getElementById('comment-input');
            if (input) {
                input.value = comment.content;
                input.focus();
                this.render();
            }
        }
    }

    /**
     * Cancelar edición
     */
    cancelEdit() {
        this.editingCommentId = null;
        const input = document.getElementById('comment-input');
        if (input) {
            input.value = '';
        }
        this.render();
    }

    /**
     * Manejar eliminación de comentario
     */
    async handleDelete(e) {
        const commentId = e.currentTarget.dataset.commentId;

        if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiEndpoint}/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (response.ok) {
                await this.loadComments();
                this.render();
                this.showNotification('🗑️ Comentario eliminado');
            }
        } catch (error) {
            console.error('Error eliminando comentario:', error);
            this.showNotification('❌ Error al eliminar comentario', 'error');
        }
    }

    /**
     * Manejar cambio de ordenamiento
     */
    async handleSortChange(e) {
        this.sortOrder = e.target.value;
        await this.loadComments();
        this.render();
    }

    /**
     * Actualizar contador de caracteres
     */
    updateCharCount(e) {
        const charCount = document.getElementById('char-count');
        if (charCount) {
            charCount.textContent = e.target.value.length;
        }
    }

    /**
     * Obtener HTML de avatar
     */
    getAvatarHTML(userName) {
        const initial = userName.charAt(0).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9'];
        const color = colors[userName.charCodeAt(0) % colors.length];

        return `
            <div class="avatar" style="background-color: ${color}">
                ${initial}
            </div>
        `;
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
     * Formatear tiempo relativo
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `Hace ${hours}h`;

        const days = Math.floor(hours / 24);
        if (days < 7) return `Hace ${days}d`;

        return date.toLocaleDateString('es-MX');
    }

    /**
     * Mostrar notificación toast
     */
    showNotification(message, type = 'success') {
        // Reutilizar sistema de notificaciones si existe
        if (window.notificationClient) {
            window.notificationClient.showToast({
                tipo: type,
                titulo: 'Comentarios',
                mensaje: message
            });
        } else {
            alert(message);
        }
    }

    /**
     * Destruir sistema
     */
    destroy() {
        this.comments = [];
        console.log('🗑️ CommentsSystem destruido');
    }
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommentsSystem;
}
