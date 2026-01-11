// Community Forums Viewer
// Conectado con backend/routes/forums.js (community-forums.js)
let currentCategories = [];
let currentCategoryId = null;
let currentTopicId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

// --- API Calls ---

async function fetchAPI(endpoint, method = 'GET', body = null) {
    // Usar claves correctas del sistema de autenticación unificado
    const token = localStorage.getItem('bge_auth_token') ||
        sessionStorage.getItem('bge_auth_token') ||
        localStorage.getItem('token'); // fallback legacy
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`/api/community${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || json.error);
        return json.data || json;
    } catch (e) {
        console.error('API Error:', e);
        // Fallback for demo if API fails
        if (endpoint === '/categories') return getMockForums();
        if (endpoint.includes('/topics') && method === 'GET') return getMockThreads();
        throw e;
    }
}

// --- Views Logic ---

async function loadCategories() {
    showLoader('categories-loading');
    const categories = await fetchAPI('/categories');
    currentCategories = categories;
    renderForums(categories);

    // Populate modal select
    const select = document.getElementById('thread-category');
    if (select) {
        select.innerHTML = categories.map(f => `<option value="${f.id}">${f.name || f.title}</option>`).join('');
    }
}

function renderForums(forums) {
    const container = document.getElementById('forum-list-view');
    // Keep loader div but clear content around it
    container.innerHTML = forums.map(f => `
        <div class="category-card" onclick="openForum(${f.id}, '${f.title}')">
            <div class="cat-icon">
                <i class="fas ${f.icon || 'fa-comments'}"></i>
            </div>
            <div>
                <h5 class="fw-bold mb-1">${f.title}</h5>
                <p class="text-muted mb-0 small">${f.description || ''}</p>
            </div>
            <div class="ms-auto text-muted small">
                <i class="fas fa-chevron-right"></i>
            </div>
        </div>
    `).join('');
}

async function openForum(categoryId, title) {
    currentCategoryId = categoryId;
    document.getElementById('current-forum-title').textContent = title;

    // Switch View
    document.getElementById('forum-list-view').classList.add('d-none');
    document.getElementById('thread-list-view').classList.remove('d-none');

    // Load Topics from backend - /api/community/topics?categoryId=X
    const topics = await fetchAPI(`/topics?categoryId=${categoryId}`);
    renderThreads(topics);
}

function renderThreads(threads) {
    const container = document.getElementById('threads-container');
    if (threads.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-muted">No hay hilos aún. ¡Sé el primero!</div>';
        return;
    }

    container.innerHTML = threads.map(t => `
        <div class="thread-item">
            <div class="vote-control">
                <button class="vote-btn"><i class="fas fa-chevron-up"></i></button>
                <div class="vote-count">${t.score || 0}</div>
            </div>
            <div class="thread-content">
                <a href="#" class="thread-title" onclick="openThread(${t.id}); return false;">
                    ${t.is_pinned ? '<i class="fas fa-thumbtack text-muted me-1"></i>' : ''}
                    ${t.title}
                    ${t.is_solved ? '<span class="thread-status solved">Resuelto</span>' : ''}
                </a>
                <div class="thread-meta">
                    Por <span class="fw-bold">${t.author_name || 'Usuario'}</span> • ${new Date(t.created_at).toLocaleDateString()} 
                    • <i class="far fa-comment ms-2 me-1"></i> ${t.reply_count || 0} respuestas
                </div>
            </div>
        </div>
    `).join('');
}

async function openThread(topicId) {
    currentTopicId = topicId;

    // Switch View
    document.getElementById('thread-list-view').classList.add('d-none');
    document.getElementById('thread-detail-view').classList.remove('d-none');

    // Backend uses /topics/:id for topic detail and /topics/:id/posts for replies
    const topic = await fetchAPI(`/topics/${topicId}`);
    const posts = await fetchAPI(`/topics/${topicId}/posts`);
    renderThreadDetail({ thread: topic, replies: posts });
}

function renderThreadDetail({ thread, replies }) {
    // Render Main Post
    const content = document.getElementById('thread-detail-content');
    content.innerHTML = `
        <div class="p-4 border-bottom">
            <div class="d-flex gap-3">
                <div class="vote-control">
                    <button class="vote-btn" onclick="vote('thread', ${thread.id}, 1)"><i class="fas fa-chevron-up"></i></button>
                    <div class="vote-count" id="thread-score-${thread.id}">${thread.score || 0}</div>
                    <button class="vote-btn"><i class="fas fa-chevron-down"></i></button>
                </div>
                <div>
                    <h2 class="h4 fw-bold mb-2">${thread.title}</h2>
                    <div class="d-flex align-items-center mb-3">
                        <img src="${thread.author_avatar || 'images/default-avatar.png'}" class="rounded-circle me-2" width="24" height="24">
                        <span class="small text-muted">Publicado por <strong>${thread.author_name}</strong> el ${new Date(thread.created_at).toLocaleString()}</span>
                    </div>
                    <div class="mb-0 text-break">${thread.content}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('reply-count').textContent = replies.length;

    // Render Replies
    const repliesContainer = document.getElementById('replies-container');
    repliesContainer.innerHTML = replies.map(r => `
        <div class="reply-item ${r.is_solution ? 'verified-answer' : ''} rounded-3 mb-3 border">
            ${r.is_solution ? '<div class="verified-badge"><i class="fas fa-check me-1"></i> Solución</div>' : ''}
            <div class="vote-control">
                <button class="vote-btn"><i class="fas fa-chevron-up"></i></button>
                <div class="vote-count">${r.score || 0}</div>
            </div>
            <div class="flex-grow-1">
                <div class="small text-muted mb-2">
                    <strong>${r.author_name}</strong> • ${new Date(r.created_at).toLocaleString()}
                </div>
                <div>${r.content}</div>
            </div>
        </div>
    `).join('');
}

