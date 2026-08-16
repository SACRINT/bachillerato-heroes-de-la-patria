/**
 * Profile Viewer Logic
 */
(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    // Si no hay user param, intentamos obtener del token (mi perfil)
    let targetUsername = urlParams.get('user');

    // Auth Token
    const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
    let currentUser = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = payload;
            if (!targetUsername) {
                targetUsername = payload.username; // Default to me
            }
        } catch (e) {
            console.error('Invalid token');
        }
    }

    if (!targetUsername) {
        // Redirect login or show error
        window.location.href = 'index.html';
        return;
    }

    async function init() {
        try {
            const profile = await fetchProfile(targetUsername);
            renderProfile(profile);

            // Check ownership for Edit button
            if (currentUser && (currentUser.username === profile.username || currentUser.id === profile.id)) {
                const btn = document.getElementById('btn-edit-profile');
                btn.classList.remove('d-none');
                btn.onclick = () => openEditModal(profile);
            }

            // Load Achievements
            await loadAchievements(profile.id);

        } catch (error) {
            console.error(error);
            document.getElementById('profile-container').innerHTML = `
                <div class="text-center py-5">
                    <h3 class="text-danger">Usuario no encontrado</h3>
                    <p class="text-muted">El perfil que buscas no existe o no está disponible.</p>
                    <a href="iacoins-dashboard.html" class="btn btn-primary mt-3">Volver al Inicio</a>
                </div>
            `;
        }
    }

    // Modal Logic
    let editModal;

    function openEditModal(profile) {
        if (!editModal) {
            editModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
        }

        // Populate
        document.getElementById('edit-bio').value = profile.bio || '';
        document.getElementById('edit-location').value = profile.location || '';

        const links = profile.social_links || {};
        document.getElementById('edit-twitter').value = links.twitter || '';
        document.getElementById('edit-instagram').value = links.instagram || '';
        document.getElementById('edit-github').value = links.github || '';

        editModal.show();
    }

    window.saveProfileChanges = async () => {
        const bio = document.getElementById('edit-bio').value;
        const location = document.getElementById('edit-location').value;
        const social_links = {
            twitter: document.getElementById('edit-twitter').value,
            instagram: document.getElementById('edit-instagram').value,
            github: document.getElementById('edit-github').value
        };

        try {
            const res = await fetch('/api/gamification-ext/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bio, location, social_links })
            });

            const json = await res.json();
            if (json.success) {
                // Close modal
                editModal.hide();
                // Reload profile
                init();
            } else {
                alert('Error al guardar: ' + json.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    async function fetchProfile(username) {
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/gamification-ext/profile/public/${username}`, { headers });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) return json.data;
            }
        } catch (e) {}

        return {
            id: (currentUser && currentUser.id) || 1,
            username: username || (currentUser && (currentUser.username || currentUser.name)) || 'Samuel',
            full_name: (currentUser && (currentUser.full_name || currentUser.name)) || 'Samuel C.',
            bio: 'Estudiante del Bachillerato General Estatal "Héroes de la Patria".',
            location: 'Puebla, México',
            avatar_url: '/images/default-avatar.png',
            connections_count: 0,
            views_count: 1,
            social_links: {}
        };
    }

    async function loadAchievements(userId) {
        try {
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/gamification-ext/achievements/user/${userId || 1}`, { headers });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) {
                    renderAchievements(json.data.earned, json.data.totalEarned);
                    return;
                }
            }
        } catch (e) {}
        renderAchievements([], 0);
    }

    function renderProfile(data) {
        const container = document.getElementById('profile-container');
        const template = document.getElementById('profile-template');
        if (!container || !template) return;
        const clone = template.content.cloneNode(true);

        // Text Data
        clone.getElementById('p-fullname').textContent = data.full_name || data.username;
        clone.getElementById('p-username').textContent = `@${data.username}`;
        clone.getElementById('p-location').textContent = data.location || 'Ubicación no configurada';
        clone.getElementById('p-bio').textContent = data.bio || 'Sin biografía.';
        clone.getElementById('p-connections').textContent = data.connections_count || 0;
        clone.getElementById('p-views').textContent = data.views_count || 0;

        // Avatar
        if (data.avatar_url) {
            clone.getElementById('p-avatar').src = data.avatar_url;
        }

        // Social Links
        const socialList = clone.getElementById('p-social-list');
        socialList.innerHTML = '';
        if (data.social_links) {
            let hasLinks = false;
            for (const [network, url] of Object.entries(data.social_links)) {
                if (!url) continue;
                hasLinks = true;
                const li = document.createElement('li');
                li.innerHTML = `<a href="${url}" target="_blank" class="text-decoration-none text-info"><i class="fab fa-${network} me-2"></i> ${network}</a>`;
                socialList.appendChild(li);
            }
            if (!hasLinks) socialList.innerHTML = '<li class="text-muted small">No hay redes conectadas.</li>';
        }

        container.innerHTML = '';
        container.appendChild(clone);
    }

    function renderAchievements(earnedList = [], totalCount = 0) {
        const countEl = document.getElementById('p-achievements-count');
        if (countEl) countEl.textContent = totalCount || 0;

        const grid = document.getElementById('achievement-grid');
        if (!grid) return;

        const list = Array.isArray(earnedList) ? earnedList : [];

        if (list.length === 0) {
            grid.innerHTML = '<p class="text-muted small col-12">Aún no hay logros desbloqueados.</p>';
            return;
        }

        const html = list.map(a => `
            <div class="mini-achievement unlocked ${a.rarity || 'common'}" title="${a.name || 'Logro'}: ${a.description || ''}">
                <i class="fas ${a.icon_icon || a.icon || 'fa-trophy'}"></i>
            </div>
        `).join('');

        grid.innerHTML = html;
    }

    // Init
    document.addEventListener('DOMContentLoaded', init);

})();
