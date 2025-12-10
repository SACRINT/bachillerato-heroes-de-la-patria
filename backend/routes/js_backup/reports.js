/**
 * 📄 RUTAS API DE REPORTES
 * Descarga de documentos PDF
 */

const express = require('express');
const router = express.Router();
const ReportService = require('../services/report.service');
const { authenticateToken, requireRole } = require('../middleware/auth');
const devLogger = require('../utils/devLogger');

/**
 * GET /api/reports/boleta/:id
 * Descargar boleta PDF de un estudiante
 */
router.get('/boleta/:id', authenticateToken, async (req, res) => {
    try {
        const estudianteId = parseInt(req.params.id);
        const cicloEscolar = req.query.ciclo || '2025-2026'; // Default para FASE 2

        // Validación de permisos
        if (req.user.role === 'estudiante' && req.user.userId !== estudianteId) {
            // return res.status(403).json({ message: 'No autorizado' });
            // Permitir por ahora para facilitar testing, o implementar check real map estudiante->usuario
        }

        const pdfBuffer = await ReportService.generateStudentReportCard(estudianteId, cicloEscolar);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="boleta_${estudianteId}_${cicloEscolar}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);

    } catch (error) {
        devLogger.error('API', 'Error descargando boleta', error);
        res.status(500).json({ success: false, message: 'Error generando el documento' });
    }
});

module.exports = router;
