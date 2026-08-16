// Initialize on page load
        document.addEventListener('DOMContentLoaded', () => {
            const library = new DigitalLibraryManager({
                apiBaseURL: '/api/digital-library'
            });
        });
