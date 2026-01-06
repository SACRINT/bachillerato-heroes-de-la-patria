const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const planService = require('../services/personalized-plan.service');
const { debugLog } = require('../utils/debug-logger');

// GET /api/study-plans/current
// Obtiene el plan activo vigente (o el último generado)
router.get('/current', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        // Buscar plan activo más reciente
        // Nota: En una implementación real buscaríamos por fecha actual.
        // Aquí simplificamos buscando el último plan generado.
        const plans = await require('../config/database').executeQuery(
            `SELECT id FROM study_plans WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [studentId]
        );

        if (plans.length > 0) {
            const planDetails = await planService.getPlanDetails(plans[0].id);
            res.json({ success: true, data: planDetails });
        } else {
            res.json({ success: true, data: null, message: 'No hay plan activo' });
        }
    } catch (error) {
        debugLog.error('API_PLANS', 'Error obteniendo plan actual', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/study-plans/generate
// Genera un nuevo plan semanal desde hoy
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const studentId = req.user.id;
        const startDate = new Date(); // Hoy

        const newPlan = await planService.generateWeeklyPlan(studentId, startDate);
        res.status(201).json({ success: true, message: 'Plan generado exitosamente', data: newPlan });
    } catch (error) {
        debugLog.error('API_PLANS', 'Error generando plan', error);
        res.status(500).json({ success: false, error: 'Error al generar plan personalizado' });
    }
});

// GET /api/study-plans/goals
router.get('/goals', authenticateToken, async (req, res) => {
    try {
        const goals = await planService.getActiveGoals(req.user.id);
        res.json({ success: true, data: goals });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/study-plans/goals
router.post('/goals', authenticateToken, async (req, res) => {
    try {
        const { title, targetDate, priority } = req.body;
        if (!title) return res.status(400).json({ success: false, error: 'Título es requerido' });

        const newGoal = await planService.createGoal(req.user.id, title, targetDate, priority);
        res.status(201).json({ success: true, data: newGoal });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/study-plans/:id/adjust
// Ajusta el estado o notas de un plan
router.put('/:id/adjust', authenticateToken, async (req, res) => {
    try {
        const plan = await personalizedPlanService.adjustPlan(req.params.id, req.body);
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/study-plans/:id/share
// Comparte el plan (Genera Token)
router.post('/:id/share', authenticateToken, async (req, res) => {
    try {
        const shareData = await personalizedPlanService.sharePlan(req.params.id);
        res.json({ success: true, data: shareData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