// --- Actions ---

async function createThread() {
    const categoryId = document.getElementById('thread-category').value;
    const title = document.getElementById('thread-title').value;
    const content = document.getElementById('thread-content').value;

    if (!title || !content) return alert('Completa todos los campos');

    // Backend uses /topics with categoryId in body
    await fetchAPI('/topics', 'POST', {
        categoryId: parseInt(categoryId),
        title,
        content,
        topicType: 'discussion'
    });

    // Close modal & reload current view
    const modal = bootstrap.Modal.getInstance(document.getElementById('newThreadModal'));
    modal.hide();

    document.getElementById('new-thread-form').reset();

    if (currentCategoryId == categoryId) {
        openForum(categoryId, document.getElementById('current-forum-title').textContent);
    } else {
        alert('Tema creado exitosamente en la categoría seleccionada.');
    }
}

async function submitReply() {
    const content = document.getElementById('reply-input').value;
    if (!content) return;

    // Backend uses /topics/:id/posts for creating replies
    await fetchAPI(`/topics/${currentTopicId}/posts`, 'POST', { content });

    document.getElementById('reply-input').value = '';
    // Reload topic
    openThread(currentTopicId);
}

async function vote(type, id, value) {
    // Backend uses /topics/:id/react or /posts/:id/react
    const endpoint = type === 'thread' ? `/topics/${id}/react` : `/posts/${id}/react`;
    const reactionType = value > 0 ? 'like' : 'dislike';
    await fetchAPI(endpoint, 'POST', { reactionType });
}

// --- Navigation Helpers ---

function showCategories() {
    document.getElementById('thread-list-view').classList.add('d-none');
    document.getElementById('forum-list-view').classList.remove('d-none');
}

function backToThreats() {
    document.getElementById('thread-detail-view').classList.add('d-none');
    document.getElementById('thread-list-view').classList.remove('d-none');
}

function showLoader(id) {
    // Simple helper
}

// --- Mocks ---

function getMockForums() {
    return [
        { id: 1, title: 'Dudas Generales', description: 'Preguntas sobre la plataforma', icon: 'fa-question-circle' },
        { id: 2, title: 'Matemáticas', description: 'Cálculo, Álgebra y más', icon: 'fa-calculator' }
    ];
}

function getMockThreads() {
    return [
        { id: 101, title: '¿Cómo calculo la integral de x^2?', author_name: 'Juan Pérez', created_at: new Date(), reply_count: 3, score: 5, is_solved: true }
    ];
}
