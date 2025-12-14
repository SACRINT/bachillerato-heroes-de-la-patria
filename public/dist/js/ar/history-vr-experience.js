/**
 * 🏛️ HISTORIA VR EXPERIENCE
 * Recorridos virtuales por sitios históricos de México
 * FASE 5.2 - Ecosistema AR/VR
 * Creado: 07 Diciembre 2025
 */

(function () {
    'use strict';

    class HistoryVRExperience {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.THREE = null;
            this.currentLocation = null;
            this.isInitialized = false;
            this.locations = new Map();
            this.artifacts = new Map();
        }

        /**
         * Inicializar la experiencia de historia
         */
        async initialize(containerId) {
            console.log('[HISTORY-VR] Inicializando experiencia...');

            if (!window.threeLoader) {
                throw new Error('ThreeJSLoader no disponible');
            }

            const { THREE } = await window.threeLoader.load();
            this.THREE = THREE;

            // Crear escena con ambiente histórico
            const sceneData = await window.threeLoader.createScene(containerId, {
                backgroundColor: 0x87ceeb, // Cielo azul
                cameraZ: 10,
                cameraY: 5,
                grid: false,
                lights: true,
                onAnimate: (scene) => this.onAnimate(scene)
            });

            this.scene = sceneData.scene;
            this.camera = sceneData.camera;
            this.renderer = sceneData.renderer;
            this.controls = sceneData.controls;
            this.sceneUtils = sceneData;

            // Configurar locaciones históricas
            this.setupHistoricalLocations();

            // Crear UI
            this.createHistoryUI();

            // Agregar ambiente
            this.addEnvironment();

            this.isInitialized = true;
            console.log('[HISTORY-VR] ✅ Experiencia inicializada');

            return this;
        }

        /**
         * Configurar locaciones históricas
         */
        setupHistoricalLocations() {
            this.locations.set('teotihuacan', {
                name: 'Teotihuacán',
                description: 'Ciudad de los Dioses - Civilización prehispánica (100 a.C. - 550 d.C.)',
                period: 'Época Prehispánica',
                emoji: '🏛️',
                facts: [
                    'La Pirámide del Sol es la tercera más grande del mundo',
                    'Hogar de más de 100,000 habitantes en su apogeo',
                    'Centro cultural y religioso mesoamericano'
                ],
                color: 0xd4a574
            });

            this.locations.set('templo_mayor', {
                name: 'Templo Mayor',
                description: 'Centro ceremonial de Tenochtitlan - Civilización Azteca',
                period: 'Época Azteca (1325-1521)',
                emoji: '⚔️',
                facts: [
                    'Principal templo del imperio Mexica',
                    'Dedicado a Huitzilopochtli y Tláloc',
                    'Se reconstruyó 7 veces sobre sí mismo'
                ],
                color: 0x8b4513
            });

            this.locations.set('independencia', {
                name: 'Grito de Independencia',
                description: 'Dolores Hidalgo - 16 de Septiembre de 1810',
                period: 'Independencia de México',
                emoji: '🔔',
                facts: [
                    'Miguel Hidalgo dio el grito de independencia',
                    'Inicio del movimiento insurgente',
                    'La campana de Dolores es símbolo nacional'
                ],
                color: 0x006847
            });

            this.locations.set('revolucion', {
                name: 'Revolución Mexicana',
                description: 'Movimiento social y armado (1910-1920)',
                period: 'Revolución Mexicana',
                emoji: '🐴',
                facts: [
                    'Liderada por Villa, Zapata, Madero y Carranza',
                    'Primera revolución social del siglo XX',
                    'Resultó en la Constitución de 1917'
                ],
                color: 0xce1126
            });
        }

        /**
         * Crear UI de historia
         */
        createHistoryUI() {
            const container = this.renderer.domElement.parentElement;

            // Panel de información
            const infoPanel = document.createElement('div');
            infoPanel.id = 'history-info-panel';
            infoPanel.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(30, 20, 10, 0.95);
                color: #f4e4c1;
                padding: 20px;
                border-radius: 12px;
                max-width: 350px;
                border: 2px solid #8b4513;
                font-family: 'Georgia', serif;
            `;
            infoPanel.innerHTML = `
                <h3 id="location-title" style="margin: 0 0 10px; font-size: 1.3rem; color: #ffd700;">
                    🏛️ Museo Virtual de Historia
                </h3>
                <p id="location-desc" style="margin: 0; font-size: 0.9rem; line-height: 1.5;">
                    Selecciona una época para explorar
                </p>
                <div id="location-facts" style="margin-top: 15px; font-size: 0.85rem;"></div>
            `;
            container.style.position = 'relative';
            container.appendChild(infoPanel);

            // Selector de épocas
            const epochSelector = document.createElement('div');
            epochSelector.id = 'epoch-selector';
            epochSelector.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                padding: 15px;
                background: rgba(30, 20, 10, 0.95);
                border-radius: 50px;
                border: 2px solid #8b4513;
            `;

            const epochs = Array.from(this.locations.entries());
            epochSelector.innerHTML = epochs.map(([id, loc]) => `
                <button class="epoch-btn" data-location="${id}" style="
                    background: linear-gradient(135deg, #2a1a0a, #4a3020);
                    border: 2px solid #8b4513;
                    color: #f4e4c1;
                    padding: 10px 15px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                ">
                    ${loc.emoji} ${loc.name}
                </button>
            `).join('');

            container.appendChild(epochSelector);

            // Event listeners
            epochSelector.querySelectorAll('.epoch-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.visitLocation(btn.dataset.location);
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.05)';
                    btn.style.borderColor = '#ffd700';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.borderColor = '#8b4513';
                });
            });
        }

        /**
         * Agregar ambiente 3D
         */
        addEnvironment() {
            const THREE = this.THREE;

            // Suelo
            const groundGeometry = new THREE.PlaneGeometry(50, 50);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x4a3728,
                roughness: 0.9
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            this.scene.add(ground);

            // Niebla para atmósfera
            this.scene.fog = new THREE.Fog(0x87ceeb, 20, 50);
        }

        /**
         * Visitar una locación histórica
         */
        async visitLocation(locationId) {
            console.log(`[HISTORY-VR] Visitando: ${locationId}`);

            const location = this.locations.get(locationId);
            if (!location) {
                console.warn(`[HISTORY-VR] Locación ${locationId} no encontrada`);
                return;
            }

            // Limpiar escena anterior
            this.clearScene();

            // Actualizar fondo según época
            this.scene.background = new this.THREE.Color(this.getBackgroundColor(locationId));

            // Construir monumento
            this.buildMonument(locationId, location);

            // Actualizar UI
            this.updateInfoPanel(location);

            this.currentLocation = locationId;
        }

        /**
         * Obtener color de fondo según época
         */
        getBackgroundColor(locationId) {
            const colors = {
                'teotihuacan': 0x87ceeb,   // Cielo azul brillante
                'templo_mayor': 0x708090,   // Gris nublado
                'independencia': 0x2f4f4f,  // Verde oscuro nocturno
                'revolucion': 0xcd853f      // Atardecer sepia
            };
            return colors[locationId] || 0x87ceeb;
        }

        /**
         * Construir monumento 3D
         */
        buildMonument(locationId, location) {
            const THREE = this.THREE;

            switch (locationId) {
                case 'teotihuacan':
                    this.buildPyramid(location.color);
                    break;
                case 'templo_mayor':
                    this.buildTemple(location.color);
                    break;
                case 'independencia':
                    this.buildChurch(location.color);
                    break;
                case 'revolucion':
                    this.buildRevolutionScene(location.color);
                    break;
            }
        }

        /**
         * Construir pirámide estilo Teotihuacán
         */
        buildPyramid(color) {
            const THREE = this.THREE;
            const pyramid = new THREE.Group();

            // Construir niveles de la pirámide
            for (let i = 0; i < 5; i++) {
                const size = 10 - i * 1.5;
                const height = 2;
                const geometry = new THREE.BoxGeometry(size, height, size);
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.8
                });
                const level = new THREE.Mesh(geometry, material);
                level.position.y = i * height + height / 2;
                level.castShadow = true;
                level.receiveShadow = true;
                pyramid.add(level);
            }

            // Escaleras
            const stairsGeometry = new THREE.BoxGeometry(2, 10, 0.5);
            const stairsMaterial = new THREE.MeshStandardMaterial({ color: 0xb8956d });
            const stairs = new THREE.Mesh(stairsGeometry, stairsMaterial);
            stairs.position.set(0, 5, 5.5);
            stairs.rotation.x = -Math.PI / 6;
            pyramid.add(stairs);

            this.scene.add(pyramid);
        }

        /**
         * Construir templo azteca
         */
        buildTemple(color) {
            const THREE = this.THREE;
            const temple = new THREE.Group();

            // Base del templo
            const baseGeometry = new THREE.BoxGeometry(12, 4, 12);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: color });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 2;
            temple.add(base);

            // Torres gemelas
            for (let x of [-3, 3]) {
                const towerGeometry = new THREE.BoxGeometry(3, 8, 3);
                const tower = new THREE.Mesh(towerGeometry, baseMaterial);
                tower.position.set(x, 8, 0);
                temple.add(tower);

                // Techos
                const roofGeometry = new THREE.ConeGeometry(2.5, 3, 4);
                const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.set(x, 13.5, 0);
                temple.add(roof);
            }

            this.scene.add(temple);
        }

        /**
         * Construir iglesia de Dolores
         */
        buildChurch(color) {
            const THREE = this.THREE;
            const church = new THREE.Group();

            // Cuerpo principal
            const bodyGeometry = new THREE.BoxGeometry(8, 10, 6);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.y = 5;
            church.add(body);

            // Torre del campanario
            const towerGeometry = new THREE.BoxGeometry(3, 15, 3);
            const tower = new THREE.Mesh(towerGeometry, bodyMaterial);
            tower.position.set(0, 7.5, 4);
            church.add(tower);

            // Campana (esfera)
            const bellGeometry = new THREE.SphereGeometry(0.8, 32, 32);
            const bellMaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.8,
                roughness: 0.2
            });
            const bell = new THREE.Mesh(bellGeometry, bellMaterial);
            bell.position.set(0, 14, 4);
            church.add(bell);

            // Cruz en la torre
            const crossV = new THREE.BoxGeometry(0.3, 2, 0.3);
            const crossH = new THREE.BoxGeometry(1.2, 0.3, 0.3);
            const crossMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

            const crossVMesh = new THREE.Mesh(crossV, crossMaterial);
            crossVMesh.position.set(0, 16, 4);
            church.add(crossVMesh);

            const crossHMesh = new THREE.Mesh(crossH, crossMaterial);
            crossHMesh.position.set(0, 16.5, 4);
            church.add(crossHMesh);

            this.scene.add(church);
        }

        /**
         * Construir escena de la revolución
         */
        buildRevolutionScene(color) {
            const THREE = this.THREE;
            const scene = new THREE.Group();

            // Monumento a la Revolución (simplificado)
            const baseGeometry = new THREE.BoxGeometry(10, 3, 10);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = 1.5;
            scene.add(base);

            // Arco
            const archGeometry = new THREE.TorusGeometry(4, 0.8, 16, 32, Math.PI);
            const archMaterial = new THREE.MeshStandardMaterial({ color: 0x696969 });
            const arch = new THREE.Mesh(archGeometry, archMaterial);
            arch.position.set(0, 8, 0);
            scene.add(arch);

            // Columnas
            for (let x of [-4, 4]) {
                const columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 32);
                const column = new THREE.Mesh(columnGeometry, baseMaterial);
                column.position.set(x, 7, 0);
                scene.add(column);
            }

            this.scene.add(scene);
        }

        /**
         * Actualizar panel de información
         */
        updateInfoPanel(location) {
            const titleEl = document.getElementById('location-title');
            const descEl = document.getElementById('location-desc');
            const factsEl = document.getElementById('location-facts');

            if (titleEl) titleEl.innerHTML = `${location.emoji} ${location.name}`;
            if (descEl) descEl.textContent = location.description;
            if (factsEl) {
                factsEl.innerHTML = `
                    <strong>📜 Datos Históricos:</strong>
                    <ul style="margin: 5px 0 0 15px; padding: 0;">
                        ${location.facts.map(f => `<li style="margin: 5px 0;">${f}</li>`).join('')}
                    </ul>
                `;
            }
        }

        /**
         * Callback de animación
         */
        onAnimate(scene) {
            // Rotación suave opcional
        }

        /**
         * Limpiar escena
         */
        clearScene() {
            const toRemove = [];
            this.scene.traverse((object) => {
                if (object.isMesh && object.geometry) {
                    toRemove.push(object);
                }
            });
            toRemove.forEach(obj => {
                if (obj.parent) obj.parent.remove(obj);
            });
        }

        /**
         * Limpiar experiencia
         */
        dispose() {
            if (this.sceneUtils) {
                this.sceneUtils.dispose();
            }

            ['history-info-panel', 'epoch-selector'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });

            this.isInitialized = false;
            console.log('[HISTORY-VR] Experiencia terminada');
        }
    }

    // =====================================================
    // EXPORT GLOBAL
    // =====================================================

    window.HistoryVRExperience = HistoryVRExperience;
    window.historyVR = new HistoryVRExperience();

    console.log('🏛️ History VR Experience cargado');

})();
