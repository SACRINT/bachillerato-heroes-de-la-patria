const express = require('express');
const router = express.Router();

// GET /api/attendance
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: []
    });
});

module.exports = router;
