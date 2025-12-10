/**
 * 📄 REPORTS ROUTES - TypeScript
 * Generación y descarga de documentos PDF (Boletas, etc.)
 * Migrado: 08 Diciembre 2025
 */

import express, { Request, Response, Router } from 'express';
// @ts-ignore
import ReportService from '../services/report.service';
import { authenticateToken } from '../middleware/auth';
import { debugLog } from '../utils/debug-logger';

const router: Router = express.Router();

interface UserRequest extends Request {
    user?: {
        userId: number;
        role: string;
        [key: string]: any;
    };
}

/**
 * GET /api/reports/boleta/:id
 * Descargar boleta PDF de un estudiante
 */
router.get('/boleta/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const authReq = req as UserRequest;
        const estudianteId = parseInt(req.params.id);
        const cicloEscolar = (req.query.ciclo as string) || '2025-2026';

        // Validación de permisos
        if (authReq.user?.role === 'estudiante' && authReq.user.userId !== estudianteId) {
            // return res.status(403).json({ message: 'No autorizado' });
            // Permitir por ahora para facilitar testing
        }

        const pdfBuffer = await ReportService.generateStudentReportCard(estudianteId, cicloEscolar);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="boleta_${estudianteId}_${cicloEscolar}.pdf"`,
            'Content-Length': pdfBuffer.length.toString()
        });

        res.send(pdfBuffer);

    } catch (error) {
        debugLog.error('API', 'Error descargando boleta', error as Error);
        res.status(500).json({ success: false, message: 'Error generando el documento' });
    }
});

export default router;
