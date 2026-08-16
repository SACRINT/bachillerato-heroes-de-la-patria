// Variables globales
        let arSystem = null;
        let labSimulator = null;
        let virtualLabs = null;

        // Inicialización del sistema AR/VR
        document.addEventListener('DOMContentLoaded', async function () {
            

            try {
                // Inicializar sistemas
                arSystem = new AREducationSystem();
                labSimulator = new LabSimulator3D();
                virtualLabs = new VirtualLabsSystem();

                // Verificar compatibilidad
                await checkARVRCompatibility();

                // Activar interfaz según capacidades
                activateAvailableFeatures();

                
            } catch (error) {
                console.error('❌ Error inicializando AR/VR:', error);
                showCompatibilityError();
            }
        });

        // Verificar compatibilidad AR/VR
        async function checkARVRCompatibility() {
            const status = document.getElementById('arStatus');
            const results = document.getElementById('compatibilityResults');

            // Verificar WebXR
            const webxrSupported = 'xr' in navigator;
            updateDeviceIcon('webxr-icon', webxrSupported);

            // Verificar WebGL
            const canvas = document.createElement('canvas');
            const webglSupported = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            updateDeviceIcon('webgl-icon', webglSupported);

            // Verificar cámara
            let cameraSupported = false;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                cameraSupported = true;
                stream.getTracks().forEach(track => track.stop());
            } catch (e) {
                
            }
            updateDeviceIcon('camera-icon', cameraSupported);

            // Verificar sensores de orientación
            const sensorsSupported = 'DeviceOrientationEvent' in window;
            updateDeviceIcon('sensors-icon', sensorsSupported);

            // Actualizar estado general
            const overallSupport = webglSupported && cameraSupported;

            if (overallSupport) {
                results.innerHTML = `
                    <p><span class="status-indicator status-available"></span>✅ Sistema AR/VR listo para usar</p>
                    <p>Todas las funcionalidades están disponibles en este dispositivo</p>
                `;
            } else if (webglSupported) {
                results.innerHTML = `
                    <p><span class="status-indicator status-partial"></span>⚡ Funcionalidad limitada disponible</p>
                    <p>Algunas características AR requieren permisos de cámara</p>
                `;
            } else {
                results.innerHTML = `
                    <p><span class="status-indicator status-unavailable"></span>❌ AR/VR no compatible</p>
                    <p>Este dispositivo/navegador no soporta las tecnologías requeridas</p>
                `;
            }

            return overallSupport;
        }

        // Actualizar iconos de dispositivos
        function updateDeviceIcon(iconId, supported) {
            const icon = document.getElementById(iconId);
            if (supported) {
                icon.classList.add('supported');
            }
        }

        // Activar funciones disponibles
        function activateAvailableFeatures() {
            const buttons = document.querySelectorAll('.launch-btn');

            // Habilitar botones si el sistema es compatible
            if (arSystem && arSystem.arSupport.available) {
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                });
            } else {
                // Modo demo/simulación
                buttons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '0.8';
                    btn.textContent = btn.textContent.replace('AR', 'Demo');
                });
            }
        }

        // Lanzar experiencia AR por materia
        async function launchARExperience(subject) {
            

            try {
                // Mostrar visor AR
                const viewer = document.getElementById('arViewer');
                viewer.style.display = 'block';

                // Inicializar experiencia AR
                const experience = await arSystem.startExperience(subject, 'basic');

                if (experience.success) {
                    
                    // Aquí se renderizaría la experiencia AR real
                    simulateARExperience(subject);
                } else {
                    throw new Error(experience.error);
                }

            } catch (error) {
                console.error('❌ Error lanzando AR:', error);
                alert('Error al iniciar la experiencia AR. Verifique los permisos de cámara.');
                closeARViewer();
            }
        }

        // Lanzar laboratorio virtual 3D
        async function launchVirtualLab() {
            

            try {
                const viewer = document.getElementById('arViewer');
                viewer.style.display = 'block';

                // Inicializar laboratorio 3D
                await labSimulator.initializeEnvironment();
                

                simulateLabExperience();

            } catch (error) {
                console.error('❌ Error lanzando laboratorio 3D:', error);
                alert('Error al iniciar el laboratorio virtual.');
                closeARViewer();
            }
        }

        // Lanzar experiencia VR inmersiva
        async function launchVRExperience() {
            

            try {
                // Verificar soporte VR
                if ('xr' in navigator) {
                    const session = await navigator.xr.requestSession('immersive-vr');
                    
                    // Aquí se inicializaría la experiencia VR real
                } else {
                    // Modo simulación
                    const viewer = document.getElementById('arViewer');
                    viewer.style.display = 'block';
                    simulateVRExperience();
                }

            } catch (error) {
                console.error('❌ Error lanzando VR:', error);
                alert('VR no disponible. Mostrando experiencia simulada.');
                const viewer = document.getElementById('arViewer');
                viewer.style.display = 'block';
                simulateVRExperience();
            }
        }

        // Simulaciones para demo
        function simulateARExperience(subject) {
            const canvas = document.getElementById('arCanvas');
            const ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Simular experiencia AR
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#fff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`🥽 Experiencia AR: ${subject.toUpperCase()}`, canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText('(Simulación - Configurar cámaras reales para AR completo)', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Mueva su dispositivo para explorar el entorno virtual', canvas.width / 2, canvas.height / 2 + 50);
        }

        function simulateLabExperience() {
            const canvas = document.getElementById('arCanvas');
            const ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            ctx.fillStyle = '#001122';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔬 LABORATORIO VIRTUAL 3D', canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText('Entorno de simulación científica avanzada', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Use los controles para interactuar con equipos', canvas.width / 2, canvas.height / 2 + 50);
        }

        function simulateVRExperience() {
            const canvas = document.getElementById('arCanvas');
            const ctx = canvas.getContext('2d');

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            ctx.fillStyle = '#000033';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🌍 REALIDAD VIRTUAL INMERSIVA', canvas.width / 2, canvas.height / 2 - 50);
            ctx.fillText('Exploración 360° del entorno educativo', canvas.width / 2, canvas.height / 2);
            ctx.fillText('Conecte un visor VR para experiencia completa', canvas.width / 2, canvas.height / 2 + 50);
        }

        // Controles AR/VR
        function toggleARRecording() {
            
            alert('Función de grabación AR activada (simulada)');
        }

        function takeARScreenshot() {
            
            alert('Captura de pantalla guardada (simulada)');
        }

        function closeARViewer() {
            const viewer = document.getElementById('arViewer');
            viewer.style.display = 'none';

            // Limpiar recursos AR/VR
            if (arSystem && arSystem.activeSession) {
                arSystem.endSession();
            }
        }

        // Mostrar error de compatibilidad
        function showCompatibilityError() {
            const results = document.getElementById('compatibilityResults');
            results.innerHTML = `
                <p><span class="status-indicator status-unavailable"></span>❌ Error de inicialización</p>
                <p>No se pudieron cargar los sistemas AR/VR</p>
            `;
        }

        // Eventos de teclado para controles
        document.addEventListener('keydown', function (e) {
            if (document.getElementById('arViewer').style.display === 'block') {
                switch (e.key) {
                    case 'Escape':
                        closeARViewer();
                        break;
                    case ' ':
                        e.preventDefault();
                        takeARScreenshot();
                        break;
                    case 'r':
                        toggleARRecording();
                        break;
                }
            }
        });
