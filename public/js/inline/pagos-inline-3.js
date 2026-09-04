document.addEventListener('DOMContentLoaded', function () {
    if (typeof window.applyUnifiedTheme === 'function' || typeof window.setUnifiedTheme === 'function') {
        return;
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;

    if (localStorage.getItem('darkMode') === 'enabled') {
        body.classList.add('dark-mode');
        updateDarkModeIcon(true);
    }

    if (darkModeToggle) {
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
    }

    function updateDarkModeIcon(isDark) {
        if (darkModeToggle) {
            let icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
});
