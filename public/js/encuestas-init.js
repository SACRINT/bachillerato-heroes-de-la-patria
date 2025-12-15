// Encuestas Page Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Dark Mode
    const darkMode = new DarkModeManager();

    // Initialize Polls Manager on page load
    const pollsManager = new PollsManager({
        containerId: 'polls-container',
        apiEndpoint: '/api/polls',
        mode: 'public'
    });

    console.log('✅ Sistema de Encuestas inicializado');

    // Mobile Navigation Toggle
    document.querySelector('.nav-toggle')?.addEventListener('click', function () {
        document.querySelector('.nav-menu')?.classList.toggle('active');
    });
});
