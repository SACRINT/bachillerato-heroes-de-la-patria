/**
 * 🎯 SISTEMA INTELIGENTE DE LOGIN Y RECOMPENSAS IA
 * Integración completa con el botón existente
 * Detección automática de roles y sistema de gamificación
 */

class IntelligentLoginSystem {
    constructor() {
        this.userProfiles = {
            student: {
                icon: '👨‍🎓',
                color: '#007bff',
                initialLevel: 1,
                welcomeMessage: '¡Bienvenido estudiante! Tu viaje de aprendizaje IA comienza ahora.',
                initialPrompts: ['basic-summary', 'simple-questions', 'vocabulary-builder']
            },
            teacher: {
                icon: '👨‍🏫',
                color: '#28a745',
                initialLevel: 10,
                welcomeMessage: '¡Bienvenido docente! Accede a herramientas IA pedagógicas avanzadas.',
                initialPrompts: ['lesson-planner', 'assessment-creator', 'student-feedback']
            },
            parent: {
                icon: '👨‍👩‍👧‍👦',
                color: '#17a2b8',
                initialLevel: 5,
                welcomeMessage: '¡Bienvenido padre/madre! Herramientas para apoyar la educación de tu hijo.',
                initialPrompts: ['homework-helper', 'progress-tracker', 'communication-tools']
            },
            admin: {
                icon: '👨‍💼',
                color: '#6f42c1',
                initialLevel: 20,
                welcomeMessage: '¡Bienvenido administrador! Panel de gestión educativa IA.',
                initialPrompts: ['report-generator', 'communication-drafts', 'procedure-optimizer']
            }
        };

        this.currentUser = null;
        this.aiPromptLibrary = this.initializePromptLibrary();
        this.init();
    }

    init() {
        this.enhanceExistingLoginButton();
        this.checkExistingSession();
        this.initializeGoogleAuth();
    }

    /**
     * 🔧 Mejorar el botón existente sin cambiar su estructura
     */
    enhanceExistingLoginButton() {
        // Buscar el botón existente
        const existingLoginButton = this.findLoginButton();

        if (existingLoginButton) {
            // Agregar funcionalidad avanzada al botón existente
            existingLoginButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleIntelligentLogin();
            });

