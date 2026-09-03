/**
 * 🌙 DARK MODE SIMPLE - BGE HEROES DE LA PATRIA
 * Toggle de modo oscuro con persistencia localStorage
 * Extraído de inline scripts para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: oferta-educativa, servicios, padres
 */

document.addEventListener('DOMContentLoaded', function() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle || darkModeToggle.dataset.dmBound) {
        return;
    }
    darkModeToggle.dataset.dmBound = 'true';

    if (typeof window.applyUnifiedTheme === 'function') {
        window.applyUnifiedTheme();
    } else {
        if (localStorage.getItem('darkMode') === 'enabled') {
            document.body.classList.add('dark-mode');
            updateDarkModeIcon(true);
        }
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.setUnifiedTheme === 'function') {
            const isDark = document.body.classList.contains('dark-mode');
            window.setUnifiedTheme(isDark ? 'light' : 'dark');
            return;
        }

        document.body.classList.toggle('dark-mode');
        const active = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', active ? 'enabled' : 'disabled');
        updateDarkModeIcon(active);
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
