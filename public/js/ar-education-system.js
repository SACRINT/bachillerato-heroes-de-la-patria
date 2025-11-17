/**
 * 🥽 AR EDUCATION SYSTEM - FASE 7.1
 * Sistema de Realidad Aumentada para window.getTenantConfigValue('school_name', 'BGE Héroes de la Patria')
 * Experiencias inmersivas de aprendizaje con AR y tecnologías emergentes
 */

class AREducationSystem {
    constructor() {
        this.arSupport = {
            webxr: false,
            webgl: false,
            camera: false,
            sensors: false,
            available: false
        };

        this.arExperiences = {
            mathematics: {
                name: 'Matemáticas AR',
                scenarios: ['geometry_3d', 'function_graphs', 'statistics_visual', 'algebra_interactive'],
                difficulty: ['basic', 'intermediate', 'advanced'],
                models: ['cube', 'sphere', 'pyramid', 'graphs']
            },
            sciences: {
                name: 'Ciencias AR',
                scenarios: ['molecular_models', 'anatomy_3d', 'physics_experiments', 'chemistry_lab'],
                difficulty: ['basic', 'intermediate', 'advanced'],
                models: ['atom', 'cell', 'solar_system', 'periodic_table']
            },
            history: {
                name: 'Historia AR',
                scenarios: ['historical_sites', 'ancient_civilizations', 'mexican_independence', 'revolution'],
                difficulty: ['basic', 'intermediate', 'advanced'],
                models: ['monuments', 'historical_figures', 'artifacts', 'battlefields']
            },
            arts: {
                name: 'Artes AR',
                scenarios: ['sculpture_view', 'painting_analysis', 'architecture_tour', 'music_visualization'],
                difficulty: ['basic', 'intermediate', 'advanced'],
                models: ['sculptures', 'paintings', 'buildings', 'instruments']
            }
        };

        this.activeSession = null;
        this.trackingData = {};
        this.performanceMetrics = {};
        this.userProgress = {};

        this.config = {
            enableHandTracking: true,
            enableFaceTracking: false,
            enableEnvironmentMapping: true,
            enableOcclusion: true,
            renderQuality: 'medium', // low, medium, high, ultra
            maxConcurrentModels: 5,
            autoSaveProgress: true
        };

        this.init();
    }

    async init() {
        await this.detectARCapabilities();
        this.initializeARFramework();
        this.loadUserProgress();
        this.setupInteractionHandlers();
        this.createARInterface();

        console.log('🥽 AR Education System inicializado');
        console.log(`📱 Capacidades AR: ${this.arSupport.available ? 'Disponibles' : 'Limitadas'}`);
    }

