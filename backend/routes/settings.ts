/**
 * ⚙️ SETTINGS ROUTES - TypeScript
 * Gestión de configuraciones de usuario (Preferencias, UI, Notificaciones)
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
// import { authenticateToken } from '../middleware/auth'; // TODO: Enable when ready for production

const router: Router = express.Router();

interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: 'es' | 'en';
}

/**
 * GET /api/settings
 * Obtiene la configuración global (o del usuario autenticado en el futuro)
 */
router.get('/', (req: Request, res: Response) => {
    // Mock data por ahora, igual que en la versión JS original
    const settings: UserSettings = {
        theme: 'light',
        notifications: true,
        language: 'es'
    };

    res.json({
        success: true,
        data: settings
    });
});

/**
 * PUT /api/settings
 * Actualiza la configuración (Placeholder para implementación futura)
 */
/* 
router.put('/', authenticateToken, async (req: Request, res: Response) => {
    try {
        // Implementar lógica de actualización en BD
        res.json({ success: true, message: 'Configuración actualizada' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error actualizando configuración' });
    }
});
*/

export default router;
