/**
 * 📅 FULLCALENDAR CHECK - Verificación de carga de FullCalendar
 * Extraído de admin-dashboard.html para cumplir con CSP (No inline scripts)
 * Fecha: 19 Nov 2025
 */

if (typeof FullCalendar === 'undefined') {
    console.warn('⚠️ FullCalendar failed to load from CDN');
} else {
    console.log('✅ FullCalendar loaded successfully');
}
