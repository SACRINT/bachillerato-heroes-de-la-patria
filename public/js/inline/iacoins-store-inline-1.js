const PACKAGES = [
            {
                id: 'starter',
                name: 'Paquete Novato',
                iacoins: 100,
                bonus_percentage: 0,
                price_usd: 2.99,
                price_mxn: 59,
                features: ['100 IA Coins inmediatas', 'Acceso a retos diarios', 'Desbloqueo de avatares básicos'],
                featured: false
            },
            {
                id: 'pro',
                name: 'Paquete Académico',
                iacoins: 500,
                bonus_percentage: 20,
                price_usd: 9.99,
                price_mxn: 199,
                features: ['600 IA Coins (+20% Gratis)', 'Acceso a todos los torneos', 'Insignia de Estudiante Destacado', 'Sin límites de pistas'],
                featured: true
            },
            {
                id: 'master',
                name: 'Paquete Maestro',
                iacoins: 1500,
                bonus_percentage: 40,
                price_usd: 24.99,
                price_mxn: 499,
                features: ['2,100 IA Coins (+40% Gratis)', 'Todos los avatares y marcos VIP', 'Acceso prioritario a laboratorios VR', 'Multiplicador de XP x2 permanente'],
                featured: false
            }
        ];

        const STORE_ITEMS = [
            {
                id: 1,
                name: 'Avatar Premium VIP',
                description: 'Personaliza tu perfil con avatares holográficos exclusivos',
                icon: '🎭',
                price_iacoins: 50,
                category: 'customization'
            },
            {
                id: 2,
                name: 'Tema Oscuro Cyber',
                description: 'Desbloquea el tema visual Neón Cyber para tu dashboard',
                icon: '🌙',
                price_iacoins: 30,
                category: 'customization'
            },
            {
                id: 3,
                name: 'Certificado Digital Verificado',
                description: 'Emite un certificado criptográfico con código QR de tus logros',
                icon: '📜',
                price_iacoins: 100,
                category: 'rewards'
            },
            {
                id: 4,
                name: 'Multiplicador de XP x2 (7 días)',
                description: 'Duplica toda la experiencia ganada en duelos y lecciones',
                icon: '⚡',
                price_iacoins: 80,
                category: 'boost'
            }
        ];

        let currentPackage = null;
        let selectedPaymentMethod = 'card';

        function getStoredToken() {
            return sessionStorage.getItem('bge_auth_token') ||
                   localStorage.getItem('bge_auth_token') ||
                   sessionStorage.getItem('authToken') ||
                   localStorage.getItem('authToken') || '';
        }

        // Cargar Saldo de Billetera
        async function loadWalletBalance() {
            let balance = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');

            const token = getStoredToken();
            if (token) {
                try {
                    const response = await fetch('/api/iacoins/balance', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data && data.data && typeof data.data.balance === 'number') {
                            balance = data.data.balance;
                            localStorage.setItem('bge_iacoins_balance', balance);
                        }
                    }
                } catch (e) {}
            }

            document.getElementById('currentBalance').textContent = balance.toFixed(2);
        }

        // Renderizar Paquetes
        function renderPackages() {
            const container = document.getElementById('packagesContainer');
            if (!container) return;
            container.innerHTML = '';

            PACKAGES.forEach(pkg => {
                const totalCoins = Math.floor(pkg.iacoins * (1 + pkg.bonus_percentage / 100));
                const card = document.createElement('div');
                card.className = pkg.featured ? 'package-card featured' : 'package-card';

                card.innerHTML = `
                    ${pkg.featured ? '<div class="package-badge">Más Popular</div>' : ''}
                    <div class="package-header">
                        <h3>${pkg.name}</h3>
                        <div class="package-iacoins"><i class="fas fa-coins text-warning"></i> ${totalCoins}</div>
                        <div class="package-price">$${pkg.price_usd.toFixed(2)} USD / $${pkg.price_mxn} MXN</div>
                        ${pkg.bonus_percentage > 0 ? `<div class="package-bonus">+${pkg.bonus_percentage}% BONUS</div>` : ''}
                    </div>
                    <ul class="package-features">
                        ${pkg.features.map(f => `<li><i class="fas fa-check-circle"></i> ${f}</li>`).join('')}
                    </ul>
                    <button class="${pkg.featured ? 'btn-purchase featured' : 'btn-purchase'}" data-action="open-purchase-modal" data-package-id="${pkg.id}">
                        <i class="fas fa-shopping-cart me-1"></i> Comprar Paquete
                    </button>
                `;
                container.appendChild(card);
            });
        }

        // Abrir Modal de Compra
        function openPurchaseModal(packageId) {
            const pkg = PACKAGES.find(p => p.id === packageId);
            if (!pkg) return;

            currentPackage = pkg;
            const totalCoins = Math.floor(pkg.iacoins * (1 + pkg.bonus_percentage / 100));

            document.getElementById('modalPackageName').textContent = pkg.name;
            document.getElementById('modalPackageCoins').innerHTML = `<i class="fas fa-coins text-warning me-1"></i> ${totalCoins} IA Coins`;
            document.getElementById('modalPackagePrice').textContent = `$${pkg.price_usd.toFixed(2)} USD / $${pkg.price_mxn} MXN`;
            document.getElementById('modalPackageBonus').innerHTML = pkg.bonus_percentage > 0
                ? `<span class="badge bg-success mb-2">+${pkg.bonus_percentage}% IACoins Gratis</span>`
                : '';

            const modal = new bootstrap.Modal(document.getElementById('purchaseModal'));
            modal.show();
        }

        // Renderizar Items de Tienda
        function renderStoreItems(items) {
            const container = document.getElementById('storeItemsContainer');
            if (!container) return;
            container.innerHTML = '';

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'item-card';

                card.innerHTML = `
                    <div>
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-name">${item.name}</div>
                        <div class="item-description">${item.description}</div>
                    </div>
                    <div>
                        <div class="item-price"><i class="fas fa-coins text-warning"></i> ${item.price_iacoins} IACoins</div>
                        <button class="btn-buy-item" data-action="buy-item" data-item-id="${item.id}" data-item-name="${item.name}" data-item-price="${item.price_iacoins}">
                            <i class="fas fa-shopping-bag me-1"></i> Comprar Item
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Comprar Item Especial
        async function buyItem(itemId, itemName, price) {
            let currentBal = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');

            if (currentBal < price) {
                alert(`Saldo insuficiente. Necesitas ${price} IACoins para adquirir "${itemName}".\nTu saldo actual es de ${currentBal.toFixed(2)} IACoins.`);
                return;
            }

            if (!confirm(`¿Deseas comprar "${itemName}" por ${price} IA Coins?`)) {
                return;
            }

            const token = getStoredToken();
            if (token) {
                try {
                    await fetch('/api/wallet/spend', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            amount: price,
                            description: 'Compra de tienda: ' + itemName,
                            metadata: { itemId, itemName }
                        })
                    });
                } catch (e) {
                    console.warn('[STORE] API spend error:', e);
                }
            }

            // Deduct local balance
            currentBal -= price;
            localStorage.setItem('bge_iacoins_balance', currentBal);

            // Record purchase
            const ownedItems = JSON.parse(localStorage.getItem('bge_store_purchases') || '[]');
            ownedItems.push({ id: itemId, name: itemName, date: new Date().toISOString() });
            localStorage.setItem('bge_store_purchases', JSON.stringify(ownedItems));

            alert(`🎉 ¡Compra exitosa!\n\nItem adquirido: ${itemName}\nNuevo Saldo: ${currentBal.toFixed(2)} IA Coins`);
            loadWalletBalance();
        }

        // Confirmar Compra de Paquete
        document.getElementById('btnConfirmPurchase').addEventListener('click', async function () {
            if (!currentPackage) return;

            const totalCoins = Math.floor(currentPackage.iacoins * (1 + currentPackage.bonus_percentage / 100));
            const token = getStoredToken();

            if (token) {
                try {
                    await fetch('/api/wallet/earn', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            amount: totalCoins,
                            description: `Recarga de paquete: ${currentPackage.name} (${selectedPaymentMethod.toUpperCase()})`,
                            metadata: { packageId: currentPackage.id, paymentMethod: selectedPaymentMethod }
                        })
                    });
                } catch (e) {
                    console.warn('[STORE] API recharge error:', e);
                }
            }

            // Award coins locally
            let currentBal = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');
            currentBal += totalCoins;
            localStorage.setItem('bge_iacoins_balance', currentBal);

            alert(`🎉 ¡Pago procesado con éxito via ${selectedPaymentMethod.toUpperCase()}!\n\nSe han acreditado +${totalCoins} IA Coins a tu cuenta.\nNuevo saldo: ${currentBal.toFixed(2)} IACoins`);

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('purchaseModal'));
            if (modalInstance) modalInstance.hide();

            loadWalletBalance();
        });

        // Selección de Método de Pago
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function () {
                document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
                this.classList.add('active');
                selectedPaymentMethod = this.dataset.method;
            });
        });

        // Event Delegation
        document.addEventListener('click', function (e) {
            const actionElement = e.target.closest('[data-action]');
            if (!actionElement) return;

            const action = actionElement.dataset.action;

            if (action === 'load-wallet-balance') {
                loadWalletBalance();
            } else if (action === 'open-purchase-modal') {
                const pkgId = actionElement.dataset.packageId;
                if (pkgId) openPurchaseModal(pkgId);
            } else if (action === 'buy-item') {
                const itemId = parseInt(actionElement.dataset.itemId);
                const itemName = actionElement.dataset.itemName;
                const itemPrice = parseInt(actionElement.dataset.itemPrice);
                if (itemId && itemName && itemPrice) {
                    buyItem(itemId, itemName, itemPrice);
                }
            }
        });

        // Inicialización
        document.addEventListener('DOMContentLoaded', function () {
            renderPackages();
            renderStoreItems(STORE_ITEMS);
            loadWalletBalance();
        });
