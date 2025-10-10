/**
 * 🧪 VIRTUAL LABS SYSTEM - FASE 7.2
 * Sistema de laboratorios virtuales para BGE Héroes de la Patria
 * Simulaciones interactivas de ciencias, química, física y matemáticas
 */

class VirtualLabsSystem {
    constructor() {
        this.isPhysicsActive = false;
        this.lastPhysicsUpdate = 0;
        this.physicsAnimationFrame = null;
        this.laboratories = {
            chemistry: {
                name: 'Laboratorio de Química',
                experiments: ['acid_base', 'molecular_reactions', 'periodic_table_interactive', 'chemical_bonds'],
                equipment: ['beakers', 'bunsen_burner', 'ph_meter', 'microscope', 'balance'],
                safety: ['goggles', 'gloves', 'lab_coat', 'ventilation']
            },
            physics: {
                name: 'Laboratorio de Física',
                experiments: ['pendulum_motion', 'wave_propagation', 'electric_circuits', 'optics_lab'],
                equipment: ['oscilloscope', 'multimeter', 'function_generator', 'laser', 'prisms'],
                safety: ['laser_safety', 'electrical_safety']
            },
            biology: {
                name: 'Laboratorio de Biología',
                experiments: ['cell_observation', 'dna_extraction', 'photosynthesis', 'enzyme_activity'],
                equipment: ['microscope', 'petri_dishes', 'centrifuge', 'incubator'],
                safety: ['biohazard_protocol', 'sterile_technique']
            },
            mathematics: {
                name: 'Laboratorio de Matemáticas',
                experiments: ['function_graphing', 'geometric_constructions', 'statistics_analysis', 'calculus_visualization'],
                equipment: ['graphing_calculator', 'geometric_tools', 'computer_algebra'],
                safety: []
            }
        };

        this.activeSession = null;
        this.simulationEngine = null;
        this.userProgress = {};
        this.safetyProtocols = {};

        this.config = {
            enablePhysicsEngine: true,
            enableRealTimeSimulation: true,
            maxParticles: 10000,
            renderQuality: 'high',
            saveProgress: true,
            enforceSafety: true
        };

        this.init();
    }

    async init() {
        await this.initializeSimulationEngine();
        this.setupPhysicsEngine();
        this.loadUserProgress();
        this.createLabInterface();
        this.initializeSafetyProtocols();

        console.log('🧪 Virtual Labs System inicializado');
        console.log(`⚗️ Laboratorios disponibles: ${Object.keys(this.laboratories).length}`);
    }

    loadUserProgress() {
        try {
            // Cargar progreso del usuario desde localStorage
            const savedProgress = localStorage.getItem('virtualLabsProgress');
            if (savedProgress) {
                this.userProgress = JSON.parse(savedProgress);
            } else {
                // Inicializar progreso vacío
                this.userProgress = {
                    completedExperiments: [],
                    totalExperiments: 0,
                    totalTime: 0,
                    achievements: [],
                    skillLevels: {
                        chemistry: 0,
                        physics: 0,
                        biology: 0,
                        mathematics: 0
                    },
                    safety: {
                        violations: 0,
                        score: 100
                    }
                };
            }

            console.log('📊 Progreso de usuario cargado:', this.userProgress);
        } catch (error) {
            console.error('Error loading user progress:', error);
            // Inicializar progreso por defecto en caso de error
            this.userProgress = {
                completedExperiments: [],
                totalExperiments: 0,
                totalTime: 0,
                achievements: [],
                skillLevels: {
                    chemistry: 0,
                    physics: 0,
                    biology: 0,
                    mathematics: 0
                },
                safety: {
                    violations: 0,
                    score: 100
                }
            };
        }
    }

    saveUserProgress() {
        try {
            localStorage.setItem('virtualLabsProgress', JSON.stringify(this.userProgress));
            console.log('💾 Progreso de usuario guardado');
        } catch (error) {
            console.error('Error saving user progress:', error);
        }
    }

