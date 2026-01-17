const express = require('express');
const router = express.Router();

/**
 * @route GET /api/diploma/preview
 * @desc Genera una imagen SVG dinámica para el diploma
 */
router.get('/preview', (req, res) => {
    const { name, course, date, id } = req.query;

    if (!name || !course) {
        return res.status(400).send('Faltan parámetros (name, course)');
    }

    const svgContent = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <!-- Fondo -->
        <rect width="100%" height="100%" fill="#fcfcfc" />
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#1a237e" stroke-width="5" />
        <rect x="35" y="35" width="730" height="530" fill="none" stroke="#ffd700" stroke-width="2" />

        <!-- Encabezado -->
        <text x="400" y="100" font-family="Georgia, serif" font-size="40" text-anchor="middle" fill="#1a237e">Bachillerato General Estatal</text>
        <text x="400" y="150" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#333">Héroes de la Patria</text>

        <!-- Cuerpo -->
        <text x="400" y="250" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#666">Otorga el presente</text>
        <text x="400" y="300" font-family="Georgia, serif" font-size="60" text-anchor="middle" fill="#000">DIPLOMA</text>
        <text x="400" y="350" font-family="Arial, sans-serif" font-size="20" text-anchor="middle" fill="#666">a</text>
        <text x="400" y="400" font-family="cursive" font-size="48" text-anchor="middle" fill="#1a237e">${name}</text>
        
        <text x="400" y="450" font-family="Arial, sans-serif" font-size="18" text-anchor="middle" fill="#666">Por completar satisfactoriamente el curso:</text>
        <text x="400" y="480" font-family="Arial, sans-serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">${course}</text>

        <!-- Pie -->
        <text x="200" y="550" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#333">Fecha: ${date || new Date().toLocaleDateString()}</text>
        <text x="600" y="550" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#333">ID: ${id || '0000'}</text>
    </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svgContent);
});

module.exports = router;
