// Dark mode functionality - CORREGIDO V2
        const darkModeToggle = document.getElementById('darkModeToggle');
        const body = document.body;

        if (darkModeToggle && typeof window.setUnifiedTheme !== 'function' && typeof window.applyUnifiedTheme !== 'function') {
            // Limpiar cualquier contenido de texto del botón
            const cleanToggleButton = () => {
                // Remover cualquier nodo de texto
                const textNodes = [...darkModeToggle.childNodes].filter(node => node.nodeType === Node.TEXT_NODE);
                textNodes.forEach(node => node.remove());
            };

            // Check for saved dark mode preference
            if (localStorage.getItem('darkMode') === 'enabled') {
                body.classList.add('dark-mode');
                updateDarkModeIcon(true);
            }

            darkModeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                cleanToggleButton(); // Limpiar antes de cada toggle
                body.classList.toggle('dark-mode');

                if (body.classList.contains('dark-mode')) {
                    localStorage.setItem('darkMode', 'enabled');
                    updateDarkModeIcon(true);
                } else {
                    localStorage.setItem('darkMode', 'disabled');
                    updateDarkModeIcon(false);
                }
            });

            // Limpiar al cargar la página
            cleanToggleButton();
        }

        function updateDarkModeIcon(isDark) {
            if (darkModeToggle) {
                let icon = darkModeToggle.querySelector('i');

                // Si no existe el icono, crearlo
                if (!icon) {
                    icon = document.createElement('i');
                    darkModeToggle.innerHTML = ''; // Limpiar completamente
                    darkModeToggle.appendChild(icon);
                }

                if (isDark) {
                    icon.className = 'fas fa-sun';
                    darkModeToggle.setAttribute('aria-label', 'Activar modo claro');
                } else {
                    icon.className = 'fas fa-moon';
                    darkModeToggle.setAttribute('aria-label', 'Activar modo oscuro');
                }
            }
        }
