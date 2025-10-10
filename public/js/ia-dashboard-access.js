/**
 * 🎯 PANEL DE ACCESO A FUNCIONALIDADES IA
 * Portal BGE Héroes de la Patria
 * Interfaz visual para acceder a todos los sistemas avanzados
 */

class IADashboardAccess {
    constructor() {
        this.isVisible = false;
        this.userSession = null;
        this.availableFeatures = new Map();

        console.log('🎨 [DASHBOARD-ACCESS] Inicializando panel de acceso admin...');

        this.initializeAccessPanel();
        this.loadUserSession();
        this.createAccessInterface();

        console.log('✅ [DASHBOARD-ACCESS] Panel de acceso creado exitosamente');
    }

    initializeAccessPanel() {
        this.availableFeatures.set('collaborative', {
            name: 'IA Colaborativa',
            icon: '🤝',
            description: 'Estudia en grupo con inteligencia artificial',
            requiresLogin: true,
            minLevel: 1,
            system: 'collaborativeAI'
        });

        this.availableFeatures.set('content_generator', {
            name: 'Generador de Contenido',
            icon: '📝',
            description: 'Crea ejercicios y materiales personalizados',
            requiresLogin: true,
            minLevel: 2,
            system: 'contentGeneratorAI'
        });

        this.availableFeatures.set('voice_recognition', {
            name: 'Dictado por Voz',
            icon: '🎤',
            description: 'Dicta con comandos de voz inteligentes',
            requiresLogin: false,
            minLevel: 1,
            system: 'voiceRecognitionAI'
        });

        this.availableFeatures.set('adaptive_tutor', {
            name: 'Tutor IA Adaptativo',
            icon: '🧠',
            description: 'Tutoría personalizada que se adapta a ti',
            requiresLogin: true,
            minLevel: 3,
            system: 'adaptiveAITutor'
        });

        this.availableFeatures.set('marketplace', {
            name: 'Marketplace de Conocimiento',
            icon: '🏪',
            description: 'Compra y vende contenido educativo',
            requiresLogin: true,
            minLevel: 5,
            system: 'knowledgeMarketplace'
        });

        this.availableFeatures.set('lab_simulator', {
            name: 'Laboratorios 3D',
            icon: '🔬',
            description: 'Experimentos virtuales interactivos',
            requiresLogin: true,
            minLevel: 4,
            system: 'labSimulator3D'
        });
    }

    createAccessInterface() {
        // Crear botón flotante de acceso
        this.createFloatingButton();

        // Crear panel principal
        this.createMainPanel();
    }

    createFloatingButton() {
        // Verificar si ya existe el botón
        const existingButton = document.getElementById('ia-access-button');
        if (existingButton) {
            console.log('🎨 [DASHBOARD-ACCESS] Botón ya existe, actualizando...');
            existingButton.remove();
        }

        // COMENTADO: No eliminar otros botones flotantes para mantener la barra inferior
        /*
        const conflictingButtons = document.querySelectorAll('[style*="position: fixed"][style*="bottom:"], .floating-button, .chat-button, .ai-button');
        conflictingButtons.forEach(btn => {
            if (btn.id !== 'ia-access-button' && btn.id !== 'chatbot-toggle') {
                console.log('🧹 [DASHBOARD-ACCESS] Removiendo botón flotante conflictivo:', btn.id || btn.className);
                btn.remove();
            }
        });
        */

        console.log('🎨 [DASHBOARD-ACCESS] Creando botón flotante admin...');

        const floatingButton = document.createElement('div');
        floatingButton.id = 'ia-access-button';
        floatingButton.className = 'ia-floating-button';
        floatingButton.innerHTML = `
            <div class="floating-btn-content">
                <span style="font-size: 20px; color: white;">🤖</span>
                <span style="font-size: 9px; color: white; font-weight: bold; margin-top: 1px;">IA</span>
            </div>
            <div class="floating-btn-pulse"></div>
        `;

        floatingButton.addEventListener('click', () => {
            this.toggleMainPanel();
        });

        document.body.appendChild(floatingButton);

        console.log('✅ [DASHBOARD-ACCESS] Botón flotante 🧠 IA creado y añadido al DOM');
    }

    createMainPanel() {
        const panel = document.createElement('div');
        panel.id = 'ia-dashboard-panel';
        panel.className = 'ia-dashboard-panel hidden';

        panel.innerHTML = `
            <div class="ia-panel-header">
                <h3><i class="fas fa-robot"></i> Centro de IA Académica</h3>
                <button class="close-panel" onclick="if(window.iaDashboard) window.iaDashboard.toggleMainPanel(); else this.closest('.ia-dashboard-panel').classList.add('hidden');">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="ia-panel-body">
                <div class="user-status">
                    <div id="user-info">
                        <span id="login-status">Inicia sesión para acceder a todas las funciones</span>
                    </div>
                </div>

                <div class="features-grid">
                    ${this.generateFeaturesHTML()}
                </div>

                <div class="ia-panel-footer">
                    <p class="text-muted">
                        <i class="fas fa-info-circle"></i>
                        Gana niveles completando actividades para desbloquear más funciones
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(panel);
    }

    generateFeaturesHTML() {
        let html = '';

        for (const [key, feature] of this.availableFeatures) {
            const isAvailable = this.checkFeatureAvailability(feature);
            const statusClass = isAvailable ? 'available' : 'locked';

            html += `
                <div class="feature-card ${statusClass}" data-feature="${key}">
                    <div class="feature-icon">${feature.icon}</div>
                    <div class="feature-content">
                        <h4>${feature.name}</h4>
                        <p>${feature.description}</p>
                        <div class="feature-requirements">
                            ${this.getRequirementsText(feature)}
                        </div>
                    </div>
                    <div class="feature-action">
                        ${isAvailable ?
                            `<button class="btn-launch" onclick="window.iaDashboard.launchFeature('${key}')">
                                <i class="fas fa-play"></i> Usar
                            </button>` :
                            `<div class="locked-indicator">
                                <i class="fas fa-lock"></i> Bloqueado
                            </div>`
                        }
                    </div>
                </div>
            `;
        }

        return html;
    }

    checkFeatureAvailability(feature) {
        // REGLA PRINCIPAL: Solo usuarios logueados con cuenta aprobada pueden usar IA
        if (!this.userSession) {
            return false;
        }

        // Verificar que la cuenta esté aprobada
        if (!this.userSession.accountApproved) {
            return false;
        }

        // Verificar nivel mínimo requerido
        const userLevel = this.userSession?.level || 0;
        return userLevel >= feature.minLevel;
    }

    getRequirementsText(feature) {
        const requirements = [];

        // Todos los sistemas requieren cuenta aprobada
        requirements.push('Cuenta aprobada');

        if (feature.minLevel > 1) {
            requirements.push(`Nivel ${feature.minLevel}+`);
        }

        return requirements.join(' • ');
    }

    async launchFeature(featureKey) {
        const feature = this.availableFeatures.get(featureKey);
        if (!feature) return;

        // Verificar disponibilidad
        if (!this.checkFeatureAvailability(feature)) {
            this.showAccessDenied(feature);
            return;
        }

        // Verificar que el sistema esté cargado
        if (!window[feature.system]) {
            this.showSystemNotLoaded(feature);
            return;
        }

        // Lanzar funcionalidad específica
        try {
            await this.executeLaunch(featureKey, feature);
        } catch (error) {
            console.error(`Error lanzando ${feature.name}:`, error);
            this.showError(`Error al lanzar ${feature.name}: ${error.message}`);
        }
    }

    async executeLaunch(featureKey, feature) {
        switch (featureKey) {
            case 'collaborative':
                this.launchCollaborativeIA();
                break;
            case 'content_generator':
                this.launchContentGenerator();
                break;
            case 'voice_recognition':
                this.launchVoiceRecognition();
                break;
            case 'adaptive_tutor':
                this.launchAdaptiveTutor();
                break;
            case 'marketplace':
                this.launchMarketplace();
                break;
            case 'lab_simulator':
                this.launchLabSimulator();
                break;
        }

        // Cerrar panel principal
        this.toggleMainPanel();
    }

    launchCollaborativeIA() {
        const modal = this.createLaunchModal('collaborative', {
            title: '🤝 IA Colaborativa - Crear Sala de Estudio',
            content: `
                <div class="launch-form">
                    <div class="form-group">
                        <label>Materia:</label>
                        <select id="collab-subject" class="form-control">
                            <option value="matematicas">Matemáticas</option>
                            <option value="fisica">Física</option>
                            <option value="quimica">Química</option>
                            <option value="biologia">Biología</option>
                            <option value="general">General</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Participantes máximos:</label>
                        <input type="number" id="collab-participants" class="form-control" value="4" min="2" max="8">
                    </div>
                    <div class="form-group">
                        <label>Duración (minutos):</label>
                        <input type="number" id="collab-duration" class="form-control" value="60" min="15" max="180">
                    </div>
                </div>
            `,
            action: () => {
                const subject = document.getElementById('collab-subject').value;
                const participants = parseInt(document.getElementById('collab-participants').value);
                const duration = parseInt(document.getElementById('collab-duration').value);

                window.collaborativeAI.createStudyRoom({
                    subject: subject,
                    maxParticipants: participants,
                    duration: duration,
                    creator: this.userSession?.email || 'anonymous'
                }).then(result => {
                    if (result.success) {
                        this.showSuccess(`Sala creada: ${result.roomId}`);
                    } else {
                        this.showError(result.error);
                    }
                });
            }
        });
    }

    launchContentGenerator() {
        const modal = this.createLaunchModal('content_generator', {
            title: '📝 Generador de Contenido - Crear Material',
            content: `
                <div class="launch-form">
                    <div class="form-group">
                        <label>Tipo de contenido:</label>
                        <select id="content-type" class="form-control">
                            <option value="ejercicios">Ejercicios</option>
                            <option value="resumenes">Resúmenes</option>
                            <option value="quizzes">Quizzes</option>
                            <option value="mapas_mentales">Mapas Mentales</option>
                            <option value="presentaciones">Presentaciones</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Materia:</label>
                        <select id="content-subject" class="form-control">
                            <option value="matematicas">Matemáticas</option>
                            <option value="fisica">Física</option>
                            <option value="quimica">Química</option>
                            <option value="biologia">Biología</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Dificultad:</label>
                        <select id="content-difficulty" class="form-control">
                            <option value="beginner">Principiante</option>
                            <option value="intermediate">Intermedio</option>
                            <option value="advanced">Avanzado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Cantidad:</label>
                        <input type="number" id="content-count" class="form-control" value="5" min="1" max="20">
                    </div>
                </div>
            `,
            action: () => {
                const type = document.getElementById('content-type').value;
                const subject = document.getElementById('content-subject').value;
                const difficulty = document.getElementById('content-difficulty').value;
                const count = parseInt(document.getElementById('content-count').value);

                window.contentGeneratorAI.generateContent(type, {
                    subject: subject,
                    difficulty: difficulty,
                    count: count,
                    userLevel: this.userSession?.level || 1
                }).then(result => {
                    if (result.success) {
                        this.showContentResult(result.content);
                    } else {
                        this.showError(result.error);
                    }
                });
            }
        });
    }

    launchVoiceRecognition() {
        if (window.voiceRecognitionAI.isRecordingActive()) {
            window.voiceRecognitionAI.stopRecording();
            this.showSuccess('Reconocimiento de voz detenido');
        } else {
            const context = prompt('¿En qué materia trabajarás? (matematicas/fisica/quimica/biologia/general)', 'general');
            if (context) {
                const started = window.voiceRecognitionAI.startRecording(context);
                if (started) {
                    this.showSuccess('Reconocimiento de voz activado. ¡Comienza a hablar!');
                } else {
                    this.showError('No se pudo activar el reconocimiento de voz');
                }
            }
        }
    }

    launchAdaptiveTutor() {
        const modal = this.createLaunchModal('adaptive_tutor', {
            title: '🧠 Tutor IA Adaptativo - Sesión Personalizada',
            content: `
                <div class="launch-form">
                    <div class="form-group">
                        <label>Materia:</label>
                        <select id="tutor-subject" class="form-control">
                            <option value="matematicas">Matemáticas</option>
                            <option value="fisica">Física</option>
                            <option value="quimica">Química</option>
                            <option value="biologia">Biología</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Tema específico:</label>
                        <input type="text" id="tutor-topic" class="form-control" placeholder="Ej: ecuaciones cuadráticas">
                    </div>
                    <div class="form-group">
                        <label>Nivel actual:</label>
                        <select id="tutor-level" class="form-control">
                            <option value="beginner">Principiante</option>
                            <option value="intermediate">Intermedio</option>
                            <option value="advanced">Avanzado</option>
                        </select>
                    </div>
                </div>
            `,
            action: () => {
                const subject = document.getElementById('tutor-subject').value;
                const topic = document.getElementById('tutor-topic').value;
                const level = document.getElementById('tutor-level').value;

                window.adaptiveAITutor.startTutoring({
                    subject: subject,
                    name: topic || 'Tema general',
                    content: { topic: topic }
                }, {
                    id: this.userSession?.email || 'anonymous',
                    level: level,
                    currentKnowledge: {}
                }).then(result => {
                    if (result.success) {
                        this.showTutorSession(result);
                    } else {
                        this.showError(result.error);
                    }
                });
            }
        });
    }

    launchMarketplace() {
        const modal = this.createLaunchModal('marketplace', {
            title: '🏪 Marketplace de Conocimiento',
            content: `
                <div class="launch-form">
                    <div class="marketplace-options">
                        <button class="btn btn-primary" onclick="window.iaDashboard.browseMarketplace()">
                            <i class="fas fa-search"></i> Explorar Productos
                        </button>
                        <button class="btn btn-success" onclick="window.iaDashboard.createProduct()">
                            <i class="fas fa-plus"></i> Vender Contenido
                        </button>
                        <button class="btn btn-info" onclick="window.iaDashboard.viewMyPurchases()">
                            <i class="fas fa-shopping-bag"></i> Mis Compras
                        </button>
                    </div>
                </div>
            `,
            action: () => {
                // Acciones específicas se manejan en los botones
            }
        });
    }

    launchLabSimulator() {
        const modal = this.createLaunchModal('lab_simulator', {
            title: '🔬 Simulador 3D de Laboratorios',
            content: `
                <div class="launch-form">
                    <div class="form-group">
                        <label>Laboratorio:</label>
                        <select id="lab-type" class="form-control">
                            <option value="physics">Laboratorio de Física</option>
                            <option value="chemistry">Laboratorio de Química</option>
                            <option value="biology">Laboratorio de Biología</option>
                            <option value="interdisciplinary">Lab. Interdisciplinario</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Experimento:</label>
                        <select id="lab-experiment" class="form-control">
                            <option value="hookes_law">Ley de Hooke</option>
                            <option value="acid_base_titration">Titulación Ácido-Base</option>
                            <option value="cell_division">División Celular</option>
                        </select>
                    </div>
                </div>
            `,
            action: () => {
                const labType = document.getElementById('lab-type').value;
                const experiment = document.getElementById('lab-experiment').value;

                window.labSimulator3D.initializeLab(labType).then(result => {
                    if (result.success) {
                        return window.labSimulator3D.startExperiment(experiment, 'intermediate');
                    }
                    throw new Error(result.error);
                }).then(result => {
                    if (result.success) {
                        this.showLabInterface(result.experiment);
                    } else {
                        this.showError(result.error);
                    }
                }).catch(error => {
                    this.showError(error.message);
                });
            }
        });
    }

    // Métodos de utilidad
    toggleMainPanel() {
        const panel = document.getElementById('ia-dashboard-panel');
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            this.isVisible = true;
            this.updateUserStatus();
        } else {
            panel.classList.add('hidden');
            this.isVisible = false;
        }
    }

    loadUserSession() {
        const session = localStorage.getItem('userSession');
        if (session) {
            try {
                this.userSession = JSON.parse(session);
            } catch (error) {
                console.error('Error cargando sesión:', error);
            }
        }
    }

    updateUserStatus() {
        const statusElement = document.getElementById('login-status');
        if (statusElement) {
            if (this.userSession) {
                if (this.userSession.accountApproved) {
                    statusElement.innerHTML = `
                        <div class="d-flex align-items-center justify-content-between">
                            <div>
                                <i class="fas fa-user-check" style="color: #28a745;"></i>
                                ${this.userSession.name} - Nivel ${this.userSession.level || 1}
                                <span class="badge bg-success ms-2">Aprobado</span>
                            </div>
                            <button onclick="handleLogout()" class="btn btn-outline-danger btn-sm" title="Cerrar Sesión">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    `;
                } else {
                    statusElement.innerHTML = `
                        <i class="fas fa-user-clock" style="color: #ffc107;"></i>
                        ${this.userSession.name} - Cuenta pendiente de aprobación
                        <span class="badge bg-warning ms-2">Pendiente</span>
                    `;
                }
            } else {
                statusElement.innerHTML = `
                    <i class="fas fa-sign-in-alt" style="color: #dc3545;"></i>
                    Debes iniciar sesión con Google en la página principal (index.html) para acceder a la IA
                    <div class="login-guide mt-2" style="font-size: 0.8rem; color: #666;">
                        💡 Ve a la página de inicio y busca el botón "Iniciar Sesión con Google"
                    </div>
                `;
            }
        }
    }

    createLaunchModal(featureKey, config) {
        const modal = document.createElement('div');
        modal.className = 'ia-launch-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h4>${config.title}</h4>
                    <button onclick="this.closest('.ia-launch-modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${config.content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.ia-launch-modal').remove()">
                        Cancelar
                    </button>
                    <button class="btn btn-primary" onclick="(${config.action.toString()})(); this.closest('.ia-launch-modal').remove();">
                        Lanzar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        return modal;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `ia-notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Métodos stub para funcionalidad completa
    showAccessDenied(feature) {
        if (!this.userSession) {
            this.showError(`Debes iniciar sesión con una cuenta aprobada para usar ${feature.name}`);
        } else if (!this.userSession.accountApproved) {
            this.showError(`Tu cuenta debe estar aprobada por los administradores para acceder a ${feature.name}. Contacta al personal académico.`);
        } else {
            this.showError(`${feature.name} requiere nivel ${feature.minLevel}. Continúa estudiando para subir de nivel.`);
        }
    }

    showSystemNotLoaded(feature) {
        this.showError(`Sistema ${feature.name} no cargado. Recarga la página.`);
    }

    showContentResult(content) {
        console.log('Contenido generado:', content);
        this.showSuccess('Contenido generado exitosamente');
    }

    showTutorSession(session) {
        console.log('Sesión de tutoría:', session);
        this.showSuccess('Sesión de tutoría iniciada');
    }

    showLabInterface(experiment) {
        console.log('Experimento iniciado:', experiment);
        this.showSuccess(`Experimento "${experiment.name}" iniciado`);
    }

    browseMarketplace() {
        console.log('Explorando marketplace...');
        this.showSuccess('Abriendo marketplace...');
    }

    createProduct() {
        console.log('Creando producto...');
        this.showSuccess('Abriendo creador de productos...');
    }

    viewMyPurchases() {
        console.log('Viendo compras...');
        this.showSuccess('Abriendo historial de compras...');
    }
}

// CSS para el panel de acceso
const iaDashboardCSS = `
    .ia-floating-button {
        position: fixed;
        bottom: 170px;
        left: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #00ffff 0%, #0080ff 50%, #0040ff 100%);
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 255, 255, 0.5), 0 0 30px rgba(0, 128, 255, 0.3);
        z-index: 1001;
        transition: all 0.3s ease;
        animation: float 3s ease-in-out infinite;
    }

    .ia-floating-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 255, 255, 0.7), 0 0 40px rgba(0, 128, 255, 0.5);
        background: linear-gradient(135deg, #00ffff 0%, #0080ff 30%, #0040ff 100%);
    }

    .floating-btn-content {
        color: white;
        text-align: center;
        font-weight: bold;
    }

    .floating-btn-content i {
        font-size: 18px;
        display: block;
        margin-bottom: 2px;
    }

    .floating-btn-content span {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .floating-btn-pulse {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(102, 126, 234, 0.4);
        animation: pulse 2s infinite;
    }

    .ia-dashboard-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1001;
        overflow: hidden;
    }

    .ia-dashboard-panel.hidden {
        display: none;
    }

    .ia-panel-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .ia-panel-header h3 {
        margin: 0;
        font-size: 1.5rem;
    }

    .close-panel {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        transition: opacity 0.3s;
    }

    .close-panel:hover {
        opacity: 0.7;
    }

    .ia-panel-body {
        padding: 20px;
        max-height: 60vh;
        overflow-y: auto;
    }

    .user-status {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        text-align: center;
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
    }

    .feature-card {
        background: white;
        border: 2px solid #e9ecef;
        border-radius: 10px;
        padding: 15px;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 15px;
    }

    .feature-card.available {
        border-color: #28a745;
        cursor: pointer;
    }

    .feature-card.available:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .feature-card.locked {
        opacity: 0.6;
        border-color: #dc3545;
    }

    .feature-icon {
        font-size: 2rem;
        min-width: 50px;
        text-align: center;
    }

    .feature-content {
        flex: 1;
    }

    .feature-content h4 {
        margin: 0 0 5px 0;
        font-size: 1.1rem;
        color: #333;
    }

    .feature-content p {
        margin: 0 0 5px 0;
        font-size: 0.9rem;
        color: #666;
    }

    .feature-requirements {
        font-size: 0.8rem;
        color: #888;
    }

    .feature-action {
        min-width: 80px;
    }

    .btn-launch {
        background: #28a745;
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s;
    }

    .btn-launch:hover {
        background: #218838;
    }

    .locked-indicator {
        color: #dc3545;
        text-align: center;
        font-size: 0.9rem;
    }

    .ia-launch-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1002;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
    }

    .modal-content {
        background: white;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        z-index: 1;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .modal-header {
        padding: 20px;
        border-bottom: 1px solid #e9ecef;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h4 {
        margin: 0;
    }

    .modal-header button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }

    .modal-body {
        padding: 20px;
    }

    .modal-footer {
        padding: 20px;
        border-top: 1px solid #e9ecef;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .launch-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    .form-group label {
        font-weight: bold;
        color: #333;
    }

    .form-control {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
    }

    .marketplace-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .marketplace-options button {
        padding: 15px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s;
    }

    .ia-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        z-index: 1003;
        animation: slideIn 0.3s ease;
    }

    .ia-notification.success {
        background: #28a745;
    }

    .ia-notification.error {
        background: #dc3545;
    }

    .ia-notification i {
        margin-right: 8px;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }

    @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
    }

    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }

    @media (max-width: 768px) {
        .ia-dashboard-panel {
            width: 95%;
            max-height: 90vh;
        }

        .features-grid {
            grid-template-columns: 1fr;
        }

        .feature-card {
            flex-direction: column;
            text-align: center;
            gap: 10px;
        }

        .ia-floating-button {
            bottom: 100px;
            left: 15px;
        }
    }
`;

// Inyectar CSS
const styleElement = document.createElement('style');
styleElement.textContent = iaDashboardCSS;
document.head.appendChild(styleElement);

// Función global para cerrar sesión
function handleLogout() {
    // Limpiar todas las sesiones
    localStorage.removeItem('bge_user');
    localStorage.removeItem('userSession');

    // Limpiar datos de progreso
    const currentUser = JSON.parse(localStorage.getItem('bge_user') || '{}');
    if (currentUser.email) {
        localStorage.removeItem(`bge_progress_${currentUser.email}`);
    }

    // Reiniciar estado del sistema de autenticación
    if (window.googleAuth) {
        window.googleAuth.logout();
    }

    // Recargar página para reiniciar todo el estado
    window.location.reload();
}

// Inicialización condicional para asegurar que funcione correctamente
function initIADashboardAccess() {
    if (!window.iaDashboard) {
        window.iaDashboard = new IADashboardAccess();
        console.log('🎯 Panel de Acceso a IA cargado correctamente');
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIADashboardAccess);
} else {
    initIADashboardAccess();
}