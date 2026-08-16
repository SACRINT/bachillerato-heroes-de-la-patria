/**
 * 🎮 THREE.JS LOADER - Carga Lazy de Three.js para AR/VR
 * FASE 5.1 - Ecosistema AR/VR
 * Creado: 07 Diciembre 2025
 * 
 * Proporciona:
 * - Carga lazy de Three.js desde CDN
 * - Detección de capacidades WebGL/WebXR
 * - Wrapper para inicializar escenas 3D
 */

(function () {
    'use strict';

    // =====================================================
    // CONFIGURACIÓN
    // =====================================================

    const THREE_VERSION = '0.160.0';
    const CDN_BASE = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}`;

    const SCRIPTS = {
        core: `${CDN_BASE}/build/three.module.min.js`,
        orbitControls: `${CDN_BASE}/examples/jsm/controls/OrbitControls.js`,
        gltfLoader: `${CDN_BASE}/examples/jsm/loaders/GLTFLoader.js`,
        draco: `${CDN_BASE}/examples/jsm/loaders/DRACOLoader.js`
    };

    // =====================================================
    // THREE.JS LOADER CLASS
    // =====================================================

    class ThreeJSLoader {
        constructor() {
            this.loaded = false;
            this.loading = false;
            this.THREE = null;
            this.OrbitControls = null;
            this.GLTFLoader = null;
            this.capabilities = null;
            this.loadPromise = null;
        }

        /**
         * Detectar capacidades del dispositivo
         */
        async detectCapabilities() {
            const capabilities = {
                webgl: false,
                webgl2: false,
                webxr: false,
                xrAR: false,
                xrVR: false,
                deviceMemory: navigator.deviceMemory || 4,
                hardwareConcurrency: navigator.hardwareConcurrency || 4,
                mobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
                touchScreen: 'ontouchstart' in window,
                recommended: 'unknown'
            };

            // Test WebGL
            try {
                const canvas = document.createElement('canvas');
                capabilities.webgl = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
                capabilities.webgl2 = !!canvas.getContext('webgl2');
            } catch (e) {
                void 0;
            }

            // Test WebXR
            if ('xr' in navigator) {
                capabilities.webxr = true;
                try {
                    capabilities.xrAR = await navigator.xr.isSessionSupported('immersive-ar');
                } catch (e) { /* AR not supported */ }
                try {
                    capabilities.xrVR = await navigator.xr.isSessionSupported('immersive-vr');
                } catch (e) { /* VR not supported */ }
            }

            // Recommendation
            if (capabilities.webgl2 && capabilities.deviceMemory >= 4) {
                capabilities.recommended = 'high';
            } else if (capabilities.webgl) {
                capabilities.recommended = 'medium';
            } else {
                capabilities.recommended = 'low';
            }

            this.capabilities = capabilities;
            return capabilities;
        }

        /**
         * Cargar Three.js de forma lazy
         */
        async load() {
            if (this.loaded) {
                return { THREE: this.THREE, OrbitControls: this.OrbitControls };
            }

            if (this.loading) {
                return this.loadPromise;
            }

            this.loading = true;

            this.loadPromise = new Promise(async (resolve, reject) => {
                try {
                    void 0;

                    // Cargar Three.js core
                    const threeModule = await import(SCRIPTS.core);
                    this.THREE = threeModule;

                    // Cargar OrbitControls
                    try {
                        const controlsModule = await import(SCRIPTS.orbitControls);
                        this.OrbitControls = controlsModule.OrbitControls;
                    } catch (e) {
                        void 0;
                    }

                    // Cargar GLTFLoader
                    try {
                        const gltfModule = await import(SCRIPTS.gltfLoader);
                        this.GLTFLoader = gltfModule.GLTFLoader;
                    } catch (e) {
                        void 0;
                    }

                    this.loaded = true;
                    this.loading = false;

                    void 0;

                    resolve({
                        THREE: this.THREE,
                        OrbitControls: this.OrbitControls,
                        GLTFLoader: this.GLTFLoader
                    });

                } catch (error) {
                    this.loading = false;
                    console.error('[THREE-LOADER] ❌ Error cargando Three.js:', error);
                    reject(error);
                }
            });

            return this.loadPromise;
        }

        /**
         * Crear una escena 3D básica
         */
        async createScene(containerId, options = {}) {
            if (!this.loaded) {
                await this.load();
            }

            const THREE = this.THREE;
            const container = document.getElementById(containerId);

            if (!container) {
                throw new Error(`Container "${containerId}" no encontrado`);
            }

            const width = options.width || container.clientWidth || window.innerWidth;
            const height = options.height || container.clientHeight || window.innerHeight;

            // Crear escena
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(options.backgroundColor || 0x1a1a2e);

            // Crear cámara
            const camera = new THREE.PerspectiveCamera(
                options.fov || 75,
                width / height,
                options.near || 0.1,
                options.far || 1000
            );
            camera.position.set(
                options.cameraX || 0,
                options.cameraY || 2,
                options.cameraZ || 5
            );

            // Crear renderer
            const renderer = new THREE.WebGLRenderer({
                antialias: options.antialias !== false,
                alpha: options.alpha || false
            });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            if (options.shadows !== false) {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }

            container.appendChild(renderer.domElement);

            // Agregar controles de órbita
            let controls = null;
            if (this.OrbitControls && options.controls !== false) {
                controls = new this.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
                controls.enablePan = options.enablePan !== false;
                controls.enableZoom = options.enableZoom !== false;
            }

            // Agregar luces básicas
            if (options.lights !== false) {
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(5, 10, 7.5);
                directionalLight.castShadow = true;
                scene.add(directionalLight);
            }

            // Agregar grid helper
            if (options.grid) {
                const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
                scene.add(gridHelper);
            }

            // Loop de animación
            let animationId = null;
            const animate = () => {
                animationId = requestAnimationFrame(animate);

                if (controls) {
                    controls.update();
                }

                // Callback de animación personalizada
                if (options.onAnimate) {
                    options.onAnimate(scene, camera, renderer);
                }

                renderer.render(scene, camera);
            };

            // Manejar resize
            const handleResize = () => {
                const newWidth = container.clientWidth || window.innerWidth;
                const newHeight = container.clientHeight || window.innerHeight;

                camera.aspect = newWidth / newHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(newWidth, newHeight);
            };

            window.addEventListener('resize', handleResize);

            // Iniciar animación
            animate();

            // Retornar objeto con escena y métodos de control
            return {
                scene,
                camera,
                renderer,
                controls,
                THREE,

                // Métodos de utilidad
                addObject: (object) => scene.add(object),
                removeObject: (object) => scene.remove(object),

                // Crear geometrías básicas
                createBox: (size = 1, color = 0x00ff00) => {
                    const geometry = new THREE.BoxGeometry(size, size, size);
                    const material = new THREE.MeshStandardMaterial({ color });
                    return new THREE.Mesh(geometry, material);
                },

                createSphere: (radius = 0.5, color = 0x0066ff) => {
                    const geometry = new THREE.SphereGeometry(radius, 32, 32);
                    const material = new THREE.MeshStandardMaterial({ color });
                    return new THREE.Mesh(geometry, material);
                },

                createCylinder: (radius = 0.5, height = 1, color = 0xff6600) => {
                    const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
                    const material = new THREE.MeshStandardMaterial({ color });
                    return new THREE.Mesh(geometry, material);
                },

                // Limpiar y destruir
                dispose: () => {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                    }
                    window.removeEventListener('resize', handleResize);
                    renderer.dispose();
                    container.removeChild(renderer.domElement);
                }
            };
        }

        /**
         * Crear modelo de molécula 3D
         */
        createMolecule(atoms, bonds, scale = 1) {
            const THREE = this.THREE;
            const group = new THREE.Group();

            // Colores por elemento
            const elementColors = {
                'H': 0xffffff,  // Hidrógeno - blanco
                'C': 0x333333,  // Carbono - gris oscuro
                'N': 0x0000ff,  // Nitrógeno - azul
                'O': 0xff0000,  // Oxígeno - rojo
                'S': 0xffff00,  // Azufre - amarillo
                'Cl': 0x00ff00, // Cloro - verde
                'Na': 0x9400d3  // Sodio - violeta
            };

            // Tamaños por elemento
            const elementSizes = {
                'H': 0.3, 'C': 0.5, 'N': 0.45, 'O': 0.4, 'S': 0.6, 'Cl': 0.5, 'Na': 0.6
            };

            // Crear átomos
            atoms.forEach(atom => {
                const geometry = new THREE.SphereGeometry(
                    (elementSizes[atom.element] || 0.4) * scale,
                    32, 32
                );
                const material = new THREE.MeshStandardMaterial({
                    color: elementColors[atom.element] || 0x888888,
                    metalness: 0.3,
                    roughness: 0.7
                });
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(
                    atom.x * scale,
                    atom.y * scale,
                    atom.z * scale
                );
                sphere.userData = { element: atom.element, label: atom.label };
                group.add(sphere);
            });

            // Crear enlaces
            bonds.forEach(bond => {
                const atom1 = atoms[bond.from];
                const atom2 = atoms[bond.to];

                const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z).multiplyScalar(scale);
                const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z).multiplyScalar(scale);

                const direction = new THREE.Vector3().subVectors(end, start);
                const length = direction.length();

                const geometry = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, length, 8);
                const material = new THREE.MeshStandardMaterial({ color: 0x999999 });
                const cylinder = new THREE.Mesh(geometry, material);

                // Posicionar el cilindro
                cylinder.position.copy(start.add(end).divideScalar(2));
                cylinder.quaternion.setFromUnitVectors(
                    new THREE.Vector3(0, 1, 0),
                    direction.normalize()
                );

                group.add(cylinder);
            });

            return group;
        }

        /**
         * Obtener datos de moléculas predefinidas
         */
        getMoleculeData(name) {
            const molecules = {
                'H2O': {
                    atoms: [
                        { element: 'O', x: 0, y: 0, z: 0, label: 'O' },
                        { element: 'H', x: -0.76, y: 0.59, z: 0, label: 'H1' },
                        { element: 'H', x: 0.76, y: 0.59, z: 0, label: 'H2' }
                    ],
                    bonds: [
                        { from: 0, to: 1, order: 1 },
                        { from: 0, to: 2, order: 1 }
                    ]
                },
                'CO2': {
                    atoms: [
                        { element: 'C', x: 0, y: 0, z: 0, label: 'C' },
                        { element: 'O', x: -1.16, y: 0, z: 0, label: 'O1' },
                        { element: 'O', x: 1.16, y: 0, z: 0, label: 'O2' }
                    ],
                    bonds: [
                        { from: 0, to: 1, order: 2 },
                        { from: 0, to: 2, order: 2 }
                    ]
                },
                'CH4': {
                    atoms: [
                        { element: 'C', x: 0, y: 0, z: 0, label: 'C' },
                        { element: 'H', x: 0.63, y: 0.63, z: 0.63, label: 'H1' },
                        { element: 'H', x: -0.63, y: -0.63, z: 0.63, label: 'H2' },
                        { element: 'H', x: -0.63, y: 0.63, z: -0.63, label: 'H3' },
                        { element: 'H', x: 0.63, y: -0.63, z: -0.63, label: 'H4' }
                    ],
                    bonds: [
                        { from: 0, to: 1, order: 1 },
                        { from: 0, to: 2, order: 1 },
                        { from: 0, to: 3, order: 1 },
                        { from: 0, to: 4, order: 1 }
                    ]
                },
                'NaCl': {
                    atoms: [
                        { element: 'Na', x: -1, y: 0, z: 0, label: 'Na+' },
                        { element: 'Cl', x: 1, y: 0, z: 0, label: 'Cl-' }
                    ],
                    bonds: [
                        { from: 0, to: 1, order: 1 }
                    ]
                }
            };
            return molecules[name] || null;
        }
    }

    // =====================================================
    // EXPORT GLOBAL
    // =====================================================

    window.ThreeJSLoader = ThreeJSLoader;
    window.threeLoader = new ThreeJSLoader();

    void 0;

})();