    updateExperimentProgress() {
        if (!this.activeSession) return;

        // Actualizar progreso del experimento actual
        const completedObjectives = this.activeSession.objectives.filter(obj => obj.completed);
        this.activeSession.completionRate = (completedObjectives.length / this.activeSession.objectives.length) * 100;

        // Si el experimento se completó, actualizar progreso global
        if (this.activeSession.completionRate >= 80) {
            const experimentId = `${this.activeSession.labType}_${this.activeSession.experimentType}`;
            if (!this.userProgress.completedExperiments.includes(experimentId)) {
                this.userProgress.completedExperiments.push(experimentId);
                this.userProgress.totalExperiments++;

                // Aumentar nivel de habilidad
                this.userProgress.skillLevels[this.activeSession.labType] += 10;

                console.log(`🎯 Experimento completado: ${experimentId}`);
            }
        }

        this.saveUserProgress();
    }

    // === MOTOR DE SIMULACIÓN ===

    async initializeSimulationEngine() {
        this.simulationEngine = {
            type: 'WebGL_Physics_Engine',
            version: '2.0',
            capabilities: {
                particleSystem: true,
                fluidDynamics: true,
                thermodynamics: true,
                electromagnetics: true,
                quantumMechanics: false // Simulación básica
            },
            performance: {
                maxFPS: 60,
                adaptiveQuality: true,
                gpuAcceleration: true
            }
        };

        console.log('🎮 Motor de simulación inicializado');
    }

    setupPhysicsEngine() {
        if (!this.config.enablePhysicsEngine) return;

        this.physicsEngine = {
            gravity: 9.81,
            airResistance: 0.01,
            friction: 0.3,
            timeStep: 1/60,
            solverIterations: 10,
            collisionDetection: true,
            constraints: true
        };

        console.log('⚙️ Motor de física configurado');
    }

    // === EXPERIMENTOS ESPECÍFICOS ===

    async startExperiment(labType, experimentType) {
        if (!this.laboratories[labType]) {
            throw new Error(`Laboratorio no disponible: ${labType}`);
        }

        const lab = this.laboratories[labType];
        if (!lab.experiments.includes(experimentType)) {
            throw new Error(`Experimento no disponible: ${experimentType}`);
        }

        console.log(`🔬 Iniciando experimento: ${experimentType} en ${lab.name}`);

        // Verificar protocolos de seguridad
        if (this.config.enforceSafety) {
            await this.checkSafetyCompliance(labType, experimentType);
        }

        // Crear sesión de laboratorio
        this.activeSession = await this.createLabSession(labType, experimentType);

        // Configurar experimento específico
        await this.setupExperiment(this.activeSession);

        // Mostrar interfaz del laboratorio
        this.showLabInterface();

        return this.activeSession;
    }

    async createLabSession(labType, experimentType) {
        const sessionId = `lab_${labType}_${experimentType}_${Date.now()}`;

        const session = {
            id: sessionId,
            labType: labType,
            experimentType: experimentType,
            startTime: Date.now(),
            status: 'active',
            user: this.getCurrentUser(),
            equipment: [],
            measurements: [],
            observations: [],
            results: {},
            safety: {
                protocolsFollowed: [],
                violations: [],
                score: 100
            },
            score: 0,
            objectives: [],
            completionRate: 0
        };

        // Configurar objetivos específicos del experimento
        session.objectives = this.getExperimentObjectives(labType, experimentType);

        return session;
    }

