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

    // Utils
    async function fetchAuth(endpoint, options = {}) {
        const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
        if (!token) window.location.href = '/index.html';

        // Ajuste temporal de ruta si es necesario (el router monta en /api/gamification-ext no iaxcodigo/gamification...)
        // Verificando router: app.use('/api/gamification-ext', gamificationExtendedRouter);
        const url = `/api/gamification-ext${endpoint}`;

        const res = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
        return res.json();
    }

    async function init() {
        showLoading(true);
        try {
            await Promise.all([
                loadCatalog(),
                loadMyAvatar(),
                loadBalance()
            ]);
            render();
        } catch (err) {
            console.error('Error init avatar shop:', err);
            alert('Error cargando la tienda. Intenta recargar.');
        } finally {
            showLoading(false);
        }

        setupEventListeners();
    }

    async function loadCatalog() {
        const res = await fetchAuth('/avatar/shop');
        if (res.success) {
            state.catalog = res.data;
        }
    }

    async function loadMyAvatar() {
        const res = await fetchAuth('/avatar/my-avatar');
        if (res.success) {
            state.myAvatar = res.data;
            updatePreview(res.data);
        }
    }

    async function loadBalance() {
        // Reutilizamos endpoint de IACoins o traemos del user
        // Como no tenemos endpoint directo 'getSimpleBalance', usaremos el de /balance de iacoins
        // Ojo: ruta /api/iacoins/balance
        const token = sessionStorage.getItem('bge_auth_token') || localStorage.getItem('bge_auth_token');
        const res = await fetch('/api/iacoins/balance', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        if (res.success) {
            state.balance = res.data.balance;
            document.getElementById('user-balance').textContent = state.balance;
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
        grid.innerHTML = '';

        let items = state.catalog;
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