    loadUserProgress() {
        try {
            const savedProgress = localStorage.getItem('ar_education_progress');
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            } else {
                this.userProgress = {
                    completedExperiences: [],
                    totalTime: 0,
                    achievements: [],
                    currentLevel: 1,
                    lastAccess: new Date().toISOString()
                };
            }
        } catch (error) {
            console.warn('Error loading user progress:', error);
            this.userProgress = {
                completedExperiences: [],
                totalTime: 0,
                achievements: [],
                currentLevel: 1,
                lastAccess: new Date().toISOString()
            };
        }
    }

    saveUserProgress() {
        try {
            this.userProgress.lastAccess = new Date().toISOString();
            localStorage.setItem('ar_education_progress', JSON.stringify(this.userProgress));
        } catch (error) {
            console.warn('Error saving user progress:', error);
        }
    }

    setupInteractionHandlers() {
        // Configurar manejadores de eventos para interacción AR
        document.addEventListener('click', (event) => {
            // Manejar clics en elementos AR
            if (event.target.classList.contains('ar-trigger')) {
                event.preventDefault();
                this.handleARInteraction(event.target);
            }
        });

        // Manejar gestos táctiles
        document.addEventListener('touchstart', (event) => {
            if (event.target.classList.contains('ar-element')) {
                this.handleTouchInteraction(event);
            }
        });

        // Configurar controles del visor 3D
        this.setupViewerControls();
    }

    handleARInteraction(element) {
        const experienceId = element.dataset.experienceId;
        if (experienceId) {
            this.startARExperience(experienceId);
        }
    }

    handleTouchInteraction(event) {
        // Manejar interacciones táctiles en elementos AR
        event.preventDefault();
        console.log('🖐️ Touch interaction detected on AR element');
    }

    setupViewerControls() {
        // Configurar controles del visor 3D fallback
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('control-btn')) {
                const action = event.target.dataset.action;
                this.handleViewerControl(action);
            }
        });
    }

    handleViewerControl(action) {
        console.log(`🎮 Viewer control: ${action}`);
        // Implementar acciones de control del visor
        switch (action) {
            case 'rotate-left':
            case 'rotate-right':
            case 'zoom-in':
            case 'zoom-out':
                // Simular control del modelo 3D
                break;
        }
    }

    // === DETECCIÓN DE CAPACIDADES ===

    async detectARCapabilities() {
        // Verificar soporte WebXR
        if ('xr' in navigator) {
            try {
                this.arSupport.webxr = await navigator.xr.isSessionSupported('immersive-ar');
            } catch (error) {
                console.warn('WebXR no soportado:', error);
            }
        }

        // Verificar WebGL
        this.arSupport.webgl = this.checkWebGLSupport();

        // Verificar acceso a cámara
        this.arSupport.camera = await this.checkCameraAccess();

        // Verificar sensores
        this.arSupport.sensors = this.checkSensorSupport();

        // Determinar disponibilidad general
        this.arSupport.available = this.arSupport.webgl &&
                                   (this.arSupport.webxr || this.arSupport.camera);

        console.log('🔍 Capacidades AR detectadas:', this.arSupport);
    }

    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (error) {
            return false;
        }
    }

    async checkCameraAccess() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return false;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            // Detener el stream inmediatamente
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            // Manejar error de cámara de forma inteligente
            if (error.name === 'NotFoundError') {
                console.log('📷 Cámara no detectada - activando modo simulación');
            } else if (error.name === 'NotAllowedError') {
                console.log('🔒 Permisos de cámara denegados - usando fallback');
            } else {
                console.log('⚠️ Error de cámara:', error.name, '- continuando sin cámara');
            }

            // Configurar modo alternativo automáticamente
            this.setupCameraFallback();
            return false;
        }
    }

    setupCameraFallback() {
        // Configurar sistema de simulación avanzado cuando no hay cámara
        console.log('🎭 Configurando sistema de simulación AR avanzado...');

        // Habilitar controles de ratón/teclado para simular AR
        this.enableMouseKeyboardControls();

        // Crear indicador visual de modo simulación
        this.createSimulationIndicator();

        // Configurar experiencias AR alternativas
        this.setupAlternativeARExperience();
    }

    enableMouseKeyboardControls() {
        // Implementar controles alternativos
        document.addEventListener('keydown', (event) => {
            switch(event.key) {
                case 'ArrowUp':
                    this.simulateARMovement('forward');
                    break;
                case 'ArrowDown':
                    this.simulateARMovement('backward');
                    break;
                case 'ArrowLeft':
                    this.simulateARMovement('left');
                    break;
                case 'ArrowRight':
                    this.simulateARMovement('right');
                    break;
            }
        });
    }

    simulateARMovement(direction) {
        console.log(`🎮 Simulando movimiento AR: ${direction}`);
        // Aquí se implementaría la lógica de movimiento simulado
    }

    createSimulationIndicator() {
        // Crear indicador visual
        const indicator = document.createElement('div');
        indicator.id = 'ar-simulation-indicator';

        // ✅ FALLBACK si DOMPurify no está disponible
        const indicatorText = '🎭 Modo Simulación AR Activo';
        if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
            indicator.innerHTML = DOMPurify.sanitize(indicatorText);
        } else {
            indicator.textContent = indicatorText;
            if (typeof debugLog !== 'undefined') {
                debugLog.warn('⚠️ DOMPurify no disponible en createSimulationIndicator, usando fallback');
            }
        }

        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ffa726;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 9999;
            opacity: 0.9;
        `;
        document.body.appendChild(indicator);

        // Ocultar después de 5 segundos
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 5000);
    }

    setupAlternativeARExperience() {
        // Configurar experiencias que no requieren cámara
        this.alternativeMode = true;
        console.log('✨ Experiencia AR alternativa configurada');
    }

    checkSensorSupport() {
        return 'DeviceOrientationEvent' in window &&
               'DeviceMotionEvent' in window;
    }

    // === FRAMEWORK AR ===

    async initializeARFramework() {
        if (!this.arSupport.available) {
            console.log('📱 Activando modo de simulación AR interactivo - ¡Experiencia alternativa disponible!');
            this.initializeFallbackMode();
            return;
        }

        try {
            // Configurar Three.js como base
            await this.setupThreeJS();

            // Configurar detector de marcadores
            this.setupMarkerDetection();

            // Configurar tracking
            this.setupTracking();

            // Cargar modelos 3D
            await this.loadARModels();

        } catch (error) {
            console.error('Error inicializando framework AR:', error);
            this.initializeFallbackMode();
        }
    }

    async setupThreeJS() {
        // Simulación de configuración Three.js
        // En producción se cargarían las librerías reales
        this.renderer = {
            type: 'THREE_WebGLRenderer',
            antialias: true,
            alpha: true,
            precision: 'mediump'
        };

        this.scene = {
            type: 'THREE_Scene',
            background: null, // Transparente para AR
            fog: null
        };

        this.camera = {
            type: 'THREE_PerspectiveCamera',
            fov: 70,
            aspect: window.innerWidth / window.innerHeight,
            near: 0.01,
            far: 1000
        };

        console.log('🎬 Three.js configurado para AR');
    }

    setupMarkerDetection() {
        // Configurar detección de marcadores AR
        this.markerSystem = {
            enabled: true,
            markers: [
                { id: 'bge_logo', pattern: 'bge_marker.patt', size: 0.08 },
                { id: 'math_marker', pattern: 'math_marker.patt', size: 0.08 },
                { id: 'science_marker', pattern: 'science_marker.patt', size: 0.08 },
                { id: 'history_marker', pattern: 'history_marker.patt', size: 0.08 }
            ],
            detectionMode: 'mono_and_matrix',
            matrixCodeType: '3x3',
            confidenceThreshold: 0.6
        };

        console.log('🎯 Sistema de marcadores configurado');
    }

    setupTracking() {
        this.trackingSystem = {
            positionTracking: true,
            rotationTracking: true,
            planeDetection: this.arSupport.webxr,
            lightEstimation: this.arSupport.webxr,
            occlusionDetection: this.config.enableOcclusion,
            handTracking: this.config.enableHandTracking && this.arSupport.webxr
        };

        console.log('📍 Sistema de tracking configurado');
    }

    async loadARModels() {
        // Cargar modelos 3D para experiencias AR
        this.modelLibrary = {
            mathematics: {
                'cube': { url: '/models/math/cube.glb', loaded: false },
                'sphere': { url: '/models/math/sphere.glb', loaded: false },
                'pyramid': { url: '/models/math/pyramid.glb', loaded: false },
                'graph': { url: '/models/math/function_graph.glb', loaded: false }
            },
            sciences: {
                'atom': { url: '/models/science/hydrogen_atom.glb', loaded: false },
                'cell': { url: '/models/science/plant_cell.glb', loaded: false },
                'dna': { url: '/models/science/dna_helix.glb', loaded: false },
                'solar_system': { url: '/models/science/solar_system.glb', loaded: false }
            },
            history: {
                'pyramid_teotihuacan': { url: '/models/history/teotihuacan.glb', loaded: false },
                'aztec_calendar': { url: '/models/history/aztec_calendar.glb', loaded: false },
                'independence_bell': { url: '/models/history/dolores_bell.glb', loaded: false }
            },
            arts: {
                'david_sculpture': { url: '/models/arts/david.glb', loaded: false },
                'guitar': { url: '/models/arts/classical_guitar.glb', loaded: false },
                'palette': { url: '/models/arts/paint_palette.glb', loaded: false }
            }
        };

        // Simular carga de modelos
        for (const [subject, models] of Object.entries(this.modelLibrary)) {
            for (const [name, model] of Object.entries(models)) {
                try {
                    await this.loadModel(model.url);
                    model.loaded = true;
                    console.log(`📦 Modelo cargado: ${subject}/${name}`);
                } catch (error) {
                    console.warn(`⚠️ Error cargando modelo ${name}:`, error);
                }
            }
        }
    }

    async loadModel(url) {
        // Simulación de carga de modelo
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

        // En producción usaría GLTFLoader de Three.js
        return {
            url: url,
            geometry: 'simulated_geometry',
            material: 'simulated_material',
            animations: [],
            loadTime: Date.now()
        };
    }

    // === EXPERIENCIAS AR ===

    async startARExperience(subject, scenario, difficulty = 'basic') {
        if (!this.arExperiences[subject]) {
            throw new Error(`Materia no disponible: ${subject}`);
        }

        const experience = this.arExperiences[subject];

        if (!experience.scenarios.includes(scenario)) {
            throw new Error(`Escenario no disponible: ${scenario}`);
        }

        console.log(`🚀 Iniciando experiencia AR: ${experience.name} - ${scenario}`);

        try {
            // Preparar sesión AR
            this.activeSession = await this.createARSession(subject, scenario, difficulty);

            // Configurar entorno
            await this.setupAREnvironment(this.activeSession);

            // Cargar contenido específico
            await this.loadExperienceContent(this.activeSession);

            // Iniciar tracking
            this.startTracking();

            // Mostrar interfaz AR
            this.showARInterface();

            console.log(`✅ Experiencia AR iniciada: ${this.activeSession.id}`);
            return this.activeSession;

        } catch (error) {
            console.error('Error iniciando experiencia AR:', error);
            throw error;
        }
    }

    async createARSession(subject, scenario, difficulty) {
        const sessionId = `ar_${subject}_${scenario}_${Date.now()}`;

        const session = {
            id: sessionId,
            subject: subject,
            scenario: scenario,
            difficulty: difficulty,
            startTime: Date.now(),
            duration: 0,
            status: 'active',
            user: this.getCurrentUser(),
            interactions: [],
            achievements: [],
            models: [],
            score: 0,
            progress: 0
        };

        // Configuración específica por escenario
        await this.configureScenario(session, scenario);

        return session;
    }

    async configureScenario(session, scenario) {
        const configurations = {
            // Matemáticas
            'geometry_3d': {
                models: ['cube', 'sphere', 'pyramid'],
                interactions: ['rotate', 'scale', 'measure', 'section'],
                objectives: ['Identificar propiedades geométricas', 'Calcular volúmenes', 'Analizar secciones'],
                duration: 900 // 15 minutos
            },
            'function_graphs': {
                models: ['graph'],
                interactions: ['modify_parameters', 'analyze_behavior', 'find_roots'],
                objectives: ['Comprender funciones', 'Analizar comportamiento', 'Resolver ecuaciones'],
                duration: 1200 // 20 minutos
            },

            // Ciencias
            'molecular_models': {
                models: ['atom', 'dna'],
                interactions: ['examine_structure', 'build_molecules', 'simulate_reactions'],
                objectives: ['Comprender estructura atómica', 'Construir moléculas', 'Observar reacciones'],
                duration: 1800 // 30 minutos
            },
            'anatomy_3d': {
                models: ['cell'],
                interactions: ['explore_organelles', 'zoom_in_out', 'compare_types'],
                objectives: ['Identificar organelos', 'Comprender funciones', 'Comparar células'],
                duration: 1500 // 25 minutos
            },

            // Historia
            'historical_sites': {
                models: ['pyramid_teotihuacan'],
                interactions: ['virtual_tour', 'time_travel', 'information_points'],
                objectives: ['Explorar sitios históricos', 'Comprender contexto', 'Analizar arquitectura'],
                duration: 2100 // 35 minutos
            },
            'mexican_independence': {
                models: ['independence_bell'],
                interactions: ['timeline_navigation', 'character_interaction', 'event_recreation'],
                objectives: ['Comprender cronología', 'Conocer personajes', 'Analizar eventos'],
                duration: 1800 // 30 minutos
            }
        };

        const config = configurations[scenario];
        if (config) {
            session.configuration = config;
            session.estimatedDuration = config.duration;
            session.objectives = config.objectives;
            session.availableInteractions = config.interactions;
            session.modelsToLoad = config.models;
        }
    }

    async setupAREnvironment(session) {
        // Configurar cámara AR
        await this.setupARCamera();

        // Configurar iluminación
        this.setupLighting(session);

        // Configurar planos de detección
        if (this.trackingSystem.planeDetection) {
            await this.setupPlaneDetection();
        }

        // Configurar oclusión
        if (this.trackingSystem.occlusionDetection) {
            this.setupOcclusion();
        }

        console.log('🏗️ Entorno AR configurado');
    }

    async setupARCamera() {
        if (this.arSupport.webxr) {
            // Usar cámara WebXR
            this.arCamera = await this.initializeWebXRCamera();
        } else if (this.arSupport.camera) {
            // Usar getUserMedia
            this.arCamera = await this.initializeWebCamera();
        }
    }

    async initializeWebXRCamera() {
        // Simulación de inicialización WebXR
        return {
            type: 'WebXR',
            session: 'immersive-ar',
            features: ['local-floor', 'hand-tracking', 'plane-detection'],
            initialized: true
        };
    }

    async initializeWebCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            return {
                type: 'WebCamera',
                stream: stream,
                width: 1280,
                height: 720,
                initialized: true
            };
        } catch (error) {
            throw new Error(`Error inicializando cámara: ${error.message}`);
        }
    }

    setupLighting(session) {
        // Configurar iluminación adaptativa
        this.lighting = {
            ambient: {
                type: 'ambient',
                color: 0x404040,
                intensity: 0.4
            },
            directional: {
                type: 'directional',
                color: 0xffffff,
                intensity: 0.8,
                position: [10, 10, 5],
                castShadow: true
            },
            environment: {
                type: 'environment',
                enabled: this.trackingSystem.lightEstimation,
                adaptive: true
            }
        };

        console.log('💡 Iluminación AR configurada');
    }

    async loadExperienceContent(session) {
        const modelsToLoad = session.modelsToLoad || [];

        for (const modelName of modelsToLoad) {
            try {
                const model = await this.loadARModel(session.subject, modelName);
                session.models.push(model);
                console.log(`📦 Modelo cargado en sesión: ${modelName}`);
            } catch (error) {
                console.warn(`⚠️ Error cargando modelo ${modelName}:`, error);
            }
        }

        // Configurar interacciones específicas
        this.setupSessionInteractions(session);

        // Cargar contenido educativo
        await this.loadEducationalContent(session);
    }

    async loadARModel(subject, modelName) {
        const modelData = this.modelLibrary[subject]?.[modelName];

        if (!modelData || !modelData.loaded) {
            throw new Error(`Modelo no disponible: ${subject}/${modelName}`);
        }

        // Simular instanciación del modelo en la escena
        const instance = {
            name: modelName,
            subject: subject,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            visible: true,
            interactive: true,
            animations: [],
            metadata: modelData
        };

        return instance;
    }

    setupSessionInteractions(session) {
        const interactionHandlers = {
            rotate: (model, data) => this.handleRotateInteraction(model, data),
            scale: (model, data) => this.handleScaleInteraction(model, data),
            measure: (model, data) => this.handleMeasureInteraction(model, data),
            examine_structure: (model, data) => this.handleExamineInteraction(model, data),
            virtual_tour: (model, data) => this.handleTourInteraction(model, data),
            time_travel: (model, data) => this.handleTimeTravel(model, data)
        };

        session.interactionHandlers = interactionHandlers;
    }

    async loadEducationalContent(session) {
        // Cargar contenido educativo contextual
        const contentTypes = {
            'geometry_3d': await this.loadGeometryContent(),
            'molecular_models': await this.loadMolecularContent(),
            'historical_sites': await this.loadHistoricalContent()
        };

        session.educationalContent = contentTypes[session.scenario] || {};
    }

    // === INTERACCIONES AR ===

    handleRotateInteraction(model, data) {
        if (!model || !data.rotation) return;

        model.rotation = [
            model.rotation[0] + data.rotation.x,
            model.rotation[1] + data.rotation.y,
            model.rotation[2] + data.rotation.z
        ];

        this.logInteraction('rotate', model.name, data);
    }

    handleScaleInteraction(model, data) {
        if (!model || !data.scale) return;

        const scaleFactor = Math.max(0.1, Math.min(5.0, data.scale));
        model.scale = [scaleFactor, scaleFactor, scaleFactor];

        this.logInteraction('scale', model.name, data);
    }

    handleMeasureInteraction(model, data) {
        // Simular medición de propiedades del modelo
        const measurements = {
            volume: this.calculateVolume(model),
            surface_area: this.calculateSurfaceArea(model),
            dimensions: this.getDimensions(model)
        };

        this.showMeasurements(measurements);
        this.logInteraction('measure', model.name, { measurements });
    }

    handleExamineInteraction(model, data) {
        // Mostrar información detallada del modelo
        const information = this.getModelInformation(model);
        this.showInformationPanel(information);

        this.logInteraction('examine', model.name, data);
    }

    handleTourInteraction(model, data) {
        // Iniciar tour virtual del modelo
        this.startVirtualTour(model, data.waypoints);
        this.logInteraction('tour', model.name, data);
    }

    handleTimeTravel(model, data) {
        // Simular viaje en el tiempo para modelos históricos
        this.animateTimeTransition(model, data.targetPeriod);
        this.logInteraction('time_travel', model.name, data);
    }

    // === TRACKING Y RENDIMIENTO ===

    startTracking() {
        if (!this.activeSession) return;

        this.trackingInterval = setInterval(() => {
            this.updateTracking();
            this.updatePerformanceMetrics();
            this.checkAchievements();
        }, 100); // 10 FPS de tracking

        console.log('📍 Tracking iniciado');
    }

    stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        console.log('⏹️ Tracking detenido');
    }

    updateTracking() {
        if (!this.activeSession) return;

        // Simular datos de tracking
        this.trackingData = {
            timestamp: Date.now(),
            cameraPosition: this.getCameraPosition(),
            cameraRotation: this.getCameraRotation(),
            detectedMarkers: this.getDetectedMarkers(),
            handPositions: this.getHandPositions(),
            facePosition: this.getFacePosition(),
            environmentPlanes: this.getDetectedPlanes()
        };

        // Actualizar posiciones de modelos basado en tracking
        this.updateModelPositions();
    }

    updatePerformanceMetrics() {
        this.performanceMetrics = {
            timestamp: Date.now(),
            fps: this.calculateFPS(),
            renderTime: this.getRenderTime(),
            trackingLatency: this.getTrackingLatency(),
            memoryUsage: this.getMemoryUsage(),
            batteryLevel: this.getBatteryLevel()
        };

        // Ajustar calidad automáticamente si es necesario
        this.adjustRenderQuality();
    }

    adjustRenderQuality() {
        const fps = this.performanceMetrics.fps;
        const currentQuality = this.config.renderQuality;

        if (fps < 20 && currentQuality !== 'low') {
            this.config.renderQuality = 'low';
            console.log('📉 Calidad reducida a LOW para mantener rendimiento');
        } else if (fps > 50 && currentQuality === 'low') {
            this.config.renderQuality = 'medium';
            console.log('📈 Calidad aumentada a MEDIUM');
        }
    }

    // === INTERFAZ AR ===

    createARInterface() {
        // Crear interfaz de usuario para AR
        const arInterface = document.createElement('div');
        arInterface.id = 'ar-interface';
        arInterface.className = 'ar-interface hidden';

        arInterface.innerHTML = DOMPurify.sanitize(`
            <div class="ar-controls">
                <button class="ar-btn start-ar" id="start-ar-btn">
                    <i class="fas fa-cube"></i>
                    Iniciar AR
                </button>
                <button class="ar-btn stop-ar" id="stop-ar-btn" style="display: none;">
                    <i class="fas fa-stop"></i>
                    Detener AR
                </button>
                <button class="ar-btn close-ar" id="close-ar-btn">
                    <i class="fas fa-times"></i>
                    Cerrar
                </button>
            </div>

            <div class="ar-experience-selector" id="ar-selector" style="display: none;">
                <h3>Selecciona una Experiencia AR</h3>
                <div class="subject-tabs">
                    <button class="subject-tab active" data-subject="mathematics">Matemáticas</button>
                    <button class="subject-tab" data-subject="sciences">Ciencias</button>
                    <button class="subject-tab" data-subject="history">Historia</button>
                    <button class="subject-tab" data-subject="arts">Artes</button>
                </div>
                <div class="scenarios-grid" id="scenarios-grid">
                    <!-- Scenarios will be populated dynamically -->
                </div>
            </div>

            <div class="ar-session-ui" id="ar-session-ui" style="display: none;">
                <div class="session-header">
                    <div class="session-info">
                        <h4 id="session-title">Experiencia AR</h4>
                        <div class="session-stats">
                            <span id="session-time">00:00</span>
                            <span id="session-score">Puntos: 0</span>
                        </div>
                    </div>
                    <button class="close-session" id="close-session">×</button>
                </div>

                <div class="ar-tools">
                    <button class="ar-tool" data-tool="rotate" title="Rotar">🔄</button>
                    <button class="ar-tool" data-tool="scale" title="Escalar">📏</button>
                    <button class="ar-tool" data-tool="measure" title="Medir">📐</button>
                    <button class="ar-tool" data-tool="info" title="Información">ℹ️</button>
                </div>

                <div class="ar-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <div class="objectives-list" id="objectives-list">
                        <!-- Objectives will be populated dynamically -->
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(arInterface);
        this.setupAREventListeners();

        // Crear botón de activación
        this.createARActivationButton();
    }

    createARActivationButton() {
        const activationBtn = document.createElement('div');
        activationBtn.id = 'ar-activation';
        activationBtn.className = 'ar-activation';
        activationBtn.innerHTML = DOMPurify.sanitize(`
            <div class="activation-content">
                <div class="ar-icon">🥽</div>
                <div class="ar-status-dot available"></div>
            </div>
        `);

        activationBtn.addEventListener('click', () => this.toggleARInterface());
        document.body.appendChild(activationBtn);
    }

    setupAREventListeners() {
        // Controles principales - con validación de existencia
        const startBtn = document.getElementById('start-ar-btn');
        const stopBtn = document.getElementById('stop-ar-btn');
        const closeBtn = document.getElementById('close-ar-btn');
        const closeSessionBtn = document.getElementById('close-session');

        if (startBtn) startBtn.addEventListener('click', () => this.show3DViewer());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stopARSession());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeARInterface());
        if (closeSessionBtn) closeSessionBtn.addEventListener('click', () => this.stopARSession());

        // Tabs de materias
        document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.selectSubject(e.target.dataset.subject));
        });

        // Herramientas AR
        document.querySelectorAll('.ar-tool').forEach(tool => {
            tool.addEventListener('click', (e) => this.selectTool(e.target.dataset.tool));
        });

        // Touch gestures para dispositivos móviles
        this.setupTouchGestures();
    }

    setupTouchGestures() {
        let startX, startY, startDistance;

        document.addEventListener('touchstart', (e) => {
            if (!this.activeSession) return;

            if (e.touches.length === 1) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                startDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.activeSession) return;

            if (e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;
                this.handleRotateGesture(deltaX, deltaY);
            } else if (e.touches.length === 2) {
                const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleFactor = currentDistance / startDistance;
                this.handleScaleGesture(scaleFactor);
            }
        });
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleRotateGesture(deltaX, deltaY) {
        if (this.activeSession && this.activeSession.models.length > 0) {
            const model = this.activeSession.models[0];
            this.handleRotateInteraction(model, {
                rotation: {
                    x: deltaY * 0.01,
                    y: deltaX * 0.01,
                    z: 0
                }
            });
        }
    }

    handleScaleGesture(scaleFactor) {
        if (this.activeSession && this.activeSession.models.length > 0) {
            const model = this.activeSession.models[0];
            this.handleScaleInteraction(model, {
                scale: scaleFactor
            });
        }
    }

    // === UTILIDADES ===

    calculateVolume(model) {
        // Simular cálculo de volumen
        const scale = model.scale[0];
        const baseVolumes = {
            cube: 1.0,
            sphere: 4.19,
            pyramid: 0.33
        };
        return (baseVolumes[model.name] || 1.0) * Math.pow(scale, 3);
    }

    calculateSurfaceArea(model) {
        // Simular cálculo de área superficial
        const scale = model.scale[0];
        const baseAreas = {
            cube: 6.0,
            sphere: 12.57,
            pyramid: 4.8
        };
        return (baseAreas[model.name] || 1.0) * Math.pow(scale, 2);
    }

    getDimensions(model) {
        const scale = model.scale[0];
        return {
            width: 1.0 * scale,
            height: 1.0 * scale,
            depth: 1.0 * scale
        };
    }

    getModelInformation(model) {
        const infoDatabase = {
            cube: {
                name: 'Cubo',
                description: 'Un poliedro regular con 6 caras cuadradas',
                properties: ['6 caras', '8 vértices', '12 aristas'],
                formula_volume: 'V = a³',
                formula_area: 'A = 6a²'
            },
            sphere: {
                name: 'Esfera',
                description: 'Un sólido geométrico perfectamente redondo',
                properties: ['1 superficie curva', 'Infinitos puntos equidistantes del centro'],
                formula_volume: 'V = (4/3)πr³',
                formula_area: 'A = 4πr²'
            },
            atom: {
                name: 'Átomo de Hidrógeno',
                description: 'El átomo más simple, con un protón y un electrón',
                properties: ['1 protón', '1 electrón', 'Número atómico: 1'],
                characteristics: 'Elemento más abundante del universo'
            }
        };

        return infoDatabase[model.name] || {
            name: model.name,
            description: 'Modelo 3D interactivo',
            properties: []
        };
    }

    getCurrentUser() {
        // Obtener datos del usuario actual
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.warn('Error parsing user data:', error);
            }
        }

        return {
            id: 'anonymous',
            name: 'Usuario Anónimo',
            level: 'student'
        };
    }

    logInteraction(type, target, data) {
        if (!this.activeSession) return;

        const interaction = {
            type: type,
            target: target,
            data: data,
            timestamp: Date.now()
        };

        this.activeSession.interactions.push(interaction);

        // Actualizar puntuación
        this.updateScore(type);

        console.log(`🎯 Interacción registrada: ${type} en ${target}`);
    }

    updateScore(interactionType) {
        if (!this.activeSession) return;

        const scoreMap = {
            rotate: 5,
            scale: 5,
            measure: 15,
            examine: 10,
            tour: 20,
            time_travel: 25
        };

        const points = scoreMap[interactionType] || 1;
        this.activeSession.score += points;

        // Actualizar UI
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        const scoreElement = document.getElementById('session-score');
        if (scoreElement && this.activeSession) {
            scoreElement.textContent = `Puntos: ${this.activeSession.score}`;
        }
    }

    // === FALLBACK PARA DISPOSITIVOS SIN AR ===

    initializeFallbackMode() {
        console.log('📱 Iniciando modo de simulación AR');

        this.fallbackMode = {
            enabled: true,
            use3DViewer: true,
            useVirtualControls: true,
            simulateTracking: true
        };

        // Crear visor 3D alternativo
        this.create3DViewer();
    }

    create3DViewer() {
        // Crear interfaz de visor 3D para dispositivos sin AR
        const viewer = document.createElement('div');
        viewer.id = 'ar-fallback-viewer';
        viewer.className = 'ar-fallback-viewer';
        viewer.innerHTML = DOMPurify.sanitize(`
            <div class="viewer-header">
                <h3>🖥️ Visor 3D (Modo Simulación)</h3>
                <button class="close-viewer-btn" onclick="this.closest('#ar-fallback-viewer').style.display='none';">✕</button>
                <p>Tu dispositivo no soporta AR, pero puedes interactuar con los modelos 3D</p>
            </div>
            <div class="viewer-content">
                <div class="model-viewport">
                    <div class="model-placeholder">
                        <i class="fas fa-cube"></i>
                        <p>Selecciona una experiencia para comenzar</p>
                    </div>
                </div>
                <div class="virtual-controls">
                    <button class="control-btn" data-action="rotate-left">↺</button>
                    <button class="control-btn" data-action="rotate-right">↻</button>
                    <button class="control-btn" data-action="zoom-in">🔍+</button>
                    <button class="control-btn" data-action="zoom-out">🔍-</button>
                </div>
            </div>
        `);

        // OCULTAR POR DEFECTO - Solo mostrar cuando usuario lo active
        viewer.style.display = 'none';
        document.body.appendChild(viewer);
    }

    show3DViewer() {
        // Redirigir al Laboratorio AR/VR completo
        console.log('🥽 Redirigiendo al Laboratorio AR/VR completo');

        // Abrir en nueva ventana para mantener la página actual
        window.open('ar-vr-lab.html', '_blank');

        // Alternativamente, navegar en la misma ventana:
        // window.location.href = 'ar-vr-lab.html';
    }

    // === SIMULACIÓN DE DATOS ===

    getCameraPosition() {
        return [
            Math.sin(Date.now() * 0.001) * 0.1,
            0,
            Math.cos(Date.now() * 0.001) * 0.1
        ];
    }

    getCameraRotation() {
        return [0, Date.now() * 0.0005, 0];
    }

    getDetectedMarkers() {
        // Simular detección de marcadores
        return Math.random() > 0.7 ? ['bge_logo'] : [];
    }

    getHandPositions() {
        if (!this.trackingSystem.handTracking) return null;

        return {
            left: [Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, -0.3],
            right: [Math.random() * 0.2 - 0.1, Math.random() * 0.2 - 0.1, -0.3]
        };
    }

    getFacePosition() {
        return [0, 0, -0.5];
    }

    getDetectedPlanes() {
        return [{
            type: 'horizontal',
            center: [0, -0.5, 0],
            size: [2, 2]
        }];
    }

    calculateFPS() {
        return 30 + Math.random() * 30; // Simular FPS entre 30-60
    }

    getRenderTime() {
        return 16 + Math.random() * 10; // Simular tiempo de render en ms
    }

    getTrackingLatency() {
        return 5 + Math.random() * 10; // Simular latencia en ms
    }

    getMemoryUsage() {
        return {
            used: 150 + Math.random() * 100, // MB
            total: 512
        };
    }

    getBatteryLevel() {
        if ('getBattery' in navigator) {
            return navigator.getBattery().then(battery => battery.level * 100);
        }
        return 85 + Math.random() * 15; // Simular nivel de batería
    }

    // === API PÚBLICA ===

    toggleARInterface() {
        const arInterface = document.getElementById('ar-interface');
        if (arInterface.classList.contains('hidden')) {
            arInterface.classList.remove('hidden');
            this.populateExperienceSelector();
        } else {
            arInterface.classList.add('hidden');
        }
    }

    populateExperienceSelector() {
        const grid = document.getElementById('scenarios-grid');
        const currentSubject = 'mathematics'; // Default

        this.updateScenariosGrid(currentSubject);
    }

    updateScenariosGrid(subject) {
        const grid = document.getElementById('scenarios-grid');
        const experiences = this.arExperiences[subject];

        if (!experiences) return;

        grid.innerHTML = DOMPurify.sanitize(experiences.scenarios.map(scenario => `
            <div class="scenario-card" data-subject="${subject}" data-scenario="${scenario}">
                <div class="scenario-icon">${this.getScenarioIcon(scenario)}</div>
                <h4>${this.getScenarioName(scenario)}</h4>
                <p>${this.getScenarioDescription(scenario)}</p>
                <button class="start-scenario" onclick="window.arEducationSystem.startExperience('${subject}', '${scenario}')">
                    Iniciar
                </button>
            </div>
        `).join(''));
    }

    getScenarioIcon(scenario) {
        const icons = {
            'geometry_3d': '📐',
            'function_graphs': '📈',
            'molecular_models': '⚛️',
            'anatomy_3d': '🔬',
            'historical_sites': '🏛️',
            'mexican_independence': '🇲🇽',
            'sculpture_view': '🗿',
            'music_visualization': '🎵'
        };
        return icons[scenario] || '🎯';
    }

    getScenarioName(scenario) {
        const names = {
            'geometry_3d': 'Geometría 3D',
            'function_graphs': 'Gráficas de Funciones',
            'molecular_models': 'Modelos Moleculares',
            'anatomy_3d': 'Anatomía 3D',
            'historical_sites': 'Sitios Históricos',
            'mexican_independence': 'Independencia de México',
            'sculpture_view': 'Análisis de Esculturas',
            'music_visualization': 'Visualización Musical'
        };
        return names[scenario] || scenario;
    }

    getScenarioDescription(scenario) {
        const descriptions = {
            'geometry_3d': 'Explora formas geométricas en 3D, calcula volúmenes y áreas',
            'function_graphs': 'Visualiza y manipula gráficas de funciones matemáticas',
            'molecular_models': 'Examina la estructura de átomos y moléculas',
            'anatomy_3d': 'Explora células y estructuras biológicas',
            'historical_sites': 'Recorre sitios históricos de México',
            'mexican_independence': 'Vive los eventos de la Independencia',
            'sculpture_view': 'Analiza obras de arte en detalle',
            'music_visualization': 'Visualiza ondas sonoras y armonías'
        };
        return descriptions[scenario] || 'Experiencia educativa interactiva';
    }

    async startExperience(subject, scenario) {
        try {
            await this.startARExperience(subject, scenario);
            this.showSessionUI();
        } catch (error) {
            console.error('Error starting AR experience:', error);
            alert('Error iniciando la experiencia AR. Inténtalo de nuevo.');
        }
    }

    showSessionUI() {
        document.getElementById('ar-selector').style.display = 'none';
        document.getElementById('ar-session-ui').style.display = 'block';

        if (this.activeSession) {
            document.getElementById('session-title').textContent =
                `${this.getScenarioName(this.activeSession.scenario)}`;
        }
    }

    stopARSession() {
        if (this.activeSession) {
            this.stopTracking();
            this.saveSessionProgress();
            this.activeSession = null;
        }

        document.getElementById('ar-session-ui').style.display = 'none';
        document.getElementById('ar-selector').style.display = 'block';

        console.log('🛑 Sesión AR finalizada');
    }

    closeARInterface() {
        // Detener cualquier sesión activa
        if (this.activeSession) {
            this.stopARSession();
        }

        // Ocultar toda la interfaz AR
        const arInterface = document.getElementById('ar-interface');
        if (arInterface) {
            arInterface.classList.add('hidden');
        }

        console.log('❌ Interfaz AR cerrada');
    }

    saveSessionProgress() {
        if (!this.activeSession) return;

        const progress = {
            sessionId: this.activeSession.id,
            subject: this.activeSession.subject,
            scenario: this.activeSession.scenario,
            score: this.activeSession.score,
            duration: Date.now() - this.activeSession.startTime,
            interactions: this.activeSession.interactions.length,
            completed: this.activeSession.progress >= 100,
            timestamp: new Date().toISOString()
        };

        // Guardar en localStorage
        const userProgress = JSON.parse(localStorage.getItem('ar_user_progress') || '[]');
        userProgress.push(progress);
        localStorage.setItem('ar_user_progress', JSON.stringify(userProgress));

        console.log('💾 Progreso de sesión guardado');
    }
}

