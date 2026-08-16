/**
 * 🔧 LOAD ADMIN FOOTER - Carga dinámica del footer del dashboard
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

(async function loadAdminFooter() {
    try {
        const response = await fetch('partials/footer.html');
        if (!response.ok) throw new Error('Error al cargar footer');
        const footerHTML = await response.text();
        document.getElementById('main-footer').innerHTML = footerHTML;
    } catch (error) {
        console.error('❌ [ADMIN DASHBOARD] Error cargando footer:', error);
    }
})();
