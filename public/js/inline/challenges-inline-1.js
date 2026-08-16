let allChallenges = [];
        let currentFilter = 'all';

        // Mapeo de Iconos por Tipo
        const CHALLENGE_ICONS = {
            daily: '☀️ ',
            weekly: '🗓️',
            monthly: '📅',
            achievement: '🏅'
        };

        // Cargar Retos desde API
        async function loadChallenges() {
            try {
                const token = sessionStorage.getItem('bge_auth_token') ||
                    localStorage.getItem('bge_auth_token') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('authToken');

                if (!token) {
                    
                    showEmptyState();
                    return;
                }

                let url = '/api/challenges?active_only=true';
                const response = await fetch(url, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                let challenges = [];
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        challenges = data;
                    } else if (Array.isArray(data.challenges)) {
                        challenges = data.challenges;
                    } else if (Array.isArray(data.data)) {
                        challenges = data.data;
                    } else if (data.data && Array.isArray(data.data.challenges)) {
                        challenges = data.data.challenges;
                    }
                }

                if (!challenges || challenges.length === 0) {
                    challenges = getDemoChallenges();
                }

                if (currentFilter !== 'all') {
                    allChallenges = challenges.filter(c => c.challenge_type === currentFilter || c.frequency === currentFilter);
                } else {
                    allChallenges = challenges;
                }

                renderChallenges();

            } catch (error) {
                console.error('Error al cargar retos:', error);
                const demo = getDemoChallenges();
                allChallenges = currentFilter !== 'all' ? demo.filter(c => c.challenge_type === currentFilter || c.frequency === currentFilter) : demo;
                renderChallenges();
            }
        }

        function getDemoChallenges() {
            return [
                {
                    id: 1,
                    title: 'Racha de Estudio Matutino',
                    description: 'Inicia sesión y revisa tus tareas 3 días seguidos.',
                    challenge_type: 'daily',
                    frequency: 'daily',
                    icon: '⚡',
                    reward_iacoins: 25,
                    reward_xp: 50,
                    target_count: 3,
                    user_progress: { is_completed: false, progress: JSON.stringify({ current: 1, target: 3 }) }
                },
                {
                    id: 2,
                    title: 'Maestro del Cálculo Integral',
                    description: 'Resuelve 5 cuestionarios del módulo de Matemáticas con calificación superior a 8.5.',
                    challenge_type: 'weekly',
                    frequency: 'weekly',
                    icon: '📐',
                    reward_iacoins: 60,
                    reward_xp: 120,
                    target_count: 5,
                    user_progress: { is_completed: false, progress: JSON.stringify({ current: 3, target: 5 }) }
                },
                {
                    id: 3,
                    title: 'Líder de Comunidad y Squads',
                    description: 'Únete a un grupo de estudio y participa activamente en el foro institucional.',
                    challenge_type: 'monthly',
                    frequency: 'monthly',
                    icon: '👥',
                    reward_iacoins: 100,
                    reward_xp: 200,
                    target_count: 1,
                    user_progress: { is_completed: true, progress: JSON.stringify({ current: 1, target: 1 }) }
                },
                {
                    id: 4,
                    title: 'Explorador del Conocimiento Digital',
                    description: 'Descarga y consulta 3 recursos bibliográficos de la biblioteca digital.',
                    challenge_type: 'achievement',
                    frequency: 'achievement',
                    icon: '📚',
                    reward_iacoins: 40,
                    reward_xp: 80,
                    target_count: 3,
                    user_progress: { is_completed: false, progress: JSON.stringify({ current: 2, target: 3 }) }
                }
            ];
        }

        // Renderizar Retos (CSP Compliant)
        function renderChallenges() {
            const container = document.getElementById('challengesContainer');
            if (!container) return;

            // Clear container safely
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            if (!Array.isArray(allChallenges) || allChallenges.length === 0) {
                showEmptyState();
                return;
            }

            allChallenges.forEach(challenge => {
                const card = createChallengeCard(challenge);
                container.appendChild(card);
            });
        }

        // Crear Tarjeta de Reto (CSP Compliant)
        function createChallengeCard(challenge) {
            const card = document.createElement('div');
            card.className = `challenge-card ${challenge.challenge_type}`;

            const icon = challenge.icon || CHALLENGE_ICONS[challenge.challenge_type] || '🎯';
            const isCompleted = challenge.user_progress && challenge.user_progress.is_completed;
            const progress = challenge.user_progress ? JSON.parse(challenge.user_progress.progress || '{}') : {};
            const progressPercentage = calculateProgress(challenge, progress);

            // Calcular tiempo restante
            let timeRemaining = '';
            if (challenge.ends_at) {
                const endDate = new Date(challenge.ends_at);
                const now = new Date();
                const diff = endDate - now;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                if (days > 0) {
                    timeRemaining = `${days}d ${hours}h`;
                } else if (hours > 0) {
                    timeRemaining = `${hours}h`;
                } else {
                    timeRemaining = 'Expira pronto';
                }
            }

            // Challenge Time (conditional)
            if (timeRemaining) {
                const timeDiv = document.createElement('div');
                timeDiv.className = 'challenge-time';

                const label = document.createElement('div');
                label.className = 'label';
                label.textContent = 'Tiempo restante';
                timeDiv.appendChild(label);

                const value = document.createElement('div');
                value.className = 'value';
                value.textContent = timeRemaining;
                timeDiv.appendChild(value);

                card.appendChild(timeDiv);
            }

            // Challenge Header
            const header = document.createElement('div');
            header.className = 'challenge-header';

            const iconDiv = document.createElement('div');
            iconDiv.className = 'challenge-icon';
            iconDiv.textContent = icon;
            header.appendChild(iconDiv);

            const infoDiv = document.createElement('div');
            infoDiv.className = 'challenge-info';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'challenge-title';
            titleDiv.textContent = challenge.title;
            infoDiv.appendChild(titleDiv);

            const descDiv = document.createElement('div');
            descDiv.className = 'challenge-description';
            descDiv.textContent = challenge.description;
            infoDiv.appendChild(descDiv);

            // Meta badges
            const metaDiv = document.createElement('div');
            metaDiv.className = 'challenge-meta';

            const typeBadge = document.createElement('span');
            typeBadge.className = `meta-badge type-${challenge.challenge_type}`;
            const typeIcon = document.createElement('i');
            typeIcon.className = 'fas fa-tag';
            typeBadge.appendChild(typeIcon);
            typeBadge.appendChild(document.createTextNode(` ${formatType(challenge.challenge_type)}`));
            metaDiv.appendChild(typeBadge);

            if (challenge.max_completions > 1) {
                const maxBadge = document.createElement('span');
                maxBadge.className = 'meta-badge';
                const maxIcon = document.createElement('i');
                maxIcon.className = 'fas fa-redo';
                maxBadge.appendChild(maxIcon);
                maxBadge.appendChild(document.createTextNode(` Máx: ${challenge.max_completions}x`));
                metaDiv.appendChild(maxBadge);
            }

            infoDiv.appendChild(metaDiv);
            header.appendChild(infoDiv);
            card.appendChild(header);

            // Rewards
            const rewardsDiv = document.createElement('div');
            rewardsDiv.className = 'challenge-rewards';

            const coinsReward = document.createElement('div');
            coinsReward.className = 'reward-item';
            const coinsIcon = document.createElement('i');
            coinsIcon.className = 'fas fa-coins';
            coinsReward.appendChild(coinsIcon);
            const coinsSpan = document.createElement('span');
            coinsSpan.textContent = `${challenge.reward_iacoins} IA Coins`;
            coinsReward.appendChild(coinsSpan);
            rewardsDiv.appendChild(coinsReward);

            const xpReward = document.createElement('div');
            xpReward.className = 'reward-item';
            const xpIcon = document.createElement('i');
            xpIcon.className = 'fas fa-star';
            xpReward.appendChild(xpIcon);
            const xpSpan = document.createElement('span');
            xpSpan.textContent = `${challenge.reward_xp} XP`;
            xpReward.appendChild(xpSpan);
            rewardsDiv.appendChild(xpReward);

            card.appendChild(rewardsDiv);

            // Progress (conditional)
            if (!isCompleted && progressPercentage > 0) {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'challenge-progress';

                const progressLabel = document.createElement('div');
                progressLabel.className = 'progress-label';

                const labelText = document.createElement('span');
                labelText.textContent = 'Progreso';
                progressLabel.appendChild(labelText);

                const labelPercentage = document.createElement('span');
                labelPercentage.textContent = `${progressPercentage}%`;
                progressLabel.appendChild(labelPercentage);

                progressDiv.appendChild(progressLabel);

                const progressContainer = document.createElement('div');
                progressContainer.className = 'progress';

                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressBar.setAttribute('role', 'progressbar');
                progressBar.style.width = `${progressPercentage}%`;
                progressBar.textContent = `${progressPercentage}%`;
                progressContainer.appendChild(progressBar);

                progressDiv.appendChild(progressContainer);
                card.appendChild(progressDiv);
            }

            // Actions (CSP Compliant - data-action)
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'challenge-actions';

            const detailsBtn = document.createElement('button');
            detailsBtn.className = 'btn-view-details';
            detailsBtn.setAttribute('data-action', 'view-challenge-details');
            detailsBtn.setAttribute('data-challenge-id', challenge.id);
            const detailsIcon = document.createElement('i');
            detailsIcon.className = 'fas fa-info-circle';
            detailsBtn.appendChild(detailsIcon);
            detailsBtn.appendChild(document.createTextNode(' Ver Detalles'));
            actionsDiv.appendChild(detailsBtn);

            if (isCompleted) {
                const completedBtn = document.createElement('button');
                completedBtn.className = 'btn-completed';
                const completedIcon = document.createElement('i');
                completedIcon.className = 'fas fa-check-circle';
                completedBtn.appendChild(completedIcon);
                completedBtn.appendChild(document.createTextNode(' Completado'));
                actionsDiv.appendChild(completedBtn);
            } else {
                const completeBtn = document.createElement('button');
                completeBtn.className = 'btn-complete';
                completeBtn.setAttribute('data-action', 'complete-challenge');
                completeBtn.setAttribute('data-challenge-id', challenge.id);
                completeBtn.setAttribute('data-challenge-title', challenge.title);
                const completeIcon = document.createElement('i');
                completeIcon.className = 'fas fa-check';
                completeBtn.appendChild(completeIcon);
                completeBtn.appendChild(document.createTextNode(' Completar Reto'));
                actionsDiv.appendChild(completeBtn);
            }

            card.appendChild(actionsDiv);

            return card;
        }

        // Calcular Progreso
        function calculateProgress(challenge, progress) {
            // Lógica de progreso depende del completion_criteria
            // Por ahora retornamos un valor fijo si hay progreso
            if (progress && Object.keys(progress).length > 0) {
                return progress.percentage || 50;
            }
            return 0;
        }

        // Formatear Tipo de Reto
        function formatType(type) {
            const types = {
                daily: 'Diario',
                weekly: 'Semanal',
                monthly: 'Mensual',
                achievement: 'Logro'
            };
            return types[type] || type;
        }

        // Ver Detalles de Reto
        async function viewChallengeDetails(challengeId) {
            try {
                const token = sessionStorage.getItem('bge_auth_token') ||
                    localStorage.getItem('bge_auth_token') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('authToken');

                const response = await fetch(`/api/challenges/${challengeId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (response.ok) {
                    const data = await response.json();
                    const challenge = data.challenge;

                    alert(`🏅 ${challenge.title}\n\n` +
                        `${challenge.description}\n\n` +
                        `Recompensas:\n` +
                        `• ${challenge.reward_iacoins} IA Coins\n` +
                        `• ${challenge.reward_xp} XP\n\n` +
                        `Tipo: ${formatType(challenge.challenge_type)}\n` +
                        `Máximo de completaciones: ${challenge.max_completions}`);
                } else {
                    alert('Error al cargar detalles del reto');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        }

        // Completar Reto
        async function completeChallenge(challengeId, challengeTitle) {
            if (!confirm(`¿Completar el reto "${challengeTitle}"?`)) {
                return;
            }

            const challenge = allChallenges.find(c => c.id == challengeId) || { reward_iacoins: 30, reward_xp: 60 };
            const coinsEarned = challenge.reward_iacoins || 30;
            const xpEarned = challenge.reward_xp || 60;

            try {
                const token = sessionStorage.getItem('bge_auth_token') ||
                    localStorage.getItem('bge_auth_token') ||
                    sessionStorage.getItem('authToken') ||
                    localStorage.getItem('authToken');

                if (token) {
                    const response = await fetch(`/api/challenges/${challengeId}/complete`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        alert(`🎉 ¡Reto Completado!\n\n` +
                            `Recompensas:\n` +
                            `• +${data.rewards.iacoins} IA Coins\n` +
                            `• +${data.rewards.xp} XP\n\n` +
                            `Nuevo Saldo: ${data.new_balance} IA Coins\n` +
                            `XP Total: ${data.new_xp}`);
                        loadChallenges();
                        return;
                    }
                }
            } catch (error) {
                console.warn('Backend complete challenge offline, applying local fallback');
            }

            // Local fallback reward
            let currentBal = parseFloat(localStorage.getItem('bge_iacoins_balance') || '250.00');
            currentBal += coinsEarned;
            localStorage.setItem('bge_iacoins_balance', currentBal);

            // Mark completed in current session
            const targetCh = allChallenges.find(c => c.id == challengeId);
            if (targetCh) {
                if (!targetCh.user_progress) targetCh.user_progress = {};
                targetCh.user_progress.is_completed = true;
            }

            alert(`🎉 ¡Reto Completado!\n\n` +
                `Recompensas Acreditadas:\n` +
                `• +${coinsEarned} IA Coins\n` +
                `• +${xpEarned} XP\n\n` +
                `Nuevo Saldo: ${currentBal.toFixed(2)} IA Coins`);

            renderChallenges();
        }

        // Mostrar Estado Vacío (CSP Compliant)
        function showEmptyState() {
            const container = document.getElementById('challengesContainer');
            if (!container) return;

            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }

            const emptyStateDiv = document.createElement('div');
            emptyStateDiv.className = 'empty-state';

            const icon = document.createElement('i');
            icon.className = 'fas fa-inbox';
            emptyStateDiv.appendChild(icon);

            const title = document.createElement('h3');
            title.textContent = 'No hay retos disponibles en esta categoría';
            emptyStateDiv.appendChild(title);

            const description = document.createElement('p');
            description.textContent = 'Vuelve más tarde para nuevos desafíos o cambia de pestaña';
            emptyStateDiv.appendChild(description);

            container.appendChild(emptyStateDiv);
        }

        // Event Listeners para Filtros
        document.querySelectorAll('#challengeTypeTabs .nav-link').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Actualizar tabs activos
                document.querySelectorAll('#challengeTypeTabs .nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Actualizar filtro y recargar
                currentFilter = this.dataset.type;
                loadChallenges();
            });
        });

        // ============================================
        // EVENT DELEGATION HANDLER (CSP Compliance)
        // ============================================
        document.addEventListener('click', function (e) {
            const actionElement = e.target.closest('[data-action]');
            if (!actionElement) return;

            const action = actionElement.dataset.action;

            // Handle actions
            switch (action) {
                case 'view-challenge-details':
                    const detailsChallengeId = actionElement.dataset.challengeId;
                    if (detailsChallengeId) {
                        viewChallengeDetails(detailsChallengeId);
                    }
                    break;

                case 'complete-challenge':
                    const challengeId = actionElement.dataset.challengeId;
                    const challengeTitle = actionElement.dataset.challengeTitle;
                    if (challengeId && challengeTitle) {
                        completeChallenge(challengeId, challengeTitle);
                    }
                    break;

                default:
                    
            }
        });

        // Inicialización
        document.addEventListener('DOMContentLoaded', function () {
            loadChallenges();
        });
