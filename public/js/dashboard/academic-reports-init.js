/**
 * 📊 ACADEMIC REPORTS INIT - Inicialización del sistema de reportes académicos
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 * NOTA: Sistema desactivado temporalmente - causaba problemas de layout
 */

// ✅ FUNCIÓN DESACTIVADA TEMPORALMENTE - CAUSABA PROBLEMAS DE LAYOUT
function initAcademicReportsSystem() {
    void 0;
    return false;
}

// Función para agregar botón de acceso rápido
function addAcademicReportsButton() {
    const navbar = document.querySelector('.navbar-nav');
    if (navbar) {
        const reportsButton = document.createElement('li');
        reportsButton.className = 'nav-item dropdown';
        reportsButton.innerHTML = `
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-chart-bar"></i> Reportes
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" data-action="generateAcademicReport"><i class="fas fa-graduation-cap"></i> Reporte de Calificaciones</a></li>
                <li><a class="dropdown-item" href="#" data-action="generateAcademicReport"><i class="fas fa-calendar-check"></i> Reporte de Asistencias</a></li>
                <li><a class="dropdown-item" href="#" data-action="generateAcademicReport"><i class="fas fa-chart-line"></i> Análisis de Rendimiento</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="#" data-action="showReportsManager"><i class="fas fa-cogs"></i> Gestor de Reportes</a></li>
            </ul>
        `;
        navbar.appendChild(reportsButton);
        void 0;
    }
}

// Funciones para generar reportes específicos
function generateAcademicReport(type) {
    if (window.academicReportsManager) {
        void 0;
        window.academicReportsManager.generateReport(type);
    } else {
        alert('⚠️ Sistema de reportes no disponible. Reinicia la página.');
    }
}

function showReportsManager() {
    if (window.academicReportsManager) {
        window.academicReportsManager.showManagerInterface();
    } else {
        alert('⚠️ Sistema de reportes no disponible. Reinicia la página.');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initAcademicReportsSystem();
    }, 2000); // Delay para asegurar que todos los scripts estén cargados
});
