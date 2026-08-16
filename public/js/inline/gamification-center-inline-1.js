// Wait for auth to load
        document.addEventListener('DOMContentLoaded', async function () {
            // Load wallet data
            await loadWalletData();
            // Load challenges
            await loadChallenges();
            // Load stats
            await loadUserStats();
        });

        async function loadWalletData() {
            let balance = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');
            let level = 4;
            let xp = 420;

            const token = sessionStorage.getItem('bge_auth_token') ||
                localStorage.getItem('bge_auth_token') ||
                sessionStorage.getItem('authToken') ||
                localStorage.getItem('authToken');

            if (token) {
                try {
                    const response = await fetch('/api/wallet', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        updateWalletUI(data);
                        return;
                    }
                } catch (error) {
                    console.warn('Backend wallet offline, using local storage wallet');
                }
            }

            updateWalletUI({
                balance: balance,
                level: level,
                xp: xp,
                total_earned: balance + 150
            });
        }

        function updateWalletUI(walletData) {
            // Update balance
            document.querySelector('[data-balance]').textContent = walletData.balance || 0;

            // Update level
            document.getElementById('userLevel').textContent = walletData.level || 1;
            document.getElementById('levelName').textContent = getLevelName(walletData.level || 1);

            // Update XP progress
            const currentXP = walletData.xp || 0;
            const requiredXP = getRequiredXP(walletData.level || 1);
            const xpPercentage = (currentXP / requiredXP) * 100;

            document.getElementById('currentXP').textContent = currentXP;
            document.getElementById('requiredXP').textContent = requiredXP;
            document.getElementById('xpProgress').style.width = xpPercentage + '%';

            // Update stats
            document.getElementById('totalEarned').textContent = walletData.total_earned || 0;
            document.getElementById('totalXP').textContent = walletData.xp || 0;
        }

        function getLevelName(level) {
            const levels = ['', 'Aprendiz', 'Explorador', 'Estudioso', 'Erudito', 'Maestro', 'Sabio', 'Leyenda'];
            return levels[level] || 'Aprendiz';
        }

        function getRequiredXP(level) {
            const requirements = [0, 100, 300, 600, 1000, 1500, 2500];
            return requirements[level] || 100;
        }

        async function loadChallenges() {
            // This will be implemented when API is ready
            
        }

        async function loadUserStats() {
            // This will be implemented when API is ready
            
        }

        function refreshWallet() {
            loadWalletData();
        }

        function showPurchaseModal() {
            const modal = new bootstrap.Modal(document.getElementById('purchaseModal'));
            modal.show();
        }

        // Package selection
        document.addEventListener('click', function (e) {
            const packageCard = e.target.closest('.package-card');
            if (packageCard) {
                const packageType = packageCard.dataset.package;
                initiatePayment(packageType);
            }
        });

        function initiatePayment(packageType) {
            
            // This will integrate with Stripe/MercadoPago
            alert('Payment integration coming soon!');
        }

        // ============================================
        // EVENT DELEGATION HANDLER (CSP Compliance)
        // ============================================
        document.addEventListener('click', function (e) {
            const actionElement = e.target.closest('[data-action]');
            if (!actionElement) return;

            const action = actionElement.dataset.action;

            // Handle actions
            switch (action) {
                case 'refresh-wallet':
                    refreshWallet();
                    break;
                case 'show-purchase-modal':
                    showPurchaseModal();
                    break;
                default:
                    
            }
        });
