// Mentorship Viewer Logic

document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    // Check status: 'none', 'mentee', 'mentor'
    const status = await checkUserStatus();

    if (status.hasActiveMentorships) {
        showDashboard(status.data);
    } else {
        showLanding();
    }
}

// --- API ---

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`/api/mentorship${endpoint}`, {
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

async function checkUserStatus() {
    const res = await fetchAPI('/my-mentorships');
    if (res.success) {
        const { asMentee, asMentor } = res.data;
        // Simple logic: if any non-rejected, show dashboard
        const active = [...asMentee, ...asMentor].filter(m => m.status !== 'rejected');
        return { hasActiveMentorships: active.length > 0, data: { asMentee, asMentor } };
    }
    return { hasActiveMentorships: false };
}

// --- Views Navigation ---

function showLanding() {
    document.getElementById('landing-view').classList.remove('d-none');
    document.getElementById('dashboard-view').classList.add('d-none');
    document.getElementById('finder-view').classList.add('d-none');
}

function showDashboard(data) {
    document.getElementById('landing-view').classList.add('d-none');
    document.getElementById('dashboard-view').classList.remove('d-none');
    document.getElementById('finder-view').classList.add('d-none');

    renderDashboard(data);
}

function showFindMentors() {
    document.getElementById('landing-view').classList.add('d-none');
    document.getElementById('finder-view').classList.remove('d-none');
    loadMentors();
}

// --- Dashboard Logic ---

function renderDashboard({ asMentee, asMentor }) {
    const container = document.getElementById('active-mentorships-container');
    const all = [...asMentee, ...asMentor];

    if (all.length === 0) {
        container.innerHTML = '<p class="text-muted">No tienes mentorías activas.</p>';
        return;
    }

    container.innerHTML = all.map(m => `
        <div class="d-flex align-items-center border-bottom pb-3 mb-3">
            <img src="${m.other_avatar || 'images/default-avatar.png'}" class="rounded-circle me-3" width="50" height="50">
            <div class="flex-grow-1">
                <h6 class="mb-0 fw-bold">${m.other_name}</h6>
                <span class="badge bg-${getStatusColor(m.status)}">${getStatusLabel(m.status)}</span>
                <p class="small text-muted mb-0 mt-1">Objetivos: ${m.goals || 'Sin definir'}</p>
            </div>
            ${m.status === 'active' ? `<button class="btn btn-sm btn-outline-primary" onclick="alert('Agendar sesión próximamente')"><i class="far fa-calendar-alt"></i></button>` : ''}
        </div>
    `).join('');
}

function getStatusColor(s) {
    if (s === 'active') return 'success';
    if (s === 'pending') return 'warning';
    return 'secondary';
}

function getStatusLabel(s) {
    if (s === 'active') return 'Activo';
    if (s === 'pending') return 'Pendiente';
    return s;
}

// --- Finder Logic ---

async function loadMentors() {
    const specialty = document.getElementById('filter-specialty').value;
    const res = await fetchAPI(`/mentors?specialty=${specialty}`);

    const grid = document.getElementById('mentors-grid');

    if (!res.success || !res.data || res.data.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5 text-muted">No se encontraron mentores disponibles.</div>';
        return;
    }

    grid.innerHTML = res.data.map(m => `
        <div class="col-md-6 col-lg-4">
            <div class="mentor-card">
                <div class="mentor-header">
                    <img src="${m.avatar_url || 'images/default-avatar.png'}" class="mentor-avatar">
                    <h5 class="fw-bold mb-0">${m.nombre}</h5>
                    <p class="text-muted small mb-0">${m.years_experience} años exp.</p>
                </div>
                <div class="mentor-body">
                    <div class="mentor-tags">
                        ${(m.specialties || []).map(s => `<span class="mentor-tag">${s}</span>`).join('')}
                    </div>
                    <p class="small text-muted line-clamp-3">${m.bio || 'Sin biografía'}</p>
                </div>
                <div class="mentor-footer">
                    <button class="btn btn-primary w-100" onclick="requestMentorship(${m.user_id})">Solicitar Mentoría</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function requestMentorship(mentorId) {
    const goals = prompt('Describe brevemente tus objetivos para esta mentoría:');
    if (!goals) return;

    const res = await fetchAPI('/request', 'POST', { mentorId, goals });
    if (res.success) {
        alert('Solicitud enviada exitosamente.');
        window.location.reload(); // Reload to go to dashboard
    } else {
        alert('Error: ' + res.error);
    }
}

// --- Application Logic ---

async function submitApplication() {
    const specialties = document.getElementById('app-specialties').value.split(',').map(s => s.trim());
    const bio = document.getElementById('app-bio').value;
    const exp = parseInt(document.getElementById('app-experience').value);

    const res = await fetchAPI('/apply', 'POST', { specialties, bio, years_experience: exp });

    if (res.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('applyMentorModal'));
        modal.hide();
        alert('Aplicación enviada. Un administrador la revisará pronto.');
    } else {
        alert('Error: ' + res.error);
    }
}