    async setupExperiment(session) {
        const experimentSetups = {
            // Química
            'acid_base': () => this.setupAcidBaseExperiment(session),
            'molecular_reactions': () => this.setupMolecularReactionsExperiment(session),
            'periodic_table_interactive': () => this.setupPeriodicTableExperiment(session),
            'chemical_bonds': () => this.setupChemicalBondsExperiment(session),

            // Física
            'pendulum_motion': () => this.setupPendulumExperiment(session),
            'wave_propagation': () => this.setupWaveExperiment(session),
            'electric_circuits': () => this.setupCircuitExperiment(session),
            'optics_lab': () => this.setupOpticsExperiment(session),

            // Biología
            'cell_observation': () => this.setupCellObservationExperiment(session),
            'dna_extraction': () => this.setupDNAExtractionExperiment(session),
            'photosynthesis': () => this.setupPhotosynthesisExperiment(session),
            'enzyme_activity': () => this.setupEnzymeExperiment(session),

            // Matemáticas
            'function_graphing': () => this.setupFunctionGraphingExperiment(session),
            'geometric_constructions': () => this.setupGeometryExperiment(session),
            'statistics_analysis': () => this.setupStatisticsExperiment(session),
            'calculus_visualization': () => this.setupCalculusExperiment(session)
        };

        const setupFunction = experimentSetups[session.experimentType];
        if (setupFunction) {
            await setupFunction();
        }
    }

    // === EXPERIMENTOS DE QUÍMICA ===

    setupAcidBaseExperiment(session) {
        session.equipment = ['beakers', 'ph_meter', 'burette', 'indicator_solutions'];
        session.chemicals = [
            { name: 'HCl', concentration: 0.1, volume: 100, ph: 1 },
            { name: 'NaOH', concentration: 0.1, volume: 100, ph: 13 },
            { name: 'H2O', concentration: 1.0, volume: 1000, ph: 7 }
        ];
        session.objectives = [
            'Medir pH de diferentes soluciones',
            'Realizar titulación ácido-base',
            'Determinar punto de equivalencia',
            'Calcular concentración desconocida'
        ];

        this.setupChemicalSimulation(session);
    }

    setupMolecularReactionsExperiment(session) {
        session.equipment = ['reaction_vessel', 'heating_plate', 'thermometer', 'balance'];
        session.molecules = [
            { formula: 'H2', bonds: 1, energy: -436 },
            { formula: 'O2', bonds: 2, energy: -498 },
            { formula: 'H2O', bonds: 2, energy: -927 }
        ];
        session.objectives = [
            'Combinar reactivos moleculares',
            'Observar formación de productos',
            'Calcular energía de reacción',
            'Balancear ecuaciones químicas'
        ];

        this.setupMolecularSimulation(session);
    }

    // === EXPERIMENTOS DE FÍSICA ===

    setupPendulumExperiment(session) {
        session.equipment = ['pendulum', 'protractor', 'stopwatch', 'ruler'];
        session.parameters = {
            length: 1.0, // metros
            mass: 0.5,   // kg
            angle: 15,   // grados
            gravity: 9.81,
            damping: 0.01
        };
        session.objectives = [
            'Medir período de oscilación',
            'Variar longitud del péndulo',
            'Calcular aceleración gravitacional',
            'Analizar movimiento armónico simple'
        ];

        this.setupPendulumSimulation(session);
    }

    setupWaveExperiment(session) {
        session.equipment = ['wave_generator', 'oscilloscope', 'speakers', 'microphone'];
        session.parameters = {
            frequency: 440, // Hz
            amplitude: 1.0,
            wavelength: 0.77,
            speed: 343 // m/s
        };
        session.objectives = [
            'Generar ondas de diferentes frecuencias',
            'Medir longitud de onda',
            'Calcular velocidad de propagación',
            'Observar interferencia y resonancia'
        ];

        this.setupWaveSimulation(session);
    }

    setupCircuitExperiment(session) {
        session.equipment = ['breadboard', 'multimeter', 'resistors', 'capacitors', 'voltage_source'];
        session.components = [
            { type: 'resistor', value: 1000, unit: 'ohms' },
            { type: 'capacitor', value: 100, unit: 'microfarads' },
            { type: 'voltage_source', value: 9, unit: 'volts' }
        ];
        session.objectives = [
            'Construir circuitos básicos',
            'Medir voltaje y corriente',
            'Verificar Ley de Ohm',
            'Analizar circuitos RC'
        ];

        this.setupCircuitSimulation(session);
    }

    // === EXPERIMENTOS DE BIOLOGÍA ===

