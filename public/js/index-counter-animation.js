/**
 * 🎯 INDEX PAGE SCRIPTS - COMPREHENSIVE
 * Counter animation, navbar scroll, smooth scroll, dark mode
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 */

// Counter animation function
function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    const speed = 200; // The lower the slower

    counters.forEach(counter => {
        const updateCount = () => {
            const targetValue = counter.getAttribute('data-target');
            const hasPrefix = targetValue.startsWith('+');
            const targetNumber = parseInt(targetValue.replace(/[^\d]/g, ''));
            const count = +counter.innerText.replace(/[^\d]/g, '') || 0;
            const inc = targetNumber / speed;

            if (count < targetNumber) {
                const newCount = Math.ceil(count + inc);
                counter.innerText = hasPrefix ? '+' + newCount : newCount;
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = hasPrefix ? '+' + targetNumber : targetNumber;
            }
        }
        updateCount();
    });
}

// Intersection Observer for counter animation (optimizado para móvil)
const observerOptions = {
    threshold: 0.1, // Reducido para móvil
    rootMargin: '0px 0px -50px 0px' // Reducido el margen
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Start observing when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Observar específicamente la sección hero completa
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        observer.observe(heroSection);
    }

    // Fallback: activar contadores después de 2 segundos para asegurar que funcionen
    setTimeout(() => {
        const firstCounter = document.querySelector('.counter');
        if (firstCounter && (firstCounter.textContent === '0' || firstCounter.textContent.trim() === '0')) {
            console.log('[INDEX] Activating counters fallback');
            animateCounters();
        }
    }, 2000);

    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Add scroll effect to navbar (if needed)
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    }
});

// Dark mode functionality - CORREGIDO V2
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

if (darkModeToggle) {
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
