/**
 * 🧛 Avatar Shop Manager
 * Gestión de personalización y tienda de avatares
 */
(function () {
    'use strict';

    const CONFIG = {
        API_BASE: '/api/gamification-ext',
        ASSET_BASE: ''
    };

    let state = {
        catalog: [],
        myAvatar: null,
        balance: 250,
        activeTab: 'all',
        loading: false
    };

    const FALLBACK_ITEMS = [
        { id: 1, name: 'Estudiante Explorador', item_type: 'avatar_base', price_coins: 0, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="%234f46e5"/><circle cx="60" cy="45" r="20" fill="%23fcd34d"/><path d="M30 95 C30 75, 90 75, 90 95 Z" fill="%231e1b4b"/><text x="60" y="52" text-anchor="middle" font-size="20">🎒</text></svg>', owned: true, is_equipped: true },
        { id: 2, name: 'Científico BGE', item_type: 'avatar_base', price_coins: 150, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="%23059669"/><circle cx="60" cy="45" r="20" fill="%23fcd34d"/><path d="M30 95 C30 75, 90 75, 90 95 Z" fill="%23064e3b"/><text x="60" y="52" text-anchor="middle" font-size="20">🔬</text></svg>', owned: false, is_equipped: false },
        { id: 3, name: 'Cibernauta Élite', item_type: 'avatar_base', price_coins: 200, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="%237c3aed"/><circle cx="60" cy="45" r="20" fill="%23fcd34d"/><path d="M30 95 C30 75, 90 75, 90 95 Z" fill="%232e1065"/><text x="60" y="52" text-anchor="middle" font-size="20">⚡</text></svg>', owned: false, is_equipped: false },
        { id: 4, name: 'Marco de Oro Real', item_type: 'frame', price_coins: 100, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="%23fbbf24" stroke-width="8"/><circle cx="60" cy="60" r="46" fill="none" stroke="%23f59e0b" stroke-width="2"/></svg>', owned: false, is_equipped: false },
        { id: 5, name: 'Marco Neón Cyber', item_type: 'frame', price_coins: 120, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="%2338bdf8" stroke-width="8" stroke-dasharray="15,5"/></svg>', owned: false, is_equipped: false },
        { id: 6, name: 'Fondo Galaxia BGE', item_type: 'background', price_coins: 80, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><radialGradient id="g"><stop offset="0%25" stop-color="%23818cf8"/><stop offset="100%25" stop-color="%230f172a"/></radialGradient></defs><rect width="120" height="120" rx="20" fill="url(%23g)"/><circle cx="30" cy="30" r="2" fill="white"/><circle cx="90" cy="80" r="3" fill="%23fbbf24"/></svg>', owned: false, is_equipped: false },
        { id: 7, name: 'Fondo Campus Virtual', item_type: 'background', price_coins: 90, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0%25" stop-color="%230284c7"/><stop offset="100%25" stop-color="%230f766e"/></linearGradient></defs><rect width="120" height="120" rx="20" fill="url(%23c)"/><rect x="20" y="70" width="80" height="30" fill="%23ffffff" opacity="0.2"/></svg>', owned: false, is_equipped: false },
        { id: 8, name: 'Gafas VR Héroes', item_type: 'accessory', price_coins: 75, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect x="30" y="45" width="60" height="25" rx="10" fill="%231e293b" stroke="%236366f1" stroke-width="4"/><circle cx="45" cy="57" r="6" fill="%2338bdf8"/><circle cx="75" cy="57" r="6" fill="%2338bdf8"/></svg>', owned: false, is_equipped: false },
        { id: 9, name: 'Birrete de Excelencia', item_type: 'accessory', price_coins: 110, image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><polygon points="60,25 100,45 60,65 20,45" fill="%231e1b4b"/><rect x="45" y="55" width="30" height="15" rx="3" fill="%23312e81"/><line x1="90" y1="45" x2="90" y2="70" stroke="%23fbbf24" stroke-width="3"/></svg>', owned: false, is_equipped: false }
    ];

    function getStoredToken() {
        return sessionStorage.getItem('bge_auth_token') ||
               localStorage.getItem('bge_auth_token') ||
               sessionStorage.getItem('authToken') ||
               localStorage.getItem('authToken') || '';
    }

    async function fetchAuth(endpoint, options = {}) {
        const token = getStoredToken();
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
            if (!res.ok) return { success: false };
            return await res.json();
        } catch (e) {
            return { success: false };
        }
    }

    async function init() {
        showLoading(true);
        try {
            loadLocalInventory();
            await Promise.allSettled([
                loadCatalog(),
                loadMyAvatar(),
                loadBalance()
            ]);
            render();
        } catch (err) {
            render();
        } finally {
            showLoading(false);
        }

        setupEventListeners();
    }

    function loadLocalInventory() {
        const storedInventory = localStorage.getItem('bge_avatar_inventory');
        if (storedInventory) {
            try {
                const ownedIds = JSON.parse(storedInventory);
                FALLBACK_ITEMS.forEach(item => {
                    if (ownedIds.includes(item.id)) {
                        item.owned = true;
                    }
                });
            } catch (e) {}
        }

        const storedEquipped = localStorage.getItem('bge_equipped_avatar');
        if (storedEquipped) {
            try {
                state.myAvatar = JSON.parse(storedEquipped);
            } catch (e) {}
        } else {
            state.myAvatar = {
                current_base_id: 1,
                base_url: FALLBACK_ITEMS[0].image_url,
                bg_url: null,
                frame_url: null,
                accessory_url: null
            };
        }
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
        }
        updatePreview(state.myAvatar);
    }

    async function loadBalance() {
        const localBal = localStorage.getItem('bge_iacoins_balance');
        if (localBal) {
            state.balance = parseFloat(localBal);
        } else {
            state.balance = 250;
            localStorage.setItem('bge_iacoins_balance', '250');
        }

        const token = getStoredToken();
        if (token) {
            try {
                const res = await fetch('/api/iacoins/balance', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.data && typeof data.data.balance === 'number') {
                        state.balance = data.data.balance;
                        localStorage.setItem('bge_iacoins_balance', state.balance);
                    }
                }
            } catch (e) {}
        }

        const balEl = document.getElementById('user-balance');
        if (balEl) balEl.textContent = state.balance;
    }

    function setupEventListeners() {
        document.querySelectorAll('.shop-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.shop-tab').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                e.target.classList.add('active');
                e.target.setAttribute('aria-selected', 'true');

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

        let items = Array.isArray(state.catalog) ? state.catalog : FALLBACK_ITEMS;
        if (state.activeTab !== 'all') {
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
            const isEquipped = checkIsEquipped(item);

            card.className = `shop-item-card ${isEquipped ? 'equipped' : ''}`;
            card.innerHTML = `
                <div class="item-preview">
                    <img src="${item.image_url}" alt="${item.name}" style="width:80px;height:80px;object-fit:contain;">
                </div>
                <div class="item-info">
                    <div class="item-name" title="${item.name}">${item.name}</div>
                    
                    ${item.owned
                    ? `<div class="item-owned-badge"><i class="fas fa-check"></i> En inventario</div>`
                    : `<div class="item-price"><i class="fas fa-coins text-warning"></i> ${item.price_coins > 0 ? item.price_coins + ' IACoins' : 'Gratis'}</div>`
                }
                    
                    <div class="action-btn-container mt-2">
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
        if (item.item_type === 'accessory' && state.myAvatar.current_accessory_id === item.id) return true;
        return false;
    }

    function getActionButtons(item, isEquipped) {
        if (isEquipped) {
            return `<button class="btn btn-sm btn-outline-success w-100" disabled><i class="fas fa-check-circle me-1"></i> Equipado</button>`;
        }

        if (item.owned) {
            return `<button class="btn btn-sm btn-primary w-100" onclick="window.AvatarManager.equip(${item.id})"><i class="fas fa-tshirt me-1"></i> Equipar</button>`;
        } else {
            const canAfford = state.balance >= item.price_coins;
            return `<button class="btn btn-sm ${canAfford ? 'btn-warning' : 'btn-secondary'} w-100" ${!canAfford ? 'disabled' : ''} onclick="window.AvatarManager.buy(${item.id})">
                ${canAfford ? '<i class="fas fa-shopping-bag me-1"></i> Comprar' : '<i class="fas fa-lock me-1"></i> Saldo Insuficiente'}
            </button>`;
        }
    }

    // Acciones Públicas
    window.AvatarManager = {
        buy: async (itemId) => {
            const item = state.catalog.find(i => i.id === itemId) || FALLBACK_ITEMS.find(i => i.id === itemId);
            if (!item) return;

            if (state.balance < item.price_coins) {
                alert('No tienes suficientes IACoins para comprar este artículo.');
                return;
            }

            if (!confirm(`¿Deseas comprar "${item.name}" por ${item.price_coins} IACoins?`)) return;

            showLoading(true);
            try {
                // Try backend
                const res = await fetchAuth('/avatar/buy', {
                    method: 'POST',
                    body: JSON.stringify({ itemId })
                });

                // Deduct balance locally
                state.balance -= item.price_coins;
                localStorage.setItem('bge_iacoins_balance', state.balance);

                // Add to local inventory
                item.owned = true;
                const owned = JSON.parse(localStorage.getItem('bge_avatar_inventory') || '[1]');
                if (!owned.includes(itemId)) owned.push(itemId);
                localStorage.setItem('bge_avatar_inventory', JSON.stringify(owned));

                alert(`🎉 ¡Compra exitosa!

Has adquirido: ${item.name}
Nuevo saldo: ${state.balance} IACoins`);

                const balEl = document.getElementById('user-balance');
                if (balEl) balEl.textContent = state.balance;

                renderCatalog();
            } catch (e) {
                console.error(e);
            } finally {
                showLoading(false);
            }
        },

        equip: async (itemId) => {
            const item = state.catalog.find(i => i.id === itemId) || FALLBACK_ITEMS.find(i => i.id === itemId);
            if (!item) return;

            showLoading(true);
            try {
                // Try backend
                await fetchAuth('/avatar/equip', {
                    method: 'POST',
                    body: JSON.stringify({ itemId })
                });

                // Update local state
                if (!state.myAvatar) state.myAvatar = {};

                if (item.item_type === 'avatar_base') {
                    state.myAvatar.current_base_id = item.id;
                    state.myAvatar.base_url = item.image_url;
                } else if (item.item_type === 'frame') {
                    state.myAvatar.current_frame_id = item.id;
                    state.myAvatar.frame_url = item.image_url;
                } else if (item.item_type === 'background') {
                    state.myAvatar.current_background_id = item.id;
                    state.myAvatar.bg_url = item.image_url;
                } else if (item.item_type === 'accessory') {
                    state.myAvatar.current_accessory_id = item.id;
                    state.myAvatar.accessory_url = item.image_url;
                }

                localStorage.setItem('bge_equipped_avatar', JSON.stringify(state.myAvatar));

                updatePreview(state.myAvatar);
                renderCatalog();
            } catch (e) {
                console.error(e);
            } finally {
                showLoading(false);
            }
        }
    };

    function updatePreview(avatar) {
        if (!avatar) return;

        const layerBg = document.querySelector('.avatar-layer.z-bg');
        const layerBase = document.querySelector('.avatar-layer.z-base');
        const layerFrame = document.querySelector('.avatar-layer.z-frame');
        const layerAcc = document.querySelector('.avatar-layer.z-accessory');

        if (layerBg) {
            if (avatar.bg_url) layerBg.style.backgroundImage = `url('${avatar.bg_url}')`;
            else layerBg.style.backgroundImage = 'none';
        }

        if (layerBase) {
            if (avatar.base_url) layerBase.style.backgroundImage = `url('${avatar.base_url}')`;
        }

        if (layerFrame) {
            if (avatar.frame_url) layerFrame.style.backgroundImage = `url('${avatar.frame_url}')`;
            else layerFrame.style.backgroundImage = 'none';
        }

        if (layerAcc) {
            if (avatar.accessory_url) layerAcc.style.backgroundImage = `url('${avatar.accessory_url}')`;
            else layerAcc.style.backgroundImage = 'none';
        }

        const stage = document.querySelector('.avatar-stage');
        if (stage && typeof stage.animate === 'function') {
            stage.animate([
                { transform: 'scale(0.95)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ], { duration: 250, easing: 'ease-out' });
        }
    }

    function showLoading(show) {
        const grid = document.getElementById('items-grid');
        if (grid) {
            grid.style.opacity = show ? '0.5' : '1';
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
