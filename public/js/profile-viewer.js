/**
 * Profile Viewer Logic - BGE Héroes de la Patria
 */
(function () {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    let targetUsername = urlParams.get('user');

    // Auth Token
    const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
    let currentUser = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = payload;
            if (!targetUsername) {
                targetUsername = payload.username || 'samuelci6377';
            }
        } catch (e) {}
    }

    if (!targetUsername) {
        targetUsername = 'samuelci6377';
    }

    async function init() {
        try {
            const profile = await fetchProfile(targetUsername);
            renderProfile(profile);

            // Check ownership for Edit button
            if (currentUser && (currentUser.username === profile.username || currentUser.id === profile.id)) {
                const btn = document.getElementById('btn-edit-profile');
                if (btn) {
                    btn.classList.remove('d-none');
                    btn.onclick = () => openEditModal(profile);
                }
            }

            // Load Achievements
            await loadAchievements(profile.id);

        } catch (error) {
            console.error('Error init profile:', error);
            const container = document.getElementById('profile-container');
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-5">
                        <h3 class="text-danger">Usuario no encontrado</h3>
                        <p class="text-muted">El perfil que buscas no existe o no está disponible.</p>
                        <a href="iacoins-dashboard.html" class="btn btn-primary mt-3">Volver al Inicio</a>
                    </div>
                `;
            }
        }
    }

    // Modal Logic
    let editModal;

    function openEditModal(profile) {
        const modalEl = document.getElementById('editProfileModal');
        if (!modalEl) return;
        if (!editModal && typeof bootstrap !== 'undefined') {
            editModal = new bootstrap.Modal(modalEl);
        }

        // Populate
        const bioEl = document.getElementById('edit-bio');
        if (bioEl) bioEl.value = profile.bio || '';
        const locEl = document.getElementById('edit-location');
        if (locEl) locEl.value = profile.location || '';

        const links = profile.social_links || {};
        const tw = document.getElementById('edit-twitter');
        if (tw) tw.value = links.twitter || '';
        const ig = document.getElementById('edit-instagram');
        if (ig) ig.value = links.instagram || '';
        const gh = document.getElementById('edit-github');
        if (gh) gh.value = links.github || '';

        if (editModal) editModal.show();
    }

    window.saveProfileChanges = async () => {
        const bio = document.getElementById('edit-bio')?.value || '';
        const location = document.getElementById('edit-location')?.value || '';
        const social_links = {
            twitter: document.getElementById('edit-twitter')?.value || '',
            instagram: document.getElementById('edit-instagram')?.value || '',
            github: document.getElementById('edit-github')?.value || ''
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
                if (editModal) editModal.hide();
                init();
            } else {
                alert('Error al guardar: ' + (json.error || 'Error desconocido'));
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
            username: username || (currentUser && (currentUser.username || currentUser.name)) || 'samuelci6377',
            full_name: (currentUser && (currentUser.full_name || currentUser.name)) || 'Samuel C. I.',
            bio: 'Administrador y Estudiante del Bachillerato General Estatal "Héroes de la Patria".',
            location: 'Puebla, México',
            role: (currentUser && currentUser.role) || 'Administrador',
            created_at: '2026-01-01',
            level: 5,
            level_title: 'Maestro Estratega',
            streak_days: 12,
            avatar_url: '/images/default-avatar.png',
            connections_count: 5,
            views_count: 42,
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

        const safeSet = (id, val) => {
            const el = clone.querySelector(`#${id}`) || document.getElementById(id);
            if (el && val !== undefined && val !== null) el.textContent = val;
        };

        // Text Data
        safeSet('p-fullname', data.full_name || data.username);
        safeSet('p-username', `@${data.username || 'usuario'}`);
        safeSet('p-location', data.location || 'Puebla, México');
        safeSet('p-bio', data.bio || 'Estudiante del Bachillerato General Estatal "Héroes de la Patria".');
        safeSet('p-role', data.role || 'Estudiante');
        safeSet('p-joined', data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Enero 2026');
        safeSet('p-level', data.level || 1);
        safeSet('p-level-title', data.level_title || 'Explorador');
        safeSet('p-streak', data.streak_days || data.streak || 0);
        safeSet('p-achievements-count', data.achievements_count || 0);
        safeSet('p-connections', data.connections_count || 0);
        safeSet('p-views', data.views_count || 1);

        // Avatar layers / image
        const avEl = clone.querySelector('#p-avatar');
        if (avEl && data.avatar_url) avEl.src = data.avatar_url;

        const baseLayer = clone.querySelector('#av-base');
        if (baseLayer) {
            const url = data.avatar_base_url || data.avatar_url || '/assets/avatars/default.webp';
            baseLayer.style.backgroundImage = `url(${url})`;
            baseLayer.style.backgroundSize = 'contain';
            baseLayer.style.backgroundRepeat = 'no-repeat';
            baseLayer.style.backgroundPosition = 'center';
        }

        // Social Links
        const socialList = clone.querySelector('#p-social-list');
        if (socialList) {
            socialList.innerHTML = '';
            if (data.social_links && typeof data.social_links === 'object') {
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

        grid.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(html) : html));
    }

    // Init
    document.addEventListener('DOMContentLoaded', init);

})();
