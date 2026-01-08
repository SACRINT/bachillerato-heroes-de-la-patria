// Teams & Competitions Viewer
let myTeam = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCompetitions();
    loadLeaderboard();
    checkMyTeam();
});

// --- API Helpers ---

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`/api/competitions${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        const json = await res.json();
        return json;
    } catch (e) {
        console.error('API Error:', e);
        return { success: false, error: e.message };
    }
}

// --- Logic ---

async function checkMyTeam() {
    const res = await fetchAPI('/my-team');

    const heroActions = document.getElementById('hero-actions');
    const myTeamContainer = document.getElementById('my-team-container');

    if (res.success && res.data) {
        myTeam = res.data;
        // User has team
        heroActions.innerHTML = `
            <button class="btn btn-outline-light btn-lg px-5" onclick="document.getElementById('pills-myteam-tab').click()">
                <i class="fas fa-shield-alt me-2"></i> Ver Mi Equipo
            </button>
        `;
        renderMyTeam(myTeam);
    } else {
        // No team
        myTeamContainer.innerHTML = `
            <div class="text-center py-5">
                <img src="images/empty-team.svg" style="max-width: 200px; opacity: 0.5;" class="mb-3">
                <h4>No tienes equipo aún</h4>
                <p class="text-muted">Crea uno nuevo o únete a uno existente usando un código de invitación.</p>
                <button class="btn btn-primary mt-2" data-bs-toggle="modal" data-bs-target="#createTeamModal">
                    Crear Equipo
                </button>
            </div>
        `;
    }
}

async function loadCompetitions() {
    const res = await fetchAPI('/competitions');
    const container = document.getElementById('competitions-container');

    if (!res.success || !res.data || res.data.length === 0) {
        // Mock data fallback
        container.innerHTML = getMockCompetitions().map(renderCompCard).join('');
        return;
    }

    container.innerHTML = res.data.map(renderCompCard).join('');
}

async function loadLeaderboard() {
    const res = await fetchAPI('/leaderboard');
    const tbody = document.getElementById('leaderboard-body');

    if (!res.success || !res.data) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3">No hay datos disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = res.data.map((team, index) => `
        <tr>
            <td class="ps-4 fw-bold rank-${index + 1}">${index + 1}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${team.avatar_url || 'images/default-team.png'}" class="rounded-circle me-2" width="32" height="32">
                    <span class="fw-bold text-dark">${team.name}</span>
                </div>
            </td>
            <td class="text-center text-muted">${team.wins || 0}</td>
            <td class="text-end pe-4 fw-bold text-primary">${team.score || 0} pts</td>
        </tr>
    `).join('');
}

// --- Renderers ---

function renderCompCard(comp) {
    const date = new Date(comp.start_date || Date.now());
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'short' });

    return `
        <div class="comp-card">
            <div class="comp-date">
                <div class="comp-day">${day}</div>
                <div class="comp-month">${month}</div>
            </div>
            <div class="flex-grow-1">
                <h5 class="fw-bold mb-1">${comp.title}</h5>
                <p class="text-muted small mb-0">${comp.description || 'Sin descripción'}</p>
                <div class="mt-2 text-primary small">
                    <i class="fas fa-trophy me-1"></i> Premio: ${comp.prize_pool || 'Honor y Gloria'}
                </div>
            </div>
            <button class="btn btn-sm btn-outline-primary fw-bold" onclick="registerForComp(${comp.id})">
                Inscribirse
            </button>
        </div>
    `;
}

function renderMyTeam(team) {
    const container = document.getElementById('my-team-container');
    container.innerHTML = `
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="team-card">
                    <div class="team-header">
                        <div class="team-rank-badge">#5</div>
                        <img src="${team.avatar_url || 'images/default-team.png'}" class="team-avatar">
                        <h3 class="fw-bold mb-0 text-dark">${team.name}</h3>
                        <p class="text-muted fst-italic mb-0">"${team.motto || ''}"</p>
                    </div>
                    <div class="team-body">
                        <div class="team-stats">
                            <div><div class="stat-value">${team.wins || 0}</div><div class="stat-label">Victorias</div></div>
                            <div><div class="stat-value">${team.losses || 0}</div><div class="stat-label">Derrotas</div></div>
                            <div><div class="stat-value">${team.score || 0}</div><div class="stat-label">Puntos</div></div>
                        </div>
                        
                        <h6 class="fw-bold mt-4 mb-3 border-bottom pb-2">Miembros</h6>
                        <div class="list-group list-group-flush">
                            ${(team.members || []).map(m => `
                                <div class="list-group-item d-flex align-items-center px-0 border-0">
                                    <img src="${m.avatar_url || 'images/default-avatar.png'}" class="rounded-circle me-3" width="40" height="40">
                                    <div>
                                        <h6 class="mb-0 fw-bold">${m.nombre}</h6>
                                        <span class="badge bg-light text-dark border">${m.role}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// --- Actions ---

async function createTeam() {
    const name = document.getElementById('team-name').value;
    const motto = document.getElementById('team-motto').value;
    const avatar = document.getElementById('team-avatar').value;

    if (!name) return alert('Nombre requerido');

    const res = await fetchAPI('/teams', 'POST', { name, motto, avatar_url: avatar });

    if (res.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('createTeamModal'));
        modal.hide();
        checkMyTeam();
    } else {
        alert('Error: ' + res.error);
    }
}

async function registerForComp(compId) {
    if (!myTeam) return alert('Necesitas un equipo para inscribirte');
    alert('Función de inscripción en desarrollo (Backend listo, wiring pendiente)');
}

// --- Mocks ---

function getMockCompetitions() {
    return [
        { id: 1, title: 'Hackathon Matemático 2025', description: 'Resuelve problemas complejos en equipo.', start_date: '2025-11-15', prize_pool: '5000 IACoins' },
        { id: 2, title: 'Debate de Historia', description: 'Argumentación en vivo sobre la Revolución.', start_date: '2025-11-20', prize_pool: '3000 XP' }
    ];
}
