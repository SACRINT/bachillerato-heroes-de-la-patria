/**
 * 🧛 Avatar Shop Manager
 * Gestión de personalización y tienda de avatares
 */
(function () {
    'use strict';

    const CONFIG = {
        API_BASE: '/api/iaxcodigo/gamification-ext', // Ajustado a ruta correcta según router
        ASSET_BASE: '' // Rutas relativas en DB ya incluyen /assets/...
    };

    let state = {
        catalog: [],
        myAvatar: null,
        balance: 0,
        activeTab: 'all', // all, base, frame, background, accessory
        loading: false
    };

    const FALLBACK_ITEMS = [
        { id: 1, name: 'Estudiante Explorador', item_type: 'avatar_base', price_coins: 0, image_url: '/assets/avatars/default.webp', owned: true, is_equipped: true },
        { id: 2, name: 'Científico Loco', item_type: 'avatar_base', price_coins: 150, image_url: '/assets/avatars/scientist.webp', owned: false, is_equipped: false },
        { id: 3, name: 'Cibernauta', item_type: 'avatar_base', price_coins: 200, image_url: '/assets/avatars/cyber.webp', owned: false, is_equipped: false },
        { id: 4, name: 'Marco de Oro', item_type: 'frame', price_coins: 100, image_url: '/assets/avatars/frame-gold.webp', owned: false, is_equipped: false },
        { id: 5, name: 'Marco Neón', item_type: 'frame', price_coins: 120, image_url: '/assets/avatars/frame-neon.webp', owned: false, is_equipped: false },
        { id: 6, name: 'Fondo Galaxia', item_type: 'background', price_coins: 80, image_url: '/assets/avatars/bg-galaxy.webp', owned: false, is_equipped: false },
        { id: 7, name: 'Fondo Laboratorio', item_type: 'background', price_coins: 90, image_url: '/assets/avatars/bg-lab.webp', owned: false, is_equipped: false },
        { id: 8, name: 'Gafas VR', item_type: 'accessory', price_coins: 75, image_url: '/assets/avatars/acc-vr.webp', owned: false, is_equipped: false },
        { id: 9, name: 'Birrete de Graduación', item_type: 'accessory', price_coins: 110, image_url: '/assets/avatars/acc-cap.webp', owned: false, is_equipped: false }
    ];

    // Utils
    async function fetchAuth(endpoint, options = {}) {
        const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token') || 'demo_token';
        const url = `/api/gamification-ext${endpoint}`;

        try {
            const res = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                }
            });
            if (!res.ok) return { success: false, data: [] };
            return await res.json();
        } catch (e) {
            return { success: false, data: [] };
        }
    }

    async function init() {
        showLoading(true);
        try {
            await Promise.allSettled([
                loadCatalog(),
                loadMyAvatar(),
                loadBalance()
            ]);
            if (!state.catalog || state.catalog.length === 0) {
                state.catalog = FALLBACK_ITEMS;
            }
            render();
        } catch (err) {
            state.catalog = FALLBACK_ITEMS;
            render();
        } finally {
            showLoading(false);
        }

        setupEventListeners();
    }

    async function loadCatalog() {
        const res = await fetchAuth('/avatar/shop');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            state.catalog = res.data;
        } else {
            state.catalog = FALLBACK_ITEMS;
        }
    }

    async function loadMyAvatar() {
        const res = await fetchAuth('/avatar/my-avatar');
        if (res && res.success && res.data) {
            state.myAvatar = res.data;
            updatePreview(res.data);
        } else {
            updatePreview({ base_url: '/assets/avatars/default.webp' });
        }
    }

    async function loadBalance() {
        try {
            const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token') || '';
            const res = await fetch('/api/iacoins/balance', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).catch(() => ({ success: true, data: { balance: 250 } }));

            if (res && res.success && res.data) {
                state.balance = res.data.balance || 0;
                const balEl = document.getElementById('user-balance');
                if (balEl) balEl.textContent = state.balance;
            }
        } catch (e) {
            state.balance = 250;
            const balEl = document.getElementById('user-balance');
            if (balEl) balEl.textContent = '250';
        }
    }

    function setupEventListeners() {
        document.querySelectorAll('.shop-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI Toggle
                document.querySelectorAll('.shop-tab').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Filter logic
                state.activeTab = e.target.dataset.type;
                renderCatalog();
            });
        });
    }

    function render() {
        renderCatalog();
    }

    function renderCatalog() {
        const grid = document.getElementById('items-grid');
        if (!grid) return;
        grid.innerHTML = '';

        let items = Array.isArray(state.catalog) ? state.catalog : (state.catalog?.items || state.catalog?.data || []);
        if (state.activeTab !== 'all') {
            // Mapeo frontend tab -> db item_type
            const map = {
                'bases': 'avatar_base',
                'frames': 'frame',
                'bgs': 'background',
                'accessories': 'accessory'
            };
            const dbType = map[state.activeTab];
            items = items.filter(i => i.item_type === dbType);
        }

        items.forEach(item => {
            const card = document.createElement('div');

            // Check if equipped
            const isEquipped = checkIsEquipped(item);

            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="item-preview">
                    <img src="${item.image_url}" alt="${item.name}">
                </div>
                <div class="item-info">
                    <div class="item-name" title="${item.name}">${item.name}</div>
                    
                    ${item.owned
                    ? `<div class="item-owned-badge"><i class="fas fa-check"></i> En inventario</div>`
                    : `<div class="item-price"><i class="fas fa-coins"></i> ${item.price_coins > 0 ? item.price_coins : 'Gratis'}</div>`
                }
                    
                    <div class="action-btn-container">
                        ${getActionButtons(item, isEquipped)}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function checkIsEquipped(item) {
        if (!state.myAvatar) return false;
        if (item.item_type === 'avatar_base' && state.myAvatar.current_base_id === item.id) return true;
        if (item.item_type === 'frame' && state.myAvatar.current_frame_id === item.id) return true;
        if (item.item_type === 'background' && state.myAvatar.current_background_id === item.id) return true;
        return false;
    }

    function getActionButtons(item, isEquipped) {
        if (isEquipped) {
            return `<button class="btn-equip" disabled>Equipado</button>`;
        }

        if (item.owned) {
            return `<button class="btn-equip" onclick="window.AvatarManager.equip(${item.id})">Equipar</button>`;
        } else {
            const canAfford = state.balance >= item.price_coins;
            return `<button class="btn-buy" ${!canAfford ? 'disabled' : ''} onclick="window.AvatarManager.buy(${item.id})">
                ${canAfford ? 'Comprar' : 'Insuficiente'}
            </button>`;
        }
    }

    // Acciones Públicas
    window.AvatarManager = {
        buy: async (itemId) => {
            if (!confirm('¿Deseas comprar este item?')) return;
            showLoading(true);
            try {
                const res = await fetchAuth('/avatar/buy', {
                    method: 'POST',
                    body: JSON.stringify({ itemId })
                });

                if (res.success) {
                    alert('¡Compra exitosa!');
                    // Recargar todo para actualizar balance y ownership
                    await init();
                } else {
                    alert('Error: ' + res.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                showLoading(false);
            }
        },

        equip: async (itemId) => {
            showLoading(true);
            try {
                const res = await fetchAuth('/avatar/equip', {
                    method: 'POST',
                    body: JSON.stringify({ itemId })
                });

                if (res.success) {
                    await loadMyAvatar(); // Actualizar preview
                    renderCatalog(); // Actualizar botones (Equipado vs Equipar)
                }
            } catch (e) {
                console.error(e);
            } finally {
                showLoading(false);
            }
        }
    };

    function updatePreview(avatar) {
        // En un stage con capas
        const layerBg = document.querySelector('.avatar-layer.z-bg');
        const layerBase = document.querySelector('.avatar-layer.z-base');
        const layerFrame = document.querySelector('.avatar-layer.z-frame');

        // Defaults si null
        if (avatar.bg_url) layerBg.style.backgroundImage = `url('${avatar.bg_url}')`;
        else layerBg.style.backgroundImage = 'none'; // o default placeholder

        if (avatar.base_url) layerBase.style.backgroundImage = `url('${avatar.base_url}')`;

        if (avatar.frame_url) layerFrame.style.backgroundImage = `url('${avatar.frame_url}')`;
        else layerFrame.style.backgroundImage = 'none';

        // Animar cambio para efecto premium
        document.querySelector('.avatar-stage').animate([
            { transform: 'scale(0.95)', opacity: 0.8 },
            { transform: 'scale(1)', opacity: 1 }
        ], { duration: 300, easing: 'ease-out' });
    }

    function showLoading(show) {
        // Simple loading indicator logic
        const grid = document.getElementById('items-grid');
        if (show) grid.style.opacity = '0.5';
        else grid.style.opacity = '1';
    }

    // Auto init
    document.addEventListener('DOMContentLoaded', init);

})();