    setupCellObservationExperiment(session) {
        session.equipment = ['microscope', 'slides', 'cover_slips', 'stains'];
        session.specimens = [
            { type: 'onion_cell', magnification: '400x', structures: ['cell_wall', 'nucleus', 'cytoplasm'] },
            { type: 'human_cheek_cell', magnification: '400x', structures: ['cell_membrane', 'nucleus'] }
        ];
        session.objectives = [
            'Preparar muestras microscópicas',
            'Identificar estructuras celulares',
            'Comparar células vegetales y animales',
            'Calcular tamaño celular'
        ];

        this.setupMicroscopySimulation(session);
    }

    // === EXPERIMENTOS DE MATEMÁTICAS ===

    setupFunctionGraphingExperiment(session) {
        session.equipment = ['graphing_calculator', 'coordinate_plane', 'function_analyzer'];
        session.functions = [
            { type: 'linear', equation: 'y = mx + b', parameters: { m: 2, b: 1 } },
            { type: 'quadratic', equation: 'y = ax² + bx + c', parameters: { a: 1, b: 0, c: 0 } },
            { type: 'exponential', equation: 'y = a^x', parameters: { a: 2 } }
        ];
        session.objectives = [
            'Graficar diferentes tipos de funciones',
            'Analizar comportamiento de parámetros',
            'Encontrar intersecciones y extremos',
            'Interpretar representaciones gráficas'
        ];

        this.setupMathVisualization(session);
    }

    // === SIMULACIONES ===

    setupChemicalSimulation(session) {
        this.chemicalEngine = {
            molecules: session.chemicals || session.molecules,
            temperature: 298, // Kelvin
            pressure: 1.0,    // atm
            volume: 1.0,      // L
            reactionRate: 0.1,
            equilibrium: false
        };

        // Simular comportamiento molecular
        this.startChemicalAnimation();
    }

    setupPhysicsSimulation(session) {
        this.physicsObjects = [];

        // Crear objetos físicos según el experimento
        if (session.experimentType === 'pendulum_motion') {
            this.createPendulum(session.parameters);
        } else if (session.experimentType === 'wave_propagation') {
            this.createWaveSource(session.parameters);
        }

        this.startPhysicsAnimation();
    }

    setupMolecularSimulation(session) {
        this.molecularEngine = {
            particles: this.createMolecularParticles(session.molecules),
            forces: ['van_der_waals', 'electrostatic', 'hydrogen_bonds'],
            temperature: 298,
            pressure: 1.0,
            timeStep: 0.001
        };

        this.startMolecularDynamics();
    }

    // === ANIMACIONES Y RENDERIZADO ===

    startChemicalAnimation() {
        this.chemicalAnimationFrame = setInterval(() => {
            this.updateChemicalState();
            this.renderChemicalView();
        }, 50); // 20 FPS
    }

    startPhysicsAnimation() {
        if (this.isPhysicsActive) {
            const currentTime = performance.now();
            if (currentTime - (this.lastPhysicsUpdate || 0) >= 33) { // 30 FPS
                this.updatePhysicsSimulation();
                this.renderPhysicsView();
                this.lastPhysicsUpdate = currentTime;
            }

            this.physicsAnimationFrame = requestAnimationFrame(() => {
                this.startPhysicsAnimation();
            });
        }
    }

    stopPhysicsAnimation() {
        this.isPhysicsActive = false;
        if (this.physicsAnimationFrame) {
            cancelAnimationFrame(this.physicsAnimationFrame);
            this.physicsAnimationFrame = null;
        }
    }

    startMolecularDynamics() {
        this.molecularAnimationFrame = setInterval(() => {
            this.updateMolecularPositions();
            this.calculateMolecularForces();
            this.renderMolecularView();
        }, 33); // 30 FPS
    }

    updateChemicalState() {
        if (!this.chemicalEngine) return;

        // Simular progreso de reacción
        this.chemicalEngine.reactionProgress = Math.min(
            (Date.now() - this.activeSession.startTime) / 10000, // 10 segundos para completar
            1.0
        );

        // Calcular concentraciones
        this.updateConcentrations();

        // Verificar equilibrio
        this.checkChemicalEquilibrium();
    }

