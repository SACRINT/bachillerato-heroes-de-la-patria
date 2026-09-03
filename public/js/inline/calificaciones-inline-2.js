document.addEventListener('DOMContentLoaded', function () {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;

    if (typeof window.applyUnifiedTheme === 'function') {
        window.applyUnifiedTheme();
        return;
    }

    const body = document.body;
    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof window.setUnifiedTheme === 'function') {
            const isDark = body.classList.contains('dark-mode');
            window.setUnifiedTheme(isDark ? 'light' : 'dark');
            return;
        }

        body.classList.toggle('dark-mode');
        const active = body.classList.contains('dark-mode');
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
