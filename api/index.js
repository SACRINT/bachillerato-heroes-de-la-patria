/**
 * Vercel Serverless Function Entry Point
 * Este archivo es el punto de entrada para todas las rutas /api/*
 * Importa y usa la aplicación Express desde app.js
 */

let app;

try {
    console.log('[api/index.js] Iniciando carga de app.js...');
    app = require('./app.js');
    console.log('[api/index.js] ✅ app.js cargado exitosamente');
} catch (error) {
    console.error('[api/index.js] ❌ Error al cargar app.js');
    console.error('[api/index.js] Tipo de error:', error.constructor.name);
    console.error('[api/index.js] Mensaje:', error.message);
    console.error('[api/index.js] En:', error.stack.split('\n')[1]);
    console.error('[api/index.js] Stack completo:', error.stack);

    // Crear una app de fallback en caso de error
    const express = require('express');
    app = express();

    app.get('/api/health', (req, res) => {
        res.status(500).json({
            status: 'error',
            message: 'Main app.js failed to load',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    });

    // Catch-all para debugging
    app.use((req, res) => {
        res.status(404).json({
            status: 'error',
            message: 'App.js failed to load, catch-all route',
            path: req.path,
            timestamp: new Date().toISOString()
        });
    });
}

/**
 * Vercel Serverless Handler
 * Maneja todas las solicitudes HTTP a /api/*
 *
 * Vercel automáticamente pasa req y res a esta función
 */
module.exports = app;
