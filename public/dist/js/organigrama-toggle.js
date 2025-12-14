/**
 * 👥 ORGANIGRAMA TOGGLE - BGE HEROES DE LA PATRIA
 * Alternar entre vista de cards y vista jerárquica del organigrama
 * Extraído de inline script para CSP compliance
 * Fecha: 18 Nov 2025
 * Usado en: conocenos.html
 */

function toggleOrganigramaView(view) {
    const cardsView = document.getElementById('organigramaCards');
    const jerarquicaView = document.getElementById('organigramaJerarquica');
    const cardsBtn = document.getElementById('vistaCards');
    const jerarquicaBtn = document.getElementById('vistaJerarquica');

    if (view === 'cards') {
        cardsView.style.display = 'block';
        jerarquicaView.style.display = 'none';
        cardsBtn.classList.add('active');
        cardsBtn.classList.remove('btn-outline-primary');
        cardsBtn.classList.add('btn-primary');
        jerarquicaBtn.classList.remove('active');
        jerarquicaBtn.classList.add('btn-outline-primary');
        jerarquicaBtn.classList.remove('btn-primary');
    } else {
        cardsView.style.display = 'none';
        jerarquicaView.style.display = 'block';
        jerarquicaBtn.classList.add('active');
        jerarquicaBtn.classList.remove('btn-outline-primary');
        jerarquicaBtn.classList.add('btn-primary');
        cardsBtn.classList.remove('active');
        cardsBtn.classList.add('btn-outline-primary');
        cardsBtn.classList.remove('btn-primary');
    }
}