    updatePhysicsSimulation() {
        if (!this.physicsObjects.length) return;

        const deltaTime = 1/60; // 60 FPS

        this.physicsObjects.forEach(obj => {
            // Aplicar fuerzas
            this.applyForces(obj);

            // Integrar movimiento
            this.integrateMotion(obj, deltaTime);

            // Detectar colisiones
            this.detectCollisions(obj);
        });
    }

    // === MEDICIONES Y DATOS ===

    recordMeasurement(type, value, unit, notes = '') {
        if (!this.activeSession) return;

        const measurement = {
            id: `measure_${Date.now()}`,
            type: type,
            value: value,
            unit: unit,
            timestamp: Date.now(),
            notes: notes,
            accuracy: this.calculateMeasurementAccuracy(type, value)
        };

        this.activeSession.measurements.push(measurement);
        this.updateExperimentProgress();

        console.log(`📏 Medición registrada: ${type} = ${value} ${unit}`);
    }

    recordObservation(description, category = 'general') {
        if (!this.activeSession) return;

        const observation = {
            id: `obs_${Date.now()}`,
            description: description,
            category: category,
            timestamp: Date.now(),
            confidence: 0.8
        };

        this.activeSession.observations.push(observation);
        console.log(`👁️ Observación registrada: ${description}`);
    }

    calculateResults() {
        if (!this.activeSession) return null;

        const results = {
            experimentType: this.activeSession.experimentType,
            measurements: this.activeSession.measurements,
            observations: this.activeSession.observations,
            calculations: this.performCalculations(),
            conclusions: this.generateConclusions(),
            accuracy: this.calculateOverallAccuracy(),
            completionTime: Date.now() - this.activeSession.startTime
        };

        this.activeSession.results = results;
        return results;
    }

    performCalculations() {
        const calculations = {};

        if (this.activeSession.experimentType === 'pendulum_motion') {
            calculations.period = this.calculatePendulumPeriod();
            calculations.gravity = this.calculateGravityFromPendulum();
        } else if (this.activeSession.experimentType === 'acid_base') {
            calculations.concentration = this.calculateConcentration();
            calculations.ph_changes = this.analyzePHChanges();
        }

        return calculations;
    }

    generateConclusions() {
        const conclusions = [];

        // Generar conclusiones basadas en el tipo de experimento
        if (this.activeSession.experimentType === 'pendulum_motion') {
            conclusions.push('El período del péndulo es independiente de la masa');
            conclusions.push('El período aumenta con la raíz cuadrada de la longitud');
        } else if (this.activeSession.experimentType === 'acid_base') {
            conclusions.push('El pH cambia logarítmicamente con la concentración');
            conclusions.push('El punto de equivalencia se alcanza cuando [H+] = [OH-]');
        }

        return conclusions;
    }

    // === PROTOCOLOS DE SEGURIDAD ===

    initializeSafetyProtocols() {
        this.safetyProtocols = {
            chemistry: {
                required_equipment: ['goggles', 'gloves', 'lab_coat'],
                prohibited_actions: ['mixing_incompatible_chemicals', 'ignoring_fume_hood'],
                emergency_procedures: ['eyewash_station', 'safety_shower', 'fire_extinguisher']
            },
            physics: {
                required_equipment: ['laser_safety_glasses'],
                prohibited_actions: ['direct_laser_viewing', 'high_voltage_contact'],
                emergency_procedures: ['power_cutoff', 'first_aid']
            },
            biology: {
                required_equipment: ['gloves', 'sterile_equipment'],
                prohibited_actions: ['contamination', 'improper_disposal'],
                emergency_procedures: ['biohazard_cleanup', 'decontamination']
            }
        };
    }

    async checkSafetyCompliance(labType, experimentType) {
        const protocol = this.safetyProtocols[labType];
        if (!protocol) return true;

        // Verificar equipo de seguridad requerido
        const hasRequiredEquipment = await this.verifyRequiredEquipment(protocol.required_equipment);

        if (!hasRequiredEquipment) {
            throw new Error('Equipo de seguridad requerido no disponible');
        }

        // Mostrar advertencias de seguridad
        this.showSafetyWarnings(protocol);

        return true;
    }

