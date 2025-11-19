/**
 * 📜 FOOTER SCRIPTS - BGE HEROES DE LA PATRIA
 * Scripts del footer (year update, smooth scroll, hover effects)
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Update current year
    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Smooth scroll for footer links
    const footerLinks = document.querySelectorAll('.footer-link[href^="#"]');
    footerLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Enhanced hover effects
    const footerCards = document.querySelectorAll('.footer-card');
    footerCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});
