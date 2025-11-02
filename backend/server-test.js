const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

console.log('🌍 Configurando servidor de archivos estáticos (MODO DE PRUEBA)...');

// 1. Rutas específicas para assets en la raíz
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/documents', express.static(path.join(__dirname, '../documents')));
app.use('/videos', express.static(path.join(__dirname, '../videos')));
app.use('/data', express.static(path.join(__dirname, '../data')));
app.use('/partials', express.static(path.join(__dirname, '../partials')));
app.use('/sw-offline-first.js', express.static(path.join(__dirname, '../sw-offline-first.js'), { headers: { 'Content-Type': 'application/javascript' } }));

// 2. Carpeta 'public' para HTMLs y otros assets
app.use(express.static(path.join(__dirname, '../public')));

// Ruta de API de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor de prueba funcionando' });
});

// SPA Fallback
app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor de PRUEBA iniciado en http://localhost:${PORT}`);
});