    async verifyRequiredEquipment(requiredEquipment) {
        // Simular verificación de equipo de seguridad
        return new Promise(resolve => {
            setTimeout(() => {
                const hasEquipment = Math.random() > 0.1; // 90% probabilidad de tener equipo
                resolve(hasEquipment);
            }, 1000);
        });
    }

    showSafetyWarnings(protocol) {
        console.log('⚠️ Advertencias de seguridad:');
        protocol.prohibited_actions.forEach(action => {
            console.log(`❌ Prohibido: ${action}`);
        });
    }

    recordSafetyViolation(violation) {
        if (!this.activeSession) return;

        this.activeSession.safety.violations.push({
            violation: violation,
            timestamp: Date.now(),
            severity: this.assessViolationSeverity(violation)
        });

        this.activeSession.safety.score -= 10; // Penalización
        console.warn(`⚠️ Violación de seguridad: ${violation}`);
    }

    // === INTERFAZ DE USUARIO ===

    createLabInterface() {
        const labInterface = document.createElement('div');
        labInterface.id = 'virtual-labs-interface';
        labInterface.className = 'virtual-labs-interface hidden';

        labInterface.innerHTML = `
            <div class="labs-header">
                <h2>🧪 Laboratorios Virtuales</h2>
                <div class="labs-controls">
                    <button class="close-labs" id="close-labs">×</button>
                </div>
            </div>

            <div class="labs-content">
                <div class="lab-selector" id="lab-selector">
                    <h3>Selecciona un Laboratorio</h3>
                    <div class="labs-grid">
                        ${Object.entries(this.laboratories).map(([key, lab]) => `
                            <div class="lab-card" data-lab="${key}">
                                <div class="lab-icon">${this.getLabIcon(key)}</div>
                                <h4>${lab.name}</h4>
                                <p>${lab.experiments.length} experimentos</p>
                                <button class="enter-lab" onclick="virtualLabsSystem.selectLab('${key}')">
                                    Entrar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="experiment-selector" id="experiment-selector" style="display: none;">
                    <h3>Experimentos Disponibles</h3>
                    <div class="experiments-grid" id="experiments-grid">
                        <!-- Experiments will be populated dynamically -->
                    </div>
                </div>

                <div class="lab-workspace" id="lab-workspace" style="display: none;">
                    <div class="workspace-header">
                        <h3 id="experiment-title">Experimento</h3>
                        <div class="workspace-controls">
                            <button class="start-experiment" id="start-experiment">▶️ Iniciar</button>
                            <button class="pause-experiment" id="pause-experiment">⏸️ Pausar</button>
                            <button class="reset-experiment" id="reset-experiment">🔄 Reiniciar</button>
                        </div>
                    </div>

                    <div class="workspace-content">
                        <div class="simulation-area">
                            <canvas id="lab-canvas" width="800" height="600"></canvas>
                            <div class="simulation-overlay">
                                <div class="measurement-panel" id="measurement-panel">
                                    <h4>📏 Mediciones</h4>
                                    <div class="measurements-list" id="measurements-list"></div>
                                </div>
                            </div>
                        </div>

                        <div class="lab-controls-panel">
                            <div class="equipment-panel">
                                <h4>🔬 Equipo</h4>
                                <div class="equipment-list" id="equipment-list"></div>
                            </div>

                            <div class="parameters-panel">
                                <h4>⚙️ Parámetros</h4>
                                <div class="parameters-list" id="parameters-list"></div>
                            </div>

                            <div class="observations-panel">
                                <h4>👁️ Observaciones</h4>
                                <textarea id="observations-text" placeholder="Registra tus observaciones..."></textarea>
                                <button id="add-observation">Agregar</button>
                            </div>
                        </div>
                    </div>

                    <div class="results-panel" id="results-panel" style="display: none;">
                        <h4>📊 Resultados</h4>
                        <div class="results-content" id="results-content"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(labInterface);
        this.setupLabEventListeners();

        // Crear botón de activación
        this.createLabActivationButton();
    }