            // Agregar indicador visual de sistema IA
            this.addAIIndicator(existingLoginButton);
        }
    }

    /**
     * 🔍 Encontrar el botón de login dinámico existente
     */
    findLoginButton() {
        // Múltiples estrategias para encontrar el botón
        const selectors = [
            'button:contains("Iniciar Sesión")',
            '.login-button',
            '#login-button',
            'button[onclick*="login"]',
            '.nav-item button:contains("Iniciar")'
        ];

        for (const selector of selectors) {
            const button = document.querySelector(selector);
            if (button) return button;
        }

        // Buscar por texto específico
        const allButtons = document.querySelectorAll('button');
        for (const button of allButtons) {
            if (button.textContent.includes('Iniciar Sesión') ||
                button.textContent.includes('Iniciar sesión')) {
                return button;
            }
        }

        return null;
    }

    /**
     * ✨ Agregar indicador visual de sistema IA al botón existente
     */
    addAIIndicator(button) {
        // Crear badge de IA sin modificar el botón original
        const aiBadge = document.createElement('span');
        aiBadge.className = 'ai-indicator-badge';
        aiBadge.innerHTML = sanitizeHTML('🧠');
        aiBadge.title = 'Sistema IA de Recompensas Académicas';

        // Estilos del badge
        aiBadge.style.cssText = `
            position: relative;
            top: -2px;
            left: 3px;
            font-size: 12px;
            opacity: 0.8;
            animation: aiPulse 2s infinite;
        `;

        // Agregar animación CSS
        if (!document.querySelector('#ai-indicator-styles')) {
            const style = document.createElement('style');
            style.id = 'ai-indicator-styles';
            style.textContent = `
                @keyframes aiPulse {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                .ai-indicator-badge:hover {
                    opacity: 1 !important;
                    transform: scale(1.2) !important;
                }
            `;
            document.head.appendChild(style);
        }

        button.appendChild(aiBadge);
    }

    /**
     * 🚀 Manejar login inteligente
     */
    async handleIntelligentLogin() {
        try {
            // Mostrar modal de carga elegante
            this.showLoadingModal();

            // Autenticar con Google
            const userProfile = await this.authenticateWithGoogle();

            // Detectar rol automáticamente
            const userType = this.detectUserRole(userProfile.email);

            // Crear perfil completo de usuario
            const completeProfile = await this.createUserProfile(userProfile, userType);

            // Mostrar bienvenida personalizada
            this.showWelcomeExperience(completeProfile);

            // Inicializar dashboard personalizado
            this.initializePersonalizedDashboard(completeProfile);

            // Comenzar sistema de tips
            this.startContextualTips(completeProfile);

            // Actualizar botón con estado logueado
            this.updateButtonToLoggedState(completeProfile);

        } catch (error) {
            console.error('Error en login inteligente:', error);
            this.showErrorMessage('Error al iniciar sesión. Intenta nuevamente.');
        }
    }

    /**
     * 🔍 Detectar rol de usuario por email
     */
    detectUserRole(email) {
        // Detectar por dominio institucional
        if (email.includes('@profesor.heroespatria.edu.mx')) return 'teacher';
        if (email.includes('@admin.heroespatria.edu.mx')) return 'admin';
        if (email.includes('@padre.heroespatria.edu.mx')) return 'parent';

        // Detectar por patrones comunes
        if (email.includes('profesor') || email.includes('docente') || email.includes('maestro')) return 'teacher';
        if (email.includes('admin') || email.includes('director') || email.includes('coordinador')) return 'admin';
        if (email.includes('padre') || email.includes('mama') || email.includes('papa')) return 'parent';

        // Por defecto: estudiante
        return 'student';
    }

    /**
     * 👤 Crear perfil completo de usuario
     */
    async createUserProfile(googleProfile, userType) {
        const profileConfig = this.userProfiles[userType];

        const completeProfile = {
            // Datos de Google
            id: googleProfile.sub,
            name: googleProfile.name,
            email: googleProfile.email,
            picture: googleProfile.picture,

            // Datos del sistema de recompensas
            type: userType,
            level: profileConfig.initialLevel,
            xp: 0,
            totalXP: 0,
            badges: [],
            unlockedPrompts: [...profileConfig.initialPrompts],
            streak: 0,
            lastActivity: new Date().toISOString(),

            // Configuración personalizada
            preferences: {
                difficulty: 'adaptive',
                notifications: true,
                tips: true,
                theme: 'auto'
            },

            // Estadísticas
            stats: {
                promptsUsed: 0,
                helpedUsers: 0,
                createdContent: 0,
                achievementsUnlocked: 0
            },

            // Historial de actividades
            activityHistory: [],

            // Fecha de registro
            registeredAt: new Date().toISOString()
        };

        // Guardar en localStorage y backend
        localStorage.setItem('heroesPatria_userProfile', JSON.stringify(completeProfile));
        await this.syncProfileWithBackend(completeProfile);

        this.currentUser = completeProfile;
        return completeProfile;
    }

    /**
     * 🎉 Mostrar experiencia de bienvenida personalizada
     */
    showWelcomeExperience(profile) {
        const config = this.userProfiles[profile.type];

        // Crear modal de bienvenida elegante
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'welcome-modal-overlay';
        welcomeModal.innerHTML = sanitizeHTML(`
            <div class="welcome-modal-content">
                <div class="welcome-header">
                    <div class="welcome-icon">${config.icon}</div>
                    <h2>¡Bienvenido ${profile.name}!</h2>
                    <div class="welcome-badge" style="background: ${config.color}">
                        Nivel ${profile.level} - ${this.getRoleDisplayName(profile.type)}
                    </div>
                </div>

                <div class="welcome-body">
                    <p class="welcome-message">${config.welcomeMessage}</p>

                    <div class="welcome-features">
                        <h4>🎯 Funcionalidades Desbloqueadas:</h4>
                        <ul class="features-list">
                            ${profile.unlockedPrompts.map(prompt =>
                                `)<li><i class="fas fa-check text-success"></i> ${this.getPromptDisplayName(prompt)}</li>`
                            ).join('')}
                        </ul>
                    </div>

                    <div class="welcome-stats">
                        <div class="stat-item">
                            <div class="stat-icon">🏆</div>
                            <div class="stat-info">
                                <div class="stat-number">${profile.level}</div>
                                <div class="stat-label">Nivel Inicial</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">⚡</div>
                            <div class="stat-info">
                                <div class="stat-number">${profile.unlockedPrompts.length}</div>
                                <div class="stat-label">Prompts Disponibles</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-icon">🎮</div>
                            <div class="stat-info">
                                <div class="stat-number">∞</div>
                                <div class="stat-label">Posibilidades</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="welcome-actions">
                    <button class="btn btn-primary btn-lg" onclick="this.closest('.welcome-modal-overlay').remove(); window.intelligentLogin.showDashboard();">
                        <i class="fas fa-rocket"></i> Comenzar Aventura IA
                    </button>
                    <button class="btn btn-outline-secondary" onclick="this.closest('.welcome-modal-overlay').remove(); window.intelligentLogin.showTutorial();">
                        <i class="fas fa-question-circle"></i> Tutorial Rápido
                    </button>
                </div>
            </div>
        `;

        // Agregar estilos del modal
        this.addWelcomeModalStyles();

        // Mostrar modal con animación
        document.body.appendChild(welcomeModal);
        setTimeout(() => welcomeModal.classList.add('show'), 100);

        // Reproducir sonido de bienvenida (opcional)
        this.playWelcomeSound(profile.type);
    }

    /**
     * 📊 Inicializar dashboard personalizado
     */
    initializePersonalizedDashboard(profile) {
        // Crear dashboard flotante que se puede minimizar
        const dashboard = document.createElement('div');
        dashboard.id = 'ai-rewards-dashboard';
        dashboard.className = 'ai-dashboard';
        dashboard.innerHTML = this.generateDashboardHTML(profile);

        // Agregar al DOM
        document.body.appendChild(dashboard);

        // Inicializar funcionalidades del dashboard
        this.initializeDashboardFeatures(dashboard, profile);

        // Mostrar con animación
        setTimeout(() => dashboard.classList.add('show'), 500);
    }

    /**
     * 🔄 Actualizar botón a estado logueado
     */
    updateButtonToLoggedState(profile) {
        const loginButton = this.findLoginButton();
        if (!loginButton) return;

        const config = this.userProfiles[profile.type];

        // Cambiar texto y estilo del botón
        loginButton.innerHTML = sanitizeHTML(`
            <img src="${profile.picture}" alt="Avatar" class="user-avatar">
            <span class="user-name">${profile.name.split(' ')[0]}</span>
            <span class="user-level">Nv.${profile.level}</span>
            <span class="user-xp">${profile.xp} XP</span>
        `);

        loginButton.style.cssText = `
            background: linear-gradient(135deg, ${config.color}, ${this.darkenColor(config.color, 20)});
            color: white;
            border: none;
            border-radius: 25px;
            padding: 8px 16px;
            font-weight: 500;
            box-shadow: 0 2px 8px ${config.color}33;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
        `;

        // Agregar hover effect
        loginButton.addEventListener('mouseenter', () => {
            loginButton.style.transform = 'translateY(-2px)';
            loginButton.style.boxShadow = `0 4px 12px ${config.color}55`;
        });

        loginButton.addEventListener('mouseleave', () => {
            loginButton.style.transform = 'translateY(0)';
            loginButton.style.boxShadow = `0 2px 8px ${config.color}33`;
        });

        // Cambiar funcionalidad del click
        loginButton.removeEventListener('click', this.handleIntelligentLogin);
        loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDashboard();
        });
    }

    /**
     * 🎮 Mostrar dashboard principal
     */
    showDashboard() {
        const dashboard = document.getElementById('ai-rewards-dashboard');
        if (dashboard) {
            dashboard.classList.add('expanded');
            dashboard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * 📚 Inicializar biblioteca de prompts maestros
     */
    initializePromptLibrary() {
        return {
            // ESTUDIANTES - Prompts básicos a avanzados
            'basic-summary': {
                name: 'Resumen Inteligente',
                description: 'Crea resúmenes estructurados y fáciles de entender',
                level: 1,
                category: 'writing',
                xpReward: 10
            },
            'essay-writer': {
                name: 'Escritor de Ensayos',
                description: 'Genera ensayos argumentativos con estructura académica',
                level: 15,
                category: 'writing',
                xpReward: 50
            },
            'research-master': {
                name: 'Maestro Investigador',
                description: 'Metodología de investigación y análisis de fuentes',
                level: 30,
                category: 'research',
                xpReward: 100
            },

            // DOCENTES - Prompts pedagógicos
            'lesson-planner': {
                name: 'Planificador Didáctico',
                description: 'Crea planeaciones didácticas innovadoras y efectivas',
                level: 10,
                category: 'teaching',
                xpReward: 25
            },
            'assessment-creator': {
                name: 'Creador de Evaluaciones',
                description: 'Diseña evaluaciones formativas y sumativas',
                level: 20,
                category: 'assessment',
                xpReward: 40
            },

            // PADRES - Prompts de apoyo familiar
            'homework-helper': {
                name: 'Asistente de Tareas',
                description: 'Guía para apoyar a tu hijo sin hacer su tarea',
                level: 5,
                category: 'family',
                xpReward: 15
            },

            // ADMINISTRATIVOS - Prompts de gestión
            'report-generator': {
                name: 'Generador de Reportes',
                description: 'Crea reportes institucionales profesionales',
                level: 20,
                category: 'management',
                xpReward: 60
            }
        };
    }

    // Métodos auxiliares
    getRoleDisplayName(type) {
        const names = {
            student: 'Estudiante',
            teacher: 'Docente',
            parent: 'Padre/Madre',
            admin: 'Administrativo'
        };
        return names[type] || 'Usuario';
    }

    getPromptDisplayName(promptKey) {
        return this.aiPromptLibrary[promptKey]?.name || promptKey;
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#",""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
               (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
               .toString(16).slice(1);
    }

    /**
     * 🎯 Autenticación con Google
     */
    async authenticateWithGoogle() {
        // Simulación de Google Auth - reemplazar con Google SDK real
        return new Promise((resolve) => {
            // Por ahora simularemos un login exitoso
            // En producción, aquí iría la integración real con Google
            setTimeout(() => {
                resolve({
                    sub: 'user_' + Date.now(),
                    name: 'Usuario Demo',
                    email: 'usuario@heroespatria.edu.mx',
                    picture: 'https://via.placeholder.com/150'
                });
            }, 1000);
        });
    }

    /**
     * 📱 Generar HTML del Dashboard
     */
    generateDashboardHTML(profile) {
        const config = this.userProfiles[profile.type];
        const nextLevelXP = this.getXPForLevel(profile.level + 1);
        const currentLevelXP = this.getXPForLevel(profile.level);
        const progressPercent = ((profile.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

        return `
            <div class="dashboard-header" onclick="this.parentElement.classList.toggle('expanded')">
                <h3 class="dashboard-title">
                    ${config.icon} IA Rewards
                    <button class="dashboard-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </h3>
                <div class="dashboard-subtitle">Nv.${profile.level} • ${profile.xp} XP</div>
            </div>

            <div class="dashboard-content">
                <div class="dashboard-section">
                    <h4>📊 Tu Progreso</h4>
                    <div class="xp-progress">
                        <div class="xp-bar">
                            <div class="xp-bar-fill" style="width: ${progressPercent}%"></div>
                        </div>
                        <div class="xp-text">${profile.xp}/${nextLevelXP} XP para nivel ${profile.level + 1}</div>
                    </div>
                </div>

                <div class="dashboard-section">
                    <h4>🎯 Prompts Disponibles</h4>
                    <div class="available-prompts">
                        ${profile.unlockedPrompts.slice(0, 3).map(promptKey => {
                            const prompt = this.aiPromptLibrary[promptKey];
                            return `
                                <div class="prompt-item" data-prompt="${promptKey}">
                                    <div class="prompt-name">${prompt?.name || promptKey}</div>
                                    <div class="prompt-xp">+${prompt?.xpReward || 10} XP</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="window.intelligentLogin.showAllPrompts()">
                        Ver Todos (${profile.unlockedPrompts.length})
                    </button>
                </div>

                <div class="dashboard-section">
                    <h4>🏆 Estadísticas</h4>
                    <div class="stats-grid">
                        <div class="stat-mini">
                            <span class="stat-value">${profile.stats.promptsUsed}</span>
                            <span class="stat-label">Prompts Usados</span>
                        </div>
                        <div class="stat-mini">
                            <span class="stat-value">${profile.streak}</span>
                            <span class="stat-label">Racha Días</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ⚙️ Inicializar funcionalidades del dashboard
     */
    initializeDashboardFeatures(dashboard, profile) {
        // Configurar clicks en prompts
        dashboard.addEventListener('click', (e) => {
            const promptItem = e.target.closest('.prompt-item');
            if (promptItem) {
                const promptKey = promptItem.dataset.prompt;
                this.executePrompt(promptKey, profile);
            }
        });

        // Auto-actualizar progreso cada 30 segundos
        setInterval(() => {
            this.updateDashboardData(dashboard, profile);
        }, 30000);
    }

    /**
     * 🔧 Alternar visibilidad del dashboard
     */
    toggleDashboard() {
        const dashboard = document.getElementById('ai-rewards-dashboard');
        if (dashboard) {
            dashboard.classList.toggle('expanded');
        }
    }

    /**
     * 💡 Inicializar Google Auth
     */
    initializeGoogleAuth() {
        // Placeholder para Google Auth SDK
        // En producción aquí iría: gapi.load('auth2', ...)
        console.log('🔐 Sistema de autenticación inicializado');
    }

    /**
     * 📚 Mostrar modal de carga
     */
    showLoadingModal() {
        const loadingModal = document.createElement('div');
        loadingModal.id = 'loading-modal';
        loadingModal.className = 'welcome-modal-overlay';
        loadingModal.innerHTML = sanitizeHTML(`
            <div class="welcome-modal-content" style="max-width: 400px; text-align: center; padding: 40px;">
                <div class="loading-spinner">
                    <i class="fas fa-robot fa-3x text-primary mb-3"></i>
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <h4>Activando IA...</h4>
                <p>Preparando tu experiencia personalizada</p>
            </div>
        `);

        document.body.appendChild(loadingModal);
        setTimeout(() => loadingModal.classList.add('show'), 100);
    }

    /**
     * ❌ Mostrar mensaje de error
     */
    showErrorMessage(message) {
        // Ocultar modal de carga si existe
        const loadingModal = document.getElementById('loading-modal');
        if (loadingModal) loadingModal.remove();

        alert('Error: ' + message); // Reemplazar con toast elegante
    }

    /**
     * 📖 Mostrar tutorial rápido
     */
    showTutorial() {
        alert('🎓 Tutorial próximamente...');
    }

    /**
     * 📋 Mostrar todos los prompts disponibles
     */
    showAllPrompts() {
        alert('📋 Lista completa de prompts próximamente...');
    }

    /**
     * ⚡ Ejecutar prompt seleccionado
     */
    async executePrompt(promptKey, profile) {
        const prompt = this.aiPromptLibrary[promptKey];
        if (!prompt) return;

        // Mostrar modal de input para el usuario
        const userInput = await this.showPromptInputModal(prompt);
        if (!userInput) return; // Usuario canceló

        // Mostrar loading
        const loadingModal = this.showAILoadingModal(prompt.name);

        try {
            // Llamada a la API real
            const response = await fetch('/api/ai/execute-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    promptId: promptKey,
                    userInput: userInput,
                    userProfile: profile
                })
            });

            const result = await response.json();

            // Ocultar loading
            loadingModal.remove();

            if (result.success) {
                // Mostrar respuesta de la IA
                this.showAIResponseModal(result.data, prompt);

                // Otorgar XP real
                this.awardXP(profile, result.data.xpEarned);

                // Mostrar celebración si es apropiado
                if (result.data.xpEarned >= 50) {
                    this.showCelebrationEffect();
                }
            } else {
                this.showErrorModal(result.error);
            }

        } catch (error) {
            console.error('Error ejecutando prompt:', error);
            loadingModal.remove();
            this.showErrorModal('Error de conexión. Intenta nuevamente.');
        }
    }

    /**
     * 🏆 Otorgar XP al usuario
     */
    awardXP(profile, amount) {
        profile.xp += amount;
        profile.totalXP += amount;
        profile.stats.promptsUsed++;

        // Verificar subida de nivel
        this.checkLevelUp(profile);

        // Guardar progreso
        this.saveUserProfile(profile);

        // Actualizar UI
        this.updateDashboardData(document.getElementById('ai-rewards-dashboard'), profile);
    }

    /**
     * 📈 Verificar subida de nivel
     */
    checkLevelUp(profile) {
        const requiredXP = this.getXPForLevel(profile.level + 1);
        if (profile.xp >= requiredXP) {
            profile.level++;
            this.showLevelUpCelebration(profile);
            this.unlockNewPrompts(profile);
        }
    }

    /**
     * 🎊 Mostrar celebración de subida de nivel
     */
    showLevelUpCelebration(profile) {
        alert(`🎉 ¡NIVEL ${profile.level}!\n¡Nuevos prompts desbloqueados!`);
    }

    /**
     * 🔓 Desbloquear nuevos prompts por nivel
     */
    unlockNewPrompts(profile) {
        const allPrompts = Object.keys(this.aiPromptLibrary);
        const newPrompts = allPrompts.filter(key => {
            const prompt = this.aiPromptLibrary[key];
            return prompt.level <= profile.level && !profile.unlockedPrompts.includes(key);
        });

        profile.unlockedPrompts.push(...newPrompts);
    }

    /**
     * 📊 Calcular XP requerido para nivel
     */
    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }

    /**
     * 🔄 Verificar sesión existente
     */
    checkExistingSession() {
        const savedProfile = localStorage.getItem('heroesPatria_userProfile');
        if (savedProfile) {
            try {
                this.currentUser = JSON.parse(savedProfile);
                this.updateButtonToLoggedState(this.currentUser);
                this.initializePersonalizedDashboard(this.currentUser);
            } catch (error) {
                console.error('Error al cargar perfil guardado:', error);
                localStorage.removeItem('heroesPatria_userProfile');
            }
        }
    }

    /**
     * 💾 Guardar perfil de usuario
     */
    saveUserProfile(profile) {
        localStorage.setItem('heroesPatria_userProfile', JSON.stringify(profile));
        this.syncProfileWithBackend(profile);
    }

    /**
     * 🔄 Sincronizar con backend
     */
    async syncProfileWithBackend(profile) {
        try {
            // Placeholder para sincronización con servidor
            console.log('📡 Sincronizando perfil con servidor...', profile.email);
        } catch (error) {
            console.error('Error al sincronizar:', error);
        }
    }

    /**
     * 🔄 Actualizar datos del dashboard
     */
    updateDashboardData(dashboard, profile) {
        if (!dashboard) return;

        const newHTML = this.generateDashboardHTML(profile);
        dashboard.innerHTML = newHTML;
        this.initializeDashboardFeatures(dashboard, profile);
    }

    /**
     * 🎵 Reproducir sonido de bienvenida
     */
    playWelcomeSound(userType) {
        // Placeholder para sonidos opcionales
        console.log(`🎵 Sonido de bienvenida para ${userType}`);
    }

    /**
     * 🎨 Agregar estilos del modal de bienvenida
     */
    addWelcomeModalStyles() {
        // Los estilos ya están en intelligent-login-styles.css
        console.log('🎨 Estilos de modal aplicados');
    }

    /**
     * 💡 Iniciar tips contextuales
     */
    startContextualTips(profile) {
        // Mostrar tip inicial después de 3 segundos
        setTimeout(() => {
            this.showContextualTip(
                'dashboard',
                '💡 Haz clic en cualquier prompt para empezar a ganar XP',
                'bottom'
            );
        }, 3000);
    }

    /**
     * 💬 Mostrar tip contextual
     */
    showContextualTip(target, message, position) {
        console.log(`💬 Tip: ${message}`);
        // Implementación completa de tooltips próximamente
    }

    /**
     * 📝 Mostrar modal de input para prompt
     */
    showPromptInputModal(prompt) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'welcome-modal-overlay';
            modal.innerHTML = sanitizeHTML(`
                <div class="welcome-modal-content" style="max-width: 600px;">
                    <div class="welcome-header">
                        <div class="welcome-icon">🤖</div>
                        <h2>${prompt.name}</h2>
                        <div class="welcome-badge">+${prompt.xpReward} XP</div>
                    </div>

                    <div class="welcome-body">
                        <p class="welcome-message">${prompt.description}</p>

                        <div class="form-group mb-3">
                            <label class="form-label fw-bold">💭 ¿En qué tema necesitas ayuda?</label>
                            <textarea
                                id="promptInput"
                                class="form-control"
                                rows="4"
                                placeholder="Escribe aquí tu tema, pregunta o contenido..."
                                style="resize: vertical; min-height: 100px;"
                            ></textarea>
                            <small class="text-muted">
                                Proporciona detalles específicos para obtener una respuesta más personalizada.
                            </small>
                        </div>
                    </div>

                    <div class="welcome-actions">
                        <button class="btn btn-primary btn-lg" onclick="this.submitPrompt()">
                            <i class="fas fa-rocket"></i> Ejecutar IA
                        </button>
                        <button class="btn btn-outline-secondary" onclick="this.cancelPrompt()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            `);

            // Agregar funciones al contexto del modal
            modal.querySelector('.btn-primary').onclick = () => {
                const input = modal.querySelector('#promptInput').value.trim();
                if (input) {
                    modal.remove();
                    resolve(input);
                } else {
                    modal.querySelector('#promptInput').focus();
                    modal.querySelector('.form-group').style.animation = 'shake 0.5s';
                }
            };

            modal.querySelector('.btn-outline-secondary').onclick = () => {
                modal.remove();
                resolve(null);
            };

            // Mostrar modal
            document.body.appendChild(modal);
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('#promptInput').focus();
            }, 100);
        });
    }

    /**
     * ⏳ Mostrar modal de carga de IA
     */
    showAILoadingModal(promptName) {
        const loadingModal = document.createElement('div');
        loadingModal.className = 'welcome-modal-overlay';
        loadingModal.innerHTML = sanitizeHTML(`
            <div class="welcome-modal-content" style="max-width: 400px; text-align: center; padding: 40px;">
                <div class="loading-spinner">
                    <div class="ai-brain-animation">🧠</div>
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
                <h4>🤖 IA Procesando...</h4>
                <p><strong>${promptName}</strong></p>
                <div class="loading-messages">
                    <small class="text-muted">Analizando tu solicitud...</small>
                </div>
            </div>
        `);

        // Agregar estilos de animación
        const style = document.createElement('style');
        style.textContent = `
            .ai-brain-animation {
                font-size: 3rem;
                animation: brainThinking 1.5s infinite;
                margin-bottom: 16px;
            }
            @keyframes brainThinking {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
        `;
        document.head.appendChild(style);

        // Mostrar modal
        document.body.appendChild(loadingModal);
        setTimeout(() => loadingModal.classList.add('show'), 100);

        // Cambiar mensajes de carga cada 2 segundos
        const messages = [
            'Analizando tu solicitud...',
            'Consultando base de conocimientos...',
            'Generando respuesta personalizada...',
            'Aplicando contexto educativo...',
            'Finalizando respuesta...'
        ];

        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            const messageElement = loadingModal.querySelector('.loading-messages small');
            if (messageElement && messageIndex < messages.length - 1) {
                messageIndex++;
                messageElement.textContent = messages[messageIndex];
            } else {
                clearInterval(messageInterval);
            }
        }, 2000);

        return loadingModal;
    }

    /**
     * 💬 Mostrar modal con respuesta de IA
     */
    showAIResponseModal(responseData, prompt) {
        const modal = document.createElement('div');
        modal.className = 'welcome-modal-overlay';
        modal.innerHTML = sanitizeHTML(`
            <div class="welcome-modal-content ai-response-modal" style="max-width: 800px; max-height: 90vh;">
                <div class="welcome-header" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                    <div class="welcome-icon">✨</div>
                    <h2>Respuesta Generada</h2>
                    <div class="welcome-badge">
                        +${responseData.xpEarned} XP • ${responseData.model}
                        ${responseData.isSimulated ? '(Demo)' : ''}
                    </div>
                </div>

                <div class="welcome-body" style="max-height: 60vh; overflow-y: auto;">
                    <div class="ai-response-content">
                        ${this.formatAIResponse(responseData.response)}
                    </div>

                    <div class="response-stats mt-3 p-3 bg-light rounded">
                        <div class="row text-center">
                            <div class="col-4">
                                <strong>${responseData.tokensUsed || 0}</strong><br>
                                <small class="text-muted">Tokens</small>
                            </div>
                            <div class="col-4">
                                <strong>${responseData.executionTime || '2.3'}ms</strong><br>
                                <small class="text-muted">Tiempo</small>
                            </div>
                            <div class="col-4">
                                <strong>+${responseData.xpEarned}</strong><br>
                                <small class="text-muted">XP Ganados</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="welcome-actions">
                    <button class="btn btn-success btn-lg" onclick="this.saveResponse()">
                        <i class="fas fa-save"></i> Guardar Respuesta
                    </button>
                    <button class="btn btn-primary" onclick="this.shareResponse()">
                        <i class="fas fa-share"></i> Compartir
                    </button>
                    <button class="btn btn-outline-secondary" onclick="this.closeModal()">
                        <i class="fas fa-check"></i> Cerrar
                    </button>
                </div>
            </div>
        `);

        // Funciones del modal
        modal.querySelector('.btn-success').onclick = () => {
            this.saveAIResponse(responseData, prompt);
        };

        modal.querySelector('.btn-primary').onclick = () => {
            this.shareAIResponse(responseData.response);
        };

        modal.querySelector('.btn-outline-secondary').onclick = () => {
            modal.remove();
        };

        // Mostrar modal
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);
    }

    /**
     * 🎨 Formatear respuesta de IA con markdown básico
     */
    formatAIResponse(response) {
        return response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\• /gm, '<li>')
            .replace(/^- /gm, '<li>')
            .replace(/\n/g, '<br>')
            .replace(/<li>/g, '<ul><li>')
            .replace(/<\/li><br><li>/g, '</li><li>')
            .replace(/<li>.*<\/li>/g, (match) => match + '</ul>');
    }

    /**
     * 🎊 Mostrar efecto de celebración
     */
    showCelebrationEffect() {
        // Crear efecto de confetti simple
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 10000;
        `;

        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)]};
                left: ${Math.random() * 100}%;
                animation: confettiFall 3s linear forwards;
            `;
            celebration.appendChild(confetti);
        }

        // Agregar animación CSS
        if (!document.querySelector('#confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confettiFall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(celebration);
        setTimeout(() => celebration.remove(), 3000);
    }

    /**
     * ❌ Mostrar modal de error
     */
    showErrorModal(errorMessage) {
        const modal = document.createElement('div');
        modal.className = 'welcome-modal-overlay';
        modal.innerHTML = sanitizeHTML(`
            <div class="welcome-modal-content" style="max-width: 500px;">
                <div class="welcome-header" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
                    <div class="welcome-icon">⚠️</div>
                    <h2>Error</h2>
                </div>

                <div class="welcome-body">
                    <p class="welcome-message">${errorMessage}</p>
                    <p class="text-muted">
                        Si el problema persiste, contacta al administrador del sistema.
                    </p>
                </div>

                <div class="welcome-actions">
                    <button class="btn btn-primary" onclick="this.closest('.welcome-modal-overlay').remove()">
                        <i class="fas fa-check"></i> Entendido
                    </button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 100);
    }

    /**
     * 💾 Guardar respuesta de IA
     */
    saveAIResponse(responseData, prompt) {
        // Guardar en localStorage por ahora
        const savedResponses = JSON.parse(localStorage.getItem('heroesPatria_aiResponses') || '[]');

        savedResponses.unshift({
            id: Date.now(),
            promptName: prompt.name,
            response: responseData.response,
            xpEarned: responseData.xpEarned,
            timestamp: new Date().toISOString(),
            model: responseData.model
        });

        // Mantener solo las últimas 50 respuestas
        if (savedResponses.length > 50) {
            savedResponses.splice(50);
        }

        localStorage.setItem('heroesPatria_aiResponses', JSON.stringify(savedResponses));

        // Mostrar confirmación
        this.showToast('✅ Respuesta guardada exitosamente');
    }

    /**
     * 📤 Compartir respuesta de IA
     */
    shareAIResponse(response) {
        if (navigator.share) {
            navigator.share({
                title: 'Respuesta IA - Héroes de la Patria',
                text: response.substring(0, 200) + '...',
                url: window.location.href
            });
        } else {
            // Fallback: copiar al clipboard
            navigator.clipboard.writeText(response).then(() => {
                this.showToast('📋 Respuesta copiada al portapapeles');
            });
        }
    }

    /**
     * 🍞 Mostrar notificación toast
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;

        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Inicializar sistema cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.intelligentLogin = new IntelligentLoginSystem();
    });
} else {
    window.intelligentLogin = new IntelligentLoginSystem();
}

// Hacer disponible globalmente
window.IntelligentLoginSystem = IntelligentLoginSystem;