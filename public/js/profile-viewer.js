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
        // Si hay token enviamos auth headers (para ver info privada si somos amigos/admin etc - futuro)
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/gamification-ext/profile/public/${username}`, { headers });
        const json = await res.json();

        if (!json.success) throw new Error(json.error);
        return json.data;
    }

    async function loadAchievements(userId) {
        // Reusing existing endpoint
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/gamification-ext/achievements/user/${userId}`, { headers });
        const json = await res.json();

        if (json.success) {
            renderAchievements(json.data.earned, json.data.totalEarned);
        }
    }

    function renderProfile(data) {
        const container = document.getElementById('profile-container');
        const template = document.getElementById('profile-template');
        const clone = template.content.cloneNode(true);

        // Text Data
        clone.getElementById('p-username').textContent = data.username; // Or displayName if exists
        clone.getElementById('p-bio').textContent = data.bio || 'Sin estado.';
        clone.getElementById('p-full-bio').textContent = data.bio || 'Este usuario no ha escrito nada sobre sí mismo aún.';
        clone.getElementById('p-role').textContent = data.tipo_usuario || 'Usuario';
        clone.getElementById('p-joined').textContent = new Date(data.joined_at).toLocaleDateString();

        if (data.location) {
            clone.getElementById('p-location').textContent = data.location;
        } else {
            clone.getElementById('p-location-container').style.display = 'none';
        }

        clone.getElementById('p-level').textContent = data.level;
        clone.getElementById('p-level-title').textContent = data.level_title;
        clone.getElementById('p-streak').textContent = data.streak;

        // Avatar Rendering
        const avBg = clone.getElementById('av-bg');
        const avBase = clone.getElementById('av-base');
        const avFrame = clone.getElementById('av-frame');
        const avAcc = clone.getElementById('av-acc');

        if (data.avatar_bg) avBg.style.backgroundImage = `url('${data.avatar_bg}')`;
        if (data.avatar_base) avBase.style.backgroundImage = `url('${data.avatar_base}')`;
        if (data.avatar_frame) avFrame.style.backgroundImage = `url('${data.avatar_frame}')`;
        if (data.avatar_acc) avAcc.style.backgroundImage = `url('${data.avatar_acc}')`;
        // Fallback or default styling if needed

        // Social Links
        const socialList = clone.getElementById('social-links-list');
        if (data.social_links) {
            const links = data.social_links; // JSON object
            let hasLinks = false;
            for (const [network, url] of Object.entries(links)) {
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

    function renderAchievements(earnedList, totalCount) {
        document.getElementById('p-achievements-count').textContent = totalCount;

        const grid = document.getElementById('achievement-grid');
        if (!grid) return;

        // Show top 10? or all? Let's show all earned
        if (earnedList.length === 0) {
            grid.innerHTML = '<p class="text-muted small col-12">Aún no hay logros desbloqueados.</p>';
            return;
        }

        const html = earnedList.map(a => `
            <div class="mini-achievement unlocked ${a.rarity || 'common'}" title="${a.name}: ${a.description}">
                <i class="fas ${a.icon_icon || 'fa-trophy'}"></i>
            </div>
        `).join('');

        grid.innerHTML = html;
    }

    // Init
    document.addEventListener('DOMContentLoaded', init);

})();
