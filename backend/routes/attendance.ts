/**
 * 📊 RUTAS DE ASISTENCIA (ATTENDANCE) - TypeScript
 * Migrado: 07 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

/**
 * GET /api/attendance
 */
router.get('/', (req: Request, res: Response): void => {
    res.json({
        success: true,
        data: []
    });
});

export default router;
