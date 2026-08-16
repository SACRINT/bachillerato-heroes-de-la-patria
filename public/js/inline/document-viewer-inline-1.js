// Prototype logic
        document.addEventListener('DOMContentLoaded', () => {
            // Mock load
            const docUrl = '/assets/docs/demo.pdf'; // Placeholder
            document.getElementById('pdf-frame').src = docUrl;
            document.getElementById('doc-title').textContent = "Guía de Estudio: Revolución Mexicana";

            // Simulator for progress (In real app, PDF.js provides events)
            let progress = 0;
            setInterval(() => {
                if (progress < 100) {
                    progress += 1; // Simulate reading
                    document.getElementById('read-progress').style.width = progress + '%';

                    // API Call on 100%
                    if (progress === 100) {
                        console.log('Document completed, syncing...');
                    }
                }
            }, 500);
        });

        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }
