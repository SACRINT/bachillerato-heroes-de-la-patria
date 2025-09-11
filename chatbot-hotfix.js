// HOTFIX: Cargar chatbot mejorado directamente desde GitHub RAW
// Temporal mientras GitHub Pages actualiza su cache

console.log('🔧 Aplicando hotfix para chatbot...');

// Cargar el chatbot actualizado directamente desde el repositorio
const script = document.createElement('script');
script.src = 'https://raw.githubusercontent.com/SACRINT/heroes_de_la_patria_oficial/main/js/chatbot.js';
script.onload = function() {
    console.log('✅ Chatbot mejorado cargado via hotfix');
};
script.onerror = function() {
    console.log('❌ Error cargando hotfix, usando versión local');
};
document.head.appendChild(script);