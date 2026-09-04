/**
 * 🌙 DARK MODE TOGGLE - Alternador de modo oscuro para dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Si main.js ya gestiona el tema de forma unificada, delegar completamente
    if (typeof window.setUnifiedTheme === 'function' || typeof window.applyUnifiedTheme === 'function') {
        return;
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

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