    createLabActivationButton() {
        const activationBtn = document.createElement('div');
        activationBtn.id = 'labs-activation';
        activationBtn.className = 'labs-activation';
        activationBtn.innerHTML = `
            <div class="activation-content">
                <div class="lab-icon">🧪</div>
                <div class="lab-status-dot active"></div>
            </div>
        `;

        activationBtn.addEventListener('click', () => this.toggleLabInterface());
        document.body.appendChild(activationBtn);
    }

    setupLabEventListeners() {
        // Usar event delegation para botones dinámicos
        document.addEventListener('click', (e) => {
            if (e.target.id === 'close-labs' || e.target.classList.contains('close-labs')) {
                this.closeLabInterface();
            } else if (e.target.id === 'start-experiment') {
                this.startCurrentExperiment();
            } else if (e.target.id === 'pause-experiment') {
                this.pauseCurrentExperiment();
            } else if (e.target.id === 'reset-experiment') {
                this.resetCurrentExperiment();
            } else if (e.target.id === 'add-observation') {
                this.addCurrentObservation();
            }
        });
    }

    getLabIcon(labType) {
        const icons = {
            chemistry: '⚗️',
            physics: '⚛️',
            biology: '🔬',
            mathematics: '📐'
        };
        return icons[labType] || '🧪';
    }

    toggleLabInterface() {
        const labInterface = document.getElementById('virtual-labs-interface');
        if (labInterface.classList.contains('hidden')) {
            labInterface.classList.remove('hidden');
        } else {
            labInterface.classList.add('hidden');
        }
    }

    closeLabInterface() {
        const labInterface = document.getElementById('virtual-labs-interface');
        labInterface.classList.add('hidden');
    }

    selectLab(labType) {
        this.currentLab = labType;

        document.getElementById('lab-selector').style.display = 'none';
        document.getElementById('experiment-selector').style.display = 'block';

        this.populateExperiments(labType);
    }

    populateExperiments(labType) {
        const lab = this.laboratories[labType];
        const grid = document.getElementById('experiments-grid');

        grid.innerHTML = lab.experiments.map(experiment => `
            <div class="experiment-card" data-experiment="${experiment}">
                <div class="experiment-icon">${this.getExperimentIcon(experiment)}</div>
                <h4>${this.getExperimentName(experiment)}</h4>
                <p>${this.getExperimentDescription(experiment)}</p>
                <button class="start-experiment-btn" onclick="virtualLabsSystem.selectExperiment('${experiment}')">
                    Comenzar
                </button>
            </div>
        `).join('');
    }

    async selectExperiment(experimentType) {
        try {
            await this.startExperiment(this.currentLab, experimentType);
            this.showWorkspace();
        } catch (error) {
            console.error('Error starting experiment:', error);
            alert('Error iniciando el experimento. Verifica los protocolos de seguridad.');
        }
    }

    showWorkspace() {
        document.getElementById('experiment-selector').style.display = 'none';
        document.getElementById('lab-workspace').style.display = 'block';

        if (this.activeSession) {
            document.getElementById('experiment-title').textContent =
                this.getExperimentName(this.activeSession.experimentType);

            this.populateEquipmentList();
            this.populateParametersList();
        }
    }

    // === UTILIDADES ===

    getExperimentIcon(experiment) {
        const icons = {
            'acid_base': '🧪',
            'pendulum_motion': '⏰',
            'cell_observation': '🔬',
            'function_graphing': '📈'
        };
        return icons[experiment] || '🔬';
    }

