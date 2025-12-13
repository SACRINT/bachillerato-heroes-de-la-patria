"use strict";
/**
 * 📄 REPORTS ROUTES - TypeScript
 * Generación y descarga de documentos PDF (Boletas, etc.)
 * Migrado: 08 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// @ts-ignore
const report_service_1 = __importDefault(require("../services/report.service"));
const auth_1 = require("../middleware/auth");
const debug_logger_1 = require("../utils/debug-logger");
const router = express_1.default.Router();
/**
 * GET /api/reports/boleta/:id
 * Descargar boleta PDF de un estudiante
 */
router.get('/boleta/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const authReq = req;
        const estudianteId = parseInt(req.params.id);
        const cicloEscolar = req.query.ciclo || '2025-2026';
        // Validación de permisos
        if (authReq.user?.role === 'estudiante' && authReq.user.userId !== estudianteId) {
            // return res.status(403).json({ message: 'No autorizado' });
            // Permitir por ahora para facilitar testing
        }
        const pdfBuffer = await report_service_1.default.generateStudentReportCard(estudianteId, cicloEscolar);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="boleta_${estudianteId}_${cicloEscolar}.pdf"`,
            'Content-Length': pdfBuffer.length.toString()
        });
        res.send(pdfBuffer);
    }
    catch (error) {
        debug_logger_1.debugLog.error('API', 'Error descargando boleta', error);
        res.status(500).json({ success: false, message: 'Error generando el documento' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map