// CSS para la interfaz AR
const arStyles = document.createElement('style');
arStyles.textContent = `
    .ar-activation {
        position: fixed;
        bottom: 30px;
        right: 90px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #ff1744 0%, #f50057 50%, #c51162 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(255, 23, 68, 0.5), 0 0 30px rgba(245, 0, 87, 0.3);
        transition: all 0.3s ease;
        z-index: 9996;
    }

    .ar-activation:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(255, 23, 68, 0.7), 0 0 40px rgba(245, 0, 87, 0.5);
    }

    .ar-icon {
        font-size: 24px;
        color: white;
    }

    .ar-status-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
    }

    .ar-status-dot.available {
        background: #2ed573;
    }

    .ar-status-dot.unavailable {
        background: #ff3838;
    }

    .ar-interface {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .ar-interface.hidden {
        display: none;
    }

    .ar-controls {
        margin-bottom: 20px;
    }

    .ar-btn {
        background: linear-gradient(135deg, #FF6B6B, #4ECDC4);
        border: none;
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 0 10px;
    }

    .ar-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
    }

    .ar-experience-selector {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 30px;
        max-width: 800px;
        width: 90%;
    }

    .subject-tabs {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        gap: 10px;
    }

    .subject-tab {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .subject-tab.active,
    .subject-tab:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
    }

    .scenarios-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .scenario-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .scenario-card:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
    }

    .scenario-icon {
        font-size: 48px;
        margin-bottom: 10px;
    }

    .scenario-card h4 {
        margin: 10px 0;
        font-size: 16px;
    }

    .scenario-card p {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 15px;
    }

    .start-scenario {
        background: #4ECDC4;
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 15px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .start-scenario:hover {
        background: #45b7aa;
    }

    .ar-session-ui {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
        z-index: 10001;
        pointer-events: none;
    }

    .session-header {
        position: absolute;
        top: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 16px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        pointer-events: all;
    }

    .session-stats {
        display: flex;
        gap: 20px;
        font-size: 14px;
    }

    .close-session {
        background: #ff4757;
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
    }

    .ar-tools {
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 12px;
        pointer-events: all;
    }

    .ar-tool {
        background: rgba(0, 0, 0, 0.8);
        border: none;
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 20px;
        transition: all 0.3s ease;
    }

    .ar-tool:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }

    .ar-progress {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        padding: 16px;
        color: white;
        pointer-events: all;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 12px;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4ECDC4, #44A08D);
        transition: width 0.3s ease;
    }

    .ar-fallback-viewer {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10002;
    }

    .viewer-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 16px 16px 0 0;
        text-align: center;
        position: relative;
    }

    .close-viewer-btn {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 35px;
        height: 35px;
        border-radius: 50%;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .close-viewer-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
    }

    .viewer-content {
        padding: 20px;
    }

    .model-viewport {
        width: 100%;
        height: 300px;
        background: #f8f9fa;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
    }

    .model-placeholder {
        text-align: center;
        color: #666;
    }

    .model-placeholder i {
        font-size: 48px;
        margin-bottom: 10px;
        display: block;
    }

    .virtual-controls {
        display: flex;
        justify-content: center;
        gap: 12px;
    }

    .control-btn {
        background: #667eea;
        border: none;
        color: white;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
    }

    .control-btn:hover {
        background: #5a67d8;
        transform: scale(1.1);
    }

    @media (max-width: 768px) {
        .ar-interface {
            padding: 20px;
        }

        .ar-experience-selector {
            padding: 20px;
        }

        .scenarios-grid {
            grid-template-columns: 1fr;
        }

        .session-header {
            flex-direction: column;
            gap: 10px;
        }

        .ar-tools {
            bottom: 80px;
            gap: 8px;
        }

        .ar-tool {
            width: 40px;
            height: 40px;
            font-size: 16px;
        }
    }
`;
document.head.appendChild(arStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.arEducationSystem = new AREducationSystem();
});

// Exponer globalmente
window.AREducationSystem = AREducationSystem;