    getExperimentName(experiment) {
        const names = {
            'acid_base': 'Titulación Ácido-Base',
            'pendulum_motion': 'Movimiento del Péndulo',
            'cell_observation': 'Observación Celular',
            'function_graphing': 'Graficación de Funciones'
        };
        return names[experiment] || experiment;
    }

    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.warn('Error parsing user data:', error);
            }
        }
        return { id: 'anonymous', name: 'Usuario Anónimo' };
    }

    // === API PÚBLICA ===

    getAvailableLabs() {
        return Object.keys(this.laboratories);
    }

    getLabExperiments(labType) {
        return this.laboratories[labType]?.experiments || [];
    }

    getCurrentSession() {
        return this.activeSession;
    }

    exportResults() {
        if (!this.activeSession || !this.activeSession.results) {
            throw new Error('No hay resultados para exportar');
        }

        const exportData = {
            session: this.activeSession,
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser()
        };

        this.downloadResults(exportData);
    }

    downloadResults(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_results_${this.activeSession.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// CSS para laboratorios virtuales
const labStyles = document.createElement('style');
labStyles.textContent = `
    .labs-activation {
        position: fixed;
        bottom: 210px;
        right: 20px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #4ECDC4, #44A08D);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(78, 205, 196, 0.4);
        transition: all 0.3s ease;
        z-index: 9995;
    }

    .labs-activation:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 30px rgba(78, 205, 196, 0.6);
    }

    .lab-icon {
        font-size: 24px;
        color: white;
    }

    .lab-status-dot {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
        background: #2ed573;
    }

    .virtual-labs-interface {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .virtual-labs-interface.hidden {
        display: none;
    }

    .labs-header {
        background: rgba(0, 0, 0, 0.2);
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .labs-header h2 {
        margin: 0;
        font-size: 1.5rem;
    }

    .close-labs {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
    }

    .labs-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
    }

    .labs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }

    .lab-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }

    .lab-card:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-4px);
    }

    .lab-card .lab-icon {
        font-size: 48px;
        margin-bottom: 16px;
        display: block;
    }

    .lab-card h4 {
        margin: 12px 0;
        font-size: 1.2rem;
    }

    .lab-card p {
        opacity: 0.8;
        margin-bottom: 20px;
    }

    .enter-lab {
        background: #4ECDC4;
        border: none;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.3s ease;
    }

    .enter-lab:hover {
        background: #45b7aa;
    }

    .experiments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 20px;
    }

    .experiment-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: all 0.3s ease;
    }

    .experiment-card:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
    }

    .experiment-icon {
        font-size: 36px;
        margin-bottom: 12px;
        display: block;
    }

    .start-experiment-btn {
        background: #FF6B6B;
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 16px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .start-experiment-btn:hover {
        background: #ff5252;
    }

    .lab-workspace {
        height: calc(100vh - 100px);
        display: flex;
        flex-direction: column;
    }

    .workspace-header {
        background: rgba(0, 0, 0, 0.2);
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 8px;
        margin-bottom: 16px;
    }

    .workspace-controls {
        display: flex;
        gap: 8px;
    }

    .workspace-controls button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .workspace-controls button:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .workspace-content {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 16px;
    }

    .simulation-area {
        position: relative;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        overflow: hidden;
    }

    #lab-canvas {
        width: 100%;
        height: 100%;
        display: block;
    }

    .simulation-overlay {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        padding: 12px;
        min-width: 200px;
    }

    .lab-controls-panel {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .equipment-panel,
    .parameters-panel,
    .observations-panel {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
    }

    .equipment-panel h4,
    .parameters-panel h4,
    .observations-panel h4 {
        margin: 0 0 12px 0;
        font-size: 1rem;
    }

    #observations-text {
        width: 100%;
        height: 80px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        padding: 8px;
        color: white;
        resize: vertical;
        margin-bottom: 8px;
    }

    #observations-text::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }

    #add-observation {
        background: #4ECDC4;
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        width: 100%;
    }

    @media (max-width: 768px) {
        .labs-grid {
            grid-template-columns: 1fr;
        }

        .workspace-content {
            grid-template-columns: 1fr;
        }

        .simulation-overlay {
            position: static;
            margin-top: 12px;
        }
    }
`;
document.head.appendChild(labStyles);

// Inicialización automática
document.addEventListener('DOMContentLoaded', () => {
    window.virtualLabsSystem = new VirtualLabsSystem();
});

// Exponer globalmente
window.VirtualLabsSystem = VirtualLabsSystem;