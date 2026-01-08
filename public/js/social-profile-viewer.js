// Social Profile Viewer logic
let currentProfile = null;
const isOwnProfile = true; // Logic to detect if viewing own profile needed

document.addEventListener('DOMContentLoaded', () => {
    loadProfile('me'); // Default to 'me' or parse URL param
});

async function loadProfile(userId) {
    try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const res = await fetch(`/api/profiles/${userId}`, { headers });
        if (!res.ok) throw new Error('Error de API');

        const json = await res.json();
        currentProfile = json.data;

        renderProfile(currentProfile);
    } catch (e) {
        console.warn('API Error, loading mock:', e);
        loadMockProfile();
    }
}

function renderProfile(p) {
    document.getElementById('profile-name').textContent = p.nombre || 'Usuario';
    document.getElementById('profile-avatar').src = p.avatar_url || 'images/default-avatar.png';
    document.getElementById('profile-location').innerHTML = `<i class="fas fa-map-marker-alt me-1"></i> ${p.location || 'Ubicación desconocida'}`;

    document.getElementById('stat-friends').textContent = p.friends_count || 0;
    document.getElementById('stat-views').textContent = p.views_count || 0;

    document.getElementById('profile-bio').textContent = p.bio || 'Sin biografía.';

    // Skills
    const skillsContainer = document.getElementById('skills-container');
    const skills = p.skills || [];
    if (skills.length > 0) {
        skillsContainer.innerHTML = skills.map(s => `<span class="skill-badge">${s}</span>`).join('');
    } else {
        skillsContainer.innerHTML = '<span class="text-muted small">No hay habilidades listadas.</span>';
    }

    // Actions (Edit if owner)
    // NOTE: In a real app we check `p.user_id === myUserId`
    const actions = document.getElementById('banner-actions');
    const btnAddPort = document.getElementById('btn-add-portfolio');

    if (isOwnProfile) {
        actions.innerHTML = `
            <button class="btn btn-light shadow-sm fw-bold" data-bs-toggle="modal" data-bs-target="#editProfileModal">
                <i class="fas fa-pencil-alt me-2"></i> Editar Perfil
            </button>
        `;
        btnAddPort.classList.remove('d-none');

        // Populate edit form
        document.getElementById('edit-bio').value = p.bio || '';
        document.getElementById('edit-location').value = p.location || '';
        document.getElementById('edit-skills').value = (p.skills || []).join(', ');
    } else {
        actions.innerHTML = `
            <button class="btn btn-light shadow-sm fw-bold">
                <i class="fas fa-user-plus me-2"></i> Conectar
            </button>
        `;
    }

    // Portfolio
    const portGrid = document.getElementById('portfolio-grid');
    if (p.portfolio && p.portfolio.length > 0) {
        portGrid.innerHTML = p.portfolio.map(proj => `
            <div class="portfolio-item">
                <img src="${proj.image_url || 'images/project-placeholder.jpg'}" class="portfolio-img" alt="${proj.title}">
                <div class="portfolio-body">
                    <h5 class="portfolio-title text-truncate">${proj.title}</h5>
                    <p class="text-muted small mb-0 text-truncate">${proj.description || ''}</p>
                </div>
            </div>
        `).join('');
    } else {
        portGrid.innerHTML = '<div class="col-12 text-center py-5 bg-white rounded border"><p class="text-muted mb-0">No hay proyectos publicados aún.</p></div>';
    }
}

async function saveProfile() {
    const bio = document.getElementById('edit-bio').value;
    const location = document.getElementById('edit-location').value;
    const skillsStr = document.getElementById('edit-skills').value;
    const skills = skillsStr.split(',').map(s => s.trim()).filter(s => s);

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profiles/me', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ bio, location, skills })
        });

        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
            loadProfile('me');
        } else {
            alert('Error guardando perfil');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

async function saveProject() {
    const title = document.getElementById('port-title').value;
    const description = document.getElementById('port-desc').value;
    const image_url = document.getElementById('port-img').value;

    if (!title) return alert('El título es obligatorio');

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/profiles/portfolio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description, image_url })
        });

        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('portfolioModal'));
            modal.hide();
            loadProfile('me');
            document.getElementById('portfolio-form').reset();
        } else {
            alert('Error guardando proyecto');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
}

function loadMockProfile() {
    const mock = {
        nombre: 'Estudiante Demo',
        bio: 'Apasionado por la tecnología y la física cuántica.',
        location: 'Ciudad de México',
        friends_count: 42,
        views_count: 128,
        skills: ['Matemáticas', 'Liderazgo', 'Oratoria'],
        portfolio: [
            { title: 'Feria de Ciencias 2024', description: 'Modelo de volcán activo con bicarbonato.', image_url: 'https://via.placeholder.com/300x160' },
            { title: 'Ensayo de Historia', description: 'La Revolución Mexicana y sus consecuencias.', image_url: '' }
        ]
    };
    renderProfile(mock);
}
