// Study Groups Viewer Logic (Real API Connection)

document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
});

async function loadGroups() {
    const grid = document.getElementById('groups-grid');
    const empty = document.getElementById('empty-state');

    // Get filters
    const search = document.getElementById('search-input').value;
    const subject = document.getElementById('subject-filter').value;

    try {
        const token = localStorage.getItem('token');
        // No bloqueamos si no hay token, pero la API podría fallar o retornar público

        let url = `/api/groups/search?`;
        const params = new URLSearchParams();
        if (subject) params.append('subject', subject);
        if (search) params.append('topic', search);

        // Preparamos headers, si hay token lo enviamos
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(url + params.toString(), {
            headers: headers
        });

        let groups = [];
        if (response.ok) {
            const json = await response.json();
            if (Array.isArray(json)) {
                groups = json;
            } else if (Array.isArray(json.data)) {
                groups = json.data;
            } else if (Array.isArray(json.groups)) {
                groups = json.groups;
            } else if (json.data && Array.isArray(json.data.groups)) {
                groups = json.data.groups;
            }
        }

        if (!groups || groups.length === 0) {
            groups = await fetchMockGroups(subject, search);
        }

        if (!groups || groups.length === 0) {
            grid.innerHTML = '';
            grid.classList.add('d-none');
            empty.classList.remove('d-none');
        } else {
            empty.classList.add('d-none');
            grid.classList.remove('d-none');
            renderGroups(groups, grid);
        }

    } catch (error) {
        console.error('Error loading groups:', error);
        loadMockGroups(subject, search, grid, empty);
    }
}

async function loadMockGroups(subject, search, grid, empty) {
    const groups = await fetchMockGroups(subject, search);
    if (!groups || groups.length === 0) {
        grid.innerHTML = '';
        grid.classList.add('d-none');
        empty.classList.remove('d-none');
    } else {
        empty.classList.add('d-none');
        grid.classList.remove('d-none');
        renderGroups(groups, grid);
    }
}

function renderGroups(groups, container) {
    if (!container) return;
    if (!Array.isArray(groups)) {
        groups = [];
    }
    container.innerHTML = groups.map(group => `
        <div class="col">
            <div class="group-card">
                <div class="group-header-img">
                    <div class="group-header-pattern"></div>
                    <span class="group-badge">
                        <i class="fas ${group.is_private ? 'fa-lock' : 'fa-globe'} me-1"></i>
                        ${group.is_private ? 'Privado' : 'Público'}
                    </span>
                </div>
                <div class="group-body">
                    <div class="group-subject">${group.subject || 'General'}</div>
                    <h3 class="group-title text-truncate" title="${group.name}">${group.name}</h3>
                    <p class="group-desc">${group.description || 'Sin descripción.'}</p>
                    
                    <div class="group-meta">
                        <div class="d-flex align-items-center">
                            <div class="users-avatars">
                                ${renderAvatars(group.member_count)}
                            </div>
                            <span class="member-count ms-2">${group.member_count || 0} miembros</span>
                        </div>
                        <button class="btn btn-outline-primary btn-sm rounded-pill" onclick="joinGroup(${group.id}, ${group.is_private})">
                            Unirse
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAvatars(countStr) {
    const count = parseInt(countStr) || 0;
    let html = '';
    const max = Math.min(count, 3);
    for (let i = 0; i < max; i++) {
        html += `<div class="user-avatar-sm"></div>`;
    }
    return html;
}

// --- Actions ---

function searchGroups() {
    const grid = document.getElementById('groups-grid');
    grid.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted">Buscando...</p>
        </div>
    `;
    loadGroups();
}

async function createGroup() {
    const name = document.getElementById('group-name').value;
    const subject = document.getElementById('group-subject').value;
    const topic = document.getElementById('group-topic').value;
    const desc = document.getElementById('group-desc').value;
    const isPrivate = document.getElementById('group-private').checked;

    if (!name) {
        alert('Por favor ingresa un nombre para el grupo');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/groups/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                subject,
                topic,
                description: desc,
                is_private: isPrivate
            })
        });

        const result = await response.json();

        if (result.success) {
            const modalEl = document.getElementById('createGroupModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            alert('¡Grupo creado con éxito!');
            document.getElementById('create-group-form').reset();
            searchGroups();
        } else {
            throw new Error(result.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error creating group:', error);
        alert('Error al crear el grupo: ' + error.message);
    }
}

async function joinGroup(id, isPrivate) {
    let joinCode = null;
    if (isPrivate) {
        joinCode = prompt("Este es un grupo privado. Ingresa el código de invitación:");
        if (!joinCode) return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/groups/join', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                groupId: id,
                joinCode
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('¡Te has unido al grupo!');
            searchGroups();
        } else {
            alert('No se pudo unir: ' + (result.error || 'Error desconocido'));
        }

    } catch (error) {
        console.error('Error joining group:', error);
        alert('Error de conexión.');
    }
}

// --- Mock Data Service (Fallback) ---
async function fetchMockGroups(subjectFilter, textSearch) {
    const allGroups = [
        { id: 1, name: 'Cálculo Diferencial - Dudas', subject: 'Matemáticas', description: 'Grupo para resolver ejercicios del capítulo 4 y prepararnos para el examen parcial.', member_count: 12, is_private: false },
        { id: 2, name: 'Revolución Mexicana Debate', subject: 'Historia', description: 'Debates semanales sobre personajes clave de la revolución.', member_count: 8, is_private: false },
        { id: 3, name: 'Hackathon Prep Team', subject: 'Programación', description: 'Equipo ALPHA para el torneo de código del próximo mes.', member_count: 4, is_private: true },
        { id: 4, name: 'Club de Lectura "Pedro Páramo"', subject: 'Literatura', description: 'Lectura conjunta y análisis de realismo mágico.', member_count: 15, is_private: false },
        { id: 5, name: 'Física Cuántica 101', subject: 'Ciencias', description: 'Para los que quieren entender más allá de lo básico.', member_count: 22, is_private: false },
    ];

    return allGroups.filter(g => {
        const matchesSubject = !subjectFilter || g.subject === subjectFilter;
        const matchesText = !textSearch || g.name.toLowerCase().includes(textSearch.toLowerCase());
        return matchesSubject && matchesText;
    });
}
