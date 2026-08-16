/**
 * 🌙 DARK MODE SIMPLE - BGE HEROES DE LA PATRIA
 * Toggle de modo oscuro con persistencia localStorage
 * Extraído de inline scripts para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: oferta-educativa, servicios, padres
 */

document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    if (!darkModeToggle) {
        void 0;
        return;
    }

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            updateDarkModeIcon(true);
        } else {
            localStorage.setItem('darkMode', 'disabled');
            updateDarkModeIcon(false);
        }
    });

    function updateDarkModeIcon(isDark) {
        if (darkModeToggle) {
            let icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
});
