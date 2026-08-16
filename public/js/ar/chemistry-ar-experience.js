/**
 * 🧪 QUÍMICA AR EXPERIENCE
 * Visualización de moléculas y reacciones químicas en 3D
 * FASE 5.2 - Ecosistema AR/VR
 * Creado: 07 Diciembre 2025
 */

(function () {
    'use strict';

    class ChemistryARExperience {
        constructor() {
            this.scene = null;
            this.camera = null;
            this.renderer = null;
            this.controls = null;
            this.THREE = null;
            this.molecules = new Map();
            this.currentMolecule = null;
            this.animationId = null;
            this.isInitialized = false;
        }

        /**
         * Inicializar la experiencia de química
         */
        async initialize(containerId) {
            void 0;

            if (!window.threeLoader) {
                throw new Error('ThreeJSLoader no disponible');
            }

            // Cargar Three.js
            const { THREE, OrbitControls } = await window.threeLoader.load();
            this.THREE = THREE;

            // Crear escena
            const sceneData = await window.threeLoader.createScene(containerId, {
                backgroundColor: 0x0a0a1a,
                cameraZ: 8,
                cameraY: 3,
                grid: true,
                lights: true,
                onAnimate: (scene) => this.onAnimate(scene)
            });

            this.scene = sceneData.scene;
            this.camera = sceneData.camera;
            this.renderer = sceneData.renderer;
            this.controls = sceneData.controls;
            this.sceneUtils = sceneData;

            // Agregar iluminación adicional para moléculas
            this.addChemistryLighting();

            // Crear UI de información
            this.createInfoPanel();

            this.isInitialized = true;
            void 0;

            return this;
        }

        /**
         * Agregar iluminación especial para química
         */
        addChemistryLighting() {
            const THREE = this.THREE;

            // Luz puntual central
            const pointLight = new THREE.PointLight(0x00ffff, 0.5, 20);
            pointLight.position.set(0, 5, 0);
            this.scene.add(pointLight);

            // Luces de colores para efecto científico
            const blueLight = new THREE.PointLight(0x0066ff, 0.3, 15);
            blueLight.position.set(-5, 3, -5);
            this.scene.add(blueLight);

            const purpleLight = new THREE.PointLight(0x9900ff, 0.3, 15);
            purpleLight.position.set(5, 3, 5);
            this.scene.add(purpleLight);
        }

        /**
         * Crear panel de información
         */
        createInfoPanel() {
            const container = this.renderer.domElement.parentElement;

            const panel = document.createElement('div');
            panel.id = 'chemistry-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(10, 10, 30, 0.9);
                color: #00ffcc;
                padding: 20px;
                border-radius: 12px;
                font-family: 'Segoe UI', sans-serif;
                max-width: 300px;
                border: 1px solid rgba(0, 255, 204, 0.3);
                backdrop-filter: blur(10px);
            `;
            panel.innerHTML = `
                <h3 style="margin: 0 0 10px; font-size: 1.2rem;">🧪 Laboratorio de Química AR</h3>
                <p id="molecule-name" style="margin: 0; font-size: 0.9rem; color: #aaa;">
                    Selecciona una molécula para visualizar
                </p>
                <p id="molecule-formula" style="margin: 5px 0 0; font-size: 1.5rem; font-weight: bold;"></p>
            `;
            container.style.position = 'relative';
            container.appendChild(panel);

            this.infoPanel = panel;
        }

        /**
         * Mostrar molécula
         */
        async showMolecule(moleculeName) {
            void 0;

            // Limpiar molécula anterior
            if (this.currentMolecule) {
                this.scene.remove(this.currentMolecule);
            }

            // Obtener datos de la molécula
            const moleculeData = window.threeLoader.getMoleculeData(moleculeName);
            if (!moleculeData) {
                void 0;
                return;
            }

            // Crear molécula 3D
            this.currentMolecule = window.threeLoader.createMolecule(
                moleculeData.atoms,
                moleculeData.bonds,
                1.5
            );

            // Centrar molécula
            this.currentMolecule.position.set(0, 2, 0);

            this.scene.add(this.currentMolecule);

            // Actualizar panel de información
            this.updateInfoPanel(moleculeName, moleculeData);

            // Animar entrada
            this.animateMoleculeEntry();

            return this.currentMolecule;
        }

        /**
         * Actualizar panel de información
         */
        updateInfoPanel(name, data) {
            const moleculeInfo = {
                'H2O': { name: 'Agua', formula: 'H₂O', desc: 'Molécula de agua - esencial para la vida' },
                'CO2': { name: 'Dióxido de Carbono', formula: 'CO₂', desc: 'Gas de efecto invernadero' },
                'CH4': { name: 'Metano', formula: 'CH₄', desc: 'Hidrocarburo más simple' },
                'NaCl': { name: 'Cloruro de Sodio', formula: 'NaCl', desc: 'Sal de mesa común' }
            };

            const info = moleculeInfo[name] || { name, formula: name, desc: '' };

            const nameEl = document.getElementById('molecule-name');
            const formulaEl = document.getElementById('molecule-formula');

            if (nameEl) nameEl.textContent = `${info.name} - ${info.desc}`;
            if (formulaEl) formulaEl.textContent = info.formula;
        }

        /**
         * Animar entrada de molécula
         */
        animateMoleculeEntry() {
            if (!this.currentMolecule) return;

            this.currentMolecule.scale.set(0.01, 0.01, 0.01);

            const targetScale = 1;
            const duration = 500;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic

                const scale = 0.01 + (targetScale - 0.01) * eased;
                this.currentMolecule.scale.set(scale, scale, scale);

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
            // Rotar molécula suavemente
            if (this.currentMolecule) {
                this.currentMolecule.rotation.y += 0.005;
            }
        }

        /**
         * Mostrar todas las moléculas disponibles
         */
        showMoleculeList() {
            const molecules = [
                { id: 'H2O', name: 'Agua', emoji: '💧' },
                { id: 'CO2', name: 'CO₂', emoji: '🌫️' },
                { id: 'CH4', name: 'Metano', emoji: '🔥' },
                { id: 'NaCl', name: 'Sal', emoji: '🧂' }
            ];

            const container = this.renderer.domElement.parentElement;

            let listEl = document.getElementById('molecule-list');
            if (!listEl) {
                listEl = document.createElement('div');
                listEl.id = 'molecule-list';
                listEl.style.cssText = `
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    gap: 10px;
                    padding: 15px;
                    background: rgba(10, 10, 30, 0.9);
                    border-radius: 50px;
                    border: 1px solid rgba(0, 255, 204, 0.3);
                `;
                container.appendChild(listEl);
            }

            listEl.innerHTML = (typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(molecules.map(m => `
                <button class="molecule-btn" data-molecule="${m.id}" style="
                    background: linear-gradient(135deg, #1a1a3a, #2a2a5a)) : (typeof sanitizeHTML === 'function' ? sanitizeHTML(molecules.map(m => `
                <button class="molecule-btn" data-molecule="${m.id}" style="
                    background: linear-gradient(135deg, #1a1a3a, #2a2a5a)) : molecules.map(m => `
                <button class="molecule-btn" data-molecule="${m.id}" style="
                    background: linear-gradient(135deg, #1a1a3a, #2a2a5a)));
                    border: 2px solid rgba(0, 255, 204, 0.3);
                    color: white;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                ">
                    ${m.emoji} ${m.name}
                </button>
            `).join('');

            // Event handlers
            listEl.querySelectorAll('.molecule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.showMolecule(btn.dataset.molecule);
                });
                btn.addEventListener('mouseenter', () => {
                    btn.style.transform = 'scale(1.1)';
                    btn.style.borderColor = '#00ffcc';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                    btn.style.borderColor = 'rgba(0, 255, 204, 0.3)';
                });
            });
        }

        /**
         * Simular reacción química
         */
        async simulateReaction(reactionType) {
            void 0;

            const reactions = {
                'combustion': {
                    reactants: ['CH4', 'O2', 'O2'],
                    products: ['CO2', 'H2O', 'H2O'],
                    description: 'Combustión del metano: CH₄ + 2O₂ → CO₂ + 2H₂O'
                },
                'neutralization': {
                    reactants: ['HCl', 'NaOH'],
                    products: ['NaCl', 'H2O'],
                    description: 'Neutralización: HCl + NaOH → NaCl + H₂O'
                }
            };

            const reaction = reactions[reactionType];
            if (!reaction) {
                void 0;
                return;
            }

            // Mostrar descripción
            if (this.infoPanel) {
                document.getElementById('molecule-name').textContent = reaction.description;
                document.getElementById('molecule-formula').textContent = '⚗️ Reacción en proceso...';
            }

            // Animación simple de la reacción
            await this.showMolecule(reaction.reactants[0]);

            return { success: true, reaction };
        }

        /**
         * Limpiar experiencia
         */
        dispose() {
            if (this.sceneUtils) {
                this.sceneUtils.dispose();
            }

            const panel = document.getElementById('chemistry-info-panel');
            if (panel) panel.remove();

            const list = document.getElementById('molecule-list');
            if (list) list.remove();

            this.isInitialized = false;
            void 0;
        }
    }

    // =====================================================
    // EXPORT GLOBAL
    // =====================================================

    window.ChemistryARExperience = ChemistryARExperience;
    window.chemistryAR = new ChemistryARExperience();

    void 0;

})();
