"use strict";
/**
 * 📊 RUTAS DE ASISTENCIA (ATTENDANCE) - TypeScript
 * Migrado: 07 Diciembre 2025
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
/**
 * GET /api/attendance
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});
exports.default = router;
//# sourceMappingURL=attendance.js.map