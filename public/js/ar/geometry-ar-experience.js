/**
 * 📐 GEOMETRÍA AR EXPERIENCE
 * Figuras geométricas 3D interactivas con cálculos en tiempo real
 * FASE 5.2 - Ecosistema AR/VR
 * Creado: 07 Diciembre 2025
 */

(function () {
    'use strict';

    class GeometryARExperience {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.THREE = null;
            this.currentShape = null;
            this.isInitialized = false;
            this.shapes = new Map();
            this.selectedShape = null;
        }

        /**
         * Inicializar la experiencia de geometría
         */
        async initialize(containerId) {
            void 0;

            if (!window.threeLoader) {
                throw new Error('ThreeJSLoader no disponible');
            }

            const { THREE } = await window.threeLoader.load();
            this.THREE = THREE;

            // Crear escena
            const sceneData = await window.threeLoader.createScene(containerId, {
                backgroundColor: 0x1a1a2e,
                cameraZ: 10,
                cameraY: 5,
                grid: true,
                lights: true,
                onAnimate: (scene) => this.onAnimate(scene)
            });

            this.scene = sceneData.scene;
            this.camera = sceneData.camera;
            this.renderer = sceneData.renderer;
            this.controls = sceneData.controls;
            this.sceneUtils = sceneData;

            // Configurar figuras
            this.setupShapes();

            // Crear UI
            this.createGeometryUI();

            // Agregar ejes de referencia
            this.addAxesHelper();

            this.isInitialized = true;
            void 0;

            return this;
        }

        /**
         * Configurar figuras geométricas
         */
        setupShapes() {
            this.shapes.set('cube', {
                name: 'Cubo',
                emoji: '🟦',
                params: { size: 2 },
                formulas: {
                    volume: (p) => Math.pow(p.size, 3),
                    surface: (p) => 6 * Math.pow(p.size, 2),
                    diagonal: (p) => p.size * Math.sqrt(3)
                },
                formulaText: {
                    volume: 'V = a³',
                    surface: 'A = 6a²',
                    diagonal: 'd = a√3'
                }
            });

            this.shapes.set('sphere', {
                name: 'Esfera',
                emoji: '🔵',
                params: { radius: 1.5 },
                formulas: {
                    volume: (p) => (4 / 3) * Math.PI * Math.pow(p.radius, 3),
                    surface: (p) => 4 * Math.PI * Math.pow(p.radius, 2),
                    diameter: (p) => 2 * p.radius
                },
                formulaText: {
                    volume: 'V = (4/3)πr³',
                    surface: 'A = 4πr²',
                    diameter: 'd = 2r'
                }
            });

            this.shapes.set('cylinder', {
                name: 'Cilindro',
                emoji: '🛢️',
                params: { radius: 1, height: 3 },
                formulas: {
                    volume: (p) => Math.PI * Math.pow(p.radius, 2) * p.height,
                    surface: (p) => 2 * Math.PI * p.radius * (p.radius + p.height),
                    baseArea: (p) => Math.PI * Math.pow(p.radius, 2)
                },
                formulaText: {
                    volume: 'V = πr²h',
                    surface: 'A = 2πr(r+h)',
                    baseArea: 'Ab = πr²'
                }
            });

            this.shapes.set('cone', {
                name: 'Cono',
                emoji: '🔺',
                params: { radius: 1.5, height: 3 },
                formulas: {
                    volume: (p) => (1 / 3) * Math.PI * Math.pow(p.radius, 2) * p.height,
                    surface: (p) => Math.PI * p.radius * (p.radius + Math.sqrt(Math.pow(p.height, 2) + Math.pow(p.radius, 2))),
                    slantHeight: (p) => Math.sqrt(Math.pow(p.height, 2) + Math.pow(p.radius, 2))
                },
                formulaText: {
                    volume: 'V = (1/3)πr²h',
                    surface: 'A = πr(r+g)',
                    slantHeight: 'g = √(h²+r²)'
                }
            });

            this.shapes.set('pyramid', {
                name: 'Pirámide',
                emoji: '🔻',
                params: { base: 2, height: 3 },
                formulas: {
                    volume: (p) => (1 / 3) * Math.pow(p.base, 2) * p.height,
                    surface: (p) => Math.pow(p.base, 2) + 2 * p.base * Math.sqrt(Math.pow(p.height, 2) + Math.pow(p.base / 2, 2)),
                    apothem: (p) => Math.sqrt(Math.pow(p.height, 2) + Math.pow(p.base / 2, 2))
                },
                formulaText: {
                    volume: 'V = (1/3)b²h',
                    surface: 'A = b² + 2ba',
                    apothem: 'a = √(h²+(b/2)²)'
                }
            });

            this.shapes.set('torus', {
                name: 'Toroide',
                emoji: '🍩',
                params: { ringRadius: 2, tubeRadius: 0.5 },
                formulas: {
                    volume: (p) => 2 * Math.pow(Math.PI, 2) * p.ringRadius * Math.pow(p.tubeRadius, 2),
                    surface: (p) => 4 * Math.pow(Math.PI, 2) * p.ringRadius * p.tubeRadius
                },
                formulaText: {
                    volume: 'V = 2π²Rr²',
                    surface: 'A = 4π²Rr'
                }
            });
        }

        /**
         * Crear UI de geometría
         */
        createGeometryUI() {
            const container = this.renderer.domElement.parentElement;

            // Panel de información
            const infoPanel = document.createElement('div');
            infoPanel.id = 'geometry-info-panel';
            infoPanel.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(10, 10, 40, 0.95);
                color: #00ccff;
                padding: 20px;
                border-radius: 12px;
                max-width: 320px;
                border: 2px solid rgba(0, 200, 255, 0.5);
                font-family: 'Segoe UI', sans-serif;
            `;
            infoPanel.innerHTML = `
                <h3 id="shape-title" style="margin: 0 0 15px; font-size: 1.3rem; color: #00ffcc;">
                    📐 Geometría 3D Interactiva
                </h3>
                <div id="shape-formulas" style="font-size: 0.9rem; color: #aaa;">
                    Selecciona una figura para ver sus propiedades
                </div>
                <div id="shape-calculations" style="margin-top: 15px; font-family: monospace; font-size: 0.95rem;"></div>
            `;
            container.style.position = 'relative';
            container.appendChild(infoPanel);

            // Selector de figuras
            const shapeSelector = document.createElement('div');
            shapeSelector.id = 'shape-selector';
            shapeSelector.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
                padding: 15px;
                background: rgba(10, 10, 40, 0.95);
                border-radius: 50px;
                border: 2px solid rgba(0, 200, 255, 0.5);
                flex-wrap: wrap;
                justify-content: center;
                max-width: 90%;
            `;

            const shapes = Array.from(this.shapes.entries());
            shapeSelector.innerHTML = shapes.map(([id, shape]) => `
                <button class="shape-btn" data-shape="${id}" style="
                    background: linear-gradient(135deg, #0a0a2a, #1a1a4a);
                    border: 2px solid rgba(0, 200, 255, 0.3);
                    color: #00ccff;
                    padding: 8px 15px;
                    border-radius: 20px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                ">
                    ${shape.emoji} ${shape.name}
                </button>
            `).join('');

            container.appendChild(shapeSelector);

            // Event listeners
            shapeSelector.querySelectorAll('.shape-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.showShape(btn.dataset.shape);

                    // Resaltar botón activo
                    shapeSelector.querySelectorAll('.shape-btn').forEach(b => {
                        b.style.borderColor = 'rgba(0, 200, 255, 0.3)';
                        b.style.background = 'linear-gradient(135deg, #0a0a2a, #1a1a4a)';
                    });
                    btn.style.borderColor = '#00ffcc';
                    btn.style.background = 'linear-gradient(135deg, #1a1a4a, #2a2a6a)';
                });
            });

            // Panel de controles de parámetros
            this.createParameterControls(container);
        }

        /**
         * Crear controles de parámetros
         */
        createParameterControls(container) {
            const controlPanel = document.createElement('div');
            controlPanel.id = 'parameter-controls';
            controlPanel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 10, 40, 0.95);
                color: #00ccff;
                padding: 20px;
                border-radius: 12px;
                min-width: 200px;
                border: 2px solid rgba(0, 200, 255, 0.5);
                display: none;
            `;
            controlPanel.innerHTML = `
                <h4 style="margin: 0 0 15px; font-size: 1rem;">⚙️ Parámetros</h4>
                <div id="sliders-container"></div>
            `;
            container.appendChild(controlPanel);
        }

        /**
         * Agregar ejes de referencia
         */
        addAxesHelper() {
            const axesHelper = new this.THREE.AxesHelper(5);
            this.scene.add(axesHelper);

            // Labels para los ejes
            // (En una implementación completa, se agregarían sprites con texto)
        }

        /**
         * Mostrar figura geométrica
         */
        async showShape(shapeId) {
            void 0;

            const shapeData = this.shapes.get(shapeId);
            if (!shapeData) {
                void 0;
                return;
            }

            // Limpiar figura anterior
            if (this.currentShape) {
                this.scene.remove(this.currentShape);
            }

            // Crear geometría
            const geometry = this.createGeometry(shapeId, shapeData.params);
            const material = new this.THREE.MeshStandardMaterial({
                color: this.getShapeColor(shapeId),
                metalness: 0.3,
                roughness: 0.5,
                transparent: true,
                opacity: 0.85
            });

            this.currentShape = new this.THREE.Mesh(geometry, material);
            this.currentShape.position.y = 2;
            this.currentShape.castShadow = true;

            // Agregar wireframe
            const wireframe = new this.THREE.LineSegments(
                new this.THREE.WireframeGeometry(geometry),
                new this.THREE.LineBasicMaterial({ color: 0x00ffff, opacity: 0.5, transparent: true })
            );
            this.currentShape.add(wireframe);

            this.scene.add(this.currentShape);

            // Actualizar UI
            this.updateInfoPanel(shapeId, shapeData);
            this.updateParameterControls(shapeId, shapeData);

            // Animar entrada
            this.animateEntry();

            this.selectedShape = shapeId;
        }

        /**
         * Crear geometría según tipo
         */
        createGeometry(shapeId, params) {
            const THREE = this.THREE;

            switch (shapeId) {
                case 'cube':
                    return new THREE.BoxGeometry(params.size, params.size, params.size);
                case 'sphere':
                    return new THREE.SphereGeometry(params.radius, 32, 32);
                case 'cylinder':
                    return new THREE.CylinderGeometry(params.radius, params.radius, params.height, 32);
                case 'cone':
                    return new THREE.ConeGeometry(params.radius, params.height, 32);
                case 'pyramid':
                    return new THREE.ConeGeometry(params.base, params.height, 4);
                case 'torus':
                    return new THREE.TorusGeometry(params.ringRadius, params.tubeRadius, 16, 100);
                default:
                    return new THREE.BoxGeometry(2, 2, 2);
            }
        }

        /**
         * Obtener color de figura
         */
        getShapeColor(shapeId) {
            const colors = {
                'cube': 0x4a90d9,
                'sphere': 0x50c878,
                'cylinder': 0xff6b6b,
                'cone': 0xffd93d,
                'pyramid': 0x9b59b6,
                'torus': 0xff69b4
            };
            return colors[shapeId] || 0x4a90d9;
        }

        /**
         * Actualizar panel de información
         */
        updateInfoPanel(shapeId, shapeData) {
            const titleEl = document.getElementById('shape-title');
            const formulasEl = document.getElementById('shape-formulas');
            const calcsEl = document.getElementById('shape-calculations');

            if (titleEl) {
                titleEl.innerHTML = `${shapeData.emoji} ${shapeData.name}`;
            }

            if (formulasEl) {
                formulasEl.innerHTML = `
                    <strong>📝 Fórmulas:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        ${Object.entries(shapeData.formulaText).map(([key, formula]) =>
                    `<li style="margin: 5px 0;"><code>${formula}</code></li>`
                ).join('')}
                    </ul>
                `;
            }

            if (calcsEl) {
                const calculations = Object.entries(shapeData.formulas).map(([key, fn]) => {
                    const value = fn(shapeData.params);
                    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                    return `<div style="margin: 5px 0;"><span style="color:#00ffcc">${key}:</span> ${formattedValue}</div>`;
                }).join('');

                calcsEl.innerHTML = `
                    <strong>📊 Cálculos:</strong>
                    <div style="margin-top: 10px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                        ${calculations}
                    </div>
                `;
            }
        }

        /**
         * Actualizar controles de parámetros
         */
        updateParameterControls(shapeId, shapeData) {
            const controlPanel = document.getElementById('parameter-controls');
            const slidersContainer = document.getElementById('sliders-container');

            if (!controlPanel || !slidersContainer) return;

            controlPanel.style.display = 'block';
            slidersContainer.innerHTML = '';

            Object.entries(shapeData.params).forEach(([param, value]) => {
                const sliderDiv = document.createElement('div');
                sliderDiv.style.marginBottom = '15px';
                sliderDiv.innerHTML = `
                    <label style="display: block; margin-bottom: 5px; font-size: 0.85rem;">
                        ${param}: <span id="val-${param}">${value}</span>
                    </label>
                    <input type="range" id="slider-${param}" 
                           min="0.5" max="5" step="0.1" value="${value}"
                           style="width: 100%; accent-color: #00ccff;">
                `;
                slidersContainer.appendChild(sliderDiv);

                // Event listener para actualizar en tiempo real
                const slider = sliderDiv.querySelector(`#slider-${param}`);
                slider.addEventListener('input', (e) => {
                    const newValue = parseFloat(e.target.value);
                    shapeData.params[param] = newValue;
                    document.getElementById(`val-${param}`).textContent = newValue.toFixed(1);

                    // Recrear figura con nuevos parámetros
                    this.showShape(shapeId);
                });
            });
        }

        /**
         * Animar entrada de figura
         */
        animateEntry() {
            if (!this.currentShape) return;

            this.currentShape.scale.set(0.01, 0.01, 0.01);

            const duration = 400;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);

                const scale = 0.01 + (1 - 0.01) * eased;
                this.currentShape.scale.set(scale, scale, scale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }

        /**
         * Callback de animación
         */
        onAnimate(scene) {
            if (this.currentShape) {
                this.currentShape.rotation.y += 0.008;
            }
        }

        /**
         * Limpiar experiencia
         */
        dispose() {
            if (this.sceneUtils) {
                this.sceneUtils.dispose();
            }

            ['geometry-info-panel', 'shape-selector', 'parameter-controls'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });

            this.isInitialized = false;
            void 0;
        }
    }

    // =====================================================
    // EXPORT GLOBAL
    // =====================================================

    window.GeometryARExperience = GeometryARExperience;
    window.geometryAR = new GeometryARExperience();

    void 0;

})();
